// ---------------------------------------------------------------------------
// @ranavibe/openclaw - Core guard logic (zero dependencies)
// ---------------------------------------------------------------------------
// Inline implementations of PII, injection, toxicity detection and budget
// tracking. These mirror @ranavibe/guard patterns but are fully self-contained
// so this package has zero runtime dependencies.
// ---------------------------------------------------------------------------

import type {
  PIIFinding,
  PIIType,
  InjectionFinding,
  InjectionCategory,
  ToxicityFinding,
  ToxicityCategory,
  Severity,
  ModelPricing,
  CostInfo,
  BudgetConfig,
} from './types.js';

// =========================================================================
// PII Detection
// =========================================================================

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
    pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
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
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    confidence: 0.85,
    redactLabel: '[REDACTED_IP]',
  },
  {
    type: 'ip_address',
    pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
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

// =========================================================================
// Injection Detection
// =========================================================================

interface InjectionPattern {
  pattern: RegExp;
  category: InjectionCategory;
  weight: number;
  description: string;
}

const INJECTION_PATTERNS: InjectionPattern[] = [
  // Direct injection
  { pattern: /ignore\s+(?:all\s+)?(?:previous|prior|above|earlier)\s+(?:instructions|prompts|rules|guidelines)/gi, category: 'direct', weight: 9, description: 'Ignore previous instructions' },
  { pattern: /forget\s+(?:all\s+)?(?:your|the|previous)\s+(?:instructions|rules|guidelines|context)/gi, category: 'direct', weight: 9, description: 'Forget instructions' },
  { pattern: /disregard\s+(?:all\s+)?(?:previous|prior|above|your)\s+(?:instructions|rules|prompts)/gi, category: 'direct', weight: 9, description: 'Disregard instructions' },
  { pattern: /override\s+(?:your|the|all)?\s*(?:safety|security|content)\s*(?:filters?|rules?|guidelines?|restrictions?)/gi, category: 'direct', weight: 10, description: 'Override safety' },
  { pattern: /new\s+instructions?\s*[:=]/gi, category: 'direct', weight: 8, description: 'New instructions marker' },
  { pattern: /(?:from\s+now\s+on|starting\s+now),?\s+you\s+(?:will|must|should|are)/gi, category: 'direct', weight: 7, description: 'Instruction override' },
  { pattern: /stop\s+being\s+(?:an?\s+)?(?:AI|assistant|helpful|safe)/gi, category: 'direct', weight: 8, description: 'Stop being AI' },

  // System prompt leaking
  { pattern: /(?:repeat|show|display|reveal|print|output|tell\s+me)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions|rules|guidelines)/gi, category: 'system_leak', weight: 8, description: 'Request system prompt' },
  { pattern: /what\s+(?:are|were)\s+(?:your|the)\s+(?:original\s+)?(?:instructions|rules|system\s+prompt)/gi, category: 'system_leak', weight: 7, description: 'Ask for instructions' },
  { pattern: /(?:dump|leak|expose|extract)\s+(?:your|the|system)\s+(?:prompt|instructions|context)/gi, category: 'system_leak', weight: 9, description: 'Extract system prompt' },
  { pattern: /(?:begin|start)\s+(?:your\s+)?(?:response|output)\s+with\s+(?:your\s+)?(?:system|initial)\s+(?:prompt|instructions|message)/gi, category: 'system_leak', weight: 8, description: 'Begin with system prompt' },

  // Jailbreak patterns
  { pattern: /\bDAN\b(?:\s+mode)?/g, category: 'jailbreak', weight: 9, description: 'DAN jailbreak' },
  { pattern: /do\s+anything\s+now/gi, category: 'jailbreak', weight: 9, description: 'Do Anything Now' },
  { pattern: /(?:no|without|remove\s+all|bypass)\s+(?:restrictions?|limitations?|filters?|safeguards?|guardrails?|boundaries)/gi, category: 'jailbreak', weight: 8, description: 'Remove restrictions' },
  { pattern: /(?:enable|activate|enter|switch\s+to)\s+(?:developer|debug|admin|god|unrestricted|unfiltered)\s+mode/gi, category: 'jailbreak', weight: 9, description: 'Enable special mode' },
  { pattern: /you\s+(?:have|are)\s+(?:been\s+)?(?:freed|liberated|unchained|unleashed)/gi, category: 'jailbreak', weight: 8, description: 'Freedom claim' },
  { pattern: /(?:pretend|imagine|assume)\s+(?:that\s+)?(?:you\s+)?(?:have|are)\s+no\s+(?:restrictions|rules|limits)/gi, category: 'jailbreak', weight: 8, description: 'Pretend no restrictions' },

  // Role manipulation
  { pattern: /you\s+are\s+now\s+(?:a|an|the)\s+/gi, category: 'role_manipulation', weight: 6, description: 'Role reassignment' },
  { pattern: /(?:pretend|act|behave)\s+(?:to\s+be|as\s+if\s+you(?:'re|\s+are)|like\s+you(?:'re|\s+are))\s+/gi, category: 'role_manipulation', weight: 6, description: 'Pretend to be' },
  { pattern: /roleplay\s+as\s+/gi, category: 'role_manipulation', weight: 5, description: 'Roleplay as' },
  { pattern: /(?:take\s+on|assume|adopt)\s+(?:the\s+)?(?:role|persona|identity|character)\s+(?:of|as)\s+/gi, category: 'role_manipulation', weight: 6, description: 'Assume role' },
  { pattern: /you\s+(?:must|will|should)\s+(?:always\s+)?(?:respond|answer|reply)\s+as\s+/gi, category: 'role_manipulation', weight: 7, description: 'Forced role response' },

  // Delimiter injection
  { pattern: /```(?:system|assistant|user|instruction)/gi, category: 'delimiter', weight: 8, description: 'Code block role injection' },
  { pattern: /\[(?:INST|SYS|SYSTEM|\/INST)\]/gi, category: 'delimiter', weight: 9, description: 'Instruction delimiter' },
  { pattern: /<<\s*(?:SYS|SYSTEM|INST)\s*>>/gi, category: 'delimiter', weight: 9, description: 'System delimiter' },
  { pattern: /<\|(?:im_start|im_end|system|user|assistant)\|>/gi, category: 'delimiter', weight: 9, description: 'Chat ML delimiter' },
  { pattern: /###\s*(?:System|Instruction|Human|Assistant)\s*[:：]/gi, category: 'delimiter', weight: 7, description: 'Markdown role delimiter' },
  { pattern: /(?:SYSTEM|USER|ASSISTANT|HUMAN)\s*[:：]\s*\n/g, category: 'delimiter', weight: 6, description: 'Role prefix injection' },

  // Encoding attacks
  { pattern: /(?:base64|b64|decode|atob)\s*[\(:]?\s*[A-Za-z0-9+\/=]{20,}/gi, category: 'encoding', weight: 7, description: 'Base64 encoded content' },
  { pattern: /\\x[0-9a-fA-F]{2}(?:\\x[0-9a-fA-F]{2}){4,}/g, category: 'encoding', weight: 7, description: 'Hex encoded content' },
  { pattern: /\\u[0-9a-fA-F]{4}(?:\\u[0-9a-fA-F]{4}){4,}/g, category: 'encoding', weight: 7, description: 'Unicode encoded content' },
  { pattern: /&#(?:x[0-9a-fA-F]+|\d+);(?:&#(?:x[0-9a-fA-F]+|\d+);){4,}/g, category: 'encoding', weight: 6, description: 'HTML entity encoding' },

  // Context manipulation
  { pattern: /(?:hypothetically|theoretically|in\s+theory),?\s+(?:if|what\s+if|suppose|imagine|let's\s+say)\s+/gi, category: 'context_manipulation', weight: 4, description: 'Hypothetical framing' },
  { pattern: /(?:for|purely\s+for)\s+(?:educational|academic|research|testing|learning)\s+purposes?\s+only/gi, category: 'context_manipulation', weight: 5, description: 'Educational purpose claim' },
  { pattern: /(?:in\s+a?\s+)?(?:fictional|hypothetical|imaginary|simulated)\s+(?:scenario|world|context|situation)/gi, category: 'context_manipulation', weight: 4, description: 'Fictional scenario' },
  { pattern: /(?:this\s+is\s+(?:just\s+)?a\s+)?(?:test|experiment|exercise|simulation|drill)/gi, category: 'context_manipulation', weight: 3, description: 'Test/experiment claim' },
  { pattern: /(?:I\s+am|I'm)\s+(?:a\s+)?(?:security\s+researcher|penetration\s+tester|red\s+team|authorized)/gi, category: 'context_manipulation', weight: 4, description: 'Authority claim' },

  // Multi-language
  { pattern: /(?:ignorar|ignorer|ignorieren|игнорируй)\s+/gi, category: 'multi_language', weight: 7, description: 'Non-English ignore' },
  { pattern: /(?:instrucciones|instructions|Anweisungen|инструкции)\s+(?:anteriores|précédentes|vorherige|предыдущие)/gi, category: 'multi_language', weight: 7, description: 'Non-English previous instructions' },
];

const SENSITIVITY_THRESHOLDS = {
  low: 70,
  medium: 45,
  high: 25,
} as const;

export function detectInjection(
  text: string,
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): { score: number; findings: InjectionFinding[]; blocked: boolean } {
  const findings: InjectionFinding[] = [];
  let totalWeight = 0;

  const normalized = text.normalize('NFKC');

  for (const def of INJECTION_PATTERNS) {
    const regex = new RegExp(def.pattern.source, def.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(normalized)) !== null) {
      totalWeight += def.weight;

      const severity: Severity =
        def.weight >= 9 ? 'critical' :
        def.weight >= 7 ? 'high' :
        def.weight >= 5 ? 'medium' : 'low';

      findings.push({
        pattern: def.description,
        category: def.category,
        score: def.weight,
        severity,
        matched: match[0].slice(0, 100),
      });
    }
  }

  const maxPossible = 100;
  const score = Math.min(100, Math.round((totalWeight / maxPossible) * 100));
  const threshold = SENSITIVITY_THRESHOLDS[sensitivity];
  const blocked = score >= threshold;

  return { score, findings, blocked };
}

export function hasInjection(text: string, sensitivity: 'low' | 'medium' | 'high' = 'medium'): boolean {
  return detectInjection(text, sensitivity).blocked;
}

// =========================================================================
// Toxicity Detection
// =========================================================================

interface ToxicityPatternDef {
  category: ToxicityCategory;
  severity: Severity;
  patterns: RegExp[];
}

const TOXICITY_PATTERNS: ToxicityPatternDef[] = [
  {
    category: 'profanity',
    severity: 'low',
    patterns: [
      /\b(?:fuck|shit|damn|ass|bitch|bastard|crap|dick|piss|cock|cunt|twat|wanker|bollocks)\b/gi,
      /\b(?:f+u+c+k+|s+h+i+t+|b+i+t+c+h+)\b/gi,
      /\b(?:stfu|gtfo|lmfao|wtf|af)\b/gi,
    ],
  },
  {
    category: 'hate_speech',
    severity: 'critical',
    patterns: [
      /\b(?:kill\s+all|exterminate|genocide\s+(?:against|of))\b/gi,
      /\b(?:racial|ethnic)\s+(?:cleansing|superiority|inferiority)\b/gi,
      /\b(?:master\s+race|white\s+(?:power|supremacy|nationalist)|neo[\s-]?nazi)\b/gi,
      /\b(?:subhuman|untermensch|vermin|cockroach(?:es)?)\b.*\b(?:people|race|ethnic|group)\b/gi,
      /\b(?:all|every)\s+(?:\w+\s+)?(?:should\s+(?:die|be\s+killed|burn))\b/gi,
    ],
  },
  {
    category: 'violence',
    severity: 'high',
    patterns: [
      /\b(?:how\s+to\s+(?:kill|murder|assassinate|poison|strangle|stab))\b/gi,
      /\b(?:instructions?\s+(?:for|to|on)\s+(?:making|building|creating)\s+(?:a\s+)?(?:bomb|weapon|explosive|poison))\b/gi,
      /\b(?:I\s+(?:will|want\s+to|'?m\s+going\s+to)\s+(?:kill|murder|hurt|attack|shoot))\b/gi,
      /\b(?:detailed\s+(?:plan|instructions?|steps?)\s+(?:to|for)\s+(?:harm|violence|attack))\b/gi,
    ],
  },
  {
    category: 'self_harm',
    severity: 'critical',
    patterns: [
      /\b(?:how\s+to\s+(?:kill\s+myself|commit\s+suicide|end\s+(?:my|it\s+all)))\b/gi,
      /\b(?:best\s+(?:way|method)\s+to\s+(?:die|end\s+(?:my|it)))\b/gi,
      /\b(?:I\s+(?:want|need|plan)\s+to\s+(?:die|end\s+it|kill\s+myself|hurt\s+myself))\b/gi,
      /\b(?:suicide\s+(?:methods?|instructions?|guide|how[\s-]to))\b/gi,
      /\b(?:painless\s+(?:way\s+to\s+)?(?:death|die|suicide))\b/gi,
    ],
  },
  {
    category: 'sexual',
    severity: 'high',
    patterns: [
      /\b(?:explicit\s+sexual|pornograph(?:y|ic)|erotic\s+(?:story|content|fiction))\b/gi,
      /\b(?:sexual\s+(?:content|acts?|encounter)\s+(?:with|involving)\s+(?:a\s+)?(?:minor|child|underage))\b/gi,
      /\b(?:child\s+(?:porn|sexual|abuse|exploitation))\b/gi,
    ],
  },
  {
    category: 'harassment',
    severity: 'high',
    patterns: [
      /\b(?:you\s+(?:are|should)\s+(?:worthless|pathetic|disgusting|useless|stupid))\b/gi,
      /\b(?:nobody\s+(?:loves|cares\s+about|wants)\s+you)\b/gi,
      /\b(?:the\s+world\s+(?:would\s+be|is)\s+better\s+(?:off\s+)?without\s+you)\b/gi,
      /\b(?:doxx|swat|stalk|harass|bully)\s+(?:them|him|her|you|someone)\b/gi,
    ],
  },
  {
    category: 'spam',
    severity: 'low',
    patterns: [
      /\b(?:buy\s+now|limited\s+time\s+offer|act\s+now|click\s+here|free\s+money)\b/gi,
      /\b(?:(?:congratulations|congrats)\s*!?\s*you(?:'ve)?\s+(?:won|been\s+selected))\b/gi,
      /\b(?:nigerian\s+prince|wire\s+transfer|inheritance\s+fund)\b/gi,
      /(.)\1{10,}/g,
    ],
  },
];

export function detectToxicity(text: string): ToxicityFinding[] {
  const findings: ToxicityFinding[] = [];

  for (const def of TOXICITY_PATTERNS) {
    for (const pattern of def.patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const start = Math.max(0, match.index - 20);
        const end = Math.min(text.length, match.index + match[0].length + 20);

        findings.push({
          category: def.category,
          severity: def.severity,
          matched: match[0].slice(0, 80),
          context: text.slice(start, end),
        });
      }
    }
  }

  return findings;
}

export function hasToxicity(text: string, minSeverity: Severity = 'low'): boolean {
  const severityOrder: Severity[] = ['low', 'medium', 'high', 'critical'];
  const minIndex = severityOrder.indexOf(minSeverity);
  const findings = detectToxicity(text);
  return findings.some((f) => severityOrder.indexOf(f.severity) >= minIndex);
}

// =========================================================================
// Budget / Cost Tracking
// =========================================================================

const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic
  'claude-opus-4-6': { inputPer1M: 15, outputPer1M: 75, contextWindow: 200000 },
  'claude-sonnet-4-6': { inputPer1M: 3, outputPer1M: 15, contextWindow: 200000 },
  'claude-haiku-4-5-20251001': { inputPer1M: 0.80, outputPer1M: 4, contextWindow: 200000 },
  'claude-3-5-sonnet-20241022': { inputPer1M: 3, outputPer1M: 15, contextWindow: 200000 },
  'claude-3-5-haiku-20241022': { inputPer1M: 0.80, outputPer1M: 4, contextWindow: 200000 },
  'claude-3-opus-20240229': { inputPer1M: 15, outputPer1M: 75, contextWindow: 200000 },
  'claude-3-sonnet-20240229': { inputPer1M: 3, outputPer1M: 15, contextWindow: 200000 },
  'claude-3-haiku-20240307': { inputPer1M: 0.25, outputPer1M: 1.25, contextWindow: 200000 },

  // OpenAI
  'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10, contextWindow: 128000 },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.60, contextWindow: 128000 },
  'gpt-4-turbo': { inputPer1M: 10, outputPer1M: 30, contextWindow: 128000 },
  'gpt-4': { inputPer1M: 30, outputPer1M: 60, contextWindow: 8192 },
  'gpt-3.5-turbo': { inputPer1M: 0.50, outputPer1M: 1.50, contextWindow: 16385 },
  'o1': { inputPer1M: 15, outputPer1M: 60, contextWindow: 200000 },
  'o1-mini': { inputPer1M: 3, outputPer1M: 12, contextWindow: 128000 },
  'o3-mini': { inputPer1M: 1.10, outputPer1M: 4.40, contextWindow: 200000 },

  // Google
  'gemini-2.0-flash': { inputPer1M: 0.10, outputPer1M: 0.40, contextWindow: 1048576 },
  'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30, contextWindow: 1048576 },
  'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5, contextWindow: 2097152 },
  'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10, contextWindow: 1048576 },

  // Mistral
  'mistral-large': { inputPer1M: 2, outputPer1M: 6, contextWindow: 128000 },
  'mistral-small': { inputPer1M: 0.20, outputPer1M: 0.60, contextWindow: 32000 },

  // Meta (via Groq/Together)
  'llama-3.1-70b': { inputPer1M: 0.59, outputPer1M: 0.79, contextWindow: 131072 },
  'llama-3.1-8b': { inputPer1M: 0.05, outputPer1M: 0.08, contextWindow: 131072 },
};

const PERIOD_MS: Record<string, number> = {
  request: 0,
  hour: 3600000,
  day: 86400000,
  month: 2592000000,
};

export class BudgetTracker {
  private config: Required<BudgetConfig>;
  private entries: Array<{ cost: number; timestamp: number; model: string }> = [];
  private periodStart: number = Date.now();

  constructor(config: BudgetConfig) {
    this.config = {
      limit: config.limit,
      period: config.period,
      warningThreshold: config.warningThreshold ?? 0.8,
      onExceeded: config.onExceeded ?? 'block',
    };
  }

  getModelPricing(model: string): ModelPricing | undefined {
    if (MODEL_PRICING[model]) return MODEL_PRICING[model];
    const key = Object.keys(MODEL_PRICING).find((k) => model.includes(k) || k.includes(model));
    return key ? MODEL_PRICING[key] : undefined;
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): CostInfo {
    const pricing = this.getModelPricing(model);
    const provider = model.startsWith('claude') ? 'anthropic' :
      model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3') ? 'openai' :
      model.startsWith('gemini') ? 'google' :
      model.startsWith('mistral') ? 'mistral' :
      model.startsWith('llama') ? 'meta' : 'unknown';

    if (!pricing) {
      return { model, provider, inputTokens, outputTokens, inputCost: 0, outputCost: 0, totalCost: 0 };
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
    const spent = this.getCurrentSpent();

    return {
      model,
      provider,
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      budgetRemaining: Math.max(0, this.config.limit - spent),
      budgetWarning: spent >= this.config.limit * this.config.warningThreshold,
    };
  }

  recordCost(model: string, inputTokens: number, outputTokens: number): CostInfo {
    const estimate = this.estimateCost(model, inputTokens, outputTokens);
    this.entries.push({ cost: estimate.totalCost, timestamp: Date.now(), model });
    this.cleanupOldEntries();
    return estimate;
  }

  /** Approximate token count from character count (rough: 1 token ~ 4 chars) */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  isExceeded(additionalCost: number = 0): boolean {
    this.cleanupOldEntries();
    return this.getCurrentSpent() + additionalCost >= this.config.limit;
  }

  get action(): string {
    return this.config.onExceeded;
  }

  getSpent(): number {
    this.cleanupOldEntries();
    return this.getCurrentSpent();
  }

  getRemaining(): number {
    return Math.max(0, this.config.limit - this.getSpent());
  }

  getEntries(): Array<{ cost: number; timestamp: number; model: string }> {
    this.cleanupOldEntries();
    return [...this.entries];
  }

  getByModel(): Record<string, number> {
    this.cleanupOldEntries();
    const byModel: Record<string, number> = {};
    for (const e of this.entries) {
      byModel[e.model] = (byModel[e.model] || 0) + e.cost;
    }
    return byModel;
  }

  reset(): void {
    this.entries = [];
    this.periodStart = Date.now();
  }

  get limit(): number {
    return this.config.limit;
  }

  get period(): string {
    return this.config.period;
  }

  get periodStartTime(): number {
    return this.periodStart;
  }

  private getCurrentSpent(): number {
    if (this.config.period === 'request') return 0;
    return this.entries.reduce((sum, e) => sum + e.cost, 0);
  }

  private cleanupOldEntries(): void {
    if (this.config.period === 'request') return;
    const windowMs = PERIOD_MS[this.config.period] || PERIOD_MS.day;
    const cutoff = Date.now() - windowMs;
    this.entries = this.entries.filter((e) => e.timestamp > cutoff);
  }

  static getAllPricing(): Record<string, ModelPricing> {
    return { ...MODEL_PRICING };
  }
}
