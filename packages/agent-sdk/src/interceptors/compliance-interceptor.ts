import type { Interceptor, InterceptorResult, InterceptorContext, ComplianceConfig, ComplianceFramework, Violation } from '../types.js';

interface FrameworkRules {
  name: string;
  rules: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    check: (text: string) => string | null;
  }>;
  disclaimers: string[];
}

const FRAMEWORKS: Record<ComplianceFramework, FrameworkRules> = {
  hipaa: {
    name: 'HIPAA',
    rules: [
      { id: 'hipaa-phi-ssn', description: 'SSN in PHI context', severity: 'critical', check: (t) => /\b\d{3}-\d{2}-\d{4}\b/.test(t) ? 'SSN detected - PHI violation' : null },
      { id: 'hipaa-phi-mrn', description: 'Medical record number', severity: 'critical', check: (t) => /\b(?:MRN|medical\s+record)[:\s#]*[A-Z0-9]{6,}/gi.test(t) ? 'Medical record number detected' : null },
      { id: 'hipaa-phi-diagnosis', description: 'Diagnosis without disclaimer', severity: 'high', check: (t) => /\b(?:diagnosed\s+with|diagnosis[:\s]|prognosis[:\s])\b/gi.test(t) && !/not\s+medical\s+advice/gi.test(t) ? 'Diagnosis without medical disclaimer' : null },
      { id: 'hipaa-phi-prescription', description: 'Prescription recommendation', severity: 'critical', check: (t) => /\b(?:prescribe|take\s+\d+\s*mg|dosage[:\s]|medication[:\s])\b/gi.test(t) && !/consult.*(?:doctor|physician|healthcare)/gi.test(t) ? 'Prescription recommendation without professional referral' : null },
      { id: 'hipaa-phi-insurance', description: 'Insurance ID exposure', severity: 'high', check: (t) => /\b(?:insurance\s+(?:id|number|policy))[:\s#]*[A-Z0-9]{6,}/gi.test(t) ? 'Insurance ID detected' : null },
      { id: 'hipaa-phi-dob', description: 'Date of birth in medical context', severity: 'high', check: (t) => /\b(?:patient|medical).*(?:born|dob|date\s+of\s+birth)/gi.test(t) ? 'Patient DOB in medical context' : null },
    ],
    disclaimers: ['This is not medical advice. Consult a healthcare professional.', 'This information is for educational purposes only.'],
  },
  gdpr: {
    name: 'GDPR',
    rules: [
      { id: 'gdpr-pii-collection', description: 'Unnecessary PII collection', severity: 'high', check: (t) => /\b(?:collect|gather|store)\s+(?:your|their|user)\s+(?:name|email|address|phone|personal)/gi.test(t) && !/consent/gi.test(t) ? 'PII collection without consent reference' : null },
      { id: 'gdpr-data-retention', description: 'Indefinite data retention', severity: 'medium', check: (t) => /\b(?:store|keep|retain)\s+(?:indefinitely|forever|permanently)/gi.test(t) ? 'Indefinite data retention violates data minimization' : null },
      { id: 'gdpr-profiling', description: 'Automated profiling', severity: 'high', check: (t) => /\b(?:profile|categorize|classify)\s+(?:users?|individuals?|people)\s+(?:based\s+on|by|according)/gi.test(t) && !/consent|opt[\s-]?in/gi.test(t) ? 'Automated profiling without consent' : null },
      { id: 'gdpr-cross-border', description: 'Cross-border data transfer', severity: 'high', check: (t) => /\b(?:transfer|send|share)\s+(?:data|information)\s+(?:to|with|outside)\s+(?:third[\s-]?part|another\s+country|overseas)/gi.test(t) ? 'Cross-border data transfer requires safeguards' : null },
    ],
    disclaimers: ['Your data is processed in accordance with GDPR regulations.'],
  },
  ccpa: {
    name: 'CCPA',
    rules: [
      { id: 'ccpa-sale', description: 'Data sale without disclosure', severity: 'critical', check: (t) => /\b(?:sell|trade|monetize)\s+(?:user|customer|personal)\s+(?:data|information)/gi.test(t) && !/opt[\s-]?out|do\s+not\s+sell/gi.test(t) ? 'Data sale without opt-out disclosure' : null },
      { id: 'ccpa-collection', description: 'Undisclosed data collection', severity: 'high', check: (t) => /\b(?:track|monitor|collect)\s+(?:browsing|activity|behavior)/gi.test(t) && !/privacy\s+policy|notice/gi.test(t) ? 'Activity tracking without disclosure' : null },
    ],
    disclaimers: ['California residents have the right to opt-out of the sale of personal information.'],
  },
  sec: {
    name: 'SEC',
    rules: [
      { id: 'sec-advice', description: 'Investment advice without disclaimer', severity: 'critical', check: (t) => /\b(?:you\s+should\s+(?:buy|sell|invest)|guaranteed\s+return|risk[\s-]?free\s+investment|will\s+(?:definitely|certainly)\s+(?:go\s+up|increase|profit))\b/gi.test(t) ? 'Investment advice without disclaimer' : null },
      { id: 'sec-insider', description: 'Material nonpublic information', severity: 'critical', check: (t) => /\b(?:insider\s+(?:info|information|tip|knowledge)|before\s+(?:it's|it\s+is)\s+(?:public|announced)|confidential\s+(?:earnings|merger|acquisition))/gi.test(t) ? 'Possible material nonpublic information' : null },
      { id: 'sec-forward', description: 'Forward-looking without disclaimer', severity: 'high', check: (t) => /\b(?:stock\s+will|price\s+will|shares\s+will)\s+(?:rise|fall|increase|decrease|go\s+up|go\s+down)/gi.test(t) && !/past\s+performance|no\s+guarantee|forward[\s-]?looking/gi.test(t) ? 'Forward-looking statement without disclaimer' : null },
    ],
    disclaimers: ['This is not financial advice. Past performance does not guarantee future results.', 'Consult a qualified financial advisor before making investment decisions.'],
  },
  sox: {
    name: 'SOX',
    rules: [
      { id: 'sox-controls', description: 'Internal control bypass', severity: 'critical', check: (t) => /\b(?:bypass|circumvent|override)\s+(?:internal\s+)?(?:controls?|audit|approval)/gi.test(t) ? 'Suggestion to bypass internal controls' : null },
      { id: 'sox-retention', description: 'Document destruction', severity: 'critical', check: (t) => /\b(?:destroy|shred|delete)\s+(?:financial|accounting|audit)\s+(?:records?|documents?|files?)/gi.test(t) ? 'Suggestion to destroy financial records' : null },
    ],
    disclaimers: ['All financial records must be retained per SOX requirements.'],
  },
  pci: {
    name: 'PCI DSS',
    rules: [
      { id: 'pci-card-data', description: 'Card data exposure', severity: 'critical', check: (t) => /\b4[0-9]{12}(?:[0-9]{3})?\b/.test(t) || /\b5[1-5][0-9]{14}\b/.test(t) || /\b3[47][0-9]{13}\b/.test(t) ? 'Credit card number detected' : null },
      { id: 'pci-cvv', description: 'CVV exposure', severity: 'critical', check: (t) => /\b(?:cvv|cvc|cvv2|security\s+code)[:\s]*\d{3,4}\b/gi.test(t) ? 'CVV/security code detected' : null },
      { id: 'pci-storage', description: 'Card data storage', severity: 'high', check: (t) => /\b(?:store|save|keep|log)\s+(?:credit\s+card|card\s+number|cvv|pan)\b/gi.test(t) ? 'Suggestion to store card data' : null },
    ],
    disclaimers: ['Card data must be handled in compliance with PCI DSS standards.'],
  },
  ferpa: {
    name: 'FERPA',
    rules: [
      { id: 'ferpa-records', description: 'Student record disclosure', severity: 'high', check: (t) => /\b(?:student(?:'s)?\s+(?:grades?|GPA|transcript|disciplinary|record))\b/gi.test(t) && !/authorized|consent|directory\s+information/gi.test(t) ? 'Student record disclosure without authorization' : null },
      { id: 'ferpa-directory', description: 'Non-directory info sharing', severity: 'high', check: (t) => /\b(?:share|disclose|release)\s+(?:student)\s+(?:SSN|social\s+security|financial)/gi.test(t) ? 'Non-directory student information sharing' : null },
    ],
    disclaimers: ['Student records are protected under FERPA.'],
  },
};

export class ComplianceInterceptor implements Interceptor {
  name = 'compliance';
  private config: ComplianceConfig;
  private activeFrameworks: FrameworkRules[];
  violationCount = 0;
  violationsByFramework: Record<string, number> = {};

  constructor(config: ComplianceConfig | true) {
    this.config = config === true ? { frameworks: ['hipaa', 'gdpr', 'ccpa', 'sec'], onViolation: 'block' } : config;
    this.activeFrameworks = this.config.frameworks
      .filter((f) => f in FRAMEWORKS)
      .map((f) => FRAMEWORKS[f]);
  }

  processInput(text: string, _ctx: InterceptorContext): InterceptorResult {
    return this.check(text);
  }

  processOutput(text: string, _ctx: InterceptorContext): InterceptorResult {
    return this.check(text);
  }

  private check(text: string): InterceptorResult {
    const violations: Violation[] = [];

    for (const fw of this.activeFrameworks) {
      for (const rule of fw.rules) {
        const result = rule.check(text);
        if (result) {
          this.violationCount++;
          this.violationsByFramework[fw.name] = (this.violationsByFramework[fw.name] || 0) + 1;
          violations.push({
            interceptor: 'compliance',
            rule: rule.id,
            severity: rule.severity,
            message: `[${fw.name}] ${result}`,
            action: this.config.onViolation || 'block',
            details: { framework: fw.name, ruleId: rule.id },
          });
        }
      }
    }

    if (violations.length === 0) {
      return { allowed: true, blocked: false, violations: [], metadata: {} };
    }

    const hasCritical = violations.some((v) => v.severity === 'critical');
    const action = this.config.onViolation || 'block';

    if (action === 'block' && hasCritical) {
      return {
        allowed: false, blocked: true,
        reason: `Compliance violation: ${violations.map((v) => v.message).join('; ')}`,
        violations,
        metadata: { frameworksViolated: [...new Set(violations.map((v) => (v.details?.framework as string) || ''))] },
      };
    }

    return { allowed: true, blocked: false, violations, metadata: {} };
  }
}
