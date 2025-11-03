# ODP Target Architecture - Final Deliverable

**Date:** October 28, 2025
**Status:** Target State Architecture
**Purpose:** Implementation-ready architecture specification

---

## Document Purpose

This package describes the **target state** of the AI-Native OSINT Open Data Platform (ODP). All evolutionary narratives, decision comparisons, and implementation timelines have been removed. These documents represent the final architecture for implementation teams.

**What's Included:**
- Target system architecture (no "before/after" comparisons)
- Technology selections (facts only, no justifications)
- Integration patterns and data flows
- Deployment topology and security architecture

**What's NOT Included:**
- Architecture decision records (see `../week3/05-technology-stack.md` for ADRs)
- Cost models and budget analysis
- Implementation roadmaps and timelines
- Risk assessments and mitigation strategies
- Team composition recommendations

---

## Reading Order

### For Implementation Teams

**Start here:**
1. **[system-architecture.md](system-architecture.md)** - Complete system overview (C4 L1-L2)
2. **[identity-and-api.md](identity-and-api.md)** - Authentication, APIs, multi-tenancy
3. **[execution-platform.md](execution-platform.md)** - Workflow orchestration (Temporal, YAML)

**Then deep-dive:**
4. **[data-platform.md](data-platform.md)** - Medallion architecture, Data Catalog
5. **[ml-platform.md](ml-platform.md)** - Agent orchestration, model serving
6. **[infrastructure.md](infrastructure.md)** - K8s, observability, security

### For Leadership

**Quick overview:**
1. **[system-architecture.md](system-architecture.md)** - System context and container architecture
2. **[infrastructure.md](infrastructure.md)** - Deployment and operational architecture

---

## Terminology Dictionary

**Consistent usage across all documents:**

| Term | Definition | Context |
|------|------------|---------|
| **Workspace** | Tenant in multi-tenant hierarchy | Always use (not "tenant") |
| **Pipeline** | User-facing investigation workflow | User documentation, YAML |
| **Workflow** | Temporal implementation of pipeline | Technical docs only |
| **Step** | YAML DSL unit of work | YAML specification |
| **Activity** | Temporal implementation unit | Temporal technical docs |
| **User API** | Go service for pipeline submission | Always use (not "Manual API" or "UI Backend") |
| **Agent Orchestrator** | LangGraph-based AI service | Always use (not "AI Agent" or "LangGraph Service") |
| **YAML Processor** | Go service converting DSL → workflows | Always use (not "Interpreter" or "DSL Parser") |
| **Bronze Layer** | Raw data landing zone | Medallion architecture |
| **Silver Layer** | Cleaned, normalized data | Medallion architecture |
| **Gold Layer** | Business-ready aggregates | Medallion architecture |

---

## Document Authority (Single Source of Truth)

Each architectural concern has ONE authoritative document. Other documents reference the authority.

| Topic | Authoritative Document | Referenced By |
|-------|----------------------|---------------|
| **YAML Specification** | execution-platform.md | ml-platform.md, system-architecture.md |
| **Authentication/RBAC** | identity-and-api.md | All documents |
| **Event Bus (Pulsar)** | infrastructure.md | execution-platform.md, system-architecture.md |
| **Data Catalog** | data-platform.md | system-architecture.md, ml-platform.md |
| **Multi-Tenancy Hierarchy** | identity-and-api.md | All documents |
| **Medallion Architecture** | data-platform.md | system-architecture.md, execution-platform.md |
| **Observability Stack** | infrastructure.md | All documents |
| **Kubernetes Deployment** | infrastructure.md | All documents |

---

## Technology Evaluation Status

Components under evaluation (decisions pending Sprint 0):

| Component | Candidates | Decision Timeline | Evaluation Criteria |
|-----------|-----------|------------------|---------------------|
| **Data Catalog** | Apache Atlas, OpenMetadata, DataHub | Sprint 0 | Ontology management, data lineage tracking, operational complexity, community support |
| **Event Bus** | Apache Pulsar, Kafka | Sprint 0 | Multi-tenancy (namespace isolation), operational overhead (target: 1.8 FTE), independent compute/storage scaling |

**Note:** All other technology selections are finalized and documented in respective component documents.

---

## Architecture Highlights

### Core Platform Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Data Lake** | Delta Lake on GCS | ACID-compliant lakehouse, medallion layers |
| **Data Orchestration** | Dagster | Asset-centric data + ML pipeline orchestration |
| **Execution Platform** | Temporal | Durable workflow engine for stateful processes |
| **Identity Provider** | Keycloak | Multi-tenant auth/authz, RBAC, OAuth/OIDC |
| **Data Catalog** | Apache Atlas / OpenMetadata / DataHub (under evaluation) | Centralized metadata, ontology management |
| **Event Bus** | Apache Pulsar (evaluation) | Multi-tenant event streaming |
| **ML Serving** | BentoML + MLflow | Model deployment and lifecycle management |
| **Vector Store** | Qdrant | Scenario embeddings, semantic search |
| **Agent Framework** | LangGraph | AI-driven pipeline orchestration |
| **API Gateway** | Kong + Istio | External ingress and service mesh |

