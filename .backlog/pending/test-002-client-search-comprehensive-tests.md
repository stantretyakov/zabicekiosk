# Task: Write Comprehensive Tests for Client Search System

## Metadata

- **ID**: test-002-client-search-comprehensive-tests
- **Status**: pending
- **Priority**: high
- **Estimated Hours**: 3
- **Assigned Agent**: test-engineer
- **Dependencies**: feature-001-fix-client-search-critical-bug
- **Rejection Count**: 0
- **Created By**: task-engineer
- **Created At**: 2025-11-03 14:48:25 UTC
- **Documentation**: docs/architecture/client-search-system.md, docs/architecture/ADR-001-client-search-optimization.md

## Description

Write comprehensive test suite for the fixed client search system to ensure:
- Critical bug at line 267 doesn't regress
- Search works correctly across all fields
- Performance targets are met (<200ms latency)
- Edge cases are handled properly

**Test Coverage Target**: >80% for search-related code, 100% for critical paths.

## Acceptance Criteria

- [ ] Unit tests for token generation (15+ test cases)
- [ ] Integration tests for search API (20+ test cases)
- [ ] E2E tests for admin portal search UI (5+ scenarios)
- [ ] Performance tests (<200ms latency verified)
- [ ] Edge case tests (empty search, special characters, pagination)
- [ ] Test coverage >80% for admin.clients.ts
- [ ] All tests pass locally and in CI
- [ ] Quality gates pass (lint, typecheck, build, test)
- [ ] Changes committed with proper conventional commit message

## Technical Requirements

### Unit Tests

**File**: `services/core-api/src/routes/__tests__/admin.clients.test.ts`

**Test Cases for Token Generation:**

```typescript
describe('generateSearchTokens', () => {
  describe('Short words (≤4 chars)', () => {
    it('should generate all prefixes for short names', () => {
      const tokens = generateSearchTokens({
        parentName: 'Ana',
        childName: 'Leo'
      });
      expect(tokens).toContain('an');
      expect(tokens).toContain('ana');
      expect(tokens).toContain('le');
      expect(tokens).toContain('leo');
    });
  });

  describe('Long words (>8 chars)', () => {
    it('should optimize token generation for long names', () => {
      const tokens = generateSearchTokens({
        parentName: 'Анастасия Ковалевская',
        childName: 'Мария'
      });
      // Should have 2-4 char prefixes + full word, not all prefixes
      expect(tokens).toContain('ан');
      expect(tokens).toContain('ана');
      expect(tokens).toContain('анас');
      expect(tokens).toContain('анастасия');
      expect(tokens.filter(t => t.startsWith('анаст')).length).toBeLessThan(5);
    });
  });

  describe('Cyrillic support', () => {
    it('should handle Cyrillic names', () => {
      const tokens = generateSearchTokens({
        parentName: 'Иван Петров',
        childName: 'Александр'
      });
      expect(tokens).toContain('ив');
      expect(tokens).toContain('иван');
      expect(tokens).toContain('пе');
      expect(tokens).toContain('петров');
    });
  });

  describe('Phone numbers', () => {
    it('should tokenize phone digits', () => {
      const tokens = generateSearchTokens({
        parentName: 'Ana',
        childName: 'Leo',
        phone: '+381777123456'
      });
      expect(tokens).toContain('777123');
      expect(tokens).toContain('7771234');
      expect(tokens).toContain('77712345');
      expect(tokens).toContain('777123456');
    });

    it('should handle phone without country code', () => {
      const tokens = generateSearchTokens({
        parentName: 'Ana',
        childName: 'Leo',
        phone: '777123456'
      });
      expect(tokens).toContain('777123');
    });
  });

  describe('Social media handles', () => {
    it('should tokenize telegram handle', () => {
      const tokens = generateSearchTokens({
        parentName: 'Ana',
        childName: 'Leo',
        telegram: '@anapovych'
      });
      expect(tokens).toContain('an');
      expect(tokens).toContain('ana');
      expect(tokens).toContain('anap');
      expect(tokens).toContain('anapovych'); // collapsed
    });

    it('should extract username from instagram URL', () => {
      const tokens = generateSearchTokens({
        parentName: 'Ana',
        childName: 'Leo',
        instagram: 'https://instagram.com/anapovych'
      });
      expect(tokens).toContain('an');
      expect(tokens).toContain('ana');
      expect(tokens).toContain('anap');
    });
  });

  describe('Token size limits', () => {
    it('should truncate tokens if >40KB', () => {
      const longName = 'A'.repeat(1000) + ' ' + 'B'.repeat(1000);
      const tokens = generateSearchTokens({
        parentName: longName,
        childName: 'Test'
      });
      const size = JSON.stringify(tokens).length;
      expect(size).toBeLessThan(40000);
    });
  });

  describe('Diacritic removal', () => {
    it('should remove diacritics from names', () => {
      const tokens = generateSearchTokens({
        parentName: 'José García',
        childName: 'María'
      });
      expect(tokens).toContain('jo');
      expect(tokens).toContain('jose');
      expect(tokens).toContain('ga');
      expect(tokens).toContain('garcia');
      expect(tokens).toContain('ma');
      expect(tokens).toContain('maria');
    });
  });
});

describe('Query builder functions', () => {
  it('buildTokenQuery should construct correct query', () => {
    // Mock Firestore query
  });

  it('buildFallbackQuery should use fullNameLower', () => {
    // Mock Firestore query
  });

  it('buildDefaultQuery should respect orderBy parameter', () => {
    // Mock Firestore query
  });
});
```

