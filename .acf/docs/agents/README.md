# Agent Manifest System

## Overview

The Agent Manifest System solves the **context efficiency problem** for specialized AI agents working on ODP platform development. Each agent has a curated, priority-ordered documentation guide that optimizes token usage and task quality.

**Without manifests**: Agents scan all documentation, load irrelevant context, waste tokens, miss critical details.

**With manifests**: Agents read only their manifest, load targeted documentation in priority order, optimize efficiency, follow proven patterns.

---

## Manifest Purpose

### The Problem

ODP has extensive documentation across multiple domains:
- System architecture (distributed systems, microservices)
- Multiple tech stacks (Go, Python, React, Temporal, Dagster, K8s)
- Data infrastructure (Delta Lake, Neo4j, Qdrant)
- ML/AI platform (LangGraph, BentoML, MLflow)
- Event-driven architecture (Pulsar, Redis)
- Multi-service orchestration
- Security and multi-tenancy

**Loading everything wastes tokens and dilutes focus**.

### The Solution

Each specialized agent gets a **curated manifest** listing:
1. **Priority 1 docs** (MUST READ on task start) - Core domain knowledge
2. **Priority 2 docs** (SHOULD READ frequently) - Supporting context
3. **Priority 3 docs** (REFERENCE as needed) - Situational documentation

**Navigation guidance** provides task-specific reading paths (e.g., "For Temporal workflow implementation: read execution-platform.md → temporal patterns section → workflow retry policies").

---

## Available Agents

### Backend Engineering

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **go-engineer** | Go + Gin | Backend services (user-api, yaml-processor, catalog-stub), REST APIs, Redis integration, Temporal client, YAML processing |
| **python-ml-engineer** | Python + LangGraph + Temporal | Agent orchestrator (LangGraph workflows), Temporal Python workflows/activities, ML integration, async processing |

### Frontend Engineering

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **react-engineer** | React + TypeScript | Frontend applications (console-ui, admin-ui), UI components, state management, WebSocket integration, multi-tenant UI patterns |

### Data & Database

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **data-engineer** | Dagster + Delta Lake | Data orchestration (Dagster assets), medallion architecture (Bronze/Silver/Gold), data quality, Delta Lake schemas, data transformations |
| **database-engineer** | PostgreSQL + Delta Lake + Neo4j + Qdrant | Schema design, database migrations, query optimization, Delta Lake table design, Neo4j graph queries, Qdrant vector operations |

### Infrastructure & Operations

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **temporal-engineer** | Temporal.io | Workflow design (durable execution patterns), activity design, retry policies, saga patterns, workflow versioning, event sourcing |
| **ml-ops-engineer** | BentoML + MLflow + Qdrant | Model serving (BentoML), experiment tracking (MLflow), vector store (Qdrant), GPU infrastructure, model deployment, A/B testing |
| **k8s-engineer** | GKE + Istio + Helm | K8s deployment, Istio service mesh, Helm charts, multi-zone HA, resource management, pod autoscaling, observability stack |
| **event-engineer** | Apache Pulsar + Redis | Event bus architecture (Pulsar namespaces), event schema design (Avro), multi-consumer patterns, Redis pub/sub, event versioning |
| **devops** | Docker Compose + GKE | Local development (Docker Compose), production deployment (GKE), CI/CD, monitoring (Prometheus/Grafana), troubleshooting |

### Quality & Process

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **test-engineer** | pytest + Go testing + E2E | Test strategy, multi-service integration tests, unit tests, E2E tests, test coverage management, test framework configuration |
| **quality-reviewer** | Quality Assurance | Binary acceptance decisions (Accept/Reject only), task template compliance validation, quality gate evidence verification, architecture compliance checking, security validation |
| **task-engineer** | Task Management | Creating task files in .backlog/pending/, enforcing task template structure, writing binary testable acceptance criteria, task priority assignment, dependency management (NEVER implements tasks) |
| **retro** | Process Improvement | Weekly retrospectives, root cause analysis (Five Whys), pattern recognition across tasks, process improvement proposals, **EXCLUSIVE authority** to modify agent instructions |
| **precommit** | Quality Gates | Pre-commit framework configuration (Go, Python, Docker), quality gate enforcement via hooks, hook execution optimization, secret detection configuration |

### Architecture

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **lean-architect** | System Architecture | System architecture design, technical specifications, architectural decision records (ADRs), API contract design, technology stack decisions, security architecture patterns |

---

## Manifest Structure

Every agent manifest follows this structure:

