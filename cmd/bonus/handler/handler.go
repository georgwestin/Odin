package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/odin-platform/odin/cmd/bonus/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/httperr"
	"github.com/odin-platform/odin/internal/kafka"
)

// Handler contains the HTTP handlers for the bonus service.
type Handler struct {
	svc    *service.Service
	logger *slog.Logger
}

// New creates a new bonus handler.
func New(svc *service.Service, logger *slog.Logger) *Handler {
	return &Handler{svc: svc, logger: logger}
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// ListBonuses returns all bonuses for the authenticated player.
func (h *Handler) ListBonuses(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("missing claims"))
		return
	}

	bonuses, err := h.svc.ListBonuses(r.Context(), claims.PlayerID, claims.BrandID)
	if err != nil {
		if errors.Is(err, httperr.ErrSelfExcluded) {
			httperr.WriteError(w, http.StatusForbidden, httperr.Forbidden("player is self-excluded"))
			return
		}
		h.logger.Error("list bonuses failed", "error", err)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to list bonuses"))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"bonuses": bonuses})
}

// ClaimBonusRequest is the request body for claiming a bonus.
type ClaimBonusRequest struct {
	BonusID string `json:"bonus_id"`
}

// ClaimBonus claims a pending bonus for the authenticated player.
func (h *Handler) ClaimBonus(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("missing claims"))
		return
	}

	var req ClaimBonusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	bonusID, err := uuid.Parse(req.BonusID)
	if err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid bonus_id"))
		return
	}

	bonus, err := h.svc.ClaimBonus(r.Context(), claims.PlayerID, claims.BrandID, bonusID)
	if err != nil {
		switch {
		case errors.Is(err, httperr.ErrSelfExcluded):
			httperr.WriteError(w, http.StatusForbidden, httperr.Forbidden("player is self-excluded"))
		case errors.Is(err, httperr.ErrCoolingOff):
			httperr.WriteError(w, http.StatusForbidden, httperr.Forbidden("player is in cooling-off period"))
		case errors.Is(err, httperr.ErrNotFound):
			httperr.WriteError(w, http.StatusNotFound, httperr.NotFound("bonus not found"))
		case errors.Is(err, httperr.ErrForbidden):
			httperr.WriteError(w, http.StatusForbidden, httperr.Forbidden("bonus does not belong to player"))
		case errors.Is(err, httperr.ErrConflict):
			httperr.WriteError(w, http.StatusConflict, httperr.Conflict(err.Error()))
		default:
			h.logger.Error("claim bonus failed", "error", err)
			httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to claim bonus"))
		}
		return
	}

	writeJSON(w, http.StatusOK, bonus)
}

// GetLimits returns all responsible gambling limits for the authenticated player.
func (h *Handler) GetLimits(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("missing claims"))
		return
	}

	limits, err := h.svc.GetLimits(r.Context(), claims.PlayerID, claims.BrandID)
	if err != nil {
		h.logger.Error("get limits failed", "error", err)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to get limits"))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"limits": limits})
}

// SetLimitsRequest is the request body for setting a responsible gambling limit.
type SetLimitsRequest struct {
	LimitType string `json:"limit_type"` // deposit, loss, wager, session
	Period    string `json:"period"`     // daily, weekly, monthly
	Amount    string `json:"amount"`
}

