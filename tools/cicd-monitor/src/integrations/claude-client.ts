/**
 * Claude API client for AI-powered error analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { getLogger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';
import type { ErrorClassification, AIAnalysis, AgentName } from '../config/types.js';

export class ClaudeService {
  private client: Anthropic;
  private logger = getLogger();
  private model: string;
  private temperature: number;

  constructor(apiKey: string, model: string, temperature: number) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.temperature = temperature;
  }

  /**
   * Analyze error with Claude
   */
  async analyzeError(
    classification: ErrorClassification,
    errorLogs: string,
    filesInvolved: string[]
  ): Promise<AIAnalysis> {
    return withRetry(async () => {
      this.logger.debug('Requesting AI analysis from Claude', {
        errorType: classification.errorType,
        buildId: classification.buildId,
      });

      const prompt = this.buildPrompt(classification, errorLogs, filesInvolved);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const analysis = this.parseResponse(response);

      this.logger.info('AI analysis completed', {
        buildId: classification.buildId,
        confidence: analysis.confidence,
        recommendedAgent: analysis.recommendedAgent,
      });

      return analysis;
    });
  }

  /**
   * Build analysis prompt for Claude
   */
  private buildPrompt(
    classification: ErrorClassification,
    errorLogs: string,
    filesInvolved: string[]
  ): string {
    const filesSection =
      filesInvolved.length > 0
        ? `\n\nAffected Files:\n${filesInvolved.map((f) => `- ${f}`).join('\n')}`
        : '';

    return `You are analyzing a CI/CD build failure for the zabicekiosk project (TypeScript monorepo with Fastify services and React apps).

Build Context:
- Build ID: ${classification.buildId}
- Error Type: ${classification.errorType}
- Failed Step: ${classification.failedStepId}
- Project: ${classification.project || 'unknown'}
- Priority: ${classification.priority}

Error Logs:
\`\`\`
${errorLogs.substring(0, 10000)}
\`\`\`
${filesSection}

Analyze this build failure and provide a JSON response with the following structure:

{
  "rootCause": "A concise 1-2 sentence explanation of what caused the error",
  "affectedComponents": ["component1", "component2"],
  "suggestedFix": "A clear, actionable fix in 3-5 bullet points",
  "riskAssessment": "low" | "medium" | "high",
  "recommendedAgent": "typescript-engineer" | "react-engineer" | "test-engineer" | "devops" | "database-engineer",
  "confidence": 0-100
}

Agent Selection Guidelines:
- typescript-engineer: TypeScript/Node.js services (services/core-api, services/booking-api)
- react-engineer: React apps (web/admin-portal, web/kiosk-pwa, web/parent-web)
- test-engineer: Jest test failures
- devops: Deployment, infrastructure, Cloud Run issues
- database-engineer: Firestore migrations, schema issues

Respond with ONLY the JSON object, no markdown formatting or additional text.`;
  }

  /**
   * Parse Claude response into AIAnalysis
   */
  private parseResponse(response: Anthropic.Message): AIAnalysis {
    try {
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const text = content.text.trim();

      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();

      const parsed = JSON.parse(jsonText);

      // Validate required fields
      if (
        !parsed.rootCause ||
        !parsed.affectedComponents ||
        !parsed.suggestedFix ||
        !parsed.riskAssessment ||
        !parsed.recommendedAgent ||
        typeof parsed.confidence !== 'number'
      ) {
        throw new Error('Invalid response structure from Claude');
      }

      return {
        rootCause: parsed.rootCause,
        affectedComponents: Array.isArray(parsed.affectedComponents)
          ? parsed.affectedComponents
          : [],
        suggestedFix: parsed.suggestedFix,
        riskAssessment: parsed.riskAssessment,
        recommendedAgent: parsed.recommendedAgent as AgentName,
        confidence: Math.min(100, Math.max(0, parsed.confidence)),
      };
    } catch (error) {
      this.logger.error('Failed to parse Claude response', { error, response });

      // Return fallback analysis
      return {
        rootCause: 'Failed to analyze error with AI',
        affectedComponents: [],
        suggestedFix: 'Manual investigation required',
        riskAssessment: 'medium',
        recommendedAgent: 'typescript-engineer',
        confidence: 0,
      };
    }
  }
}
