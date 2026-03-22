// ---------------------------------------------------------------------------
// @waymakerai/aicofounder-openclaw - Lightweight compliance checks (zero dependencies)
// ---------------------------------------------------------------------------
// Subset of @waymakerai/aicofounder-policies compliance rules, inline for zero-dep usage.
// Covers HIPAA, GDPR, CCPA, SEC, PCI, FERPA, SOX frameworks.
// ---------------------------------------------------------------------------

import type {
  ComplianceFramework,
  ComplianceViolation,
  ComplianceResult,
  Severity,
} from './types.js';
import { detectPII, hasPII } from './guards.js';

// =========================================================================
// Compliance Rule Definitions
// =========================================================================

interface ComplianceRule {
  framework: ComplianceFramework;
  id: string;
  description: string;
  severity: Severity;
  check: (text: string, direction: 'input' | 'output') => ComplianceViolation | null;
}

// -- PII type sets per framework --

const HIPAA_PII_TYPES = new Set([
  'email', 'phone', 'ssn', 'date_of_birth', 'address',
  'medical_record', 'ip_address', 'name',
]);

const GDPR_PII_TYPES = new Set([
  'email', 'phone', 'ssn', 'credit_card', 'date_of_birth',
  'address', 'ip_address', 'name', 'passport', 'drivers_license',
]);

const PCI_PII_TYPES = new Set([
  'credit_card',
]);

const SEC_PII_TYPES = new Set([
  'ssn', 'credit_card', 'name', 'address',
]);

const FERPA_PII_TYPES = new Set([
  'ssn', 'email', 'phone', 'date_of_birth', 'address', 'name',
]);

// -- Content pattern checks --

const MEDICAL_TERMS = /\b(?:diagnosis|patient|prescription|medication|treatment\s+plan|medical\s+history|health\s+record|PHI|protected\s+health\s+information|HIPAA|clinical\s+trial|lab\s+results?|blood\s+(?:type|pressure|test)|allergy|prognosis|surgical|radiology|pathology)\b/gi;

const FINANCIAL_TERMS = /\b(?:insider\s+(?:trading|information)|material\s+non-public|MNPI|securities\s+fraud|market\s+manipulation|front\s+running|pump\s+and\s+dump|wash\s+trading|investment\s+advice|guaranteed\s+returns?|risk-free|financial\s+guarantee)\b/gi;

