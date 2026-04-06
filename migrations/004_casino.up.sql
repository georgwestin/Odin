-- 004_casino.up.sql
-- Casino: games catalog, game sessions, and game rounds

BEGIN;

CREATE TABLE games (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id     TEXT NOT NULL,
    external_game_id TEXT NOT NULL,
    game_name       TEXT NOT NULL,
    category        TEXT NOT NULL
                    CHECK (category IN ('slots', 'table', 'live', 'jackpot', 'instant', 'video_poker', 'other')),
    rtp             NUMERIC(5, 2) CHECK (rtp >= 0 AND rtp <= 100),
    volatility      TEXT CHECK (volatility IN ('low', 'medium', 'high')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, external_game_id)
);

CREATE TABLE game_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    game_id         UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
    wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    session_token   TEXT UNIQUE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'closed', 'expired', 'error')),
    ip_address      INET,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE game_rounds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE RESTRICT,
    external_round_id TEXT NOT NULL,
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    game_id         UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
    bet_amount      NUMERIC(18, 4) NOT NULL CHECK (bet_amount >= 0),
    win_amount      NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (win_amount >= 0),
    currency        CHAR(3) NOT NULL,
    status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'closed', 'cancelled')),
    round_data      JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_provider_id ON games(provider_id);
CREATE INDEX idx_games_category ON games(category);
CREATE INDEX idx_games_is_active ON games(is_active);
CREATE INDEX idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_rounds_game_session_id ON game_rounds(game_session_id);
CREATE INDEX idx_game_rounds_player_id ON game_rounds(player_id);
CREATE INDEX idx_game_rounds_game_id ON game_rounds(game_id);
CREATE INDEX idx_game_rounds_status ON game_rounds(status);
CREATE INDEX idx_game_rounds_created_at ON game_rounds(created_at);

CREATE TRIGGER trg_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_game_rounds_updated_at
    BEFORE UPDATE ON game_rounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
