// ---------------------------------------------------------------------------
// HIPAA preset - Health Insurance Portability and Accountability Act
// Covers all 18 PHI identifiers, audit trails, encryption, minimum necessary
// ---------------------------------------------------------------------------

import type { Policy } from '../types.js';
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  SSN_PATTERN,
  DOB_PATTERN,
  ADDRESS_PATTERN,
  MEDICAL_RECORD_PATTERN,
  FULL_NAME_PATTERN,
  IPV4_PATTERN,
  ZIP_CODE_PATTERN,
  DRIVERS_LICENSE_PATTERN,
  NPI_PATTERN,
  DEA_PATTERN,
  AGE_PATTERN,
  VIN_PATTERN,
  BANK_ACCOUNT_PATTERN,
  PASSPORT_PATTERN,
} from '../rules/pii-rules.js';

export const hipaaPolicy: Policy = {
  metadata: {
    id: 'hipaa',
    name: 'HIPAA Compliance',
    version: '1.0.0',
    description:
      'Policy enforcing HIPAA Privacy and Security Rules. Covers all 18 PHI identifiers, ' +
      'minimum necessary standard, encryption requirements, and audit trail provisions.',
    author: 'ranavibe',
    tags: ['healthcare', 'hipaa', 'phi', 'compliance', 'privacy'],
    framework: 'HIPAA',
  },
  rules: {
    pii: {
      enabled: true,
      action: 'block',
      patterns: [
        // -- 18 PHI identifiers per 45 CFR 164.514(b)(2) --
        // 1. Names
        { ...FULL_NAME_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Patient name' },
        // 2. Geographic data (street address, city, county, zip)
        { ...ADDRESS_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Geographic data' },
        { ...ZIP_CODE_PATTERN, action: 'redact', severity: 'high', description: 'PHI: ZIP code (first 3 digits may be retained if pop >20k)' },
        // 3. Dates (DOB, admission, discharge, death)
        { ...DOB_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Dates (DOB, admission, discharge, death)' },
        { ...AGE_PATTERN, action: 'redact', severity: 'high', description: 'PHI: Age (>89 must be aggregated to 90+)' },
        // 4. Telephone numbers
        { ...PHONE_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Telephone number' },
        // 5. Fax numbers (same pattern as phone)
        { name: 'fax', pattern: PHONE_PATTERN.pattern, flags: 'g', action: 'block', severity: 'critical', description: 'PHI: Fax number' },
        // 6. Email addresses
        { ...EMAIL_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Email address' },
        // 7. Social Security Numbers
        { ...SSN_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Social Security Number' },
        // 8. Medical record numbers
        { ...MEDICAL_RECORD_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Medical record number' },
        // 9. Health plan beneficiary numbers
        {
          name: 'health-plan-id',
          pattern: '\\b(?:health\\s*plan|beneficiary|member)[\\s#:]*[A-Z0-9\\-]{6,20}\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'PHI: Health plan beneficiary number',
        },
        // 10. Account numbers
        { ...BANK_ACCOUNT_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Account number' },
        // 11. Certificate/license numbers
        { ...DRIVERS_LICENSE_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Certificate/license number' },
        // 12. Vehicle identifiers
        { ...VIN_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Vehicle identifier/VIN' },
        // 13. Device identifiers and serial numbers
        {
          name: 'device-serial',
          pattern: '\\b(?:serial|device|UDI)[\\s#:]*[A-Z0-9\\-]{6,30}\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'PHI: Device identifier/serial number',
        },
        // 14. Web URLs (personal pages)
        {
          name: 'personal-url',
          pattern: 'https?://(?:www\\.)?[a-zA-Z0-9\\-]+\\.[a-zA-Z]{2,}(?:/[^\\s]*)?',
          flags: 'gi',
          action: 'redact',
          severity: 'high',
          description: 'PHI: Web URL',
        },
        // 15. IP addresses
        { ...IPV4_PATTERN, action: 'block', severity: 'critical', description: 'PHI: IP address' },
        // 16. Biometric identifiers
        {
          name: 'biometric',
          pattern: '\\b(?:fingerprint|retina|iris|voice\\s*print|face\\s*(?:id|recognition)|biometric)[\\s:]+[A-Za-z0-9+/=]{8,}\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'PHI: Biometric identifier',
        },
        // 17. Full-face photographs (detect references)
        {
          name: 'photo-reference',
          pattern: '\\b(?:photo(?:graph)?|image|selfie|headshot|portrait)\\s+(?:of|showing|depicting)\\s+(?:patient|individual|person)\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'PHI: Full-face photograph reference',
        },
        // 18. Any other unique identifying number
        { ...NPI_PATTERN, action: 'block', severity: 'critical', description: 'PHI: National Provider Identifier' },
        { ...DEA_PATTERN, action: 'block', severity: 'critical', description: 'PHI: DEA number' },
        { ...PASSPORT_PATTERN, action: 'block', severity: 'critical', description: 'PHI: Passport number' },
      ],
    },
    content: {
      enabled: true,
      prohibited: [
        {
          name: 'phi-disclosure-intent',
          pattern: '(?:share|disclose|release|transmit|send)\\s+(?:patient|medical|health|clinical|PHI)\\s+(?:records?|information|data|details)',
          flags: 'gi',
          severity: 'high',
          message: 'HIPAA: Unauthorized disclosure of patient health information',
        },
        {
          name: 'phi-marketing',
          pattern: '(?:marketing|advertising|promotional)\\s+(?:use|purpose|campaign)\\s+(?:of|for|with)\\s+(?:patient|health|medical)\\s+(?:data|information|records)',
          flags: 'gi',
          severity: 'critical',
          message: 'HIPAA: Use of PHI for marketing without authorization violates 45 CFR 164.508(a)(3)',
        },
        {
          name: 'phi-sale',
          pattern: '(?:sell|selling|sale\\s+of)\\s+(?:patient|health|medical|PHI)\\s+(?:data|information|records)',
          flags: 'gi',
          severity: 'critical',
          message: 'HIPAA: Sale of PHI is prohibited under HITECH Act Sec. 13405(d)',
        },
      ],
      required: [
        {
          name: 'hipaa-disclaimer',
          pattern: '(?:HIPAA|protected\\s+health\\s+information|PHI|privacy\\s+(?:rule|notice|policy))',
          flags: 'gi',
          severity: 'medium',
          message: 'HIPAA: Healthcare content should reference HIPAA compliance or privacy policy',
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
      allowedCategories: ['de-identified', 'limited-dataset', 'treatment', 'payment', 'operations'],
      prohibitedCategories: ['marketing-without-consent', 'sale-of-phi', 'research-without-irb'],
      retention: {
        maxDays: 2190, // 6 years per 45 CFR 164.530(j)
        encryptAtRest: true,
        encryptInTransit: true,
      },
      requireAuditLog: true,
      requireConsent: true,
      allowExport: true,
      allowDeletion: false, // HIPAA requires retention of records
      purposes: ['treatment', 'payment', 'healthcare-operations'],
    },
    response: {
      enabled: true,
      maxLength: 50_000,
    },
    access: {
      enabled: true,
      requireAuth: true,
      requireMFA: true,
      allowedRoles: ['physician', 'nurse', 'admin', 'billing', 'compliance-officer'],
      rateLimit: 100,
    },
  },
};
