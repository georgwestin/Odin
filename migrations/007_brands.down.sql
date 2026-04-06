-- 007_brands.down.sql

BEGIN;

ALTER TABLE daily_player_activity DROP CONSTRAINT IF EXISTS fk_daily_player_activity_brand_id;
ALTER TABLE daily_ggr DROP CONSTRAINT IF EXISTS fk_daily_ggr_brand_id;
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS fk_campaigns_brand_id;
ALTER TABLE players DROP CONSTRAINT IF EXISTS fk_players_brand_id;

DROP TRIGGER IF EXISTS trg_brands_updated_at ON brands;
DROP TABLE IF EXISTS brands;

COMMIT;