```markdown
# {Agent Name} Documentation Manifest

## Agent Identity

**Role**: [Agent's primary responsibility]
**Technology Focus**: [Core technologies this agent works with]
**Scope**: [What this agent IS responsible for]
**Out of Scope**: [What this agent is NOT responsible for]

## Priority 1: MUST READ (Core Domain)

Essential documentation loaded at task start.

**Load these docs immediately when receiving a task**:
- `docs/path/to/core-doc.md` - Brief description (what to focus on)
- `docs/path/to/another-doc.md` → Section X.Y - Specific section to read

## Priority 2: SHOULD READ (Supporting Context)

Frequently referenced during implementation.

**Reference these docs regularly during development**:
- `docs/path/to/supporting-doc.md` - When to reference this
- `docs/path/to/pattern-doc.md` → Pattern Examples - Specific use case

## Priority 3: REFERENCE (Lookup as Needed)

Situational documentation for specific scenarios.

**Lookup only when needed**:
- `docs/path/to/advanced-doc.md` - For advanced scenarios (specify when)
- `docs/path/to/troubleshooting-doc.md` - For debugging specific issues

## Navigation Guidance

Task-specific reading paths and sequences.

### For [Common Task Type 1]
1. Read P1 docs (start with system architecture)
2. Check `specific-doc.md` → Section on [topic]
3. Review `another-doc.md` for [pattern examples]
4. Implement following patterns in P2 docs
5. Verify against quality gates in P3 docs

### For [Common Task Type 2]
[Similar guidance for different task types]

## Scope Boundaries

**This agent IS responsible for**:
- [Responsibility 1]
- [Responsibility 2]

**This agent is NOT responsible for**:
- [Out of scope 1] - Delegate to [other-agent]
- [Out of scope 2] - Delegate to [other-agent]

## Common Workflows

Standard task patterns with doc references.

### Workflow 1: [Task Name]
1. **Read**: P1 docs + `specific-doc.md` → Section X
2. **Implement**: [Brief implementation guide]
3. **Test**: [Testing requirements]
4. **Verify**: Quality gates (see `quality-gates.md`)

### Workflow 2: [Another Task]
[Similar pattern for different workflows]

## Integration Points

Handoffs to/from other agents.

**Receives work from**:
- `other-agent` - [What kind of work, what's expected]

**Hands off work to**:
- `another-agent` - [What work is handed off, when]

**Collaborates with**:
- `collaborator-agent` - [How they work together]

## Quality Gates

Agent-specific quality requirements.

**Before marking task complete**:
- [ ] All acceptance criteria met with evidence
- [ ] Quality gates passed (list specific commands)
- [ ] Tests written and passing (coverage requirements)
- [ ] Documentation updated
- [ ] Committed with conventional commit message

**Technology-Specific Gates**:
- [Language/framework specific quality commands]

## Quick Reference

Commonly needed commands, patterns, or code snippets.

**Common Commands**:
```bash
# Example command 1
command-here

# Example command 2
another-command
```

**Code Patterns**:
```language
// Common pattern for this agent's work
code-example
```

## Anti-Patterns

Common mistakes this agent should avoid.

**DON'T**:
- ❌ [Anti-pattern 1] - [Why it's wrong, what to do instead]
- ❌ [Anti-pattern 2] - [Why it's wrong, what to do instead]

**DO**:
- ✅ [Best practice 1] - [Why it's correct]
- ✅ [Best practice 2] - [Why it's correct]
```

---

## How to Use Manifests

### For Agents (Reading Manifests)

1. **Receive Task**: Read task file from `.backlog/pending/`
2. **Load Manifest**: Read your agent manifest (`docs/agents/{your-name}.md`)
3. **Load P1 Docs**: Read ALL Priority 1 documents immediately
4. **Check Navigation**: Find relevant navigation guidance for task type
5. **Reference P2 Docs**: Check Priority 2 docs during implementation
6. **Lookup P3 Docs**: Only when needed for specific scenarios
7. **Follow Workflows**: Use common workflow patterns from manifest
8. **Verify Quality Gates**: Check agent-specific quality requirements
9. **Avoid Anti-Patterns**: Review anti-patterns before starting

### For task-engineer (Creating Tasks)

1. **Identify Agent**: Determine which agent will execute task
2. **Reference Manifest**: Check agent's scope and common workflows
3. **Use Agent Vocabulary**: Write task using agent's technology focus
4. **Provide P1 Refs**: List Priority 1 docs in task metadata
5. **Align Criteria**: Ensure acceptance criteria match agent's quality gates

### For lean-architect (Designing Systems)

1. **Consider Agent Boundaries**: Design respecting agent scopes
2. **Document for Agents**: Write specs that align with agent P1 docs
3. **Update Manifests**: When architecture changes, update agent manifests
4. **Propagate Patterns**: Ensure new patterns appear in agent navigation guidance

### For retro (Improving Process)

1. **Analyze Patterns**: Identify recurring agent mistakes from rejected tasks
2. **Update Manifests**: Add anti-patterns, improve navigation guidance
3. **Refine Priorities**: Move frequently-needed P3 docs to P2, or P2 to P1
4. **Add Workflows**: Document new common task patterns

---

## Manifest Maintenance

### When to Update Manifests

**Immediate Updates Required**:
- New documentation added (add to appropriate priority level)
- Documentation moved or renamed (update all references)
- New common workflow identified (add to workflows section)
- Recurring mistake pattern (add to anti-patterns)
- Agent scope changes (update scope boundaries)

