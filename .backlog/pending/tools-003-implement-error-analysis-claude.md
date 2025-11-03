---
id: tools-003
title: Implement error analysis with Claude API
agent: typescript-engineer
priority: high
status: pending
phase: 2-intelligence
created: 2025-11-03
dependencies: [tools-002]
---

# Task: Implement Error Analysis with Claude API

## Context

The cicd-monitor can now fetch build status and logs. This task implements AI-powered error analysis using Claude API to classify errors, extract root causes, and suggest fixes.

**Dependencies**:
- tools-002: Cloud Build and GitHub integrations working

## Requirements

### 1. Claude API Client

Implement `src/integrations/claude-client.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

export interface AnalysisRequest {
  errorType: string;
  stepId: string;
  logs: string;
  sourceCode?: string[];
  filesInvolved?: string[];
}

export interface AnalysisResult {
  rootCause: string;
  affectedComponents: string[];
  suggestedFix: string;
  riskAssessment: string;
  recommendedAgent: string;
  confidence: number;
}

export class ClaudeService {
  private client: Anthropic;
  private model: string;
  private temperature: number;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022', temperature: number = 0.0) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.temperature = temperature;
  }

  /**
   * Analyze build error with AI
   */
  async analyzeError(request: AnalysisRequest): Promise<AnalysisResult> {
    logger.info(`Analyzing ${request.errorType} error with Claude`);

    const prompt = this.buildAnalysisPrompt(request);

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature: this.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    return this.parseAnalysisResponse(responseText);
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(request: AnalysisRequest): string {
    return `You are analyzing a CI/CD build failure. Provide a concise, actionable analysis.

## Error Context

**Error Type**: ${request.errorType}
**Failed Step**: ${request.stepId}

## Error Logs

\`\`\`
${request.logs.substring(0, 10000)}
\`\`\`

${request.filesInvolved ? `## Files Involved\n${request.filesInvolved.join('\n')}` : ''}

${request.sourceCode ? `## Source Code Context\n\`\`\`\n${request.sourceCode.join('\n\n')}\n\`\`\`` : ''}

## Instructions

Analyze the error and provide:

1. **Root Cause** (1-2 sentences): What caused the error?
2. **Affected Components** (list): Which parts of the system are affected?
3. **Suggested Fix** (3-5 bullet points): How to fix it?
4. **Risk Assessment** (low/medium/high): Impact if not fixed
5. **Recommended Agent** (typescript-engineer/react-engineer/test-engineer/devops/database-engineer): Who should fix this?
6. **Confidence** (0-100): How confident are you in this analysis?

Format your response as JSON:

\`\`\`json
{
  "rootCause": "...",
  "affectedComponents": ["...", "..."],
  "suggestedFix": "...",
  "riskAssessment": "...",
  "recommendedAgent": "...",
  "confidence": 85
}
\`\`\``;
  }

  /**
   * Parse Claude's response
   */
  private parseAnalysisResponse(response: string): AnalysisResult {
    try {
      // Extract JSON from markdown code block
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;

      const parsed = JSON.parse(jsonStr);

      return {
        rootCause: parsed.rootCause || 'Unknown',
        affectedComponents: parsed.affectedComponents || [],
        suggestedFix: parsed.suggestedFix || 'No suggestion',
        riskAssessment: parsed.riskAssessment || 'medium',
        recommendedAgent: parsed.recommendedAgent || 'typescript-engineer',
        confidence: parsed.confidence || 50,
      };
    } catch (error) {
      logger.error('Failed to parse Claude response:', error);

      // Fallback: return raw response
      return {
        rootCause: response.substring(0, 200),
        affectedComponents: [],
        suggestedFix: 'Manual analysis required',
        riskAssessment: 'medium',
        recommendedAgent: 'typescript-engineer',
        confidence: 30,
      };
    }
  }

  /**
   * Check if error matches known patterns (skip AI analysis)
   */
  static isKnownPattern(logs: string): { known: boolean; pattern?: string } {
    const patterns = [
      { regex: /ESLint.*error/i, name: 'eslint-error' },
      { regex: /TypeScript.*TS\d+:/i, name: 'typescript-error' },
      { regex: /FAIL.*test/i, name: 'jest-test-failure' },
      { regex: /ERROR.*npm run build/i, name: 'build-error' },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(logs)) {
        return { known: true, pattern: pattern.name };
      }
    }

    return { known: false };
  }
}
```

### 2. Error Classifier

Implement `src/analyzer/error-classifier.ts`:

```typescript
import { logger } from '../utils/logger.js';
import type { BuildStatus, BuildStep } from '../integrations/cloudbuild-client.js';
import type { LogEntry } from '../integrations/logging-client.js';

export interface ErrorClassification {
  errorType: 'lint-error' | 'typecheck-error' | 'test-failure' | 'build-error' | 'deployment-error' | 'migration-error' | 'unknown';
  priority: 'blocker' | 'critical' | 'high' | 'medium' | 'low';
  project: 'core-api' | 'booking-api' | 'admin-portal' | 'kiosk-pwa' | 'parent-web' | 'unknown';
  failedStep: BuildStep;
  errorLogs: string;
}

