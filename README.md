# Odin iGaming Platform

A multibrand online casino and sports betting platform built with Go microservices and Next.js frontends.

## Architecture

**Backend:** 7 Go microservices communicating via REST + Kafka events  
**Frontend:** 2 Next.js 14 apps (player-facing + admin backoffice)  
**Infrastructure:** PostgreSQL 16, Redis 7, Apache Kafka

### Services

| Service | Port | Description |
|---------|------|-------------|
| Auth | 8001 | Registration, login, JWT, KYC, sessions |
| Wallet | 8002 | Ledger-based funds management, deposits, withdrawals |
| Betting | 8003 | Bet placement, settlement, cashout |
| Casino | 8004 | Game sessions, RGS provider integration |
| Sports Feed | 8005 | Live odds, events, WebSocket streaming |
| Bonus | 8006 | Promotions, wagering, responsible gambling limits |
| Reporting | 8007 | GGR/NGR, player activity, compliance reports |

### Frontends

| App | Port | Description |
|-----|------|-------------|
| Player | 3000 | Casino lobby, sportsbook, wallet, account |
| Admin | 3001 | Dashboard, player management, campaigns, reports |

## Quick Start

### Prerequisites

- Go 1.22+
- Node.js 18+
- Docker & Docker Compose

### Setup

```bash
# 1. Generate JWT signing keys
make keys

# 2. Start infrastructure (Postgres, Redis, Kafka)
make infra

# 3. Run database migrations
make migrate

# 4. Build all Go services
make build

# 5. Install frontend dependencies
make frontend-install
```

### Running

```bash
# Start everything with Docker
make up

# Or run individual services locally
make run-auth
make run-wallet
# etc.

# Start frontends
make frontend-player   # http://localhost:3000
make frontend-admin    # http://localhost:3001
```

## Project Structure

```
odin/
├── cmd/                    # Service entry points (7 services)
│   ├── auth/               # Auth service (handlers, service, repository)
│   ├── wallet/             # Wallet service
│   ├── betting/            # Betting engine
│   ├── casino/             # Casino service
│   ├── sportsfeed/         # Sports feed service
│   ├── bonus/              # Bonus engine
│   └── reporting/          # Reporting service
├── internal/               # Shared packages
│   ├── auth/               # JWT, middleware
│   ├── config/             # Viper config loader
│   ├── db/                 # PostgreSQL pool
│   ├── httperr/            # Standardized errors
│   ├── kafka/              # Producer/consumer
│   ├── middleware/          # Logging, rate limit, brand, request ID
│   ├── models/             # Domain models
│   ├── redis/              # Redis client
│   └── testutil/           # Test helpers
├── migrations/             # SQL migrations (8 pairs)
├── config/                 # YAML configs per service
├── docker/                 # Dockerfiles per service
├── frontend/
│   ├── player/             # Next.js player frontend
│   └── admin/              # Next.js admin backoffice
├── scripts/                # Setup & key generation
├── docker-compose.yml      # Full local stack
└── Makefile                # Build commands
```

## Key Design Decisions

### Multibrand
Every entity (players, campaigns, reports) is scoped by `brand_id`. Brand is resolved from the request hostname via middleware. Each brand can have its own theme, currency, and license configuration.

### Financial Safety
- **Append-only ledger:** No UPDATE/DELETE on financial records
- **Idempotency keys:** Every wallet mutation requires one, preventing duplicates
- **SELECT FOR UPDATE:** Row-level locking prevents race conditions
- **Balance derived from ledger:** Never stored as a mutable column

### Load Handling (200 concurrent players, ~40 bets/sec)
- Go's goroutine model handles concurrent connections efficiently
- Redis caching for odds data (sub-ms reads)
- Kafka for async event processing (settlement, reporting)
- PostgreSQL connection pooling (50 connections for high-traffic services)
- Idempotency ensures safe retries under load

### Responsible Gambling
- Deposit/loss/session limits with immediate reductions
- 24-hour cooling period for limit increases
- Self-exclusion (permanent via API)
- Cooling-off periods (24h to 6 weeks)
- All limits enforced at login and bet placement

### Compliance Ready
- MGA, UKGC, Spelinspektionen licensing frameworks considered
- Full audit trail via append-only ledger and audit_log table
- AML: withdrawals over EUR 2,000 trigger manual review
- No PII in Kafka messages (player_id references only)
- Casino RNG delegated to certified RGS providers

## Kafka Topics

| Topic | Producer | Consumers |
|-------|----------|-----------|
| player.registered | Auth | Reporting |
| wallet.transaction | Wallet | Reporting |
| bet.placed | Betting | Bonus, Reporting |
| bet.settled | Betting | Bonus, Reporting |
| odds.updated | Sports Feed | — |
| event.resulted | Sports Feed | Betting |

## Testing

```bash
# Run all tests
make test

# Run with coverage
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## Environment Variables

All services read from environment variables (12-factor compliant):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `KAFKA_BROKERS` | Comma-separated Kafka brokers |
| `AUTH_PUBLIC_KEY_PATH` | RSA public key for JWT verification |
| `AUTH_PRIVATE_KEY_PATH` | RSA private key (Auth service only) |
| `PORT` | HTTP listen port |
| `ENV` | development / staging / production |
