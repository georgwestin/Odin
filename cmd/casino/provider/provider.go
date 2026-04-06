package provider

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

// LaunchParams contains the parameters needed to create a game launch URL.
type LaunchParams struct {
	GameID       string
	PlayerID     string
	SessionToken string
	Currency     string
	Language     string
	ReturnURL    string
}

// LaunchResult is returned after successfully creating a game session with a provider.
type LaunchResult struct {
	LaunchURL string
	GameID    string
	Provider  string
}

// DebitRequest represents a debit (wager) callback from the RGS provider.
type DebitRequest struct {
	SessionToken  string `json:"session_token"`
	RoundRef      string `json:"round_ref"`
	TransactionID string `json:"transaction_id"`
	Amount        string `json:"amount"`
	Currency      string `json:"currency"`
	GameID        string `json:"game_id"`
}

// CreditRequest represents a credit (win) callback from the RGS provider.
type CreditRequest struct {
	SessionToken  string `json:"session_token"`
	RoundRef      string `json:"round_ref"`
	TransactionID string `json:"transaction_id"`
	Amount        string `json:"amount"`
	Currency      string `json:"currency"`
	GameID        string `json:"game_id"`
	IsRoundEnd    bool   `json:"is_round_end"`
}

// CallbackResponse is returned to the RGS after processing a debit or credit.
type CallbackResponse struct {
	Balance  string `json:"balance"`
	Currency string `json:"currency"`
}

// Provider defines the interface for Remote Gaming Server integrations.
type Provider interface {
	// Name returns the provider identifier (e.g., "generic", "evolution", "pragmatic").
	Name() string

	// LaunchGame creates a game session with the provider and returns a launch URL.
	LaunchGame(ctx context.Context, params LaunchParams) (*LaunchResult, error)

	// ValidateSignature verifies the HMAC-SHA256 signature on a callback request.
	ValidateSignature(signature string, body []byte) bool
}

// GenericProvider is a generic RGS provider adapter.
type GenericProvider struct {
	name      string
	baseURL   string
	apiKey    string
	hmacKey   string
}

// NewGenericProvider creates a generic provider adapter.
func NewGenericProvider(name, baseURL, apiKey, hmacKey string) *GenericProvider {
	return &GenericProvider{
		name:    name,
		baseURL: baseURL,
		apiKey:  apiKey,
		hmacKey: hmacKey,
	}
}

func (p *GenericProvider) Name() string {
	return p.name
}

func (p *GenericProvider) LaunchGame(_ context.Context, params LaunchParams) (*LaunchResult, error) {
	launchURL := fmt.Sprintf("%s/launch?game_id=%s&token=%s&currency=%s&language=%s&return_url=%s",
		p.baseURL,
		params.GameID,
		params.SessionToken,
		params.Currency,
		params.Language,
		params.ReturnURL,
	)

	return &LaunchResult{
		LaunchURL: launchURL,
		GameID:    params.GameID,
		Provider:  p.name,
	}, nil
}

func (p *GenericProvider) ValidateSignature(signature string, body []byte) bool {
	mac := hmac.New(sha256.New, []byte(p.hmacKey))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

// Registry holds all registered providers indexed by name.
type Registry struct {
	providers map[string]Provider
}

// NewRegistry creates a new provider registry.
func NewRegistry() *Registry {
	return &Registry{providers: make(map[string]Provider)}
}

// Register adds a provider to the registry.
func (r *Registry) Register(p Provider) {
	r.providers[p.Name()] = p
}

// Get returns a provider by name.
func (r *Registry) Get(name string) (Provider, bool) {
	p, ok := r.providers[name]
	return p, ok
}

// List returns all registered provider names.
func (r *Registry) List() []string {
	names := make([]string, 0, len(r.providers))
	for name := range r.providers {
		names = append(names, name)
	}
	return names
}
