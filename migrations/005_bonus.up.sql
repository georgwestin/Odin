-- 005_bonus.up.sql
-- Bonuses, player limits, and multibrand campaigns

BEGIN;

CREATE TABLE campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id        UUID NOT NULL,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL
                    CHECK (type IN ('welcome', 'deposit_match', 'free_spins', 'cashback', 'reload', 'loyalty', 'custom')),
    config          JSONB NOT NULL DEFAULT '{}',
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bonuses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    campaign_id     UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    type            TEXT NOT NULL
                    CHECK (type IN ('welcome', 'deposit_match', 'free_spins', 'cashback', 'reload', 'loyalty', 'custom')),
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'wagering', 'completed', 'expired', 'cancelled', 'forfeited')),
    amount          NUMERIC(18, 4) NOT NULL CHECK (amount >= 0),
    wagering_requirement NUMERIC(8, 2) DEFAULT 0,
    wagered_amount  NUMERIC(18, 4) NOT NULL DEFAULT 0,
    currency        CHAR(3) NOT NULL,
    expires_at      TIMESTAMPTZ,
    activated_at    TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE player_limits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    limit_type      TEXT NOT NULL
                    CHECK (limit_type IN ('deposit', 'loss', 'wager', 'session_time', 'cooling_off', 'self_exclusion')),
    period          TEXT NOT NULL
                    CHECK (period IN ('daily', 'weekly', 'monthly', 'indefinite')),
    amount          NUMERIC(18, 4),          -- monetary limit (null for time-based)
    duration_minutes INTEGER,                 -- for session_time limits
    current_usage   NUMERIC(18, 4) NOT NULL DEFAULT 0,
    effective_from  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (player_id, limit_type, period)
);

CREATE INDEX idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_bonuses_player_id ON bonuses(player_id);
CREATE INDEX idx_bonuses_campaign_id ON bonuses(campaign_id);
CREATE INDEX idx_bonuses_status ON bonuses(status);
CREATE INDEX idx_bonuses_expires_at ON bonuses(expires_at);
CREATE INDEX idx_player_limits_player_id ON player_limits(player_id);
CREATE INDEX idx_player_limits_type ON player_limits(limit_type);

CREATE TRIGGER trg_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bonuses_updated_at
    BEFORE UPDATE ON bonuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_player_limits_updated_at
    BEFORE UPDATE ON player_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
