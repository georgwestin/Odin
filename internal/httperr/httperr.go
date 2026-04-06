package httperr

import (
	"encoding/json"
	"net/http"
)

// Write sends a JSON error response with the given status and message.
// This is a convenience wrapper for code that doesn't need the full
// ErrorResponse builder pattern.
func Write(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(ErrorResponse{Code: http.StatusText(status), Message: message})
}

// WriteWithCode sends a JSON error response with a custom code.
func WriteWithCode(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(ErrorResponse{Code: code, Message: message})
}

// WriteValidation sends a 422 validation error. The details map keys should
// be field names and values should be human-readable error descriptions.
func WriteValidation(w http.ResponseWriter, details map[string]string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusUnprocessableEntity)

	type validationResponse struct {
		Code    string            `json:"code"`
		Message string            `json:"message"`
		Details map[string]string `json:"details,omitempty"`
	}

	_ = json.NewEncoder(w).Encode(validationResponse{
		Code:    "VALIDATION_ERROR",
		Message: "validation failed",
		Details: details,
	})
}

// TooManyRequests sends a 429 error response.
func TooManyRequests(w http.ResponseWriter, message string) {
	WriteWithCode(w, http.StatusTooManyRequests, "RATE_LIMITED", message)
}
