# go - Process ENTIRE backlog to completion without stopping

## 🚨 CONTINUOUS EXECUTION MODE - MANDATORY

**CRITICAL REQUIREMENT**: This command MUST NOT TERMINATE until:

- **ALL tasks reach terminal states** (accepted, or blocked)
- **OR the backlog is completely empty**
- **OR manual intervention is explicitly requested**

**EXECUTION MODE**: Fire-and-forget automation that processes the ENTIRE backlog without manual intervention.

## ⚠️ CRITICAL WORKFLOW REQUIREMENT

**MANDATORY**: This command MUST process ALL workflow transitions CONTINUOUSLY:

1. **pending** → in-progress → completed (via specialist agents)
2. **completed** → in-review → accepted/rejected (via quality-reviewer)
3. **rejected** → pending (retry with fixes, max 3 attempts)
4. **blocked** → pending (when dependencies resolved)
5. **in-progress** → blocked (timeout after 48h)
6. **rejected** → blocked (after max retries)

**CONTINUOUS LOOP**: Keep processing until ALL tasks are in terminal states. DO NOT STOP after one iteration.

## Command

Process the ENTIRE backlog through CONTINUOUS iterations until ALL tasks reach terminal states (accepted/blocked), automatically fixing quality issues and retrying failures.

### Arguments:

```
$ARGUMENTS
```

## 🔄 COMPLETION CRITERIA - MUST NOT STOP

**THIS COMMAND MUST NOT TERMINATE** until one of these conditions is met:

1. **ALL TASKS IN TERMINAL STATES**:

   - Every task is in: `accepted/`, or `blocked/`
   - NO tasks remain in: `pending/`, `in-progress/`, `completed/`, `in-review/`, or `rejected/`

2. **BACKLOG COMPLETELY EMPTY**:

   - All folders are empty (no tasks exist)

3. **UNRECOVERABLE FAILURE**:
   - System error that cannot be automatically fixed
   - Explicit user intervention required

**ITERATION REQUIREMENT**: Continue looping indefinitely until completion criteria met.

## 🔧 QUALITY GATE AUTO-FIX - PRE-PROCESSING

**MANDATORY**: Before processing ANY tasks, automatically fix common quality issues:

### Auto-Fix Protocol

```bash
# 1. Fix ESLint issues (auto-fixable)
npm run lint -- --fix

# 2. Update import statements for TypeScript
npm run typecheck || {
  # If TypeScript fails, attempt common fixes:
  - Update import paths
  - Add missing type annotations
  - Fix interface mismatches
}

# 3. Ensure tests pass
npm test || {
  # If tests fail:
  - Update test snapshots if components changed
  - Fix broken imports in test files
  - Update mocked data to match new schemas
}

# 4. Verify build succeeds
npm run build || {
  # If build fails:
  - Clear cache: rm -rf .next
  - Reinstall dependencies: npm ci
  - Retry build
}

# 5. Ensure git is clean for new work
git stash  # Stash any uncommitted changes
```

**AUTO-FIX RULES**:

- Run fixes BEFORE each iteration
- Log all fixes applied
- If auto-fix fails 3 times, mark task for manual intervention
- Continue with other tasks even if one cannot be fixed

## 📊 CONTINUOUS PROCESSING LOOP

### Iteration Structure

```yaml
MAIN_LOOP:
  iteration: 0
  total_tasks: <count>
  terminal_tasks: 0
  progress: 0%

  WHILE (terminal_tasks < total_tasks):
    iteration++

    1. Quality Gate Auto-Fix:
       - Run all auto-fixes
       - Log fixes applied

    2. Scan ALL Workflow States:
       - Count tasks in each state
       - Identify ALL actionable transitions
       - Calculate progress percentage

    3. Process ALL Transitions:
       - Rejected → Pending/Blocked
       - Blocked → Pending (if deps met)
       - Pending → In-Progress → Completed
       - Completed → In-Review → Accepted/Rejected
       - In-Progress → Blocked (if timeout)

    4. Update Progress:
       - terminal_tasks = count(accepted + blocked)
       - progress = (terminal_tasks / total_tasks) * 100
       - Log: "Iteration #X: Progress Y% (Z/N tasks complete)"

    5. Check Completion:
       - IF all tasks terminal: EXIT SUCCESS
       - ELSE: CONTINUE to next iteration

    6. Prevent Infinite Loop:
       - IF iteration > 100: Log warning but CONTINUE
       - IF iteration > 1000: EXIT with diagnostic report
```

