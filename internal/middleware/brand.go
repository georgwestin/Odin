package middleware

import (
	"context"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/odin-platform/odin/internal/httperr"
	"github.com/odin-platform/odin/internal/models"
)

type brandIDKey struct{}

const BrandIDHeader = "X-Brand-ID"

// BrandResolver looks up a Brand by its domain (Host header value).
type BrandResolver interface {
	BrandByDomain(domain string) (models.Brand, bool)
}

// InMemoryBrandResolver is a thread-safe map-based resolver suitable for small
// deployments or tests. For production, populate from the database on startup
// and refresh periodically.
type InMemoryBrandResolver struct {
	mu     sync.RWMutex
	brands map[string]models.Brand // keyed by domain
}

// NewInMemoryBrandResolver creates a resolver pre-loaded with the given brands.
func NewInMemoryBrandResolver(brands []models.Brand) *InMemoryBrandResolver {
	m := make(map[string]models.Brand, len(brands))
	for _, b := range brands {
		m[b.Domain] = b
	}
	return &InMemoryBrandResolver{brands: m}
}

// BrandByDomain returns the brand for the given domain.
func (r *InMemoryBrandResolver) BrandByDomain(domain string) (models.Brand, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	b, ok := r.brands[domain]
	return b, ok
}

// SetBrand upserts a brand in the resolver (useful for hot-reloading).
func (r *InMemoryBrandResolver) SetBrand(brand models.Brand) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.brands[brand.Domain] = brand
}

// BrandMiddleware extracts the brand from the request Host header, resolves it
// via the BrandResolver, and stores both the full Brand object and the brand ID
// in the context. Returns 400 if the host does not map to a known brand.
func BrandMiddleware(resolver BrandResolver) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			host := r.Host

			brand, ok := resolver.BrandByDomain(host)
			if !ok {
				httperr.WriteError(w, http.StatusBadRequest,
					httperr.BadRequest("unknown brand for host: "+host))
				return
			}

			ctx := models.BrandContextSet(r.Context(), brand)
			ctx = context.WithValue(ctx, brandIDKey{}, brand.ID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// BrandID is a simpler middleware that reads brand from an X-Brand-ID header
// (useful for internal service-to-service calls).
func BrandID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		brandHeader := r.Header.Get(BrandIDHeader)
		if brandHeader != "" {
			if id, err := uuid.Parse(brandHeader); err == nil {
				ctx := context.WithValue(r.Context(), brandIDKey{}, id)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

// GetBrandID extracts the brand ID from a context.
func GetBrandID(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(brandIDKey{}).(uuid.UUID)
	return id, ok
}
