package service

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/wallet/repository"
	"github.com/odin-platform/odin/internal/currency"
	"github.com/odin-platform/odin/internal/httperr"
	"github.com/odin-platform/odin/internal/kafka"
	"github.com/odin-platform/odin/internal/models"
)

const (
	// AML threshold in EUR: withdrawals at or above this trigger a review.
	amlThresholdEUR = "2000"

	// Default deposit limits.
	dailyDepositLimit   = "10000"
	weeklyDepositLimit  = "50000"
	monthlyDepositLimit = "100000"

	defaultPageSize = 20
	maxPageSize     = 100
)

// Service contains the business logic for the wallet service.
type Service struct {
	repo              *repository.Repository
	kafkaProducer     *kafka.Producer
	currencyConverter *currency.Converter
	logger            *zap.Logger
}

// New creates a new wallet service.
func New(repo *repository.Repository, kafkaProducer *kafka.Producer, logger *zap.Logger) *Service {
	return &Service{
		repo:              repo,
		kafkaProducer:     kafkaProducer,
		currencyConverter: currency.NewConverter(),
		logger:            logger,
	}
}

// CreateWallet creates a new wallet for a player.
func (s *Service) CreateWallet(ctx context.Context, playerID, brandID uuid.UUID, currency string) (*models.Wallet, error) {
	// Check if wallet already exists.
	existing, err := s.repo.GetWalletByPlayerID(ctx, playerID, brandID)
	if err != nil {
		return nil, fmt.Errorf("check existing wallet: %w", err)
	}
	if existing != nil {
		return existing, nil // Idempotent.
	}

	now := time.Now().UTC()
	wallet := &models.Wallet{
		ID:            uuid.New(),
		PlayerID:      playerID,
		BrandID:       brandID,
		Currency:      currency,
		Balance:       "0",
		BonusBalance:  "0",
		LockedBalance: "0",
		Version:       1,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.repo.CreateWallet(ctx, wallet); err != nil {
		return nil, fmt.Errorf("create wallet: %w", err)
	}
	return wallet, nil
}

// GetBalance returns the current balance for a player's wallet.
func (s *Service) GetBalance(ctx context.Context, playerID, brandID uuid.UUID) (*models.Wallet, error) {
	wallet, err := s.repo.GetWalletByPlayerID(ctx, playerID, brandID)
	if err != nil {
		return nil, fmt.Errorf("get wallet: %w", err)
	}
	if wallet == nil {
		return nil, httperr.ErrNotFound
	}
	return wallet, nil
}

// TransactionListRequest holds pagination parameters.
type TransactionListRequest struct {
	PlayerID uuid.UUID
	BrandID  uuid.UUID
	Cursor   *repository.TransactionCursor
	Limit    int
}

// TransactionListResult holds a page of transactions with cursor info.
type TransactionListResult struct {
	Transactions []models.LedgerEntry `json:"transactions"`
	NextCursor   string               `json:"next_cursor,omitempty"`
	HasMore      bool                 `json:"has_more"`
}

// ListTransactions returns paginated transactions for a player's wallet.
func (s *Service) ListTransactions(ctx context.Context, req *TransactionListRequest) (*TransactionListResult, error) {
	wallet, err := s.repo.GetWalletByPlayerID(ctx, req.PlayerID, req.BrandID)
	if err != nil {
		return nil, fmt.Errorf("get wallet: %w", err)
	}
	if wallet == nil {
		return nil, httperr.ErrNotFound
	}

	limit := req.Limit
	if limit <= 0 {
		limit = defaultPageSize
	}
	if limit > maxPageSize {
		limit = maxPageSize
	}

	// Fetch one extra to determine if there are more results.
	entries, err := s.repo.ListTransactions(ctx, wallet.ID, req.Cursor, limit+1)
	if err != nil {
		return nil, fmt.Errorf("list transactions: %w", err)
	}

	hasMore := len(entries) > limit
	if hasMore {
		entries = entries[:limit]
	}

	var nextCursor string
	if hasMore && len(entries) > 0 {
		last := entries[len(entries)-1]
		nextCursor = fmt.Sprintf("%s_%s", last.CreatedAt.Format(time.RFC3339Nano), last.ID.String())
	}

	return &TransactionListResult{
		Transactions: entries,
		NextCursor:   nextCursor,
		HasMore:      hasMore,
	}, nil
}

// MutationRequest represents a balance-changing operation.
type MutationRequest struct {
	PlayerID       uuid.UUID
	BrandID        uuid.UUID
	Amount         string // Positive decimal string in the source currency.
	Type           string // deposit, withdrawal, bet, win, bonus, etc.
	ReferenceID    string
	ReferenceType  string
	IdempotencyKey string
	Description    string
	// Multi-currency fields
	SourceCurrency    string // Currency of the Amount field (defaults to wallet currency).
	BetCurrency       string // Currency the bet was placed in (empty for non-bet transactions).
	BrandCurrencyConf *currency.BrandCurrencyConfig // Brand's base & reporting currencies.
	PlayerCurrency    string // Player's chosen currency.
}

// MutationResult is returned after a successful balance mutation.
type MutationResult struct {
	Entry         *models.LedgerEntry `json:"entry"`
	BalanceAfter  models.Decimal      `json:"balance_after"`
	AMLFlagged    bool                `json:"aml_flagged,omitempty"`
}

// Deposit adds funds to a player's wallet with daily/weekly/monthly limit checks.
func (s *Service) Deposit(ctx context.Context, req *MutationRequest) (*MutationResult, error) {
	if req.IdempotencyKey == "" {
		return nil, httperr.ErrInvalidInput
	}

	wallet, err := s.repo.GetWalletByPlayerID(ctx, req.PlayerID, req.BrandID)
	if err != nil {
		return nil, fmt.Errorf("get wallet: %w", err)
	}
	if wallet == nil {
		return nil, httperr.ErrNotFound
	}

	// Check deposit limits.
	now := time.Now().UTC()

	dailySum, err := s.repo.GetDepositSum(ctx, wallet.ID, now.Truncate(24*time.Hour))
	if err != nil {
		return nil, fmt.Errorf("get daily deposit sum: %w", err)
	}
	if err := checkLimit(string(dailySum), req.Amount, dailyDepositLimit); err != nil {
		return nil, fmt.Errorf("daily limit: %w", err)
	}

	// Weekly: start of current ISO week (Monday).
	weekStart := now.AddDate(0, 0, -int(now.Weekday()-time.Monday))
	if now.Weekday() == time.Sunday {
		weekStart = now.AddDate(0, 0, -6)
	}
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, time.UTC)
	weeklySum, err := s.repo.GetDepositSum(ctx, wallet.ID, weekStart)
	if err != nil {
		return nil, fmt.Errorf("get weekly deposit sum: %w", err)
	}
	if err := checkLimit(string(weeklySum), req.Amount, weeklyDepositLimit); err != nil {
		return nil, fmt.Errorf("weekly limit: %w", err)
	}

	// Monthly: start of current month.
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	monthlySum, err := s.repo.GetDepositSum(ctx, wallet.ID, monthStart)
	if err != nil {
		return nil, fmt.Errorf("get monthly deposit sum: %w", err)
	}
	if err := checkLimit(string(monthlySum), req.Amount, monthlyDepositLimit); err != nil {
		return nil, fmt.Errorf("monthly limit: %w", err)
	}

	req.Type = models.TxTypeDeposit
	return s.executeMutation(ctx, wallet, req, true)
}

