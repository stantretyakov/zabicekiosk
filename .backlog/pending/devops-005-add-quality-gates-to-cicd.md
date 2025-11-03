# Task: Add Quality Gates and Tests to CI/CD Pipeline

## Metadata

- **ID**: devops-005-add-quality-gates-to-cicd
- **Status**: pending
- **Priority**: critical
- **Estimated Hours**: 3
- **Assigned Agent**: devops
- **Dependencies**: feature-001, test-002, test-003 (all completed)
- **Rejection Count**: 0
- **Created By**: task-engineer
- **Created At**: 2025-11-03 16:21:10 UTC
- **Documentation**: docs/acf/style/general.md

## Description

**CRITICAL**: Current CI/CD pipeline (`cloudbuild.yaml` + GitHub Actions) deploys code WITHOUT running any quality gates or tests. This means:
- ❌ Broken code can be deployed to production
- ❌ TypeScript type errors can reach production
- ❌ Linting errors can reach production
- ❌ Tests are never run in CI
- ❌ No validation before deployment

After fixing the critical search bug (feature-001), we need to ensure quality gates are enforced in CI/CD to prevent future regressions.

**Goal**: Add comprehensive quality gates to CI/CD pipeline that run BEFORE deployment.

## Acceptance Criteria

- [ ] Quality gates added to `cloudbuild.yaml` (Cloud Build pipeline)
- [ ] Quality gates added to GitHub Actions workflows
- [ ] Jest test runner configured and integrated
- [ ] All quality gates must PASS before deployment proceeds
- [ ] Pipeline fails fast if any quality gate fails
- [ ] Test results reported in build logs
- [ ] Coverage reports generated (optional: uploaded to coverage service)
- [ ] Pipeline documentation updated
- [ ] All changes tested in dev environment
- [ ] Changes committed with proper conventional commit message

## Technical Requirements

### Quality Gates to Add

**For TypeScript Backend Services** (core-api, booking-api):
```bash
1. npm run lint          # ESLint (must pass)
2. npm run typecheck     # TypeScript compiler (must pass)
3. npm run build         # Build check (must pass)
4. npm test              # Jest tests (must pass, >80% coverage)
```

**For React Frontend Apps** (admin-portal, kiosk-pwa, parent-web):
```bash
1. npm run lint          # ESLint (must pass)
2. npm run typecheck     # TypeScript compiler (must pass)
3. npm run build         # Vite build (must pass)
4. npm test              # Jest tests (must pass, >70% coverage)
```

### 1. Update `cloudbuild.yaml`

Add quality gate steps BEFORE deployment:

```yaml
steps:
  # ... (existing steps)

  # Quality Gates - Core API
  - id: quality-gate-core-api-install
    name: node:20
    entrypoint: npm
    dir: services/core-api
    args: ['ci']

  - id: quality-gate-core-api-lint
    name: node:20
    entrypoint: npm
    dir: services/core-api
    args: ['run', 'lint']

  - id: quality-gate-core-api-typecheck
    name: node:20
    entrypoint: npm
    dir: services/core-api
    args: ['run', 'typecheck']

  - id: quality-gate-core-api-test
    name: node:20
    entrypoint: npm
    dir: services/core-api
    args: ['test', '--', '--coverage', '--passWithNoTests']
    env:
      - 'CI=true'

  - id: quality-gate-core-api-build
    name: node:20
    entrypoint: npm
    dir: services/core-api
    args: ['run', 'build']

  # Quality Gates - Booking API
  - id: quality-gate-booking-api-install
    name: node:20
    entrypoint: npm
    dir: services/booking-api
    args: ['ci']

  - id: quality-gate-booking-api-lint
    name: node:20
    entrypoint: npm
    dir: services/booking-api
    args: ['run', 'lint']

  - id: quality-gate-booking-api-typecheck
    name: node:20
    entrypoint: npm
    dir: services/booking-api
    args: ['run', 'typecheck']

  - id: quality-gate-booking-api-test
    name: node:20
    entrypoint: npm
    dir: services/booking-api
    args: ['test', '--', '--coverage', '--passWithNoTests']
    env:
      - 'CI=true'

  - id: quality-gate-booking-api-build
    name: node:20
    entrypoint: npm
    dir: services/booking-api
    args: ['run', 'build']

  # Quality Gates - Admin Portal
  - id: quality-gate-admin-portal-lint
    name: node:20
    entrypoint: npm
    dir: web/admin-portal
    args: ['run', 'lint']

  - id: quality-gate-admin-portal-typecheck
    name: node:20
    entrypoint: npm
    dir: web/admin-portal
    args: ['run', 'typecheck']

  - id: quality-gate-admin-portal-test
    name: node:20
    entrypoint: npm
    dir: web/admin-portal
    args: ['test', '--', '--coverage', '--passWithNoTests']
    env:
      - 'CI=true'

  # Quality Gates - Kiosk PWA
  - id: quality-gate-kiosk-lint
    name: node:20
    entrypoint: npm
    dir: web/kiosk-pwa
    args: ['run', 'lint']

  - id: quality-gate-kiosk-typecheck
    name: node:20
    entrypoint: npm
    dir: web/kiosk-pwa
    args: ['run', 'typecheck']

  # Quality Gates - Parent Web
  - id: quality-gate-parent-lint
    name: node:20
    entrypoint: npm
    dir: web/parent-web
    args: ['run', 'lint']

  - id: quality-gate-parent-typecheck
    name: node:20
    entrypoint: npm
    dir: web/parent-web
    args: ['run', 'typecheck']

  # NOW deploy (only if all quality gates passed)
  - id: build-and-deploy-core-api
    name: gcr.io/google.com/cloudsdktool/cloud-sdk:slim
    # ... (existing deployment)
```

