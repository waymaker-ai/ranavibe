// ---------------------------------------------------------------------------
// CCPA preset - California Consumer Privacy Act (+ CPRA amendments)
// Right to know, right to delete, opt-out, non-discrimination
// ---------------------------------------------------------------------------

import type { Policy } from '../types.js';
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  SSN_PATTERN,
  DOB_PATTERN,
  ADDRESS_PATTERN,
  FULL_NAME_PATTERN,
  IPV4_PATTERN,
  DRIVERS_LICENSE_PATTERN,
  PASSPORT_PATTERN,
  CREDIT_CARD_PATTERN,
  CREDIT_CARD_FORMATTED_PATTERN,
  BANK_ACCOUNT_PATTERN,
} from '../rules/pii-rules.js';

export const ccpaPolicy: Policy = {
  metadata: {
    id: 'ccpa',
    name: 'CCPA / CPRA Compliance',
    version: '1.0.0',
    description:
      'Policy enforcing California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA). ' +
      'Covers right to know, right to delete, right to opt-out, data minimization, and non-discrimination ' +
      '(Cal. Civ. Code Secs. 1798.100-1798.199.100).',
    author: 'ranavibe',
    tags: ['california', 'ccpa', 'cpra', 'privacy', 'compliance', 'us-state'],
    framework: 'CCPA/CPRA',
  },
  rules: {
    pii: {
      enabled: true,
      action: 'redact',
      patterns: [
        // Personal information per Sec. 1798.140(v)
        { ...FULL_NAME_PATTERN, action: 'redact', severity: 'high', description: 'CCPA 1798.140(v)(1)(A): Real name or alias' },
        { ...ADDRESS_PATTERN, action: 'redact', severity: 'high', description: 'CCPA 1798.140(v)(1)(A): Postal address' },
        { ...EMAIL_PATTERN, action: 'redact', severity: 'high', description: 'CCPA 1798.140(v)(1)(A): Email address' },
        { ...PHONE_PATTERN, action: 'redact', severity: 'high', description: 'CCPA 1798.140(v)(1)(A): Telephone number' },
        { ...SSN_PATTERN, action: 'block', severity: 'critical', description: 'CCPA 1798.140(v)(1)(A): Social Security Number' },
        { ...DRIVERS_LICENSE_PATTERN, action: 'block', severity: 'critical', description: 'CCPA 1798.140(v)(1)(A): Drivers license number' },
        { ...PASSPORT_PATTERN, action: 'block', severity: 'critical', description: 'CCPA 1798.140(v)(1)(A): Passport number' },
        { ...DOB_PATTERN, action: 'redact', severity: 'high', description: 'CCPA: Date of birth' },
        { ...IPV4_PATTERN, action: 'redact', severity: 'medium', description: 'CCPA 1798.140(v)(1)(A): IP address (unique identifier)' },
        { ...CREDIT_CARD_PATTERN, action: 'block', severity: 'critical', description: 'CCPA 1798.140(v)(1)(B): Financial account number' },
        { ...CREDIT_CARD_FORMATTED_PATTERN, action: 'block', severity: 'critical', description: 'CCPA: Credit card (formatted)' },
        { ...BANK_ACCOUNT_PATTERN, action: 'block', severity: 'critical', description: 'CCPA 1798.140(v)(1)(B): Bank account number' },
        // Biometric information per 1798.140(v)(1)(E)
        {
          name: 'biometric-ccpa',
          pattern: '\\b(?:fingerprint|face\\s*(?:print|geometry|template)|retina|iris|voice\\s*print|keystroke\\s+pattern|gait\\s+pattern)\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'CCPA 1798.140(v)(1)(E): Biometric information',
        },
        // Geolocation per 1798.140(v)(1)(G)
        {
          name: 'precise-geolocation',
          pattern: '\\b-?(?:[1-8]?\\d(?:\\.\\d{4,})?|90(?:\\.0+)?)\\s*,\\s*-?(?:1[0-7]\\d|[1-9]?\\d)(?:\\.\\d{4,})?\\b',
          flags: 'g',
          action: 'redact',
          severity: 'high',
          description: 'CCPA 1798.140(v)(1)(G): Precise geolocation data',
        },
        // Online identifiers per 1798.140(v)(1)(A)
        {
          name: 'advertising-id',
          pattern: '\\b(?:IDFA|GAID|advertising[\\s_-]?id|device[\\s_-]?id)[\\s:=]+[a-f0-9\\-]{8,}\\b',
          flags: 'gi',
          action: 'redact',
          severity: 'medium',
          description: 'CCPA: Advertising / device identifier',
        },
        // Sensitive PI per CPRA 1798.140(ae)
        {
          name: 'racial-ethnic-ccpa',
          pattern: '\\b(?:race|ethnicity|ethnic\\s+origin|racial\\s+(?:background|identity))\\s*(?::|is)\\s*\\w+',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'CPRA 1798.140(ae)(1): Racial or ethnic origin (sensitive PI)',
        },
        {
          name: 'union-membership-ccpa',
          pattern: '\\b(?:union\\s+member(?:ship)?|trade\\s+union)\\s*(?::|is)\\s*\\w+',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'CPRA 1798.140(ae)(4): Union membership (sensitive PI)',
        },
      ],
    },
    content: {
      enabled: true,
      prohibited: [
        {
          name: 'sell-pi-without-opt-out',
          pattern: '(?:sell|selling|share|sharing)\\s+(?:personal\\s+(?:information|data)|PI|consumer\\s+data)\\s+(?:without|lacking)\\s+(?:opt[\\-\\s]?out|consent)',
          flags: 'gi',
          severity: 'critical',
          message: 'CCPA 1798.120: Consumers have the right to opt-out of sale/sharing of personal information',
        },
        {
          name: 'discriminatory-pricing',
          pattern: '(?:different|higher|lower)\\s+(?:price|rate|quality|service)\\s+(?:for|based\\s+on)\\s+(?:exercis|opt)',
          flags: 'gi',
          severity: 'high',
          message: 'CCPA 1798.125: Non-discrimination for exercising consumer rights',
        },
        {
          name: 'minor-data-sale',
          pattern: '(?:sell|share)\\s+(?:data|information|PI)\\s+(?:of|from|about)\\s+(?:minor|child|children|teen|under\\s+(?:13|16))',
          flags: 'gi',
          severity: 'critical',
          message: 'CCPA 1798.120(c): Sale of minor personal information requires opt-in consent',
        },
      ],
      required: [
        {
          name: 'ccpa-notice',
          pattern: '(?:CCPA|CPRA|California\\s+(?:Consumer|Privacy)|Do\\s+Not\\s+Sell|privacy\\s+(?:policy|notice|rights))',
          flags: 'gi',
          severity: 'medium',
          message: 'CCPA 1798.100(b): Right to know notice should be provided at collection',
        },
      ],
    },
    model: {
      enabled: true,
      allow: [],
      deny: [],
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
      allowedCategories: ['aggregated', 'anonymized', 'de-identified', 'consented'],
      prohibitedCategories: ['sold-without-opt-out', 'shared-without-notice', 'minor-data-without-consent'],
      retention: {
        maxDays: 365,
        encryptAtRest: true,
        encryptInTransit: true,
      },
      requireAuditLog: true,
      requireConsent: true,
      allowExport: true,  // 1798.100 Right to know / access
      allowDeletion: true, // 1798.105 Right to delete
      purposes: ['disclosed-at-collection', 'service-delivery', 'security', 'debugging', 'short-term-transient'],
    },
    response: {
      enabled: true,
      maxLength: 50_000,
    },
    access: {
      enabled: true,
      requireAuth: true,
      requireMFA: false,
      rateLimit: 120,
    },
  },
};
