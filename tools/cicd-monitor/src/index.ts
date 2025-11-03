#!/usr/bin/env node
/**
 * CI/CD Monitor CLI
 * Main entry point for the command-line tool
 */

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';

// Load environment variables
dotenv.config();

// Import modules
import { loadConfig, validateEnvironment, validateSecrets, getOptionalEnv } from './config/config.js';
import { createLogger } from './utils/logger.js';
import { CloudBuildService } from './integrations/cloudbuild-client.js';
import { LoggingService } from './integrations/logging-client.js';
import { GitHubService } from './integrations/github-client.js';
import { ClaudeService } from './integrations/claude-client.js';
import { ErrorClassifier } from './analyzer/error-classifier.js';
import { RootCauseAnalyzer } from './analyzer/root-cause-analyzer.js';
import { TaskGenerator } from './task-creator/task-generator.js';

import type { AnalyzeOptions, ListOptions, WatchOptions, TasksOptions } from './config/types.js';

// Initialize
const program = new Command();

program
  .name('zabice-cicd-monitor')
  .description('CI/CD monitoring tool for automatic build failure detection and task generation')
  .version('0.1.0');

// ============================================================
// Command: analyze
// ============================================================
program
  .command('analyze')
  .description('Analyze a specific build and create tasks if it failed')
  .requiredOption('--build-id <id>', 'Cloud Build ID')
  .requiredOption('--project-id <id>', 'GCP Project ID')
  .option('--pr-number <number>', 'GitHub PR number')
  .option('--branch <name>', 'Git branch name')
  .option('--create-tasks', 'Create task files in .backlog/pending/', false)
  .option('--notify', 'Post PR comments', false)
  .option('--dry-run', 'Dry run mode (no commits or comments)', false)
  .option('--provision-resources', 'Provision GCP resources if needed', false)
  .action(async (options: AnalyzeOptions) => {
    const spinner = ora('Analyzing build...').start();

    try {
      // Load config and validate environment
      const config = loadConfig();
      createLogger(config.logging);

      validateEnvironment();

      if (options.createTasks || options.notify) {
        validateSecrets();
      }

      // Initialize services
      const cloudBuild = new CloudBuildService();
      const loggingService = new LoggingService(options.projectId);
      const githubToken = getOptionalEnv('GITHUB_TOKEN', '');
      const anthropicKey = getOptionalEnv('ANTHROPIC_API_KEY', '');

      // Fetch build
      spinner.text = 'Fetching build status...';
      const build = await cloudBuild.getBuild(options.projectId, options.buildId);

      if (build.status === 'SUCCESS') {
        spinner.succeed(chalk.green('Build succeeded - no analysis needed'));
        return;
      }

      if (build.status !== 'FAILURE' && build.status !== 'TIMEOUT') {
        spinner.warn(chalk.yellow(`Build status: ${build.status} - analysis skipped`));
        return;
      }

      // Classify error
      spinner.text = 'Classifying error...';
      const classifier = new ErrorClassifier();
      const classification = classifier.classify(build);

      if (!classification) {
        spinner.fail(chalk.red('Could not classify error'));
        return;
      }

      // Fetch logs
      spinner.text = 'Fetching error logs...';
      const errorLogs = await loggingService.fetchErrorLogs(
        options.projectId,
        options.buildId
      );
      const errorLogsText = loggingService.extractLogText(errorLogs);
      const fullLogsText = loggingService.extractLogText(await loggingService.fetchBuildLogs(options.projectId, options.buildId));

      // Analyze root cause
      spinner.text = 'Analyzing root cause...';
      const claudeService = new ClaudeService(
        anthropicKey,
        config.analysis.ai_model,
        config.analysis.temperature
      );
      const analyzer = new RootCauseAnalyzer(claudeService, config.analysis);
      const analysis = await analyzer.analyze(classification, errorLogsText);

      // Generate task
      if (options.createTasks) {
        spinner.text = 'Generating task...';
        const taskGenerator = new TaskGenerator(config.task_creation);
        const buildUrl = cloudBuild.getBuildUrl(options.projectId, options.buildId);

        // Fetch PR context if available
        let prContext;
        if (options.prNumber && githubToken) {
          const github = new GitHubService(
            githubToken,
            config.repository.owner,
            config.repository.repo
          );
          prContext = await github.getPRContext(parseInt(options.prNumber, 10));
        }

        const task = taskGenerator.generate(
          analysis,
          options.buildId,
          buildUrl,
          errorLogsText,
          fullLogsText,
          prContext
        );

        if (options.dryRun) {
          spinner.info(chalk.blue('DRY RUN - Task generated:'));
          console.log(chalk.gray('─'.repeat(80)));
          console.log(task.content);
          console.log(chalk.gray('─'.repeat(80)));
        } else {
          // Commit task to GitHub
          const github = new GitHubService(
            githubToken,
            config.repository.owner,
            config.repository.repo
          );
          const taskPath = taskGenerator.getTaskFilePath(task.taskId);
          const commitMessage = taskGenerator.formatCommitMessage(
            task.taskId,
            classification.errorType,
            options.buildId
          );

          await github.commitFile(
            taskPath,
            task.content,
            commitMessage,
            config.task_creation.commit.branch
          );

          spinner.succeed(chalk.green(`Task created: ${taskPath}`));

          // Post PR comment
          if (options.notify && prContext) {
            const commentBody = github.formatBuildFailureComment(
              options.buildId,
              buildUrl,
              classification.errorType,
              task.taskId,
              analysis.aiAnalysis.rootCause
            );

            await github.postOrUpdateComment(
              prContext.number,
              commentBody,
              options.buildId
            );
          }
        }
      } else {
        spinner.succeed(chalk.green('Analysis complete'));
        console.log('\n' + chalk.bold('Analysis Results:'));
        console.log(chalk.gray('─'.repeat(80)));
        console.log(chalk.yellow('Error Type:'), classification.errorType);
        console.log(chalk.yellow('Priority:'), classification.priority);
        console.log(chalk.yellow('Agent:'), analysis.aiAnalysis.recommendedAgent);
        console.log(chalk.yellow('Confidence:'), `${analysis.aiAnalysis.confidence}%`);
        console.log(chalk.yellow('Root Cause:'), analysis.aiAnalysis.rootCause);
        console.log(chalk.gray('─'.repeat(80)));
      }
    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// ============================================================
// Command: watch
// ============================================================
program
  .command('watch')
  .description('Watch a build in real-time and analyze on failure')
  .requiredOption('--build-id <id>', 'Cloud Build ID')
  .requiredOption('--project-id <id>', 'GCP Project ID')
  .option('--pr-number <number>', 'GitHub PR number')
  .option('--branch <name>', 'Git branch name')
  .option('--auto-fix-enabled', 'Create tasks automatically on failure', false)
  .option('--notify', 'Post PR comments', false)
  .option('--dry-run', 'Dry run mode (no commits or comments)', false)
  .action(async (options: WatchOptions) => {
    const spinner = ora('Watching build...').start();

    try {
      const config = loadConfig();
      createLogger(config.logging);

      validateEnvironment();

      const cloudBuild = new CloudBuildService();

      // Wait for build to complete
      const build = await cloudBuild.waitForBuild(options.projectId, options.buildId);

      if (build.status === 'SUCCESS') {
        spinner.succeed(chalk.green('Build succeeded'));
        return;
      }

      spinner.warn(chalk.yellow(`Build ${build.status} - analyzing...`));

      // Re-run analyze command with same args
      const args = ['node', 'zabice-cicd-monitor', 'analyze', '--build-id', options.buildId, '--project-id', options.projectId];
      if (options.prNumber) args.push('--pr-number', options.prNumber);
      if (options.branch) args.push('--branch', options.branch);
      if (options.autoFixEnabled) args.push('--create-tasks');
      if (options.notify) args.push('--notify');
      if (options.dryRun) args.push('--dry-run');

      await program.parseAsync(args, { from: 'user' });
    } catch (error) {
      spinner.fail(chalk.red('Watch failed'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// ============================================================
// Command: list
// ============================================================
program
  .command('list')
  .description('List recent builds')
  .requiredOption('--project-id <id>', 'GCP Project ID')
  .option('--status <status>', 'Filter by status (failed/success/working)')
  .option('--last <number>', 'Number of builds to show', '10')
  .action(async (options: ListOptions) => {
    const spinner = ora('Fetching builds...').start();

    try {
      const config = loadConfig();
      createLogger(config.logging);

      validateEnvironment();

      const cloudBuild = new CloudBuildService();

      const filter = options.status ? `status=${options.status.toUpperCase()}` : undefined;

      const builds = await cloudBuild.listBuilds(options.projectId, {
        pageSize: options.last ? parseInt(options.last.toString(), 10) : 10,
        filter,
      });

      spinner.succeed(chalk.green(`Found ${builds.length} builds`));

      console.log('\n' + chalk.bold('Recent Builds:'));
      console.log(chalk.gray('─'.repeat(80)));

      for (const build of builds) {
        const statusColor =
          build.status === 'SUCCESS'
            ? chalk.green
            : build.status === 'FAILURE'
            ? chalk.red
            : chalk.yellow;

        const createTime = build.createTime ? new Date(build.createTime.toString()).toLocaleString() : 'unknown';
        console.log(
          `${statusColor(build.status || 'UNKNOWN')} | ${build.id} | ${build.substitutions?.BRANCH_NAME || 'unknown'} | ${createTime}`
        );
      }

      console.log(chalk.gray('─'.repeat(80)));
    } catch (error) {
      spinner.fail(chalk.red('Failed to list builds'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// ============================================================
// Command: tasks
// ============================================================
program
  .command('tasks')
  .description('Show tasks created for a build')
  .requiredOption('--build-id <id>', 'Cloud Build ID')
  .action(async (options: TasksOptions) => {
    console.log(chalk.yellow('Tasks command not yet implemented'));
    console.log('Build ID:', options.buildId);
    // TODO: Implement task lookup
  });

// Parse arguments
program.parse();
