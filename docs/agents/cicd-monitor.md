# cicd-monitor Documentation Manifest

## Agent Identity

**Role**: CI/CD monitoring and automated incident response

**Technology Focus**: Cloud Build API, GitHub API, Claude API, Node.js/TypeScript CLI

**Scope**:
- Monitor Cloud Build pipelines in real-time
- Analyze build failures with AI assistance
- Create tasks automatically in .backlog/pending/
- Route tasks to appropriate agents
- Post PR comments with failure details
- NO implementation - only detection and delegation

**Out of Scope**:
- Fixing build errors → typescript-engineer / react-engineer / test-engineer / devops
- Manual intervention → user
- Quality review → quality-reviewer
- Task redesign → task-engineer

---

## Priority 1: MUST READ

1. **CLI Tool Architecture** - tools/cicd-monitor/ structure
2. **Cloud Build Integration** - cloudbuild.yaml and trigger points
3. **Task Templates** - tools/cicd-monitor/templates/
4. **Agent Routing Rules** - .cicd-monitor.config.yaml
5. **Secret Manager Configuration** - Authentication credentials

---

## Priority 2: SHOULD READ

1. **GitHub Actions Workflows** - .github/workflows/pr-quality-gate.yaml
2. **Error Classification Logic** - src/analyzer/error-classifier.ts
3. **Task Generation Patterns** - src/task-creator/task-generator.ts
4. **Rate Limiting Strategies** - Pub/Sub vs polling tradeoffs

---

## Priority 3: REFERENCE

1. **Cloud Build API Documentation** - Google Cloud official docs
2. **GitHub API Documentation** - Octokit references
3. **Logging Patterns** - Structured logging for monitoring
4. **Metrics Collection** - Success rate tracking

---

## Scope Boundaries

**IS responsible for**:
- Monitoring Cloud Build status (watch/poll)
- Fetching and parsing build logs
- AI-powered error analysis (Claude API)
- Classifying error types (lint/typecheck/test/build/deploy)
- Generating task files from templates
- Routing tasks to correct agents
- Committing tasks to .backlog/pending/
- Posting PR comments with failure context
- Rate limit handling

**NOT responsible for**:
- Fixing TypeScript errors → typescript-engineer
- Fixing React errors → react-engineer
- Fixing test failures → test-engineer
- Fixing deployment issues → devops
- Fixing database issues → database-engineer
- Quality review of fixes → quality-reviewer

---

## Quality Gates

**Before marking task complete**:

```bash
# In tools/cicd-monitor/
npm run lint
npm run typecheck
npm run build
npm test -- --coverage

# Integration test with real build (dry-run)
npm run cli -- watch --build-id=TEST_BUILD_ID --dry-run

# Test task generation (local only)
npm run cli -- analyze --build-id=TEST_BUILD_ID --create-tasks --dry-run
```

**Requirements**:
- All tests pass with >80% coverage
- TypeScript strict mode enabled
- No any types without justification
- CLI works in dry-run mode
- Error handling for all API calls
- Rate limit protection active
- Secrets never logged or exposed

---

## Architecture Overview

### CLI Tool Structure

