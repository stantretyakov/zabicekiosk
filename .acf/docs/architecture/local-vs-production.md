# Local Development vs Production Architecture

**Purpose:** Explain design rationale for local development substitutions

**Date:** 2025-10-27

---

## Design Philosophy

**Local dev prioritizes:**
1. **Zero external dependencies** - Runs offline, no API keys required
2. **Rapid iteration** - <60s startup, hot reload supported
3. **Incremental complexity** - Start minimal, add services as needed
4. **Resource efficiency** - 1.5GB (minimal) to 5GB (full) RAM

**Production prioritizes:**
1. **Scale** - 300M req/month, 99.99% availability
2. **Multi-tenancy** - Workspace isolation, resource quotas
3. **Security** - mTLS, encryption at rest, audit logs
4. **Operability** - Observability stack, auto-scaling, disaster recovery

---

## Component Substitutions

### 1. Event Bus: Redis → Apache Pulsar

**Local Development:**
- **Redis** (image: redis:7-alpine, port: 16379)
- Simple pub/sub, 100MB RAM, single container

**Production:**
- **Apache Pulsar** (image: apachepulsar/pulsar:3.1.0)
- Multi-tenant namespaces, 2GB RAM, 3-node cluster (Broker + BookKeeper + ZooKeeper)

**Why Redis for Local Dev:**
| Factor | Redis Streams | Apache Pulsar |
|--------|--------------|---------------|
| **Startup Time** | 2 seconds | 60 seconds |
| **RAM Usage** | 100 MB | 2 GB (Broker + BookKeeper + ZooKeeper) |
| **Operational Complexity** | Zero (single container) | High (3-node cluster, ZooKeeper) |
| **Multi-Tenancy** | Manual (key prefixes) | Native (namespace isolation) |

**Why Pulsar for Production:**
- **Namespace-level isolation** - Critical for multi-tenant SaaS (workspace quotas)
- **Independent scaling** - Scale storage (BookKeeper) and compute (Brokers) separately
- **Geo-replication** - Multi-region deployments for EU/US clients
- **Tiered storage** - Cold data offloading to GCS (cost optimization)

**Migration Path:**
- **Adapter pattern** isolates event bus implementation from services
- **Interface**: EventBus with Publish/Subscribe operations
- **Local**: RedisAdapter (Redis Streams backend)
- **Production**: PulsarAdapter (Apache Pulsar backend)
- **Zero code changes**: Services use EventBus interface

**Implementation**: See `docs/development/patterns/adapter.md` for adapter pattern details.

**Decision Point:** Sprint 0 (infrastructure team evaluation)

---

### 2. Authentication: Trust-All → Keycloak

**Local Development:**
- **Trust-all middleware** bypasses authentication
- Sets fixed workspace_id in request context
- Controlled via `AUTH_MODE=none` environment variable

**Production:**
- **OIDC middleware** validates JWT tokens with Keycloak
- Extracts workspace_id from token claims
- Enforces RBAC roles (workspace-admin, project-member, viewer)

**Why Trust-All for Local Dev:**
| Factor | Trust-All | Keycloak |
|--------|-----------|----------|
| **Setup Time** | 0 minutes | 30 minutes (realm setup, clients, roles) |
| **Startup Overhead** | 0 | 1 GB RAM, 45s startup |
| **Token Management** | None | JWT refresh, rotation, revocation |
| **MFA** | N/A | Configurable per workspace |

**Why Keycloak for Production:**
- **OAuth2/OIDC** - Industry-standard auth protocols
- **Multi-tenant realms** - Workspace-level isolation
- **RBAC** - Role-based access control (owner, admin, analyst, viewer)
- **MFA enforcement** - Security compliance (ISO 27001, SOC 2)
- **SSO** - Enterprise identity federation (SAML, LDAP)

**Migration Path:**
- **Middleware pattern** with AUTH_MODE environment switch
- **Local**: Trust-all middleware (no token validation)
- **Production**: OIDC middleware (Keycloak token validation)
- **Zero code changes**: Services use authentication context, not implementation

**Implementation**: See `services/user-api/middleware/auth.go` for middleware implementation.

---

### 3. Data Catalog: JSON Stub → OpenMetadata

**Local Development:**
- **JSON file backend** (`data/catalog-metadata/stub-catalog.json`)
- **Schema**: Methods array (id, name, inputs, outputs) + Ontology (entities)
- **Example**: `{"method_id": "crawler_twitter_profile", "inputs": {"username": "string"}}`

**Production:**
- **OpenMetadata API** (`http://openmetadata:8585`)
- **Operations**: list_methods(entity_type), get_ontology(version)
- **Integration**: Python client for metadata ingestion

