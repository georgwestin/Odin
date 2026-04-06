package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/odin-platform/odin/cmd/sportsfeed/service"
	"github.com/odin-platform/odin/internal/httperr"
)

// Handler contains the HTTP handlers for the sportsfeed service.
type Handler struct {
	svc    *service.Service
	logger *slog.Logger
}

// New creates a new sportsfeed handler.
func New(svc *service.Service, logger *slog.Logger) *Handler {
	return &Handler{svc: svc, logger: logger}
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// ListSports returns all available sports.
func (h *Handler) ListSports(w http.ResponseWriter, r *http.Request) {
	sports, err := h.svc.ListSports(r.Context())
	if err != nil {
		h.logger.Error("list sports failed", "error", err)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to list sports"))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"sports": sports})
}

// ListEventsBySport returns active events for a specific sport.
func (h *Handler) ListEventsBySport(w http.ResponseWriter, r *http.Request) {
	sportID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid sport id"))
		return
	}

	events, err := h.svc.ListEventsBySport(r.Context(), sportID)
	if err != nil {
		h.logger.Error("list events by sport failed", "error", err, "sport_id", sportID)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to list events"))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"events": events})
}

// GetEvent returns a single event with full markets and odds.
func (h *Handler) GetEvent(w http.ResponseWriter, r *http.Request) {
	eventID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid event id"))
		return
	}

	event, err := h.svc.GetEvent(r.Context(), eventID)
	if err != nil {
		h.logger.Error("get event failed", "error", err, "event_id", eventID)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to get event"))
		return
	}

	if event == nil {
		httperr.WriteError(w, http.StatusNotFound, httperr.NotFound("event not found"))
		return
	}

	writeJSON(w, http.StatusOK, event)
}

// StreamOdds streams live odds updates for a specific event via Server-Sent Events.
// Uses SSE rather than a WebSocket library dependency, providing real-time updates
// over a standard HTTP connection.
func (h *Handler) StreamOdds(w http.ResponseWriter, r *http.Request) {
	eventID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid event id"))
		return
	}

	// Verify the event exists.
	event, err := h.svc.GetEvent(r.Context(), eventID)
	if err != nil || event == nil {
		httperr.WriteError(w, http.StatusNotFound, httperr.NotFound("event not found"))
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("streaming not supported"))
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	// Subscribe to odds updates for this event.
	ch, unsub := h.svc.Subscribe(eventID)
	defer unsub()

	// Send a keepalive comment every 15 seconds.
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	h.logger.Info("client subscribed to odds stream", "event_id", eventID)

	for {
		select {
		case <-r.Context().Done():
			h.logger.Info("client disconnected from odds stream", "event_id", eventID)
			return

		case update, ok := <-ch:
			if !ok {
				return
			}
			data, err := json.Marshal(update)
			if err != nil {
				h.logger.Error("marshal odds update", "error", err)
				continue
			}
			fmt.Fprintf(w, "event: odds_update\ndata: %s\n\n", data)
			flusher.Flush()

		case <-ticker.C:
			fmt.Fprintf(w, ": keepalive\n\n")
			flusher.Flush()
		}
	}
}
