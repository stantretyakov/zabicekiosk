---
id: tools-001
title: Create cicd-monitor CLI tool skeleton
agent: typescript-engineer
priority: high
status: pending
phase: 1-foundation
created: 2025-11-03
dependencies: []
---

# Task: Create cicd-monitor CLI Tool Skeleton

## Context

We are building an autonomous CI/CD monitoring system that detects build failures, analyzes them with AI, and auto-creates tasks for our agent swarm. This task creates the foundational CLI tool structure.

**Repository**: `tools/cicd-monitor/`

**Purpose**: Build a TypeScript CLI tool that will monitor Cloud Build pipelines and automate task creation.

## Requirements

### 1. Project Structure

Create the following structure:

```
tools/cicd-monitor/
├── package.json          # ✅ Already created
├── tsconfig.json         # ✅ Already created
├── .env.example          # ✅ Already created
├── README.md             # ✅ Already created
├── .gitignore
├── .eslintrc.json
├── .prettierrc.json
│
├── src/
│   ├── index.ts          # CLI entry point with commander
│   │
│   ├── config/
│   │   ├── config.ts     # Load .cicd-monitor.config.yaml
│   │   └── types.ts      # Config TypeScript types (Zod schemas)
│   │
│   ├── monitor/
│   │   ├── index.ts      # Barrel export
│   │   ├── build-watcher.ts      # Stub
│   │   ├── log-parser.ts         # Stub
│   │   └── status-tracker.ts     # Stub
│   │
│   ├── analyzer/
│   │   ├── index.ts      # Barrel export
│   │   ├── error-classifier.ts   # Stub
│   │   ├── root-cause-analyzer.ts # Stub
│   │   ├── impact-assessor.ts    # Stub
│   │   └── file-extractor.ts     # Stub
│   │
│   ├── task-creator/
│   │   ├── index.ts      # Barrel export
│   │   ├── task-generator.ts     # Stub
│   │   ├── agent-router.ts       # Stub
│   │   └── template-engine.ts    # Stub
│   │
│   ├── integrations/
│   │   ├── index.ts      # Barrel export
│   │   ├── cloudbuild-client.ts  # Stub
│   │   ├── logging-client.ts     # Stub
│   │   ├── github-client.ts      # Stub
│   │   └── claude-client.ts      # Stub
│   │
│   └── utils/
│       ├── index.ts      # Barrel export
│       ├── logger.ts     # Winston structured logging
│       ├── rate-limiter.ts       # Stub
│       └── retry.ts              # Stub
│
├── templates/
│   ├── lint-error-task.md
│   ├── typecheck-error-task.md
│   ├── test-failure-task.md
│   ├── build-failure-task.md
│   └── deployment-error-task.md
│
└── test/
    ├── config.test.ts
    ├── monitor/
    ├── analyzer/
    ├── task-creator/
    └── integrations/
```

### 2. CLI Commands (Skeleton)

Implement with `commander`:

```typescript
// src/index.ts
#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('zabice-cicd-monitor')
  .description('CI/CD monitoring tool for automatic build failure detection')
  .version('0.1.0');

// Command: watch
program
  .command('watch')
  .description('Watch a build in real-time and analyze on failure')
  .requiredOption('--build-id <id>', 'Cloud Build ID')
  .requiredOption('--project-id <id>', 'GCP Project ID')
  .option('--pr-number <number>', 'GitHub PR number')
  .option('--branch <name>', 'Git branch name')
  .option('--auto-fix-enabled', 'Create tasks automatically', false)
  .option('--notify', 'Post PR comments', false)
  .option('--dry-run', 'Dry run mode (no commits/comments)', false)
  .action(async (options) => {
    console.log('Watch command:', options);
    // TODO: Implement in future task
  });

// Command: analyze
program
  .command('analyze')
  .description('Analyze a completed build')
  .requiredOption('--build-id <id>', 'Cloud Build ID')
  .requiredOption('--project-id <id>', 'GCP Project ID')
  .option('--create-tasks', 'Generate task files', false)
  .option('--notify', 'Post PR comments', false)
  .option('--dry-run', 'Dry run mode', false)
  .action(async (options) => {
    console.log('Analyze command:', options);
    // TODO: Implement in future task
  });

// Command: list
program
  .command('list')
  .description('List recent builds')
  .requiredOption('--project-id <id>', 'GCP Project ID')
  .option('--status <status>', 'Filter by status (failed/success/working)')
  .option('--last <number>', 'Number of builds to show', '10')
  .action(async (options) => {
    console.log('List command:', options);
    // TODO: Implement in future task
  });

// Command: tasks
program
  .command('tasks')
  .description('Show tasks created for a build')
  .requiredOption('--build-id <id>', 'Cloud Build ID')
  .action(async (options) => {
    console.log('Tasks command:', options);
    // TODO: Implement in future task
  });

program.parse();
```

### 3. Configuration Loader

Implement config loader with Zod validation:

