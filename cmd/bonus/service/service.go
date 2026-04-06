package service

import (
	"context"
	"fmt"
	"log/slog"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/odin-platform/odin/cmd/bonus/repository"
	"github.com/odin-platform/odin/internal/httperr"
	"github.com/odin-platform/odin/internal/kafka"
	"github.com/odin-platform/odin/internal/models"
)

const (
	// CoolingOffMin is the minimum cooling-off duration (24 hours).
	CoolingOffMin = 24 * time.Hour
	// CoolingOffMax is the maximum cooling-off duration (6 weeks).
	CoolingOffMax = 6 * 7 * 24 * time.Hour
	// LimitIncreaseCooldown is the mandatory waiting period for limit increases.
	LimitIncreaseCooldown = 24 * time.Hour
)

// Service contains the business logic for bonuses and responsible gambling.
type Service struct {
	repo     *repository.Repository
	producer *kafka.Producer
	logger   *slog.Logger
}

// New creates a new bonus service.
func New(repo *repository.Repository, producer *kafka.Producer, logger *slog.Logger) *Service {
	return &Service{
		repo:     repo,
		producer: producer,
		logger:   logger,
	}
}

// ListBonuses returns all bonuses for a player.
func (s *Service) ListBonuses(ctx context.Context, playerID, brandID uuid.UUID) ([]models.Bonus, error) {
	excluded, err := s.repo.IsSelfExcluded(ctx, playerID, brandID)
	if err != nil {
		return nil, fmt.Errorf("check self-exclusion: %w", err)
	}
	if excluded {
		return nil, httperr.ErrSelfExcluded
	}

	bonuses, err := s.repo.ListBonusesByPlayer(ctx, playerID, brandID)
	if err != nil {
		return nil, fmt.Errorf("list bonuses: %w", err)
	}

	return bonuses, nil
}

// ClaimBonus claims a pending bonus for the player.
func (s *Service) ClaimBonus(ctx context.Context, playerID, brandID, bonusID uuid.UUID) (*models.Bonus, error) {
	// Check self-exclusion.
	excluded, err := s.repo.IsSelfExcluded(ctx, playerID, brandID)
	if err != nil {
		return nil, fmt.Errorf("check self-exclusion: %w", err)
	}
	if excluded {
		return nil, httperr.ErrSelfExcluded
	}

	// Check cooling-off.
	coolingOff, err := s.repo.GetActiveCoolingOff(ctx, playerID, brandID)
	if err != nil {
		return nil, fmt.Errorf("check cooling-off: %w", err)
	}
	if coolingOff != nil {
		return nil, httperr.ErrCoolingOff
	}

	// Verify bonus exists and belongs to player.
	bonus, err := s.repo.GetBonusByID(ctx, bonusID)
	if err != nil {
		return nil, fmt.Errorf("get bonus: %w", err)
	}
	if bonus == nil {
		return nil, httperr.ErrNotFound
	}
	if bonus.PlayerID != playerID || bonus.BrandID != brandID {
		return nil, httperr.ErrForbidden
	}
	if bonus.Status != "pending" {
		return nil, fmt.Errorf("bonus is not in pending status: %w", httperr.ErrConflict)
	}

	// Check expiry.
	if time.Now().UTC().After(bonus.ExpiresAt) {
		return nil, fmt.Errorf("bonus has expired: %w", httperr.ErrConflict)
	}

	if err := s.repo.ClaimBonus(ctx, bonusID, playerID); err != nil {
		return nil, fmt.Errorf("claim bonus: %w", err)
	}

	// Return the updated bonus.
	updated, err := s.repo.GetBonusByID(ctx, bonusID)
	if err != nil {
		return nil, fmt.Errorf("get claimed bonus: %w", err)
	}

	s.logger.Info("bonus claimed",
		"player_id", playerID,
		"bonus_id", bonusID,
		"type", updated.Type,
		"amount", updated.Amount,
	)

	return updated, nil
}

