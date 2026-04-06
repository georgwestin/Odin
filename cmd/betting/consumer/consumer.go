package consumer

import (
	"context"
	"encoding/json"
	"fmt"

	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/betting/service"
	"github.com/odin-platform/odin/internal/kafka"
)

// EventResultedConsumer processes messages from the event.resulted Kafka topic.
type EventResultedConsumer struct {
	svc    *service.Service
	logger *zap.Logger
}

func New(svc *service.Service, logger *zap.Logger) *EventResultedConsumer {
	return &EventResultedConsumer{svc: svc, logger: logger}
}

// Handle deserializes a Kafka message and calls the service to settle the event.
func (c *EventResultedConsumer) Handle(ctx context.Context, msg kafka.Message) error {
	var event service.EventResultedMessage
	if err := json.Unmarshal(msg.Value, &event); err != nil {
		c.logger.Error("failed to unmarshal event.resulted message",
			zap.Error(err),
			zap.String("raw", string(msg.Value)),
		)
		return fmt.Errorf("unmarshal event.resulted: %w", err)
	}

	c.logger.Info("processing event.resulted",
		zap.String("event_id", event.EventID),
		zap.Int("results_count", len(event.Results)),
	)

	if err := c.svc.SettleEvent(ctx, event); err != nil {
		return fmt.Errorf("settle event %s: %w", event.EventID, err)
	}

	c.logger.Info("event settled successfully", zap.String("event_id", event.EventID))
	return nil
}
