# Dagster - Data Pipeline Orchestration
# Medallion Architecture: Bronze → Silver → Gold

FROM python:3.11-slim

WORKDIR /opt/dagster/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Dagster code
COPY workspace.yaml .
COPY __init__.py .
COPY assets/ ./assets/
COPY resources/ ./resources/
COPY sensors/ ./sensors/

# Expose ports
EXPOSE 3000 4000

# Set environment variables
ENV DAGSTER_HOME=/opt/dagster/app

# Start Dagster webserver
CMD ["dagster-webserver", "-h", "0.0.0.0", "-p", "3000", "-w", "workspace.yaml"]
