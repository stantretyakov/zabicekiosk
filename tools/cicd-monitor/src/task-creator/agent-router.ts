/**
 * Route tasks to appropriate specialist agents
 */

import { ErrorClassifier } from '../analyzer/error-classifier.js';
import { getLogger } from '../utils/logger.js';
import type {
  RootCauseAnalysis,
  AgentName,
  TaskCreationConfig,
} from '../config/types.js';

export class AgentRouter {
  private config: TaskCreationConfig;
  private classifier: ErrorClassifier;
  private logger = getLogger();

  constructor(config: TaskCreationConfig) {
    this.config = config;
    this.classifier = new ErrorClassifier();
  }

  /**
   * Route task to appropriate agent
   * Strategy:
   * 1. Use AI recommendation if confidence >= 70%
   * 2. Fall back to config-based routing rules
   */
  route(analysis: RootCauseAnalysis): AgentName {
    const { classification, aiAnalysis } = analysis;

    // Strategy 1: AI recommendation (high confidence)
    if (aiAnalysis.confidence >= 70) {
      this.logger.info('Using AI-recommended agent', {
        agent: aiAnalysis.recommendedAgent,
        confidence: aiAnalysis.confidence,
      });
      return aiAnalysis.recommendedAgent;
    }

    // Strategy 2: Config-based routing
    this.logger.info('Using config-based agent routing', {
      errorType: classification.errorType,
      project: classification.project,
    });

    return this.routeByConfig(classification.errorType, classification.project);
  }

  /**
   * Route based on configuration rules
   */
  private routeByConfig(errorType: string, project?: string): AgentName {
    const routing = this.config.agent_routing[errorType];

    if (!routing) {
      this.logger.warn('No routing rule for error type', { errorType });
      return 'typescript-engineer';
    }

    // Check if routing has project-specific rules
    if ('services' in routing && 'web' in routing) {
      const isService = this.classifier.isService(project);
      const isWeb = this.classifier.isWebApp(project);

      if (isService) {
        return routing.services as AgentName;
      }
      if (isWeb) {
        return routing.web as AgentName;
      }
    }

    // Use default route
    if ('default' in routing) {
      return routing.default as AgentName;
    }

    this.logger.warn('No matching route found', { errorType, project });
    return 'typescript-engineer';
  }

  /**
   * Get agent display name
   */
  getAgentDisplayName(agent: AgentName): string {
    const displayNames: Record<AgentName, string> = {
      'typescript-engineer': 'TypeScript Engineer',
      'react-engineer': 'React Engineer',
      'test-engineer': 'Test Engineer',
      'devops': 'DevOps Engineer',
      'database-engineer': 'Database Engineer',
    };

    return displayNames[agent] || agent;
  }
}
