-- 003_betting.up.sql
-- Sportsbook bets and selections

BEGIN;

CREATE TABLE bets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    bet_type        TEXT NOT NULL
                    CHECK (bet_type IN ('single', 'accumulator', 'system')),
    stake           NUMERIC(18, 4) NOT NULL CHECK (stake > 0),
    potential_payout NUMERIC(18, 4) NOT NULL CHECK (potential_payout >= 0),
    actual_payout   NUMERIC(18, 4),
    currency        CHAR(3) NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'won', 'lost', 'void', 'cashed_out', 'partially_cashed_out')),
    settled_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bet_selections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bet_id          UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
    event_id        TEXT NOT NULL,
    market_id       TEXT NOT NULL,
    selection_id    TEXT NOT NULL,
    event_name      TEXT NOT NULL,
    market_name     TEXT NOT NULL,
    selection_name  TEXT NOT NULL,
    odds            NUMERIC(12, 4) NOT NULL CHECK (odds > 0),
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'won', 'lost', 'void', 'dead_heat')),
    result          TEXT,
    settled_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bets_player_id ON bets(player_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_created_at ON bets(created_at);
CREATE INDEX idx_bets_wallet_id ON bets(wallet_id);
CREATE INDEX idx_bet_selections_bet_id ON bet_selections(bet_id);
CREATE INDEX idx_bet_selections_event_id ON bet_selections(event_id);
CREATE INDEX idx_bet_selections_status ON bet_selections(status);

CREATE TRIGGER trg_bets_updated_at
    BEFORE UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
