# Data Integrity Scripts

This directory contains scripts for verifying and repairing Firestore database integrity.

## Background

After a buggy backfill operation in `src/routes/admin.clients.ts` (lines 266-268), there is a risk that:
- Wrong documents had their `searchTokens` updated
- `tokenHash` fields may be inconsistent with `token` fields
- Foreign key relationships may be broken
- Parent-web functionality may be affected

## Scripts

### 1. verify-data-integrity.ts

Comprehensive verification script that checks all data integrity constraints.

**Usage:**

```bash
# Using npm script (recommended)
cd services/core-api
npm run verify:data-integrity

# Or directly with tsx
tsx scripts/verify-data-integrity.ts
```

**Environment Variables Required:**
- `GOOGLE_CLOUD_PROJECT`: Firebase project ID (e.g., "zabicekiosk")
- `FIRESTORE_DATABASE_ID`: (optional) Firestore database ID
- `TOKEN_SECRET`: Secret key for HMAC token hashing

**Checks Performed:**

**Clients Collection:**
- ✅ Required fields present (parentName, childName)
- ✅ Active clients have token and tokenHash
- ✅ Token hash matches token (using TOKEN_SECRET)
- ✅ SearchTokens array is valid and consistent
- ✅ SearchTokens size < 40KB
- ✅ FullNameLower matches parentName + childName

**Passes Collection:**
- ✅ clientId foreign key exists
- ✅ No orphaned passes
- ✅ planSize and used are valid numbers
- ✅ used <= planSize
- ✅ expiresAt is valid timestamp

**Redeems Collection:**
- ✅ clientId foreign key exists
- ✅ passId foreign key exists (if present)
- ✅ kind is valid ('pass', 'dropin', 'renewal')
- ✅ No orphaned redeems

**Output:**
- Console report (human-readable)
- JSON report saved to `reports/integrity-report-TIMESTAMP.json`
- Exit code 0 if all checks pass, 1 if issues found

**Example Output:**

```
🔍 Starting data integrity verification...

🔍 Verifying clients collection...
   Checking 1,234 clients...
   ✓ Found 0 clients with issues

🔍 Verifying passes collection...
   Checking 2,456 passes...
   ✓ Found 0 passes with issues

🔍 Verifying redeems collection...
   Checking 8,901 redeems...
   ✓ Found 0 redeems with issues

═══════════════════════════════════════════════════════════════
                    INTEGRITY REPORT
═══════════════════════════════════════════════════════════════

Timestamp: 2025-11-03T15:30:00.000Z

📊 Collection Sizes:
   Clients: 1,234
   Passes:  2,456
   Redeems: 8,901

🔍 Issues Found:
   Clients with issues: 0 / 1,234
   Passes with issues:  0 / 2,456
   Redeems with issues: 0 / 8,901

✅ DATABASE INTEGRITY: PASSED
   No issues detected. All data is consistent.

═══════════════════════════════════════════════════════════════

📄 Full report saved to: reports/integrity-report-2025-11-03T15-30-00-000Z.json
```

### 2. repair-data-integrity.ts

Repairs data integrity issues found by the verification script.

**IMPORTANT:** Always run verification first, then review the report before running repairs.

**Usage:**

```bash
# DRY RUN (recommended first) - shows what would be repaired
cd services/core-api
npm run repair:data-integrity:dry-run

# LIVE MODE - applies repairs to database
npm run repair:data-integrity
```

**Environment Variables Required:**
- `GOOGLE_CLOUD_PROJECT`: Firebase project ID
- `FIRESTORE_DATABASE_ID`: (optional) Firestore database ID
- `TOKEN_SECRET`: Secret key for HMAC token hashing

**Repairs Performed:**

1. **SearchTokens Repair:**
   - Regenerates correct searchTokens for each client
   - Uses same algorithm as `src/routes/admin.clients.ts`
   - Updates only documents with incorrect tokens

2. **FullNameLower Repair:**
   - Regenerates `fullNameLower` from `parentName + childName`
   - Ensures search by name works correctly

3. **TokenHash Repair:**
   - Recalculates tokenHash from token
   - Only if token exists and hash is wrong

**Safety Features:**
- **Idempotent:** Safe to run multiple times
- **Batch operations:** Uses Firestore batches (500 docs max)
- **No data deletion:** Only updates, never deletes
- **Dry-run mode:** Preview changes before applying

**Example Output (Dry Run):**

```
═══════════════════════════════════════════════════════════════
                    DATA INTEGRITY REPAIR
═══════════════════════════════════════════════════════════════

🔍 DRY RUN MODE - No changes will be made
   Remove --dry-run flag to apply repairs

🔧 Repairing searchTokens for clients...
   (DRY RUN MODE - no changes will be made)

   Checking 1,234 clients...
   Repairing client abc123:
     - Old tokens: 45
     - New tokens: 52
   Repairing client def456:
     - Old tokens: 38
     - New tokens: 41

🔧 Repairing fullNameLower for clients...
   (DRY RUN MODE - no changes will be made)

   Checking 1,234 clients...

🔧 Repairing token hashes for clients...
   (DRY RUN MODE - no changes will be made)

   Checking 1,234 clients...

═══════════════════════════════════════════════════════════════
                         SUMMARY
═══════════════════════════════════════════════════════════════

Repairs needed:
   - SearchTokens: 2 clients
   - FullNameLower: 0 clients
   - TokenHashes: 0 clients
   - Total: 2 repairs

🔄 Run again without --dry-run to apply repairs

═══════════════════════════════════════════════════════════════
```

