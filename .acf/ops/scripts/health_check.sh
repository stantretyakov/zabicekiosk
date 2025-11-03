#!/usr/bin/env bash

# ODP Health Check Script
# Waits for all services to be ready after docker-compose up
# Usage: ./health_check.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Timeouts (seconds)
TIMEOUT_POSTGRES=30
TIMEOUT_TEMPORAL=45
TIMEOUT_REDIS=15
TIMEOUT_MINIO=15
TIMEOUT_SERVICE=15

# Function to wait for TCP port
wait_for_tcp() {
    local host=$1
    local port=$2
    local service=$3
    local timeout=$4
    local elapsed=0

    echo -n "Checking ${service}... "

    while ! nc -z ${host} ${port} 2>/dev/null; do
        sleep 1
        elapsed=$((elapsed + 1))

        if [ ${elapsed} -ge ${timeout} ]; then
            echo -e "${RED}✗ FAILED${NC} (timeout after ${timeout}s)"
            echo "  Troubleshoot: docker compose logs $(echo "${service}" | tr '[:upper:]' '[:lower:]')"
            echo "  Common issue: Port ${port} already in use or service failed to start"
            return 1
        fi
    done

    echo -e "${GREEN}✓ Ready${NC}"
    return 0
}

# Function to wait for HTTP endpoint
wait_for_http() {
    local url=$1
    local service=$2
    local timeout=$3
    local elapsed=0

    echo -n "Checking ${service}... "

    while ! curl -sf ${url} > /dev/null 2>&1; do
        sleep 1
        elapsed=$((elapsed + 1))

        if [ ${elapsed} -ge ${timeout} ]; then
            echo -e "${RED}✗ FAILED${NC} (timeout after ${timeout}s)"
            echo "  Troubleshoot: curl -v ${url}"
            echo "  Troubleshoot: docker compose logs $(echo "${service}" | tr '[:upper:]' '[:lower:]')"
            return 1
        fi
    done

    echo -e "${GREEN}✓ Ready${NC}"
    return 0
}

# Function to check if service is running (docker compose)
is_service_running() {
    local service=$1
    docker compose ps --services --filter "status=running" | grep -q "^${service}$"
}

# Detect which profile is running
detect_profile() {
    if is_service_running "agent-orchestrator" || is_service_running "neo4j"; then
        echo "full"
    elif is_service_running "user-api" || is_service_running "redis"; then
        echo "dev"
    else
        echo "minimal"
    fi
}

# Main health check
main() {
    echo "🔍 ODP Health Check"
    echo "==================="
    echo ""

    PROFILE=$(detect_profile)
    echo "Detected profile: ${PROFILE}"
    echo ""

    # Check if docker compose is running
    if ! docker compose ps > /dev/null 2>&1; then
        echo -e "${RED}✗ Docker Compose not running${NC}"
        echo "  Start services with: make start"
        exit 1
    fi

    # Core Infrastructure (minimal profile)
    echo "Core Infrastructure:"
    wait_for_tcp localhost 15432 "PostgreSQL" ${TIMEOUT_POSTGRES} || exit 1
    wait_for_http "http://localhost:18088" "Temporal UI" ${TIMEOUT_TEMPORAL} || exit 1
    echo ""

    # Event Bus & Storage (dev profile)
    if [ "${PROFILE}" != "minimal" ]; then
        echo "Event Bus & Storage:"
        wait_for_tcp localhost 16379 "Redis" ${TIMEOUT_REDIS} || exit 1
        wait_for_http "http://localhost:19000/minio/health/live" "MinIO" ${TIMEOUT_MINIO} || exit 1
        echo ""

        echo "Backend Services:"
        wait_for_http "http://localhost:18080/health" "User API" ${TIMEOUT_SERVICE} || exit 1
        wait_for_http "http://localhost:18090/health" "Catalog Stub" ${TIMEOUT_SERVICE} || exit 1
        wait_for_http "http://localhost:18086/health" "Stubs" ${TIMEOUT_SERVICE} || exit 1
        wait_for_http "http://localhost:18082/health" "YAML Processor" ${TIMEOUT_SERVICE} || exit 1
        echo ""
    fi

    # AI/ML & Data Platform (full profile)
    if [ "${PROFILE}" = "full" ]; then
        echo "AI/ML Services:"
        wait_for_http "http://localhost:18083/health" "Agent Orchestrator" ${TIMEOUT_SERVICE} || exit 1
        wait_for_http "http://localhost:16333/" "Qdrant" ${TIMEOUT_SERVICE} || exit 1
        echo ""

        echo "Data Platform:"
        wait_for_http "http://localhost:18084" "Dagster" ${TIMEOUT_SERVICE} || exit 1
        wait_for_http "http://localhost:18087/health" "MLflow" ${TIMEOUT_SERVICE} || exit 1
        echo ""

        echo "Graph Database:"
        wait_for_tcp localhost 17687 "Neo4j" ${TIMEOUT_SERVICE} || exit 1
        echo ""
    fi

    echo -e "${GREEN}✅ All services healthy!${NC}"
    return 0
}

# Check dependencies
if ! command -v nc &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: 'nc' (netcat) not found${NC}"
    echo "  Install: brew install netcat (macOS) or apt-get install netcat (Linux)"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}✗ Error: 'curl' not found${NC}"
    echo "  Install: brew install curl (macOS) or apt-get install curl (Linux)"
    exit 1
fi

# Change to ops/local directory for docker compose context
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/../local"

# Run main health check
main
