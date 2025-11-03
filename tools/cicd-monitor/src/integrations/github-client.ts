/**
 * GitHub API client using Octokit
 */

import { Octokit } from 'octokit';
import { Base64 } from 'js-base64';
import { getLogger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';
import type { PRContext } from '../config/types.js';

export class GitHubService {
  private octokit: Octokit;
  private logger = getLogger();
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.owner = owner;
    this.repo = repo;

    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Get PR context (metadata and files changed)
   */
  async getPRContext(prNumber: number): Promise<PRContext> {
    return withRetry(async () => {
      this.logger.debug('Fetching PR context', { prNumber });

      const [prData, files] = await Promise.all([
        this.octokit.rest.pulls.get({
          owner: this.owner,
          repo: this.repo,
          pull_number: prNumber,
        }),
        this.octokit.rest.pulls.listFiles({
          owner: this.owner,
          repo: this.repo,
          pull_number: prNumber,
        }),
      ]);

      const pr = prData.data;

      const context: PRContext = {
        number: pr.number,
        title: pr.title,
        branch: pr.head.ref,
        baseBranch: pr.base.ref,
        author: pr.user?.login || 'unknown',
        filesChanged: files.data.map((f) => f.filename),
        url: pr.html_url,
      };

      this.logger.debug('PR context fetched', {
        prNumber,
        filesChanged: context.filesChanged.length,
      });

      return context;
    });
  }

  /**
   * Post or update comment on PR
   * Uses comment identifier to update existing comment instead of creating duplicate
   */
  async postOrUpdateComment(
    prNumber: number,
    body: string,
    identifier: string
  ): Promise<void> {
    return withRetry(async () => {
      this.logger.debug('Posting/updating PR comment', { prNumber, identifier });

      const commentBody = `<!-- cicd-monitor:${identifier} -->\n${body}`;

      // Find existing comment with this identifier
      const { data: comments } = await this.octokit.rest.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
      });

      const existingComment = comments.find((c) =>
        c.body?.includes(`<!-- cicd-monitor:${identifier} -->`)
      );

      if (existingComment) {
        // Update existing comment
        try {
          await this.octokit.rest.issues.updateComment({
            owner: this.owner,
            repo: this.repo,
            comment_id: existingComment.id,
            body: commentBody,
          });

          this.logger.info('PR comment updated', { prNumber, commentId: existingComment.id });
        } catch (updateError) {
          this.logger.error('Failed to update comment', { updateError });
          throw updateError;
        }
      } else {
        // Create new comment
        const { data: comment } = await this.octokit.rest.issues.createComment({
          owner: this.owner,
          repo: this.repo,
          issue_number: prNumber,
          body: commentBody,
        });

        this.logger.info('PR comment created', { prNumber, commentId: comment.id });
      }
    });
  }

  /**
   * Commit file to repository
   */
  async commitFile(
    filePath: string,
    content: string,
    message: string,
    branch: string
  ): Promise<void> {
    return withRetry(async () => {
      this.logger.debug('Committing file to GitHub', { filePath, branch });

      // Check if file exists
      let sha: string | undefined;
      try {
        const { data: existingFile } = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          ref: branch,
        });

        if ('sha' in existingFile) {
          sha = existingFile.sha;
        }
      } catch {
        // File doesn't exist, that's fine
        this.logger.debug('File does not exist, will create new', { filePath });
      }

      // Create or update file
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message,
        content: Base64.encode(content),
        branch,
        sha,
      });

      this.logger.info('File committed to GitHub', { filePath, branch });
    });
  }

  /**
   * Get repository default branch
   */
  async getDefaultBranch(): Promise<string> {
    return withRetry(async () => {
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      return repo.default_branch;
    });
  }

  /**
   * Format PR comment for build failure
   */
  formatBuildFailureComment(
    buildId: string,
    buildUrl: string,
    errorType: string,
    taskId: string,
    summary: string
  ): string {
    return `## 🚨 Build Failed

**Build ID**: \`${buildId}\`
**Error Type**: \`${errorType}\`
**Task Created**: \`.backlog/pending/${taskId}.md\`

### Summary

${summary}

### Links

- [View Build Logs](${buildUrl})
- [View Task](.backlog/pending/${taskId}.md)

---

*Automatically generated by CI/CD Monitor*
`;
  }
}