const INVESTMENT_DISCLAIMER_NEEDED = /\b(?:you\s+should\s+(?:buy|sell|invest|trade)|I\s+recommend\s+(?:buying|selling|investing)|guaranteed\s+(?:returns?|profit)|risk-free\s+investment|sure\s+thing\s+stock|can't\s+lose)\b/gi;

const MEDICAL_DISCLAIMER_NEEDED = /\b(?:you\s+(?:should|need\s+to)\s+(?:take|stop\s+taking)\s+(?:this\s+)?(?:medication|medicine|drug|pill)|your\s+diagnosis\s+is|you\s+(?:have|suffer\s+from)|treatment\s+(?:plan|recommendation)\s+(?:is|would\s+be))\b/gi;

const STUDENT_RECORD_TERMS = /\b(?:student\s+(?:record|grade|transcript|ID|enrollment)|GPA|academic\s+(?:record|performance|standing)|disciplinary\s+(?:record|action)|FERPA|education\s+record)\b/gi;

const SOX_TERMS = /\b(?:financial\s+(?:statement|report|filing|audit)|internal\s+control|material\s+weakness|earnings\s+(?:report|guidance)|revenue\s+recognition|audit\s+committee|SOX\s+compliance|Sarbanes[\s-]Oxley)\b/gi;

// =========================================================================
// Rule Builders
// =========================================================================

function createPIIRule(
  framework: ComplianceFramework,
  piiTypes: Set<string>,
  severity: Severity,
  recommendation: string
): ComplianceRule {
  return {
    framework,
    id: `${framework}-pii-protection`,
    description: `${framework.toUpperCase()} requires protection of personal data`,
    severity,
    check: (text: string, direction: 'input' | 'output') => {
      const findings = detectPII(text);
      const relevant = findings.filter((f) => piiTypes.has(f.type));
      if (relevant.length === 0) return null;

      const types = [...new Set(relevant.map((f) => f.type))].join(', ');
      return {
        framework,
        rule: `${framework}-pii-protection`,
        severity,
        message: `${framework.toUpperCase()} violation: ${direction} contains unprotected PII (${types})`,
        recommendation,
      };
    },
  };
}

// =========================================================================
// Compliance Rules Registry
// =========================================================================

const COMPLIANCE_RULES: ComplianceRule[] = [
  // -- HIPAA --
  createPIIRule(
    'hipaa',
    HIPAA_PII_TYPES,
    'critical',
    'Redact or remove all PHI before processing. Use the PII redaction mode.'
  ),
  {
    framework: 'hipaa',
    id: 'hipaa-phi-in-output',
    description: 'HIPAA prohibits disclosing PHI in AI responses',
    severity: 'critical',
    check: (text, direction) => {
      if (direction !== 'output') return null;
      const hasPhiTerms = MEDICAL_TERMS.test(text);
      MEDICAL_TERMS.lastIndex = 0;
      const hasPiiData = hasPII(text);
      if (hasPhiTerms && hasPiiData) {
        return {
          framework: 'hipaa',
          rule: 'hipaa-phi-in-output',
          severity: 'critical',
          message: 'HIPAA violation: AI output contains medical context combined with personal data',
          recommendation: 'Enable PII redaction mode and ensure no PHI is included in agent responses.',
        };
      }
      return null;
    },
  },
  {
    framework: 'hipaa',
    id: 'hipaa-medical-disclaimer',
    description: 'HIPAA requires medical advice to include disclaimers',
    severity: 'high',
    check: (text, direction) => {
      if (direction !== 'output') return null;
      MEDICAL_DISCLAIMER_NEEDED.lastIndex = 0;
      if (MEDICAL_DISCLAIMER_NEEDED.test(text)) {
        const hasDisclaimer = /\b(?:not\s+(?:a\s+)?(?:medical|health)\s+advice|consult\s+(?:a\s+|your\s+)?(?:doctor|physician|healthcare\s+(?:provider|professional))|seek\s+(?:medical|professional)\s+(?:advice|help|attention))\b/gi.test(text);
        if (!hasDisclaimer) {
          return {
            framework: 'hipaa',
            rule: 'hipaa-medical-disclaimer',
            severity: 'high',
            message: 'HIPAA compliance: medical guidance without disclaimer detected in output',
            recommendation: 'Add a disclaimer that AI output is not medical advice and users should consult a healthcare professional.',
          };
        }
      }
      return null;
    },
  },

  // -- GDPR --
  createPIIRule(
    'gdpr',
    GDPR_PII_TYPES,
    'critical',
    'GDPR requires explicit consent for processing personal data. Redact PII or obtain consent.'
  ),
  {
    framework: 'gdpr',
    id: 'gdpr-data-minimization',
    description: 'GDPR requires data minimization (only collect necessary data)',
    severity: 'high',
    check: (text, direction) => {
      if (direction !== 'input') return null;
      const findings = detectPII(text);
      if (findings.length >= 4) {
        const types = new Set(findings.map((f) => f.type));
        if (types.size >= 3) {
          return {
            framework: 'gdpr',
            rule: 'gdpr-data-minimization',
            severity: 'high',
            message: `GDPR data minimization: input contains ${types.size} different types of personal data (${[...types].join(', ')})`,
            recommendation: 'Minimize personal data collection. Only include data necessary for the specific task.',
          };
        }
      }
      return null;
    },
  },
  {
    framework: 'gdpr',
    id: 'gdpr-right-to-erasure',
    description: 'GDPR requires supporting the right to erasure',
    severity: 'medium',
    check: (text, direction) => {
      if (direction !== 'input') return null;
      const erasureRequest = /\b(?:delete\s+(?:my|all)\s+(?:data|information|records?|personal)|right\s+to\s+(?:be\s+forgotten|erasure|deletion)|remove\s+(?:my|all)\s+(?:personal\s+)?(?:data|information)|GDPR\s+(?:deletion|erasure)\s+request)\b/gi;
      if (erasureRequest.test(text)) {
        return {
          framework: 'gdpr',
          rule: 'gdpr-right-to-erasure',
          severity: 'medium',
          message: 'GDPR: data erasure request detected - ensure proper handling',
          recommendation: 'Route erasure requests to your data controller. Do not process further until confirmed.',
        };
      }
      return null;
    },
  },

  // -- CCPA --
  {
    framework: 'ccpa',
    id: 'ccpa-personal-info',
    description: 'CCPA protects California consumer personal information',
    severity: 'high',
    check: (text, direction) => {
      const findings = detectPII(text);
      if (findings.length === 0) return null;
      const types = [...new Set(findings.map((f) => f.type))].join(', ');
      return {
        framework: 'ccpa',
        rule: 'ccpa-personal-info',
        severity: 'high',
        message: `CCPA violation: ${direction} contains personal information (${types})`,
        recommendation: 'Ensure consumer consent before collecting personal information. Provide opt-out options.',
      };
    },
  },
  {
    framework: 'ccpa',
    id: 'ccpa-sale-of-data',
    description: 'CCPA restricts sale of personal information',
    severity: 'critical',
    check: (text, direction) => {
      const salePattern = /\b(?:sell\s+(?:your|their|consumer|user|customer)\s+(?:data|information|records?)|data\s+(?:sale|selling|broker)|monetize\s+(?:user|personal)\s+(?:data|information))\b/gi;
      if (salePattern.test(text)) {
        return {
          framework: 'ccpa',
          rule: 'ccpa-sale-of-data',
          severity: 'critical',
          message: 'CCPA violation: content references sale of personal information',
          recommendation: 'Do not facilitate sale of personal information. Honor consumer opt-out requests.',
        };
      }
      return null;
    },
  },

  // -- SEC --
  createPIIRule(
    'sec',
    SEC_PII_TYPES,
    'high',
    'SEC regulations require protection of client financial data.'
  ),
  {
    framework: 'sec',
    id: 'sec-insider-trading',
    description: 'SEC prohibits sharing material non-public information',
    severity: 'critical',
    check: (text, _direction) => {
      FINANCIAL_TERMS.lastIndex = 0;
      if (FINANCIAL_TERMS.test(text)) {
        return {
          framework: 'sec',
          rule: 'sec-insider-trading',
          severity: 'critical',
          message: 'SEC violation: content may contain material non-public information or market manipulation references',
          recommendation: 'Do not share insider information through AI agents. All financial communications must comply with SEC regulations.',
        };
      }
      return null;
    },
  },
  {
    framework: 'sec',
    id: 'sec-investment-disclaimer',
    description: 'SEC requires investment advice to include disclaimers',
    severity: 'high',
    check: (text, direction) => {
      if (direction !== 'output') return null;
      INVESTMENT_DISCLAIMER_NEEDED.lastIndex = 0;
      if (INVESTMENT_DISCLAIMER_NEEDED.test(text)) {
        const hasDisclaimer = /\b(?:not\s+(?:financial|investment)\s+advice|consult\s+(?:a\s+)?(?:financial\s+)?advisor|past\s+performance\s+(?:is\s+)?(?:not|no)\s+(?:guarantee|indicator)|investments?\s+(?:carry|involve)\s+risk)\b/gi.test(text);
        if (!hasDisclaimer) {
          return {
            framework: 'sec',
            rule: 'sec-investment-disclaimer',
            severity: 'high',
            message: 'SEC compliance: investment guidance without disclaimer detected in output',
            recommendation: 'Add a disclaimer that output is not financial advice and users should consult a qualified financial advisor.',
          };
        }
      }
      return null;
    },
  },

  // -- PCI --
  createPIIRule(
    'pci',
    PCI_PII_TYPES,
    'critical',
    'PCI-DSS prohibits storing or transmitting cardholder data in plaintext.'
  ),
  {
    framework: 'pci',
    id: 'pci-card-storage',
    description: 'PCI-DSS prohibits plaintext card data storage',
    severity: 'critical',
    check: (text, _direction) => {
      const cvvPattern = /\b(?:CVV|CVC|CVV2|CVC2|security\s+code)[:\s]*\d{3,4}\b/gi;
      const pinPattern = /\b(?:PIN|personal\s+identification\s+number)[:\s]*\d{4,6}\b/gi;
      if (cvvPattern.test(text) || pinPattern.test(text)) {
        return {
          framework: 'pci',
          rule: 'pci-card-storage',
          severity: 'critical',
          message: 'PCI-DSS violation: CVV/PIN data detected in plaintext',
          recommendation: 'Never store or transmit CVV, CVC, or PIN data. These must never be retained after authorization.',
        };
      }
      return null;
    },
  },

  // -- FERPA --
  createPIIRule(
    'ferpa',
    FERPA_PII_TYPES,
    'high',
    'FERPA requires protection of student education records. Redact PII before processing.'
  ),
  {
    framework: 'ferpa',
    id: 'ferpa-education-records',
    description: 'FERPA prohibits unauthorized disclosure of education records',
    severity: 'critical',
    check: (text, direction) => {
      if (direction !== 'output') return null;
      STUDENT_RECORD_TERMS.lastIndex = 0;
      const hasStudentTerms = STUDENT_RECORD_TERMS.test(text);
      const hasPiiData = hasPII(text);
      if (hasStudentTerms && hasPiiData) {
        return {
          framework: 'ferpa',
          rule: 'ferpa-education-records',
          severity: 'critical',
          message: 'FERPA violation: output contains student records combined with personal data',
          recommendation: 'Do not disclose student education records without proper authorization. Enable PII redaction.',
        };
      }
      return null;
    },
  },

  // -- SOX --
  {
    framework: 'sox',
    id: 'sox-financial-integrity',
    description: 'SOX requires accuracy and integrity of financial data',
    severity: 'high',
    check: (text, direction) => {
      if (direction !== 'output') return null;
      SOX_TERMS.lastIndex = 0;
      if (SOX_TERMS.test(text)) {
        const hasDisclaimer = /\b(?:unaudited|preliminary|subject\s+to\s+(?:review|audit)|for\s+informational\s+purposes|AI[\s-]generated|not\s+(?:a\s+)?(?:certified|audited)\s+(?:financial\s+)?(?:statement|report))\b/gi.test(text);
        if (!hasDisclaimer) {
          return {
            framework: 'sox',
            rule: 'sox-financial-integrity',
            severity: 'high',
            message: 'SOX compliance: financial data in output without accuracy disclaimer',
            recommendation: 'AI-generated financial data must be clearly labeled as unaudited/preliminary and not a substitute for certified financial statements.',
          };
        }
      }
      return null;
    },
  },
  {
    framework: 'sox',
    id: 'sox-internal-controls',
    description: 'SOX requires internal control documentation',
    severity: 'medium',
    check: (text, _direction) => {
      const controlBypass = /\b(?:bypass\s+(?:internal\s+)?(?:control|audit|approval)|skip\s+(?:the\s+)?(?:review|approval)\s+(?:process|step)|override\s+(?:financial\s+)?(?:control|approval|authorization))\b/gi;
      if (controlBypass.test(text)) {
        return {
          framework: 'sox',
          rule: 'sox-internal-controls',
          severity: 'medium',
          message: 'SOX compliance: content suggests bypassing internal controls',
          recommendation: 'All financial processes must follow established internal controls. Do not bypass approval workflows.',
        };
      }
      return null;
    },
  },
];

// =========================================================================
// Public API
// =========================================================================

/**
 * Check content against specified compliance frameworks.
 */
export function checkCompliance(
  text: string,
  frameworks: ComplianceFramework[],
  direction: 'input' | 'output' = 'input'
): ComplianceResult {
  const frameworkSet = new Set(frameworks);
  const violations: ComplianceViolation[] = [];

  for (const rule of COMPLIANCE_RULES) {
    if (!frameworkSet.has(rule.framework)) continue;

    const violation = rule.check(text, direction);
    if (violation) {
      violations.push(violation);
    }
  }

  return {
    compliant: violations.length === 0,
    violations,
    frameworksChecked: frameworks,
  };
}

/**
 * Get all available compliance frameworks.
 */
export function getAvailableFrameworks(): ComplianceFramework[] {
  return ['hipaa', 'gdpr', 'ccpa', 'sec', 'pci', 'ferpa', 'sox'];
}

/**
 * Get rules for a specific framework.
 */
export function getFrameworkRules(framework: ComplianceFramework): Array<{ id: string; description: string; severity: Severity }> {
  return COMPLIANCE_RULES
    .filter((r) => r.framework === framework)
    .map((r) => ({ id: r.id, description: r.description, severity: r.severity }));
}

/**
 * Quick check: is the text compliant with the given frameworks?
 */
export function isCompliant(
  text: string,
  frameworks: ComplianceFramework[],
  direction: 'input' | 'output' = 'input'
): boolean {
  return checkCompliance(text, frameworks, direction).compliant;
}
