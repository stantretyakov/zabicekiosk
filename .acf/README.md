# ODP - AI-Native OSINT Open Data Platform

**Complete local development environment for investigation pipelines at scale**

## 30-Second Quickstart

```bash
# Clone and start (dev profile, 60s startup)
cd odp
make start

# Services ready at:
# - User API:      http://localhost:18080
# - Temporal UI:   http://localhost:18088
# - MinIO Console: http://localhost:19001 (admin:minioadmin)
# - Catalog API:   http://localhost:18090

# Submit example pipeline
curl -X POST http://localhost:18080/api/v1/pipelines \
  -H "Content-Type: application/yaml" \
  --data-binary @examples/pipelines/minimal-workflow.yaml

# View results in Temporal UI
open http://localhost:18088
```

## What This Is

ODP is a **full stack Data/ML Platform** for AI-native OSINT investigations running entirely on your laptop:

- **300M requests/month capability** (MDRP pilot: 11k keywords → 1M req/month)
- **Zero cloud dependencies** - PostgreSQL, Temporal, Redis, MinIO, all local
- **Realistic stubs** - Mock Twitter, Facebook, ML models, breach databases
- **Complete data platform** - Delta Lake medallion architecture (Bronze/Silver/Gold)
- **AI agent orchestration** - LangGraph-powered pipeline generation
- **Production parity** - Same tech stack, same interfaces, easy promotion

## Profile Strategy

| Profile | Startup | RAM | Purpose |
|---------|---------|-----|---------|
| **minimal** | 30s | 1.5GB | Temporal workflows only |
| **dev** (default) | 60s | 3GB | **Daily development** |
| **full** | 90s | 5GB | AI agents + graph database + ML |

```bash
make minimal   # Temporal + PostgreSQL only
make start     # Default: dev profile
make full      # All services (Agent, Qdrant, Dagster, MLflow, Neo4j)
```

## Architecture Overview

```
User API (Go) → Event Bus (Redis) → YAML Processor (Go)
                                          ↓
                                    Temporal (Workflows)
                                          ↓
         ┌────────────────────────────────┼────────────────────┐
         ↓                                ↓                    ↓
    Crawlers (Stubs)              ML Models (Stubs)      Dagster (Data)
         ↓                                ↓                    ↓
    Bronze Layer              →      Silver Layer      →  Gold Layer
    (Raw data)                    (Cleaned data)      (Business aggregates)
```

**Key Components:**
- **Temporal** - Durable workflow orchestration (10k concurrent workflows)
- **Delta Lake** - ACID lakehouse (Bronze/Silver/Gold medallion)
- **Dagster** - Data + ML pipeline orchestration
- **Redis** - Event bus (production: Apache Pulsar)
- **MinIO** - S3-compatible storage (production: GCS)

## What You Can Do

### 1. Manual YAML Pipelines
Write investigation workflows in declarative YAML:

```yaml
# examples/pipelines/minimal-workflow.yaml
version: "1.0"
pipeline_id: "twitter-investigation"
workspace_id: "workspace-abc123"

steps:
  - id: "collect_twitter"
    type: "crawler"
    method: "crawler_twitter_profile"
    inputs:
      username: "target_handle"
    outputs:
      profile: "twitter_data"

  - id: "analyze_sentiment"
    type: "ml_model"
    model: "sentiment_analysis_v1"
    inputs:
      texts:
        from: "{{collect_twitter.recent_posts[*].text}}"
    depends_on: ["collect_twitter"]
```

**Template Syntax**: Use `{{step_id.field}}` to reference previous step outputs. The `[*]` operator extracts fields from arrays. See [Template Guide](docs/guides/template-resolution.md).

### 2. AI-Generated Pipelines
Let the agent create workflows from natural language:

```bash
curl -X POST http://localhost:18083/api/v1/agent/generate \
  -d '{"request": "Investigate Twitter profile @target, check for breach data, analyze sentiment"}'
```

### 3. Data Transformations
Dagster orchestrates Bronze → Silver → Gold:

```python
# Dagster materializes assets automatically
@asset
def silver_social_profiles(bronze_social_profiles):
    return clean_and_validate(bronze_social_profiles)
```

## Quick Commands

```bash
make start      # Start dev profile (DEFAULT)
make stop       # Stop all services
make clean      # Remove volumes, fresh start
make health     # Check service readiness
make seed       # Create test workspaces + data
make logs       # Tail all logs
make ps         # Show running services
```

## Service URLs (Dev Profile)

**Core APIs:**
- User API: http://localhost:18080
- YAML Processor: http://localhost:18082
- Catalog Stub: http://localhost:18090
- Stubs (Mocks): http://localhost:18086

