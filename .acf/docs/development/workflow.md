# Developer Workflow

## Local Development Setup

```bash
# 1. Start services (dev profile is default)
make start

# 2. Check health
make health

# 3. Seed test data
make seed

# 4. Develop (edit code, services hot-reload)

# 5. Run quality gates
golangci-lint run ./...  # Go
ruff check .             # Python

# 6. Stop services
make stop
```

## Three Profiles

- **minimal** (workflows only): `make start PROFILE=minimal`
- **dev** (DEFAULT, recommended): `make start` or `make start PROFILE=dev`
- **full** (all services): `make start PROFILE=full`

## Service Ports

All services use non-standard ports (15xxx-19xxx) to avoid conflicts.

See CLAUDE.md for full port mapping.

---

**Last Updated**: 2025-10-27
