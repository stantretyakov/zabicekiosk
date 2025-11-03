"""
Delta Lake IO Manager
Handles reading and writing Delta tables to MinIO S3 storage
"""

import os
from datetime import datetime

import pandas as pd
from deltalake import DeltaTable, write_deltalake
from dagster import IOManager, io_manager, InitResourceContext, InputContext, OutputContext


class DeltaLakeIOManager(IOManager):
    """
    IO Manager for Delta Lake tables stored in MinIO

    Supports:
    - Writing pandas DataFrames as Delta tables
    - Reading Delta tables as pandas DataFrames
    - S3-compatible storage (MinIO)
    - Append and overwrite modes
    """

    def __init__(self, storage_options: dict):
        self.storage_options = storage_options

    def _get_path(self, context) -> str:
        """
        Generate S3 path for asset

        Format: s3://{bucket}/{asset_key}/
        Example: s3://bronze/pipeline_events/
        """
        # Extract bucket from asset key prefix (e.g., ["bronze", "pipeline_events"])
        key_path = context.asset_key.path
        bucket = key_path[0] if key_path else "bronze"
        table_name = key_path[1] if len(key_path) > 1 else key_path[-1]

        return f"s3://{bucket}/{table_name}/"

    def handle_output(self, context: OutputContext, obj: pd.DataFrame):
        """
        Write pandas DataFrame as Delta table

        Args:
            context: Dagster output context
            obj: pandas DataFrame to write
        """
        if not isinstance(obj, pd.DataFrame):
            raise TypeError(f"DeltaLakeIOManager expects pandas DataFrame, got {type(obj)}")

        path = self._get_path(context)
        mode = context.metadata.get("mode", "overwrite")  # overwrite or append

        context.log.info(f"Writing {len(obj)} rows to Delta table: {path} (mode={mode})")

        # Add ingestion timestamp if not present
        if "ingested_at" not in obj.columns:
            obj["ingested_at"] = datetime.utcnow()

        # Write Delta table
        write_deltalake(
            path,
            obj,
            mode=mode,
            storage_options=self.storage_options,
            engine="rust"  # Use Rust engine for better performance
        )

        context.log.info(f"✓ Successfully wrote {len(obj)} rows to {path}")

    def load_input(self, context: InputContext) -> pd.DataFrame:
        """
        Read Delta table as pandas DataFrame

        Args:
            context: Dagster input context

        Returns:
            pandas DataFrame
        """
        path = self._get_path(context)

        context.log.info(f"Reading Delta table: {path}")

        # Load Delta table
        dt = DeltaTable(path, storage_options=self.storage_options)
        df = dt.to_pandas()

        context.log.info(f"✓ Loaded {len(df)} rows from {path}")

        return df


@io_manager(
    config_schema={},
    required_resource_keys=set()
)
def delta_lake_io_manager(context: InitResourceContext) -> DeltaLakeIOManager:
    """
    Factory for DeltaLakeIOManager

    Configures S3 storage options from environment variables
    """
    storage_options = {
        "AWS_ENDPOINT_URL": os.getenv("AWS_ENDPOINT_URL", "http://minio:9000"),
        "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID", "minioadmin"),
        "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY", "minioadmin"),
        "AWS_REGION": os.getenv("AWS_REGION", "us-east-1"),
        "AWS_S3_ALLOW_UNSAFE_RENAME": "true",  # Required for MinIO
        "allow_http": "true",  # Allow HTTP for local MinIO (not HTTPS)
    }

    context.log.info(f"Initializing DeltaLakeIOManager with endpoint: {storage_options['AWS_ENDPOINT_URL']}")

    return DeltaLakeIOManager(
        storage_options=storage_options
    )
