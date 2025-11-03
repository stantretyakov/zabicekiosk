# ODP Quick Test Guide

**End-to-End Testing in 5 Minutes**

---

## Prerequisites

- Docker Desktop running (4 CPU, 8GB RAM recommended)
- Terminal with bash/zsh

---

## Step 1: Start Services (60 seconds)

```bash
cd odp
make start
```

**Wait for:**
```
✅ All services ready!

Core Services:
  User API:        http://localhost:18080
  Temporal UI:     http://localhost:18088
  Catalog Stub:    http://localhost:18090
  Stubs API:       http://localhost:18086
```

**If startup fails:**
```bash
make logs        # Check logs
make health      # Verify health
make clean       # Nuclear option: clean and restart
make start
```

---

## Step 2: Verify Services (30 seconds)

```bash
# Test catalog stub
curl http://localhost:18090/api/v1/methods | jq '.methods[] | .method_id'

# Expected output:
# "crawler_twitter_profile"
# "crawler_facebook_profile"
# "ml_face_recognition"
# "ml_sentiment_analysis"
# etc.

# Test stubs service
curl -X POST http://localhost:18086/crawlers/twitter/profile \
  -H "Content-Type: application/json" \
  -d '{"username": "alice_crypto"}' | jq .

# Expected: Mock Twitter profile data
```

---

## Step 3: Submit Minimal Pipeline (10 seconds)

```bash
# Submit minimal workflow
curl -X POST http://localhost:18080/api/v1/pipelines \
  -H "Content-Type: application/yaml" \
  --data-binary @examples/pipelines/minimal-workflow.yaml

# Expected output:
# {
#   "pipeline_id": "minimal-twitter-investigation",
#   "workspace_id": "workspace-test-001",
#   "status": "submitted",
#   "message": "Pipeline submitted successfully",
#   "temporal_ui": "http://localhost:18088/namespaces/default/workflows/minimal-twitter-investigation"
# }
```

**Or use Makefile shortcut:**
```bash
make example-minimal
```

---

## Step 4: View Execution in Temporal UI (30 seconds)

1. **Open Temporal UI:**
   ```bash
   open http://localhost:18088
   ```

2. **Navigate to workflow:**
   - Click "Workflows" in sidebar
   - Find your pipeline ID: `minimal-twitter-investigation`
   - Click to view execution history

3. **What to look for:**
   - ✅ Workflow status: "Running" or "Completed"
   - ✅ Activities executed: `crawl_twitter`, `run_sentiment_analysis`
   - ✅ Events: `WorkflowExecutionStarted`, `ActivityTaskScheduled`, etc.

**Screenshot guidance:**
- Each activity shows input/output
- Execution timeline shows sequential steps
- Events show Redis publish calls

---

## Step 5: Check Logs (Verify End-to-End)

```bash
# View all logs
make logs

# Or specific services:
docker compose -f ops/local/compose.yml logs user-api
docker compose -f ops/local/compose.yml logs yaml-processor
docker compose -f ops/local/compose.yml logs temporal-worker
```

**What to grep for:**
```bash
# user-api: Pipeline submission
make logs | grep "Published pipeline.submitted"

# yaml-processor: Workflow submission
make logs | grep "Started Temporal workflow"

# temporal-worker: Activity execution
make logs | grep "Crawling Twitter profile"
make logs | grep "Running sentiment analysis"
```

---

## Success Criteria

