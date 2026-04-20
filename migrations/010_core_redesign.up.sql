-- 010_core_redesign.up.sql
-- Core backend redesign: player, wallet, bonus wallet, payments, bets

BEGIN;

-- ============================================================
-- 1. PLAYERS — unique by email, has a playerCurrency
-- ============================================================

-- Add player_currency column to existing players table
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS player_currency CHAR(3) NOT NULL DEFAULT 'EUR',
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_login_ip INET;

-- Ensure email uniqueness constraint exists
-- (already UNIQUE in 001_auth but making explicit)

-- ============================================================
-- 2. WALLETS — one per player, holds current real-money balance
--    Balance is the source of truth (derived from ledger for audit)
-- ============================================================

-- wallets already exist from 002_wallet.up.sql
-- Add player_currency mirror for quick access
ALTER TABLE wallets
    ADD COLUMN IF NOT EXISTS player_currency CHAR(3);

-- Backfill wallet player_currency from player
UPDATE wallets w SET player_currency = p.player_currency
FROM players p WHERE w.player_id = p.id AND w.player_currency IS NULL;

ALTER TABLE wallets ALTER COLUMN player_currency SET DEFAULT 'EUR';

-- ============================================================
-- 2b. LOGIN SESSIONS — track every login/logout with IP
-- ============================================================

CREATE TABLE IF NOT EXISTS login_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    brand_id        UUID NOT NULL,
    ip_address      INET NOT NULL,
    user_agent      TEXT,
    country         CHAR(2),
    login_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logout_at       TIMESTAMPTZ,
    logout_type     TEXT CHECK (logout_type IN ('manual', 'expired', 'forced')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_sessions_player_id ON login_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(player_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_login_sessions_login_at ON login_sessions(login_at);

-- ============================================================
-- 3. BONUS WALLETS — separate wallet for bonus funds
--    Each bonus wallet entry has an amount and wagering requirement
-- ============================================================

CREATE TABLE IF NOT EXISTS bonus_wallets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    brand_id            UUID NOT NULL,
    currency            CHAR(3) NOT NULL DEFAULT 'EUR',
    balance             NUMERIC(18, 4) NOT NULL DEFAULT 0
                        CHECK (balance >= 0),
    wagering_required   NUMERIC(18, 4) NOT NULL DEFAULT 0
                        CHECK (wagering_required >= 0),
    wagering_completed  NUMERIC(18, 4) NOT NULL DEFAULT 0
                        CHECK (wagering_completed >= 0),
    source              TEXT,  -- e.g. 'welcome_bonus', 'deposit_bonus', 'free_spins'
    bonus_id            UUID,  -- FK to bonuses table if applicable
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'expired', 'forfeited')),
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bonus_wallets_player_id ON bonus_wallets(player_id);
CREATE INDEX IF NOT EXISTS idx_bonus_wallets_status ON bonus_wallets(status);

CREATE TRIGGER trg_bonus_wallets_updated_at
    BEFORE UPDATE ON bonus_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. PAYMENTS — deposits and withdrawals with state machine
