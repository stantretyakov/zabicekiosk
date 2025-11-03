#!/bin/bash
# Verify that all cicd-monitor secrets are properly configured

set -e

PROJECT_ID="zabicekiosk"

echo "🔍 Verifying cicd-monitor secrets in Secret Manager"
echo "Project: $PROJECT_ID"
echo ""

check_secret() {
  local secret_name=$1
  local expected_prefix=$2

  echo -n "Checking $secret_name... "

  if ! gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null; then
    echo "❌ NOT FOUND"
    return 1
  fi

  local value=$(gcloud secrets versions access latest --secret="$secret_name" --project="$PROJECT_ID" 2>/dev/null)

  if [[ -z "$value" ]]; then
    echo "❌ EMPTY"
    return 1
  fi

  if [[ "$value" == "PLACEHOLDER" ]]; then
    echo "⚠️  PLACEHOLDER - Need to fill actual value!"
    return 1
  fi

  if [[ -n "$expected_prefix" ]] && [[ ! "$value" =~ ^$expected_prefix ]]; then
    echo "⚠️  Invalid format (expected to start with $expected_prefix)"
    return 1
  fi

  echo "✅ OK"
  return 0
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Checking secrets..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GITHUB_OK=0
CLAUDE_OK=0
GCP_OK=0

check_secret "cicd-monitor-github-token" "ghp_" && GITHUB_OK=1 || true
check_secret "cicd-monitor-anthropic-api-key" "sk-ant-" && CLAUDE_OK=1 || true
check_secret "cicd-monitor-gcp-credentials" "{" && GCP_OK=1 || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ $GITHUB_OK -eq 1 && $CLAUDE_OK -eq 1 && $GCP_OK -eq 1 ]]; then
  echo "✅ All secrets are configured correctly!"
  echo ""
  echo "You can now run the CI/CD pipeline."
  exit 0
else
  echo "⚠️  Some secrets need attention:"
  echo ""

  if [[ $GITHUB_OK -eq 0 ]]; then
    echo "  GitHub Token:"
    echo "    Create: https://github.com/settings/tokens/new?scopes=repo&description=cicd-monitor"
    echo "    Update: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-github-token?project=$PROJECT_ID"
    echo ""
  fi

  if [[ $CLAUDE_OK -eq 0 ]]; then
    echo "  Claude API Key:"
    echo "    Create: https://console.anthropic.com/settings/keys"
    echo "    Update: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-anthropic-api-key?project=$PROJECT_ID"
    echo ""
  fi

  if [[ $GCP_OK -eq 0 ]]; then
    echo "  GCP Credentials:"
    echo "    Create: https://console.cloud.google.com/iam-admin/serviceaccounts?project=$PROJECT_ID"
    echo "    Update: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-gcp-credentials?project=$PROJECT_ID"
    echo ""
  fi

  exit 1
fi
