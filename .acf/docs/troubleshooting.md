# ODP Troubleshooting Guide

**Common issues and solutions**

---

## Startup Issues

### Port Conflicts

**Symptom:**
```
Error: bind: address already in use (port 15432)
```

**Solution:**
All ports use non-standard 15xxx-19xxx range, but conflicts can still occur.

```bash
# Check what's using the port
lsof -ti:15432

# Kill the process
lsof -ti:15432 | xargs kill -9

# Or change port in docker-compose.yml
```

**Prevention:** Use `make ports` to see all port mappings.

---

### Docker Out of Resources

**Symptom:**
```
docker: Error response from daemon: OCI runtime create failed
```

**Solution:**
Check Docker Desktop resources:

```bash
# Check available resources
docker info | grep -A 5 "Total Memory"

# Recommendations:
# - Minimal profile: 2GB RAM, 2 CPU
# - Dev profile: 4GB RAM, 2 CPU
# - Full profile: 8GB RAM, 4 CPU
```

**Fix:** Docker Desktop → Settings → Resources → Increase RAM/CPU

---

### Slow Startup (> 2 minutes)

**Symptom:** Health checks timeout, services take forever to start.

**Causes:**
1. **First run:** Docker pulling images (expected, 3-5 minutes)
2. **Low resources:** Need more RAM/CPU
3. **Disk I/O:** SSD recommended

**Solution:**
```bash
# Check which service is slow
docker compose ps

# View logs for stuck service
docker compose logs temporal

# Try starting services individually
make minimal   # Start just Temporal first
make dev       # Then full dev stack
```

---

### Health Check Failures

**Symptom:**
```
Checking User API... ✗ FAILED (timeout after 15s)
```

**Solution:**
```bash
# Check service logs
docker compose logs user-api

# Common issues:
# 1. Service crashed on startup
docker compose ps user-api   # Check status

# 2. Wrong port mapping
curl http://localhost:18080/health

# 3. Dependency not ready
# Solution: Restart dependencies first
docker compose restart postgres
docker compose restart user-api
```

---

## Service-Specific Issues

### PostgreSQL Won't Start

**Symptom:**
```
postgres  | FATAL: database files are incompatible with server
```

**Solution:**
```bash
# Remove old data volume
make clean

# Or manually:
docker compose down -v
docker volume rm odp_postgres-data
make start
```

---

### Temporal UI Not Accessible

**Symptom:** http://localhost:18088 returns connection refused

**Solutions:**

**1. Service Not Ready:**
```bash
# Wait for Temporal to start (45s timeout)
docker compose logs temporal | grep "Started"

# Force restart
docker compose restart temporal
```

**2. Wrong Port:**
```bash
# Verify port mapping
docker compose ps temporal
# Should show: 0.0.0.0:18088->8080/tcp
```

**3. Check PostgreSQL:**
```bash
# Temporal depends on PostgreSQL
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U postgres -d temporal -c "SELECT 1"
```

---

### MinIO Bootstrap Failures

**Symptom:**
```
minio-bootstrap | mc: Unable to initialize new alias from the provided credentials
```

**Solution:**
```bash
# Wait for MinIO to be fully ready
docker compose logs minio | grep "API"

# Restart bootstrap
docker compose restart minio-bootstrap

# Manually create buckets
docker compose exec minio mc alias set myminio http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb myminio/bronze
docker compose exec minio mc mb myminio/silver
docker compose exec minio mc mb myminio/gold
```

---

### Redis Connection Errors

**Symptom:**
```
user-api | Error: dial tcp 127.0.0.1:16379: connect: connection refused
```

**Solution:**
```bash
# Check Redis is running
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli ping
# Should return: PONG

# Restart Redis
docker compose restart redis
```

---

## Pipeline Submission Issues

### YAML Validation Fails

**Symptom:**
```json
{
  "error": "Invalid YAML: method not found",
  "method_id": "crawler_unknown"
}
```

**Solution:**
```bash
# Check method exists in catalog
curl http://localhost:18090/api/v1/methods | jq '.methods[] | .method_id'

# Common mistakes:
# 1. Wrong method ID (crawler_twitter vs crawler_twitter_profile)
# 2. Method not in catalog
# 3. Typo in YAML

# Validate YAML syntax
yamllint examples/pipelines/minimal-workflow.yaml
```

