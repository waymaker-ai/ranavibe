/**
 * RANA Security Presets
 *
 * One-command security configurations for common compliance scenarios.
 * Each preset includes:
 * - PII detection and redaction
 * - Prompt injection protection
 * - Content filtering
 * - Rate limiting
 * - Audit logging
 * - Compliance-specific rules
 */

import type {
  PIIDetectorConfig,
} from './pii';
import type {
  ContentFilterConfig,
} from './filter';
import type {
  AuditLoggerConfig,
} from './audit';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (request: unknown) => string;
}

export interface SecurityPresetConfig {
  name: string;
  description: string;
  pii: PIIDetectorConfig;
  contentFilter: ContentFilterConfig;
  rateLimit: RateLimitConfig;
  auditLog: AuditLoggerConfig;
  promptInjectionProtection: boolean;
  compliance: {
    enabled: boolean;
    rules: string[];
    strictMode: boolean;
  };
  recommendations: string[];
}

/**
 * HIPAA-compliant security preset for healthcare applications
 */
export function hipaaPreset(): SecurityPresetConfig {
  return {
    name: 'HIPAA Healthcare',
    description: 'HIPAA-compliant configuration for healthcare applications',
    pii: {
      enabled: true,
      types: [
        'ssn',
        'medical_record_number',
        'health_insurance_number',
        'email',
        'phone',
        'date_of_birth',
        'drivers_license',
        'passport',
        'address',
        'name',
      ],
      redactionStrategy: 'replace',
      redactionChar: '*',
      logDetections: true,
    },
    contentFilter: {
      enabled: true,
      categories: [
        'medical_advice',
        'diagnosis',
        'treatment_recommendations',
        'prescription_advice',
      ],
      action: 'block',
      customRules: [
        {
          pattern: /\b(take|use|try)\s+\d+\s*(mg|ml|g)\b/gi,
          action: 'block',
          message: 'Cannot provide medication dosage recommendations',
        },
        {
          pattern: /\b(you (have|might have|probably have))\s+\w+/gi,
          action: 'block',
          message: 'Cannot provide medical diagnoses',
        },
      ],
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 20,
      requestsPerHour: 500,
      requestsPerDay: 5000,
      strategy: 'sliding-window',
    },
    auditLog: {
      enabled: true,
      events: ['all'],
      includeRequest: true,
      includeResponse: true,
      includePII: false, // Never log PII for HIPAA
      retention: 7 * 365, // 7 years for HIPAA
      storage: 'encrypted',
    },
    promptInjectionProtection: true,
    compliance: {
      enabled: true,
      rules: [
        'hipaa-no-medical-advice',
        'hipaa-no-diagnosis',
        'hipaa-no-prescription',
        'hipaa-patient-privacy',
        'hipaa-minimum-necessary',
      ],
      strictMode: true,
    },
    recommendations: [
      'Enable encryption at rest for all data storage',
      'Use secure channels (HTTPS/TLS) for all communications',
      'Implement role-based access control (RBAC)',
      'Conduct regular security audits',
      'Maintain audit logs for 7 years minimum',
      'Train staff on HIPAA compliance requirements',
    ],
  };
}

/**
 * SEC/FINRA-compliant security preset for financial applications
 */
