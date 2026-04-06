package auth

import (
	"net/http"
	"slices"
)

// RequireAdmin is middleware that rejects requests from non-admin users.
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := ExtractClaims(r.Context())
		if claims == nil || !slices.Contains(claims.Roles, "admin") {
			http.Error(w, `{"error":"admin access required"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
