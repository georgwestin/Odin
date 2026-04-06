-- 006_reporting.up.sql
-- Audit log and reporting aggregate tables

BEGIN;

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID,
    action          TEXT NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID,
    details         JSONB DEFAULT '{}',
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent mutations on audit log (append-only)
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only: % operations are not permitted', TG_OP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_no_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER trg_audit_log_no_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TABLE daily_ggr (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date     DATE NOT NULL,
    brand_id        UUID NOT NULL,
    total_bets      NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_wins      NUMERIC(18, 4) NOT NULL DEFAULT 0,
    ggr             NUMERIC(18, 4) NOT NULL DEFAULT 0,  -- gross gaming revenue (bets - wins)
    ngr             NUMERIC(18, 4) NOT NULL DEFAULT 0,  -- net gaming revenue (ggr - bonuses)
    currency        CHAR(3) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (report_date, brand_id, currency)
);

CREATE TABLE daily_player_activity (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date     DATE NOT NULL,
    brand_id        UUID NOT NULL,
    registrations   INTEGER NOT NULL DEFAULT 0,
    active_players  INTEGER NOT NULL DEFAULT 0,
    first_time_depositors INTEGER NOT NULL DEFAULT 0,
    deposits        NUMERIC(18, 4) NOT NULL DEFAULT 0,
    withdrawals     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    currency        CHAR(3) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (report_date, brand_id, currency)
);

CREATE INDEX idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_daily_ggr_date ON daily_ggr(report_date);
CREATE INDEX idx_daily_ggr_brand_id ON daily_ggr(brand_id);
CREATE INDEX idx_daily_ggr_date_brand ON daily_ggr(report_date, brand_id);
CREATE INDEX idx_daily_player_activity_date ON daily_player_activity(report_date);
CREATE INDEX idx_daily_player_activity_brand_id ON daily_player_activity(brand_id);
CREATE INDEX idx_daily_player_activity_date_brand ON daily_player_activity(report_date, brand_id);

COMMIT;
