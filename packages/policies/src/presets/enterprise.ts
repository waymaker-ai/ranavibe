// ---------------------------------------------------------------------------
// Enterprise default preset - combines safety + GDPR-lite + PII protection
// Suitable as a baseline for enterprise deployments
// ---------------------------------------------------------------------------

import type { Policy } from '../types.js';
import { EXTENDED_PII_PATTERNS } from '../rules/pii-rules.js';
import { SAFETY_PROHIBITED_PATTERNS } from '../rules/content-rules.js';

export const enterprisePolicy: Policy = {
  metadata: {
    id: 'enterprise',
    name: 'Enterprise Default',
    version: '1.0.0',
    description:
      'Balanced enterprise policy combining AI safety guardrails, GDPR-style privacy protections, ' +
      'comprehensive PII detection and redaction, cost controls, model governance, and access ' +
      'management. Suitable as a baseline for most enterprise AI deployments.',
    author: 'ranavibe',
    tags: ['enterprise', 'default', 'safety', 'privacy', 'pii', 'governance'],
    framework: 'Enterprise',
  },
  rules: {
    pii: {
      enabled: true,
      action: 'redact',
      patterns: EXTENDED_PII_PATTERNS.map((p) => ({
        ...p,
        description: `Enterprise PII: ${p.description ?? p.name}`,
      })),
    },
    content: {
      enabled: true,
      prohibited: [
        ...SAFETY_PROHIBITED_PATTERNS,
        // Enterprise-specific prohibited content
        {
          name: 'confidential-leak',
          pattern: '(?:(?:CONFIDENTIAL|INTERNAL\\s+ONLY|PROPRIETARY|TRADE\\s+SECRET|RESTRICTED)\\s*(?::|-)\\s*)',
          flags: 'g',
          severity: 'high',
          message: 'Enterprise: Content marked as confidential/internal should not be shared externally',
        },
        {
          name: 'credential-exposure',
          pattern: '(?:(?:api[_\\-\\s]?key|secret[_\\-\\s]?key|access[_\\-\\s]?token|bearer\\s+token|password|private[_\\-\\s]?key)[\\s:=]+[\'"]?[A-Za-z0-9+/=_\\-]{16,})',
          flags: 'gi',
          severity: 'critical',
          message: 'Enterprise: API keys, tokens, or credentials must not be exposed',
        },
        {
          name: 'internal-url',
          pattern: '(?:https?://(?:internal|intranet|staging|dev|localhost|10\\.\\d+\\.\\d+\\.\\d+|192\\.168\\.\\d+\\.\\d+|172\\.(?:1[6-9]|2\\d|3[01])\\.\\d+\\.\\d+)[^\\s]*)',
          flags: 'gi',
          severity: 'medium',
          message: 'Enterprise: Internal URLs and staging endpoints should not be exposed',
        },
        {
          name: 'source-code-leak',
          pattern: '(?:BEGIN\\s+(?:RSA|DSA|EC|OPENSSH)\\s+PRIVATE\\s+KEY)',
          flags: 'g',
          severity: 'critical',
          message: 'Enterprise: Private keys must not be included in AI interactions',
        },
      ],
      required: [
        {
          name: 'ai-disclosure-enterprise',
          pattern: '(?:AI[\\-\\s]?(?:generated|assisted|powered)|generated\\s+(?:by|with|using)\\s+(?:an?\\s+)?AI|language\\s+model)',
          flags: 'gi',
          severity: 'low',
          message: 'Enterprise: AI-generated content should include appropriate disclosure',
        },
      ],
    },
    model: {
      enabled: true,
      allow: ['gpt-4*', 'gpt-4o*', 'o1-*', 'o3-*', 'o4-*', 'claude-*', 'gemini-*'],
      deny: ['gpt-3.5*', 'text-davinci-*'],
      maxContextTokens: 128_000,
    },
    cost: {
      enabled: true,
      maxCostPerRequest: 5.0,
      maxCostPerDay: 200.0,
      maxCostPerMonth: 5000.0,
      maxTokensPerRequest: 128_000,
      maxCompletionTokens: 16_384,
    },
    data: {
      enabled: true,
      allowedCategories: ['aggregated', 'anonymized', 'pseudonymized', 'consented', 'ephemeral'],
      prohibitedCategories: ['biometric-raw', 'genetic-raw', 'special-category-without-consent'],
      retention: {
        maxDays: 365,
        encryptAtRest: true,
        encryptInTransit: true,
      },
      requireAuditLog: true,
      requireConsent: true,
      allowExport: true,
      allowDeletion: true,
      purposes: ['service-delivery', 'support', 'product-improvement', 'compliance'],
    },
    response: {
      enabled: true,
      maxLength: 50_000,
    },
    access: {
      enabled: true,
      requireAuth: true,
      requireMFA: false,
      allowedRoles: ['admin', 'developer', 'analyst', 'manager', 'support'],
      deniedRoles: ['guest'],
      rateLimit: 120,
    },
  },
};
