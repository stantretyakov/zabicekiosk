# Agentic Continuous Flow (ACF)

**ACF is software development for a world where intelligence exists in silicon as well as carbon.** Humans shift from writing code to governing intelligent agent swarms. Knowledge (ontologies, policies, constraints) becomes the product; code is ephemeral output regenerated on demand. Work flows through multi-dimensional risk evaluation – low-risk tasks execute autonomously, high-risk tasks trigger human review. Systems emerge from agent interactions within knowledge boundaries rather than being engineered top-down. The fundamental inversion: humans govern, agents execute.

---

## ACF Operator Cheat Sheet

### Command Reference

#### `/task` - Scope Decomposition & Parallel Execution

**Purpose**: Decompose complex scope into atomic tasks, spawn parallel task-engineer agents.

```bash
/task implement YAML processor with Temporal workflow integration
/task build console-ui pipeline dashboard from figma.com/design/abc?node-id=123
/task setup Delta Lake Bronze→Silver→Gold transformations
```

**Protocol**:
1. Minimal research (understand WHAT, not HOW)
2. Decompose into feature-level tasks (NOT micro-tasks)
3. Create todos (single TodoWrite call)
4. Spawn task-engineer agents (single message, parallel)
5. Dependency verification (mandatory final step)
6. Exit immediately

**Critical**:
- NEVER implements code (pure orchestration)
- One logical feature = one task (not separate API/DB/test tasks)
- Mixed stack work = single task (Go + React = one task, task-engineer coordinates)
- Binary acceptance criteria required

**Anti-patterns**:
- ❌ Over-decomposition ("API endpoint" + "validation" + "tests" = 3 tasks)
- ✅ Right level ("User authentication feature" = 1 task, all layers)

#### `/go` - Process Backlog to Accepted

**Purpose**: Execute ENTIRE backlog through continuous iterations until ALL tasks reach terminal states (accepted/blocked).

```bash
/go                                    # Process all tasks
/go focus=testing priority=high       # Filter execution
claude --dangerously-skip-permissions "/go"  # Fire-and-forget mode
```

**Protocol**:
1. Pre-iteration quality gate auto-fixes (lint, typecheck, test, build)
2. Scan ALL workflow states (pending, blocked, rejected, completed, in-progress, in-review)
3. Build execution plan (respect dependencies, priorities)
4. Create todos (1:1 task mapping)
5. Launch agents in parallel (single message)
6. Check completion criteria
7. LOOP: Continue until ALL tasks terminal or backlog empty

**Continuous Loop**:
- MUST NOT STOP until 100% complete
- Auto-fix quality issues each iteration
- Retry rejected tasks (max 3 attempts)
- Track progress percentage
- Handle ALL transitions (not just pending→completed)

**Workflow Coverage** (MANDATORY):
```
pending → in-progress → completed → in-review → [accepted|rejected]
            ↓              ↓                          ↓
         blocked        blocked                  pending (retry < 5)
                                                      ↓
                                                  blocked (≥ 5 retries)
```

#### `/commit` - Git Commits with Standards

**Purpose**: Create commits following conventions.

```bash
/commit
```

**Inspects uncommitted changes, groups related changes, creates atomic conventional commits.**

**Protocol**:
1. Analyze changes (git status, git diff)
2. Stage files explicitly by path (NEVER `git add .` or `git add -A`)
3. Craft message (`<type>(<scope>): <subject>`)
4. Commit with message (NEVER `--no-verify`)
5. Verify conventions followed
6. Repeat until all changes committed

**See**: `docs/acf/git/commit-conventions.md`

#### `/research` - Context-Aware Research

**Purpose**: Deep research with parallel execution and synthesis into single document.

```bash
/research Temporal workflow patterns for OSINT pipelines at 300M req/month
/research LangGraph multi-agent orchestration for YAML DSL generation
/research Delta Lake optimization for time-series investigation data
```

**Protocol**:
1. Ultra-context analysis (README, CLAUDE.md, tech stack, domain)
2. Build ODP-specific research plan (YAML DSL, Temporal, Dagster, vector search)
3. Parallel research spawns (single message, multiple agents)
4. Synthesize into ONE document (evidence-based, sourced)
5. Save to `docs/research/YYYY-MM-DD-topic.md`
6. Extract actionable tasks for `.backlog/pending/`