### Integration Tests

**File**: `services/core-api/src/routes/__tests__/admin.clients.integration.test.ts`

**Test Cases:**

```typescript
describe('GET /admin/clients - Search Integration', () => {
  beforeAll(async () => {
    // Setup: Create test clients in Firestore
    await createTestClient({
      parentName: 'Анастасия Ковалевская',
      childName: 'Мария',
      phone: '+381777123456',
      telegram: 'anapovych',
      instagram: 'https://instagram.com/anapovych'
    });
    await createTestClient({
      parentName: 'José García',
      childName: 'María Fernández',
      phone: '+381777654321'
    });
    // ... more test clients
  });

  describe('Search by name', () => {
    it('should find client by parent name prefix (Latin)', async () => {
      const res = await request(app).get('/admin/clients?search=jose');
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].parentName).toBe('José García');
    });

    it('should find client by parent name prefix (Cyrillic)', async () => {
      const res = await request(app).get('/admin/clients?search=ана');
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].parentName).toBe('Анастасия Ковалевская');
    });

    it('should find client by child name prefix', async () => {
      const res = await request(app).get('/admin/clients?search=mar');
      expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Search by phone', () => {
    it('should find client by last 6 digits of phone', async () => {
      const res = await request(app).get('/admin/clients?search=123456');
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].phone).toBe('+381777123456');
    });
  });

  describe('Search by social media', () => {
    it('should find client by telegram handle', async () => {
      const res = await request(app).get('/admin/clients?search=anap');
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].telegram).toBe('anapovych');
    });

    it('should find client by instagram handle', async () => {
      const res = await request(app).get('/admin/clients?search=anap');
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].instagram).toContain('anapovych');
    });
  });

  describe('Pagination', () => {
    it('should support pagination with nextPageToken', async () => {
      const res1 = await request(app).get('/admin/clients?pageSize=1');
      expect(res1.body.items).toHaveLength(1);
      expect(res1.body.nextPageToken).toBeDefined();

      const res2 = await request(app).get(
        `/admin/clients?pageSize=1&pageToken=${res1.body.nextPageToken}`
      );
      expect(res2.body.items).toHaveLength(1);
      expect(res2.body.items[0].id).not.toBe(res1.body.items[0].id);
    });

    it('should preserve pagination during backfill', async () => {
      // Create client without tokens (simulate old data)
      const clientId = await createClientWithoutTokens({
        parentName: 'Test User',
        childName: 'Test Child'
      });

      const res = await request(app).get('/admin/clients?search=test&pageSize=5');
      expect(res.body.items.some(c => c.id === clientId)).toBe(true);
      // Verify tokens were backfilled
      const doc = await db.collection('clients').doc(clientId).get();
      expect(doc.data().searchTokens).toBeDefined();
      expect(doc.data().searchTokens.length).toBeGreaterThan(0);
    });
  });

  describe('Filters', () => {
    it('should filter by active status', async () => {
      const res = await request(app).get('/admin/clients?active=true');
      expect(res.body.items.every(c => c.active === true)).toBe(true);
    });
  });

  describe('Critical bug regression (line 267)', () => {
    it('should return correct results after backfill', async () => {
      // Create client without tokens
      const clientId = await createClientWithoutTokens({
        parentName: 'Bug Test',
        childName: 'Regression'
      });

      // First search triggers backfill
      const res1 = await request(app).get('/admin/clients?search=bug');

      // Second search should still find the client
      const res2 = await request(app).get('/admin/clients?search=bug');
      expect(res2.body.items.some(c => c.id === clientId)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should respond within 200ms for 100 clients', async () => {
      const start = Date.now();
      await request(app).get('/admin/clients?search=test');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  afterAll(async () => {
    // Cleanup test clients
  });
});
```

