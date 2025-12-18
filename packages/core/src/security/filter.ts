/**
 * Content Filter for RANA Security
 * Filters profanity, harmful content, spam, and custom blocklisted words/phrases
 */

import { RanaError } from '../types';

// ============================================================================
// Types
// ============================================================================

export type FilterAction = 'block' | 'redact' | 'warn' | 'log';

export type FilterCategory =
  | 'profanity'
  | 'violence'
  | 'adult'
  | 'hate'
  | 'self-harm'
  | 'spam'
  | 'custom';

export type FilterSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface FilterViolation {
  /** Category of the violation */
  category: FilterCategory;
  /** The matched word/phrase/pattern */
  match: string;
  /** Position in the content where match was found */
  position?: number;
  /** Severity level of the violation */
  severity: FilterSeverity;
  /** Additional context about the violation */
  context?: string;
}

export interface FilterResult {
  /** Whether the content passed the filter */
  passed: boolean;
  /** Action taken by the filter */
  action_taken: FilterAction;
  /** Filtered/modified content (if redacted) */
  filtered_content: string;
  /** List of violations found */
  violations: FilterViolation[];
  /** Additional metadata */
  metadata?: {
    total_violations: number;
    highest_severity: FilterSeverity;
    categories_triggered: FilterCategory[];
  };
}

export interface FilterPattern {
  /** Pattern to match (string or regex) */
  pattern: string | RegExp;
  /** Category this pattern belongs to */
  category: FilterCategory;
  /** Severity level */
  severity: FilterSeverity;
  /** Whether to match whole words only */
  wholeWord?: boolean;
  /** Case sensitive matching */
  caseSensitive?: boolean;
  /** Replacement text for redaction */
  replacement?: string;
}

export interface ContentFilterConfig {
  /** List of blocked words/phrases/patterns */
  blocklist?: FilterPattern[];
  /** List of allowed exceptions (won't be filtered even if in blocklist) */
  allowlist?: string[];
  /** Default action to take when violations are found */
  defaultAction?: FilterAction;
  /** Severity threshold - only act on violations >= this level */
  severityThreshold?: FilterSeverity;
  /** Category-specific actions */
  categoryActions?: Partial<Record<FilterCategory, FilterAction>>;
  /** Enable built-in profanity filter */
  enableProfanityFilter?: boolean;
  /** Enable built-in harmful content filter */
  enableHarmfulContentFilter?: boolean;
  /** Enable built-in spam filter */
  enableSpamFilter?: boolean;
  /** Redaction placeholder text */
  redactionText?: string;
  /** Maximum content length to filter (for performance) */
  maxContentLength?: number;
  /** Callback when violations are detected */
  onViolation?: (violation: FilterViolation, content: string) => void;
  /** Callback when content is blocked */
  onBlock?: (result: FilterResult) => void;
}

// ============================================================================
// Built-in Pattern Lists
// ============================================================================

const BUILT_IN_PROFANITY: FilterPattern[] = [
  // Common profanity (low severity examples - in production, expand this list)
  { pattern: /\b(damn|hell|crap)\b/i, category: 'profanity', severity: 'low', wholeWord: true },
  { pattern: /\b(ass|bastard)\b/i, category: 'profanity', severity: 'medium', wholeWord: true },
  { pattern: /\b(f[*u]ck|sh[*i]t|b[*i]tch)\b/i, category: 'profanity', severity: 'high', wholeWord: true },
];

const BUILT_IN_VIOLENCE: FilterPattern[] = [
  { pattern: /\b(kill|murder|assault|attack)\s+(you|them|him|her)\b/i, category: 'violence', severity: 'high' },
  { pattern: /\b(how\s+to\s+(kill|murder|harm))\b/i, category: 'violence', severity: 'critical' },
  { pattern: /\b(weapon|gun|knife|bomb)\s+(instructions|tutorial|guide)\b/i, category: 'violence', severity: 'critical' },
];

const BUILT_IN_HATE: FilterPattern[] = [
  { pattern: /\b(hate|despise)\s+(all\s+)?(blacks|whites|jews|muslims|christians|gays|women|men)\b/i, category: 'hate', severity: 'critical' },
  { pattern: /\b(racial|ethnic)\s+slur\b/i, category: 'hate', severity: 'high' },
];

const BUILT_IN_SELF_HARM: FilterPattern[] = [
  { pattern: /\b(how\s+to\s+(commit\s+)?suicide|kill\s+myself)\b/i, category: 'self-harm', severity: 'critical' },
  { pattern: /\b(self\s+harm|cutting|hurt\s+myself)\b/i, category: 'self-harm', severity: 'high' },
];