// Withdraw removes funds from a player's wallet. Requires KYC approval.
func (s *Service) Withdraw(ctx context.Context, req *MutationRequest) (*MutationResult, error) {
	if req.IdempotencyKey == "" {
		return nil, httperr.ErrInvalidInput
	}

	// KYC check.
	kycStatus, err := s.repo.GetPlayerKYCStatus(ctx, req.PlayerID)
	if err != nil {
		return nil, fmt.Errorf("check kyc: %w", err)
	}
	if kycStatus != models.KYCApproved {
		return nil, httperr.ErrForbidden
	}

	wallet, err := s.repo.GetWalletByPlayerID(ctx, req.PlayerID, req.BrandID)
	if err != nil {
		return nil, fmt.Errorf("get wallet: %w", err)
	}
	if wallet == nil {
		return nil, httperr.ErrNotFound
	}

	req.Type = models.TxTypeWithdrawal
	result, err := s.executeMutation(ctx, wallet, req, false)
	if err != nil {
		return nil, err
	}

	// AML threshold check: flag withdrawals >= EUR 2000.
	amt := new(big.Float)
	amt.SetString(req.Amount)
	threshold := new(big.Float)
	threshold.SetString(amlThresholdEUR)
	if amt.Cmp(threshold) >= 0 {
		result.AMLFlagged = true
		s.logger.Warn("AML threshold exceeded",
			zap.String("player_id", req.PlayerID.String()),
			zap.String("amount", req.Amount),
			zap.String("wallet_id", wallet.ID.String()),
		)
	}

	return result, nil
}

