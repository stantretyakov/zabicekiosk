#!/bin/bash
# Infrastructure setup script for cicd-monitor
#
# This script creates all GCP resources needed for cicd-monitor:
# - Service account with Cloud Admin permissions
# - Pub/Sub subscription
# - Infrastructure resources (topics, log sinks)
#
# RUN THIS BEFORE running setup-secrets.sh

set -e

PROJECT_ID="zabicekiosk"
SERVICE_ACCOUNT="cicd-monitor"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🚀 Setting up infrastructure for cicd-monitor"
echo "Project: $PROJECT_ID"
echo ""

# ============================================================
# Step 1: Create Service Account
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Creating Service Account"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
  echo "✓ Service account $SERVICE_ACCOUNT_EMAIL already exists"
else
  echo "📝 Creating service account: $SERVICE_ACCOUNT_EMAIL"
  gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
    --display-name="CI/CD Monitor Service Account" \
    --description="Service account for cicd-monitor tool with Cloud Admin permissions" \
    --project="$PROJECT_ID"
  echo "✅ Service account created"
fi

echo ""

# ============================================================
# Step 2: Grant IAM Permissions (Cloud Admin Mode)
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Granting Cloud Admin IAM Permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Array of roles to grant
ROLES=(
  "roles/cloudbuild.builds.editor"
  "roles/logging.admin"
  "roles/pubsub.admin"
  "roles/secretmanager.admin"
  "roles/iam.securityAdmin"
  "roles/iam.serviceAccountAdmin"
  "roles/run.admin"
  "roles/compute.instanceAdmin.v1"
  "roles/storage.admin"
  "roles/monitoring.metricWriter"
)

for role in "${ROLES[@]}"; do
  echo "🔑 Granting $role to $SERVICE_ACCOUNT_EMAIL"
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="$role" \
    --quiet || echo "  ⚠️  Failed to grant $role (may already exist)"
done

echo ""
echo "✅ All IAM permissions granted"
echo ""

# ============================================================
# Step 3: Create Pub/Sub Resources
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Creating Pub/Sub Resources"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create cloud-builds topic (if not exists)
if gcloud pubsub topics describe cloud-builds --project="$PROJECT_ID" &>/dev/null; then
  echo "✓ Pub/Sub topic 'cloud-builds' already exists"
else
  echo "📝 Creating Pub/Sub topic: cloud-builds"
  gcloud pubsub topics create cloud-builds --project="$PROJECT_ID"
  echo "✅ Topic created"
fi

# Create subscription for cicd-monitor
if gcloud pubsub subscriptions describe cicd-monitor-builds --project="$PROJECT_ID" &>/dev/null; then
  echo "✓ Pub/Sub subscription 'cicd-monitor-builds' already exists"
else
  echo "📝 Creating Pub/Sub subscription: cicd-monitor-builds"
  gcloud pubsub subscriptions create cicd-monitor-builds \
    --topic=cloud-builds \
    --ack-deadline=60 \
    --message-retention-duration=7d \
    --project="$PROJECT_ID"
  echo "✅ Subscription created"
fi

# Grant subscriber access to cicd-monitor service account
echo "🔑 Granting subscriber access to cicd-monitor-builds"
gcloud pubsub subscriptions add-iam-policy-binding cicd-monitor-builds \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/pubsub.subscriber" \
  --project="$PROJECT_ID" \
  --quiet || true

echo ""

# ============================================================
# Step 4: Create Log Sink (Optional)
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Creating Log Sink for Build Failures (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create build-failures topic
if gcloud pubsub topics describe build-failures --project="$PROJECT_ID" &>/dev/null; then
  echo "✓ Pub/Sub topic 'build-failures' already exists"
else
  echo "📝 Creating Pub/Sub topic: build-failures"
  gcloud pubsub topics create build-failures --project="$PROJECT_ID"
  echo "✅ Topic created"
fi

# Create log sink
if gcloud logging sinks describe cicd-monitor-build-failures --project="$PROJECT_ID" &>/dev/null; then
  echo "✓ Log sink 'cicd-monitor-build-failures' already exists"
else
  echo "📝 Creating log sink: cicd-monitor-build-failures"
  gcloud logging sinks create cicd-monitor-build-failures \
    pubsub.googleapis.com/projects/"$PROJECT_ID"/topics/build-failures \
    --log-filter='resource.type="build" AND severity>=ERROR' \
    --project="$PROJECT_ID" || echo "  ⚠️  Log sink creation failed (optional feature)"
fi

# Grant publisher access to log sink service account
LOG_SINK_SA=$(gcloud logging sinks describe cicd-monitor-build-failures --format='value(writerIdentity)' --project="$PROJECT_ID" 2>/dev/null || echo "")
if [[ -n "$LOG_SINK_SA" ]]; then
  echo "🔑 Granting publisher access to build-failures topic"
  gcloud pubsub topics add-iam-policy-binding build-failures \
    --member="$LOG_SINK_SA" \
    --role="roles/pubsub.publisher" \
    --project="$PROJECT_ID" \
    --quiet || true
fi

echo ""

# ============================================================
# Step 5: Download Service Account Key (Local Development)
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Download Service Account Key (Local Dev)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

KEY_FILE="tools/cicd-monitor/cicd-monitor-key.json"

if [[ -f "$KEY_FILE" ]]; then
  echo "✓ Service account key already exists: $KEY_FILE"
  read -p "  Overwrite existing key? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "  Skipping key download"
  else
    echo "📝 Creating new service account key"
    gcloud iam service-accounts keys create "$KEY_FILE" \
      --iam-account="$SERVICE_ACCOUNT_EMAIL" \
      --project="$PROJECT_ID"
    echo "✅ Service account key downloaded to $KEY_FILE"
  fi
else
  echo "📝 Creating service account key"
  gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SERVICE_ACCOUNT_EMAIL" \
    --project="$PROJECT_ID"
  echo "✅ Service account key downloaded to $KEY_FILE"
fi

# Verify key is in .gitignore
if grep -q "cicd-monitor-key.json" .gitignore 2>/dev/null; then
  echo "✓ Service account key is in .gitignore"
else
  echo "📝 Adding service account key to .gitignore"
  echo "tools/cicd-monitor/cicd-monitor-key.json" >> .gitignore
fi

echo ""

# ============================================================
# Summary
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Infrastructure setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "Pub/Sub Subscription: cicd-monitor-builds"
echo "Service Account Key: $KEY_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Setup secrets (creates placeholders):"
echo "   ./scripts/setup-secrets.sh"
echo ""
echo "2. Fill secret values in GCP Console:"
echo "   - GitHub Token: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-github-token?project=$PROJECT_ID"
echo "   - Claude API Key: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-anthropic-api-key?project=$PROJECT_ID"
echo "   - GCP Credentials: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-gcp-credentials?project=$PROJECT_ID"
echo ""
echo "3. Verify secrets are filled:"
echo "   ./scripts/verify-secrets.sh"
echo ""
echo "4. Install CLI tool:"
echo "   cd tools/cicd-monitor"
echo "   npm install"
echo "   npm run build"
echo ""
echo "5. Test CLI locally:"
echo "   npm run cli -- list --project-id=zabicekiosk --last=5"
echo ""
