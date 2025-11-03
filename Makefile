# zabicekiosk - Makefile
# Quick commands for development workflow

.PHONY: help install dev build test lint format typecheck clean deploy-dev deploy-prod

# Default target
.DEFAULT_GOAL := help

## help: Show this help message
help:
	@echo "zabicekiosk - Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'

## install: Install all dependencies
install:
	npm install
	cd services/core-api && npm install
	cd services/booking-api && npm install
	cd web/admin-portal && npm install
	cd web/kiosk-pwa && npm install
	cd web/parent-web && npm install

## dev: Start development servers
dev:
	@echo "Starting development servers..."
	@echo "Core API: http://localhost:3001"
	@echo "Booking API: http://localhost:3002"
	@echo "Admin Portal: http://localhost:3000"
	npm run dev

## build: Build all services and web apps
build:
	@echo "Building all projects..."
	cd services/core-api && npm run build
	cd services/booking-api && npm run build
	cd web/admin-portal && npm run build
	cd web/kiosk-pwa && npm run build
	cd web/parent-web && npm run build

## test: Run all tests
test:
	@echo "Running tests..."
	cd services/core-api && npm test
	cd services/booking-api && npm test
	cd web/admin-portal && npm test
	cd web/kiosk-pwa && npm test

## test-coverage: Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	cd services/core-api && npm test -- --coverage
	cd services/booking-api && npm test -- --coverage
	cd web/admin-portal && npm test -- --coverage

## lint: Lint all code
lint:
	@echo "Linting code..."
	cd services/core-api && npm run lint
	cd services/booking-api && npm run lint
	cd web/admin-portal && npm run lint
	cd web/kiosk-pwa && npm run lint
	cd web/parent-web && npm run lint

## format: Format all code with Prettier
format:
	@echo "Formatting code..."
	cd services/core-api && npm run format
	cd services/booking-api && npm run format
	cd web/admin-portal && npm run format
	cd web/kiosk-pwa && npm run format
	cd web/parent-web && npm run format

## typecheck: Run TypeScript type checking
typecheck:
	@echo "Type checking..."
	cd services/core-api && npm run typecheck
	cd services/booking-api && npm run typecheck
	cd web/admin-portal && npm run typecheck
	cd web/kiosk-pwa && npm run typecheck
	cd web/parent-web && npm run typecheck

## quality: Run all quality checks (lint, typecheck, build, test)
quality: lint typecheck build test
	@echo "✅ All quality checks passed!"

## clean: Clean all build artifacts and node_modules
clean:
	@echo "Cleaning build artifacts..."
	rm -rf services/core-api/dist
	rm -rf services/booking-api/dist
	rm -rf web/admin-portal/dist
	rm -rf web/kiosk-pwa/dist
	rm -rf web/parent-web/dist
	rm -rf */node_modules
	rm -rf node_modules

## firebase-emulators: Start Firebase emulators
firebase-emulators:
	firebase emulators:start

## deploy-dev: Deploy to development environment
deploy-dev:
	@echo "Deploying to development..."
	firebase deploy --only hosting,firestore:rules,firestore:indexes --project dev

## deploy-prod: Deploy to production environment
deploy-prod:
	@echo "⚠️  Deploying to PRODUCTION..."
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		firebase deploy --only hosting,firestore:rules,firestore:indexes --project prod; \
	fi

## tf-plan: Run Terraform plan
tf-plan:
	cd infra && terraform plan

## tf-apply: Run Terraform apply
tf-apply:
	cd infra && terraform apply

## acf-backlog: Show ACF backlog status
acf-backlog:
	@echo "ACF Backlog Status:"
	@echo "===================="
	@echo "Pending:      $$(ls -1 .backlog/pending 2>/dev/null | wc -l)"
	@echo "In Progress:  $$(ls -1 .backlog/in-progress 2>/dev/null | wc -l)"
	@echo "Completed:    $$(ls -1 .backlog/completed 2>/dev/null | wc -l)"
	@echo "In Review:    $$(ls -1 .backlog/in-review 2>/dev/null | wc -l)"
	@echo "Accepted:     $$(ls -1 .backlog/accepted 2>/dev/null | wc -l)"
	@echo "Rejected:     $$(ls -1 .backlog/rejected 2>/dev/null | wc -l)"
	@echo "Blocked:      $$(ls -1 .backlog/blocked 2>/dev/null | wc -l)"

## acf-agents: List available ACF agents
acf-agents:
	@echo "Available ACF Agents:"
	@echo "===================="
	@ls -1 docs/agents/*.md | sed 's|docs/agents/||g' | sed 's|\.md||g'
