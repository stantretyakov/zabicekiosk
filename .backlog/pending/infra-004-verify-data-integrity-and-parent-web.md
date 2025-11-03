# Task: Verify Data Integrity and Parent-Web Functionality

## Metadata

- **ID**: infra-004-verify-data-integrity-and-parent-web
- **Status**: pending
- **Priority**: critical
- **Estimated Hours**: 2
- **Assigned Agent**: database-engineer
- **Dependencies**: none (can run in parallel with feature-001)
- **Rejection Count**: 0
- **Created By**: task-engineer
- **Created At**: 2025-11-03 14:48:25 UTC
- **Documentation**: docs/architecture/client-search-system.md

## Description

**CRITICAL**: The buggy backfill at line 267 executed the wrong query after updating `searchTokens`. This may have caused:

1. **Wrong documents updated**: Backfill may have updated `searchTokens` on documents that DON'T match the search criteria
2. **Orphaned relationships**: `passes.clientId` may point to clients with corrupted data
3. **Parent-web broken**: `/api/v1/card` endpoint may fail if client data inconsistent
4. **Kiosk broken**: Token lookup may fail if `tokenHash` doesn't match `token`

**Goal**: Audit Firestore database for data inconsistencies and verify parent-web functionality.

## Acceptance Criteria

- [ ] All clients have valid `token` and `tokenHash` fields (hash matches token)
- [ ] All passes have valid `clientId` (foreign key exists in clients collection)
- [ ] No orphaned passes (clientId points to non-existent client)
- [ ] SearchTokens arrays are consistent (generated from correct fields)
- [ ] No oversized searchTokens arrays (>40KB limit)
- [ ] Parent-web API `/api/v1/card?token=XXX` works correctly
- [ ] Parent-web displays pass data accurately
- [ ] QR codes generated correctly in parent-web
- [ ] Data consistency report generated (summary of issues found)
- [ ] Repair script created if issues found (idempotent, safe to re-run)
- [ ] All quality gates pass (lint, typecheck, build)
- [ ] Changes committed with proper conventional commit message

## Technical Requirements

### Database Integrity Checks

**Script**: `services/core-api/scripts/verify-data-integrity.ts`

Create verification script that checks:

#### 1. **Clients Collection Integrity**

```typescript
interface ClientIntegrityIssue {
  clientId: string;
  issues: string[];
}

async function verifyClientsCollection(): Promise<ClientIntegrityIssue[]> {
  const db = getDb();
  const issues: ClientIntegrityIssue[] = [];

  const clientsSnap = await db.collection('clients').get();

  for (const doc of clientsSnap.docs) {
    const data = doc.data();
    const clientIssues: string[] = [];

    // Check required fields
    if (!data.parentName) clientIssues.push('Missing parentName');
    if (!data.childName) clientIssues.push('Missing childName');
    if (!data.token) clientIssues.push('Missing token');
    if (!data.tokenHash) clientIssues.push('Missing tokenHash');

    // Check token-tokenHash consistency
    if (data.token && data.tokenHash) {
      const expectedHash = hashToken(data.token);
      if (data.tokenHash !== expectedHash) {
        clientIssues.push(`Token hash mismatch: expected ${expectedHash}, got ${data.tokenHash}`);
      }
    }

    // Check searchTokens array
    if (!Array.isArray(data.searchTokens)) {
      clientIssues.push('searchTokens is not an array');
    } else {
      const size = JSON.stringify(data.searchTokens).length;
      if (size > 40000) {
        clientIssues.push(`searchTokens too large: ${size} bytes`);
      }

      // Verify searchTokens are correct for this client
      const expectedTokens = generateSearchTokens({
        parentName: data.parentName,
        childName: data.childName,
        phone: data.phone,
        telegram: data.telegram,
        instagram: data.instagram
      });

      const storedSet = new Set(data.searchTokens);
      const missingTokens = expectedTokens.filter(t => !storedSet.has(t));
      const extraTokens = data.searchTokens.filter(t => !expectedTokens.includes(t));

      if (missingTokens.length > 0) {
        clientIssues.push(`Missing ${missingTokens.length} expected tokens`);
      }
      if (extraTokens.length > 0) {
        clientIssues.push(`Has ${extraTokens.length} unexpected tokens`);
      }
    }

    // Check fullNameLower consistency
    const expectedFullNameLower = `${data.parentName} ${data.childName}`.toLowerCase();
    if (data.fullNameLower !== expectedFullNameLower) {
      clientIssues.push(`fullNameLower mismatch: expected "${expectedFullNameLower}", got "${data.fullNameLower}"`);
    }

    if (clientIssues.length > 0) {
      issues.push({ clientId: doc.id, issues: clientIssues });
    }
  }

  return issues;
}
```

#### 2. **Passes Collection Integrity**

