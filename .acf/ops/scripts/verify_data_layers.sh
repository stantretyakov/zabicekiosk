#!/usr/bin/env bash
set -euo pipefail

# Verify Dagster medallion architecture layers
# Checks asset materialization status and MinIO Delta tables

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verifying data layers...${NC}"

# Check Dagster health
echo "Checking Dagster health..."
if ! curl -f -s http://localhost:18084 > /dev/null 2>&1; then
    echo -e "${RED}✗ Dagster not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dagster healthy${NC}"

# Count assets using GraphQL API
echo -e "\n${BLUE}Checking asset materialization...${NC}"
assets_json=$(curl -s http://localhost:18084/graphql \
    -H "Content-Type: application/json" \
    -d '{"query": "{ assetsOrError { __typename ... on AssetConnection { nodes { key { path } } } } }"}' 2>/dev/null)

# Count assets by layer
bronze_count=$(echo "$assets_json" | grep -o '"path":\["bronze"' | wc -l | tr -d ' \n')
silver_count=$(echo "$assets_json" | grep -o '"path":\["silver"' | wc -l | tr -d ' \n')
gold_count=$(echo "$assets_json" | grep -o '"path":\["gold"' | wc -l | tr -d ' \n')
total_count=$((bronze_count + silver_count + gold_count))

echo -e "  Bronze: ${bronze_count}/2 assets"
echo -e "  Silver: ${silver_count}/2 assets"
echo -e "  Gold: ${gold_count}/2 assets"

# Check MinIO buckets using minio container (not minio-bootstrap)
echo -e "\n${BLUE}Checking MinIO Delta tables...${NC}"
bucket_count=$(docker compose -f ops/local/compose.yml exec -T minio mc ls myminio/ 2>/dev/null | grep -cE "(bronze|silver|gold)" || echo "0")
echo -e "  MinIO buckets: ${bucket_count}/3"

# Check Delta tables (count _delta_log directories)
delta_count=$(docker compose -f ops/local/compose.yml exec -T minio mc ls --recursive myminio/ 2>/dev/null | grep -c "_delta_log" || echo "0")
echo -e "  Delta tables: ${delta_count}/6"

# Final assessment
echo ""
if [ "$total_count" -eq 6 ] && [ "$bucket_count" -eq 3 ]; then
    echo -e "${GREEN}✓ All data layers operational${NC}"
    echo -e "  - Dagster: healthy"
    echo -e "  - Assets: 6/6 visible"
    echo -e "  - Delta tables: ${delta_count}/6 in MinIO"
    exit 0
else
    echo -e "${YELLOW}⚠ Data layers partially operational${NC}"
    echo -e "  Review asset and table counts above"
    exit 1
fi
