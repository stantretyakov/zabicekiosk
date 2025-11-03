---
id: infra-007
title: Setup Cloud Build API integration and Secret Manager
agent: devops
priority: high
status: pending
phase: 1-foundation
created: 2025-11-03
dependencies: []
---

# Task: Setup Cloud Build API Integration and Secret Manager

## Context

The cicd-monitor tool needs to authenticate with Cloud Build API, GitHub API, and Claude API. This task sets up the necessary GCP service accounts, secrets in Secret Manager, and IAM permissions.

**Purpose**: Configure GCP infrastructure for cicd-monitor authentication.

## Requirements

### 1. Create Service Account

Create a dedicated service account for cicd-monitor:

```bash
# Create service account
gcloud iam service-accounts create cicd-monitor \
  --display-name="CI/CD Monitor Service Account" \
  --description="Service account for cicd-monitor tool to access Cloud Build and Logging APIs" \
  --project=zabicekiosk
```

### 2. Grant IAM Permissions

Grant necessary permissions to the service account:

```bash
# Cloud Build viewer (read build status, list builds)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.viewer"

# Cloud Logging viewer (read build logs)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/logging.viewer"

# Pub/Sub subscriber (for real-time build notifications)
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"
```

### 3. Create Pub/Sub Subscription

Create a Pub/Sub subscription for Cloud Build events:

```bash
# Cloud Build automatically publishes to 'cloud-builds' topic
# Create a subscription for cicd-monitor

gcloud pubsub subscriptions create cicd-monitor-builds \
  --topic=cloud-builds \
  --ack-deadline=60 \
  --message-retention-duration=7d \
  --project=zabicekiosk

# Grant service account subscription access
gcloud pubsub subscriptions add-iam-policy-binding cicd-monitor-builds \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber" \
  --project=zabicekiosk
```

### 4. Create GitHub Token Secret

Store GitHub Personal Access Token in Secret Manager:

**Steps**:

1. Create GitHub PAT with `repo` scope:
   - Go to: https://github.com/settings/tokens/new
   - Select scopes: `repo` (full control of private repositories)
   - Generate token

2. Store in Secret Manager:

```bash
# Create secret (paste token when prompted)
gcloud secrets create cicd-monitor-github-token \
  --replication-policy="automatic" \
  --project=zabicekiosk \
  --data-file=-

# Input: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. Grant access to Cloud Build service account:

```bash
gcloud secrets add-iam-policy-binding cicd-monitor-github-token \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

4. Grant access to cicd-monitor service account (for local dev):

```bash
gcloud secrets add-iam-policy-binding cicd-monitor-github-token \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

### 5. Create Claude API Key Secret

Store Anthropic API key in Secret Manager:

**Steps**:

1. Get API key from: https://console.anthropic.com/settings/keys

2. Store in Secret Manager:

```bash
# Create secret (paste API key when prompted)
gcloud secrets create cicd-monitor-anthropic-api-key \
  --replication-policy="automatic" \
  --project=zabicekiosk \
  --data-file=-

# Input: sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. Grant access to Cloud Build service account:

```bash
gcloud secrets add-iam-policy-binding cicd-monitor-anthropic-api-key \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

4. Grant access to cicd-monitor service account:

```bash
gcloud secrets add-iam-policy-binding cicd-monitor-anthropic-api-key \
  --member="serviceAccount:cicd-monitor@zabicekiosk.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=zabicekiosk
```

### 6. Download Service Account Key (Local Dev Only)

For local development, download the service account key:

```bash
gcloud iam service-accounts keys create tools/cicd-monitor/cicd-monitor-key.json \
  --iam-account=cicd-monitor@zabicekiosk.iam.gserviceaccount.com \
  --project=zabicekiosk

# Add to .gitignore (should already be ignored by *.json in tools/)
echo "tools/cicd-monitor/cicd-monitor-key.json" >> .gitignore
```

### 7. Update cloudbuild.yaml

Add secrets to `availableSecrets` section:

```yaml
# cloudbuild.yaml
availableSecrets:
  secretManager:
    # Existing secrets
    - versionName: projects/$PROJECT_ID/secrets/token-secret/versions/latest
      env: 'TOKEN_SECRET'

    # New secrets for cicd-monitor
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-github-token/versions/latest
      env: 'GITHUB_TOKEN'
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-anthropic-api-key/versions/latest
      env: 'ANTHROPIC_API_KEY'
