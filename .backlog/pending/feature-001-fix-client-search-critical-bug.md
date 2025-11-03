# Task: Fix Critical Client Search Bug and Optimize Performance

## Metadata

- **ID**: feature-001-fix-client-search-critical-bug
- **Status**: pending
- **Priority**: critical
- **Estimated Hours**: 4
- **Assigned Agent**: typescript-engineer
- **Dependencies**: none
- **Rejection Count**: 0
- **Created By**: task-engineer
- **Created At**: 2025-11-03 14:48:25 UTC
- **Documentation**: docs/architecture/client-search-system.md, docs/architecture/ADR-001-client-search-optimization.md

## Description

**CRITICAL BUG**: The client search system in `services/core-api/src/routes/admin.clients.ts` has a critical bug at line 267 that causes incorrect search results and breaks kiosk/client creation workflow.

**Root Cause**: After backfilling search tokens, the code re-executes the wrong query (`query` instead of `fallbackQuery`), returning empty or incorrect results.

**Impact**:
- Search returns wrong/empty results
- Client creation may fail
- Kiosk functionality affected
- Database relationships appear broken (though they're intact)

**Solution**: Implement the optimized client search architecture designed by lean-architect with:
- Fixed query logic at line 267
- Optimized token generation (60% storage reduction)
- Proper backfill mechanism
- Comprehensive error handling

## Acceptance Criteria

- [ ] Critical bug at line 267 fixed (correct query executed after backfill)
- [ ] Optimized token generation implemented (short/long word optimization)
- [ ] Token size limit enforcement (skip docs >40KB)
- [ ] Search works for all fields: parentName, childName, phone, telegram, instagram
- [ ] Diacritic-insensitive search works ("jose" finds "José")
- [ ] Cyrillic search works ("ана" finds "Анастасия")
- [ ] Phone number search works (last 6+ digits)
- [ ] Social media handle search works (@username, URLs)
- [ ] Pagination works correctly with backfill
- [ ] All tests pass (unit, integration)
- [ ] Quality gates pass (lint, typecheck, build, test)
- [ ] Changes committed with proper conventional commit message

## Technical Requirements

### Implementation Details

**File**: `services/core-api/src/routes/admin.clients.ts`

**Critical Fix (Line 267):**
```typescript
// ❌ CURRENT (BROKEN):
if (tokensUpdated) {
  snap = await query.limit(params.pageSize + 1).get();
  docs = snap.docs;
}

// ✅ FIXED:
if (tokensUpdated) {
  let refetchQuery = fallbackQuery;
  if (pageAnchor) {
    refetchQuery = refetchQuery.startAfter(pageAnchor);
  }
  snap = await refetchQuery.limit(params.pageSize + 1).get();
  docs = snap.docs;
}
```

**Optimized Token Generation:**
```typescript
function generateWordPrefixes(word: string, options?: { limit?: number }): string[] {
  const prefixes: string[] = [];
  const limit = options?.limit;

  for (let i = 2; i <= word.length; i++) {
    prefixes.push(word.substring(0, i));

    // For long words, skip middle prefixes
    if (limit && i === 4 && word.length > 8) {
      // Jump to full word
      if (word.length > 4) {
        prefixes.push(word);
      }
      break;
    }
  }

  return prefixes;
}

function generateSearchTokens(fields: SearchableFields): string[] {
  const tokens = new Set<string>();

  const addFromWords = (value?: string | null, options?: {
    includeCollapsed?: boolean;
    smartLimit?: boolean
  }) => {
    if (!value) return;
    const normalized = normalizeForSearch(value);
    if (!normalized) return;

    const words = normalized.split(' ').filter(Boolean);
    for (const word of words) {
      const prefixes = options?.smartLimit && word.length > 8
        ? generateWordPrefixes(word, { limit: 4 })
        : generateWordPrefixes(word);

      for (const prefix of prefixes) {
        tokens.add(prefix);
      }
    }

    if (options?.includeCollapsed && words.length > 1) {
      const collapsed = words.join('');
      if (collapsed.length <= 20) { // Limit collapsed size
        for (const prefix of generateWordPrefixes(collapsed, { limit: 4 })) {
          tokens.add(prefix);
        }
      }
    }
  };

  // Apply smart limiting to long names
  addFromWords(fields.parentName, { smartLimit: true });
  addFromWords(fields.childName, { smartLimit: true });

  // Phone, telegram, instagram (existing logic)
  // ... (rest of implementation from architecture doc)

  const tokenArray = Array.from(tokens).sort();

  // Safety check: Firestore field size limit
  const estimatedSize = JSON.stringify(tokenArray).length;
  if (estimatedSize > 40000) {
    console.warn(`Token array too large (${estimatedSize} bytes), truncating`);
    return tokenArray.slice(0, Math.floor(tokenArray.length / 2));
  }

  return tokenArray;
}
```

**Query Builder Functions:**
```typescript
function buildTokenQuery(
  db: FirebaseFirestore.Firestore,
  searchToken: string,
  activeFilter: string
): FirebaseFirestore.Query {
  let query: FirebaseFirestore.Query = db.collection('clients');
  if (activeFilter !== 'all') {
    query = query.where('active', '==', activeFilter === 'true');
  }
  return query
    .where('searchTokens', 'array-contains', searchToken)
    .orderBy('createdAt', 'desc');
}

function buildFallbackQuery(
  db: FirebaseFirestore.Firestore,
  searchTerm: string,
  activeFilter: string
): FirebaseFirestore.Query {
  let query: FirebaseFirestore.Query = db.collection('clients');
  if (activeFilter !== 'all') {
    query = query.where('active', '==', activeFilter === 'true');
  }
  const searchLower = searchTerm.trim().toLowerCase();
  return query
    .orderBy('fullNameLower')
    .startAt(searchLower)
    .endAt(`${searchLower}\uf8ff`);
}

function buildDefaultQuery(
  db: FirebaseFirestore.Firestore,
  activeFilter: string,
  orderBy: string,
  order: string
): FirebaseFirestore.Query {
  let query: FirebaseFirestore.Query = db.collection('clients');
  if (activeFilter !== 'all') {
    query = query.where('active', '==', activeFilter === 'true');
  }
  return query.orderBy(
    orderBy === 'parentName' ? 'parentName' : 'createdAt',
    order as 'asc' | 'desc'
  );
}
```

**Main GET /clients Handler Refactor:**
- Extract query building into separate functions
- Fix line 267 backfill bug
- Add proper error handling
- Preserve pagination correctly

### Testing Requirements

**Unit tests** (`services/core-api/src/routes/__tests__/admin.clients.test.ts`):
- Token generation for short words (≤4 chars)
- Token generation for long words (>8 chars)
- Token generation for Cyrillic names
- Token generation for phone numbers
- Token generation for social media handles
- Token size limit enforcement (>40KB)
- Query builder functions

**Integration tests** (`services/core-api/src/routes/__tests__/admin.clients.integration.test.ts`):
- Search by parent name prefix
- Search by child name prefix
- Search by phone (last digits)
- Search by telegram handle
- Search by instagram handle
- Search with diacritics ("jose" → "José")
- Search with Cyrillic ("ана" → "Анастасия")
- Pagination with search
- Backfill mechanism (token update and re-query)

### Performance Requirements

- Search latency: <200ms (p95) for 10k clients
- Token array size: <3KB per client (avg)
- Firestore reads per search: 20-50 reads
- No regressions in existing functionality

## Edge Cases to Handle

- **Empty search**: Return default listing (orderBy createdAt)
- **Single character search**: Fall back to fullNameLower range query
- **Token array >40KB**: Truncate and log warning
- **Concurrent updates**: Use Firestore transactions for safety
- **Missing fields**: Handle null/undefined gracefully
- **Invalid pagination token**: Ignore and start from beginning
- **Backfill during high traffic**: Batch updates, rate limit

## Out of Scope

- External search services (Algolia, Elasticsearch)
- Full-text search (not required)
- Fuzzy matching (not required)
- Typo tolerance (not required)
- Migration script (handled by devops agent)
- Frontend changes (handled separately if needed)

## Quality Review Checklist

### For Implementer (Before Marking Complete)

- [ ] Line 267 bug fixed
- [ ] Optimized token generation implemented
- [ ] All query builder functions implemented
- [ ] Token size limit check added
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code follows TypeScript strict mode
- [ ] No `any` types without justification
- [ ] ESLint passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] Test coverage >80%
- [ ] Error handling implemented
- [ ] Logging added for debugging

