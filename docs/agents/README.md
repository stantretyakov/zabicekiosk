# Agent Manifest System - zabicekiosk

## Overview

The Agent Manifest System provides specialized AI agents for zabicekiosk development. Each agent has curated documentation guides optimizing token usage and task quality.

---

## Available Agents

### Backend Engineering

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **typescript-engineer** | TypeScript + Fastify | Backend services (core-api, booking-api), REST APIs, Firestore integration, authentication, validation |

### Frontend Engineering

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **react-engineer** | React + TypeScript + Vite | Frontend applications (admin-portal, kiosk-pwa, parent-web), UI components, state management, form handling |

### Infrastructure & Operations

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **database-engineer** | Firestore + Firebase | Database schema design, Firestore collections, security rules, data modeling, query optimization |
| **devops** | Firebase + GCP + GitHub Actions | Deployment automation, CI/CD pipelines, Firebase hosting, Cloud Run deployment, environment configuration |
| **cicd-monitor** | Cloud Build + GitHub + Claude API | CI/CD monitoring, build failure detection, automatic task creation, AI-powered error analysis, agent routing |

### Quality & Process

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **test-engineer** | Jest + Testing Library + Playwright | Test strategy, unit tests, integration tests, E2E tests, test coverage management |
| **quality-reviewer** | Quality Assurance | Binary acceptance decisions (Accept/Reject only), task compliance validation, quality gate verification |
| **task-engineer** | Task Management | Creating task files in .backlog/pending/, writing binary acceptance criteria, dependency management (NEVER implements) |
| **retro** | Process Improvement | Retrospectives, root cause analysis, pattern recognition, process improvements, **EXCLUSIVE authority** to modify agent instructions |
| **precommit** | Quality Gates | Pre-commit hooks configuration (TypeScript, ESLint, Prettier), quality gate enforcement, hook optimization |

### Architecture

| Agent | Technology Focus | Responsibilities |
|-------|-----------------|------------------|
| **lean-architect** | System Architecture | System design, technical specifications, API contract design, technology stack decisions, security architecture |

---

## Agent Selection Matrix

| Work Type | Agent | Example |
|-----------|-------|---------|
| System design | lean-architect | "Design booking system architecture" |
| Fastify API | typescript-engineer | "Implement booking API endpoints" |
| React UI | react-engineer | "Build admin portal booking page" |
| Firestore schema | database-engineer | "Design client and pass collections" |
| Firebase deployment | devops | "Deploy services to Cloud Run" |
| Testing | test-engineer | "Write integration tests for booking flow" |
| Quality review | quality-reviewer | "Review completed booking feature" |
| Task creation | task-engineer | "Create task for session management" |
| Process improvement | retro | "Analyze why tasks keep failing review" |
| Quality gates | precommit | "Set up TypeScript pre-commit hooks" |
| Build monitoring | cicd-monitor | "Monitor builds and auto-create fix tasks" |

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

## Priority 2: SHOULD READ (Supporting Context)

Frequently referenced during implementation.

## Priority 3: REFERENCE (Lookup as Needed)

Situational documentation for specific scenarios.

## Quality Gates

Agent-specific quality requirements and commands.
```

---

## How to Use Manifests

### For Agents (Reading Manifests)

1. **Receive Task**: Read task file from `.backlog/pending/`
2. **Load Manifest**: Read your agent manifest (`docs/agents/{your-name}.md`)
3. **Load P1 Docs**: Read ALL Priority 1 documents immediately
4. **Reference P2 Docs**: Check Priority 2 docs during implementation
5. **Lookup P3 Docs**: Only when needed for specific scenarios
6. **Verify Quality Gates**: Check agent-specific quality requirements

### For task-engineer (Creating Tasks)

1. **Identify Agent**: Determine which agent will execute task
2. **Reference Manifest**: Check agent's scope and capabilities
3. **Use Agent Vocabulary**: Write task using agent's technology focus
4. **Align Criteria**: Ensure acceptance criteria match agent's quality gates

---

## Agent Manifest Index

| Agent | Manifest File | Technology Focus |
|-------|---------------|------------------|
| lean-architect | `lean-architect.md` | System architecture, technical specs |
| typescript-engineer | `typescript-engineer.md` | TypeScript backend, Fastify APIs |
| react-engineer | `react-engineer.md` | React frontends, UI components |
| database-engineer | `database-engineer.md` | Firestore, Firebase, data modeling |
| devops | `devops.md` | Firebase deployment, CI/CD, GCP |
| test-engineer | `test-engineer.md` | Testing strategy, Jest, Playwright |
| quality-reviewer | `quality-reviewer.md` | Quality assurance, acceptance testing |
| task-engineer | `task-engineer.md` | Task creation, backlog management |
| retro | `retro.md` | Process improvement, retrospectives |
| precommit | `precommit.md` | Pre-commit hooks, quality gates |
| cicd-monitor | `cicd-monitor.md` | Build monitoring, error analysis, task automation |

---

**Last Updated**: 2025-11-03
**Document Owner**: ACF Framework (retro agent maintains)
