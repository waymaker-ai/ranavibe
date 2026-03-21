// ---------------------------------------------------------------------------
// Data handling / retention rule helpers
// ---------------------------------------------------------------------------

import type { DataRules } from '../types.js';

/** GDPR-aligned data rules. */
export const GDPR_DATA_RULES: DataRules = {
  enabled: true,
  allowedCategories: ['aggregated', 'anonymized', 'pseudonymized'],
  prohibitedCategories: ['biometric-raw', 'genetic-raw'],
  retention: {
    maxDays: 365,
    encryptAtRest: true,
    encryptInTransit: true,
  },
  requireAuditLog: true,
  requireConsent: true,
  allowExport: true,
  allowDeletion: true,
  purposes: ['service-delivery', 'support', 'product-improvement'],
};

/** HIPAA-aligned data rules. */
export const HIPAA_DATA_RULES: DataRules = {
  enabled: true,
  allowedCategories: ['de-identified', 'limited-dataset', 'treatment', 'payment', 'operations'],
  prohibitedCategories: ['marketing-without-consent', 'sale-of-phi'],
  retention: {
    maxDays: 2190, // 6 years per HIPAA
    encryptAtRest: true,
    encryptInTransit: true,
  },
  requireAuditLog: true,
  requireConsent: true,
  allowExport: true,
  allowDeletion: false, // HIPAA requires retention
  purposes: ['treatment', 'payment', 'healthcare-operations'],
};

/** PCI-DSS aligned data rules. */
export const PCI_DATA_RULES: DataRules = {
  enabled: true,
  allowedCategories: ['tokenized', 'encrypted', 'masked'],
  prohibitedCategories: ['plaintext-pan', 'full-track-data', 'cvv-stored', 'pin-stored'],
  retention: {
    maxDays: 365,
    encryptAtRest: true,
    encryptInTransit: true,
  },
  requireAuditLog: true,
  requireConsent: false,
  allowExport: false,
  allowDeletion: true,
  purposes: ['payment-processing', 'fraud-detection'],
};

/** SOX-aligned data rules. */
export const SOX_DATA_RULES: DataRules = {
  enabled: true,
  allowedCategories: ['financial-records', 'audit-trails', 'communications'],
  prohibitedCategories: [],
  retention: {
    maxDays: 2555, // 7 years per SOX
    encryptAtRest: true,
    encryptInTransit: true,
  },
  requireAuditLog: true,
  requireConsent: false,
  allowExport: true,
  allowDeletion: false, // SOX requires retention
  purposes: ['financial-reporting', 'audit', 'compliance'],
};

/** Minimal / no-retention rules. */
export const NO_RETENTION_DATA_RULES: DataRules = {
  enabled: true,
  allowedCategories: ['ephemeral'],
  prohibitedCategories: ['persistent'],
  retention: {
    maxDays: 0,
    encryptAtRest: true,
    encryptInTransit: true,
  },
  requireAuditLog: false,
  requireConsent: false,
  allowExport: false,
  allowDeletion: true,
  purposes: ['ephemeral-processing'],
};

/** Create data rules from options. */
export function createDataRules(opts: Partial<DataRules>): DataRules {
  return {
    enabled: true,
    ...opts,
  };
}
