package finshark

// Payment status constants as returned by the FinShark API.
const (
	StatusCreated               = "CREATED"
	StatusAuthorizationRequired = "AUTHORIZATION_REQUIRED"
	StatusInProgress            = "IN_PROGRESS"
	StatusAuthorized            = "AUTHORIZED"
	StatusCompleted             = "COMPLETED"
	StatusFailed                = "FAILED"
	StatusRejected              = "REJECTED"
	StatusCanceled              = "CANCELED"
	StatusTimeout               = "TIME_OUT"
)

// SCA method type constants.
const (
	ScaPSURedirect  = "PSU_REDIRECT"
	ScaPSUDecoupled = "PSU_DECOUPLED"
	ScaPSUOTP       = "PSU_OTP"
)

// SCA application constants.
const (
	AppBankID  = "BANK_ID"
	AppNordeaID = "NORDEA_ID"
)

// Remittance information type constants.
const (
	RemittanceUnstructured = "UNSTRUCTURED"
	RemittanceStructured   = "STRUCTURED"
)

// Account type constants.
const (
	AccountTypeIBAN = "IBAN"
	AccountTypeBBAN = "BBAN"
)

// Webhook event constants.
const (
	EventPaymentStatusChanged = "paymentStatusChanged"
	EventPayoutStatusChanged  = "payoutStatusChanged"
)

// Common payment product IDs.
const (
	ProductSEDomesticCreditTransfer = "se-domestic-credit-transfer"
	ProductSESwish                  = "se-swish"
)

// PaymentAmount represents a monetary amount with currency.
type PaymentAmount struct {
	Currency string  `json:"currency"`
	Value    float64 `json:"value"`
}

// PaymentAccount holds bank account details.
type PaymentAccount struct {
	AccountNumber string `json:"accountNumber"`
	AccountType   string `json:"accountType"`
	BIC           string `json:"bic,omitempty"`
	CurrencyCode  string `json:"currencyCode,omitempty"`
}

// Address holds a postal address.
type Address struct {
	Street     string `json:"street,omitempty"`
	City       string `json:"city,omitempty"`
	PostalCode string `json:"postalCode,omitempty"`
	Country    string `json:"country,omitempty"`
}

// PaymentCreditor identifies the payment recipient (merchant).
type PaymentCreditor struct {
	Account PaymentAccount `json:"account"`
	Name    string         `json:"name"`
	Address *Address       `json:"address,omitempty"`
	Message string         `json:"message,omitempty"`
}

// PaymentDebtor identifies the payment sender (player).
type PaymentDebtor struct {
	Account     *PaymentAccount `json:"account,omitempty"`
	Name        string          `json:"name,omitempty"`
	Email       string          `json:"email,omitempty"`
	PhoneNumber string          `json:"phoneNumber,omitempty"`
	Message     string          `json:"message,omitempty"`
}

// PaymentRemittanceInformation holds payment reference information.
type PaymentRemittanceInformation struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

// CreatePaymentRequest is the payload sent to POST /v1/payments.
type CreatePaymentRequest struct {
	Amount                 PaymentAmount                `json:"amount"`
	Creditor               PaymentCreditor              `json:"creditor"`
	Debtor                 *PaymentDebtor               `json:"debtor,omitempty"`
	PaymentProductID       string                       `json:"paymentProductId"`
	Region                 string                       `json:"region"`
	RemittanceInformation  PaymentRemittanceInformation `json:"remittanceInformation"`
	ExternalReference      string                       `json:"externalReference,omitempty"`
	RedirectURL            string                       `json:"redirectUrl,omitempty"`
}

// PaymentResponse is the response from creating or fetching a payment.
type PaymentResponse struct {
	ID                     string                       `json:"id"`
	Status                 string                       `json:"status"`
	ClientID               string                       `json:"clientId,omitempty"`
	Amount                 PaymentAmount                `json:"amount"`
	Creditor               PaymentCreditor              `json:"creditor"`
	Debtor                 *PaymentDebtor               `json:"debtor,omitempty"`
	PaymentProductID       string                       `json:"paymentProductId"`
	Region                 string                       `json:"region"`
	RemittanceInformation  PaymentRemittanceInformation `json:"remittanceInformation"`
	ExternalReference      string                       `json:"externalReference,omitempty"`
}

// ScaMethod describes a Strong Customer Authentication method.
type ScaMethod struct {
	Href          string `json:"href,omitempty"`
	ScaMethodType string `json:"scaMethodType,omitempty"`
	Application   string `json:"application,omitempty"`
	QrCodeData    string `json:"qrCodeData,omitempty"`
	DownloadLink  string `json:"downloadLink,omitempty"`
}

// PaymentDetailsResponse extends PaymentResponse with SCA information.
type PaymentDetailsResponse struct {
	PaymentResponse
	AuthorizationID string      `json:"authorizationId,omitempty"`
	ScaMethods      []ScaMethod `json:"scaMethods,omitempty"`
}

// RefundRequest is the optional payload for POST /v1/payments/{id}/refund.
type RefundRequest struct {
	Amount *PaymentAmount `json:"amount,omitempty"`
}

// CreateWebhookRequest is the payload for POST /v1/Webhooks.
type CreateWebhookRequest struct {
	Event string `json:"event"`
	URL   string `json:"url"`
}

// WebhookResponse is returned when listing or creating webhooks.
type WebhookResponse struct {
	ID       string `json:"id"`
	ClientID string `json:"clientId,omitempty"`
	Event    string `json:"event"`
	URL      string `json:"url"`
}

// WebhookPayload is the body received from FinShark webhook callbacks.
type WebhookPayload struct {
	Event             string `json:"event"`
	PaymentID         string `json:"paymentId"`
	Status            string `json:"status"`
	ExternalReference string `json:"externalReference,omitempty"`
}

// TokenResponse is the OAuth2 token response from the auth endpoint.
type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

// IsTerminalStatus returns true if the payment status is a final state.
func IsTerminalStatus(status string) bool {
	switch status {
	case StatusCompleted, StatusFailed, StatusRejected, StatusCanceled, StatusTimeout:
		return true
	}
	return false
}

// IsSuccessStatus returns true if the payment has been successfully authorized or completed.
func IsSuccessStatus(status string) bool {
	return status == StatusAuthorized || status == StatusCompleted
}
