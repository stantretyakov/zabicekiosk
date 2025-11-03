# task - Scope Decomposition & Parallel Task Creation

## Command

Decomposes complex scope into precise, independent todos for parallel execution by task-engineer agents.

### Arguments:

```
$ARGUMENTS
```

## 🚨 CRITICAL: Command Protocol

**THIS COMMAND NEVER IMPLEMENTS ANYTHING**

This command is a **PURE ORCHESTRATION TOOL** that:
- **DECOMPOSES** scope described in Arguments into logical work units
- **DELEGATES** to task-engineer agents ONLY
- **NEVER** touches code, fixes bugs, or implements features

### 🚨 CRITICAL DELEGATION RULES (ZERO TOLERANCE)

1. **ONLY task-engineer** agent delegation
2. **WHAT NOT HOW** - deliverables only, never implementation details
3. **NO IMPLEMENTATION** - no Edit/Write/Bash for code
4. **NO DEBUGGING** - no investigation or fixing

### 🎨 MANDATORY: Figma Integration

**When Figma link/node in scope:**

1. **MUST** use `mcp__figma-dev-mode-mcp-server__get_code` BEFORE decomposition
2. **MUST** extract node ID from URLs (`node-id=1-2` → `1:2`)
3. **MUST** analyze design for UI requirements
4. **MUST** include design insights in task descriptions

The task command **decomposes scope into todos and delegates** to task-engineer agents who create task specifications.

## Execution Flow

**Task Command → Minimal Research → Analyze Scope → Decompose → TodoWrite (single call) → Spawn Agents (parallel) → Agents Create Tasks → Dependency Verification → Exit**

## Todo Creation Protocol

### 1. MINIMAL Research - Scope Understanding ONLY

**🚨 CRITICAL: Research is ONLY for understanding WHAT to decompose, NEVER for solving problems**

**DECISION FLOW**: Scope unclear? → Minimal research. Design provided? → Extract requirements. Then proceed to decomposition.

**USE TOOLS MINIMALLY TO UNDERSTAND SCOPE**:

- **Perplexity**: Best practices, patterns, pitfalls, architecture standards
- **Figma** (MANDATORY if URL/node): Extract node ID (`node-id=1-2` → `1:2`), call `get_code(nodeId)`, extract UI requirements
- **Context7**: Library features (Go, Python, LangGraph, Temporal, Dagster), API capabilities, compatibility, examples
- **File Analysis**: Grep/Glob for related code, existing patterns, integration points

### 2. Scope Understanding

- Parse the complete scope description
- Identify all deliverables
- Detect logical boundaries
- Recognize quality requirements
- Note technical constraints

### 3. Atomic Decomposition Strategy

**CRITICAL: Right Level of Abstraction**

Break down scope into **atomic work units**:

- **One Logical Feature = One Task**

  - Example: "YAML processor service" = one task (not separate parsing/validation tasks)
  - The task-engineer will decompose further if needed

- **Mixed Stack Work = Single Task**

  - If a feature needs both Go backend + React frontend, create ONE task
  - Example: "Pipeline dashboard feature" includes API + UI
  - Let task-engineer coordinate specialist agents

- **Clear Acceptance Criteria**
  - Each task must have binary pass/fail criteria
  - Measurable outcomes
  - Testable requirements

**DON'T over-decompose**:

- ❌ WRONG: Separate tasks for "API endpoint", "database schema", "tests"
- ✅ RIGHT: Single task "User API YAML submission feature" (includes all layers)

**DO decompose when**:

- Different features/capabilities
- Independent deliverables
- Separate user stories
- Distinct problem domains

### 4. Todo Specification Format

Each todo MUST have:

```
{
  content: "Create backlog task: {precise-deliverable-description}",
  status: "pending",
  activeForm: "Creating backlog task for {specific-component}"
}
```

### 5. Single TodoWrite Execution

**MANDATORY**: ALL todos in ONE call:

```javascript
TodoWrite { todos: [
  { content: "Create backlog task: Implement YAML processor service...", status: "pending", activeForm: "Creating..." },
  ... // 5-10 todos total
]}
```

### 6. Parallel Agent Spawning

**MANDATORY**: Single message with ALL Task calls:

```javascript
Message:
  Task { subagent_type: "task-engineer", prompt: "..." }
  ... // All agents spawned in parallel
```

