---
id: cicd-001
title: Implement complete cicd-monitor system - end-to-end
agent: typescript-engineer + devops
priority: critical
status: pending
phase: complete-implementation
created: 2025-11-03
dependencies: []
---

# Task: Implement Complete cicd-monitor System (End-to-End)

## Context

Build a fully functional CI/CD monitoring system that automatically detects build failures, analyzes them with AI, creates tasks for agents, and integrates seamlessly into Cloud Build pipeline.

**Goal**: Working pipeline where build failures automatically create tasks in `.backlog/pending/` without manual intervention.

**Timeline**: 1-2 weeks for full implementation

---

## Phase 1: Infrastructure Setup (devops)

### 1.1. Create Service Account

```bash
# Create dedicated service account
gcloud iam service-accounts create cicd-monitor \
  --display-name="CI/CD Monitor Service Account" \
  --description="Service account for cicd-monitor tool" \
  --project=zabicekiosk
```

### 1.2. Grant IAM Permissions (Cloud Admin Mode)

**Enhanced permissions for resource provisioning, configuration, and infrastructure management**:

```bash
# Cloud Build - Full control (read/write builds, trigger builds)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

# Cloud Logging - Full access (read logs, write logs, configure log sinks)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/logging.admin"

# Pub/Sub - Full control (create topics, subscriptions, publish, subscribe)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/pubsub.admin"

# Secret Manager - Admin (create secrets, manage versions, grant access)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/secretmanager.admin"

# IAM - Security Admin (grant roles, manage service accounts)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/iam.securityAdmin"

# Service Account - Admin (create service accounts, manage keys)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountAdmin"

# Cloud Run - Admin (deploy services, manage revisions)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Compute - Instance Admin (for infrastructure provisioning)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"

# Storage - Admin (manage Cloud Storage buckets)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Monitoring - Metric Writer (write custom metrics)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/monitoring.metricWriter"

echo "✅ cicd-monitor service account has Cloud Admin permissions"
```

### 1.3. Create Pub/Sub Subscription

```bash
# Create subscription for Cloud Build events
gcloud pubsub subscriptions create cicd-monitor-builds \
  --topic=cloud-builds \
  --ack-deadline=60 \
  --message-retention-duration=7d \
  --project=zabicekiosk

# Grant service account access
gcloud pubsub subscriptions add-iam-policy-binding cicd-monitor-builds \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber" \
  --project=zabicekiosk
```

### 1.4. Create Secrets in Secret Manager

**⚠️ REQUIRED: You must fill these secrets before pipeline will work!**

#### Secret 1: GitHub Token

**Steps to create**:
1. Go to: https://github.com/settings/tokens/new?scopes=repo&description=cicd-monitor
2. Select scope: ✅ **repo** (Full control of private repositories)
3. Generate token
4. Copy token (starts with `ghp_`)

**Store in Secret Manager**:
```bash
# Create secret (paste token when prompted)
echo "ghp_YOUR_TOKEN_HERE" | gcloud secrets create cicd-monitor-github-token \
  --data-file=- \
  --replication-policy="automatic" \
  --project=zabicekiosk

# Grant access to Cloud Build service account
gcloud secrets add-iam-policy-binding cicd-monitor-github-token \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk

# Grant access to cicd-monitor service account
gcloud secrets add-iam-policy-binding cicd-monitor-github-token \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

**🔗 Create token here**: https://github.com/settings/tokens/new?scopes=repo&description=cicd-monitor

---

#### Secret 2: Claude API Key

**Steps to create**:
1. Go to: https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Name: `cicd-monitor-zabicekiosk`
4. Copy key (starts with `sk-ant-`)

**Store in Secret Manager**:
```bash
# Create secret (paste API key when prompted)
echo "sk-ant-YOUR_KEY_HERE" | gcloud secrets create cicd-monitor-anthropic-api-key \
  --data-file=- \
  --replication-policy="automatic" \
  --project=zabicekiosk

