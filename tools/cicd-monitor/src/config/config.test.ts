/**
 * Tests for configuration loading
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getRequiredEnv, getOptionalEnv, validateEnvironment, validateSecrets, ConfigError } from './config.js';

describe('Config Module', () => {
  describe('getRequiredEnv', () => {
    beforeEach(() => {
      process.env.TEST_VAR = 'test-value';
    });

    afterEach(() => {
      delete process.env.TEST_VAR;
    });

    it('should return environment variable value', () => {
      expect(getRequiredEnv('TEST_VAR')).toBe('test-value');
    });

    it('should throw error if variable not set', () => {
      expect(() => getRequiredEnv('MISSING_VAR')).toThrow(ConfigError);
    });
  });

  describe('getOptionalEnv', () => {
    it('should return environment variable value if set', () => {
      process.env.OPT_VAR = 'optional-value';
      expect(getOptionalEnv('OPT_VAR', 'default')).toBe('optional-value');
      delete process.env.OPT_VAR;
    });

    it('should return default value if not set', () => {
      expect(getOptionalEnv('MISSING_VAR', 'default')).toBe('default');
    });
  });

  describe('validateEnvironment', () => {
    it('should not throw if required variables are set', () => {
      process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
      expect(() => validateEnvironment()).not.toThrow();
      delete process.env.GOOGLE_CLOUD_PROJECT;
    });

    it('should throw if required variables are missing', () => {
      delete process.env.GOOGLE_CLOUD_PROJECT;
      expect(() => validateEnvironment()).toThrow(ConfigError);
    });
  });

  describe('validateSecrets', () => {
    it('should not throw if secrets are set', () => {
      process.env.GITHUB_TOKEN = 'ghp_test';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
      expect(() => validateSecrets()).not.toThrow();
      delete process.env.GITHUB_TOKEN;
      delete process.env.ANTHROPIC_API_KEY;
    });

    it('should throw if secrets are missing', () => {
      delete process.env.GITHUB_TOKEN;
      delete process.env.ANTHROPIC_API_KEY;
      expect(() => validateSecrets()).toThrow(ConfigError);
    });
  });
});
