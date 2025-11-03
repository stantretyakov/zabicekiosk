"""
Gold Layer Assets - Aggregated Analytics-Ready Data
Medallion Architecture: Aggregate, enrich, and prepare data for analytics
"""

import pandas as pd
from datetime import datetime
from dagster import asset, Output, AssetIn, AssetExecutionContext


@asset(
    key_prefix=["gold"],
    io_manager_key="delta_lake_io_manager",
    metadata={"mode": "overwrite"},
    ins={"pipeline_events": AssetIn(key_prefix=["silver"])},
    group_name="gold_layer",
    description="Aggregated pipeline execution metrics by workspace and date"
)
def pipeline_metrics(context: AssetExecutionContext, pipeline_events: pd.DataFrame) -> Output[pd.DataFrame]:
    """
    Aggregate pipeline events into business metrics

    Aggregations:
    - Total pipelines per workspace per day
    - Success/failure counts
    - Average duration
    - Success rate percentage
    """
    context.log.info(f"Aggregating {len(pipeline_events)} pipeline events...")

    # Filter only completed/failed events for metrics
    df = pipeline_events[pipeline_events["event_type"].isin(["pipeline.completed", "pipeline.failed"])].copy()

    # Extract date from timestamp
    df["date"] = df["timestamp"].dt.date

    # Calculate success flag
    df["is_success"] = df["status"] == "completed"

    # Group by workspace_id and date
    metrics = df.groupby(["workspace_id", "date"]).agg({
        "pipeline_id": "nunique",  # Total unique pipelines
        "is_success": ["sum", "mean"],  # Success count and rate
        "duration_ms": "mean",  # Average duration
    }).reset_index()

    # Flatten column names
    metrics.columns = ["workspace_id", "date", "total_pipelines", "success_count", "success_rate", "avg_duration_ms"]

    # Convert to seconds for readability
    metrics["avg_duration_sec"] = (metrics["avg_duration_ms"] / 1000).round(2)

    # Convert success_rate to percentage
    metrics["success_rate"] = (metrics["success_rate"] * 100).round(2)

    # Add failed count
    metrics["failed_count"] = metrics["total_pipelines"] - metrics["success_count"]

    # Drop milliseconds column
    metrics = metrics.drop(columns=["avg_duration_ms"])

    # Add aggregation metadata
    metrics["aggregated_at"] = datetime.utcnow()

    context.log.info(f"✓ Generated {len(metrics)} aggregated metrics")

    return Output(
        metrics,
        metadata={
            "num_records": len(metrics),
            "workspaces": metrics["workspace_id"].nunique(),
            "date_range": f"{metrics['date'].min()} to {metrics['date'].max()}",
            "avg_success_rate": float(metrics["success_rate"].mean()),
            "table_type": "gold_aggregated"
        }
    )


@asset(
    key_prefix=["gold"],
    io_manager_key="delta_lake_io_manager",
    metadata={"mode": "overwrite"},
    ins={"crawler_results": AssetIn(key_prefix=["silver"])},
    group_name="gold_layer",
    description="Enriched user profiles with engagement and influence scores"
)
def user_profiles(context: AssetExecutionContext, crawler_results: pd.DataFrame) -> Output[pd.DataFrame]:
    """
    Enrich crawler results with derived analytics

    Enrichments:
    - Engagement rate calculation
    - Influence score (composite metric)
    - Profile completeness rating
    - Activity level classification
    """
    context.log.info(f"Enriching {len(crawler_results)} crawler results...")

    df = crawler_results.copy()

    # Calculate engagement rate
    # Formula: (posts_count / followers_count) * 100
    df["engagement_rate"] = ((df["posts_count"] / df["followers_count"].replace(0, 1)) * 100).round(2)

    # Calculate influence score (0-100)
    # Weighted combination of followers, posts, and verification
    df["influence_score"] = (
        (df["followers_count"].clip(upper=100000) / 1000).clip(upper=50) +  # Max 50 points for followers
        (df["posts_count"].clip(upper=50000) / 1000).clip(upper=30) +  # Max 30 points for posts
        (df["verified"].astype(int) * 20)  # 20 points for verification
    ).round(2)

    # Classify activity level based on posts
    def classify_activity(posts_count):
        if pd.isna(posts_count):
            return "unknown"
        elif posts_count < 100:
            return "low"
        elif posts_count < 1000:
            return "medium"
        elif posts_count < 10000:
            return "high"
        else:
            return "very_high"

    df["activity_level"] = df["posts_count"].apply(classify_activity)

    # Add profile completeness rating
    def rate_completeness(score):
        if score >= 80:
            return "excellent"
        elif score >= 60:
            return "good"
        elif score >= 40:
            return "fair"
        else:
            return "poor"

    df["completeness_rating"] = df["completeness_score"].apply(rate_completeness)

    # Calculate following ratio
    df["following_ratio"] = (df["followers_count"] / df["following_count"].replace(0, 1)).round(2)

    # Add last updated timestamp
    df["last_updated"] = datetime.utcnow()

    # Select relevant columns for gold layer
    gold_cols = [
        "username",
        "display_name",
        "followers_count",
        "following_count",
        "posts_count",
        "verified",
        "location",
        "engagement_rate",
        "influence_score",
        "activity_level",
        "completeness_rating",
        "following_ratio",
        "scraped_at",
        "last_updated",
    ]

    df = df[gold_cols]

    context.log.info(f"✓ Enriched {len(df)} user profiles (avg influence: {df['influence_score'].mean():.1f})")

    return Output(
        df,
        metadata={
            "num_records": len(df),
            "avg_influence_score": float(df["influence_score"].mean()),
            "avg_engagement_rate": float(df["engagement_rate"].mean()),
            "verified_count": int(df["verified"].sum()),
            "high_activity_users": int((df["activity_level"] == "high").sum() + (df["activity_level"] == "very_high").sum()),
            "table_type": "gold_enriched"
        }
    )
