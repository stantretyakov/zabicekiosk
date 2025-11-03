#!/usr/bin/env bash
set -euo pipefail

# Initialize Dagster medallion architecture layers
# Materializes Bronze → Silver → Gold assets on startup

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 Initializing Dagster data layers...${NC}"

# Wait for Dagster health (max 120s)
echo "Waiting for Dagster to be ready..."
for i in {1..24}; do
    if curl -f -s http://localhost:18084 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Dagster ready${NC}"
        break
    fi
    if [ $i -eq 24 ]; then
        echo -e "${RED}✗ Dagster not ready after 120s${NC}"
        exit 1
    fi
    sleep 5
done

# Check MinIO buckets using minio container (not minio-bootstrap)
echo "Checking MinIO buckets..."
for bucket in bronze silver gold; do
    if ! docker compose -f ops/local/compose.yml exec -T minio mc ls myminio/ 2>/dev/null | grep -q "$bucket"; then
        echo -e "${YELLOW}⚠ Bucket $bucket not found, will be created on first write${NC}"
    fi
done

# Materialize Bronze layer
echo -e "${BLUE}Materializing Bronze layer...${NC}"
docker compose -f ops/local/compose.yml exec -T dagster \
    dagster asset materialize -m __init__ --select "bronze/raw_pipeline_events" || {
    echo -e "${RED}✗ Failed to materialize bronze/raw_pipeline_events${NC}"
    exit 1
}

docker compose -f ops/local/compose.yml exec -T dagster \
    dagster asset materialize -m __init__ --select "bronze/raw_crawler_results" || {
    echo -e "${RED}✗ Failed to materialize bronze/raw_crawler_results${NC}"
    exit 1
}

sleep 10

# Materialize Silver layer
echo -e "${BLUE}Materializing Silver layer...${NC}"
docker compose -f ops/local/compose.yml exec -T dagster \
    dagster asset materialize -m __init__ --select "silver/pipeline_events" || {
    echo -e "${RED}✗ Failed to materialize silver/pipeline_events${NC}"
    exit 1
}

docker compose -f ops/local/compose.yml exec -T dagster \
    dagster asset materialize -m __init__ --select "silver/crawler_results" || {
    echo -e "${RED}✗ Failed to materialize silver/crawler_results${NC}"
    exit 1
}

sleep 10

# Materialize Gold layer
echo -e "${BLUE}Materializing Gold layer...${NC}"
docker compose -f ops/local/compose.yml exec -T dagster \
    dagster asset materialize -m __init__ --select "gold/pipeline_metrics" || {
    echo -e "${RED}✗ Failed to materialize gold/pipeline_metrics${NC}"
    exit 1
}

docker compose -f ops/local/compose.yml exec -T dagster \
    dagster asset materialize -m __init__ --select "gold/user_profiles" || {
    echo -e "${RED}✗ Failed to materialize gold/user_profiles${NC}"
    exit 1
}

echo -e "${GREEN}✓ All data layers initialized successfully${NC}"
echo -e "  - Bronze: 2 assets"
echo -e "  - Silver: 2 assets"
echo -e "  - Gold: 2 assets"