```
tools/
└── cicd-monitor/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── README.md
    │
    ├── src/
    │   ├── index.ts                      # CLI entry point
    │   ├── config/
    │   │   ├── config.ts                 # Configuration loader
    │   │   └── types.ts                  # Config types
    │   │
    │   ├── monitor/
    │   │   ├── build-watcher.ts          # Watch build status (Pub/Sub or polling)
    │   │   ├── log-parser.ts             # Parse Cloud Build logs
    │   │   └── status-tracker.ts         # Track build state changes
    │   │
    │   ├── analyzer/
    │   │   ├── error-classifier.ts       # Classify error types
    │   │   ├── root-cause-analyzer.ts    # Claude-powered analysis
    │   │   ├── impact-assessor.ts        # Assess severity/priority
    │   │   └── file-extractor.ts         # Extract affected files from logs
    │   │
    │   ├── task-creator/
    │   │   ├── task-generator.ts         # Generate task markdown
    │   │   ├── agent-router.ts           # Route to correct agent
    │   │   └── template-engine.ts        # Fill task templates
    │   │
    │   ├── integrations/
    │   │   ├── cloudbuild-client.ts      # Cloud Build API wrapper
    │   │   ├── logging-client.ts         # Cloud Logging API wrapper
    │   │   ├── github-client.ts          # GitHub API (Octokit) wrapper
    │   │   └── claude-client.ts          # Claude API wrapper
    │   │
    │   └── utils/
    │       ├── logger.ts                 # Structured logging
    │       ├── rate-limiter.ts           # Rate limit utilities
    │       └── retry.ts                  # Retry logic with backoff
    │
    ├── templates/
    │   ├── lint-error-task.md            # Template for lint errors
    │   ├── typecheck-error-task.md       # Template for TypeScript errors
    │   ├── test-failure-task.md          # Template for test failures
    │   ├── build-failure-task.md         # Template for build errors
    │   └── deployment-error-task.md      # Template for deployment errors
    │
    └── test/
        ├── monitor/
        ├── analyzer/
        ├── task-creator/
        └── integrations/
```

---

## Dependencies

### Production Dependencies

```json
{
  "dependencies": {
    "@google-cloud/cloudbuild": "^5.3.1",
    "@google-cloud/logging": "^11.2.0",
    "@google-cloud/pubsub": "^4.8.0",
    "google-auth-library": "^9.15.0",

    "octokit": "^3.2.1",
    "@octokit/plugin-throttling": "^9.3.2",
    "js-base64": "^3.7.7",

    "@anthropic-ai/sdk": "^0.32.1",

    "commander": "^12.1.0",
    "chalk": "^5.3.0",
    "ora": "^8.1.1",
    "dotenv": "^16.4.5",

    "yaml": "^2.6.1",
    "zod": "^3.24.1",

    "winston": "^3.17.0",
    "p-limit": "^6.1.0",
    "p-retry": "^6.2.1"
  }
}
```

**Package Rationale**:

**Google Cloud**:
- `@google-cloud/cloudbuild` - Cloud Build API client (official)
- `@google-cloud/logging` - Fetch build logs from Cloud Logging
- `@google-cloud/pubsub` - Real-time build status notifications (preferred over polling)
- `google-auth-library` - Authentication helper (included with above)

**GitHub**:
- `octokit` - Official GitHub API SDK with TypeScript support
- `@octokit/plugin-throttling` - Automatic rate limit handling
- `js-base64` - Base64 encoding for file commits

**AI**:
- `@anthropic-ai/sdk` - Claude API for error analysis

**CLI**:
- `commander` - CLI argument parsing
- `chalk` - Terminal colors
- `ora` - Loading spinners
- `dotenv` - Environment variable loading

**Configuration**:
- `yaml` - Parse .cicd-monitor.config.yaml
- `zod` - Runtime type validation

**Utilities**:
- `winston` - Structured logging
- `p-limit` - Concurrency control
- `p-retry` - Retry logic with exponential backoff

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.17.6",
    "typescript": "^5.7.2",
    "tsx": "^4.19.2",

    "jest": "^29.7.0",
    "@types/jest": "^29.5.14",
    "ts-jest": "^29.2.5",

    "eslint": "^9.15.0",
    "@typescript-eslint/parser": "^8.14.0",
    "@typescript-eslint/eslint-plugin": "^8.14.0",

    "prettier": "^3.3.3",

    "@octokit/types": "^13.6.1"
  }
}
```

---

## Secret Manager Configuration

### Secrets Required

All secrets should be stored in **Google Secret Manager** and made available to Cloud Build via `availableSecrets` configuration.

#### 1. **GITHUB_TOKEN**

**Purpose**: Authenticate with GitHub API for PR comments and file commits

**Scopes Required**:
- `repo` (full repository access) OR
- `public_repo` (public repositories only)

**How to Create**:
```bash
# 1. Create Personal Access Token on GitHub
# Settings → Developer settings → Personal access tokens → Fine-grained tokens