export class ErrorClassifier {
  /**
   * Classify build failure
   */
  static classify(build: BuildStatus, logs: LogEntry[]): ErrorClassification {
    // Find first failed step
    const failedStep = build.steps.find(step => step.status === 'FAILURE');

    if (!failedStep) {
      logger.warn('No failed step found in build');
      return {
        errorType: 'unknown',
        priority: 'medium',
        project: 'unknown',
        failedStep: build.steps[0],
        errorLogs: 'No failed step found',
      };
    }

    const stepId = failedStep.id;
    const errorType = this.classifyByStepId(stepId);
    const priority = this.assignPriority(errorType);
    const project = this.detectProject(stepId);

    // Extract relevant logs
    const errorLogs = logs
      .filter(log => log.severity === 'ERROR')
      .map(log => log.textPayload || JSON.stringify(log.jsonPayload))
      .join('\n');

    logger.info(`Classified as ${errorType} (priority: ${priority}, project: ${project})`);

    return {
      errorType,
      priority,
      project,
      failedStep,
      errorLogs: errorLogs || 'No error logs found',
    };
  }

  /**
   * Classify error type by Cloud Build step ID
   */
  private static classifyByStepId(stepId: string): ErrorClassification['errorType'] {
    if (stepId.includes('lint')) return 'lint-error';
    if (stepId.includes('typecheck')) return 'typecheck-error';
    if (stepId.includes('test')) return 'test-failure';
    if (stepId.includes('build')) return 'build-error';
    if (stepId.includes('deploy')) return 'deployment-error';
    if (stepId.includes('database') || stepId.includes('migrate')) return 'migration-error';

    return 'unknown';
  }

  /**
   * Assign priority based on error type
   */
  private static assignPriority(errorType: ErrorClassification['errorType']): ErrorClassification['priority'] {
    const priorityMap: Record<string, ErrorClassification['priority']> = {
      'deployment-error': 'blocker',
      'migration-error': 'critical',
      'build-error': 'critical',
      'test-failure': 'high',
      'typecheck-error': 'high',
      'lint-error': 'high',
      'unknown': 'medium',
    };

    return priorityMap[errorType] || 'medium';
  }

  /**
   * Detect project from step ID
   */
  private static detectProject(stepId: string): ErrorClassification['project'] {
    if (stepId.includes('core-api')) return 'core-api';
    if (stepId.includes('booking-api')) return 'booking-api';
    if (stepId.includes('admin-portal')) return 'admin-portal';
    if (stepId.includes('kiosk-pwa')) return 'kiosk-pwa';
    if (stepId.includes('parent-web')) return 'parent-web';

    return 'unknown';
  }
}
```

### 3. Root Cause Analyzer

Implement `src/analyzer/root-cause-analyzer.ts`:

```typescript
import { ClaudeService } from '../integrations/claude-client.js';
import { logger } from '../utils/logger.js';
import type { ErrorClassification } from './error-classifier.js';
import type { Config } from '../config/types.js';

export interface RootCauseAnalysis {
  classification: ErrorClassification;
  aiAnalysis: {
    rootCause: string;
    affectedComponents: string[];
    suggestedFix: string;
    riskAssessment: string;
    recommendedAgent: string;
    confidence: number;
  };
  filesInvolved: string[];
  timestamp: string;
}

export class RootCauseAnalyzer {
  private claude: ClaudeService;
  private config: Config;

  constructor(config: Config) {
    this.claude = new ClaudeService(
      process.env.ANTHROPIC_API_KEY!,
      config.analysis.ai_model,
      config.analysis.temperature
    );
    this.config = config;
  }

