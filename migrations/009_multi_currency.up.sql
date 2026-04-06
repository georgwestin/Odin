-- 009_multi_currency.up.sql
-- Add multi-currency support: each transaction stored in baseCurrency,
-- playerCurrency, reportingCurrency, and betCurrency.

BEGIN;

-- Add currency config columns to brands
ALTER TABLE brands
    ADD COLUMN base_currency CHAR(3) NOT NULL DEFAULT 'EUR',
    ADD COLUMN reporting_currency CHAR(3) NOT NULL DEFAULT 'EUR';

-- Add multi-currency columns to ledger_entries
-- Disable the mutation triggers temporarily to allow ALTER
DROP TRIGGER IF EXISTS trg_ledger_no_update ON ledger_entries;

ALTER TABLE ledger_entries
    ADD COLUMN base_amount      NUMERIC(18, 4),
    ADD COLUMN base_currency    CHAR(3),
    ADD COLUMN player_amount    NUMERIC(18, 4),
    ADD COLUMN player_currency  CHAR(3),
    ADD COLUMN report_amount    NUMERIC(18, 4),
    ADD COLUMN report_currency  CHAR(3),
    ADD COLUMN bet_amount       NUMERIC(18, 4),
    ADD COLUMN bet_currency     CHAR(3),
    ADD COLUMN exchange_rate_info TEXT;

-- Backfill existing entries: set all currency amounts equal to the original amount
-- (assumes all existing data is in the brand's base currency)
UPDATE ledger_entries le SET
    base_amount = le.amount,
    base_currency = COALESCE(
        (SELECT b.base_currency FROM brands b
         JOIN wallets w ON w.id = le.wallet_id
         JOIN players p ON p.id = w.player_id
         JOIN brands b2 ON b2.id = p.brand_id
         WHERE b.id = p.brand_id
         LIMIT 1),
        'EUR'
    ),
    player_amount = le.amount,
    player_currency = COALESCE(le.currency, 'EUR'),
    report_amount = le.amount,
    report_currency = COALESCE(
        (SELECT b.reporting_currency FROM brands b
         JOIN wallets w ON w.id = le.wallet_id
         JOIN players p ON p.id = w.player_id
         WHERE b.id = p.brand_id
         LIMIT 1),
        'EUR'
    );

-- Now make the core currency columns NOT NULL
ALTER TABLE ledger_entries ALTER COLUMN base_amount SET NOT NULL;
ALTER TABLE ledger_entries ALTER COLUMN base_currency SET NOT NULL;
ALTER TABLE ledger_entries ALTER COLUMN player_amount SET NOT NULL;
ALTER TABLE ledger_entries ALTER COLUMN player_currency SET NOT NULL;
ALTER TABLE ledger_entries ALTER COLUMN report_amount SET NOT NULL;
ALTER TABLE ledger_entries ALTER COLUMN report_currency SET NOT NULL;
-- bet_amount and bet_currency remain nullable (only set for bet/win transactions)

-- Re-create the append-only trigger
CREATE TRIGGER trg_ledger_no_update
    BEFORE UPDATE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_mutation();

-- Add multi-currency columns to bets
ALTER TABLE bets
    ADD COLUMN stake_base       NUMERIC(18, 4),
    ADD COLUMN base_currency    CHAR(3),
    ADD COLUMN stake_player     NUMERIC(18, 4),
    ADD COLUMN player_currency  CHAR(3),
    ADD COLUMN stake_report     NUMERIC(18, 4),
    ADD COLUMN report_currency  CHAR(3),
    ADD COLUMN stake_bet        NUMERIC(18, 4),
    ADD COLUMN bet_currency     CHAR(3),
    ADD COLUMN payout_base      NUMERIC(18, 4),
    ADD COLUMN payout_player    NUMERIC(18, 4),
    ADD COLUMN payout_report    NUMERIC(18, 4),
    ADD COLUMN payout_bet       NUMERIC(18, 4);

-- Backfill existing bets
UPDATE bets SET
    stake_base = stake,
    base_currency = currency,
    stake_player = stake,
    player_currency = currency,
    stake_report = stake,
    report_currency = currency,
    stake_bet = stake,
    bet_currency = currency,
    payout_base = actual_payout,
    payout_player = actual_payout,
    payout_report = actual_payout,
    payout_bet = actual_payout;

ALTER TABLE bets ALTER COLUMN stake_base SET NOT NULL;
ALTER TABLE bets ALTER COLUMN base_currency SET NOT NULL;
ALTER TABLE bets ALTER COLUMN stake_player SET NOT NULL;
ALTER TABLE bets ALTER COLUMN player_currency SET NOT NULL;
ALTER TABLE bets ALTER COLUMN stake_report SET NOT NULL;
ALTER TABLE bets ALTER COLUMN report_currency SET NOT NULL;
ALTER TABLE bets ALTER COLUMN stake_bet SET NOT NULL;
ALTER TABLE bets ALTER COLUMN bet_currency SET NOT NULL;

-- Add multi-currency columns to game_rounds
ALTER TABLE game_rounds
    ADD COLUMN base_bet     NUMERIC(18, 4),
    ADD COLUMN base_win     NUMERIC(18, 4),
    ADD COLUMN base_currency CHAR(3),
    ADD COLUMN report_bet   NUMERIC(18, 4),
    ADD COLUMN report_win   NUMERIC(18, 4),
    ADD COLUMN report_currency CHAR(3);

-- Create exchange_rates table for rate history and auditing
CREATE TABLE exchange_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency   CHAR(3) NOT NULL,
    to_currency     CHAR(3) NOT NULL,
    rate            NUMERIC(18, 8) NOT NULL,
    source          TEXT NOT NULL DEFAULT 'manual',
    effective_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency, effective_at DESC);

-- Update the Swedbet brand seed with EUR base currency
UPDATE brands SET
    base_currency = 'EUR',
    reporting_currency = 'EUR',
    config = config || '{
        "base_currency": "EUR",
        "reporting_currency": "EUR",
        "allowed_currencies": ["EUR", "SEK", "USD", "GBP", "NOK", "DKK"]
    }'::JSONB
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Insert Swedbet brand
INSERT INTO brands (id, name, domain, base_currency, reporting_currency, config) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Swedbet',
    'swedbet.com',
    'EUR',
    'EUR',
    '{
        "theme": {
            "primary_color": "#0066FF",
            "secondary_color": "#00C853",
            "background": "#FFFFFF"
        },
        "logo_url": "https://cdn.swedbet.com/logos/swedbet.svg",
        "support_email": "support@swedbet.com",
        "default_currency": "SEK",
        "base_currency": "EUR",
        "reporting_currency": "EUR",
        "allowed_currencies": ["EUR", "SEK", "USD", "GBP", "NOK", "DKK"],
        "allowed_countries": ["SE", "FI", "NO", "DK", "DE", "GB", "MT", "IE"],
        "license": {
            "jurisdiction": "Spelinspektionen",
            "number": "18Li7777"
        }
    }'::JSONB
);

COMMIT;
