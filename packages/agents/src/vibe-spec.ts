/**
 * @rana/agents - VibeSpec
 * Declarative agent configuration through "vibes"
 */

import { VibeConfig } from './types';

/**
 * Full VibeSpec configuration (YAML/JSON)
 */
export interface VibeSpec {
  id: string;
  name: string;
  description?: string;

  vibe?: {
    tone?: string;
    constraints?: string[];
    allowedActions?: string[];
    disallowedActions?: string[];
  };

  rag?: {
    kbId: string;
    topK?: number;
    rerank?: boolean;
    filters?: Record<string, any>;
  };

  llm?: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };

  security?: {
    piiRedaction?: boolean;
    promptInjectionDetection?: boolean;
    maxToolCalls?: number;
    auditLogging?: boolean;
  };

  eval?: {
    successCriteria?: string[];
    blockedPatterns?: string[];
  };
}

/**
 * Compiled vibe ready for runtime use
 */
export interface CompiledVibe {
  systemPrompt: string;
  vibeConfig: VibeConfig;
  retrievalConfig?: {
    kbId: string;
    topK: number;
    rerank: boolean;
    filters?: Record<string, any>;
  };
  llmConfig?: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  securityConfig?: {
    piiRedaction: boolean;
    promptInjectionDetection: boolean;
    maxToolCalls: number;
    auditLogging: boolean;
  };
}

/**
 * Compile a VibeSpec or VibeConfig into runtime configuration
 */
export function compileVibe(spec: VibeSpec | VibeConfig): CompiledVibe {
  // Handle simple VibeConfig
  if (!('vibe' in spec) && 'tone' in spec) {
    const vibeConfig = spec as VibeConfig;
    return {
      systemPrompt: buildSystemPrompt(vibeConfig),
      vibeConfig,
    };
  }

  const fullSpec = spec as VibeSpec;
  const constraints = fullSpec.vibe?.constraints ?? [];
  const tone = fullSpec.vibe?.tone ?? 'helpful, concise';

  const vibeConfig: VibeConfig = {
    id: fullSpec.id,
    name: fullSpec.name,
    description: fullSpec.description,
    tone,
    constraints,
    allowedActions: fullSpec.vibe?.allowedActions,
    disallowedActions: fullSpec.vibe?.disallowedActions,
  };

  return {
    systemPrompt: buildSystemPrompt(vibeConfig),
    vibeConfig,
    retrievalConfig: fullSpec.rag
      ? {
          kbId: fullSpec.rag.kbId,
          topK: fullSpec.rag.topK ?? 8,
          rerank: fullSpec.rag.rerank ?? true,
          filters: fullSpec.rag.filters,
        }
      : undefined,
    llmConfig: fullSpec.llm,
    securityConfig: fullSpec.security
      ? {
          piiRedaction: fullSpec.security.piiRedaction ?? false,
          promptInjectionDetection: fullSpec.security.promptInjectionDetection ?? true,
          maxToolCalls: fullSpec.security.maxToolCalls ?? 10,
          auditLogging: fullSpec.security.auditLogging ?? true,
        }
      : undefined,
  };
}

/**
 * Build system prompt from vibe config
 */
function buildSystemPrompt(vibe: VibeConfig): string {
  const parts: string[] = [];

  // Identity
  parts.push(`You are ${vibe.name}.`);

  if (vibe.description) {
    parts.push(vibe.description);
  }

  // Tone
  if (vibe.tone) {
    parts.push(`\nTone: ${vibe.tone}.`);
  }

  // Constraints
  if (vibe.constraints?.length) {
    parts.push(`\nFollow these constraints strictly:`);
    for (const constraint of vibe.constraints) {
      parts.push(`- ${constraint}`);
    }
  }

  // Allowed actions
  if (vibe.allowedActions?.length) {
    parts.push(`\nYou may use these actions: ${vibe.allowedActions.join(', ')}`);
  }

  // Disallowed actions
  if (vibe.disallowedActions?.length) {
    parts.push(
      `\nYou must NEVER use these actions: ${vibe.disallowedActions.join(', ')}`
    );
  }

  return parts.join('\n');
}

/**
 * Load a VibeSpec from a YAML file
 */
export async function loadVibeSpec(path: string): Promise<VibeSpec> {
  const yaml = await import('js-yaml');
  const fs = await import('fs/promises');
  const content = await fs.readFile(path, 'utf-8');
  return yaml.load(content) as VibeSpec;
}

/**
 * Validate a VibeSpec
 */
export function validateVibeSpec(spec: VibeSpec): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!spec.id) {
    errors.push('VibeSpec must have an id');
  }

  if (!spec.name) {
    errors.push('VibeSpec must have a name');
  }

  // Check for conflicting actions
  if (spec.vibe?.allowedActions && spec.vibe?.disallowedActions) {
    const overlap = spec.vibe.allowedActions.filter((a) =>
      spec.vibe!.disallowedActions!.includes(a)
    );
    if (overlap.length > 0) {
      errors.push(
        `Actions cannot be both allowed and disallowed: ${overlap.join(', ')}`
      );
    }
  }

  // Validate security config
  if (spec.security?.maxToolCalls !== undefined && spec.security.maxToolCalls < 1) {
    errors.push('maxToolCalls must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a VibeConfig from a VibeSpec
 */
export function specToConfig(spec: VibeSpec): VibeConfig {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    tone: spec.vibe?.tone,
    constraints: spec.vibe?.constraints,
    allowedActions: spec.vibe?.allowedActions,
    disallowedActions: spec.vibe?.disallowedActions,
  };
}

/**
 * Merge two VibeConfigs (later values override earlier)
 */
export function mergeVibes(base: VibeConfig, override: Partial<VibeConfig>): VibeConfig {
  return {
    id: override.id ?? base.id,
    name: override.name ?? base.name,
    description: override.description ?? base.description,
    tone: override.tone ?? base.tone,
    constraints: [
      ...(base.constraints ?? []),
      ...(override.constraints ?? []),
    ],
    allowedActions: override.allowedActions ?? base.allowedActions,
    disallowedActions: [
      ...(base.disallowedActions ?? []),
      ...(override.disallowedActions ?? []),
    ],
  };
}
