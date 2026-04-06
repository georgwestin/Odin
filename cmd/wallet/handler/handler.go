package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/wallet/repository"
	"github.com/odin-platform/odin/cmd/wallet/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/httperr"
	"github.com/odin-platform/odin/internal/middleware"
)

// Handler holds HTTP handlers for the wallet service.
type Handler struct {
	svc    *service.Service
	logger *zap.Logger
}

// New creates a new Handler.
func New(svc *service.Service, logger *zap.Logger) *Handler {
	return &Handler{svc: svc, logger: logger}
}

// --- Request types ---

type depositRequest struct {
	Amount         string `json:"amount"`
	IdempotencyKey string `json:"idempotency_key"`
	ReferenceID    string `json:"reference_id"`
	Description    string `json:"description"`
}

type withdrawRequest struct {
	Amount         string `json:"amount"`
	IdempotencyKey string `json:"idempotency_key"`
	ReferenceID    string `json:"reference_id"`
	Description    string `json:"description"`
}

type transferRequest struct {
	PlayerID       string `json:"player_id"`
	BrandID        string `json:"brand_id"`
	Amount         string `json:"amount"`
	Type           string `json:"type"`
	ReferenceID    string `json:"reference_id"`
	ReferenceType  string `json:"reference_type"`
	IdempotencyKey string `json:"idempotency_key"`
	Description    string `json:"description"`
}

type createWalletRequest struct {
	PlayerID string `json:"player_id"`
	BrandID  string `json:"brand_id"`
	Currency string `json:"currency"`
}

// --- Handlers ---

// Balance handles GET /wallet/balance.
func (h *Handler) Balance(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("missing authentication"))
		return
	}

	brandID, _ := middleware.GetBrandID(r.Context())

	wallet, err := h.svc.GetBalance(r.Context(), claims.PlayerID, brandID)
	if err != nil {
		if errors.Is(err, httperr.ErrNotFound) {
			httperr.WriteError(w, http.StatusNotFound, httperr.NotFound("wallet not found"))
			return
		}
		h.logger.Error("get balance failed", zap.Error(err))
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("internal server error"))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"balance":        wallet.Balance,
		"bonus_balance":  wallet.BonusBalance,
		"locked_balance": wallet.LockedBalance,
		"currency":       wallet.Currency,
	})
}

// Transactions handles GET /wallet/transactions with cursor-based pagination.
func (h *Handler) Transactions(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("missing authentication"))
		return
	}

	brandID, _ := middleware.GetBrandID(r.Context())

	// Parse pagination parameters.
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	var cursor *repository.TransactionCursor
	if c := r.URL.Query().Get("cursor"); c != "" {
		parsed, err := parseCursor(c)
		if err != nil {
			httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid cursor format"))
			return
		}
		cursor = parsed
	}

	result, err := h.svc.ListTransactions(r.Context(), &service.TransactionListRequest{
		PlayerID: claims.PlayerID,
		BrandID:  brandID,
		Cursor:   cursor,
		Limit:    limit,
	})
	if err != nil {
		if errors.Is(err, httperr.ErrNotFound) {
			httperr.WriteError(w, http.StatusNotFound, httperr.NotFound("wallet not found"))
			return
		}
		h.logger.Error("list transactions failed", zap.Error(err))
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("internal server error"))
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// Deposit handles POST /wallet/deposit.
func (h *Handler) Deposit(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("missing authentication"))
		return
	}

	var req depositRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	if err := validateAmount(req.Amount); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest(err.Error()))
		return
	}
	if req.IdempotencyKey == "" {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("idempotency_key is required"))
		return
	}

	brandID, _ := middleware.GetBrandID(r.Context())

	result, err := h.svc.Deposit(r.Context(), &service.MutationRequest{
		PlayerID:       claims.PlayerID,
		BrandID:        brandID,
		Amount:         req.Amount,
		ReferenceID:    req.ReferenceID,
		ReferenceType:  "deposit",
		IdempotencyKey: req.IdempotencyKey,
		Description:    req.Description,
	})
	if err != nil {
		h.handleMutationError(w, err, "deposit")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// Withdraw handles POST /wallet/withdraw.
func (h *Handler) Withdraw(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("missing authentication"))
		return
	}

	var req withdrawRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	if err := validateAmount(req.Amount); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest(err.Error()))
		return
	}
	if req.IdempotencyKey == "" {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("idempotency_key is required"))
		return
	}

	brandID, _ := middleware.GetBrandID(r.Context())

	result, err := h.svc.Withdraw(r.Context(), &service.MutationRequest{
		PlayerID:       claims.PlayerID,
		BrandID:        brandID,
		Amount:         req.Amount,
		ReferenceID:    req.ReferenceID,
		ReferenceType:  "withdrawal",
		IdempotencyKey: req.IdempotencyKey,
		Description:    req.Description,
	})
	if err != nil {
		h.handleMutationError(w, err, "withdraw")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// TransferDebit handles POST /wallet/transfer/debit (internal only).
func (h *Handler) TransferDebit(w http.ResponseWriter, r *http.Request) {
	var req transferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	if err := validateTransferRequest(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest(err.Error()))
		return
	}

	playerID, _ := uuid.Parse(req.PlayerID)
	brandID, _ := uuid.Parse(req.BrandID)

	result, err := h.svc.Debit(r.Context(), &service.MutationRequest{
		PlayerID:       playerID,
		BrandID:        brandID,
		Amount:         req.Amount,
		Type:           req.Type,
		ReferenceID:    req.ReferenceID,
		ReferenceType:  req.ReferenceType,
		IdempotencyKey: req.IdempotencyKey,
		Description:    req.Description,
	})
	if err != nil {
		h.handleMutationError(w, err, "debit")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// TransferCredit handles POST /wallet/transfer/credit (internal only).
func (h *Handler) TransferCredit(w http.ResponseWriter, r *http.Request) {
	var req transferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	if err := validateTransferRequest(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest(err.Error()))
		return
	}

	playerID, _ := uuid.Parse(req.PlayerID)
	brandID, _ := uuid.Parse(req.BrandID)

	result, err := h.svc.Credit(r.Context(), &service.MutationRequest{
		PlayerID:       playerID,
		BrandID:        brandID,
		Amount:         req.Amount,
		Type:           req.Type,
		ReferenceID:    req.ReferenceID,
		ReferenceType:  req.ReferenceType,
		IdempotencyKey: req.IdempotencyKey,
		Description:    req.Description,
	})
	if err != nil {
		h.handleMutationError(w, err, "credit")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// CreateWallet handles POST /wallet/internal/create (internal only).
func (h *Handler) CreateWallet(w http.ResponseWriter, r *http.Request) {
	var req createWalletRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	playerID, err := uuid.Parse(req.PlayerID)
	if err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid player_id"))
		return
	}
	brandID, err := uuid.Parse(req.BrandID)
	if err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid brand_id"))
		return
	}
	if req.Currency == "" || len(req.Currency) != 3 {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("currency must be a 3-letter ISO code"))
		return
	}

	wallet, err := h.svc.CreateWallet(r.Context(), playerID, brandID, strings.ToUpper(req.Currency))
	if err != nil {
		h.logger.Error("create wallet failed", zap.Error(err))
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("internal server error"))
		return
	}

	writeJSON(w, http.StatusCreated, wallet)
}