**Research Style**: Follow `docs/acf/style/research-documents.md` (evidence-based, NO marketing fluff)

---

### Operator Workflow

#### 1. Architecture Changes

**Agent**: `lean-architect`

```bash
Task { subagent_type: "lean-architect", prompt: "Design pipeline execution architecture with YAML DSL → Temporal workflows" }
```

**Responsibilities**:
- System design (NO implementation code)
- Component boundaries (services, data flows)
- API contracts (OpenAPI specs)
- YAML DSL design (ontology, validation rules)
- README maintenance (<100 lines)

**Output**: Technical specifications (WHAT and WHY, not HOW)

**See**: `docs/agents/lean-architect.md`

#### 2. Backlog Creation

**Command**: `/task`

**Input Requirements**:
- Clear scope description
- Links to Figma/specs (if UI work)
- Architecture references (`docs/architecture/system-architecture.md`)
- Business requirements
- Tech stack constraints (Go, Python, LangGraph, Temporal, Dagster)

**Example**:
```bash
/task implement YAML processor service that validates pipelines against catalog-stub and generates Temporal workflow specs
```

**Creates**:
- Feature-level atomic tasks
- Binary acceptance criteria
- Task files in `.backlog/pending/`
- Dependency mappings

**See**: `.claude/commands/task.md`

#### 3. Task Review Standards

**Before Execution**:
- Verify dependencies are 'accepted' (not just 'completed')
- Check acceptance criteria clarity (binary pass/fail)
- Validate against design principles
- Ensure testability (quality gates defined)

**Status Flow**:
```
pending → in-progress → completed → in-review → [accepted|rejected]
                                                      ↓
                                                  pending (retry, max 3)
```

**See**: `docs/acf/backlog/workflow.md`

#### 4. Execute with `/go`

```bash
# Standard execution (continuous until complete)
/go

# Quick trigger (grab coffee mode - processes entire backlog)
claude --dangerously-skip-permissions "/go"
```

**Parallel Processing**:
- ALL independent tasks simultaneously
- Agent selection by metadata (go-engineer, python-ml-engineer, react-engineer, etc.)
- Automatic status updates
- Transition logging with timestamps

**Continuous Loop**: Keeps running until ALL tasks accepted or blocked (no manual stopping).

**See**: `.claude/commands/go.md`

#### 5. Quality Gates & Tuning

**Order of Defense**:

##### a. Pre-commit Agent

Maintains pre-commit hooks health and infrastructure.

**Location**: `.claude/agents/precommit.md`

**Tuning**: Keep execution <5 seconds.

##### b. Claude Default Settings

**Settings**: `.claude/settings.json`

```json
{
  "env": {
    "CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR": "true",
    "MAX_THINKING_TOKENS": "32000"
  },
  "includeCoAuthoredBy": false
}
```

##### c. Quality Gates (MANDATORY)

**See**: `docs/development/quality-gates.md` (SINGLE SOURCE OF TRUTH)

**Summary**:

**Go Services** (user-api, yaml-processor, catalog-stub):
```bash
golangci-lint run ./...
go test ./... -v -race -cover
go build ./...
go mod tidy && go mod verify
```

**Python Services** (agent-orchestrator, workflows, stubs):
```bash
ruff check .
mypy . --strict
pytest --cov --cov-fail-under=80
```

**Docker Services**:
```bash
docker-compose -f ops/local/compose.yml config
ops/scripts/health_check.sh
```

**Integration Tests**:
```bash
pytest tests/integration/
```

##### d. Quality Reviewer Instructions

**Agent**: `.claude/agents/quality-reviewer.md`

**Rejection Triggers**:
- ANY pre-commit failure
- Uncommitted changes
- Missing acceptance criteria evidence
- Failed quality gates
- Coverage <80%

#### 6. Instruction Management

**Rule**: Keep instruction files <500 lines.

**Key Files**:
- `.claude/agents/*.md` - Agent instructions (16 specialized agents)
- `.claude/commands/*.md` - Command definitions (/task, /go, /commit, /research)
- `.claude/output-styles/*.md` - Communication styles (challenger, arazor)

