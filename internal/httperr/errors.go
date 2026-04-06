package httperr

import (
	"encoding/json"
	"errors"
	"net/http"
)

// Sentinel errors for service-layer use.
var (
	ErrNotFound      = errors.New("not found")
	ErrConflict      = errors.New("conflict")
	ErrForbidden     = errors.New("forbidden")
	ErrInvalidInput  = errors.New("invalid input")
	ErrSelfExcluded  = errors.New("player is self-excluded")
	ErrCoolingOff    = errors.New("player is in cooling-off period")
	ErrLimitExceeded = errors.New("limit exceeded")
)

// ErrorResponse is the standardized JSON error payload returned by all services.
type ErrorResponse struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"request_id,omitempty"`
}

// WriteError serialises resp as JSON and writes it with the given HTTP status.
func WriteError(w http.ResponseWriter, statusCode int, resp ErrorResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(resp)
}

// BadRequest returns a 400-style error response.
func BadRequest(message string) ErrorResponse {
	return ErrorResponse{Code: "BAD_REQUEST", Message: message}
}

// Unauthorized returns a 401-style error response.
func Unauthorized(message string) ErrorResponse {
	return ErrorResponse{Code: "UNAUTHORIZED", Message: message}
}

// Forbidden returns a 403-style error response.
func Forbidden(message string) ErrorResponse {
	return ErrorResponse{Code: "FORBIDDEN", Message: message}
}

// NotFound returns a 404-style error response.
func NotFound(message string) ErrorResponse {
	return ErrorResponse{Code: "NOT_FOUND", Message: message}
}

// Conflict returns a 409-style error response.
func Conflict(message string) ErrorResponse {
	return ErrorResponse{Code: "CONFLICT", Message: message}
}

// InternalError returns a 500-style error response.
func InternalError(message string) ErrorResponse {
	return ErrorResponse{Code: "INTERNAL_ERROR", Message: message}
}

// InsufficientBalance returns a 422-style error response for wallet operations.
func InsufficientBalance(message string) ErrorResponse {
	return ErrorResponse{Code: "INSUFFICIENT_BALANCE", Message: message}
}

// WithRequestID returns a copy of the error response with the request ID set.
func (e ErrorResponse) WithRequestID(requestID string) ErrorResponse {
	e.RequestID = requestID
	return e
}
