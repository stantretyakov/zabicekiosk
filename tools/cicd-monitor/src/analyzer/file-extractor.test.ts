/**
 * Tests for file extraction
 */

import { describe, it, expect } from '@jest/globals';
import { FileExtractor } from './file-extractor.js';

describe('FileExtractor', () => {
  const extractor = new FileExtractor();

  describe('extractFiles', () => {
    it('should extract TypeScript file paths', () => {
      const logs = `
        Error in src/services/api.ts:42:10
        Failed to compile src/utils/helper.ts:15:5
      `;

      const files = extractor.extractFiles(logs);

      expect(files).toContain('src/services/api.ts');
      expect(files).toContain('src/utils/helper.ts');
    });

    it('should extract Jest test files', () => {
      const logs = 'FAIL src/services/api.test.ts';

      const files = extractor.extractFiles(logs);

      expect(files).toContain('src/services/api.test.ts');
    });

    it('should filter out invalid paths', () => {
      const logs = 'Error at http://example.com and @types/node';

      const files = extractor.extractFiles(logs);

      expect(files.length).toBe(0);
    });

    it('should deduplicate files', () => {
      const logs = `
        src/api.ts:1:1
        src/api.ts:2:2
        src/api.ts:3:3
      `;

      const files = extractor.extractFiles(logs);

      expect(files.length).toBe(1);
      expect(files[0]).toBe('src/api.ts');
    });
  });

  describe('filterByProject', () => {
    it('should filter files by project path', () => {
      const files = [
        'services/core-api/src/index.ts',
        'services/booking-api/src/index.ts',
        'web/admin-portal/src/App.tsx',
      ];

      const filtered = extractor.filterByProject(files, 'core-api');

      expect(filtered).toEqual(['services/core-api/src/index.ts']);
    });

    it('should return all files if no project specified', () => {
      const files = ['src/a.ts', 'src/b.ts'];

      const filtered = extractor.filterByProject(files, undefined);

      expect(filtered).toEqual(files);
    });
  });

  describe('limitFiles', () => {
    it('should limit number of files', () => {
      const files = ['a.ts', 'b.ts', 'c.ts', 'd.ts'];

      const limited = extractor.limitFiles(files, 2);

      expect(limited.length).toBe(2);
      expect(limited).toEqual(['a.ts', 'b.ts']);
    });

    it('should return all files if under limit', () => {
      const files = ['a.ts', 'b.ts'];

      const limited = extractor.limitFiles(files, 5);

      expect(limited.length).toBe(2);
    });
  });
});
