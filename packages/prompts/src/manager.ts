/**
 * Prompt Manager - Main entry point for prompt management
 */

import type {
  PromptManagerConfig,
  PromptDefinition,
  PromptExecutionOptions,
  PromptExecutionResult,
  PromptVersion,
} from './types';
import { PromptRegistry } from './registry';
import { ABTestManager } from './ab-testing';
import { PromptAnalytics } from './analytics';

/**
 * Main Prompt Manager class
 * Orchestrates prompt registration, execution, versioning, and analytics
 */
export class PromptManager {
  private config: PromptManagerConfig;
  private registry: PromptRegistry;
  private abTestManager: ABTestManager;
  private analytics: PromptAnalytics;

  constructor(config: PromptManagerConfig) {
    this.config = config;
    this.registry = new PromptRegistry(config.registry);
    this.abTestManager = new ABTestManager();
    this.analytics = new PromptAnalytics({
      enabled: config.analytics?.enabled ?? true,
      sampleRate: config.analytics?.sampleRate ?? 1.0,
    });
  }

  /**
   * Register a new prompt
   */
  async register(
    id: string,
    config: {
      template: string;
      variables?: string[];
      name?: string;
      description?: string;
      tags?: string[];
      model?: string;
      provider?: string;
      maxTokens?: number;
      temperature?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<PromptDefinition> {
    return this.registry.register(id, {
      ...config,
      model: config.model || this.config.defaultModel,
      provider: config.provider || this.config.defaultProvider,
    });
  }

  /**
   * Get a prompt by ID
   */
  async get(id: string, version?: string): Promise<PromptDefinition | null> {
    return this.registry.get(id, version);
  }

  /**
   * Update a prompt
   */
  async update(
    id: string,
    updates: {
      template?: string;
      variables?: string[];
      description?: string;
      tags?: string[];
      model?: string;
      provider?: string;
      changelog?: string;
    }
  ): Promise<PromptDefinition | null> {
    return this.registry.update(id, updates);
  }

  /**
   * Execute a prompt with variables
   */
  async execute(
    promptId: string,
    options: PromptExecutionOptions
  ): Promise<PromptExecutionResult> {
    const startTime = Date.now();
    const executionId = this.generateExecutionId();

    // Get prompt (check A/B test first)
    let prompt: PromptDefinition | null;
    let abTestInfo: { testId: string; variant: string } | undefined;

    if (options.abTestId) {
      const testResult = await this.abTestManager.selectVariant(
        options.abTestId,
        options.userId
      );
      if (testResult) {
        abTestInfo = {
          testId: options.abTestId,
          variant: testResult.variantId,
        };
        // Use variant template
        prompt = await this.registry.get(promptId);
        if (prompt) {
          prompt = { ...prompt, template: testResult.template };
        }
      } else {
        prompt = await this.registry.get(promptId, options.version);
      }
    } else {
      prompt = await this.registry.get(promptId, options.version);
    }

    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    // Render template
    const renderedPrompt = this.registry.render(prompt.template, options.variables);

    // Call LLM (simplified - would use @rana/core in production)
    const response = await this.callLLM(renderedPrompt, {
      model: options.model || prompt.model || this.config.defaultModel || 'gpt-4o-mini',
      provider: options.provider || prompt.provider || this.config.defaultProvider || 'openai',
      temperature: options.temperature ?? prompt.temperature,
      maxTokens: options.maxTokens ?? prompt.maxTokens,
      stream: options.stream,
    });

    const latencyMs = Date.now() - startTime;

    // Track analytics
    const result: PromptExecutionResult = {
      promptId,
      version: prompt.version,
      response: response.content,
      variables: options.variables,
      renderedPrompt,
      metrics: {
        latencyMs,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        cost: response.cost,
      },
      abTest: abTestInfo,
      executionId,
      timestamp: new Date(),
    };

    // Record analytics
    await this.analytics.record(result);

    // Record A/B test impression
    if (abTestInfo) {
      await this.abTestManager.recordImpression(abTestInfo.testId, abTestInfo.variant);
    }

    return result;
  }

  /**
   * Create an A/B test for a prompt
   */
  async createABTest(
    promptId: string,
    config: {
      name: string;
      variants: Array<{
        name: string;
        template: string;
        traffic?: number;
      }>;
      metric: string;
      trafficSplit?: number[];
      minSampleSize?: number;
      maxDuration?: number;
    }
  ): Promise<string> {
    const prompt = await this.registry.get(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    return this.abTestManager.create(promptId, config);
  }

  /**
   * Start an A/B test
   */
  async startABTest(testId: string): Promise<void> {
    await this.abTestManager.start(testId);
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId: string) {
    return this.abTestManager.getResults(testId);
  }

  /**
   * Record a conversion for A/B testing
   */
  async recordConversion(
    testId: string,
    variantId: string,
    value: number = 1
  ): Promise<void> {
    await this.abTestManager.recordConversion(testId, variantId, value);
  }

  /**
   * Get analytics for a prompt
   */
  async getAnalytics(
    promptId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ) {
    return this.analytics.getPromptAnalytics(promptId, period);
  }

  /**
   * Get usage report
   */
  async getUsageReport() {
    return this.analytics.getUsageReport();
  }

  /**
   * Get version history
   */
  async getVersions(promptId: string): Promise<PromptVersion[]> {
    return this.registry.getVersions(promptId);
  }

  /**
   * Rollback to a previous version
   */
  async rollback(promptId: string, version: string): Promise<PromptDefinition | null> {
    return this.registry.rollback(promptId, version);
  }

  /**
   * List all prompts
   */
  async list(filters?: { tags?: string[]; search?: string }) {
    return this.registry.list(filters);
  }

  /**
   * Delete a prompt
   */
  async delete(promptId: string): Promise<boolean> {
    return this.registry.delete(promptId);
  }

  /**
   * Export all prompts and data
   */
  async export() {
    const registryData = await this.registry.export();
    const analyticsData = await this.analytics.export();
    return {
      workspace: this.config.workspace,
      ...registryData,
      analytics: analyticsData,
      exportedAt: new Date(),
    };
  }

  /**
   * Import prompts and data
   */
  async import(data: {
    prompts: PromptDefinition[];
    versions?: Record<string, PromptVersion[]>;
  }) {
    await this.registry.import(data);
  }

  /**
   * Call LLM (simplified implementation)
   */
  private async callLLM(
    prompt: string,
    config: {
      model: string;
      provider: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<{
    content: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }> {
    // This would integrate with @rana/core in production
    // For now, return a mock response
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = 100;
    const cost = (inputTokens * 0.00001 + outputTokens * 0.00003);

    return {
      content: `[Mock response for: ${prompt.substring(0, 50)}...]`,
      inputTokens,
      outputTokens,
      cost,
    };
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
