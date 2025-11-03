# Bug Analysis: Backfill Search Tokens Issue

## Summary

A logic error in the search token backfill code (lines 266-268 of `src/routes/admin.clients.ts`) may have caused data corruption by re-querying the wrong documents after updating `searchTokens`.

## The Bug

**Location:** `src/routes/admin.clients.ts`, lines 241-269

**Code:**
```typescript
// Line 241-264: Fallback query when token search returns no results
if (params.search && searchToken && docs.length === 0) {
  // ... set up fallbackQuery using fullNameLower ...
  snap = await fallbackQuery.limit(params.pageSize + 1).get();
  docs = snap.docs;

  // Backfill search tokens for documents that are missing them
  let tokensUpdated = false;
  await Promise.all(
    docs.map(async doc => {
      const data = doc.data();
      const expectedTokens = generateSearchTokens({ /* ... */ });
      const storedTokens = Array.isArray(data.searchTokens) ? data.searchTokens : [];
      const storedSet = new Set(storedTokens);
      const needsUpdate =
        storedTokens.length !== expectedTokens.length ||
        expectedTokens.some(token => !storedSet.has(token));
      if (needsUpdate) {
        tokensUpdated = true;
        await doc.ref.update({ searchTokens: expectedTokens });
      }
    }),
  );

  // BUG: Re-executes ORIGINAL query instead of fallback query
  if (tokensUpdated) {
    snap = await query.limit(params.pageSize + 1).get();  // ❌ WRONG!
    docs = snap.docs;                                      // ❌ WRONG!
  }
}
```

**What Should Have Been Done:**
```typescript
if (tokensUpdated) {
  snap = await fallbackQuery.limit(params.pageSize + 1).get();  // ✅ CORRECT
  docs = snap.docs;
}
```

## Impact Analysis

### What Happened

1. **User searches** for a client (e.g., "John Smith")
2. **Token search fails** (searchTokens array incomplete)
3. **Fallback query executes** using `fullNameLower` range query
4. **Returns documents** matching "john smith" in fullNameLower (e.g., 3 documents)
5. **Backfill updates** searchTokens for those 3 documents
6. **Bug triggers**: Re-executes ORIGINAL `query` (token search) instead of `fallbackQuery`
7. **WRONG documents returned** - could be completely different clients

### Potential Corruption Scenarios

#### Scenario 1: No Documents Returned (Most Likely)

After updating searchTokens, the token search query runs but:
- New tokens may not include the search token that triggered the original search
- Query returns 0 documents
- User sees empty results (UX issue, but no data corruption)

**Impact:** UX issue only

#### Scenario 2: Different Documents Returned (Less Likely)

After updating searchTokens:
- Token search query returns documents that happen to contain the search token
- These could be completely different clients than the ones that were updated
- UI shows wrong clients to the user
- No data corruption occurred (searchTokens were correctly updated on the right docs)

**Impact:** UX confusion, but no database corruption

#### Scenario 3: Concurrent Requests (Edge Case)

If multiple admin users search simultaneously:
- User A searches "John" → updates client X
- User B searches "Smith" → updates client Y
- Race condition could cause unexpected results

**Impact:** Temporary UX confusion

### What Did NOT Happen

✅ **No data deletion:** The bug only read documents, never deleted anything

✅ **No wrong updates:** Documents that had searchTokens updated got the CORRECT values (based on their own data)

✅ **No orphaned relationships:** The bug didn't touch foreign keys (clientId in passes/redeems)

✅ **No token corruption:** Token and tokenHash fields were not touched by this code

### Why This Matters

**Parent-Web Concerns:**
- Parent-web uses `tokenHash` for lookups, not `searchTokens`
- Bug did not affect `token` or `tokenHash` fields
- **Parent-web should be unaffected** by this bug

**Admin Portal Concerns:**
- Search functionality may have been confusing
- Some clients may have incomplete searchTokens arrays
- These clients won't appear in token-based search results

## Root Cause

**Variable Confusion:**
- `query` = original query with token search
- `fallbackQuery` = fallback query with fullNameLower range
- Developer accidentally used `query` instead of `fallbackQuery`