// UpdateWagerProgress processes a bet placement and updates wagering progress
// for all active bonuses belonging to the player.
func (s *Service) UpdateWagerProgress(ctx context.Context, playerID uuid.UUID, stakeAmount string) error {
	bonuses, err := s.repo.GetActiveBonusesByPlayer(ctx, playerID)
	if err != nil {
		return fmt.Errorf("get active bonuses: %w", err)
	}

	for _, bonus := range bonuses {
		if err := s.repo.UpdateWagerProgress(ctx, bonus.ID, stakeAmount); err != nil {
			s.logger.Error("failed to update wager progress",
				"bonus_id", bonus.ID,
				"player_id", playerID,
				"error", err,
			)
			continue
		}

		// Check if wagering requirement is met.
		updated, err := s.repo.GetBonusByID(ctx, bonus.ID)
		if err != nil {
			s.logger.Error("failed to get bonus after wager update",
				"bonus_id", bonus.ID,
				"error", err,
			)
			continue
		}

		if updated != nil && isWageringComplete(string(updated.WagerProgress), string(updated.WagerTarget)) {
			if err := s.repo.CompleteBonus(ctx, bonus.ID); err != nil {
				s.logger.Error("failed to complete bonus",
					"bonus_id", bonus.ID,
					"error", err,
				)
			} else {
				s.logger.Info("bonus wagering completed",
					"bonus_id", bonus.ID,
					"player_id", playerID,
				)
			}
		}
	}

	return nil
}

// isWageringComplete checks if the progress meets or exceeds the target.
func isWageringComplete(progress, target string) bool {
	p, ok := new(big.Float).SetString(progress)
	if !ok {
		return false
	}
	t, ok := new(big.Float).SetString(target)
	if !ok {
		return false
	}
	return p.Cmp(t) >= 0
}

// GetLimits returns all active responsible gambling limits for a player.
func (s *Service) GetLimits(ctx context.Context, playerID, brandID uuid.UUID) ([]models.PlayerLimit, error) {
	limits, err := s.repo.GetLimits(ctx, playerID, brandID)
	if err != nil {
		return nil, fmt.Errorf("get limits: %w", err)
	}
	return limits, nil
}

// SetLimit creates or updates a responsible gambling limit.
// Reductions take effect immediately. Increases require a 24-hour mandatory cooling period.
func (s *Service) SetLimit(ctx context.Context, playerID, brandID uuid.UUID, limitType, period, amount string) error {
	if !isValidLimitType(limitType) {
		return fmt.Errorf("invalid limit type %q: %w", limitType, httperr.ErrInvalidInput)
	}
	if !isValidPeriod(period) {
		return fmt.Errorf("invalid period %q: %w", period, httperr.ErrInvalidInput)
	}

	newAmount, ok := new(big.Float).SetString(amount)
	if !ok || newAmount.Sign() <= 0 {
		return fmt.Errorf("invalid amount: %w", httperr.ErrInvalidInput)
	}

	// Check self-exclusion.
	excluded, err := s.repo.IsSelfExcluded(ctx, playerID, brandID)
	if err != nil {
		return fmt.Errorf("check self-exclusion: %w", err)
	}
	if excluded {
		return httperr.ErrSelfExcluded
	}

	// Get existing limits to determine if this is an increase or decrease.
	existing, err := s.repo.GetLimits(ctx, playerID, brandID)
	if err != nil {
		return fmt.Errorf("get existing limits: %w", err)
	}

	var currentLimit *models.PlayerLimit
	for _, l := range existing {
		if l.LimitType == limitType && l.Period == period {
			currentLimit = &l
			break
		}
	}

	limit := models.PlayerLimit{
		ID:        uuid.New(),
		PlayerID:  playerID,
		BrandID:   brandID,
		LimitType: limitType,
		Period:    period,
		Amount:    amount,
		IsActive:  true,
	}

	if currentLimit != nil {
		limit.ID = currentLimit.ID

		currentAmount, ok := new(big.Float).SetString(currentLimit.Amount)
		if ok && newAmount.Cmp(currentAmount) > 0 {
			// Increase: apply 24-hour mandatory cooling period.
			pendingAt := time.Now().UTC().Add(LimitIncreaseCooldown)
			limit.Amount = currentLimit.Amount // Keep current amount
			limit.PendingAmount = &amount
			limit.PendingAt = &pendingAt

			s.logger.Info("limit increase scheduled",
				"player_id", playerID,
				"limit_type", limitType,
				"period", period,
				"current", currentLimit.Amount,
				"pending", amount,
				"activates_at", pendingAt,
			)
		} else {
			// Decrease or same: immediate effect.
			s.logger.Info("limit updated (immediate)",
				"player_id", playerID,
				"limit_type", limitType,
				"period", period,
				"amount", amount,
			)
		}
	}

	return s.repo.UpsertLimit(ctx, limit)
}

