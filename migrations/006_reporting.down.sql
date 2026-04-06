-- 006_reporting.down.sql

BEGIN;

DROP TRIGGER IF EXISTS trg_audit_log_no_update ON audit_log;
DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON audit_log;
DROP TABLE IF EXISTS daily_player_activity;
DROP TABLE IF EXISTS daily_ggr;
DROP TABLE IF EXISTS audit_log;
DROP FUNCTION IF EXISTS prevent_audit_log_mutation();

COMMIT;
