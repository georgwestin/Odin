package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/betting/repository"
	"github.com/odin-platform/odin/internal/kafka"
	"github.com/odin-platform/odin/internal/models"
)

const (
	// Odds drift tolerance: reject if odds changed more than 5%.
	maxOddsDrift = 0.05

	// Default player daily stake limit.
	defaultDailyStakeLimit  = 10000.0
	defaultWeeklyStakeLimit = 50000.0
)

// WalletTransferRequest is the payload sent to the Wallet Service.
type WalletTransferRequest struct {
	PlayerID       string `json:"player_id"`
	Amount         string `json:"amount"`
	Currency       string `json:"currency"`
	Type           string `json:"type"`
	ReferenceID    string `json:"reference_id"`
	ReferenceType  string `json:"reference_type"`
	IdempotencyKey string `json:"idempotency_key"`
	Description    string `json:"description"`
}

// WalletTransferResponse from the Wallet Service.
type WalletTransferResponse struct {
	WalletID     string `json:"wallet_id"`
	BalanceAfter string `json:"balance_after"`
}

// PlaceBetRequest is the input for placing a bet.
type PlaceBetRequest struct {
	Stake      string             `json:"stake"`
	Currency   string             `json:"currency"`
	BetType    string             `json:"bet_type"`
	Selections []SelectionRequest `json:"selections"`
}

// SelectionRequest represents a single selection in a bet request.
type SelectionRequest struct {
	EventID   string `json:"event_id"`
	MarketID  string `json:"market_id"`
	OutcomeID string `json:"outcome_id"`
	Odds      string `json:"odds"`
}

// CachedSelection is the shape stored in Redis by the Sports Feed service.
type CachedSelection struct {
	EventID   string `json:"event_id"`
	MarketID  string `json:"market_id"`
	OutcomeID string `json:"outcome_id"`
	Odds      string `json:"odds"`
	Status    string `json:"status"`
}

// BetPlacedEvent is published to Kafka on successful bet placement.
type BetPlacedEvent struct {
	BetID    string `json:"bet_id"`
	PlayerID string `json:"player_id"`
	BrandID  string `json:"brand_id"`
	Stake    string `json:"stake"`
	Currency string `json:"currency"`
	BetType  string `json:"bet_type"`
}

// BetSettledEvent is published to Kafka after bet settlement.
type BetSettledEvent struct {
	BetID    string `json:"bet_id"`
	PlayerID string `json:"player_id"`
	Status   string `json:"status"`
	Payout   string `json:"payout"`
}

// EventResultedMessage is the Kafka message from event.resulted topic.
type EventResultedMessage struct {
	EventID  string           `json:"event_id"`
	Results  []SelectionResult `json:"results"`
}

// SelectionResult describes the outcome of a single selection in an event.
type SelectionResult struct {
	MarketID  string `json:"market_id"`
	OutcomeID string `json:"outcome_id"`
	Result    string `json:"result"` // "won", "lost", "void"
}

type Service struct {
	repo       *repository.Repository
	rdb        *redis.Client
	producer   *kafka.Producer
	walletURL  string
	httpClient *http.Client
	logger     *zap.Logger
}

func New(
	repo *repository.Repository,
	rdb *redis.Client,
	producer *kafka.Producer,
	walletURL string,
	logger *zap.Logger,
) *Service {
	return &Service{
		repo:      repo,
		rdb:       rdb,
		producer:  producer,
		walletURL: walletURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger: logger,
	}
}

