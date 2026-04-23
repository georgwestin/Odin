package models

import (
	"time"

	"github.com/google/uuid"
)

// Decimal wraps a string representation of a decimal number to avoid
// floating-point precision issues with monetary amounts.
type Decimal string

// KYCStatus represents the state of a player's identity verification.
type KYCStatus string

const (
	KYCPending  KYCStatus = "pending"
	KYCApproved KYCStatus = "approved"
	KYCRejected KYCStatus = "rejected"
)

// Player status constants.
const (
	PlayerStatusActive    = "active"
	PlayerStatusSuspended = "suspended"
	PlayerStatusClosed    = "closed"
)

// Bet status constants.
const (
	BetStatusPending   = "pending"
	BetStatusSettled    = "settled"
	BetStatusVoided    = "voided"
	BetStatusCashedOut = "cashed_out"
)

// Bonus status constants.
const (
	BonusStatusActive    = "active"
	BonusStatusCompleted = "completed"
	BonusStatusExpired   = "expired"
	BonusStatusCancelled = "cancelled"
)

// Limit type constants.
const (
	LimitTypeDeposit = "deposit"
	LimitTypeLoss    = "loss"
	LimitTypeWager   = "wager"
	LimitTypeSession = "session"
)

// Limit period constants.
const (
	LimitPeriodDaily   = "daily"
	LimitPeriodWeekly  = "weekly"
	LimitPeriodMonthly = "monthly"
)

// Transaction type constants.
const (
	TxTypeDeposit    = "deposit"
	TxTypeWithdrawal = "withdrawal"
	TxTypeBet        = "bet"
	TxTypeWin        = "win"
	TxTypeBonus      = "bonus"
	TxTypeRollback   = "rollback"
	TxTypeAdjustment = "adjustment"
)

// Player represents a registered player in the platform.
// Unique identifier is email. Has a playerCurrency defining the currency
// for wallet and bonusWallet.
type Player struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	BrandID        uuid.UUID  `json:"brand_id" db:"brand_id"`
	Email          string     `json:"email" db:"email"`
	Username       string     `json:"username" db:"username"`
	PasswordHash   string     `json:"-" db:"password_hash"`
	FirstName      string     `json:"first_name" db:"first_name"`
	LastName       string     `json:"last_name" db:"last_name"`
	Phone          string     `json:"phone,omitempty" db:"phone"`
	DateOfBirth    time.Time  `json:"date_of_birth" db:"date_of_birth"`
	Country        string     `json:"country" db:"country_code"`
	PlayerCurrency string     `json:"player_currency" db:"player_currency"`
	KYCStatus      KYCStatus  `json:"kyc_status" db:"kyc_status"`
	IsActive       bool       `json:"is_active" db:"is_active"`
	LastLoginAt    *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
	LastLoginIP    string     `json:"last_login_ip,omitempty" db:"last_login_ip"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
}

// Wallet holds the real-money balance for a player.
// Currency matches the player's playerCurrency.
type Wallet struct {
	ID             uuid.UUID `json:"id" db:"id"`
	PlayerID       uuid.UUID `json:"player_id" db:"player_id"`
	BrandID        uuid.UUID `json:"brand_id" db:"brand_id"`
	Currency       string    `json:"currency" db:"currency"`
	PlayerCurrency string    `json:"player_currency" db:"player_currency"`
	Balance        Decimal   `json:"balance" db:"balance"`
	BonusBalance   Decimal   `json:"bonus_balance" db:"bonus_balance"`
	LockedBalance  Decimal   `json:"locked_balance" db:"locked_balance"`
	Version        int64     `json:"version" db:"version"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// LoginSession records a player's login/logout activity with IP tracking.
