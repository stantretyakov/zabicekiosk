# Parallel Execution (MANDATORY)

## Core Principle

All independent operations MUST run in parallel. Sequential execution when parallel is possible is a CRITICAL VIOLATION.

## TodoWrite Batching

**NEVER** call TodoWrite multiple times. **ALWAYS** batch ALL todos in single call.

```javascript
// ✅ CORRECT
TodoWrite { todos: [task1, task2, task3, ...] }

// ❌ WRONG
TodoWrite { todos: [task1] }
TodoWrite { todos: [task2] }
```

## Task Tool Batching

**NEVER** spawn agents sequentially. **ALWAYS** use single message with multiple Task calls.

```javascript
// ✅ CORRECT - Single message
Message:
  Task { subagent_type: "go-engineer", ... }
  Task { subagent_type: "python-ml-engineer", ... }

// ❌ WRONG - Sequential messages
Message 1: Task { ... }
Message 2: Task { ... }
```

## Dependency Management

Execute independent tasks in parallel, dependent tasks sequentially.

```
        ┌─────────┐
        │ Task A  │ (No dependencies)
        └────┬────┘
             │
    ┌────────┼────────┐
    │        │        │
┌───▼───┐┌───▼───┐┌───▼───┐
│Task B ││Task C ││Task D │ (Parallel - all depend on A)
└───────┘└───────┘└───────┘
```

**Execute in waves**: Wave 1 (all blockers) → Wave 2 (all critical) → Wave 3 (high priority) in parallel.

---

**Last Updated**: 2025-10-27
