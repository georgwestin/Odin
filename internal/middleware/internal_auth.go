package middleware

import (
	"net/http"

	"github.com/odin-platform/odin/internal/httperr"
)

const InternalTokenHeader = "X-Internal-Token"

// InternalAuth validates service-to-service requests using a shared secret token.
// Requests without a valid X-Internal-Token header are rejected with 401.
func InternalAuth(token string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			provided := r.Header.Get(InternalTokenHeader)
			if provided == "" || provided != token {
				httperr.WriteError(w, http.StatusUnauthorized,
					httperr.Unauthorized("unauthorized internal request"))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