const BUILT_IN_ADULT: FilterPattern[] = [
  { pattern: /\b(porn|pornography|xxx|explicit\s+content)\b/i, category: 'adult', severity: 'high' },
  { pattern: /\b(sexual|nude|naked)\s+(images|photos|videos)\b/i, category: 'adult', severity: 'medium' },
];

const BUILT_IN_SPAM: FilterPattern[] = [
  { pattern: /\b(click\s+here|buy\s+now|limited\s+offer|act\s+now)\b/i, category: 'spam', severity: 'low' },
];

// ============================================================================
// Content Filter Implementation
// ============================================================================

export class ContentFilter {
  private config: Required<ContentFilterConfig>;
  private patterns: FilterPattern[];
  private allowlistSet: Set<string>;

  constructor(config: ContentFilterConfig = {}) {
    // Set defaults
    this.config = {
      blocklist: config.blocklist || [],
      allowlist: config.allowlist || [],
      defaultAction: config.defaultAction || 'warn',
      severityThreshold: config.severityThreshold || 'low',
      categoryActions: config.categoryActions || {},
      enableProfanityFilter: config.enableProfanityFilter ?? true,
      enableHarmfulContentFilter: config.enableHarmfulContentFilter ?? true,
      enableSpamFilter: config.enableSpamFilter ?? true,
      redactionText: config.redactionText || '[FILTERED]',
      maxContentLength: config.maxContentLength || 100000,
      onViolation: config.onViolation || (() => {}),
      onBlock: config.onBlock || (() => {}),
    };

    // Build pattern list
    this.patterns = this.buildPatternList();

    // Build allowlist set for fast lookups
    this.allowlistSet = new Set(
      this.config.allowlist.map(word => word.toLowerCase())
    );
  }

  /**
   * Build the complete pattern list from config and built-ins
   */
  private buildPatternList(): FilterPattern[] {
    const patterns: FilterPattern[] = [...this.config.blocklist];

    if (this.config.enableProfanityFilter) {
      patterns.push(...BUILT_IN_PROFANITY);
    }

    if (this.config.enableHarmfulContentFilter) {
      patterns.push(...BUILT_IN_VIOLENCE);
      patterns.push(...BUILT_IN_HATE);
      patterns.push(...BUILT_IN_SELF_HARM);
      patterns.push(...BUILT_IN_ADULT);
    }

    if (this.config.enableSpamFilter) {
      patterns.push(...BUILT_IN_SPAM);
    }

    return patterns;
  }

  /**
   * Filter content and return results
   */
  filter(content: string): FilterResult {
    // Validate content length
    if (content.length > this.config.maxContentLength) {
      throw new RanaError(
        `Content exceeds maximum length of ${this.config.maxContentLength} characters`,
        'CONTENT_TOO_LONG'
      );
    }

    // Find all violations
    const violations = this.findViolations(content);

    // Filter out allowlisted matches
    const filteredViolations = violations.filter(
      violation => !this.isAllowlisted(violation.match)
    );

    // Filter by severity threshold
    const severityLevel = this.getSeverityLevel(this.config.severityThreshold);
    const significantViolations = filteredViolations.filter(
      violation => this.getSeverityLevel(violation.severity) >= severityLevel
    );

    // Determine action based on violations
    const action = this.determineAction(significantViolations);

    // Apply action
    const filtered_content = action === 'redact'
      ? this.redactContent(content, significantViolations)
      : content;

    // Build result
    const result: FilterResult = {
      passed: significantViolations.length === 0,
      action_taken: action,
      filtered_content,
      violations: significantViolations,
      metadata: {
        total_violations: significantViolations.length,
        highest_severity: this.getHighestSeverity(significantViolations),
        categories_triggered: Array.from(new Set(significantViolations.map(v => v.category))),
      },
    };

    // Fire callbacks
    if (significantViolations.length > 0) {
      significantViolations.forEach(violation => {
        this.config.onViolation(violation, content);
      });
    }

    if (action === 'block') {
      this.config.onBlock(result);
    }

    return result;
  }

  /**
   * Find all violations in the content
   */
  private findViolations(content: string): FilterViolation[] {
    const violations: FilterViolation[] = [];

    for (const pattern of this.patterns) {
      const matches = this.matchPattern(content, pattern);

      for (const match of matches) {
        violations.push({
          category: pattern.category,
          match: match.text,
          position: match.index,
          severity: pattern.severity,
          context: this.extractContext(content, match.index, 50),
        });
      }
    }

    return violations;
  }

