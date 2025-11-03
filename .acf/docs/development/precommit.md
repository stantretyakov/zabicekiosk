# Pre-commit Hooks

## Setup

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually on all files
pre-commit run --all-files
```

## Configuration

See `.pre-commit-config.yaml` for hook configuration.

## Hooks

- Go: golangci-lint, go test, go build, gofmt, go mod tidy
- Python: ruff, mypy, pytest
- Docker: compose validation
- Security: detect-secrets
- General: trailing whitespace, YAML/JSON validation

## Emergency Bypass

**ONLY for production emergencies**:
```bash
SKIP=<hook-id> git commit -m "hotfix: critical issue

Bypass reason: Production down
Follow-up task: [task-id]"
```

---

**Last Updated**: 2025-10-27