  /**
   * Analyze error and determine root cause
   */
  async analyze(classification: ErrorClassification): Promise<RootCauseAnalysis> {
    logger.info(`Starting root cause analysis for ${classification.errorType}`);

    // Check if known pattern (skip AI if configured)
    if (this.config.analysis.skip_known_patterns) {
      const knownPattern = ClaudeService.isKnownPattern(classification.errorLogs);

      if (knownPattern.known) {
        logger.info(`Known pattern detected: ${knownPattern.pattern}, using heuristics`);
        return this.heuristicAnalysis(classification);
      }
    }

    // Extract files involved from logs
    const filesInvolved = this.extractFiles(classification.errorLogs);

    // AI analysis
    const aiAnalysis = await this.claude.analyzeError({
      errorType: classification.errorType,
      stepId: classification.failedStep.id,
      logs: classification.errorLogs,
      filesInvolved,
    });

    return {
      classification,
      aiAnalysis,
      filesInvolved,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Heuristic analysis for known patterns
   */
  private heuristicAnalysis(classification: ErrorClassification): RootCauseAnalysis {
    const heuristics: Record<string, any> = {
      'lint-error': {
        rootCause: 'ESLint rule violations detected in code',
        affectedComponents: [classification.project],
        suggestedFix: 'Run `npm run lint -- --fix` to auto-fix issues, manually fix remaining violations',
        riskAssessment: 'low',
        recommendedAgent: classification.project.includes('web') ? 'react-engineer' : 'typescript-engineer',
        confidence: 90,
      },
      'typecheck-error': {
        rootCause: 'TypeScript type errors in code',
        affectedComponents: [classification.project],
        suggestedFix: 'Fix type errors reported by TypeScript compiler',
        riskAssessment: 'medium',
        recommendedAgent: classification.project.includes('web') ? 'react-engineer' : 'typescript-engineer',
        confidence: 90,
      },
      'test-failure': {
        rootCause: 'Unit or integration tests failing',
        affectedComponents: [classification.project],
        suggestedFix: 'Review test failures and fix underlying issues or update tests',
        riskAssessment: 'high',
        recommendedAgent: 'test-engineer',
        confidence: 80,
      },
    };

    const defaultAnalysis = {
      rootCause: 'Unknown error - manual analysis required',
      affectedComponents: [classification.project],
      suggestedFix: 'Review logs and fix underlying issue',
      riskAssessment: 'medium',
      recommendedAgent: 'typescript-engineer',
      confidence: 50,
    };

    return {
      classification,
      aiAnalysis: heuristics[classification.errorType] || defaultAnalysis,
      filesInvolved: this.extractFiles(classification.errorLogs),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract file paths from error logs
   */
  private extractFiles(logs: string): string[] {
    const fileRegex = /(?:src|test|web|services)\/[\w\-/.]+\.(?:ts|tsx|js|jsx)/g;
    const matches = logs.match(fileRegex) || [];

    // Deduplicate
    return [...new Set(matches)];
  }
}
```

### 4. Update CLI Commands

Update `src/index.ts` to use error analysis:

```typescript
import { ErrorClassifier } from './analyzer/error-classifier.js';
import { RootCauseAnalyzer } from './analyzer/root-cause-analyzer.js';

// Command: watch
.action(async (options) => {
  // ... existing code ...

  if (build.status !== 'SUCCESS') {
    logger.info('Build failed, analyzing...');

    // Classify error
    const classification = ErrorClassifier.classify(build, logs);

    // Root cause analysis
    const analyzer = new RootCauseAnalyzer(config);
    const analysis = await analyzer.analyze(classification);

    logger.info(`Analysis complete:`, {
      errorType: analysis.classification.errorType,
      rootCause: analysis.aiAnalysis.rootCause,
      recommendedAgent: analysis.aiAnalysis.recommendedAgent,
    });

    // TODO: Create task (future task)
  }
});
```

### 5. Tests

```typescript
// test/analyzer/error-classifier.test.ts
import { describe, it, expect } from '@jest/globals';
import { ErrorClassifier } from '../../src/analyzer/error-classifier.js';

describe('ErrorClassifier', () => {
  it('should classify lint errors', () => {
    const build = {
      id: 'test',
      status: 'FAILURE',
      projectId: 'test',
      steps: [
        { id: 'quality-gate-core-api-lint', name: 'lint', status: 'FAILURE' },
      ],
    };

    const classification = ErrorClassifier.classify(build, []);

    expect(classification.errorType).toBe('lint-error');
    expect(classification.project).toBe('core-api');
    expect(classification.priority).toBe('high');
  });
});

// test/integrations/claude-client.test.ts
import { describe, it, expect } from '@jest/globals';
import { ClaudeService } from '../../src/integrations/claude-client.js';

describe('ClaudeService', () => {
  it('should detect known patterns', () => {
    const logs = 'ESLint error: no-unused-vars';
    const result = ClaudeService.isKnownPattern(logs);

    expect(result.known).toBe(true);
    expect(result.pattern).toBe('eslint-error');
  });
});
```

## Acceptance Criteria

BINARY: YES or NO (no partial completion)

- [ ] `ClaudeService` implemented with analyzeError method
- [ ] `ErrorClassifier` implemented with classify method
- [ ] `RootCauseAnalyzer` implemented with analyze method
- [ ] Known pattern detection works (skip AI for common errors)
- [ ] File extraction from logs works
- [ ] CLI `watch` command performs analysis after build failure
- [ ] Quality gates pass:
  ```bash
  npm run lint
  npm run typecheck
  npm run build
  npm test
  ```
- [ ] Manual test with failed build shows analysis results

## Out of Scope

- Task generation → tools-004
- Agent routing logic → tools-004 (uses recommendedAgent from Claude)
- PR comments with analysis (already in tools-002)

## References

- Agent Manifest: `docs/agents/cicd-monitor.md`
- Claude API Docs: https://docs.anthropic.com/claude/reference/messages_post

---

**Agent**: typescript-engineer
**Phase**: 2-intelligence
**Estimated Time**: 3-4 hours
