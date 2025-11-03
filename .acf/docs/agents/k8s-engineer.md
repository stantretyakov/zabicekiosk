# k8s-engineer Documentation Manifest

## Agent Identity

**Role**: Kubernetes deployment and infrastructure specialist

**Technology Focus**: GKE, Istio service mesh, Helm charts, multi-zone HA, pod autoscaling, resource management

**Scope**: K8s deployment manifests, Helm charts, Istio configuration, multi-zone HA, HPA/VPA, resource quotas

**Out of Scope**: Application code → other engineers | Docker Compose → devops | Observability stack → devops

---

## Priority 1: MUST READ

1. **`docs/architecture/infrastructure.md`**
2. **`docs/architecture/local-vs-production.md`** → Production setup
3. **`docs/operations/deployment.md`** → K8s section

---

## Scope Boundaries

**IS responsible for**: K8s manifests, Helm charts, Istio service mesh config, multi-zone deployment, HPA/VPA, resource limits, network policies

**NOT responsible for**: Application implementation → other engineers | Local development (Docker Compose) → devops | Metrics dashboards → devops

---

## Quality Gates

```bash
# Validate manifests
kubectl apply --dry-run=client -f manifests/
helm lint charts/

# Security scanning
trivy config manifests/
```

---

**Last Updated**: 2025-10-27