// PlaceBet validates and places a bet. Full flow:
// 1. Validate all selections exist in Sports Feed Redis cache
// 2. Check odds haven't changed >5% since client fetched them
// 3. Check player stake limits (daily/weekly)
// 4. Call Wallet Service /wallet/transfer/debit with idempotency_key = bet UUID
// 5. Insert bet + bet_selections in single transaction
// 6. Publish bet.placed to Kafka
// 7. Return bet confirmation
func (s *Service) PlaceBet(ctx context.Context, playerID, brandID uuid.UUID, req PlaceBetRequest) (*models.Bet, error) {
	// Validate bet type.
	switch req.BetType {
	case "single":
		if len(req.Selections) != 1 {
			return nil, fmt.Errorf("single bet must have exactly 1 selection")
		}
	case "accumulator":
		if len(req.Selections) < 2 {
			return nil, fmt.Errorf("accumulator bet must have at least 2 selections")
		}
	case "system":
		if len(req.Selections) < 3 {
			return nil, fmt.Errorf("system bet must have at least 3 selections")
		}
	default:
		return nil, fmt.Errorf("invalid bet type: %s", req.BetType)
	}

	stake, err := strconv.ParseFloat(string(req.Stake), 64)
	if err != nil || stake <= 0 {
		return nil, fmt.Errorf("invalid stake amount")
	}

	// Step 1 & 2: Validate selections against Redis cache and check odds drift.
	combinedOdds := 1.0
	for _, sel := range req.Selections {
		cacheKey := fmt.Sprintf("selection:%s:%s:%s", sel.EventID, sel.MarketID, sel.OutcomeID)
		data, err := s.rdb.Get(ctx, cacheKey).Result()
		if err == redis.Nil {
			return nil, fmt.Errorf("selection %s/%s/%s not found or market closed", sel.EventID, sel.MarketID, sel.OutcomeID)
		}
		if err != nil {
			return nil, fmt.Errorf("redis lookup failed for selection: %w", err)
		}

		var cached CachedSelection
		if err := json.Unmarshal([]byte(data), &cached); err != nil {
			return nil, fmt.Errorf("unmarshal cached selection: %w", err)
		}

		if cached.Status != "active" {
			return nil, fmt.Errorf("selection %s/%s/%s is suspended", sel.EventID, sel.MarketID, sel.OutcomeID)
		}

		// Check odds drift.
		clientOdds, err := strconv.ParseFloat(sel.Odds, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid client odds: %s", sel.Odds)
		}
		currentOdds, err := strconv.ParseFloat(cached.Odds, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid cached odds: %s", cached.Odds)
		}

		drift := math.Abs(clientOdds-currentOdds) / currentOdds
		if drift > maxOddsDrift {
			return nil, fmt.Errorf("odds changed for selection %s/%s/%s: was %s, now %s",
				sel.EventID, sel.MarketID, sel.OutcomeID, sel.Odds, cached.Odds)
		}

		combinedOdds *= currentOdds
	}

	// Step 3: Check player stake limits.
	dailyTotal, err := s.repo.GetPlayerStakeTotal(ctx, playerID, time.Now().UTC().Truncate(24*time.Hour))
	if err != nil {
		return nil, fmt.Errorf("check daily stakes: %w", err)
	}
	dailyTotalFloat, _ := strconv.ParseFloat(string(dailyTotal), 64)
	if dailyTotalFloat+stake > defaultDailyStakeLimit {
		return nil, fmt.Errorf("daily stake limit exceeded")
	}

	weekStart := time.Now().UTC().Truncate(24 * time.Hour)
	for weekStart.Weekday() != time.Monday {
		weekStart = weekStart.AddDate(0, 0, -1)
	}
	weeklyTotal, err := s.repo.GetPlayerStakeTotal(ctx, playerID, weekStart)
	if err != nil {
		return nil, fmt.Errorf("check weekly stakes: %w", err)
	}
	weeklyTotalFloat, _ := strconv.ParseFloat(string(weeklyTotal), 64)
	if weeklyTotalFloat+stake > defaultWeeklyStakeLimit {
		return nil, fmt.Errorf("weekly stake limit exceeded")
	}

	// Create the bet object.
	betID := uuid.New()
	now := time.Now().UTC()
	potentialPayout := stake * combinedOdds

	bet := &models.Bet{
		ID:        betID,
		PlayerID:  playerID,
		BrandID:   brandID,
		Stake:     models.Decimal(req.Stake),
		Currency:  req.Currency,
		Payout:    models.Decimal(fmt.Sprintf("%.2f", potentialPayout)),
		Status:    models.BetStatusPending,
		BetType:   req.BetType,
		CreatedAt: now,
		UpdatedAt: now,
	}

	for _, sel := range req.Selections {
		bet.Selections = append(bet.Selections, models.BetSelection{
			ID:        uuid.New(),
			BetID:     betID,
			EventID:   sel.EventID,
			MarketID:  sel.MarketID,
			OutcomeID: sel.OutcomeID,
			Odds:      models.Decimal(sel.Odds),
			Status:    models.BetStatusPending,
			Result:    "",
			CreatedAt: now,
		})
	}

	// Step 4: Debit wallet.
	walletResp, err := s.walletTransfer(ctx, WalletTransferRequest{
		PlayerID:       playerID.String(),
		Amount:         req.Stake,
		Currency:       req.Currency,
		Type:           "debit",
		ReferenceID:    betID.String(),
		ReferenceType:  "bet",
		IdempotencyKey: betID.String(),
		Description:    fmt.Sprintf("Bet placement %s", betID),
	})
	if err != nil {
		return nil, fmt.Errorf("wallet debit failed: %w", err)
	}

	walletID, err := uuid.Parse(walletResp.WalletID)
	if err != nil {
		return nil, fmt.Errorf("invalid wallet id from wallet service: %w", err)
	}
	bet.WalletID = walletID

	// Step 5: Persist bet and selections.
	if err := s.repo.CreateBet(ctx, bet); err != nil {
		s.logger.Error("failed to persist bet after wallet debit",
			zap.String("bet_id", betID.String()),
			zap.Error(err),
		)
		return nil, fmt.Errorf("persist bet: %w", err)
	}

	// Step 6: Publish bet.placed event.
	evt := BetPlacedEvent{
		BetID:    betID.String(),
		PlayerID: playerID.String(),
		BrandID:  brandID.String(),
		Stake:    req.Stake,
		Currency: req.Currency,
		BetType:  req.BetType,
	}
	if err := s.producer.Publish(ctx, "bet.placed", betID.String(), evt); err != nil {
		s.logger.Error("failed to publish bet.placed event",
			zap.String("bet_id", betID.String()),
			zap.Error(err),
		)
	}

	return bet, nil
}

