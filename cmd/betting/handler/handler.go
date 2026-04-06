package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/betting/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/httperr"
)

type Handler struct {
	svc    *service.Service
	logger *zap.Logger
}

func New(svc *service.Service, logger *zap.Logger) *Handler {
	return &Handler{svc: svc, logger: logger}
}

// PlaceBet handles POST /bets.
func (h *Handler) PlaceBet(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.Write(w, http.StatusUnauthorized, "authentication required")
		return
	}

	var req service.PlaceBetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.Write(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Stake == "" {
		httperr.WriteValidation(w, map[string]string{"stake": "required"})
		return
	}
	if len(req.Selections) == 0 {
		httperr.WriteValidation(w, map[string]string{"selections": "at least one selection required"})
		return
	}
	if req.BetType == "" {
		httperr.WriteValidation(w, map[string]string{"bet_type": "required"})
		return
	}
	if req.Currency == "" {
		httperr.WriteValidation(w, map[string]string{"currency": "required"})
		return
	}

	for i, sel := range req.Selections {
		errs := make(map[string]string)
		if sel.EventID == "" {
			errs["selections."+strconv.Itoa(i)+".event_id"] = "required"
		}
		if sel.MarketID == "" {
			errs["selections."+strconv.Itoa(i)+".market_id"] = "required"
		}
		if sel.OutcomeID == "" {
			errs["selections."+strconv.Itoa(i)+".outcome_id"] = "required"
		}
		if sel.Odds == "" {
			errs["selections."+strconv.Itoa(i)+".odds"] = "required"
		}
		if len(errs) > 0 {
			httperr.WriteValidation(w, errs)
			return
		}
	}

	bet, err := h.svc.PlaceBet(r.Context(), claims.PlayerID, claims.BrandID, req)
	if err != nil {
		h.logger.Error("place bet failed",
			zap.String("player_id", claims.PlayerID.String()),
			zap.Error(err),
		)
		httperr.WriteWithCode(w, http.StatusUnprocessableEntity, "BET_ERROR", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(bet)
}

// GetBets handles GET /bets.
func (h *Handler) GetBets(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.Write(w, http.StatusUnauthorized, "authentication required")
		return
	}

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

	bets, total, err := h.svc.ListBets(r.Context(), claims.PlayerID, limit, offset)
	if err != nil {
		h.logger.Error("list bets failed",
			zap.String("player_id", claims.PlayerID.String()),
			zap.Error(err),
		)
		httperr.Write(w, http.StatusInternalServerError, "internal server error")
		return
	}

	resp := PaginatedResponse{
		Data:   bets,
		Total:  total,
		Limit:  limit,
		Offset: offset,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GetBet handles GET /bets/{id}.
func (h *Handler) GetBet(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.Write(w, http.StatusUnauthorized, "authentication required")
		return
	}

	betID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httperr.Write(w, http.StatusBadRequest, "invalid bet id")
		return
	}

	bet, err := h.svc.GetBet(r.Context(), betID, claims.PlayerID)
	if err != nil {
		h.logger.Error("get bet failed",
			zap.String("bet_id", betID.String()),
			zap.Error(err),
		)
		httperr.Write(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if bet == nil {
		httperr.Write(w, http.StatusNotFound, "bet not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bet)
}

// Cashout handles POST /bets/{id}/cashout.
func (h *Handler) Cashout(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.Write(w, http.StatusUnauthorized, "authentication required")
		return
	}

	betID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httperr.Write(w, http.StatusBadRequest, "invalid bet id")
		return
	}

	bet, err := h.svc.Cashout(r.Context(), betID, claims.PlayerID)
	if err != nil {
		h.logger.Error("cashout failed",
			zap.String("bet_id", betID.String()),
			zap.Error(err),
		)
		httperr.WriteWithCode(w, http.StatusUnprocessableEntity, "CASHOUT_ERROR", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bet)
}

// SettleBets handles POST /internal/bets/settle (internal only).
func (h *Handler) SettleBets(w http.ResponseWriter, r *http.Request) {
	var msg service.EventResultedMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		httperr.Write(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if msg.EventID == "" {
		httperr.WriteValidation(w, map[string]string{"event_id": "required"})
		return
	}

	if err := h.svc.SettleEvent(r.Context(), msg); err != nil {
		h.logger.Error("settle event failed",
			zap.String("event_id", msg.EventID),
			zap.Error(err),
		)
		httperr.Write(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// PaginatedResponse wraps a list response with pagination metadata.
type PaginatedResponse struct {
	Data   interface{} `json:"data"`
	Total  int         `json:"total"`
	Limit  int         `json:"limit"`
	Offset int         `json:"offset"`
}
