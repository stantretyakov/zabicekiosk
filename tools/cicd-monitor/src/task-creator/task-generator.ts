/**
 * Task generator - creates task markdown files from analysis
 */

import { TemplateEngine } from './template-engine.js';
import { AgentRouter } from './agent-router.js';
import { getLogger } from '../utils/logger.js';
import type {
  RootCauseAnalysis,
  TaskData,
  TaskMetadata,
  PRContext,
  TaskCreationConfig,
} from '../config/types.js';

export class TaskGenerator {
  private templateEngine: TemplateEngine;
  private agentRouter: AgentRouter;
  private config: TaskCreationConfig;
  private logger = getLogger();

  constructor(config: TaskCreationConfig) {
    this.templateEngine = new TemplateEngine();
    this.agentRouter = new AgentRouter(config);
    this.config = config;
  }

  /**
   * Generate task file from analysis
   */
  generate(
    analysis: RootCauseAnalysis,
    buildId: string,
    buildUrl: string,
    errorLogs: string,
    fullLogs: string,
    prContext?: PRContext
  ): { taskId: string; content: string; metadata: TaskMetadata } {
    const { classification, aiAnalysis, filesInvolved } = analysis;

    // Route to agent
    const agent = this.agentRouter.route(analysis);

    // Generate task ID
    const taskId = this.generateTaskId(
      classification.errorType,
      classification.project
    );

    // Create task data
    const taskData: TaskData = {
      taskId,
      timestamp: analysis.timestamp,
      errorType: classification.errorType,
      priority: classification.priority,
      agent,
      project: classification.project,
      buildId,
      prNumber: prContext?.number.toString(),
      buildUrl,
      prUrl: prContext?.url,
      rootCause: aiAnalysis.rootCause,
      suggestedFix: aiAnalysis.suggestedFix,
      errorLogs: this.truncateLogs(errorLogs, 5000),
      fullLogs: this.truncateLogs(fullLogs, 20000),
      affectedFiles: filesInvolved,
    };

    // Get template for error type
    const templateName = this.templateEngine.getTemplateForErrorType(
      classification.errorType
    );

    // Render template
    const content = this.templateEngine.render(templateName, taskData);

    this.logger.info('Task generated', {
      taskId,
      errorType: classification.errorType,
      agent,
    });

    return {
      taskId,
      content,
      metadata: {
        taskId: taskData.taskId,
        timestamp: taskData.timestamp,
        errorType: taskData.errorType,
        priority: taskData.priority,
        agent: taskData.agent,
        project: taskData.project,
        buildId: taskData.buildId,
        prNumber: taskData.prNumber,
        buildUrl: taskData.buildUrl,
      },
    };
  }

  /**
   * Generate unique task ID
   * Format: auto-{errorType}-{YYYYMMDD}-{HHMMSS}-{project}
   */
  private generateTaskId(errorType: string, project?: string): string {
    const now = new Date();

    const date = now
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '');
    const time = now
      .toISOString()
      .split('T')[1]
      .split('.')[0]
      .replace(/:/g, '');

    const parts = ['auto', errorType, date, time];

    if (project) {
      parts.push(project);
    }

    return parts.join('-');
  }

  /**
   * Truncate logs to max length
   */
  private truncateLogs(logs: string, maxLength: number): string {
    if (logs.length <= maxLength) {
      return logs;
    }

    const truncated = logs.substring(0, maxLength);
    const remaining = logs.length - maxLength;

    return `${truncated}\n\n... (truncated ${remaining} characters - see full build logs for complete output)`;
  }

  /**
   * Get task file path
   */
  getTaskFilePath(taskId: string): string {
    return `.backlog/pending/${taskId}.md`;
  }

  /**
   * Format commit message for task
   */
  formatCommitMessage(taskId: string, errorType: string, buildId: string): string {
    const template = this.config.commit.message_template;

    return template
      .replace('{taskId}', taskId)
      .replace('{errorType}', errorType)
      .replace('{buildId}', buildId);
  }
}
