import { createGuardedAgent } from '../guarded-agent.js';
import type { GuardedAgent } from '../types.js';

export interface SafeAgentConfig {
  model?: string;
  instructions?: string;
  tools?: unknown[];
}

export function createSafeAgent(config: SafeAgentConfig = {}): GuardedAgent {
  return createGuardedAgent({
    model: config.model || 'claude-sonnet-4-6',
    instructions: config.instructions || 'You are a helpful and safe AI assistant.',
    tools: config.tools,
    guards: {
      pii: { mode: 'redact', onDetection: 'redact' },
      injection: { sensitivity: 'medium', onDetection: 'block' },
      cost: { budgetLimit: 25, budgetPeriod: 'day', onExceeded: 'warn' },
      contentFilter: true,
      audit: { destination: 'console' },
      rateLimit: { maxRequests: 120, windowMs: 60000 },
    },
  });
}
