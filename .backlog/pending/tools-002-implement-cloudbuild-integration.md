---
id: tools-002
title: Implement Cloud Build and GitHub integrations
agent: typescript-engineer
priority: high
status: pending
phase: 2-intelligence
created: 2025-11-03
dependencies: [tools-001, infra-007]
---

# Task: Implement Cloud Build and GitHub API Integrations

## Context

The cicd-monitor CLI skeleton is ready. Now we need to implement the actual API integrations for Cloud Build (monitoring builds) and GitHub (PR comments, file commits).

**Dependencies**:
- tools-001: CLI skeleton with stub files
- infra-007: Service account and secrets configured

## Requirements

### 1. Cloud Build Client

Implement `src/integrations/cloudbuild-client.ts`:

```typescript
import { CloudBuildClient } from '@google-cloud/cloudbuild';
import { logger } from '../utils/logger.js';
import type { Config } from '../config/types.js';

export interface BuildStatus {
  id: string;
  status: 'QUEUED' | 'WORKING' | 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'CANCELLED' | 'INTERNAL_ERROR';
  projectId: string;
  steps: BuildStep[];
  startTime?: string;
  finishTime?: string;
  logUrl?: string;
}

export interface BuildStep {
  id: string;
  name: string;
  status: string;
  timing?: {
    startTime: string;
    endTime: string;
  };
}

export class CloudBuildService {
  private client: CloudBuildClient;
  private projectId: string;

  constructor(projectId: string) {
    this.client = new CloudBuildClient();
    this.projectId = projectId;
  }

  /**
   * Get build by ID
   */
  async getBuild(buildId: string): Promise<BuildStatus> {
    logger.info(`Fetching build ${buildId}`);

    const [build] = await this.client.getBuild({
      projectId: this.projectId,
      id: buildId,
    });

    return {
      id: build.id!,
      status: build.status as any,
      projectId: this.projectId,
      steps: build.steps?.map(step => ({
        id: step.id!,
        name: step.name!,
        status: step.status!,
        timing: step.timing ? {
          startTime: step.timing.startTime!,
          endTime: step.timing.endTime!,
        } : undefined,
      })) || [],
      startTime: build.startTime,
      finishTime: build.finishTime,
      logUrl: build.logUrl,
    };
  }

  /**
   * Poll build until terminal state
   */
  async waitForBuild(
    buildId: string,
    onUpdate?: (status: BuildStatus) => void
  ): Promise<BuildStatus> {
    const terminalStates = ['SUCCESS', 'FAILURE', 'TIMEOUT', 'CANCELLED', 'INTERNAL_ERROR'];

    let intervalMs = 5000; // Start with 5 seconds
    const maxIntervalMs = 30000;
    const backoffMultiplier = 1.5;

    while (true) {
      const build = await this.getBuild(buildId);

      if (onUpdate) {
        onUpdate(build);
      }

      if (terminalStates.includes(build.status)) {
        logger.info(`Build ${buildId} completed with status: ${build.status}`);
        return build;
      }

      logger.debug(`Build ${buildId} still running (${build.status}), waiting ${intervalMs}ms`);

      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      intervalMs = Math.min(intervalMs * backoffMultiplier, maxIntervalMs);
    }
  }

  /**
   * List recent builds
   */
  async listBuilds(options: {
    status?: string;
    pageSize?: number;
  } = {}): Promise<BuildStatus[]> {
    const request: any = {
      projectId: this.projectId,
      pageSize: options.pageSize || 10,
    };

    if (options.status) {
      request.filter = `status="${options.status.toUpperCase()}"`;
    }

    const builds: BuildStatus[] = [];
    const iterable = this.client.listBuildsAsync(request);

    for await (const build of iterable) {
      builds.push({
        id: build.id!,
        status: build.status as any,
        projectId: this.projectId,
        steps: build.steps?.map(step => ({
          id: step.id!,
          name: step.name!,
          status: step.status!,
        })) || [],
        startTime: build.startTime,
        finishTime: build.finishTime,
      });
    }

    return builds;
  }
}
```

### 2. Cloud Logging Client

Implement `src/integrations/logging-client.ts`:

