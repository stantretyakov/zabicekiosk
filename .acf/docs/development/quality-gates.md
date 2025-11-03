# Quality Gates (SINGLE SOURCE OF TRUTH)

## Four+ Mandatory Checks

Before EVERY commit, these commands MUST pass:

### Go Services (user-api, yaml-processor, catalog-stub)

```bash
golangci-lint run ./...  # Linting (zero errors, zero warnings)
go test ./... -v -race -cover  # Tests with race detection
go build ./...  # Compilation
go mod tidy && go mod verify  # Dependency hygiene
```

### Python Services (agent-orchestrator, Temporal workflows, stubs)

```bash
ruff check .  # Linting (zero errors)
mypy . --strict  # Type checking (strict mode)
pytest --cov --cov-report=term --cov-fail-under=80  # Tests (≥80% coverage)
```

### Docker Services

```bash
docker-compose -f ops/local/compose.yml config  # Validate compose file
ops/scripts/health_check.sh  # All services healthy
```

### Integration Tests

```bash
pytest tests/integration/  # Multi-service tests
```

---

## Coverage Requirements

- **Overall Minimum**: ≥80% across all metrics (statements, branches, functions, lines)
- **Critical Path Requirements** (100% coverage):
  - API handlers (user-api endpoints)
  - YAML processing logic (yaml-processor)
  - Temporal workflow logic
  - Business logic
  - Authentication/authorization flows
  - Data transformations (Dagster assets)

---

## Zero Bypass Tolerance

**NEVER Use**:
- `--no-verify` (bypasses pre-commit hooks)
- `// nolint` or `# noqa` without justification
- `# type: ignore` without comment explaining why
- `any` types in Go (defeats typing)
- `.only` in tests (breaks test suite)
- `.skip` in tests (except temporarily with ticket)

---

## Run All Together

```bash
# Go
golangci-lint run ./... && go test ./... -v -race -cover && go build ./...

# Python
ruff check . && mypy . --strict && pytest --cov --cov-fail-under=80

# Docker
docker-compose -f ops/local/compose.yml config && ops/scripts/health_check.sh
```

---

**Last Updated**: 2025-10-27
**Document Owner**: ACF Framework (single source for all quality standards)
