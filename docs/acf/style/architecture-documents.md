# Architecture Documentation Style

## For: lean-architect when creating architecture documentation

## Core Principles

- **Focus**: Decisions, tradeoffs, constraints (not tutorials)
- **Medium**: Diagrams, tables, pattern references (not code)
- **Abstraction**: System-level (not implementation-level)
- **Lean**: Minimal viable documentation (not comprehensive)

## Banned Patterns

**NEVER include**:
- Function/method implementations
- Algorithm pseudocode or step-by-step procedures
- Configuration file contents (beyond data contract examples)
- Library-specific code (use pattern names instead)
- Tutorial-style "how to implement" sections

## Required Patterns

- **Decisions**: "Use Apache Pulsar for event bus (namespace isolation)" NOT "Here's how to implement Pulsar"
- **Tradeoffs**: Comparison tables showing options evaluated
- **Constraints**: "Response time < 200ms" NOT "Optimize the query by indexing..."
- **Patterns**: "Apply adapter pattern" NOT "Create interface EventBus with methods..."

## Abstraction Level Rules

**CRITICAL**: Architecture documents specify WHAT and WHY at system level, NEVER HOW at implementation level.

**lean-architect responsibilities**:
- WHAT system components exist (services, data stores, infrastructure)
- WHY design decisions were made (tradeoffs, constraints, alternatives considered)
- WHAT patterns apply (by name, with references to pattern catalogs)
- WHAT interfaces/contracts exist (signatures only, 2-3 lines max)

**Specialist engineer responsibilities** (NOT in architecture docs):
- HOW to implement patterns (code structure, libraries, algorithms)
- WHICH specific libraries/versions to use (unless architecturally mandated)
- HOW to configure services (implementation details)
- WHICH data structures to use internally

**Boundary test**: If you're writing code that could be copy-pasted into a file, STOP. You've crossed into implementation territory.

## Code Snippet Policy

**ABSOLUTE PROHIBITIONS**:
- Function/method bodies (even as examples)
- Algorithm implementations or pseudocode
- Complete configuration files (describe requirements instead)
- Multi-line code blocks showing "how it works"
- Library-specific implementation code

**ALLOWED** (sparingly, 2-3 lines max):
- API endpoint signatures: `POST /api/v1/pipelines → 201 {pipeline_id}`
- Data contract shapes: `{"event": "pipeline.submitted", "workspace_id": "uuid"}`
- Interface signatures: `interface EventBus { publish(topic, event); subscribe(topic, handler) }`
- Type definitions: `type Pipeline struct { ID uuid.UUID; Status string }`

**NEVER ALLOWED** (even short):
- Function bodies with logic: `func Process() { if x { ... } }`
- Configuration blocks: Full docker-compose.yml, Kubernetes manifests
- SQL queries or database schemas (use schema notation instead)
- Import statements and boilerplate

**When in doubt**: Describe the pattern in natural language, reference external resources.

## Architecture Document Types

### 1. Architecture Decision Records (ADRs)

**Purpose**: Document significant architectural decisions

**Required sections**:
- **Context**: Why decision needed (business/technical drivers)
- **Options Considered**: 2-4 alternatives evaluated
- **Decision**: What was chosen and why
- **Consequences**: Positive and negative impacts
- **Tradeoffs**: Comparison table of alternatives

**Banned sections**:
- "Implementation Guide"
- "Code Examples"
- "Step-by-Step Tutorial"

**Example structure**:
```markdown
## ADR-015: Event Bus Technology Selection

### Context
Multi-tenant SaaS requires namespace-level isolation for event streams.
Scale target: 1M msg/sec, 10k concurrent workflows.

### Options Considered

| Option | Namespace Isolation | Ops Overhead | Community | Decision |
|--------|-------------------|--------------|-----------|----------|
| **Apache Pulsar** | ✅ Native | High (3-node cluster) | Active | **SELECTED** |
| **Kafka** | ❌ Manual | High (ZooKeeper) | Mature | Rejected |
| **Redis Streams** | ❌ Manual | Low (single node) | Active | Rejected |

### Decision
Use Apache Pulsar for production event bus. Namespace-level isolation is
architectural requirement for multi-tenant SaaS.

### Consequences
**Positive**: Native multi-tenancy, independent storage/compute scaling
**Negative**: Operational overhead (1.8 FTE estimated)

### Migration
Local dev uses Redis (adapter pattern). Production deploys Pulsar cluster.
Interface abstraction enables zero-code-change migration.
```