### For Quality Reviewer (quality-reviewer agent)

- [ ] Implementation matches architecture specification
- [ ] Critical bug at line 267 fixed correctly
- [ ] Token generation optimized (60% reduction verified)
- [ ] Code quality standards met (TypeScript strict mode, no `any`)
- [ ] Test coverage adequate (≥80% overall, 100% critical paths)
- [ ] Security best practices followed (input validation)
- [ ] Documentation accurate (inline comments, JSDoc)
- [ ] Git commit follows conventions
- [ ] No breaking changes to API contract
- [ ] Performance requirements met (<200ms latency)

## Transition Log

| Date Time           | From  | To      | Agent         | Reason/Comment               |
| ------------------- | ----- | ------- | ------------- | ---------------------------- |
| 2025-11-03 14:48:25 | draft | pending | task-engineer | Critical bug fix task created |

## Implementation Notes

<!-- typescript-engineer adds notes during development -->

## Quality Review Comments

<!-- quality-reviewer agent adds review feedback here -->

## Version Control Log

<!-- typescript-engineer updates this when committing -->

## Evidence of Completion

<!-- Paste evidence showing task is complete -->

```bash
# TypeScript quality gates
$ cd services/core-api
$ npm run lint
✓ No errors

$ npm run typecheck
✓ No type errors

$ npm run build
✓ Build successful

$ npm test
✓ All tests pass (45 tests)
✓ Coverage: 87%

# Git status
$ git status
On branch claude/fix-client-search-011CUm6YVM8xDw5WDNK6yp53
nothing to commit, working tree clean
```

## References

- [Client Search Architecture](../docs/architecture/client-search-system.md)
- [ADR-001: Client Search Optimization](../docs/architecture/ADR-001-client-search-optimization.md)
- [Original Bug Report](https://github.com/stantretyakov/zabicekiosk/issues/XXX)
