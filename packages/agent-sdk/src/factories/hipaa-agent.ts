import { createGuardedAgent } from '../guarded-agent.js';
import type { GuardedAgent } from '../types.js';

export interface HIPAAAgentConfig {
  model?: string;
  instructions?: string;
  tools?: unknown[];
  auditPath?: string;
  maxTurns?: number;
}

export function createHIPAAAgent(config: HIPAAAgentConfig = {}): GuardedAgent {
  return createGuardedAgent({
    model: config.model || 'claude-sonnet-4-6',
    instructions: config.instructions || 'You are a HIPAA-compliant medical assistant. Always include medical disclaimers. Never provide specific diagnoses or prescriptions without directing the user to consult a healthcare professional.',
    tools: config.tools,
    maxTurns: config.maxTurns,
    guards: {
      pii: {
        mode: 'block',
        types: ['ssn', 'creditCard', 'medical_record', 'dob', 'address', 'phone'],
        onDetection: 'block',
      },
      injection: { sensitivity: 'high', onDetection: 'block' },
      cost: { budgetLimit: 50, budgetPeriod: 'day', onExceeded: 'block' },
      compliance: { frameworks: ['hipaa'], onViolation: 'block' },
      contentFilter: { categories: ['violence', 'selfHarm', 'hate'], action: 'block' },
      audit: {
        destination: 'file',
        filePath: config.auditPath || './hipaa-audit.log',
        events: ['request', 'response', 'violation', 'cost'],
        tamperProof: true,
        includePayload: false, // Never log PHI
      },
      rateLimit: { maxRequests: 60, windowMs: 60000 },
    },
  });
}
