.PHONY: help start stop clean logs health seed ps shell bench minimal dev full

# Default target
.DEFAULT_GOAL := help

# Profile selection
PROFILE ?= dev

# Compose file location
COMPOSE_FILE := ops/local/compose.yml

##@ General Commands

help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Profile Management

start: ## Start dev profile (default), wait for health checks, print URLs
	@echo "🚀 Starting ODP (profile: $(PROFILE))..."
	@docker compose -f $(COMPOSE_FILE) --profile $(PROFILE) up -d
	@echo "⏳ Waiting for services to be ready..."
	@./ops/scripts/health_check.sh
	@echo ""
	@echo "✅ All services ready!"
	@echo ""
	@echo "Core Services:"
	@echo "  User API:        http://localhost:18080"
	@echo "  Temporal UI:     http://localhost:18088"
	@echo "  Catalog Stub:    http://localhost:18090"
	@echo "  Stubs API:       http://localhost:18086"
	@echo ""
	@echo "Storage:"
	@echo "  MinIO Console:   http://localhost:19001  (admin:minioadmin)"
	@echo "  PostgreSQL:      localhost:15432         (postgres:postgres)"
	@echo "  Redis:           localhost:16379"
	@if [ "$(PROFILE)" = "full" ]; then \
		echo ""; \
		echo "Data Platform (full profile):"; \
		echo "  Dagster:         http://localhost:18084"; \
		echo "  MLflow:          http://localhost:18087"; \
		echo "  Neo4j Browser:   http://localhost:17474"; \
	fi
	@echo ""
	@echo "📚 Docs: See odp/docs/quickstart.md"
	@echo ""

minimal: ## Start minimal profile (Temporal only)
	@$(MAKE) start PROFILE=minimal

dev: ## Start dev profile (explicitly)
	@$(MAKE) start PROFILE=dev

full: ## Start full profile (all services)
	@$(MAKE) start PROFILE=full

stop: ## Stop all services
	@echo "🛑 Stopping all services..."
	@docker compose -f $(COMPOSE_FILE) --profile minimal --profile dev --profile full down
	@echo "✅ All services stopped"

clean: ## Stop services and remove volumes (fresh start)
	@echo "🗑️  Removing all services and volumes..."
	@docker compose -f $(COMPOSE_FILE) --profile minimal --profile dev --profile full down -v
	@echo "✅ Clean complete (all data removed)"

##@ Operations

logs: ## Tail logs from all services
	@docker compose -f $(COMPOSE_FILE) logs -f --tail=100

ps: ## Show running services
	@docker compose -f $(COMPOSE_FILE) ps

health: ## Check service health
	@echo "🔍 Checking service health..."
	@./ops/scripts/health_check.sh
	@echo "✅ All services healthy"

seed: ## Create test workspaces, users, Delta tables
	@echo "🌱 Seeding test data..."
	@./ops/scripts/seed_local_data.sh
	@echo "✅ Seed data created"

##@ Development

shell: ## Exec into service container (usage: make shell SERVICE=user-api)
ifndef SERVICE
	@echo "❌ Error: SERVICE not specified"
	@echo "Usage: make shell SERVICE=user-api"
	@exit 1
endif
	@docker compose -f $(COMPOSE_FILE) exec $(SERVICE) /bin/sh

bench: ## Benchmark profile startup times
	@echo "⏱️  Benchmarking profile startup times..."
	@./ops/scripts/benchmark_profiles.sh

##@ Data Platform

.PHONY: init-data-layers
init-data-layers: ## Initialize Bronze/Silver/Gold layers (requires full profile)
	@echo "🔄 Initializing data layers..."
	@./ops/scripts/init_data_layers.sh

.PHONY: verify-data-layers
verify-data-layers: ## Verify all data layers are operational
	@echo "🔍 Verifying data layers..."
	@./ops/scripts/verify_data_layers.sh

.PHONY: dagster-ui
dagster-ui: ## Open Dagster UI in browser
	@open http://localhost:18084 || xdg-open http://localhost:18084 2>/dev/null || echo "Open http://localhost:18084 in your browser"

##@ Testing

test: ## Run all unit and integration tests with coverage
	@echo "🧪 Running all tests with coverage..."
	@python3 -m pytest tests/ -v --cov=data/dagster --cov-report=term-missing --cov-fail-under=80

test-unit: ## Run unit tests only
	@echo "🧪 Running unit tests..."
	@python3 -m pytest tests/ -v -m unit

test-integration: ## Run integration tests only (Dagster assets)
	@echo "🧪 Running integration tests..."
	@python3 -m pytest tests/integration/ -v --cov=data/dagster/assets --cov-report=term-missing

