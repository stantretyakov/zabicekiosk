/**
 * Assess impact and severity of errors
 */

import type { ErrorType, Priority } from '../config/types.js';
import { getLogger } from '../utils/logger.js';

export interface ImpactAssessment {
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocksDeployment: boolean;
  affectsProduction: boolean;
  estimatedFixTime: string;
  urgency: string;
}

export class ImpactAssessor {
  private logger = getLogger();

  /**
   * Assess impact of error
   */
  assess(
    errorType: ErrorType,
    priority: Priority,
    filesAffected: number
  ): ImpactAssessment {
    const assessment: ImpactAssessment = {
      severity: this.determineSeverity(errorType, priority),
      blocksDeployment: this.checksIfBlocksDeployment(errorType),
      affectsProduction: this.checksIfAffectsProduction(errorType),
      estimatedFixTime: this.estimateFixTime(errorType, filesAffected),
      urgency: this.determineUrgency(errorType, priority),
    };

    this.logger.debug('Impact assessed', assessment);

    return assessment;
  }

  /**
   * Determine severity level
   */
  private determineSeverity(
    errorType: ErrorType,
    priority: Priority
  ): ImpactAssessment['severity'] {
    if (priority === 'blocker') return 'critical';
    if (priority === 'critical') return 'critical';

    const severityMap: Record<ErrorType, ImpactAssessment['severity']> = {
      'deployment-error': 'critical',
      'migration-error': 'critical',
      'build-error': 'high',
      'test-failure': 'medium',
      'typecheck-error': 'medium',
      'lint-error': 'low',
      'unknown': 'medium',
    };

    return severityMap[errorType] || 'medium';
  }

  /**
   * Check if error blocks deployment
   */
  private checksIfBlocksDeployment(errorType: ErrorType): boolean {
    const blockingErrors: ErrorType[] = [
      'deployment-error',
      'migration-error',
      'build-error',
      'test-failure',
      'typecheck-error',
    ];

    return blockingErrors.includes(errorType);
  }

  /**
   * Check if error affects production
   */
  private checksIfAffectsProduction(errorType: ErrorType): boolean {
    const productionErrors: ErrorType[] = ['deployment-error', 'migration-error'];

    return productionErrors.includes(errorType);
  }

  /**
   * Estimate fix time based on error type and complexity
   */
  private estimateFixTime(errorType: ErrorType, filesAffected: number): string {
    const baseTime: Record<string, number> = {
      'lint-error': 5,
      'typecheck-error': 15,
      'test-failure': 30,
      'build-error': 30,
      'migration-error': 60,
      'deployment-error': 45,
      'unknown': 30,
    };

    const base = baseTime[errorType] || 30;

    // Add time for each additional file
    const total = base + (filesAffected - 1) * 5;

    if (total < 15) return '< 15 minutes';
    if (total < 30) return '15-30 minutes';
    if (total < 60) return '30-60 minutes';
    return '> 1 hour';
  }

  /**
   * Determine urgency level
   */
  private determineUrgency(_errorType: ErrorType, priority: Priority): string {
    if (priority === 'blocker') return 'URGENT - Fix immediately';
    if (priority === 'critical') return 'HIGH - Fix within 1 hour';
    if (priority === 'high') return 'MEDIUM - Fix within 4 hours';
    return 'LOW - Fix when convenient';
  }
}
