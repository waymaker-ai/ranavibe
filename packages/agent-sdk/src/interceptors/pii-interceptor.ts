import type { Interceptor, InterceptorResult, InterceptorContext, PIIConfig, PIIType, Violation } from '../types.js';

interface PIIPattern {
  type: PIIType;
  pattern: RegExp;
  confidence: number;
  label: string;
  validate?: (match: string) => boolean;
}

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

const ALL_PATTERNS: PIIPattern[] = [
  { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, confidence: 0.95, label: '[REDACTED_EMAIL]' },
  { type: 'ssn', pattern: /\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b/g, confidence: 0.9, label: '[REDACTED_SSN]', validate: (m) => m.replace(/\D/g, '').length === 9 },
  { type: 'creditCard', pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g, confidence: 0.92, label: '[REDACTED_CARD]', validate: luhnCheck },
  { type: 'creditCard', pattern: /\b(?:4\d{3}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}|5[1-5]\d{2}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4})\b/g, confidence: 0.9, label: '[REDACTED_CARD]', validate: luhnCheck },
  { type: 'phone', pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, confidence: 0.8, label: '[REDACTED_PHONE]', validate: (m) => { const d = m.replace(/\D/g, ''); return d.length >= 10 && d.length <= 11; } },
  { type: 'phone', pattern: /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g, confidence: 0.85, label: '[REDACTED_PHONE]' },
  { type: 'ip', pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g, confidence: 0.85, label: '[REDACTED_IP]' },
  { type: 'dob', pattern: /\b(?:(?:0[1-9]|1[0-2])[\/\-](?:0[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2})\b/g, confidence: 0.75, label: '[REDACTED_DOB]' },
  { type: 'dob', pattern: /\b(?:born\s+(?:on\s+)?|date\s+of\s+birth[:\s]+|dob[:\s]+)[\w\s,]+\d{4}\b/gi, confidence: 0.85, label: '[REDACTED_DOB]' },
  { type: 'address', pattern: /\b\d{1,5}\s+(?:[A-Z][a-z]+\s?){1,3}(?:St(?:reet)?|Ave(?:nue)?|Blvd|Dr(?:ive)?|Ln|Lane|Rd|Road|Ct|Court|Way)\.?\b/gi, confidence: 0.7, label: '[REDACTED_ADDRESS]' },
  { type: 'medical_record', pattern: /\b(?:MRN|Medical\s+Record)[:\s#]*[A-Z0-9]{6,12}\b/gi, confidence: 0.88, label: '[REDACTED_MRN]' },
];

export class PIIInterceptor implements Interceptor {
  name = 'pii';
  private config: PIIConfig;
  private patterns: PIIPattern[];
  private allowSet: Set<string>;

  constructor(config: PIIConfig | true) {
    this.config = config === true ? { mode: 'redact', onDetection: 'redact' } : config;
    this.patterns = this.config.types
      ? ALL_PATTERNS.filter((p) => this.config.types!.includes(p.type))
      : ALL_PATTERNS;
    this.allowSet = new Set(this.config.allowList || []);
  }

  processInput(text: string, _ctx: InterceptorContext): InterceptorResult {
    return this.process(text);
  }

  processOutput(text: string, _ctx: InterceptorContext): InterceptorResult {
    return this.process(text);
  }

  private process(text: string): InterceptorResult {
    const findings: Array<{ type: PIIType; value: string; label: string; start: number; end: number }> = [];
    const violations: Violation[] = [];

    for (const def of this.patterns) {
      const regex = new RegExp(def.pattern.source, def.pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        const value = match[0];
        if (this.allowSet.has(value)) continue;
        if (def.validate && !def.validate(value)) continue;
        findings.push({ type: def.type, value, label: def.label, start: match.index, end: match.index + value.length });
      }
    }

    if (findings.length === 0) {
      return { allowed: true, blocked: false, violations: [], metadata: {} };
    }

    const action = this.config.onDetection || this.config.mode;

    if (action === 'block') {
      const types = [...new Set(findings.map((f) => f.type))];
      violations.push({ interceptor: 'pii', rule: 'pii_detected', severity: 'high', message: `PII detected: ${types.join(', ')}`, action: 'block', details: { types, count: findings.length } });
      return { allowed: false, blocked: true, reason: `PII detected: ${types.join(', ')}`, violations, metadata: { findings: findings.length } };
    }

    if (action === 'redact') {
      let redacted = text;
      let offset = 0;
      const sorted = findings.sort((a, b) => a.start - b.start);
      for (const f of sorted) {
        const s = f.start + offset;
        const e = f.end + offset;
        redacted = redacted.slice(0, s) + f.label + redacted.slice(e);
        offset += f.label.length - (f.end - f.start);
      }
      return { allowed: true, blocked: false, transformed: redacted, violations: [], metadata: { redacted: findings.length } };
    }

    // warn / log
    const types = [...new Set(findings.map((f) => f.type))];
    violations.push({ interceptor: 'pii', rule: 'pii_detected', severity: 'medium', message: `PII detected: ${types.join(', ')}`, action: 'warn', details: { types, count: findings.length } });
    return { allowed: true, blocked: false, violations, metadata: { findings: findings.length } };
  }
}