**CRITICAL**: The loop MUST continue until ALL tasks reach terminal states!

## 🎯 PROGRESS TRACKING

### Real-Time Metrics

```markdown
## Backlog Processing Status - Iteration #[N]

### Overall Progress: [X]% Complete

**Tasks Distribution:**

- Terminal States: [X]/[TOTAL] tasks
  - ✅ Accepted: [X] tasks
- Active States: [X]/[TOTAL] tasks
  - 🔄 In-Progress: [X] tasks
  - 📝 In-Review: [X] tasks
  - ⏸️ Blocked: [X] tasks
- Queued States: [X]/[TOTAL] tasks
  - 📋 Pending: [X] tasks
  - 🔁 Rejected (retriable): [X] tasks

**Iteration Metrics:**

- Current Iteration: #[N]
- Tasks Processed This Iteration: [X]
- Success Rate This Iteration: [X]%
- Estimated Iterations Remaining: [X]

**Quality Gate Fixes Applied:**

- ESLint auto-fixes: [X] files
- TypeScript fixes: [X] errors resolved
- Test fixes: [X] tests updated
- Build fixes: [X] cache clears

**Time Metrics:**

- Processing Started: [TIMESTAMP]
- Current Duration: [X] minutes
- Average Time per Task: [X] seconds
- Estimated Time to Completion: [X] minutes
```

## STRICT WORKFLOW ENFORCEMENT

**MANDATORY**: Follow the COMPLETE workflow from `docs/acf/backlog-workflow.md`:

### Complete State Machine (ALL TRANSITIONS REQUIRED)

```
pending → in-progress → completed → in-review → [accepted|rejected]
            ↓              ↓                          ↓
         blocked        blocked                  pending (retry < 3)
            ↓                                         ↓
    pending (resolved)                    blocked (≥ 3)

    in-progress → blocked (timeout 24h)
```

### Terminal States (Success/Failure)

- **accepted**: Task meets all criteria (SUCCESS)
- **blocked**: Max retries exceeded or unresolvable (FAILURE)

### Required Evidence at Each Stage

- **in-progress**: Agent assignment, task file moved to `.backlog/in-progress/`
- **completed**: Full compliance proof, evidence section filled, moved to `.backlog/completed/`
- **in-review**: Quality review initiated, moved to `.backlog/in-review/`
- **accepted**: All gates passed, moved to `.backlog/accepted/`
- **rejected**: Failure documented, moved to `.backlog/rejected/` or `.backlog/pending/` for retry

## Execution Protocol - CONTINUOUS LOOP

### 🔁 ITERATION LOOP START (REPEAT UNTIL COMPLETE)

### 1. Pre-Iteration Quality Gate Fixes

```bash
# MANDATORY: Fix quality issues BEFORE processing tasks
echo "=== ITERATION #$iteration - Quality Gate Auto-Fix ==="

# Auto-fix ESLint issues
npm run lint -- --fix && echo "✓ ESLint auto-fixes applied"

# Attempt TypeScript fixes
npm run typecheck || echo "⚠️ TypeScript issues need manual fixes"

# Update test snapshots if needed
npm test -- -u || echo "⚠️ Some tests need manual updates"

# Clear build cache if needed
npm run build || (rm -rf .next && npm run build)

# Clean git state
git stash && echo "✓ Git state cleaned"
```

### 2. Template Compliance Check

