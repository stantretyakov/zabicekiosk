# 🔐 Secrets Setup Guide for cicd-monitor

**Quick automated setup** - Agent creates placeholders, you fill values.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Automated Setup

```bash
cd /home/user/zabicekiosk
./scripts/setup-secrets.sh
```

This will:
- ✅ Create 3 secret placeholders in GCP Secret Manager
- ✅ Grant access to Cloud Build service account
- ✅ Show you direct links to fill the secrets

**Time**: 30 seconds

---

### Step 2: Fill Secret Values (Manual)

After running setup script, you'll see links like:

#### **Secret 1: GitHub Token**

**Create token**: https://github.com/settings/tokens/new?scopes=repo&description=cicd-monitor

**Fill secret**: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-github-token?project=zabicekiosk

Steps:
1. Create GitHub token with `repo` scope
2. Click "NEW VERSION" in Secret Manager
3. Paste your token (starts with `ghp_`)
4. Click "ADD NEW VERSION"

---

#### **Secret 2: Claude API Key**

**Create key**: https://console.anthropic.com/settings/keys

**Fill secret**: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-anthropic-api-key?project=zabicekiosk

Steps:
1. Create API key in Anthropic console
2. Click "NEW VERSION" in Secret Manager
3. Paste your key (starts with `sk-ant-`)
4. Click "ADD NEW VERSION"

---

#### **Secret 3: GCP Service Account Key**

**Create key**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=zabicekiosk

**Fill secret**: https://console.cloud.google.com/security/secret-manager/secret/cicd-monitor-gcp-credentials?project=zabicekiosk

Steps:
1. Find service account: `cicd-monitor@zabicekiosk.iam.gserviceaccount.com`
2. Click "KEYS" → "ADD KEY" → "Create new key" → "JSON"
3. Download the JSON file
4. Click "NEW VERSION" in Secret Manager
5. Paste **entire JSON content**
6. Click "ADD NEW VERSION"

**Time**: 5-10 minutes

---

### Step 3: Verify Secrets

```bash
./scripts/verify-secrets.sh
```

**Expected output**:
```
Checking cicd-monitor-github-token... ✅ OK
Checking cicd-monitor-anthropic-api-key... ✅ OK
Checking cicd-monitor-gcp-credentials... ✅ OK

✅ All secrets are configured correctly!
```

**Time**: 10 seconds

---

## 📋 Secrets Configuration Reference

See `.secrets.yaml` for complete configuration including:
- Secret names and descriptions
- Required scopes and permissions
- Usage information
- Access control settings

---

## ✅ After Setup

Once secrets are verified, the CI/CD pipeline is ready:

```bash
# Agent can now:
✅ Read build logs (GCP credentials)
✅ Analyze errors (Claude API key)
✅ Create tasks (GitHub token)
✅ Provision infrastructure (GCP credentials with Cloud Admin)
✅ Post PR comments (GitHub token)
```

---

## 🔧 Troubleshooting

### Issue: "Secret not found"

```bash
# Re-run setup
./scripts/setup-secrets.sh
```

### Issue: "Permission denied"

```bash
# Grant yourself Secret Manager Admin role
gcloud projects add-iam-policy-binding zabicekiosk \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/secretmanager.admin"
```

### Issue: "Secret has PLACEHOLDER value"

Go to GCP Console and fill the actual secret value:
- https://console.cloud.google.com/security/secret-manager?project=zabicekiosk

---

## 📚 Documentation

- **Full Task**: `.backlog/pending/cicd-001-implement-complete-cicd-monitor-e2e.md`
- **Quick Start**: `CICD-MONITOR-SETUP.md`
- **Secrets Config**: `.secrets.yaml`
- **Setup Script**: `scripts/setup-secrets.sh`
- **Verify Script**: `scripts/verify-secrets.sh`

---

**Total Time**: ~15 minutes (automated setup + manual filling)

**Ready to start**: Yes! After secrets are verified, run the implementation task.