# Grant access to Cloud Build service account
gcloud secrets add-iam-policy-binding cicd-monitor-anthropic-api-key \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk

# Grant access to cicd-monitor service account
gcloud secrets add-iam-policy-binding cicd-monitor-anthropic-api-key \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

**🔗 Create key here**: https://console.anthropic.com/settings/keys

---

#### Secret 3: GCP Service Account Key (Cloud Admin)

**Purpose**: Allow cicd-monitor agent to provision GCP resources, configure infrastructure, and read logs.

**Steps to create**:

1. **Create service account key** (already created in step 1.1):
   ```bash
   gcloud iam service-accounts keys create cicd-monitor-gcp-key.json \
     --iam-account=cicd-monitor@zabicekiosk.iam.gserviceaccount.com \
     --project=zabicekiosk
   ```

2. **Store in Secret Manager**:
   ```bash
   # Upload service account key to Secret Manager
   gcloud secrets create cicd-monitor-gcp-credentials \
     --data-file=cicd-monitor-gcp-key.json \
     --replication-policy="automatic" \
     --project=zabicekiosk

   # Grant access to Cloud Build service account
   gcloud secrets add-iam-policy-binding cicd-monitor-gcp-credentials \
     --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=zabicekiosk

   # Clean up local key file (IMPORTANT!)
   shred -u cicd-monitor-gcp-key.json
   ```

3. **Verify**:
   ```bash
   gcloud secrets versions access latest --secret=cicd-monitor-gcp-credentials --project=zabicekiosk > /tmp/test-key.json
   gcloud auth activate-service-account --key-file=/tmp/test-key.json
   gcloud projects list  # Should show zabicekiosk project
   shred -u /tmp/test-key.json
   ```

**⚠️ USER ACTION REQUIRED**:

You need to manually upload the service account key to Secret Manager via GCP Console:

1. Go to: https://console.cloud.google.com/security/secret-manager?project=zabicekiosk
2. Click "CREATE SECRET"
3. Name: `cicd-monitor-gcp-credentials`
4. Secret value: Paste the entire JSON content from the service account key file
5. Click "CREATE SECRET"

**Alternative: Upload via gcloud (if you have the key)**:
```bash
# If you have the service account key locally
gcloud secrets create cicd-monitor-gcp-credentials \
  --data-file=/path/to/cicd-monitor-key.json \
  --project=zabicekiosk

# Grant access
gcloud secrets add-iam-policy-binding cicd-monitor-gcp-credentials \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

---

### 1.5. Provision Infrastructure Resources

**Agent can now provision infrastructure automatically**:

```bash
# Create Pub/Sub topic for build events (if not exists)
gcloud pubsub topics create cloud-builds --project=zabicekiosk || echo "Topic already exists"

# Create subscription for cicd-monitor
gcloud pubsub subscriptions create cicd-monitor-builds \
  --topic=cloud-builds \
  --ack-deadline=60 \
  --message-retention-duration=7d \
  --project=zabicekiosk || echo "Subscription already exists"

# Create log sink for build failures (optional)
gcloud logging sinks create cicd-monitor-build-failures \
  pubsub.googleapis.com/projects/zabicekiosk/topics/build-failures \
  --log-filter='resource.type="build" AND severity>=ERROR' \
  --project=zabicekiosk || echo "Sink already exists"

# Grant Pub/Sub publisher to log sink service account
LOG_SINK_SA=$(gcloud logging sinks describe cicd-monitor-build-failures --format='value(writerIdentity)' --project=zabicekiosk)
gcloud pubsub topics add-iam-policy-binding build-failures \
  --member="$LOG_SINK_SA" \
  --role="roles/pubsub.publisher" \
  --project=zabicekiosk || true

