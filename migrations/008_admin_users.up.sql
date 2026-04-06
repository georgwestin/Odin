-- 008_admin_users.up.sql
-- Admin users for back-office

BEGIN;

CREATE TABLE admin_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    role            TEXT NOT NULL
                    CHECK (role IN ('superadmin', 'admin', 'support', 'marketing')),
    brand_id        UUID REFERENCES brands(id),  -- NULL means access to all brands
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_brand_id ON admin_users(brand_id);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

-- Add foreign key from audit_log to admin_users
ALTER TABLE audit_log
    ADD CONSTRAINT fk_audit_log_admin_id FOREIGN KEY (admin_id) REFERENCES admin_users(id);

CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
