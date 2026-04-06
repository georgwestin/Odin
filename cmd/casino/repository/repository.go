package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/odin-platform/odin/internal/models"
)

type Repository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// CreateSession inserts a new game session.
func (r *Repository) CreateSession(ctx context.Context, session *models.GameSession) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO game_sessions (id, player_id, brand_id, game_id, provider_id, currency,
			session_token, ip_address, started_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		session.ID, session.PlayerID, session.BrandID, session.GameID,
		session.ProviderID, session.Currency, session.SessionToken,
		session.IPAddress, session.StartedAt,
	)
	if err != nil {
		return fmt.Errorf("insert game session: %w", err)
	}
	return nil
}

// FindSessionByID retrieves a game session by its ID.
func (r *Repository) FindSessionByID(ctx context.Context, id uuid.UUID) (*models.GameSession, error) {
	session := &models.GameSession{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, player_id, brand_id, game_id, provider_id, currency,
			   session_token, ip_address, started_at, ended_at
		FROM game_sessions WHERE id = $1`, id,
	).Scan(
		&session.ID, &session.PlayerID, &session.BrandID, &session.GameID,
		&session.ProviderID, &session.Currency, &session.SessionToken,
		&session.IPAddress, &session.StartedAt, &session.EndedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find session by id: %w", err)
	}
	return session, nil
}

// FindActiveSession retrieves an active session by its token.
func (r *Repository) FindActiveSession(ctx context.Context, token string) (*models.GameSession, error) {
	session := &models.GameSession{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, player_id, brand_id, game_id, provider_id, currency,
			   session_token, ip_address, started_at, ended_at
		FROM game_sessions
		WHERE session_token = $1 AND ended_at IS NULL`, token,
	).Scan(
		&session.ID, &session.PlayerID, &session.BrandID, &session.GameID,
		&session.ProviderID, &session.Currency, &session.SessionToken,
		&session.IPAddress, &session.StartedAt, &session.EndedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find active session: %w", err)
	}
	return session, nil
}

// EndSession marks a game session as ended.
func (r *Repository) EndSession(ctx context.Context, id uuid.UUID) error {
	now := time.Now().UTC()
	tag, err := r.pool.Exec(ctx, `
		UPDATE game_sessions SET ended_at = $1 WHERE id = $2 AND ended_at IS NULL`,
		now, id,
	)
	if err != nil {
		return fmt.Errorf("end session: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("session %s not found or already ended", id)
	}
	return nil
}

// FindActiveSessionsByPlayer returns all active sessions for a player.
func (r *Repository) FindActiveSessionsByPlayer(ctx context.Context, playerID uuid.UUID) ([]models.GameSession, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, player_id, brand_id, game_id, provider_id, currency,
			   session_token, ip_address, started_at, ended_at
		FROM game_sessions
		WHERE player_id = $1 AND ended_at IS NULL
		ORDER BY started_at DESC`, playerID,
	)
	if err != nil {
		return nil, fmt.Errorf("find active sessions by player: %w", err)
	}
	defer rows.Close()

	var sessions []models.GameSession
	for rows.Next() {
		var s models.GameSession
		if err := rows.Scan(
			&s.ID, &s.PlayerID, &s.BrandID, &s.GameID,
			&s.ProviderID, &s.Currency, &s.SessionToken,
			&s.IPAddress, &s.StartedAt, &s.EndedAt,
		); err != nil {
			return nil, fmt.Errorf("scan session: %w", err)
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

// CreateRound inserts a new game round.
func (r *Repository) CreateRound(ctx context.Context, round *models.GameRound) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO game_rounds (id, session_id, player_id, brand_id, game_id, provider_id,
			round_ref, total_bet, total_win, currency, status, started_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		round.ID, round.SessionID, round.PlayerID, round.BrandID, round.GameID,
		round.ProviderID, round.RoundRef, round.TotalBet, round.TotalWin,
		round.Currency, round.Status, round.StartedAt,
	)
	if err != nil {
		return fmt.Errorf("insert game round: %w", err)
	}
	return nil
}

// FindRoundByRef finds a game round by its provider reference within a session.
func (r *Repository) FindRoundByRef(ctx context.Context, sessionID uuid.UUID, roundRef string) (*models.GameRound, error) {
	round := &models.GameRound{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, session_id, player_id, brand_id, game_id, provider_id,
			   round_ref, total_bet, total_win, currency, status, started_at, completed_at
		FROM game_rounds
		WHERE session_id = $1 AND round_ref = $2`, sessionID, roundRef,
	).Scan(
		&round.ID, &round.SessionID, &round.PlayerID, &round.BrandID,
		&round.GameID, &round.ProviderID, &round.RoundRef,
		&round.TotalBet, &round.TotalWin, &round.Currency,
		&round.Status, &round.StartedAt, &round.CompletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find round by ref: %w", err)
	}
	return round, nil
}

