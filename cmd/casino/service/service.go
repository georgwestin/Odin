package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/casino/provider"
	"github.com/odin-platform/odin/cmd/casino/repository"
	"github.com/odin-platform/odin/internal/models"
)

// CreateSessionRequest is the input for creating a game session.
type CreateSessionRequest struct {
	GameID    string `json:"game_id"`
	Provider  string `json:"provider"`
	Currency  string `json:"currency"`
	Language  string `json:"language"`
	ReturnURL string `json:"return_url"`
}

// CreateSessionResponse is returned after creating a game session.
type CreateSessionResponse struct {
	SessionID string `json:"session_id"`
	LaunchURL string `json:"launch_url"`
	Token     string `json:"token"`
}

// WalletTransferRequest is the payload for wallet operations.
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

type Service struct {
	repo       *repository.Repository
	registry   *provider.Registry
	walletURL  string
	httpClient *http.Client
	logger     *zap.Logger
}

func New(
	repo *repository.Repository,
	registry *provider.Registry,
	walletURL string,
	logger *zap.Logger,
) *Service {
	return &Service{
		repo:     repo,
		registry: registry,
		walletURL: walletURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger: logger,
	}
}

// ListGames returns casino games with optional provider and category filters.
func (s *Service) ListGames(ctx context.Context, providerFilter, categoryFilter string, limit, offset int) ([]repository.Game, int, error) {
	return s.repo.ListGames(ctx, providerFilter, categoryFilter, limit, offset)
}

// CreateSession creates a new game session and returns the launch URL.
func (s *Service) CreateSession(ctx context.Context, playerID, brandID uuid.UUID, ipAddress string, req CreateSessionRequest) (*CreateSessionResponse, error) {
	// Validate provider exists.
	prov, ok := s.registry.Get(req.Provider)
	if !ok {
		return nil, fmt.Errorf("unknown provider: %s", req.Provider)
	}

	// Generate unique session token.
	sessionID := uuid.New()
	sessionToken := uuid.New().String()

	// Create session with provider to get launch URL.
	result, err := prov.LaunchGame(ctx, provider.LaunchParams{
		GameID:       req.GameID,
		PlayerID:     playerID.String(),
		SessionToken: sessionToken,
		Currency:     req.Currency,
		Language:     req.Language,
		ReturnURL:    req.ReturnURL,
	})
	if err != nil {
		return nil, fmt.Errorf("launch game with provider %s: %w", req.Provider, err)
	}

	// Persist the session.
	session := &models.GameSession{
		ID:           sessionID,
		PlayerID:     playerID,
		BrandID:      brandID,
		GameID:       req.GameID,
		ProviderID:   req.Provider,
		Currency:     req.Currency,
		SessionToken: sessionToken,
		IPAddress:    ipAddress,
		StartedAt:    time.Now().UTC(),
	}

	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, fmt.Errorf("persist session: %w", err)
	}

	s.logger.Info("game session created",
		zap.String("session_id", sessionID.String()),
		zap.String("player_id", playerID.String()),
		zap.String("game_id", req.GameID),
		zap.String("provider", req.Provider),
	)

	return &CreateSessionResponse{
		SessionID: sessionID.String(),
		LaunchURL: result.LaunchURL,
		Token:     sessionToken,
	}, nil
}

// EndSession terminates an active game session.
func (s *Service) EndSession(ctx context.Context, sessionID, playerID uuid.UUID) error {
	session, err := s.repo.FindSessionByID(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("find session: %w", err)
	}
	if session == nil {
		return fmt.Errorf("session not found")
	}
	if session.PlayerID != playerID {
		return fmt.Errorf("session not found")
	}
	if session.EndedAt != nil {
		return fmt.Errorf("session already ended")
	}

	if err := s.repo.EndSession(ctx, sessionID); err != nil {
		return fmt.Errorf("end session: %w", err)
	}

	s.logger.Info("game session ended",
		zap.String("session_id", sessionID.String()),
		zap.String("player_id", playerID.String()),
	)

	return nil
}

