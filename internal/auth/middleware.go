package auth

import (
	"net/http"
	"strings"

	"github.com/odin-platform/odin/internal/httperr"
)

// AuthMiddleware validates the JWT from the Authorization Bearer header and
// stores the resulting Claims in the request context. Requires a JWTManager
// configured with the platform's public key.
func AuthMiddleware(jwtMgr *JWTManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				httperr.WriteError(w, http.StatusUnauthorized,
					httperr.Unauthorized("missing authorization header"))
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
				httperr.WriteError(w, http.StatusUnauthorized,
					httperr.Unauthorized("invalid authorization header format"))
				return
			}

			claims, err := jwtMgr.ValidateToken(parts[1])
			if err != nil {
				httperr.WriteError(w, http.StatusUnauthorized,
					httperr.Unauthorized("invalid or expired token"))
				return
			}

			ctx := WithClaims(r.Context(), claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole returns middleware that rejects requests whose JWT claims do not
// include the specified role.
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := ExtractClaims(r.Context())
			if claims == nil {
				httperr.WriteError(w, http.StatusUnauthorized,
					httperr.Unauthorized("authentication required"))
				return
			}

			if !claims.HasRole(role) {
				httperr.WriteError(w, http.StatusForbidden,
					httperr.Forbidden("insufficient role: "+role+" required"))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequireKYC returns middleware that rejects requests unless the player's KYC
// status matches the required value (e.g. "approved").
func RequireKYC(status string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := ExtractClaims(r.Context())
			if claims == nil {
				httperr.WriteError(w, http.StatusUnauthorized,
					httperr.Unauthorized("authentication required"))
				return
			}

			if claims.KYCStatus != status {
				httperr.WriteError(w, http.StatusForbidden,
					httperr.Forbidden("KYC status "+status+" required"))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
