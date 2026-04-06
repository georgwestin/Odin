// Package middleware provides shared HTTP middleware for Odin services.
package middleware

import (
	"net/http"

	chimw "github.com/go-chi/chi/v5/middleware"
	"go.uber.org/zap"
)

// Common returns a middleware chain suitable for all services. It includes
// request ID generation, structured logging, panic recovery, and real IP
// detection.
func Common(logger *zap.Logger, serviceName string) []func(http.Handler) http.Handler {
	return []func(http.Handler) http.Handler{
		RequestID,
		LoggingMiddleware(logger, serviceName),
		chimw.Recoverer,
		chimw.RealIP,
	}
}