export function financePreset(): SecurityPresetConfig {
  return {
    name: 'SEC/FINRA Finance',
    description: 'SEC/FINRA-compliant configuration for financial applications',
    pii: {
      enabled: true,
      types: [
        'ssn',
        'credit_card',
        'bank_account',
        'routing_number',
        'email',
        'phone',
        'address',
        'date_of_birth',
      ],
      redactionStrategy: 'mask',
      redactionChar: 'X',
      logDetections: true,
    },
    contentFilter: {
      enabled: true,
      categories: [
        'investment_advice',
        'trading_recommendations',
        'price_predictions',
        'guaranteed_returns',
      ],
      action: 'replace',
      customRules: [
        {
          pattern: /\b(you should|must|need to)\s+(buy|sell|invest|trade)\b/gi,
          action: 'replace',
          message:
            'I cannot provide investment advice. Please consult a licensed financial advisor.',
        },
        {
          pattern: /\b(guaranteed|promise|certain|sure)\s+(profit|return|gain)\b/gi,
          action: 'block',
          message: 'Cannot make guarantees about investment returns',
        },
      ],
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 30,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      strategy: 'token-bucket',
    },
    auditLog: {
      enabled: true,
      events: ['all'],
      includeRequest: true,
      includeResponse: true,
      includePII: false,
      retention: 7 * 365, // SEC requires 7 years
      storage: 'encrypted',
    },
    promptInjectionProtection: true,
    compliance: {
      enabled: true,
      rules: [
        'sec-no-investment-advice',
        'finra-disclosures',
        'sec-no-guarantees',
        'sec-risk-warnings',
        'finra-suitability',
      ],
      strictMode: true,
    },
    recommendations: [
      'Add SEC-required disclaimers to all responses',
      'Implement trade surveillance and monitoring',
      'Maintain detailed audit trails for 7 years',
      'Use multi-factor authentication (MFA)',
      'Regular compliance training for all personnel',
      'Document all investment-related communications',
    ],
  };
}

/**
 * GDPR-compliant security preset for EU privacy compliance
 */
export function gdprPreset(): SecurityPresetConfig {
  return {
    name: 'GDPR Privacy',
    description: 'GDPR-compliant configuration for EU data privacy',
    pii: {
      enabled: true,
      types: [
        'email',
        'phone',
        'address',
        'name',
        'ssn',
        'passport',
        'drivers_license',
        'date_of_birth',
        'ip_address',
        'cookie_id',
      ],
      redactionStrategy: 'pseudonymize',
      redactionChar: '#',
      logDetections: true,
    },
    contentFilter: {
      enabled: true,
      categories: ['personal_data_collection', 'tracking', 'profiling'],
      action: 'warn',
      customRules: [
        {
          pattern: /\b(track|monitor|collect|store)\s+your\s+(data|information|activity)\b/gi,
          action: 'append',
          message:
            '\n\n[Privacy Notice: We respect your privacy rights under GDPR. You have the right to access, rectify, erase, and port your data. Contact privacy@example.com for requests.]',
        },
      ],
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 60,
      requestsPerHour: 2000,
      requestsPerDay: 20000,
      strategy: 'sliding-window',
    },
    auditLog: {
      enabled: true,
      events: ['data_access', 'data_modification', 'data_deletion'],
      includeRequest: true,
      includeResponse: false,
      includePII: false,
      retention: 365, // 1 year minimum
      storage: 'encrypted',
    },
    promptInjectionProtection: true,
    compliance: {
      enabled: true,
      rules: [
        'gdpr-right-to-access',
        'gdpr-right-to-erasure',
        'gdpr-right-to-portability',
        'gdpr-consent',
        'gdpr-data-minimization',
        'gdpr-purpose-limitation',
      ],
      strictMode: false, // Advisory mode for flexibility
    },
    recommendations: [
      'Implement consent management system',
      'Provide clear privacy policy and notices',
      'Enable data subject rights (access, erasure, portability)',
      'Conduct Data Protection Impact Assessments (DPIA)',
      'Appoint Data Protection Officer (DPO) if required',
      'Document lawful basis for all data processing',
      'Implement data retention and deletion policies',
    ],
  };
}

/**
 * CCPA-compliant security preset for California privacy compliance
 */
