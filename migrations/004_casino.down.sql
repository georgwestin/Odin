-- 004_casino.down.sql

BEGIN;

DROP TRIGGER IF EXISTS trg_game_rounds_updated_at ON game_rounds;
DROP TRIGGER IF EXISTS trg_games_updated_at ON games;
DROP TABLE IF EXISTS game_rounds;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS games;

COMMIT;
