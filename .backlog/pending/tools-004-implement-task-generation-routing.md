---
id: tools-004
title: Implement task generation and agent routing
agent: typescript-engineer
priority: high
status: pending
phase: 3-integration
created: 2025-11-03
dependencies: [tools-003]
---

# Task: Implement Task Generation and Agent Routing

## Context

The cicd-monitor can now analyze build failures with AI. This task implements automatic task file generation using templates and intelligent routing to the correct agent based on error type and project.

**Dependencies**:
- tools-003: Error analysis with Claude working

## Requirements

### 1. Template Engine

Implement `src/task-creator/template-engine.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

export interface TemplateVariables {
  [key: string]: string | number | string[];
}

export class TemplateEngine {
  private templatesDir: string;

  constructor(templatesDir: string = './templates') {
    this.templatesDir = templatesDir;
  }

  /**
   * Render template with variables
   */
  render(templateName: string, variables: TemplateVariables): string {
    const templatePath = path.join(this.templatesDir, `${templateName}.md`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    let content = fs.readFileSync(templatePath, 'utf-8');

    // Replace {variable} placeholders
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      const replacement = Array.isArray(value) ? value.join('\n') : String(value);
      content = content.replace(new RegExp(placeholder, 'g'), replacement);
    }

    logger.debug(`Rendered template ${templateName}`);
    return content;
  }

  /**
   * List available templates
   */
  listTemplates(): string[] {
    return fs.readdirSync(this.templatesDir)
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
  }
}
```

### 2. Agent Router

Implement `src/task-creator/agent-router.ts`:

```typescript
import { logger } from '../utils/logger.js';
import type { Config } from '../config/types.js';
import type { ErrorClassification } from '../analyzer/error-classifier.js';
import type { RootCauseAnalysis } from '../analyzer/root-cause-analyzer.js';

export interface AgentRouting {
  agent: string;
  rationale: string;
}

export class AgentRouter {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Route task to appropriate agent
   */
  route(analysis: RootCauseAnalysis): AgentRouting {
    const { classification, aiAnalysis } = analysis;

    // Use AI recommendation if confidence is high
    if (aiAnalysis.confidence >= 70) {
      logger.info(`Using AI recommendation: ${aiAnalysis.recommendedAgent} (confidence: ${aiAnalysis.confidence})`);
      return {
        agent: aiAnalysis.recommendedAgent,
        rationale: `AI analysis with ${aiAnalysis.confidence}% confidence`,
      };
    }

    // Fallback to rule-based routing
    const agent = this.routeByRules(classification);

    logger.info(`Using rule-based routing: ${agent}`);
    return {
      agent,
      rationale: 'Rule-based routing from config',
    };
  }

  /**
   * Route by configuration rules
   */
  private routeByRules(classification: ErrorClassification): string {
    const { errorType, project } = classification;

    const routing = this.config.task_creation.agent_routing[errorType];

    if (!routing) {
      logger.warn(`No routing rule for ${errorType}, defaulting to typescript-engineer`);
      return 'typescript-engineer';
    }

    // Check if routing has project-specific rules
    if (typeof routing === 'object') {
      // Determine project type
      const projectType = project.startsWith('services') || ['core-api', 'booking-api'].includes(project)
        ? 'services'
        : 'web';

      return routing[projectType] || routing.default || 'typescript-engineer';
    }

    // Simple string routing
    return routing as string;
  }

  /**
   * Get template name for error type
   */
  getTemplateName(errorType: string): string {
    const templateMap: Record<string, string> = {
      'lint-error': 'lint-error-task',
      'typecheck-error': 'typecheck-error-task',
      'test-failure': 'test-failure-task',
      'build-error': 'build-failure-task',
      'deployment-error': 'deployment-error-task',
      'migration-error': 'deployment-error-task',
      'unknown': 'build-failure-task',
    };

    return templateMap[errorType] || 'build-failure-task';
  }
}
```

### 3. Task Generator

Implement `src/task-creator/task-generator.ts`:

