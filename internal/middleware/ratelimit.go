package middleware

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/httperr"
	"github.com/redis/go-redis/v9"
)

// RateLimitConfig controls the sliding-window rate limiter behaviour.
type RateLimitConfig struct {
	// MaxRequests is the maximum number of requests allowed in the Window.
	MaxRequests int
	// Window is the sliding window duration.
	Window time.Duration
	// KeyFunc optionally overrides the default key extraction (IP or player_id).
	// Return an empty string to skip rate limiting for a request.
	KeyFunc func(r *http.Request) string
}

// DefaultRateLimitConfig returns a default of 100 requests per minute.
func DefaultRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		MaxRequests: 100,
		Window:      1 * time.Minute,
	}
}

// RateLimitMiddleware returns Chi-compatible middleware backed by a Redis
// sorted-set sliding window. Each unique key (player ID or IP) gets its own
// counter.
func RateLimitMiddleware(rdb *redis.Client, cfg RateLimitConfig) func(http.Handler) http.Handler {
	if cfg.MaxRequests <= 0 {
		cfg.MaxRequests = 100
	}
	if cfg.Window <= 0 {
		cfg.Window = 1 * time.Minute
	}

	keyFunc := cfg.KeyFunc
	if keyFunc == nil {
		keyFunc = defaultKeyFunc
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := keyFunc(r)
			if key == "" {
				next.ServeHTTP(w, r)
				return
			}

			allowed, remaining, err := checkRateLimit(r.Context(), rdb, key, cfg.MaxRequests, cfg.Window)
			if err != nil {
				// On Redis failure, allow the request through (fail open).
				next.ServeHTTP(w, r)
				return
			}

			w.Header().Set("X-RateLimit-Limit", strconv.Itoa(cfg.MaxRequests))
			w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
			w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(cfg.Window).Unix(), 10))

			if !allowed {
				httperr.WriteError(w, http.StatusTooManyRequests,
					httperr.ErrorResponse{
						Code:    "RATE_LIMITED",
						Message: "too many requests, please try again later",
					})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// checkRateLimit uses a sorted-set sliding window in Redis.
// Members are scored by their timestamp (UnixNano). Old entries outside the
// window are pruned on each call.
func checkRateLimit(ctx context.Context, rdb *redis.Client, key string, maxReq int, window time.Duration) (allowed bool, remaining int, err error) {
	now := time.Now()
	windowStart := now.Add(-window)

	redisKey := fmt.Sprintf("ratelimit:%s", key)
	member := fmt.Sprintf("%d", now.UnixNano())

	pipe := rdb.Pipeline()

	// Remove entries outside the window.
	pipe.ZRemRangeByScore(ctx, redisKey, "0", strconv.FormatInt(windowStart.UnixNano(), 10))

	// Add current request.
	pipe.ZAdd(ctx, redisKey, redis.Z{Score: float64(now.UnixNano()), Member: member})

	// Count entries in the window.
	countCmd := pipe.ZCard(ctx, redisKey)

	// Set expiry so keys don't persist forever.
	pipe.Expire(ctx, redisKey, window+time.Second)

	_, err = pipe.Exec(ctx)
	if err != nil {
		return false, 0, fmt.Errorf("ratelimit: redis pipeline: %w", err)
	}

	count := int(countCmd.Val())
	remaining = maxReq - count
	if remaining < 0 {
		remaining = 0
	}

	return count <= maxReq, remaining, nil
}

// defaultKeyFunc extracts the player ID from JWT claims if present, otherwise
// falls back to the client IP address.
func defaultKeyFunc(r *http.Request) string {
	if claims := auth.ExtractClaims(r.Context()); claims != nil {
		return "player:" + claims.PlayerID.String()
	}

	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		ip = r.RemoteAddr
	}
	return "ip:" + ip
}
