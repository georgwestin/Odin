package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PoolOptions configures the pgxpool connection pool.
type PoolOptions struct {
	MaxConns          int32
	MinConns          int32
	MaxConnLifetime   time.Duration
	MaxConnIdleTime   time.Duration
	HealthCheckPeriod time.Duration
}

// DefaultPoolOptions returns sensible defaults for an iGaming workload.
func DefaultPoolOptions() *PoolOptions {
	return &PoolOptions{
		MaxConns:          25,
		MinConns:          5,
		MaxConnLifetime:   30 * time.Minute,
		MaxConnIdleTime:   5 * time.Minute,
		HealthCheckPeriod: 30 * time.Second,
	}
}

// NewPool creates a PostgreSQL connection pool from a DATABASE_URL and validates
// connectivity before returning. Pass nil for opts to use defaults.
func NewPool(ctx context.Context, databaseURL string, opts *PoolOptions) (*pgxpool.Pool, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("db: DATABASE_URL must not be empty")
	}

	if opts == nil {
		opts = DefaultPoolOptions()
	}

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("db: parse database url: %w", err)
	}

	config.MaxConns = opts.MaxConns
	config.MinConns = opts.MinConns
	config.MaxConnLifetime = opts.MaxConnLifetime
	config.MaxConnIdleTime = opts.MaxConnIdleTime
	config.HealthCheckPeriod = opts.HealthCheckPeriod

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("db: create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("db: ping database: %w", err)
	}

	return pool, nil
}

// DB wraps a pgxpool.Pool for backward compatibility with existing services.
type DB struct {
	Pool *pgxpool.Pool
}

// Connect creates a DB with sensible defaults. This is a convenience wrapper
// around NewPool for services that prefer the DB type.
func Connect(ctx context.Context, databaseURL string) (*DB, error) {
	pool, err := NewPool(ctx, databaseURL, nil)
	if err != nil {
		return nil, err
	}
	return &DB{Pool: pool}, nil
}

// Close shuts down the underlying connection pool.
func (d *DB) Close() {
	if d.Pool != nil {
		d.Pool.Close()
	}
}

// TxFunc is the callback signature for WithTransaction.
type TxFunc func(tx pgx.Tx) error

// WithTransaction executes fn inside a database transaction. If fn returns an
// error the transaction is rolled back; otherwise it is committed. Panics are
// re-raised after rollback.
func WithTransaction(ctx context.Context, pool *pgxpool.Pool, fn TxFunc) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("db: begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback(ctx)
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return fmt.Errorf("db: rollback failed (%v) after error: %w", rbErr, err)
		}
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("db: commit transaction: %w", err)
	}

	return nil
}