### Key Architectural Patterns

**Medallion Architecture:** Bronze (raw) → Silver (cleaned) → Gold (business-ready)

**Dual Orchestration:**
- Dagster: Data transformations and ML training
- Temporal: Execution workflows and stateful processes

**Multi-Tenancy:** Workspace → Project → Pipeline hierarchy with Keycloak RBAC

**Event-Driven:** Apache Pulsar for async messaging, real-time status updates

**Separation of Concerns:** Execution logic (Temporal) vs Data transformations (Dagster)

---

## Architecture Principles

1. **Open Source First** - No enterprise licenses, permissive licenses only
2. **Cloud Agnostic** - GCP primary, portable to AWS/Azure/on-premise
3. **Multi-Tenant by Design** - Workspace isolation, resource quotas, RBAC
4. **API-First** - All functionality exposed via REST/GraphQL APIs
5. **Event-Driven** - Async messaging for component integration
6. **Separation of Concerns** - Clear boundaries between execution, data, and ML layers
7. **Security by Default** - mTLS, encryption at rest, audit logging
8. **Observability Native** - OpenTelemetry, Prometheus, Grafana from day 1

---

## Technology Stack Summary

### Data Layer
- **Storage:** Delta Lake on GCS (ACID, time travel, schema enforcement)
- **Orchestration:** Dagster (asset-centric, data lineage, quality gates)
- **Catalog:** Apache Atlas / OpenMetadata / DataHub (under evaluation - metadata registry, ontology)
- **Quality:** Great Expectations (validation framework)

### Execution Layer
- **Workflows:** Temporal (durable execution, multi-language SDKs)
- **Backend:** Go (User API, YAML interpreter, microservices)
- **Event Bus:** Apache Pulsar + Redis (event streaming, real-time updates)
- **API Gateway:** Kong + Istio (external ingress, service mesh)

### ML/AI Layer
- **Agents:** LangGraph (graph-based workflows, state management)
- **Serving:** BentoML (K8s-native model deployment)
- **Registry:** MLflow (experiment tracking, model versioning)
- **Vectors:** Qdrant (embeddings, semantic search)

### Infrastructure Layer
- **Compute:** GKE on GCP (Kubernetes, auto-scaling)
- **Identity:** Keycloak (OAuth/OIDC, RBAC, multi-tenancy)
- **Observability:** Prometheus, Grafana, Loki, OpenTelemetry
- **Security:** Vault (secrets), Istio (mTLS), network policies

---

## Key Integrations

**Legacy Platform Integration:**
- CrimeWall Connector (temporary bridge for MVP)
- Migration to native ontology post-MVP

**External Data Sources:**
- Social media APIs (X/Twitter, Facebook, LinkedIn)
- Dark web crawlers (Tor-based)
- Breach databases (38TB OrientDB → Delta Lake migration)
- Public records APIs

**Foundation Models:**
- Groq (primary LLM provider)
- OpenAI (secondary, specialized tasks)
- Self-hosted SLMs (Q1 2026 requirement)

---

## Compliance & Security

**Standards:**
- ISO 27001 (2026 recertification)
- SOC 2 (end of 2027 target)
- GDPR (operational)

**Security Controls:**
- Encryption at rest (GCP-managed, infrastructure-level)
- Encryption in transit (mTLS via Istio)
- Secrets management (Vault, automatic rotation)
- Network isolation (namespace-level policies, Cilium)
- Audit logging (all API calls, 1-year retention)

---

## Scale Targets

| Metric | Target |
|--------|--------|
| **Throughput** | 300M requests/month (116 RPS avg, 1160 RPS burst) |
| **Availability** | 99.99% (production), 99.9% (MVP) |
| **Latency (p95)** | <300ms (production), <500ms (MVP) |
| **Data Volume** | 100TB+ (5-year horizon) |
| **Concurrent Workflows** | 10,000+ |
| **RPO** | ≤5 minutes (production) |
| **RTO** | ≤10 minutes (production) |

---

## Document Metadata

**Prepared By:** Pavel Spesivtsev (Fibonacci 7 / ACF Transformation Agency)
**Contributors:** Stanislav Tretyakov (CTO), Vladislav De-Gald (ML Lead), Oleg Polyakov (Backend Lead)
**Delivery Date:** October 28, 2025
**Version:** 1.0 (Final Target State)

**Previous Iterations:**
- Week 1 (Oct 1-7): Discovery and stakeholder interviews
- Week 2 (Oct 8-16): Architecture evaluation and technology proposals
- Week 3 (Oct 20-24): Technology decisions finalized, team structure defined
- Week 4 (Oct 27-28): Target state architecture synthesis

**Related Documents:**
- `../week3/` - Architecture decisions and evolution (ADRs, comparisons, team structure)
- `../week2/` - Technology evaluations and initial proposals

---

**END OF README**