## Running Against Emulator

For safe testing, use Firebase emulator:

```bash
# Terminal 1: Start emulator
firebase emulators:start

# Terminal 2: Run verification
export FIRESTORE_EMULATOR_HOST="localhost:8080"
export GOOGLE_CLOUD_PROJECT="zabicekiosk"
export TOKEN_SECRET="your-test-secret"
cd services/core-api
npm run verify:data-integrity
```

## Running Against Production

**⚠️ CAUTION:** Only run against production after:
1. Running verification in emulator
2. Running dry-run repair
3. Getting approval from team

```bash
export GOOGLE_CLOUD_PROJECT="zabicekiosk"
export TOKEN_SECRET="production-secret-from-secret-manager"
cd services/core-api
npm run verify:data-integrity

# If issues found, first do dry-run
npm run repair:data-integrity:dry-run

# Review the output, then apply repairs
npm run repair:data-integrity
```

## Troubleshooting

### "GOOGLE_CLOUD_PROJECT environment variable is required"
Set the Firebase project ID:
```bash
export GOOGLE_CLOUD_PROJECT="zabicekiosk"
```

### "TOKEN_SECRET not set - token hash verification will be incorrect"
This is a warning. Token hash checks will fail without the correct secret:
```bash
export TOKEN_SECRET="your-secret-key"
```

### "Permission denied" errors
Ensure you have Firestore read/write permissions:
```bash
# Authenticate with Firebase
firebase login

# Or use service account
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

## Performance

- **Verification:** ~60 seconds for 10,000 clients
- **Repair:** ~120 seconds for 10,000 clients
- **Batching:** Firestore batches limited to 500 operations each

## Integration with CI/CD

These scripts are integrated into the Cloud Build pipeline (`cloudbuild.yaml`):

### Automated Pipeline Flow

**1. Pre-Deployment Verification** (Step: `verify-database-integrity`):
```yaml
- id: verify-database-integrity
  name: node:20
  dir: services/core-api
  secretEnv: ['TOKEN_SECRET']
  args:
    - -c
    - |
      npm run verify:data-integrity
      # Exits with code 1 if issues found - BLOCKS deployment
```

**2. Deployment** (Only if verification passes):
- Core API deployed to Cloud Run
- Booking API deployed to Cloud Run
- Web apps deployed to Firebase Hosting

**3. Post-Deployment Migration** (Step: `migrate-database-post-deployment`):
```yaml
- id: migrate-database-post-deployment
  name: node:20
  dir: services/core-api
  secretEnv: ['TOKEN_SECRET']
  args:
    - -c
    - |
      npm run repair:data-integrity
      npm run verify:data-integrity
```

### CI/CD Behavior

**If Pre-Deployment Verification Fails**:
- ❌ Deployment is BLOCKED
- ❌ Build fails with exit code 1
- 🛑 Database issues must be fixed before deployment

**If Post-Deployment Migration Fails**:
- ✅ Deployment already completed (services are live)
- ⚠️  Warning logged but build continues
- 📝 Manual review recommended

### Service Account Requirements

The Cloud Build service account needs:
- `roles/datastore.user` - Read/write Firestore
- `roles/secretmanager.secretAccessor` - Access TOKEN_SECRET

Grant permissions:
```bash
PROJECT_ID="zabicekiosk"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

### Environment Variables in Pipeline

The following environment variables are automatically provided by Cloud Build:
- `GOOGLE_CLOUD_PROJECT` - Set to `$PROJECT_ID`
- `FIRESTORE_DATABASE_ID` - Set to `$_FIRESTORE_DATABASE_ID` (substitution variable)
- `TOKEN_SECRET` - Retrieved from Secret Manager

### Manual Runs (Outside Pipeline)

If running manually (not in Cloud Build):

```bash
# Local with emulator
export FIRESTORE_EMULATOR_HOST="localhost:8080"
export GOOGLE_CLOUD_PROJECT="zabicekiosk"
export TOKEN_SECRET="test-secret"
npm run verify:data-integrity

# Against production (requires authentication)
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT="zabicekiosk"
export TOKEN_SECRET=$(gcloud secrets versions access latest --secret=token-secret)
npm run verify:data-integrity
```

## References

- Task: `.backlog/in-progress/infra-004-verify-data-integrity-and-parent-web.md`
- Bug Location: `src/routes/admin.clients.ts` lines 266-268
- Parent-Web API: `src/routes/public.card.ts`
