package models

import (
	"time"

	"github.com/google/uuid"
)

// ----- Kafka Event Types -----

// OddsUpdate is published to Kafka when odds change.
type OddsUpdate struct {
	EventID     uuid.UUID `json:"event_id"`
	MarketID    uuid.UUID `json:"market_id"`
	SelectionID uuid.UUID `json:"selection_id"`
	OldOdds     float64   `json:"old_odds"`
	NewOdds     float64   `json:"new_odds"`
	Timestamp   time.Time `json:"timestamp"`
}

// EventResult is published when an event is resulted.
type EventResult struct {
	EventID   uuid.UUID      `json:"event_id"`
	HomeScore int            `json:"home_score"`
	AwayScore int            `json:"away_score"`
	Results   []MarketResult `json:"results"`
	Timestamp time.Time      `json:"timestamp"`
}

// MarketResult contains settlement info for a single market.
type MarketResult struct {
	MarketID         uuid.UUID `json:"market_id"`
	WinningSelection uuid.UUID `json:"winning_selection"`
}

// BetPlacedEvent is the Kafka event for a placed bet.
type BetPlacedEvent struct {
	BetID     uuid.UUID `json:"bet_id"`
	PlayerID  uuid.UUID `json:"player_id"`
	BrandID   uuid.UUID `json:"brand_id"`
	Stake     string    `json:"stake"`
	Currency  string    `json:"currency"`
	SportID   uuid.UUID `json:"sport_id"`
	EventID   uuid.UUID `json:"event_id"`
	MarketID  uuid.UUID `json:"market_id"`
	Timestamp time.Time `json:"timestamp"`
}

// BetSettledEvent is the Kafka event for a settled bet.
type BetSettledEvent struct {
	BetID     uuid.UUID `json:"bet_id"`
	PlayerID  uuid.UUID `json:"player_id"`
	BrandID   uuid.UUID `json:"brand_id"`
	Stake     string    `json:"stake"`
	Payout    string    `json:"payout"`
	Currency  string    `json:"currency"`
	Result    string    `json:"result"` // won, lost, void
	SportID   uuid.UUID `json:"sport_id"`
	EventID   uuid.UUID `json:"event_id"`
	MarketID  uuid.UUID `json:"market_id"`
	Timestamp time.Time `json:"timestamp"`
}

// PlayerRegisteredEvent is the Kafka event for a new player.
type PlayerRegisteredEvent struct {
	PlayerID    uuid.UUID `json:"player_id"`
	BrandID     uuid.UUID `json:"brand_id"`
	Email       string    `json:"email"`
	CountryCode string    `json:"country_code"`
	Timestamp   time.Time `json:"timestamp"`
}

// WalletTransactionEvent is the Kafka event for wallet transactions.
type WalletTransactionEvent struct {
	TransactionID uuid.UUID `json:"transaction_id"`
	PlayerID      uuid.UUID `json:"player_id"`
	BrandID       uuid.UUID `json:"brand_id"`
	Type          string    `json:"type"` // deposit, withdrawal, bet, win, bonus
	Amount        string    `json:"amount"`
	Currency      string    `json:"currency"`
	Timestamp     time.Time `json:"timestamp"`
}
