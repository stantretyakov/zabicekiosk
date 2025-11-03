# Functional Boundaries

## What ODP IS

- **OSINT Intelligence Platform**: Data collection, enrichment, analysis for investigations
- **Pipeline Orchestration**: YAML DSL → Temporal workflows → Data lake
- **AI-Native**: LangGraph agents generate pipelines from natural language
- **Multi-Tenant SaaS**: Workspace/project isolation, RBAC via Keycloak
- **Data Lakehouse**: Medallion architecture (Bronze/Silver/Gold) on Delta Lake
- **Developer-Friendly**: Local dev with Docker Compose, minimal setup

## What ODP is NOT

- **Not a Search Engine**: Use external crawlers (we orchestrate, don't crawl)
- **Not a Data Warehouse**: Operational data lake, not OLAP/BI tool
- **Not Real-Time**: Batch-oriented pipelines, not streaming analytics
- **Not Model Training Platform**: Model serving only (training elsewhere)
- **Not CRM/Ticketing**: Investigation workflows, not case management
- **Not Blockchain/Web3**: Traditional cloud infrastructure

## Scope Boundaries

**In Scope**:
- YAML pipeline definition and validation
- Temporal workflow orchestration
- Data transformation (Dagster)
- ML model serving (BentoML)
- Multi-tenant isolation
- API-first design

**Out of Scope**:
- Custom data crawlers (use external APIs)
- Model training (use external platforms)
- Real-time alerting (batch workflows only)
- Advanced visualization (export to BI tools)
- Team collaboration features (workspaces only)

---

**Last Updated**: 2025-10-27