**When to Edit**:
- Performance bottlenecks (e.g., pre-commit >5s)
- Quality issues (repeated failures)
- Process improvements (from retrospectives)
- New patterns discovered (from research)

#### 7. Communication Styles

##### `challenger` - Design & Tuning

Use for:
- Architecture reviews (lean-architect outputs)
- Process optimization (workflow improvements)
- Quality standard setting (acceptance criteria tuning)
- Challenging assumptions (validating designs)

```bash
/output-style challenger
Review this YAML DSL design for pipeline execution...
```

##### `arazor` - Autonomous Execution

Use for:
- Task implementation (/go command)
- Bug fixes (reject→pending retries)
- Feature development (specialist agents)
- Binary outcomes (complete/failed)

```bash
/output-style arazor
Fix quality gate failures in user-api...
```

---

### Quick Reference

#### Agent Selection Matrix

| Work Type | Agent | Example |
|-----------|-------|---------|
| System design | lean-architect | "Design pipeline execution architecture" |
| Go services | go-engineer | "Implement user-api YAML endpoint" |
| Python ML/workflows | python-ml-engineer | "Create agent orchestrator with LangGraph" |
| React frontend | react-engineer | "Build console-ui investigation page" |
| Data pipelines | data-engineer | "Set up Dagster Bronze→Silver transform" |
| Schemas | database-engineer | "Add Delta Lake schema for pipelines" |
| Temporal workflows | temporal-engineer | "Design pipeline execution workflow" |
| Model serving | ml-ops-engineer | "Deploy BentoML face recognition service" |
| K8s deployment | k8s-engineer | "Configure GKE multi-zone setup" |
| Event bus | event-engineer | "Set up Pulsar schema for pipelines" |
| Docker/ops | devops | "Deploy to Docker Compose dev profile" |
| Testing | test-engineer | "Write integration tests for user-api" |
| Quality review | quality-reviewer | "Review completed pipeline feature" |
| Task creation | task-engineer | "Create task for YAML processor" |
| Process improvement | retro | "Analyze why tasks keep failing review" |
| Quality gates | precommit | "Set up Go linting pre-commit hooks" |

**Full manifest list**: `docs/agents/README.md`

#### Status Locations

```
.backlog/
├── draft/        # User-controlled (excluded from automation)
├── pending/      # Ready to start
├── in-progress/  # Active work
├── completed/    # Awaiting review
├── in-review/    # Under quality review
├── rejected/     # Needs fixes (max 3 retries)
├── blocked/      # Unresolvable or max retries exceeded
└── accepted/     # Done (SUCCESS)
```

**See**: `docs/acf/backlog/workflow.md`

#### Dependency Rules

- Dependencies MUST be 'accepted' (not 'completed')
- Task ID = filename without `.md` extension
- Format: `["feature-001-yaml-processor", "infra-002-temporal-setup"]`
- Circular dependencies = validation failure

#### Quality Standards

**See**: `docs/development/quality-gates.md` (SINGLE SOURCE OF TRUTH)

```bash
# Pre-commit (MANDATORY - all hooks MUST pass)
pre-commit run --all-files

# Go services
golangci-lint run ./... && go test ./... -v -race -cover && go build ./...

# Python services
ruff check . && mypy . --strict && pytest --cov --cov-fail-under=80

# Docker services
docker-compose -f ops/local/compose.yml config && ops/scripts/health_check.sh
```

**Zero bypass tolerance**: NEVER use `--no-verify`, `// nolint` without justification, `# type: ignore` without comment.

#### ODP-Specific Operations

##### YAML DSL Validation

```bash
# Validate pipeline YAML against schema
python -c "import jsonschema, yaml, json; ..." < examples/pipelines/investigation.yml

# Test YAML submission to user-api
curl -X POST http://localhost:18000/api/v1/pipelines \
  -H "Content-Type: application/yaml" \
  --data-binary @pipeline.yml

# Validate against catalog-stub method registry
curl http://localhost:18001/api/v1/methods/social.twitter.search
```

##### Local Environment Profiles

**Three profiles** (see `CLAUDE.md` for details):