// GetBet retrieves a single bet by ID, scoped to the player.
func (s *Service) GetBet(ctx context.Context, betID, playerID uuid.UUID) (*models.Bet, error) {
	bet, err := s.repo.FindByID(ctx, betID)
	if err != nil {
		return nil, fmt.Errorf("find bet: %w", err)
	}
	if bet == nil {
		return nil, nil
	}
	if bet.PlayerID != playerID {
		return nil, nil
	}
	return bet, nil
}

// ListBets returns paginated bets for a player.
func (s *Service) ListBets(ctx context.Context, playerID uuid.UUID, limit, offset int) ([]models.Bet, int, error) {
	return s.repo.FindByPlayer(ctx, playerID, limit, offset)
}

// Cashout processes an early cashout for a bet.
func (s *Service) Cashout(ctx context.Context, betID, playerID uuid.UUID) (*models.Bet, error) {
	bet, err := s.repo.FindByID(ctx, betID)
	if err != nil {
		return nil, fmt.Errorf("find bet: %w", err)
	}
	if bet == nil {
		return nil, fmt.Errorf("bet not found")
	}
	if bet.PlayerID != playerID {
		return nil, fmt.Errorf("bet not found")
	}
	if bet.Status != models.BetStatusPending {
		return nil, fmt.Errorf("bet is not eligible for cashout (status: %s)", bet.Status)
	}

	// Calculate cashout value based on remaining live selections' current odds.
	cashoutValue, err := s.calculateCashout(ctx, bet)
	if err != nil {
		return nil, fmt.Errorf("calculate cashout: %w", err)
	}

	if cashoutValue <= 0 {
		return nil, fmt.Errorf("cashout not available for this bet")
	}

	cashoutStr := fmt.Sprintf("%.2f", cashoutValue)

	// Credit wallet with cashout value.
	idempotencyKey := fmt.Sprintf("cashout-%s", betID)
	_, err = s.walletTransfer(ctx, WalletTransferRequest{
		PlayerID:       playerID.String(),
		Amount:         cashoutStr,
		Currency:       bet.Currency,
		Type:           "credit",
		ReferenceID:    betID.String(),
		ReferenceType:  "cashout",
		IdempotencyKey: idempotencyKey,
		Description:    fmt.Sprintf("Cashout for bet %s", betID),
	})
	if err != nil {
		return nil, fmt.Errorf("wallet credit for cashout failed: %w", err)
	}

	if err := s.repo.UpdateBetStatus(ctx, betID, models.BetStatusCashedOut, models.Decimal(cashoutStr)); err != nil {
		return nil, fmt.Errorf("update bet status: %w", err)
	}

	bet.Status = models.BetStatusCashedOut
	bet.Payout = models.Decimal(cashoutStr)

	// Publish settlement event for cashout.
	evt := BetSettledEvent{
		BetID:    betID.String(),
		PlayerID: playerID.String(),
		Status:   models.BetStatusCashedOut,
		Payout:   cashoutStr,
	}
	if err := s.producer.Publish(ctx, "bet.settled", betID.String(), evt); err != nil {
		s.logger.Error("failed to publish cashout event",
			zap.String("bet_id", betID.String()),
			zap.Error(err),
		)
	}

	return bet, nil
}