---

### Template Resolution Errors

**Symptom 1:** `Step 'X' not found in previous results`

```json
{
  "error": "Step 'collect_twitter' not found in previous results",
  "available_steps": []
}
```

**Causes:**
1. Missing `depends_on` declaration
2. Typo in step ID
3. Step hasn't executed yet

**Solutions:**

```yaml
# Fix: Add depends_on
steps:
  - id: "collect_twitter"
    # ...

  - id: "analyze"
    inputs:
      data:
        from: "{{collect_twitter.field}}"
    depends_on: ["collect_twitter"]  # ← REQUIRED
```

```bash
# Verify step IDs match
grep "id:" examples/pipelines/your-pipeline.yaml

# Check Temporal UI for step execution order
open http://localhost:18088
```

---

**Symptom 2:** `Field 'Y' not found in step 'X' output`

```json
{
  "error": "Field 'profile.recent_posts' not found",
  "step": "collect_twitter",
  "available_fields": ["username", "recent_posts", "bio"]
}
```

**Cause:** Template path doesn't match actual output structure.

**Solutions:**

```bash
# 1. Check step output schema
curl http://localhost:18090/api/v1/methods/crawler_twitter_profile | jq '.output_schema'

# 2. Inspect actual output in Temporal UI
# Navigate to: Workflow → Event History → Activity Completed → Output

# 3. Fix template path
```

```yaml
# Wrong: Nested path that doesn't exist
from: "{{collect_twitter.profile.recent_posts}}"

# Correct: Direct path
from: "{{collect_twitter.recent_posts[*].text}}"
```

---

**Symptom 3:** `Cannot apply [*] to non-array`

```json
{
  "error": "Cannot apply [*] to non-array at 'collect_twitter.username[*]'",
  "field_type": "string"
}
```

**Cause:** Used array splat operator `[*]` on non-array field.

**Solutions:**

```yaml
# Wrong: username is a string, not an array
from: "{{collect_twitter.username[*]}}"

# Correct: Remove [*] for single values
from: "{{collect_twitter.username}}"

# Correct: Use [*] only for arrays
from: "{{collect_twitter.recent_posts[*].text}}"
```

---

**Symptom 4:** Type mismatch error

```json
{
  "error": "Expected List[str] but received str",
  "field": "images",
  "received": "https://example.com/image.jpg"
}
```

**Cause:** ML model expects list but template resolves to single value.

**Solutions:**

```yaml
# Wrong: Single string
inputs:
  images:
    from: "{{step.profile_picture}}"  # Returns: "https://..."

# Correct: Wrap in list
inputs:
  images:
    from: ["{{step.profile_picture}}"]  # Returns: ["https://..."]
```

---

**See Also:**
- [Template Resolution Guide](guides/template-resolution.md) - Complete syntax reference
- [Testing Documentation](development/testing.md) - Template testing examples

---

### Pipeline Stuck in Temporal

**Symptom:** Workflow shows "Running" in Temporal UI but makes no progress.

**Solutions:**

**1. Worker Not Running:**
```bash
# Check Temporal worker is up
docker compose ps temporal-worker

# View worker logs
docker compose logs temporal-worker
```

**2. Stubs Service Down:**
```bash
# Check stubs service
curl http://localhost:18086/health

# Restart
docker compose restart stubs
```

**3. Activity Timeout:**
- View workflow in Temporal UI
- Check activity timeouts in YAML
- Increase `timeout_minutes` in execution block

---

## Data Platform Issues

### Delta Lake Path Errors

**Symptom:**
```
ERROR: No FileSystem for scheme: s3a
```

**Solution:**
```bash
# Verify MinIO is running
curl http://localhost:19000/minio/health/live

# Check S3A configuration in Dagster
docker compose logs dagster | grep "s3a"

# Verify bucket exists
docker compose exec minio mc ls myminio/
# Should show: bronze, silver, gold, mlflow
```

---

### Dagster Won't Start (Full Profile)

**Symptom:**
```
dagster | Cannot connect to PostgreSQL
```

**Solution:**
```bash
# Check PostgreSQL is ready
docker compose exec postgres psql -U postgres -c "SELECT 1"

# Create Dagster database if missing
docker compose exec postgres psql -U postgres -c "CREATE DATABASE dagster"

# Restart Dagster
docker compose restart dagster
```