type LoginSession struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	PlayerID    uuid.UUID  `json:"player_id" db:"player_id"`
	BrandID     uuid.UUID  `json:"brand_id" db:"brand_id"`
	IPAddress   string     `json:"ip_address" db:"ip_address"`
	UserAgent   string     `json:"user_agent,omitempty" db:"user_agent"`
	Country     string     `json:"country,omitempty" db:"country"`
	LoginAt     time.Time  `json:"login_at" db:"login_at"`
	LogoutAt    *time.Time `json:"logout_at,omitempty" db:"logout_at"`
	LogoutType  string     `json:"logout_type,omitempty" db:"logout_type"` // manual, expired, forced
	IsActive    bool       `json:"is_active" db:"is_active"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}

// LoginSession logout type constants.
const (
	LogoutManual  = "manual"
	LogoutExpired = "expired"
	LogoutForced  = "forced"
)

// BonusWallet holds bonus funds with an associated wagering requirement.
// A player can have multiple active bonus wallets (one per bonus award).
type BonusWallet struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	PlayerID          uuid.UUID  `json:"player_id" db:"player_id"`
	BrandID           uuid.UUID  `json:"brand_id" db:"brand_id"`
	Currency          string     `json:"currency" db:"currency"`
	Balance           Decimal    `json:"balance" db:"balance"`
	WageringRequired  Decimal    `json:"wagering_required" db:"wagering_required"`
	WageringCompleted Decimal    `json:"wagering_completed" db:"wagering_completed"`
	Source            string     `json:"source" db:"source"`       // welcome_bonus, deposit_bonus, free_spins, etc.
	BonusID           *uuid.UUID `json:"bonus_id,omitempty" db:"bonus_id"`
	Status            string     `json:"status" db:"status"`       // active, completed, expired, forfeited
	ExpiresAt         *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
}

// Payment represents a deposit or withdrawal transaction.
// State machine: initiated → pending → settled (or failed/cancelled)
type Payment struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	PlayerID        uuid.UUID  `json:"player_id" db:"player_id"`
	BrandID         uuid.UUID  `json:"brand_id" db:"brand_id"`
	Type            string     `json:"type" db:"type"`                // deposit, withdrawal
	Status          string     `json:"status" db:"status"`            // initiated, pending, settled, failed, cancelled
	Amount          Decimal    `json:"amount" db:"amount"`            // amount in source currency
	Currency        string     `json:"currency" db:"currency"`        // source currency of payment
	PlayerAmount    Decimal    `json:"player_amount" db:"player_amount"`
	PlayerCurrency  string     `json:"player_currency" db:"player_currency"`
	BaseAmount      Decimal    `json:"base_amount,omitempty" db:"base_amount"`
	BaseCurrency    string     `json:"base_currency,omitempty" db:"base_currency"`
	PaymentMethod   string     `json:"payment_method,omitempty" db:"payment_method"`   // swish, trustly, visa, etc.
	PaymentProvider string     `json:"payment_provider,omitempty" db:"payment_provider"`
	ExternalRef     string     `json:"external_ref,omitempty" db:"external_ref"`
	IdempotencyKey  string     `json:"idempotency_key" db:"idempotency_key"`
	WalletID        *uuid.UUID `json:"wallet_id,omitempty" db:"wallet_id"`
	LedgerEntryID   *uuid.UUID `json:"ledger_entry_id,omitempty" db:"ledger_entry_id"`
	Description     string     `json:"description,omitempty" db:"description"`
	FailureReason   string     `json:"failure_reason,omitempty" db:"failure_reason"`
	IPAddress       string     `json:"ip_address,omitempty" db:"ip_address"`
	InitiatedAt     time.Time  `json:"initiated_at" db:"initiated_at"`
	PendingAt       *time.Time `json:"pending_at,omitempty" db:"pending_at"`
	SettledAt       *time.Time `json:"settled_at,omitempty" db:"settled_at"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

// Payment status constants.
const (
	PaymentStatusInitiated = "initiated"
	PaymentStatusPending   = "pending"
	PaymentStatusSettled   = "settled"
	PaymentStatusFailed    = "failed"
	PaymentStatusCancelled = "cancelled"
)

// Payment type constants.
const (
	PaymentTypeDeposit    = "deposit"
	PaymentTypeWithdrawal = "withdrawal"
)

// BonusWallet status constants.
const (
	BonusWalletActive    = "active"
	BonusWalletCompleted = "completed"
	BonusWalletExpired   = "expired"
	BonusWalletForfeited = "forfeited"
)

