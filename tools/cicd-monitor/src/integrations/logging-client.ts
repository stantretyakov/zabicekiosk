/**
 * Cloud Logging API client
 */

import { Logging, type Entry } from '@google-cloud/logging';
import { getLogger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';

export interface LogEntry {
  timestamp: string;
  severity: string;
  textPayload?: string;
  jsonPayload?: Record<string, unknown>;
  resource?: {
    type: string;
    labels?: Record<string, string>;
  };
}

export class LoggingService {
  private logging: Logging;
  private logger = getLogger();

  constructor(projectId: string) {
    this.logging = new Logging({ projectId });
  }

  /**
   * Fetch all logs for a build
   */
  async fetchBuildLogs(projectId: string, buildId: string): Promise<LogEntry[]> {
    return this.fetchLogs(projectId, buildId, { minSeverity: 'DEFAULT' });
  }

  /**
   * Fetch error logs for a build (severity >= ERROR)
   */
  async fetchErrorLogs(projectId: string, buildId: string): Promise<LogEntry[]> {
    return this.fetchLogs(projectId, buildId, { minSeverity: 'ERROR' });
  }

  /**
   * Fetch logs with filter
   */
  private async fetchLogs(
    projectId: string,
    buildId: string,
    options: { minSeverity: string }
  ): Promise<LogEntry[]> {
    return withRetry(async () => {
      this.logger.debug('Fetching logs', { projectId, buildId, options });

      const filter = [
        `resource.type="build"`,
        `resource.labels.build_id="${buildId}"`,
        options.minSeverity !== 'DEFAULT' ? `severity>="${options.minSeverity}"` : '',
      ]
        .filter(Boolean)
        .join(' AND ');

      const [entries] = await this.logging.getEntries({
        filter,
        pageSize: 1000,
        orderBy: 'timestamp asc',
      });

      const logs = entries.map((entry) => this.convertEntry(entry));

      this.logger.debug('Logs fetched', { count: logs.length });

      return logs;
    });
  }

  /**
   * Convert Cloud Logging Entry to simplified LogEntry
   */
  private convertEntry(entry: Entry): LogEntry {
    const metadata = entry.metadata;

    return {
      timestamp: metadata.timestamp?.toString() || new Date().toISOString(),
      severity: (metadata.severity || 'DEFAULT').toString(),
      textPayload: typeof entry.data === 'string' ? entry.data : undefined,
      jsonPayload: typeof entry.data === 'object' ? (entry.data as Record<string, unknown>) : undefined,
      resource: metadata.resource
        ? {
            type: metadata.resource.type || 'unknown',
            labels: metadata.resource.labels as Record<string, string> | undefined,
          }
        : undefined,
    };
  }

  /**
   * Extract text from log entries
   */
  extractLogText(logs: LogEntry[]): string {
    return logs
      .map((log) => {
        if (log.textPayload) {
          return log.textPayload;
        }
        if (log.jsonPayload) {
          return JSON.stringify(log.jsonPayload, null, 2);
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Filter logs by step ID
   */
  filterLogsByStep(logs: LogEntry[], stepId: string): LogEntry[] {
    return logs.filter((log) => {
      const text = log.textPayload || JSON.stringify(log.jsonPayload || {});
      return text.includes(stepId) || log.resource?.labels?.step_id === stepId;
    });
  }

  /**
   * Truncate logs to max length
   */
  truncateLogs(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    const truncated = text.substring(0, maxLength);
    return `${truncated}\n\n... (truncated ${text.length - maxLength} characters)`;
  }
}