```

### 8. Verification

Verify all secrets are accessible:

```bash
# List secrets
gcloud secrets list --project=zabicekiosk

# Verify access (should not error)
gcloud secrets versions access latest \
  --secret=cicd-monitor-github-token \
  --project=zabicekiosk

gcloud secrets versions access latest \
  --secret=cicd-monitor-anthropic-api-key \
  --project=zabicekiosk

# Check Pub/Sub subscription
gcloud pubsub subscriptions describe cicd-monitor-builds \
  --project=zabicekiosk

# Test Pub/Sub pull (should show recent builds)
gcloud pubsub subscriptions pull cicd-monitor-builds \
  --limit=5 \
  --project=zabicekiosk
```

### 9. Documentation

Create infrastructure documentation:

**File**: `docs/infrastructure/cicd-monitor-setup.md`

```markdown
# CI/CD Monitor Infrastructure Setup

## Service Account

- **Name**: `cicd-monitor@zabicekiosk.iam.gserviceaccount.com`
- **Purpose**: Access Cloud Build and Logging APIs

## IAM Roles

- `roles/cloudbuild.builds.viewer` - Read build status
- `roles/logging.viewer` - Read build logs
- `roles/pubsub.subscriber` - Subscribe to build events

## Secrets in Secret Manager

1. **cicd-monitor-github-token**
   - GitHub Personal Access Token
   - Scopes: `repo`
   - Used by: GitHub API client

2. **cicd-monitor-anthropic-api-key**
   - Claude API key
   - Used by: Error analysis engine

## Pub/Sub Subscription

- **Name**: `cicd-monitor-builds`
- **Topic**: `cloud-builds` (auto-created by Cloud Build)
- **Purpose**: Real-time build status notifications

## Local Development

Set environment variables:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="tools/cicd-monitor/cicd-monitor-key.json"
export GITHUB_TOKEN=$(gcloud secrets versions access latest --secret=cicd-monitor-github-token)
export ANTHROPIC_API_KEY=$(gcloud secrets versions access latest --secret=cicd-monitor-anthropic-api-key)
```
```

## Acceptance Criteria

BINARY: YES or NO (no partial completion)

- [ ] Service account `cicd-monitor@zabicekiosk.iam.gserviceaccount.com` created
- [ ] IAM permissions granted (cloudbuild.builds.viewer, logging.viewer, pubsub.subscriber)
- [ ] Pub/Sub subscription `cicd-monitor-builds` created
- [ ] Secret `cicd-monitor-github-token` created and accessible
- [ ] Secret `cicd-monitor-anthropic-api-key` created and accessible
- [ ] Both secrets accessible by Cloud Build service account (120039745928@cloudbuild.gserviceaccount.com)
- [ ] Both secrets accessible by cicd-monitor service account
- [ ] Service account key downloaded to `tools/cicd-monitor/cicd-monitor-key.json`
- [ ] Key file added to .gitignore
- [ ] `cloudbuild.yaml` updated with new secrets in availableSecrets
- [ ] All verification commands succeed without errors
- [ ] Documentation created in `docs/infrastructure/cicd-monitor-setup.md`

## Out of Scope

- Implementing cicd-monitor tool → tools-001
- Adding cicd-monitor to Cloud Build pipeline → infra-008
- GitHub Actions integration → infra-009

## Security Notes

- **NEVER commit service account keys to git**
- Rotate GitHub token every 90 days
- Rotate Claude API key if compromised
- Use least-privilege principle (viewer roles only)
- Service account key is for local dev only (Cloud Build uses ADC)

## References

- Agent Manifest: `docs/agents/cicd-monitor.md` (Secret Manager Configuration section)
- Secret Manager Docs: https://cloud.google.com/secret-manager/docs
- Cloud Build IAM: https://cloud.google.com/build/docs/iam-roles-permissions

---

**Agent**: devops
**Phase**: 1-foundation
**Estimated Time**: 1-2 hours