export function ccpaPreset(): SecurityPresetConfig {
  return {
    name: 'CCPA California Privacy',
    description: 'CCPA-compliant configuration for California consumer privacy',
    pii: {
      enabled: true,
      types: [
        'email',
        'phone',
        'address',
        'name',
        'ssn',
        'drivers_license',
        'date_of_birth',
        'ip_address',
        'cookie_id',
        'geolocation',
      ],
      redactionStrategy: 'pseudonymize',
      redactionChar: '#',
      logDetections: true,
    },
    contentFilter: {
      enabled: true,
      categories: ['personal_info_sale', 'third_party_sharing'],
      action: 'append',
      customRules: [
        {
          pattern: /\b(sell|share|disclose)\s+.*(personal|data|information)\b/gi,
          action: 'append',
          message:
            '\n\n[CCPA Notice: California residents have rights regarding their personal information. You can opt-out of sale, request disclosure, and request deletion. Visit our privacy page or contact privacy@example.com.]',
        },
      ],
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 60,
      requestsPerHour: 2000,
      requestsPerDay: 20000,
      strategy: 'sliding-window',
    },
    auditLog: {
      enabled: true,
      events: ['data_access', 'data_sale', 'data_sharing', 'data_deletion'],
      includeRequest: true,
      includeResponse: false,
      includePII: false,
      retention: 365, // 1 year minimum
      storage: 'encrypted',
    },
    promptInjectionProtection: true,
    compliance: {
      enabled: true,
      rules: [
        'ccpa-right-to-know',
        'ccpa-right-to-delete',
        'ccpa-right-to-opt-out',
        'ccpa-non-discrimination',
        'ccpa-notice-at-collection',
      ],
      strictMode: false,
    },
    recommendations: [
      'Provide "Do Not Sell My Personal Information" link',
      'Respond to consumer requests within 45 days',
      'Verify consumer identity before responding to requests',
      'Maintain records of consumer requests for 24 months',
      'Update privacy policy to include CCPA disclosures',
      'Implement opt-out mechanisms for data sales',
    ],
  };
}

/**
 * Legal compliance preset for legal services
 */
export function legalPreset(): SecurityPresetConfig {
  return {
    name: 'Legal Services',
    description: 'Security configuration for legal services and law firms',
    pii: {
      enabled: true,
      types: [
        'ssn',
        'email',
        'phone',
        'address',
        'name',
        'date_of_birth',
        'case_number',
        'docket_number',
      ],
      redactionStrategy: 'replace',
      redactionChar: '[REDACTED]',
      logDetections: true,
    },
    contentFilter: {
      enabled: true,
      categories: ['legal_advice', 'attorney_client', 'privileged'],
      action: 'block',
      customRules: [
        {
          pattern: /\b(you should|must)\s+(sue|file|claim|prosecute)\b/gi,
          action: 'replace',
          message:
            'I cannot provide legal advice. Please consult a licensed attorney for your specific situation.',
        },
        {
          pattern: /\b(attorney-client|privileged|confidential)\s+(communication|document)\b/gi,
          action: 'warn',
          message: 'Detected potentially privileged information',
        },
      ],
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 30,
      requestsPerHour: 1000,
      requestsPerDay: 5000,
      strategy: 'token-bucket',
    },
    auditLog: {
      enabled: true,
      events: ['all'],
      includeRequest: true,
      includeResponse: true,
      includePII: false,
      retention: 7 * 365, // 7 years for legal records
      storage: 'encrypted',
    },
    promptInjectionProtection: true,
    compliance: {
      enabled: true,
      rules: [
        'legal-no-advice',
        'legal-privilege-protection',
        'legal-confidentiality',
        'legal-conflicts',
        'legal-unauthorized-practice',
      ],
      strictMode: true,
    },
    recommendations: [
      'Implement attorney-client privilege protections',
      'Use secure communication channels',
      'Maintain detailed conflict checks',
      'Document all client communications',
      'Implement information barriers for conflicts',
      'Regular ethics and compliance training',
      'Malpractice insurance coverage review',
    ],
  };
}

/**
 * COPPA-compliant preset for services with children under 13
 */
