# Mapping: ODP Monorepo → Discovery Phase Documentation

**Purpose:** Map implementation structure to original architecture documents

**Date:** 2025-10-27

---

## Document Mapping

| Monorepo Implementation | Discovery Phase Document | Status |
|------------------------|-------------------------|--------|
| **Complete Architecture** | `docs/architecture/system-architecture.md` | ✅ Copied |
| **Execution Platform** | `docs/architecture/execution-platform.md` | ✅ Copied |
| **ML Platform** | `docs/architecture/ml-platform.md` | ✅ Copied |
| **Infrastructure** | `docs/architecture/infrastructure.md` | ✅ Copied |
| **Identity & API** | `docs/architecture/identity-and-api.md` | ✅ Copied |
| **README Overview** | `docs/architecture/README.md` | ✅ Copied |

---

## Implementation Components Mapping

### Services → Architecture Documents

| Service | Architecture Document | Section | Status |
|---------|---------------------|---------|--------|
| `services/user-api/` | execution-platform.md | User API (Go Service) | 🏗️ Skeleton |
| `services/yaml-processor/` | execution-platform.md | YAML Processor | 🏗️ Skeleton |
| `services/agent-orchestrator/` | ml-platform.md | Agent Orchestration | 🏗️ Skeleton |
| `services/catalog-stub/` | system-architecture.md | Data Catalog (local stub) | 🏗️ Skeleton |
| `services/stubs/` | system-architecture.md | Mock Crawlers + ML | 🏗️ Skeleton |
| `services/execution/workflows/` | execution-platform.md | Temporal Workflows | 🏗️ Skeleton |
| `services/execution/activities/` | execution-platform.md | Temporal Activities | 🏗️ Skeleton |

### Data Platform → Architecture Documents

| Component | Architecture Document | Section | Status |
|-----------|---------------------|---------|--------|
| `data/dagster/assets/` | N/A (data-platform.md not present) | Dagster Assets | 🏗️ Skeleton |
| `schemas/delta/` | N/A | Delta Lake Schemas | 📝 TODO |
| `data/catalog-metadata/stub-catalog.json` | system-architecture.md | Method Registry | 📝 TODO |

### Infrastructure → Architecture Documents

| Component | Architecture Document | Section | Status |
|-----------|---------------------|---------|--------|
| `ops/local/compose.yml` | infrastructure.md | Kubernetes → Docker Compose | ✅ Implemented |
| Docker profiles (minimal/dev/full) | ../../docs/research/monorepo-proposal.md | Profile Strategy | ✅ Implemented |
| MinIO (S3-compatible) | infrastructure.md | Object Storage | ✅ Configured |
| Redis (event bus) | infrastructure.md | Event Bus | ✅ Configured |
| Temporal cluster | execution-platform.md | Workflow Engine | ✅ Configured |

---

## Key Design Decisions

### Local Dev Substitutions

Per `local-vs-production.md`, these substitutions simplify local development:

| Production Component | Local Dev Substitute | Rationale |
|---------------------|---------------------|-----------|
| **Apache Pulsar** | Redis Streams | Simpler setup, 100MB RAM vs 2GB |
| **Keycloak** | Trust-all mode | No auth overhead for single developer |
| **OpenMetadata** | JSON catalog stub | No operational complexity |
| **GCS** | MinIO | S3-compatible, production parity |
| **BentoML serving** | Stubs only | Mock endpoints, no GPU required |

### Service Consolidation

| Before (Proposal) | After (Implementation) | Rationale |
|------------------|----------------------|-----------|
| `crawler-stubs/` + `ml-stubs/` | `stubs/` (single service) | Fewer Dockerfiles, simpler debugging |
| `method-registry/` + `data-catalog-stub/` | `catalog-stub/` (merged) | Local dev simplification |

---

## YAML DSL Specification

**Authoritative Source:** `docs/architecture/execution-platform.md` → YAML Workflow Specification

**Implementation:**
- JSON Schema: `schemas/odp-yaml/odp-pipeline-1.0.json`
- Examples: `examples/pipelines/*.yaml`
- Validator: `services/user-api/` (Go service)
- Processor: `services/yaml-processor/` (Go service)

---

## Product Requirements Mapping

### MDRP Pilot Requirements

**Source:** Discovery phase → `odp-discovery/week1/03-product-requirements.md`

