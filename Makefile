.PHONY: all setup keys infra migrate build test run clean

# Default target
all: setup build

# Generate JWT keys
keys:
	@bash scripts/generate-keys.sh

# Start infrastructure only
infra:
	docker-compose up -d postgres redis zookeeper kafka

# Run database migrations
migrate:
	docker-compose run --rm migrate "postgres://odin:odin_secret@postgres:5432/odin?sslmode=disable" up

# Full setup
setup: keys infra
	@echo "Waiting for infrastructure..."
	@sleep 10
	@$(MAKE) migrate

# Build all Go services
build:
	@for svc in auth wallet betting casino sportsfeed bonus reporting; do \
		echo "Building $$svc..."; \
		go build -o bin/$$svc ./cmd/$$svc; \
	done

# Run all Go tests
test:
	go test ./... -v -race -count=1

# Run specific service locally
run-%:
	go run ./cmd/$*

# Start everything with Docker
up:
	docker-compose up --build

# Start just infrastructure
up-infra:
	docker-compose up -d postgres redis zookeeper kafka

# Stop everything
down:
	docker-compose down

# Clean build artifacts
clean:
	rm -rf bin/
	docker-compose down -v

# Frontend commands
frontend-player:
	cd frontend/player && npm run dev

frontend-admin:
	cd frontend/admin && npm run dev

# Install frontend dependencies
frontend-install:
	cd frontend/player && npm install
	cd frontend/admin && npm install
