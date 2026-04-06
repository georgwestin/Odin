-- 008_admin_users.down.sql

BEGIN;

ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS fk_audit_log_admin_id;
DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON admin_users;
DROP TABLE IF EXISTS admin_users;

COMMIT;
