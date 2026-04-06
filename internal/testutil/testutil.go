package testutil

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/kafka"
	"github.com/redis/go-redis/v9"
)

// Request creates a test HTTP request with an optional JSON body.
func Request(method, path string, body interface{}) *http.Request {
	var req *http.Request
	if body != nil {
		data, _ := json.Marshal(body)
		req = httptest.NewRequest(method, path, strings.NewReader(string(data)))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req = httptest.NewRequest(method, path, nil)
	}
	return req
}

// SetupTestDB connects to a test Postgres instance and creates an isolated
// schema for the test. The schema is dropped when the test finishes.
// Requires a running Postgres at DATABASE_URL (defaults to the standard local
// dev database).
func SetupTestDB(t *testing.T, databaseURL string) *pgxpool.Pool {
	t.Helper()

	if databaseURL == "" {
		databaseURL = "postgres://odin:odin@localhost:5432/odin_test?sslmode=disable"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatalf("testutil: connect to test db: %v", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		t.Fatalf("testutil: ping test db: %v", err)
	}

	// Create an isolated schema for this test to avoid cross-test pollution.
	schema := fmt.Sprintf("test_%s", strings.ReplaceAll(uuid.NewString(), "-", ""))
	if _, err := pool.Exec(ctx, fmt.Sprintf("CREATE SCHEMA %s", schema)); err != nil {
		pool.Close()
		t.Fatalf("testutil: create test schema: %v", err)
	}
	if _, err := pool.Exec(ctx, fmt.Sprintf("SET search_path TO %s, public", schema)); err != nil {
		pool.Close()
		t.Fatalf("testutil: set search_path: %v", err)
	}

	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanupCancel()
		_, _ = pool.Exec(cleanupCtx, fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", schema))
		pool.Close()
	})

	return pool
}

// SetupTestRedis connects to a test Redis instance and selects a random DB
// (1-15) to isolate from other tests. The DB is flushed when the test finishes.
func SetupTestRedis(t *testing.T, redisURL string) *redis.Client {
	t.Helper()

	if redisURL == "" {
		redisURL = "redis://localhost:6379/1"
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		t.Fatalf("testutil: parse redis url: %v", err)
	}

	client := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		_ = client.Close()
		t.Fatalf("testutil: ping test redis: %v", err)
	}

	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanupCancel()
		_ = client.FlushDB(cleanupCtx)
		_ = client.Close()
	})

	return client
}

// MockKafkaProducer implements the same Publish interface as kafka.Producer but
// stores messages in memory for assertion.
type MockKafkaProducer struct {
	Messages []MockMessage
}

// MockMessage records a single published message.
type MockMessage struct {
	Topic string
	Key   []byte
	Value []byte
}

// Publish records the message for later assertion. Key and value follow the
// same convention as kafka.Producer.Publish: []byte is stored as-is, strings
// are converted, everything else is JSON-encoded.
func (m *MockKafkaProducer) Publish(_ context.Context, topic string, key, value interface{}) error {
	m.Messages = append(m.Messages, MockMessage{
		Topic: topic,
		Key:   toBytes(key),
		Value: toBytes(value),
	})
	return nil
}

// Close is a no-op for the mock.
func (m *MockKafkaProducer) Close() error {
	return nil
}

// KafkaPublisher is the interface satisfied by both kafka.Producer and
// MockKafkaProducer.
type KafkaPublisher interface {
	Publish(ctx context.Context, topic string, key, value interface{}) error
	Close() error
}

func toBytes(v interface{}) []byte {
	switch val := v.(type) {
	case []byte:
		return val
	case string:
		return []byte(val)
	default:
		data, _ := json.Marshal(val)
		return data
	}
}

// Compile-time interface checks.
var (
	_ KafkaPublisher = (*MockKafkaProducer)(nil)
	_ KafkaPublisher = (*kafka.Producer)(nil)
)

// GenerateTestJWT creates a signed JWT for use in tests. It generates an
// ephemeral RSA key pair so no key files are needed.
func GenerateTestJWT(t *testing.T, claims auth.Claims) string {
	t.Helper()

	privKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("testutil: generate rsa key: %v", err)
	}

	mgr := auth.NewJWTManagerFromKeys(privKey, &privKey.PublicKey, 15*time.Minute, 24*time.Hour)

	accessToken, _, err := mgr.GenerateTokenPair(claims)
	if err != nil {
		t.Fatalf("testutil: generate token pair: %v", err)
	}

	return accessToken
}

// GenerateTestJWTManager returns a JWTManager backed by an ephemeral RSA key
// pair, useful when tests need to both generate and validate tokens.
func GenerateTestJWTManager(t *testing.T) *auth.JWTManager {
	t.Helper()

	privKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("testutil: generate rsa key: %v", err)
	}

	return auth.NewJWTManagerFromKeys(privKey, &privKey.PublicKey, 15*time.Minute, 24*time.Hour)
}
