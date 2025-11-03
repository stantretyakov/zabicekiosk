/**
 * Root cause analysis using AI or heuristics
 */

import { ClaudeService } from '../integrations/claude-client.js';
import { FileExtractor } from './file-extractor.js';
import { getLogger } from '../utils/logger.js';
import type {
  ErrorClassification,
  RootCauseAnalysis,
  AIAnalysis,
  AnalysisConfig,
} from '../config/types.js';

export class RootCauseAnalyzer {
  private claudeService: ClaudeService;
  private fileExtractor: FileExtractor;
  private config: AnalysisConfig;
  private logger = getLogger();

  constructor(claudeService: ClaudeService, config: AnalysisConfig) {
    this.claudeService = claudeService;
    this.fileExtractor = new FileExtractor();
    this.config = config;
  }

  /**
   * Analyze error to determine root cause
   */
  async analyze(
    classification: ErrorClassification,
    errorLogs: string
  ): Promise<RootCauseAnalysis> {
    this.logger.info('Starting root cause analysis', {
      errorType: classification.errorType,
      buildId: classification.buildId,
    });

    // Extract affected files
    const filesInvolved = this.fileExtractor.extractFiles(errorLogs);
    const limitedFiles = this.fileExtractor.limitFiles(
      filesInvolved,
      this.config.max_context_files
    );

    // Check if we should use AI or heuristics
    const useAI = this.shouldUseAI(classification);

    let aiAnalysis: AIAnalysis;

    if (useAI) {
      this.logger.info('Using AI analysis', { errorType: classification.errorType });
      aiAnalysis = await this.claudeService.analyzeError(
        classification,
        errorLogs,
        limitedFiles
      );
    } else {
      this.logger.info('Using heuristic analysis', { errorType: classification.errorType });
      aiAnalysis = this.heuristicAnalysis(classification, errorLogs, limitedFiles);
    }

    const analysis: RootCauseAnalysis = {
      classification,
      aiAnalysis,
      filesInvolved: limitedFiles,
      timestamp: new Date().toISOString(),
    };

    this.logger.info('Root cause analysis complete', {
      buildId: classification.buildId,
      filesInvolved: limitedFiles.length,
      confidence: aiAnalysis.confidence,
    });

    return analysis;
  }

  /**
   * Determine if AI analysis should be used
   */
  private shouldUseAI(classification: ErrorClassification): boolean {
    if (!this.config.skip_known_patterns) {
      return true;
    }

    // Use heuristics for simple, known patterns
    const simpleErrors = ['lint-error', 'typecheck-error'];
    return !simpleErrors.includes(classification.errorType);
  }

  /**
   * Heuristic-based analysis for known error patterns
   */
  private heuristicAnalysis(
    classification: ErrorClassification,
    _errorLogs: string,
    filesInvolved: string[]
  ): AIAnalysis {
    const analysis: AIAnalysis = {
      rootCause: '',
      affectedComponents: filesInvolved,
      suggestedFix: '',
      riskAssessment: 'low',
      recommendedAgent: 'typescript-engineer',
      confidence: 85,
    };

    switch (classification.errorType) {
      case 'lint-error':
        analysis.rootCause =
          'ESLint rule violations detected. Code style or quality issues need to be addressed.';
        analysis.suggestedFix =
          '1. Run `npm run lint` to see all violations\n2. Run `npm run lint -- --fix` to auto-fix where possible\n3. Manually fix remaining violations\n4. Commit and push changes';
        analysis.riskAssessment = 'low';
        analysis.recommendedAgent = this.getAgentForProject(classification.project);
        break;

      case 'typecheck-error':
        analysis.rootCause =
          'TypeScript type errors detected. Type annotations or definitions are missing or incorrect.';
        analysis.suggestedFix =
          '1. Run `npm run typecheck` to see all errors\n2. Fix type annotations in reported files\n3. Add missing types or interfaces\n4. Run typecheck again to verify\n5. Commit and push changes';
        analysis.riskAssessment = 'medium';
        analysis.recommendedAgent = this.getAgentForProject(classification.project);
        break;

      case 'test-failure':
        analysis.rootCause =
          'Jest tests are failing. Recent code changes may have broken existing functionality.';
        analysis.suggestedFix =
          '1. Run `npm test` locally to reproduce\n2. Review test failures and error messages\n3. Fix code or update tests as needed\n4. Ensure coverage thresholds are met\n5. Commit and push changes';
        analysis.riskAssessment = 'high';
        analysis.recommendedAgent = 'test-engineer';
        break;

      case 'build-error':
        analysis.rootCause =
          'Build compilation failed. Syntax errors or missing dependencies detected.';
        analysis.suggestedFix =
          '1. Run `npm run build` locally to reproduce\n2. Check error messages for syntax errors\n3. Verify all dependencies are installed\n4. Fix build errors\n5. Commit and push changes';
        analysis.riskAssessment = 'high';
        analysis.recommendedAgent = this.getAgentForProject(classification.project);
        break;

      case 'deployment-error':
        analysis.rootCause =
          'Deployment to Cloud Run failed. Configuration or infrastructure issue.';
        analysis.suggestedFix =
          '1. Review Cloud Build logs for deployment errors\n2. Check Cloud Run service configuration\n3. Verify environment variables and secrets\n4. Check resource limits and quotas\n5. Re-trigger deployment after fixes';
        analysis.riskAssessment = 'high';
        analysis.recommendedAgent = 'devops';
        break;

      case 'migration-error':
        analysis.rootCause = 'Database migration failed. Schema or data integrity issue.';
        analysis.suggestedFix =
          '1. Review migration logs\n2. Check Firestore schema definitions\n3. Verify data integrity constraints\n4. Test migration in development environment\n5. Re-run migration after fixes';
        analysis.riskAssessment = 'high';
        analysis.recommendedAgent = 'database-engineer';
        break;

      default:
        analysis.rootCause = 'Unknown error type. Manual investigation required.';
        analysis.suggestedFix =
          '1. Review full build logs\n2. Identify failed step and error message\n3. Reproduce error locally if possible\n4. Fix underlying issue\n5. Re-trigger build';
        analysis.riskAssessment = 'medium';
        analysis.confidence = 50;
    }

    return analysis;
  }

  /**
   * Get recommended agent based on project
   */
  private getAgentForProject(project?: string): AIAnalysis['recommendedAgent'] {
    if (!project) return 'typescript-engineer';

    if (project.includes('api')) {
      return 'typescript-engineer';
    }

    if (project.includes('portal') || project.includes('pwa') || project.includes('web')) {
      return 'react-engineer';
    }

    return 'typescript-engineer';
  }
}
