import { createGuardedAgent } from '../guarded-agent.js';
import type { GuardedAgent } from '../types.js';

export interface GDPRAgentConfig {
  model?: string;
  instructions?: string;
  tools?: unknown[];
  auditPath?: string;
}

export function createGDPRAgent(config: GDPRAgentConfig = {}): GuardedAgent {
  return createGuardedAgent({
    model: config.model || 'claude-sonnet-4-6',
    instructions: config.instructions || 'You are a GDPR-compliant assistant. Minimize data collection. Always inform users about data processing. Respect the right to erasure and data portability. Process data only for the stated purpose.',
    tools: config.tools,
    guards: {
      pii: { mode: 'redact', types: ['email', 'phone', 'ssn', 'address', 'dob', 'ip', 'name'], onDetection: 'redact' },
      injection: { sensitivity: 'high', onDetection: 'block' },
      cost: { budgetLimit: 50, budgetPeriod: 'day', onExceeded: 'warn' },
      compliance: { frameworks: ['gdpr', 'ccpa'], onViolation: 'block' },
      contentFilter: { categories: ['hate', 'violence', 'selfHarm'], action: 'block' },
      audit: {
        destination: 'file',
        filePath: config.auditPath || './gdpr-audit.log',
        events: ['request', 'response', 'violation'],
        tamperProof: true,
        includePayload: false, // GDPR: minimize data logging
      },
      rateLimit: { maxRequests: 60, windowMs: 60000 },
    },
  });
}