```typescript
// src/config/types.ts
import { z } from 'zod';

export const ConfigSchema = z.object({
  monitor: z.object({
    mode: z.enum(['watch', 'analyze', 'disabled']),
    use_pubsub: z.boolean(),
    pubsub_subscription: z.string().optional(),
    polling: z.object({
      initial_interval_ms: z.number(),
      max_interval_ms: z.number(),
      backoff_multiplier: z.number(),
    }),
  }),
  auto_fix: z.object({
    enabled: z.boolean(),
    max_retries: z.number(),
    create_fix_pr: z.boolean(),
  }),
  notifications: z.object({
    pr_comment: z.boolean(),
    slack: z.boolean(),
    email: z.boolean(),
  }),
  analysis: z.object({
    ai_model: z.string(),
    max_context_files: z.number(),
    temperature: z.number(),
    skip_known_patterns: z.boolean(),
  }),
  task_creation: z.object({
    enabled: z.boolean(),
    priority_rules: z.record(z.string()),
    agent_routing: z.record(z.any()),
    commit: z.object({
      branch: z.string(),
      author_name: z.string(),
      author_email: z.string(),
      message_template: z.string(),
    }),
  }),
  rate_limits: z.object({
    github_api_per_minute: z.number(),
    cloudbuild_api_per_minute: z.number(),
    claude_api_per_minute: z.number(),
    max_tasks_per_pr: z.number(),
    analysis_cooldown_seconds: z.number(),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    format: z.enum(['json', 'pretty']),
    cloud_logging: z.boolean(),
  }),
  repository: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  gcp: z.object({
    project_id: z.string(),
    region: z.string(),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

// src/config/config.ts
import fs from 'fs';
import yaml from 'yaml';
import { ConfigSchema, Config } from './types.js';

export function loadConfig(configPath: string = '../../.cicd-monitor.config.yaml'): Config {
  const content = fs.readFileSync(configPath, 'utf-8');
  const data = yaml.parse(content);
  return ConfigSchema.parse(data);
}
```

### 4. Logger Setup

Implement structured logging with Winston:

```typescript
// src/utils/logger.ts
import winston from 'winston';

export function createLogger(level: string = 'info', format: 'json' | 'pretty' = 'json') {
  const logger = winston.createLogger({
    level,
    format: format === 'json'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
    transports: [
      new winston.transports.Console(),
    ],
  });

  return logger;
}

export const logger = createLogger();
```

### 5. Task Templates

Create markdown templates in `templates/`:

```markdown
// templates/build-failure-task.md
---
id: auto-{timestamp}-build-failure
title: Fix {project} build failure in PR #{pr-number}
agent: {agent}
priority: {priority}
status: pending
source: cicd-monitor
build-id: {build-id}
created: {created}
---

# Auto-Generated Task: Fix Build Failure

## Context

**PR**: #{pr-number} - {pr-title}
**Branch**: {branch-name}
**Build ID**: {build-id}
**Failed Step**: {step-id}

## Error Analysis

### Root Cause
{root-cause}

### Affected Components
{affected-components}

### Error Details
```
{error-logs}
```

## Acceptance Criteria

BINARY: YES or NO (no partial completion)

- [ ] Build passes in {project}
- [ ] Quality gates pass: `npm run lint && npm run typecheck && npm test && npm run build`
- [ ] Changes committed to branch {branch-name}

## Logs Attachment

<details>
<summary>Full Build Logs</summary>

```
{full-logs}
```
</details>

---
**Auto-created by**: cicd-monitor
**Timestamp**: {timestamp}
```

(Create similar templates for lint-error, typecheck-error, test-failure, deployment-error)

### 6. Git Configuration Files

**.gitignore**:
```
node_modules/
dist/
.env
*.log
coverage/
.DS_Store
```

**.eslintrc.json**:
```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

**.prettierrc.json**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 7. Tests

Create basic test structure:

```typescript
// test/config.test.ts
import { describe, it, expect } from '@jest/globals';
import { loadConfig } from '../src/config/config.js';

describe('Config Loader', () => {
  it('should load valid config', () => {
    const config = loadConfig('../../.cicd-monitor.config.yaml');
    expect(config).toBeDefined();
    expect(config.monitor.mode).toEqual('watch');
  });

  it('should throw on invalid config', () => {
    expect(() => loadConfig('invalid.yaml')).toThrow();
  });
});
```

### 8. Build and Test

All commands must work:

```bash
cd tools/cicd-monitor

# Install dependencies
npm install

# Lint
npm run lint

# Typecheck
npm run typecheck

# Build
npm run build

# Test
npm test

# CLI help
npm run cli -- --help
npm run cli -- watch --help
npm run cli -- analyze --help
```

## Acceptance Criteria

BINARY: YES or NO (no partial completion)

- [ ] All files created as specified in structure
- [ ] CLI commands defined with commander (watch, analyze, list, tasks)
- [ ] Configuration loader works with Zod validation
- [ ] Logger setup with Winston (structured logging)
- [ ] All 5 task templates created
- [ ] Stub files for all modules (monitor, analyzer, task-creator, integrations)
- [ ] Git config files (.gitignore, .eslintrc.json, .prettierrc.json)
- [ ] Basic tests pass
- [ ] Quality gates pass:
  ```bash
  npm run lint      # ✅ No errors
  npm run typecheck # ✅ No errors
  npm run build     # ✅ Succeeds
  npm test          # ✅ All tests pass
  ```
- [ ] CLI runs without errors: `npm run cli -- --help`
- [ ] package.json scripts work (dev, build, test, lint, typecheck)

## Out of Scope

- API integration (Cloud Build, GitHub, Claude) → Future tasks
- Actual monitoring logic → Future tasks
- Task generation logic → Future tasks
- Error analysis → Future tasks

## References

- Agent Manifest: `docs/agents/cicd-monitor.md`
- Config File: `.cicd-monitor.config.yaml`
- Package: `tools/cicd-monitor/package.json`

## Notes

- Use TypeScript strict mode
- Follow existing code style in zabicekiosk
- All stubs should export empty functions/classes with TODO comments
- Focus on structure, not implementation

---

**Agent**: typescript-engineer
**Phase**: 1-foundation
**Estimated Time**: 2-3 hours
