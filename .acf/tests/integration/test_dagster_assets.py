"""
Integration tests for Dagster medallion architecture assets

Tests all three layers (Bronze, Silver, Gold) and Delta Lake integration
Coverage target: >80% for all asset code
"""

import os
import pytest
import pandas as pd
from datetime import datetime
from dagster import materialize, AssetExecutionContext, build_op_context
from unittest.mock import MagicMock

# Import assets
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../data/dagster"))

from assets.bronze_assets import raw_pipeline_events, raw_crawler_results
from assets.silver_assets import pipeline_events, crawler_results
from assets.gold_assets import pipeline_metrics, user_profiles
from resources.delta_lake_io_manager import DeltaLakeIOManager


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def mock_context():
    """Mock Dagster execution context for testing"""
    context = MagicMock(spec=AssetExecutionContext)
    context.log = MagicMock()
    return context


@pytest.fixture
def bronze_pipeline_events_df(mock_context):
    """Materialize Bronze pipeline events for testing"""
    result = raw_pipeline_events(mock_context)
    return result.value


@pytest.fixture
def bronze_crawler_results_df(mock_context):
    """Materialize Bronze crawler results for testing"""
    result = raw_crawler_results(mock_context)
    return result.value


@pytest.fixture
def silver_pipeline_events_df(mock_context, bronze_pipeline_events_df):
    """Materialize Silver pipeline events for testing"""
    result = pipeline_events(mock_context, bronze_pipeline_events_df)
    return result.value


@pytest.fixture
def silver_crawler_results_df(mock_context, bronze_crawler_results_df):
    """Materialize Silver crawler results for testing"""
    result = crawler_results(mock_context, bronze_crawler_results_df)
    return result.value


# ============================================================================
# BRONZE LAYER TESTS
# ============================================================================

def test_bronze_raw_pipeline_events(bronze_pipeline_events_df):
    """
    Test Bronze layer raw pipeline events asset

    Validates:
    - Schema has 6 columns
    - Record count is approximately 30 (3 events × 10 pipelines)
    - All required fields are present
    - No null values in required fields
    """
    df = bronze_pipeline_events_df

    # Validate schema
    expected_columns = {"pipeline_id", "workspace_id", "event_type", "timestamp", "raw_data"}
    assert expected_columns.issubset(set(df.columns)), f"Missing columns: {expected_columns - set(df.columns)}"

    # Validate record count (should be ~30: 3 events per pipeline × 10 pipelines)
    assert len(df) == 30, f"Expected 30 records, got {len(df)}"

    # Validate no null values in required fields
    assert df["pipeline_id"].notna().all(), "pipeline_id should not have null values"
    assert df["workspace_id"].notna().all(), "workspace_id should not have null values"
    assert df["event_type"].notna().all(), "event_type should not have null values"
    assert df["timestamp"].notna().all(), "timestamp should not have null values"
    assert df["raw_data"].notna().all(), "raw_data should not have null values"

    # Validate data types
    assert df["pipeline_id"].dtype == object, "pipeline_id should be string"
    assert df["workspace_id"].dtype == object, "workspace_id should be string"
    assert df["event_type"].dtype == object, "event_type should be string"
    assert df["raw_data"].dtype == object, "raw_data should be string (JSON)"

    # Validate event types
    expected_event_types = {"pipeline.submitted", "pipeline.started", "pipeline.completed", "pipeline.failed"}
    actual_event_types = set(df["event_type"].unique())
    assert actual_event_types.issubset(expected_event_types), f"Unexpected event types: {actual_event_types - expected_event_types}"