**Infrastructure:**
- Temporal UI: http://localhost:18088
- MinIO Console: http://localhost:19001
- PostgreSQL: localhost:15432
- Redis: localhost:16379

**Data Platform (Full Profile):**
- Dagster UI: http://localhost:18084
- MLflow UI: http://localhost:18087
- Neo4j Browser: http://localhost:17474

## Documentation

- **[Quickstart Guide](docs/quickstart.md)** - Expanded getting started
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions
- **[Architecture](docs/architecture/)** - Complete system design
- **[Local vs Production](docs/architecture/local-vs-production.md)** - Design rationale

## Technology Stack

**Execution Layer:**
- Temporal (durable workflows)
- Go (User API, YAML Processor)
- Python + LangGraph (AI agent)

**Data Layer:**
- Delta Lake on MinIO (S3-compatible)
- Dagster (orchestration)
- PostgreSQL (metadata)

**ML/AI Layer:**
- Qdrant (vector store)
- MLflow (experiment tracking)
- BentoML stubs (model serving)

**Infrastructure:**
- Docker Compose (local orchestration)
- Redis (event bus)
- MinIO (object storage)

## Example Scenarios

**MDRP Pilot** (100 keywords, scaled from 11k production):
```bash
curl -X POST http://localhost:18080/api/v1/pipelines \
  --data-binary @examples/scenarios/mdrp-pilot.yaml
```

**CrimeWall Social Graph** (entity relationship extraction):
```bash
curl -X POST http://localhost:18080/api/v1/pipelines \
  --data-binary @examples/scenarios/crimewall-social-graph.yaml
```

## Port Strategy

**All ports use non-standard 15xxx-19xxx range to avoid dev conflicts:**
- 15xxx: Databases (PostgreSQL 15432, MongoDB 15017)
- 16xxx: Event/Cache (Redis 16379, Qdrant 16333)
- 17xxx: Temporal cluster (gRPC 17233, UI 18088)
- 18xxx: Application services (APIs, processors, workers)
- 19xxx: Object storage (MinIO 19000/19001)

## Design Principles

1. **Zero External Dependencies** - No API keys, no cloud accounts, runs offline
2. **Incremental Complexity** - Start minimal, add services as needed
3. **Production Parity** - Same tech, same interfaces, easy promotion
4. **Clear Separation** - Execution (Temporal) vs Data (Dagster) vs AI (LangGraph)

## What's NOT Included (Local Dev)

These are production-only (clearly marked with TODOs):
- ❌ Apache Pulsar (Redis used instead)
- ❌ Keycloak auth (trust-all mode)
- ❌ OpenMetadata (JSON catalog stub)
- ❌ BentoML serving (stubs only)
- ❌ Observability stack (console logs only)

**Migration path:** All have adapter patterns for easy production swap.

## Scale Targets

**MVP Target:** 50M req/month (MDRP pilot: 1M req/month)
**Production Target:** 300M req/month, 99.99% availability

**Current pilot metrics:**
- 1 enterprise client: 11,000 keywords → 1M requests/month
- 24-hour monitoring cycles → requested down to 1-hour cycles
- Government clients expect 10,000+ keywords each

## Project Context

This is the **local development environment** for Social Links' next-generation OSINT platform:
- **Timeline:** Q4 2025 - Q1 2026 MVP
- **Mission:** Replace legacy 2015-2025 platform with AI-native architecture
- **Products:** MDRP (threat monitoring), CrimeWall Next-Gen (graph investigations)

## Getting Help

**Common Issues:**
- Port conflicts → See docs/troubleshooting.md
- Slow startup → Check Docker resources (4 CPU, 8GB RAM recommended)
- MinIO errors → Restart bootstrap: `docker compose restart minio-bootstrap`

**File Structure:**
```
odp/
├── services/        # Go and Python microservices
├── data/            # Dagster assets and Delta schemas
├── examples/        # Runnable YAML pipelines
├── ops/             # Docker Compose, scripts
├── docs/            # Architecture documentation
└── tests/           # E2E and integration tests
```

## Contributing

This is a **working implementation** matching the architecture documents in `docs/architecture/`. All services have stubs with realistic responses. Extend by:
1. Adding methods to `data/catalog-metadata/stub-catalog.json`
2. Implementing handlers in `services/stubs/`
3. Creating YAML examples in `examples/pipelines/`

## License

Copyright © 2025 Social Links. Internal use only.

---

**Status:** Implementation-ready monorepo for MVP development
**Version:** 1.0 (Initial implementation)
**Author:** Pavel Spesivtsev (Fibonacci 7)
**Date:** 2025-10-27
