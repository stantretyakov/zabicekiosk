/**
 * Rate limiting utilities using p-limit
 */

import pLimit from 'p-limit';
import type { RateLimitsConfig } from '../config/types.js';

export interface RateLimiters {
  github: ReturnType<typeof pLimit>;
  cloudbuild: ReturnType<typeof pLimit>;
  claude: ReturnType<typeof pLimit>;
}

/**
 * Create rate limiters based on configuration
 * Converts requests per minute to concurrent request limit
 */
export function createRateLimiters(config: RateLimitsConfig): RateLimiters {
  // Convert per-minute limits to reasonable concurrency limits
  // Divide by 60 to get per-second, then multiply by a safety factor
  const githubConcurrency = Math.max(1, Math.floor(config.github_api_per_minute / 10));
  const cloudbuildConcurrency = Math.max(1, Math.floor(config.cloudbuild_api_per_minute / 10));
  const claudeConcurrency = Math.max(1, Math.floor(config.claude_api_per_minute / 10));

  return {
    github: pLimit(githubConcurrency),
    cloudbuild: pLimit(cloudbuildConcurrency),
    claude: pLimit(claudeConcurrency),
  };
}

/**
 * Simple rate limiter that tracks time between calls
 */
export class SimpleRateLimiter {
  private lastCallTime = 0;
  private minIntervalMs: number;

  constructor(callsPerMinute: number) {
    this.minIntervalMs = (60 * 1000) / callsPerMinute;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.minIntervalMs) {
      const waitTime = this.minIntervalMs - timeSinceLastCall;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastCallTime = Date.now();
  }
}
