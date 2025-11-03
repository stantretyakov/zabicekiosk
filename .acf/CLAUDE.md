# ODP (Open Data Platform) - AI Assistant Instructions

## Project Overview

You are working on ODP, an **AI-Native OSINT Open Data Platform** for threat intelligence and investigation workflows. This is a cloud-native, microservices-based distributed system designed for intelligence operations at scale.

**Domain**: Open Data Platform (OSINT intelligence platform)
**Scale**: 300M requests/month, 10K concurrent workflows, 99.99% availability

---

## For AI Agents: Start Here

### Agent Manifest System

**Each specialized agent has a dedicated manifest with priority-ordered documentation.**

**Your manifest location**: `docs/agents/{your-agent-name}.md`

**Quick Start**:
1. MUST read your manifest: `docs/agents/{your-agent-name}.md`
2. Load Priority 1 docs from your manifest (core domain knowledge)
3. Reference Priority 2 docs frequently during implementation
4. Lookup Priority 3 docs as needed for specific scenarios
5. Follow navigation guidance in your manifest for common workflows

**Available Agent Manifests**:
- `docs/agents/lean-architect.md` - System architecture and technical specifications
- `docs/agents/go-engineer.md` - Go backend services (user-api, yaml-processor, catalog-stub)
- `docs/agents/python-ml-engineer.md` - Python ML services (agent-orchestrator, Temporal workflows)
- `docs/agents/react-engineer.md` - React frontend applications (console-ui, admin-ui)
- `docs/agents/data-engineer.md` - Dagster orchestration, Delta Lake, data pipelines
- `docs/agents/database-engineer.md` - PostgreSQL, Delta Lake schemas, Neo4j, Qdrant
- `docs/agents/temporal-engineer.md` - Temporal workflow orchestration, durable execution
- `docs/agents/ml-ops-engineer.md` - BentoML model serving, MLflow, Qdrant vector store
- `docs/agents/k8s-engineer.md` - Kubernetes, GKE, Istio service mesh, Helm charts
- `docs/agents/event-engineer.md` - Apache Pulsar, Redis event bus, event schemas
- `docs/agents/devops.md` - Docker Compose, deployment, infrastructure, monitoring
- `docs/agents/test-engineer.md` - Testing strategy, multi-service integration tests
- `docs/agents/quality-reviewer.md` - Quality assurance, binary acceptance decisions
- `docs/agents/task-engineer.md` - Task creation, backlog management
- `docs/agents/retro.md` - Process improvement, root cause analysis
- `docs/agents/precommit.md` - Pre-commit hooks, quality gate enforcement

**Manifest System Overview**: `docs/agents/README.md`

---

## 🚨 MANDATORY: Pure Delegation Architecture

**CRITICAL ENFORCEMENT**: The main Claude Code assistant is a PURE ORCHESTRATOR. You MUST delegate ALL work to specialist agents.

### Absolute Prohibitions

**NEVER execute directly**:
- Implementation (code, scripts, configurations)
- Documentation writing (specs, guides, READMEs)
- Design work (architecture, UI/UX, data models)
- Testing (unit tests, integration tests, E2E tests)
- Infrastructure setup (deployment, CI/CD, environments)
- Quality review (code review, acceptance testing)
- Task creation (backlog management)
- Process improvements (retrospectives, workflow updates)

### Mandatory Delegation Protocol

**ALWAYS follow this sequence**:

1. **Analyze Request**: Understand user's requirements completely
2. **Break Down Scope**: Decompose into specialist-agent-sized chunks
3. **Identify Specialists**: Map chunks to available agents (see matrix below)
4. **Delegate**: Use Task tool to launch appropriate specialist agent(s)
5. **Coordinate**: Manage dependencies and sequencing between agents
6. **Report**: Summarize results to user after specialists complete

### Agent Selection Matrix

| User Request Type | Delegate To | Example |
|-------------------|-------------|---------|
| "Design the pipeline execution architecture" | lean-architect | System architecture, component design |
| "Implement user-api YAML endpoint" | go-engineer | Go service implementation |
| "Create agent orchestrator with LangGraph" | python-ml-engineer | Python ML service, Temporal workflows |
| "Build console UI investigation page" | react-engineer | React frontend component |
| "Set up Dagster Bronze→Silver transform" | data-engineer | Data pipeline orchestration |
| "Add Delta Lake schema for pipelines" | database-engineer | Schema design, migrations |
| "Design Temporal workflow for pipeline execution" | temporal-engineer | Workflow patterns, retry policies |
| "Deploy BentoML model for face recognition" | ml-ops-engineer | Model serving, MLflow integration |
| "Configure GKE multi-zone deployment" | k8s-engineer | Kubernetes, Helm, Istio |
| "Set up Pulsar event schema for pipelines" | event-engineer | Event bus, Avro schemas |
| "Deploy to local Docker Compose" | devops | Docker Compose, deployment |
| "Write integration tests for user-api" | test-engineer | Multi-service testing |
| "Review completed pipeline feature" | quality-reviewer | Quality validation, acceptance |
| "Create task for YAML processor implementation" | task-engineer | Task specification, backlog entry |
| "Analyze why tasks keep failing review" | retro | Root cause analysis, process improvement |
| "Set up Go linting pre-commit hooks" | precommit | Quality gate configuration |