// --- Helpers ---

func (h *Handler) handleMutationError(w http.ResponseWriter, err error, operation string) {
	switch {
	case errors.Is(err, httperr.ErrNotFound):
		httperr.WriteError(w, http.StatusNotFound, httperr.NotFound("wallet not found"))
	case errors.Is(err, httperr.ErrForbidden):
		httperr.WriteError(w, http.StatusForbidden, httperr.Forbidden("KYC approval required for withdrawals"))
	case errors.Is(err, httperr.ErrLimitExceeded):
		httperr.WriteError(w, http.StatusUnprocessableEntity, httperr.InsufficientBalance("insufficient funds or limit exceeded"))
	case errors.Is(err, httperr.ErrInvalidInput):
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid input"))
	default:
		h.logger.Error(operation+" failed", zap.Error(err))
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("internal server error"))
	}
}

func validateAmount(amount string) error {
	if amount == "" {
		return fmt.Errorf("amount is required")
	}
	f := new(big.Float)
	if _, ok := f.SetString(amount); !ok {
		return fmt.Errorf("amount must be a valid decimal number")
	}
	if f.Sign() <= 0 {
		return fmt.Errorf("amount must be positive")
	}
	return nil
}

func validateTransferRequest(req *transferRequest) error {
	if _, err := uuid.Parse(req.PlayerID); err != nil {
		return fmt.Errorf("invalid player_id")
	}
	if _, err := uuid.Parse(req.BrandID); err != nil {
		return fmt.Errorf("invalid brand_id")
	}
	if err := validateAmount(req.Amount); err != nil {
		return err
	}
	if req.IdempotencyKey == "" {
		return fmt.Errorf("idempotency_key is required")
	}
	if req.Type == "" {
		return fmt.Errorf("type is required")
	}
	return nil
}

func parseCursor(s string) (*repository.TransactionCursor, error) {
	// Cursor format: RFC3339Nano_UUID
	idx := strings.LastIndex(s, "_")
	if idx < 0 {
		return nil, fmt.Errorf("invalid cursor")
	}
	tsStr := s[:idx]
	idStr := s[idx+1:]

	ts, err := time.Parse(time.RFC3339Nano, tsStr)
	if err != nil {
		return nil, fmt.Errorf("invalid cursor timestamp: %w", err)
	}
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, fmt.Errorf("invalid cursor id: %w", err)
	}
	return &repository.TransactionCursor{
		CreatedAt: ts,
		ID:        id,
	}, nil
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
