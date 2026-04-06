package models

import (
	"context"
)

// brandContextKey is an unexported type to prevent context key collisions.
type brandContextKey struct{}

// BrandConfig holds brand-specific configuration for a white-label instance.
type BrandConfig struct {
	Theme             string            `json:"theme"`
	LogoURL           string            `json:"logo_url"`
	SupportEmail      string            `json:"support_email"`
	DefaultCurrency   string            `json:"default_currency"`
	BaseCurrency      string            `json:"base_currency"`
	ReportingCurrency string            `json:"reporting_currency"`
	AllowedCurrencies []string          `json:"allowed_currencies"`
	AllowedCountries  []string          `json:"allowed_countries"`
	LicenseInfo       string            `json:"license_info"`
}

// CurrencyConfig returns the brand's base and reporting currency settings.
// Falls back to DefaultCurrency if base/reporting are not explicitly set.
func (bc BrandConfig) CurrencyConfig() (baseCurrency, reportingCurrency string) {
	baseCurrency = bc.BaseCurrency
	if baseCurrency == "" {
		baseCurrency = bc.DefaultCurrency
	}
	reportingCurrency = bc.ReportingCurrency
	if reportingCurrency == "" {
		reportingCurrency = baseCurrency
	}
	return
}

// BrandContextSet stores a Brand in the given context.
func BrandContextSet(ctx context.Context, brand Brand) context.Context {
	return context.WithValue(ctx, brandContextKey{}, brand)
}

// BrandFromContext extracts the Brand from the request context.
// Returns the brand and a boolean indicating whether a brand was present.
func BrandFromContext(ctx context.Context) (Brand, bool) {
	brand, ok := ctx.Value(brandContextKey{}).(Brand)
	return brand, ok
}