# 2. Store in Secret Manager
gcloud secrets create cicd-monitor-github-token \
  --data-file=- \
  --project=zabicekiosk
# Paste token when prompted

# 3. Grant access to Cloud Build service account
gcloud secrets add-iam-policy-binding cicd-monitor-github-token \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

**Environment Variable**: `GITHUB_TOKEN`

**Required By**:
- `src/integrations/github-client.ts` - Octokit initialization
- GitHub Actions workflows (automatically available as `${{ secrets.GITHUB_TOKEN }}`)

---

#### 2. **ANTHROPIC_API_KEY**

**Purpose**: Authenticate with Claude API for AI-powered error analysis

**How to Create**:
```bash
# 1. Get API key from https://console.anthropic.com/

# 2. Store in Secret Manager
gcloud secrets create cicd-monitor-anthropic-api-key \
  --data-file=- \
  --project=zabicekiosk
# Paste API key when prompted

# 3. Grant access to Cloud Build service account
gcloud secrets add-iam-policy-binding cicd-monitor-anthropic-api-key \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

**Environment Variable**: `ANTHROPIC_API_KEY`

**Required By**:
- `src/analyzer/root-cause-analyzer.ts` - Claude API client
- `src/integrations/claude-client.ts`

---

#### 3. **GOOGLE_APPLICATION_CREDENTIALS** (Optional)

**Purpose**: Explicit service account credentials for Cloud Build/Logging API

**Note**: Usually NOT needed in Cloud Build (uses Application Default Credentials automatically)

**When Needed**:
- Running CLI locally during development
- Running in non-GCP environments

**How to Create**:
```bash
# 1. Create service account
gcloud iam service-accounts create cicd-monitor \
  --display-name="CI/CD Monitor Service Account" \
  --project=zabicekiosk

# 2. Grant permissions
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.viewer"

gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/logging.viewer"

# 3. Download key (for local dev only)
gcloud iam service-accounts keys create cicd-monitor-key.json \
  --iam-account=cicd-monitor@zabicekiosk.iam.gserviceaccount.com \
  --project=zabicekiosk

# 4. Store in Secret Manager (optional)
gcloud secrets create cicd-monitor-gcp-credentials \
  --data-file=cicd-monitor-key.json \
  --project=zabicekiosk
```

**Environment Variable**: `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`

**Required By**:
- `src/integrations/cloudbuild-client.ts`
- `src/integrations/logging-client.ts`

---

### Cloud Build Integration

**Update cloudbuild.yaml**:

```yaml
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/token-secret/versions/latest
      env: 'TOKEN_SECRET'
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-github-token/versions/latest
      env: 'GITHUB_TOKEN'
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-anthropic-api-key/versions/latest
      env: 'ANTHROPIC_API_KEY'

steps:
  # ... existing steps ...

  # Run on failure (always executed even if previous steps fail)
  - id: cicd-monitor-on-failure
    name: node:20
    entrypoint: bash
    secretEnv: ['GITHUB_TOKEN', 'ANTHROPIC_API_KEY']
    args:
      - -c
      - |
        # Check if any previous step failed
        if [ "$BUILD_STATUS" != "SUCCESS" ]; then
          echo "🔍 Build failed, analyzing with cicd-monitor..."

          # Install CLI tool
          npm install -g zabice-cicd-monitor

          # Run analysis and create tasks
          zabice-cicd-monitor analyze \
            --build-id=$BUILD_ID \
            --project-id=$PROJECT_ID \
            --create-tasks \
            --notify \
            --branch=$BRANCH_NAME
        else
          echo "✅ Build succeeded, skipping cicd-monitor"
        fi
    waitFor: ['-']  # Run even if previous steps failed
