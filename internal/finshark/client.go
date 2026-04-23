package finshark

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const (
	defaultBaseURL = "https://api.finshark.io"
	defaultAuthURL = "https://auth.finshark.io/connect/token"
	tokenBuffer    = 60 * time.Second // refresh token 60s before expiry
)

// Client is a thread-safe FinShark API client with automatic token management.
type Client struct {
	httpClient   *http.Client
	clientID     string
	clientSecret string
	baseURL      string
	authURL      string

	mu          sync.RWMutex
	token       string
	tokenExpiry time.Time
}

// NewClient creates a new FinShark API client with default URLs.
func NewClient(clientID, clientSecret string) *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		clientID:     clientID,
		clientSecret: clientSecret,
		baseURL:      defaultBaseURL,
		authURL:      defaultAuthURL,
	}
}

// NewClientWithURLs creates a new FinShark API client with custom base and auth URLs.
func NewClientWithURLs(clientID, clientSecret, baseURL, authURL string) *Client {
	c := NewClient(clientID, clientSecret)
	if baseURL != "" {
		c.baseURL = strings.TrimRight(baseURL, "/")
	}
	if authURL != "" {
		c.authURL = authURL
	}
	return c
}

// authenticate performs a client_credentials OAuth2 token exchange and caches
// the resulting access token.
func (c *Client) authenticate(ctx context.Context) error {
	data := url.Values{
		"grant_type":    {"client_credentials"},
		"client_id":     {c.clientID},
		"client_secret": {c.clientSecret},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.authURL, strings.NewReader(data.Encode()))
	if err != nil {
		return fmt.Errorf("finshark: build auth request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("finshark: auth request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("finshark: auth failed with status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return fmt.Errorf("finshark: decode auth response: %w", err)
	}

	c.mu.Lock()
	c.token = tokenResp.AccessToken
	c.tokenExpiry = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
	c.mu.Unlock()

	return nil
}

// getToken returns a valid access token, refreshing if expired or about to expire.
func (c *Client) getToken(ctx context.Context) (string, error) {
	c.mu.RLock()
	token := c.token
	expiry := c.tokenExpiry
	c.mu.RUnlock()

	if token != "" && time.Now().Before(expiry.Add(-tokenBuffer)) {
		return token, nil
	}

	if err := c.authenticate(ctx); err != nil {
		return "", err
	}

	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.token, nil
}

// doRequest executes an authenticated HTTP request. On 401 it retries once
// after re-authenticating.
func (c *Client) doRequest(ctx context.Context, method, path string, body interface{}) ([]byte, int, error) {
	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, 0, fmt.Errorf("finshark: marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(jsonBody)
	}

	reqURL := c.baseURL + path

	for attempt := 0; attempt < 2; attempt++ {
		token, err := c.getToken(ctx)
		if err != nil {
			return nil, 0, err
		}

		// Reset body reader for retry.
		if body != nil && attempt > 0 {
			jsonBody, _ := json.Marshal(body)
			bodyReader = bytes.NewReader(jsonBody)
		}

		req, err := http.NewRequestWithContext(ctx, method, reqURL, bodyReader)
		if err != nil {
			return nil, 0, fmt.Errorf("finshark: build request: %w", err)
		}
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")

		resp, err := c.httpClient.Do(req)
		if err != nil {
			return nil, 0, fmt.Errorf("finshark: request %s %s: %w", method, path, err)
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return nil, resp.StatusCode, fmt.Errorf("finshark: read response body: %w", err)
		}

		// Retry on 401 (token may have been revoked or expired between check and use).
		if resp.StatusCode == http.StatusUnauthorized && attempt == 0 {
			c.mu.Lock()
			c.token = ""
			c.tokenExpiry = time.Time{}
			c.mu.Unlock()
			continue
		}

		return respBody, resp.StatusCode, nil
	}

	return nil, 0, fmt.Errorf("finshark: request failed after retry")
}

// CreatePayment creates a new payment request.
func (c *Client) CreatePayment(ctx context.Context, req CreatePaymentRequest) (*PaymentResponse, error) {
	body, status, err := c.doRequest(ctx, http.MethodPost, "/v1/payments", req)
	if err != nil {
		return nil, err
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("finshark: create payment returned status %d: %s", status, string(body))
	}

	var resp PaymentResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("finshark: decode create payment response: %w", err)
	}
	return &resp, nil
}

// GetPayment retrieves the current status of a payment.
func (c *Client) GetPayment(ctx context.Context, id string) (*PaymentResponse, error) {
	body, status, err := c.doRequest(ctx, http.MethodGet, "/v1/payments/"+id, nil)
	if err != nil {
		return nil, err
	}
	if status == http.StatusNotFound {
		return nil, fmt.Errorf("finshark: payment %s not found", id)
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("finshark: get payment returned status %d: %s", status, string(body))
	}

	var resp PaymentResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("finshark: decode get payment response: %w", err)
	}
	return &resp, nil
}

// GetPaymentDetails retrieves payment details including SCA method information.
func (c *Client) GetPaymentDetails(ctx context.Context, id string) (*PaymentDetailsResponse, error) {
	body, status, err := c.doRequest(ctx, http.MethodGet, "/v1/payments/"+id+"/details", nil)
	if err != nil {
		return nil, err
	}
	if status == http.StatusNotFound {
		return nil, fmt.Errorf("finshark: payment %s not found", id)
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("finshark: get payment details returned status %d: %s", status, string(body))
	}

	var resp PaymentDetailsResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("finshark: decode payment details response: %w", err)
	}
	return &resp, nil
}

// RefundPayment initiates a refund for a completed payment.
// If amount is nil, the full payment amount is refunded.
func (c *Client) RefundPayment(ctx context.Context, id string, amount *PaymentAmount) (*PaymentResponse, error) {
	var reqBody interface{}
	if amount != nil {
		reqBody = RefundRequest{Amount: amount}
	}

	body, status, err := c.doRequest(ctx, http.MethodPost, "/v1/payments/"+id+"/refund", reqBody)
	if err != nil {
		return nil, err
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("finshark: refund payment returned status %d: %s", status, string(body))
	}

	var resp PaymentResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("finshark: decode refund response: %w", err)
	}
	return &resp, nil
}

// RegisterWebhook registers a new webhook for the given event.
func (c *Client) RegisterWebhook(ctx context.Context, event, webhookURL string) (*WebhookResponse, error) {
	req := CreateWebhookRequest{
		Event: event,
		URL:   webhookURL,
	}

	body, status, err := c.doRequest(ctx, http.MethodPost, "/v1/Webhooks", req)
	if err != nil {
		return nil, err
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("finshark: register webhook returned status %d: %s", status, string(body))
	}

	var resp WebhookResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("finshark: decode webhook response: %w", err)
	}
	return &resp, nil
}

// ListWebhooks returns all registered webhooks.
func (c *Client) ListWebhooks(ctx context.Context) ([]WebhookResponse, error) {
	body, status, err := c.doRequest(ctx, http.MethodGet, "/v1/Webhooks", nil)
	if err != nil {
		return nil, err
	}
	if status < 200 || status >= 300 {
		return nil, fmt.Errorf("finshark: list webhooks returned status %d: %s", status, string(body))
	}

	var resp []WebhookResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("finshark: decode list webhooks response: %w", err)
	}
	return resp, nil
}
