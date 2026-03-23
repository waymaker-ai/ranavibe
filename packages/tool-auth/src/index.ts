/**
 * @waymakerai/aicofounder-tool-auth - Agent Tool Authorization
 *
 * Controls which tools AI agents can access, with allowlists/denylists,
 * rate limiting, argument validation, role-based access, and audit logging.
 */

import type {
  ToolCall,
  AuthContext,
  AuthorizationResult,
  ArgumentError,
  RateLimitRule,
  ArgumentRule,
  ArgumentValidation,
  RoleDefinition,
  ToolAuditEntry,
  DangerousCategory,
  ToolAuthConfig,
} from './types';

// Re-export types
export type {
  ToolCall,
  AuthContext,
  AuthorizationResult,
  ArgumentError,
  RateLimitRule,
  ArgumentRule,
  ArgumentValidation,
  RoleDefinition,
  ToolAuditEntry,
  DangerousCategory,
  ToolAuthConfig,
} from './types';

// ---------------------------------------------------------------------------
// Dangerous tool detection
// ---------------------------------------------------------------------------

const DEFAULT_DANGEROUS_PATTERNS: Array<{ pattern: string; category: DangerousCategory }> = [
  { pattern: 'file.write', category: 'filesystem_write' },
  { pattern: 'file.delete', category: 'filesystem_write' },
  { pattern: 'file.move', category: 'filesystem_write' },
  { pattern: 'file.create', category: 'filesystem_write' },
  { pattern: 'fs.write*', category: 'filesystem_write' },
  { pattern: 'fs.delete*', category: 'filesystem_write' },
  { pattern: 'fs.unlink*', category: 'filesystem_write' },
  { pattern: 'fs.rm*', category: 'filesystem_write' },
  { pattern: 'file.read', category: 'filesystem_read' },
  { pattern: 'fs.read*', category: 'filesystem_read' },
  { pattern: 'http.*', category: 'network' },
  { pattern: 'fetch.*', category: 'network' },
  { pattern: 'net.*', category: 'network' },
  { pattern: 'request.*', category: 'network' },
  { pattern: 'curl.*', category: 'network' },
  { pattern: 'exec.*', category: 'code_execution' },
  { pattern: 'eval.*', category: 'code_execution' },
  { pattern: 'shell.*', category: 'code_execution' },
  { pattern: 'run.*', category: 'code_execution' },
  { pattern: 'code.execute', category: 'code_execution' },
  { pattern: 'process.*', category: 'system' },
  { pattern: 'system.*', category: 'system' },
  { pattern: 'os.*', category: 'system' },
  { pattern: 'env.*', category: 'system' },
  { pattern: 'db.write', category: 'database_write' },
  { pattern: 'db.insert', category: 'database_write' },
  { pattern: 'db.update', category: 'database_write' },
  { pattern: 'db.delete', category: 'database_write' },
  { pattern: 'sql.execute', category: 'database_write' },
  { pattern: 'db.query', category: 'database_read' },
  { pattern: 'db.read', category: 'database_read' },
  { pattern: 'secret.*', category: 'credentials' },
  { pattern: 'credential.*', category: 'credentials' },
  { pattern: 'token.*', category: 'credentials' },
  { pattern: 'key.*', category: 'credentials' },
  { pattern: 'password.*', category: 'credentials' },
  { pattern: 'auth.*', category: 'credentials' },
];

// ---------------------------------------------------------------------------
// Glob pattern matching
// ---------------------------------------------------------------------------

/**
 * Convert a glob pattern to a regex. Supports * (any chars except .) and ** (any chars including .)
 */
function globToRegex(pattern: string): RegExp {
  let regexStr = '^';

  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];

    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        // ** matches anything including dots
        regexStr += '.*';
        i++; // skip next *
      } else {
        // * matches anything except dots
        regexStr += '[^.]*';
      }
    } else if (ch === '?') {
      regexStr += '[^.]';
    } else if ('.+^${}()|[]\\'.includes(ch)) {
      regexStr += '\\' + ch;
    } else {
      regexStr += ch;
    }
  }

  regexStr += '$';
  return new RegExp(regexStr);
}

