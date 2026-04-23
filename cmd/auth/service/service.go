package service

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"

	"github.com/odin-platform/odin/cmd/auth/repository"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/httperr"
	"github.com/odin-platform/odin/internal/kafka"
	"github.com/odin-platform/odin/internal/models"
)

const (
	bcryptCost           = 12
	loginRateLimitMax    = 10
	loginRateLimitWindow = time.Minute
	refreshTokenExpiry   = 7 * 24 * time.Hour
)

// Service contains the business logic for the auth service.
type Service struct {
	repo             *repository.Repository
	redis            *redis.Client
	kafkaProducer    *kafka.Producer
	jwtMgr           *auth.JWTManager
	walletServiceURL string
	internalToken    string
	logger           *zap.Logger
}

// New creates a new auth service.
func New(
	repo *repository.Repository,
	redisClient *redis.Client,
	kafkaProducer *kafka.Producer,
	jwtMgr *auth.JWTManager,
	walletServiceURL string,
	internalToken string,
	logger *zap.Logger,
) *Service {
	return &Service{
		repo:             repo,
		redis:            redisClient,
		kafkaProducer:    kafkaProducer,
		jwtMgr:           jwtMgr,
		walletServiceURL: walletServiceURL,
		internalToken:    internalToken,
		logger:           logger,
	}
}

// RegisterRequest holds validated registration data.
type RegisterRequest struct {
	Email       string
	Password    string
	Username    string
	FirstName   string
	LastName    string
	DateOfBirth time.Time
	Country        string
	PlayerCurrency string
	BrandID        uuid.UUID
}

// RegisterResult contains the outcome of a registration.
type RegisterResult struct {
	Player *models.Player
}

// Register creates a new player account.
func (s *Service) Register(ctx context.Context, req *RegisterRequest) (*RegisterResult, error) {
	// Check for duplicate email.
	existing, err := s.repo.FindByEmail(ctx, req.BrandID, req.Email)
	if err != nil {
		return nil, fmt.Errorf("check duplicate email: %w", err)
	}
	if existing != nil {
		return nil, httperr.ErrConflict
	}

	// Check for duplicate username.
	existing, err = s.repo.FindByUsername(ctx, req.BrandID, req.Username)
	if err != nil {
		return nil, fmt.Errorf("check duplicate username: %w", err)
	}
	if existing != nil {
		return nil, httperr.ErrConflict
	}

	// Hash password with bcrypt cost 12.
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	now := time.Now().UTC()
	player := &models.Player{
		ID:           uuid.New(),
		BrandID:      req.BrandID,
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hash),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		DateOfBirth:  req.DateOfBirth,
		Country:      req.Country,
		PlayerCurrency: req.PlayerCurrency,
		KYCStatus:    models.KYCPending,
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.repo.CreatePlayer(ctx, player); err != nil {
		return nil, fmt.Errorf("create player: %w", err)
	}

	// Create wallet via internal call to the wallet service.
	if err := s.createWallet(ctx, player.ID, player.BrandID, player.PlayerCurrency); err != nil {
		s.logger.Error("failed to create wallet for new player",
			zap.String("player_id", player.ID.String()),
			zap.Error(err),
		)
		// Non-fatal: wallet creation can be retried via the Kafka event consumer.
	}

	// Publish player.registered event to Kafka.
	event := map[string]interface{}{
		"player_id":  player.ID.String(),
		"brand_id":   player.BrandID.String(),
		"email":      player.Email,
		"username":   player.Username,
		"country":    player.Country,
		"currency":   player.PlayerCurrency,
		"created_at": player.CreatedAt.Format(time.RFC3339),
	}
	if err := s.kafkaProducer.Publish(ctx, kafka.TopicPlayerRegistered, player.ID.String(), event); err != nil {
		s.logger.Error("failed to publish player.registered event",
			zap.String("player_id", player.ID.String()),
			zap.Error(err),
		)
	}

	return &RegisterResult{Player: player}, nil
}