echo "✅ Infrastructure resources provisioned"
```

### 1.6. Download Service Account Key (Local Dev)

```bash
# For local development only
gcloud iam service-accounts keys create tools/cicd-monitor/cicd-monitor-key.json \
  --iam-account=cicd-monitor@zabicekiosk.iam.gserviceaccount.com \
  --project=zabicekiosk

# Verify key is ignored by git
grep -q "cicd-monitor-key.json" .gitignore || echo "tools/cicd-monitor/cicd-monitor-key.json" >> .gitignore

echo "✅ Service account key downloaded for local development"
```

### 1.7. Verify Secrets and Resources

```bash
# Verify all secrets exist
gcloud secrets list --project=zabicekiosk | grep cicd-monitor

# Test access (should not error)
gcloud secrets versions access latest --secret=cicd-monitor-github-token --project=zabicekiosk > /dev/null && echo "✅ GitHub token accessible"
gcloud secrets versions access latest --secret=cicd-monitor-anthropic-api-key --project=zabicekiosk > /dev/null && echo "✅ Claude API key accessible"
gcloud secrets versions access latest --secret=cicd-monitor-gcp-credentials --project=zabicekiosk > /dev/null && echo "✅ GCP credentials accessible"

# Test Pub/Sub resources
gcloud pubsub topics describe cloud-builds --project=zabicekiosk
gcloud pubsub subscriptions describe cicd-monitor-builds --project=zabicekiosk

# Verify service account permissions
gcloud projects get-iam-policy zabicekiosk \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --format="table(bindings.role)"

echo "✅ All secrets and resources verified"
```

---

## Phase 2: CLI Tool Implementation (typescript-engineer)

### 2.1. Setup Project Structure

```bash
cd tools/cicd-monitor

# Already created:
# - package.json
# - tsconfig.json
# - .env.example
# - README.md

# Create directories
mkdir -p src/{config,monitor,analyzer,task-creator,integrations,utils}
mkdir -p templates
mkdir -p test/{config,monitor,analyzer,task-creator,integrations}
```

### 2.2. Create Configuration Files

**Git Ignore**:
```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.log
coverage/
.DS_Store
cicd-monitor-key.json
EOF
```

**ESLint**:
```bash
cat > .eslintrc.json << 'EOF'
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
EOF
```

**Prettier**:
```bash
cat > .prettierrc.json << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
EOF
```

**Jest Config**:
```bash
cat > jest.config.js << 'EOF'
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/index.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
EOF
```

### 2.3. Install Dependencies

```bash
npm install
```

### 2.4. Implement Core Modules

**Follow the detailed implementation from**:
- `docs/agents/cicd-monitor.md` - Complete specification
- `docs/architecture/cicd-monitor-system.md` - Architecture details

**Implementation Order**:

1. **Config System** (`src/config/`)
   - `types.ts` - Zod schemas for config validation
   - `config.ts` - Load and validate .cicd-monitor.config.yaml

2. **Utilities** (`src/utils/`)
   - `logger.ts` - Winston structured logging
   - `rate-limiter.ts` - p-limit wrappers
   - `retry.ts` - p-retry wrappers

3. **API Integrations** (`src/integrations/`)
   - `cloudbuild-client.ts` - Cloud Build API (getBuild, waitForBuild, listBuilds)
   - `logging-client.ts` - Cloud Logging API (fetchBuildLogs, fetchErrorLogs)
   - `github-client.ts` - GitHub API (getPRContext, postComment, commitFile)
   - `claude-client.ts` - Claude API (analyzeError, buildPrompt, parseResponse)

4. **Analyzer** (`src/analyzer/`)
   - `error-classifier.ts` - Classify error by step ID
   - `root-cause-analyzer.ts` - AI analysis or heuristics
   - `file-extractor.ts` - Extract file paths from logs
   - `impact-assessor.ts` - Assess risk/priority

5. **Task Creator** (`src/task-creator/`)
   - `template-engine.ts` - Render markdown templates
   - `agent-router.ts` - Route to correct agent
   - `task-generator.ts` - Generate task files

6. **CLI** (`src/index.ts`)
   - Commander setup with 4 commands (watch, analyze, list, tasks)
   - Wire all modules together

### 2.5. Create Task Templates

**Create 5 templates in `templates/`**:

1. `lint-error-task.md` - For ESLint errors
2. `typecheck-error-task.md` - For TypeScript errors
3. `test-failure-task.md` - For Jest test failures
4. `build-failure-task.md` - For build errors
5. `deployment-error-task.md` - For deployment errors

**Template format** (see `docs/agents/cicd-monitor.md` for full templates)

### 2.6. Write Tests

```bash
# Unit tests for each module
npm test

