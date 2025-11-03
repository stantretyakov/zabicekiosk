# 🚀 CI/CD Monitor - Quick Setup Guide

**Status**: Ready for Implementation
**Timeline**: 1-2 weeks
**Result**: Automated build failure detection → task creation → agent assignment

---

## ⚠️ REQUIRED: Fill Secrets First

Before the system works, you MUST create and fill 2 secrets:

### 1. GitHub Token

**Create token**:
🔗 https://github.com/settings/tokens/new?scopes=repo&description=cicd-monitor-zabicekiosk

**Requirements**:
- Scope: ✅ **repo** (Full control of private repositories)
- Description: `cicd-monitor-zabicekiosk`

**After creating token, run**:
```bash
echo "ghp_YOUR_TOKEN_HERE" | gcloud secrets create cicd-monitor-github-token \
  --data-file=- \
  --replication-policy="automatic" \
  --project=zabicekiosk

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

**Create key**:
🔗 https://console.anthropic.com/settings/keys

**Requirements**:
- Name: `cicd-monitor-zabicekiosk`
- Copy the key (starts with `sk-ant-`)

**After creating key, run**:
```bash
echo "sk-ant-YOUR_KEY_HERE" | gcloud secrets create cicd-monitor-anthropic-api-key \
  --data-file=- \
  --replication-policy="automatic" \
  --project=zabicekiosk

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

## 📋 Implementation Checklist

### Phase 1: Infrastructure (devops) - 2-3 hours

- [ ] Create service account
  ```bash
  gcloud iam service-accounts create cicd-monitor \
    --display-name="CI/CD Monitor Service Account" \
    --project=zabicekiosk
  ```

- [ ] Grant IAM permissions
  ```bash
  gcloud projects add-iam-policy-binding zabicekiosk \
    --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.viewer"

  gcloud projects add-iam-policy-binding zabicekiosk \
    --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
    --role="roles/logging.viewer"

  gcloud projects add-iam-policy-binding zabicekiosk \
    --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
    --role="roles/pubsub.subscriber"
  ```

- [ ] Create Pub/Sub subscription
  ```bash
  gcloud pubsub subscriptions create cicd-monitor-builds \
    --topic=cloud-builds \
    --project=zabicekiosk
  ```

- [ ] ⚠️ Create GitHub token (see above)
- [ ] ⚠️ Create Claude API key (see above)

- [ ] Download service account key (for local dev)
  ```bash
  gcloud iam service-accounts keys create tools/cicd-monitor/cicd-monitor-key.json \
    --iam-account=cicd-monitor@zabicekiosk.iam.gserviceaccount.com \
    --project=zabicekiosk
  ```

---

### Phase 2: CLI Tool (typescript-engineer) - 1 week

- [ ] Setup project structure
  ```bash
  cd tools/cicd-monitor
  npm install
  ```

- [ ] Create config files (.eslintrc, .prettierrc, jest.config.js)

- [ ] Implement modules:
  - [ ] `src/config/` - Config loader with Zod
  - [ ] `src/utils/` - Logger, rate limiter, retry
  - [ ] `src/integrations/` - Cloud Build, GitHub, Claude APIs
  - [ ] `src/analyzer/` - Error classifier, root cause analyzer
  - [ ] `src/task-creator/` - Template engine, agent router, task generator
  - [ ] `src/index.ts` - CLI with commander

- [ ] Create 5 task templates in `templates/`

- [ ] Write tests (>80% coverage)

- [ ] Build and test locally
  ```bash
  npm run build
  npm test
  npm run cli -- --help
  npm run cli -- list --project-id=zabicekiosk --last=5
  ```

---

### Phase 3: Pipeline Integration (devops) - 2-3 hours

- [ ] Update `cloudbuild.yaml` with cicd-monitor step

- [ ] Add secrets to `availableSecrets` section

