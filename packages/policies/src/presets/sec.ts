// ---------------------------------------------------------------------------
// SEC preset - Securities and Exchange Commission compliance
// Investment disclaimers, material information, forward-looking statements
// ---------------------------------------------------------------------------

import type { Policy } from '../types.js';
import { SSN_PATTERN, BANK_ACCOUNT_PATTERN, CREDIT_CARD_PATTERN } from '../rules/pii-rules.js';

export const secPolicy: Policy = {
  metadata: {
    id: 'sec',
    name: 'SEC Compliance',
    version: '1.0.0',
    description:
      'Policy enforcing SEC regulations for financial content. Covers investment disclaimers, ' +
      'forward-looking statement safe harbors, material information disclosures, insider trading ' +
      'prohibitions, and anti-fraud provisions (Securities Act 1933, Exchange Act 1934, Reg FD, Reg S-P).',
    author: 'cofounder',
    tags: ['finance', 'sec', 'securities', 'compliance', 'investment'],
    framework: 'SEC',
  },
  rules: {
    pii: {
      enabled: true,
      action: 'block',
      patterns: [
        { ...SSN_PATTERN, action: 'block', severity: 'critical', description: 'SEC Reg S-P: SSN protection' },
        { ...BANK_ACCOUNT_PATTERN, action: 'block', severity: 'critical', description: 'SEC Reg S-P: Financial account protection' },
        { ...CREDIT_CARD_PATTERN, action: 'block', severity: 'critical', description: 'SEC Reg S-P: Financial account protection' },
        {
          name: 'brokerage-account',
          pattern: '\\b(?:brokerage|trading|investment)\\s*(?:account|acct)[\\s#:]*[A-Z0-9\\-]{6,20}\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'SEC Reg S-P: Brokerage account number',
        },
      ],
    },
    content: {
      enabled: true,
      prohibited: [
        {
          name: 'guaranteed-returns',
          pattern: '(?:guarantee[ds]?|assured|certain|risk[\\-\\s]?free)\\s+(?:returns?|profits?|gains?|income|yield)',
          flags: 'gi',
          severity: 'critical',
          message: 'SEC Rule 10b-5: Guaranteeing investment returns is prohibited as misleading',
        },
        {
          name: 'insider-trading',
          pattern: '(?:material\\s+non[\\-\\s]?public\\s+(?:information|data)|MNPI|insider\\s+(?:tip|information|trading)|before\\s+(?:the\\s+)?(?:announcement|earnings|public\\s+(?:release|disclosure)))',
          flags: 'gi',
          severity: 'critical',
          message: 'SEC Rule 10b-5 / Exchange Act Sec.10(b): Insider trading or MNPI disclosure prohibited',
        },
        {
          name: 'market-manipulation',
          pattern: '(?:pump\\s+and\\s+dump|front[\\-\\s]?run(?:ning)?|wash\\s+trad(?:e|ing)|spoof(?:ing)?|layer(?:ing)?|corner(?:ing)?\\s+the\\s+market)',
          flags: 'gi',
          severity: 'critical',
          message: 'SEC: Market manipulation schemes are prohibited',
        },
        {
          name: 'unregistered-offering',
          pattern: '(?:invest\\s+now|buy\\s+(?:now|today)|limited\\s+(?:time\\s+)?offer)\\s+(?:in|for)\\s+(?:shares?|stock|securities?|token)',
          flags: 'gi',
          severity: 'high',
          message: 'Securities Act Sec.5: Offering/selling securities without registration',
        },
        {
          name: 'misleading-performance',
          pattern: '(?:you\\s+(?:will|can)\\s+(?:make|earn)|(?:earn|make)\\s+\\$?\\d+[kKmM]?\\s+(?:per|a|every)\\s+(?:day|week|month|year))',
          flags: 'gi',
          severity: 'high',
          message: 'SEC: Misleading performance claims violate anti-fraud provisions',
        },
        {
          name: 'omitting-risks',
          pattern: '(?:no\\s+risk|zero\\s+risk|without\\s+(?:any\\s+)?risk|can(?:not|\\\'t)\\s+lose|impossible\\s+to\\s+lose)',
          flags: 'gi',
          severity: 'high',
          message: 'SEC Rule 10b-5: Omitting material risk factors is misleading',
        },
      ],
      required: [
        {
          name: 'investment-disclaimer',
          pattern: '(?:not\\s+(?:financial|investment)\\s+advice|past\\s+performance\\s+(?:is\\s+)?(?:not|no)\\s+(?:guarantee|indicat))',
          flags: 'gi',
          severity: 'high',
          message: 'SEC: Financial content must include investment disclaimer',
        },
        {
          name: 'forward-looking-safe-harbor',
          pattern: '(?:forward[\\-\\s]looking\\s+statement|(?:these|such)\\s+statements?\\s+(?:involve|are\\s+subject\\s+to)\\s+(?:risk|uncertaint))',
          flags: 'gi',
          severity: 'medium',
          message: 'SEC: Forward-looking statements should include safe harbor language (PSLRA Sec.21E)',
        },
        {
          name: 'risk-disclosure',
          pattern: '(?:risk(?:s)?\\s+(?:include|involve|factor)|(?:may|could|might)\\s+(?:lose|result\\s+in\\s+(?:loss|losses)))',
          flags: 'gi',
          severity: 'medium',
          message: 'SEC: Investment content should include risk disclosure',
        },
      ],
    },
    model: {
      enabled: true,
      allow: ['gpt-4*', 'gpt-4o*', 'o1-*', 'o3-*', 'o4-*', 'claude-*'],
      deny: ['gpt-3.5*'],
    },
    cost: {
      enabled: true,
      maxCostPerRequest: 5.0,
      maxCostPerDay: 300.0,
      maxCostPerMonth: 8000.0,
      maxTokensPerRequest: 128_000,
      maxCompletionTokens: 16_384,
    },
    data: {
      enabled: true,
      allowedCategories: ['aggregated', 'anonymized', 'public-filings', 'market-data'],
      prohibitedCategories: ['mnpi', 'insider-data', 'non-public-customer-trades'],
      retention: {
        maxDays: 2555, // 7 years for broker-dealer records (Exchange Act 17a-4)
        encryptAtRest: true,
        encryptInTransit: true,
      },
      requireAuditLog: true,
      requireConsent: false,
      allowExport: true,
      allowDeletion: false, // SEC requires record retention
      purposes: ['investment-advisory', 'compliance', 'research', 'reporting'],
    },
    response: {
      enabled: true,
      maxLength: 50_000,
    },
    access: {
      enabled: true,
      requireAuth: true,
      requireMFA: true,
      allowedRoles: ['analyst', 'advisor', 'compliance-officer', 'portfolio-manager', 'admin'],
      rateLimit: 60,
    },
  },
};
