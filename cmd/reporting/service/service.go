package service

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/odin-platform/odin/cmd/reporting/repository"
	"github.com/odin-platform/odin/internal/httperr"
	"github.com/odin-platform/odin/internal/models"
)

// Service contains the business logic for reporting.
type Service struct {
	repo   *repository.Repository
	logger *slog.Logger
}

// New creates a new reporting service.
func New(repo *repository.Repository, logger *slog.Logger) *Service {
	return &Service{
		repo:   repo,
		logger: logger,
	}
}

// GGRParams contains the parameters for the GGR report.
type GGRParams struct {
	DateFrom string
	DateTo   string
	BrandID  *uuid.UUID
}

// GetGGR returns the Gross Gaming Revenue report.
func (s *Service) GetGGR(ctx context.Context, params GGRParams) (*models.ReportGGR, error) {
	dateFrom, dateTo, err := parseDateRange(params.DateFrom, params.DateTo)
	if err != nil {
		return nil, err
	}

	report, err := s.repo.GetGGR(ctx, repository.GGRFilter{
		DateFrom: dateFrom,
		DateTo:   dateTo,
		BrandID:  params.BrandID,
	})
	if err != nil {
		return nil, fmt.Errorf("get ggr report: %w", err)
	}

	return report, nil
}

// PlayerActivityParams contains the parameters for the player activity report.
type PlayerActivityParams struct {
	DateFrom string
	DateTo   string
	BrandID  *uuid.UUID
	Limit    int
	Offset   int
}

// GetPlayerActivity returns the player activity report.
func (s *Service) GetPlayerActivity(ctx context.Context, params PlayerActivityParams) ([]models.ReportPlayerActivity, error) {
	dateFrom, dateTo, err := parseDateRange(params.DateFrom, params.DateTo)
	if err != nil {
		return nil, err
	}

	return s.repo.GetPlayerActivity(ctx, repository.PlayerActivityFilter{
		DateFrom: dateFrom,
		DateTo:   dateTo,
		BrandID:  params.BrandID,
		Limit:    params.Limit,
		Offset:   params.Offset,
	})
}

// TransactionParams contains the parameters for the transaction export.
type TransactionParams struct {
	DateFrom string
	DateTo   string
	BrandID  *uuid.UUID
	Type     string
	Limit    int
	Offset   int
}

// GetTransactions returns transactions for export.
func (s *Service) GetTransactions(ctx context.Context, params TransactionParams) ([]models.ReportTransaction, error) {
	dateFrom, dateTo, err := parseDateRange(params.DateFrom, params.DateTo)
	if err != nil {
		return nil, err
	}

	return s.repo.GetTransactions(ctx, repository.TransactionFilter{
		DateFrom: dateFrom,
		DateTo:   dateTo,
		BrandID:  params.BrandID,
		Type:     params.Type,
		Limit:    params.Limit,
		Offset:   params.Offset,
	})
}

// BetHistoryParams contains the parameters for the bet history report.
type BetHistoryParams struct {
	DateFrom string
	DateTo   string
	BrandID  *uuid.UUID
	SportID  *uuid.UUID
	Limit    int
	Offset   int
}

// GetBetHistory returns bet history.
func (s *Service) GetBetHistory(ctx context.Context, params BetHistoryParams) ([]models.ReportBet, error) {
	dateFrom, dateTo, err := parseDateRange(params.DateFrom, params.DateTo)
	if err != nil {
		return nil, err
	}

	return s.repo.GetBetHistory(ctx, repository.BetHistoryFilter{
		DateFrom: dateFrom,
		DateTo:   dateTo,
		BrandID:  params.BrandID,
		SportID:  params.SportID,
		Limit:    params.Limit,
		Offset:   params.Offset,
	})
}

// GetResponsibleGamblingReport returns responsible gambling statistics.
func (s *Service) GetResponsibleGamblingReport(ctx context.Context, brandID *uuid.UUID) (*models.ReportResponsibleGambling, error) {
	return s.repo.GetResponsibleGamblingReport(ctx, brandID)
}

// GetDashboardStats returns summary dashboard statistics.
func (s *Service) GetDashboardStats(ctx context.Context, brandID *uuid.UUID) (*models.DashboardStats, error) {
	return s.repo.GetDashboardStats(ctx, brandID)
}

// parseDateRange parses date range strings and returns time values.
func parseDateRange(from, to string) (time.Time, time.Time, error) {
	if from == "" || to == "" {
		return time.Time{}, time.Time{}, fmt.Errorf("date_from and date_to are required: %w", httperr.ErrInvalidInput)
	}

	dateFrom, err := time.Parse("2006-01-02", from)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid date_from format (expected YYYY-MM-DD): %w", httperr.ErrInvalidInput)
	}

	dateTo, err := time.Parse("2006-01-02", to)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid date_to format (expected YYYY-MM-DD): %w", httperr.ErrInvalidInput)
	}

	// Include the end date fully.
	dateTo = dateTo.Add(24 * time.Hour)

	if dateFrom.After(dateTo) {
		return time.Time{}, time.Time{}, fmt.Errorf("date_from must be before date_to: %w", httperr.ErrInvalidInput)
	}

	return dateFrom, dateTo, nil
}
