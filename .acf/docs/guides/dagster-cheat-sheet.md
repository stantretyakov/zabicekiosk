# Dagster Cheat Sheet

**Quick reference for ODP data pipeline operations**

---

## Quick Commands

### Start and Access

```bash
# Start Dagster (full profile only)
make start PROFILE=full

# Open Dagster UI
make dagster-ui  # or: open http://localhost:18084

# Initialize all data layers
make init-data-layers

# Verify layers operational
make verify-data-layers

# View logs
docker compose -f ops/local/compose.yml logs dagster -f
```

### Materialize Assets

```bash
# All assets
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset materialize --select "*"

# Bronze layer
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset materialize --select "bronze/*"

# Silver layer
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset materialize --select "silver/*"

# Gold layer
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset materialize --select "gold/*"

# Specific asset
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset materialize --select "bronze/raw_pipeline_events"

# With upstream dependencies
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset materialize --select "gold/pipeline_metrics+"
```

### Inspect Assets

```bash
# List all assets
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset list

# List by layer
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset list --select "bronze/*"

# Show asset details
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset show bronze/raw_pipeline_events
```

---

## Asset Patterns

### ODP Asset Structure

**Bronze Layer** (`data/dagster/assets/bronze_assets.py`):
- `bronze/raw_pipeline_events` - 30 raw pipeline execution records
- `bronze/raw_crawler_results` - 5 raw Twitter profile records

**Silver Layer** (`data/dagster/assets/silver_assets.py`):
- `silver/pipeline_events` - Deduplicated, validated events
- `silver/crawler_results` - Parsed JSON, completeness checks

**Gold Layer** (`data/dagster/assets/gold_assets.py`):
- `gold/pipeline_metrics` - Aggregated by workspace/date
- `gold/user_profiles` - Enriched with engagement scores

### Asset Template

**Bronze** (raw ingestion):
```python
@asset(group_name="bronze", compute_kind="python")
def bronze_my_asset(context, minio_resource) -> pd.DataFrame:
    df = pd.DataFrame({'col': [1, 2, 3]})
    write_deltalake("s3://bronze/my_asset", df, mode="overwrite", storage_options={...})
    return df
```

**Silver** (cleaned, with dependency):
```python
@asset(group_name="silver", deps=["bronze_my_asset"])
def silver_my_asset(context, minio_resource) -> pd.DataFrame:
    dt = DeltaTable("s3://bronze/my_asset", storage_options={...})
    df = dt.to_pandas().drop_duplicates()
    write_deltalake("s3://silver/my_asset", df, mode="overwrite", storage_options={...})
    return df
```

**Gold** (aggregated):
```python
@asset(group_name="gold", deps=["silver_my_asset"])
def gold_my_metrics(context, minio_resource) -> pd.DataFrame:
    dt = DeltaTable("s3://silver/my_asset", storage_options={...})
    metrics = dt.to_pandas().groupby('workspace_id').agg({'col': 'sum'})
    write_deltalake("s3://gold/my_metrics", metrics, mode="overwrite", storage_options={...})
    return metrics
```

---

## IO Manager Configuration

### Delta Lake IO Manager Setup

**File**: `data/dagster/__init__.py`

```python
from dagster import Definitions
from resources.delta_lake_io_manager import DeltaLakeIOManager
from resources.minio_resource import MinIOResource

defs = Definitions(
    assets=[
        bronze_raw_pipeline_events,
        silver_pipeline_events,
        gold_pipeline_metrics,
        # ... all assets
    ],
    resources={
        "io_manager": DeltaLakeIOManager(
            s3_bucket="bronze",
            endpoint_url="http://minio:9000",
            access_key="minioadmin",
            secret_key="minioadmin",
            allow_http=True,  # Required for MinIO
        ),
        "minio_resource": MinIOResource(
            endpoint_url="http://minio:9000",
            access_key="minioadmin",
            secret_key="minioadmin",
        ),
    },
)
```

### Storage Options

**Local (MinIO)**:
```python
storage_options = {
    "AWS_ACCESS_KEY_ID": "minioadmin",
    "AWS_SECRET_ACCESS_KEY": "minioadmin",
    "AWS_ENDPOINT_URL": "http://minio:9000",
    "AWS_REGION": "us-east-1",
    "AWS_S3_ALLOW_UNSAFE_RENAME": "true",
    "AWS_ALLOW_HTTP": "true",  # Required
}
```