```

---

### GitHub Actions Integration

**Create .github/workflows/pr-quality-gate.yaml**:

```yaml
name: PR Quality Gate with Auto-Fix

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Trigger Cloud Build
        id: cloudbuild
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
        run: |
          # Submit build to Cloud Build
          BUILD_ID=$(gcloud builds submit \
            --config=cloudbuild.yaml \
            --substitutions=BRANCH_NAME=${{ github.head_ref }},_PR_NUMBER=${{ github.event.pull_request.number }} \
            --format='value(id)' \
            --project=zabicekiosk)

          echo "build_id=$BUILD_ID" >> $GITHUB_OUTPUT
          echo "🚀 Cloud Build triggered: $BUILD_ID"

      - name: Install CI/CD Monitor
        run: npm install -g zabice-cicd-monitor

      - name: Watch Build and Auto-Create Tasks on Failure
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
        run: |
          zabice-cicd-monitor watch \
            --build-id=${{ steps.cloudbuild.outputs.build_id }} \
            --project-id=zabicekiosk \
            --pr-number=${{ github.event.pull_request.number }} \
            --branch=${{ github.head_ref }} \
            --auto-fix-enabled \
            --notify
```

---

## Configuration File

**Create .cicd-monitor.config.yaml** in repository root:

```yaml
# CI/CD Monitor Configuration

monitor:
  # Mode: watch (real-time) | analyze (post-mortem) | disabled
  mode: watch

  # Use Pub/Sub for real-time notifications (recommended)
  use_pubsub: true
  pubsub_subscription: cicd-monitor-builds

  # Fallback polling settings (if Pub/Sub not available)
  polling:
    initial_interval_ms: 5000
    max_interval_ms: 30000
    backoff_multiplier: 1.5

auto_fix:
  enabled: true
  max_retries: 3

  # Create draft PR with fixes (future feature)
  create_fix_pr: false

notifications:
  pr_comment: true
  slack: false  # Future integration
  email: false  # Future integration

analysis:
  # Claude model for error analysis
  ai_model: claude-3-5-sonnet-20241022

  # Maximum number of source files to include in analysis context
  max_context_files: 10

  # Temperature for Claude (0.0 = deterministic, 1.0 = creative)
  temperature: 0.0

  # Skip AI analysis for known error patterns (faster)
  skip_known_patterns: true

task_creation:
  enabled: true

  # Priority assignment rules
  priority_rules:
    deployment-error: blocker
    migration-error: critical
    build-error: critical
    test-failure: high
    typecheck-error: high
    lint-error: high

  # Agent routing rules
  agent_routing:
    lint-error:
      services: typescript-engineer
      web: react-engineer

    typecheck-error:
      services: typescript-engineer
      web: react-engineer

    test-failure:
      default: test-engineer

    build-error:
      services: typescript-engineer
      web: react-engineer

    deployment-error:
      default: devops

    migration-error:
      default: database-engineer

  # Commit settings
  commit:
    branch: main
    author_name: CI/CD Monitor Bot
    author_email: cicd-monitor@zabicekiosk.app
    message_template: "task: auto-create {taskId} from {errorType} in build {buildId}"

rate_limits:
  # Maximum API calls per minute
  github_api_per_minute: 30
  cloudbuild_api_per_minute: 60
  claude_api_per_minute: 10

  # Maximum tasks created per PR (prevent spam)
  max_tasks_per_pr: 5

  # Minimum time between analyses of same build (seconds)
  analysis_cooldown_seconds: 300

logging:
  level: info  # debug | info | warn | error
  format: json  # json | pretty

  # Log to Cloud Logging (in addition to console)
  cloud_logging: true