# Coverage report
npm run test:coverage

# Target: >80% coverage
```

### 2.7. Build and Test Locally

```bash
# Build
npm run build

# Test CLI
npm run cli -- --help
npm run cli -- list --project-id=zabicekiosk --last=5

# Test with real build (dry run)
npm run cli -- analyze \
  --build-id=<REAL_BUILD_ID> \
  --project-id=zabicekiosk \
  --dry-run
```

---

## Phase 3: Pipeline Integration (devops)

### 3.1. Update cloudbuild.yaml

Add to end of `cloudbuild.yaml`:

```yaml
availableSecrets:
  secretManager:
    # Existing secrets
    - versionName: projects/$PROJECT_ID/secrets/token-secret/versions/latest
      env: 'TOKEN_SECRET'

    # NEW: cicd-monitor secrets
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-github-token/versions/latest
      env: 'GITHUB_TOKEN'
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-anthropic-api-key/versions/latest
      env: 'ANTHROPIC_API_KEY'
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-gcp-credentials/versions/latest
      env: 'GCP_SERVICE_ACCOUNT_KEY'

steps:
  # ... all existing steps ...

  # ============================================================
  # CI/CD MONITOR - Auto-create tasks on failure
  # ============================================================
  - id: cicd-monitor-on-failure
    name: node:20
    entrypoint: bash
    secretEnv: ['GITHUB_TOKEN', 'ANTHROPIC_API_KEY', 'GCP_SERVICE_ACCOUNT_KEY']
    env:
      - 'GOOGLE_CLOUD_PROJECT=$PROJECT_ID'
    args:
      - -c
      - |
        set -e

        echo "🔍 CI/CD Monitor: Checking build status..."

        # Setup GCP authentication (for resource provisioning)
        echo "$GCP_SERVICE_ACCOUNT_KEY" > /tmp/gcp-key.json
        export GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcp-key.json
        gcloud auth activate-service-account --key-file=/tmp/gcp-key.json

        # Verify agent can provision resources
        echo "🔧 Verifying Cloud Admin access..."
        gcloud projects describe $PROJECT_ID --format='value(projectId)' || echo "Warning: Limited GCP access"

        # Install cicd-monitor from source
        cd /workspace/tools/cicd-monitor
        npm install --production
        npm run build
        npm link

        cd /workspace

        # Run analysis (with Cloud Admin capabilities)
        echo "🤖 Analyzing build $BUILD_ID..."
        zabice-cicd-monitor analyze \
          --build-id="$BUILD_ID" \
          --project-id="$PROJECT_ID" \
          --pr-number="${_PR_NUMBER:-}" \
          --branch="${_BRANCH_NAME:-}" \
          --create-tasks \
          --notify \
          --provision-resources || echo "⚠️  cicd-monitor failed, continuing..."

        # Clean up credentials
        shred -u /tmp/gcp-key.json

        echo "✅ CI/CD Monitor completed"

    # CRITICAL: Run even if previous steps failed
    waitFor: ['-']

# Add substitution variables
substitutions:
  _REGION: europe-west3
  _FIRESTORE_DATABASE_ID: "zabicedb"
  _PR_NUMBER: ""
  _BRANCH_NAME: ""
