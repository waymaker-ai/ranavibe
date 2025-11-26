/**
 * Prompt Optimizer - Analyze and improve prompt performance
 */

import type {
  PromptDefinition,
  OptimizationSuggestion,
  PromptAnalyticsData,
} from './types';

interface OptimizerConfig {
  costThreshold?: number;
  latencyThreshold?: number;
  minSampleSize?: number;
}

/**
 * Prompt Optimizer
 * Analyzes prompts and provides optimization suggestions
 */
export class PromptOptimizer {
  private config: OptimizerConfig;

  constructor(config: OptimizerConfig = {}) {
    this.config = {
      costThreshold: 0.01, // $0.01 per request
      latencyThreshold: 2000, // 2 seconds
      minSampleSize: 50,
      ...config,
    };
  }

  /**
   * Analyze a prompt and return optimization suggestions
   */
  async analyze(
    prompt: PromptDefinition,
    analytics?: PromptAnalyticsData
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Structural analysis
    suggestions.push(...this.analyzeStructure(prompt));

    // Cost analysis
    if (analytics) {
      suggestions.push(...this.analyzeCost(prompt, analytics));
    }

    // Latency analysis
    if (analytics) {
      suggestions.push(...this.analyzeLatency(prompt, analytics));
    }

    // Quality analysis
    suggestions.push(...this.analyzeQuality(prompt));

    return suggestions.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Analyze prompt structure
   */
  private analyzeStructure(prompt: PromptDefinition): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const template = prompt.template;

    // Check prompt length
    const wordCount = template.split(/\s+/).length;
    if (wordCount > 500) {
      suggestions.push({
        type: 'structure',
        severity: 'medium',
        message: 'Prompt is very long. Consider breaking it into smaller prompts or using a system prompt.',
        currentValue: `${wordCount} words`,
        suggestedValue: '< 300 words',
        estimatedImprovement: '20-40% cost reduction',
      });
    }

    // Check for redundant instructions
    const redundantPatterns = [
      /please\s+make\s+sure/gi,
      /it\s+is\s+important\s+that/gi,
      /you\s+must\s+always/gi,
      /remember\s+to\s+always/gi,
    ];

    for (const pattern of redundantPatterns) {
      if (pattern.test(template)) {
        suggestions.push({
          type: 'structure',
          severity: 'low',
          message: 'Prompt contains potentially redundant emphasis phrases. LLMs respond well to direct instructions.',
          currentValue: template.match(pattern)?.[0],
          suggestedValue: 'Use direct instructions without emphasis',
          estimatedImprovement: '5-10% token reduction',
        });
        break;
      }
    }

    // Check for missing structure
    if (!template.includes('\n') && wordCount > 100) {
      suggestions.push({
        type: 'structure',
        severity: 'low',
        message: 'Long prompt without structure. Consider using sections, bullet points, or numbered steps.',
        estimatedImprovement: 'Improved response quality',
      });
    }

    // Check for role definition
    if (!template.toLowerCase().includes('you are') &&
        !template.toLowerCase().includes('act as') &&
        !template.toLowerCase().includes('your role')) {
      suggestions.push({
        type: 'quality',
        severity: 'medium',
        message: 'No role definition found. Adding a clear role can improve response quality.',
        suggestedValue: 'Add "You are a [role]..." at the start',
        estimatedImprovement: '15-25% quality improvement',
      });
    }

    // Check for output format specification
    if (!template.toLowerCase().includes('format') &&
        !template.toLowerCase().includes('json') &&
        !template.toLowerCase().includes('respond with') &&
        !template.toLowerCase().includes('output')) {
      suggestions.push({
        type: 'quality',
        severity: 'low',
        message: 'No output format specified. Consider defining expected response format.',
        suggestedValue: 'Add output format instructions',
        estimatedImprovement: 'More consistent responses',
      });
    }

    // Check variable usage
    const variablePattern = /\{\{(\w+)\}\}/g;
    const usedVariables = new Set<string>();
    let match;
    while ((match = variablePattern.exec(template)) !== null) {
      usedVariables.add(match[1]);
    }

    const declaredVariables = new Set(prompt.variables);

    // Check for unused declared variables
    for (const variable of declaredVariables) {
      if (!usedVariables.has(variable)) {
        suggestions.push({
          type: 'structure',
          severity: 'medium',
          message: `Declared variable "${variable}" is not used in template.`,
          suggestedValue: 'Remove from variables array or add to template',
        });
      }
    }

    // Check for undeclared used variables
    for (const variable of usedVariables) {
      if (!declaredVariables.has(variable)) {
        suggestions.push({
          type: 'structure',
          severity: 'high',
          message: `Variable "${variable}" used in template but not declared.`,
          suggestedValue: 'Add to variables array',
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze cost efficiency
   */
  private analyzeCost(
    prompt: PromptDefinition,
    analytics: PromptAnalyticsData
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    if (analytics.executions < (this.config.minSampleSize || 50)) {
      return suggestions; // Not enough data
    }

    // Check average cost
    if (analytics.avgCost > (this.config.costThreshold || 0.01)) {
      const currentModel = prompt.model || 'gpt-4o';
      const cheaperModels = this.getSuggestedCheaperModels(currentModel);

      if (cheaperModels.length > 0) {
        suggestions.push({
          type: 'cost',
          severity: 'high',
          message: `Average cost per request ($${analytics.avgCost.toFixed(4)}) exceeds threshold. Consider using a smaller model.`,
          currentValue: currentModel,
          suggestedValue: cheaperModels[0],
          estimatedImprovement: '50-80% cost reduction',
        });
      }
    }

    // Check total cost trend
    if (analytics.totalCost > 10) {
      suggestions.push({
        type: 'cost',
        severity: 'medium',
        message: `High total cost ($${analytics.totalCost.toFixed(2)}) for this period. Review if all calls are necessary.`,
        estimatedImprovement: 'Depends on usage optimization',
      });
    }

    return suggestions;
  }

  /**
   * Analyze latency
   */
  private analyzeLatency(
    prompt: PromptDefinition,
    analytics: PromptAnalyticsData
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    if (analytics.executions < (this.config.minSampleSize || 50)) {
      return suggestions;
    }

    // Check average latency
    if (analytics.avgLatency > (this.config.latencyThreshold || 2000)) {
      suggestions.push({
        type: 'latency',
        severity: 'high',
        message: `Average latency (${analytics.avgLatency.toFixed(0)}ms) is high. Consider using a faster model or reducing prompt length.`,
        currentValue: `${analytics.avgLatency.toFixed(0)}ms`,
        suggestedValue: `< ${this.config.latencyThreshold}ms`,
        estimatedImprovement: '30-60% latency reduction with faster model',
      });
    }

    // Check P95 latency
    if (analytics.p95Latency > (this.config.latencyThreshold || 2000) * 2) {
      suggestions.push({
        type: 'latency',
        severity: 'medium',
        message: `P95 latency (${analytics.p95Latency.toFixed(0)}ms) shows significant variance. Consider implementing caching.`,
        currentValue: `${analytics.p95Latency.toFixed(0)}ms`,
        estimatedImprovement: 'Up to 95% latency reduction for cached requests',
      });
    }

    return suggestions;
  }

  /**
   * Analyze quality factors
   */
  private analyzeQuality(prompt: PromptDefinition): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const template = prompt.template;

    // Check for examples (few-shot)
    if (!template.includes('example') &&
        !template.includes('Example') &&
        !template.includes('e.g.') &&
        !template.includes('for instance')) {
      const wordCount = template.split(/\s+/).length;
      if (wordCount > 50) {
        suggestions.push({
          type: 'quality',
          severity: 'low',
          message: 'Consider adding examples (few-shot prompting) for better results on complex tasks.',
          estimatedImprovement: '10-30% quality improvement',
        });
      }
    }

    // Check for chain-of-thought
    if (!template.toLowerCase().includes('step by step') &&
        !template.toLowerCase().includes('think through') &&
        !template.toLowerCase().includes('reasoning')) {
      suggestions.push({
        type: 'quality',
        severity: 'low',
        message: 'For complex reasoning tasks, consider adding "think step by step" or similar instruction.',
        estimatedImprovement: 'Better reasoning on complex tasks',
      });
    }

    // Check temperature setting
    if (prompt.temperature !== undefined) {
      if (prompt.temperature > 0.9) {
        suggestions.push({
          type: 'quality',
          severity: 'medium',
          message: 'High temperature setting may cause inconsistent outputs.',
          currentValue: prompt.temperature,
          suggestedValue: '0.7-0.8 for creative tasks, 0.1-0.3 for factual tasks',
        });
      } else if (prompt.temperature === 0) {
        suggestions.push({
          type: 'quality',
          severity: 'low',
          message: 'Temperature of 0 makes outputs deterministic but may reduce quality.',
          currentValue: 0,
          suggestedValue: '0.1-0.3 for most use cases',
        });
      }
    }

    return suggestions;
  }

  /**
   * Get suggested cheaper models
   */
  private getSuggestedCheaperModels(currentModel: string): string[] {
    const modelTiers: Record<string, number> = {
      'gpt-4o': 4,
      'gpt-4-turbo': 4,
      'claude-3-opus': 4,
      'gpt-4o-mini': 2,
      'claude-3-5-sonnet': 3,
      'claude-3-sonnet': 3,
      'gemini-1.5-pro': 3,
      'claude-3-haiku': 1,
      'gemini-1.5-flash': 1,
      'gpt-3.5-turbo': 1,
    };

    const currentTier = modelTiers[currentModel] || 3;

    return Object.entries(modelTiers)
      .filter(([_, tier]) => tier < currentTier)
      .sort((a, b) => b[1] - a[1]) // Higher tier first (better quality)
      .map(([model]) => model);
  }

  /**
   * Generate optimized prompt based on suggestions
   */
  async optimize(
    prompt: PromptDefinition,
    suggestions: OptimizationSuggestion[]
  ): Promise<PromptDefinition> {
    let optimized = { ...prompt };
    let template = prompt.template;

    for (const suggestion of suggestions) {
      if (suggestion.autoFix) {
        await suggestion.autoFix();
      }

      // Apply automatic fixes for some suggestions
      if (suggestion.type === 'structure' && suggestion.message.includes('unused declared variable')) {
        const varMatch = suggestion.message.match(/"(\w+)"/);
        if (varMatch) {
          optimized.variables = optimized.variables.filter(v => v !== varMatch[1]);
        }
      }
    }

    optimized.template = template;
    optimized.updatedAt = new Date();

    return optimized;
  }

  /**
   * Compare two prompts
   */
  async compare(
    promptA: PromptDefinition,
    promptB: PromptDefinition,
    analyticsA?: PromptAnalyticsData,
    analyticsB?: PromptAnalyticsData
  ): Promise<{
    winner: 'A' | 'B' | 'tie';
    comparison: {
      metric: string;
      promptA: number | string;
      promptB: number | string;
      better: 'A' | 'B' | 'tie';
    }[];
    recommendation: string;
  }> {
    const comparison: {
      metric: string;
      promptA: number | string;
      promptB: number | string;
      better: 'A' | 'B' | 'tie';
    }[] = [];

    // Compare template length
    const lengthA = promptA.template.split(/\s+/).length;
    const lengthB = promptB.template.split(/\s+/).length;
    comparison.push({
      metric: 'Template length (words)',
      promptA: lengthA,
      promptB: lengthB,
      better: lengthA < lengthB ? 'A' : lengthA > lengthB ? 'B' : 'tie',
    });

    // Compare analytics if available
    if (analyticsA && analyticsB) {
      comparison.push({
        metric: 'Average latency (ms)',
        promptA: analyticsA.avgLatency,
        promptB: analyticsB.avgLatency,
        better: analyticsA.avgLatency < analyticsB.avgLatency ? 'A' :
                analyticsA.avgLatency > analyticsB.avgLatency ? 'B' : 'tie',
      });

      comparison.push({
        metric: 'Average cost ($)',
        promptA: analyticsA.avgCost,
        promptB: analyticsB.avgCost,
        better: analyticsA.avgCost < analyticsB.avgCost ? 'A' :
                analyticsA.avgCost > analyticsB.avgCost ? 'B' : 'tie',
      });

      comparison.push({
        metric: 'Success rate (%)',
        promptA: analyticsA.successRate,
        promptB: analyticsB.successRate,
        better: analyticsA.successRate > analyticsB.successRate ? 'A' :
                analyticsA.successRate < analyticsB.successRate ? 'B' : 'tie',
      });
    }

    // Determine overall winner
    const aWins = comparison.filter(c => c.better === 'A').length;
    const bWins = comparison.filter(c => c.better === 'B').length;
    const winner = aWins > bWins ? 'A' : aWins < bWins ? 'B' : 'tie';

    let recommendation: string;
    if (winner === 'tie') {
      recommendation = 'Both prompts perform similarly. Consider A/B testing for more insights.';
    } else {
      recommendation = `Prompt ${winner} performs better overall. Consider adopting it.`;
    }

    return { winner, comparison, recommendation };
  }
}