---

## Network Issues

### Services Can't Communicate

**Symptom:**
```
user-api | Error: dial tcp: lookup catalog-stub: no such host
```

**Solution:**
```bash
# Check network
docker network ls | grep odp

# Verify services on same network
docker compose ps

# Restart with network recreation
docker compose down
docker compose up -d
```

---

### DNS Resolution Failures

**Symptom:**
```
curl: (6) Could not resolve host: localhost
```

**Solution:**
```bash
# Use IP instead of localhost
curl http://127.0.0.1:18080/health

# Check /etc/hosts
cat /etc/hosts | grep localhost

# Restart Docker Desktop (macOS/Windows)
```

---

## Performance Issues

### High CPU Usage

**Symptom:** Docker using 100% CPU, laptop fans spinning.

**Causes:**
1. Too many concurrent pipelines
2. Infinite loops in workflows
3. Resource-intensive ML models

**Solution:**
```bash
# Check which service is consuming CPU
docker stats

# Stop non-essential services
make minimal   # Just Temporal
make dev       # Without ML/Dagster

# Limit concurrent workflows in Temporal
# Edit: docker-compose.yml → temporal-worker → env
# TEMPORAL_WORKER_CONCURRENCY: 5
```

---

### Slow API Responses

**Symptom:** API calls take > 5 seconds.

**Solutions:**

**1. Check Service Logs:**
```bash
docker compose logs user-api | tail -50
```

**2. Verify Dependencies:**
```bash
# Test each service individually
curl http://localhost:18080/health  # User API
curl http://localhost:18090/health  # Catalog Stub
curl http://localhost:18086/health  # Stubs
```

**3. Restart Services:**
```bash
make restart
```

---

## Cleanup & Reset

### Full Reset (Nuclear Option)

```bash
# Stop everything, remove all data
make clean

# Remove all Docker resources
docker system prune -a --volumes

# Restart from scratch
make start
```

---

### Partial Reset (Keep Images)

```bash
# Stop and remove volumes only
make clean

# Restart
make start
```

---

### Reset Specific Service

```bash
# Example: Reset PostgreSQL
docker compose stop postgres
docker volume rm odp_postgres-data
docker compose up -d postgres
```

---

## Debugging Tips

### View Logs

```bash
# All services
make logs

# Specific service
docker compose logs user-api

# Follow logs (tail -f)
docker compose logs -f user-api

# Last 100 lines
docker compose logs --tail=100 user-api
```

---

### Exec into Container

```bash
# Shell into service
make shell SERVICE=user-api

# Or directly
docker compose exec user-api /bin/sh

# Common commands inside:
ps aux              # Running processes
netstat -tulpn      # Port bindings
env                 # Environment variables
```

---

### Test Individual Components

```bash
# PostgreSQL
docker compose exec postgres psql -U postgres -c "SELECT version()"

# Temporal
docker compose exec temporal tctl namespace list

# MinIO
docker compose exec minio mc ls myminio/

# Redis
docker compose exec redis redis-cli ping
```

---

## Known Issues

### macOS: Port Already in Use (despite non-standard ports)

**Workaround:** Change ports in `docker-compose.yml`:
```yaml
# Example: Change PostgreSQL from 15432 to 15433
postgres:
  ports:
    - "15433:5432"
```

Update `.env` accordingly.

---

### Windows: Volume Mounting Issues

**Symptom:** Services can't read catalog data files.

**Solution:** Use WSL2 backend for Docker Desktop (Settings → General → Use WSL 2)

---

### Linux: Permission Denied on Scripts

**Solution:**
```bash
chmod +x ops/scripts/*.sh
```

---

## Getting More Help

**Check Documentation:**
- README.md (overview)
- docs/quickstart.md (setup)
- docs/architecture/ (design details)

**Check Service Health:**
```bash
make health
make ps
```

**View All Port Mappings:**
```bash
make ports
```

**Benchmark Profiles:**
```bash
make bench
```

---

**Still stuck?** Check:
1. Docker Desktop is running
2. Sufficient resources (4 CPU, 8GB RAM)
3. All scripts have execute permissions
4. No antivirus blocking Docker
