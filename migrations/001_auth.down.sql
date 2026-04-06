-- 001_auth.down.sql

BEGIN;

DROP TRIGGER IF EXISTS trg_players_updated_at ON players;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS players;
DROP FUNCTION IF EXISTS update_updated_at_column();

COMMIT;