def test_bronze_raw_crawler_results(bronze_crawler_results_df):
    """
    Test Bronze layer raw crawler results asset

    Validates:
    - Schema has 6 columns (crawl_id, method_id, username, raw_json, timestamp, ingested_at)
    - Record count is approximately 5
    - raw_json is valid JSON-like string
    - No null values in required fields
    """
    df = bronze_crawler_results_df

    # Validate schema
    expected_columns = {"crawl_id", "method_id", "username", "raw_json", "timestamp"}
    assert expected_columns.issubset(set(df.columns)), f"Missing columns: {expected_columns - set(df.columns)}"

    # Validate record count
    assert len(df) == 5, f"Expected 5 records, got {len(df)}"

    # Validate no null values in required fields
    assert df["crawl_id"].notna().all(), "crawl_id should not have null values"
    assert df["method_id"].notna().all(), "method_id should not have null values"
    assert df["username"].notna().all(), "username should not have null values"
    assert df["raw_json"].notna().all(), "raw_json should not have null values"
    assert df["timestamp"].notna().all(), "timestamp should not have null values"

    # Validate raw_json is valid JSON-like string
    for raw_json in df["raw_json"]:
        assert isinstance(raw_json, str), "raw_json should be string"
        assert "username" in raw_json, "raw_json should contain 'username' field"
        assert "followers_count" in raw_json, "raw_json should contain 'followers_count' field"


# ============================================================================
# SILVER LAYER TESTS
# ============================================================================

def test_silver_pipeline_events_deduplication(mock_context, bronze_pipeline_events_df):
    """
    Test Silver layer pipeline events deduplication and transformation

    Validates:
    - Deduplication logic (no duplicate pipeline_id + event_type)
    - Timestamp parsing (string → datetime)
    - Quality score calculation (range 0-100)
    - Extracted fields from raw_data JSON
    - Record count ≤ Bronze (due to deduplication)
    """
    # Add duplicate record to test deduplication
    bronze_with_dups = pd.concat([bronze_pipeline_events_df, bronze_pipeline_events_df.head(1)], ignore_index=True)

    silver_df = pipeline_events(mock_context, bronze_with_dups).value

    # Validate deduplication (should have removed 1 duplicate)
    assert len(silver_df) <= len(bronze_with_dups), "Silver should have fewer or equal records after deduplication"

    # Validate no duplicates on (pipeline_id, event_type)
    duplicates = silver_df.duplicated(subset=["pipeline_id", "event_type"], keep=False)
    assert not duplicates.any(), f"Found {duplicates.sum()} duplicate records after deduplication"

    # Validate timestamp parsing
    assert pd.api.types.is_datetime64_any_dtype(silver_df["timestamp"]), "timestamp should be datetime type"

    # Validate quality_score calculation (range 0-100)
    assert silver_df["quality_score"].notna().all(), "quality_score should not have null values"
    assert (silver_df["quality_score"] >= 0).all(), "quality_score should be >= 0"
    assert (silver_df["quality_score"] <= 100).all(), "quality_score should be <= 100"

    # Validate extracted fields from raw_data
    expected_extracted_columns = {"duration_ms", "activities_executed", "steps"}
    assert expected_extracted_columns.issubset(set(silver_df.columns)), f"Missing extracted columns: {expected_extracted_columns - set(silver_df.columns)}"

    # Validate is_valid flag
    assert "is_valid" in silver_df.columns, "is_valid column should exist"
    assert silver_df["is_valid"].dtype == bool, "is_valid should be boolean"

    # Validate status field
    assert "status" in silver_df.columns, "status column should exist"
    expected_statuses = {"completed", "failed", "in_progress"}
    actual_statuses = set(silver_df["status"].unique())
    assert actual_statuses.issubset(expected_statuses), f"Unexpected statuses: {actual_statuses - expected_statuses}"


