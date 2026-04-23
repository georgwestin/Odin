package handler

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/auth/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/httperr"
	"github.com/odin-platform/odin/internal/middleware"
	"github.com/odin-platform/odin/internal/models"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// Handler holds HTTP handlers for the auth service.
type Handler struct {
	svc    *service.Service
	logger *zap.Logger
}

// New creates a new Handler.
func New(svc *service.Service, logger *zap.Logger) *Handler {
	return &Handler{svc: svc, logger: logger}
}

// --- Request / Response types ---

type registerRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	Username    string `json:"username"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	DateOfBirth string `json:"date_of_birth"` // YYYY-MM-DD
	Country     string `json:"country"`       // ISO 3166-1 alpha-2
	PlayerCurrency string `json:"player_currency"` // ISO 4217 — currency for wallet and bonusWallet
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type logoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type kycUpdateRequest struct {
	PlayerID string           `json:"player_id"`
	Status   models.KYCStatus `json:"status"`
}

// --- Handlers ---

// Register handles POST /auth/register.
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	// Validate input.
	errs := make(map[string]string)

	if !emailRegex.MatchString(req.Email) {
		errs["email"] = "invalid email address"
	}
	if len(req.Password) < 8 {
		errs["password"] = "password must be at least 8 characters"
	}
	if len(req.Username) < 3 || len(req.Username) > 30 {
		errs["username"] = "username must be 3-30 characters"
	}
	if req.Country == "" || len(req.Country) != 2 {
		errs["country"] = "country must be a 2-letter ISO code"
	}
	if req.PlayerCurrency == "" || len(req.PlayerCurrency) != 3 {
		errs["currency"] = "currency must be a 3-letter ISO code"
	}

	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		errs["date_of_birth"] = "date_of_birth must be in YYYY-MM-DD format"
	} else {
		// Must be at least 18 years old.
		eighteenYearsAgo := time.Now().AddDate(-18, 0, 0)
		if dob.After(eighteenYearsAgo) {
			errs["date_of_birth"] = "player must be at least 18 years old"
		}
	}

	if len(errs) > 0 {
		httperr.WriteValidation(w, errs)
		return
	}

	brandID, _ := middleware.GetBrandID(r.Context())
	// Default to SwedBet brand if no brand resolved
	if brandID == uuid.Nil {
		brandID = uuid.MustParse("00000000-0000-0000-0000-000000000002")
	}

	result, err := h.svc.Register(r.Context(), &service.RegisterRequest{
		Email:       strings.ToLower(strings.TrimSpace(req.Email)),
		Password:    req.Password,
		Username:    strings.TrimSpace(req.Username),
		FirstName:   strings.TrimSpace(req.FirstName),
		LastName:    strings.TrimSpace(req.LastName),
		DateOfBirth: dob,
		Country:     strings.ToUpper(req.Country),
		PlayerCurrency: strings.ToUpper(req.PlayerCurrency),
		BrandID:     brandID,
	})
	if err != nil {
		if errors.Is(err, httperr.ErrConflict) {
			httperr.WriteError(w, http.StatusConflict, httperr.Conflict("email or username already taken"))
			return
		}
		h.logger.Error("registration failed", zap.Error(err))
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("internal server error"))
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"player": result.Player,
	})
}

// Login handles POST /auth/login.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	if req.Email == "" || req.Password == "" {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("email and password are required"))
		return
	}

	brandID, _ := middleware.GetBrandID(r.Context())
	if brandID == uuid.Nil {
		brandID = uuid.MustParse("00000000-0000-0000-0000-000000000002")
	}
	ip := clientIP(r)

	result, err := h.svc.Login(r.Context(), &service.LoginRequest{
		Email:     strings.ToLower(strings.TrimSpace(req.Email)),
		Password:  req.Password,
		BrandID:   brandID,
		IP:        ip,
		UserAgent: r.UserAgent(),
	})
	if err != nil {
		switch {
		case errors.Is(err, httperr.ErrNotFound):
			httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("invalid email or password"))
		case errors.Is(err, httperr.ErrForbidden):
			httperr.WriteError(w, http.StatusForbidden, httperr.Forbidden("account is suspended"))
		case errors.Is(err, httperr.ErrSelfExcluded):
			httperr.WriteError(w, http.StatusForbidden, httperr.Forbidden("account is self-excluded"))
		case errors.Is(err, httperr.ErrCoolingOff):
			httperr.WriteError(w, http.StatusForbidden, httperr.Forbidden("account is in cooling-off period"))
		case errors.Is(err, httperr.ErrLimitExceeded):
			httperr.TooManyRequests(w, "too many login attempts, try again later")
		default:
			h.logger.Error("login failed", zap.Error(err))
			httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("internal server error"))
		}
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// Logout handles POST /auth/logout.
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	var req logoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	if req.RefreshToken == "" {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("refresh_token is required"))
		return
	}

	if err := h.svc.Logout(r.Context(), req.RefreshToken); err != nil {
		h.logger.Error("logout failed", zap.Error(err))
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("internal server error"))
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
}

// Refresh handles POST /auth/refresh.
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	if req.RefreshToken == "" {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("refresh_token is required"))
		return
	}

	ip := clientIP(r)
	result, err := h.svc.Refresh(r.Context(), req.RefreshToken, ip, r.UserAgent())
	if err != nil {
		if errors.Is(err, httperr.ErrNotFound) || errors.Is(err, httperr.ErrForbidden) {
			httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("invalid or expired refresh token"))
			return
		}
		h.logger.Error("refresh failed", zap.Error(err))
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("internal server error"))
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// Me handles GET /auth/me.
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	claims := auth.ExtractClaims(r.Context())
	if claims == nil {
		httperr.WriteError(w, http.StatusUnauthorized, httperr.Unauthorized("no claims in context"))
		return
	}

	player, err := h.svc.GetPlayer(r.Context(), claims.PlayerID)
	if err != nil {
		if errors.Is(err, httperr.ErrNotFound) {
			httperr.WriteError(w, http.StatusNotFound, httperr.NotFound("player not found"))
			return
		}
		h.logger.Error("get player failed", zap.Error(err))
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("internal server error"))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"player": player,
	})
}

// UpdateKYC handles PATCH /auth/kyc (admin only).
func (h *Handler) UpdateKYC(w http.ResponseWriter, r *http.Request) {
	var req kycUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid request body"))
		return
	}

	playerID, err := uuid.Parse(req.PlayerID)
	if err != nil {
		httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid player_id"))
		return
	}

	if err := h.svc.UpdateKYCStatus(r.Context(), playerID, req.Status); err != nil {
		if errors.Is(err, httperr.ErrInvalidInput) {
			httperr.WriteError(w, http.StatusBadRequest, httperr.BadRequest("invalid KYC status; must be pending, approved, or rejected"))
			return
		}
		h.logger.Error("update kyc failed", zap.Error(err))
		httperr.WriteError(w, http.StatusInternalServerError, httperr.InternalError("internal server error"))
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

// --- Helpers ---

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.SplitN(xff, ",", 2)
		return strings.TrimSpace(parts[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
