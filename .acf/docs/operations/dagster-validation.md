# Dagster Medallion Architecture Validation

Operational validation guide for verifying the Dagster data platform infrastructure works correctly.

This guide walks you through verifying the Bronze → Silver → Gold data pipeline architecture in under 5 minutes.

**Related Documentation:**
- Implementation snapshot: [20251028-dagster-medallion-architecture.md](../snapshots/implementation/20251028-dagster-medallion-architecture.md) - Build history and status
- Deployment guide: [deployment.md](./deployment.md) - How to deploy services
- Troubleshooting: [troubleshooting.md](./troubleshooting.md) - Common issues and fixes
- Development testing: [../development/quick-test.md](../development/quick-test.md) - Service-level testing (different from infrastructure validation)

---

## Overview

**Prerequisites:**
- Docker and Docker Compose installed
- At least 5GB RAM available
- Ports 15000-19000 available

**What you'll verify:**
- All 6 Dagster assets operational (2 Bronze, 2 Silver, 2 Gold)
- Delta Lake tables in MinIO S3 storage
- End-to-end data flow (Bronze → Silver → Gold)

---

## Step 1: Start Services

Start all services with the `full` profile (includes Dagster, MLflow, Neo4j, Qdrant):

```bash
make start PROFILE=full
```

Wait 90-120 seconds for all services to start. You should see:

```
✅ All services ready!

Core Services:
  User API:        http://localhost:18080
  Temporal UI:     http://localhost:18088
  Catalog Stub:    http://localhost:18090
  Stubs API:       http://localhost:18086

Storage:
  MinIO Console:   http://localhost:19001  (admin:minioadmin)
  PostgreSQL:      localhost:15432         (postgres:postgres)
  Redis:           localhost:16379

Data Platform (full profile):
  Dagster:         http://localhost:18084
  MLflow:          http://localhost:18087
  Neo4j Browser:   http://localhost:17474
```

**Note:** The `agent-orchestrator` service may show as "unhealthy" - this is expected as it's currently a stub implementation awaiting full development. All other services should be healthy.

**Troubleshooting:**
- If Dagster fails healthcheck: Wait additional 30s (Dagster has 60s start period)
- If MinIO not accessible: Run `docker compose -f ops/local/compose.yml ps` to check status
- If ports conflict: Stop conflicting services on ports 15xxx-19xxx

---

## Step 2: Initialize Data Layers

Run the seed script to initialize all data layers:

```bash
make seed
```

This will:
1. Seed PostgreSQL with test workspaces
2. Bootstrap MinIO with buckets (bronze, silver, gold)
3. Initialize Dagster medallion layers (Bronze → Silver → Gold)

Expected output:

```
🌱 Seeding ODP Test Data
========================

1. Creating test workspaces...
  ✓ Created 2 test workspaces

2. Initializing Delta Lake tables...
  ✓ Bronze bucket ready
  ✓ Silver bucket ready
  ✓ Gold bucket ready

3. Initializing data layers...
  ✓ Dagster running, initializing layers...

Initializing Dagster medallion architecture layers...
Waiting for Dagster to be healthy...
✓ Dagster is healthy
✓ All buckets exist (bronze, silver, gold)

Materializing Bronze layer...
✓ Bronze layer materialized

Materializing Silver layer...
✓ Silver layer materialized

Materializing Gold layer...
✓ Gold layer materialized

✓ All data layers initialized successfully
  - Bronze: 2 assets
  - Silver: 2 assets
  - Gold: 2 assets
```

**Troubleshooting:**
- If initialization fails: Dagster may still be starting, wait 30s and run `make init-data-layers` manually
- If timeout: Check Dagster health with `curl http://localhost:18084`
- If bucket errors: Restart minio-bootstrap with `docker compose -f ops/local/compose.yml restart minio-bootstrap`

---

## Step 3: Verify All Layers Operational

Check that all data layers are working:

```bash
make verify-data-layers
```

Expected output:

```
🔍 Verifying data layers...

Checking Dagster health...
✓ Dagster healthy

Checking asset materialization...
  Bronze: 2/2 assets
  Silver: 2/2 assets
  Gold: 2/2 assets

Checking MinIO Delta tables...
  Delta tables: 6/6

MinIO buckets:
[2025-10-28 10:00:00 PST]     0B bronze/
[2025-10-28 10:00:00 PST]     0B silver/
[2025-10-28 10:00:00 PST]     0B gold/

✓ All data layers operational
  - Dagster: healthy
  - Assets: 6/6 visible
  - Delta tables: 6/6 in MinIO
```

**If verification fails:**
- Check Dagster UI: `make dagster-ui`
- Review logs: `docker compose -f ops/local/compose.yml logs dagster | tail -100`
- Re-initialize: `make init-data-layers`

---

## Step 4: Explore the Medallion Architecture

Open Dagster UI in your browser:

```bash
make dagster-ui
```

Or manually visit: http://localhost:18084

**What to check:**

