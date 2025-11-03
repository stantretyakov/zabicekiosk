# Monitoring

## Local Development

- Temporal UI: http://localhost:18080
- Dagster UI: http://localhost:13000
- MLflow UI: http://localhost:15000
- MinIO Console: http://localhost:19001

## Production

**Metrics**: Prometheus scrapes service `/metrics` endpoints

**Logs**: Loki aggregates structured logs (JSON format)

**Traces**: OpenTelemetry for distributed tracing

**Dashboards**: Grafana with pre-built dashboards for:
- Service health (uptime, error rates)
- Pipeline execution (throughput, latency)
- Resource usage (CPU, memory, disk)

---

**Last Updated**: 2025-10-27
