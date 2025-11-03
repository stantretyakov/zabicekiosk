# Parent-Web Testing Guide

This guide explains how to verify that parent-web functionality is working correctly after the data integrity verification and repair.

## Background

The parent-web application allows parents to view their passes using a token-based authentication system. After the buggy backfill, we need to verify that:
- Token lookups work correctly
- Client data is displayed accurately
- Pass information is correct
- QR codes are generated properly

## Parent-Web Architecture

```
Parent visits URL: https://parent-web/?token=ABC123
                   ↓
              Browser loads React app
                   ↓
              App calls: GET /api/v1/card?token=ABC123
                   ↓
              core-api/src/routes/public.card.ts
                   ↓
              1. Hash token with HMAC-SHA256
              2. Query: clients.where('tokenHash', '==', hash)
              3. Query: passes.where('clientId', '==', clientId)
              4. Return: { name, childName, planSize, used, remaining, expiresAt }
                   ↓
              Parent-web displays pass card with QR code
```

## Manual Testing Procedure

### Step 1: Start Development Environment

```bash
# Terminal 1: Start Firebase emulators (or use production)
firebase emulators:start

# Terminal 2: Start core-api
cd services/core-api
npm run dev

# Terminal 3: Start parent-web
cd web/parent-web
npm run dev
```

### Step 2: Get Test Token

**Option A: From Admin Portal**
1. Open admin portal: http://localhost:3000
2. Navigate to Clients list
3. Click on a client with an active pass
4. Copy the token from the client details

**Option B: From Database Directly**
```javascript
// In Firebase console or emulator UI
db.collection('clients').where('active', '==', true).limit(1).get()
  .then(snap => console.log(snap.docs[0].data().token))
```

**Option C: Using curl**
```bash
# Get client ID from admin portal, then:
curl "http://localhost:3001/api/v1/admin/clients/{CLIENT_ID}/token" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Step 3: Test API Endpoint

```bash
# Replace TOKEN_HERE with actual token from Step 2
curl "http://localhost:3001/api/v1/card?token=TOKEN_HERE"
```

**Expected Response:**
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

**Error Cases to Test:**

```bash
# Invalid token - should return 404
curl "http://localhost:3001/api/v1/card?token=INVALID_TOKEN_123"

# Expected response:
{
  "status": "error",
  "message": "Not found"
}
```

### Step 4: Test Parent-Web UI

1. Open parent-web: `http://localhost:5174?token=TOKEN_HERE`
2. Verify the following elements are displayed correctly:

**✅ Checklist:**

- [ ] **Parent name** displays correctly
- [ ] **Child name** displays correctly
- [ ] **Pass type** shows (e.g., "10 Sessions")
- [ ] **Sessions used** shows correct number (e.g., "3 / 10")
- [ ] **Sessions remaining** shows correct number (e.g., "7 remaining")
- [ ] **Expiration date** displays in correct format
- [ ] **Status badge** shows correct state:
  - Green "Active" if: remaining > 0 AND not expired
  - Yellow "Expiring Soon" if: expires within 7 days
  - Red "Expired" if: past expiration date
- [ ] **QR code** is visible and readable
- [ ] **QR code content** equals the token (scan with phone to verify)
- [ ] **Last visit date** displays (if client has redeems)
- [ ] **No console errors** in browser DevTools

### Step 5: Test Edge Cases

**Test with expired pass:**
1. Find client with expired pass
2. Load parent-web with their token
3. Verify status shows "Expired"
4. Verify UI shows appropriate warning

**Test with fully used pass:**
1. Find client with used === planSize
2. Load parent-web with their token
3. Verify remaining shows 0
4. Verify status reflects full usage

**Test with multiple passes:**
1. Find client with multiple passes
2. Load parent-web with their token
3. Verify it shows the most recent active pass
4. Verify expired passes are not shown

**Test with archived client:**
1. Archive a client from admin portal (soft delete)
2. Try to load parent-web with their old token
3. Verify it returns 404 error

## Automated Testing

For automated testing, create a test script:

```bash
#!/bin/bash
# test-parent-web-api.sh

API_URL="${API_URL:-http://localhost:3001}"

echo "Testing parent-web API endpoint..."

# Test valid token
RESPONSE=$(curl -s "${API_URL}/api/v1/card?token=${TEST_TOKEN}")
if echo "$RESPONSE" | grep -q "name"; then
  echo "✅ Valid token test: PASSED"
else
  echo "❌ Valid token test: FAILED"
  exit 1
fi

# Test invalid token
RESPONSE=$(curl -s -w "%{http_code}" "${API_URL}/api/v1/card?token=INVALID")
if echo "$RESPONSE" | grep -q "404"; then
  echo "✅ Invalid token test: PASSED"
else
  echo "❌ Invalid token test: FAILED"
  exit 1
fi

echo "✅ All parent-web API tests passed"
```

## Common Issues

### Issue: "Not found" for valid token

**Possible causes:**
1. Token hash mismatch (TOKEN_SECRET incorrect)
2. Client archived (active=false)
3. tokenHash field missing or wrong in database

**Solution:**
```bash
cd services/core-api
npm run repair:data-integrity:dry-run
```

### Issue: Wrong pass data displayed

**Possible causes:**
1. Orphaned pass (clientId points to wrong client)
2. Multiple passes, wrong one selected
3. Pass data outdated

**Solution:**
```bash
cd services/core-api
npm run verify:data-integrity
# Check pass integrity section of report
```

### Issue: QR code not generating

**Possible causes:**
1. Token missing from API response
2. React component error
3. Browser console shows errors

**Solution:**
1. Check browser console for errors
2. Verify API response includes all required fields
3. Check parent-web component code

## Performance Benchmarks

Expected response times:

| Endpoint | Target | Acceptable | Slow |
|----------|--------|------------|------|
| GET /api/v1/card | < 200ms | < 500ms | > 1s |

**To measure:**
```bash
# Use curl with timing
curl -w "@curl-format.txt" "http://localhost:3001/api/v1/card?token=TOKEN"

# curl-format.txt content:
time_namelookup:  %{time_namelookup}s\n
time_connect:     %{time_connect}s\n
time_total:       %{time_total}s\n
```

## Database Queries Used

The parent-web API makes these Firestore queries:

1. **Client lookup:**
   ```javascript
   clients
     .where('tokenHash', '==', hashToken(token))
     .limit(1)
     .get()
   ```
   - Uses composite index on `tokenHash`
   - Should return in < 100ms

2. **Passes lookup:**
   ```javascript
   passes
     .where('clientId', '==', clientId)
     .get()
   ```
   - Uses composite index on `clientId`
   - Should return in < 100ms

Total query time: < 200ms for both queries.

## Security Considerations

1. **Token is sensitive:** Never log tokens in production
2. **HMAC secret:** TOKEN_SECRET must match between services
3. **No authentication required:** /api/v1/card is public (token is the auth)
4. **Rate limiting:** Consider adding rate limits to prevent token brute-force

## Monitoring

In production, monitor:
- `/api/v1/card` response times
- 404 rate (should be low if tokens are valid)
- Error rate (should be near 0%)

## References

- Parent-Web API: `services/core-api/src/routes/public.card.ts`
- Parent-Web UI: `web/parent-web/src/`
- Token generation: `services/core-api/src/lib/tokens.ts`
- Task: `.backlog/in-progress/infra-004-verify-data-integrity-and-parent-web.md`