✅ **All services healthy** (`make health` passes)
✅ **Pipeline submitted** (user-api returns pipeline ID)
✅ **Workflow visible in Temporal UI** (http://localhost:18088)
✅ **Activities execute** (crawl_twitter, run_sentiment_analysis)
✅ **Stub responses** (mock data returned from stubs service)

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker resources
docker info | grep "Total Memory"

# Increase in Docker Desktop → Settings → Resources
# Minimum: 4GB RAM, 2 CPU
```

### Pipeline Submission Fails

**Check user-api logs:**
```bash
docker compose -f ops/local/compose.yml logs user-api
```

**Common issues:**
- Redis not connected → Restart: `docker compose -f ops/local/compose.yml restart redis`
- YAML invalid → Validate YAML syntax

### Workflow Not Starting

**Check yaml-processor logs:**
```bash
docker compose -f ops/local/compose.yml logs yaml-processor
```

**Common issues:**
- Not subscribed to Redis → Check "Subscribing to pipeline.submitted" message
- Temporal connection failed → Check temporal logs

### Activities Not Executing

**Check temporal-worker logs:**
```bash
docker compose -f ops/local/compose.yml logs temporal-worker
```

**Common issues:**
- Worker not connected → Restart: `docker compose -f ops/local/compose.yml restart temporal-worker`
- Stubs service down → Check: `curl http://localhost:18086/health`

---

## Advanced Testing

### Test Multi-Source Pipeline

```bash
curl -X POST http://localhost:18080/api/v1/pipelines \
  -H "Content-Type: application/yaml" \
  --data-binary @examples/pipelines/multi-source.yaml
```

**This tests:**
- Multiple crawler activities (Twitter, Facebook, LinkedIn)
- ML model activities (face recognition, sentiment, NER)
- Function activities (breach DB lookup)

### Monitor Redis Events

```bash
# Subscribe to all pipeline events
docker compose -f ops/local/compose.yml exec redis redis-cli

# In redis-cli:
SUBSCRIBE pipeline.*

# In another terminal, submit pipeline
make example-minimal

# Watch events:
# - pipeline.submitted
# - pipeline.started
# - pipeline.step.started
# - pipeline.step.completed
# - pipeline.completed
```

### Inspect MinIO Storage

```bash
open http://localhost:19001
# Login: minioadmin / minioadmin

# Browse buckets:
# - bronze
# - silver
# - gold
# - mlflow
```

---

## Performance Benchmarks

**Expected timings:**
- Service startup: 60 seconds (dev profile)
- Pipeline submission: <1 second (user-api response)
- Workflow start: <2 seconds (yaml-processor → Temporal)
- Activity execution: ~5-10 seconds (minimal workflow)
- Total end-to-end: ~15 seconds (submit → complete)

---

## Next Steps After Successful Test

### 1. Try Different Examples

```bash
make example-multi    # Multi-source investigation
make example-mdrp     # MDRP pilot (100 keywords)
```

### 2. View Architecture

```bash
# Read docs
cat docs/quickstart.md
cat docs/architecture/system-architecture.md
```

### 3. Explore Temporal UI

- View workflow history
- Inspect activity inputs/outputs
- Check execution timeline

### 4. Customize Pipeline

```bash
# Copy example
cp examples/pipelines/minimal-workflow.yaml my-test.yaml

# Edit YAML (change username, add steps)
# Submit
curl -X POST http://localhost:18080/api/v1/pipelines \
  -H "Content-Type: application/yaml" \
  --data-binary @my-test.yaml
```

---

## Quick Reference Commands

```bash
make start      # Start services (dev profile)
make stop       # Stop all services
make clean      # Remove volumes, fresh start
make health     # Check service health
make logs       # View logs
make ps         # Show running services
make ports      # Show port mappings

# Examples
make example-minimal
make example-multi
make example-mdrp
```

---

## What's Working

✅ **user-api** - YAML submission, Redis publishing
✅ **yaml-processor** - Redis subscription, Temporal workflow submission
✅ **Temporal worker** - Workflow execution, activity routing
✅ **Crawler activities** - Call stub services (Twitter, Facebook, LinkedIn)
✅ **ML activities** - Call stub services (face recognition, sentiment, NER)
✅ **Function activities** - Call stub services (breach DB)
✅ **Event publishing** - Publish to Redis for real-time updates
✅ **Stub services** - Return realistic mock data

---

## What's Still TODO

⏳ **Input resolution** - `{{step.output}}` template parsing
⏳ **Parallel execution** - Handle `depends_on` for parallelism
⏳ **Loop support** - Execute step loops
⏳ **Validation** - Data quality checks
⏳ **Output generation** - PDF/graph/dataset export
⏳ **Dagster integration** - Data transformations
⏳ **Agent orchestrator** - AI pipeline generation

See `../snapshots/implementation/20251027-monorepo-foundation.md` for complete roadmap.

---

## Success! What Now?

🎉 **You have a working end-to-end pipeline execution system!**

**Next priorities:**
1. Implement input resolution (`{{collect_twitter.profile.username}}`)
2. Add parallel execution (parse `depends_on`)
3. Implement Dagster integration (data transforms)
4. Build agent orchestrator (AI pipeline generation)

**Or explore:**
- Add custom methods to `data/catalog-metadata/stub-catalog.json`
- Implement new activities in `services/execution/activities/`
- Create custom YAML pipelines
- View execution in Temporal UI

---

**Congratulations! The foundation works. Now build amazing things on top of it.**
