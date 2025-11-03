/**
 * Template engine for generating task markdown files
 */

import * as fs from 'fs';
import * as path from 'path';
import { getLogger } from '../utils/logger.js';
import type { TaskData } from '../config/types.js';

export class TemplateEngine {
  private logger = getLogger();
  private templatesDir: string;

  constructor() {
    // Templates are in tools/cicd-monitor/templates/
    this.templatesDir = path.join(__dirname, '../../templates');
  }

  /**
   * Render task from template
   */
  render(templateName: string, data: TaskData): string {
    const templatePath = path.join(this.templatesDir, `${templateName}.md`);

    if (!fs.existsSync(templatePath)) {
      this.logger.error('Template not found', { templateName, templatePath });
      throw new Error(`Template not found: ${templateName}`);
    }

    const template = fs.readFileSync(templatePath, 'utf-8');

    return this.replaceVariables(template, data);
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(template: string, data: TaskData): string {
    let result = template;

    // Simple variable replacement
    const variables: Record<string, string> = {
      '{taskId}': data.taskId,
      '{timestamp}': data.timestamp,
      '{error-type}': data.errorType,
      '{errorType}': data.errorType,
      '{priority}': data.priority,
      '{agent}': data.agent,
      '{project}': data.project || 'unknown',
      '{build-id}': data.buildId,
      '{buildId}': data.buildId,
      '{pr-number}': data.prNumber || 'N/A',
      '{prNumber}': data.prNumber || 'N/A',
      '{build-url}': data.buildUrl,
      '{buildUrl}': data.buildUrl,
      '{pr-url}': data.prUrl || 'N/A',
      '{prUrl}': data.prUrl || 'N/A',
      '{root-cause}': this.escapeMarkdown(data.rootCause),
      '{rootCause}': this.escapeMarkdown(data.rootCause),
      '{suggested-fix}': this.escapeMarkdown(data.suggestedFix),
      '{suggestedFix}': this.escapeMarkdown(data.suggestedFix),
      '{error-logs}': this.formatCodeBlock(data.errorLogs),
      '{errorLogs}': this.formatCodeBlock(data.errorLogs),
      '{full-logs}': this.formatCodeBlock(data.fullLogs),
      '{fullLogs}': this.formatCodeBlock(data.fullLogs),
      '{affected-files}': this.formatFileList(data.affectedFiles),
      '{affectedFiles}': this.formatFileList(data.affectedFiles),
    };

    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(key, 'g'), value);
    }

    return result;
  }

  /**
   * Escape markdown special characters
   */
  private escapeMarkdown(text: string): string {
    // Don't escape if text is already a code block or contains formatting
    if (text.includes('```') || text.includes('`')) {
      return text;
    }

    return text;
  }

  /**
   * Format text as code block
   */
  private formatCodeBlock(text: string): string {
    if (!text || text.trim() === '') {
      return '(No logs available)';
    }

    // Already a code block
    if (text.trim().startsWith('```')) {
      return text;
    }

    return `\`\`\`\n${text}\n\`\`\``;
  }

  /**
   * Format file list as markdown list
   */
  private formatFileList(files: string[]): string {
    if (files.length === 0) {
      return '(No files identified)';
    }

    return files.map((file) => `- \`${file}\``).join('\n');
  }

  /**
   * Get template name for error type
   */
  getTemplateForErrorType(errorType: string): string {
    const templates: Record<string, string> = {
      'lint-error': 'lint-error-task',
      'typecheck-error': 'typecheck-error-task',
      'test-failure': 'test-failure-task',
      'build-error': 'build-failure-task',
      'deployment-error': 'deployment-error-task',
      'migration-error': 'deployment-error-task', // Use deployment template
      'unknown': 'build-failure-task', // Fallback
    };

    return templates[errorType] || 'build-failure-task';
  }
}
