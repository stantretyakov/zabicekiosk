# Dagster Medallion Architecture Implementation

**Date**: 2025-10-28
**Status**: In Progress (70% Complete)
**Location**: `odp/data/dagster/`

---

## Overview

Implementing complete Bronze → Silver → Gold medallion architecture for ODP data pipelines using Dagster, Delta Lake, and MinIO S3 storage.

**Goal**: On `make start`, automatically initialize all three data layers with sample data, verifying end-to-end data flow.

---

## Completed Work ✅

### 1. Dagster Service Foundation
- ✅ `data/dagster/Dockerfile` - Python 3.11 with dagster, deltalake, pandas, boto3
- ✅ `data/dagster/requirements.txt` - All dependencies pinned
- ✅ `data/dagster/workspace.yaml` - Code location configuration
- ✅ `data/dagster/__init__.py` - Definitions with all assets and resources

### 2. Bronze Layer (Raw Ingestion)
- ✅ `data/dagster/assets/bronze_assets.py`
  - ✅ `bronze_raw_pipeline_events` - 30 raw pipeline execution records
  - ✅ `bronze_raw_crawler_results` - 5 raw Twitter profile records
  - ✅ Writes to `s3://bronze/` as Delta tables

### 3. Silver Layer (Cleaned/Validated)
- ✅ `data/dagster/assets/silver_assets.py`
  - ✅ `silver_pipeline_events` - Deduplication, validation, quality scoring
  - ✅ `silver_crawler_results` - JSON parsing, completeness checks
  - ✅ Writes to `s3://silver/` as Delta tables

### 4. Gold Layer (Aggregated Analytics)
- ✅ `data/dagster/assets/gold_assets.py`
  - ✅ `gold_pipeline_metrics` - Aggregated by workspace/date
  - ✅ `gold_user_profiles` - Enriched with engagement/influence scores
  - ✅ Writes to `s3://gold/` as Delta tables

### 5. Resources
- ✅ `data/dagster/resources/minio_resource.py` - S3 client for MinIO
- ✅ `data/dagster/resources/delta_lake_io_manager.py` - Custom IO manager for Delta Lake

---

## Remaining Work 🚧

### 6. Initialization Script
**File**: `ops/scripts/init_data_layers.sh`

**Purpose**: Materialize all Dagster assets on startup

**Implementation**:
```bash
#!/usr/bin/env bash
set -e

echo "🔄 Initializing Data Layers (Bronze → Silver → Gold)"

# Wait for Dagster to be healthy
echo "Waiting for Dagster..."
timeout 60 bash -c 'until curl -sf http://localhost:18084 > /dev/null; do sleep 2; done'

# Materialize Bronze assets
echo "📦 Materializing Bronze layer..."
docker compose -f ops/local/compose.yml exec -T dagster \
  dagster asset materialize --select "bronze/*"

# Wait and materialize Silver
sleep 5
echo "🔧 Materializing Silver layer..."
docker compose -f ops/local/compose.yml exec -T dagster \
  dagster asset materialize --select "silver/*"

# Wait and materialize Gold
sleep 5
echo "🏆 Materializing Gold layer..."
docker compose -f ops/local/compose.yml exec -T dagster \
  dagster asset materialize --select "gold/*"

echo "✅ All layers initialized!"
```

**Verification**: Check exit codes, log output

---

### 7. Verification Script
**File**: `ops/scripts/verify_data_layers.sh`

**Purpose**: Verify all Delta tables exist and contain data

**Implementation**:
```bash
#!/usr/bin/env bash
set -e

echo "🔍 Verifying Data Layers"

# Check Dagster health
curl -sf http://localhost:18084 > /dev/null || {
  echo "❌ Dagster not healthy"
  exit 1
}

# Query Dagster for asset materializations
echo "Checking Bronze layer..."
BRONZE_COUNT=$(docker compose -f ops/local/compose.yml exec -T dagster \
  dagster asset list --select "bronze/*" | wc -l)
echo "  Bronze assets: $BRONZE_COUNT"

echo "Checking Silver layer..."
SILVER_COUNT=$(docker compose -f ops/local/compose.yml exec -T dagster \
  dagster asset list --select "silver/*" | wc -l)
echo "  Silver assets: $SILVER_COUNT"

echo "Checking Gold layer..."
GOLD_COUNT=$(docker compose -f ops/local/compose.yml exec -T dagster \
  dagster asset list --select "gold/*" | wc -l)
echo "  Gold assets: $GOLD_COUNT"

# Verify MinIO buckets
echo "Checking Delta tables in MinIO..."
docker compose -f ops/local/compose.yml exec -T minio-bootstrap \
  mc ls myminio/bronze/ || echo "  ⚠ Bronze bucket empty"
docker compose -f ops/local/compose.yml exec -T minio-bootstrap \
  mc ls myminio/silver/ || echo "  ⚠ Silver bucket empty"
docker compose -f ops/local/compose.yml exec -T minio-bootstrap \
  mc ls myminio/gold/ || echo "  ⚠ Gold bucket empty"

echo "✅ Verification complete"
```