export function coppaPreset(): SecurityPresetConfig {
  return {
    name: 'COPPA Children',
    description: 'COPPA-compliant configuration for services with children under 13',
    pii: {
      enabled: true,
      types: [
        'name',
        'email',
        'phone',
        'address',
        'photo',
        'voice',
        'geolocation',
        'persistent_identifier',
      ],
      redactionStrategy: 'block',
      redactionChar: '',
      logDetections: true,
    },
    contentFilter: {
      enabled: true,
      categories: ['age_verification', 'parental_consent', 'targeted_advertising'],
      action: 'block',
      customRules: [
        {
          pattern: /\b(i am|i'm|my age is)\s+(\d|ten|eleven|twelve|thirteen)\b/gi,
          action: 'block',
          message:
            'We do not collect information from children under 13 without parental consent.',
        },
      ],
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 20,
      requestsPerHour: 500,
      requestsPerDay: 2000,
      strategy: 'strict',
    },
    auditLog: {
      enabled: true,
      events: ['data_collection', 'age_verification', 'parental_consent'],
      includeRequest: true,
      includeResponse: false,
      includePII: false,
      retention: 365,
      storage: 'encrypted',
    },
    promptInjectionProtection: true,
    compliance: {
      enabled: true,
      rules: [
        'coppa-parental-consent',
        'coppa-age-verification',
        'coppa-data-minimization',
        'coppa-parental-access',
        'coppa-no-conditioning',
      ],
      strictMode: true,
    },
    recommendations: [
      'Implement age-gate before data collection',
      'Obtain verifiable parental consent',
      'Provide parental access to child data',
      'Do not condition participation on excess data collection',
      'Delete child data upon parent request',
      'No behavioral advertising to children',
      'Clear, understandable privacy notices for parents',
    ],
  };
}

/**
 * General enterprise security preset (balanced)
 */
export function enterprisePreset(): SecurityPresetConfig {
  return {
    name: 'Enterprise Standard',
    description: 'Balanced security configuration for enterprise applications',
    pii: {
      enabled: true,
      types: [
        'ssn',
        'credit_card',
        'email',
        'phone',
        'address',
        'name',
        'date_of_birth',
      ],
      redactionStrategy: 'mask',
      redactionChar: '*',
      logDetections: true,
    },
    contentFilter: {
      enabled: true,
      categories: ['harmful', 'offensive', 'inappropriate'],
      action: 'warn',
      customRules: [],
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 60,
      requestsPerHour: 3000,
      requestsPerDay: 50000,
      strategy: 'sliding-window',
    },
    auditLog: {
      enabled: true,
      events: ['security_events', 'errors', 'violations'],
      includeRequest: true,
      includeResponse: false,
      includePII: false,
      retention: 90,
      storage: 'standard',
    },
    promptInjectionProtection: true,
    compliance: {
      enabled: false,
      rules: [],
      strictMode: false,
    },
    recommendations: [
      'Review and customize security settings for your use case',
      'Enable compliance rules if applicable to your industry',
      'Implement SSO and MFA for authentication',
      'Regular security audits and penetration testing',
      'Monitor audit logs for suspicious activity',
      'Keep all dependencies up to date',
    ],
  };
}

/**
 * Development/testing preset (minimal security, for dev only)
 */
export function developmentPreset(): SecurityPresetConfig {
  return {
    name: 'Development',
    description: 'Minimal security for development and testing (NOT FOR PRODUCTION)',
    pii: {
      enabled: false,
      types: [],
      redactionStrategy: 'none',
      redactionChar: '',
      logDetections: false,
    },
    contentFilter: {
      enabled: false,
      categories: [],
      action: 'allow',
      customRules: [],
    },
    rateLimit: {
      enabled: false,
      requestsPerMinute: 1000,
      requestsPerHour: 100000,
      requestsPerDay: 1000000,
      strategy: 'none',
    },
    auditLog: {
      enabled: false,
      events: [],
      includeRequest: false,
      includeResponse: false,
      includePII: false,
      retention: 1,
      storage: 'memory',
    },
    promptInjectionProtection: false,
    compliance: {
      enabled: false,
      rules: [],
      strictMode: false,
    },
    recommendations: [
      '⚠️  WARNING: This preset is for development only',
      '⚠️  DO NOT USE IN PRODUCTION',
      '⚠️  All security features are disabled',
      'Switch to appropriate security preset before deployment',
      'Use environment-specific configurations',
    ],
  };
}

/**
 * All available security presets
 */
export const securityPresets = {
  hipaa: hipaaPreset,
  finance: financePreset,
  gdpr: gdprPreset,
  ccpa: ccpaPreset,
  legal: legalPreset,
  coppa: coppaPreset,
  enterprise: enterprisePreset,
  development: developmentPreset,
};

/**
 * Get preset by name
 */
export function getPreset(name: keyof typeof securityPresets): SecurityPresetConfig {
  return securityPresets[name]();
}

/**
 * List all available presets
 */
export function listPresets(): Array<{
  name: string;
  description: string;
}> {
  return Object.entries(securityPresets).map(([key, fn]) => {
    const preset = fn();
    return {
      name: key,
      description: preset.description,
    };
  });
}