```bash
# Verify all tasks use docs/acf/task-template.md format
for task in .backlog/**/*.md; do
    validate_template_compliance "$task"
done
```

### 3. Scan ALL States for Required Transitions (EVERY ITERATION)

```bash
# MANDATORY: Check ALL folders for actionable transitions

# PRIMARY TRANSITIONS (Always process)
ls .backlog/pending/*.md      # → in-progress (assign to agents)
ls .backlog/completed/*.md    # → in-review (assign to quality-reviewer)
ls .backlog/rejected/*.md     # → pending (if retry_count < 3) OR blocked (if ≥ 3)
ls .backlog/blocked/*.md      # → pending (if dependencies resolved)

# MONITORING & TIMEOUTS (Check for stalls)
ls .backlog/in-review/*.md    # → accepted/rejected (ensure finalization)

# TERMINAL STATES (No action needed)
ls .backlog/accepted/*.md     # SUCCESS - no further action
ls .backlog/blocked/*.md  # FAILURE - no further action
```

**CRITICAL PROCESSING RULES**:

- Process ALL actionable transitions in EVERY execution
- Check retry_count in rejected tasks (max 3 attempts)
- Verify dependencies for blocked tasks
- Monitor timestamps for timeout detection
- FILTER: If Arguments provided, process ONLY specified task IDs

### 4. Build Complete Execution Plan (FOR THIS ITERATION)

```yaml
Iteration Control:
  current_iteration: [INCREMENT EACH LOOP]
  max_iterations: 1000  # Safety limit

  # Count tasks in each state
  terminal_count: count(accepted + blocked)
  active_count: count(pending + in-progress + blocked + completed + in-review + rejected)
  total_count: terminal_count + active_count

  # Calculate progress
  progress_percentage: (terminal_count / total_count) * 100

  # Decision logic
  IF progress_percentage == 100:
    LOG "✅ ALL TASKS COMPLETE - Exiting successfully"
    EXIT SUCCESS
  ELSE:
    LOG "📊 Progress: ${progress_percentage}% - Continuing iteration #${current_iteration}"
    CONTINUE PROCESSING

Task Processing Order (THIS ITERATION):
  1. Check template compliance (docs/acf/task-template.md)
  2. Extract metadata (priority, dependencies, agent, retry_count)
  3. Build dependency DAG
  4. Process ALL transition types (MANDATORY):
     a. rejected → pending/blocked (check retry_count)
     b. blocked → pending (check dependencies)
     c. pending → in-progress (assign to specialist agents)
     d. completed → in-review (assign to quality-reviewer)
     e. in-progress → blocked (check failure status)
  5. Respect priority levels:
     - blocker (exclusive, no parallel)
     - critical (exclusive, no parallel)
     - high (parallel with same priority)
     - medium (fully parallel)
     - low (fully parallel)

Retry Logic (WITH AUTO-FIXES):
  - retry_count < 3:
    - Auto-fix quality issues
    - Move to pending with incremented count
    - Add fix notes to task metadata
  - retry_count >= 3: Move to blocked
  - Log all retry attempts

Dependency Resolution:
  - Check each dependency in accepted/ folder
  - If all accepted: unblock and move to pending
  - If any missing: keep blocked

Timeout Detection:
  - Check last transition timestamp
  - If > 48h: move to blocked
  - If > 24h: log escalation warning
```

**CRITICAL REQUIREMENT**:

- ALWAYS scan `.backlog/completed/` for tasks needing review
- EVERY completed task MUST be assigned to quality-reviewer
- Process reviews in parallel with other tasks

### 5. Create TodoWrite (SINGLE CALL - ALL TRANSITIONS - THIS ITERATION)