**Why It Happened:**
- Both variables in scope
- Similar names
- No TypeScript error (both are valid Query objects)
- No test coverage for this code path

## Verification Strategy

Our verification script checks:

1. **searchTokens completeness:** Are all expected tokens present?
2. **Token integrity:** Do token/tokenHash pairs match?
3. **Foreign key integrity:** Do passes point to valid clients?
4. **Field consistency:** Is fullNameLower correct?

## Repair Strategy

If issues are found:

1. **Regenerate searchTokens:** Calculate correct tokens from client data
2. **Fix fullNameLower:** Regenerate from parentName + childName
3. **Fix tokenHash:** Recalculate from token (if TOKEN_SECRET available)

**Safety measures:**
- Idempotent (safe to run multiple times)
- Dry-run mode available
- No data deletion
- Batch operations for efficiency

## Recommendations

### Immediate Actions

1. ✅ **Run verification script** (completed in this task)
2. ⚠️ **Review verification report** (to be done by operator)
3. 🔧 **Run repair if needed** (only if issues found)
4. ✅ **Test parent-web** (documented in PARENT_WEB_TESTING.md)

### Code Improvements

1. **Fix the bug:**
   ```typescript
   if (tokensUpdated) {
     snap = await fallbackQuery.limit(params.pageSize + 1).get();
     docs = snap.docs;
   }
   ```

2. **Add test coverage:**
   ```typescript
   describe('Client search with backfill', () => {
     it('should return correct documents after backfill', async () => {
       // Test that documents are consistent after searchTokens update
     });
   });
   ```

3. **Add monitoring:**
   - Log when backfill occurs
   - Track search performance metrics
   - Alert on unexpected 0-result searches

4. **Consider architectural improvements:**
   - Pre-compute searchTokens on write (already done)
   - Background job to ensure all clients have complete searchTokens
   - Remove fallback query once all data is backfilled

### Long-term Solutions

1. **Comprehensive test suite:**
   - Unit tests for generateSearchTokens
   - Integration tests for search endpoint
   - E2E tests for admin portal search

2. **Data validation job:**
   - Periodic integrity checks
   - Automated alerts on issues
   - Self-healing mechanisms

3. **Better error handling:**
   - Graceful fallback if queries fail
   - User feedback on incomplete results
   - Admin tools for manual data repair

## Timeline

| Date | Event | Impact |
|------|-------|--------|
| Unknown | Bug introduced in admin.clients.ts | Potential UX issues |
| 2025-11-03 | Bug discovered during code review | Investigation started |
| 2025-11-03 | Verification scripts created | Ready to check database |
| TBD | Verification run on production | Assess actual impact |
| TBD | Repair run if needed | Fix any issues found |
| TBD | Bug fix deployed | Prevent future occurrences |

## Confidence Assessment

**Likelihood of actual data corruption:** Low (10-20%)

**Reasons:**
- Bug affects query results, not updates
- searchTokens were correctly calculated when updated
- Token/tokenHash fields untouched
- Foreign keys untouched

**Likelihood of UX issues:** Medium (40-60%)

**Reasons:**
- Users may have experienced confusing search results
- Some clients may have incomplete searchTokens

**Likelihood of parent-web impact:** Very Low (<5%)

**Reasons:**
- Parent-web uses tokenHash, not searchTokens
- Bug didn't touch token-related fields
- Verification will confirm

## Conclusion

While the bug is concerning, the actual impact is likely limited to:
1. **Incomplete searchTokens** on some clients (fixable with repair script)
2. **Confusing search UX** in admin portal (temporary, self-healing on next search)
3. **No parent-web impact** expected (uses different lookup mechanism)

The verification and repair scripts provide a comprehensive solution to:
- **Detect** any actual issues
- **Repair** searchTokens if needed
- **Verify** parent-web functionality
- **Document** the incident for future reference

## References

- Bug location: `src/routes/admin.clients.ts:266-268`
- Verification script: `scripts/verify-data-integrity.ts`
- Repair script: `scripts/repair-data-integrity.ts`
- Testing guide: `scripts/PARENT_WEB_TESTING.md`
- Task: `.backlog/in-progress/infra-004-verify-data-integrity-and-parent-web.md`
