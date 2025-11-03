# Task Backlog System

## Overview

The `.backlog/` directory contains all task specifications for the ODP platform. Tasks flow through a state machine from creation to acceptance, with mandatory quality gates and evidence requirements at each stage.

**Core Principle**: Binary outcomes only. Tasks either meet ALL acceptance criteria with verifiable evidence, or they don't. No partial credit.

---

## Directory Structure

```
.backlog/
├── draft/          # User-controlled drafts (excluded from automation)
├── pending/        # Tasks ready to start
├── in-progress/    # Currently being worked on
├── completed/      # Finished, awaiting quality review
├── in-review/      # Under quality-reviewer assessment
├── blocked/        # Blocked by dependencies or issues
├── rejected/       # Failed quality review (move back to pending)
├── accepted/       # Passed quality review (done)
└── archive/        # Historical tasks for reference
```

**CRITICAL**: Only these directories are allowed. Creating custom directories is a CRITICAL VIOLATION (no automated enforcement - quality-reviewer validates during review).

---

## Task State Machine

### State Transitions

```
pending → in-progress → completed → in-review → [accepted | rejected]
            ↓                                          ↓
         blocked                                    pending (retry)
```

### State Definitions

| State | Meaning | Who Sets | Next State |
|-------|---------|----------|------------|
| **draft** | User brainstorming, excluded from automation | User only | pending (manual move) |
| **pending** | Task specification complete, ready to start | task-engineer | in-progress |
| **in-progress** | Actively being worked on by implementer | Implementer agent | completed, blocked |
| **completed** | Implementation done, evidence provided | Implementer agent | in-review |
| **in-review** | Under quality review | quality-reviewer | accepted, rejected |
| **blocked** | Cannot proceed due to dependency/issue | Implementer agent | in-progress (when unblocked) |
| **rejected** | Failed quality review | quality-reviewer | in-progress (retry, max 5) |
| **accepted** | Passed quality review, done | quality-reviewer | archive (periodically) |

### State Rules