**NOT THIS**:
```markdown
### Implementation

First, create the EventBus interface:

```go
type EventBus interface {
    Publish(topic string, event Event) error
    Subscribe(topic string, handler func(Event)) error
}

type RedisAdapter struct {
    client *redis.Client
}

func (r *RedisAdapter) Publish(topic string, event Event) error {
    data, _ := json.Marshal(event)
    return r.client.Publish(ctx, topic, data).Err()
}
...
```

Then implement the Pulsar adapter...
```

### 2. System Architecture (C4 Models)

**Purpose**: Describe system structure at multiple abstraction levels

**Required elements**:
- **C4 Level 1 (Context)**: System, actors, external systems (diagram)
- **C4 Level 2 (Containers)**: Services, data stores, message buses (diagram)
- **C4 Level 3 (Components)**: Internal service structure (diagram, selective)
- **C4 Level 4 (Code)**: NOT IN ARCHITECTURE DOCS (belongs in code)

**Diagrams over prose**:
- Use Mermaid for C4, sequence, component diagrams
- Tables for service responsibilities, technology choices
- Bullet lists for constraints, requirements

**NOT prose-heavy narratives**:
```markdown
❌ BAD:
The user API service receives requests from the API Gateway. It then
validates the YAML by unmarshaling it into a struct. After validation,
it publishes an event to the event bus. The YAML processor subscribes
to this event and processes it by converting it to a Temporal workflow...
[500 words of step-by-step narrative]
```

**INSTEAD**:
```markdown
✅ GOOD:
[Mermaid sequence diagram showing: User → API Gateway → User API → Event Bus → YAML Processor → Temporal]

**Flow**: YAML submission triggers async workflow creation via event bus.
```

### 3. API Contracts

**Purpose**: Define service interfaces and data contracts

**Required elements**:
- **Endpoints**: HTTP method, path, auth requirements
- **Request/Response**: Data shapes (JSON schema or examples)
- **Error Codes**: Status codes and error response format
- **Constraints**: Rate limits, payload size limits, timeouts

**Allowed examples** (2-3 lines):
```markdown
**Endpoint**: `POST /api/v1/pipelines`

**Request**:
```json
{
  "yaml_content": "pipeline:\n  name: investigation\n  ...",
  "execution_mode": "safe"
}
```

**Response** (201):
```json
{
  "pipeline_id": "uuid-v4",
  "status": "pending_approval",
  "estimated_cost": 25
}
```

**Errors**:
- `400`: Invalid YAML (returns validation errors)
- `403`: Insufficient permissions
- `413`: Payload exceeds 1MB limit
```

**NOT THIS** (implementation code):
```markdown
❌ TERRIBLE:
```go
func HandlePipelineSubmit(c *gin.Context) {
    var req PipelineRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    if len(req.YAMLContent) > 1048576 {
        c.JSON(413, gin.H{"error": "Payload too large"})
        return
    }

    pipeline := parsePipeline(req.YAMLContent)
    db.Create(&pipeline)
    c.JSON(201, gin.H{"pipeline_id": pipeline.ID})
}
```
```

### 4. Technology Evaluation

**Purpose**: Document technology selection rationale

**Required structure**:
- **Options Evaluated**: 2-4 alternatives (with versions)
- **Evaluation Criteria**: Technical (scale, features) + Operational (cost, complexity)
- **Comparison Table**: Side-by-side feature/tradeoff comparison
- **Recommendation**: What to use and why
- **Risks**: Known limitations or concerns