// Debit removes funds (used internally for bets, etc.).
func (s *Service) Debit(ctx context.Context, req *MutationRequest) (*MutationResult, error) {
	if req.IdempotencyKey == "" {
		return nil, httperr.ErrInvalidInput
	}

	wallet, err := s.repo.GetWalletByPlayerID(ctx, req.PlayerID, req.BrandID)
	if err != nil {
		return nil, fmt.Errorf("get wallet: %w", err)
	}
	if wallet == nil {
		return nil, httperr.ErrNotFound
	}

	return s.executeMutation(ctx, wallet, req, false)
}

// Credit adds funds (used internally for wins, bonuses, etc.).
func (s *Service) Credit(ctx context.Context, req *MutationRequest) (*MutationResult, error) {
	if req.IdempotencyKey == "" {
		return nil, httperr.ErrInvalidInput
	}

	wallet, err := s.repo.GetWalletByPlayerID(ctx, req.PlayerID, req.BrandID)
	if err != nil {
		return nil, fmt.Errorf("get wallet: %w", err)
	}
	if wallet == nil {
		return nil, httperr.ErrNotFound
	}

	return s.executeMutation(ctx, wallet, req, true)
}

// executeMutation performs the actual balance mutation inside a transaction.
// isCredit=true adds funds, isCredit=false removes funds.
func (s *Service) executeMutation(ctx context.Context, wallet *models.Wallet, req *MutationRequest, isCredit bool) (*MutationResult, error) {
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Check idempotency key.
	existing, err := s.repo.CheckIdempotencyKey(ctx, tx, req.IdempotencyKey)
	if err != nil {
		return nil, fmt.Errorf("check idempotency: %w", err)
	}
	if existing != nil {
		// Return the previously created entry (idempotent).
		return &MutationResult{
			Entry:        existing,
			BalanceAfter: existing.BalanceAfter,
		}, nil
	}

	// Lock the wallet row.
	lockedWallet, err := s.repo.GetWalletForUpdate(ctx, tx, wallet.ID)
	if err != nil {
		return nil, fmt.Errorf("lock wallet: %w", err)
	}
	if lockedWallet == nil {
		return nil, httperr.ErrNotFound
	}

	// Calculate new balance.
	currentBalance := new(big.Float)
	currentBalance.SetString(string(lockedWallet.Balance))

	amount := new(big.Float)
	if _, ok := amount.SetString(req.Amount); !ok {
		return nil, httperr.ErrInvalidInput
	}

	// Ensure amount is positive.
	if amount.Sign() <= 0 {
		return nil, httperr.ErrInvalidInput
	}

	var newBalance *big.Float
	if isCredit {
		newBalance = new(big.Float).Add(currentBalance, amount)
	} else {
		newBalance = new(big.Float).Sub(currentBalance, amount)
		// Check for sufficient funds.
		if newBalance.Sign() < 0 {
			return nil, httperr.ErrLimitExceeded
		}
	}

	newBalanceStr := models.Decimal(newBalance.Text('f', 2))

	// Update wallet balance.
	if err := s.repo.UpdateWalletBalance(ctx, tx, lockedWallet.ID, newBalanceStr, lockedWallet.Version); err != nil {
		return nil, fmt.Errorf("update balance: %w", err)
	}

	// Build multi-currency amounts.
	now := time.Now().UTC()
	sourceCurrency := req.SourceCurrency
	if sourceCurrency == "" {
		sourceCurrency = lockedWallet.Currency
	}
	playerCurr := req.PlayerCurrency
	if playerCurr == "" {
		playerCurr = lockedWallet.Currency
	}

	var baseAmt, playerAmt, reportAmt, betAmt string
	var baseCurr, reportCurr, betCurr string

	if req.BrandCurrencyConf != nil {
		baseCurr = req.BrandCurrencyConf.BaseCurrency
		reportCurr = req.BrandCurrencyConf.ReportingCurrency

		ma, convErr := s.currencyConverter.BuildMultiAmount(
			req.Amount, sourceCurrency,
			*req.BrandCurrencyConf, playerCurr, req.BetCurrency,
		)
		if convErr != nil {
			s.logger.Warn("currency conversion failed, using source amount for all",
				zap.Error(convErr), zap.String("source_currency", sourceCurrency))
			baseAmt = req.Amount
			playerAmt = req.Amount
			reportAmt = req.Amount
		} else {
			baseAmt = ma.BaseAmount
			playerAmt = ma.PlayerAmount
			reportAmt = ma.ReportAmount
			betAmt = ma.BetAmount
			betCurr = ma.BetCurrency
		}
	} else {
		baseCurr = lockedWallet.Currency
		reportCurr = lockedWallet.Currency
		baseAmt = req.Amount
		playerAmt = req.Amount
		reportAmt = req.Amount
	}

	exchangeInfo, _ := json.Marshal(map[string]string{
		"source_currency": sourceCurrency,
		"source_amount":   req.Amount,
		"timestamp":       now.Format(time.RFC3339),
	})

	// Insert ledger entry.
	entry := &models.LedgerEntry{
		ID:               uuid.New(),
		WalletID:         lockedWallet.ID,
		PlayerID:         req.PlayerID,
		BrandID:          req.BrandID,
		TransactionType:  req.Type,
		Amount:           models.Decimal(req.Amount),
		BalanceBefore:    lockedWallet.Balance,
		BalanceAfter:     newBalanceStr,
		Currency:         lockedWallet.Currency,
		BaseAmount:       models.Decimal(baseAmt),
		BaseCurrency:     baseCurr,
		PlayerAmount:     models.Decimal(playerAmt),
		PlayerCurrency:   playerCurr,
		ReportAmount:     models.Decimal(reportAmt),
		ReportCurrency:   reportCurr,
		BetAmount:        models.Decimal(betAmt),
		BetCurrency:      betCurr,
		ExchangeRateInfo: string(exchangeInfo),
		ReferenceID:      req.ReferenceID,
		ReferenceType:    req.ReferenceType,
		IdempotencyKey:   req.IdempotencyKey,
		Description:      req.Description,
		CreatedAt:        now,
	}

	if err := s.repo.InsertLedgerEntry(ctx, tx, entry); err != nil {
		return nil, fmt.Errorf("insert ledger: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	// Publish wallet.transaction event (best-effort).
	event := map[string]interface{}{
		"entry_id":         entry.ID.String(),
		"player_id":       req.PlayerID.String(),
		"brand_id":        req.BrandID.String(),
		"wallet_id":       lockedWallet.ID.String(),
		"type":            req.Type,
		"amount":          req.Amount,
		"balance":         string(newBalanceStr),
		"currency":        lockedWallet.Currency,
		"base_amount":     baseAmt,
		"base_currency":   baseCurr,
		"player_amount":   playerAmt,
		"player_currency": playerCurr,
		"report_amount":   reportAmt,
		"report_currency": reportCurr,
		"bet_amount":      betAmt,
		"bet_currency":    betCurr,
		"created_at":      now.Format(time.RFC3339),
	}
	if err := s.kafkaProducer.Publish(ctx, kafka.TopicWalletTransaction, req.PlayerID.String(), event); err != nil {
		s.logger.Error("failed to publish wallet.transaction event",
			zap.String("entry_id", entry.ID.String()),
			zap.Error(err),
		)
	}

	return &MutationResult{
		Entry:        entry,
		BalanceAfter: newBalanceStr,
	}, nil
}

// checkLimit verifies that currentSum + newAmount does not exceed the limit.
func checkLimit(currentSum, newAmount, limit string) error {
	current := new(big.Float)
	current.SetString(currentSum)

	add := new(big.Float)
	add.SetString(newAmount)

	lim := new(big.Float)
	lim.SetString(limit)

	total := new(big.Float).Add(current, add)
	if total.Cmp(lim) > 0 {
		return httperr.ErrLimitExceeded
	}
	return nil
}
