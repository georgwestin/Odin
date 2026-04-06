package models

import (
	"time"

	"github.com/google/uuid"
)

// ----- Reporting Types -----

// ReportGGR is the response for the Gross Gaming Revenue report.
type ReportGGR struct {
	DateFrom    string `json:"date_from"`
	DateTo      string `json:"date_to"`
	TotalBets   string `json:"total_bets"`
	TotalWins   string `json:"total_wins"`
	GGR         string `json:"ggr"`
	BonusCost   string `json:"bonus_cost"`
	NGR         string `json:"ngr"`
	BetCount    int64  `json:"bet_count"`
	PlayerCount int64  `json:"player_count"`
}

// ReportPlayerActivity is an entry in the player activity report.
type ReportPlayerActivity struct {
	PlayerID     uuid.UUID `json:"player_id"`
	Email        string    `json:"email"`
	TotalBets    string    `json:"total_bets"`
	TotalWins    string    `json:"total_wins"`
	BetCount     int64     `json:"bet_count"`
	DepositTotal string    `json:"deposit_total"`
	LastActiveAt time.Time `json:"last_active_at"`
}

// ReportTransaction is an entry in the transaction export.
type ReportTransaction struct {
	ID        uuid.UUID `json:"id"`
	PlayerID  uuid.UUID `json:"player_id"`
	Type      string    `json:"type"`
	Amount    string    `json:"amount"`
	Currency  string    `json:"currency"`
	CreatedAt time.Time `json:"created_at"`
}

// ReportBet is an entry in the bet history report.
type ReportBet struct {
	BetID      uuid.UUID  `json:"bet_id"`
	PlayerID   uuid.UUID  `json:"player_id"`
	SportName  string     `json:"sport_name"`
	EventName  string     `json:"event_name"`
	MarketName string     `json:"market_name"`
	Stake      string     `json:"stake"`
	Payout     string     `json:"payout"`
	Result     string     `json:"result"`
	PlacedAt   time.Time  `json:"placed_at"`
	SettledAt  *time.Time `json:"settled_at,omitempty"`
}

// ReportResponsibleGambling is the responsible gambling summary.
type ReportResponsibleGambling struct {
	ActiveLimits      int64 `json:"active_limits"`
	DepositLimits     int64 `json:"deposit_limits"`
	LossLimits        int64 `json:"loss_limits"`
	WagerLimits       int64 `json:"wager_limits"`
	SessionLimits     int64 `json:"session_limits"`
	SelfExclusions    int64 `json:"self_exclusions"`
	CoolingOffs       int64 `json:"cooling_offs"`
	ActiveCoolingOffs int64 `json:"active_cooling_offs"`
}

// DashboardStats is the summary dashboard response.
type DashboardStats struct {
	TotalPlayers        int64  `json:"total_players"`
	ActivePlayers24h    int64  `json:"active_players_24h"`
	TotalBetsToday      int64  `json:"total_bets_today"`
	GGRToday            string `json:"ggr_today"`
	TotalDepositsToday  string `json:"total_deposits_today"`
	PendingWithdrawals  int64  `json:"pending_withdrawals"`
	SelfExcludedPlayers int64  `json:"self_excluded_players"`
}