test-dagster: ## Run Dagster asset tests with coverage
	@echo "🧪 Testing Dagster medallion assets..."
	@python3 -m pytest tests/integration/test_dagster_assets.py -v --cov=data/dagster/assets --cov-report=term-missing --cov-report=html
	@echo ""
	@echo "📊 Coverage report: htmlcov/index.html"

test-minimal: ## Run E2E test for minimal profile
	@echo "🧪 Testing minimal profile..."
	@./tests/e2e/test_minimal_profile.sh

test-dev: ## Run E2E test for dev profile
	@echo "🧪 Testing dev profile..."
	@./tests/e2e/test_dev_profile.sh

test-full: ## Run E2E test for full profile
	@echo "🧪 Testing full profile..."
	@./tests/e2e/test_full_profile.sh

test-all: test test-minimal test-dev test-full ## Run all tests (unit + integration + E2E)

##@ Examples

example-minimal: ## Submit minimal workflow example
	@echo "📝 Submitting minimal workflow..."
	@curl -X POST http://localhost:18080/api/v1/pipelines \
		-H "Content-Type: application/yaml" \
		--data-binary @examples/pipelines/minimal-workflow.yaml
	@echo ""
	@echo "✅ Pipeline submitted. View progress at http://localhost:18088"

example-multi: ## Submit multi-source workflow example
	@echo "📝 Submitting multi-source workflow..."
	@curl -X POST http://localhost:18080/api/v1/pipelines \
		-H "Content-Type: application/yaml" \
		--data-binary @examples/pipelines/multi-source.yaml
	@echo ""
	@echo "✅ Pipeline submitted. View progress at http://localhost:18088"

example-mdrp: ## Submit MDRP pilot scenario
	@echo "📝 Submitting MDRP pilot scenario..."
	@curl -X POST http://localhost:18080/api/v1/pipelines \
		-H "Content-Type: application/yaml" \
		--data-binary @examples/scenarios/mdrp-pilot.yaml
	@echo ""
	@echo "✅ Pipeline submitted. View progress at http://localhost:18088"

##@ Maintenance

update-images: ## Pull latest Docker images
	@echo "📦 Pulling latest images..."
	@docker compose -f $(COMPOSE_FILE) pull
	@echo "✅ Images updated"

prune: ## Remove unused Docker resources
	@echo "🗑️  Pruning unused Docker resources..."
	@docker system prune -f
	@echo "✅ Prune complete"

rebuild: ## Rebuild all service images
	@echo "🔨 Rebuilding all service images..."
	@docker compose -f $(COMPOSE_FILE) build --no-cache
	@echo "✅ Rebuild complete"

restart: ## Restart all services
	@$(MAKE) stop
	@$(MAKE) start

##@ Information

ports: ## Show all port mappings
	@echo ""
	@echo "Port Mappings (non-standard 15xxx-19xxx range):"
	@echo ""
	@echo "Database Layer (15xxx):"
	@echo "  PostgreSQL:      15432 → 5432"
	@echo "  MongoDB:         15017 → 27017"
	@echo "  Neo4j Bolt:      17687 → 7687"
	@echo "  Neo4j HTTP:      17474 → 7474"
	@echo ""
	@echo "Event/Cache (16xxx):"
	@echo "  Redis:           16379 → 6379"
	@echo "  Qdrant HTTP:     16333 → 6333"
	@echo "  Qdrant gRPC:     16334 → 6334"
	@echo ""
	@echo "Temporal (17xxx):"
	@echo "  Temporal gRPC:   17233 → 7233"
	@echo "  Temporal UI:     18088 → 8080"
	@echo ""
	@echo "Application Services (18xxx):"
	@echo "  User API:        18080 → 8080"
	@echo "  YAML Processor:  18082 → 8080"
	@echo "  Agent Orch:      18083 → 8000"
	@echo "  Catalog Stub:    18090 → 8080"
	@echo "  Stubs:           18086 → 8000"
	@echo "  Dagster Web:     18084 → 3000"
	@echo "  Dagster gRPC:    18085 → 4000"
	@echo "  MLflow:          18087 → 5000"
	@echo ""
	@echo "Storage (19xxx):"
	@echo "  MinIO API:       19000 → 9000"
	@echo "  MinIO Console:   19001 → 9001"
	@echo ""

version: ## Show version information
	@echo ""
	@echo "ODP - AI-Native OSINT Open Data Platform"
	@echo "Version: 1.0 (Initial Implementation)"
	@echo "Date: 2025-10-27"
	@echo "Author: Pavel Spesivtsev (Fibonacci 7)"
	@echo ""
	@echo "Architecture:"
	@echo "  - Execution: Temporal + Go services"
	@echo "  - Data: Dagster + Delta Lake + PostgreSQL"
	@echo "  - AI: LangGraph + Qdrant + MLflow"
	@echo "  - Storage: MinIO (S3-compatible)"
	@echo ""