```

### 3.2. Test Integration

**Test 1: Trigger Failed Build**

```bash
# Create test branch with intentional error
git checkout -b test-cicd-monitor-e2e

# Add lint error to services/core-api
echo "const unused = 'trigger-lint-error';" >> services/core-api/src/index.ts

git add services/core-api/src/index.ts
git commit -m "test: trigger cicd-monitor with lint error"
git push origin test-cicd-monitor-e2e

# Create PR
gh pr create \
  --title "Test: CI/CD Monitor E2E" \
  --body "Testing cicd-monitor system end-to-end"
```

**Test 2: Monitor Build**

```bash
# Watch build progress
gcloud builds list --ongoing --project=zabicekiosk

# Get build ID
BUILD_ID=$(gcloud builds list --limit=1 --format='value(id)' --project=zabicekiosk)

# View logs in real-time
gcloud builds log $BUILD_ID --stream --project=zabicekiosk
```

**Test 3: Verify Task Created**

```bash
# After build completes, check for task
ls -la .backlog/pending/auto-*

# View task content
cat .backlog/pending/auto-lint-*.md

# Check PR comment
gh pr view --comments

# Verify git commit
git log --oneline -n 5
```

### 3.3. Verify Success Criteria

After test build fails:

- [ ] Task file created in `.backlog/pending/`
- [ ] Task format matches template
- [ ] Correct agent assigned (typescript-engineer for lint-error in services)
- [ ] PR comment posted with error details
- [ ] Git commit has correct message format
- [ ] Time from build failure to task creation < 2 minutes

---

## Acceptance Criteria

**BINARY: YES or NO (no partial completion)**

### Infrastructure (devops)

- [ ] Service account `cicd-monitor@zabicekiosk.iam.gserviceaccount.com` created
- [ ] IAM permissions granted (Cloud Admin roles):
  - [ ] cloudbuild.builds.editor
  - [ ] logging.admin
  - [ ] pubsub.admin
  - [ ] secretmanager.admin
  - [ ] iam.securityAdmin
  - [ ] iam.serviceAccountAdmin
  - [ ] run.admin
  - [ ] compute.instanceAdmin.v1
  - [ ] storage.admin
  - [ ] monitoring.metricWriter
- [ ] Pub/Sub subscription `cicd-monitor-builds` created
- [ ] Infrastructure resources provisioned (topics, subscriptions, log sinks)
- [ ] Secret `cicd-monitor-github-token` created and accessible
- [ ] Secret `cicd-monitor-anthropic-api-key` created and accessible
- [ ] Secret `cicd-monitor-gcp-credentials` created and accessible (Service Account Key)
- [ ] All 3 secrets accessible by Cloud Build SA (120039745928@cloudbuild)
- [ ] Service account key downloaded for local dev

### CLI Tool (typescript-engineer)

- [ ] All dependencies installed (`npm install` succeeds)
- [ ] Quality gates pass:
  ```bash
  npm run lint        # ✅ No errors
  npm run typecheck   # ✅ No errors
  npm run build       # ✅ Build succeeds
  npm test            # ✅ All tests pass (>80% coverage)
  ```
- [ ] CLI commands work:
  ```bash
  npm run cli -- --help
  npm run cli -- list --project-id=zabicekiosk --last=5
  npm run cli -- analyze --build-id=<ID> --project-id=zabicekiosk --dry-run
  ```
- [ ] All modules implemented (config, integrations, analyzer, task-creator)
- [ ] All 5 task templates created

### Pipeline Integration (devops)

- [ ] `cloudbuild.yaml` updated with cicd-monitor step
- [ ] All 3 secrets passed via `secretEnv` and `availableSecrets`
- [ ] GCP credentials activated in step for Cloud Admin access
- [ ] Step configured with `waitFor: ['-']`
- [ ] Substitution variables added (_PR_NUMBER, _BRANCH_NAME)
- [ ] `--provision-resources` flag added to CLI command

### End-to-End Test

- [ ] Test PR created with intentional error
- [ ] Build triggers and fails on quality gate
- [ ] cicd-monitor step runs (check logs)
- [ ] Task file created in `.backlog/pending/auto-*`
- [ ] Task has correct format and content
- [ ] Correct agent assigned
- [ ] PR comment posted with error details
- [ ] Git commit created with task file
- [ ] Time to task creation < 2 minutes

### Production Readiness

- [ ] Documentation updated (`docs/infrastructure/cicd-monitor-setup.md`)
- [ ] No secrets logged or exposed
- [ ] Rate limiting active for all APIs
- [ ] Error handling for all API calls
- [ ] Monitoring commands work (view logs, check errors)
- [ ] Rollback plan documented

---

## Secrets Checklist

**⚠️ MUST BE FILLED BEFORE SYSTEM WORKS:**

### 1. GitHub Token

**Create here**: https://github.com/settings/tokens/new?scopes=repo&description=cicd-monitor

**Requirements**:
- Scope: ✅ **repo** (full repository access)
- Description: `cicd-monitor-zabicekiosk`

**Store in Secret Manager**:
```bash
echo "ghp_YOUR_TOKEN_HERE" | gcloud secrets create cicd-monitor-github-token \
  --data-file=- --project=zabicekiosk

