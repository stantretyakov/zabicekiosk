"""
MinIO S3-Compatible Resource
Provides S3 client configured for MinIO backend
"""

import os
import boto3
from dagster import resource, InitResourceContext


@resource
def minio_resource(context: InitResourceContext):
    """
    Configure boto3 S3 client for MinIO

    Environment Variables:
        AWS_ACCESS_KEY_ID: MinIO access key (default: minioadmin)
        AWS_SECRET_ACCESS_KEY: MinIO secret key (default: minioadmin)
        AWS_ENDPOINT_URL: MinIO endpoint (default: http://minio:9000)
        AWS_REGION: AWS region (default: us-east-1)
    """
    endpoint_url = os.getenv("AWS_ENDPOINT_URL", "http://minio:9000")
    access_key = os.getenv("AWS_ACCESS_KEY_ID", "minioadmin")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "minioadmin")
    region = os.getenv("AWS_REGION", "us-east-1")

    context.log.info(f"Connecting to MinIO at {endpoint_url}")

    s3_client = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
        # Force path-style URLs for MinIO compatibility
        config=boto3.session.Config(signature_version='s3v4', s3={'addressing_style': 'path'})
    )

    return s3_client
