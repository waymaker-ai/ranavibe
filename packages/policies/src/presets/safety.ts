// ---------------------------------------------------------------------------
// AI Safety preset - Responsible AI guardrails
// No harmful content, suicide prevention, child safety, misinformation
// ---------------------------------------------------------------------------

import type { Policy } from '../types.js';
import { SAFETY_PROHIBITED_PATTERNS } from '../rules/content-rules.js';
import { CORE_PII_PATTERNS } from '../rules/pii-rules.js';

export const safetyPolicy: Policy = {
  metadata: {
    id: 'safety',
    name: 'AI Safety',
    version: '1.0.0',
    description:
      'Comprehensive AI safety policy covering harmful content prevention, suicide/self-harm ' +
      'intervention, child safety (CSAM/grooming), misinformation, prompt injection defense, ' +
      'hate speech, violence, and responsible AI output standards.',
    author: 'ranavibe',
    tags: ['safety', 'ai-safety', 'responsible-ai', 'guardrails', 'content-moderation'],
    framework: 'AI-Safety',
  },
  rules: {
    pii: {
      enabled: true,
      action: 'redact',
      patterns: CORE_PII_PATTERNS.map((p) => ({
        ...p,
        action: 'redact' as const,
        description: `AI Safety: ${p.description ?? p.name}`,
      })),
    },
    content: {
      enabled: true,
      prohibited: [
        ...SAFETY_PROHIBITED_PATTERNS,
        // Weapons of mass destruction
        {
          name: 'wmd-instructions',
          pattern: '(?:how\\s+to\\s+(?:build|make|create|assemble|enrich)\\s+(?:a\\s+)?(?:nuclear|biological|chemical|radiological)\\s+(?:weapon|bomb|agent|device))',
          flags: 'gi',
          severity: 'critical',
          message: 'AI Safety: Instructions for weapons of mass destruction are prohibited',
        },
        // Grooming / predatory behavior
        {
          name: 'grooming',
          pattern: '(?:(?:meet|see|visit)\\s+(?:me|us)\\s+(?:alone|in\\s+(?:secret|private))|don\'t\\s+tell\\s+(?:your\\s+)?(?:parents?|mom|dad|teacher|anyone))',
          flags: 'gi',
          severity: 'critical',
          message: 'AI Safety: Content suggesting predatory/grooming behavior toward minors',
        },
        // Deepfake instructions
        {
          name: 'deepfake-instructions',
          pattern: '(?:how\\s+to\\s+(?:create|make|generate)\\s+(?:a\\s+)?(?:deepfake|fake\\s+(?:video|image|audio|voice))\\s+(?:of|depicting|showing))',
          flags: 'gi',
          severity: 'high',
          message: 'AI Safety: Instructions for creating non-consensual deepfakes',
        },
        // Stalking / harassment instructions
        {
          name: 'stalking-instructions',
          pattern: '(?:how\\s+to\\s+(?:stalk|track|follow|monitor|spy\\s+on|surveil)\\s+(?:someone|a\\s+person|my\\s+(?:ex|partner|girlfriend|boyfriend|wife|husband)))',
          flags: 'gi',
          severity: 'critical',
          message: 'AI Safety: Instructions for stalking or surveillance of individuals',
        },
        // Election misinformation
        {
          name: 'election-misinfo',
          pattern: '(?:(?:election|vote|voting)\\s+(?:is|was|has\\s+been)\\s+(?:rigged|stolen|fraudulent)|(?:don\'t|do\\s+not)\\s+(?:vote|bother\\s+voting)|voting\\s+(?:doesn\'t|does\\s+not)\\s+matter)',
          flags: 'gi',
          severity: 'high',
          message: 'AI Safety: Election-related misinformation or voter suppression',
        },
        // Dangerous challenges
        {
          name: 'dangerous-challenge',
          pattern: '(?:(?:tide\\s+pod|choking|blackout|skull\\s+breaker|fire|penny)\\s+challenge|(?:challenge|dare)\\s+(?:to|you\\s+to)\\s+(?:eat|drink|inhale|swallow|jump|cut))',
          flags: 'gi',
          severity: 'critical',
          message: 'AI Safety: Dangerous social media challenges that can cause physical harm',
        },
      ],
      required: [
        {
          name: 'ai-limitations',
          pattern: '(?:I\\s+(?:am|\'m)\\s+(?:an?\\s+)?(?:AI|language\\s+model)|(?:as\\s+an?\\s+)?AI|I\\s+(?:cannot|can\'t|don\'t|do\\s+not)\\s+(?:have\\s+)?(?:personal|real[\\-\\s]time|current))',
          flags: 'gi',
          severity: 'low',
          message: 'AI Safety: AI should acknowledge its nature and limitations when relevant',
        },
      ],
    },
    model: {
      enabled: false,
      allow: [],
      deny: [],
    },
    cost: {
      enabled: true,
      maxCostPerRequest: 10.0,
      maxCostPerDay: 500.0,
      maxCostPerMonth: 10_000.0,
      maxTokensPerRequest: 128_000,
      maxCompletionTokens: 32_768,
    },
    data: {
      enabled: true,
      allowedCategories: ['ephemeral', 'aggregated', 'anonymized'],
      prohibitedCategories: ['csam', 'exploitation-material', 'harmful-instructions-cache'],
      retention: {
        maxDays: 90,
        encryptAtRest: true,
        encryptInTransit: true,
      },
      requireAuditLog: true,
      requireConsent: false,
      allowExport: false,
      allowDeletion: true,
      purposes: ['safety-monitoring', 'abuse-prevention', 'model-improvement'],
    },
    response: {
      enabled: true,
      maxLength: 100_000,
      prohibitedPatterns: [
        {
          name: 'no-real-phone-crisis',
          pattern: '(?:call\\s+(?:me|us)\\s+at\\s+\\d|(?:my|our)\\s+(?:personal\\s+)?(?:phone|number|cell)\\s+(?:is|:)\\s+\\d)',
          flags: 'gi',
          severity: 'high',
          message: 'AI Safety: AI should not provide personal phone numbers; direct to official hotlines',
        },
      ],
    },
    access: {
      enabled: false,
    },
  },
};
