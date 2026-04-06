-- 009_multi_currency.down.sql
-- Remove multi-currency support

BEGIN;

-- Remove Swedbet brand
DELETE FROM brands WHERE id = '00000000-0000-0000-0000-000000000002';

-- Drop exchange_rates table
DROP TABLE IF EXISTS exchange_rates;

-- Remove multi-currency columns from game_rounds
ALTER TABLE game_rounds
    DROP COLUMN IF EXISTS base_bet,
    DROP COLUMN IF EXISTS base_win,
    DROP COLUMN IF EXISTS base_currency,
    DROP COLUMN IF EXISTS report_bet,
    DROP COLUMN IF EXISTS report_win,
    DROP COLUMN IF EXISTS report_currency;

-- Remove multi-currency columns from bets
ALTER TABLE bets
    DROP COLUMN IF EXISTS stake_base,
    DROP COLUMN IF EXISTS base_currency,
    DROP COLUMN IF EXISTS stake_player,
    DROP COLUMN IF EXISTS player_currency,
    DROP COLUMN IF EXISTS stake_report,
    DROP COLUMN IF EXISTS report_currency,
    DROP COLUMN IF EXISTS stake_bet,
    DROP COLUMN IF EXISTS bet_currency,
    DROP COLUMN IF EXISTS payout_base,
    DROP COLUMN IF EXISTS payout_player,
    DROP COLUMN IF EXISTS payout_report,
    DROP COLUMN IF EXISTS payout_bet;

-- Remove multi-currency columns from ledger_entries
DROP TRIGGER IF EXISTS trg_ledger_no_update ON ledger_entries;

ALTER TABLE ledger_entries
    DROP COLUMN IF EXISTS base_amount,
    DROP COLUMN IF EXISTS base_currency,
    DROP COLUMN IF EXISTS player_amount,
    DROP COLUMN IF EXISTS player_currency,
    DROP COLUMN IF EXISTS report_amount,
    DROP COLUMN IF EXISTS report_currency,
    DROP COLUMN IF EXISTS bet_amount,
    DROP COLUMN IF EXISTS bet_currency,
    DROP COLUMN IF EXISTS exchange_rate_info;

CREATE TRIGGER trg_ledger_no_update
    BEFORE UPDATE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_mutation();

-- Remove currency columns from brands
ALTER TABLE brands
    DROP COLUMN IF EXISTS base_currency,
    DROP COLUMN IF EXISTS reporting_currency;

COMMIT;
