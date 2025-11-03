# ml-ops-engineer Documentation Manifest

## Agent Identity

**Role**: ML model serving and operations specialist

**Technology Focus**: BentoML, MLflow, Qdrant vector store, GPU infrastructure, model deployment

**Scope**: Model serving (BentoML), experiment tracking (MLflow), vector store operations (Qdrant), A/B testing, model monitoring

**Out of Scope**: Model training → separate ML team | Agent orchestration → python-ml-engineer | K8s deployment → k8s-engineer

---

## Priority 1: MUST READ

1. **`docs/architecture/ml-platform.md`** → ML infrastructure
2. **`docs/architecture/system-architecture.md`** → ML layer
3. **`docs/architecture/infrastructure.md`** → GPU setup

---

## Scope Boundaries

**IS responsible for**: BentoML service creation, MLflow experiment tracking, Qdrant collection management, model versioning, A/B testing setup

**NOT responsible for**: Model training → ML team | Agent workflows → python-ml-engineer | Production deployment → k8s-engineer

---

## Quality Gates

```bash
# BentoML service build
bentoml build

# Model serving tests
pytest tests/ml/
```

---

**Last Updated**: 2025-10-27
