"""
Silver Layer Assets - Cleaned and Validated Data
Medallion Architecture: Clean, deduplicate, and validate Bronze data
"""

import pandas as pd
import json
from datetime import datetime
from dagster import asset, Output, AssetIn, AssetExecutionContext


@asset(
    key_prefix=["silver"],
    io_manager_key="delta_lake_io_manager",
    metadata={"mode": "overwrite"},
    ins={"raw_pipeline_events": AssetIn(key_prefix=["bronze"])},
    group_name="silver_layer",
    description="Cleaned and validated pipeline events with quality scores"
)
def pipeline_events(context: AssetExecutionContext, raw_pipeline_events: pd.DataFrame) -> Output[pd.DataFrame]:
    """
    Clean and validate raw pipeline events

    Transformations:
    - Deduplicate by (pipeline_id, event_type)
    - Parse timestamps to datetime
    - Extract duration from raw_data
    - Calculate quality score based on completeness
    - Add validation flags
    """
    context.log.info(f"Processing {len(raw_pipeline_events)} raw pipeline events...")

    # Create a copy to avoid modifying input
    df = raw_pipeline_events.copy()

    # Deduplicate by pipeline_id + event_type
    df = df.drop_duplicates(subset=["pipeline_id", "event_type"], keep="first")
    context.log.info(f"After deduplication: {len(df)} events")

    # Parse timestamps
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Extract structured data from raw_data JSON
    def parse_raw_data(row):
        try:
            data = json.loads(row["raw_data"].replace("'", '"'))
            return pd.Series({
                "duration_ms": data.get("duration_ms"),
                "activities_executed": data.get("activities_executed"),
                "steps": data.get("steps"),
            })
        except:
            return pd.Series({
                "duration_ms": None,
                "activities_executed": None,
                "steps": None,
            })

    extracted = df.apply(parse_raw_data, axis=1)
    df = pd.concat([df, extracted], axis=1)

    # Calculate quality score (0-100) based on data completeness (flatten all arrays to avoid shape mismatch)
    df["quality_score"] = (
        (df["pipeline_id"].notna().astype(int).values.ravel() * 30) +
        (df["timestamp"].notna().astype(int).values.ravel() * 30) +
        (df["workspace_id"].notna().astype(int).values.ravel() * 20) +
        (df["duration_ms"].notna().astype(int).values.ravel() * 20)
    ).astype(int)

    # Add validation flags
    df["is_valid"] = df["quality_score"] >= 70
    df["status"] = df["event_type"].apply(lambda x: "completed" if "completed" in x else ("failed" if "failed" in x else "in_progress"))

    # Drop raw_data column (no longer needed)
    df = df.drop(columns=["raw_data"])

    # Add processing metadata
    df["processed_at"] = datetime.utcnow()

    context.log.info(f"✓ Processed {len(df)} pipeline events (avg quality: {df['quality_score'].mean():.1f})")

    return Output(
        df,
        metadata={
            "num_records": len(df),
            "avg_quality_score": float(df["quality_score"].mean()),
            "valid_records": int(df["is_valid"].sum()),
            "table_type": "silver_cleaned"
        }
    )


@asset(
    key_prefix=["silver"],
    io_manager_key="delta_lake_io_manager",
    metadata={"mode": "overwrite"},
    ins={"raw_crawler_results": AssetIn(key_prefix=["bronze"])},
    group_name="silver_layer",
    description="Cleaned and structured crawler results with validation"
)
def crawler_results(context: AssetExecutionContext, raw_crawler_results: pd.DataFrame) -> Output[pd.DataFrame]:
    """
    Clean and structure raw crawler results

    Transformations:
    - Parse raw_json into structured columns
    - Extract key metrics (followers, posts, verification)
    - Validate data completeness
    - Normalize inconsistent fields
    - Add data quality flags
    """
    context.log.info(f"Processing {len(raw_crawler_results)} raw crawler results...")

    # Create a copy
    df = raw_crawler_results.copy()

    # Parse raw_json into structured data
    def parse_json(raw_json_str):
        try:
            # Handle string representation of dict
            data = eval(raw_json_str)  # Safe here since we control the input
            return pd.Series({
                "username": data.get("username"),
                "display_name": data.get("display_name"),
                "followers_count": data.get("followers_count"),
                "following_count": data.get("following_count"),
                "posts_count": data.get("posts_count"),
                "location": data.get("location"),
                "verified": data.get("verified"),
                "bio": data.get("bio"),
                "created_at": data.get("created_at"),
                "profile_image_url": data.get("profile_image_url"),
                "recent_posts_count": len(data.get("recent_posts", [])),
            })
        except:
            return pd.Series({
                "username": None,
                "display_name": None,
                "followers_count": None,
                "following_count": None,
                "posts_count": None,
                "location": None,
                "verified": None,
                "bio": None,
                "created_at": None,
                "profile_image_url": None,
                "recent_posts_count": 0,
            })

    extracted = df["raw_json"].apply(parse_json)
    # Drop 'username' from Bronze (redundant - we get authoritative value from raw_json)
    if "username" in df.columns:
        df = df.drop(columns=["username"])
    df = pd.concat([df, extracted], axis=1)

    # Normalize verified field (handle None/True/False inconsistency)
    df["verified"] = df["verified"].fillna(False).astype(bool)

    # Parse timestamps
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["scraped_at"] = df["timestamp"]  # Rename for clarity

    # Calculate data quality score based on field completeness
    df["completeness_score"] = (
        (df["username"].notna().astype(int) * 20) +
        (df["followers_count"].notna().astype(int) * 20) +
        (df["posts_count"].notna().astype(int) * 20) +
        (df["location"].notna().astype(int) * 15) +
        (df["bio"].notna().astype(int) * 15) +
        ((df["recent_posts_count"] > 0).astype(int) * 10)
    ).astype(int)

    # Add validation flag
    df["is_complete"] = df["completeness_score"] >= 60

    # Drop raw columns
    df = df.drop(columns=["raw_json", "timestamp"])

    # Add processing metadata
    df["processed_at"] = datetime.utcnow()

    context.log.info(f"✓ Processed {len(df)} crawler results (avg completeness: {df['completeness_score'].mean():.1f})")

    return Output(
        df,
        metadata={
            "num_records": len(df),
            "avg_completeness_score": float(df["completeness_score"].mean()),
            "complete_records": int(df["is_complete"].sum()),
            "verified_profiles": int(df["verified"].sum()),
            "table_type": "silver_cleaned"
        }
    )
