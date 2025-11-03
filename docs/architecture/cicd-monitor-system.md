# CI/CD Monitor System Architecture

## Overview

The CI/CD Monitor system provides autonomous build monitoring and task creation for the zabicekiosk agent swarm. When builds fail, the system automatically analyzes errors, generates tasks, and routes them to the appropriate specialist agents.

**Version**: 1.0
**Status**: Implementation Ready
**Created**: 2025-11-03

---

## System Goals

1. **Zero Manual Intervention**: Detect and respond to build failures automatically
2. **Fast Response Time**: Create tasks within 2 minutes of build failure
3. **Intelligent Routing**: Use AI to assign tasks to the correct agent
4. **High Accuracy**: >90% agent routing accuracy, <5% false positives
5. **Seamless Integration**: Work within existing Cloud Build and GitHub workflows

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Pull Request                       │
│                     Developer pushes code                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflow                       │
│  - Trigger Cloud Build                                           │
│  - Launch cicd-monitor (async watch mode)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────────┐
│                      Cloud Build Pipeline                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Quality Gates (Parallel)                                │   │
│  │  - ESLint (services, web apps)                           │   │
│  │  - TypeScript Compiler (strict mode)                     │   │
│  │  - Jest Tests (>80% coverage services, >70% web)         │   │
│  │  - Build (production builds)                             │   │
│  │  - Database Verification                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                  ┌─────────┴──────────┐
                  │   Build Success?   │
                  └─────────┬──────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
         v                                     v
    ┌────────┐                    ┌─────────────────────────────┐
    │Success │                    │  cicd-monitor Agent         │
    │Exit 0  │                    │  (analyze command)          │
    └────────┘                    │                             │
                                  │  1. Fetch Build Status      │
                                  │  2. Fetch Error Logs        │
                                  │  3. Classify Error Type     │
                                  │  4. AI Analysis (Claude)    │
                                  │  5. Generate Task File      │
                                  │  6. Route to Agent          │
                                  │  7. Commit to .backlog/     │
                                  │  8. Comment on PR           │
                                  └─────────────┬───────────────┘
                                                │
                                                v
                                  ┌─────────────────────────────┐
                                  │  Agent Swarm                │
                                  │  - typescript-engineer      │
                                  │  - react-engineer           │
                                  │  - test-engineer            │
                                  │  - devops                   │
                                  │  - database-engineer        │
                                  └─────────────────────────────┘
```

---

## Components

### 1. CLI Tool (`zabice-cicd-monitor`)

**Location**: `tools/cicd-monitor/`

**Technology Stack**:
- TypeScript (strict mode)
- Node.js 20+
- Commander (CLI framework)
- Winston (structured logging)

**Commands**:

| Command | Purpose | Usage |
|---------|---------|-------|
| `watch` | Real-time monitoring | GitHub Actions (async) |
| `analyze` | Post-mortem analysis | Cloud Build (on failure) |
| `list` | List recent builds | Manual debugging |
| `tasks` | Show tasks for build | Manual debugging |

**Key Features**:
- Exponential backoff polling (5s → 30s)
- Rate limiting (30 GitHub API calls/min, 60 Cloud Build/min, 10 Claude/min)
- Dry-run mode for testing
- Structured JSON logging

---

### 2. API Integrations

#### A. Cloud Build API

**Client**: `@google-cloud/cloudbuild`

**Operations**:
- `getBuild(buildId)` - Fetch build status
- `waitForBuild(buildId)` - Poll until terminal state
- `listBuilds(filter)` - List recent builds

**Authentication**: Application Default Credentials (ADC)

**Rate Limits**: 60 requests/minute (configured)

#### B. Cloud Logging API

**Client**: `@google-cloud/logging`

**Operations**:
- `fetchBuildLogs(buildId)` - All logs
- `fetchErrorLogs(buildId)` - Severity >= ERROR only

**Log Filters**:
```
resource.labels.build_id="{buildId}"
severity>="ERROR"
```

#### C. GitHub API

**Client**: `octokit` with throttling plugin

**Operations**:
- `getPRContext(prNumber)` - Fetch PR metadata and files changed
- `postOrUpdateComment(prNumber, body)` - Post/update PR comment
- `commitFile(path, content, message)` - Commit task to `.backlog/pending/`

**Authentication**: Personal Access Token (scope: `repo`)

**Rate Limits**: 5,000 requests/hour (authenticated), throttling plugin handles retries

#### D. Claude API

**Client**: `@anthropic-ai/sdk`

**Model**: `claude-3-5-sonnet-20241022`

**Purpose**: AI-powered error analysis

**Prompt Structure**:
```
Error Context:
- Error Type: {type}
- Failed Step: {stepId}
- Logs: {logs}

