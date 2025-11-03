---
id: infra-008
title: Integrate cicd-monitor into Cloud Build pipeline
agent: devops
priority: critical
status: pending
phase: 3-integration
created: 2025-11-03
dependencies: [tools-004, infra-007]
---

# Task: Integrate cicd-monitor into Cloud Build Pipeline

## Context

The cicd-monitor tool is ready. This task integrates it into the Cloud Build pipeline so it automatically runs on build failures and creates tasks for the agent swarm.

**Dependencies**:
- tools-004: Task generation and routing working
- infra-007: Secrets configured in Secret Manager

## Requirements

### 1. Update cloudbuild.yaml

Add cicd-monitor step that runs on failure:

```yaml
# cloudbuild.yaml

availableSecrets:
  secretManager:
    # Existing secrets
    - versionName: projects/$PROJECT_ID/secrets/token-secret/versions/latest
      env: 'TOKEN_SECRET'

    # cicd-monitor secrets (added in infra-007)
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-github-token/versions/latest
      env: 'GITHUB_TOKEN'
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-anthropic-api-key/versions/latest
      env: 'ANTHROPIC_API_KEY'

steps:
  # ... all existing quality gate steps ...

  # ============================================================
  # CI/CD MONITOR - Auto-create tasks on failure
  # ============================================================
  - id: cicd-monitor-on-failure
    name: node:20
    entrypoint: bash
    secretEnv: ['GITHUB_TOKEN', 'ANTHROPIC_API_KEY']
    env:
      - 'GOOGLE_CLOUD_PROJECT=$PROJECT_ID'
    args:
      - -c
      - |
        set -e

        echo "🔍 CI/CD Monitor: Checking build status..."

        # Check if any previous quality gate step failed
        # This is a workaround since Cloud Build doesn't expose BUILD_STATUS
        # We check if we're in a failure scenario by looking at the context

        # Install cicd-monitor CLI
        echo "📦 Installing zabice-cicd-monitor..."
        cd /workspace/tools/cicd-monitor
        npm install --production
        npm run build
        npm link

        cd /workspace

        # Run analysis
        echo "🤖 Running build analysis..."
        zabice-cicd-monitor analyze \
          --build-id="$BUILD_ID" \
          --project-id="$PROJECT_ID" \
          --create-tasks \
          --notify

        echo "✅ CI/CD Monitor completed"

    # CRITICAL: Run even if previous steps failed
    waitFor: ['-']

options:
  logging: CLOUD_LOGGING_ONLY
  default_logs_bucket_behavior: REGIONAL_USER_OWNED_BUCKET

substitutions:
  _REGION: europe-west3
  _FIRESTORE_DATABASE_ID: "zabicedb"

tags:
  - zabicekiosk
```

**Key Points**:
- `waitFor: ['-']` - Runs even if previous steps failed
- `secretEnv` - Access to GitHub and Claude API secrets
- Installs from source (tools/cicd-monitor/) rather than npm registry
- Uses `analyze` command (works for completed builds)

### 2. Alternative: Conditional Execution

Create a smarter version that only runs on failure:

```yaml
  - id: check-build-status
    name: gcr.io/google.com/cloudsdktool/cloud-sdk:slim
    entrypoint: bash
    args:
      - -c
      - |
        # Get current build status
        STATUS=$(gcloud builds describe $BUILD_ID --format='value(status)')
        echo "Build status: $STATUS"

        if [ "$STATUS" = "FAILURE" ] || [ "$STATUS" = "TIMEOUT" ]; then
          echo "BUILD_FAILED=true" > /workspace/build_status.env
        else
          echo "BUILD_FAILED=false" > /workspace/build_status.env
        fi
    waitFor: ['-']

  - id: cicd-monitor-on-failure
    name: node:20
    entrypoint: bash
    secretEnv: ['GITHUB_TOKEN', 'ANTHROPIC_API_KEY']
    args:
      - -c
      - |
        source /workspace/build_status.env

        if [ "$BUILD_FAILED" = "true" ]; then
          echo "🔍 Build failed, running cicd-monitor..."

          cd /workspace/tools/cicd-monitor
          npm install --production
          npm run build
          npm link

          cd /workspace

          zabice-cicd-monitor analyze \
            --build-id="$BUILD_ID" \
            --project-id="$PROJECT_ID" \
            --create-tasks \
            --notify

          echo "✅ CI/CD Monitor completed"
        else
          echo "✅ Build succeeded, skipping cicd-monitor"
        fi
    waitFor: ['check-build-status']
```

### 3. Add Substitution Variables

Add PR context variables (for GitHub Actions triggers):

```yaml
substitutions:
  _REGION: europe-west3
  _FIRESTORE_DATABASE_ID: "zabicedb"
  _PR_NUMBER: ""  # Set by GitHub Actions
  _BRANCH_NAME: "" # Set by GitHub Actions
```

### 4. Update cicd-monitor Command

Pass PR context if available:

```bash
zabice-cicd-monitor analyze \
  --build-id="$BUILD_ID" \
  --project-id="$PROJECT_ID" \
  --pr-number="${_PR_NUMBER:-}" \
  --branch="${_BRANCH_NAME:-}" \
  --create-tasks \
  --notify
```

### 5. Testing Strategy

**Test 1: Dry Run**

```bash
# Trigger a build with dry-run
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_PR_NUMBER=999,_BRANCH_NAME=test-cicd-monitor \
  --project=zabicekiosk
```