```typescript
interface PassIntegrityIssue {
  passId: string;
  issues: string[];
}

async function verifyPassesCollection(): Promise<PassIntegrityIssue[]> {
  const db = getDb();
  const issues: PassIntegrityIssue[] = [];

  const passesSnap = await db.collection('passes').get();

  for (const doc of passesSnap.docs) {
    const data = doc.data();
    const passIssues: string[] = [];

    // Check required fields
    if (!data.clientId) {
      passIssues.push('Missing clientId');
    } else {
      // Verify foreign key
      const clientSnap = await db.collection('clients').doc(data.clientId).get();
      if (!clientSnap.exists) {
        passIssues.push(`Orphaned pass: clientId ${data.clientId} does not exist`);
      }
    }

    // Check planSize and used
    if (typeof data.planSize !== 'number' || data.planSize < 0) {
      passIssues.push(`Invalid planSize: ${data.planSize}`);
    }
    if (typeof data.used !== 'number' || data.used < 0) {
      passIssues.push(`Invalid used: ${data.used}`);
    }
    if (data.used > data.planSize) {
      passIssues.push(`used (${data.used}) exceeds planSize (${data.planSize})`);
    }

    // Check expiresAt
    if (!data.expiresAt || !data.expiresAt.toDate) {
      passIssues.push('Invalid or missing expiresAt');
    }

    if (passIssues.length > 0) {
      issues.push({ passId: doc.id, issues: passIssues });
    }
  }

  return issues;
}
```

#### 3. **Redeems Collection Integrity**

```typescript
interface RedeemIntegrityIssue {
  redeemId: string;
  issues: string[];
}

async function verifyRedeemsCollection(): Promise<RedeemIntegrityIssue[]> {
  const db = getDb();
  const issues: RedeemIntegrityIssue[] = [];

  const redeemsSnap = await db.collection('redeems').get();

  for (const doc of redeemsSnap.docs) {
    const data = doc.data();
    const redeemIssues: string[] = [];

    // Check clientId foreign key
    if (!data.clientId) {
      redeemIssues.push('Missing clientId');
    } else {
      const clientSnap = await db.collection('clients').doc(data.clientId).get();
      if (!clientSnap.exists) {
        redeemIssues.push(`Orphaned redeem: clientId ${data.clientId} does not exist`);
      }
    }

    // Check passId foreign key (if present)
    if (data.passId) {
      const passSnap = await db.collection('passes').doc(data.passId).get();
      if (!passSnap.exists) {
        redeemIssues.push(`Orphaned redeem: passId ${data.passId} does not exist`);
      }
    }

    // Check kind
    if (!['pass', 'dropin', 'renewal'].includes(data.kind)) {
      redeemIssues.push(`Invalid kind: ${data.kind}`);
    }

    if (redeemIssues.length > 0) {
      issues.push({ redeemId: doc.id, issues: redeemIssues });
    }
  }

  return issues;
}
```

#### 4. **Generate Report**

```typescript
interface IntegrityReport {
  timestamp: string;
  totalClients: number;
  totalPasses: number;
  totalRedeems: number;
  clientIssues: ClientIntegrityIssue[];
  passIssues: PassIntegrityIssue[];
  redeemIssues: RedeemIntegrityIssue[];
  summary: {
    clientsWithIssues: number;
    passesWithIssues: number;
    redeemsWithIssues: number;
    totalIssues: number;
  };
}

async function generateIntegrityReport(): Promise<IntegrityReport> {
  console.log('🔍 Starting data integrity verification...');

  const [clientIssues, passIssues, redeemIssues] = await Promise.all([
    verifyClientsCollection(),
    verifyPassesCollection(),
    verifyRedeemsCollection()
  ]);

  const db = getDb();
  const [clientsSnap, passesSnap, redeemsSnap] = await Promise.all([
    db.collection('clients').count().get(),
    db.collection('passes').count().get(),
    db.collection('redeems').count().get()
  ]);

  const report: IntegrityReport = {
    timestamp: new Date().toISOString(),
    totalClients: clientsSnap.data().count,
    totalPasses: passesSnap.data().count,
    totalRedeems: redeemsSnap.data().count,
    clientIssues,
    passIssues,
    redeemIssues,
    summary: {
      clientsWithIssues: clientIssues.length,
      passesWithIssues: passIssues.length,
      redeemsWithIssues: redeemIssues.length,
      totalIssues: clientIssues.length + passIssues.length + redeemIssues.length
    }
  };

  return report;
}
```

### Parent-Web Verification

**Manual Tests:**

1. **Access parent-web with test token**:
   ```bash
   # Get test client token from admin portal
   # Open parent-web: http://localhost:5174?token=XXXX
   ```

2. **Verify parent-web displays**:
   - [ ] Parent name shown correctly
   - [ ] Child name shown correctly
   - [ ] Pass details (planSize, used, remaining)
   - [ ] Expiration date
   - [ ] QR code generated (contains token)
   - [ ] Status badge (active/expiring/expired)
   - [ ] Last visit date (if available)

