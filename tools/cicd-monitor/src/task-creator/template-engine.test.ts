/**
 * Tests for template engine
 */

import { describe, it, expect } from '@jest/globals';
import { TemplateEngine } from './template-engine.js';

describe('TemplateEngine', () => {
  const engine = new TemplateEngine();

  describe('getTemplateForErrorType', () => {
    it('should map error types to templates', () => {
      expect(engine.getTemplateForErrorType('lint-error')).toBe('lint-error-task');
      expect(engine.getTemplateForErrorType('typecheck-error')).toBe('typecheck-error-task');
      expect(engine.getTemplateForErrorType('test-failure')).toBe('test-failure-task');
      expect(engine.getTemplateForErrorType('build-error')).toBe('build-failure-task');
      expect(engine.getTemplateForErrorType('deployment-error')).toBe('deployment-error-task');
    });

    it('should use fallback for unknown error types', () => {
      expect(engine.getTemplateForErrorType('unknown')).toBe('build-failure-task');
    });
  });
});