**Test 2: Force Failure**

Create a temporary commit with intentional lint error:

```bash
# Create test branch
git checkout -b test-cicd-monitor-integration

# Add lint error
echo "const x = 'unused';" >> services/core-api/src/index.ts

# Commit and push
git add services/core-api/src/index.ts
git commit -m "test: trigger cicd-monitor with lint error"
git push origin test-cicd-monitor-integration

# Create PR
gh pr create --title "Test: CI/CD Monitor Integration" --body "Testing cicd-monitor"

# Watch build
gcloud builds list --ongoing --project=zabicekiosk

# After build fails, check for task in .backlog/pending/
ls -la .backlog/pending/auto-*

# Check PR comment
gh pr view --comments
```

**Test 3: Verify Task Creation**

After failed build:

```bash
# Check if task was created
find .backlog/pending/ -name "auto-*" -type f -mmin -5

# Verify task content
cat .backlog/pending/auto-lint-*.md

# Check git log
git log --oneline -n 5
```

### 6. Monitoring and Logging

**View cicd-monitor logs**:

```bash
# Get recent build ID
BUILD_ID=$(gcloud builds list --limit=1 --format='value(id)' --project=zabicekiosk)

# View logs for cicd-monitor step
gcloud builds log $BUILD_ID --project=zabicekiosk | grep -A 50 "CI/CD Monitor"

# Or use Cloud Logging
gcloud logging read "resource.type=build AND resource.labels.build_id=$BUILD_ID" \
  --limit=100 \
  --project=zabicekiosk
```

**Check for errors**:

```bash
# Search for cicd-monitor errors
gcloud logging read "resource.type=build AND textPayload:\"cicd-monitor\" AND severity>=ERROR" \
  --limit=50 \
  --project=zabicekiosk
```

### 7. Rollback Plan

If cicd-monitor causes issues:

```bash
# Disable cicd-monitor step by commenting it out
git checkout cloudbuild.yaml

# Remove the cicd-monitor-on-failure step
# Or add condition to skip it

git add cloudbuild.yaml
git commit -m "fix: disable cicd-monitor temporarily"
git push origin main
```

### 8. Documentation

Update `docs/infrastructure/cicd-monitor-setup.md`:

```markdown
## Cloud Build Integration

The cicd-monitor tool is integrated into the Cloud Build pipeline as the final step:

- **Step ID**: `cicd-monitor-on-failure`
- **Trigger**: Runs always (even on failure) via `waitFor: ['-']`
- **Action**: Analyzes build, creates tasks, posts PR comments
- **Secrets**: GITHUB_TOKEN, ANTHROPIC_API_KEY

### How It Works

1. Build runs all quality gates
2. If any quality gate fails:
   - cicd-monitor analyzes the failure
   - Creates task in `.backlog/pending/`
   - Posts comment on PR (if triggered from PR)
3. If build succeeds:
   - cicd-monitor runs but finds no failures
   - Exits quietly

### Monitoring

View cicd-monitor logs:

```bash
BUILD_ID=<your-build-id>
gcloud builds log $BUILD_ID --project=zabicekiosk | grep -A 50 "CI/CD Monitor"
```

### Troubleshooting

**Issue**: cicd-monitor step fails

**Solution**:
```bash
# Check logs
gcloud builds log $BUILD_ID

# Verify secrets are accessible
gcloud secrets describe cicd-monitor-github-token
gcloud secrets describe cicd-monitor-anthropic-api-key
```

**Issue**: Tasks not created

**Solution**:
- Check GITHUB_TOKEN has `repo` scope
- Verify service account has Secret Manager access
- Check cicd-monitor logs for errors
```

## Acceptance Criteria

BINARY: YES or NO (no partial completion)

- [ ] `cloudbuild.yaml` updated with `cicd-monitor-on-failure` step
- [ ] Step configured with `waitFor: ['-']` to run on failure
- [ ] Secrets (GITHUB_TOKEN, ANTHROPIC_API_KEY) passed to step via secretEnv
- [ ] cicd-monitor installed from source (tools/cicd-monitor/)
- [ ] Command includes --create-tasks and --notify flags
- [ ] Substitution variables added for PR context (_PR_NUMBER, _BRANCH_NAME)
- [ ] Test 1 (dry run) completes without errors
- [ ] Test 2 (forced failure) creates task in .backlog/pending/
- [ ] Test 2 posts comment on PR with task details
- [ ] Task file format is correct and matches template
- [ ] Monitoring commands work (view logs, check errors)
- [ ] Rollback plan documented
- [ ] Documentation updated in `docs/infrastructure/cicd-monitor-setup.md`

## Out of Scope

- GitHub Actions workflow → infra-009
- Pub/Sub integration (using analyze command, not watch)
- Dashboard or UI for cicd-monitor

## Security Checklist

- [ ] Secrets are never logged or exposed
- [ ] Service account has minimal permissions (viewer roles only)
- [ ] GITHUB_TOKEN has correct scopes (repo only)
- [ ] No sensitive data in task files or PR comments

## References

- Agent Manifest: `docs/agents/cicd-monitor.md`
- Config: `.cicd-monitor.config.yaml`
- Current cloudbuild.yaml

---

**Agent**: devops
**Phase**: 3-integration
**Estimated Time**: 2-3 hours