--    States: initiated → pending → settled (or failed/cancelled)
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    brand_id            UUID NOT NULL,
    type                TEXT NOT NULL
                        CHECK (type IN ('deposit', 'withdrawal')),
    status              TEXT NOT NULL DEFAULT 'initiated'
                        CHECK (status IN ('initiated', 'pending', 'settled', 'failed', 'cancelled')),
    -- Amounts in multiple currencies
    amount              NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
    currency            CHAR(3) NOT NULL,  -- the currency the payment was made in
    player_amount       NUMERIC(18, 4) NOT NULL,
    player_currency     CHAR(3) NOT NULL,
    base_amount         NUMERIC(18, 4),
    base_currency       CHAR(3),
    -- Payment method details
    payment_method      TEXT,  -- 'swish', 'trustly', 'visa', 'bankwire', etc.
    payment_provider    TEXT,  -- provider reference
    external_ref        TEXT,  -- external transaction reference from payment provider
    -- Processing
    idempotency_key     TEXT UNIQUE NOT NULL,
    wallet_id           UUID REFERENCES wallets(id),
    ledger_entry_id     UUID,  -- FK to ledger_entries when settled
    -- Metadata
    description         TEXT,
    failure_reason      TEXT,
    ip_address          INET,
    -- Timestamps
    initiated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pending_at          TIMESTAMPTZ,
    settled_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_player_id ON payments(player_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_external_ref ON payments(external_ref);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments(idempotency_key);

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. BET TRANSACTIONS — bets with state machine
--    States: pending → settled (won/lost/void/cashed_out)
-- ============================================================

-- bets table already exists from 003_betting.up.sql
-- Add missing columns for proper state tracking
ALTER TABLE bets
    ADD COLUMN IF NOT EXISTS player_currency CHAR(3),
    ADD COLUMN IF NOT EXISTS settled_payout NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS bonus_contribution NUMERIC(18, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_bonus_bet BOOLEAN DEFAULT false;

-- Update existing bets to have player_currency from player
UPDATE bets b SET player_currency = p.player_currency
FROM players p WHERE b.player_id = p.id AND b.player_currency IS NULL;

-- ============================================================
-- 6. LEDGER ENTRIES — append-only audit trail
--    Every balance change is recorded here
--    Links back to payments or bets as reference
-- ============================================================

-- ledger_entries already exists from 002_wallet.up.sql
-- Add reference to payment if applicable
DROP TRIGGER IF EXISTS trg_ledger_no_update ON ledger_entries;

ALTER TABLE ledger_entries
    ADD COLUMN IF NOT EXISTS payment_id UUID,
    ADD COLUMN IF NOT EXISTS bet_id UUID,
    ADD COLUMN IF NOT EXISTS bonus_wallet_id UUID;

CREATE INDEX IF NOT EXISTS idx_ledger_payment_id ON ledger_entries(payment_id);
CREATE INDEX IF NOT EXISTS idx_ledger_bet_id ON ledger_entries(bet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_bonus_wallet_id ON ledger_entries(bonus_wallet_id);

-- Re-enable append-only protection
CREATE TRIGGER trg_ledger_no_update
    BEFORE UPDATE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_mutation();

-- ============================================================
-- 7. VIEWS — convenient read views for common queries
-- ============================================================

-- Player summary view: balance, bonus balance, total deposits/withdrawals
CREATE OR REPLACE VIEW player_summary AS
SELECT
    p.id AS player_id,
    p.email,
    p.first_name,
    p.last_name,
    p.player_currency,
    p.kyc_status,
    p.is_active,
    p.brand_id,
    w.id AS wallet_id,
    COALESCE(w.balance, 0) AS wallet_balance,
    COALESCE(bw.total_bonus, 0) AS bonus_balance,
    COALESCE(bw.total_wagering_remaining, 0) AS wagering_remaining,
    COALESCE(dep.total_deposits, 0) AS total_deposits,
    COALESCE(dep.deposit_count, 0) AS deposit_count,
    COALESCE(wd.total_withdrawals, 0) AS total_withdrawals,
    COALESCE(wd.withdrawal_count, 0) AS withdrawal_count,
    COALESCE(bt.total_bets, 0) AS total_bets_amount,
    COALESCE(bt.bet_count, 0) AS bet_count,
    p.created_at AS registered_at,
    p.last_login_at
FROM players p
LEFT JOIN wallets w ON w.player_id = p.id
LEFT JOIN (
    SELECT player_id,
           SUM(balance) AS total_bonus,
           SUM(wagering_required - wagering_completed) AS total_wagering_remaining
    FROM bonus_wallets
    WHERE status = 'active'
    GROUP BY player_id
) bw ON bw.player_id = p.id
LEFT JOIN (
    SELECT player_id,
           SUM(player_amount) AS total_deposits,
           COUNT(*) AS deposit_count
    FROM payments
    WHERE type = 'deposit' AND status = 'settled'
    GROUP BY player_id
) dep ON dep.player_id = p.id
LEFT JOIN (
    SELECT player_id,
           SUM(player_amount) AS total_withdrawals,
           COUNT(*) AS withdrawal_count
    FROM payments
    WHERE type = 'withdrawal' AND status = 'settled'
    GROUP BY player_id
) wd ON wd.player_id = p.id
LEFT JOIN (
    SELECT player_id,
           SUM(stake::numeric) AS total_bets,
           COUNT(*) AS bet_count
    FROM bets
    GROUP BY player_id
) bt ON bt.player_id = p.id;

COMMIT;
