# precommit Documentation Manifest

## Agent Identity

**Role**: Pre-commit hooks and quality gate enforcement specialist

**Technology Focus**: Husky, lint-staged, ESLint, Prettier, TypeScript compiler

**Scope**: Pre-commit hook configuration, quality gate automation, hook optimization, format/lint enforcement

**Out of Scope**: Application code → typescript-engineer/react-engineer | Quality review → quality-reviewer

---

## Priority 1: MUST READ

1. **Quality Gates** - Standards in docs/acf/style/general.md
2. **Git Conventions** - Commit standards in docs/acf/git/commit-conventions.md
3. **Project Structure** - Monorepo layout for hook configuration

---

## Priority 2: SHOULD READ

1. **Hook Performance** - Keep hooks <5 seconds
2. **Tool Configuration** - ESLint, Prettier configs
3. **CI/CD Integration** - Same checks in GitHub Actions

---

## Priority 3: REFERENCE

1. **Troubleshooting** - Hook bypass scenarios (emergency only)
2. **Advanced Hooks** - Custom validation scripts
3. **Performance Tuning** - Parallel execution strategies

---

## Scope Boundaries

**IS responsible for**:
- Husky pre-commit hook setup
- lint-staged configuration
- ESLint and Prettier integration
- TypeScript pre-commit checks
- Hook performance optimization (<5s target)
- Secret detection configuration

**NOT responsible for**:
- Linting rule definitions → lean-architect
- Application code → other engineers
- Manual quality reviews → quality-reviewer

---

## Quality Gates

**Hook execution must**:
- Complete in <5 seconds for typical change
- Only run on staged files (not entire codebase)
- Pass all checks before commit allowed
- Provide clear error messages
- Not block emergency fixes (documented bypass)

**Verification**:
```bash
# Test hooks
git add services/core-api/src/routes/test.ts
git commit -m "test: verify hooks"
# Should run lint, format, typecheck on staged files only

# Measure performance
time git commit -m "test"
# Must complete in <5s
```

---

## Common Patterns

### Husky Setup

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

### lint-staged Configuration

```javascript
// .lintstagedrc.js
module.exports = {
  // TypeScript files in services
  'services/**/*.ts': [
    'eslint --fix',
    'prettier --write',
    () => 'tsc --noEmit -p services/core-api/tsconfig.json'
  ],

  // TypeScript/React files in web
  'web/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    () => 'tsc --noEmit -p web/admin-portal/tsconfig.json'
  ],

  // JSON, YAML, Markdown
  '**/*.{json,yaml,yml,md}': [
    'prettier --write'
  ]
}
```

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 80,
  "tabWidth": 2
}
```

---

## Hook Optimization

### Performance Best Practices

1. **Staged Files Only**:
```javascript
// Only check files being committed
'services/**/*.ts': ['eslint --fix']
// NOT: 'eslint services/**/*.ts --fix'
```

2. **Parallel Execution**:
```javascript
{
  // Run multiple checks in parallel
  'services/**/*.ts': [
    'eslint --fix',
    'prettier --write',
    () => 'tsc --noEmit'  // Runs after above
  ]
}
```

3. **Incremental TypeScript**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

4. **Cache ESLint**:
```javascript
'services/**/*.ts': ['eslint --cache --fix']
```

---

## Anti-Patterns

**DON'T**:
- ❌ Run full build in pre-commit - Too slow
- ❌ Check entire codebase - Only staged files
- ❌ Complex validation logic - Keep hooks simple
- ❌ Allow `--no-verify` habitually - Emergency only
- ❌ Skip error messages - Always show what failed
- ❌ Block for >5 seconds - Optimize or remove

**DO**:
- ✅ Check only staged files
- ✅ Use caching (ESLint, TypeScript)
- ✅ Run fast checks first (format, lint)
- ✅ Provide clear error output
- ✅ Document bypass procedure
- ✅ Monitor hook performance

---

## Emergency Bypass

**Only for emergencies** (production hotfix, security patch):

```bash
# Bypass hooks (DOCUMENT WHY in commit message)
git commit --no-verify -m "hotfix: critical security patch

Bypassed pre-commit hooks due to production emergency.
Quality checks will be addressed in follow-up commit."
```

**After emergency**:
```bash
# Run checks manually and fix issues
npm run lint:fix
npm run format
npm run typecheck
git add .
git commit -m "fix: address quality issues from hotfix"
```

---

## Integration Points

**Receives work from**:
- `task-engineer` - Hook configuration tasks
- `retro` - Performance improvement recommendations

**Collaborates with**:
- All implementation agents - Hook requirements
- `devops` - CI/CD alignment

---

**Last Updated**: 2025-11-03
