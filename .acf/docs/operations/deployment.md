# Deployment

## Local Development (Docker Compose)

```bash
# Start services (dev profile)
make start

# Stop services
make stop

# Restart services
make restart

# View logs
docker-compose -f ops/local/compose.yml logs -f [service-name]
```

## Production (GKE/Kubernetes)

**Infrastructure**:
- GKE multi-zone cluster
- Istio service mesh
- Helm charts for deployment
- Prometheus + Grafana monitoring

**Deployment Process**:
1. Build Docker images
2. Push to GCR (Google Container Registry)
3. Deploy with Helm: `helm upgrade --install odp charts/odp/`
4. Verify health: `kubectl get pods -n odp`

---

**Last Updated**: 2025-10-27
