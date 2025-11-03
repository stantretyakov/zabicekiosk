/**
 * Extract file paths from error logs
 */

import { getLogger } from '../utils/logger.js';

export class FileExtractor {
  private logger = getLogger();

  /**
   * Extract file paths from error logs
   * Looks for common patterns in TypeScript/JavaScript error messages
   */
  extractFiles(logs: string): string[] {
    const files = new Set<string>();

    // Pattern 1: TypeScript errors (src/path/to/file.ts:line:col)
    const tsPattern = /(?:^|\s)([a-zA-Z0-9_/-]+\.(?:ts|tsx|js|jsx))(?::(\d+):(\d+))?/gm;
    let match;

    while ((match = tsPattern.exec(logs)) !== null) {
      const filePath = match[1];
      if (this.isValidFilePath(filePath)) {
        files.add(filePath);
      }
    }

    // Pattern 2: ESLint errors (file path at start of line)
    const eslintPattern = /^\s*([a-zA-Z0-9_/-]+\.(?:ts|tsx|js|jsx))/gm;

    while ((match = eslintPattern.exec(logs)) !== null) {
      const filePath = match[1];
      if (this.isValidFilePath(filePath)) {
        files.add(filePath);
      }
    }

    // Pattern 3: Jest test files (FAIL src/path/to/file.test.ts)
    const jestPattern = /FAIL\s+([a-zA-Z0-9_/-]+\.(?:test|spec)\.(?:ts|tsx|js|jsx))/g;

    while ((match = jestPattern.exec(logs)) !== null) {
      const filePath = match[1];
      if (this.isValidFilePath(filePath)) {
        files.add(filePath);
      }
    }

    // Pattern 4: Import/require errors
    const importPattern = /(?:import|require).*from\s+['"]([^'"]+)['"]/g;

    while ((match = importPattern.exec(logs)) !== null) {
      const filePath = match[1];
      if (filePath.startsWith('.') || filePath.startsWith('/')) {
        const normalized = filePath.replace(/^\.\//, '');
        if (this.isValidFilePath(normalized)) {
          files.add(normalized);
        }
      }
    }

    const filesArray = Array.from(files).sort();

    this.logger.debug('Extracted files from logs', { count: filesArray.length });

    return filesArray;
  }

  /**
   * Validate if path looks like a real file
   */
  private isValidFilePath(path: string): boolean {
    // Filter out obvious non-files
    if (path.length < 3) return false;
    if (path.startsWith('http')) return false;
    if (path.startsWith('@')) return false; // npm packages
    if (path.includes(' ')) return false;
    if (!path.includes('/') && !path.includes('.')) return false;

    // Must have valid extension
    const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml'];
    return validExtensions.some((ext) => path.endsWith(ext));
  }

  /**
   * Filter files by project
   */
  filterByProject(files: string[], project?: string): string[] {
    if (!project) return files;

    const projectPaths: Record<string, string[]> = {
      'core-api': ['services/core-api'],
      'booking-api': ['services/booking-api'],
      'admin-portal': ['web/admin-portal'],
      'kiosk-pwa': ['web/kiosk-pwa'],
      'parent-web': ['web/parent-web'],
    };

    const paths = projectPaths[project] || [];
    if (paths.length === 0) return files;

    return files.filter((file) => paths.some((path) => file.startsWith(path)));
  }

  /**
   * Limit number of files
   */
  limitFiles(files: string[], maxFiles: number): string[] {
    if (files.length <= maxFiles) {
      return files;
    }

    this.logger.debug('Limiting files', { total: files.length, limit: maxFiles });

    return files.slice(0, maxFiles);
  }
}
