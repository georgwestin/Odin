-- 003_betting.down.sql

BEGIN;

DROP TRIGGER IF EXISTS trg_bets_updated_at ON bets;
DROP TABLE IF EXISTS bet_selections;
DROP TABLE IF EXISTS bets;

COMMIT;