**Production (GCS)**:
```python
storage_options = {
    "AWS_ACCESS_KEY_ID": os.getenv("GCS_ACCESS_KEY"),
    "AWS_SECRET_ACCESS_KEY": os.getenv("GCS_SECRET_KEY"),
    "AWS_ENDPOINT_URL": "https://storage.googleapis.com",
    "AWS_REGION": "us-central1",
}
```

---

## Testing

### Run Tests

```bash
# All tests
cd data/dagster && pytest

# With coverage (≥80% required)
pytest --cov --cov-fail-under=80

# Specific test
pytest tests/test_bronze_assets.py::test_bronze_raw_pipeline_events

# Verbose
pytest -v
```

### Quality Gates

```bash
# Linting
ruff check .

# Type checking
mypy . --strict

# All gates
ruff check . && mypy . --strict && pytest --cov --cov-fail-under=80
```

**See**: `docs/development/quality-gates.md`

### Test Template

```python
def test_bronze_my_asset(minio_resource):
    context = build_asset_context()
    df = bronze_my_asset(context, minio_resource)
    assert len(df) == 3 and 'col' in df.columns
```

---

## Common Workflows

### Add New Asset

1. Create in `data/dagster/assets/{layer}_assets.py`
2. Register in `data/dagster/__init__.py` → `Definitions(assets=[...])`
3. Test: `pytest tests/test_{layer}_assets.py::test_new_asset`
4. Materialize: `dagster asset materialize --select "layer/new_asset"`

### View Asset Lineage

**Dagster UI**:
1. Open http://localhost:18084
2. Click "Assets" → Select asset
3. Click "View lineage"
4. See dependency graph (Bronze → Silver → Gold)

**CLI**:
```bash
docker compose -f ops/local/compose.yml exec dagster \
  dagster asset show silver/pipeline_events
```

### Update Dependencies

```python
@asset(group_name="silver", deps=["bronze_1", "bronze_2"])  # Multiple deps
def silver_combined(context, minio_resource) -> pd.DataFrame:
    ...
```

---

## Troubleshooting

### Dagster Not Starting

```bash
# Check logs
docker compose -f ops/local/compose.yml logs dagster | tail -100

# Restart
docker compose -f ops/local/compose.yml restart dagster

# Wait for initialization
sleep 60 && make health
```

### Assets Not Visible

```bash
# Reload code location (in Dagster UI: click "Reload all")

# Or restart
docker compose -f ops/local/compose.yml restart dagster

# Check errors
docker compose -f ops/local/compose.yml logs dagster | grep -i error
```

### MinIO Connection Errors

**Symptom**: "URL scheme is not allowed"

**Fix**: Ensure `AWS_ALLOW_HTTP: "true"` in storage_options

```bash
# Verify MinIO running
docker compose -f ops/local/compose.yml ps minio

# Check buckets
docker compose -f ops/local/compose.yml exec minio mc ls myminio/
```

### Delta Table Write Failures

**Symptom**: "Shape mismatch" or "Schema validation error"

**Fix**:

```python
# Drop duplicate columns
df = df.loc[:, ~df.columns.duplicated()]

# Explicit column order
df = df[['col1', 'col2', 'col3']]

# Use overwrite mode
write_deltalake(table_path, df, mode="overwrite", storage_options=...)
```

### Buckets Not Found

```bash
# Restart MinIO bootstrap
docker compose -f ops/local/compose.yml restart minio-bootstrap

# Wait and re-seed
sleep 10 && make seed

# Verify buckets exist
docker compose -f ops/local/compose.yml exec minio mc ls myminio/
# Expected: bronze/, silver/, gold/
```

### Type Checking Failures

```python
# Add type hints
from dagster import AssetExecutionContext
from resources.minio_resource import MinIOResource

def my_asset(
    context: AssetExecutionContext,
    minio_resource: MinIOResource
) -> pd.DataFrame:
    ...
```

---

## Profile Notes

**Minimal**: PostgreSQL + Temporal → Dagster NOT available

**Dev** (default): + Redis + MinIO + APIs → Dagster NOT available

**Full**: + Dagster + MLflow + Neo4j + Qdrant → Dagster available at http://localhost:18084

```bash
# Start full profile for Dagster
make start PROFILE=full
```

---

## See Also

**Operations**:
- `docs/operations/dagster-validation.md` - Complete validation guide
- `docs/operations/deployment.md` - Deployment procedures

**Architecture**:
- `docs/architecture/infrastructure.md` - Delta Lake architecture
- `docs/architecture/system-architecture.md` - Overall system design

**Development**:
- `docs/development/quality-gates.md` - Quality requirements
- `docs/development/testing.md` - Testing strategy

**Implementation**:
- `docs/snapshots/implementation/20251028-dagster-medallion-architecture.md` - Build history