### E2E Tests

**File**: `web/admin-portal/tests/e2e/client-search.spec.ts`

```typescript
test.describe('Client Search UI', () => {
  test('should search clients in real-time', async ({ page }) => {
    await page.goto('/clients');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('ana');

    await page.waitForTimeout(300); // Debounce

    const results = page.locator('table tbody tr');
    await expect(results).toHaveCount(1);
    await expect(results.first()).toContainText('Анастасия');
  });

  test('should handle empty search', async ({ page }) => {
    await page.goto('/clients');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('');

    await page.waitForTimeout(300);

    const results = page.locator('table tbody tr');
    await expect(results.count()).toBeGreaterThan(0);
  });

  test('should show loading state during search', async ({ page }) => {
    await page.goto('/clients');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test');

    const loader = page.locator('[role="progressbar"]');
    await expect(loader).toBeVisible();
  });

  test('should paginate search results', async ({ page }) => {
    await page.goto('/clients');

    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();

    await page.waitForLoadState('networkidle');

    // Verify different results loaded
  });

  test('should search by phone number', async ({ page }) => {
    await page.goto('/clients');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('777123');

    await page.waitForTimeout(300);

    const results = page.locator('table tbody tr');
    await expect(results).toHaveCount(1);
    await expect(results.first()).toContainText('+381777123');
  });
});
```

### Performance Requirements

- Unit tests: Complete in <5 seconds
- Integration tests: Complete in <30 seconds
- E2E tests: Complete in <60 seconds
- Search latency test: Verify <200ms response time
- No flaky tests (must pass 100% consistently)

## Edge Cases to Handle

- Empty search query
- Single character search
- Very long search terms (>100 chars)
- Special characters in search
- Search with only spaces
- Pagination with invalid token
- Concurrent searches
- Backfill during search
- Clients without tokens (legacy data)
- Clients with oversized token arrays

## Out of Scope

- Load testing (1000+ concurrent users)
- Stress testing (database limits)
- Security testing (SQL injection, XSS)
- Browser compatibility testing (handled separately)

## Quality Review Checklist

### For Implementer (Before Marking Complete)

- [ ] 15+ unit test cases written
- [ ] 20+ integration test cases written
- [ ] 5+ E2E test scenarios written
- [ ] Critical bug regression test included
- [ ] Performance tests verify <200ms latency
- [ ] Edge cases covered
- [ ] All tests pass locally
- [ ] Test coverage >80% for admin.clients.ts
- [ ] No flaky tests (100% pass rate)
- [ ] Tests follow project conventions
- [ ] Code quality gates pass (lint, typecheck, build)
- [ ] Changes committed with proper conventional commit message

### For Quality Reviewer (quality-reviewer agent)

- [ ] Test coverage adequate (≥80% overall, 100% critical paths)
- [ ] Tests verify all acceptance criteria
- [ ] Critical bug (line 267) has regression test
- [ ] Performance requirements validated
- [ ] Edge cases properly tested
- [ ] Tests are maintainable and clear
- [ ] No redundant or duplicate tests
- [ ] Git commit follows conventions

## Transition Log

| Date Time           | From  | To      | Agent         | Reason/Comment          |
| ------------------- | ----- | ------- | ------------- | ----------------------- |
| 2025-11-03 14:48:25 | draft | pending | task-engineer | Test task created |

## Implementation Notes

<!-- test-engineer adds notes during development -->

## Quality Review Comments

<!-- quality-reviewer agent adds review feedback here -->

## Version Control Log

<!-- test-engineer updates this when committing -->

## Evidence of Completion

<!-- Paste evidence showing task is complete -->

```bash
# Run tests
$ cd services/core-api
$ npm test -- admin.clients
✓ generateSearchTokens tests (15 tests)
✓ Query builder tests (5 tests)
✓ Integration tests (20 tests)

$ cd ../../web/admin-portal
$ npm run test:e2e
✓ Client search E2E tests (5 tests)

# Coverage report
$ npm test -- --coverage
✓ Coverage: 87% for admin.clients.ts
✓ Critical paths: 100% coverage
```

## References

- [Client Search Architecture](../docs/architecture/client-search-system.md)
- [Testing Strategy Section](../docs/architecture/client-search-system.md#testing-strategy)
