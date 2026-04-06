package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Options configures the Redis client beyond what the URL provides.
type Options struct {
	PoolSize     int
	MinIdleConns int
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

// DefaultOptions returns production-appropriate Redis pool settings.
func DefaultOptions() *Options {
	return &Options{
		PoolSize:     20,
		MinIdleConns: 5,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	}
}

// NewClient creates a go-redis/v9 Client from a REDIS_URL (e.g.
// "redis://:password@host:6379/0") and validates connectivity.
// Pass nil for opts to use defaults.
func NewClient(ctx context.Context, redisURL string, opts *Options) (*redis.Client, error) {
	if redisURL == "" {
		return nil, fmt.Errorf("redis: REDIS_URL must not be empty")
	}

	if opts == nil {
		opts = DefaultOptions()
	}

	parsed, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("redis: parse url: %w", err)
	}

	parsed.PoolSize = opts.PoolSize
	parsed.MinIdleConns = opts.MinIdleConns
	parsed.ReadTimeout = opts.ReadTimeout
	parsed.WriteTimeout = opts.WriteTimeout

	client := redis.NewClient(parsed)

	if err := client.Ping(ctx).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("redis: ping: %w", err)
	}

	return client, nil
}

// Client wraps a go-redis Client for backward compatibility with existing
// services that depend on the odinredis.Client type.
type Client struct {
	*redis.Client
}

// Connect creates a Client with default options. This is a convenience
// wrapper around NewClient for services that prefer the Client type.
func Connect(ctx context.Context, redisURL string) (*Client, error) {
	c, err := NewClient(ctx, redisURL, nil)
	if err != nil {
		return nil, err
	}
	return &Client{Client: c}, nil
}
