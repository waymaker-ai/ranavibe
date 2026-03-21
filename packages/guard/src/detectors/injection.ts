import type { InjectionFinding, InjectionCategory, Severity } from '../types.js';

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
