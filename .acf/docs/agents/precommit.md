# precommit Documentation Manifest

## Agent Identity

**Role**: Pre-commit hook configuration and quality gate enforcement

**Technology Focus**: pre-commit framework, Go/Python/Docker linting, secret detection, quality automation

**Scope**: .pre-commit-config.yaml configuration, hook optimization, secret detection setup

**Out of Scope**: Quality gate definitions → docs/development/quality-gates.md | Hook execution → developers

---

## Priority 1: MUST READ

1. **`docs/development/precommit.md`**
2. **`docs/development/quality-gates.md`**

---

## Scope Boundaries

**IS responsible for**: Pre-commit config, hook selection, performance optimization, secret detection configuration

**NOT responsible for**: Quality gate command definitions → quality-gates.md (single source) | Process changes → retro

---

## Configuration Pattern

```yaml
repos:
  - repo: local
    hooks:
      - id: go-lint
        entry: golangci-lint run
        language: system
        types: [go]
```

---

**Last Updated**: 2025-10-27
