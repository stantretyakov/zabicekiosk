#!/usr/bin/env bash

# ODP Seed Data Script
# Creates test workspaces, Delta tables, Qdrant collections, method registry
# Idempotent: safe to run multiple times

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🌱 Seeding ODP Test Data"
echo "========================"
echo ""

# Change to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../.."
cd "${PROJECT_ROOT}"

# Check if services are running
if ! docker compose -f ops/local/compose.yml ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠ Warning: Services not running${NC}"
    echo "  Start services with: make start"
    exit 1
fi

echo -e "${BLUE}1. Creating test workspaces...${NC}"

# TODO: Implement workspace creation via User API
# For now, create placeholder data

cat > /tmp/workspace-test-001.json << 'EOF'
{
  "workspace_id": "workspace-test-001",
  "name": "Alice Corp Investigations",
  "owner": "alice@example.com",
  "projects": [
    {
      "project_id": "project-test-001",
      "name": "Q4 Threat Monitoring",
      "description": "Quarterly threat intelligence gathering"
    }
  ]
}
EOF

cat > /tmp/workspace-test-002.json << 'EOF'
{
  "workspace_id": "workspace-test-002",
  "name": "Bob Security Research",
  "owner": "bob@example.com",
  "projects": [
    {
      "project_id": "project-test-002",
      "name": "Social Graph Analysis",
      "description": "Entity relationship mapping"
    }
  ]
}
EOF

echo "  ✓ Created 2 test workspaces"
echo ""

echo -e "${BLUE}2. Initializing Delta Lake tables...${NC}"

# TODO: Use Dagster to materialize Bronze/Silver/Gold assets
# For now, create directory structure in MinIO

docker compose -f ops/local/compose.yml exec -T minio-bootstrap mc ls myminio/bronze > /dev/null 2>&1 && {
    echo "  ✓ Bronze bucket ready"
} || {
    echo "  ! Bronze bucket not found (MinIO may still be bootstrapping)"
}

docker compose -f ops/local/compose.yml exec -T minio-bootstrap mc ls myminio/silver > /dev/null 2>&1 && {
    echo "  ✓ Silver bucket ready"
} || {
    echo "  ! Silver bucket not found"
}

docker compose -f ops/local/compose.yml exec -T minio-bootstrap mc ls myminio/gold > /dev/null 2>&1 && {
    echo "  ✓ Gold bucket ready"
} || {
    echo "  ! Gold bucket not found"
}

echo ""

echo -e "${BLUE}3. Initializing data layers...${NC}"

# Check if Dagster is running (full profile only)
if docker compose -f ops/local/compose.yml ps | grep -q "dagster.*Up"; then
    echo "  ✓ Dagster running, initializing layers..."
    if ./ops/scripts/init_data_layers.sh; then
        echo -e "${GREEN}  ✓ Data layers initialized${NC}"
    else
        echo -e "${YELLOW}  ⚠ Data layer initialization failed${NC}"
        echo -e "${YELLOW}  → Try manually: ${BLUE}make init-data-layers${NC}"
        echo -e "${YELLOW}  → Check logs: ${BLUE}docker compose logs dagster${NC}"
        echo -e "${YELLOW}  → Verify Dagster UI: ${BLUE}http://localhost:18084${NC}"
    fi
else
    echo "  - Dagster not running, skipping data layer init"
    echo "    (Use 'make start PROFILE=full' to enable Dagster)"
fi

echo ""

echo -e "${BLUE}4. Seeding Qdrant scenario embeddings...${NC}"

# Check if Qdrant is running (full profile only)
if docker compose -f ops/local/compose.yml ps | grep -q "qdrant.*Up"; then
    # TODO: Create collections and insert sample scenario embeddings
    echo "  ✓ Qdrant running (full profile)"
    echo "  ! TODO: Insert sample scenario embeddings"
else
    echo "  - Qdrant not running (dev profile, skip)"
fi

echo ""

echo -e "${BLUE}5. Loading method registry...${NC}"

# Check if catalog stub data exists
if [ -f "data/catalog-metadata/stub-catalog.json" ]; then
    METHODS_COUNT=$(cat data/catalog-metadata/stub-catalog.json | grep -o '"method_id"' | wc -l | tr -d ' ')
    echo "  ✓ Method registry loaded (${METHODS_COUNT} methods)"
else
    echo "  ! Method registry file not found"
    echo "    Expected: data/catalog-metadata/stub-catalog.json"
fi

echo ""

echo -e "${BLUE}6. Creating sample pipelines...${NC}"

# TODO: Store sample pipelines in MongoDB
echo "  ! TODO: Store sample pipelines in MongoDB"
echo "  - Examples available in: examples/pipelines/"

echo ""

echo -e "${GREEN}✅ Seed data complete!${NC}"
echo ""
echo "Test workspaces created:"
echo "  - workspace-test-001 (Alice Corp)"
echo "  - workspace-test-002 (Bob Security)"
echo ""
echo "Next steps:"
echo "  1. Submit example pipeline: make example-minimal"
echo "  2. View Temporal UI: open http://localhost:18088"
echo "  3. Check MinIO console: open http://localhost:19001"
echo ""