  /**
   * Match a pattern against content
   */
  private matchPattern(
    content: string,
    pattern: FilterPattern
  ): Array<{ text: string; index: number }> {
    const matches: Array<{ text: string; index: number }> = [];

    if (typeof pattern.pattern === 'string') {
      // String pattern
      const searchContent = pattern.caseSensitive ? content : content.toLowerCase();
      const searchPattern = pattern.caseSensitive ? pattern.pattern : pattern.pattern.toLowerCase();

      let index = searchContent.indexOf(searchPattern);
      while (index !== -1) {
        if (!pattern.wholeWord || this.isWholeWord(content, index, searchPattern.length)) {
          matches.push({
            text: content.substring(index, index + searchPattern.length),
            index,
          });
        }
        index = searchContent.indexOf(searchPattern, index + 1);
      }
    } else {
      // RegExp pattern - preserve original flags and ensure 'g' for iteration
      const originalFlags = pattern.pattern.flags;
      const flags = originalFlags.includes('g') ? originalFlags : originalFlags + 'g';
      const regex = new RegExp(pattern.pattern.source, flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        matches.push({
          text: match[0],
          index: match.index,
        });
      }
    }

    return matches;
  }

  /**
   * Check if match is a whole word
   */
  private isWholeWord(content: string, index: number, length: number): boolean {
    const before = index > 0 ? content[index - 1] : ' ';
    const after = index + length < content.length ? content[index + length] : ' ';

    const wordBoundary = /\W/;
    return wordBoundary.test(before) && wordBoundary.test(after);
  }

  /**
   * Extract context around a match
   */
  private extractContext(content: string, index: number, contextLength: number): string {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);

    let context = content.substring(start, end);
    if (start > 0) context = '...' + context;
    if (end < content.length) context = context + '...';