// SettleEvent processes event results. Called by the Kafka consumer or internal endpoint.
// 1. Fetch all pending bets containing selections for that event
// 2. Update selection statuses (won/lost/void)
// 3. For accumulators: check if all selections resolved
// 4. For winning bets: calculate winnings, call Wallet /wallet/transfer/credit
// 5. Update bet status, publish bet.settled to Kafka
func (s *Service) SettleEvent(ctx context.Context, msg EventResultedMessage) error {
	bets, err := s.repo.FindPendingByEvent(ctx, msg.EventID)
	if err != nil {
		return fmt.Errorf("find pending bets: %w", err)
	}

	s.logger.Info("settling event",
		zap.String("event_id", msg.EventID),
		zap.Int("bet_count", len(bets)),
	)

	resultMap := make(map[string]SelectionResult)
	for _, r := range msg.Results {
		key := fmt.Sprintf("%s:%s", r.MarketID, r.OutcomeID)
		resultMap[key] = r
	}

	for _, bet := range bets {
		if err := s.settleBet(ctx, &bet, msg.EventID, resultMap); err != nil {
			s.logger.Error("failed to settle bet",
				zap.String("bet_id", bet.ID.String()),
				zap.Error(err),
			)
			continue
		}
	}

	return nil
}

func (s *Service) settleBet(ctx context.Context, bet *models.Bet, eventID string, resultMap map[string]SelectionResult) error {
	// Update selection statuses for this event.
	for i, sel := range bet.Selections {
		if sel.EventID != eventID {
			continue
		}
		key := fmt.Sprintf("%s:%s", sel.MarketID, sel.OutcomeID)
		result, ok := resultMap[key]
		if !ok {
			continue
		}

		newStatus := result.Result // "won", "lost", "void"
		if err := s.repo.UpdateSelectionStatus(ctx, sel.ID, newStatus, newStatus); err != nil {
			return fmt.Errorf("update selection %s: %w", sel.ID, err)
		}
		bet.Selections[i].Status = newStatus
		bet.Selections[i].Result = newStatus
	}

	// Check if all selections are resolved.
	allResolved := true
	hasLoss := false
	allVoid := true
	combinedOdds := 1.0

	for _, sel := range bet.Selections {
		switch sel.Status {
		case models.BetStatusPending:
			allResolved = false
		case "lost":
			hasLoss = true
			allVoid = false
		case "won":
			allVoid = false
			odds, _ := strconv.ParseFloat(string(sel.Odds), 64)
			combinedOdds *= odds
		case "void":
			// Void selections are excluded from combined odds (treated as odds 1.0).
		}
	}

	if !allResolved {
		return nil // Wait for remaining events.
	}

	stake, _ := strconv.ParseFloat(string(bet.Stake), 64)
	var finalStatus string
	var payout float64

	if allVoid {
		// All selections void: refund stake.
		finalStatus = models.BetStatusVoided
		payout = stake
	} else if hasLoss {
		// Any loss means bet is lost.
		finalStatus = models.BetStatusSettled
		payout = 0
	} else {
		// All non-void selections won.
		finalStatus = models.BetStatusSettled
		payout = stake * combinedOdds
	}

	payoutStr := fmt.Sprintf("%.2f", payout)

	// Credit wallet for winning or voided bets.
	if payout > 0 {
		idempotencyKey := fmt.Sprintf("settle-%s", bet.ID)
		_, err := s.walletTransfer(ctx, WalletTransferRequest{
			PlayerID:       bet.PlayerID.String(),
			Amount:         payoutStr,
			Currency:       bet.Currency,
			Type:           "credit",
			ReferenceID:    bet.ID.String(),
			ReferenceType:  "win",
			IdempotencyKey: idempotencyKey,
			Description:    fmt.Sprintf("Bet settlement %s", bet.ID),
		})
		if err != nil {
			return fmt.Errorf("wallet credit for bet %s: %w", bet.ID, err)
		}
	}

	if err := s.repo.SettleBet(ctx, bet.ID, finalStatus, models.Decimal(payoutStr)); err != nil {
		return fmt.Errorf("settle bet %s: %w", bet.ID, err)
	}

	// Publish bet.settled event.
	evt := BetSettledEvent{
		BetID:    bet.ID.String(),
		PlayerID: bet.PlayerID.String(),
		Status:   finalStatus,
		Payout:   payoutStr,
	}
	if err := s.producer.Publish(ctx, "bet.settled", bet.ID.String(), evt); err != nil {
		s.logger.Error("failed to publish bet.settled event",
			zap.String("bet_id", bet.ID.String()),
			zap.Error(err),
		)
	}

	return nil
}

