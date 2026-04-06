#!/bin/bash
# Full setup script for Odin iGaming Platform
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Odin iGaming Platform Setup ==="

# Generate JWT keys
echo ""
echo "1. Generating JWT keys..."
bash "$SCRIPT_DIR/generate-keys.sh"

# Start infrastructure
echo ""
echo "2. Starting infrastructure (Postgres, Redis, Kafka)..."
cd "$ROOT_DIR"
docker-compose up -d postgres redis zookeeper kafka

# Wait for services
echo ""
echo "3. Waiting for services to be healthy..."
sleep 10

# Run migrations
echo ""
echo "4. Running database migrations..."
docker-compose run --rm migrate "postgres://odin:odin_secret@postgres:5432/odin?sslmode=disable" up

# Install frontend dependencies
echo ""
echo "5. Installing frontend dependencies..."
cd "$ROOT_DIR/frontend/player" && npm install
cd "$ROOT_DIR/frontend/admin" && npm install

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Start all services:    docker-compose up"
echo "Player frontend:       cd frontend/player && npm run dev  (http://localhost:3000)"
echo "Admin frontend:        cd frontend/admin && npm run dev   (http://localhost:3001)"
echo ""
echo "Service ports:"
echo "  Auth:       http://localhost:8001"
echo "  Wallet:     http://localhost:8002"
echo "  Betting:    http://localhost:8003"
echo "  Casino:     http://localhost:8004"
echo "  SportsFeed: http://localhost:8005"
echo "  Bonus:      http://localhost:8006"
echo "  Reporting:  http://localhost:8007"