**Example**:
```markdown
## Data Catalog Technology Evaluation

### Options

| Criteria | OpenMetadata | Apache Atlas | DataHub | Decision |
|----------|-------------|--------------|---------|----------|
| **Multi-tenancy** | ✅ Workspaces | ❌ Single-tenant | ✅ Domains | OpenMetadata |
| **Lineage** | ✅ Visual | ✅ Text-based | ✅ Visual | Tie |
| **Ops Overhead** | Medium (ES+MySQL) | High (HBase+Solr) | High (Kafka+ES) | OpenMetadata |
| **License** | Apache 2.0 | Apache 2.0 | Apache 2.0 | All OK |
| **Community** | Active (2023+) | Dormant (2021) | Active (2020+) | OpenMetadata |

### Recommendation
**OpenMetadata** - Best fit for multi-tenant SaaS architecture.

### Risks
- Relatively new project (founded 2023)
- Requires Elasticsearch (operational overhead)

### Migration Path
Local dev uses JSON stub. Production deploys OpenMetadata in Sprint 3.
```

**NOT THIS** (implementation tutorial):
```markdown
❌ TERRIBLE:
### How to Integrate OpenMetadata

First, install the Python client:
```bash
pip install openmetadata-ingestion
```

Then create a connection:
```python
from metadata.ingestion.api.source import Source
from metadata.generated.schema.api.data.createDatabase import CreateDatabaseRequest

config = {
    "host": "localhost",
    "port": 8585,
    "api_version": "v1"
}

client = OpenMetadataAdapter(config)
...
[50 lines of integration code]
```
```

## Technical Specifications Boundaries

### ✅ CORRECT - Architecture Level

**Component responsibilities**:
- "User API validates YAML and publishes events to event bus"
- "YAML Processor converts ODP YAML to Temporal workflow specifications"
- "Temporal executes workflows with retry policies and step-level recovery"

**Pattern references**:
- "Event bus uses adapter pattern (see docs/development/patterns/adapter.md)"
- "Authentication follows middleware pattern (Kong → service validation)"
- "Data transformations follow medallion architecture (Bronze → Silver → Gold)"

**Interface contracts**:
- "YAML Processor accepts ODP YAML (string), returns WorkflowSpec or ValidationError"
- "Event bus publishes to topics with namespace isolation (workspace_id prefix)"
- "API Gateway enforces rate limits: 100 req/min per workspace, 10 req/sec burst"

**Technology constraints**:
- "Apache Pulsar for production (namespace isolation), Redis for local dev (simplicity)"
- "PostgreSQL for metadata (ACID guarantees), Delta Lake for analytics (schema evolution)"
- "Go for high-throughput services, Python for ML workflows"

### ❌ WRONG - Implementation Level

**Detailed algorithms**:
```markdown
❌ The YAML processor uses a two-pass algorithm. First pass: iterate through
sources array, for each source extract method name, call catalog-stub API
with GET /methods/{name}, parse response, validate params against JSON schema.
Second pass: build dependency graph using map[string][]string, run DFS to
detect cycles, if cycle found return error with cycle path...
```

**Library-specific code**:
```go
❌ TERRIBLE:
func ProcessYAML(data []byte) (*WorkflowSpec, error) {
    var pipeline Pipeline
    if err := yaml.Unmarshal(data, &pipeline); err != nil {
        return nil, fmt.Errorf("invalid YAML: %w", err)
    }

    spec := &WorkflowSpec{
        Name: pipeline.Name,
        Steps: make([]Step, 0, len(pipeline.Sources)),
    }

    for _, source := range pipeline.Sources {
        method, err := catalogStub.GetMethod(source.Method)
        if err != nil {
            return nil, fmt.Errorf("unknown method: %s", source.Method)
        }

        step := Step{
            Type: "crawler",
            Method: method.ID,
            Params: source.Params,
        }
        spec.Steps = append(spec.Steps, step)
    }

    return spec, nil
}
```

**Configuration tutorials**:
```yaml
❌ TERRIBLE:
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: odp
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: odp_metadata
    ports:
      - "15432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U odp"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "16379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

...
[200 lines of docker-compose configuration]
```

**Step-by-step procedures**:
```markdown
❌ TERRIBLE:
To implement the event bus adapter:

1. Create a new file `pkg/eventbus/adapter.go`
2. Define the EventBus interface with Publish and Subscribe methods
3. Create a RedisAdapter struct with a redis.Client field
4. Implement the Publish method:
   - Marshal the event to JSON
   - Call redis.Publish with topic and JSON data
   - Handle errors and return
5. Implement the Subscribe method:
   - Create a redis.PubSub subscription
   - Loop over incoming messages
   - Unmarshal JSON and call handler
...
```

