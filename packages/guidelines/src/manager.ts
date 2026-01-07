/**
 * @rana/guidelines - Guideline Manager
 */

import type {
  Guideline,
  GuidelineContext,
  GuidelineManagerConfig,
  MatchedGuideline,
  MatchOptions,
  ConflictResolution,
  GuidelineAnalytics,
  GuidelineViolation,
  ValidationResult,
} from './types';
import { resolveContent, matchesContext } from './guideline';
import { MemoryStorage } from './storage';

/**
 * GuidelineManager - Central system for managing and applying guidelines
 */
export class GuidelineManager {
  private guidelines: Map<string, Guideline> = new Map();
  private analytics: Map<string, GuidelineAnalytics> = new Map();
  private config: Required<GuidelineManagerConfig>;
  private cache: Map<string, MatchedGuideline[]> = new Map();

  constructor(config: GuidelineManagerConfig = {}) {
    this.config = {
      enableAnalytics: config.enableAnalytics ?? true,
      storage: config.storage ?? new MemoryStorage(),
      defaultEnforcement: config.defaultEnforcement ?? 'advisory',
      maxMatches: config.maxMatches ?? 10,
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL ?? 300, // 5 minutes
      onViolation: config.onViolation ?? (() => {}),
    };

    this.initializeAnalytics();
  }

  /**
   * Add a guideline
   */
  async addGuideline(guideline: Guideline): Promise<void> {
    this.guidelines.set(guideline.id, guideline);

    if (this.config.storage) {
      await this.config.storage.save(guideline);
    }

    if (this.config.enableAnalytics) {
      this.initGuidelineAnalytics(guideline.id);
    }

    // Clear cache when guidelines change
    this.clearCache();
  }

  /**
   * Add multiple guidelines
   */
  async addGuidelines(guidelines: Guideline[]): Promise<void> {
    for (const guideline of guidelines) {
      await this.addGuideline(guideline);
    }
  }

  /**
   * Remove a guideline
   */
  async removeGuideline(id: string): Promise<void> {
    this.guidelines.delete(id);

    if (this.config.storage) {
      await this.config.storage.delete(id);
    }

    this.analytics.delete(id);
    this.clearCache();
  }

  /**
   * Get guideline by ID
   */
  getGuideline(id: string): Guideline | undefined {
    return this.guidelines.get(id);
  }

  /**
   * Get all guidelines
   */
  getAllGuidelines(): Guideline[] {
    return Array.from(this.guidelines.values());
  }

  /**
   * Update guideline
   */
  async updateGuideline(id: string, updates: Partial<Guideline>): Promise<void> {
    const guideline = this.guidelines.get(id);
    if (!guideline) {
      throw new Error(`Guideline ${id} not found`);
    }

    const updated = {
      ...guideline,
      ...updates,
      updatedAt: new Date(),
    };

    this.guidelines.set(id, updated);

    if (this.config.storage) {
      await this.config.storage.update(id, updates);
    }

    this.clearCache();
  }

  /**
   * Match guidelines against context
   */
  async match(
    context: GuidelineContext,
    options: MatchOptions = {}
  ): Promise<MatchedGuideline[]> {
    // Check cache if enabled
    const cacheKey = this.getCacheKey(context, options);
    if (this.config.enableCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const {
      conflictResolution = 'highest-priority',
      includeInactive = false,
      minPriority,
      maxPriority,
      category,
      tags,
    } = options;

    // Filter guidelines
    let candidateGuidelines = Array.from(this.guidelines.values());

    if (!includeInactive) {
      candidateGuidelines = candidateGuidelines.filter(g => g.status === 'active');
    }

    if (category) {
      candidateGuidelines = candidateGuidelines.filter(g => g.category === category);
    }

    if (tags && tags.length > 0) {
      candidateGuidelines = candidateGuidelines.filter(g =>
        g.tags?.some(tag => tags.includes(tag))
      );
    }

    if (minPriority !== undefined) {
      candidateGuidelines = candidateGuidelines.filter(g => g.priority >= minPriority);
    }

    if (maxPriority !== undefined) {
      candidateGuidelines = candidateGuidelines.filter(g => g.priority <= maxPriority);
    }

    // Match guidelines
    const matched: MatchedGuideline[] = [];

    for (const guideline of candidateGuidelines) {
      const matches = await matchesContext(guideline, context);

      if (matches) {
        const resolvedContent = await resolveContent(guideline.content, context);

        matched.push({
          guideline,
          context,
          resolvedContent,
          matchedAt: new Date(),
        });

        // Update analytics
        if (this.config.enableAnalytics) {
          this.updateMatchAnalytics(guideline.id);
        }
      }
    }

    // Apply conflict resolution
    const resolved = this.resolveConflicts(matched, conflictResolution);

    // Limit matches
    const limited = resolved.slice(0, this.config.maxMatches);

    // Cache results
    if (this.config.enableCache) {
      this.cache.set(cacheKey, limited);

      // Auto-expire cache
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.config.cacheTTL * 1000);
    }

    return limited;
  }