Provide:
1. Root Cause (1-2 sentences)
2. Affected Components (list)
3. Suggested Fix (3-5 points)
4. Risk Assessment (low/medium/high)
5. Recommended Agent
6. Confidence (0-100)
```

**Rate Limits**: 10 requests/minute (configured)

---

### 3. Error Classification

**Classifier**: `ErrorClassifier.classify(build, logs)`

**Mapping**:

| Step ID Pattern | Error Type | Priority | Agent (Fallback) |
|-----------------|------------|----------|------------------|
| `quality-gate-*-lint` | lint-error | high | typescript-engineer / react-engineer |
| `quality-gate-*-typecheck` | typecheck-error | high | typescript-engineer / react-engineer |
| `quality-gate-*-test` | test-failure | high | test-engineer |
| `quality-gate-*-build` | build-error | critical | typescript-engineer / react-engineer |
| `*database*` | migration-error | critical | database-engineer |
| `deploy-*` | deployment-error | blocker | devops |

**Project Detection**:
- `services/core-api` → typescript-engineer
- `services/booking-api` → typescript-engineer
- `web/admin-portal` → react-engineer
- `web/kiosk-pwa` → react-engineer
- `web/parent-web` → react-engineer

---

### 4. AI Analysis Engine

**Analyzer**: `RootCauseAnalyzer.analyze(classification)`

**Process**:
1. Check known patterns (optional skip AI)
2. Extract affected files from logs
3. Call Claude API with error context
4. Parse JSON response
5. Return structured analysis

**Known Pattern Heuristics**:
- ESLint errors → Skip AI, use heuristic
- TypeScript errors → Skip AI, use heuristic
- Jest test failures → Use AI (complex)

**Output**:
```typescript
interface RootCauseAnalysis {
  classification: ErrorClassification;
  aiAnalysis: {
    rootCause: string;
    affectedComponents: string[];
    suggestedFix: string;
    riskAssessment: string;
    recommendedAgent: string;
    confidence: number;
  };
  filesInvolved: string[];
  timestamp: string;
}
```

---

### 5. Task Generation

**Generator**: `TaskGenerator.generate(analysis, buildId, prContext)`

**Templates** (`tools/cicd-monitor/templates/`):
- `lint-error-task.md`
- `typecheck-error-task.md`
- `test-failure-task.md`
- `build-failure-task.md`
- `deployment-error-task.md`

**Template Variables**:
```
{taskId}           - auto-lint-20251103-143022
{timestamp}        - 2025-11-03T14:30:22Z
{error-type}       - lint-error
{priority}         - high
{agent}            - typescript-engineer
{project}          - core-api
{build-id}         - abc123-def456
{pr-number}        - 42
{root-cause}       - ESLint rule violations...
{suggested-fix}    - Run npm run lint --fix...
{error-logs}       - Truncated to 5000 chars
{full-logs}        - Truncated to 20000 chars
```

**Task File Naming**:
```
.backlog/pending/auto-{type}-{date}-{time}-{project}.md

Example:
.backlog/pending/auto-lint-20251103-143022-core-api.md
```

---

### 6. Agent Routing

**Router**: `AgentRouter.route(analysis)`

**Strategy**:
1. **AI Recommendation** (if confidence >= 70%):
   - Use Claude's recommendedAgent
   - Fast and context-aware

2. **Rule-Based Fallback** (if confidence < 70%):
   - Use config rules from `.cicd-monitor.config.yaml`
   - Project-specific routing (services vs web)

**Config Example**:
```yaml
agent_routing:
  lint-error:
    services: typescript-engineer
    web: react-engineer
  test-failure:
    default: test-engineer
