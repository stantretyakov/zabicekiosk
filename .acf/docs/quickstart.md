# ODP Quickstart Guide

**Complete setup in 5 minutes**

---

## Prerequisites

**Required:**
- Docker Desktop (4 CPU, 8GB RAM recommended)
- Git
- Terminal (bash/zsh)

**Optional:**
- curl (for testing APIs)
- jq (for JSON formatting)
- netcat (for health checks)

---

## Step 1: Clone and Start (60 seconds)

```bash
cd odp
make start
```

**What happens:**
1. Docker Compose pulls images (~2 minutes first time)
2. Services start in order (PostgreSQL → Temporal → Redis → APIs)
3. Health checks validate readiness
4. URLs printed to console

**Expected output:**
```
✅ All services ready!

Core Services:
  User API:        http://localhost:18080
  Temporal UI:     http://localhost:18088
  Catalog Stub:    http://localhost:18090
  Stubs API:       http://localhost:18086
```

---

## Step 2: Verify Services

```bash
# Check all services healthy
make health

# View logs
make logs

# Show running services
make ps
```

---

## Step 3: Submit Example Pipeline

```bash
# Submit minimal workflow
curl -X POST http://localhost:18080/api/v1/pipelines \
  -H "Content-Type: application/yaml" \
  --data-binary @examples/pipelines/minimal-workflow.yaml
```

**Or use Makefile shortcut:**
```bash
make example-minimal
```

---

## Step 4: View Execution

**Temporal UI:**
```bash
open http://localhost:18088
```

Navigate to: Workflows → Select your pipeline → View execution history

---

## Common Tasks

### Seed Test Data

```bash
make seed
```

Creates:
- 2 test workspaces (alice-corp, bob-investigations)
- Delta Lake Bronze/Silver/Gold buckets
- Sample method registry entries

### Submit Different Examples

```bash
# Multi-source investigation
make example-multi

# MDRP pilot scenario (100 keywords)
make example-mdrp
```

### Access Storage

**MinIO Console:**
```bash
open http://localhost:19001
# Login: minioadmin / minioadmin
```

Browse Delta Lake buckets (bronze, silver, gold)

### Query Method Registry

```bash
# List all methods
curl http://localhost:18090/api/v1/methods

# Get specific method
curl http://localhost:18090/api/v1/methods/crawler_twitter_profile

# Get ontology
curl http://localhost:18090/api/v1/ontology
```

### Test Stub Endpoints

```bash
# Mock Twitter crawler
curl -X POST http://localhost:18086/crawlers/twitter/profile \
  -H "Content-Type: application/json" \
  -d '{"username": "alice_crypto"}'

# Mock face recognition
curl -X POST http://localhost:18086/ml/face_recognition \
  -H "Content-Type: application/json" \
  -d '{"images": ["https://example.com/image.jpg"]}'
```

---

## Profile Selection

### Minimal Profile (Temporal Only)

```bash
make minimal
```

**Use case:** Temporal workflow development, SDK exploration
**Services:** PostgreSQL + Temporal
**Startup:** 30 seconds, 1.5GB RAM

### Dev Profile (Default)

```bash
make dev
# Or just: make start
```

**Use case:** 90% of daily development
**Services:** + Redis + MinIO + User API + Catalog + Stubs
**Startup:** 60 seconds, 3GB RAM

### Full Profile (All Services)

```bash
make full
```

**Use case:** AI agents, graph analysis, ML training
**Services:** + Agent Orchestrator + Qdrant + Dagster + MLflow + Neo4j
**Startup:** 90 seconds, 5GB RAM

---

## Stopping and Cleaning

```bash
# Stop services (preserves data)
make stop

# Stop and remove volumes (fresh start)
make clean

# Restart all services
make restart
```

---

## Next Steps

### Write Custom Pipeline

1. Copy example: `cp examples/pipelines/minimal-workflow.yaml my-pipeline.yaml`
2. Edit YAML (see [YAML Spec](architecture/execution-platform.md))
3. Submit: `curl -X POST http://localhost:18080/api/v1/pipelines --data-binary @my-pipeline.yaml`

### Chain Steps with Templates

**Use templates** to pass data between steps using `{{step_id.field}}` syntax.

**Example** - Extract and analyze tweet texts:

```yaml
steps:
  - id: "fetch_tweets"
    type: "crawler"
    method: "crawler_twitter_profile"
    inputs:
      username:
        from: "alice_crypto"
    outputs:
      profile: "twitter_data"

  - id: "analyze_sentiment"
    type: "ml_model"
    model: "sentiment_analysis_v1"
    inputs:
      texts:
        from: "{{fetch_tweets.recent_posts[*].text}}"  # Extract text from all posts
    outputs:
      sentiment_scores: "sentiment_results"
    depends_on: ["fetch_tweets"]  # Wait for fetch_tweets to complete
```

**Key points:**
- Reference previous step: `{{step_id.field}}`
- Extract array fields: `[*]` operator
- Enforce order: `depends_on` array

**See**: [Complete Template Guide](guides/template-resolution.md)

---

### Add Custom Method

1. Edit: `data/catalog-metadata/stub-catalog.json`
2. Add method definition (inputs, outputs, type)
3. Implement stub: `services/stubs/main.py`
4. Restart: `make restart`

### View Architecture

- **Complete System:** `docs/architecture/system-architecture.md`
- **Execution Platform:** `docs/architecture/execution-platform.md`
- **ML Platform:** `docs/architecture/ml-platform.md`
- **Mapping to Discovery:** `docs/snapshots/mappings/20251027-discovery-to-implementation.md`

---

## Troubleshooting

**Services won't start:**
```bash
# Check Docker resources (need 4 CPU, 8GB RAM)
docker info

# Check port conflicts
make ports
```

**Slow startup:**
- First run takes longer (image pulls)
- Increase Docker resources in settings
- Check logs: `make logs`

**Health check fails:**
```bash
# Check specific service
docker compose logs temporal
docker compose logs user-api

# Restart problematic service
docker compose restart temporal
```

See [Troubleshooting Guide](troubleshooting.md) for detailed solutions.

---

## Getting Help

**Documentation:**
- README.md (30-second quickstart)
- This guide (expanded details)
- Architecture docs (design rationale)

**Logs:**
```bash
make logs                    # All services
docker compose logs user-api # Specific service
```

**Service Status:**
```bash
make ps      # Running services
make health  # Health check
```

---

## What's Next?

**Implement Services:**
- user-api (YAML validation, submission)
- yaml-processor (YAML → Temporal workflows)
- agent-orchestrator (AI pipeline generation)
- Temporal workflows (execution logic)

**See TODOs in:**
- `services/*/main.go` or `main.py`
- `docker-compose.yml` (production components)
- `.env.example` (configuration switches)

**Explore Examples:**
- `examples/pipelines/` (runnable workflows)
- `examples/scenarios/` (MDRP, CrimeWall use cases)

---

**Questions?** Check docs/troubleshooting.md or architecture documentation.