func (s *Service) calculateCashout(ctx context.Context, bet *models.Bet) (float64, error) {
	stake, _ := strconv.ParseFloat(string(bet.Stake), 64)
	liveFactor := 1.0

	for _, sel := range bet.Selections {
		if sel.Status == "won" {
			odds, _ := strconv.ParseFloat(string(sel.Odds), 64)
			liveFactor *= odds
			continue
		}
		if sel.Status != models.BetStatusPending {
			// If any selection already lost, no cashout.
			return 0, nil
		}

		// For pending selections, fetch current live odds from Redis.
		cacheKey := fmt.Sprintf("selection:%s:%s:%s", sel.EventID, sel.MarketID, sel.OutcomeID)
		data, err := s.rdb.Get(ctx, cacheKey).Result()
		if err != nil {
			return 0, fmt.Errorf("get live odds: %w", err)
		}

		var cached CachedSelection
		if err := json.Unmarshal([]byte(data), &cached); err != nil {
			return 0, fmt.Errorf("unmarshal cached selection: %w", err)
		}

		currentOdds, _ := strconv.ParseFloat(cached.Odds, 64)
		if currentOdds <= 0 {
			return 0, nil
		}
		liveFactor *= currentOdds
	}

	// Apply a margin (e.g., 5% reduction) for the house edge on cashout.
	cashoutValue := stake * liveFactor * 0.95
	return cashoutValue, nil
}

func (s *Service) walletTransfer(ctx context.Context, req WalletTransferRequest) (*WalletTransferResponse, error) {
	endpoint := fmt.Sprintf("%s/wallet/transfer/%s", s.walletURL, req.Type)

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal wallet request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create wallet request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Idempotency-Key", req.IdempotencyKey)

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("call wallet service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		var errResp struct {
			Error string `json:"error"`
		}
		json.NewDecoder(resp.Body).Decode(&errResp)
		return nil, fmt.Errorf("wallet service error (%d): %s", resp.StatusCode, errResp.Error)
	}

	var walletResp WalletTransferResponse
	if err := json.NewDecoder(resp.Body).Decode(&walletResp); err != nil {
		return nil, fmt.Errorf("decode wallet response: %w", err)
	}

	return &walletResp, nil
}