```typescript
import { logger } from '../utils/logger.js';
import { TemplateEngine } from './template-engine.js';
import { AgentRouter } from './agent-router.js';
import type { Config } from '../config/types.js';
import type { RootCauseAnalysis } from '../analyzer/root-cause-analyzer.js';
import type { PRContext } from '../integrations/github-client.js';

export interface GeneratedTask {
  taskId: string;
  fileName: string;
  content: string;
  agent: string;
  priority: string;
}

export class TaskGenerator {
  private config: Config;
  private templateEngine: TemplateEngine;
  private agentRouter: AgentRouter;

  constructor(config: Config) {
    this.config = config;
    this.templateEngine = new TemplateEngine();
    this.agentRouter = new AgentRouter(config);
  }

  /**
   * Generate task file from analysis
   */
  generate(
    analysis: RootCauseAnalysis,
    buildId: string,
    prContext?: PRContext
  ): GeneratedTask {
    logger.info('Generating task file');

    const { classification, aiAnalysis, filesInvolved, timestamp } = analysis;

    // Route to agent
    const routing = this.agentRouter.route(analysis);

    // Generate task ID
    const taskId = this.generateTaskId(classification.errorType, timestamp);

    // Get template
    const templateName = this.agentRouter.getTemplateName(classification.errorType);

    // Prepare template variables
    const variables = {
      taskId,
      timestamp,
      'error-type': classification.errorType,
      priority: classification.priority,
      agent: routing.agent,
      project: classification.project,
      'build-id': buildId,
      'step-id': classification.failedStep.id,
      'pr-number': prContext?.number.toString() || 'N/A',
      'pr-title': prContext?.title || 'N/A',
      'branch-name': prContext?.branch || 'N/A',
      'root-cause': aiAnalysis.rootCause,
      'affected-components': aiAnalysis.affectedComponents.join(', '),
      'suggested-fix': aiAnalysis.suggestedFix,
      'risk-assessment': aiAnalysis.riskAssessment,
      'error-logs': this.truncateLogs(classification.errorLogs, 5000),
      'full-logs': this.truncateLogs(classification.errorLogs, 20000),
      'files-involved': filesInvolved.join('\n'),
      created: new Date().toISOString().split('T')[0],
    };

    // Render template
    const content = this.templateEngine.render(templateName, variables);

    const fileName = `${taskId}-${classification.errorType}-${classification.project}.md`;

    logger.info(`Generated task: ${fileName} (agent: ${routing.agent})`);

    return {
      taskId,
      fileName,
      content,
      agent: routing.agent,
      priority: classification.priority,
    };
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(errorType: string, timestamp: string): string {
    const date = new Date(timestamp);
    const prefix = 'auto';
    const typePrefix = errorType.split('-')[0]; // lint, typecheck, test, build, etc.
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');

    return `${prefix}-${typePrefix}-${dateStr}-${timeStr}`;
  }

  /**
   * Truncate logs to max length
   */
  private truncateLogs(logs: string, maxLength: number): string {
    if (logs.length <= maxLength) {
      return logs;
    }

    return logs.substring(0, maxLength) + '\n\n... (truncated)';
  }
}
```

### 4. Task Committer

Implement task committing to `.backlog/pending/`:

```typescript
// Add to src/task-creator/task-generator.ts

export class TaskGenerator {
  // ... existing methods ...

  /**
   * Commit task to repository
   */
  async commitTask(
    task: GeneratedTask,
    githubService: any, // GitHubService
    buildId: string,
    dryRun: boolean = false
  ): Promise<void> {
    const filePath = `.backlog/pending/${task.fileName}`;
    const message = this.config.task_creation.commit.message_template
      .replace('{taskId}', task.taskId)
      .replace('{errorType}', task.fileName.split('-')[1])
      .replace('{buildId}', buildId);

    logger.info(`Committing task to ${filePath}`);

    if (dryRun) {
      logger.info('[DRY RUN] Would commit task:', { filePath, message });
      return;
    }

    await githubService.commitFile(
      filePath,
      task.content,
      message,
      this.config.task_creation.commit.branch,
      {
        name: this.config.task_creation.commit.author_name,
        email: this.config.task_creation.commit.author_email,
      }
    );

    logger.info(`Task committed: ${filePath}`);
  }
}
```

### 5. Update CLI Commands

Update `src/index.ts` to generate and commit tasks:

