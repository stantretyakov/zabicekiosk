/**
 * Error classification based on build step and project
 */

import type { protos } from '@google-cloud/cloudbuild';
import type { ErrorType, ErrorClassification, Priority } from '../config/types.js';
import { getLogger } from '../utils/logger.js';

type Build = protos.google.devtools.cloudbuild.v1.IBuild;

export class ErrorClassifier {
  private logger = getLogger();

  /**
   * Classify error based on failed build step
   */
  classify(build: Build): ErrorClassification | null {
    const failedStep = this.findFailedStep(build);

    if (!failedStep) {
      this.logger.warn('No failed step found in build', { buildId: build.id });
      return null;
    }

    const stepId = failedStep.id || '';
    const stepName = failedStep.name || '';
    const errorType = this.classifyByStepId(stepId);
    const priority = this.determinePriority(errorType);
    const project = this.extractProject(stepId);

    const classification: ErrorClassification = {
      errorType,
      priority,
      failedStepId: stepId,
      failedStepName: stepName,
      project,
      buildId: build.id || '',
    };

    this.logger.info('Error classified', classification);

    return classification;
  }

  /**
   * Find first failed step in build
   */
  private findFailedStep(build: Build): protos.google.devtools.cloudbuild.v1.IBuildStep | null {
    if (!build.steps) {
      return null;
    }

    return (
      build.steps.find(
        (step) => step.status === 'FAILURE' || step.status === 'TIMEOUT'
      ) || null
    );
  }

  /**
   * Classify error type by step ID pattern
   */
  private classifyByStepId(stepId: string): ErrorType {
    const patterns: Array<[RegExp, ErrorType]> = [
      [/quality-gate-.*-lint/i, 'lint-error'],
      [/quality-gate-.*-typecheck/i, 'typecheck-error'],
      [/quality-gate-.*-test/i, 'test-failure'],
      [/quality-gate-.*-build/i, 'build-error'],
      [/build-.*-build/i, 'build-error'],
      [/verify-database|migrate-database/i, 'migration-error'],
      [/deploy-|build-and-deploy/i, 'deployment-error'],
    ];

    for (const [pattern, errorType] of patterns) {
      if (pattern.test(stepId)) {
        return errorType;
      }
    }

    this.logger.warn('Unknown error type for step', { stepId });
    return 'unknown';
  }

  /**
   * Determine priority based on error type
   */
  private determinePriority(errorType: ErrorType): Priority {
    const priorityMap: Record<ErrorType, Priority> = {
      'deployment-error': 'blocker',
      'migration-error': 'critical',
      'build-error': 'critical',
      'test-failure': 'high',
      'typecheck-error': 'high',
      'lint-error': 'high',
      'unknown': 'medium',
    };

    return priorityMap[errorType] || 'medium';
  }

  /**
   * Extract project name from step ID
   * Examples:
   * - quality-gate-core-api-lint → core-api
   * - quality-gate-admin-portal-test → admin-portal
   * - build-zabice-kiosk-web-build → kiosk-pwa
   */
  private extractProject(stepId: string): string | undefined {
    const patterns = [
      /quality-gate-(core-api|booking-api)/i,
      /quality-gate-(admin-portal|kiosk-pwa|parent-web)/i,
      /build-zabice-(kiosk|admin|parent)-web/i,
      /deploy-|verify-database/i,
    ];

    for (const pattern of patterns) {
      const match = stepId.match(pattern);
      if (match && match[1]) {
        const projectName = match[1];

        // Normalize project names
        if (projectName === 'kiosk') return 'kiosk-pwa';
        if (projectName === 'admin') return 'admin-portal';
        if (projectName === 'parent') return 'parent-web';

        return projectName.toLowerCase();
      }
    }

    return undefined;
  }

  /**
   * Determine if project is a service or web app
   */
  isService(project?: string): boolean {
    if (!project) return false;
    return project.includes('api');
  }

  /**
   * Determine if project is a web app
   */
  isWebApp(project?: string): boolean {
    if (!project) return false;
    return project.includes('portal') || project.includes('pwa') || project.includes('web');
  }
}