def test_silver_crawler_results_quality_scoring(mock_context, bronze_crawler_results_df):
    """
    Test Silver layer crawler results quality scoring

    Validates:
    - Completeness score calculation (range 0-100)
    - No duplicate username column (the bug we fixed)
    - Extracted fields from raw_json
    - All expected columns exist (18 columns)
    - Data quality scores are reasonable
    """
    silver_df = crawler_results(mock_context, bronze_crawler_results_df).value

    # Validate completeness_score calculation (range 0-100)
    assert "completeness_score" in silver_df.columns, "completeness_score column should exist"
    assert silver_df["completeness_score"].notna().all(), "completeness_score should not have null values"
    assert (silver_df["completeness_score"] >= 0).all(), "completeness_score should be >= 0"
    assert (silver_df["completeness_score"] <= 100).all(), "completeness_score should be <= 100"

    # Validate no duplicate username column (the bug we fixed)
    username_columns = [col for col in silver_df.columns if col == "username"]
    assert len(username_columns) == 1, f"Found {len(username_columns)} 'username' columns (expected 1)"

    # Validate extracted fields from raw_json
    expected_extracted_columns = {
        "username", "display_name", "followers_count", "following_count",
        "posts_count", "location", "verified", "bio", "created_at",
        "profile_image_url", "recent_posts_count"
    }
    assert expected_extracted_columns.issubset(set(silver_df.columns)), f"Missing extracted columns: {expected_extracted_columns - set(silver_df.columns)}"

    # Validate all expected columns exist (should be ~18 columns after processing)
    expected_min_columns = 15  # At least 15 columns after processing
    assert len(silver_df.columns) >= expected_min_columns, f"Expected at least {expected_min_columns} columns, got {len(silver_df.columns)}"

    # Validate is_complete flag
    assert "is_complete" in silver_df.columns, "is_complete column should exist"
    assert silver_df["is_complete"].dtype == bool, "is_complete should be boolean"

    # Validate verified field normalization (should be boolean, no None)
    assert silver_df["verified"].dtype == bool, "verified should be boolean after normalization"
    assert silver_df["verified"].notna().all(), "verified should not have null values after normalization"


# ============================================================================
# GOLD LAYER TESTS
# ============================================================================

def test_gold_pipeline_metrics_aggregation(mock_context, silver_pipeline_events_df):
    """
    Test Gold layer pipeline metrics aggregation

    Validates:
    - Aggregation by workspace_id and date
    - Metric calculations (total_pipelines, successful, failed, avg_duration)
    - Success rate calculation (0-100%)
    - Grouping logic is correct
    """
    gold_df = pipeline_metrics(mock_context, silver_pipeline_events_df).value

    # Validate aggregation columns
    expected_columns = {"workspace_id", "date", "total_pipelines", "success_count",
                       "failed_count", "success_rate", "avg_duration_sec"}
    assert expected_columns.issubset(set(gold_df.columns)), f"Missing columns: {expected_columns - set(gold_df.columns)}"

    # Validate success_rate is between 0-100%
    assert (gold_df["success_rate"] >= 0).all(), "success_rate should be >= 0"
    assert (gold_df["success_rate"] <= 100).all(), "success_rate should be <= 100"

    # Validate total_pipelines = success_count + failed_count
    calculated_total = gold_df["success_count"] + gold_df["failed_count"]
    assert (gold_df["total_pipelines"] == calculated_total).all(), "total_pipelines should equal success_count + failed_count"

    # Validate avg_duration_sec is positive
    assert (gold_df["avg_duration_sec"] > 0).all(), "avg_duration_sec should be positive"

    # Validate grouping by workspace_id and date
    assert gold_df["workspace_id"].notna().all(), "workspace_id should not have null values"
    assert gold_df["date"].notna().all(), "date should not have null values"

    # Validate no duplicate (workspace_id, date) pairs
    duplicates = gold_df.duplicated(subset=["workspace_id", "date"], keep=False)
    assert not duplicates.any(), f"Found {duplicates.sum()} duplicate (workspace_id, date) pairs"


