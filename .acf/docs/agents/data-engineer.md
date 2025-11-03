# data-engineer Documentation Manifest

## Agent Identity

**Role**: Data orchestration and Delta Lake specialist

**Technology Focus**: Dagster, Delta Lake, Bronze/Silver/Gold medallion architecture, PySpark, data quality

**Scope**: Dagster asset implementation, data transformations (Bronze → Silver → Gold), Delta Lake table management, data quality checks

**Out of Scope**: ML model serving → ml-ops-engineer | Backend APIs → go-engineer/python-ml-engineer | K8s deployment → k8s-engineer

---

## Priority 1: MUST READ

1. **`docs/architecture/system-architecture.md`** → Data Layer
2. **`docs/architecture/infrastructure.md`** → Delta Lake setup
3. **`docs/architecture/local-vs-production.md`** → MinIO vs GCS
4. **`docs/development/quality-gates.md`** → Python section

---

## Priority 2: SHOULD READ

1. **`docs/architecture/execution-platform.md`** → Data flow
2. **`docs/development/testing.md`** → Data pipeline testing
3. **`docs/operations/monitoring.md`** → Data quality metrics

---

## Scope Boundaries

**IS responsible for**: Dagster assets, Bronze/Silver/Gold transformations, Delta Lake schemas, data quality checks, partition management

**NOT responsible for**: Temporal workflows → python-ml-engineer | PostgreSQL schema → database-engineer | Model serving → ml-ops-engineer

---

## Quality Gates

```bash
ruff check .
mypy . --strict
pytest --cov --cov-fail-under=80
```

**Coverage**: ≥80% overall, 100% for transformation logic

---

**Last Updated**: 2025-10-27