1. **Navigate to Assets view** (left sidebar)
2. **Verify all 6 assets show "Materialized" status** (green checkmarks):
   - `bronze/raw_pipeline_events`
   - `bronze/raw_crawler_results`
   - `silver/pipeline_events`
   - `silver/crawler_results`
   - `gold/pipeline_metrics`
   - `gold/user_profiles`

3. **Click on `silver/pipeline_events`** to see:
   - **Upstream dependency**: `bronze/raw_pipeline_events`
   - **Downstream consumer**: `gold/pipeline_metrics`
   - **Metadata**: Last materialization timestamp, row count

4. **View asset lineage graph** (click "View lineage" button):
   - Bronze → Silver → Gold data flow visualization
   - Dependency arrows showing which assets feed into others

---

## Step 5: Inspect Delta Lake Tables

### Via MinIO Console (Recommended)

Open MinIO Console: http://localhost:19001

**Login credentials:**
- Username: `minioadmin`
- Password: `minioadmin`

**What to check:**

1. **Navigate to Buckets** (left sidebar)
2. **Verify 3 buckets exist:**
   - `bronze` - Raw ingestion layer
   - `silver` - Cleaned and validated layer
   - `gold` - Business metrics layer

3. **Click into `bronze` bucket**:
   - You should see `raw_pipeline_events/` directory
   - Inside: `_delta_log/` directory (transaction logs)
   - Inside: `.parquet` files (actual data)

4. **Verify all 6 Delta tables exist**:
   - `bronze/raw_pipeline_events/` (30 sample records)
   - `bronze/raw_crawler_results/` (5 sample records)
   - `silver/pipeline_events/` (deduplicated events)
   - `silver/crawler_results/` (quality-scored results)
   - `gold/pipeline_metrics/` (aggregated by workspace)
   - `gold/user_profiles/` (enriched user data)

Each table should have:
- `_delta_log/` directory (Delta Lake transaction logs)
- One or more `.parquet` files (columnar data storage)

### Via Command Line (Advanced)

For command-line verification:

```bash
# List buckets
docker compose -f ops/local/compose.yml exec minio mc ls myminio/

# Check specific bucket contents
docker compose -f ops/local/compose.yml exec minio mc ls myminio/bronze/
```

**Note:** Use the `minio` container (not `minio-bootstrap`, which exits after initialization).

---

## Expected Results

**Successful verification means:**
- ✅ All 6 Dagster assets materialized (green status)
- ✅ 6 Delta Lake tables with `_delta_log/` directories
- ✅ ~30 pipeline events in Bronze layer
- ✅ ~5 crawler results in Bronze layer
- ✅ Deduplicated events in Silver layer
- ✅ Aggregated metrics in Gold layer

**Data flow verified:**

```
Bronze (Raw)          Silver (Cleaned)       Gold (Metrics)
─────────────         ────────────────       ──────────────
30 pipeline events →  30 events           →  2-5 metric rows
                      (deduplicated)          (aggregated by workspace)

5 crawler results  →  5 results           →  5 user profiles
                      (quality scored)        (enriched)
```

---

## Troubleshooting

### Dagster Healthcheck Fails

**Symptom:** Service status shows "unhealthy" or timeout errors

**Fix:**
```bash
# Check logs
docker compose -f ops/local/compose.yml logs dagster | tail -100

# Restart Dagster
docker compose -f ops/local/compose.yml restart dagster

# Wait 60s for full initialization
sleep 60

# Retry health check
make health
```

### Assets Not Materialized

**Symptom:** `make verify-data-layers` shows 0/6 or partial assets

**Fix:**
```bash
# Manually initialize
make init-data-layers

# Check for errors
docker compose -f ops/local/compose.yml logs dagster | grep -i error

# If errors persist, check Dagster UI for detailed error messages
make dagster-ui
```

### MinIO Buckets Missing

**Symptom:** Cannot find bronze/silver/gold buckets in MinIO Console

**Fix:**
```bash
# Restart minio-bootstrap
docker compose -f ops/local/compose.yml restart minio-bootstrap

# Wait for bootstrap to complete
sleep 10

# Re-run seed
make seed
```

### agent-orchestrator Shows Unhealthy

**Symptom:** Service status shows "unhealthy" in `docker compose ps`

**Status:** Expected behavior - this is a stub implementation

**Impact:** No impact on Dagster medallion architecture or data pipelines

**Action:** No action needed

### Delta Lake HTTP Connection Errors

**Symptom:** "URL scheme is not allowed" in Dagster logs

**Fix:** This was a known issue, fixed in `delta_lake_io_manager.py` with `allow_http: true`. If you see this error, the code may not have been updated. Check `data/dagster/resources/delta_lake_io_manager.py` for the `allow_http` parameter.

### Pandas Shape Mismatch Errors

**Symptom:** "Shape mismatch" errors during Silver layer materialization