// createWallet calls the wallet service to create a wallet for a new player.
func (s *Service) createWallet(ctx context.Context, playerID, brandID uuid.UUID, currency string) error {
	url := fmt.Sprintf("%s/wallet/internal/create", s.walletServiceURL)

	body := fmt.Sprintf(`{"player_id":"%s","brand_id":"%s","currency":"%s"}`,
		playerID.String(), brandID.String(), currency)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(body))
	if err != nil {
		return fmt.Errorf("create wallet request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Token", s.internalToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("call wallet service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("wallet service returned status %d", resp.StatusCode)
	}
	return nil
}

// LoginRequest holds login credentials.
type LoginRequest struct {
	Email     string
	Password  string
	BrandID   uuid.UUID
	IP        string
	UserAgent string
}

// LoginResult contains the token pair and player info on successful login.
type LoginResult struct {
	AccessToken  string         `json:"access_token"`
	RefreshToken string         `json:"refresh_token"`
	ExpiresIn    int64          `json:"expires_in"`
	Player       *models.Player `json:"player"`
}

// Login authenticates a player and returns a JWT token pair.
func (s *Service) Login(ctx context.Context, req *LoginRequest) (*LoginResult, error) {
	// Rate limiting: 10 attempts per IP per minute via Redis.
	rateLimitKey := fmt.Sprintf("auth:login:rate:%s", req.IP)
	count, err := s.redis.Incr(ctx, rateLimitKey).Result()
	if err != nil {
		s.logger.Error("redis rate limit incr failed", zap.Error(err))
	} else {
		if count == 1 {
			s.redis.Expire(ctx, rateLimitKey, loginRateLimitWindow)
		}
		if count > loginRateLimitMax {
			return nil, httperr.ErrLimitExceeded
		}
	}

	player, err := s.repo.FindByEmail(ctx, req.BrandID, req.Email)
	if err != nil {
		return nil, fmt.Errorf("find player: %w", err)
	}
	if player == nil {
		return nil, httperr.ErrNotFound
	}

	// Check account is active.
	if !player.IsActive {
		return nil, httperr.ErrForbidden
	}

	// Verify password.
	if err := bcrypt.CompareHashAndPassword([]byte(player.PasswordHash), []byte(req.Password)); err != nil {
		return nil, httperr.ErrNotFound // Do not reveal whether the email exists.
	}

	// Check self-exclusion.
	excluded, err := s.repo.CheckSelfExclusion(ctx, player.ID)
	if err != nil {
		s.logger.Error("self-exclusion check failed", zap.Error(err))
	}
	if excluded {
		return nil, httperr.ErrSelfExcluded
	}

	// Check cooling-off period.
	coolingOff, err := s.repo.CheckCoolingOff(ctx, player.ID)
	if err != nil {
		s.logger.Error("cooling-off check failed", zap.Error(err))
	}
	if coolingOff {
		return nil, httperr.ErrCoolingOff
	}

	// Generate RS256 token pair via JWTManager.
	claims := auth.Claims{
		PlayerID:  player.ID,
		Email:     player.Email,
		KYCStatus: string(player.KYCStatus),
		Roles:     []string{"player"},
		BrandID:   player.BrandID,
	}

	accessToken, refreshToken, err := s.jwtMgr.GenerateTokenPair(claims)
	if err != nil {
		return nil, fmt.Errorf("generate token pair: %w", err)
	}

	// Store session with the refresh token.
	now := time.Now().UTC()
	session := &repository.Session{
		ID:           uuid.New(),
		PlayerID:     player.ID,
		RefreshToken: refreshToken,
		UserAgent:    req.UserAgent,
		IP:           req.IP,
		ExpiresAt:    now.Add(refreshTokenExpiry),
		CreatedAt:    now,
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, fmt.Errorf("create session: %w", err)
	}

	// Update last login timestamp.
	if err := s.repo.UpdateLastLogin(ctx, player.ID); err != nil {
		s.logger.Error("failed to update last login", zap.Error(err))
	}

	return &LoginResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    900, // 15 minutes in seconds.
		Player:       player,
	}, nil
}

// Logout revokes the session identified by the refresh token.
func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	session, err := s.repo.FindSession(ctx, refreshToken)
	if err != nil {
		return fmt.Errorf("find session: %w", err)
	}
	if session == nil {
		return nil // Idempotent: already logged out.
	}
	return s.repo.RevokeSession(ctx, session.ID)
}

// RefreshResult contains a new token pair.
type RefreshResult struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// Refresh exchanges a valid refresh token for a new token pair.
// Implements refresh token rotation: the old token is revoked and a new one is issued.
func (s *Service) Refresh(ctx context.Context, refreshToken, ip, userAgent string) (*RefreshResult, error) {
	session, err := s.repo.FindSession(ctx, refreshToken)
	if err != nil {
		return nil, fmt.Errorf("find session: %w", err)
	}
	if session == nil || session.RevokedAt != nil || time.Now().After(session.ExpiresAt) {
		return nil, httperr.ErrNotFound
	}

	player, err := s.repo.FindByID(ctx, session.PlayerID)
	if err != nil {
		return nil, fmt.Errorf("find player: %w", err)
	}
	if player == nil || !player.IsActive {
		return nil, httperr.ErrForbidden
	}

	// Revoke old session (rotation).
	if err := s.repo.RevokeSession(ctx, session.ID); err != nil {
		return nil, fmt.Errorf("revoke old session: %w", err)
	}

	// Generate new token pair.
	claims := auth.Claims{
		PlayerID:  player.ID,
		Email:     player.Email,
		KYCStatus: string(player.KYCStatus),
		Roles:     []string{"player"},
		BrandID:   player.BrandID,
	}

	accessToken, newRefreshToken, err := s.jwtMgr.GenerateTokenPair(claims)
	if err != nil {
		return nil, fmt.Errorf("generate token pair: %w", err)
	}

	now := time.Now().UTC()
	newSession := &repository.Session{
		ID:           uuid.New(),
		PlayerID:     player.ID,
		RefreshToken: newRefreshToken,
		UserAgent:    userAgent,
		IP:           ip,
		ExpiresAt:    now.Add(refreshTokenExpiry),
		CreatedAt:    now,
	}
	if err := s.repo.CreateSession(ctx, newSession); err != nil {
		return nil, fmt.Errorf("create new session: %w", err)
	}

	return &RefreshResult{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    900,
	}, nil
}

// GetPlayer returns a player by ID.
func (s *Service) GetPlayer(ctx context.Context, playerID uuid.UUID) (*models.Player, error) {
	player, err := s.repo.FindByID(ctx, playerID)
	if err != nil {
		return nil, fmt.Errorf("find player: %w", err)
	}
	if player == nil {
		return nil, httperr.ErrNotFound
	}
	return player, nil
}

// UpdateKYCStatus changes a player's KYC verification status.
func (s *Service) UpdateKYCStatus(ctx context.Context, playerID uuid.UUID, status models.KYCStatus) error {
	switch status {
	case models.KYCPending, models.KYCApproved, models.KYCRejected:
	default:
		return httperr.ErrInvalidInput
	}
	return s.repo.UpdateKYCStatus(ctx, playerID, status)
}