```typescript
import { TaskGenerator } from './task-creator/task-generator.js';

// Command: watch
.action(async (options) => {
  // ... existing code ...

  if (build.status !== 'SUCCESS') {
    // ... analysis code ...

    if (options.autoFixEnabled) {
      logger.info('Auto-fix enabled, creating task...');

      const taskGenerator = new TaskGenerator(config);

      // Get PR context if available
      let prContext;
      if (options.prNumber) {
        prContext = await github.getPRContext(parseInt(options.prNumber));
      }

      // Generate task
      const task = taskGenerator.generate(analysis, options.buildId, prContext);

      // Commit task
      await taskGenerator.commitTask(
        task,
        github,
        options.buildId,
        options.dryRun
      );

      // Post PR comment
      if (options.notify && options.prNumber) {
        const comment = `## ❌ Build Failed

**Build ID**: \`${options.buildId}\`
**Error Type**: ${analysis.classification.errorType}
**Priority**: ${analysis.classification.priority}

### Root Cause
${analysis.aiAnalysis.rootCause}

### Suggested Fix
${analysis.aiAnalysis.suggestedFix}

### Task Created
A task has been created: \`.backlog/pending/${task.fileName}\`
**Assigned to**: ${task.agent}

---
_Auto-generated by cicd-monitor_`;

        await github.postOrUpdateComment(
          parseInt(options.prNumber),
          comment,
          `cicd-monitor-${options.buildId}`
        );
      }

      logger.info('✅ Task created and PR notified');
    }
  }
});
```

### 6. Rate Limiting

Implement rate limit protection:

```typescript
// src/utils/rate-limiter.ts
import pLimit from 'p-limit';

export class RateLimiter {
  private limiters: Map<string, any>;

  constructor() {
    this.limiters = new Map();
  }

  /**
   * Create rate limiter for API
   */
  createLimiter(api: string, requestsPerMinute: number) {
    const limit = pLimit(requestsPerMinute);
    this.limiters.set(api, limit);
    return limit;
  }

  /**
   * Get limiter for API
   */
  getLimiter(api: string) {
    return this.limiters.get(api);
  }
}
```

### 7. Tests

```typescript
// test/task-creator/task-generator.test.ts
import { describe, it, expect } from '@jest/globals';
import { TaskGenerator } from '../../src/task-creator/task-generator.js';

describe('TaskGenerator', () => {
  it('should generate task from analysis', () => {
    // TODO: Mock config and analysis
  });

  it('should generate unique task IDs', () => {
    // TODO: Test task ID generation
  });
});

// test/task-creator/agent-router.test.ts
import { describe, it, expect } from '@jest/globals';
import { AgentRouter } from '../../src/task-creator/agent-router.js';

describe('AgentRouter', () => {
  it('should route to correct agent based on error type', () => {
    // TODO: Test routing logic
  });
});
```

## Acceptance Criteria

BINARY: YES or NO (no partial completion)

- [ ] `TemplateEngine` implemented with render method
- [ ] `AgentRouter` implemented with route and getTemplateName methods
- [ ] `TaskGenerator` implemented with generate and commitTask methods
- [ ] Task ID generation is unique and includes timestamp
- [ ] Template rendering works with all 5 templates
- [ ] Agent routing uses AI recommendation when confidence >= 70%
- [ ] Agent routing falls back to config rules
- [ ] Task files are committed to `.backlog/pending/` with correct format
- [ ] PR comments include task details and assignment
- [ ] Rate limiting implemented
- [ ] Dry-run mode works (no actual commits)
- [ ] Quality gates pass:
  ```bash
  npm run lint
  npm run typecheck
  npm run build
  npm test
  ```
- [ ] Manual test: `npm run cli -- watch --build-id=<FAILED_BUILD> --project-id=zabicekiosk --pr-number=<PR> --auto-fix-enabled --dry-run` creates task

## Out of Scope

- Cloud Build pipeline integration → infra-008
- GitHub Actions workflow → infra-009
- Pub/Sub real-time monitoring (using polling for now)

## References

- Agent Manifest: `docs/agents/cicd-monitor.md`
- Task Templates: `tools/cicd-monitor/templates/`
- Config: `.cicd-monitor.config.yaml`

---

**Agent**: typescript-engineer
**Phase**: 3-integration
**Estimated Time**: 4-5 hours
