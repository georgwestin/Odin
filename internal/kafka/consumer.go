package kafka

import (
	"context"
	"fmt"
	"sync"

	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
)

// Message is the unit delivered to consumer handlers.
type Message struct {
	Key       []byte
	Value     []byte
	Topic     string
	Partition int
	Offset    int64
}

// Handler processes a consumed Kafka message.
type Handler func(ctx context.Context, msg Message) error

// Consumer wraps a kafka-go Reader with graceful shutdown support.
type Consumer struct {
	reader *kafka.Reader
	logger *zap.Logger
	wg     sync.WaitGroup
	cancel context.CancelFunc
}

// NewConsumer creates a consumer that reads from the given topic under groupID.
func NewConsumer(brokers []string, topic, groupID string, logger *zap.Logger) *Consumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  groupID,
		MinBytes: 1,
		MaxBytes: 10 << 20, // 10 MiB
	})

	return &Consumer{
		reader: reader,
		logger: logger,
	}
}

// Subscribe starts consuming messages and dispatching them to handler in a
// background goroutine. Call Close to stop and wait for the goroutine to exit.
func (c *Consumer) Subscribe(ctx context.Context, handler Handler) {
	ctx, c.cancel = context.WithCancel(ctx)

	c.wg.Add(1)
	go func() {
		defer c.wg.Done()

		c.logger.Info("kafka consumer started",
			zap.String("topic", c.reader.Config().Topic),
			zap.String("group", c.reader.Config().GroupID),
		)

		for {
			msg, err := c.reader.FetchMessage(ctx)
			if err != nil {
				if ctx.Err() != nil {
					c.logger.Info("kafka consumer stopping",
						zap.String("topic", c.reader.Config().Topic),
					)
					return
				}
				c.logger.Error("kafka fetch message failed", zap.Error(err))
				continue
			}

			m := Message{
				Key:       msg.Key,
				Value:     msg.Value,
				Topic:     msg.Topic,
				Partition: msg.Partition,
				Offset:    msg.Offset,
			}

			if err := handler(ctx, m); err != nil {
				c.logger.Error("kafka handler failed",
					zap.String("topic", msg.Topic),
					zap.Int("partition", msg.Partition),
					zap.Int64("offset", msg.Offset),
					zap.Error(err),
				)
				continue
			}

			if err := c.reader.CommitMessages(ctx, msg); err != nil {
				c.logger.Error("kafka commit failed", zap.Error(err))
			}
		}
	}()
}

// Close cancels the consumer loop, waits for the goroutine to finish, and
// closes the underlying reader.
func (c *Consumer) Close() error {
	if c.cancel != nil {
		c.cancel()
	}
	c.wg.Wait()

	if err := c.reader.Close(); err != nil {
		return fmt.Errorf("kafka: close consumer: %w", err)
	}
	return nil
}