3. **Test API endpoint directly**:
   ```bash
   # Get token from clients collection
   curl "http://localhost:3000/api/v1/card?token=CLIENT_TOKEN"
   ```

   Expected response:
   ```json
   {
     "name": "Parent Name",
     "childName": "Child Name",
     "planSize": 10,
     "used": 3,
     "remaining": 7,
     "expiresAt": "2025-12-01T00:00:00.000Z"
   }
   ```

4. **Test with invalid token**:
   ```bash
   curl "http://localhost:3000/api/v1/card?token=INVALID"
   ```

   Expected: 404 error

### Repair Script (If Issues Found)

**Script**: `services/core-api/scripts/repair-data-integrity.ts`

```typescript
async function repairSearchTokens() {
  const db = getDb();
  const clientsSnap = await db.collection('clients').get();

  console.log(`🔧 Repairing searchTokens for ${clientsSnap.size} clients...`);

  const batch = db.batch();
  let repairCount = 0;

  for (const doc of clientsSnap.docs) {
    const data = doc.data();

    // Regenerate correct tokens
    const correctTokens = generateSearchTokens({
      parentName: data.parentName,
      childName: data.childName,
      phone: data.phone,
      telegram: data.telegram,
      instagram: data.instagram
    });

    // Check if repair needed
    const storedTokens = Array.isArray(data.searchTokens) ? data.searchTokens : [];
    const needsRepair =
      storedTokens.length !== correctTokens.length ||
      correctTokens.some(t => !storedTokens.includes(t));

    if (needsRepair) {
      batch.update(doc.ref, { searchTokens: correctTokens });
      repairCount++;
    }
  }

  if (repairCount > 0) {
    await batch.commit();
    console.log(`✅ Repaired searchTokens for ${repairCount} clients`);
  } else {
    console.log(`✅ All searchTokens are correct, no repairs needed`);
  }
}
```

### Performance Requirements

- Verification script: <60 seconds for 10k clients
- Repair script: <120 seconds for 10k clients
- Parent-web API: <500ms response time
- No data loss during repair

## Edge Cases to Handle

- Clients without passes (valid scenario)
- Clients with multiple passes (only active one shown in parent-web)
- Expired passes (parent-web should show "expired" status)
- Clients with archived status (active=false)
- Missing optional fields (phone, telegram, instagram)
- Very long names (>100 chars)
- Special characters in names (emojis, diacritics)

## Out of Scope

- Performance optimization of parent-web
- UI/UX improvements for parent-web
- Adding new features to parent-web
- Historical data migration (only current data)
- Third-party integrations

## Quality Review Checklist

### For Implementer (Before Marking Complete)

- [ ] Verification script created and tested
- [ ] All integrity checks implemented
- [ ] Integrity report generated (JSON + human-readable)
- [ ] Repair script created (if issues found)
- [ ] Repair script is idempotent (safe to re-run)
- [ ] Parent-web API tested manually
- [ ] Parent-web UI tested in browser
- [ ] No data loss during verification/repair
- [ ] All quality gates pass (lint, typecheck, build)
- [ ] Changes committed with proper conventional commit message

### For Quality Reviewer (quality-reviewer agent)

- [ ] Verification logic covers all critical fields
- [ ] Repair logic is safe (no data deletion)
- [ ] Integrity report is comprehensive
- [ ] Parent-web functionality verified
- [ ] No breaking changes to API
- [ ] Code follows TypeScript strict mode
- [ ] Error handling implemented
- [ ] Git commit follows conventions

## Transition Log

| Date Time           | From  | To      | Agent             | Reason/Comment                     |
| ------------------- | ----- | ------- | ----------------- | ---------------------------------- |
| 2025-11-03 14:48:25 | draft | pending | task-engineer | Data integrity verification task |

## Implementation Notes

<!-- database-engineer adds notes during work -->

## Quality Review Comments

<!-- quality-reviewer agent adds review feedback here -->

## Version Control Log

<!-- database-engineer updates this when committing -->

## Evidence of Completion

<!-- Paste evidence showing integrity verified -->

```bash
# Run verification
$ cd services/core-api
$ npm run verify:data-integrity

🔍 Starting data integrity verification...
✓ Checked 1,234 clients
✓ Checked 2,456 passes
✓ Checked 8,901 redeems

📊 Integrity Report:
✅ Clients: 1,234 total, 0 with issues
✅ Passes: 2,456 total, 0 with issues
✅ Redeems: 8,901 total, 0 with issues

✅ Database integrity: PASSED

# Test parent-web API
$ curl "http://localhost:3000/api/v1/card?token=TEST_TOKEN"
{
  "name": "Test Parent",
  "childName": "Test Child",
  "planSize": 10,
  "used": 3,
  "remaining": 7,
  "expiresAt": "2025-12-01T00:00:00.000Z"
}
✅ Parent-web API: WORKING

# Manual UI test
✅ Parent-web displays pass correctly
✅ QR code generated correctly
✅ Status badge shows correct state
```

## References

- [Client Search Architecture](../docs/architecture/client-search-system.md)
- [Firestore Collections Schema](../README.md#data-model)
- [Parent-Web README](../web/parent-web/README.md)
