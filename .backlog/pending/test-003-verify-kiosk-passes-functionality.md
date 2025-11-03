# Task: Verify Kiosk, Passes, and Accounting Functionality

## Metadata

- **ID**: test-003-verify-kiosk-passes-functionality
- **Status**: pending
- **Priority**: critical
- **Estimated Hours**: 2
- **Assigned Agent**: test-engineer
- **Dependencies**: feature-001-fix-client-search-critical-bug
- **Rejection Count**: 0
- **Created By**: task-engineer
- **Created At**: 2025-11-03 14:48:25 UTC
- **Documentation**: none

## Description

**User reported** that after the client search changes, kiosk functionality and client creation stopped working properly. This task verifies that all key features still work correctly after the search fixes:

1. **Kiosk functionality** (QR code scanning, pass redemption)
2. **Pass management** (create, renew, revoke)
3. **Accounting** (redeem tracking, pass usage statistics)
4. **Client creation** (via admin portal)

**Goal**: Verify NO regressions in core business functionality.

## Acceptance Criteria

- [ ] Kiosk can scan QR codes and redeem passes
- [ ] Kiosk handles single visits (no pass)
- [ ] Kiosk shows correct cooldown errors
- [ ] Admin can create new clients
- [ ] Admin can create passes for clients
- [ ] Admin can renew passes (single and bulk)
- [ ] Admin can revoke passes
- [ ] Pass usage tracked correctly in redeems collection
- [ ] Accounting statistics accurate (remaining visits, expiration)
- [ ] Client-pass relationships intact (passes.clientId → clients.id)
- [ ] All manual tests pass
- [ ] Quality gates pass (lint, typecheck, build, test)
- [ ] Changes committed with proper conventional commit message

## Technical Requirements

### Manual Testing Checklist

#### 1. Kiosk Functionality

**File**: `web/kiosk-pwa`

**Test Cases:**

```bash
# Start kiosk in dev mode
cd web/kiosk-pwa
npm run dev
```

- [ ] **Setup**: Kiosk registration works
  - Open http://localhost:5173
  - Configure location and description
  - Verify kiosk ID generated and stored

- [ ] **QR Code Scanning**: Pass redemption works
  - Create test client in admin portal
  - Generate pass for test client
  - Get client token (QR code value)
  - Scan token in kiosk
  - Verify: Success message, remaining visits shown, sound plays

- [ ] **Pass with multiple visits**: Redemption decrements correctly
  - Create pass with planSize=10
  - Redeem 3 times
  - Verify: remaining shows 10→9→8→7
  - Check passes collection: used=0→1→2→3

- [ ] **Expired pass**: Cooldown period respected
  - Redeem pass
  - Try to redeem again immediately
  - Verify: Error "COOLDOWN" shown

- [ ] **Single visit** (no pass): Recorded correctly
  - Scan client token without active pass
  - Verify: Success message for single visit
  - Check redeems collection: kind='single'

- [ ] **Invalid token**: Error handling works
  - Scan invalid QR code
  - Verify: Error message "Invalid QR code"

#### 2. Client Creation (Admin Portal)

**File**: `web/admin-portal/src/pages/Clients.tsx`

```bash
cd web/admin-portal
npm run dev
```

- [ ] **Create client**: Form works correctly
  - Navigate to /clients
  - Click "Add Client"
  - Fill form: parentName, childName, phone, telegram, instagram
  - Submit
  - Verify: Client appears in list immediately
  - Verify: Search finds new client by name

- [ ] **Search new client**: Tokens generated correctly
  - Search for newly created client by parent name
  - Verify: Client found
  - Check Firestore: searchTokens array populated

- [ ] **Edit client**: Update works
  - Click edit on client
  - Change parent name
  - Save
  - Verify: Changes reflected in list
  - Verify: Search still finds client

- [ ] **Archive client**: Soft delete works
  - Archive a client
  - Verify: Client no longer in default list
  - Filter by active=false
  - Verify: Archived client shown

#### 3. Pass Management

