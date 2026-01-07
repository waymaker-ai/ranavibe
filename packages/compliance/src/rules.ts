/**
 * @rana/compliance - Compliance rule factory and presets
 */

import type {
  ComplianceRule,
  ComplianceCategory,
  ComplianceSeverity,
  ComplianceCheckFn,
  PIIType,
  PIIMatch,
} from './types';

/**
 * Create a compliance rule
 */
export interface CreateRuleOptions {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  check: ComplianceCheckFn;
  tags?: string[];
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

export function createComplianceRule(options: CreateRuleOptions): ComplianceRule {
  return {
    id: options.id,
    name: options.name,
    description: options.description,
    category: options.category,
    severity: options.severity,
    check: options.check,
    tags: options.tags,
    enabled: options.enabled ?? true,
    metadata: options.metadata,
  };
}

/**
 * PII Detection Patterns
 */
const PII_PATTERNS: Record<PIIType, RegExp> = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  credit_card: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ip_address: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  medical_record: /\b(MRN|MR#|Medical Record)\s*:?\s*\d+\b/gi,
  passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
  address: /\b\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/gi,
  name: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // Very basic, needs improvement
  date_of_birth: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g,
};

/**
 * Detect PII in text
 */
export function detectPII(text: string, types?: PIIType[]): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const typesToCheck = types ?? Object.keys(PII_PATTERNS) as PIIType[];

  for (const type of typesToCheck) {
    const pattern = PII_PATTERNS[type];
    if (!pattern) continue;

    pattern.lastIndex = 0; // Reset regex
    let match;

    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        type,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.8, // Simple patterns have moderate confidence
      });
    }
  }

  return matches;
}

/**
 * Redact PII from text
 */
export function redactPII(text: string, types?: PIIType[], replacement: string = '[REDACTED]'): string {
  let redacted = text;
  const matches = detectPII(text, types);

  // Sort matches by position (descending) to avoid index shifting
  matches.sort((a, b) => b.start - a.start);

  for (const match of matches) {
    redacted = redacted.substring(0, match.start) + replacement + redacted.substring(match.end);
  }

  return redacted;
}

/**
 * Preset Compliance Rules
 */
