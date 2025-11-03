# Environment Configuration

## Local Development

**Environment Variables** (`.env.example`):
- `EVENT_BUS=redis` (local) / `pulsar` (production)
- `AUTH_MODE=none` (local) / `keycloak` (production)
- `LLM_API_URL=http://stubs:8002/llm` (local) / real API (production)

## Docker Compose Profiles

- **minimal**: PostgreSQL + Temporal (workflows only)
- **dev**: minimal + Redis + APIs + MinIO + Delta Lake
- **full**: dev + Agent orchestrator + Dagster + MLflow + Qdrant + Neo4j

## Production

- Keycloak for OAuth/OIDC
- Pulsar for event bus
- GCS for object storage
- HashiCorp Vault for secrets

---

**Last Updated**: 2025-10-27
