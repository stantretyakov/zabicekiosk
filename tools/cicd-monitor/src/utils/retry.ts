/**
 * Retry logic with exponential backoff using p-retry
 */

import pRetry, { type Options as PRetryOptions } from 'p-retry';
import { getLogger } from './logger.js';

export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
  onFailedAttempt?: (error: Error, attemptNumber: number) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const logger = getLogger();

  const pRetryOptions: PRetryOptions = {
    retries: options.retries ?? 3,
    minTimeout: options.minTimeout ?? 1000,
    maxTimeout: options.maxTimeout ?? 30000,
    factor: options.factor ?? 2,
    onFailedAttempt: (error) => {
      logger.warn('Retry attempt failed', {
        attempt: error.attemptNumber,
        retriesLeft: error.retriesLeft,
        error: error.message,
      });

      if (options.onFailedAttempt) {
        options.onFailedAttempt(error, error.attemptNumber);
      }
    },
  };

  return pRetry(fn, pRetryOptions);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes('econnreset') ||
      message.includes('enotfound') ||
      message.includes('etimedout') ||
      message.includes('network')
    ) {
      return true;
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) {
      return true;
    }

    // Temporary server errors
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return true;
    }
  }

  return false;
}

/**
 * Retry only if error is retryable
 */
export async function withConditionalRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(
    async () => {
      try {
        return await fn();
      } catch (error) {
        if (!isRetryableError(error)) {
          // Don't retry non-retryable errors - just throw
          throw error;
        }
        throw error;
      }
    },
    options
  );
}
