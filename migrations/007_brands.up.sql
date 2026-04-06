-- 007_brands.up.sql
-- Brands table with default seed

BEGIN;

CREATE TABLE brands (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    domain          TEXT UNIQUE NOT NULL,
    config          JSONB NOT NULL DEFAULT '{}'::JSONB,
    -- config schema: {
    --   "theme": { "primary_color": "#...", "secondary_color": "#..." },
    --   "logo_url": "https://...",
    --   "support_email": "support@...",
    --   "default_currency": "EUR",
    --   "allowed_countries": ["GB", "MT", "DE"],
    --   "license": { "jurisdiction": "MGA", "number": "MGA/..." }
    -- }
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brands_is_active ON brands(is_active);
CREATE INDEX idx_brands_domain ON brands(domain);

CREATE TRIGGER trg_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key from players to brands
ALTER TABLE players
    ADD CONSTRAINT fk_players_brand_id FOREIGN KEY (brand_id) REFERENCES brands(id);

-- Add foreign key from campaigns to brands
ALTER TABLE campaigns
    ADD CONSTRAINT fk_campaigns_brand_id FOREIGN KEY (brand_id) REFERENCES brands(id);

-- Add foreign key from daily_ggr to brands
ALTER TABLE daily_ggr
    ADD CONSTRAINT fk_daily_ggr_brand_id FOREIGN KEY (brand_id) REFERENCES brands(id);

-- Add foreign key from daily_player_activity to brands
ALTER TABLE daily_player_activity
    ADD CONSTRAINT fk_daily_player_activity_brand_id FOREIGN KEY (brand_id) REFERENCES brands(id);

-- Seed default brand
INSERT INTO brands (id, name, domain, config) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Odin Default',
    'play.odin.io',
    '{
        "theme": {
            "primary_color": "#1a1a2e",
            "secondary_color": "#e94560"
        },
        "logo_url": "https://cdn.odin.io/logos/default.svg",
        "support_email": "support@odin.io",
        "default_currency": "EUR",
        "allowed_countries": ["GB", "MT", "DE", "SE", "FI", "NO", "DK", "IE"],
        "license": {
            "jurisdiction": "MGA",
            "number": "MGA/B2C/000/0000"
        }
    }'::JSONB
);

COMMIT;