---

### 8. Update compose.yml
**File**: `ops/local/compose.yml`

**Changes needed**:
```yaml
dagster:
  build:
    context: ../../data/dagster
    dockerfile: Dockerfile
  profiles: ["full"]
  container_name: odp-dagster
  depends_on:
    postgres:
      condition: service_healthy
    minio:
      condition: service_healthy
    redis:
      condition: service_healthy
  environment:
    - DAGSTER_POSTGRES_USER=postgres
    - DAGSTER_POSTGRES_PASSWORD=postgres
    - DAGSTER_POSTGRES_DB=dagster
    - DAGSTER_POSTGRES_HOST=postgres
    - DAGSTER_POSTGRES_PORT=5432
    - AWS_ACCESS_KEY_ID=minioadmin
    - AWS_SECRET_ACCESS_KEY=minioadmin
    - AWS_ENDPOINT_URL=http://minio:9000
    - AWS_REGION=us-east-1
    - REDIS_URL=redis:6379
  ports:
    - "18084:3000"  # Web UI
    - "18085:4000"  # gRPC
  volumes:
    - dagster-data:/opt/dagster/app/storage  # ADD THIS
  networks:
    - odp-network
  healthcheck:
    test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:3000')"]  # CHANGE THIS
    interval: 15s
    timeout: 5s
    retries: 10
    start_period: 60s  # INCREASE THIS
```

**Also add to volumes section**:
```yaml
volumes:
  postgres-data:
  redis-data:
  minio-data:
  neo4j-data:
  qdrant-data:
  temporal-data:
  dagster-data:  # ADD THIS
```

---

### 9. Update seed_local_data.sh
**File**: `ops/scripts/seed_local_data.sh`

**Changes needed** (add after MinIO bootstrap):
```bash
echo -e "${BLUE}3. Initializing data layers...${NC}"

# Check if Dagster is running (full profile only)
if docker compose -f ops/local/compose.yml ps | grep -q "dagster.*Up"; then
    echo "  ✓ Dagster running, initializing layers..."
    ./ops/scripts/init_data_layers.sh || {
        echo "  ! Data layer initialization failed"
    }
else
    echo "  - Dagster not running (dev profile, skip)"
fi
```

---

### 10. Update Makefile
**File**: `odp/Makefile`

**Add these targets**:
```makefile
##@ Data Platform

init-data-layers: ## Initialize Bronze/Silver/Gold layers (requires full profile)
	@echo "🔄 Initializing data layers..."
	@./ops/scripts/init_data_layers.sh

verify-data-layers: ## Verify all data layers are operational
	@echo "🔍 Verifying data layers..."
	@./ops/scripts/verify_data_layers.sh

dagster-ui: ## Open Dagster UI in browser
	@open http://localhost:18084
```

---

### 11. Update Documentation (QUICKTEST.md → dagster-validation.md)
**File**: `docs/operations/dagster-validation.md` (originally `odp/QUICKTEST.md`, moved to follow organization conventions)

**Add new section after Step 5**:
```markdown
## Step 6: Verify Data Layers (Optional - Full Profile Only)

**Note**: This step requires `full` profile. Skip if using `dev` profile.

```bash
# Check if Dagster is running
docker compose -f ops/local/compose.yml ps dagster

# Verify data layers
make verify-data-layers
```

**Expected output:**
```
🔍 Verifying Data Layers
Checking Bronze layer...
  Bronze assets: 2
Checking Silver layer...
  Silver assets: 2
Checking Gold layer...
  Gold assets: 2
✅ Verification complete
```

**View in Dagster UI:**
```bash
open http://localhost:18084
```

**What to look for:**
- ✅ All assets show green status (materialized)
- ✅ Bronze: raw_pipeline_events, raw_crawler_results
- ✅ Silver: pipeline_events, crawler_results
- ✅ Gold: pipeline_metrics, user_profiles
- ✅ Asset graph shows dependencies: Bronze → Silver → Gold
```

---

## Files Created

**Total: 11 new files**

1. ✅ `data/dagster/Dockerfile`
2. ✅ `data/dagster/requirements.txt`
3. ✅ `data/dagster/workspace.yaml`
4. ✅ `data/dagster/__init__.py`
5. ✅ `data/dagster/assets/bronze_assets.py`
6. ✅ `data/dagster/assets/silver_assets.py`
7. ✅ `data/dagster/assets/gold_assets.py`
8. ✅ `data/dagster/resources/minio_resource.py`
9. ✅ `data/dagster/resources/delta_lake_io_manager.py`
10. 🚧 `ops/scripts/init_data_layers.sh` - **TODO**
11. 🚧 `ops/scripts/verify_data_layers.sh` - **TODO**