```javascript
TodoWrite { todos: [
  // REJECTED TASKS - Retry or blocked
  { content: "Retry feature-001-auth (rejected→pending, attempt 2/3)", status: "pending", activeForm: "Retrying feature-001-auth" },
  { content: "Permanently reject bug-002-fix (rejected→blocked, max retries)", status: "pending", activeForm: "Finalizing bug-002-fix rejection" },

  // BLOCKED TASKS - Unblock if dependencies met
  { content: "Unblock feature-003-ui (blocked→pending, deps resolved)", status: "pending", activeForm: "Unblocking feature-003-ui" },

  // PENDING TASKS - Move to in-progress
  { content: "Process feature-004-api (pending→in-progress)", status: "pending", activeForm: "Starting feature-004-api" },
  { content: "Process bug-005-fix (pending→in-progress)", status: "pending", activeForm: "Starting bug-005-fix" },

  // COMPLETED TASKS - Move to in-review (MANDATORY - DON'T SKIP!)
  { content: "Review feature-006-auth (completed→in-review)", status: "pending", activeForm: "Reviewing feature-006-auth" },
  { content: "Review infra-007-ci (completed→in-review)", status: "pending", activeForm: "Reviewing infra-007-ci" },

  // STALLED TASKS - Handle timeouts
  { content: "Abandon feature-008-old (in-progress→blocked, 48h timeout)", status: "pending", activeForm: "Blocking stalled feature-008-old" },

  // ALL transitions in ONE call - complete workflow coverage
]}
```

**MANDATORY**: Process ALL actionable transitions - never skip any state!

### 6. Launch Agents (COMPLETE WORKFLOW PROCESSING - THIS ITERATION)