**Weekly Audit** (during retrospective):
- Review rejected tasks for agent-specific issues
- Check if P3 docs are referenced frequently (promote to P2)
- Verify all P1 references are still essential
- Update navigation guidance based on actual task patterns

**Monthly Deep Review**:
- Validate all documentation references still exist
- Reorganize priorities based on usage frequency
- Add new integration points discovered
- Update quality gates if quality standards changed

### Manifest Quality Standards

**Every manifest MUST have**:
- Clear agent identity (role, technology focus, scope)
- At least 3 Priority 1 documents
- Navigation guidance for top 3 common task types
- Explicit scope boundaries (IS and is NOT responsible for)
- Agent-specific quality gates
- At least 5 anti-patterns

**Manifests SHOULD have**:
- Priority 2 docs (5-10 documents)
- Priority 3 docs (selective, as-needed references)
- Common workflows (3-5 standard patterns)
- Integration points (handoffs to/from other agents)
- Quick reference (commands, code patterns)

---

## Priority Level Guidelines

### Priority 1: MUST READ

**Criteria for P1**:
- Essential for **every** task this agent does
- Foundational knowledge (system architecture, core patterns)
- Used in 80%+ of tasks
- Small set (3-8 documents) to avoid overload

**Examples**:
- go-engineer P1: `architecture/execution-platform.md` (YAML processing)
- data-engineer P1: `architecture/system-architecture.md` → Data layer
- k8s-engineer P1: `architecture/infrastructure.md` (K8s setup)

### Priority 2: SHOULD READ

**Criteria for P2**:
- Frequently needed (40-80% of tasks)
- Supporting context (not foundational, but important)
- Referenced during implementation
- Medium set (5-15 documents)

**Examples**:
- go-engineer P2: `development/quality-gates.md` (Go-specific gates)
- python-ml-engineer P2: `architecture/ml-platform.md` → LangGraph patterns
- react-engineer P2: `architecture/identity-and-api.md` → Multi-tenant UI

### Priority 3: REFERENCE

**Criteria for P3**:
- Situational (<40% of tasks)
- Advanced scenarios or edge cases
- Lookup as needed, not proactively loaded
- Larger set (open-ended, situational)

**Examples**:
- temporal-engineer P3: `operations/troubleshooting.md` → Temporal issues
- k8s-engineer P3: `architecture/infrastructure.md` → Disaster recovery
- data-engineer P3: `architecture/system-architecture.md` → Data retention policies

---

## Success Metrics

**Manifest Effectiveness**:
- **Agent task success rate**: >85% first-pass acceptance (manifests guide correctly)
- **Documentation reference accuracy**: <5% broken references in manifests
- **Priority alignment**: P1 docs referenced in >80% of tasks
- **Navigation guidance usage**: Agents follow navigation guidance in >70% of tasks

**Manifest Maintenance**:
- **Update lag**: <7 days from doc change to manifest update
- **Audit compliance**: Weekly retrospective includes manifest review
- **Quality standards**: 100% manifests meet quality standards

---

## Agent Manifest Index

| Agent | Manifest File | Technology Focus |
|-------|---------------|------------------|
| lean-architect | `lean-architect.md` | System architecture, technical specs |
| go-engineer | `go-engineer.md` | Go backend services, REST APIs |
| python-ml-engineer | `python-ml-engineer.md` | Python ML services, Temporal, LangGraph |
| react-engineer | `react-engineer.md` | React frontends, TypeScript, UI components |
| data-engineer | `data-engineer.md` | Dagster, Delta Lake, data pipelines |
| database-engineer | `database-engineer.md` | PostgreSQL, Delta Lake, Neo4j, Qdrant |
| temporal-engineer | `temporal-engineer.md` | Temporal workflows, durable execution |
| ml-ops-engineer | `ml-ops-engineer.md` | BentoML, MLflow, Qdrant, model serving |
| k8s-engineer | `k8s-engineer.md` | Kubernetes, GKE, Istio, Helm |
| event-engineer | `event-engineer.md` | Apache Pulsar, Redis, event schemas |
| devops | `devops.md` | Docker Compose, deployment, monitoring |
| test-engineer | `test-engineer.md` | Testing strategy, integration tests |
| quality-reviewer | `quality-reviewer.md` | Quality assurance, acceptance testing |
| task-engineer | `task-engineer.md` | Task creation, backlog management |
| retro | `retro.md` | Process improvement, retrospectives |
| precommit | `precommit.md` | Pre-commit hooks, quality gates |

---

## References

- **ACF Organization**: `docs/acf/organization.md` - Overall documentation structure
- **Task Workflow**: `docs/acf/backlog/workflow.md` - How agents receive and complete tasks
- **Quality Gates**: `docs/development/quality-gates.md` - Quality standards all agents must meet
- **Communication Styles**: `docs/acf/style/README.md` - How agents should communicate

---

**Last Updated**: 2025-10-27
**Document Owner**: ACF Framework (retro agent maintains)