- [ ] Test with intentional error
  ```bash
  # Create test PR with lint error
  git checkout -b test-cicd-monitor
  echo "const unused = 'test';" >> services/core-api/src/index.ts
  git add . && git commit -m "test: trigger cicd-monitor"
  git push origin test-cicd-monitor
  gh pr create --title "Test: CI/CD Monitor" --body "Testing"
  ```

- [ ] Verify task created in `.backlog/pending/`

- [ ] Verify PR comment posted

- [ ] Verify correct agent assigned

---

## 🎯 What You Get

After implementation, when a build fails:

1. **Automatic Detection** (<30 seconds)
   - Cloud Build detects quality gate failure
   - cicd-monitor step triggers automatically

2. **AI Analysis** (~30 seconds)
   - Fetches error logs from Cloud Logging
   - Classifies error type (lint/typecheck/test/build/deploy)
   - Claude analyzes root cause and suggests fix

3. **Task Creation** (~30 seconds)
   - Generates task from template
   - Routes to correct agent (typescript-engineer/react-engineer/test-engineer/devops)
   - Commits to `.backlog/pending/`
   - Posts PR comment with details

4. **Agent Picks Up** (immediate)
   - Agent sees task in `.backlog/pending/`
   - Reads task description and suggested fix
   - Implements fix
   - Commits and pushes

**Total Time**: < 2 minutes from build failure to task creation

---

## 📊 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Detection Rate | >95% | % of build failures that create tasks |
| False Positives | <5% | % of incorrectly classified tasks |
| Agent Routing | >90% | % of tasks routed to correct agent |
| Time to Task | <2 min | From build failure to task commit |
| Auto-Fix Success | >70% | % of auto-tasks accepted by QA |

---

## 📚 Documentation

- **Main Task**: `.backlog/pending/cicd-001-implement-complete-cicd-monitor-e2e.md`
- **Agent Manifest**: `docs/agents/cicd-monitor.md`
- **Architecture**: `docs/architecture/cicd-monitor-system.md`
- **Config**: `.cicd-monitor.config.yaml`

---

## 🧪 Testing Commands

```bash
# List recent builds
gcloud builds list --limit=10 --project=zabicekiosk

# View cicd-monitor logs
BUILD_ID=<your-build-id>
gcloud builds log $BUILD_ID | grep -A 100 "CI/CD Monitor"

# Test CLI locally
cd tools/cicd-monitor
npm run cli -- analyze --build-id=$BUILD_ID --project-id=zabicekiosk --dry-run

# List auto-created tasks
ls -la .backlog/pending/auto-*

# View task
cat .backlog/pending/auto-lint-*.md
```

---

## ⚙️ Configuration

All settings in `.cicd-monitor.config.yaml`:

```yaml
monitor:
  mode: watch  # Real-time monitoring

analysis:
  ai_model: claude-3-5-sonnet-20241022
  skip_known_patterns: true  # Use heuristics for common errors

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
```

---

## 🔧 Troubleshooting

**Issue**: "GitHub token not found"
```bash
# Verify secret
gcloud secrets describe cicd-monitor-github-token --project=zabicekiosk

# Check access
gcloud secrets get-iam-policy cicd-monitor-github-token --project=zabicekiosk
```

**Issue**: Tasks not created
```bash
# Check logs
gcloud builds log $BUILD_ID | grep -A 50 "cicd-monitor"

# Test locally
cd tools/cicd-monitor
npm run cli -- analyze --build-id=$BUILD_ID --project-id=zabicekiosk --dry-run
```

**Issue**: Wrong agent assigned
- Check `.cicd-monitor.config.yaml` routing rules
- Review Claude confidence (needs >70% for AI routing)
- Check `src/analyzer/error-classifier.ts` logic

---

## 🚀 Ready to Start?

1. **Fill secrets** (see top of this document)
2. **Open task**: `.backlog/pending/cicd-001-implement-complete-cicd-monitor-e2e.md`
3. **Delegate to agents**: typescript-engineer + devops
4. **Timeline**: 1-2 weeks

---

**Created**: 2025-11-03
**Status**: Implementation Ready
**Version**: 1.0
