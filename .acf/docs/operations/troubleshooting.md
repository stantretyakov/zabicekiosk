# Troubleshooting

## Common Issues

### Services won't start

```bash
# Check Docker is running
docker ps

# Check port conflicts
lsof -i :15432  # PostgreSQL
lsof -i :16379  # Redis

# Check logs
make logs
```

### Health checks failing

```bash
# Check individual service health
curl http://localhost:18000/health  # user-api
curl http://localhost:18001/health  # catalog-stub
curl http://localhost:18002/health  # stubs

# Restart specific service
docker-compose -f ops/local/compose.yml restart user-api
```

### Tests failing

```bash
# Go tests
cd services/user-api && go test ./... -v

# Python tests
cd services/agent-orchestrator && pytest -v

# Check test dependencies
docker-compose -f ops/local/compose.yml ps
```

---

**Last Updated**: 2025-10-27