def test_gold_user_profiles_enrichment(mock_context, silver_crawler_results_df):
    """
    Test Gold layer user profiles enrichment

    Validates:
    - User profile enrichment
    - Engagement score and influence score calculations
    - No missing data in final profiles
    - All expected columns exist (15 columns)
    """
    gold_df = user_profiles(mock_context, silver_crawler_results_df).value

    # Validate all expected columns exist (13 columns specified in gold_cols)
    expected_columns = {
        "username", "display_name", "followers_count", "following_count",
        "posts_count", "verified", "location", "engagement_rate",
        "influence_score", "activity_level", "completeness_rating",
        "following_ratio", "scraped_at", "last_updated"
    }
    assert expected_columns == set(gold_df.columns), f"Column mismatch. Expected: {expected_columns}, Got: {set(gold_df.columns)}"

    # Validate engagement_rate calculation
    assert "engagement_rate" in gold_df.columns, "engagement_rate column should exist"
    assert gold_df["engagement_rate"].notna().all(), "engagement_rate should not have null values"

    # Validate influence_score calculation (0-100)
    assert "influence_score" in gold_df.columns, "influence_score column should exist"
    assert (gold_df["influence_score"] >= 0).all(), "influence_score should be >= 0"
    assert (gold_df["influence_score"] <= 100).all(), "influence_score should be <= 100"

    # Validate activity_level classification
    expected_activity_levels = {"low", "medium", "high", "very_high", "unknown"}
    actual_activity_levels = set(gold_df["activity_level"].unique())
    assert actual_activity_levels.issubset(expected_activity_levels), f"Unexpected activity levels: {actual_activity_levels - expected_activity_levels}"

    # Validate completeness_rating
    expected_ratings = {"excellent", "good", "fair", "poor"}
    actual_ratings = set(gold_df["completeness_rating"].unique())
    assert actual_ratings.issubset(expected_ratings), f"Unexpected ratings: {actual_ratings - expected_ratings}"

    # Validate following_ratio is positive
    assert (gold_df["following_ratio"] > 0).all(), "following_ratio should be positive"

    # Validate no missing critical data
    critical_columns = ["username", "followers_count", "posts_count", "influence_score", "engagement_rate"]
    for col in critical_columns:
        assert gold_df[col].notna().all(), f"{col} should not have null values in Gold layer"


# ============================================================================
# DELTA LAKE INTEGRATION TESTS
# ============================================================================

def test_delta_lake_io_manager():
    """
    Test Delta Lake IO Manager functionality

    Validates:
    - Delta Lake IO Manager can be instantiated
    - S3 paths are correctly generated
    - Storage options are properly configured
    """
    # Create storage options
    storage_options = {
        "AWS_ENDPOINT_URL": "http://localhost:19000",
        "AWS_ACCESS_KEY_ID": "minioadmin",
        "AWS_SECRET_ACCESS_KEY": "minioadmin",
        "AWS_REGION": "us-east-1",
        "AWS_S3_ALLOW_UNSAFE_RENAME": "true",
        "allow_http": "true",
    }

    # Instantiate IO Manager
    io_manager = DeltaLakeIOManager(storage_options)
    assert io_manager is not None, "IO Manager should be instantiated"
    assert io_manager.storage_options == storage_options, "Storage options should be set"

    # Test path generation
    mock_context = MagicMock()
    mock_context.asset_key.path = ["bronze", "raw_pipeline_events"]
    path = io_manager._get_path(mock_context)
    assert path == "s3://bronze/raw_pipeline_events/", f"Expected 's3://bronze/raw_pipeline_events/', got '{path}'"

    # Test path generation for silver layer
    mock_context.asset_key.path = ["silver", "pipeline_events"]
    path = io_manager._get_path(mock_context)
    assert path == "s3://silver/pipeline_events/", f"Expected 's3://silver/pipeline_events/', got '{path}'"

    # Test path generation for gold layer
    mock_context.asset_key.path = ["gold", "pipeline_metrics"]
    path = io_manager._get_path(mock_context)
    assert path == "s3://gold/pipeline_metrics/", f"Expected 's3://gold/pipeline_metrics/', got '{path}'"


# ============================================================================
# ERROR SCENARIO TESTS
# ============================================================================

