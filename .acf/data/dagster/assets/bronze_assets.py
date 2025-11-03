"""
Bronze Layer Assets - Raw Data Ingestion
Medallion Architecture: Ingest raw data from various sources
"""

import pandas as pd
from datetime import datetime, timedelta
import random
from dagster import asset, Output, AssetExecutionContext


@asset(
    key_prefix=["bronze"],
    io_manager_key="delta_lake_io_manager",
    metadata={"mode": "overwrite"},
    group_name="bronze_layer",
    description="Raw pipeline execution events from user-api and temporal-worker"
)
def raw_pipeline_events(context: AssetExecutionContext) -> Output[pd.DataFrame]:
    """
    Simulates raw pipeline execution events

    Represents unprocessed events from the ODP execution platform including:
    - Pipeline submissions
    - Workflow starts/completions
    - Activity executions
    """
    context.log.info("Generating sample raw pipeline events...")

    # Generate sample data
    base_time = datetime.utcnow()
    events = []

    for i in range(10):
        pipeline_id = f"pipeline-{1000 + i}"
        workspace_id = f"workspace-test-{(i % 2) + 1:03d}"

        events.extend([
            {
                "pipeline_id": pipeline_id,
                "event_type": "pipeline.submitted",
                "workspace_id": workspace_id,
                "timestamp": (base_time - timedelta(hours=i, minutes=0)).isoformat(),
                "raw_data": f'{{"yaml_size": {random.randint(500, 5000)}, "steps": {random.randint(1, 10)}}}',
            },
            {
                "pipeline_id": pipeline_id,
                "event_type": "pipeline.started",
                "workspace_id": workspace_id,
                "timestamp": (base_time - timedelta(hours=i, minutes=-2)).isoformat(),
                "raw_data": f'{{"temporal_workflow_id": "wf-{pipeline_id}", "task_queue": "odp-tasks"}}',
            },
            {
                "pipeline_id": pipeline_id,
                "event_type": "pipeline.completed" if random.random() > 0.2 else "pipeline.failed",
                "workspace_id": workspace_id,
                "timestamp": (base_time - timedelta(hours=i, minutes=-10)).isoformat(),
                "raw_data": f'{{"duration_ms": {random.randint(5000, 300000)}, "activities_executed": {random.randint(2, 15)}}}',
            },
        ])

    df = pd.DataFrame(events)

    context.log.info(f"Generated {len(df)} raw pipeline events")

    return Output(
        df,
        metadata={
            "num_records": len(df),
            "columns": ", ".join(df.columns),
            "table_type": "bronze_raw"
        }
    )


@asset(
    key_prefix=["bronze"],
    io_manager_key="delta_lake_io_manager",
    metadata={"mode": "overwrite"},
    group_name="bronze_layer",
    description="Raw crawler results from Twitter profile scraping"
)
def raw_crawler_results(context: AssetExecutionContext) -> Output[pd.DataFrame]:
    """
    Simulates raw crawler outputs from social media platforms

    Represents unprocessed JSON responses from crawler stubs including:
    - Twitter profile data
    - Unvalidated fields
    - Inconsistent formats
    """
    context.log.info("Generating sample raw crawler results...")

    # Sample Twitter usernames and data
    usernames = ["alice_crypto", "bob_security", "eve_threat", "mallory_osint", "trent_intel"]
    locations = ["San Francisco, CA", "New York, NY", "London, UK", None, "Berlin, Germany"]

    base_time = datetime.utcnow()
    results = []

    for i, username in enumerate(usernames):
        # Simulate varying data quality
        raw_json = {
            "username": username,
            "display_name": username.replace("_", " ").title(),
            "followers_count": random.randint(100, 100000),
            "following_count": random.randint(50, 5000),
            "posts_count": random.randint(10, 50000),
            "location": locations[i],
            "verified": random.choice([True, False, None]),  # Inconsistent data
            "bio": f"Sample bio for {username}" if random.random() > 0.3 else None,  # Missing data
            "created_at": (base_time - timedelta(days=random.randint(365, 3650))).isoformat(),
            "profile_image_url": f"https://example.com/avatars/{username}.jpg",
            "recent_posts": [
                {"text": f"Post {j}", "timestamp": (base_time - timedelta(hours=j)).isoformat()}
                for j in range(random.randint(1, 5))
            ]
        }

        results.append({
            "crawl_id": f"crawl-{10000 + i}",
            "method_id": "crawler_twitter_profile",
            "username": username,
            "raw_json": str(raw_json),  # Store as string to simulate raw API response
            "timestamp": (base_time - timedelta(hours=i)).isoformat(),
        })

    df = pd.DataFrame(results)

    context.log.info(f"Generated {len(df)} raw crawler results")

    return Output(
        df,
        metadata={
            "num_records": len(df),
            "columns": ", ".join(df.columns),
            "table_type": "bronze_raw"
        }
    )
