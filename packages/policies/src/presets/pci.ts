// ---------------------------------------------------------------------------
// PCI DSS preset - Payment Card Industry Data Security Standard
// Cardholder data protection, encryption, access control, logging
// ---------------------------------------------------------------------------

import type { Policy } from '../types.js';
import {
  CREDIT_CARD_PATTERN,
  CREDIT_CARD_FORMATTED_PATTERN,
  BANK_ACCOUNT_PATTERN,
  SSN_PATTERN,
} from '../rules/pii-rules.js';

export const pciPolicy: Policy = {
  metadata: {
    id: 'pci',
    name: 'PCI DSS Compliance',
    version: '1.0.0',
    description:
      'Policy enforcing PCI DSS v4.0 requirements. Covers cardholder data protection (Req 3), ' +
      'encryption in transit (Req 4), access control (Req 7-8), logging/monitoring (Req 10), ' +
      'and network security (Req 1-2).',
    author: 'cofounder',
    tags: ['payment', 'pci-dss', 'cardholder', 'compliance', 'financial'],
    framework: 'PCI-DSS-v4.0',
  },
  rules: {
    pii: {
      enabled: true,
      action: 'block',
      patterns: [
        // PAN (Primary Account Number) - the core of PCI DSS
        { ...CREDIT_CARD_PATTERN, action: 'block', severity: 'critical', description: 'PCI DSS Req 3.4: PAN must be rendered unreadable' },
        { ...CREDIT_CARD_FORMATTED_PATTERN, action: 'block', severity: 'critical', description: 'PCI DSS Req 3.4: Formatted PAN must be rendered unreadable' },
        // CVV / CVC / CAV2
        {
          name: 'cvv',
          pattern: '\\b(?:CVV|CVC|CVV2|CVC2|CAV2|CID)[\\s:=]*\\d{3,4}\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'PCI DSS Req 3.3.1: Card verification codes must never be stored',
        },
        // PIN / PIN block
        {
          name: 'pin',
          pattern: '\\b(?:PIN|pin\\s*(?:code|number|block))[\\s:=]*\\d{4,6}\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'PCI DSS Req 3.3.2: PINs and PIN blocks must never be stored',
        },
        // Magnetic stripe / track data
        {
          name: 'track-data',
          pattern: '\\b(?:track\\s*(?:1|2|data)|magnetic\\s*stripe|magstripe)[\\s:=]*[%B;][^?]*\\?',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'PCI DSS Req 3.3.3: Full track data must never be stored after authorization',
        },
        // Cardholder name
        {
          name: 'cardholder-name',
          pattern: '\\b(?:cardholder|card\\s*holder|card\\s*member)\\s*(?:name)?\\s*(?::|=)\\s*[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)+',
          flags: 'gi',
          action: 'redact',
          severity: 'high',
          description: 'PCI DSS Req 3.4: Cardholder name should be protected',
        },
        // Expiration date
        {
          name: 'card-expiry',
          pattern: '\\b(?:exp(?:ir(?:y|ation))?\\s*(?:date)?|valid\\s*(?:thru|through))[\\s:=]*(?:0[1-9]|1[0-2])[/\\-](?:\\d{2}|\\d{4})\\b',
          flags: 'gi',
          action: 'redact',
          severity: 'high',
          description: 'PCI DSS Req 3.4: Card expiration date',
        },
        // Service code
        {
          name: 'service-code',
          pattern: '\\b(?:service\\s*code)[\\s:=]*\\d{3}\\b',
          flags: 'gi',
          action: 'block',
          severity: 'high',
          description: 'PCI DSS Req 3.4: Service code',
        },
        // Other sensitive auth data
        { ...BANK_ACCOUNT_PATTERN, action: 'block', severity: 'critical', description: 'PCI DSS: Bank account number' },
        { ...SSN_PATTERN, action: 'block', severity: 'critical', description: 'PCI DSS: SSN (not required but best practice)' },
        // Token format (should be allowed but detected)
        {
          name: 'payment-token',
          pattern: '\\b(?:tok|token)[_\\-]?[a-zA-Z0-9]{16,32}\\b',
          flags: 'g',
          action: 'detect',
          severity: 'low',
          description: 'PCI DSS: Payment token (acceptable substitute for PAN)',
        },
        // Masked PAN (first 6 / last 4 - allowed per Req 3.4)
        {
          name: 'masked-pan',
          pattern: '\\b\\d{4,6}[\\*xX]{4,6}\\d{4}\\b',
          flags: 'g',
          action: 'detect',
          severity: 'info',
          description: 'PCI DSS Req 3.4: Masked PAN (acceptable display format)',
        },
      ],
    },
    content: {
      enabled: true,
      prohibited: [
        {
          name: 'store-sensitive-auth',
          pattern: '(?:store|save|persist|log|cache|write)\\s+(?:CVV|CVC|PIN|track\\s*data|magnetic\\s*stripe|full\\s*(?:card|PAN))',
          flags: 'gi',
          severity: 'critical',
          message: 'PCI DSS Req 3.3: Sensitive authentication data must not be stored after authorization',
        },
        {
          name: 'plaintext-card-storage',
          pattern: '(?:store|save|write|insert)\\s+(?:card|PAN|credit\\s*card)\\s+(?:number|data)?\\s*(?:in|to|into)\\s+(?:plain\\s*text|unencrypted|clear\\s*text|database|file|log)',
          flags: 'gi',
          severity: 'critical',
          message: 'PCI DSS Req 3.5: PAN must be encrypted/hashed/truncated/tokenized when stored',
        },
        {
          name: 'shared-credentials',
          pattern: '(?:shared?|generic|common|group)\\s+(?:password|credential|account|login|user\\s*(?:name|id))',
          flags: 'gi',
          severity: 'high',
          message: 'PCI DSS Req 8.2.2: Shared/generic accounts are prohibited',
        },
        {
          name: 'disable-logging',
          pattern: '(?:disable|turn\\s+off|remove|skip)\\s+(?:audit|security)?\\s*(?:log(?:ging)?|monitor(?:ing)?|alert(?:ing)?)',
          flags: 'gi',
          severity: 'high',
          message: 'PCI DSS Req 10: Audit logging must not be disabled in cardholder data environments',
        },
      ],
    },
    model: {
      enabled: true,
      allow: ['gpt-4*', 'gpt-4o*', 'o1-*', 'o3-*', 'o4-*', 'claude-*'],
      deny: [],
    },
    cost: {
      enabled: true,
      maxCostPerRequest: 2.0,
      maxCostPerDay: 100.0,
      maxCostPerMonth: 3000.0,
      maxTokensPerRequest: 64_000,
      maxCompletionTokens: 8_192,
    },
    data: {
      enabled: true,
      allowedCategories: ['tokenized', 'encrypted', 'masked', 'truncated'],
      prohibitedCategories: ['plaintext-pan', 'full-track-data', 'cvv-stored', 'pin-stored', 'plaintext-sad'],
      retention: {
        maxDays: 365,
        encryptAtRest: true,
        encryptInTransit: true,
      },
      requireAuditLog: true,
      requireConsent: false,
      allowExport: false,
      allowDeletion: true,
      purposes: ['payment-processing', 'fraud-detection', 'chargeback-resolution', 'compliance'],
    },
    response: {
      enabled: true,
      maxLength: 20_000,
    },
    access: {
      enabled: true,
      requireAuth: true,
      requireMFA: true,
      allowedRoles: ['payment-admin', 'security-admin', 'compliance-officer', 'authorized-operator'],
      deniedRoles: ['guest', 'public'],
      rateLimit: 60,
    },
  },
};