1. **draft/** is user-controlled, EXCLUDED from automation; users CANNOT create tasks in pending/ (task-engineer only)
2. Only ONE task in-progress per agent INSTANCE (parallel instances allowed)
3. Tasks move to completed ONLY when ALL acceptance criteria met
4. quality-reviewer makes BINARY decision: accepted or rejected (no partial)
5. Rejected tasks: implementer retries (max 5); after 5th rejection, task-engineer redesigns or archives (see docs/acf/backlog/workflow.md)
6. Accepted tasks are authoritative evidence of completion

---

## Task File Naming Convention

**Format**: `[category]-[XXX]-[descriptive-name].md`

### Categories

- **feature**: New functionality (pipelines, APIs, UI features)
- **bug**: Bug fixes (production issues, regressions)
- **infra**: Infrastructure/DevOps (K8s, Docker, monitoring)
- **test**: Testing tasks (test coverage, integration tests)
- **docs**: Documentation (architecture docs, guides, READMEs)
- **refactor**: Code refactoring (improving existing code)
- **data**: Data engineering (Dagster assets, Delta Lake schemas)
- **ml**: Machine learning (model training, BentoML deployment)

### Numbering

- **XXX**: Zero-padded 3-digit number (001, 002, 003, ...)
- Numbers are unique per category
- Numbers increment monotonically (never reuse)

### Examples

```
feature-001-yaml-processor-implementation.md
feature-002-temporal-pipeline-workflows.md
bug-001-catalog-stub-nil-pointer.md
infra-001-gke-multi-zone-deployment.md
test-001-user-api-integration-tests.md
docs-001-temporal-workflow-patterns.md
refactor-001-user-api-error-handling.md
data-001-dagster-bronze-silver-transform.md
ml-001-bentoml-face-recognition-deployment.md
```

---

## Task Template

All tasks MUST follow this mandatory template (see `docs/acf/backlog/task-template.md` for full details):

```markdown
# Task: [Clear Task Title]

## Metadata
- **ID**: [category-XXX-descriptive-name]
- **Status**: pending
- **Priority**: [blocker|critical|high|medium|low]
- **Estimated Hours**: [realistic estimate]
- **Assigned Agent**: [agent-name]
- **Dependencies**: [task-ids] or "none"
- **Created By**: task-engineer
- **Created At**: $(date +"%Y-%m-%d %H:%M:%S") UTC
- **Documentation**: [existing docs to read] or "none"

## Description
[Binary outcome: works or doesn't, no vague language]

## Acceptance Criteria
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] All tests pass (with evidence)
- [ ] Quality gates pass (with evidence)
- [ ] Documentation updated (with evidence)
- [ ] Changes committed (with commit SHA)

## Technical Requirements
### Implementation Details
### Testing Requirements
### Performance Requirements

## Edge Cases to Handle
- [Edge case 1]: [How to handle]

## Out of Scope
- [Explicitly what NOT to do]

## Quality Review Checklist
### For Implementer (Before Marking Complete)
- [ ] All acceptance criteria met with evidence
- [ ] Quality gates pass (outputs captured)
- [ ] Tests written and passing (coverage shown)
- [ ] Documentation updated (files listed)
- [ ] Committed with conventional commit message

### For Quality Reviewer (quality-reviewer agent)
- [ ] Task template structure followed
- [ ] All acceptance criteria verified
- [ ] Evidence complete and authentic
- [ ] Quality gates passed (verified)
- [ ] Tests adequate (coverage checked)
- [ ] Documentation accurate
- [ ] Commit follows conventions

## Transition Log
| Date Time | From | To | Agent | Reason/Comment |
| $(date +"%Y-%m-%d %H:%M:%S") | draft | pending | task-engineer | Initial task creation |

## Implementation Notes
[Implementer adds notes during development]

## Quality Review Comments
### Review Round 1
- **Date**: [Date]
- **Reviewer**: quality-reviewer
- **Decision**: [accepted|rejected]
- **Comments**: [Specific feedback]

## Version Control Log
| Date Time | Git Action | Agent | Commit Hash | Message |

## Evidence of Completion
```bash
# Quality gates (Go)
$ golangci-lint run ./...
✓ No errors

$ go test ./...
✓ All tests pass (X tests)

$ go build ./...
✓ Build successful

# Quality gates (Python)
$ ruff check .
✓ No errors

$ mypy .
✓ No type errors

$ pytest --cov
✓ All tests pass (X tests, Y% coverage)

# Docker health checks
$ make health
✓ All services healthy
```

## References
- [Links to related docs, PRs, discussions]
```

---

## Priority Levels

### Priority Definitions

| Priority | SLA | Execution Rule | Description |
|----------|-----|----------------|-------------|
| **blocker** | 1 hour | SEQUENTIAL within chain, parallel across chains | Blocks all other work (production down, critical bug) |
| **critical** | 4 hours | EXCLUSIVE priority level | Critical functionality (broken pipeline execution) |
| **high** | 24 hours | After blocker/critical | Important features (new API endpoints) |
| **medium** | 1 week | After high | Standard work (UI improvements, refactors) |
| **low** | none | After all others | Nice-to-haves (documentation updates) |

### Execution Rules

**Blocker**:
- Drop all other work immediately
- Can run multiple independent blocker chains in parallel
- Each chain executes sequentially internally
- Post-mortem required after resolution

**Critical**:
- Start after all blockers resolved
- Multiple critical tasks can run in parallel
- Review in next retrospective

**High/Medium/Low**:
- Process in priority order
- Can parallelize independent tasks at same priority
- Batch similar tasks for efficiency

---

## Evidence Requirements

### Mandatory Evidence

Every completed task MUST provide:

1. **Quality Gate Outputs** (all commands, complete output)
   - Go: `golangci-lint`, `go test`, `go build`
   - Python: `ruff`, `mypy`, `pytest --cov`
   - Docker: `docker-compose config`, `make health`
   - Integration: Multi-service test results

2. **Test Results** (with coverage)
   - Unit test output (all tests pass)
   - Integration test output (if applicable)
   - Coverage report (≥80% overall, 100% critical paths)

3. **Implementation Commit**
   - Commit SHA (full hash)
   - Files changed count
   - Commit message (conventional commits format)

4. **Transition Log**
   - Timestamps for state changes
   - Agent responsible for each transition
   - Reason/comment for each transition

5. **Task-Specific Verification**
   - Screenshots (for UI features)
   - API response samples (for endpoints)
   - Workflow execution logs (for Temporal workflows)
   - Data pipeline outputs (for Dagster assets)

### Evidence Authenticity Checks

quality-reviewer validates:
- Command outputs are complete (not truncated)
- Timestamps are present
- Exit codes are shown
- No placeholders or "..." omissions
- Raw output format (not edited or prettified)

---

## Workflow Guidelines

### For task-engineer (Creating Tasks)

1. **Analyze Request**: Understand user's complete requirements
2. **Decompose**: Break into single-agent tasks (4-8 hours each, split if >8)
3. **Write Specification**: Follow task template exactly
4. **Define Criteria**: Binary, testable acceptance criteria only
5. **Set Priority**: blocker/critical/high/medium/low
6. **Identify Dependencies**: List dependent task IDs
7. **Validate**: Documentation refs exist, agent valid, size ≤8h, priority enum correct
8. **Place in pending/**: Task ready to start

### For Implementer Agents (Executing Tasks)

**Note**: One task in-progress per agent instance; parallel instances allowed for independent tasks.

1. **Read Task**: Load from pending/, understand all criteria
2. **Move to in-progress/**: Get timestamp (`date +"%Y-%m-%d %H:%M:%S"`), update transition log, move file (see docs/acf/backlog/workflow.md)
3. **Read Documentation**: Load Priority 1 docs from agent manifest
4. **Implement**: Write code, tests, documentation
5. **Verify Criteria**: Check ALL acceptance criteria met
6. **Collect Evidence**: Run quality gates (docs/development/quality-gates.md), capture outputs
7. **Commit Changes**: Explicit file staging, conventional commit (docs/acf/git/commit-conventions.md)
8. **Update Task**: Add evidence, implementation notes, transition log with timestamp
9. **Move to completed/**: Atomic commit of task file + implementation files

### For quality-reviewer (Reviewing Tasks)

1. **Read Task**: Load from completed/, review all sections
2. **Move to in-review/**: Signal review started
3. **Verify Template**: Task structure follows template
4. **Check Criteria**: ALL acceptance criteria met with evidence
5. **Validate Evidence**: Outputs complete, authentic, not fabricated
6. **Test Verification**: Quality gates passed, coverage adequate
7. **Architecture Compliance**: Follows system design patterns
8. **Binary Decision**: Accept OR reject (no partial credit)
9. **Document Decision**: Add review comments with specifics
10. **Move to accepted/ or rejected/**: Signal outcome

### For Users (Managing draft/)

- draft/ is YOUR space (excluded from automation)
- Create notes, sketches, brainstorms
- Move to pending/ when ready (manual action)
- Agents NEVER read from or write to draft/

---

## Parallel Execution

### Batching Rules (MANDATORY)

**NEVER** move tasks sequentially. **ALWAYS** batch parallel operations.

```bash
# ✅ CORRECT - Batch parallel task starts
git add .backlog/in-progress/feature-001-yaml.md \
        .backlog/in-progress/feature-002-temporal.md \
        .backlog/in-progress/feature-003-ui.md
git commit -m "task: start 3 parallel features"

# ❌ WRONG - Sequential task starts
git add .backlog/in-progress/feature-001-yaml.md
git commit -m "task: start feature-001"
git add .backlog/in-progress/feature-002-temporal.md
git commit -m "task: start feature-002"
```

### Dependency Chains

Visualize dependencies before execution:

```
        ┌─────────────┐
        │  blocker-1  │ (Must complete first)
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │  critical-1 │ (Then critical tasks)
        └──────┬──────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│ high-1│ │ high-2│ │ high-3│ (Parallel execution)
└───────┘ └───────┘ └───────┘
```

Execute independent tasks in parallel, dependent tasks sequentially.

---

## Common Workflows

### New Feature Development

1. **task-engineer** creates task in `pending/feature-XXX.md`
2. **Implementer** (go-engineer, python-ml-engineer, etc.) moves to `in-progress/`
3. **Implementer** completes work, moves to `completed/`
4. **quality-reviewer** reviews, moves to `in-review/`
5. **quality-reviewer** accepts → `accepted/` OR rejects → `pending/`
6. **If rejected**: Implementer fixes issues, repeats cycle

### Bug Fix

1. **task-engineer** creates urgent task in `pending/bug-XXX.md` (priority: blocker or critical)
2. **Implementer** prioritizes above all other work
3. **Implementer** fixes with root cause analysis in task
4. **quality-reviewer** expedited review
5. **retro** analyzes bug in next retrospective (prevent recurrence)

### Infrastructure Update

1. **task-engineer** creates task in `pending/infra-XXX.md`
2. **devops** or **k8s-engineer** implements
3. **test-engineer** validates deployment in staging
4. **quality-reviewer** verifies production-readiness
5. **devops** deploys to production

### Data Pipeline

1. **task-engineer** creates task in `pending/data-XXX.md`
2. **data-engineer** implements Dagster assets
3. **data-engineer** validates Bronze → Silver → Gold transformations
4. **test-engineer** adds integration tests
5. **quality-reviewer** verifies data quality

---

## Quality Gates Integration

All tasks MUST pass quality gates before marking completed. See `docs/development/quality-gates.md` for details.

**Go Services**:
```bash
golangci-lint run ./...  # Linting
go test ./...            # Tests
go build ./...           # Compilation
```

**Python Services**:
```bash
ruff check .             # Linting
mypy .                   # Type checking
pytest --cov             # Tests with coverage (≥80%)
```

**Docker Services**:
```bash
docker-compose -f ops/local/compose.yml config  # Validate
ops/scripts/health_check.sh                     # Health checks
```

**Integration**:
```bash
pytest tests/integration/  # Multi-service tests
```

**Zero Bypass Tolerance**: No `--no-verify`, no `# noqa`, no `# type: ignore` without justification.

---

## Archive Policy

**Monthly Archiving** (first Monday of month):
- Move `accepted/` tasks older than 30 days to `archive/YYYY-MM/`
- Keep `rejected/` tasks for analysis (never archive)
- Generate monthly metrics report

**Archive Structure**:
```
archive/
├── 2025-01/
├── 2025-02/
└── 2025-03/
```

---

## Metrics Tracked

### Workflow Metrics
- **Cycle Time**: pending → accepted (target: <6 hours for high priority)
- **Rejection Rate**: rejected / (accepted + rejected) (target: <15%)
- **SLA Compliance**: % tasks completed within SLA (target: >95%)
- **Blocked Rate**: % tasks blocked (target: <5%)

### Quality Metrics
- **First-Pass Acceptance**: accepted on first review (target: >85%)
- **Quality Gate Compliance**: % tasks with all gates passing (target: 100%)
- **Template Compliance**: % tasks following template (target: 100%)
- **Evidence Completeness**: % tasks with complete evidence (target: 100%)

**Review in retrospectives**: Weekly for trends, monthly for improvement actions.

---

## Common Issues

### Task Stuck in in-progress

**Symptoms**: Task not moving to completed for >2 SLA periods

**Causes**:
- Scope too large (decompose into smaller tasks)
- Blocked by dependency (move to blocked/, document blocker)
- Implementer needs help (comment in task, ask for pairing)

**Resolution**: task-engineer reviews, decomposes or reassigns

### High Rejection Rate

**Symptoms**: >20% tasks rejected

**Causes**:
- Vague acceptance criteria (task-engineer improves specificity)
- Missing evidence (implementers not capturing outputs)
- Architecture misalignment (lean-architect clarifies patterns)

**Resolution**: retro analyzes root cause, updates process

### Blocker Tasks Piling Up

**Symptoms**: Multiple blocker tasks in pending

**Causes**:
- Production issues (fix process, not symptoms)
- Technical debt (dedicate time to pay down)
- Under-resourced (hire, train, or reduce scope)

**Resolution**: Leadership escalation, resource reallocation

---

## References

- **Task Template**: `docs/acf/backlog/task-template.md` (MANDATORY structure)
- **Workflow Details**: `docs/acf/backlog/workflow.md` (State machine, priority system)
- **Quality Gates**: `docs/development/quality-gates.md` (Single source of truth)
- **Git Conventions**: `docs/acf/git/commit-conventions.md` (Explicit staging, atomic commits)
- **Communication Styles**: `docs/acf/style/task-descriptions.md` (Binary, testable language)

---

**Last Updated**: 2025-10-27
**Document Owner**: ACF Framework (task-engineer maintains)
