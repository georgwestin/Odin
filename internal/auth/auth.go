package auth

import (
	"context"

	"github.com/google/uuid"
)

type claimsKey struct{}

// Claims holds the authenticated player's identity extracted from a JWT.
type Claims struct {
	PlayerID  uuid.UUID `json:"player_id"`
	Email     string    `json:"email"`
	KYCStatus string    `json:"kyc_status"`
	Roles     []string  `json:"roles"`
	BrandID   uuid.UUID `json:"brand_id"`
}

// HasRole returns true if the claims include the specified role.
func (c *Claims) HasRole(role string) bool {
	for _, r := range c.Roles {
		if r == role {
			return true
		}
	}
	return false
}

// WithClaims stores claims in the context.
func WithClaims(ctx context.Context, claims *Claims) context.Context {
	return context.WithValue(ctx, claimsKey{}, claims)
}

// ExtractClaims retrieves claims from the context. Returns nil if absent.
func ExtractClaims(ctx context.Context) *Claims {
	claims, _ := ctx.Value(claimsKey{}).(*Claims)
	return claims
}