// LedgerEntry is an immutable record of every balance-changing operation.
// Each entry records the amount in four currencies:
//   - Base currency: the brand's operational currency
//   - Player currency: the player's chosen currency
//   - Reporting currency: the brand's reporting/regulatory currency
//   - Bet currency: the currency the bet was placed in (empty for non-bet transactions)
type LedgerEntry struct {
	ID              uuid.UUID `json:"id" db:"id"`
	WalletID        uuid.UUID `json:"wallet_id" db:"wallet_id"`
	PlayerID        uuid.UUID `json:"player_id" db:"player_id"`
	BrandID         uuid.UUID `json:"brand_id" db:"brand_id"`
	TransactionType string    `json:"transaction_type" db:"transaction_type"`
	Amount          Decimal   `json:"amount" db:"amount"`
	BalanceBefore   Decimal   `json:"balance_before" db:"balance_before"`
	BalanceAfter    Decimal   `json:"balance_after" db:"balance_after"`
	Currency        string    `json:"currency" db:"currency"`
	// Multi-currency fields
	BaseAmount       Decimal `json:"base_amount" db:"base_amount"`
	BaseCurrency     string  `json:"base_currency" db:"base_currency"`
	PlayerAmount     Decimal `json:"player_amount" db:"player_amount"`
	PlayerCurrency   string  `json:"player_currency" db:"player_currency"`
	ReportAmount     Decimal `json:"report_amount" db:"report_amount"`
	ReportCurrency   string  `json:"report_currency" db:"report_currency"`
	BetAmount        Decimal `json:"bet_amount,omitempty" db:"bet_amount"`
	BetCurrency      string  `json:"bet_currency,omitempty" db:"bet_currency"`
	ExchangeRateInfo string  `json:"exchange_rate_info,omitempty" db:"exchange_rate_info"`
	ReferenceID      string  `json:"reference_id" db:"reference_id"`
	ReferenceType    string  `json:"reference_type" db:"reference_type"`
	IdempotencyKey   string  `json:"idempotency_key" db:"idempotency_key"`
	Description      string  `json:"description,omitempty" db:"description"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}

// Bet represents a wager placed by a player.
// Stake and payout are recorded in all four currency representations.
type Bet struct {
	ID         uuid.UUID      `json:"id" db:"id"`
	PlayerID   uuid.UUID      `json:"player_id" db:"player_id"`
	BrandID    uuid.UUID      `json:"brand_id" db:"brand_id"`
	WalletID   uuid.UUID      `json:"wallet_id" db:"wallet_id"`
	Stake      Decimal        `json:"stake" db:"stake"`
	Currency   string         `json:"currency" db:"currency"`
	// Multi-currency stake
	StakeBase       Decimal `json:"stake_base" db:"stake_base"`
	BaseCurrency    string  `json:"base_currency" db:"base_currency"`
	StakePlayer     Decimal `json:"stake_player" db:"stake_player"`
	PlayerCurrency  string  `json:"player_currency" db:"player_currency"`
	StakeReport     Decimal `json:"stake_report" db:"stake_report"`
	ReportCurrency  string  `json:"report_currency" db:"report_currency"`
	StakeBet        Decimal `json:"stake_bet" db:"stake_bet"`
	BetCurrency     string  `json:"bet_currency" db:"bet_currency"`
	Payout          Decimal `json:"payout" db:"payout"`
	// Multi-currency payout (populated on settlement)
	PayoutBase      Decimal `json:"payout_base,omitempty" db:"payout_base"`
	PayoutPlayer    Decimal `json:"payout_player,omitempty" db:"payout_player"`
	PayoutReport    Decimal `json:"payout_report,omitempty" db:"payout_report"`
	PayoutBet       Decimal `json:"payout_bet,omitempty" db:"payout_bet"`
	Status          string  `json:"status" db:"status"`
	BetType         string  `json:"bet_type" db:"bet_type"`
	Selections []BetSelection `json:"selections" db:"-"`
	SettledAt  *time.Time     `json:"settled_at,omitempty" db:"settled_at"`
	CreatedAt  time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at" db:"updated_at"`
}