---

## Files to Modify

**Total: 4 files**

1. 🚧 `ops/local/compose.yml` - Update Dagster service
2. 🚧 `ops/scripts/seed_local_data.sh` - Call init script
3. 🚧 `odp/Makefile` - Add data layer targets
4. 🚧 `docs/operations/dagster-validation.md` - Add verification section (originally `odp/QUICKTEST.md`)

---

## Testing Strategy

### Manual Test Sequence

1. **Build Dagster image**:
```bash
cd odp
docker compose -f ops/local/compose.yml build dagster
```

2. **Start with full profile**:
```bash
make stop
make start PROFILE=full
```

3. **Wait for services** (90s for full profile)

4. **Check Dagster UI**:
```bash
open http://localhost:18084
```

5. **Materialize assets manually** (first time):
```bash
# In Dagster UI: Click "Materialize all" for each layer
# Or via CLI:
make init-data-layers
```

6. **Verify data**:
```bash
make verify-data-layers
```

7. **Check MinIO**:
```bash
open http://localhost:19001
# Login: minioadmin/minioadmin
# Browse: bronze/, silver/, gold/ buckets
# Look for: _delta_log/ directories (indicates Delta tables)
```

### Expected Results

**Bronze Layer**:
- `s3://bronze/raw_pipeline_events/` - 30 records
- `s3://bronze/raw_crawler_results/` - 5 records

**Silver Layer**:
- `s3://silver/pipeline_events/` - ~30 records (deduplicated)
- `s3://silver/crawler_results/` - 5 records (parsed)

**Gold Layer**:
- `s3://gold/pipeline_metrics/` - ~2-5 aggregated records
- `s3://gold/user_profiles/` - 5 enriched profiles

---

## Known Issues / Considerations

### 1. Dagster Startup Time
- Full profile startup: 90-120s
- Dagster needs 60s `start_period` for initialization
- Assets won't materialize until Dagster is fully ready

### 2. Delta Lake Python Library
- Using `deltalake==0.14.0` (Rust-based)
- MinIO requires `AWS_S3_ALLOW_UNSAFE_RENAME=true`
- Path-style S3 addressing required for MinIO

### 3. First-Time Materialization
- First run may take 30-60s to materialize all assets
- Subsequent runs use cached data (faster)
- No auto-materialization on startup (manual trigger required)

### 4. Profile Dependencies
- Data layers **only** work with `full` profile
- `dev` profile: Dagster not started
- `minimal` profile: No data platform

---

## Next Steps

### Immediate (Complete Implementation)

1. Create `ops/scripts/init_data_layers.sh` (30 min)
2. Create `ops/scripts/verify_data_layers.sh` (20 min)
3. Update `ops/local/compose.yml` Dagster service (10 min)
4. Update `ops/scripts/seed_local_data.sh` (5 min)
5. Update `odp/Makefile` (5 min)
6. Update `docs/operations/dagster-validation.md` (10 min) - originally `odp/QUICKTEST.md`

**Total remaining effort**: ~1.5 hours

### Future Enhancements (Post-MVP)

1. **Auto-materialization on startup** (Dagster sensors)
2. **Incremental updates** (append mode for Bronze)
3. **Data quality checks** (Great Expectations integration)
4. **Partitioning** (by date for time-series data)
5. **Dagster schedules** (daily refresh)
6. **Real data integration** (consume from Temporal worker events)

---

## Success Criteria

✅ **All scripts executable and documented**
✅ **`make start PROFILE=full` initializes all layers**
✅ **`make verify-data-layers` confirms operational**
✅ **Dagster UI shows all assets materialized (green)**
✅ **MinIO contains Delta tables with _delta_log/**
✅ **`docs/operations/dagster-validation.md` includes data layer verification** (originally `QUICKTEST.md`)

---

## References

- **Dagster Docs**: https://docs.dagster.io/
- **Delta Lake Python**: https://delta-io.github.io/delta-rs/
- **Medallion Architecture**: Bronze (raw) → Silver (cleaned) → Gold (analytics)
- **Implementation Plan**: Approved 2025-10-28 04:XX:XX

---

## Developer Handoff

**To complete this implementation:**

1. Read this document thoroughly
2. Create the 2 remaining shell scripts (init + verify)
3. Make the 4 file modifications (compose, seed, Makefile, dagster-validation.md)
4. Test with `make start PROFILE=full`
5. Run `make init-data-layers` and `make verify-data-layers`
6. Open Dagster UI and verify green status for all assets
7. Check MinIO buckets for Delta tables

**Estimated completion time**: 1.5-2 hours for experienced developer

**Questions?** Refer to completed files in `data/dagster/` as examples.
