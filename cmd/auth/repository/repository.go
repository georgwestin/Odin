package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/odin-platform/odin/internal/models"
)

// Repository handles all PostgreSQL operations for the auth service.
type Repository struct {
	pool *pgxpool.Pool
}

// New creates a new auth repository.
func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// CreatePlayer inserts a new player row.
func (r *Repository) CreatePlayer(ctx context.Context, p *models.Player) error {
	query := `
		INSERT INTO players (id, brand_id, email, username, password_hash, first_name, last_name,
			date_of_birth, country, currency, kyc_status, status, roles, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`

	_, err := r.pool.Exec(ctx, query,
		p.ID, p.BrandID, p.Email, p.Username, p.PasswordHash,
		p.FirstName, p.LastName, p.DateOfBirth, p.Country, p.Currency,
		p.KYCStatus, p.Status, p.Roles, p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert player: %w", err)
	}
	return nil
}

// FindByEmail returns a player by email and brand.
func (r *Repository) FindByEmail(ctx context.Context, brandID uuid.UUID, email string) (*models.Player, error) {
	query := `
		SELECT id, brand_id, email, username, password_hash, first_name, last_name,
			date_of_birth, country, currency, kyc_status, status, roles,
			last_login_at, created_at, updated_at
		FROM players
		WHERE brand_id = $1 AND email = $2`

	p := &models.Player{}
	err := r.pool.QueryRow(ctx, query, brandID, email).Scan(
		&p.ID, &p.BrandID, &p.Email, &p.Username, &p.PasswordHash,
		&p.FirstName, &p.LastName, &p.DateOfBirth, &p.Country, &p.Currency,
		&p.KYCStatus, &p.Status, &p.Roles, &p.LastLoginAt, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("find player by email: %w", err)
	}
	return p, nil
}

// FindByUsername returns a player by username and brand.
func (r *Repository) FindByUsername(ctx context.Context, brandID uuid.UUID, username string) (*models.Player, error) {
	query := `
		SELECT id, brand_id, email, username, password_hash, first_name, last_name,
			date_of_birth, country, currency, kyc_status, status, roles,
			last_login_at, created_at, updated_at
		FROM players
		WHERE brand_id = $1 AND username = $2`

	p := &models.Player{}
	err := r.pool.QueryRow(ctx, query, brandID, username).Scan(
		&p.ID, &p.BrandID, &p.Email, &p.Username, &p.PasswordHash,
		&p.FirstName, &p.LastName, &p.DateOfBirth, &p.Country, &p.Currency,
		&p.KYCStatus, &p.Status, &p.Roles, &p.LastLoginAt, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("find player by username: %w", err)
	}
	return p, nil
}

// FindByID returns a player by ID.
func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*models.Player, error) {
	query := `
		SELECT id, brand_id, email, username, password_hash, first_name, last_name,
			date_of_birth, country, currency, kyc_status, status, roles,
			last_login_at, created_at, updated_at
		FROM players
		WHERE id = $1`

	p := &models.Player{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.BrandID, &p.Email, &p.Username, &p.PasswordHash,
		&p.FirstName, &p.LastName, &p.DateOfBirth, &p.Country, &p.Currency,
		&p.KYCStatus, &p.Status, &p.Roles, &p.LastLoginAt, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("find player by id: %w", err)
	}
	return p, nil
}

// UpdateKYCStatus sets a player's KYC status.
func (r *Repository) UpdateKYCStatus(ctx context.Context, playerID uuid.UUID, status models.KYCStatus) error {
	query := `UPDATE players SET kyc_status = $1, updated_at = $2 WHERE id = $3`
	tag, err := r.pool.Exec(ctx, query, status, time.Now().UTC(), playerID)
	if err != nil {
		return fmt.Errorf("update kyc status: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("player not found")
	}
	return nil
}

// UpdateLastLogin sets the last_login_at timestamp.
func (r *Repository) UpdateLastLogin(ctx context.Context, playerID uuid.UUID) error {
	query := `UPDATE players SET last_login_at = $1 WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, time.Now().UTC(), playerID)
	if err != nil {
		return fmt.Errorf("update last login: %w", err)
	}
	return nil
}

// Session represents a stored player session.
type Session struct {
	ID           uuid.UUID  `json:"id"`
	PlayerID     uuid.UUID  `json:"player_id"`
	RefreshToken string     `json:"-"`
	UserAgent    string     `json:"user_agent"`
	IP           string     `json:"ip"`
	ExpiresAt    time.Time  `json:"expires_at"`
	RevokedAt    *time.Time `json:"revoked_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

// CreateSession stores a new refresh-token session.
func (r *Repository) CreateSession(ctx context.Context, s *Session) error {
	query := `
		INSERT INTO sessions (id, player_id, refresh_token, user_agent, ip, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := r.pool.Exec(ctx, query,
		s.ID, s.PlayerID, s.RefreshToken, s.UserAgent, s.IP, s.ExpiresAt, s.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("create session: %w", err)
	}
	return nil
}

// FindSession returns a session by its refresh token.
func (r *Repository) FindSession(ctx context.Context, refreshToken string) (*Session, error) {
	query := `
		SELECT id, player_id, refresh_token, user_agent, ip, expires_at, revoked_at, created_at
		FROM sessions
		WHERE refresh_token = $1`

	s := &Session{}
	err := r.pool.QueryRow(ctx, query, refreshToken).Scan(
		&s.ID, &s.PlayerID, &s.RefreshToken, &s.UserAgent, &s.IP,
		&s.ExpiresAt, &s.RevokedAt, &s.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("find session: %w", err)
	}
	return s, nil
}

// RevokeSession marks a session as revoked.
func (r *Repository) RevokeSession(ctx context.Context, sessionID uuid.UUID) error {
	query := `UPDATE sessions SET revoked_at = $1 WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, time.Now().UTC(), sessionID)
	if err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}
	return nil
}

// RevokeAllSessions revokes all active sessions for a player.
func (r *Repository) RevokeAllSessions(ctx context.Context, playerID uuid.UUID) error {
	query := `UPDATE sessions SET revoked_at = $1 WHERE player_id = $2 AND revoked_at IS NULL`
	_, err := r.pool.Exec(ctx, query, time.Now().UTC(), playerID)
	if err != nil {
		return fmt.Errorf("revoke all sessions: %w", err)
	}
	return nil
}

// CheckSelfExclusion returns true if the player has an active self-exclusion.
func (r *Repository) CheckSelfExclusion(ctx context.Context, playerID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM self_exclusions
			WHERE player_id = $1
			  AND started_at <= NOW()
			  AND (ended_at IS NULL OR ended_at > NOW())
		)`

	var excluded bool
	err := r.pool.QueryRow(ctx, query, playerID).Scan(&excluded)
	if err != nil {
		return false, fmt.Errorf("check self exclusion: %w", err)
	}
	return excluded, nil
}

// CheckCoolingOff returns true if the player is in a cooling-off period.
func (r *Repository) CheckCoolingOff(ctx context.Context, playerID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM cooling_off_periods
			WHERE player_id = $1
			  AND started_at <= NOW()
			  AND ended_at > NOW()
		)`

	var coolingOff bool
	err := r.pool.QueryRow(ctx, query, playerID).Scan(&coolingOff)
	if err != nil {
		return false, fmt.Errorf("check cooling off: %w", err)
	}
	return coolingOff, nil
}
