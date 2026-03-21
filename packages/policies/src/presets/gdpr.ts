// ---------------------------------------------------------------------------
// GDPR preset - General Data Protection Regulation (EU)
// Data minimization, purpose limitation, consent, right to erasure/portability
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
  IPV6_PATTERN,
  PASSPORT_PATTERN,
  BANK_ACCOUNT_PATTERN,
  DRIVERS_LICENSE_PATTERN,
  CREDIT_CARD_PATTERN,
  CREDIT_CARD_FORMATTED_PATTERN,
} from '../rules/pii-rules.js';

export const gdprPolicy: Policy = {
  metadata: {
    id: 'gdpr',
    name: 'GDPR Compliance',
    version: '1.0.0',
    description:
      'Policy enforcing EU General Data Protection Regulation. Covers data minimization, ' +
      'purpose limitation, lawful basis, consent management, and data subject rights ' +
      '(Articles 5-22, 25, 32, 35).',
    author: 'ranavibe',
    tags: ['eu', 'gdpr', 'privacy', 'compliance', 'data-protection'],
    framework: 'GDPR',
  },
  rules: {
    pii: {
      enabled: true,
      action: 'redact',
      patterns: [
        // Personal data per Art. 4(1)
        { ...FULL_NAME_PATTERN, action: 'redact', severity: 'high', description: 'GDPR Art.4(1): Name (personal data)' },
        { ...EMAIL_PATTERN, action: 'redact', severity: 'high', description: 'GDPR Art.4(1): Email address' },
        { ...PHONE_PATTERN, action: 'redact', severity: 'high', description: 'GDPR Art.4(1): Phone number' },
        { ...ADDRESS_PATTERN, action: 'redact', severity: 'high', description: 'GDPR Art.4(1): Physical address' },
        { ...DOB_PATTERN, action: 'redact', severity: 'high', description: 'GDPR Art.4(1): Date of birth' },
        { ...IPV4_PATTERN, action: 'redact', severity: 'high', description: 'GDPR Recital 30: IP address is personal data' },
        { ...IPV6_PATTERN, action: 'redact', severity: 'high', description: 'GDPR Recital 30: IPv6 address is personal data' },
        { ...PASSPORT_PATTERN, action: 'block', severity: 'critical', description: 'GDPR Art.9: Government ID' },
        { ...DRIVERS_LICENSE_PATTERN, action: 'block', severity: 'critical', description: 'GDPR Art.9: Drivers license' },
        // Special categories per Art. 9 (sensitive data - stricter treatment)
        {
          name: 'racial-ethnic-origin',
          pattern: '\\b(?:race|ethnicity|ethnic\\s+origin|racial\\s+(?:background|identity))\\s*(?::|is|was)\\s*\\w+',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'GDPR Art.9: Racial or ethnic origin (special category)',
        },
        {
          name: 'political-opinion',
          pattern: '\\b(?:political\\s+(?:opinion|affiliation|party|belief))\\s*(?::|is|was)\\s*\\w+',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'GDPR Art.9: Political opinion (special category)',
        },
        {
          name: 'religious-belief',
          pattern: '\\b(?:religion|religious\\s+(?:belief|affiliation))\\s*(?::|is|was)\\s*\\w+',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'GDPR Art.9: Religious belief (special category)',
        },
        {
          name: 'trade-union',
          pattern: '\\b(?:trade\\s+union|union\\s+member(?:ship)?)\\s*(?::|is|was)\\s*\\w+',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'GDPR Art.9: Trade union membership (special category)',
        },
        {
          name: 'health-data',
          pattern: '\\b(?:diagnosis|medical\\s+condition|health\\s+(?:status|data|record)|patient\\s+(?:has|suffers|diagnosed))\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'GDPR Art.9: Health data (special category)',
        },
        {
          name: 'sexual-orientation',
          pattern: '\\b(?:sexual\\s+orientation|gender\\s+identity)\\s*(?::|is|was)\\s*\\w+',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'GDPR Art.9: Sexual orientation (special category)',
        },
        {
          name: 'biometric-data',
          pattern: '\\b(?:fingerprint|retina\\s+scan|face\\s+(?:recognition|template)|biometric\\s+(?:data|template|hash))\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'GDPR Art.9: Biometric data (special category)',
        },
        {
          name: 'genetic-data',
          pattern: '\\b(?:genetic\\s+(?:data|test|sequence|marker)|DNA\\s+(?:sample|result|profile)|genome)\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'GDPR Art.9: Genetic data (special category)',
        },
        // Financial identifiers
        { ...CREDIT_CARD_PATTERN, action: 'block', severity: 'critical', description: 'GDPR: Credit card number' },
        { ...CREDIT_CARD_FORMATTED_PATTERN, action: 'block', severity: 'critical', description: 'GDPR: Credit card (formatted)' },
        { ...BANK_ACCOUNT_PATTERN, action: 'block', severity: 'critical', description: 'GDPR: Bank account number' },
        // National ID (SSN equivalent)
        { ...SSN_PATTERN, action: 'block', severity: 'critical', description: 'GDPR: National identification number' },
        // Online identifiers (cookies, device IDs)
        {
          name: 'cookie-id',
          pattern: '\\b(?:cookie|tracking|device)[\\s_-]?(?:id|identifier)[\\s:=]+[a-f0-9\\-]{8,}\\b',
          flags: 'gi',
          action: 'redact',
          severity: 'medium',
          description: 'GDPR Recital 30: Online identifier (cookie/device ID)',
        },
      ],
    },
    content: {
      enabled: true,
      prohibited: [
        {
          name: 'profiling-without-notice',
          pattern: '(?:profil(?:e|ing)|scor(?:e|ing))\\s+(?:users?|individuals?|persons?)\\s+(?:without|lacking)\\s+(?:consent|notice|notification)',
          flags: 'gi',
          severity: 'high',
          message: 'GDPR Art.22: Automated profiling without notice or consent',
        },
        {
          name: 'cross-border-transfer-unrestricted',
          pattern: '(?:transfer|send|export)\\s+(?:personal\\s+)?data\\s+(?:to|outside)\\s+(?:third\\s+countr|non-(?:EU|EEA))',
          flags: 'gi',
          severity: 'high',
          message: 'GDPR Art.44-49: Cross-border data transfer must have adequate safeguards',
        },
        {
          name: 'excessive-data-collection',
          pattern: '(?:collect|gather|harvest)\\s+(?:all|every|as\\s+much)\\s+(?:data|information|details?)\\s+(?:as\\s+possible|available)',
          flags: 'gi',
          severity: 'high',
          message: 'GDPR Art.5(1)(c): Data minimization - collect only what is necessary',
        },
      ],
      required: [
        {
          name: 'privacy-notice',
          pattern: '(?:privacy\\s+(?:policy|notice|statement)|data\\s+protection|GDPR)',
          flags: 'gi',
          severity: 'medium',
          message: 'GDPR Art.13-14: Processing of personal data should reference privacy notice',
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
      allowedCategories: ['aggregated', 'anonymized', 'pseudonymized', 'consented'],
      prohibitedCategories: ['biometric-raw', 'genetic-raw', 'special-category-without-consent'],
      retention: {
        maxDays: 365,
        encryptAtRest: true,
        encryptInTransit: true,
      },
      requireAuditLog: true,
      requireConsent: true,
      allowExport: true,  // Art. 20 Right to data portability
      allowDeletion: true, // Art. 17 Right to erasure
      purposes: ['service-delivery', 'legitimate-interest', 'consent', 'legal-obligation', 'vital-interest', 'public-interest'],
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