**Fix:** This was a known issue with duplicate columns, fixed in `silver_assets.py` by dropping redundant columns before concatenation. If you see this error, the code may not have been updated. Check `data/dagster/assets/silver_assets.py` for proper column handling.

---

## Known Limitations

### agent-orchestrator Service

**Current Status**: Stub implementation

The `agent-orchestrator` service is currently a minimal stub and will show as "unhealthy" in service status checks. This is expected behavior and does not affect the Dagster medallion architecture or data pipeline functionality.

- **Impact**: None - Dagster data layers work independently
- **Timeline**: Full implementation planned for future releases
- **Workaround**: Not needed - this service is not required for current functionality

### MinIO Container Access

**Pattern**: Use `minio` container, not `minio-bootstrap`

The `minio-bootstrap` container is ephemeral and exits after completing bucket initialization. For ongoing operations, use the persistent `minio` container:

```bash
# ✓ Correct - use minio container
docker compose -f ops/local/compose.yml exec minio mc ls myminio/

# ✗ Wrong - minio-bootstrap exits after startup
docker compose -f ops/local/compose.yml exec minio-bootstrap mc ls myminio/
```

**Recommendation**: Use the MinIO Console UI (http://localhost:19001) for the most reliable verification of buckets and Delta tables.

### Delta Table Verification

**Limitation**: Command-line verification has dependencies

Verifying Delta tables via CLI requires the `minio` container to be running with the `mc` client available. The `verify-data-layers.sh` script handles this automatically, but manual verification should use the MinIO Console UI when possible.

**Alternative**: Check asset materialization status in Dagster UI (http://localhost:18084) as confirmation that Delta tables were created successfully.

---

## Next Steps

Once verification is complete, you can:

### 1. Run Automated Tests

```bash
# Test Dagster assets with coverage
make test-dagster

# View coverage report
open htmlcov/index.html
```

### 2. Explore the Codebase

- **Bronze assets**: `data/dagster/assets/bronze_assets.py`
- **Silver assets**: `data/dagster/assets/silver_assets.py`
- **Gold assets**: `data/dagster/assets/gold_assets.py`
- **Delta Lake IO manager**: `data/dagster/resources/delta_lake_io_manager.py`
- **MinIO resource**: `data/dagster/resources/minio_resource.py`

### 3. Stop Services

```bash
make stop
```

### 4. Clean Up (Removes All Data Volumes)

```bash
make clean
```

**Warning:** This removes all data including PostgreSQL, MinIO, and Dagster storage. Only use for a fresh start.

---

## Time to Complete

**Total time: < 5 minutes**

- Step 1 (Start services): 2 minutes
- Step 2 (Seed data): 1 minute
- Step 3 (Verify): 10 seconds
- Step 4 (Dagster UI): 1 minute
- Step 5 (MinIO): 1 minute

---

## Additional Commands

### View Service Logs

```bash
# All services
make logs

# Specific service
docker compose -f ops/local/compose.yml logs dagster -f

# Last 50 lines
docker compose -f ops/local/compose.yml logs dagster --tail=50
```

### Check Service Health

```bash
# All services
make health

# Individual service status
docker compose -f ops/local/compose.yml ps
```

### Access Service Shell

```bash
# Dagster container
make shell SERVICE=dagster

# MinIO bootstrap container
docker compose -f ops/local/compose.yml exec minio-bootstrap sh
```

### Re-materialize Specific Layer

```bash
# Bronze only
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset materialize --select "bronze/raw_pipeline_events" "bronze/raw_crawler_results"

# Silver only
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset materialize --select "silver/pipeline_events" "silver/crawler_results"

# Gold only
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset materialize --select "gold/pipeline_metrics" "gold/user_profiles"
```

---

## Architecture Overview

**Medallion Architecture Pattern:**

```
┌─────────────────────────────────────────────────────────────────┐
│                      ODP Data Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐         │
│  │  Bronze  │   →    │  Silver  │   →    │   Gold   │         │
│  │ (Raw)    │        │(Cleaned) │        │(Metrics) │         │
│  └──────────┘        └──────────┘        └──────────┘         │
│       ↓                   ↓                    ↓               │
│  ┌──────────────────────────────────────────────────┐         │
│  │           Delta Lake Tables (MinIO)              │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
│  Orchestrated by: Dagster                                      │
│  Storage: MinIO (S3-compatible)                                │
│  Format: Delta Lake (ACID transactions)                        │
└─────────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- **ACID transactions** - Delta Lake ensures data consistency
- **Time travel** - Query historical versions of tables
- **Schema evolution** - Add columns without breaking queries
- **Scalability** - Parquet columnar format for analytics
- **S3 compatibility** - Seamless migration to GCS in production

---

## Support

**For issues or questions:**
- Check logs: `make logs`
- Review troubleshooting section above
- Inspect service health: `make health`
- Verify port availability: `make ports`

**Documentation:**
- Architecture: `docs/architecture/system-architecture.md`
- Local development: `docs/operations/deployment.md`
- Environment config: `docs/operations/environment.md`
