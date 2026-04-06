package middleware

import (
	"net/http"
	"time"

	"github.com/odin-platform/odin/internal/auth"
	"go.uber.org/zap"
)

// LoggingMiddleware logs every HTTP request with structured fields including
// request_id, player_id, brand_id, method, path, status, and latency.
func LoggingMiddleware(logger *zap.Logger, serviceName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := &statusWriter{ResponseWriter: w, status: http.StatusOK}

			next.ServeHTTP(ww, r)

			fields := []zap.Field{
				zap.String("service_name", serviceName),
				zap.String("request_id", GetRequestID(r.Context())),
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.Int("status_code", ww.status),
				zap.Float64("latency_ms", float64(time.Since(start).Microseconds())/1000.0),
			}

			if claims := auth.ExtractClaims(r.Context()); claims != nil {
				fields = append(fields,
					zap.String("player_id", claims.PlayerID.String()),
					zap.String("brand_id", claims.BrandID.String()),
				)
			} else if brandID, ok := GetBrandID(r.Context()); ok {
				fields = append(fields, zap.String("brand_id", brandID.String()))
			}

			if ww.status >= 500 {
				logger.Error("http request", fields...)
			} else if ww.status >= 400 {
				logger.Warn("http request", fields...)
			} else {
				logger.Info("http request", fields...)
			}
		})
	}
}

type statusWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (w *statusWriter) WriteHeader(code int) {
	if !w.wroteHeader {
		w.status = code
		w.wroteHeader = true
		w.ResponseWriter.WriteHeader(code)
	}
}

func (w *statusWriter) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		w.wroteHeader = true
	}
	return w.ResponseWriter.Write(b)
}