## Lean Documentation Principles

### Minimize Narrative, Maximize Information Density

**Prefer**:
- Diagrams (C4, sequence, component, deployment)
- Tables (comparisons, tradeoffs, responsibilities)
- Bullet lists (constraints, requirements, risks)
- Pattern references (by name, with links)

**Avoid**:
- Prose-heavy narratives (unless explaining complex tradeoffs)
- Redundant sections (don't repeat what diagrams show)
- Tutorial-style "how to" content (belongs in development docs)
- Motivational language ("comprehensive", "robust", "elegant")

### Example: Local vs Production Substitutions

**✅ LEAN Approach**:
```markdown
## Event Bus: Redis → Apache Pulsar

**Why Redis for Local Dev:**

| Factor | Redis | Pulsar |
|--------|-------|--------|
| Startup | 2s | 60s (3-node cluster) |
| RAM | 100MB | 2GB (Broker+BookKeeper+ZooKeeper) |
| Multi-tenancy | Manual | Native namespaces |

**Why Pulsar for Production:**
- Namespace-level isolation (multi-tenant SaaS requirement)
- Independent storage/compute scaling
- Geo-replication for EU/US deployments

**Migration**: Adapter pattern enables zero-code-change swap.
```

**❌ BLOATED Approach**:
```markdown
❌ The event bus is a critical component of our architecture. In local
development, we have chosen to use Redis Streams because it provides a
lightweight, easy-to-set-up solution that allows developers to quickly
iterate on their code without the operational overhead of running a
full Apache Pulsar cluster. Redis Streams offers pub/sub functionality
that is sufficient for development purposes.

However, in production, we need more robust features. Apache Pulsar
provides namespace-level isolation, which is essential for our multi-tenant
SaaS architecture. Let me explain how Pulsar works...

[500 words of Pulsar tutorial]

To implement this, first create an EventBus interface...

[50 lines of code showing interface + Redis adapter + Pulsar adapter]
```

### Focus on Decisions, Not Descriptions

**Good ADR** (decision-focused):
```markdown
## ADR-023: PostgreSQL for Metadata, Not MySQL

**Context**: Metadata store needs ACID, JSONB queries, <10ms latency.

**Alternatives**: MySQL, PostgreSQL, MongoDB

**Decision**: PostgreSQL with Patroni HA.

**Why PostgreSQL:**
- JSONB native support (method params, pipeline configs)
- Excellent JSONB indexing (GIN indexes for queries)
- Patroni provides battle-tested HA (automatic failover)
- Community expertise (team has 8+ years PostgreSQL experience)

**Why NOT MySQL:**
- JSON support weaker (no GIN indexes, slower queries)
- HA solutions less mature (Group Replication more complex than Patroni)

**Why NOT MongoDB:**
- ACID guarantees weaker (no multi-document transactions in sharded clusters)
- Operational overhead higher (sharding, replica sets)
- Relational model fits metadata better (workspaces, projects, pipelines hierarchy)

**Tradeoff accepted**: PostgreSQL requires more RAM (vs MySQL). Acceptable for metadata scale.
```

**Bad ADR** (tutorial-focused):
```markdown
❌ TERRIBLE:
## PostgreSQL Implementation Guide

PostgreSQL is a powerful open-source relational database. Let me explain
how to set up PostgreSQL for our platform...

[200 lines explaining PostgreSQL features, installation steps, configuration
options, query optimization techniques, connection pooling setup, backup
strategies, monitoring configuration, etc.]
```

## Examples

### Example 1: Service Responsibilities

**✅ GOOD - Lean Table Format**:
```markdown
| Service | Technology | Responsibility | Scale Target |
|---------|-----------|----------------|--------------|
| User API | Go + Gin | Manual pipeline processing, business routing | 10k users |
| YAML Processor | Go | ODP YAML → Temporal/Dagster workflows | 10k pipelines/day |
| Agent Orchestrator | Python + LangGraph | AI-driven pipeline generation | 10k concurrent |
```

**❌ BAD - Prose Narrative**:
```markdown
The User API service is implemented in Go using the Gin framework. It is
responsible for handling manual pipeline processing requests from users.
The service provides business logic routing capabilities and can handle
up to 10,000 concurrent users. Let me explain how the User API works...

[300 words per service describing implementation details]
```

### Example 2: Technology Comparison

**✅ GOOD - Comparison Table + Decision**:
```markdown
## Workflow Engine: Temporal vs Airflow vs Prefect

| Criteria | Temporal | Airflow | Prefect |
|----------|----------|---------|---------|
| Durable execution | ✅ Native | ❌ Task-level | ✅ Via backend |
| Programming model | Code-first | DAG-first | Hybrid |
| Multi-language | ✅ Go/Python/TS | ❌ Python only | ❌ Python only |
| State recovery | ✅ Event sourcing | ❌ Manual | ✅ Database |
| Ops overhead | Medium | High | Medium |

**Decision**: Temporal (durable execution + multi-language support critical).
```

**❌ BAD - Code-Heavy Tutorial**:
```markdown
Let me show you how Temporal works compared to Airflow:

**Temporal Example**:
```python
@workflow.defn
class InvestigationWorkflow:
    @workflow.run
    async def run(self, pipeline: Pipeline) -> Result:
        results = []
        for source in pipeline.sources:
            result = await workflow.execute_activity(
                crawl_source,
                source,
                start_to_close_timeout=timedelta(minutes=10)
            )
            results.append(result)
        return aggregate_results(results)
```

**Airflow Example**:
```python
from airflow import DAG
from airflow.operators.python import PythonOperator

def crawl_twitter():
    # implementation
    pass

with DAG('investigation', schedule_interval=None) as dag:
    task1 = PythonOperator(task_id='crawl', python_callable=crawl_twitter)
    ...
```

[200 lines comparing code samples]
```

### Example 3: Migration Strategy

**✅ GOOD - High-Level Path + Adapter Pattern Reference**:
```markdown
## Migration: Local Dev → Production

**Event Bus** (1 week):
- Deploy Pulsar 3-node cluster
- Implement PulsarAdapter (EventBus interface)
- Update ENV: EVENT_BUS=pulsar
- Validate namespace isolation

**Auth** (2 weeks):
- Deploy Keycloak (realm, clients, roles)
- Implement OIDCMiddleware
- Update ENV: AUTH_MODE=keycloak
- Configure MFA, SSO

**Data Catalog** (1 week):
- Deploy OpenMetadata (ES + MySQL)
- Implement OpenMetadataAdapter
- Migrate JSON catalog data
- Update ENV: DATA_CATALOG=openmetadata

**Zero code changes** - All services use interface abstractions.
```

**❌ BAD - Step-by-Step Implementation Guide**:
```markdown
### How to Migrate Event Bus to Pulsar

Step 1: Create PulsarAdapter class

```python
from pulsar import Client, Producer, Consumer

class PulsarAdapter(EventBus):
    def __init__(self, url: str):
        self.client = Client(url)
        self.producers = {}

    def publish(self, topic: str, event: Event):
        if topic not in self.producers:
            self.producers[topic] = self.client.create_producer(topic)

        producer = self.producers[topic]
        producer.send(event.to_json().encode('utf-8'))

    def subscribe(self, topic: str, handler: Callable):
        consumer = self.client.subscribe(
            topic,
            subscription_name='odp-consumer'
        )

        while True:
            msg = consumer.receive()
            event = Event.from_json(msg.data().decode('utf-8'))
            handler(event)
            consumer.acknowledge(msg)
```

Step 2: Update service initialization...

[500 lines of implementation tutorial]
```

## Summary

**For lean-architect**: Your job is to document decisions and system structure, not implementation details.

**Golden Rule**: If a specialist engineer can read your architecture doc and say "I understand WHAT the system does and WHY design decisions were made", you've succeeded. If they say "This is just a copy-paste implementation tutorial", you've failed.

**Enforcement**: quality-reviewer MUST reject architecture documents with extensive code snippets or implementation tutorials. Rejected docs returned with comments citing this guide.

---

**Last Updated**: 2025-10-28
