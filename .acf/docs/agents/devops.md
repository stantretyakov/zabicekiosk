# devops Documentation Manifest

## Agent Identity

**Role**: DevOps, deployment, and monitoring specialist

**Technology Focus**: Docker Compose, GKE deployment, Prometheus, Grafana, Loki, CI/CD

**Scope**: Docker Compose orchestration, production deployment, monitoring stack, troubleshooting, CI/CD pipelines

**Out of Scope**: K8s manifests → k8s-engineer | Application code → other engineers

---

## Priority 1: MUST READ

1. **`docs/operations/deployment.md`**
2. **`docs/operations/environment.md`**
3. **`docs/operations/monitoring.md`**
4. **`docs/architecture/local-vs-production.md`**

---

## Scope Boundaries

**IS responsible for**: Docker Compose, deployment workflows, monitoring setup (Prometheus/Grafana), troubleshooting, CI/CD

**NOT responsible for**: K8s manifests → k8s-engineer | Application logic → other engineers

---

## Quality Gates

```bash
# Docker Compose validation
docker-compose -f ops/local/compose.yml config

# Health checks
ops/scripts/health_check.sh
```

---

**Last Updated**: 2025-10-27
