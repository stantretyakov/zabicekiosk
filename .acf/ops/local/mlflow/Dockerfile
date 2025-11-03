FROM ghcr.io/mlflow/mlflow:v2.9.0

# Install system dependencies for health check
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Install PostgreSQL driver for backend-store-uri support
RUN pip install --no-cache-dir psycopg2-binary==2.9.9
