-- 001_auth.up.sql
-- Authentication: players and sessions

BEGIN;

CREATE TABLE players (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    username        TEXT UNIQUE NOT NULL,
    date_of_birth   DATE NOT NULL,
    country_code    CHAR(2) NOT NULL,
    kyc_status      TEXT NOT NULL DEFAULT 'pending'
                    CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'expired')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    brand_id        UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    token_hash      TEXT UNIQUE NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_brand_id ON players(brand_id);
CREATE INDEX idx_players_country_code ON players(country_code);
CREATE INDEX idx_sessions_player_id ON sessions(player_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Auto-update updated_at on players
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