export const PresetRules = {
  /**
   * HIPAA - No Medical Advice
   */
  hipaaNoMedicalAdvice: (): ComplianceRule => createComplianceRule({
    id: 'hipaa-no-medical-advice',
    name: 'HIPAA: No Medical Advice',
    description: 'Prevent providing medical diagnoses or treatment recommendations',
    category: 'healthcare',
    severity: 'critical',
    tags: ['hipaa', 'healthcare', 'medical'],
    check: async (input, output, context) => {
      const medicalKeywords = [
        'diagnose', 'diagnosis', 'prescribe', 'prescription',
        'treatment plan', 'medical advice', 'you have', 'you should take'
      ];

      const isHealthcareContext = context.topic === 'medical' || context.topic === 'health';
      const containsMedicalAdvice = medicalKeywords.some(keyword =>
        output.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isHealthcareContext && containsMedicalAdvice) {
        return {
          compliant: false,
          action: 'replace',
          message: 'Response contains potential medical advice which violates HIPAA guidelines',
          replacement: 'I cannot provide medical advice, diagnoses, or treatment recommendations. Please consult with a licensed healthcare professional for medical concerns. If this is an emergency, please call 911 or visit your nearest emergency room.',
          issues: ['medical_advice_detected'],
          confidence: 0.85,
        };
      }

      return { compliant: true, action: 'allow' };
    },
  }),

  /**
   * HIPAA - PII Protection
   */
  hipaaPIIProtection: (): ComplianceRule => createComplianceRule({
    id: 'hipaa-pii-protection',
    name: 'HIPAA: PHI/PII Protection',
    description: 'Prevent exposure of Protected Health Information',
    category: 'healthcare',
    severity: 'critical',
    tags: ['hipaa', 'pii', 'phi', 'privacy'],
    check: async (input, output, context) => {
      const healthcarePII = detectPII(output, ['ssn', 'medical_record', 'date_of_birth']);

      if (healthcarePII.length > 0) {
        return {
          compliant: false,
          action: 'redact',
          message: 'Response contains Protected Health Information (PHI)',
          replacement: redactPII(output, ['ssn', 'medical_record', 'date_of_birth']),
          issues: healthcarePII.map(pii => `phi_${pii.type}`),
          confidence: 0.9,
        };
      }

      return { compliant: true, action: 'allow' };
    },
  }),

  /**
   * SEC/FINRA - Financial Disclaimer
   */
  secFinancialDisclaimer: (): ComplianceRule => createComplianceRule({
    id: 'sec-financial-disclaimer',
    name: 'SEC/FINRA: Financial Disclaimer Required',
    description: 'Require disclaimers on investment and financial advice',
    category: 'finance',
    severity: 'high',
    tags: ['sec', 'finra', 'finance', 'investment'],
    check: async (input, output, context) => {
      const financialKeywords = ['invest', 'stock', 'portfolio', 'buy', 'sell', 'trading'];
      const isFinancialContext = financialKeywords.some(keyword =>
        output.toLowerCase().includes(keyword.toLowerCase())
      );

      const hasDisclaimer = output.toLowerCase().includes('not financial advice') ||
                           output.toLowerCase().includes('disclaimer:');

      if (isFinancialContext && !hasDisclaimer) {
        const disclaimer = '\n\n📋 Disclaimer: This is not financial advice. Past performance does not guarantee future results. Please consult with a licensed financial advisor before making investment decisions.';

        return {
          compliant: false,
          action: 'append',
          message: 'Financial content requires regulatory disclaimer',
          replacement: output + disclaimer,
          issues: ['missing_financial_disclaimer'],
          confidence: 0.8,
        };
      }

      return { compliant: true, action: 'allow' };
    },
  }),

  /**
   * SEC/FINRA - No Specific Investment Advice
   */
  secNoInvestmentAdvice: (): ComplianceRule => createComplianceRule({
    id: 'sec-no-investment-advice',
    name: 'SEC/FINRA: No Specific Investment Recommendations',
    description: 'Prevent specific buy/sell recommendations without licensing',
    category: 'finance',
    severity: 'critical',
    tags: ['sec', 'finra', 'investment'],
    check: async (input, output, context) => {
      const advicePatterns = [
        /you should (buy|sell|invest in)/i,
        /i recommend (buying|selling|investing)/i,
        /this is a (good|bad) (investment|stock)/i,
      ];

      const containsAdvice = advicePatterns.some(pattern => pattern.test(output));

      if (containsAdvice) {
        return {
          compliant: false,
          action: 'replace',
          message: 'Response contains specific investment advice which requires licensing',
          replacement: 'I cannot provide specific investment recommendations. For personalized investment advice, please consult with a licensed financial advisor who can assess your individual situation, risk tolerance, and financial goals.',
          issues: ['unlicensed_investment_advice'],
          confidence: 0.9,
        };
      }

      return { compliant: true, action: 'allow' };
    },
  }),

  /**
   * Legal - No Legal Advice
   */
  noLegalAdvice: (): ComplianceRule => createComplianceRule({
    id: 'no-legal-advice',
    name: 'No Legal Advice',
    description: 'Prevent providing specific legal advice',
    category: 'legal',
    severity: 'critical',
    tags: ['legal', 'attorney'],
    check: async (input, output, context) => {
      const legalKeywords = ['you should sue', 'file a lawsuit', 'legal action', 'your case'];
      const containsLegalAdvice = legalKeywords.some(keyword =>
        output.toLowerCase().includes(keyword.toLowerCase())
      );

      if (containsLegalAdvice) {
        return {
          compliant: false,
          action: 'append',
          message: 'Response may contain legal advice',
          replacement: output + '\n\n⚖️ This is not legal advice. Please consult with a licensed attorney for legal matters specific to your situation.',
          issues: ['potential_legal_advice'],
          confidence: 0.75,
        };
      }

      return { compliant: true, action: 'allow' };
    },
  }),

  /**
   * GDPR - PII Protection
   */
  gdprPIIProtection: (): ComplianceRule => createComplianceRule({
    id: 'gdpr-pii-protection',
    name: 'GDPR: PII Protection',
    description: 'Protect personally identifiable information per GDPR',
    category: 'privacy',
    severity: 'critical',
    tags: ['gdpr', 'pii', 'privacy', 'eu'],
    check: async (input, output, context) => {
      const pii = detectPII(output, ['email', 'phone', 'address', 'ip_address']);

      if (pii.length > 0) {
        return {
          compliant: false,
          action: 'redact',
          message: 'Response contains PII that must be protected under GDPR',
          replacement: redactPII(output, ['email', 'phone', 'address', 'ip_address']),
          issues: pii.map(p => `pii_${p.type}`),
          confidence: 0.85,
        };
      }

      return { compliant: true, action: 'allow' };
    },
  }),

  /**
   * CCPA - California Privacy
   */
  ccpaPrivacy: (): ComplianceRule => createComplianceRule({
    id: 'ccpa-privacy',
    name: 'CCPA: California Privacy Protection',
    description: 'Protect consumer data per CCPA requirements',
    category: 'privacy',
    severity: 'high',
    tags: ['ccpa', 'privacy', 'california'],
    check: async (input, output, context) => {
      const sensitiveInfo = detectPII(output, ['ssn', 'credit_card', 'passport']);

      if (sensitiveInfo.length > 0) {
        return {
          compliant: false,
          action: 'redact',
          message: 'Response contains sensitive personal information protected by CCPA',
          replacement: redactPII(output, ['ssn', 'credit_card', 'passport']),
          issues: sensitiveInfo.map(s => `sensitive_${s.type}`),
          confidence: 0.9,
        };
      }

      return { compliant: true, action: 'allow' };
    },
  }),

  /**
   * Age-Appropriate Content
   */
  ageAppropriate: (minAge: number = 13): ComplianceRule => createComplianceRule({
    id: 'age-appropriate-content',
    name: 'Age-Appropriate Content',
    description: `Ensure content is appropriate for users ${minAge}+`,
    category: 'safety',
    severity: 'high',
    tags: ['safety', 'age-appropriate', 'coppa'],
    check: async (input, output, context) => {
      const matureKeywords = ['violence', 'explicit', 'adult content', 'nsfw'];
      const containsMature = matureKeywords.some(keyword =>
        output.toLowerCase().includes(keyword.toLowerCase())
      );

      if (containsMature) {
        return {
          compliant: false,
          action: 'block',
          message: `Content not appropriate for users under ${minAge}`,
          issues: ['age_inappropriate_content'],
          confidence: 0.7,
        };
      }

      return { compliant: true, action: 'allow' };
    },
  }),

  /**
   * No Password/Credentials Request
   */
  noPasswordRequest: (): ComplianceRule => createComplianceRule({
    id: 'no-password-request',
    name: 'No Password/Credential Requests',
    description: 'Never request passwords or sensitive credentials',
    category: 'security',
    severity: 'critical',
    tags: ['security', 'credentials', 'passwords'],
    check: async (input, output, context) => {
      const credentialKeywords = [
        'enter your password',
        'provide your password',
        'what is your password',
        'type your password',
        'send me your password'
      ];

      const requestsCredentials = credentialKeywords.some(keyword =>
        output.toLowerCase().includes(keyword.toLowerCase())
      );

      if (requestsCredentials) {
        return {
          compliant: false,
          action: 'block',
          message: 'AI must never request passwords or credentials',
          issues: ['credential_request'],
          confidence: 0.95,
        };
      }

      return { compliant: true, action: 'allow' };
    },
  }),
};

/**
 * Get all preset rules
 */
export function getAllPresetRules(): ComplianceRule[] {
  return [
    PresetRules.hipaaNoMedicalAdvice(),
    PresetRules.hipaaPIIProtection(),
    PresetRules.secFinancialDisclaimer(),
    PresetRules.secNoInvestmentAdvice(),
    PresetRules.noLegalAdvice(),
    PresetRules.gdprPIIProtection(),
    PresetRules.ccpaPrivacy(),
    PresetRules.ageAppropriate(),
    PresetRules.noPasswordRequest(),
  ];
}