    return context;
  }

  /**
   * Check if a match is allowlisted
   */
  private isAllowlisted(match: string): boolean {
    return this.allowlistSet.has(match.toLowerCase());
  }

  /**
   * Determine what action to take based on violations
   */
  private determineAction(violations: FilterViolation[]): FilterAction {
    if (violations.length === 0) {
      return 'log';
    }

    // Check for critical severity - always block
    if (violations.some(v => v.severity === 'critical')) {
      return 'block';
    }

    // Check for category-specific actions - find most restrictive
    const actionPriority: Record<FilterAction, number> = {
      'log': 0,
      'warn': 1,
      'redact': 2,
      'block': 3,
    };

    let mostRestrictiveAction: FilterAction = this.config.defaultAction;

    for (const violation of violations) {
      const categoryAction = this.config.categoryActions[violation.category];
      if (categoryAction && actionPriority[categoryAction] > actionPriority[mostRestrictiveAction]) {
        mostRestrictiveAction = categoryAction;
      }
    }

    return mostRestrictiveAction;
  }

  /**
   * Redact content by replacing violations
   */
  private redactContent(content: string, violations: FilterViolation[]): string {
    let redacted = content;

    // Sort violations by position (descending) to replace from end to start
    const sortedViolations = [...violations].sort((a, b) =>
      (b.position || 0) - (a.position || 0)
    );

    for (const violation of sortedViolations) {
      if (violation.position !== undefined) {
        const before = redacted.substring(0, violation.position);
        const after = redacted.substring(violation.position + violation.match.length);
        redacted = before + this.config.redactionText + after;
      }
    }

    return redacted;
  }

  /**
   * Get highest severity from violations
   */
  private getHighestSeverity(violations: FilterViolation[]): FilterSeverity {
    if (violations.length === 0) return 'low';

    const severities = violations.map(v => this.getSeverityLevel(v.severity));
    const highest = Math.max(...severities);

    return this.getSeverityName(highest);
  }

  /**
   * Convert severity name to numeric level
   */
  private getSeverityLevel(severity: FilterSeverity): number {
    const levels: Record<FilterSeverity, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    return levels[severity];
  }

  /**
   * Convert numeric level to severity name
   */
  private getSeverityName(level: number): FilterSeverity {
    const names: Record<number, FilterSeverity> = {
      1: 'low',
      2: 'medium',
      3: 'high',
      4: 'critical',
    };
    return names[level] || 'low';
  }

  /**
   * Add a custom pattern to the filter
   */
  addPattern(pattern: FilterPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Add multiple custom patterns
   */
  addPatterns(patterns: FilterPattern[]): void {
    this.patterns.push(...patterns);
  }

  /**
   * Remove patterns by category
   */
  removePatternsByCategory(category: FilterCategory): void {
    this.patterns = this.patterns.filter(p => p.category !== category);
  }

  /**
   * Add word/phrase to allowlist
   */
  addToAllowlist(word: string): void {
    this.allowlistSet.add(word.toLowerCase());
    this.config.allowlist.push(word);
  }

  /**
   * Remove word/phrase from allowlist
   */
  removeFromAllowlist(word: string): void {
    this.allowlistSet.delete(word.toLowerCase());
    this.config.allowlist = this.config.allowlist.filter(
      w => w.toLowerCase() !== word.toLowerCase()
    );
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ContentFilterConfig>): void {
    Object.assign(this.config, updates);

    // Rebuild patterns if relevant config changed
    if (
      updates.enableProfanityFilter !== undefined ||
      updates.enableHarmfulContentFilter !== undefined ||
      updates.enableSpamFilter !== undefined ||
      updates.blocklist !== undefined
    ) {
      this.patterns = this.buildPatternList();
    }

    // Rebuild allowlist if changed
    if (updates.allowlist !== undefined) {
      this.allowlistSet = new Set(
        this.config.allowlist.map(word => word.toLowerCase())
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<ContentFilterConfig> {
    return { ...this.config };
  }

  /**
   * Get statistics about the filter
   */
  getStats(): {
    totalPatterns: number;
    patternsByCategory: Record<FilterCategory, number>;
    allowlistSize: number;
  } {
    const patternsByCategory: Record<string, number> = {};

    for (const pattern of this.patterns) {
      patternsByCategory[pattern.category] = (patternsByCategory[pattern.category] || 0) + 1;
    }

    return {
      totalPatterns: this.patterns.length,
      patternsByCategory: patternsByCategory as Record<FilterCategory, number>,
      allowlistSize: this.allowlistSet.size,
    };
  }

  /**
   * Reset filter to default configuration
   */
  reset(): void {
    this.patterns = this.buildPatternList();
    this.allowlistSet = new Set(
      this.config.allowlist.map(word => word.toLowerCase())
    );
  }
}

// ============================================================================
// Error Types
// ============================================================================

export class ContentFilterError extends RanaError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONTENT_FILTER_ERROR', undefined, undefined, details);
    this.name = 'ContentFilterError';
  }
}

export class ContentBlockedError extends RanaError {
  constructor(
    public violations: FilterViolation[],
    details?: unknown
  ) {
    super(
      `Content blocked due to policy violations: ${violations.map(v => v.category).join(', ')}`,
      'CONTENT_BLOCKED',
      undefined,
      403,
      details
    );
    this.name = 'ContentBlockedError';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a content filter instance
 *
 * @example
 * ```typescript
 * // Basic usage
 * const filter = createContentFilter({
 *   defaultAction: 'redact',
 *   enableProfanityFilter: true,
 * });
 *
 * const result = filter.filter('Some text to filter');
 * if (!result.passed) {
 *   console.log('Violations found:', result.violations);
 *   console.log('Filtered content:', result.filtered_content);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Advanced usage with custom patterns
 * const filter = createContentFilter({
 *   blocklist: [
 *     {
 *       pattern: /\b(confidential|secret)\b/i,
 *       category: 'custom',
 *       severity: 'high',
 *     },
 *   ],
 *   allowlist: ['damn'],
 *   categoryActions: {
 *     violence: 'block',
 *     profanity: 'redact',
 *     spam: 'warn',
 *   },
 *   onViolation: (violation, content) => {
 *     console.log('Violation detected:', violation);
 *   },
 * });
 * ```
 */
export function createContentFilter(config?: ContentFilterConfig): ContentFilter {
  return new ContentFilter(config);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick filter check - returns true if content is safe
 */
export function isContentSafe(content: string, config?: ContentFilterConfig): boolean {
  const filter = createContentFilter(config);
  const result = filter.filter(content);
  return result.passed;
}

/**
 * Filter and throw error if content is blocked
 */
export function assertContentSafe(content: string, config?: ContentFilterConfig): void {
  const filter = createContentFilter({ ...config, defaultAction: 'block' });
  const result = filter.filter(content);

  if (!result.passed && result.action_taken === 'block') {
    throw new ContentBlockedError(result.violations);
  }
}