# Grant access to Cloud Build
gcloud secrets add-iam-policy-binding cicd-monitor-github-token \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

**Verify**:
```bash
gcloud secrets versions access latest --secret=cicd-monitor-github-token --project=zabicekiosk
```

---

### 2. Claude API Key

**Create here**: https://console.anthropic.com/settings/keys

**Requirements**:
- Name: `cicd-monitor-zabicekiosk`
- Copy the key (starts with `sk-ant-`)

**Store in Secret Manager**:
```bash
echo "sk-ant-YOUR_KEY_HERE" | gcloud secrets create cicd-monitor-anthropic-api-key \
  --data-file=- --project=zabicekiosk

# Grant access to Cloud Build
gcloud secrets add-iam-policy-binding cicd-monitor-anthropic-api-key \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

**Verify**:
```bash
gcloud secrets versions access latest --secret=cicd-monitor-anthropic-api-key --project=zabicekiosk
```

---

### 3. GCP Service Account Key (Cloud Admin)

**Purpose**: Allows cicd-monitor agent to provision GCP resources, configure infrastructure, and read infrastructure logs.

**⚠️ USER ACTION REQUIRED**:

You need to manually create and upload the service account key to Secret Manager.

**Option A: Via GCP Console (Recommended)**

1. **Create Service Account Key**:
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=zabicekiosk
   - Find service account: `cicd-monitor@zabicekiosk.iam.gserviceaccount.com`
   - Click "KEYS" tab
   - Click "ADD KEY" → "Create new key" → "JSON"
   - Download the JSON key file

2. **Upload to Secret Manager**:
   - Go to: https://console.cloud.google.com/security/secret-manager?project=zabicekiosk
   - Click "CREATE SECRET"
   - Name: `cicd-monitor-gcp-credentials`
   - Secret value: Paste the entire JSON content from the downloaded key file
   - Click "CREATE SECRET"

3. **Grant Access**:
   ```bash
   gcloud secrets add-iam-policy-binding cicd-monitor-gcp-credentials \
     --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=zabicekiosk
   ```

**Option B: Via gcloud CLI**

```bash
# 1. Create service account key
gcloud iam service-accounts keys create /tmp/cicd-monitor-key.json \
  --iam-account=cicd-monitor@zabicekiosk.iam.gserviceaccount.com \
  --project=zabicekiosk

# 2. Upload to Secret Manager
gcloud secrets create cicd-monitor-gcp-credentials \
  --data-file=/tmp/cicd-monitor-key.json \
  --replication-policy="automatic" \
  --project=zabicekiosk