```

---

## Data Flow

### Scenario 1: PR Build Failure (Full Flow)

```
1. Developer pushes code to PR #123
   ↓
2. GitHub Actions triggers Cloud Build
   - Passes PR context (_PR_NUMBER=123, _BRANCH_NAME=feature/foo)
   ↓
3. Cloud Build runs quality gates
   - ESLint passes
   - TypeScript FAILS (step: quality-gate-core-api-typecheck)
   ↓
4. cicd-monitor-on-failure step runs (always)
   ↓
5. CLI: zabice-cicd-monitor analyze --build-id=abc123 --pr-number=123
   ↓
6. Fetch build: CloudBuildService.getBuild()
   - Status: FAILURE
   - Failed step: quality-gate-core-api-typecheck
   ↓
7. Fetch logs: LoggingService.fetchErrorLogs()
   - Filter: severity>=ERROR
   - Extract error messages
   ↓
8. Classify: ErrorClassifier.classify()
   - Type: typecheck-error
   - Priority: high
   - Project: core-api
   ↓
9. Analyze: RootCauseAnalyzer.analyze()
   - Claude API call
   - Response: "Missing type annotation on function parameter..."
   - Confidence: 85%
   - Recommended: typescript-engineer
   ↓
10. Generate task: TaskGenerator.generate()
    - Template: typecheck-error-task.md
    - Fill variables
    - Output: auto-typecheck-20251103-143022-core-api.md
    ↓
11. Commit task: GitHubService.commitFile()
    - Path: .backlog/pending/auto-typecheck-20251103-143022-core-api.md
    - Branch: main
    - Author: CI/CD Monitor Bot
    ↓
12. Post PR comment: GitHubService.postOrUpdateComment()
    - Identifier: cicd-monitor-abc123
    - Body: "Build failed, task created, assigned to typescript-engineer"
    ↓
13. typescript-engineer picks up task from .backlog/pending/
    ↓
14. Fixes TypeScript error, commits, pushes
    ↓
15. Build re-triggers, passes
    ↓
16. cicd-monitor runs, finds no failures, exits quietly
```

---

## Configuration

**File**: `.cicd-monitor.config.yaml`

**Key Settings**:

```yaml
monitor:
  mode: watch                        # watch | analyze | disabled
  use_pubsub: true                   # Prefer Pub/Sub over polling

analysis:
  ai_model: claude-3-5-sonnet-20241022
  skip_known_patterns: true          # Use heuristics for common errors

task_creation:
  enabled: true
  priority_rules:
    deployment-error: blocker
    build-error: critical
    test-failure: high

rate_limits:
  github_api_per_minute: 30
  cloudbuild_api_per_minute: 60
  claude_api_per_minute: 10
  max_tasks_per_pr: 5                # Prevent spam
```

---

## Security

### Secrets (Google Secret Manager)

| Secret | Purpose | Scope | Access |
|--------|---------|-------|--------|
| `cicd-monitor-github-token` | GitHub API | `repo` | Cloud Build SA, cicd-monitor SA |
| `cicd-monitor-anthropic-api-key` | Claude API | N/A | Cloud Build SA, cicd-monitor SA |

### IAM Permissions

**cicd-monitor Service Account**:
- `roles/cloudbuild.builds.viewer` - Read build status
- `roles/logging.viewer` - Read build logs
- `roles/pubsub.subscriber` - Subscribe to build events

**Cloud Build Service Account** (120039745928@cloudbuild):
- `roles/secretmanager.secretAccessor` - Access secrets
- (Existing permissions for deployment)

### Best Practices

- ✅ Use ADC in Cloud Build (no hardcoded credentials)
- ✅ Minimal IAM roles (viewer only, no write)
- ✅ Secrets never logged or exposed
- ✅ Service account key for local dev only
- ✅ Rotate GitHub token every 90 days

---

## Monitoring and Observability

### Logs

**Cloud Logging**:
```bash
# View cicd-monitor logs
gcloud logging read "resource.type=build AND textPayload:\"cicd-monitor\"" \
  --limit=100 \
  --project=zabicekiosk

