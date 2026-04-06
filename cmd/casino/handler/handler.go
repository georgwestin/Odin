package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/casino/provider"
	"github.com/odin-platform/odin/cmd/casino/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/httperr"
)

type Handler struct {
	svc      *service.Service
	registry *provider.Registry
	logger   *zap.Logger
}

func New(svc *service.Service, registry *provider.Registry, logger *zap.Logger) *Handler {
	return &Handler{svc: svc, registry: registry, logger: logger}
}

// ListGames handles GET /casino/games.
func (h *Handler) ListGames(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.Write(w, http.StatusUnauthorized, "authentication required")
		return
	}

	providerFilter := r.URL.Query().Get("provider")
	categoryFilter := r.URL.Query().Get("category")

	limit := 20
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	games, total, err := h.svc.ListGames(r.Context(), providerFilter, categoryFilter, limit, offset)
	if err != nil {
		h.logger.Error("list games failed", zap.Error(err))
		httperr.Write(w, http.StatusInternalServerError, "internal server error")
		return
	}

	resp := PaginatedResponse{
		Data:   games,
		Total:  total,
		Limit:  limit,
		Offset: offset,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// CreateSession handles POST /casino/sessions.
func (h *Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.Write(w, http.StatusUnauthorized, "authentication required")
		return
	}

	var req service.CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.Write(w, http.StatusBadRequest, "invalid request body")
		return
	}

	errs := make(map[string]string)
	if req.GameID == "" {
		errs["game_id"] = "required"
	}
	if req.Provider == "" {
		errs["provider"] = "required"
	}
	if req.Currency == "" {
		errs["currency"] = "required"
	}
	if len(errs) > 0 {
		httperr.WriteValidation(w, errs)
		return
	}

	ipAddress := r.RemoteAddr
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		ipAddress = forwarded
	}

	resp, err := h.svc.CreateSession(r.Context(), claims.PlayerID, claims.BrandID, ipAddress, req)
	if err != nil {
		h.logger.Error("create session failed",
			zap.String("player_id", claims.PlayerID.String()),
			zap.Error(err),
		)
		httperr.WriteWithCode(w, http.StatusUnprocessableEntity, "SESSION_ERROR", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// DeleteSession handles DELETE /casino/sessions/{id}.
func (h *Handler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.Write(w, http.StatusUnauthorized, "authentication required")
		return
	}

	sessionID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httperr.Write(w, http.StatusBadRequest, "invalid session id")
		return
	}

	if err := h.svc.EndSession(r.Context(), sessionID, claims.PlayerID); err != nil {
		h.logger.Error("delete session failed",
			zap.String("session_id", sessionID.String()),
			zap.Error(err),
		)
		httperr.WriteWithCode(w, http.StatusUnprocessableEntity, "SESSION_ERROR", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// RGSDebit handles POST /internal/casino/debit (RGS callback with HMAC auth).
func (h *Handler) RGSDebit(w http.ResponseWriter, r *http.Request) {
	providerName, body, err := h.validateHMAC(r)
	if err != nil {
		httperr.Write(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req provider.DebitRequest
	if err := json.Unmarshal(body, &req); err != nil {
		httperr.Write(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.SessionToken == "" || req.RoundRef == "" || req.Amount == "" || req.TransactionID == "" {
		httperr.WriteValidation(w, map[string]string{
			"session_token":  "required",
			"round_ref":      "required",
			"amount":         "required",
			"transaction_id": "required",
		})
		return
	}

	resp, err := h.svc.ProcessDebit(r.Context(), providerName, req)
	if err != nil {
		h.logger.Error("RGS debit failed",
			zap.String("provider", providerName),
			zap.String("round_ref", req.RoundRef),
			zap.Error(err),
		)
		httperr.WriteWithCode(w, http.StatusUnprocessableEntity, "DEBIT_ERROR", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// RGSCredit handles POST /internal/casino/credit (RGS callback with HMAC auth).
func (h *Handler) RGSCredit(w http.ResponseWriter, r *http.Request) {
	providerName, body, err := h.validateHMAC(r)
	if err != nil {
		httperr.Write(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req provider.CreditRequest
	if err := json.Unmarshal(body, &req); err != nil {
		httperr.Write(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.SessionToken == "" || req.RoundRef == "" || req.Amount == "" || req.TransactionID == "" {
		httperr.WriteValidation(w, map[string]string{
			"session_token":  "required",
			"round_ref":      "required",
			"amount":         "required",
			"transaction_id": "required",
		})
		return
	}

	resp, err := h.svc.ProcessCredit(r.Context(), providerName, req)
	if err != nil {
		h.logger.Error("RGS credit failed",
			zap.String("provider", providerName),
			zap.String("round_ref", req.RoundRef),
			zap.Error(err),
		)
		httperr.WriteWithCode(w, http.StatusUnprocessableEntity, "CREDIT_ERROR", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// validateHMAC reads the request body and validates the HMAC-SHA256 signature.
// Returns the provider name and the raw body bytes on success.
func (h *Handler) validateHMAC(r *http.Request) (string, []byte, error) {
	providerName := r.Header.Get("X-Provider")
	if providerName == "" {
		return "", nil, fmt.Errorf("missing X-Provider header")
	}

	signature := r.Header.Get("X-Signature")
	if signature == "" {
		return "", nil, fmt.Errorf("missing X-Signature header")
	}

	prov, ok := h.registry.Get(providerName)
	if !ok {
		return "", nil, fmt.Errorf("unknown provider: %s", providerName)
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		return "", nil, fmt.Errorf("read request body: %w", err)
	}
	defer r.Body.Close()

	if !prov.ValidateSignature(signature, body) {
		return "", nil, fmt.Errorf("invalid HMAC signature")
	}

	return providerName, body, nil
}

// PaginatedResponse wraps list responses with pagination metadata.
type PaginatedResponse struct {
	Data   interface{} `json:"data"`
	Total  int         `json:"total"`
	Limit  int         `json:"limit"`
	Offset int         `json:"offset"`
}
