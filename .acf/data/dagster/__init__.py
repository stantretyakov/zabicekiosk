"""
ODP Dagster Data Pipelines
Medallion Architecture: Bronze → Silver → Gold

This module defines all Dagster assets and resources for the ODP data platform.
"""

from dagster import Definitions, load_assets_from_modules

# Import asset modules
from assets import bronze_assets, silver_assets, gold_assets

# Import resources
from resources.minio_resource import minio_resource
from resources.delta_lake_io_manager import delta_lake_io_manager

# Load all assets
bronze_layer = load_assets_from_modules([bronze_assets])
silver_layer = load_assets_from_modules([silver_assets])
gold_layer = load_assets_from_modules([gold_assets])

# Combine all assets
all_assets = [*bronze_layer, *silver_layer, *gold_layer]

# Define resources
resources = {
    "minio": minio_resource,
    "delta_lake_io_manager": delta_lake_io_manager,
}

# Create Definitions object (entry point for Dagster)
defs = Definitions(
    assets=all_assets,
    resources=resources,
)
