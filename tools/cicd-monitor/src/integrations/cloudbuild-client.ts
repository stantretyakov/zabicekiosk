/**
 * Cloud Build API client
 */

import { CloudBuildClient } from '@google-cloud/cloudbuild';
import type { protos } from '@google-cloud/cloudbuild';
import { getLogger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';
import type { BuildContext, BuildStep } from '../config/types.js';

type Build = protos.google.devtools.cloudbuild.v1.IBuild;

export class CloudBuildService {
  private client: CloudBuildClient;
  private logger = getLogger();

  constructor() {
    this.client = new CloudBuildClient();
  }

  /**
   * Get build by ID
   */
  async getBuild(projectId: string, buildId: string): Promise<Build> {
    return withRetry(async () => {
      this.logger.debug('Fetching build', { projectId, buildId });

      const [build] = await this.client.getBuild({
        projectId,
        id: buildId,
      });

      if (!build) {
        throw new Error(`Build not found: ${buildId}`);
      }

      this.logger.debug('Build fetched successfully', {
        buildId,
        status: build.status,
      });

      return build;
    });
  }

  /**
   * Wait for build to reach terminal state
   * Polls with exponential backoff
   */
  async waitForBuild(
    projectId: string,
    buildId: string,
    options: { maxWaitMs?: number; pollIntervalMs?: number } = {}
  ): Promise<Build> {
    const maxWaitMs = options.maxWaitMs ?? 30 * 60 * 1000; // 30 minutes
    const initialPollMs = options.pollIntervalMs ?? 5000; // 5 seconds
    const maxPollMs = 30000; // 30 seconds
    const backoffFactor = 1.5;

    const startTime = Date.now();
    let pollInterval = initialPollMs;

    while (true) {
      const build = await this.getBuild(projectId, buildId);

      if (this.isBuildTerminal(build)) {
        this.logger.info('Build reached terminal state', {
          buildId,
          status: build.status,
        });
        return build;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed >= maxWaitMs) {
        throw new Error(`Timeout waiting for build ${buildId} after ${elapsed}ms`);
      }

      this.logger.debug('Build still in progress, waiting...', {
        buildId,
        status: build.status,
        nextPollMs: pollInterval,
      });

      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      // Exponential backoff
      pollInterval = Math.min(pollInterval * backoffFactor, maxPollMs);
    }
  }

  /**
   * List recent builds
   */
  async listBuilds(
    projectId: string,
    options: { pageSize?: number; filter?: string } = {}
  ): Promise<Build[]> {
    return withRetry(async () => {
      this.logger.debug('Listing builds', { projectId, options });

      const [builds] = await this.client.listBuilds({
        projectId,
        pageSize: options.pageSize ?? 10,
        filter: options.filter,
      });

      this.logger.debug('Builds listed', { count: builds.length });

      return builds;
    });
  }

  /**
   * Extract build context from Build object
   */
  extractBuildContext(build: Build): BuildContext {
    return {
      buildId: build.id || '',
      projectId: build.projectId || '',
      status: (build.status as BuildContext['status']) || 'QUEUED',
      commitSha: build.substitutions?.COMMIT_SHA || build.source?.repoSource?.commitSha || undefined,
      branch:
        build.substitutions?.BRANCH_NAME ||
        build.substitutions?._BRANCH_NAME ||
        build.source?.repoSource?.branchName ||
        undefined,
      prNumber: build.substitutions?._PR_NUMBER || undefined,
      triggerSource: build.source?.repoSource?.repoName || undefined,
    };
  }

  /**
   * Extract failed build steps
   */
  extractFailedSteps(build: Build): BuildStep[] {
    if (!build.steps) {
      return [];
    }

    return build.steps
      .filter((step) => step.status === 'FAILURE' || step.status === 'TIMEOUT')
      .map((step) => ({
        id: step.id || '',
        name: step.name || '',
        status: (step.status as BuildStep['status']) || 'FAILURE',
        timing: step.timing
          ? {
              startTime: step.timing.startTime?.toString() || '',
              endTime: step.timing.endTime?.toString() || '',
            }
          : undefined,
      }));
  }

  /**
   * Check if build is in terminal state
   */
  private isBuildTerminal(build: Build): boolean {
    const terminalStates = ['SUCCESS', 'FAILURE', 'INTERNAL_ERROR', 'TIMEOUT', 'CANCELLED'];
    return terminalStates.includes((build.status || '').toString());
  }

  /**
   * Get build URL
   */
  getBuildUrl(projectId: string, buildId: string): string {
    return `https://console.cloud.google.com/cloud-build/builds;region=global/${buildId}?project=${projectId}`;
  }
}