// BetSelection is a single selection within a bet (e.g. one leg of an accumulator).
type BetSelection struct {
	ID        uuid.UUID `json:"id" db:"id"`
	BetID     uuid.UUID `json:"bet_id" db:"bet_id"`
	EventID   string    `json:"event_id" db:"event_id"`
	MarketID  string    `json:"market_id" db:"market_id"`
	OutcomeID string    `json:"outcome_id" db:"outcome_id"`
	Odds      Decimal   `json:"odds" db:"odds"`
	Status    string    `json:"status" db:"status"`
	Result    string    `json:"result" db:"result"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// GameSession tracks a player's active session with a game provider.
type GameSession struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	PlayerID     uuid.UUID  `json:"player_id" db:"player_id"`
	BrandID      uuid.UUID  `json:"brand_id" db:"brand_id"`
	GameID       string     `json:"game_id" db:"game_id"`
	ProviderID   string     `json:"provider_id" db:"provider_id"`
	Currency     string     `json:"currency" db:"currency"`
	SessionToken string     `json:"session_token" db:"session_token"`
	IPAddress    string     `json:"ip_address" db:"ip_address"`
	StartedAt    time.Time  `json:"started_at" db:"started_at"`
	EndedAt      *time.Time `json:"ended_at,omitempty" db:"ended_at"`
}

// GameRound represents a single round of play within a game session.
type GameRound struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	SessionID   uuid.UUID  `json:"session_id" db:"session_id"`
	PlayerID    uuid.UUID  `json:"player_id" db:"player_id"`
	BrandID     uuid.UUID  `json:"brand_id" db:"brand_id"`
	GameID      string     `json:"game_id" db:"game_id"`
	ProviderID  string     `json:"provider_id" db:"provider_id"`
	RoundRef    string     `json:"round_ref" db:"round_ref"`
	TotalBet    Decimal    `json:"total_bet" db:"total_bet"`
	TotalWin    Decimal    `json:"total_win" db:"total_win"`
	Currency    string     `json:"currency" db:"currency"`
	Status      string     `json:"status" db:"status"`
	StartedAt   time.Time  `json:"started_at" db:"started_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" db:"completed_at"`
}

// Bonus represents a promotional bonus awarded to a player.
type Bonus struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	PlayerID        uuid.UUID  `json:"player_id" db:"player_id"`
	BrandID         uuid.UUID  `json:"brand_id" db:"brand_id"`
	CampaignID      uuid.UUID  `json:"campaign_id" db:"campaign_id"`
	Type            string     `json:"type" db:"type"`
	Code            string     `json:"code,omitempty" db:"code"`
	Amount          Decimal    `json:"amount" db:"amount"`
	Currency        string     `json:"currency" db:"currency"`
	WagerRequirement Decimal   `json:"wager_requirement" db:"wager_requirement"`
	WagerProgress   Decimal    `json:"wager_progress" db:"wager_progress"`
	WagerTarget     Decimal    `json:"wager_target" db:"wager_target"`
	Status          string     `json:"status" db:"status"`
	ExpiresAt       time.Time  `json:"expires_at" db:"expires_at"`
	ClaimedAt       *time.Time `json:"claimed_at,omitempty" db:"claimed_at"`
	CompletedAt     *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

// PlayerLimit defines a responsible gambling limit for a player.
// PendingAmount/PendingAt are used for limit increases that require a mandatory
// cooling period before activation.
type PlayerLimit struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	PlayerID      uuid.UUID  `json:"player_id" db:"player_id"`
	BrandID       uuid.UUID  `json:"brand_id" db:"brand_id"`
	LimitType     string     `json:"limit_type" db:"limit_type"`
	Period        string     `json:"period" db:"period"`
	Amount        string     `json:"amount" db:"amount"`
	PendingAmount *string    `json:"pending_amount,omitempty" db:"pending_amount"`
	PendingAt     *time.Time `json:"pending_at,omitempty" db:"pending_at"`
	IsActive      bool       `json:"is_active" db:"is_active"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
}