```javascript
// CRITICAL RULES:
// 1. ONE todo = ONE task = ONE agent/action
// 2. Independent tasks MUST be processed in PARALLEL
// 3. Send ALL transitions in a SINGLE message for parallel execution
// 4. MUST include ALL transition types, not just pending and completed

// COMPLETE WORKFLOW EXECUTION: All transitions in ONE message
Message:
  // === REJECTED TASK RETRY (move back to pending) ===

  // Retry Task 1 - rejected→pending (retry_count < 3)
  Task {
    subagent_type: "task-engineer",
    prompt: `
      Process rejected task feature-001-auth for retry.

      MANDATORY STEPS:
      1. Read task from .backlog/rejected/feature-001-auth.md
      2. Check retry_count in metadata (must be < 3)
      3. Increment retry_count by 1
      4. Add retry note with timestamp and reason
      5. Move file to .backlog/pending/
      6. Update transition log: rejected → pending (retry #X)

      If retry_count >= 3, move to .backlog/blocked/ instead.
    `
  }

  // === BLOCKED TASK RESOLUTION (check dependencies) ===

  // Unblock Task 2 - blocked→pending (deps resolved)
  Task {
    subagent_type: "task-engineer",
    prompt: `
      Check blocked task feature-002-ui for resolution.

      MANDATORY STEPS:
      1. Read task from .backlog/blocked/feature-002-ui.md
      2. Extract dependencies from metadata
      3. For each dependency, check if exists in .backlog/accepted/
      4. If ALL dependencies accepted:
         - Clear blocked_reason
         - Move to .backlog/pending/
         - Log: blocked → pending (dependencies resolved)
      5. If ANY dependency not accepted:
         - Keep in blocked/
         - Update blocked_reason with missing deps
    `
  }

  // === PENDING TASKS (specialist agents) ===

  // Task 1 - pending→in-progress→completed
  Task {
    subagent_type: "nextjs-engineer",
    prompt: `
      Process SINGLE task feature-001-auth from pending to completed.

      MANDATORY STEPS:
      1. Get current timestamp: date +"%Y-%m-%d %H:%M:%S"
      2. Log agent name (nextjs-engineer) and timestamp in transition log
      3. Move file from pending to in-progress
      4. Execute task implementation
      5. Get completion timestamp: date +"%Y-%m-%d %H:%M:%S"
      6. Update transition log with completion timestamp
      7. Move file to completed with evidence

      Follow workflow in docs/acf/backlog-workflow.md.
      Process ONLY this single task.
    `
  }

  // Task 2 - pending→in-progress→completed (parallel with Task 1)
  Task {
    subagent_type: "react-engineer",
    prompt: `
      Process SINGLE task feature-002-ui from pending to completed.
      [Same mandatory steps with timestamps...]
      Process ONLY this single task.
    `
  }

  // === COMPLETED TASKS (quality-reviewer ONLY) ===

  // CRITICAL: quality-reviewer MUST move tasks to final state (accepted/rejected)

  // Task 3 - completed→in-review (MANDATORY for ALL completed tasks)
  Task {
    subagent_type: "quality-reviewer",
    prompt: `
      Review SINGLE task feature-003-api from completed to in-review/accepted/rejected.

      MANDATORY STEPS:
      1. Get current timestamp: date +"%Y-%m-%d %H:%M:%S"
      2. Read task file from .backlog/completed/feature-003-api.md
      3. Verify all acceptance criteria met with evidence
      4. Check quality gates (lint, typecheck, test, build)
      5. Log review start in transition log
      6. Move file to in-review folder
      7. Perform thorough review
      8. Make accept/reject decision
      9. Move to accepted or rejected folder
      10. Update transition log with decision and timestamp

      Follow docs/acf/backlog-workflow.md quality review process.
      MANDATORY: Move to accepted OR rejected - NEVER leave in in-review.
      Process ONLY this single task.
    `
  }

  // === TIMEOUT DETECTION (cleanup stalled tasks) ===

  // Abandon Task 5 - in-progress→blocked (timeout)
  Task {
    subagent_type: "task-engineer",
    prompt: `
      Check in-progress task feature-009-stalled for timeout.

      MANDATORY STEPS:
      1. Read task from .backlog/in-progress/feature-009-stalled.md
      2. Check last transition timestamp in transition log
      3. Calculate age: current_time - last_transition
      4. If age > 48 hours:
         - Add timeout note with timestamp
         - Move to .backlog/blocked/
         - Log: in-progress → blocked (48h timeout)
      5. If age > 12 hours but < 48 hours:
         - Add escalation warning to task
         - Keep in in-progress but log warning
    `
  }

  // Task 4 - completed→in-review (parallel with all other tasks)
  Task {
    subagent_type: "quality-reviewer",
    prompt: `
      Review SINGLE task bug-004-fix from completed to in-review/accepted/rejected.
      [Same review steps...]
      Process ONLY this single task.
    `
  }

  // ALL agents execute in PARALLEL for independent tasks
  // CRITICAL: MUST process ALL completed tasks, not just pending ones
```

### 7. Agent Assignment Matrix

```yaml
Task Category → Primary Agent: feature-* → assigned agent in task metadata
  bug-* → assigned agent in task metadata
  infra-* → devops or infrastructure-engineer
  test-* → test-engineer
  docs-* → lean-architect
  refactor-* → assigned agent in task metadata

Review Assignment: ALL completed tasks → quality-reviewer
```

### 8. 🔄 LOOP CONTINUATION - CRITICAL

**AFTER ALL AGENTS COMPLETE THIS ITERATION**:

```yaml
POST-ITERATION CHECK:
  1. Wait for all agents to complete their tasks
  2. Re-scan ALL workflow folders
  3. Count terminal vs active tasks
  4. Calculate new progress percentage

  IF (all_tasks_terminal):
    LOG "✅ SUCCESS: All ${total_tasks} tasks completed!"
    LOG "- Accepted: ${accepted_count}"
    LOG "- Blocked: ${blocked_count}"
    EXIT SUCCESS

  ELIF (no_progress_made):
    retry_with_fixes++
    IF (retry_with_fixes > 3):
      LOG "⚠️ WARNING: No progress after 3 attempts with fixes"
      LOG "Manual intervention required for:"
      - List all stuck tasks
      REQUEST USER INTERVENTION
    ELSE:
      LOG "🔧 No progress - applying more aggressive fixes"
      RUN ENHANCED AUTO-FIX PROTOCOL
      CONTINUE TO NEXT ITERATION

  ELSE:
    LOG "📊 Iteration ${current_iteration} complete"
    LOG "Progress: ${progress_percentage}% (${terminal_count}/${total_count})"
    LOG "Continuing to iteration ${current_iteration + 1}..."
    GOTO ITERATION LOOP START  # Return to step 1
```

**MANDATORY LOOP BEHAVIOR**:

- **NEVER EXIT** unless all tasks are in terminal states
- **ALWAYS CONTINUE** to next iteration if tasks remain
- **AUTO-FIX** issues between iterations
- **LOG PROGRESS** at each iteration
- **NO MANUAL STOPS** unless explicitly requested

## WORKFLOW TRANSITIONS

### Complete State Transition Paths

```bash
# SUCCESS PATH
mv .backlog/pending/task.md .backlog/in-progress/task.md
mv .backlog/in-progress/task.md .backlog/completed/task.md
mv .backlog/completed/task.md .backlog/in-review/task.md
mv .backlog/in-review/task.md .backlog/accepted/task.md

# RETRY PATH (max 3 attempts)
mv .backlog/rejected/task.md .backlog/pending/task.md  # retry_count++

# Blocked REJECTION PATH
mv .backlog/rejected/task.md .backlog/blocked/task.md  # retry_count >= 3

# BLOCKED PATH
mv .backlog/in-progress/task.md .backlog/blocked/task.md  # dependency missing
mv .backlog/blocked/task.md .backlog/pending/task.md  # dependencies resolved

# TIMEOUT PATH
mv .backlog/in-progress/task.md .backlog/blocked/task.md  # > 48h no progress

# ENSURE FOLDERS EXIST
mkdir -p .backlog/{pending,in-progress,blocked,completed,in-review,accepted,rejected}
```

### Updating Transition Log (MANDATORY WITH PRECISE TIMESTAMPS)

```markdown
| Date Time                    | From        | To          | Agent            | Reason/Comment                      |
| ---------------------------- | ----------- | ----------- | ---------------- | ----------------------------------- |
| $(date +"%Y-%m-%d %H:%M:%S") | pending     | in-progress | nextjs-engineer  | Starting implementation             |
| $(date +"%Y-%m-%d %H:%M:%S") | in-progress | completed   | nextjs-engineer  | Implementation done, evidence added |
| $(date +"%Y-%m-%d %H:%M:%S") | completed   | in-review   | quality-reviewer | Starting quality review             |
| $(date +"%Y-%m-%d %H:%M:%S") | in-review   | accepted    | quality-reviewer | All criteria met                    |

NOTE: ALWAYS use date +"%Y-%m-%d %H:%M:%S" to get current timestamp, NEVER use placeholder dates
```

## EVIDENCE REQUIREMENTS

### For Completion (MANDATORY)

```bash
# Must be added to Evidence of Completion section
$ npm test
✓ All tests pass (127 specs)

$ npm run lint
✓ No errors

$ npm run typecheck
✓ No errors

$ npm run build
✓ Build successful

$ git status
On branch main
nothing to commit, working tree clean
```

### For Rejection (MANDATORY)

```markdown
## Quality Review Comments

### Review Round 1

- **Date**: 2025-01-20 13:00:00
- **Reviewer**: quality-reviewer
- **Decision**: rejected
- **Comments**:
  - Missing error handling in auth flow
  - Test coverage below 80% (currently 65%)
  - TypeScript errors in 3 files
```

## PRIORITY ENFORCEMENT

```yaml
Execution Rules:
  blocker:
    - MUST complete ALL before any other priority
    - NO parallel execution
    - Exclusive agent focus

  critical:
    - MUST complete ALL before high/medium/low
    - NO parallel execution
    - Process after ALL blockers accepted

  high:
    - Can run parallel with other high priority
    - Process after ALL blocker/critical accepted

  medium/low:
    - Full parallel execution allowed
    - Process after higher priorities
```

## DEPENDENCY MANAGEMENT

```yaml
Rules:
  - Task can only start if ALL dependencies are "accepted"
  - If dependency in "rejected", task becomes "blocked"
  - If dependency in "pending/in-progress/completed", wait
  - Re-evaluate after each state change
```

## SUCCESS PATTERNS

```
✅ Template compliance verified before processing
✅ All state transitions logged with CURRENT timestamps (date +"%Y-%m-%d %H:%M:%S")
✅ Files physically moved between folders
✅ Single TodoWrite with all tasks (1 todo per task)
✅ ONE agent processes ONE task (never multiple tasks per agent)
✅ Independent tasks processed in PARALLEL (single message, multiple agents)
✅ Complete workflow execution (pending→accepted)
✅ Evidence attached at each stage
✅ Agent name and timestamp logged at start and completion
```

## FAILURE PATTERNS

```
❌ Skipping template validation
❌ Missing transition log entries or using placeholder timestamps
❌ Not moving files between folders
❌ Claiming completion without evidence
❌ Bypassing quality review
❌ Processing draft folder
❌ Ignoring priority order
❌ Having one todo spawn agents for multiple tasks (must be 1:1)
❌ Not processing independent tasks in parallel
❌ Not recording current timestamps with date command
❌ Missing agent name in transition logs
```

## EXECUTION CHECKLIST (CONTINUOUS LOOP VERIFICATION)

**BEFORE STARTING THE CONTINUOUS LOOP:**

- [ ] **COMMIT TO COMPLETION**: Understand this will run until ALL tasks are done
- [ ] **Quality Gate Auto-Fix**: Prepared to fix issues automatically
- [ ] **Iteration Counter**: Initialize at 0, increment each loop
- [ ] **Progress Tracking**: Set up metrics for all states
- [ ] **Loop Control**: Implement WHILE loop that checks completion

**FOR EACH ITERATION, VERIFY ALL transitions:**

- [ ] **PRE-ITERATION**: Run quality gate auto-fixes (lint, typecheck, test, build)
- [ ] Scanned `.backlog/rejected/` for retry candidates (retry_count < 3)
- [ ] Scanned `.backlog/blocked/` for resolved dependencies
- [ ] Scanned `.backlog/pending/` for tasks to start
- [ ] Scanned `.backlog/completed/` for tasks to review (DON'T SKIP!)
- [ ] Scanned `.backlog/in-progress/` for timeout detection (> 24h)
- [ ] Created TodoWrite entries for ALL transition types
- [ ] Assigned appropriate agents for each transition
- [ ] Configured parallel execution for independent tasks
- [ ] Created missing folders (drafts/, in-review/, etc.)
- [ ] **POST-ITERATION**: Check if ALL tasks terminal, if not, CONTINUE LOOP

**CONTINUOUS EXECUTION REQUIREMENTS:**

- ✅ **MUST LOOP** until all tasks reach terminal states
- ✅ **MUST AUTO-FIX** quality issues before each iteration
- ✅ **MUST RETRY** rejected tasks up to 3 times
- ✅ **MUST TRACK** progress percentage
- ✅ **MUST LOG** iteration number and progress
- ✅ **MUST NOT STOP** unless explicitly complete

**Common Failures (AVOID):**

- ❌ **STOPPING AFTER ONE ITERATION** (must continue looping)
- ❌ **NOT FIXING QUALITY GATES** (must auto-fix before processing)
- ❌ Only processing pending/completed (must process ALL states)
- ❌ Not checking retry_count in rejected tasks
- ❌ Not verifying dependencies for blocked tasks
- ❌ Not detecting timeouts in in-progress tasks
- ❌ Leaving tasks in in-review forever
- ❌ Allowing infinite retries (must enforce max 3)
- ❌ **EXITING PREMATURELY** (must reach 100% completion)

## OUTPUT FORMAT (PER ITERATION)

```
================================================================================
ITERATION #[N] - CONTINUOUS PROCESSING
================================================================================

Quality Gate Auto-Fixes Applied:
✓ ESLint: Fixed 12 files
✓ TypeScript: Resolved 3 import errors
✓ Tests: Updated 2 snapshots
✓ Build: Cache cleared and rebuilt

Template Compliance Check:
✓ All tasks follow docs/acf/task-template.md

📊 OVERALL PROGRESS: [X]% COMPLETE ([terminal]/[total] tasks)
================================================================================

Workflow State Analysis:
- Terminal States: [X]/[TOTAL]
  - accepted: [X] tasks ✅
- Active States: [X]/[TOTAL]
  - rejected: 3 tasks (2 retriable, 1 max retries)
  - blocked: 2 tasks (1 resolvable, 1 waiting)
  - pending: 4 tasks
  - in-progress: 3 tasks (1 timeout detected)
  - completed: 6 tasks
  - in-review: 2 tasks

Tasks Being Processed (THIS ITERATION):
=== REJECTED → PENDING/BLOCKED ===
1. [high] feature-001-auth (retry 2/3 → pending) [AUTO-FIXED]
2. [medium] bug-002-fix (retry 3/3 → blocked)

=== BLOCKED → PENDING ===
3. [high] feature-003-ui (dependencies met → pending)

=== PENDING → IN-PROGRESS ===
4. [high] feature-004-api (nextjs-engineer)
5. [medium] bug-005-fix (test-engineer)

=== COMPLETED → IN-REVIEW ===
6. [high] feature-006-auth (quality-reviewer)
7. [medium] infra-007-ci (quality-reviewer)
8. [low] docs-008-readme (quality-reviewer)

=== IN-PROGRESS → blocked ===
9. [low] feature-009-old (timeout 48h → blocked)

Processing Order (by priority and dependencies):
1. Retries and unblocks (restore to pipeline)
2. [blocker] tasks (if any)
3. [critical] tasks (if any)
4. [high] tasks (parallel)
5. [medium/low] tasks (parallel)
6. Reviews (parallel)
7. Cleanup (timeouts)

Iteration Summary:
- Iteration: #[N] of estimated [X]
- Retries processed: 1 (with auto-fixes)
- Blocked: 1
- Unblocked: 1
- New starts: 2
- Reviews initiated: 3
- Timeouts handled: 1
- Total transitions: 9
- Parallel groups: 4

Expected Progress After This Iteration:
- Current: [X]% ([terminal]/[total])
- Expected: [Y]% ([new_terminal]/[total])
- Remaining iterations: ~[Z]

Workflow Health:
- Stuck tasks: 0
- Retry success rate: 66%
- Auto-fix success rate: 85%
- Timeout rate: 5%
- Complete workflow coverage: 100%

================================================================================
🔄 CONTINUING TO NEXT ITERATION... (Progress: [X]% → [Y]%)
================================================================================
```

## 🎯 FINAL SUCCESS OUTPUT (WHEN 100% COMPLETE)

```
================================================================================
✅ ALL TASKS COMPLETED - BACKLOG PROCESSING SUCCESSFUL!
================================================================================

Final Statistics:
- Total Iterations: [N]
- Total Tasks Processed: [TOTAL]
- Processing Duration: [X] minutes

Terminal State Distribution:
- ✅ Accepted: [X] tasks ([Y]%)
- ❌ Rejected: [X] tasks ([Y]%)
- ⚠️ Blocked: [X] tasks ([Y]%)

Quality Gate Fixes Applied:
- ESLint auto-fixes: [X] total fixes
- TypeScript fixes: [X] errors resolved
- Test updates: [X] snapshots updated
- Build cache clears: [X] times

Success Rate: [X]%
Average Time per Task: [X] seconds
Total Retries: [X] (Success rate: [Y]%)

================================================================================
```
