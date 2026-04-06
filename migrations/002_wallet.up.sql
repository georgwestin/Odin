-- 002_wallet.up.sql
-- Wallets and append-only ledger

BEGIN;

CREATE TABLE wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    currency        CHAR(3) NOT NULL,
    balance         NUMERIC(18, 4) NOT NULL DEFAULT 0
                    CHECK (balance >= 0),
    bonus_balance   NUMERIC(18, 4) NOT NULL DEFAULT 0
                    CHECK (bonus_balance >= 0),
    version         BIGINT NOT NULL DEFAULT 0,  -- optimistic locking
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (player_id, currency)
);

CREATE TABLE ledger_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    type            TEXT NOT NULL
                    CHECK (type IN (
                        'deposit', 'withdrawal', 'bet', 'win', 'bonus_credit',
                        'bonus_debit', 'adjustment', 'rollback', 'fee'
                    )),
    amount          NUMERIC(18, 4) NOT NULL,
    balance_before  NUMERIC(18, 4) NOT NULL,
    balance_after   NUMERIC(18, 4) NOT NULL,
    reference_type  TEXT,           -- e.g. 'bet', 'game_round', 'deposit'
    reference_id    UUID,           -- FK to the originating entity
    idempotency_key TEXT UNIQUE NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent updates and deletes on ledger (append-only)
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ledger_entries is append-only: % operations are not permitted', TG_OP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_no_update
    BEFORE UPDATE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_ledger_no_delete
    BEFORE DELETE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_mutation();

CREATE INDEX idx_wallets_player_id ON wallets(player_id);
CREATE INDEX idx_ledger_wallet_id ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_reference_id ON ledger_entries(reference_id);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at);
CREATE INDEX idx_ledger_type ON ledger_entries(type);

CREATE TRIGGER trg_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
