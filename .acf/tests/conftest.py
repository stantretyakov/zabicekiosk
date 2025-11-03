"""
Pytest configuration and shared fixtures for ODP tests

This file provides:
- Shared fixtures for all test modules
- Test configuration
- Common test utilities
"""

import os
import sys
import pytest

# Add data/dagster to Python path for imports
DAGSTER_PATH = os.path.join(os.path.dirname(__file__), "../data/dagster")
sys.path.insert(0, DAGSTER_PATH)


@pytest.fixture(scope="session")
def test_data_dir():
    """Return path to test data directory"""
    return os.path.join(os.path.dirname(__file__), "data")


@pytest.fixture(scope="session")
def dagster_home(tmp_path_factory):
    """Create temporary Dagster home directory"""
    dagster_home = tmp_path_factory.mktemp("dagster_home")
    os.environ["DAGSTER_HOME"] = str(dagster_home)
    return dagster_home


@pytest.fixture(scope="session")
def minio_config():
    """MinIO configuration for testing"""
    return {
        "endpoint_url": os.getenv("AWS_ENDPOINT_URL", "http://localhost:19000"),
        "access_key": os.getenv("AWS_ACCESS_KEY_ID", "minioadmin"),
        "secret_key": os.getenv("AWS_SECRET_ACCESS_KEY", "minioadmin"),
        "region": os.getenv("AWS_REGION", "us-east-1"),
    }


def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test requiring external services"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test with no external dependencies"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