# 3. Grant access to Cloud Build
gcloud secrets add-iam-policy-binding cicd-monitor-gcp-credentials \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk

# 4. Clean up (IMPORTANT!)
shred -u /tmp/cicd-monitor-key.json
```

**Verify**:
```bash
# Check secret exists
gcloud secrets describe cicd-monitor-gcp-credentials --project=zabicekiosk

# Test authentication
gcloud secrets versions access latest --secret=cicd-monitor-gcp-credentials --project=zabicekiosk > /tmp/test-key.json
gcloud auth activate-service-account --key-file=/tmp/test-key.json
gcloud projects describe zabicekiosk --format='value(projectId)'
shred -u /tmp/test-key.json
```

**🔗 Create key here**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=zabicekiosk

---

## Quick Start Commands

```bash
# Phase 1: Infrastructure (devops)
cd /home/user/zabicekiosk
# Run all gcloud commands from section "Phase 1"
# ⚠️ Fill secrets manually (see Secrets Checklist)

# Phase 2: CLI Tool (typescript-engineer)
cd tools/cicd-monitor
npm install
# Implement all modules (see Phase 2.4)
npm run build
npm test
npm run cli -- list --project-id=zabicekiosk --last=5

# Phase 3: Pipeline Integration (devops)
# Update cloudbuild.yaml (see Phase 3.1)
git add cloudbuild.yaml tools/cicd-monitor
git commit -m "feat: integrate cicd-monitor into pipeline"
git push

# Phase 4: Test E2E
# Create test PR with error (see Phase 3.2)
# Verify task created and PR commented
```

---

## Monitoring

```bash
# View recent builds
gcloud builds list --limit=10 --project=zabicekiosk

# View cicd-monitor logs
BUILD_ID=<your-build-id>
gcloud builds log $BUILD_ID --project=zabicekiosk | grep -A 100 "CI/CD Monitor"

# View errors
gcloud logging read "resource.type=build AND textPayload:\"cicd-monitor\" AND severity>=ERROR" \
  --limit=50 \
  --project=zabicekiosk

# List auto-created tasks
ls -la .backlog/pending/auto-*
```

---

## Troubleshooting

### Issue: cicd-monitor step fails with "GitHub token not found"

**Solution**:
```bash
# Verify secret exists
gcloud secrets describe cicd-monitor-github-token --project=zabicekiosk

# Verify Cloud Build has access
gcloud secrets get-iam-policy cicd-monitor-github-token --project=zabicekiosk

# Re-grant if needed
gcloud secrets add-iam-policy-binding cicd-monitor-github-token \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

### Issue: Tasks not created

**Solution**:
```bash
# Check cicd-monitor logs for errors
gcloud builds log $BUILD_ID | grep -A 50 "cicd-monitor"

# Test locally
cd tools/cicd-monitor
npm run cli -- analyze --build-id=$BUILD_ID --project-id=zabicekiosk --dry-run
```

### Issue: Wrong agent assigned

**Solution**:
- Check `.cicd-monitor.config.yaml` routing rules
- Review Claude analysis confidence (should be >70% for AI routing)
- Check error classification logic in `src/analyzer/error-classifier.ts`

---

## References

- **Agent Manifest**: `docs/agents/cicd-monitor.md`
- **Architecture**: `docs/architecture/cicd-monitor-system.md`
- **Config**: `.cicd-monitor.config.yaml`
- **Package**: `tools/cicd-monitor/package.json`

---

## Timeline

- **Week 1**: Infrastructure + CLI skeleton (Phase 1 + Phase 2.1-2.3)
- **Week 2**: Core implementation (Phase 2.4-2.7)
- **Week 3**: Integration + testing (Phase 3)

**Total Estimated Time**: 1-2 weeks for complete working system

---

**Agent**: typescript-engineer + devops
**Priority**: critical
**Expected Outcome**: Working CI/CD monitor that auto-creates tasks on build failures
