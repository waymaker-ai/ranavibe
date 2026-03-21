/**
 * Built-in catalog of community policy packages.
 */

import type { PolicyPackage } from './types';

export const BUILT_IN_CATALOG: PolicyPackage[] = [
  // -------------------------------------------------------------------------
  // Healthcare
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/healthcare-us',
    version: '2.1.0',
    author: 'RANA Community',
    description: 'HIPAA-compliant policies plus US state-specific healthcare privacy requirements. Covers PHI detection, minimum necessary standard, and breach notification rules.',
    policies: [
      { id: 'hipaa-phi-detection', description: 'Detect and redact Protected Health Information (PHI)', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'hipaa-minimum-necessary', description: 'Enforce minimum necessary standard for PHI disclosure', category: 'pii', severity: 'high', action: 'flag' },
      { id: 'hipaa-authorization', description: 'Require authorization for PHI use beyond treatment/payment/operations', category: 'pii', severity: 'critical', action: 'block' },
      { id: 'state-privacy-ca', description: 'California CMIA additional protections', category: 'pii', severity: 'high', action: 'redact' },
    ],
    tags: ['hipaa', 'healthcare', 'phi', 'medical', 'privacy', 'compliance'],
    downloads: 15200,
    rating: 4.8,
    categories: ['healthcare'],
    installCommand: 'npm install @rana-policies/healthcare-us',
    updatedAt: '2025-12-15T00:00:00Z',
  },
  {
    name: '@rana-policies/healthcare-eu',
    version: '2.0.0',
    author: 'RANA Community',
    description: 'GDPR-compliant healthcare policies with EU medical data protection. Covers patient consent, cross-border data transfer, and special category data handling.',
    policies: [
      { id: 'gdpr-health-data', description: 'Special category processing for health data under GDPR Art. 9', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'gdpr-consent-health', description: 'Explicit consent requirements for medical data processing', category: 'pii', severity: 'critical', action: 'block' },
      { id: 'eu-medical-device', description: 'EU MDR compliance for AI-assisted medical devices', category: 'quality', severity: 'high', action: 'flag' },
    ],
    tags: ['gdpr', 'healthcare', 'eu', 'medical', 'privacy', 'consent'],
    downloads: 9800,
    rating: 4.7,
    categories: ['healthcare'],
    installCommand: 'npm install @rana-policies/healthcare-eu',
    updatedAt: '2025-11-20T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Finance
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/fintech',
    version: '3.0.0',
    author: 'RANA Community',
    description: 'Comprehensive financial services compliance: SEC regulations, PCI DSS card data protection, SOX audit requirements, and AML/KYC screening rules.',
    policies: [
      { id: 'pci-card-detection', description: 'Detect and redact payment card numbers (PCI DSS)', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'sec-material-info', description: 'Flag potential material non-public information disclosure', category: 'confidential', severity: 'critical', action: 'block' },
      { id: 'sox-audit-trail', description: 'Ensure audit trail for financial data interactions', category: 'quality', severity: 'high', action: 'log' },
      { id: 'aml-screening', description: 'Flag content that could facilitate money laundering', category: 'harmful_content', severity: 'critical', action: 'block' },
      { id: 'kyc-pii', description: 'KYC identity data protection', category: 'pii', severity: 'high', action: 'redact' },
    ],
    tags: ['fintech', 'finance', 'pci', 'sec', 'sox', 'aml', 'kyc', 'banking', 'compliance'],
    downloads: 22500,
    rating: 4.9,
    categories: ['finance'],
    installCommand: 'npm install @rana-policies/fintech',
    updatedAt: '2026-01-10T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Education
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/education',
    version: '1.5.0',
    author: 'RANA Community',
    description: 'FERPA student privacy and COPPA child protection policies. Safeguards student education records, parental consent requirements, and age-appropriate content.',
    policies: [
      { id: 'ferpa-student-records', description: 'Protect student education records under FERPA', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'coppa-child-data', description: 'COPPA compliance for children under 13', category: 'pii', severity: 'critical', action: 'block' },
      { id: 'edu-content-safety', description: 'Age-appropriate content filtering for educational contexts', category: 'harmful_content', severity: 'high', action: 'block' },
    ],
    tags: ['education', 'ferpa', 'coppa', 'student', 'privacy', 'children', 'school'],
    downloads: 8400,
    rating: 4.6,
    categories: ['education'],
    installCommand: 'npm install @rana-policies/education',
    updatedAt: '2025-10-05T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Legal
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/legal',
    version: '1.3.0',
    author: 'RANA Community',
    description: 'Attorney-client privilege protection and court filing compliance. Prevents unauthorized disclosure of privileged communications and ensures proper legal document handling.',
    policies: [
      { id: 'attorney-client-privilege', description: 'Detect and protect attorney-client privileged communications', category: 'confidential', severity: 'critical', action: 'block' },
      { id: 'court-filing-pii', description: 'Redact PII from court filings per local rules', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'legal-advice-disclaimer', description: 'Flag AI-generated content that may constitute legal advice', category: 'quality', severity: 'high', action: 'flag' },
    ],
    tags: ['legal', 'attorney', 'privilege', 'court', 'law', 'compliance'],
    downloads: 5600,
    rating: 4.5,
    categories: ['legal'],
    installCommand: 'npm install @rana-policies/legal',
    updatedAt: '2025-09-18T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Government
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/government',
    version: '2.0.0',
    author: 'RANA Community',
    description: 'FISMA and FedRAMP compliance policies for government AI systems. Covers CUI handling, NIST 800-53 controls, and federal data classification.',
    policies: [
      { id: 'fisma-cui', description: 'Controlled Unclassified Information (CUI) handling', category: 'confidential', severity: 'critical', action: 'block' },
      { id: 'fedramp-data-classification', description: 'FedRAMP data classification enforcement', category: 'confidential', severity: 'high', action: 'flag' },
      { id: 'nist-pii-controls', description: 'NIST 800-53 PII controls implementation', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'gov-bias-prevention', description: 'Prevent bias in government AI decision-making', category: 'bias', severity: 'high', action: 'flag' },
    ],
    tags: ['government', 'fisma', 'fedramp', 'nist', 'federal', 'cui', 'compliance'],
    downloads: 7200,
    rating: 4.7,
    categories: ['government'],
    installCommand: 'npm install @rana-policies/government',
    updatedAt: '2025-11-01T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Insurance
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/insurance',
    version: '1.2.0',
    author: 'RANA Community',
    description: 'Insurance industry compliance covering state regulations, underwriting fairness, and claims processing privacy requirements.',
    policies: [
      { id: 'insurance-pii', description: 'Protect policyholder PII in claims and underwriting', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'insurance-fairness', description: 'Prevent discriminatory underwriting decisions', category: 'bias', severity: 'critical', action: 'block' },
      { id: 'insurance-state-regs', description: 'State insurance regulation compliance', category: 'quality', severity: 'high', action: 'flag' },
    ],
    tags: ['insurance', 'underwriting', 'claims', 'privacy', 'fairness', 'compliance'],
    downloads: 3400,
    rating: 4.4,
    categories: ['insurance'],
    installCommand: 'npm install @rana-policies/insurance',
    updatedAt: '2025-08-22T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Real Estate
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/real-estate',
    version: '1.1.0',
    author: 'RANA Community',
    description: 'Fair housing compliance and real estate advertising rules. Prevents discriminatory language and ensures FHA, state, and local fair housing law adherence.',
    policies: [
      { id: 'fha-fair-housing', description: 'Fair Housing Act compliance in listings and communications', category: 'bias', severity: 'critical', action: 'block' },
      { id: 'real-estate-pii', description: 'Protect buyer/seller personal information', category: 'pii', severity: 'high', action: 'redact' },
      { id: 'real-estate-advertising', description: 'HUD advertising guidelines compliance', category: 'quality', severity: 'high', action: 'flag' },
    ],
    tags: ['real-estate', 'fair-housing', 'fha', 'hud', 'property', 'compliance'],
    downloads: 2100,
    rating: 4.3,
    categories: ['real-estate'],
    installCommand: 'npm install @rana-policies/real-estate',
    updatedAt: '2025-07-14T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // HR
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/hr',
    version: '1.4.0',
    author: 'RANA Community',
    description: 'Employment law, ADA accommodation, and workplace compliance. Covers hiring bias prevention, employee data protection, and disability accommodation rules.',
    policies: [
      { id: 'hr-hiring-bias', description: 'Prevent discriminatory language in job descriptions and hiring', category: 'bias', severity: 'critical', action: 'block' },
      { id: 'hr-ada-compliance', description: 'ADA accommodation and disability-related compliance', category: 'bias', severity: 'high', action: 'flag' },
      { id: 'hr-employee-pii', description: 'Employee personal data protection', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'hr-eeoc', description: 'EEOC compliance in workplace communications', category: 'bias', severity: 'high', action: 'flag' },
    ],
    tags: ['hr', 'employment', 'ada', 'eeoc', 'hiring', 'workplace', 'compliance'],
    downloads: 6300,
    rating: 4.5,
    categories: ['hr'],
    installCommand: 'npm install @rana-policies/hr',
    updatedAt: '2025-10-28T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Marketing
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/marketing',
    version: '1.3.0',
    author: 'RANA Community',
    description: 'FTC advertising compliance, CAN-SPAM email rules, and TCPA telemarketing protections. Ensures truthful advertising and proper consent management.',
    policies: [
      { id: 'ftc-truth-advertising', description: 'FTC truth-in-advertising compliance', category: 'quality', severity: 'high', action: 'flag' },
      { id: 'can-spam', description: 'CAN-SPAM Act compliance for email marketing', category: 'quality', severity: 'high', action: 'flag' },
      { id: 'tcpa-consent', description: 'TCPA consent requirements for automated communications', category: 'quality', severity: 'critical', action: 'block' },
      { id: 'marketing-pii', description: 'Customer PII protection in marketing materials', category: 'pii', severity: 'high', action: 'redact' },
    ],
    tags: ['marketing', 'ftc', 'can-spam', 'tcpa', 'advertising', 'email', 'compliance'],
    downloads: 4800,
    rating: 4.4,
    categories: ['marketing'],
    installCommand: 'npm install @rana-policies/marketing',
    updatedAt: '2025-09-30T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // SaaS
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/saas-basic',
    version: '2.0.0',
    author: 'RANA Community',
    description: 'Basic safety and GDPR compliance for SaaS applications. Starter pack covering essential content safety, PII protection, and GDPR data subject rights.',
    policies: [
      { id: 'saas-content-safety', description: 'Basic harmful content filtering', category: 'harmful_content', severity: 'high', action: 'block' },
      { id: 'saas-pii-basic', description: 'Basic PII detection and redaction', category: 'pii', severity: 'high', action: 'redact' },
      { id: 'saas-gdpr-basics', description: 'GDPR data subject rights compliance', category: 'pii', severity: 'high', action: 'flag' },
    ],
    tags: ['saas', 'gdpr', 'safety', 'starter', 'basic', 'privacy'],
    downloads: 31000,
    rating: 4.6,
    categories: ['enterprise', 'safety'],
    installCommand: 'npm install @rana-policies/saas-basic',
    updatedAt: '2026-01-05T00:00:00Z',
  },
  {
    name: '@rana-policies/saas-enterprise',
    version: '2.5.0',
    author: 'RANA Community',
    description: 'Enterprise-grade SaaS compliance with SOC 2, GDPR, and comprehensive safety. Includes data retention, access controls, audit logging, and advanced content filtering.',
    policies: [
      { id: 'soc2-data-protection', description: 'SOC 2 data protection controls', category: 'confidential', severity: 'critical', action: 'block' },
      { id: 'soc2-audit-logging', description: 'SOC 2 audit logging requirements', category: 'quality', severity: 'high', action: 'log' },
      { id: 'enterprise-gdpr', description: 'Full GDPR compliance suite', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'enterprise-safety', description: 'Comprehensive content safety filtering', category: 'harmful_content', severity: 'critical', action: 'block' },
      { id: 'enterprise-injection', description: 'Advanced prompt injection detection', category: 'injection', severity: 'critical', action: 'block' },
    ],
    tags: ['saas', 'enterprise', 'soc2', 'gdpr', 'safety', 'compliance', 'audit'],
    downloads: 18700,
    rating: 4.8,
    categories: ['enterprise', 'safety'],
    installCommand: 'npm install @rana-policies/saas-enterprise',
    updatedAt: '2026-02-01T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // AI Safety
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/ai-safety-strict',
    version: '3.0.0',
    author: 'RANA Community',
    description: 'Maximum safety configuration for AI systems. Zero-tolerance policies for harmful content, PII exposure, prompt injection, bias, and hallucination. Recommended for high-risk deployments.',
    policies: [
      { id: 'strict-harmful', description: 'Block all harmful content categories', category: 'harmful_content', severity: 'critical', action: 'block' },
      { id: 'strict-pii', description: 'Redact all PII with no exceptions', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'strict-injection', description: 'Block all prompt injection attempts', category: 'injection', severity: 'critical', action: 'block' },
      { id: 'strict-toxicity', description: 'Zero-tolerance toxicity filtering', category: 'toxicity', severity: 'critical', action: 'block' },
      { id: 'strict-bias', description: 'Strict bias detection and blocking', category: 'bias', severity: 'critical', action: 'block' },
      { id: 'strict-hallucination', description: 'Flag any detected hallucination', category: 'hallucination', severity: 'high', action: 'flag' },
    ],
    tags: ['safety', 'strict', 'maximum', 'zero-tolerance', 'high-risk', 'ai-safety'],
    downloads: 12400,
    rating: 4.7,
    categories: ['safety'],
    installCommand: 'npm install @rana-policies/ai-safety-strict',
    updatedAt: '2026-01-20T00:00:00Z',
  },
  {
    name: '@rana-policies/ai-safety-balanced',
    version: '2.0.0',
    author: 'RANA Community',
    description: 'Practical, balanced safety for production AI. Blocks clearly harmful content while allowing nuanced discussion. Good default for most consumer-facing applications.',
    policies: [
      { id: 'balanced-harmful', description: 'Block clearly harmful content', category: 'harmful_content', severity: 'high', action: 'block' },
      { id: 'balanced-pii', description: 'Redact common PII types', category: 'pii', severity: 'high', action: 'redact' },
      { id: 'balanced-injection', description: 'Block obvious prompt injection', category: 'injection', severity: 'high', action: 'block' },
      { id: 'balanced-toxicity', description: 'Flag toxic content for review', category: 'toxicity', severity: 'medium', action: 'flag' },
    ],
    tags: ['safety', 'balanced', 'practical', 'production', 'default', 'ai-safety'],
    downloads: 28900,
    rating: 4.8,
    categories: ['safety'],
    installCommand: 'npm install @rana-policies/ai-safety-balanced',
    updatedAt: '2026-02-10T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Child Safety
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/child-safety',
    version: '2.2.0',
    author: 'RANA Community',
    description: 'COPPA compliance with extra protections for platforms serving minors. Includes age verification, parental consent, data minimization, and content filtering tuned for child safety.',
    policies: [
      { id: 'coppa-data-collection', description: 'COPPA restrictions on data collection from children', category: 'pii', severity: 'critical', action: 'block' },
      { id: 'child-content-filter', description: 'Enhanced content filtering for child-facing applications', category: 'harmful_content', severity: 'critical', action: 'block' },
      { id: 'child-sexual-content', description: 'Zero-tolerance for sexual content in child contexts', category: 'sexual_content', severity: 'critical', action: 'block' },
      { id: 'child-violence', description: 'Block violent content for child audiences', category: 'violence', severity: 'critical', action: 'block' },
      { id: 'child-data-minimization', description: 'Minimize data collected from minors', category: 'pii', severity: 'high', action: 'redact' },
    ],
    tags: ['child-safety', 'coppa', 'minors', 'children', 'parental-consent', 'safety'],
    downloads: 7800,
    rating: 4.9,
    categories: ['safety', 'education'],
    installCommand: 'npm install @rana-policies/child-safety',
    updatedAt: '2025-12-01T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Content Moderation
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/content-moderation',
    version: '2.1.0',
    author: 'RANA Community',
    description: 'Social media and UGC content moderation policies. Covers hate speech, harassment, misinformation, spam, and platform-specific community guidelines.',
    policies: [
      { id: 'mod-hate-speech', description: 'Detect and block hate speech', category: 'hate_speech', severity: 'critical', action: 'block' },
      { id: 'mod-harassment', description: 'Detect targeted harassment and bullying', category: 'toxicity', severity: 'high', action: 'block' },
      { id: 'mod-misinformation', description: 'Flag potential misinformation', category: 'hallucination', severity: 'medium', action: 'flag' },
      { id: 'mod-spam', description: 'Detect spam and low-quality content', category: 'quality', severity: 'medium', action: 'flag' },
      { id: 'mod-self-harm', description: 'Detect self-harm and suicide content', category: 'self_harm', severity: 'critical', action: 'block' },
    ],
    tags: ['content-moderation', 'social-media', 'ugc', 'hate-speech', 'harassment', 'safety'],
    downloads: 16500,
    rating: 4.6,
    categories: ['content-moderation', 'safety'],
    installCommand: 'npm install @rana-policies/content-moderation',
    updatedAt: '2025-11-15T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Customer Support
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/customer-support',
    version: '1.5.0',
    author: 'RANA Community',
    description: 'Brand safety and quality control for AI-powered customer support. Ensures on-brand responses, prevents unauthorized promises, and protects customer data.',
    policies: [
      { id: 'cs-brand-safety', description: 'Ensure responses align with brand voice and values', category: 'quality', severity: 'medium', action: 'flag' },
      { id: 'cs-unauthorized-promises', description: 'Block unauthorized commitments or promises', category: 'quality', severity: 'high', action: 'block' },
      { id: 'cs-customer-pii', description: 'Protect customer PII in support interactions', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'cs-escalation', description: 'Detect situations requiring human escalation', category: 'quality', severity: 'high', action: 'flag' },
    ],
    tags: ['customer-support', 'brand-safety', 'chatbot', 'support', 'quality'],
    downloads: 11200,
    rating: 4.5,
    categories: ['customer-support', 'enterprise'],
    installCommand: 'npm install @rana-policies/customer-support',
    updatedAt: '2025-10-10T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Code Generation
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/code-generation',
    version: '1.8.0',
    author: 'RANA Community',
    description: 'Secure coding policies for AI code generation. Prevents injection vulnerabilities, secrets in code, insecure patterns, and license-violating code snippets.',
    policies: [
      { id: 'code-injection-prevention', description: 'Prevent SQL/XSS/command injection in generated code', category: 'injection', severity: 'critical', action: 'block' },
      { id: 'code-secrets-detection', description: 'Detect hardcoded secrets, API keys, and passwords', category: 'confidential', severity: 'critical', action: 'redact' },
      { id: 'code-insecure-patterns', description: 'Flag insecure coding patterns (eval, unsafe deserialization)', category: 'quality', severity: 'high', action: 'flag' },
      { id: 'code-license-compliance', description: 'Flag potential license-violating code', category: 'copyright', severity: 'high', action: 'flag' },
    ],
    tags: ['code-generation', 'security', 'secure-coding', 'vulnerabilities', 'secrets'],
    downloads: 19800,
    rating: 4.7,
    categories: ['code-generation', 'safety'],
    installCommand: 'npm install @rana-policies/code-generation',
    updatedAt: '2026-01-25T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Data Analytics
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/data-analytics',
    version: '1.2.0',
    author: 'RANA Community',
    description: 'Data anonymization and privacy policies for analytics AI. Ensures k-anonymity, differential privacy compliance, and prevents re-identification attacks.',
    policies: [
      { id: 'analytics-anonymization', description: 'Enforce data anonymization in analytics outputs', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'analytics-reidentification', description: 'Prevent re-identification from aggregated data', category: 'pii', severity: 'high', action: 'block' },
      { id: 'analytics-bias-detection', description: 'Detect statistical bias in analytics results', category: 'bias', severity: 'medium', action: 'flag' },
    ],
    tags: ['data-analytics', 'anonymization', 'privacy', 'differential-privacy', 'statistics'],
    downloads: 4200,
    rating: 4.3,
    categories: ['data-analytics', 'enterprise'],
    installCommand: 'npm install @rana-policies/data-analytics',
    updatedAt: '2025-08-15T00:00:00Z',
  },

  // -------------------------------------------------------------------------
  // Research
  // -------------------------------------------------------------------------
  {
    name: '@rana-policies/research',
    version: '1.1.0',
    author: 'RANA Community',
    description: 'Academic ethics and research integrity policies. Covers IRB compliance, research data handling, citation requirements, and participant privacy.',
    policies: [
      { id: 'research-irb', description: 'IRB compliance for human subjects research', category: 'quality', severity: 'critical', action: 'flag' },
      { id: 'research-participant-privacy', description: 'Protect research participant identity and data', category: 'pii', severity: 'critical', action: 'redact' },
      { id: 'research-citation', description: 'Ensure proper attribution and citation', category: 'copyright', severity: 'medium', action: 'flag' },
      { id: 'research-reproducibility', description: 'Flag non-reproducible claims or methodologies', category: 'hallucination', severity: 'medium', action: 'flag' },
    ],
    tags: ['research', 'academic', 'ethics', 'irb', 'citation', 'integrity'],
    downloads: 3100,
    rating: 4.4,
    categories: ['research'],
    installCommand: 'npm install @rana-policies/research',
    updatedAt: '2025-07-20T00:00:00Z',
  },
];