// UpdateRoundDebit adds a debit amount to the round's total_bet.
func (r *Repository) UpdateRoundDebit(ctx context.Context, roundID uuid.UUID, amount models.Decimal) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE game_rounds
		SET total_bet = (total_bet::numeric + $1::numeric)::text
		WHERE id = $2`,
		string(amount), roundID,
	)
	if err != nil {
		return fmt.Errorf("update round debit: %w", err)
	}
	return nil
}

// UpdateRoundCredit adds a credit amount to the round's total_win and optionally closes the round.
func (r *Repository) UpdateRoundCredit(ctx context.Context, roundID uuid.UUID, amount models.Decimal, closeRound bool) error {
	if closeRound {
		now := time.Now().UTC()
		_, err := r.pool.Exec(ctx, `
			UPDATE game_rounds
			SET total_win = (total_win::numeric + $1::numeric)::text,
				status = 'closed',
				completed_at = $2
			WHERE id = $3`,
			string(amount), now, roundID,
		)
		if err != nil {
			return fmt.Errorf("update round credit (close): %w", err)
		}
	} else {
		_, err := r.pool.Exec(ctx, `
			UPDATE game_rounds
			SET total_win = (total_win::numeric + $1::numeric)::text
			WHERE id = $2`,
			string(amount), roundID,
		)
		if err != nil {
			return fmt.Errorf("update round credit: %w", err)
		}
	}
	return nil
}

// ListGames returns casino games with optional filtering.
func (r *Repository) ListGames(ctx context.Context, providerFilter, categoryFilter string, limit, offset int) ([]Game, int, error) {
	// Build query with optional filters.
	baseQuery := `FROM casino_games WHERE is_active = true`
	args := []interface{}{}
	argIdx := 1

	if providerFilter != "" {
		baseQuery += fmt.Sprintf(" AND provider_id = $%d", argIdx)
		args = append(args, providerFilter)
		argIdx++
	}
	if categoryFilter != "" {
		baseQuery += fmt.Sprintf(" AND category = $%d", argIdx)
		args = append(args, categoryFilter)
		argIdx++
	}

	// Count query.
	var total int
	countQuery := "SELECT COUNT(*) " + baseQuery
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count games: %w", err)
	}

	// Data query.
	dataQuery := fmt.Sprintf(`SELECT id, name, provider_id, category, rtp, thumbnail_url, is_active, created_at %s ORDER BY name LIMIT $%d OFFSET $%d`,
		baseQuery, argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query games: %w", err)
	}
	defer rows.Close()

	var games []Game
	for rows.Next() {
		var g Game
		if err := rows.Scan(
			&g.ID, &g.Name, &g.ProviderID, &g.Category,
			&g.RTP, &g.ThumbnailURL, &g.IsActive, &g.CreatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan game: %w", err)
		}
		games = append(games, g)
	}

	return games, total, nil
}

// Game represents a casino game entry in the catalog.
type Game struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	ProviderID   string    `json:"provider_id" db:"provider_id"`
	Category     string    `json:"category" db:"category"`
	RTP          string    `json:"rtp" db:"rtp"`
	ThumbnailURL string    `json:"thumbnail_url" db:"thumbnail_url"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}
