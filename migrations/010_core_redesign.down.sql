-- 010_core_redesign.down.sql

BEGIN;

DROP VIEW IF EXISTS player_summary;

DROP TRIGGER IF EXISTS trg_ledger_no_update ON ledger_entries;
ALTER TABLE ledger_entries DROP COLUMN IF EXISTS payment_id;
ALTER TABLE ledger_entries DROP COLUMN IF EXISTS bet_id;
ALTER TABLE ledger_entries DROP COLUMN IF EXISTS bonus_wallet_id;
CREATE TRIGGER trg_ledger_no_update
    BEFORE UPDATE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_mutation();

ALTER TABLE bets DROP COLUMN IF EXISTS player_currency;
ALTER TABLE bets DROP COLUMN IF EXISTS settled_payout;
ALTER TABLE bets DROP COLUMN IF EXISTS bonus_contribution;
ALTER TABLE bets DROP COLUMN IF EXISTS is_bonus_bet;

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
DROP TABLE IF EXISTS payments;

DROP TRIGGER IF EXISTS trg_bonus_wallets_updated_at ON bonus_wallets;
DROP TABLE IF EXISTS bonus_wallets;

DROP TABLE IF EXISTS login_sessions;

ALTER TABLE wallets DROP COLUMN IF EXISTS player_currency;

ALTER TABLE players DROP COLUMN IF EXISTS player_currency;
ALTER TABLE players DROP COLUMN IF EXISTS first_name;
ALTER TABLE players DROP COLUMN IF EXISTS last_name;
ALTER TABLE players DROP COLUMN IF EXISTS phone;
ALTER TABLE players DROP COLUMN IF EXISTS last_login_at;
ALTER TABLE players DROP COLUMN IF EXISTS last_login_ip;

COMMIT;
