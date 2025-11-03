#!/bin/bash
# Setup script for cicd-monitor secrets
#
# This script creates secret placeholders in GCP Secret Manager
# and grants access to Cloud Build service account.
#
# IMPORTANT: You must fill the secret values manually in GCP Console!

set -e

PROJECT_ID="zabicekiosk"
CLOUD_BUILD_SA="120039745928@cloudbuild.gserviceaccount.com"

echo "🔐 Setting up cicd-monitor secrets in Secret Manager"
echo "Project: $PROJECT_ID"
echo ""

# Function to create secret if it doesn't exist
create_secret_if_not_exists() {
  local secret_name=$1
  local description=$2

  if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null; then
    echo "✓ Secret $secret_name already exists"
  else
    echo "📝 Creating secret: $secret_name"
    echo "PLACEHOLDER" | gcloud secrets create "$secret_name" \
      --data-file=- \
      --replication-policy="automatic" \
      --project="$PROJECT_ID"
    echo "  ⚠️  IMPORTANT: Fill this secret in GCP Console!"
  fi
}

# Function to grant access
grant_access() {
  local secret_name=$1
  local member=$2

  echo "🔑 Granting access to $secret_name for $member"
  gcloud secrets add-iam-policy-binding "$secret_name" \
    --member="serviceAccount:$member" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" \
    --quiet || true
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Creating secret placeholders"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

create_secret_if_not_exists "cicd-monitor-github-token" "GitHub PAT for cicd-monitor"
create_secret_if_not_exists "cicd-monitor-anthropic-api-key" "Claude API key for error analysis"
create_secret_if_not_exists "cicd-monitor-gcp-credentials" "GCP service account key for Cloud Admin"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Granting access to Cloud Build service account"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

grant_access "cicd-monitor-github-token" "$CLOUD_BUILD_SA"
grant_access "cicd-monitor-anthropic-api-key" "$CLOUD_BUILD_SA"
grant_access "cicd-monitor-gcp-credentials" "$CLOUD_BUILD_SA"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Secret Manager setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  NEXT STEPS - YOU MUST DO MANUALLY:"
echo ""
echo "1. Fill GitHub Token:"
echo "   - Create: https://github.com/settings/tokens/new?scopes=repo&description=cicd-monitor"
echo "   - Go to: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-github-token?project=$PROJECT_ID"
echo "   - Click 'NEW VERSION' and paste your token (ghp_...)"
echo ""
echo "2. Fill Claude API Key:"
echo "   - Create: https://console.anthropic.com/settings/keys"
echo "   - Go to: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-anthropic-api-key?project=$PROJECT_ID"
echo "   - Click 'NEW VERSION' and paste your key (sk-ant-...)"
echo ""
echo "3. Fill GCP Credentials:"
echo "   - Create SA key: https://console.cloud.google.com/iam-admin/serviceaccounts?project=$PROJECT_ID"
echo "   - Find: cicd-monitor@$PROJECT_ID.iam.gserviceaccount.com"
echo "   - Click 'KEYS' → 'ADD KEY' → 'Create new key' → 'JSON'"
echo "   - Go to: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-gcp-credentials?project=$PROJECT_ID"
echo "   - Click 'NEW VERSION' and paste entire JSON content"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To verify secrets are filled:"
echo "  ./scripts/verify-secrets.sh"
echo ""
