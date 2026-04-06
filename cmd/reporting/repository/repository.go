package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/odin-platform/odin/internal/db"
	"github.com/odin-platform/odin/internal/models"
)

// Repository handles read-optimized queries for the reporting service.
type Repository struct {
	db *db.DB
}

// New creates a new reporting repository.
func New(database *db.DB) *Repository {
	return &Repository{db: database}
}

// GGRFilter contains filter parameters for the GGR report.
type GGRFilter struct {
	DateFrom time.Time
	DateTo   time.Time
	BrandID  *uuid.UUID
}

// GetGGR calculates Gross Gaming Revenue for the given date range.
// GGR = total bets - total wins. NGR = GGR - bonus cost.
func (r *Repository) GetGGR(ctx context.Context, filter GGRFilter) (*models.ReportGGR, error) {
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN type = 'bet' THEN CAST(amount AS NUMERIC) ELSE 0 END), 0) AS total_bets,
			COALESCE(SUM(CASE WHEN type = 'win' THEN CAST(amount AS NUMERIC) ELSE 0 END), 0) AS total_wins,
			COALESCE(SUM(CASE WHEN type = 'bonus' THEN CAST(amount AS NUMERIC) ELSE 0 END), 0) AS bonus_cost,
			COUNT(CASE WHEN type = 'bet' THEN 1 END) AS bet_count,
			COUNT(DISTINCT player_id) AS player_count
		FROM report_transactions
		WHERE created_at >= $1 AND created_at < $2
	`
	args := []interface{}{filter.DateFrom, filter.DateTo}

	if filter.BrandID != nil {
		query += " AND brand_id = $3"
		args = append(args, *filter.BrandID)
	}

	var totalBets, totalWins, bonusCost string
	var betCount, playerCount int64

	err := r.db.Pool.QueryRow(ctx, query, args...).Scan(
		&totalBets, &totalWins, &bonusCost, &betCount, &playerCount,
	)
	if err != nil {
		return nil, fmt.Errorf("get ggr: %w", err)
	}

	return &models.ReportGGR{
		DateFrom:    filter.DateFrom.Format("2006-01-02"),
		DateTo:      filter.DateTo.Format("2006-01-02"),
		TotalBets:   totalBets,
		TotalWins:   totalWins,
		GGR:         subtractNumeric(totalBets, totalWins),
		BonusCost:   bonusCost,
		NGR:         subtractNumeric(subtractNumeric(totalBets, totalWins), bonusCost),
		BetCount:    betCount,
		PlayerCount: playerCount,
	}, nil
}

// PlayerActivityFilter contains filter parameters for the player activity report.
type PlayerActivityFilter struct {
	DateFrom time.Time
	DateTo   time.Time
	BrandID  *uuid.UUID
	Limit    int
	Offset   int
}

// GetPlayerActivity returns player activity metrics.
func (r *Repository) GetPlayerActivity(ctx context.Context, filter PlayerActivityFilter) ([]models.ReportPlayerActivity, error) {
	limit := filter.Limit
	if limit <= 0 || limit > 1000 {
		limit = 100
	}

	query := `
		SELECT
			rt.player_id,
			COALESCE(rp.email, '') AS email,
			COALESCE(SUM(CASE WHEN rt.type = 'bet' THEN CAST(rt.amount AS NUMERIC) ELSE 0 END), 0)::TEXT AS total_bets,
			COALESCE(SUM(CASE WHEN rt.type = 'win' THEN CAST(rt.amount AS NUMERIC) ELSE 0 END), 0)::TEXT AS total_wins,
			COUNT(CASE WHEN rt.type = 'bet' THEN 1 END) AS bet_count,
			COALESCE(SUM(CASE WHEN rt.type = 'deposit' THEN CAST(rt.amount AS NUMERIC) ELSE 0 END), 0)::TEXT AS deposit_total,
			MAX(rt.created_at) AS last_active_at
		FROM report_transactions rt
		LEFT JOIN report_players rp ON rp.player_id = rt.player_id
		WHERE rt.created_at >= $1 AND rt.created_at < $2
	`
	args := []interface{}{filter.DateFrom, filter.DateTo}
	argIdx := 3

	if filter.BrandID != nil {
		query += fmt.Sprintf(" AND rt.brand_id = $%d", argIdx)
		args = append(args, *filter.BrandID)
		argIdx++
	}

	query += fmt.Sprintf(`
		GROUP BY rt.player_id, rp.email
		ORDER BY total_bets DESC
		LIMIT $%d OFFSET $%d
	`, argIdx, argIdx+1)
	args = append(args, limit, filter.Offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("get player activity: %w", err)
	}
	defer rows.Close()

	var results []models.ReportPlayerActivity
	for rows.Next() {
		var p models.ReportPlayerActivity
		if err := rows.Scan(
			&p.PlayerID, &p.Email, &p.TotalBets, &p.TotalWins,
			&p.BetCount, &p.DepositTotal, &p.LastActiveAt,
		); err != nil {
			return nil, fmt.Errorf("scan player activity: %w", err)
		}
		results = append(results, p)
	}

	return results, nil
}

// TransactionFilter contains filter parameters for the transaction export.
type TransactionFilter struct {
	DateFrom time.Time
	DateTo   time.Time
	BrandID  *uuid.UUID
	Type     string // optional: deposit, withdrawal, bet, win, bonus
	Limit    int
	Offset   int
}

// GetTransactions returns transactions for export.
func (r *Repository) GetTransactions(ctx context.Context, filter TransactionFilter) ([]models.ReportTransaction, error) {
	limit := filter.Limit
	if limit <= 0 || limit > 10000 {
		limit = 1000
	}

	query := `
		SELECT id, player_id, type, amount, currency, created_at
		FROM report_transactions
		WHERE created_at >= $1 AND created_at < $2
	`
	args := []interface{}{filter.DateFrom, filter.DateTo}
	argIdx := 3

	if filter.BrandID != nil {
		query += fmt.Sprintf(" AND brand_id = $%d", argIdx)
		args = append(args, *filter.BrandID)
		argIdx++
	}

	if filter.Type != "" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, filter.Type)
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, filter.Offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("get transactions: %w", err)
	}
	defer rows.Close()

	var results []models.ReportTransaction
	for rows.Next() {
		var t models.ReportTransaction
		if err := rows.Scan(&t.ID, &t.PlayerID, &t.Type, &t.Amount, &t.Currency, &t.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan transaction: %w", err)
		}
		results = append(results, t)
	}

	return results, nil
}

// BetHistoryFilter contains filter parameters for the bet history report.
type BetHistoryFilter struct {
	DateFrom time.Time
	DateTo   time.Time
	BrandID  *uuid.UUID
	SportID  *uuid.UUID
	Limit    int
	Offset   int
}

// GetBetHistory returns detailed bet history.
func (r *Repository) GetBetHistory(ctx context.Context, filter BetHistoryFilter) ([]models.ReportBet, error) {
	limit := filter.Limit
	if limit <= 0 || limit > 10000 {
		limit = 1000
	}

	query := `
		SELECT bet_id, player_id, sport_name, event_name, market_name,
		       stake, payout, result, placed_at, settled_at
		FROM report_bets
		WHERE placed_at >= $1 AND placed_at < $2
	`
	args := []interface{}{filter.DateFrom, filter.DateTo}
	argIdx := 3

	if filter.BrandID != nil {
		query += fmt.Sprintf(" AND brand_id = $%d", argIdx)
		args = append(args, *filter.BrandID)
		argIdx++
	}

	if filter.SportID != nil {
		query += fmt.Sprintf(" AND sport_id = $%d", argIdx)
		args = append(args, *filter.SportID)
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY placed_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, filter.Offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("get bet history: %w", err)
	}
	defer rows.Close()

	var results []models.ReportBet
	for rows.Next() {
		var b models.ReportBet
		if err := rows.Scan(
			&b.BetID, &b.PlayerID, &b.SportName, &b.EventName, &b.MarketName,
			&b.Stake, &b.Payout, &b.Result, &b.PlacedAt, &b.SettledAt,
		); err != nil {
			return nil, fmt.Errorf("scan bet: %w", err)
		}
		results = append(results, b)
	}

	return results, nil
}

// GetResponsibleGamblingReport returns responsible gambling statistics.
func (r *Repository) GetResponsibleGamblingReport(ctx context.Context, brandID *uuid.UUID) (*models.ReportResponsibleGambling, error) {
	query := `
		SELECT
			(SELECT COUNT(*) FROM player_limits WHERE is_active = true) AS active_limits,
			(SELECT COUNT(*) FROM player_limits WHERE is_active = true AND limit_type = 'deposit') AS deposit_limits,
			(SELECT COUNT(*) FROM player_limits WHERE is_active = true AND limit_type = 'loss') AS loss_limits,
			(SELECT COUNT(*) FROM player_limits WHERE is_active = true AND limit_type = 'wager') AS wager_limits,
			(SELECT COUNT(*) FROM player_limits WHERE is_active = true AND limit_type = 'session') AS session_limits,
			(SELECT COUNT(*) FROM self_exclusions) AS self_exclusions,
			(SELECT COUNT(*) FROM cooling_offs) AS cooling_offs,
			(SELECT COUNT(*) FROM cooling_offs WHERE ends_at > NOW()) AS active_cooling_offs
	`

	var report models.ReportResponsibleGambling
	err := r.db.Pool.QueryRow(ctx, query).Scan(
		&report.ActiveLimits, &report.DepositLimits, &report.LossLimits,
		&report.WagerLimits, &report.SessionLimits, &report.SelfExclusions,
		&report.CoolingOffs, &report.ActiveCoolingOffs,
	)
	if err != nil {
		return nil, fmt.Errorf("get responsible gambling report: %w", err)
	}

	return &report, nil
}

// GetDashboardStats returns summary dashboard statistics.
func (r *Repository) GetDashboardStats(ctx context.Context, brandID *uuid.UUID) (*models.DashboardStats, error) {
	today := time.Now().UTC().Truncate(24 * time.Hour)
	yesterday := today.Add(-24 * time.Hour)

	query := `
		SELECT
			(SELECT COUNT(*) FROM report_players) AS total_players,
			(SELECT COUNT(DISTINCT player_id) FROM report_transactions WHERE created_at >= $1) AS active_players_24h,
			(SELECT COUNT(*) FROM report_bets WHERE placed_at >= $2) AS total_bets_today,
			COALESCE(
				(SELECT (SUM(CASE WHEN type = 'bet' THEN CAST(amount AS NUMERIC) ELSE 0 END) -
				         SUM(CASE WHEN type = 'win' THEN CAST(amount AS NUMERIC) ELSE 0 END))::TEXT
				 FROM report_transactions WHERE created_at >= $2), '0'
			) AS ggr_today,
			COALESCE(
				(SELECT SUM(CAST(amount AS NUMERIC))::TEXT
				 FROM report_transactions WHERE type = 'deposit' AND created_at >= $2), '0'
			) AS total_deposits_today,
			(SELECT COUNT(*) FROM report_transactions WHERE type = 'withdrawal' AND created_at >= $2) AS pending_withdrawals,
			(SELECT COUNT(*) FROM self_exclusions) AS self_excluded_players
	`

	var stats models.DashboardStats
	err := r.db.Pool.QueryRow(ctx, query, yesterday, today).Scan(
		&stats.TotalPlayers, &stats.ActivePlayers24h, &stats.TotalBetsToday,
		&stats.GGRToday, &stats.TotalDepositsToday,
		&stats.PendingWithdrawals, &stats.SelfExcludedPlayers,
	)
	if err != nil {
		return nil, fmt.Errorf("get dashboard stats: %w", err)
	}

	return &stats, nil
}

// ----- Aggregate table insert methods (used by consumers) -----

// InsertReportPlayer records a new player for reporting.
func (r *Repository) InsertReportPlayer(ctx context.Context, playerID, brandID uuid.UUID, email, countryCode string, timestamp time.Time) error {
	_, err := r.db.Pool.Exec(ctx, `
		INSERT INTO report_players (player_id, brand_id, email, country_code, registered_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (player_id) DO NOTHING
	`, playerID, brandID, email, countryCode, timestamp)
	if err != nil {
		return fmt.Errorf("insert report player: %w", err)
	}
	return nil
}

// InsertReportTransaction records a transaction for reporting.
func (r *Repository) InsertReportTransaction(ctx context.Context, id, playerID, brandID uuid.UUID, txnType, amount, currency string, timestamp time.Time) error {
	_, err := r.db.Pool.Exec(ctx, `
		INSERT INTO report_transactions (id, player_id, brand_id, type, amount, currency, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO NOTHING
	`, id, playerID, brandID, txnType, amount, currency, timestamp)
	if err != nil {
		return fmt.Errorf("insert report transaction: %w", err)
	}
	return nil
}

// InsertReportBet records a placed bet for reporting.
func (r *Repository) InsertReportBet(ctx context.Context, bet models.BetPlacedEvent) error {
	_, err := r.db.Pool.Exec(ctx, `
		INSERT INTO report_bets (bet_id, player_id, brand_id, sport_id, sport_name, event_name,
		                         market_name, stake, payout, result, placed_at)
		VALUES ($1, $2, $3, $4, '', '', '', $5, '0', 'pending', $6)
		ON CONFLICT (bet_id) DO NOTHING
	`, bet.BetID, bet.PlayerID, bet.BrandID, bet.SportID, bet.Stake, bet.Timestamp)
	if err != nil {
		return fmt.Errorf("insert report bet: %w", err)
	}
	return nil
}

// SettleReportBet updates a bet with settlement information.
func (r *Repository) SettleReportBet(ctx context.Context, settled models.BetSettledEvent) error {
	_, err := r.db.Pool.Exec(ctx, `
		UPDATE report_bets
		SET payout = $1, result = $2, settled_at = $3
		WHERE bet_id = $4
	`, settled.Payout, settled.Result, settled.Timestamp, settled.BetID)
	if err != nil {
		return fmt.Errorf("settle report bet: %w", err)
	}
	return nil
}

// subtractNumeric subtracts b from a as numeric strings.
func subtractNumeric(a, b string) string {
	// Simple approach: use the database for exact arithmetic if needed.
	// For now, parse as float64 which is sufficient for reporting display.
	var aVal, bVal float64
	fmt.Sscanf(a, "%f", &aVal)
	fmt.Sscanf(b, "%f", &bVal)
	return fmt.Sprintf("%.2f", aVal-bVal)
}
