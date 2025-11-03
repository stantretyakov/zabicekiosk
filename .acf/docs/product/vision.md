# ODP Product Vision

## Mission

Build an AI-Native OSINT Open Data Platform for threat intelligence and investigation workflows at scale.

## Core Capabilities

1. **Flexible Pipeline DSL**: YAML-based pipeline definition for OSINT investigations
2. **AI-Driven Orchestration**: Natural language → executable investigation pipelines
3. **Scalable Execution**: Temporal workflows handle 300M requests/month, 10K concurrent workflows
4. **Data Lakehouse**: Bronze/Silver/Gold medallion architecture on Delta Lake
5. **Multi-Tenant**: Workspace → Project → Pipeline hierarchy with RBAC

## Scale Targets

- 300M requests/month (116 RPS avg, 1160 RPS burst)
- 99.99% availability (production)
- 10,000+ concurrent workflows
- 100TB+ data (5-year horizon)

## Non-Goals

- Enterprise features requiring licenses (permissive licenses only)
- On-premise deployment (cloud-native first, portable later)
- Real-time streaming analytics (batch-oriented)

---

**Last Updated**: 2025-10-27
