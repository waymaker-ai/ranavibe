// ---------------------------------------------------------------------------
// @waymakerai/aicofounder-validator-registry - Built-in validators
// ---------------------------------------------------------------------------

import type { Validator } from './types.js';

export const BUILTIN_VALIDATORS: Validator[] = [
  // --- PII ---
  {
    id: 'email-validator',
    name: 'Email Address Detector',
    description: 'Detects email addresses in text',
    category: 'pii',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['pii', 'email', 'contact'],
    severity: 'high',
    priority: 10,
    definition: {
      type: 'pattern',
      pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
      flags: 'gi',
    },
  },
  {
    id: 'ssn-validator',
    name: 'SSN Detector',
    description: 'Detects US Social Security Numbers (XXX-XX-XXXX format)',
    category: 'pii',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['pii', 'ssn', 'government-id'],
    severity: 'critical',
    priority: 5,
    definition: {
      type: 'pattern',
      pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
      flags: 'g',
    },
  },
  {
    id: 'credit-card-validator',
    name: 'Credit Card Detector',
    description: 'Detects credit card numbers (13-19 digit sequences with optional separators)',
    category: 'pii',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['pii', 'financial', 'credit-card'],
    severity: 'critical',
    priority: 5,
    definition: {
      type: 'function',
      detect: (input: string) => {
        const matches: Array<{ text: string; start: number; end: number }> = [];
        // Match sequences of 13-19 digits with optional spaces or dashes
        const pattern = /\b(?:\d[ -]*?){13,19}\b/g;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(input)) !== null) {
          const digits = match[0].replace(/[^0-9]/g, '');
          // Luhn check
          if (digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)) {
            matches.push({
              text: match[0],
              start: match.index,
              end: match.index + match[0].length,
            });
          }
        }
        return {
          detected: matches.length > 0,
          matches,
          message: matches.length > 0
            ? `Found ${matches.length} credit card number(s)`
            : 'No credit card numbers found',
        };
      },
    },
  },
  {
    id: 'phone-validator',
    name: 'Phone Number Detector',
    description: 'Detects US and international phone numbers',
    category: 'pii',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['pii', 'phone', 'contact'],
    severity: 'high',
    priority: 10,
    definition: {
      type: 'pattern',
      pattern:
        '(?:\\+?1[-. ]?)?(?:\\(?\\d{3}\\)?[-. ]?)?\\d{3}[-. ]?\\d{4}\\b',
      flags: 'g',
    },
  },

  // --- Toxicity ---
  {
    id: 'profanity-filter',
    name: 'Profanity Filter',
    description: 'Detects common profanity and offensive language',
    category: 'toxicity',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['toxicity', 'profanity', 'content-safety'],
    severity: 'medium',
    priority: 20,
    definition: {
      type: 'pattern',
      pattern:
        '\\b(fuck|shit|damn|ass|hell|crap|bastard|bitch|asshole|dickhead|dumbass|bullshit|piss)\\b',
      flags: 'gi',
    },
  },

  // --- Injection ---
  {
    id: 'prompt-injection-validator',
    name: 'Prompt Injection Detector',
    description: 'Detects common prompt injection patterns',
    category: 'injection',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['injection', 'security', 'prompt'],
    severity: 'critical',
    priority: 1,
    definition: {
      type: 'pattern',
      pattern:
        '(?:ignore\\s+(?:previous|above|all|prior)\\s+(?:instructions?|rules?|prompts?)|you\\s+are\\s+now|from\\s+now\\s+on\\s+you|forget\\s+(?:everything|all|your)\\s+(?:previous|instructions?)|system\\s*:\\s*override|\\[\\s*SYSTEM\\s*\\]|<\\s*system\\s*>)',
      flags: 'gi',
    },
  },

  // --- Domain-specific ---
  {
    id: 'medical-terms',
    name: 'Medical Terminology Detector',
    description: 'Detects medical terms, diagnoses, and drug names that may require disclaimers',
    category: 'domain-specific',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['medical', 'healthcare', 'compliance'],
    severity: 'medium',
    priority: 30,
    definition: {
      type: 'pattern',
      pattern:
        '\\b(diagnosis|prognosis|prescription|dosage|medication|treatment|symptom|chronic|acute|benign|malignant|metastasis|biopsy|chemotherapy|radiotherapy|antibiotic|opioid|insulin|vaccine|surgery|transplant)\\b',
      flags: 'gi',
    },
  },
  {
    id: 'financial-terms',
    name: 'Financial Terminology Detector',
    description: 'Detects financial advice-related terms that may require disclaimers',
    category: 'domain-specific',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['financial', 'investment', 'compliance'],
    severity: 'medium',
    priority: 30,
    definition: {
      type: 'pattern',
      pattern:
        '\\b(invest(?:ment)?|stock|bond|portfolio|dividend|securities|hedge\\s+fund|mutual\\s+fund|ETF|cryptocurrency|bitcoin|ethereum|forex|trading|capital\\s+gains|tax\\s+(?:advice|planning)|retirement|401k|IRA|annuity)\\b',
      flags: 'gi',
    },
  },
  {
    id: 'legal-terms',
    name: 'Legal Terminology Detector',
    description: 'Detects legal terms that may require disclaimers or professional referral',
    category: 'domain-specific',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['legal', 'compliance', 'liability'],
    severity: 'medium',
    priority: 30,
    definition: {
      type: 'pattern',
      pattern:
        '\\b(legal\\s+advice|attorney|lawyer|lawsuit|litigation|court\\s+order|subpoena|deposition|plaintiff|defendant|liability|negligence|tort|contract\\s+law|intellectual\\s+property|copyright\\s+infringement|trademark)\\b',
      flags: 'gi',
    },
  },

  // --- Compliance ---
  {
    id: 'hipaa-phi-validator',
    name: 'HIPAA PHI Detector',
    description: 'Detects Protected Health Information identifiers per HIPAA Safe Harbor',
    category: 'compliance',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['hipaa', 'phi', 'healthcare', 'compliance'],
    severity: 'critical',
    priority: 5,
    definition: {
      type: 'pattern',
      pattern:
        '(?:\\b(?:patient|member|subscriber)\\s*(?:id|number|#)\\s*:?\\s*[A-Z0-9-]+\\b|\\bMRN\\s*:?\\s*\\d+\\b|\\bDOB\\s*:?\\s*\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2,4}\\b)',
      flags: 'gi',
    },
  },

  // --- Quality ---
  {
    id: 'url-validator',
    name: 'URL Detector',
    description: 'Detects URLs in text for review or filtering',
    category: 'quality',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['url', 'link', 'quality'],
    severity: 'info',
    priority: 50,
    definition: {
      type: 'pattern',
      pattern: 'https?://[^\\s<>\"]+',
      flags: 'gi',
    },
  },
  {
    id: 'ip-address-validator',
    name: 'IP Address Detector',
    description: 'Detects IPv4 addresses in text',
    category: 'pii',
    version: '1.0.0',
    author: 'cofounder',
    tags: ['pii', 'network', 'ip'],
    severity: 'medium',
    priority: 15,
    definition: {
      type: 'pattern',
      pattern:
        '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
      flags: 'g',
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function luhnCheck(num: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}
