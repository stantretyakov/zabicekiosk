/**
 * Type definitions and Zod schemas for CI/CD Monitor configuration
 */

import { z } from 'zod';

// ============================================================
// Zod Schemas
// ============================================================

export const MonitorConfigSchema = z.object({
  mode: z.enum(['watch', 'analyze', 'disabled']),
  use_pubsub: z.boolean(),
  pubsub_subscription: z.string().optional(),
  polling: z
    .object({
      initial_interval_ms: z.number().min(1000),
      max_interval_ms: z.number().min(5000),
      backoff_multiplier: z.number().min(1),
    })
    .optional(),
});

export const AutoFixConfigSchema = z.object({
  enabled: z.boolean(),
  max_retries: z.number().min(0),
  create_fix_pr: z.boolean(),
});

export const NotificationsConfigSchema = z.object({
  pr_comment: z.boolean(),
  slack: z.boolean(),
  email: z.boolean(),
});

export const AnalysisConfigSchema = z.object({
  ai_model: z.string(),
  max_context_files: z.number().min(1),
  temperature: z.number().min(0).max(1),
  skip_known_patterns: z.boolean(),
});

export const TaskCreationConfigSchema = z.object({
  enabled: z.boolean(),
  priority_rules: z.record(z.string(), z.enum(['blocker', 'critical', 'high', 'medium', 'low'])),
  agent_routing: z.record(
    z.string(),
    z.union([
      z.object({ services: z.string(), web: z.string() }),
      z.object({ default: z.string() }),
    ])
  ),
  commit: z.object({
    branch: z.string(),
    author_name: z.string(),
    author_email: z.string().email(),
    message_template: z.string(),
  }),
});

export const RateLimitsConfigSchema = z.object({
  github_api_per_minute: z.number().min(1),
  cloudbuild_api_per_minute: z.number().min(1),
  claude_api_per_minute: z.number().min(1),
  max_tasks_per_pr: z.number().min(1),
  analysis_cooldown_seconds: z.number().min(0),
});

export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  format: z.enum(['json', 'pretty']),
  cloud_logging: z.boolean(),
});

export const RepositoryConfigSchema = z.object({
  owner: z.string(),
  repo: z.string(),
});

export const GCPConfigSchema = z.object({
  project_id: z.string(),
  region: z.string(),
});

export const CICDMonitorConfigSchema = z.object({
  monitor: MonitorConfigSchema,
  auto_fix: AutoFixConfigSchema,
  notifications: NotificationsConfigSchema,
  analysis: AnalysisConfigSchema,
  task_creation: TaskCreationConfigSchema,
  rate_limits: RateLimitsConfigSchema,
  logging: LoggingConfigSchema,
  repository: RepositoryConfigSchema,
  gcp: GCPConfigSchema,
});

// ============================================================
// TypeScript Types (inferred from Zod schemas)
// ============================================================

export type MonitorConfig = z.infer<typeof MonitorConfigSchema>;
export type AutoFixConfig = z.infer<typeof AutoFixConfigSchema>;
export type NotificationsConfig = z.infer<typeof NotificationsConfigSchema>;
export type AnalysisConfig = z.infer<typeof AnalysisConfigSchema>;
export type TaskCreationConfig = z.infer<typeof TaskCreationConfigSchema>;
export type RateLimitsConfig = z.infer<typeof RateLimitsConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type RepositoryConfig = z.infer<typeof RepositoryConfigSchema>;
export type GCPConfig = z.infer<typeof GCPConfigSchema>;
export type CICDMonitorConfig = z.infer<typeof CICDMonitorConfigSchema>;

// ============================================================
// Error Classification Types
// ============================================================

export type ErrorType =
  | 'lint-error'
  | 'typecheck-error'
  | 'test-failure'
  | 'build-error'
  | 'deployment-error'
  | 'migration-error'
  | 'unknown';

export type Priority = 'blocker' | 'critical' | 'high' | 'medium' | 'low';

export type AgentName =
  | 'typescript-engineer'
  | 'react-engineer'
  | 'test-engineer'
  | 'devops'
  | 'database-engineer';

export interface ErrorClassification {
  errorType: ErrorType;
  priority: Priority;
  failedStepId: string;
  failedStepName: string;
  project?: string; // e.g., 'core-api', 'admin-portal'
  buildId: string;
}

// ============================================================
// AI Analysis Types
// ============================================================

export interface AIAnalysis {
  rootCause: string;
  affectedComponents: string[];
  suggestedFix: string;
  riskAssessment: 'low' | 'medium' | 'high';
  recommendedAgent: AgentName;
  confidence: number; // 0-100
}

export interface RootCauseAnalysis {
  classification: ErrorClassification;
  aiAnalysis: AIAnalysis;
  filesInvolved: string[];
  timestamp: string;
}

// ============================================================
// Build Types
// ============================================================

export interface BuildContext {
  buildId: string;
  projectId: string;
  status: 'QUEUED' | 'WORKING' | 'SUCCESS' | 'FAILURE' | 'INTERNAL_ERROR' | 'TIMEOUT' | 'CANCELLED';
  prNumber?: string;
  branch?: string;
  commitSha?: string;
  triggerSource?: string;
}

export interface BuildStep {
  id: string;
  name: string;
  status: 'QUEUED' | 'WORKING' | 'SUCCESS' | 'FAILURE' | 'INTERNAL_ERROR' | 'TIMEOUT' | 'CANCELLED';
  timing?: {
    startTime: string;
    endTime: string;
  };
}

// ============================================================
// Task Generation Types
// ============================================================

export interface TaskMetadata {
  taskId: string;
  timestamp: string;
  errorType: ErrorType;
  priority: Priority;
  agent: AgentName;
  project?: string;
  buildId: string;
  prNumber?: string;
  buildUrl: string;
}

export interface TaskData extends TaskMetadata {
  rootCause: string;
  suggestedFix: string;
  errorLogs: string;
  fullLogs: string;
  affectedFiles: string[];
  prUrl?: string;
}

// ============================================================
// PR Context Types
// ============================================================

export interface PRContext {
  number: number;
  title: string;
  branch: string;
  baseBranch: string;
  author: string;
  filesChanged: string[];
  url: string;
}

// ============================================================
// CLI Options Types
// ============================================================

export interface WatchOptions {
  buildId: string;
  projectId: string;
  prNumber?: string;
  branch?: string;
  autoFixEnabled?: boolean;
  notify?: boolean;
  dryRun?: boolean;
}

export interface AnalyzeOptions {
  buildId: string;
  projectId: string;
  prNumber?: string;
  branch?: string;
  createTasks?: boolean;
  notify?: boolean;
  dryRun?: boolean;
  provisionResources?: boolean;
}

export interface ListOptions {
  projectId: string;
  status?: 'failed' | 'success' | 'working';
  last?: number;
}

export interface TasksOptions {
  buildId: string;
}
