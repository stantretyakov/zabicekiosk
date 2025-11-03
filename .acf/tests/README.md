# ODP Test Suite

Comprehensive test suite for the Open Data Platform (ODP).

## Test Organization

```
tests/
├── conftest.py              # Shared fixtures and configuration
├── requirements.txt         # Test dependencies
├── integration/             # Integration tests (multi-service)
│   └── test_dagster_assets.py  # Dagster medallion architecture tests
└── e2e/                     # End-to-end tests (full user journeys)
```

## Quick Start

### Install Test Dependencies

```bash
cd social-links/odp
python3 -m venv venv
source venv/bin/activate
pip install -r tests/requirements.txt
```

### Run All Tests

```bash
# All tests with coverage
pytest

# Integration tests only
pytest tests/integration/

# Specific test file
pytest tests/integration/test_dagster_assets.py

# Verbose output
pytest -v

# With coverage report
pytest --cov=data/dagster/assets --cov-report=term-missing
```

## Dagster Asset Tests

Tests for the medallion architecture (Bronze → Silver → Gold).

**Location**: `tests/integration/test_dagster_assets.py`

**Coverage**: All Dagster assets with >80% code coverage target

### Test Structure

**Bronze Layer Tests** (2 tests):
- `test_bronze_raw_pipeline_events` - Validates schema, record count, data types
- `test_bronze_raw_crawler_results` - Validates raw JSON structure

**Silver Layer Tests** (2 tests):
- `test_silver_pipeline_events_deduplication` - Validates deduplication, timestamp parsing, quality scoring
- `test_silver_crawler_results_quality_scoring` - Validates completeness scoring, field extraction

**Gold Layer Tests** (2 tests):
- `test_gold_pipeline_metrics_aggregation` - Validates aggregation, success rate calculation
- `test_gold_user_profiles_enrichment` - Validates enrichment, engagement/influence scores

**Delta Lake Integration Tests** (1 test):
- `test_delta_lake_io_manager` - Validates S3 path generation, storage options

**Error Scenario Tests** (2 tests):
- `test_silver_pipeline_events_invalid_json` - Validates graceful handling of invalid JSON
- `test_silver_crawler_results_missing_columns` - Validates handling of missing data

**End-to-End Tests** (1 test):
- `test_end_to_end_pipeline_flow` - Validates full Bronze → Silver → Gold pipeline

### Run Dagster Asset Tests

```bash
# All Dagster tests
pytest tests/integration/test_dagster_assets.py -v

# Specific test
pytest tests/integration/test_dagster_assets.py::test_bronze_raw_pipeline_events -v

# With coverage
pytest tests/integration/test_dagster_assets.py --cov=data/dagster/assets --cov-report=html

# View coverage report
open htmlcov/index.html
```

## Coverage Requirements

**Overall Minimum**: ≥80% across all metrics

**Critical Path Requirements** (100% coverage):
- Data transformations (Dagster assets)
- Business logic
- Quality scoring algorithms
- Aggregation logic

## Quality Gates

Before committing, these commands MUST pass:

```bash
# Linting
ruff check .

# Type checking
mypy . --strict

# Tests with coverage
pytest --cov --cov-fail-under=80
```

## Configuration

**pytest.ini**: Main pytest configuration
- Test discovery paths
- Coverage targets (≥80%)
- Coverage reports (terminal + HTML)

**conftest.py**: Shared fixtures
- Mock Dagster execution context
- MinIO configuration
- Test data paths

## Notes

- Tests use mocked Dagster contexts (no external services required for unit tests)
- Integration tests may require MinIO/PostgreSQL (use Docker Compose)
- All tests are independent and can run in any order
- Coverage reports generated in `htmlcov/` directory