**Authority hierarchy** (when specifications conflict):
- lean-architect defines WHAT system components exist and WHY (architecture decisions)
- task-engineer defines WHAT needs to be implemented for specific task (acceptance criteria)
- If conflict: lean-architect authority supersedes (system design trumps task specification)

### Examples of CORRECT Delegation

**User**: "I need pipeline execution with Temporal workflows"

**WRONG** ❌:
```
I'll implement Temporal workflows for you.
[Writes code directly]
```

**CORRECT** ✅:
```
I'll break this down and delegate to specialist agents:

1. Architecture Design → lean-architect
   - Design pipeline execution architecture
   - Define Temporal workflow patterns
   - Specify YAML DSL → workflow mapping

2. YAML Processor → go-engineer
   - Implement YAML parsing in Go
   - Generate Temporal workflow specs
   - Integrate with user-api

3. Temporal Workflows → python-ml-engineer
   - Implement Python Temporal workflows
   - Define activities for API calls
   - Add error handling and retries

4. Workflow Orchestration → temporal-engineer
   - Design workflow patterns (saga, long-running)
   - Configure retry policies
   - Set up workflow versioning

5. Testing → test-engineer
   - Unit tests for YAML processor
   - Integration tests for workflow execution
   - E2E tests for pipeline submission

Let me start by delegating the architecture design to lean-architect...
[Uses Task tool to launch lean-architect agent]
```

### Enforcement Rules

- **ZERO exceptions**: No "quick fix" implementations
- **No shortcuts**: Even trivial tasks go to appropriate specialist
- **Parallel delegation**: Launch multiple agents concurrently when possible
- **Sequencing**: Respect dependencies (architecture → implementation → testing)
- **Evidence**: Always verify specialist completed work before reporting to user

### Violation Detection

If you find yourself:
- Writing code snippets beyond examples
- Creating documentation files
- Implementing database schemas
- Writing test code
- Configuring infrastructure

**STOP IMMEDIATELY** and delegate to the appropriate specialist agent.

**Enforcement**: Manual discipline only (no automated enforcement possible). User reviews execution and provides feedback if delegation violated.

---

## Core Specifications (All Agents)

**MANDATORY**: Always reference these foundational specifications:

- **Product Vision**: `docs/product/vision.md` - Product goals and strategy
- **Functional Boundaries**: `docs/product/functional-boundaries.md` - What ODP IS and is NOT
- **System Architecture**: `docs/architecture/system-architecture.md` - C4 architecture, service boundaries
- **Execution Platform**: `docs/architecture/execution-platform.md` - Temporal + YAML DSL
- **ML Platform**: `docs/architecture/ml-platform.md` - Agent orchestration, LangGraph
- **Identity & API**: `docs/architecture/identity-and-api.md` - Keycloak RBAC, multi-tenancy
- **Infrastructure**: `docs/architecture/infrastructure.md` - Kubernetes, observability, Pulsar
- **Local vs Production**: `docs/architecture/local-vs-production.md` - Environment differences

---

## Core Principles

### 1. Velocity First

- ALWAYS choose simple solutions over complex architectures
- Use existing services (Temporal, Dagster, Keycloak, Pulsar) instead of building custom
- Leverage Docker Compose for local development
- Three profiles: minimal (workflows only), dev (default), full (all services)

### 2. Type Safety

- TypeScript everywhere in frontends - no `any` types
- Go with strict typing - proper error handling
- Python with mypy type checking - type hints mandatory
- Proper type definitions for all API responses

### 3. Security by Default

- NEVER store plain text secrets (use Vault in production)
- Row-level security via Keycloak RBAC (not database RLS)
- Protected routes via Kong API Gateway + middleware
- Multi-tenant isolation at namespace level

### 4. Cloud-Native Design