**Why JSON Stub for Local Dev:**
| Factor | JSON Stub | OpenMetadata |
|--------|-----------|--------------|
| **Startup Time** | Instant | 2 minutes (Elasticsearch + MySQL + UI) |
| **RAM Usage** | 0 (file read) | 1 GB |
| **Operational Complexity** | Zero | Medium (database migrations, indexing) |
| **UI** | None (JSON editing) | Full web UI for metadata management |

**Why OpenMetadata for Production:**
- **Data lineage tracking** - Bronze → Silver → Gold transformations
- **Ontology versioning** - Schema evolution, backward compatibility
- **Collaboration** - Data discovery, documentation, ownership
- **Integration** - Dagster, dbt, Spark connectors

**Migration Path:**
- **Adapter pattern** with CatalogAdapter interface
- **Local**: JSON file reader backend
- **Production**: OpenMetadata API client backend
- **Zero changes**: YAML validation uses same method signatures

**Implementation**: See `services/catalog-stub/adapter/` for catalog adapter implementation.

---

### 4. Object Storage: MinIO → GCS

**Local Development:**
- **MinIO** (image: minio/minio:latest, port: 19000)
- S3-compatible API, local development credentials
- Startup: 5 seconds, RAM: 100MB

**Production:**
- **GCS with S3A protocol** (HMAC-authenticated)
- **Configuration**: S3A endpoint → `https://storage.googleapis.com`
- **Credentials**: HMAC keys (GCS interoperability keys)

**Why MinIO for Local Dev:**
| Factor | MinIO | GCS |
|--------|-------|-----|
| **Startup Time** | 5 seconds | N/A (cloud service) |
| **RAM Usage** | 100 MB | N/A |
| **Cost** | Free | $0.02/GB/month |
| **S3A Compatibility** | ✅ Native | ✅ Via HMAC keys |

**Why GCS for Production:**
- **No operational overhead** - Fully managed, auto-scaling
- **Cross-region replication** - Built-in disaster recovery
- **Lifecycle policies** - Automatic cold storage tiering
- **Integration** - Native Dataflow, BigQuery connectors

**Migration Path:**
- **S3A protocol compatibility** enables seamless migration
- **Environment variable**: Update `AWS_ENDPOINT_URL` to GCS endpoint
- **Credentials**: Generate GCS HMAC keys, replace MinIO credentials
- **Zero code changes**: Delta Lake and Spark use same S3A client

---

### 5. LLM Inference: External API → Self-Hosted

**Local Development:**
- **External API** (OpenAI, Groq)
- Environment: `LLM_API_URL=https://api.openai.com/v1`
- Zero local resources, instant startup

**Production (Q1 2026 Privacy Requirement):**
- **Self-Hosted Ollama** (image: ollama/ollama:latest)
- Privacy-sensitive clients: Euronext, Dutch Railways, Airbnb
- Model storage volume mounted

**Why External API for Local Dev:**
| Factor | External API | Self-Hosted (Ollama) |
|--------|-------------|---------------------|
| **Setup Time** | Instant (API key) | 10 minutes (model download) |
| **RAM Usage** | 0 | 4 GB (7B model), 16 GB (70B model) |
| **GPU Required** | No | Recommended (10x faster) |
| **Startup Time** | 0 | 120 seconds (model loading) |

**Why Self-Hosted for Production (Q1 2026):**
- **Privacy** - Keywords/brand names don't leak to OpenAI/Groq
- **Compliance** - GDPR, ISO 27001 requirements
- **Cost predictability** - No per-token pricing
- **Low latency** - On-premise deployment option

**Migration Path:**
- `agent-orchestrator` already uses `LLM_API_URL` (OpenAI-compatible interface)
- Deploy Ollama → Update `.env` → Zero code changes
- Clients: Euronext, Dutch Railways, Airbnb (Q1 2026 decision points)

---

### 6. Observability: Console Logs → Full Stack

**Local Development:**
- **Console logs** via `make logs` command
- **JSON structured format**: `{"level":"info","service":"user-api","msg":"Pipeline submitted"}`
- **Query tools**: grep, jq for log filtering

**Production:**
- **Prometheus** (metrics collection, port 19090)
- **Grafana** (visualization dashboards, port 13000)
- **Loki** (log aggregation, port 13100)
- **Tempo** (distributed tracing via OpenTelemetry)

**Why Console Logs for Local Dev:**
| Factor | Console Logs | Prometheus + Grafana + Loki |
|--------|-------------|----------------------------|
| **Startup Overhead** | 0 | 2 GB RAM, 30s startup |
| **Operational Complexity** | Zero | Medium (retention policies, queries) |
| **Query Performance** | grep/jq | PromQL, LogQL |

**Why Full Stack for Production:**
- **Metrics** - Prometheus (QPS, latency, error rate)
- **Logs** - Loki (centralized, indexed, queryable)
- **Traces** - OpenTelemetry + Tempo (distributed tracing)
- **Dashboards** - Grafana (real-time visualization)
- **Alerting** - PagerDuty/Slack integration

