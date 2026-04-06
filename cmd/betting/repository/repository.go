package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/odin-platform/odin/internal/models"
)

type Repository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// CreateBet inserts a bet and its selections in a single transaction.
func (r *Repository) CreateBet(ctx context.Context, bet *models.Bet) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO bets (id, player_id, brand_id, wallet_id, stake, currency, payout, status, bet_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		bet.ID, bet.PlayerID, bet.BrandID, bet.WalletID,
		bet.Stake, bet.Currency, bet.Payout, bet.Status, bet.BetType,
		bet.CreatedAt, bet.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert bet: %w", err)
	}

	for _, sel := range bet.Selections {
		_, err = tx.Exec(ctx, `
			INSERT INTO bet_selections (id, bet_id, event_id, market_id, outcome_id, odds, status, result, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			sel.ID, sel.BetID, sel.EventID, sel.MarketID, sel.OutcomeID,
			sel.Odds, sel.Status, sel.Result, sel.CreatedAt,
		)
		if err != nil {
			return fmt.Errorf("insert bet selection: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}
	return nil
}

// FindByID retrieves a bet with its selections.
func (r *Repository) FindByID(ctx context.Context, betID uuid.UUID) (*models.Bet, error) {
	bet := &models.Bet{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, player_id, brand_id, wallet_id, stake, currency, payout, status, bet_type,
			   settled_at, created_at, updated_at
		FROM bets WHERE id = $1`, betID,
	).Scan(
		&bet.ID, &bet.PlayerID, &bet.BrandID, &bet.WalletID,
		&bet.Stake, &bet.Currency, &bet.Payout, &bet.Status, &bet.BetType,
		&bet.SettledAt, &bet.CreatedAt, &bet.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("query bet by id: %w", err)
	}

	selections, err := r.findSelectionsByBetID(ctx, betID)
	if err != nil {
		return nil, err
	}
	bet.Selections = selections
	return bet, nil
}

// FindByPlayer returns paginated bets for a player.
func (r *Repository) FindByPlayer(ctx context.Context, playerID uuid.UUID, limit, offset int) ([]models.Bet, int, error) {
	var total int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM bets WHERE player_id = $1`, playerID,
	).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count player bets: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, player_id, brand_id, wallet_id, stake, currency, payout, status, bet_type,
			   settled_at, created_at, updated_at
		FROM bets WHERE player_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`, playerID, limit, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("query player bets: %w", err)
	}
	defer rows.Close()

	var bets []models.Bet
	for rows.Next() {
		var b models.Bet
		if err := rows.Scan(
			&b.ID, &b.PlayerID, &b.BrandID, &b.WalletID,
			&b.Stake, &b.Currency, &b.Payout, &b.Status, &b.BetType,
			&b.SettledAt, &b.CreatedAt, &b.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan bet row: %w", err)
		}
		bets = append(bets, b)
	}

	// Load selections for each bet.
	for i := range bets {
		sels, err := r.findSelectionsByBetID(ctx, bets[i].ID)
		if err != nil {
			return nil, 0, err
		}
		bets[i].Selections = sels
	}

	return bets, total, nil
}

// FindPendingByEvent finds all pending bets that contain a selection for the given event.
func (r *Repository) FindPendingByEvent(ctx context.Context, eventID string) ([]models.Bet, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT DISTINCT b.id, b.player_id, b.brand_id, b.wallet_id, b.stake, b.currency,
			   b.payout, b.status, b.bet_type, b.settled_at, b.created_at, b.updated_at
		FROM bets b
		JOIN bet_selections bs ON bs.bet_id = b.id
		WHERE bs.event_id = $1 AND b.status = $2`,
		eventID, models.BetStatusPending,
	)
	if err != nil {
		return nil, fmt.Errorf("query pending bets by event: %w", err)
	}
	defer rows.Close()

	var bets []models.Bet
	for rows.Next() {
		var b models.Bet
		if err := rows.Scan(
			&b.ID, &b.PlayerID, &b.BrandID, &b.WalletID,
			&b.Stake, &b.Currency, &b.Payout, &b.Status, &b.BetType,
			&b.SettledAt, &b.CreatedAt, &b.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan pending bet: %w", err)
		}
		bets = append(bets, b)
	}

	for i := range bets {
		sels, err := r.findSelectionsByBetID(ctx, bets[i].ID)
		if err != nil {
			return nil, err
		}
		bets[i].Selections = sels
	}

	return bets, nil
}

// UpdateSelectionStatus updates the status and result of a bet selection.
func (r *Repository) UpdateSelectionStatus(ctx context.Context, selectionID uuid.UUID, status, result string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE bet_selections SET status = $1, result = $2 WHERE id = $3`,
		status, result, selectionID,
	)
	if err != nil {
		return fmt.Errorf("update selection status: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("selection %s not found", selectionID)
	}
	return nil
}

// SettleBet updates the bet status, payout, and settled_at timestamp.
func (r *Repository) SettleBet(ctx context.Context, betID uuid.UUID, status string, payout models.Decimal) error {
	now := time.Now().UTC()
	tag, err := r.pool.Exec(ctx, `
		UPDATE bets SET status = $1, payout = $2, settled_at = $3, updated_at = $4
		WHERE id = $5`,
		status, payout, now, now, betID,
	)
	if err != nil {
		return fmt.Errorf("settle bet: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("bet %s not found", betID)
	}
	return nil
}

// UpdateBetStatus sets the bet status and updated_at timestamp.
func (r *Repository) UpdateBetStatus(ctx context.Context, betID uuid.UUID, status string, payout models.Decimal) error {
	now := time.Now().UTC()
	tag, err := r.pool.Exec(ctx, `
		UPDATE bets SET status = $1, payout = $2, updated_at = $3 WHERE id = $4`,
		status, payout, now, betID,
	)
	if err != nil {
		return fmt.Errorf("update bet status: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("bet %s not found", betID)
	}
	return nil
}

// GetPlayerStakeTotal returns the total stakes for a player in a given time range.
func (r *Repository) GetPlayerStakeTotal(ctx context.Context, playerID uuid.UUID, since time.Time) (models.Decimal, error) {
	var total *string
	err := r.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(stake::numeric), 0)::text FROM bets
		WHERE player_id = $1 AND created_at >= $2`,
		playerID, since,
	).Scan(&total)
	if err != nil {
		return "0", fmt.Errorf("get player stake total: %w", err)
	}
	if total == nil {
		return "0", nil
	}
	return models.Decimal(*total), nil
}

func (r *Repository) findSelectionsByBetID(ctx context.Context, betID uuid.UUID) ([]models.BetSelection, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, bet_id, event_id, market_id, outcome_id, odds, status, result, created_at
		FROM bet_selections WHERE bet_id = $1
		ORDER BY created_at`, betID,
	)
	if err != nil {
		return nil, fmt.Errorf("query selections for bet %s: %w", betID, err)
	}
	defer rows.Close()

	var sels []models.BetSelection
	for rows.Next() {
		var s models.BetSelection
		if err := rows.Scan(
			&s.ID, &s.BetID, &s.EventID, &s.MarketID, &s.OutcomeID,
			&s.Odds, &s.Status, &s.Result, &s.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan selection: %w", err)
		}
		sels = append(sels, s)
	}
	return sels, nil
}
