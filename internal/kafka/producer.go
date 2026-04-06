package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
)

// Topics used across the platform.
const (
	TopicBetPlaced         = "bet.placed"
	TopicBetSettled         = "bet.settled"
	TopicPlayerRegistered  = "player.registered"
	TopicWalletTransaction = "wallet.transaction"
	TopicOddsUpdated       = "odds.updated"
	TopicEventResulted     = "event.resulted"
)

// Producer wraps a kafka-go Writer with a simplified publishing interface.
type Producer struct {
	writer *kafka.Writer
}

// ProducerOptions configures the Kafka producer.
type ProducerOptions struct {
	BatchSize    int
	BatchTimeout time.Duration
	Async        bool
}

// DefaultProducerOptions returns sensible defaults for a transactional iGaming
// workload -- small batches with short timeouts for low latency.
func DefaultProducerOptions() *ProducerOptions {
	return &ProducerOptions{
		BatchSize:    1,
		BatchTimeout: 10 * time.Millisecond,
		Async:        false,
	}
}

// NewProducer creates a Kafka producer that writes to the given brokers.
// Pass nil for opts to use defaults.
func NewProducer(brokers []string, opts *ProducerOptions) (*Producer, error) {
	if len(brokers) == 0 {
		return nil, fmt.Errorf("kafka: at least one broker address is required")
	}

	if opts == nil {
		opts = DefaultProducerOptions()
	}

	w := &kafka.Writer{
		Addr:         kafka.TCP(brokers...),
		Balancer:     &kafka.LeastBytes{},
		BatchSize:    opts.BatchSize,
		BatchTimeout: opts.BatchTimeout,
		Async:        opts.Async,
		RequiredAcks: kafka.RequireAll,
	}

	return &Producer{writer: w}, nil
}

// Publish sends a single message to the specified topic. The key and value
// parameters accept either []byte (sent as-is) or any other type (JSON-encoded).
// This allows callers to pass string keys and struct values conveniently.
func (p *Producer) Publish(ctx context.Context, topic string, key, value interface{}) error {
	keyBytes, err := toBytes(key)
	if err != nil {
		return fmt.Errorf("kafka: marshal key: %w", err)
	}

	valueBytes, err := toBytes(value)
	if err != nil {
		return fmt.Errorf("kafka: marshal value: %w", err)
	}

	msg := kafka.Message{
		Topic: topic,
		Key:   keyBytes,
		Value: valueBytes,
	}

	if err := p.writer.WriteMessages(ctx, msg); err != nil {
		return fmt.Errorf("kafka: publish to %s: %w", topic, err)
	}

	return nil
}

// PublishBatch sends multiple messages in a single write call.
func (p *Producer) PublishBatch(ctx context.Context, topic string, messages []kafka.Message) error {
	for i := range messages {
		messages[i].Topic = topic
	}

	if err := p.writer.WriteMessages(ctx, messages...); err != nil {
		return fmt.Errorf("kafka: publish batch to %s: %w", topic, err)
	}

	return nil
}

// Close flushes pending writes and closes the underlying writer.
func (p *Producer) Close() error {
	if err := p.writer.Close(); err != nil {
		return fmt.Errorf("kafka: close producer: %w", err)
	}
	return nil
}

// toBytes converts a value to []byte. If v is already []byte it is returned
// as-is; if it is a string it is converted directly; otherwise it is
// JSON-marshaled.
func toBytes(v interface{}) ([]byte, error) {
	switch val := v.(type) {
	case []byte:
		return val, nil
	case string:
		return []byte(val), nil
	default:
		return json.Marshal(val)
	}
}