**File**: `web/admin-portal/src/pages/Passes.tsx`

- [ ] **Create pass**: Sell pass to client
  - Navigate to /passes
  - Click "Sell Pass"
  - Search for client (verify search works!)
  - Select client
  - Choose plan (e.g., 10 visits, 30 days)
  - Enter price
  - Submit
  - Verify: Pass created and appears in list

- [ ] **View pass details**: Client info populated
  - View pass in list
  - Verify: Client name (parentName + childName) shown
  - Verify: Remaining visits calculated correctly
  - Verify: Expiration date shown

- [ ] **Renew pass (single)**: Works correctly
  - Click "Renew" on a pass
  - Enter renewal options (keep remaining visits)
  - Submit
  - Verify: Pass updated (planSize increased, expiration extended)
  - Check redeems: kind='renewal' entry created

- [ ] **Renew passes (bulk)**: Multiple passes renewed
  - Select 3+ passes (checkboxes)
  - Click "Renew Selected"
  - Enter renewal options
  - Submit
  - Verify: All passes renewed
  - Verify: Renewal log entries created for each

- [ ] **Revoke pass**: Soft delete works
  - Click "Revoke" on a pass
  - Confirm
  - Verify: Pass no longer shown (revoked=true)

#### 4. Accounting and Statistics

**Collections**: `redeems`, `passes`, `clients`

- [ ] **Redeem tracking**: All redemptions logged
  - Redeem pass 5 times via kiosk
  - Query redeems collection
  - Verify: 5 entries with passId, clientId, delta=-1, kind='use'

- [ ] **Pass usage statistics**: Accurate counts
  - Check pass with 10 visits, used 3 times
  - Verify: planSize=10, used=3, remaining=7
  - Verify: expiresAt date correct

- [ ] **Renewal logging**: Renewal tracked correctly
  - Renew a pass
  - Check redeems collection
  - Verify: Entry with kind='renewal', delta=+10 (or planSize)
  - Verify: note field describes renewal

- [ ] **Client-pass relationships**: Foreign keys valid
  - Query pass
  - Verify: clientId exists in clients collection
  - Query client
  - Verify: Can list passes for this client

- [ ] **Kiosk tracking**: Kiosk activity logged
  - Query redeems for specific kioskId
  - Verify: All redemptions have kioskId
  - Check kiosks collection: lastSeen timestamp updated

#### 5. Database Integrity

**Firestore Collections**: `clients`, `passes`, `redeems`, `kiosks`

- [ ] **Clients collection**: Fields correct
  - Query a client document
  - Verify fields: parentName, childName, phone, telegram, instagram, active, fullNameLower, searchTokens[], createdAt, updatedAt, token, tokenHash

- [ ] **Passes collection**: Fields correct
  - Query a pass document
  - Verify fields: clientId, planSize, basePlanSize, used, purchasedAt, expiresAt, validityDays, revoked, renewedAt, renewalCount

- [ ] **Redeems collection**: Entries logged
  - Query redeems by passId
  - Verify entries have: ts, passId, clientId, delta, kind

- [ ] **SearchTokens**: Optimized correctly
  - Query clients with long names (>8 chars)
  - Verify: searchTokens array size <3KB
  - Verify: Contains prefixes (2-4 chars) + full word

### Integration Tests (Automated)

**File**: `services/core-api/src/routes/__tests__/integration.test.ts`

