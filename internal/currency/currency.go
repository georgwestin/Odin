package currency

import (
	"fmt"
	"math/big"
	"sync"
)

// MultiAmount represents an amount expressed in all four platform currencies.
type MultiAmount struct {
	BaseAmount      string `json:"base_amount" db:"base_amount"`
	BaseCurrency    string `json:"base_currency" db:"base_currency"`
	PlayerAmount    string `json:"player_amount" db:"player_amount"`
	PlayerCurrency  string `json:"player_currency" db:"player_currency"`
	ReportAmount    string `json:"report_amount" db:"report_amount"`
	ReportCurrency  string `json:"report_currency" db:"report_currency"`
	BetAmount       string `json:"bet_amount,omitempty" db:"bet_amount"`
	BetCurrency     string `json:"bet_currency,omitempty" db:"bet_currency"`
}

// BrandCurrencyConfig holds the currency settings for a brand.
type BrandCurrencyConfig struct {
	BaseCurrency      string `json:"base_currency"`
	ReportingCurrency string `json:"reporting_currency"`
}

// Rate represents an exchange rate from one currency to another.
type Rate struct {
	From string
	To   string
	Rate *big.Float
}

// Converter handles currency conversion using configurable exchange rates.
type Converter struct {
	mu    sync.RWMutex
	rates map[string]*big.Float // key: "EUR/SEK", value: rate
}

// NewConverter creates a new currency converter with default rates.
func NewConverter() *Converter {
	c := &Converter{
		rates: make(map[string]*big.Float),
	}
	// Seed with common iGaming rates (these should be updated from a feed in production).
	c.SetRate("EUR", "EUR", "1")
	c.SetRate("SEK", "SEK", "1")
	c.SetRate("USD", "USD", "1")
	c.SetRate("GBP", "GBP", "1")
	c.SetRate("NOK", "NOK", "1")
	c.SetRate("DKK", "DKK", "1")

	c.SetRate("EUR", "SEK", "11.49")
	c.SetRate("SEK", "EUR", "0.087")
	c.SetRate("EUR", "USD", "1.08")
	c.SetRate("USD", "EUR", "0.926")
	c.SetRate("EUR", "GBP", "0.856")
	c.SetRate("GBP", "EUR", "1.168")
	c.SetRate("EUR", "NOK", "11.72")
	c.SetRate("NOK", "EUR", "0.0853")
	c.SetRate("EUR", "DKK", "7.46")
	c.SetRate("DKK", "EUR", "0.134")

	c.SetRate("SEK", "USD", "0.094")
	c.SetRate("USD", "SEK", "10.64")
	c.SetRate("SEK", "GBP", "0.074")
	c.SetRate("GBP", "SEK", "13.52")
	c.SetRate("SEK", "NOK", "1.02")
	c.SetRate("NOK", "SEK", "0.98")
	c.SetRate("SEK", "DKK", "0.649")
	c.SetRate("DKK", "SEK", "1.541")

	c.SetRate("USD", "GBP", "0.793")
	c.SetRate("GBP", "USD", "1.261")
	c.SetRate("USD", "NOK", "10.85")
	c.SetRate("NOK", "USD", "0.0922")
	c.SetRate("USD", "DKK", "6.91")
	c.SetRate("DKK", "USD", "0.145")

	c.SetRate("GBP", "NOK", "13.69")
	c.SetRate("NOK", "GBP", "0.073")
	c.SetRate("GBP", "DKK", "8.71")
	c.SetRate("DKK", "GBP", "0.115")

	c.SetRate("NOK", "DKK", "0.636")
	c.SetRate("DKK", "NOK", "1.572")

	return c
}

// SetRate sets the exchange rate from one currency to another.
func (c *Converter) SetRate(from, to, rate string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	r := new(big.Float)
	r.SetPrec(128)
	r.SetString(rate)
	c.rates[rateKey(from, to)] = r
}

// Convert converts an amount from one currency to another.
func (c *Converter) Convert(amount, from, to string) (string, error) {
	if from == to {
		return amount, nil
	}

	c.mu.RLock()
	rate, ok := c.rates[rateKey(from, to)]
	c.mu.RUnlock()

	if !ok {
		return "", fmt.Errorf("no exchange rate found for %s/%s", from, to)
	}

	amt := new(big.Float)
	amt.SetPrec(128)
	if _, ok := amt.SetString(amount); !ok {
		return "", fmt.Errorf("invalid amount: %s", amount)
	}

	result := new(big.Float).SetPrec(128)
	result.Mul(amt, rate)

	return result.Text('f', 4), nil
}

// BuildMultiAmount converts a source amount into all four currency representations.
// sourceCurrency is the currency of the input amount.
// betCurrency can be empty if not applicable (non-bet transactions).
func (c *Converter) BuildMultiAmount(
	amount string,
	sourceCurrency string,
	brandConfig BrandCurrencyConfig,
	playerCurrency string,
	betCurrency string,
) (*MultiAmount, error) {
	ma := &MultiAmount{}

	// Convert to base currency
	baseAmt, err := c.Convert(amount, sourceCurrency, brandConfig.BaseCurrency)
	if err != nil {
		return nil, fmt.Errorf("convert to base currency: %w", err)
	}
	ma.BaseAmount = baseAmt
	ma.BaseCurrency = brandConfig.BaseCurrency

	// Convert to player currency
	playerAmt, err := c.Convert(amount, sourceCurrency, playerCurrency)
	if err != nil {
		return nil, fmt.Errorf("convert to player currency: %w", err)
	}
	ma.PlayerAmount = playerAmt
	ma.PlayerCurrency = playerCurrency

	// Convert to reporting currency
	reportAmt, err := c.Convert(amount, sourceCurrency, brandConfig.ReportingCurrency)
	if err != nil {
		return nil, fmt.Errorf("convert to reporting currency: %w", err)
	}
	ma.ReportAmount = reportAmt
	ma.ReportCurrency = brandConfig.ReportingCurrency

	// Convert to bet currency (if applicable)
	if betCurrency != "" {
		betAmt, err := c.Convert(amount, sourceCurrency, betCurrency)
		if err != nil {
			return nil, fmt.Errorf("convert to bet currency: %w", err)
		}
		ma.BetAmount = betAmt
		ma.BetCurrency = betCurrency
	}

	return ma, nil
}

func rateKey(from, to string) string {
	return from + "/" + to
}
