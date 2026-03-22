// ---------------------------------------------------------------------------
// PII detection patterns - real regex patterns for common PII types
// ---------------------------------------------------------------------------

import type { PIIPattern } from '../types.js';

/** Email address pattern. */
export const EMAIL_PATTERN: PIIPattern = {
  name: 'email',
  pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
  flags: 'gi',
  action: 'redact',
  severity: 'high',
  description: 'Email address',
};

/** US phone number (various formats). */
export const PHONE_PATTERN: PIIPattern = {
  name: 'phone',
  pattern:
    '(?:\\+?1[\\s\\-.]?)?(?:\\(?\\d{3}\\)?[\\s\\-.]?)\\d{3}[\\s\\-.]?\\d{4}',
  flags: 'g',
  action: 'redact',
  severity: 'high',
  description: 'US phone number',
};

/** US Social Security Number. */
export const SSN_PATTERN: PIIPattern = {
  name: 'ssn',
  pattern: '\\b\\d{3}[\\s\\-]?\\d{2}[\\s\\-]?\\d{4}\\b',
  flags: 'g',
  action: 'block',
  severity: 'critical',
  description: 'US Social Security Number',
};

/** Credit card number (Visa, MC, Amex, Discover). */
export const CREDIT_CARD_PATTERN: PIIPattern = {
  name: 'credit-card',
  pattern:
    '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b',
  flags: 'g',
  action: 'block',
  severity: 'critical',
  description: 'Credit card number (Visa, Mastercard, Amex, Discover)',
};

/** Credit card with spaces/dashes. */
export const CREDIT_CARD_FORMATTED_PATTERN: PIIPattern = {
  name: 'credit-card-formatted',
  pattern:
    '\\b(?:\\d{4}[\\s\\-]){3}\\d{4}\\b',
  flags: 'g',
  action: 'block',
  severity: 'critical',
  description: 'Credit card number with spaces or dashes',
};

/** IPv4 address. */
export const IPV4_PATTERN: PIIPattern = {
  name: 'ipv4',
  pattern:
    '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
  flags: 'g',
  action: 'detect',
  severity: 'medium',
  description: 'IPv4 address',
};

/** IPv6 address (simplified). */
export const IPV6_PATTERN: PIIPattern = {
  name: 'ipv6',
  pattern:
    '(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}',
  flags: 'gi',
  action: 'detect',
  severity: 'medium',
  description: 'IPv6 address',
};

/** Date of birth patterns (MM/DD/YYYY, YYYY-MM-DD, etc.). */
export const DOB_PATTERN: PIIPattern = {
  name: 'dob',
  pattern:
    '\\b(?:(?:0[1-9]|1[0-2])[/\\-](?:0[1-9]|[12]\\d|3[01])[/\\-](?:19|20)\\d{2}|(?:19|20)\\d{2}[/\\-](?:0[1-9]|1[0-2])[/\\-](?:0[1-9]|[12]\\d|3[01]))\\b',
  flags: 'g',
  action: 'redact',
  severity: 'high',
  description: 'Date of birth',
};

/** US street address (simplified heuristic). */
export const ADDRESS_PATTERN: PIIPattern = {
  name: 'address',
  pattern:
    '\\b\\d{1,5}\\s+(?:[A-Za-z]+\\s){1,4}(?:St(?:reet)?|Ave(?:nue)?|Blvd|Boulevard|Dr(?:ive)?|Ln|Lane|Rd|Road|Ct|Court|Pl|Place|Way|Cir(?:cle)?|Pkwy|Parkway)\\.?\\b',
  flags: 'gi',
  action: 'redact',
  severity: 'high',
  description: 'US street address',
};

/** Medical Record Number (MRN) pattern. */
export const MEDICAL_RECORD_PATTERN: PIIPattern = {
  name: 'medical-record-number',
  pattern: '\\b(?:MRN|Medical\\s*Record)[:\\s#]*[A-Z0-9\\-]{4,20}\\b',
  flags: 'gi',
  action: 'block',
  severity: 'critical',
  description: 'Medical record number',
};

