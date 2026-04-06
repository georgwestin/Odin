package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/odin-platform/odin/internal/db"
	"github.com/odin-platform/odin/internal/models"
)

// Repository handles CRUD operations for bonuses and player limits.
type Repository struct {
	db *db.DB
}

// New creates a new bonus repository.
func New(database *db.DB) *Repository {
	return &Repository{db: database}
}

// ----- Bonus operations -----

// ListBonusesByPlayer returns all bonuses for a player, optionally filtered by brand.
func (r *Repository) ListBonusesByPlayer(ctx context.Context, playerID, brandID uuid.UUID) ([]models.Bonus, error) {
	rows, err := r.db.Pool.Query(ctx, `
		SELECT id, player_id, brand_id, campaign_id, type, code, amount, currency,
		       wager_requirement, wager_progress, wager_target,
		       status, expires_at, claimed_at, completed_at, created_at, updated_at
		FROM bonuses
		WHERE player_id = $1 AND brand_id = $2
		ORDER BY created_at DESC
	`, playerID, brandID)
	if err != nil {
		return nil, fmt.Errorf("list bonuses: %w", err)
	}
	defer rows.Close()

	var bonuses []models.Bonus
	for rows.Next() {
		b, err := scanBonus(rows)
		if err != nil {
			return nil, err
		}
		bonuses = append(bonuses, b)
	}

	return bonuses, nil
}