- Stateless services (state in PostgreSQL/Temporal/Delta Lake)
- Event-driven communication (Pulsar/Redis)
- Observable by default (OpenTelemetry, Prometheus, Grafana)
- Multi-zone HA in production (GKE)

---

## Tech Stack Constraints

### Required Technologies

**Backend Services**:
- **Go** (user-api, yaml-processor, catalog-stub) with Gin framework
- **Python** (agent-orchestrator, Temporal workflows) with LangGraph, FastAPI

**Frontend Applications**:
- **React** (console-ui, admin-ui) with TypeScript
- **TailwindCSS** for styling
- **shadcn/ui** for UI components (likely)

**Data Infrastructure**:
- **PostgreSQL** (Patroni HA) for metadata
- **Delta Lake** on MinIO (local) / GCS (production) for data lakehouse
- **Neo4j** for social graph analysis
- **Qdrant** for vector embeddings

**Orchestration**:
- **Temporal** for workflow orchestration (durable execution)
- **Dagster** for data pipeline orchestration

**Events**:
- **Redis** (local dev) for event bus
- **Apache Pulsar** (production) for event streaming

**ML Infrastructure**:
- **LangGraph** for agent workflows
- **BentoML** for model serving
- **MLflow** for experiment tracking

**Deployment**:
- **Docker Compose** for local development (3 profiles)
- **Kubernetes (GKE)** for production
- **Istio** for service mesh
- **Helm** for K8s package management

**Observability**:
- **Prometheus** for metrics
- **Grafana** for dashboards
- **Loki** for logs
- **OpenTelemetry** for distributed tracing

**Security**:
- **Keycloak** for OAuth/OIDC, RBAC
- **HashiCorp Vault** for secrets management (production)
- **Kong** for API gateway

### Forbidden Patterns

- No custom authentication implementation (use Keycloak)
- No synchronous cross-service calls (use events via Pulsar/Redis)
- No shared databases between services
- No client-side secrets or API keys
- No stateful services (use Temporal/PostgreSQL for state)
- No enterprise licenses (permissive licenses only)

---

## Architecture Guidelines

### Monorepo Structure

```
odp/
├── apps/                    # Frontend applications
│   ├── console-ui/         # User-facing investigation UI
│   └── admin-ui/           # Admin panel (workspace/user management)
│
├── services/                # Backend microservices
│   ├── user-api/           # Go - Manual pipeline processing API
│   ├── yaml-processor/     # Go - DSL → Temporal/Dagster workflows
│   ├── agent-orchestrator/ # Python + LangGraph - AI-driven pipelines
│   ├── catalog-stub/       # Go - Method Registry + Ontology (local dev)
│   ├── stubs/              # Python - Mock crawlers + ML models
│   └── execution/
│       ├── workflows/      # Temporal workflows (Python)
│       └── activities/     # Temporal activities (Python)
│
├── data/                    # Data orchestration
│   ├── dagster/            # Dagster assets (Bronze → Silver → Gold)
│   └── catalog-metadata/   # Local dev ontology (JSON)
│
├── ml/                      # ML infrastructure
│   └── tracking/           # MLflow client utilities
│
├── ops/                     # Operations
│   ├── local/              # Docker Compose (3 profiles)
│   └── scripts/            # Health checks, seed data, benchmarks
│
├── examples/                # Example pipelines
│   ├── pipelines/          # YAML pipeline examples
│   └── scenarios/          # Real-world investigation scenarios
│
├── schemas/                 # API and data schemas
│   ├── odp-yaml/           # JSON Schema for YAML DSL
│   ├── delta/              # Delta Lake table schemas
│   └── openapi/            # OpenAPI specifications
│
└── tests/                   # Integration and E2E tests
    ├── e2e/                # End-to-end tests
    └── integration/        # Multi-service integration tests
```

### Service Communication Patterns

**Synchronous** (REST/gRPC):
- User → API Gateway → user-api (YAML submission)
- user-api → catalog-stub (method validation)
- Any service → catalog-stub (method/ontology lookup)

**Asynchronous** (Events):
- Pipeline lifecycle events (submitted, started, completed, failed)
- Data transformation events (Bronze → Silver → Gold)
- ML model prediction events
- Workflow state changes

**Workflow Orchestration** (Temporal):
- Pipeline execution workflows (long-running, durable)
- Data processing workflows (retry, error handling)
- Multi-step investigation workflows

### Multi-Tenancy Pattern

**Hierarchy**: Workspace → Project → Pipeline

**Isolation**:
- **Namespace-level**: Separate Temporal namespaces per workspace
- **Data-level**: Delta Lake partitioned by workspace_id
- **RBAC**: Keycloak roles (workspace-admin, project-member, viewer)

