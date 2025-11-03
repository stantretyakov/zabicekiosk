/**
 * Configuration loader for CI/CD Monitor
 * Loads and validates configuration from YAML file
 */

import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import { CICDMonitorConfigSchema, type CICDMonitorConfig } from './types.js';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Load configuration from YAML file
 * @param configPath Path to config file (default: ../../.cicd-monitor.config.yaml)
 * @returns Validated configuration object
 */
export function loadConfig(configPath?: string): CICDMonitorConfig {
  const resolvedPath = resolveConfigPath(configPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new ConfigError(`Config file not found: ${resolvedPath}`);
  }

  try {
    const fileContents = fs.readFileSync(resolvedPath, 'utf8');
    const rawConfig = YAML.parse(fileContents);

    // Validate with Zod
    const result = CICDMonitorConfigSchema.safeParse(rawConfig);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
      throw new ConfigError(`Invalid configuration:\n${errors}`);
    }

    return result.data;
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(`Failed to load config from ${resolvedPath}: ${error}`);
  }
}

/**
 * Resolve config file path
 * Priority:
 * 1. Explicit path parameter
 * 2. CICD_MONITOR_CONFIG env var
 * 3. Default: ../../.cicd-monitor.config.yaml (from repo root)
 */
function resolveConfigPath(configPath?: string): string {
  if (configPath) {
    return path.resolve(configPath);
  }

  if (process.env.CICD_MONITOR_CONFIG) {
    return path.resolve(process.env.CICD_MONITOR_CONFIG);
  }

  // Default: repo root (2 levels up from tools/cicd-monitor/src)
  const defaultPath = path.join(__dirname, '../../../.cicd-monitor.config.yaml');
  return path.resolve(defaultPath);
}

/**
 * Get environment variable or throw error
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ConfigError(`Required environment variable not set: ${name}`);
  }
  return value;
}

/**
 * Get environment variable or return default
 */
export function getOptionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Validate required environment variables for CLI execution
 */
export function validateEnvironment(): void {
  const required = ['GOOGLE_CLOUD_PROJECT'];
  const missing: string[] = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nSee .env.example for details.`
    );
  }
}

/**
 * Validate secrets are available
 */
export function validateSecrets(): void {
  const secrets = {
    GITHUB_TOKEN: 'GitHub Personal Access Token',
    ANTHROPIC_API_KEY: 'Claude API Key',
  };

  const missing: string[] = [];

  for (const [envVar, description] of Object.entries(secrets)) {
    if (!process.env[envVar]) {
      missing.push(`${envVar} (${description})`);
    }
  }

  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required secrets:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nSee .env.example and scripts/setup-secrets.sh for details.`
    );
  }
}