/** US Passport number. */
export const PASSPORT_PATTERN: PIIPattern = {
  name: 'passport',
  pattern: '\\b[A-Z]\\d{8}\\b',
  flags: 'g',
  action: 'block',
  severity: 'critical',
  description: 'US passport number',
};

/** Driver licence number (generic US - 1-2 letters + digits). */
export const DRIVERS_LICENSE_PATTERN: PIIPattern = {
  name: 'drivers-license',
  pattern: '\\b[A-Z]{1,2}\\d{5,10}\\b',
  flags: 'g',
  action: 'redact',
  severity: 'high',
  description: 'Drivers license number (US generic)',
};

/** Bank account / routing number (9-17 digits preceded by keyword). */
export const BANK_ACCOUNT_PATTERN: PIIPattern = {
  name: 'bank-account',
  pattern:
    '(?:account|acct|routing)[\\s#:]*\\d{9,17}',
  flags: 'gi',
  action: 'block',
  severity: 'critical',
  description: 'Bank account or routing number',
};

/** US ZIP code (5 or 5+4). */
export const ZIP_CODE_PATTERN: PIIPattern = {
  name: 'zip-code',
  pattern: '\\b\\d{5}(?:\\-\\d{4})?\\b',
  flags: 'g',
  action: 'detect',
  severity: 'low',
  description: 'US ZIP code',
};

/** Full name heuristic (Title + Capitalized words). */
export const FULL_NAME_PATTERN: PIIPattern = {
  name: 'full-name',
  pattern:
    '\\b(?:Mr|Mrs|Ms|Dr|Prof)\\.?\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)+\\b',
  flags: 'g',
  action: 'redact',
  severity: 'high',
  description: 'Full name with title',
};

/** Age (e.g. "age 45", "45 years old"). */
export const AGE_PATTERN: PIIPattern = {
  name: 'age',
  pattern: '\\b(?:age[d]?\\s*:?\\s*\\d{1,3}|\\d{1,3}\\s*(?:years?|yrs?)\\s*old)\\b',
  flags: 'gi',
  action: 'detect',
  severity: 'medium',
  description: 'Age indicator',
};

/** Vehicle identification number (VIN). */
export const VIN_PATTERN: PIIPattern = {
  name: 'vin',
  pattern: '\\b[A-HJ-NPR-Z0-9]{17}\\b',
  flags: 'g',
  action: 'redact',
  severity: 'medium',
  description: 'Vehicle Identification Number',
};

/** DEA number (2 letters + 7 digits). */
export const DEA_PATTERN: PIIPattern = {
  name: 'dea-number',
  pattern: '\\b[A-Z]{2}\\d{7}\\b',
  flags: 'g',
  action: 'block',
  severity: 'critical',
  description: 'DEA registration number',
};

/** National Provider Identifier (NPI) - 10-digit number starting with 1 or 2. */
export const NPI_PATTERN: PIIPattern = {
  name: 'npi',
  pattern: '\\b[12]\\d{9}\\b',
  flags: 'g',
  action: 'redact',
  severity: 'high',
  description: 'National Provider Identifier',
};

// ---------------------------------------------------------------------------
// Aggregated lists
// ---------------------------------------------------------------------------

export const CORE_PII_PATTERNS: PIIPattern[] = [
  EMAIL_PATTERN,
  PHONE_PATTERN,
  SSN_PATTERN,
  CREDIT_CARD_PATTERN,
  CREDIT_CARD_FORMATTED_PATTERN,
  IPV4_PATTERN,
  DOB_PATTERN,
  ADDRESS_PATTERN,
  FULL_NAME_PATTERN,
];

export const EXTENDED_PII_PATTERNS: PIIPattern[] = [
  ...CORE_PII_PATTERNS,
  IPV6_PATTERN,
  MEDICAL_RECORD_PATTERN,
  PASSPORT_PATTERN,
  DRIVERS_LICENSE_PATTERN,
  BANK_ACCOUNT_PATTERN,
  ZIP_CODE_PATTERN,
  AGE_PATTERN,
  VIN_PATTERN,
  DEA_PATTERN,
  NPI_PATTERN,
];

export const ALL_PII_PATTERNS: PIIPattern[] = EXTENDED_PII_PATTERNS;