### 2. Update GitHub Actions Workflows

Add quality gates to `.github/workflows/build-deploy-core-api.yaml`:

```yaml
jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: services/core-api/package-lock.json

      - name: Install Dependencies
        run: npm ci
        working-directory: services/core-api

      - name: Lint
        run: npm run lint
        working-directory: services/core-api

      - name: Type Check
        run: npm run typecheck
        working-directory: services/core-api

      - name: Run Tests
        run: npm test -- --coverage --passWithNoTests
        working-directory: services/core-api
        env:
          CI: true

      - name: Build
        run: npm run build
        working-directory: services/core-api

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        if: always()
        with:
          files: services/core-api/coverage/lcov.info
          flags: core-api

  build-deploy:
    needs: quality-gates  # Only deploy if quality gates pass
    runs-on: ubuntu-latest
    # ... (existing deployment)
```

### 3. Configure Jest for Services

**File**: `services/core-api/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**Update** `services/core-api/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@types/jest": "^29.5.11",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1"
  }
}
```

### 4. Configure Jest for Frontend Apps

**File**: `web/admin-portal/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/main.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**Install dependencies:**

```bash
cd web/admin-portal
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom identity-obj-proxy
```

### 5. Documentation

Update `README.md` with CI/CD section:

```markdown
## CI/CD Pipeline

### Quality Gates

All code must pass quality gates before deployment:
- ✅ ESLint (no errors)
- ✅ TypeScript typecheck (no errors)
- ✅ Tests (>80% coverage for backend, >70% for frontend)
- ✅ Build (successful compilation)

### Running Quality Gates Locally

```bash
# Backend services
cd services/core-api
npm run lint && npm run typecheck && npm test && npm run build

# Frontend apps
cd web/admin-portal
npm run lint && npm run typecheck && npm test && npm run build
```

### Deployment Process

1. Push to main branch
2. Quality gates run automatically (GitHub Actions or Cloud Build)
3. If ALL gates pass → Deploy to Cloud Run / Firebase Hosting
4. If ANY gate fails → Deployment blocked, fix issues

### Bypassing Quality Gates (NOT RECOMMENDED)

Quality gates should NEVER be bypassed. If absolutely necessary:
- Add `[skip ci]` to commit message (skips CI entirely)
- Use `--no-verify` flag (skips pre-commit hooks only)
```

### Performance Requirements

- Quality gates should complete in <5 minutes total
- Test execution: <2 minutes per service
- Build time: <2 minutes per service
- Total pipeline time: <15 minutes

## Edge Cases to Handle

- Missing test files (use `--passWithNoTests`)
- Network timeouts in CI (add retries)
- Flaky tests (mark as `test.skip` temporarily)
- Large test suites (consider test sharding)
- Coverage below threshold (fail build)

## Out of Scope

- E2E tests in CI (requires Playwright setup, separate task)
- Integration tests with Firebase emulator (future enhancement)
- Performance testing (separate task)
- Security scanning (separate task)

## Quality Review Checklist

### For Implementer (Before Marking Complete)

- [ ] Quality gates added to `cloudbuild.yaml`
- [ ] Quality gates added to all GitHub Actions workflows
- [ ] Jest configured for all services and apps
- [ ] Test scripts working locally
- [ ] Coverage thresholds set correctly
- [ ] Pipeline tested in dev environment
- [ ] Documentation updated (README.md)
- [ ] All quality gates pass
- [ ] Changes committed with proper conventional commit message

### For Quality Reviewer (quality-reviewer agent)

- [ ] Quality gates comprehensive (lint, typecheck, test, build)
- [ ] Jest configuration correct
- [ ] Coverage thresholds appropriate
- [ ] Pipeline fails fast on errors
- [ ] Documentation clear and accurate
- [ ] No deployment without passing gates
- [ ] Git commit follows conventions

## Transition Log

| Date Time           | From  | To      | Agent         | Reason/Comment                    |
| ------------------- | ----- | ------- | ------------- | --------------------------------- |
| 2025-11-03 16:21:10 | draft | pending | task-engineer | CI/CD quality gates task created |

## Implementation Notes

<!-- devops agent adds notes during implementation -->

## Quality Review Comments

<!-- quality-reviewer agent adds review feedback here -->

## Version Control Log

<!-- devops agent updates this when committing -->

## Evidence of Completion

<!-- Paste evidence showing quality gates working -->

```bash
# Cloud Build with quality gates
$ gcloud builds submit
Step #1 - "quality-gate-core-api-lint": ✓ No lint errors
Step #2 - "quality-gate-core-api-typecheck": ✓ No type errors
Step #3 - "quality-gate-core-api-test": ✓ All tests passed (45 tests, 87% coverage)
Step #4 - "quality-gate-core-api-build": ✓ Build successful
Step #5 - "build-and-deploy-core-api": ✓ Deployed to Cloud Run

# GitHub Actions
✓ Lint (15s)
✓ Type Check (20s)
✓ Run Tests (45s) - 45 tests passed, coverage 87%
✓ Build (30s)
✓ Deploy (2m)
```

## References

- [Current cloudbuild.yaml](../cloudbuild.yaml)
- [GitHub Actions workflows](../.github/workflows/)
- [Quality Gates Documentation](../docs/acf/style/general.md)
- [Jest Documentation](https://jestjs.io/)