| Requirement | Implementation Component | Status |
|------------|-------------------------|--------|
| **11k keywords → 1M req/month** | Scaled to 100 keywords in `examples/scenarios/mdrp-pilot.yaml` | 📝 TODO |
| **1-hour monitoring cycles** | YAML DSL `schedule:` field | 📝 TODO |
| **Privacy (Q1 2026)** | `.env`: `LLM_API_URL` (self-hosted LLM support) | ✅ Configured |
| **Endpoint stability** | Temporal retry policies + circuit breakers | 🏗️ Skeleton |

### CrimeWall Requirements

| Requirement | Implementation Component | Status |
|------------|-------------------------|--------|
| **Graph rendering** | Neo4j + `examples/scenarios/crimewall-social-graph.yaml` | 📝 TODO |
| **Social graph analysis** | Neo4j (full profile), Dagster gold layer | 🏗️ Skeleton |

---

## Scale Targets

**Source:** `docs/architecture/system-architecture.md` → Performance Targets

| Metric | MVP Target | Production Target | Implementation |
|--------|------------|-------------------|----------------|
| **Throughput** | 50M req/month | 300M req/month | Horizontal scaling (K8s HPA) |
| **Availability** | 99.9% | 99.99% | Temporal durability + PostgreSQL HA |
| **Latency (p95)** | <500ms | <300ms | Caching (Redis) + async (Pulsar) |
| **Concurrent Workflows** | 1,000 | 10,000 | Temporal worker auto-scaling |

---

## Technology Stack Validation

| Technology | Discovery Phase | Monorepo Implementation | Status |
|-----------|----------------|------------------------|--------|
| **Temporal** | execution-platform.md | `temporalio/auto-setup:1.24.2` | ✅ Configured |
| **Delta Lake** | data-platform.md (not present) | MinIO + S3A protocol | ✅ Configured |
| **Dagster** | data-platform.md (not present) | TBD version | 📝 TODO |
| **Qdrant** | ml-platform.md | `qdrant/qdrant:v1.15.5` | ✅ Configured |
| **MLflow** | ml-platform.md | `ghcr.io/mlflow/mlflow:v2.9.0` | ✅ Configured |
| **Neo4j** | system-architecture.md | `neo4j:5.13-community` | ✅ Configured |
| **PostgreSQL** | infrastructure.md | `postgres:15-alpine` | ✅ Configured |
| **Redis** | infrastructure.md | `redis:7-alpine` | ✅ Configured |

---

## Port Mapping (Non-Standard Range)

**Rationale:** All ports 15xxx-19xxx to avoid dev environment conflicts

**Source:** `Makefile` → ports target

| Service | Standard Port | ODP Port | Mapping |
|---------|--------------|----------|---------|
| PostgreSQL | 5432 | 15432 | Database layer |
| Temporal gRPC | 7233 | 17233 | Orchestration |
| Temporal UI | 8080 | 18088 | UI services |
| Redis | 6379 | 16379 | Cache/event bus |
| MinIO API | 9000 | 19000 | Object storage |
| MinIO Console | 9001 | 19001 | Admin UI |
| User API | 8080 | 18080 | Application services |
| Catalog Stub | 8080 | 18090 | Application services |
| Stubs | 8000 | 18086 | Mock services |
| Qdrant HTTP | 6333 | 16333 | Vector store |
| Neo4j Bolt | 7687 | 17687 | Graph database |
| Dagster Web | 3000 | 18084 | Data platform |
| MLflow | 5000 | 18087 | ML platform |

---

## Missing Components (Marked as TODO)

These components exist in architecture documents but are NOT implemented in local dev:

1. **Apache Pulsar** - Replaced with Redis (adapter pattern for future swap)
2. **Keycloak** - Trust-all mode (auth middleware exists, no OIDC provider)
3. **OpenMetadata** - JSON catalog stub (interface defined, no UI)
4. **BentoML** - Stubs only (no actual model serving)
5. **Observability Stack** - Console logs only (no Prometheus/Grafana/Loki)
6. **API Gateway (Kong)** - Direct service access (no ingress)

**Migration Path:** All have adapter patterns or interface definitions for easy production integration.

---

## Document Metadata

**Author:** Pavel Spesivtsev (Fibonacci 7)
**Date:** 2025-10-27
**Purpose:** Bridge discovery phase architecture to implementation
**Status:** Living document (update as implementation progresses)
