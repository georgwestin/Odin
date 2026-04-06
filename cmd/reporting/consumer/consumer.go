package consumer

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/google/uuid"
	"github.com/odin-platform/odin/cmd/reporting/repository"
	"github.com/odin-platform/odin/internal/models"
	"github.com/odin-platform/odin/internal/kafka"
)

// Consumer handles Kafka messages for the reporting service.
type Consumer struct {
	repo   *repository.Repository
	logger *slog.Logger
}

// New creates a new reporting consumer.
func New(repo *repository.Repository, logger *slog.Logger) *Consumer {
	return &Consumer{repo: repo, logger: logger}
}

// HandlePlayerRegistered processes player.registered events.
func (c *Consumer) HandlePlayerRegistered(ctx context.Context, msg kafka.Message) error {
	var event models.PlayerRegisteredEvent
	if err := json.Unmarshal(msg.Value, &event); err != nil {
		c.logger.Error("unmarshal player.registered", "error", err)
		return err
	}

	if err := c.repo.InsertReportPlayer(ctx, event.PlayerID, event.BrandID, event.Email, event.CountryCode, event.Timestamp); err != nil {
		c.logger.Error("insert report player", "error", err, "player_id", event.PlayerID)
		return err
	}

	c.logger.Info("player registered recorded", "player_id", event.PlayerID)
	return nil
}

// HandleWalletTransaction processes wallet.transaction events.
func (c *Consumer) HandleWalletTransaction(ctx context.Context, msg kafka.Message) error {
	var event models.WalletTransactionEvent
	if err := json.Unmarshal(msg.Value, &event); err != nil {
		c.logger.Error("unmarshal wallet.transaction", "error", err)
		return err
	}

	txnID := event.TransactionID
	if txnID == uuid.Nil {
		txnID = uuid.New()
	}

	if err := c.repo.InsertReportTransaction(ctx, txnID, event.PlayerID, event.BrandID, event.Type, event.Amount, event.Currency, event.Timestamp); err != nil {
		c.logger.Error("insert report transaction", "error", err, "transaction_id", txnID)
		return err
	}

	return nil
}

// HandleBetPlaced processes bet.placed events.
func (c *Consumer) HandleBetPlaced(ctx context.Context, msg kafka.Message) error {
	var event models.BetPlacedEvent
	if err := json.Unmarshal(msg.Value, &event); err != nil {
		c.logger.Error("unmarshal bet.placed", "error", err)
		return err
	}

	if err := c.repo.InsertReportBet(ctx, event); err != nil {
		c.logger.Error("insert report bet", "error", err, "bet_id", event.BetID)
		return err
	}

	// Also record as a transaction for GGR calculation.
	txnID := uuid.New()
	if err := c.repo.InsertReportTransaction(ctx, txnID, event.PlayerID, event.BrandID, "bet", event.Stake, event.Currency, event.Timestamp); err != nil {
		c.logger.Error("insert bet transaction", "error", err, "bet_id", event.BetID)
	}

	return nil
}

// HandleBetSettled processes bet.settled events.
func (c *Consumer) HandleBetSettled(ctx context.Context, msg kafka.Message) error {
	var event models.BetSettledEvent
	if err := json.Unmarshal(msg.Value, &event); err != nil {
		c.logger.Error("unmarshal bet.settled", "error", err)
		return err
	}

	if err := c.repo.SettleReportBet(ctx, event); err != nil {
		c.logger.Error("settle report bet", "error", err, "bet_id", event.BetID)
		return err
	}

	// Record win payout as a transaction if the bet was won.
	if event.Result == "won" && event.Payout != "0" {
		txnID := uuid.New()
		if err := c.repo.InsertReportTransaction(ctx, txnID, event.PlayerID, event.BrandID, "win", event.Payout, event.Currency, event.Timestamp); err != nil {
			c.logger.Error("insert win transaction", "error", err, "bet_id", event.BetID)
		}
	}

	return nil
}
