package handler

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/odin-platform/odin/cmd/reporting/service"
	"github.com/odin-platform/odin/internal/httperr"
	"github.com/odin-platform/odin/internal/models"
)

// Handler contains the HTTP handlers for the reporting service.
type Handler struct {
	svc    *service.Service
	logger *slog.Logger
}

// New creates a new reporting handler.
func New(svc *service.Service, logger *slog.Logger) *Handler {
	return &Handler{svc: svc, logger: logger}
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func parseBrandID(r *http.Request) *uuid.UUID {
	brandStr := r.URL.Query().Get("brand_id")
	if brandStr == "" {
		return nil
	}
	id, err := uuid.Parse(brandStr)
	if err != nil {
		return nil
	}
	return &id
}

func parseIntParam(r *http.Request, name string, defaultVal int) int {
	val := r.URL.Query().Get(name)
	if val == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(val)
	if err != nil || n < 0 {
		return defaultVal
	}
	return n
}

// GGRReport returns the Gross Gaming Revenue report.
func (h *Handler) GGRReport(w http.ResponseWriter, r *http.Request) {
	params := service.GGRParams{
		DateFrom: r.URL.Query().Get("date_from"),
		DateTo:   r.URL.Query().Get("date_to"),
		BrandID:  parseBrandID(r),
	}

	report, err := h.svc.GetGGR(r.Context(), params)
	if err != nil {
		if errors.Is(err, httperr.ErrInvalidInput) {
			httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest(err.Error()))
			return
		}
		h.logger.Error("ggr report failed", "error", err)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to generate GGR report"))
		return
	}

	writeJSON(w, http.StatusOK, report)
}

// PlayerActivityReport returns the player activity report.
func (h *Handler) PlayerActivityReport(w http.ResponseWriter, r *http.Request) {
	params := service.PlayerActivityParams{
		DateFrom: r.URL.Query().Get("date_from"),
		DateTo:   r.URL.Query().Get("date_to"),
		BrandID:  parseBrandID(r),
		Limit:    parseIntParam(r, "limit", 100),
		Offset:   parseIntParam(r, "offset", 0),
	}

	players, err := h.svc.GetPlayerActivity(r.Context(), params)
	if err != nil {
		if errors.Is(err, httperr.ErrInvalidInput) {
			httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest(err.Error()))
			return
		}
		h.logger.Error("player activity report failed", "error", err)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to generate player activity report"))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"players": players})
}

// TransactionReport returns the transaction export. Supports CSV format via Accept header.
func (h *Handler) TransactionReport(w http.ResponseWriter, r *http.Request) {
	params := service.TransactionParams{
		DateFrom: r.URL.Query().Get("date_from"),
		DateTo:   r.URL.Query().Get("date_to"),
		BrandID:  parseBrandID(r),
		Type:     r.URL.Query().Get("type"),
		Limit:    parseIntParam(r, "limit", 1000),
		Offset:   parseIntParam(r, "offset", 0),
	}

	transactions, err := h.svc.GetTransactions(r.Context(), params)
	if err != nil {
		if errors.Is(err, httperr.ErrInvalidInput) {
			httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest(err.Error()))
			return
		}
		h.logger.Error("transaction report failed", "error", err)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to generate transaction report"))
		return
	}

	// Check if CSV format is requested.
	if r.URL.Query().Get("format") == "csv" || r.Header.Get("Accept") == "text/csv" {
		h.writeTransactionsCSV(w, transactions)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"transactions": transactions})
}

func (h *Handler) writeTransactionsCSV(w http.ResponseWriter, transactions []models.ReportTransaction) {
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=transactions.csv")
	w.WriteHeader(http.StatusOK)

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Header row.
	writer.Write([]string{"id", "player_id", "type", "amount", "currency", "created_at"})

	for _, t := range transactions {
		writer.Write([]string{
			t.ID.String(),
			t.PlayerID.String(),
			t.Type,
			t.Amount,
			t.Currency,
			t.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}
}

// BetHistoryReport returns bet history by sport/market.
func (h *Handler) BetHistoryReport(w http.ResponseWriter, r *http.Request) {
	var sportID *uuid.UUID
	if s := r.URL.Query().Get("sport_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			sportID = &id
		}
	}

	params := service.BetHistoryParams{
		DateFrom: r.URL.Query().Get("date_from"),
		DateTo:   r.URL.Query().Get("date_to"),
		BrandID:  parseBrandID(r),
		SportID:  sportID,
		Limit:    parseIntParam(r, "limit", 1000),
		Offset:   parseIntParam(r, "offset", 0),
	}

	bets, err := h.svc.GetBetHistory(r.Context(), params)
	if err != nil {
		if errors.Is(err, httperr.ErrInvalidInput) {
			httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest(err.Error()))
			return
		}
		h.logger.Error("bet history report failed", "error", err)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to generate bet history report"))
		return
	}

	// Support CSV export.
	if r.URL.Query().Get("format") == "csv" || r.Header.Get("Accept") == "text/csv" {
		h.writeBetsCSV(w, bets)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"bets": bets})
}

func (h *Handler) writeBetsCSV(w http.ResponseWriter, bets []models.ReportBet) {
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=bets.csv")
	w.WriteHeader(http.StatusOK)

	writer := csv.NewWriter(w)
	defer writer.Flush()

	writer.Write([]string{"bet_id", "player_id", "sport_name", "event_name", "market_name",
		"stake", "payout", "result", "placed_at", "settled_at"})

	for _, b := range bets {
		settledAt := ""
		if b.SettledAt != nil {
			settledAt = b.SettledAt.Format("2006-01-02T15:04:05Z")
		}
		writer.Write([]string{
			b.BetID.String(),
			b.PlayerID.String(),
			b.SportName,
			b.EventName,
			b.MarketName,
			b.Stake,
			b.Payout,
			b.Result,
			b.PlacedAt.Format("2006-01-02T15:04:05Z"),
			settledAt,
		})
	}
}

// ResponsibleGamblingReport returns responsible gambling statistics.
func (h *Handler) ResponsibleGamblingReport(w http.ResponseWriter, r *http.Request) {
	report, err := h.svc.GetResponsibleGamblingReport(r.Context(), parseBrandID(r))
	if err != nil {
		h.logger.Error("responsible gambling report failed", "error", err)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to generate responsible gambling report"))
		return
	}

	writeJSON(w, http.StatusOK, report)
}

// DashboardStats returns summary dashboard statistics.
func (h *Handler) DashboardStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetDashboardStats(r.Context(), parseBrandID(r))
	if err != nil {
		h.logger.Error("dashboard stats failed", "error", err)
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("failed to generate dashboard stats"))
		return
	}

	writeJSON(w, http.StatusOK, stats)
}
