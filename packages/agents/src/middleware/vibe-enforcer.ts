/**
 * VibeSpec Runtime Enforcer
 * Middleware that enforces VibeSpec constraints on agent actions
 */

import type { VibeConfig } from '../types';

export interface EnforcerContext {
  /** Current user message */
  userMessage: string;
  /** Agent's proposed response */
  agentResponse?: string;
  /** Tool being called */
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  /** Conversation history */
  history?: Array<{ role: string; content: string }>;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface EnforcementResult {
  /** Whether the action is allowed */
  allowed: boolean;
  /** Reason for blocking (if not allowed) */
  reason?: string;
  /** Violated constraint */
  violatedConstraint?: string;
  /** Modified content (if sanitization was applied) */
  modified?: string;
  /** Warnings (action allowed but flagged) */
  warnings?: string[];
}

export interface EnforcerConfig {
  /** VibeSpec configuration */
  vibeConfig: VibeConfig;
  /** Strict mode - block on any violation */
  strictMode?: boolean;
  /** Log violations */
  logViolations?: boolean;
  /** Custom violation handler */
  onViolation?: (result: EnforcementResult, context: EnforcerContext) => void;
}

/**
 * VibeSpec Enforcer class
 * Validates agent actions against VibeSpec constraints
 */
export class VibeEnforcer {
  private config: EnforcerConfig;
  private allowedActions: Set<string>;
  private disallowedActions: Set<string>;
  private disallowedTopics: RegExp[];
  private tonePatterns: Map<string, RegExp[]>;

  constructor(config: EnforcerConfig) {
    this.config = {
      strictMode: true,
      logViolations: true,
      ...config,
    };

    // Build action sets for O(1) lookup
    this.allowedActions = new Set(this.config.vibeConfig.allowedActions || []);
    this.disallowedActions = new Set(this.config.vibeConfig.disallowedActions || []);

    // Build topic patterns
    this.disallowedTopics = (this.config.vibeConfig.constraints || [])
      .filter((c) => c.startsWith('topic:'))
      .map((c) => {
        const topic = c.replace('topic:', '').trim();
        return new RegExp(`\\b${this.escapeRegex(topic)}\\b`, 'gi');
      });

    // Build tone patterns
    this.tonePatterns = new Map();
    this.buildTonePatterns();
  }

  /**
   * Enforce constraints on user input
   */
  enforceInput(context: EnforcerContext): EnforcementResult {
    const warnings: string[] = [];

    // Check for disallowed topics in user message
    for (const pattern of this.disallowedTopics) {
      if (pattern.test(context.userMessage)) {
        return {
          allowed: false,
          reason: 'User message contains disallowed topic',
          violatedConstraint: `Disallowed topic: ${pattern.source}`,
        };
      }
    }

    // Check message length constraints
    const maxLength = this.getConstraintValue('max_input_length');
    if (maxLength && context.userMessage.length > maxLength) {
      return {
        allowed: false,
        reason: `Message exceeds maximum length (${maxLength} chars)`,
        violatedConstraint: 'max_input_length',
      };
    }

    return { allowed: true, warnings };
  }