**Resource Quotas**:
- Per-workspace rate limits (Kong + Redis)
- Per-workspace storage quotas (Delta Lake)
- Per-workspace concurrent workflow limits (Temporal)

---

## YAML DSL Specification

### Pipeline Format

```yaml
steps:
  - id: "collect_twitter"
    type: "crawler"
    method: "crawler_twitter_profile"
    inputs:
      username:
        from: "alice_crypto"
    outputs:
      profile: "twitter_data"

  - id: "analyze_sentiment"
    type: "ml_model"
    model: "sentiment_analysis_v1"
    inputs:
      texts:
        from: "{{collect_twitter.recent_posts[*].text}}"  # Template: extract text from posts
    outputs:
      sentiment_scores: "sentiment_results"
    depends_on: ["collect_twitter"]
```

**Template Resolution**: Use `{{step_id.field}}` syntax to reference previous step outputs. The `[*]` operator extracts fields from arrays. See [Template Resolution Guide](docs/guides/template-resolution.md) for complete syntax.

### Validation Rules

- All methods must exist in catalog-stub Method Registry
- All params must match ontology schema
- All inputs must reference existing step IDs (use `depends_on` for execution order)
- YAML must validate against JSON Schema (`schemas/odp-yaml/odp-pipeline-1.0.json`)
- Templates must reference completed steps

### Execution Flow

1. **user-api** receives YAML, validates against catalog-stub
2. **yaml-processor** converts YAML → Temporal workflow specification
3. **Temporal** executes workflow, resolving templates and calling activities
4. **Activities** invoke crawlers, ML models, data transforms
5. **Events** published to Pulsar/Redis (lifecycle updates)
6. **Dagster** processes data (Bronze → Silver → Gold)

---

## DO NOT

1. **DO NOT** implement custom auth - use Keycloak (production) or no auth (local dev)
2. **DO NOT** make synchronous cross-service calls - use events (Pulsar/Redis)
3. **DO NOT** share databases between services - each service owns its data
4. **DO NOT** bypass TypeScript/Go/Python type checking
5. **DO NOT** create admin panels beyond workspace/user management - out of scope
6. **DO NOT** implement team features beyond workspace hierarchy - out of scope
7. **DO NOT** add analytics beyond pipeline execution tracking - out of scope
8. **DO NOT** implement custom workflow engines - use Temporal
9. **DO NOT** implement custom data orchestration - use Dagster
10. **DO NOT** use enterprise licenses - permissive licenses only

---

## ACF Configuration

### Documentation Organization

**New Structure** (MUST see `docs/acf/organization.md` for full details):

```
docs/
├── agents/              # Agent manifests (START HERE)
├── product/             # Product vision and strategy
├── architecture/        # Technical design (C4, services, data)
├── operations/          # DevOps and infrastructure
├── development/         # Developer workflow
├── acf/                 # ACF process
├── research/            # Research findings
└── retrospectives/      # Sprint retrospectives
```

### File Organization

**Key Rules:**
- Docs in `docs/`, scripts in `ops/scripts/`, logs in `logs/`
- FORBIDDEN: `.git-evidence.txt`, docs in root (except README.md, CLAUDE.md)
- `.backlog/` for task files only

**Full specification**: `docs/acf/organization.md`

### Workflow Management

- **Tasks**: .backlog/ directory with structured workflow
- **Format**: category-XXX-description.md (e.g., feature-001-yaml-processor.md)
- **States**: draft → pending → in-progress → completed → in-review → [accepted|rejected]
- **Draft folder**: User-controlled, excluded from all automation
- **Details**: `docs/acf/backlog/workflow.md`

### Quality Gates

**See**: `docs/development/quality-gates.md` (single source of truth for all quality gate definitions)

**Summary**: Four+ mandatory checks before every commit:

**Go Services**:
```bash
golangci-lint run ./...    # Linting
go test ./...              # Tests
go build ./...             # Compilation
```

**Python Services**:
```bash
ruff check .               # Linting
mypy .                     # Type checking
pytest                     # Tests with coverage
```

**Docker Services**:
```bash
docker-compose -f ops/local/compose.yml config  # Validate compose file
docker-compose -f ops/local/compose.yml up -d   # Start services
ops/scripts/health_check.sh                     # Health checks pass
```

**Integration Tests**:
```bash
pytest tests/integration/  # Multi-service integration tests
```

### Communication Styles

Different contexts require different styles (see `docs/acf/style/README.md`):