// GetBonusByID retrieves a single bonus.
func (r *Repository) GetBonusByID(ctx context.Context, bonusID uuid.UUID) (*models.Bonus, error) {
	rows, err := r.db.Pool.Query(ctx, `
		SELECT id, player_id, brand_id, campaign_id, type, code, amount, currency,
		       wager_requirement, wager_progress, wager_target,
		       status, expires_at, claimed_at, completed_at, created_at, updated_at
		FROM bonuses
		WHERE id = $1
	`, bonusID)
	if err != nil {
		return nil, fmt.Errorf("get bonus: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, nil
	}

	b, err := scanBonus(rows)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// ClaimBonus marks a bonus as active with the claimed timestamp.
func (r *Repository) ClaimBonus(ctx context.Context, bonusID, playerID uuid.UUID) error {
	now := time.Now().UTC()
	tag, err := r.db.Pool.Exec(ctx, `
		UPDATE bonuses
		SET status = 'active', claimed_at = $1, updated_at = $1
		WHERE id = $2 AND player_id = $3 AND status = 'pending'
	`, now, bonusID, playerID)
	if err != nil {
		return fmt.Errorf("claim bonus: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("bonus not found or already claimed")
	}
	return nil
}

// UpdateWagerProgress adds the given stake amount to the bonus wagering progress.
func (r *Repository) UpdateWagerProgress(ctx context.Context, bonusID uuid.UUID, stakeAmount string) error {
	now := time.Now().UTC()
	_, err := r.db.Pool.Exec(ctx, `
		UPDATE bonuses
		SET wager_progress = (CAST(wager_progress AS NUMERIC) + CAST($1 AS NUMERIC))::TEXT,
		    updated_at = $2
		WHERE id = $3 AND status = 'active'
	`, stakeAmount, now, bonusID)
	if err != nil {
		return fmt.Errorf("update wager progress: %w", err)
	}
	return nil
}

// CompleteBonus marks a bonus as completed.
func (r *Repository) CompleteBonus(ctx context.Context, bonusID uuid.UUID) error {
	now := time.Now().UTC()
	_, err := r.db.Pool.Exec(ctx, `
		UPDATE bonuses
		SET status = 'completed', completed_at = $1, updated_at = $1
		WHERE id = $2 AND status = 'active'
	`, now, bonusID)
	if err != nil {
		return fmt.Errorf("complete bonus: %w", err)
	}
	return nil
}

// GetActiveBonusesByPlayer returns all active bonuses for a player.
func (r *Repository) GetActiveBonusesByPlayer(ctx context.Context, playerID uuid.UUID) ([]models.Bonus, error) {
	rows, err := r.db.Pool.Query(ctx, `
		SELECT id, player_id, brand_id, campaign_id, type, code, amount, currency,
		       wager_requirement, wager_progress, wager_target,
		       status, expires_at, claimed_at, completed_at, created_at, updated_at
		FROM bonuses
		WHERE player_id = $1 AND status = 'active'
		ORDER BY created_at DESC
	`, playerID)
	if err != nil {
		return nil, fmt.Errorf("get active bonuses: %w", err)
	}
	defer rows.Close()

	var bonuses []models.Bonus
	for rows.Next() {
		b, err := scanBonus(rows)
		if err != nil {
			return nil, err
		}
		bonuses = append(bonuses, b)
	}

	return bonuses, nil
}

// scanBonus scans a single bonus row.
func scanBonus(rows pgx.Rows) (models.Bonus, error) {
	var b models.Bonus
	if err := rows.Scan(
		&b.ID, &b.PlayerID, &b.BrandID, &b.CampaignID, &b.Type, &b.Code,
		&b.Amount, &b.Currency,
		&b.WagerRequirement, &b.WagerProgress, &b.WagerTarget,
		&b.Status, &b.ExpiresAt, &b.ClaimedAt, &b.CompletedAt, &b.CreatedAt, &b.UpdatedAt,
	); err != nil {
		return models.Bonus{}, fmt.Errorf("scan bonus: %w", err)
	}
	return b, nil
}

// ----- Limit operations -----

// GetLimits returns all active limits for a player on a brand.
func (r *Repository) GetLimits(ctx context.Context, playerID, brandID uuid.UUID) ([]models.PlayerLimit, error) {
	rows, err := r.db.Pool.Query(ctx, `
		SELECT id, player_id, brand_id, limit_type, period, amount,
		       pending_amount, pending_at, is_active, created_at, updated_at
		FROM player_limits
		WHERE player_id = $1 AND brand_id = $2 AND is_active = true
		ORDER BY limit_type, period
	`, playerID, brandID)
	if err != nil {
		return nil, fmt.Errorf("get limits: %w", err)
	}
	defer rows.Close()

	var limits []models.PlayerLimit
	for rows.Next() {
		var l models.PlayerLimit
		if err := rows.Scan(
			&l.ID, &l.PlayerID, &l.BrandID, &l.LimitType, &l.Period, &l.Amount,
			&l.PendingAmount, &l.PendingAt, &l.IsActive, &l.CreatedAt, &l.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan limit: %w", err)
		}
		limits = append(limits, l)
	}

	return limits, nil
}

// UpsertLimit creates or updates a player limit. For increases, sets the pending
// fields so the change takes effect after a 24-hour cooling period. For reductions,
// the new amount is applied immediately.
func (r *Repository) UpsertLimit(ctx context.Context, limit models.PlayerLimit) error {
	now := time.Now().UTC()
	_, err := r.db.Pool.Exec(ctx, `
		INSERT INTO player_limits (id, player_id, brand_id, limit_type, period, amount,
		                           pending_amount, pending_at, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $9)
		ON CONFLICT (player_id, brand_id, limit_type, period)
		DO UPDATE SET
			amount = EXCLUDED.amount,
			pending_amount = EXCLUDED.pending_amount,
			pending_at = EXCLUDED.pending_at,
			updated_at = $9
	`, limit.ID, limit.PlayerID, limit.BrandID, limit.LimitType, limit.Period,
		limit.Amount, limit.PendingAmount, limit.PendingAt, now)
	if err != nil {
		return fmt.Errorf("upsert limit: %w", err)
	}
	return nil
}

// ActivatePendingLimits applies limit increases that have passed their 24-hour cooling period.
func (r *Repository) ActivatePendingLimits(ctx context.Context) (int64, error) {
	now := time.Now().UTC()
	tag, err := r.db.Pool.Exec(ctx, `
		UPDATE player_limits
		SET amount = pending_amount,
		    pending_amount = NULL,
		    pending_at = NULL,
		    updated_at = $1
		WHERE pending_amount IS NOT NULL
		  AND pending_at IS NOT NULL
		  AND pending_at <= $1
	`, now)
	if err != nil {
		return 0, fmt.Errorf("activate pending limits: %w", err)
	}
	return tag.RowsAffected(), nil
}

// ----- Self-exclusion operations -----

// IsSelfExcluded checks if a player is self-excluded on a brand.
func (r *Repository) IsSelfExcluded(ctx context.Context, playerID, brandID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.Pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM self_exclusions WHERE player_id = $1 AND brand_id = $2
		)
	`, playerID, brandID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check self-exclusion: %w", err)
	}
	return exists, nil
}

// CreateSelfExclusion permanently self-excludes a player from a brand.
func (r *Repository) CreateSelfExclusion(ctx context.Context, exclusion models.SelfExclusion) error {
	_, err := r.db.Pool.Exec(ctx, `
		INSERT INTO self_exclusions (id, player_id, brand_id, reason, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`, exclusion.ID, exclusion.PlayerID, exclusion.BrandID, exclusion.Reason, exclusion.CreatedAt)
	if err != nil {
		return fmt.Errorf("create self-exclusion: %w", err)
	}
	return nil
}

// ----- Cooling-off operations -----

// GetActiveCoolingOff returns the active cooling-off period for a player on a brand, if any.
func (r *Repository) GetActiveCoolingOff(ctx context.Context, playerID, brandID uuid.UUID) (*models.CoolingOff, error) {
	var c models.CoolingOff
	err := r.db.Pool.QueryRow(ctx, `
		SELECT id, player_id, brand_id, ends_at, reason, created_at
		FROM cooling_offs
		WHERE player_id = $1 AND brand_id = $2 AND ends_at > NOW()
		ORDER BY ends_at DESC
		LIMIT 1
	`, playerID, brandID).Scan(
		&c.ID, &c.PlayerID, &c.BrandID, &c.EndsAt, &c.Reason, &c.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get cooling-off: %w", err)
	}
	return &c, nil
}

// CreateCoolingOff creates a new cooling-off period.
func (r *Repository) CreateCoolingOff(ctx context.Context, coolingOff models.CoolingOff) error {
	_, err := r.db.Pool.Exec(ctx, `
		INSERT INTO cooling_offs (id, player_id, brand_id, ends_at, reason, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, coolingOff.ID, coolingOff.PlayerID, coolingOff.BrandID,
		coolingOff.EndsAt, coolingOff.Reason, coolingOff.CreatedAt)
	if err != nil {
		return fmt.Errorf("create cooling-off: %w", err)
	}
	return nil
}
