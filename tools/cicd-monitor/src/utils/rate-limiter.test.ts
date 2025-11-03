/**
 * Tests for rate limiter
 */

import { describe, it, expect } from '@jest/globals';
import { createRateLimiters, SimpleRateLimiter } from './rate-limiter.js';
import type { RateLimitsConfig } from '../config/types.js';

describe('Rate Limiter', () => {
  describe('createRateLimiters', () => {
    it('should create rate limiters from config', () => {
      const config: RateLimitsConfig = {
        github_api_per_minute: 30,
        cloudbuild_api_per_minute: 60,
        claude_api_per_minute: 10,
        max_tasks_per_pr: 5,
        analysis_cooldown_seconds: 300,
      };

      const limiters = createRateLimiters(config);

      expect(limiters.github).toBeDefined();
      expect(limiters.cloudbuild).toBeDefined();
      expect(limiters.claude).toBeDefined();
    });
  });

  describe('SimpleRateLimiter', () => {
    it('should throttle calls', async () => {
      const limiter = new SimpleRateLimiter(120); // 120 calls per minute = 500ms interval

      const start = Date.now();
      await limiter.throttle();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      // Should take at least 500ms for second call
      expect(elapsed).toBeGreaterThanOrEqual(400); // Allow some margin
    });

    it('should not throttle first call', async () => {
      const limiter = new SimpleRateLimiter(60);

      const start = Date.now();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      // First call should be instant
      expect(elapsed).toBeLessThan(100);
    });
  });
});