// PlayerLimits is an alias for backward compatibility.
type PlayerLimits = PlayerLimit

// SelfExclusion represents a permanent self-exclusion from a brand.
type SelfExclusion struct {
	ID        uuid.UUID `json:"id" db:"id"`
	PlayerID  uuid.UUID `json:"player_id" db:"player_id"`
	BrandID   uuid.UUID `json:"brand_id" db:"brand_id"`
	Reason    string    `json:"reason" db:"reason"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// CoolingOff represents a temporary self-imposed break from gambling.
type CoolingOff struct {
	ID        uuid.UUID `json:"id" db:"id"`
	PlayerID  uuid.UUID `json:"player_id" db:"player_id"`
	BrandID   uuid.UUID `json:"brand_id" db:"brand_id"`
	EndsAt    time.Time `json:"ends_at" db:"ends_at"`
	Reason    string    `json:"reason" db:"reason"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Sport represents a sport category in the sportsbook.
type Sport struct {
	ID       uuid.UUID `json:"id" db:"id"`
	Name     string    `json:"name" db:"name"`
	Slug     string    `json:"slug" db:"slug"`
	IsActive bool      `json:"is_active" db:"is_active"`
	Order    int       `json:"order" db:"order"`
}

// Event represents a sporting event with its markets and selections.
type Event struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	SportID   uuid.UUID  `json:"sport_id" db:"sport_id"`
	SportName string     `json:"sport_name" db:"sport_name"`
	Name      string     `json:"name" db:"name"`
	HomeTeam  string     `json:"home_team" db:"home_team"`
	AwayTeam  string     `json:"away_team" db:"away_team"`
	StartsAt  time.Time  `json:"starts_at" db:"starts_at"`
	Status    string     `json:"status" db:"status"`
	Score     *Score     `json:"score,omitempty" db:"-"`
	Markets   []Market   `json:"markets,omitempty" db:"-"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
}

// Score holds the current score of a live event.
type Score struct {
	Home int `json:"home"`
	Away int `json:"away"`
}

// Market represents a betting market within an event (e.g. "Match Winner").
type Market struct {
	ID         uuid.UUID   `json:"id" db:"id"`
	EventID    uuid.UUID   `json:"event_id" db:"event_id"`
	Name       string      `json:"name" db:"name"`
	Type       string      `json:"type" db:"type"`
	Status     string      `json:"status" db:"status"`
	Selections []Selection `json:"selections,omitempty" db:"-"`
}

// Selection represents a selectable outcome within a market.
type Selection struct {
	ID       uuid.UUID `json:"id" db:"id"`
	MarketID uuid.UUID `json:"market_id" db:"market_id"`
	Name     string    `json:"name" db:"name"`
	Odds     float64   `json:"odds" db:"odds"`
	Status   string    `json:"status" db:"status"`
}

// AuditLog records all significant actions for compliance and debugging.
type AuditLog struct {
	ID          uuid.UUID `json:"id" db:"id"`
	PlayerID    uuid.UUID `json:"player_id" db:"player_id"`
	BrandID     uuid.UUID `json:"brand_id" db:"brand_id"`
	Action      string    `json:"action" db:"action"`
	EntityType  string    `json:"entity_type" db:"entity_type"`
	EntityID    string    `json:"entity_id" db:"entity_id"`
	OldValue    string    `json:"old_value,omitempty" db:"old_value"`
	NewValue    string    `json:"new_value,omitempty" db:"new_value"`
	IPAddress   string    `json:"ip_address" db:"ip_address"`
	UserAgent   string    `json:"user_agent" db:"user_agent"`
	ServiceName string    `json:"service_name" db:"service_name"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Brand represents a brand/white-label within the platform.
type Brand struct {
	ID        uuid.UUID   `json:"id" db:"id"`
	Name      string      `json:"name" db:"name"`
	Domain    string      `json:"domain" db:"domain"`
	Config    BrandConfig `json:"config" db:"config"`
	Status    string      `json:"status" db:"status"`
	CreatedAt time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt time.Time   `json:"updated_at" db:"updated_at"`
}