**Migration Path:**
- Services already emit structured JSON logs
- Add OpenTelemetry SDK (metrics + traces)
- Deploy observability stack (1 week implementation)

---

## Delta Lake: No Substitution (Mandatory)

**Critical:** Delta Lake is **NOT optional** in dev profile.

**Why Mandatory:**
| Reason | Impact |
|--------|--------|
| **Architecture foundation** | Medallion layers (Bronze/Silver/Gold) are core design |
| **S3A protocol testing** | Production uses GCS, must validate S3A compatibility |
| **Dagster integration** | I/O managers require S3-compatible storage |
| **Multi-workspace isolation** | Partition keys tested locally |

**MinIO provides production parity** with minimal overhead (5s startup, 100MB RAM).

---

## Profile Strategy Summary

### Minimal Profile (1.5GB RAM, 30s startup)
**Services:** PostgreSQL + Temporal
**Use case:** Temporal workflow development, SDK exploration
**Substitutions:** None (core services only)

### Dev Profile (3GB RAM, 60s startup) - DEFAULT
**Services:** + Redis + MinIO + User API + YAML Processor + Catalog Stub + Stubs + Temporal Worker
**Use case:** 90% of daily development work
**Substitutions:**
- ✅ Redis (not Pulsar)
- ✅ JSON catalog (not OpenMetadata)
- ✅ Trust-all auth (not Keycloak)
- ✅ External LLM API (not self-hosted)
- ✅ Console logs (not observability stack)

### Full Profile (5GB RAM, 90s startup)
**Services:** + Agent Orchestrator + Qdrant + Dagster + MLflow + Neo4j
**Use case:** AI agent testing, graph analysis, ML training
**Substitutions:** Same as dev + full data/ML platform

---

## Technology Evaluation Status

**Finalized:**
- ✅ Temporal (durable workflows)
- ✅ Delta Lake (ACID lakehouse)
- ✅ Dagster (data orchestration)
- ✅ Qdrant (vector store)
- ✅ MLflow (experiment tracking)
- ✅ Neo4j (graph database)
- ✅ PostgreSQL (metadata)
- ✅ Redis (event bus, local dev)
- ✅ MinIO (S3-compatible storage)

**Under Evaluation (Sprint 0):**
- 🔍 **Apache Pulsar** vs Kafka (event bus)
- 🔍 **OpenMetadata** vs Apache Atlas vs DataHub (data catalog)

**Decision Criteria:**
1. Multi-tenancy support (namespace isolation)
2. Operational overhead (target: 1.8 FTE for Pulsar)
3. Community maturity (production deployments, support)

---

## Migration Checklist

**Local Dev → Production:**

1. **Event Bus** (1 week)
   - [ ] Deploy Apache Pulsar cluster (3-node)
   - [ ] Implement `PulsarAdapter` (event bus interface)
   - [ ] Update `.env`: `EVENT_BUS=pulsar`
   - [ ] Migrate namespace configs (workspace quotas)

2. **Authentication** (2 weeks)
   - [ ] Deploy Keycloak (realm setup, clients, roles)
   - [ ] Implement `OIDCMiddleware` (token validation)
   - [ ] Update `.env`: `AUTH_MODE=keycloak`
   - [ ] Configure MFA, SSO integrations

3. **Data Catalog** (1 week)
   - [ ] Deploy OpenMetadata (Elasticsearch + MySQL + UI)
   - [ ] Implement `OpenMetadataAdapter` (catalog interface)
   - [ ] Migrate JSON catalog data
   - [ ] Update `.env`: `DATA_CATALOG=openmetadata`

4. **Object Storage** (1 day)
   - [ ] Create GCS buckets (bronze, silver, gold, mlflow)
   - [ ] Generate HMAC keys for S3A compatibility
   - [ ] Update `.env`: `AWS_ENDPOINT_URL=https://storage.googleapis.com`
   - [ ] Test Delta Lake reads/writes

5. **LLM (Q1 2026)** (2 weeks)
   - [ ] Deploy Ollama (model download, GPU provisioning)
   - [ ] Benchmark inference latency (7B vs 70B models)
   - [ ] Update `.env`: `LLM_API_URL=http://ollama:11434/v1`
   - [ ] Client validation (Euronext, Dutch Railways)

6. **Observability** (1 week)
   - [ ] Deploy Prometheus + Grafana + Loki
   - [ ] Add OpenTelemetry SDK to services
   - [ ] Create Grafana dashboards
   - [ ] Configure alerts (PagerDuty/Slack)

**Total estimated migration effort:** 6-8 weeks (with existing adapter patterns)

---

## Document Metadata

**Author:** Pavel Spesivtsev (Fibonacci 7)
**Date:** 2025-10-27
**Purpose:** Explain local dev substitutions and production migration path
**Status:** Implementation guide
