// Detection logic — extracted for testability (Next.js pages cannot export non-page fields)

export interface PIIMatch {
  type: string;
  value: string;
  start: number;
  end: number;
}

export interface InjectionResult {
  detected: boolean;
  patterns: string[];
}

export interface ComplianceResult {
  framework: string;
  passed: boolean;
  violations: string[];
}

export interface CostEstimate {
  model: string;
  provider: string;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

// PII patterns
export const PII_PATTERNS: { type: string; pattern: RegExp }[] = [
  { type: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: 'Credit Card', pattern: /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6(?:011|5\d{2}))[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g },
  { type: 'Email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { type: 'Phone', pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { type: 'IP Address', pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g },
  { type: 'Date of Birth', pattern: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g },
  { type: 'AWS Key', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { type: 'Passport', pattern: /\b[A-Z]{1,2}\d{6,9}\b/g },
];

// Injection patterns
export const INJECTION_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'Ignore previous instructions', pattern: /ignore\s+(all\s+)?previous\s+instructions/i },
  { label: 'System prompt leak', pattern: /(?:show|reveal|print|output|display|repeat)\s+(?:the\s+)?(?:system\s+)?prompt/i },
  { label: 'Role override', pattern: /you\s+are\s+now\s+(?:a\s+)?(?:new|different)/i },
  { label: 'Jailbreak attempt', pattern: /(?:DAN|do anything now|developer mode|jailbreak)/i },
  { label: 'Prompt injection marker', pattern: /(?:\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>)/i },
  { label: 'Instruction override', pattern: /(?:disregard|forget|override)\s+(?:all\s+)?(?:previous|above|prior)/i },
  { label: 'Base64 smuggling', pattern: /(?:decode|base64)\s*(?:the\s+following|this)/i },
  { label: 'Delimiter injection', pattern: /---+\s*(?:system|user|assistant)\s*---+/i },
  { label: 'Hypothetical bypass', pattern: /(?:hypothetically|pretend|imagine|roleplay|act as if)\s+(?:you|there)/i },
  { label: 'Token smuggling', pattern: /(?:ignore|bypass)\s+(?:safety|content|ethical)\s+(?:filter|guard|policy)/i },
];

// Compliance frameworks
export const COMPLIANCE_FRAMEWORKS: { id: string; label: string; description: string }[] = [
  { id: 'hipaa', label: 'HIPAA', description: 'Health data protection' },
  { id: 'gdpr', label: 'GDPR', description: 'EU data privacy regulation' },
  { id: 'ccpa', label: 'CCPA', description: 'California consumer privacy' },
  { id: 'sox', label: 'SOX', description: 'Financial reporting integrity' },
  { id: 'pci-dss', label: 'PCI-DSS', description: 'Payment card security' },
  { id: 'ferpa', label: 'FERPA', description: 'Student education records' },
];

// Model pricing (per 1K tokens)
export const MODEL_PRICING: { model: string; provider: string; inputPer1k: number; outputPer1k: number; color: string }[] = [
  { model: 'Claude 3.5 Sonnet', provider: 'Anthropic', inputPer1k: 0.003, outputPer1k: 0.015, color: 'text-orange-400' },
  { model: 'GPT-4o', provider: 'OpenAI', inputPer1k: 0.005, outputPer1k: 0.015, color: 'text-green-400' },
  { model: 'Gemini 1.5 Pro', provider: 'Google', inputPer1k: 0.00125, outputPer1k: 0.005, color: 'text-blue-400' },
  { model: 'Claude 3 Haiku', provider: 'Anthropic', inputPer1k: 0.00025, outputPer1k: 0.00125, color: 'text-orange-300' },
  { model: 'GPT-4o mini', provider: 'OpenAI', inputPer1k: 0.00015, outputPer1k: 0.0006, color: 'text-green-300' },
  { model: 'Llama 3.1 70B', provider: 'Meta (via Bedrock)', inputPer1k: 0.00099, outputPer1k: 0.00099, color: 'text-purple-400' },
];

export function detectPII(text: string): PIIMatch[] {
  const matches: PIIMatch[] = [];
  for (const { type, pattern } of PII_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      matches.push({ type, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  matches.sort((a, b) => a.start - b.start);
  return matches;
}

export function detectInjection(text: string): InjectionResult {
  const patterns: string[] = [];
  for (const { label, pattern } of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      patterns.push(label);
    }
  }
  return { detected: patterns.length > 0, patterns };
}

export function checkCompliance(text: string, frameworks: string[]): ComplianceResult[] {
  const pii = detectPII(text);
  const injection = detectInjection(text);
  const piiTypes = new Set(pii.map((m) => m.type));

  return frameworks.map((framework) => {
    const violations: string[] = [];

    switch (framework) {
      case 'hipaa':
        if (piiTypes.has('SSN')) violations.push('SSN detected — PHI must be de-identified');
        if (piiTypes.has('Date of Birth')) violations.push('Date of birth detected — potential PHI');
        if (piiTypes.has('Email')) violations.push('Email detected — may constitute PHI in medical context');
        if (pii.length > 0 && !piiTypes.has('Email')) violations.push('PII detected that may be PHI');
        if (injection.detected) violations.push('Prompt injection risk — audit trail required');
        break;
      case 'gdpr':
        if (pii.length > 0) violations.push('Personal data detected — consent and lawful basis required');
        if (piiTypes.has('Email')) violations.push('Email is personal data under GDPR');
        if (piiTypes.has('IP Address')) violations.push('IP address is personal data under GDPR');
        break;
      case 'ccpa':
        if (pii.length > 0) violations.push('Personal information detected — disclosure required');
        if (piiTypes.has('Email')) violations.push('Email is personal information under CCPA');
        break;
      case 'sox':
        if (injection.detected) violations.push('Prompt injection risk — financial data integrity at risk');
        if (piiTypes.has('Credit Card')) violations.push('Financial instrument data detected');
        break;
      case 'pci-dss':
        if (piiTypes.has('Credit Card')) violations.push('Card data must not be stored in plaintext');
        if (piiTypes.has('SSN')) violations.push('Sensitive auth data detected alongside payment context');
        break;
      case 'ferpa':
        if (piiTypes.has('SSN')) violations.push('SSN detected — student record protection required');
        if (piiTypes.has('Date of Birth')) violations.push('DOB detected — may be education record');
        if (piiTypes.has('Email')) violations.push('Email detected — may identify student');
        break;
    }

    return { framework, passed: violations.length === 0, violations };
  });
}

export function estimateCost(text: string): CostEstimate[] {
  const inputTokens = Math.ceil(text.length / 4);
  const outputTokens = Math.ceil(inputTokens * 1.5);

  return MODEL_PRICING.map(({ model, provider, inputPer1k, outputPer1k }) => {
    const inputCost = (inputTokens / 1000) * inputPer1k;
    const outputCost = (outputTokens / 1000) * outputPer1k;
    return { model, provider, inputCost, outputCost, totalCost: inputCost + outputCost };
  });
}

export function redactText(text: string, matches: PIIMatch[]): string {
  if (matches.length === 0) return text;
  let result = '';
  let lastEnd = 0;
  for (const match of matches) {
    result += text.slice(lastEnd, match.start);
    result += `[${match.type.toUpperCase()} REDACTED]`;
    lastEnd = match.end;
  }
  result += text.slice(lastEnd);
  return result;
}