```typescript
describe('End-to-end workflow integration', () => {
  it('should complete full workflow: create client → sell pass → redeem → renew', async () => {
    // 1. Create client
    const client = await request(app)
      .post('/admin/clients')
      .send({
        parentName: 'Test Parent',
        childName: 'Test Child',
        phone: '+381777999888'
      });
    expect(client.status).toBe(200);
    const clientId = client.body.id;

    // 2. Search for client (verify searchTokens work)
    const search = await request(app).get('/admin/clients?search=test');
    expect(search.body.items.some(c => c.id === clientId)).toBe(true);

    // 3. Create pass
    const pass = await request(app)
      .post('/admin/passes')
      .send({
        clientId,
        planSize: 10,
        validityDays: 30,
        priceRSD: 5000
      });
    expect(pass.status).toBe(200);
    const passId = pass.body.id;

    // 4. Redeem pass via kiosk
    const redeem = await request(app)
      .post('/redeem')
      .send({
        clientId,
        kioskId: 'test-kiosk',
        ts: new Date().toISOString()
      });
    expect(redeem.body.status).toBe('ok');
    expect(redeem.body.remaining).toBe(9);

    // 5. Renew pass
    const renew = await request(app)
      .post(`/admin/passes/${passId}/renew`)
      .send({
        validityDays: 30,
        priceRSD: 5000,
        keepRemaining: true
      });
    expect(renew.status).toBe(200);
    expect(renew.body.planSize).toBe(19); // 10 base + 9 remaining

    // 6. Verify redeems logged
    const redeems = await db.collection('redeems')
      .where('passId', '==', passId)
      .get();
    expect(redeems.docs.length).toBe(2); // 1 use + 1 renewal
  });
});
```

### Performance Requirements

- Client creation: <500ms
- Pass creation: <500ms
- Kiosk redeem: <1000ms
- Pass renewal: <1000ms
- Search latency: <200ms (verified in search tests)

## Edge Cases to Handle

- Client with no passes (single visit redemption)
- Pass with 0 remaining visits (should show "expired")
- Pass expiration exactly at redemption time
- Concurrent redemptions (cooldown check)
- Kiosk offline mode (not implemented, document limitation)
- Client with invalid phone number format
- Pass with missing validityDays (fallback to 30)

## Out of Scope

- Performance testing (1000+ concurrent users)
- Offline kiosk mode (future feature)
- Email notifications (not implemented)
- Payment processing integration (manual for now)
- Multi-language UI testing (handled separately)

## Quality Review Checklist

### For Implementer (Before Marking Complete)

- [ ] All manual test cases executed and passed
- [ ] Integration test written and passing
- [ ] Kiosk functionality verified (redeem works)
- [ ] Pass management verified (create, renew, revoke)
- [ ] Accounting verified (redeems tracked correctly)
- [ ] Client-pass relationships verified (foreign keys valid)
- [ ] SearchTokens optimization verified (<3KB)
- [ ] Database integrity checked (all fields correct)
- [ ] No regressions found
- [ ] Test evidence documented (screenshots, logs)
- [ ] Quality gates pass (lint, typecheck, build, test)
- [ ] Changes committed with proper conventional commit message

### For Quality Reviewer (quality-reviewer agent)

- [ ] All acceptance criteria met
- [ ] Manual tests properly documented
- [ ] Integration test covers full workflow
- [ ] No regressions in core functionality
- [ ] Database integrity verified
- [ ] Performance requirements met
- [ ] Test evidence adequate (screenshots, logs)
- [ ] Git commit follows conventions

## Transition Log

| Date Time           | From  | To      | Agent         | Reason/Comment              |
| ------------------- | ----- | ------- | ------------- | --------------------------- |
| 2025-11-03 14:48:25 | draft | pending | task-engineer | Verification task created |

## Implementation Notes

<!-- test-engineer adds notes during testing -->

## Quality Review Comments

<!-- quality-reviewer agent adds review feedback here -->

## Version Control Log

<!-- test-engineer updates this when committing -->

## Evidence of Completion

<!-- Paste evidence showing tests passed -->

```bash
# Manual tests
✓ Kiosk QR scanning works
✓ Pass redemption works
✓ Client creation works
✓ Pass renewal works (single + bulk)
✓ Accounting accurate

# Integration test
$ npm test -- integration
✓ Full workflow test passed

# Screenshots
- kiosk-redeem-success.png
- admin-create-client.png
- admin-sell-pass.png
- admin-renew-passes.png
```

## References

- [Client Search Architecture](../docs/architecture/client-search-system.md)
- [Kiosk PWA README](../web/kiosk-pwa/README.md)
- [Admin Portal README](../web/admin-portal/README.md)