```typescript
import { Logging } from '@google-cloud/logging';
import { logger } from '../utils/logger.js';

export interface LogEntry {
  timestamp: string;
  severity: string;
  textPayload?: string;
  jsonPayload?: any;
}

export class LoggingService {
  private logging: Logging;
  private projectId: string;

  constructor(projectId: string) {
    this.logging = new Logging({ projectId });
    this.projectId = projectId;
  }

  /**
   * Fetch logs for a specific build
   */
  async fetchBuildLogs(buildId: string): Promise<LogEntry[]> {
    logger.info(`Fetching logs for build ${buildId}`);

    const filter = `resource.labels.build_id="${buildId}"`;

    const [entries] = await this.logging.getEntries({
      filter,
      pageSize: 1000,
      orderBy: 'timestamp asc',
    });

    return entries.map(entry => ({
      timestamp: entry.metadata.timestamp as string,
      severity: entry.metadata.severity as string,
      textPayload: entry.data as string,
      jsonPayload: typeof entry.data === 'object' ? entry.data : undefined,
    }));
  }

  /**
   * Fetch only error logs for a build
   */
  async fetchErrorLogs(buildId: string): Promise<LogEntry[]> {
    logger.info(`Fetching error logs for build ${buildId}`);

    const filters = [
      `resource.labels.build_id="${buildId}"`,
      `severity>="ERROR"`,
    ].join(' AND ');

    const [entries] = await this.logging.getEntries({
      filter: filters,
      pageSize: 500,
      orderBy: 'timestamp asc',
    });

    return entries.map(entry => ({
      timestamp: entry.metadata.timestamp as string,
      severity: entry.metadata.severity as string,
      textPayload: entry.data as string,
      jsonPayload: typeof entry.data === 'object' ? entry.data : undefined,
    }));
  }
}
```

### 3. GitHub Client

Implement `src/integrations/github-client.ts`:

```typescript
import { Octokit } from 'octokit';
import { throttling } from '@octokit/plugin-throttling';
import { encode as base64Encode } from 'js-base64';
import { logger } from '../utils/logger.js';

const MyOctokit = Octokit.plugin(throttling);

export interface PRContext {
  number: number;
  title: string;
  author: string;
  branch: string;
  baseBranch: string;
  filesChanged: string[];
}

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new MyOctokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          logger.warn(`Rate limit hit for ${options.method} ${options.url}`);
          if (retryCount < 3) {
            logger.info(`Retrying after ${retryAfter}s`);
            return true;
          }
          return false;
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          logger.warn(`Secondary rate limit hit for ${options.method} ${options.url}`);
          return false;
        },
      },
    });
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Get PR context
   */
  async getPRContext(prNumber: number): Promise<PRContext> {
    logger.info(`Fetching PR #${prNumber} context`);

    const { data: pr } = await this.octokit.rest.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    // Get files changed
    const filesChanged: string[] = [];
    const iterator = this.octokit.paginate.iterator(
      this.octokit.rest.pulls.listFiles,
      {
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        per_page: 100,
      }
    );

    for await (const { data: files } of iterator) {
      filesChanged.push(...files.map(f => f.filename));
    }

    return {
      number: pr.number,
      title: pr.title,
      author: pr.user?.login || 'unknown',
      branch: pr.head.ref,
      baseBranch: pr.base.ref,
      filesChanged,
    };
  }

  /**
   * Post comment on PR
   */
  async postPRComment(prNumber: number, body: string): Promise<void> {
    logger.info(`Posting comment on PR #${prNumber}`);

    await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
      body,
    });
  }

  /**
   * Post or update existing comment (avoid duplicates)
   */
  async postOrUpdateComment(
    prNumber: number,
    body: string,
    identifier: string
  ): Promise<void> {
    logger.info(`Posting/updating comment on PR #${prNumber}`);

    // Find existing comment
    const { data: comments } = await this.octokit.rest.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
    });

    const existingComment = comments.find(c => c.body?.includes(`<!-- ${identifier} -->`));
    const bodyWithId = `${body}\n\n<!-- ${identifier} -->`;

    if (existingComment) {
      // Update existing
      await this.octokit.rest.issues.updateComment({
        owner: this.owner,
        repo: this.repo,
        comment_id: existingComment.id,
        body: bodyWithId,
      });
      logger.info(`Updated existing comment ${existingComment.id}`);
    } else {
      // Create new
      await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        body: bodyWithId,
      });
      logger.info('Created new comment');
    }
  }

  /**
   * Commit file to repository
   */
  async commitFile(
    path: string,
    content: string,
    message: string,
    branch: string,
    author: { name: string; email: string }
  ): Promise<void> {
    logger.info(`Committing file ${path} to branch ${branch}`);

    const contentEncoded = base64Encode(content);

    // Try to get existing file SHA
    let sha: string | undefined;
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: branch,
      });

      if ('sha' in data) {
        sha = data.sha;
      }
    } catch (error: any) {
      // File doesn't exist, will create new
      logger.debug(`File ${path} doesn't exist, creating new`);
    }

    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path,
      message,
      content: contentEncoded,
      branch,
      sha,
      committer: author,
      author,
    });

    logger.info(`File ${path} committed successfully`);
  }
}
```

### 4. Update CLI Commands

Update `src/index.ts` to use the integrations:

```typescript
// Command: watch
program
  .command('watch')
  // ... options ...
  .action(async (options) => {
    const config = loadConfig();
    const cloudBuild = new CloudBuildService(options.projectId);
    const logging = new LoggingService(options.projectId);
    const github = new GitHubService(
      process.env.GITHUB_TOKEN!,
      config.repository.owner,
      config.repository.repo
    );

    logger.info(`Watching build ${options.buildId}...`);

    // Wait for build to complete
    const build = await cloudBuild.waitForBuild(options.buildId, (status) => {
      logger.info(`Build status: ${status.status}`);
    });

    if (build.status === 'SUCCESS') {
      logger.info('Build succeeded, nothing to do');
      return;
    }

    // Build failed, fetch logs
    logger.info('Build failed, fetching logs...');
    const logs = await logging.fetchErrorLogs(options.buildId);

    // TODO: Analyze and create tasks (future task)
    logger.info(`Found ${logs.length} error log entries`);

    if (options.notify && options.prNumber) {
      await github.postPRComment(
        parseInt(options.prNumber),
        `## ❌ Build Failed\n\nBuild ID: \`${options.buildId}\`\n\nSee logs for details.`
      );
    }
  });