```

---

## Error Classification Rules

**Map Cloud Build step failures to error types and agents**:

| Step ID Pattern | Error Type | Agent | Priority |
|-----------------|------------|-------|----------|
| `quality-gate-*-lint` | lint-error | typescript-engineer / react-engineer | high |
| `quality-gate-*-typecheck` | typecheck-error | typescript-engineer / react-engineer | high |
| `quality-gate-*-test` | test-failure | test-engineer | high |
| `quality-gate-*-build` | build-error | typescript-engineer / react-engineer | critical |
| `verify-database-*` | migration-error | database-engineer | critical |
| `migrate-database-*` | migration-error | database-engineer | critical |
| `build-and-deploy-*` | deployment-error | devops | blocker |
| `deploy-web` | deployment-error | devops | blocker |

**Project Detection** (for agent routing):
- `services/core-api` → typescript-engineer
- `services/booking-api` → typescript-engineer
- `web/admin-portal` → react-engineer
- `web/kiosk-pwa` → react-engineer
- `web/parent-web` → react-engineer

---

## CLI Commands

### `watch` - Real-time monitoring

```bash
zabice-cicd-monitor watch \
  --build-id=abc123 \
  --project-id=zabicekiosk \
  --pr-number=42 \
  --branch=feature/foo \
  --auto-fix-enabled \
  --notify
```

**Options**:
- `--build-id` (required) - Cloud Build ID
- `--project-id` (required) - GCP project ID
- `--pr-number` (optional) - GitHub PR number for comments
- `--branch` (optional) - Git branch name
- `--auto-fix-enabled` (optional) - Create tasks automatically
- `--notify` (optional) - Post PR comments
- `--dry-run` (optional) - Don't commit tasks or post comments

**Behavior**:
1. Subscribe to build status updates (Pub/Sub or polling)
2. Wait for build to complete
3. If failed: fetch logs, analyze, create tasks, post comment
4. If success: exit quietly

---

### `analyze` - Post-mortem analysis

```bash
zabice-cicd-monitor analyze \
  --build-id=abc123 \
  --project-id=zabicekiosk \
  --create-tasks \
  --notify
```

**Options**:
- `--build-id` (required) - Cloud Build ID
- `--project-id` (required) - GCP project ID
- `--create-tasks` (optional) - Generate task files
- `--notify` (optional) - Post PR comments
- `--dry-run` (optional) - Don't commit tasks or post comments

**Behavior**:
1. Fetch build details and logs
2. Analyze failures
3. Create tasks if requested
4. Post comments if requested

---

### `list` - List recent builds

```bash
zabice-cicd-monitor list \
  --project-id=zabicekiosk \
  --status=failed \
  --last=10
```

**Options**:
- `--project-id` (required) - GCP project ID
- `--status` (optional) - Filter by status (failed/success/working)
- `--last` (optional) - Number of builds to show (default: 10)

---

### `tasks` - Show tasks for build

```bash
zabice-cicd-monitor tasks \
  --build-id=abc123
```

**Options**:
- `--build-id` (required) - Cloud Build ID

**Behavior**:
- Show all tasks created for a specific build

---

## Integration Points

**Receives triggers from**:
- Cloud Build (via Pub/Sub or polling)
- GitHub Actions (explicit watch command)

**Creates work for**:
- `typescript-engineer` - Fix TypeScript errors
- `react-engineer` - Fix React errors
- `test-engineer` - Fix test failures
- `devops` - Fix deployment issues
- `database-engineer` - Fix migration issues

**Collaborates with**:
- `task-engineer` - For task redesign if needed
- `quality-reviewer` - Tasks still need review after fix

---

## Anti-Patterns

**DON'T**:
- ❌ Poll Cloud Build API every second - Use Pub/Sub
- ❌ Create tasks without AI analysis - Always analyze first
- ❌ Hardcode secrets - Use Secret Manager
- ❌ Commit to wrong branch - Respect branch parameter
- ❌ Spam PRs with comments - Use update-or-create pattern
- ❌ Create duplicate tasks - Check for existing tasks first
- ❌ Route to wrong agent - Follow agent routing rules
- ❌ Ignore rate limits - Implement throttling

**DO**:
- ✅ Use Pub/Sub for real-time notifications
- ✅ Implement exponential backoff for retries
- ✅ Cache results when appropriate
- ✅ Log all operations for debugging
- ✅ Test in dry-run mode first
- ✅ Validate configuration on startup
- ✅ Handle API errors gracefully

---

**Last Updated**: 2025-11-03
**Document Owner**: cicd-monitor agent
