import { createGuardedAgent } from '../guarded-agent.js';
import type { GuardedAgent } from '../types.js';

export interface FinancialAgentConfig {
  model?: string;
  instructions?: string;
  tools?: unknown[];
  auditPath?: string;
}

export function createFinancialAgent(config: FinancialAgentConfig = {}): GuardedAgent {
  return createGuardedAgent({
    model: config.model || 'claude-sonnet-4-6',
    instructions: config.instructions || 'You are a financial information assistant. Always include appropriate disclaimers. Never provide specific investment advice. Always recommend consulting a qualified financial advisor. Past performance does not guarantee future results.',
    tools: config.tools,
    guards: {
      pii: { mode: 'redact', types: ['ssn', 'creditCard', 'address'], onDetection: 'redact' },
      injection: { sensitivity: 'high', onDetection: 'block' },
      cost: { budgetLimit: 100, budgetPeriod: 'day', onExceeded: 'warn' },
      compliance: { frameworks: ['sec', 'sox', 'pci'], onViolation: 'block' },
      contentFilter: { categories: ['violence', 'hate', 'spam'], action: 'block' },
      audit: {
        destination: 'file',
        filePath: config.auditPath || './financial-audit.log',
        events: ['request', 'response', 'violation', 'cost'],
        tamperProof: true,
      },
      rateLimit: { maxRequests: 100, windowMs: 60000 },
    },
  });
}
