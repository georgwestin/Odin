-- 002_wallet.down.sql

BEGIN;

DROP TRIGGER IF EXISTS trg_wallets_updated_at ON wallets;
DROP TRIGGER IF EXISTS trg_ledger_no_update ON ledger_entries;
DROP TRIGGER IF EXISTS trg_ledger_no_delete ON ledger_entries;
DROP TABLE IF EXISTS ledger_entries;
DROP TABLE IF EXISTS wallets;
DROP FUNCTION IF EXISTS prevent_ledger_mutation();

COMMIT;