# View errors only
gcloud logging read "resource.type=build AND textPayload:\"cicd-monitor\" AND severity>=ERROR" \
  --limit=50 \
  --project=zabicekiosk
```

**Structured Logging**:
```json
{
  "level": "info",
  "timestamp": "2025-11-03T14:30:22Z",
  "message": "Build analysis complete",
  "buildId": "abc123",
  "errorType": "typecheck-error",
  "agent": "typescript-engineer",
  "confidence": 85
}
```

### Metrics (Future)

Track success metrics:
- Detection rate (% of failures that create tasks)
- False positive rate (% of tasks incorrectly classified)
- Agent routing accuracy (% routed to correct agent)
- Time to task creation (from failure to commit)
- Auto-fix success rate (% of tasks that get accepted)

---

## Testing Strategy

### Unit Tests

```bash
cd tools/cicd-monitor
npm test

# Coverage requirements
# - Overall: >80%
# - Critical paths: 100% (error classifier, agent router)
```

### Integration Tests

**Test 1: Full Flow (Dry Run)**
```bash
npm run cli -- analyze \
  --build-id=<FAILED_BUILD> \
  --project-id=zabicekiosk \
  --pr-number=123 \
  --create-tasks \
  --notify \
  --dry-run
```

**Test 2: Error Classification**
```bash
# Trigger builds with known errors
- Lint error: Add unused variable
- TypeScript error: Add type mismatch
- Test failure: Break test assertion
- Build error: Add syntax error
- Deployment error: Break Cloud Run config
```

**Test 3: Agent Routing**
```bash
# Verify correct agent assignment
- services/core-api lint error → typescript-engineer
- web/admin-portal lint error → react-engineer
- Test failure → test-engineer
- Deployment error → devops
```

---

## Rollout Plan

### Phase 1: Foundation (Week 1)
- [x] Architecture designed
- [ ] CLI skeleton created (tools-001)
- [ ] Secret Manager configured (infra-007)
- [ ] Basic tests passing

### Phase 2: Intelligence (Week 2)
- [ ] Cloud Build integration (tools-002)
- [ ] GitHub integration (tools-002)
- [ ] Claude API integration (tools-003)
- [ ] Error classification (tools-003)

### Phase 3: Integration (Week 3)
- [ ] Task generation (tools-004)
- [ ] Agent routing (tools-004)
- [ ] Cloud Build pipeline integration (infra-008)
- [ ] GitHub Actions workflow (infra-009)

### Phase 4: Testing & Refinement (Week 4)
- [ ] E2E testing with real PRs
- [ ] AI prompt tuning
- [ ] Metrics collection
- [ ] Documentation

---

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Detection Rate | >95% | % of build failures that create tasks |
| False Positives | <5% | % of tasks created incorrectly |
| Agent Routing Accuracy | >90% | % of tasks routed to correct agent |
| Time to Task Creation | <2 min | From build failure to task commit |
| Auto-Fix Success Rate | >70% | % of auto-created tasks accepted |

---

## Future Enhancements

**v2.0 (AI-Enhanced)**:
- Smart retry logic (auto-trigger rebuild after fix)
- Learning from past fixes (pattern recognition)
- Multi-agent coordination (complex errors)
- Suggested code fixes in tasks

**v3.0 (Autonomous)**:
- Auto-apply fixes (create PR with fix)
- Predictive failure detection (before build fails)
- Self-healing pipelines
- Integration with monitoring/alerting

---

## Related Documents

- Agent Manifest: `docs/agents/cicd-monitor.md`
- Infrastructure Setup: `docs/infrastructure/cicd-monitor-setup.md`
- Task Workflow: `docs/acf/backlog/workflow.md`
- Agent System: `docs/agents/README.md`

---

**Version**: 1.0
**Last Updated**: 2025-11-03
**Maintained By**: cicd-monitor agent, lean-architect agent