def test_silver_pipeline_events_invalid_json(mock_context):
    """
    Test Silver layer handling of invalid JSON in raw_data

    Validates:
    - Asset handles invalid JSON gracefully
    - No crashes on malformed data
    - Extracted fields are None when JSON is invalid
    """
    # Create Bronze data with invalid JSON
    invalid_bronze_df = pd.DataFrame([
        {
            "pipeline_id": "pipeline-invalid",
            "workspace_id": "workspace-test-001",
            "event_type": "pipeline.completed",
            "timestamp": datetime.utcnow().isoformat(),
            "raw_data": "INVALID JSON {not valid}",
        }
    ])

    # Process with Silver layer
    silver_df = pipeline_events(mock_context, invalid_bronze_df).value

    # Validate asset handled invalid JSON gracefully
    assert len(silver_df) == 1, "Should process 1 record even with invalid JSON"

    # Validate extracted fields are None when JSON is invalid
    assert pd.isna(silver_df.iloc[0]["duration_ms"]), "duration_ms should be None for invalid JSON"
    assert pd.isna(silver_df.iloc[0]["activities_executed"]), "activities_executed should be None for invalid JSON"
    assert pd.isna(silver_df.iloc[0]["steps"]), "steps should be None for invalid JSON"


def test_silver_crawler_results_missing_columns(mock_context):
    """
    Test Silver layer handling of missing required columns

    Validates:
    - Asset handles missing columns gracefully
    - No crashes on incomplete data
    """
    # Create Bronze data with minimal columns (missing raw_json)
    minimal_bronze_df = pd.DataFrame([
        {
            "crawl_id": "crawl-minimal",
            "method_id": "crawler_twitter_profile",
            "username": "test_user",
            "raw_json": "{}",  # Empty JSON
            "timestamp": datetime.utcnow().isoformat(),
        }
    ])

    # Process with Silver layer (should not crash)
    silver_df = crawler_results(mock_context, minimal_bronze_df).value

    # Validate asset handled missing data gracefully
    assert len(silver_df) == 1, "Should process 1 record even with empty JSON"

    # Validate completeness_score reflects missing data
    assert silver_df.iloc[0]["completeness_score"] < 50, "Completeness score should be low for empty JSON"


# ============================================================================
# END-TO-END PIPELINE TESTS
# ============================================================================

def test_end_to_end_pipeline_flow(mock_context):
    """
    Test full medallion architecture flow: Bronze → Silver → Gold

    Validates:
    - Complete data pipeline from raw to analytics-ready
    - Data transformations at each layer
    - No data loss through pipeline
    """
    # Bronze layer
    bronze_pipeline_df = raw_pipeline_events(mock_context).value
    bronze_crawler_df = raw_crawler_results(mock_context).value

    assert len(bronze_pipeline_df) > 0, "Bronze pipeline events should be generated"
    assert len(bronze_crawler_df) > 0, "Bronze crawler results should be generated"

    # Silver layer
    silver_pipeline_df = pipeline_events(mock_context, bronze_pipeline_df).value
    silver_crawler_df = crawler_results(mock_context, bronze_crawler_df).value

    assert len(silver_pipeline_df) > 0, "Silver pipeline events should be generated"
    assert len(silver_crawler_df) > 0, "Silver crawler results should be generated"
    assert len(silver_pipeline_df) <= len(bronze_pipeline_df), "Silver should have fewer or equal records (deduplication)"

    # Gold layer
    gold_metrics_df = pipeline_metrics(mock_context, silver_pipeline_df).value
    gold_profiles_df = user_profiles(mock_context, silver_crawler_df).value

    assert len(gold_metrics_df) > 0, "Gold pipeline metrics should be generated"
    assert len(gold_profiles_df) > 0, "Gold user profiles should be generated"
    assert len(gold_metrics_df) < len(silver_pipeline_df), "Gold metrics should be aggregated (fewer records)"
    assert len(gold_profiles_df) == len(silver_crawler_df), "Gold profiles should have same count as Silver (1:1 enrichment)"