// ProcessDebit handles a debit (wager) callback from the RGS.
// It validates the session, creates/updates the round, and debits the wallet.
func (s *Service) ProcessDebit(ctx context.Context, providerName string, req provider.DebitRequest) (*provider.CallbackResponse, error) {
	// Find active session by token.
	session, err := s.repo.FindActiveSession(ctx, req.SessionToken)
	if err != nil {
		return nil, fmt.Errorf("find session: %w", err)
	}
	if session == nil {
		return nil, fmt.Errorf("invalid or expired session")
	}

	// Find or create the round.
	round, err := s.repo.FindRoundByRef(ctx, session.ID, req.RoundRef)
	if err != nil {
		return nil, fmt.Errorf("find round: %w", err)
	}

	if round == nil {
		round = &models.GameRound{
			ID:         uuid.New(),
			SessionID:  session.ID,
			PlayerID:   session.PlayerID,
			BrandID:    session.BrandID,
			GameID:     session.GameID,
			ProviderID: providerName,
			RoundRef:   req.RoundRef,
			TotalBet:   "0",
			TotalWin:   "0",
			Currency:   session.Currency,
			Status:     "open",
			StartedAt:  time.Now().UTC(),
		}
		if err := s.repo.CreateRound(ctx, round); err != nil {
			return nil, fmt.Errorf("create round: %w", err)
		}
	}

	// Use round_ref + transaction_id as idempotency key for wallet debit.
	idempotencyKey := fmt.Sprintf("casino-debit-%s-%s", req.RoundRef, req.TransactionID)

	walletResp, err := s.walletTransfer(ctx, WalletTransferRequest{
		PlayerID:       session.PlayerID.String(),
		Amount:         req.Amount,
		Currency:       session.Currency,
		Type:           "debit",
		ReferenceID:    round.ID.String(),
		ReferenceType:  "casino_bet",
		IdempotencyKey: idempotencyKey,
		Description:    fmt.Sprintf("Casino debit game=%s round=%s", req.GameID, req.RoundRef),
	})
	if err != nil {
		return nil, fmt.Errorf("wallet debit: %w", err)
	}

	// Update round totals.
	if err := s.repo.UpdateRoundDebit(ctx, round.ID, models.Decimal(req.Amount)); err != nil {
		s.logger.Error("failed to update round debit",
			zap.String("round_id", round.ID.String()),
			zap.Error(err),
		)
	}

	return &provider.CallbackResponse{
		Balance:  walletResp.BalanceAfter,
		Currency: session.Currency,
	}, nil
}

// ProcessCredit handles a credit (win) callback from the RGS.
func (s *Service) ProcessCredit(ctx context.Context, providerName string, req provider.CreditRequest) (*provider.CallbackResponse, error) {
	// Find active session by token.
	session, err := s.repo.FindActiveSession(ctx, req.SessionToken)
	if err != nil {
		return nil, fmt.Errorf("find session: %w", err)
	}
	if session == nil {
		return nil, fmt.Errorf("invalid or expired session")
	}

	// Find the round.
	round, err := s.repo.FindRoundByRef(ctx, session.ID, req.RoundRef)
	if err != nil {
		return nil, fmt.Errorf("find round: %w", err)
	}
	if round == nil {
		return nil, fmt.Errorf("round %s not found for session %s", req.RoundRef, session.ID)
	}

	// Use round_ref + transaction_id as idempotency key for wallet credit.
	idempotencyKey := fmt.Sprintf("casino-credit-%s-%s", req.RoundRef, req.TransactionID)

	walletResp, err := s.walletTransfer(ctx, WalletTransferRequest{
		PlayerID:       session.PlayerID.String(),
		Amount:         req.Amount,
		Currency:       session.Currency,
		Type:           "credit",
		ReferenceID:    round.ID.String(),
		ReferenceType:  "casino_win",
		IdempotencyKey: idempotencyKey,
		Description:    fmt.Sprintf("Casino credit game=%s round=%s", req.GameID, req.RoundRef),
	})
	if err != nil {
		return nil, fmt.Errorf("wallet credit: %w", err)
	}

	// Update round totals and optionally close round.
	if err := s.repo.UpdateRoundCredit(ctx, round.ID, models.Decimal(req.Amount), req.IsRoundEnd); err != nil {
		s.logger.Error("failed to update round credit",
			zap.String("round_id", round.ID.String()),
			zap.Error(err),
		)
	}

	return &provider.CallbackResponse{
		Balance:  walletResp.BalanceAfter,
		Currency: session.Currency,
	}, nil
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
