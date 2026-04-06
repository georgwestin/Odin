package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/odin-platform/odin/internal/models"
)

// Repository handles all PostgreSQL operations for the wallet service.
type Repository struct {
	pool *pgxpool.Pool
}

// New creates a new wallet repository.
func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// CreateWallet inserts a new wallet row.
func (r *Repository) CreateWallet(ctx context.Context, w *models.Wallet) error {
	query := `
		INSERT INTO wallets (id, player_id, brand_id, currency, balance, bonus_balance, locked_balance, version, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := r.pool.Exec(ctx, query,
		w.ID, w.PlayerID, w.BrandID, w.Currency,
		w.Balance, w.BonusBalance, w.LockedBalance,
		w.Version, w.CreatedAt, w.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert wallet: %w", err)
	}
	return nil
}

// GetWalletByPlayerID returns the wallet for a player within a brand, using SELECT FOR UPDATE
// when called within a transaction.
func (r *Repository) GetWalletByPlayerID(ctx context.Context, playerID, brandID uuid.UUID) (*models.Wallet, error) {
	query := `
		SELECT id, player_id, brand_id, currency, balance, bonus_balance, locked_balance, version, created_at, updated_at
		FROM wallets
		WHERE player_id = $1 AND brand_id = $2`

	w := &models.Wallet{}
	err := r.pool.QueryRow(ctx, query, playerID, brandID).Scan(
		&w.ID, &w.PlayerID, &w.BrandID, &w.Currency,
		&w.Balance, &w.BonusBalance, &w.LockedBalance,
		&w.Version, &w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get wallet by player: %w", err)
	}
	return w, nil
}

// GetWalletForUpdate acquires a row-level lock on the wallet within a transaction.
func (r *Repository) GetWalletForUpdate(ctx context.Context, tx pgx.Tx, walletID uuid.UUID) (*models.Wallet, error) {
	query := `
		SELECT id, player_id, brand_id, currency, balance, bonus_balance, locked_balance, version, created_at, updated_at
		FROM wallets
		WHERE id = $1
		FOR UPDATE`

	w := &models.Wallet{}
	err := tx.QueryRow(ctx, query, walletID).Scan(
		&w.ID, &w.PlayerID, &w.BrandID, &w.Currency,
		&w.Balance, &w.BonusBalance, &w.LockedBalance,
		&w.Version, &w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get wallet for update: %w", err)
	}
	return w, nil
}

// UpdateWalletBalance updates the wallet balance and increments the version.
func (r *Repository) UpdateWalletBalance(ctx context.Context, tx pgx.Tx, walletID uuid.UUID, newBalance models.Decimal, currentVersion int64) error {
	query := `
		UPDATE wallets
		SET balance = $1, version = version + 1, updated_at = $2
		WHERE id = $3 AND version = $4`

	tag, err := tx.Exec(ctx, query, newBalance, time.Now().UTC(), walletID, currentVersion)
	if err != nil {
		return fmt.Errorf("update wallet balance: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("optimistic lock conflict: wallet version changed")
	}
	return nil
}

// CheckIdempotencyKey returns the existing ledger entry if the key has been seen before.
func (r *Repository) CheckIdempotencyKey(ctx context.Context, tx pgx.Tx, key string) (*models.LedgerEntry, error) {
	query := `
		SELECT id, wallet_id, player_id, brand_id, transaction_type, amount,
			balance_before, balance_after, currency,
			base_amount, base_currency, player_amount, player_currency,
			report_amount, report_currency,
			COALESCE(bet_amount, 0), COALESCE(bet_currency, ''),
			COALESCE(exchange_rate_info, ''),
			reference_id, reference_type,
			idempotency_key, description, created_at
		FROM ledger_entries
		WHERE idempotency_key = $1`

	e := &models.LedgerEntry{}
	err := tx.QueryRow(ctx, query, key).Scan(
		&e.ID, &e.WalletID, &e.PlayerID, &e.BrandID,
		&e.TransactionType, &e.Amount, &e.BalanceBefore, &e.BalanceAfter,
		&e.Currency,
		&e.BaseAmount, &e.BaseCurrency, &e.PlayerAmount, &e.PlayerCurrency,
		&e.ReportAmount, &e.ReportCurrency,
		&e.BetAmount, &e.BetCurrency,
		&e.ExchangeRateInfo,
		&e.ReferenceID, &e.ReferenceType,
		&e.IdempotencyKey, &e.Description, &e.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("check idempotency key: %w", err)
	}
	return e, nil
}

// InsertLedgerEntry appends a new entry to the immutable ledger.
func (r *Repository) InsertLedgerEntry(ctx context.Context, tx pgx.Tx, e *models.LedgerEntry) error {
	query := `
		INSERT INTO ledger_entries (id, wallet_id, player_id, brand_id, transaction_type, amount,
			balance_before, balance_after, currency,
			base_amount, base_currency, player_amount, player_currency,
			report_amount, report_currency, bet_amount, bet_currency,
			exchange_rate_info,
			reference_id, reference_type,
			idempotency_key, description, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
			NULLIF($16, '0'), NULLIF($17, ''),
			NULLIF($18, ''),
			$19, $20, $21, $22, $23)`

	_, err := tx.Exec(ctx, query,
		e.ID, e.WalletID, e.PlayerID, e.BrandID,
		e.TransactionType, e.Amount, e.BalanceBefore, e.BalanceAfter,
		e.Currency,
		e.BaseAmount, e.BaseCurrency, e.PlayerAmount, e.PlayerCurrency,
		e.ReportAmount, e.ReportCurrency,
		string(e.BetAmount), string(e.BetCurrency),
		e.ExchangeRateInfo,
		e.ReferenceID, e.ReferenceType,
		e.IdempotencyKey, e.Description, e.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert ledger entry: %w", err)
	}
	return nil
}

// ListTransactions returns ledger entries for a wallet with cursor-based pagination.
// The cursor is the created_at timestamp + id of the last item seen.
func (r *Repository) ListTransactions(ctx context.Context, walletID uuid.UUID, cursor *TransactionCursor, limit int) ([]models.LedgerEntry, error) {
	var rows pgx.Rows
	var err error

	if cursor != nil {
		query := `
			SELECT id, wallet_id, player_id, brand_id, transaction_type, amount,
				balance_before, balance_after, currency,
				base_amount, base_currency, player_amount, player_currency,
				report_amount, report_currency,
				COALESCE(bet_amount, 0), COALESCE(bet_currency, ''),
				COALESCE(exchange_rate_info, ''),
				reference_id, reference_type,
				idempotency_key, description, created_at
			FROM ledger_entries
			WHERE wallet_id = $1
			  AND (created_at, id) < ($2, $3)
			ORDER BY created_at DESC, id DESC
			LIMIT $4`
		rows, err = r.pool.Query(ctx, query, walletID, cursor.CreatedAt, cursor.ID, limit)
	} else {
		query := `
			SELECT id, wallet_id, player_id, brand_id, transaction_type, amount,
				balance_before, balance_after, currency,
				base_amount, base_currency, player_amount, player_currency,
				report_amount, report_currency,
				COALESCE(bet_amount, 0), COALESCE(bet_currency, ''),
				COALESCE(exchange_rate_info, ''),
				reference_id, reference_type,
				idempotency_key, description, created_at
			FROM ledger_entries
			WHERE wallet_id = $1
			ORDER BY created_at DESC, id DESC
			LIMIT $2`
		rows, err = r.pool.Query(ctx, query, walletID, limit)
	}
	if err != nil {
		return nil, fmt.Errorf("list transactions: %w", err)
	}
	defer rows.Close()

	var entries []models.LedgerEntry
	for rows.Next() {
		var e models.LedgerEntry
		if err := rows.Scan(
			&e.ID, &e.WalletID, &e.PlayerID, &e.BrandID,
			&e.TransactionType, &e.Amount, &e.BalanceBefore, &e.BalanceAfter,
			&e.Currency,
			&e.BaseAmount, &e.BaseCurrency, &e.PlayerAmount, &e.PlayerCurrency,
			&e.ReportAmount, &e.ReportCurrency,
			&e.BetAmount, &e.BetCurrency,
			&e.ExchangeRateInfo,
			&e.ReferenceID, &e.ReferenceType,
			&e.IdempotencyKey, &e.Description, &e.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan ledger entry: %w", err)
		}
		entries = append(entries, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate ledger entries: %w", err)
	}

	return entries, nil
}

// TransactionCursor holds the position for cursor-based pagination.
type TransactionCursor struct {
	CreatedAt time.Time
	ID        uuid.UUID
}

// GetDepositSum returns the total deposit amount for a player within a time window.
func (r *Repository) GetDepositSum(ctx context.Context, walletID uuid.UUID, since time.Time) (models.Decimal, error) {
	query := `
		SELECT COALESCE(SUM(amount::numeric), 0)::text
		FROM ledger_entries
		WHERE wallet_id = $1
		  AND transaction_type = 'deposit'
		  AND created_at >= $2`

	var sum string
	err := r.pool.QueryRow(ctx, query, walletID, since).Scan(&sum)
	if err != nil {
		return "0", fmt.Errorf("get deposit sum: %w", err)
	}
	return models.Decimal(sum), nil
}

// GetPlayerKYCStatus returns the KYC status for a player.
func (r *Repository) GetPlayerKYCStatus(ctx context.Context, playerID uuid.UUID) (models.KYCStatus, error) {
	query := `SELECT kyc_status FROM players WHERE id = $1`
	var status models.KYCStatus
	err := r.pool.QueryRow(ctx, query, playerID).Scan(&status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", fmt.Errorf("player not found")
		}
		return "", fmt.Errorf("get kyc status: %w", err)
	}
	return status, nil
}

// BeginTx starts a new database transaction.
func (r *Repository) BeginTx(ctx context.Context) (pgx.Tx, error) {
	return r.pool.Begin(ctx)
}