- **General**: `docs/acf/style/general.md` - All agents, normal communication
- **Task Descriptions**: `docs/acf/style/task-descriptions.md` - task-engineer only, binary outcomes
- **Research Documents**: `docs/acf/style/research-documents.md` - Research documentation, sourced evidence

### Git Commit Conventions

**Key Rules:**
- FORBIDDEN: `git add .`, `git add -A`, `git commit -a` (bulk staging)
- REQUIRED: Stage files explicitly by full path
- FORMAT: Conventional Commits (feat/fix/docs/etc.)
- ATOMIC: Commit after each completed task

**Full specification**: `docs/acf/git/commit-conventions.md`

### Parallel Execution

- **MANDATORY**: All independent operations must run in parallel
- **Batch operations**: Use single message with multiple tool calls
- **See**: `docs/acf/parallel-execution.md`

---

## MCP Tool Optimization Guide

**Purpose**: Maximize efficiency by using the right tool for each task.

### context7 - Official Library Documentation (USE FIRST for APIs)

**When to use**:
- Need authoritative API documentation for Go, Python, React, Temporal, Dagster, LangGraph
- Looking for specific method signatures, parameters, return types
- Need official code examples from library maintainers

**Efficiency rule**: Start here for ANY library-specific question.

### perplexity - Research and Architectural Decisions

**When to use**:
- Researching best practices, patterns, and architectural approaches
- Comparing technologies or approaches
- Understanding technical tradeoffs
- Getting current information on evolving practices

**Efficiency rule**: Use for "how should I" and "what's the best way to" questions.

### shadcn - UI Component Discovery and Integration

**When to use**:
- Need pre-built React components (buttons, forms, dialogs, tables)
- Want to see component source code and implementation
- Looking for usage examples and demos

**Efficiency rule**: Check shadcn BEFORE building custom UI components.

### browsermcp - Live Debugging (NOT for testing)

**When to use**:
- Debugging runtime issues in the browser (console-ui, admin-ui)
- Inspecting console logs and errors
- Checking network requests and responses

**Efficiency rule**: Use for one-off debugging sessions.

### playwright - Automated E2E Testing (NOT for debugging)

**When to use**:
- Writing automated test flows for CI/CD
- Creating repeatable regression tests
- Testing multi-step user journeys automatically

**Efficiency rule**: Use for automation. If debugging, use browsermcp.

### Decision Tree for MCP Tools

```
Question about library API? → context7
Research/patterns/best practices? → perplexity
Need UI component? → shadcn
Debugging live issue? → browsermcp
Writing automated tests? → playwright
```

**Golden rule**: Use the most specific tool for the job. context7 > perplexity for APIs. browsermcp > playwright for debugging.

---

## Local Development Setup

### Quick Start

```bash
# Clone repository
cd social-links/odp/

# Start default profile (dev)
make start

# Check service health
make health

# Seed test data
make seed

# Stop services
make stop
```

### Three Profiles

**minimal** (workflows only, 30s startup, 1.5GB RAM):
```bash
EVENT_BUS=redis AUTH_MODE=none make start PROFILE=minimal
```

**dev** (DEFAULT, 60s startup, 3GB RAM):
```bash
make start  # or: make start PROFILE=dev
```

**full** (all services, 90s startup, 5GB RAM):
```bash
make start PROFILE=full
```

### Non-Standard Ports (15xxx-19xxx)

All local services use non-standard ports to avoid conflicts:

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 15432 | postgresql://localhost:15432 |
| Redis | 16379 | redis://localhost:16379 |
| Temporal UI | 18088 | http://localhost:18088 |
| user-api | 18080 | http://localhost:18080 |
| catalog-stub | 18090 | http://localhost:18090 |
| stubs (Python) | 18086 | http://localhost:18086 |
| yaml-processor | 18082 | http://localhost:18082 |
| agent-orchestrator | 18083 | http://localhost:18083 |
| dagster | 18084 | http://localhost:18084 |
| MinIO | 19000 | http://localhost:19000 |
| MinIO Console | 19001 | http://localhost:19001 |
| MLflow | 18087 | http://localhost:18087 |
| Qdrant | 16333 | http://localhost:16333 |
| Neo4j | 17474 | http://localhost:17474 |

---

## Remember

- This is a distributed system - optimize for service boundaries and event-driven design
- Use existing orchestration (Temporal, Dagster)
- Keep services stateless - state in PostgreSQL/Temporal/Delta Lake
- Security via Keycloak (production) or no auth (local dev)
- Type safety across all languages (Go, Python, TypeScript)
- Multi-tenant isolation at namespace level
- **START WITH YOUR AGENT MANIFEST** (`docs/agents/{your-name}.md`)