// Command: list
program
  .command('list')
  // ... options ...
  .action(async (options) => {
    const cloudBuild = new CloudBuildService(options.projectId);

    const builds = await cloudBuild.listBuilds({
      status: options.status,
      pageSize: parseInt(options.last),
    });

    console.table(builds.map(b => ({
      ID: b.id.substring(0, 12),
      Status: b.status,
      StartTime: b.startTime || '-',
    })));
  });
```

### 5. Environment Variables

Update `.env.example`:

```bash
# GitHub (required for PR comments and commits)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GCP (for local dev, uses ADC in Cloud Build)
GOOGLE_CLOUD_PROJECT=zabicekiosk
GOOGLE_APPLICATION_CREDENTIALS=./cicd-monitor-key.json

# Claude API (for error analysis - future task)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6. Tests

Create integration tests (can be mocked):

```typescript
// test/integrations/cloudbuild-client.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { CloudBuildService } from '../../src/integrations/cloudbuild-client.js';

describe('CloudBuildService', () => {
  it('should fetch build by ID', async () => {
    const service = new CloudBuildService('test-project');
    // TODO: Mock getBuild
  });

  it('should wait for build completion', async () => {
    // TODO: Mock polling
  });
});

// test/integrations/github-client.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { GitHubService } from '../../src/integrations/github-client.js';

describe('GitHubService', () => {
  it('should post PR comment', async () => {
    // TODO: Mock Octokit
  });

  it('should commit file', async () => {
    // TODO: Mock Octokit
  });
});
```

## Acceptance Criteria

BINARY: YES or NO (no partial completion)

- [ ] `CloudBuildService` implemented with getBuild, waitForBuild, listBuilds methods
- [ ] `LoggingService` implemented with fetchBuildLogs, fetchErrorLogs methods
- [ ] `GitHubService` implemented with getPRContext, postPRComment, postOrUpdateComment, commitFile methods
- [ ] CLI `watch` command uses integrations (polls build, fetches logs, posts comment)
- [ ] CLI `list` command works and shows recent builds
- [ ] Environment variables documented in .env.example
- [ ] Quality gates pass:
  ```bash
  npm run lint      # ✅ No errors
  npm run typecheck # ✅ No errors
  npm run build     # ✅ Succeeds
  npm test          # ✅ Tests pass
  ```
- [ ] Manual test: `npm run cli -- list --project-id=zabicekiosk --last=5` shows builds
- [ ] Manual test: `npm run cli -- watch --build-id=<REAL_ID> --project-id=zabicekiosk --dry-run` completes

## Out of Scope

- Error analysis with Claude → tools-003
- Task generation → tools-004
- Agent routing → tools-004
- Pub/Sub integration (use polling for now)

## References

- Agent Manifest: `docs/agents/cicd-monitor.md`
- Research: Agent outputs from initial planning (Cloud Build API patterns, GitHub API patterns)

---

**Agent**: typescript-engineer
**Phase**: 2-intelligence
**Estimated Time**: 4-5 hours
