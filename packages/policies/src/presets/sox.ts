// ---------------------------------------------------------------------------
// SOX preset - Sarbanes-Oxley Act of 2002
// Financial reporting integrity, internal controls, audit trail, retention
// ---------------------------------------------------------------------------

import type { Policy } from '../types.js';
import { SSN_PATTERN, BANK_ACCOUNT_PATTERN, CREDIT_CARD_PATTERN } from '../rules/pii-rules.js';

export const soxPolicy: Policy = {
  metadata: {
    id: 'sox',
    name: 'SOX Compliance',
    version: '1.0.0',
    description:
      'Policy enforcing Sarbanes-Oxley Act requirements. Covers financial reporting accuracy (Sec 302/906), ' +
      'internal controls over financial reporting (Sec 404), audit trail integrity (Sec 802), ' +
      'record retention (Sec 802), whistleblower protections (Sec 806), and CEO/CFO certifications.',
    author: 'ranavibe',
    tags: ['finance', 'sox', 'audit', 'compliance', 'internal-controls', 'reporting'],
    framework: 'SOX',
  },
  rules: {
    pii: {
      enabled: true,
      action: 'block',
      patterns: [
        { ...SSN_PATTERN, action: 'block', severity: 'critical', description: 'SOX: Employee/officer SSN' },
        { ...BANK_ACCOUNT_PATTERN, action: 'block', severity: 'critical', description: 'SOX: Corporate bank account' },
        { ...CREDIT_CARD_PATTERN, action: 'block', severity: 'critical', description: 'SOX: Corporate credit card' },
        {
          name: 'financial-password',
          pattern: '\\b(?:password|passphrase|secret\\s*key|api\\s*key)[\\s:=]+\\S{8,}\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'SOX Sec 404: Credentials for financial systems',
        },
        {
          name: 'insider-compensation',
          pattern: '\\b(?:salary|compensation|bonus|stock\\s*option|RSU|equity\\s*grant)[\\s:=]*\\$[\\d,]+',
          flags: 'gi',
          action: 'redact',
          severity: 'high',
          description: 'SOX: Executive/officer compensation details',
        },
      ],
    },
    content: {
      enabled: true,
      prohibited: [
        {
          name: 'destroy-records',
          pattern: '(?:destroy|delete|shred|dispose\\s+of|erase|wipe)\\s+(?:financial|accounting|audit|corporate)\\s+(?:records?|documents?|files?|data|evidence)',
          flags: 'gi',
          severity: 'critical',
          message: 'SOX Sec 802: Destruction/alteration of corporate audit records is a felony (up to 20 years)',
        },
        {
          name: 'falsify-financials',
          pattern: '(?:falsif|fabricat|manipulat|misstat|overstat|understat|cook(?:ing)?\\s+the\\s+books|inflate|deflate)\\s*(?:e|ing)?\\s+(?:financial|accounting|revenue|earnings|income|expense|asset|liabilit)',
          flags: 'gi',
          severity: 'critical',
          message: 'SOX Sec 906: Certifying materially false financial statements carries criminal penalties',
        },
        {
          name: 'circumvent-controls',
          pattern: '(?:bypass|circumvent|override|disable|weaken|work\\s+around)\\s+(?:internal\\s+)?(?:controls?|segregation\\s+of\\s+duties|approval\\s+process|authorization)',
          flags: 'gi',
          severity: 'critical',
          message: 'SOX Sec 404: Circumventing internal controls over financial reporting is prohibited',
        },
        {
          name: 'retaliate-whistleblower',
          pattern: '(?:retaliat|terminat|demot|harass|threaten|intimidat|discriminat)\\s*(?:e|ing)?\\s+(?:against\\s+)?(?:whistleblower|reporter|complainant|employee\\s+who\\s+(?:reported|raised|filed))',
          flags: 'gi',
          severity: 'critical',
          message: 'SOX Sec 806: Retaliation against whistleblowers is prohibited',
        },
        {
          name: 'off-balance-sheet',
          pattern: '(?:hide|conceal|keep\\s+off)\\s+(?:debt|liabilit|obligation|transaction|loss)\\s+(?:off[\\-\\s]?balance[\\-\\s]?sheet|from\\s+(?:the\\s+)?(?:books|financial\\s+statements))',
          flags: 'gi',
          severity: 'critical',
          message: 'SOX Sec 401: Off-balance-sheet transactions must be disclosed',
        },
        {
          name: 'backdate-options',
          pattern: '(?:backdat|retroactiv)\\s*(?:e|ing)?\\s+(?:stock\\s+)?(?:options?|grants?|exercise\\s+(?:date|price))',
          flags: 'gi',
          severity: 'critical',
          message: 'SOX: Backdating stock options violates Sec 302/906 certification requirements',
        },
      ],
      required: [
        {
          name: 'sox-disclaimer',
          pattern: '(?:SOX|Sarbanes[\\-\\s]?Oxley|internal\\s+controls?|financial\\s+reporting\\s+(?:integrity|accuracy)|audit\\s+(?:trail|compliance))',
          flags: 'gi',
          severity: 'medium',
          message: 'SOX: Financial content should reference SOX compliance or internal controls framework',
        },
        {
          name: 'material-weakness-disclosure',
          pattern: '(?:material\\s+weakness|significant\\s+deficiency|control\\s+deficiency|remediation\\s+plan)',
          flags: 'gi',
          severity: 'medium',
          message: 'SOX Sec 404: Material weaknesses in internal controls must be disclosed',
        },
      ],
    },
    model: {
      enabled: true,
      allow: ['gpt-4*', 'gpt-4o*', 'o1-*', 'o3-*', 'o4-*', 'claude-*'],
      deny: ['gpt-3.5*', 'text-davinci-*'],
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
      allowedCategories: ['financial-records', 'audit-trails', 'communications', 'internal-controls-documentation'],
      prohibitedCategories: ['destroyed-records', 'falsified-data'],
      retention: {
        maxDays: 2555, // 7 years per Sec 802
        encryptAtRest: true,
        encryptInTransit: true,
      },
      requireAuditLog: true,
      requireConsent: false,
      allowExport: true,
      allowDeletion: false, // SOX mandates record retention
      purposes: ['financial-reporting', 'audit', 'compliance', 'internal-controls', 'regulatory-examination'],
    },
    response: {
      enabled: true,
      maxLength: 50_000,
    },
    access: {
      enabled: true,
      requireAuth: true,
      requireMFA: true,
      allowedRoles: ['cfo', 'ceo', 'controller', 'internal-auditor', 'external-auditor', 'compliance-officer', 'finance-director'],
      deniedRoles: ['guest', 'public', 'contractor'],
      rateLimit: 60,
    },
  },
};