  /**
   * Validate response against matched guidelines
   */
  async validate(
    response: string,
    context: GuidelineContext,
    matchedGuidelines?: MatchedGuideline[]
  ): Promise<ValidationResult> {
    // Get matched guidelines if not provided
    const guidelines = matchedGuidelines ?? await this.match(context);

    const violations: GuidelineViolation[] = [];
    let overallAction: 'allow' | 'block' | 'warn' = 'allow';

    // Check each matched guideline
    for (const matched of guidelines) {
      const { guideline } = matched;

      // For now, we'll implement basic validation
      // In a real system, you'd use LLM or rule-based validation
      const isViolation = this.checkViolation(response, matched);

      if (isViolation) {
        const violation: GuidelineViolation = {
          guideline,
          context,
          response,
          reason: `Response appears to violate guideline: ${guideline.name ?? guideline.id}`,
          action: this.getEnforcementAction(guideline.enforcement),
          timestamp: new Date(),
        };

        violations.push(violation);

        // Update analytics
        if (this.config.enableAnalytics) {
          this.updateViolationAnalytics(guideline.id);
        }

        // Trigger violation callback
        await this.config.onViolation(violation);

        // Determine overall action
        if (guideline.enforcement === 'strict') {
          overallAction = 'block';
        } else if (guideline.enforcement === 'advisory' && overallAction !== 'block') {
          overallAction = 'warn';
        }
      }
    }

    return {
      compliant: violations.length === 0,
      matchedGuidelines: guidelines,
      violations,
      action: overallAction,
    };
  }

  /**
   * Get analytics for a guideline
   */
  getAnalytics(id: string): GuidelineAnalytics | undefined {
    return this.analytics.get(id);
  }

  /**
   * Get all analytics
   */
  getAllAnalytics(): Map<string, GuidelineAnalytics> {
    return new Map(this.analytics);
  }

  /**
   * Reset analytics
   */
  resetAnalytics(id?: string): void {
    if (id) {
      this.initGuidelineAnalytics(id);
    } else {
      this.initializeAnalytics();
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Export guidelines (for backup/migration)
   */
  export(): Guideline[] {
    return Array.from(this.guidelines.values());
  }

  /**
   * Import guidelines (for backup/migration)
   */
  async import(guidelines: Guideline[]): Promise<void> {
    for (const guideline of guidelines) {
      await this.addGuideline(guideline);
    }
  }

  // Private methods

  private initializeAnalytics(): void {
    for (const id of this.guidelines.keys()) {
      this.initGuidelineAnalytics(id);
    }
  }

  private initGuidelineAnalytics(id: string): void {
    this.analytics.set(id, {
      matchCount: 0,
      violationCount: 0,
      complianceRate: 1.0,
    });
  }

  private updateMatchAnalytics(id: string): void {
    const stats = this.analytics.get(id);
    if (!stats) return;

    stats.matchCount++;
    stats.lastMatched = new Date();
    this.updateComplianceRate(id, stats);
  }

  private updateViolationAnalytics(id: string): void {
    const stats = this.analytics.get(id);
    if (!stats) return;

    stats.violationCount++;
    stats.lastViolated = new Date();
    this.updateComplianceRate(id, stats);
  }

  private updateComplianceRate(id: string, stats: GuidelineAnalytics): void {
    if (stats.matchCount === 0) {
      stats.complianceRate = 1.0;
    } else {
      stats.complianceRate = 1 - (stats.violationCount / stats.matchCount);
    }
  }

  private resolveConflicts(
    matched: MatchedGuideline[],
    strategy: ConflictResolution
  ): MatchedGuideline[] {
    if (matched.length <= 1) return matched;

    switch (strategy) {
      case 'highest-priority':
        return this.resolveByPriority(matched);

      case 'merge':
        return matched;

      case 'first-match':
        return matched.slice(0, 1);

      default:
        return matched;
    }
  }

  private resolveByPriority(matched: MatchedGuideline[]): MatchedGuideline[] {
    return matched.sort((a, b) => b.guideline.priority - a.guideline.priority);
  }

  private getCacheKey(context: GuidelineContext, options: MatchOptions): string {
    return JSON.stringify({ context, options });
  }

  private getEnforcementAction(enforcement: string): 'blocked' | 'warned' | 'logged' {
    switch (enforcement) {
      case 'strict':
        return 'blocked';
      case 'advisory':
        return 'warned';
      case 'monitored':
        return 'logged';
      default:
        return 'logged';
    }
  }

  private checkViolation(response: string, matched: MatchedGuideline): boolean {
    // Basic implementation - in production, use LLM-based validation
    // For now, we assume responses are compliant unless explicitly checked
    return false;
  }
}

/**
 * Create a guideline manager instance
 */
export function createGuidelineManager(config?: GuidelineManagerConfig): GuidelineManager {
  return new GuidelineManager(config);
}