// SelfExclude permanently excludes the player from the brand. This is irreversible via API.
func (s *Service) SelfExclude(ctx context.Context, playerID, brandID uuid.UUID, reason string) error {
	// Check if already self-excluded.
	excluded, err := s.repo.IsSelfExcluded(ctx, playerID, brandID)
	if err != nil {
		return fmt.Errorf("check self-exclusion: %w", err)
	}
	if excluded {
		return fmt.Errorf("player is already self-excluded: %w", httperr.ErrConflict)
	}

	exclusion := models.SelfExclusion{
		ID:        uuid.New(),
		PlayerID:  playerID,
		BrandID:   brandID,
		Reason:    reason,
		CreatedAt: time.Now().UTC(),
	}

	if err := s.repo.CreateSelfExclusion(ctx, exclusion); err != nil {
		return fmt.Errorf("create self-exclusion: %w", err)
	}

	s.logger.Info("player self-excluded",
		"player_id", playerID,
		"brand_id", brandID,
	)

	return nil
}

// CoolingOff sets a temporary cooling-off period. Minimum 24 hours, maximum 6 weeks.
func (s *Service) CoolingOff(ctx context.Context, playerID, brandID uuid.UUID, duration time.Duration, reason string) error {
	if duration < CoolingOffMin {
		return fmt.Errorf("cooling-off duration must be at least 24 hours: %w", httperr.ErrInvalidInput)
	}
	if duration > CoolingOffMax {
		return fmt.Errorf("cooling-off duration must not exceed 6 weeks: %w", httperr.ErrInvalidInput)
	}

	// Check self-exclusion.
	excluded, err := s.repo.IsSelfExcluded(ctx, playerID, brandID)
	if err != nil {
		return fmt.Errorf("check self-exclusion: %w", err)
	}
	if excluded {
		return httperr.ErrSelfExcluded
	}

	// Check if there is already an active cooling-off.
	existing, err := s.repo.GetActiveCoolingOff(ctx, playerID, brandID)
	if err != nil {
		return fmt.Errorf("check existing cooling-off: %w", err)
	}
	if existing != nil {
		return fmt.Errorf("active cooling-off period already exists (ends %s): %w",
			existing.EndsAt.Format(time.RFC3339), httperr.ErrConflict)
	}

	now := time.Now().UTC()
	coolingOff := models.CoolingOff{
		ID:        uuid.New(),
		PlayerID:  playerID,
		BrandID:   brandID,
		EndsAt:    now.Add(duration),
		Reason:    reason,
		CreatedAt: now,
	}

	if err := s.repo.CreateCoolingOff(ctx, coolingOff); err != nil {
		return fmt.Errorf("create cooling-off: %w", err)
	}

	s.logger.Info("cooling-off period started",
		"player_id", playerID,
		"brand_id", brandID,
		"duration", duration.String(),
		"ends_at", coolingOff.EndsAt,
	)

	return nil
}

func isValidLimitType(t string) bool {
	switch t {
	case "deposit", "loss", "wager", "session":
		return true
	}
	return false
}

func isValidPeriod(p string) bool {
	switch p {
	case "daily", "weekly", "monthly":
		return true
	}
	return false
}