**Note**: The task-engineer will determine the appropriate task ID (category-NNN-description) based on:

- Analyzing existing tasks to find next incremental number
- Selecting appropriate category (feature/bug/infra/test/docs/refactor/data/ml)
- Creating descriptive name following conventions

### 7. Figma-Driven Task Example

**Figma workflow:**
```
/task implement profile page from https://figma.com/design/abc123/ODP?node-id=123-456
```

1. **Figma**: `get_code(nodeId="123:456")` - MANDATORY first step
2. **TodoWrite**: Profile page component tasks
3. **Spawn agents**: react-engineer for implementation
4. **Verify dependencies**, exit

### 8. Pre-Creation Validation (MANDATORY - BEFORE Creating Tasks)

**CRITICAL**: BEFORE spawning task-engineer agents, perform these validation checks:

**Pre-Creation Checks:**

A. **Uniqueness**: Grep pending tasks for file conflicts → Consolidate/sequence, never duplicate
B. **Service Setup**: Go/Python service setup + config = ONE task (prevents duplication)
C. **Tech Stack**: Specify tech stack (Go/Python/React/Docker) and quality gates
D. **Scope Boundary**: Every task MUST include "Out of Scope" section

### 9. Dependency Verification (MANDATORY FINAL STEP)

After all task-engineer agents complete, spawn ONE MORE to verify dependencies:

```javascript
Task { subagent_type: "task-engineer", prompt: "DEPENDENCY VERIFICATION: Verify task IDs sequential, no duplicates, dependencies valid, no circular deps. Fix issues and confirm ready." }
```

**Prevents**: Duplicate IDs, invalid dependencies, wrong execution order, scope duplication, broken chains

## Agent Assignment Guidelines

**Ensure task-engineer assigns to correct ODP agents:**

| Work Type | Assign To |
|-----------|-----------|
| Go service implementation | go-engineer |
| Python ML/Temporal workflow | python-ml-engineer |
| Data pipeline (Dagster) | data-engineer |
| Temporal workflow design | temporal-engineer |
| ML model serving | ml-ops-engineer |
| Kubernetes deployment | k8s-engineer |
| Event schema design | event-engineer |
| React frontend | react-engineer |
| Database schema | database-engineer |
| Docker Compose/ops | devops |
| Testing | test-engineer |
| Architecture | lean-architect |

## Anti-Patterns to Detect

**INSTANT REJECTION CRITERIA**:

1. **Sequential Task Spawning**
   - ❌ WRONG: Spawning agents one at a time
   - ✅ RIGHT: Single message with all agents

2. **Over-Decomposition**
   - ❌ WRONG: "Create API endpoint" + "Add validation" + "Write tests" (3 tasks)
   - ✅ RIGHT: "Implement user authentication feature" (1 task, all layers)

3. **Implementation Details**
   - ❌ WRONG: Prompt includes specific code patterns
   - ✅ RIGHT: Prompt describes deliverable, acceptance criteria only

4. **Missing Context**
   - ❌ WRONG: No reference to existing architecture docs
   - ✅ RIGHT: References `docs/architecture/system-architecture.md`

5. **Vague Criteria**
   - ❌ WRONG: "Improve performance"
   - ✅ RIGHT: "Response time < 200ms for YAML validation"

## Output Format

**Todos Created**: [N] task specification todos

**Agents Spawned**: [N] task-engineer agents in parallel

**Tasks Created**: [N] tasks in `.backlog/pending/`

**Summary to User**:
```
Task decomposition complete:

Scope: [Original request]

Todos Created: [N]
- [Todo 1 description]
- [Todo 2 description]
...

Agents Spawned: [N] task-engineer agents (parallel)

Tasks Expected: [N] tasks in .backlog/pending/
- [Task category-XXX-description]
...

Dependencies Verified: [✓/✗]

Ready for implementation: [✓/✗]
```

## Critical Success Factors

1. **Parallel Execution**: SINGLE message, multiple agents
2. **Right Abstraction**: Feature-level tasks, not micro-tasks
3. **Binary Criteria**: Works or doesn't, no vague language
4. **Clear Assignment**: Correct specialist agent for each task
5. **Dependency Verification**: Final validation step mandatory
6. **ALWAYS use Figma tools**: When Figma link/node in scope