// SetLimits creates or updates a responsible gambling limit.
func (h *Handler) SetLimits(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("missing claims"))
		return
	}

	var req SetLimitsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	if req.LimitType == "" || req.Period == "" || req.Amount == "" {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("limit_type, period, and amount are required"))
		return
	}

	err := h.svc.SetLimit(r.Context(), claims.PlayerID, claims.BrandID, req.LimitType, req.Period, req.Amount)
	if err != nil {
		switch {
		case errors.Is(err, httperr.ErrInvalidInput):
			httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest(err.Error()))
		case errors.Is(err, httperr.ErrSelfExcluded):
			httperr.WriteError(w, http.StatusForbidden, httperr.Forbidden("player is self-excluded"))
		default:
			h.logger.Error("set limit failed", "error", err)
			httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to set limit"))
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// CoolingOffRequest is the request body for starting a cooling-off period.
type CoolingOffRequest struct {
	DurationHours int    `json:"duration_hours"`
	Reason        string `json:"reason"`
}

// CoolingOff starts a temporary cooling-off period.
func (h *Handler) CoolingOff(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("missing claims"))
		return
	}

	var req CoolingOffRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	if req.DurationHours <= 0 {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("duration_hours must be positive"))
		return
	}

	duration := time.Duration(req.DurationHours) * time.Hour

	err := h.svc.CoolingOff(r.Context(), claims.PlayerID, claims.BrandID, duration, req.Reason)
	if err != nil {
		switch {
		case errors.Is(err, httperr.ErrInvalidInput):
			httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest(err.Error()))
		case errors.Is(err, httperr.ErrSelfExcluded):
			httperr.WriteError(w, http.StatusForbidden, httperr.Forbidden("player is self-excluded"))
		case errors.Is(err, httperr.ErrConflict):
			httperr.WriteError(w, http.StatusConflict, httperr.Conflict(err.Error()))
		default:
			h.logger.Error("cooling-off failed", "error", err)
			httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to set cooling-off"))
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "cooling-off started"})
}

// SelfExcludeRequest is the request body for self-exclusion.
type SelfExcludeRequest struct {
	Reason string `json:"reason"`
}

// SelfExclude permanently self-excludes the player from the brand.
func (h *Handler) SelfExclude(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("missing claims"))
		return
	}

	var req SelfExcludeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	err := h.svc.SelfExclude(r.Context(), claims.PlayerID, claims.BrandID, req.Reason)
	if err != nil {
		switch {
		case errors.Is(err, httperr.ErrConflict):
			httperr.WriteError(w, http.StatusConflict, httperr.Conflict("player is already self-excluded"))
		default:
			h.logger.Error("self-exclude failed", "error", err)
			httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to self-exclude"))
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "self-excluded"})
}

// ConsumerHandler handles Kafka messages for the bonus service.
type ConsumerHandler struct {
	svc    *service.Service
	logger *slog.Logger
}

// NewConsumerHandler creates a new consumer handler.
func NewConsumerHandler(svc *service.Service, logger *slog.Logger) *ConsumerHandler {
	return &ConsumerHandler{svc: svc, logger: logger}
}

// BetPlacedMessage is the Kafka message structure for bet.placed events.
type BetPlacedMessage struct {
	PlayerID string `json:"player_id"`
	Stake    string `json:"stake"`
}

// HandleBetPlaced processes bet.placed Kafka messages to update wagering progress.
func (c *ConsumerHandler) HandleBetPlaced(ctx context.Context, msg kafka.Message) error {
	var bet BetPlacedMessage
	if err := json.Unmarshal(msg.Value, &bet); err != nil {
		c.logger.Error("unmarshal bet.placed message", "error", err)
		return err
	}

	playerID, err := uuid.Parse(bet.PlayerID)
	if err != nil {
		c.logger.Error("invalid player_id in bet.placed", "player_id", bet.PlayerID, "error", err)
		return err
	}

	return c.svc.UpdateWagerProgress(ctx, playerID, bet.Stake)
}

// BetSettledMessage is the Kafka message structure for bet.settled events.
type BetSettledMessage struct {
	BetID    string `json:"bet_id"`
	PlayerID string `json:"player_id"`
	Result   string `json:"result"`
	Payout   string `json:"payout"`
}

// HandleBetSettled processes bet.settled Kafka messages.
func (c *ConsumerHandler) HandleBetSettled(ctx context.Context, msg kafka.Message) error {
	var bet BetSettledMessage
	if err := json.Unmarshal(msg.Value, &bet); err != nil {
		c.logger.Error("unmarshal bet.settled message", "error", err)
		return err
	}

	c.logger.Info("bet settled",
		"bet_id", bet.BetID,
		"player_id", bet.PlayerID,
		"result", bet.Result,
		"payout", bet.Payout,
	)

	return nil
}
