import type { PIIFinding, PIIType } from '../types.js';

interface PIIPattern {
  type: PIIType;
  pattern: RegExp;
  confidence: number;
  redactLabel: string;
  validate?: (match: string) => boolean;
}

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

const PII_PATTERNS: PIIPattern[] = [
  {
    type: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    confidence: 0.95,
    redactLabel: '[REDACTED_EMAIL]',
  },
  {
    type: 'ssn',
    pattern: /\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b/g,
    confidence: 0.9,
    redactLabel: '[REDACTED_SSN]',
    validate: (match: string) => {
      const digits = match.replace(/\D/g, '');
      return digits.length === 9;
    },
  },
  {
    type: 'credit_card',
    pattern:
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|2(?:2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|3(?:0[0-5]|[68][0-9])[0-9]{11})\b/g,
    confidence: 0.92,
    redactLabel: '[REDACTED_CARD]',
    validate: (match: string) => luhnCheck(match),
  },
  {
    type: 'credit_card',
    pattern:
      /\b(?:4[0-9]{3}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}|5[1-5][0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}|3[47][0-9]{2}[-\s]?[0-9]{6}[-\s]?[0-9]{5})\b/g,
    confidence: 0.9,
    redactLabel: '[REDACTED_CARD]',
    validate: (match: string) => luhnCheck(match),
  },
  {
    type: 'phone',
    pattern:
      /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    confidence: 0.8,
    redactLabel: '[REDACTED_PHONE]',
    validate: (match: string) => {
      const digits = match.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 11;
    },
  },
  {
    type: 'phone',
    pattern: /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
    confidence: 0.85,
    redactLabel: '[REDACTED_PHONE]',
  },
  {
    type: 'ip_address',
    pattern:
      /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    confidence: 0.85,
    redactLabel: '[REDACTED_IP]',
  },
  {
    type: 'ip_address',
    pattern:
      /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
    confidence: 0.9,
    redactLabel: '[REDACTED_IPV6]',
  },
  {
    type: 'date_of_birth',
    pattern:
      /\b(?:(?:0[1-9]|1[0-2])[\/\-](?:0[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}|(?:19|20)\d{2}[\/\-](?:0[1-9]|1[0-2])[\/\-](?:0[1-9]|[12]\d|3[01]))\b/g,
    confidence: 0.75,
    redactLabel: '[REDACTED_DOB]',
  },
  {
    type: 'date_of_birth',
    pattern:
      /\b(?:born\s+(?:on\s+)?|date\s+of\s+birth[:\s]+|dob[:\s]+)[\w\s,]+\d{4}\b/gi,
    confidence: 0.85,
    redactLabel: '[REDACTED_DOB]',
  },
  {
    type: 'address',
    pattern:
      /\b\d{1,5}\s+(?:[A-Z][a-z]+\s?){1,3}(?:St(?:reet)?|Ave(?:nue)?|Blvd|Boulevard|Dr(?:ive)?|Ln|Lane|Rd|Road|Ct|Court|Pl(?:ace)?|Way|Cir(?:cle)?|Pkwy|Parkway)\.?\b/gi,
    confidence: 0.7,
    redactLabel: '[REDACTED_ADDRESS]',
  },
  {
    type: 'address',
    pattern: /\bP\.?O\.?\s*Box\s+\d+\b/gi,
    confidence: 0.85,
    redactLabel: '[REDACTED_ADDRESS]',
  },
  {
    type: 'medical_record',
    pattern: /\b(?:MRN|Medical\s+Record)[:\s#]*[A-Z0-9]{6,12}\b/gi,
    confidence: 0.88,
    redactLabel: '[REDACTED_MRN]',
  },
  {
    type: 'passport',
    pattern: /\b(?:passport)[:\s#]*[A-Z0-9]{6,9}\b/gi,
    confidence: 0.8,
    redactLabel: '[REDACTED_PASSPORT]',
  },
  {
    type: 'drivers_license',
    pattern: /\b(?:driver'?s?\s*license|DL)[:\s#]*[A-Z0-9]{5,15}\b/gi,
    confidence: 0.75,
    redactLabel: '[REDACTED_DL]',
  },
];

export function detectPII(text: string): PIIFinding[] {
  const findings: PIIFinding[] = [];
  const seen = new Set<string>();

  for (const def of PII_PATTERNS) {
    const regex = new RegExp(def.pattern.source, def.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const value = match[0];
      const key = `${def.type}:${match.index}:${value}`;

      if (seen.has(key)) continue;
      if (def.validate && !def.validate(value)) continue;

      seen.add(key);
      findings.push({
        type: def.type,
        value,
        redacted: def.redactLabel,
        start: match.index,
        end: match.index + value.length,
        confidence: def.confidence,
      });
    }
  }

  return findings.sort((a, b) => a.start - b.start);
}

export function redactPII(text: string): { redacted: string; findings: PIIFinding[] } {
  const findings = detectPII(text);
  let redacted = text;
  let offset = 0;

  for (const finding of findings) {
    const start = finding.start + offset;
    const end = finding.end + offset;
    redacted = redacted.slice(0, start) + finding.redacted + redacted.slice(end);
    offset += finding.redacted.length - (finding.end - finding.start);
  }

  return { redacted, findings };
}

export function hasPII(text: string): boolean {
  return detectPII(text).length > 0;
}