```bash
# minimal (workflows only, 30s startup, 1.5GB RAM)
make start PROFILE=minimal

# dev (DEFAULT, 60s startup, 3GB RAM)
make start

# full (all services, 90s startup, 5GB RAM)
make start PROFILE=full

# Health checks
make health
make seed
ops/scripts/health_check.sh
```

**Non-standard ports** (15xxx-19xxx to avoid conflicts):

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 15432 | postgresql://localhost:15432 |
| Redis | 16379 | redis://localhost:16379 |
| Temporal UI | 18080 | http://localhost:18080 |
| user-api | 18000 | http://localhost:18000 |
| catalog-stub | 18001 | http://localhost:18001 |
| stubs (Python) | 18002 | http://localhost:18002 |
| Dagster | 13000 | http://localhost:13000 |
| MLflow | 15000 | http://localhost:15000 |
| Qdrant | 16333 | http://localhost:16333 |
| Neo4j | 17474 | http://localhost:17474 |
| MinIO | 19000 | http://localhost:19000 |

##### Temporal Workflows

```bash
# List workflows
temporal workflow list --namespace default

# Describe workflow execution
temporal workflow describe --workflow-id pipeline-001-investigation

# Execute workflow manually (testing)
temporal workflow start \
  --workflow-id test-pipeline-001 \
  --type PipelineExecutionWorkflow \
  --task-queue pipeline-execution \
  --input '{"pipeline_yaml": "..."}'

# Check workflow history
temporal workflow show --workflow-id pipeline-001-investigation
```

##### Data Pipeline Testing

```bash
# Dagster asset materialization
dagster asset materialize -m dagster.pipeline_data

# Delta Lake table inspection
python -c "from deltalake import DeltaTable; \
  dt = DeltaTable('data/bronze/pipelines'); \
  print(dt.to_pandas().head())"

# Check medallion architecture (Bronze → Silver → Gold)
ls -la data/bronze/pipelines/
ls -la data/silver/investigations/
ls -la data/gold/analytics/
```

##### Multi-Tenant Operations

**Workspace isolation**:
- **Temporal**: Separate namespace per workspace
- **Delta Lake**: Partition by `workspace_id`
- **Keycloak**: RBAC roles (workspace-admin, project-member, viewer)

```bash
# Create workspace namespace in Temporal
temporal operator namespace create workspace-social-links-001

# Verify partition isolation in Delta Lake
ls data/bronze/pipelines/workspace_id=social-links-001/

# Check Keycloak workspace roles
curl http://localhost:18080/auth/admin/realms/odp/users/{user-id}/role-mappings
```

---

### Performance Targets

- **Pre-commit hooks**: <5 seconds (tune if slower)
- **Task processing**: <4 hours per task (average)
- **Quality review**: <30 minutes per task
- **Full backlog cycle**: <24 hours (depends on size)
- **Local startup (dev profile)**: <60 seconds
- **Local startup (minimal)**: <30 seconds

---

### Key Principles

1. **Pure Delegation**: Main assistant NEVER implements, only orchestrates specialist agents
2. **Parallel Execution**: All independent operations run simultaneously (single message, multiple tool calls)
3. **Quality Gates**: Zero bypass tolerance (pre-commit hooks, linting, type checking, tests, build)
4. **Atomic Commits**: One task = one commit (explicit file staging, never bulk `git add .`)
5. **Evidence Required**: Quality gates + tests + commit SHA for every completed task
6. **Single Source of Truth**: Link to authoritative docs, never duplicate content
7. **Knowledge Primacy**: Ontology (YAML DSL) drives execution (Temporal workflows, Dagster pipelines)
8. **Multi-Tenant Isolation**: Namespace-level separation (Temporal, Delta Lake, Keycloak RBAC)
9. **Continuous Loop**: `/go` runs until ALL tasks reach terminal states (accepted/blocked)
10. **Transactional vs Timeless**: Temporal docs with timestamps, timeless specs updated in place

---

**Agent manifests**: `docs/agents/` (START HERE for specialized work)

**Full specifications**: See `CLAUDE.md` root and `docs/acf/` subdirectories

**ACF documentation structure**: `docs/acf/organization.md`

**Workflow details**: `docs/acf/backlog/workflow.md`

**Git conventions**: `docs/acf/git/commit-conventions.md`