/**
 * Check if a tool name matches a glob pattern
 */
function matchesPattern(toolName: string, pattern: string): boolean {
  return globToRegex(pattern).test(toolName);
}

/**
 * Check if a tool name matches any pattern in a list
 */
function matchesAnyPattern(toolName: string, patterns: string[]): string | undefined {
  for (const pattern of patterns) {
    if (matchesPattern(toolName, pattern)) {
      return pattern;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

interface RateWindow {
  calls: number[];
}

class RateLimiter {
  private windows: Map<string, RateWindow> = new Map();

  /**
   * Check and record a call. Returns true if within limits, false if rate limited.
   */
  check(tool: string, rule: RateLimitRule, now: number = Date.now()): { allowed: boolean; remaining: number } {
    const key = `${rule.tool}:${tool}`;
    let window = this.windows.get(key);

    if (!window) {
      window = { calls: [] };
      this.windows.set(key, window);
    }

    // Remove expired entries
    const windowStart = now - rule.windowMs;
    window.calls = window.calls.filter(t => t > windowStart);

    const remaining = rule.maxCalls - window.calls.length;

    if (window.calls.length >= rule.maxCalls) {
      return { allowed: false, remaining: 0 };
    }

    window.calls.push(now);
    return { allowed: true, remaining: remaining - 1 };
  }

  /**
   * Get remaining quota without recording a call
   */
  peek(tool: string, rule: RateLimitRule, now: number = Date.now()): number {
    const key = `${rule.tool}:${tool}`;
    const window = this.windows.get(key);
    if (!window) return rule.maxCalls;

    const windowStart = now - rule.windowMs;
    const activeCalls = window.calls.filter(t => t > windowStart).length;
    return Math.max(0, rule.maxCalls - activeCalls);
  }

  /** Reset all rate limit windows */
  reset(): void {
    this.windows.clear();
  }
}

// ---------------------------------------------------------------------------
// Argument validation
// ---------------------------------------------------------------------------

function validateArgument(
  value: unknown,
  validation: ArgumentValidation,
  argName: string
): ArgumentError | null {
  switch (validation.type) {
    case 'pattern': {
      const strValue = String(value ?? '');
      const regex = new RegExp(validation.regex);
      if (!regex.test(strValue)) {
        return {
          argument: argName,
          message: validation.message ?? `Argument "${argName}" does not match required pattern "${validation.regex}"`,
          value: strValue,
        };
      }
      return null;
    }

    case 'allowedValues': {
      if (!validation.values.includes(value)) {
        return {
          argument: argName,
          message: validation.message ?? `Argument "${argName}" must be one of: ${validation.values.join(', ')}`,
          value,
        };
      }
      return null;
    }

    case 'pathPrefix': {
      const strValue = String(value ?? '');
      const normalized = strValue.replace(/\\/g, '/');
      const matchesPrefix = validation.prefixes.some(prefix =>
        normalized.startsWith(prefix.replace(/\\/g, '/'))
      );
      if (!matchesPrefix) {
        return {
          argument: argName,
          message: validation.message ?? `Argument "${argName}" path must start with one of: ${validation.prefixes.join(', ')}`,
          value: strValue,
        };
      }
      return null;
    }

    case 'maxLength': {
      const strValue = String(value ?? '');
      if (strValue.length > validation.max) {
        return {
          argument: argName,
          message: validation.message ?? `Argument "${argName}" exceeds maximum length of ${validation.max}`,
          value: `(length: ${strValue.length})`,
        };
      }
      return null;
    }

    case 'range': {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return {
          argument: argName,
          message: validation.message ?? `Argument "${argName}" must be a number`,
          value,
        };
      }
      if (validation.min !== undefined && numValue < validation.min) {
        return {
          argument: argName,
          message: validation.message ?? `Argument "${argName}" must be >= ${validation.min}`,
          value: numValue,
        };
      }
      if (validation.max !== undefined && numValue > validation.max) {
        return {
          argument: argName,
          message: validation.message ?? `Argument "${argName}" must be <= ${validation.max}`,
          value: numValue,
        };
      }
      return null;
    }

    case 'custom': {
      if (!validation.validate(value)) {
        return {
          argument: argName,
          message: validation.message ?? `Argument "${argName}" failed custom validation`,
          value,
        };
      }
      return null;
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// ToolAuthorizer
// ---------------------------------------------------------------------------

export class ToolAuthorizer {
  private config: Required<
    Omit<ToolAuthConfig, 'onDenied' | 'onRateLimited' | 'dangerousPatterns'>
  > & {
    onDenied?: (entry: ToolAuditEntry) => void;
    onRateLimited?: (entry: ToolAuditEntry) => void;
    dangerousPatterns: string[];
  };
  private allowedTools: Set<string> = new Set();
  private deniedTools: Set<string> = new Set();
  private rateLimiter: RateLimiter = new RateLimiter();
  private auditLog: ToolAuditEntry[] = [];

  constructor(config: ToolAuthConfig = {}) {
    this.config = {
      defaultPolicy: config.defaultPolicy ?? 'deny',
      allowedTools: config.allowedTools ?? [],
      deniedTools: config.deniedTools ?? [],
      roles: config.roles ?? [],
      rateLimits: config.rateLimits ?? [],
      argumentRules: config.argumentRules ?? [],
      enableAudit: config.enableAudit ?? true,
      maxAuditSize: config.maxAuditSize ?? 10000,
      detectDangerous: config.detectDangerous ?? true,
      dangerousPatterns: config.dangerousPatterns ?? [],
      onDenied: config.onDenied,
      onRateLimited: config.onRateLimited,
    };

    // Initialize allow/deny sets
    for (const tool of this.config.allowedTools) {
      this.allowedTools.add(tool);
    }
    for (const tool of this.config.deniedTools) {
      this.deniedTools.add(tool);
    }
  }

  /**
   * Check if a tool call is authorized
   */
  authorize(toolCall: ToolCall, context?: AuthContext): AuthorizationResult {
    const startTime = Date.now();
    const tool = toolCall.tool;

    // Step 1: Check deny list (explicit denies always win)
    const deniedPattern = this.findMatchingPattern(tool, this.deniedTools);
    if (deniedPattern) {
      const result: AuthorizationResult = {
        authorized: false,
        reason: `Tool "${tool}" is denied by pattern "${deniedPattern}"`,
        matchedRule: `deny:${deniedPattern}`,
        rateLimited: false,
        dangerous: this.isDangerous(tool),
      };
      this.recordAudit(toolCall, context, result, startTime);
      return result;
    }

    // Step 2: Check role-based access
    if (context?.roles && this.config.roles.length > 0) {
      const roleResult = this.checkRoleAccess(tool, context.roles);
      if (roleResult !== null) {
        if (!roleResult.authorized) {
          this.recordAudit(toolCall, context, roleResult, startTime);
          return roleResult;
        }
        // Role explicitly allows — continue to other checks
      }
    }

    // Step 3: Check allow list
    const allowedPattern = this.findMatchingPattern(tool, this.allowedTools);
    if (!allowedPattern && this.allowedTools.size > 0) {
      // If there's an allowlist and the tool isn't on it, deny
      const result: AuthorizationResult = {
        authorized: false,
        reason: `Tool "${tool}" is not in the allowed list`,
        matchedRule: 'allowlist',
        rateLimited: false,
        dangerous: this.isDangerous(tool),
      };
      this.recordAudit(toolCall, context, result, startTime);
      return result;
    }

    // Step 4: Default policy check (if no allowlist defined)
    if (this.allowedTools.size === 0 && this.config.defaultPolicy === 'deny') {
      // Check if any role explicitly allows it
      const hasRoleAllow = context?.roles && this.config.roles.length > 0 &&
        this.checkRoleAccess(tool, context.roles)?.authorized;

      if (!hasRoleAllow) {
        const result: AuthorizationResult = {
          authorized: false,
          reason: `Tool "${tool}" denied by default policy`,
          matchedRule: 'default:deny',
          rateLimited: false,
          dangerous: this.isDangerous(tool),
        };
        this.recordAudit(toolCall, context, result, startTime);
        return result;
      }
    }

    // Step 5: Rate limiting
    const rateLimitResult = this.checkRateLimitInternal(tool, context);
    if (!rateLimitResult.allowed) {
      const result: AuthorizationResult = {
        authorized: false,
        reason: `Tool "${tool}" rate limited: ${rateLimitResult.reason}`,
        matchedRule: `rateLimit:${rateLimitResult.rule}`,
        rateLimited: true,
        dangerous: this.isDangerous(tool),
        remainingQuota: 0,
      };
      this.recordAudit(toolCall, context, result, startTime);
      return result;
    }

    // Step 6: Argument validation
    const argErrors = this.validateArguments(toolCall, context);
    if (argErrors.length > 0) {
      const result: AuthorizationResult = {
        authorized: false,
        reason: `Tool "${tool}" argument validation failed: ${argErrors.map(e => e.message).join('; ')}`,
        matchedRule: 'argumentValidation',
        rateLimited: false,
        dangerous: this.isDangerous(tool),
        argumentErrors: argErrors,
      };
      this.recordAudit(toolCall, context, result, startTime);
      return result;
    }

    // All checks passed
    const result: AuthorizationResult = {
      authorized: true,
      reason: allowedPattern
        ? `Allowed by pattern "${allowedPattern}"`
        : 'Allowed by policy',
      matchedRule: allowedPattern ? `allow:${allowedPattern}` : 'default:allow',
      rateLimited: false,
      dangerous: this.isDangerous(tool),
      remainingQuota: rateLimitResult.remaining,
    };
    this.recordAudit(toolCall, context, result, startTime);
    return result;
  }

  /**
   * Register allowed tools
   */
  allow(tools: string | string[]): void {
    const toolList = Array.isArray(tools) ? tools : [tools];
    for (const tool of toolList) {
      this.allowedTools.add(tool);
    }
  }

  /**
   * Register denied tools
   */
  deny(tools: string | string[]): void {
    const toolList = Array.isArray(tools) ? tools : [tools];
    for (const tool of toolList) {
      this.deniedTools.add(tool);
    }
  }

  /**
   * Check rate limit for a tool (without recording a call)
   */
  checkRateLimit(tool: string): boolean {
    const rules = this.findRateLimitRules(tool);
    if (rules.length === 0) return true;

    for (const rule of rules) {
      const remaining = this.rateLimiter.peek(tool, rule);
      if (remaining <= 0) return false;
    }
    return true;
  }

  /**
   * Get the audit log
   */
  getAuditLog(): ToolAuditEntry[] {
    return [...this.auditLog];
  }

  /**
   * Clear the audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Reset rate limiters
   */
  resetRateLimits(): void {
    this.rateLimiter.reset();
  }

  /**
   * Check if a tool is classified as dangerous
   */
  isDangerous(tool: string): boolean {
    if (!this.config.detectDangerous) return false;

    // Check custom dangerous patterns
    for (const pattern of this.config.dangerousPatterns) {
      if (matchesPattern(tool, pattern)) return true;
    }

    // Check built-in dangerous patterns
    for (const { pattern } of DEFAULT_DANGEROUS_PATTERNS) {
      if (matchesPattern(tool, pattern)) return true;
    }

    return false;
  }

  /**
   * Get the dangerous category for a tool
   */
  getDangerousCategory(tool: string): DangerousCategory | null {
    for (const { pattern, category } of DEFAULT_DANGEROUS_PATTERNS) {
      if (matchesPattern(tool, pattern)) return category;
    }
    return null;
  }

  /**
   * Add a role definition
   */
  addRole(role: RoleDefinition): void {
    const existingIndex = this.config.roles.findIndex(r => r.name === role.name);
    if (existingIndex >= 0) {
      this.config.roles[existingIndex] = role;
    } else {
      this.config.roles.push(role);
    }
  }

  /**
   * Remove a role definition
   */
  removeRole(name: string): void {
    this.config.roles = this.config.roles.filter(r => r.name !== name);
  }

  /**
   * Add a rate limit rule
   */
  addRateLimit(rule: RateLimitRule): void {
    this.config.rateLimits.push(rule);
  }

  /**
   * Add an argument validation rule
   */
  addArgumentRule(rule: ArgumentRule): void {
    this.config.argumentRules.push(rule);
  }

  /**
   * Get audit statistics
   */
  getStats(): {
    totalCalls: number;
    authorizedCalls: number;
    deniedCalls: number;
    rateLimitedCalls: number;
    dangerousCallsAttempted: number;
    callsByTool: Record<string, number>;
  } {
    const stats = {
      totalCalls: this.auditLog.length,
      authorizedCalls: 0,
      deniedCalls: 0,
      rateLimitedCalls: 0,
      dangerousCallsAttempted: 0,
      callsByTool: {} as Record<string, number>,
    };

    for (const entry of this.auditLog) {
      if (entry.result.authorized) stats.authorizedCalls++;
      else stats.deniedCalls++;
      if (entry.result.rateLimited) stats.rateLimitedCalls++;
      if (entry.result.dangerous) stats.dangerousCallsAttempted++;

      const tool = entry.toolCall.tool;
      stats.callsByTool[tool] = (stats.callsByTool[tool] ?? 0) + 1;
    }

    return stats;
  }

  // -----------------------------------------------------------------------
  // Private methods
  // -----------------------------------------------------------------------

  private findMatchingPattern(tool: string, patterns: Set<string>): string | undefined {
    return matchesAnyPattern(tool, Array.from(patterns));
  }

  private checkRoleAccess(
    tool: string,
    roles: string[]
  ): AuthorizationResult | null {
    let anyRoleChecked = false;

    for (const roleName of roles) {
      const roleDef = this.config.roles.find(r => r.name === roleName);
      if (!roleDef) continue;
      anyRoleChecked = true;

      // Check role deny list first
      if (roleDef.deniedTools) {
        const deniedPattern = matchesAnyPattern(tool, roleDef.deniedTools);
        if (deniedPattern) {
          return {
            authorized: false,
            reason: `Tool "${tool}" denied for role "${roleName}" by pattern "${deniedPattern}"`,
            matchedRule: `role:${roleName}:deny:${deniedPattern}`,
            rateLimited: false,
            dangerous: this.isDangerous(tool),
          };
        }
      }

      // Check role allow list
      const allowedPattern = matchesAnyPattern(tool, roleDef.allowedTools);
      if (allowedPattern) {
        return {
          authorized: true,
          reason: `Allowed for role "${roleName}" by pattern "${allowedPattern}"`,
          matchedRule: `role:${roleName}:allow:${allowedPattern}`,
          rateLimited: false,
          dangerous: this.isDangerous(tool),
        };
      }
    }

    if (anyRoleChecked) {
      // Roles were checked but none allowed the tool
      return {
        authorized: false,
        reason: `Tool "${tool}" not allowed for roles: ${roles.join(', ')}`,
        matchedRule: `role:none`,
        rateLimited: false,
        dangerous: this.isDangerous(tool),
      };
    }

    // No matching roles found
    return null;
  }

  private findRateLimitRules(tool: string): RateLimitRule[] {
    return this.config.rateLimits.filter(rule =>
      matchesPattern(tool, rule.tool)
    );
  }

  private checkRateLimitInternal(
    tool: string,
    context?: AuthContext
  ): { allowed: boolean; remaining: number; reason?: string; rule?: string } {
    // Check global rate limits
    const globalRules = this.findRateLimitRules(tool);
    for (const rule of globalRules) {
      const result = this.rateLimiter.check(tool, rule);
      if (!result.allowed) {
        return {
          allowed: false,
          remaining: 0,
          reason: `Exceeded ${rule.maxCalls} calls per ${rule.windowMs}ms`,
          rule: rule.tool,
        };
      }
    }

    // Check role-specific rate limits
    if (context?.roles) {
      for (const roleName of context.roles) {
        const roleDef = this.config.roles.find(r => r.name === roleName);
        if (!roleDef?.rateLimits) continue;

        for (const rule of roleDef.rateLimits) {
          if (matchesPattern(tool, rule.tool)) {
            const result = this.rateLimiter.check(
              `${roleName}:${tool}`,
              rule
            );
            if (!result.allowed) {
              return {
                allowed: false,
                remaining: 0,
                reason: `Role "${roleName}" exceeded ${rule.maxCalls} calls per ${rule.windowMs}ms`,
                rule: `${roleName}:${rule.tool}`,
              };
            }
          }
        }
      }
    }

    // Calculate minimum remaining across all rules
    let minRemaining = Infinity;
    for (const rule of globalRules) {
      const remaining = this.rateLimiter.peek(tool, rule);
      if (remaining < minRemaining) minRemaining = remaining;
    }

    return {
      allowed: true,
      remaining: minRemaining === Infinity ? -1 : minRemaining,
    };
  }

  private validateArguments(
    toolCall: ToolCall,
    context?: AuthContext
  ): ArgumentError[] {
    const errors: ArgumentError[] = [];

    // Check global argument rules
    for (const rule of this.config.argumentRules) {
      if (!matchesPattern(toolCall.tool, rule.tool)) continue;

      const value = toolCall.arguments[rule.argument];
      if (value === undefined) continue; // Argument not present

      const error = validateArgument(value, rule.validation, rule.argument);
      if (error) errors.push(error);
    }

    // Check role-specific argument rules
    if (context?.roles) {
      for (const roleName of context.roles) {
        const roleDef = this.config.roles.find(r => r.name === roleName);
        if (!roleDef?.argumentRules) continue;

        for (const rule of roleDef.argumentRules) {
          if (!matchesPattern(toolCall.tool, rule.tool)) continue;

          const value = toolCall.arguments[rule.argument];
          if (value === undefined) continue;

          const error = validateArgument(value, rule.validation, rule.argument);
          if (error) errors.push(error);
        }
      }
    }

    return errors;
  }

  private recordAudit(
    toolCall: ToolCall,
    context: AuthContext | undefined,
    result: AuthorizationResult,
    startTime: number
  ): void {
    if (!this.config.enableAudit) return;

    const entry: ToolAuditEntry = {
      timestamp: new Date(),
      toolCall,
      context,
      result,
      durationMs: Date.now() - startTime,
    };

    this.auditLog.push(entry);

    // Trim audit log if needed
    if (this.auditLog.length > this.config.maxAuditSize) {
      this.auditLog = this.auditLog.slice(-this.config.maxAuditSize);
    }

    // Fire callbacks
    if (!result.authorized && this.config.onDenied) {
      this.config.onDenied(entry);
    }
    if (result.rateLimited && this.config.onRateLimited) {
      this.config.onRateLimited(entry);
    }
  }
}

/**
 * Create a tool authorizer instance
 */
export function createToolAuthorizer(config?: ToolAuthConfig): ToolAuthorizer {
  return new ToolAuthorizer(config);
}

// Export utilities
export { globToRegex, matchesPattern };
