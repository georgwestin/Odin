-- 005_bonus.down.sql

BEGIN;

DROP TRIGGER IF EXISTS trg_player_limits_updated_at ON player_limits;
DROP TRIGGER IF EXISTS trg_bonuses_updated_at ON bonuses;
DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
DROP TABLE IF EXISTS player_limits;
DROP TABLE IF EXISTS bonuses;
DROP TABLE IF EXISTS campaigns;

COMMIT;