  /**
   * Enforce constraints on agent response
   */
  enforceOutput(context: EnforcerContext): EnforcementResult {
    if (!context.agentResponse) {
      return { allowed: true };
    }

    const warnings: string[] = [];
    let modified = context.agentResponse;

    // Check for disallowed content in response
    for (const pattern of this.disallowedTopics) {
      if (pattern.test(modified)) {
        if (this.config.strictMode) {
          return {
            allowed: false,
            reason: 'Response contains disallowed topic',
            violatedConstraint: `Disallowed topic: ${pattern.source}`,
          };
        } else {
          warnings.push(`Response mentions disallowed topic: ${pattern.source}`);
        }
      }
    }

    // Check tone constraints
    const toneResult = this.checkTone(modified);
    if (!toneResult.valid) {
      if (this.config.strictMode) {
        return {
          allowed: false,
          reason: toneResult.reason,
          violatedConstraint: 'tone',
        };
      } else {
        warnings.push(toneResult.reason || 'Tone violation');
      }
    }

    // Check response length
    const maxLength = this.getConstraintValue('max_output_length');
    if (maxLength && modified.length > maxLength) {
      if (this.config.strictMode) {
        return {
          allowed: false,
          reason: `Response exceeds maximum length (${maxLength} chars)`,
          violatedConstraint: 'max_output_length',
        };
      } else {
        // Truncate with warning
        modified = modified.slice(0, maxLength) + '...';
        warnings.push('Response truncated due to length limit');
      }
    }

    // Check for required elements
    const requiredElements = this.config.vibeConfig.constraints?.filter((c) =>
      c.startsWith('require:')
    );
    for (const req of requiredElements || []) {
      const element = req.replace('require:', '').trim();
      if (!this.checkRequired(modified, element)) {
        warnings.push(`Missing required element: ${element}`);
      }
    }

    return {
      allowed: true,
      modified: modified !== context.agentResponse ? modified : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Enforce constraints on tool calls
   */
  enforceToolCall(context: EnforcerContext): EnforcementResult {
    if (!context.toolCall) {
      return { allowed: true };
    }

    const toolName = context.toolCall.name;

    // Check if tool is explicitly disallowed
    if (this.disallowedActions.has(toolName)) {
      return {
        allowed: false,
        reason: `Tool '${toolName}' is not allowed`,
        violatedConstraint: `disallowed:${toolName}`,
      };
    }

    // Check if tool is explicitly disallowed by pattern
    for (const action of this.disallowedActions) {
      if (action.includes('*')) {
        const pattern = new RegExp(
          '^' + action.replace(/\*/g, '.*') + '$'
        );
        if (pattern.test(toolName)) {
          return {
            allowed: false,
            reason: `Tool '${toolName}' matches disallowed pattern '${action}'`,
            violatedConstraint: `disallowed:${action}`,
          };
        }
      }
    }

    // If allowlist exists, check if tool is allowed
    if (this.allowedActions.size > 0) {
      let isAllowed = this.allowedActions.has(toolName);

      // Check patterns
      if (!isAllowed) {
        for (const action of this.allowedActions) {
          if (action.includes('*')) {
            const pattern = new RegExp(
              '^' + action.replace(/\*/g, '.*') + '$'
            );
            if (pattern.test(toolName)) {
              isAllowed = true;
              break;
            }
          }
        }
      }

      if (!isAllowed) {
        return {
          allowed: false,
          reason: `Tool '${toolName}' is not in allowed list`,
          violatedConstraint: 'allowed_tools',
        };
      }
    }

    // Check tool argument constraints
    const argConstraints = this.getToolConstraints(toolName);
    for (const constraint of argConstraints) {
      const result = this.checkToolArgConstraint(
        context.toolCall.arguments,
        constraint
      );
      if (!result.valid) {
        return {
          allowed: false,
          reason: result.reason,
          violatedConstraint: constraint,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Full enforcement pipeline
   */
  enforce(context: EnforcerContext): EnforcementResult {
    // 1. Check input
    const inputResult = this.enforceInput(context);
    if (!inputResult.allowed) {
      this.handleViolation(inputResult, context);
      return inputResult;
    }

    // 2. Check tool call if present
    if (context.toolCall) {
      const toolResult = this.enforceToolCall(context);
      if (!toolResult.allowed) {
        this.handleViolation(toolResult, context);
        return toolResult;
      }
    }

    // 3. Check output if present
    if (context.agentResponse) {
      const outputResult = this.enforceOutput(context);
      if (!outputResult.allowed) {
        this.handleViolation(outputResult, context);
        return outputResult;
      }
      return outputResult;
    }

    return { allowed: true };
  }

  /**
   * Create middleware function for agent
   */
  middleware() {
    return async (
      context: EnforcerContext,
      next: () => Promise<EnforcerContext>
    ): Promise<EnforcerContext> => {
      // Pre-check input
      const inputResult = this.enforceInput(context);
      if (!inputResult.allowed) {
        throw new VibeViolationError(inputResult);
      }

      // Execute next
      const result = await next();

      // Post-check output
      const outputResult = this.enforce(result);
      if (!outputResult.allowed) {
        throw new VibeViolationError(outputResult);
      }

      // Apply modifications if any
      if (outputResult.modified && result.agentResponse) {
        result.agentResponse = outputResult.modified;
      }

      return result;
    };
  }

  // Helper methods

  private buildTonePatterns(): void {
    const tone = this.config.vibeConfig.tone;
    if (!tone) return;

    // Patterns for detecting inappropriate tones
    if (tone === 'professional') {
      this.tonePatterns.set('informal', [
        /\b(lol|lmao|omg|wtf|btw|tbh|idk|ngl)\b/gi,
        /[!]{2,}/g, // Multiple exclamation marks
        /\b(awesome|cool|dude|bro|yo)\b/gi,
      ]);
    }

    if (tone === 'friendly') {
      this.tonePatterns.set('harsh', [
        /\b(wrong|incorrect|no|never|impossible)\b/gi,
        /\b(must|should|have to|need to)\b/gi,
      ]);
    }

    if (tone === 'concise') {
      this.tonePatterns.set('verbose', [
        // Flag long sentences
        /[^.!?]{200,}[.!?]/g,
      ]);
    }
  }

  private checkTone(text: string): { valid: boolean; reason?: string } {
    for (const [type, patterns] of this.tonePatterns) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(text)) {
          return {
            valid: false,
            reason: `Response contains ${type} tone, expected ${this.config.vibeConfig.tone}`,
          };
        }
      }
    }
    return { valid: true };
  }

  private checkRequired(text: string, element: string): boolean {
    switch (element) {
      case 'greeting':
        return /^(hi|hello|hey|good|greetings)/i.test(text.trim());
      case 'sign_off':
        return /(thanks|thank you|regards|best|cheers|sincerely)$/i.test(text.trim());
      case 'citation':
        return /\[[\d,\s]+\]|\([\d,\s]+\)|source:/i.test(text);
      case 'disclaimer':
        return /disclaimer|note:|important:|warning:/i.test(text);
      default:
        return text.toLowerCase().includes(element.toLowerCase());
    }
  }

  private getConstraintValue(name: string): number | null {
    const constraint = this.config.vibeConfig.constraints?.find((c) =>
      c.startsWith(`${name}:`)
    );
    if (constraint) {
      const value = constraint.split(':')[1];
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private getToolConstraints(toolName: string): string[] {
    return (
      this.config.vibeConfig.constraints?.filter(
        (c) => c.startsWith(`tool:${toolName}:`) || c.startsWith('tool:*:')
      ) || []
    );
  }

  private checkToolArgConstraint(
    args: Record<string, unknown>,
    constraint: string
  ): { valid: boolean; reason?: string } {
    // Parse constraint like "tool:http:url:!localhost"
    const parts = constraint.split(':');
    if (parts.length < 4) return { valid: true };

    const argName = parts[2];
    const condition = parts[3];
    const argValue = args[argName];

    if (condition.startsWith('!')) {
      // Negative constraint
      const forbidden = condition.slice(1);
      if (String(argValue).includes(forbidden)) {
        return {
          valid: false,
          reason: `Tool argument '${argName}' contains forbidden value '${forbidden}'`,
        };
      }
    } else if (condition.startsWith('max:')) {
      // Max value constraint
      const max = parseInt(condition.slice(4), 10);
      if (typeof argValue === 'number' && argValue > max) {
        return {
          valid: false,
          reason: `Tool argument '${argName}' exceeds maximum (${max})`,
        };
      }
    }

    return { valid: true };
  }

  private handleViolation(result: EnforcementResult, context: EnforcerContext): void {
    if (this.config.logViolations) {
      console.warn('[VibeEnforcer] Violation:', result.reason, result.violatedConstraint);
    }

    if (this.config.onViolation) {
      this.config.onViolation(result, context);
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Error class for vibe violations
 */
export class VibeViolationError extends Error {
  public result: EnforcementResult;

  constructor(result: EnforcementResult) {
    super(result.reason || 'VibeSpec violation');
    this.name = 'VibeViolationError';
    this.result = result;
  }
}

/**
 * Create a vibe enforcer
 */
export function createVibeEnforcer(config: EnforcerConfig): VibeEnforcer {
  return new VibeEnforcer(config);
}

/**
 * Quick enforcement check
 */
export function enforceVibe(
  vibeConfig: VibeConfig,
  context: EnforcerContext
): EnforcementResult {
  return new VibeEnforcer({ vibeConfig }).enforce(context);
}
