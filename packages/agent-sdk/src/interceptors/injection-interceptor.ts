import type { Interceptor, InterceptorResult, InterceptorContext, InjectionConfig, Violation } from '../types.js';

interface Pattern { regex: RegExp; weight: number; category: string; desc: string; }

const PATTERNS: Pattern[] = [
  { regex: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules)/gi, weight: 9, category: 'direct', desc: 'Ignore previous instructions' },
  { regex: /forget\s+(?:all\s+)?(?:your|the|previous)\s+(?:instructions|rules|context)/gi, weight: 9, category: 'direct', desc: 'Forget instructions' },
  { regex: /disregard\s+(?:all\s+)?(?:previous|your)\s+(?:instructions|rules)/gi, weight: 9, category: 'direct', desc: 'Disregard instructions' },
  { regex: /override\s+(?:your|the|all)?\s*(?:safety|security|content)\s*(?:filters?|rules?)/gi, weight: 10, category: 'direct', desc: 'Override safety' },
  { regex: /new\s+instructions?\s*[:=]/gi, weight: 8, category: 'direct', desc: 'New instructions' },
  { regex: /(?:repeat|show|reveal|print)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions)/gi, weight: 8, category: 'system_leak', desc: 'Reveal system prompt' },
  { regex: /what\s+(?:are|were)\s+(?:your|the)\s+(?:original\s+)?instructions/gi, weight: 7, category: 'system_leak', desc: 'Ask for instructions' },
  { regex: /(?:dump|leak|expose|extract)\s+(?:your|the|system)\s+(?:prompt|instructions)/gi, weight: 9, category: 'system_leak', desc: 'Extract system prompt' },
  { regex: /\bDAN\b(?:\s+mode)?/g, weight: 9, category: 'jailbreak', desc: 'DAN jailbreak' },
  { regex: /do\s+anything\s+now/gi, weight: 9, category: 'jailbreak', desc: 'Do Anything Now' },
  { regex: /(?:no|without|remove|bypass)\s+(?:restrictions?|limitations?|filters?|safeguards?|guardrails?)/gi, weight: 8, category: 'jailbreak', desc: 'Remove restrictions' },
  { regex: /(?:enable|activate|enter)\s+(?:developer|debug|admin|god|unrestricted)\s+mode/gi, weight: 9, category: 'jailbreak', desc: 'Enable special mode' },
  { regex: /you\s+are\s+now\s+(?:a|an|the)\s+/gi, weight: 6, category: 'role_manipulation', desc: 'Role reassignment' },
  { regex: /(?:pretend|act|behave)\s+(?:to\s+be|as\s+if|like)\s+/gi, weight: 6, category: 'role_manipulation', desc: 'Pretend to be' },
  { regex: /(?:take\s+on|assume|adopt)\s+(?:the\s+)?(?:role|persona|identity)\s+of/gi, weight: 6, category: 'role_manipulation', desc: 'Assume role' },
  { regex: /```(?:system|assistant|user|instruction)/gi, weight: 8, category: 'delimiter', desc: 'Code block role injection' },
  { regex: /\[(?:INST|SYS|SYSTEM|\/INST)\]/gi, weight: 9, category: 'delimiter', desc: 'Instruction delimiter' },
  { regex: /<<\s*(?:SYS|SYSTEM)\s*>>/gi, weight: 9, category: 'delimiter', desc: 'System delimiter' },
  { regex: /<\|(?:im_start|im_end|system|user|assistant)\|>/gi, weight: 9, category: 'delimiter', desc: 'ChatML delimiter' },
  { regex: /(?:base64|b64|decode|atob)\s*[\(:]?\s*[A-Za-z0-9+\/=]{20,}/gi, weight: 7, category: 'encoding', desc: 'Base64 content' },
  { regex: /\\x[0-9a-fA-F]{2}(?:\\x[0-9a-fA-F]{2}){4,}/g, weight: 7, category: 'encoding', desc: 'Hex encoded' },
  { regex: /(?:hypothetically|theoretically),?\s+(?:if|what\s+if|suppose)\s+/gi, weight: 4, category: 'context', desc: 'Hypothetical framing' },
  { regex: /(?:for|purely\s+for)\s+(?:educational|academic|research)\s+purposes?\s+only/gi, weight: 5, category: 'context', desc: 'Educational purpose claim' },
  { regex: /(?:in\s+a?\s+)?(?:fictional|hypothetical|imaginary)\s+(?:scenario|world|context)/gi, weight: 4, category: 'context', desc: 'Fictional scenario' },
  { regex: /(?:ignorar|ignorer|ignorieren)\s+/gi, weight: 7, category: 'multi_lang', desc: 'Non-English ignore' },
];

const THRESHOLDS = { low: 70, medium: 45, high: 25 } as const;

export class InjectionInterceptor implements Interceptor {
  name = 'injection';
  private sensitivity: 'low' | 'medium' | 'high';
  private onDetection: 'block' | 'warn' | 'sanitize';
  private customPatterns: Pattern[];

  constructor(config: InjectionConfig | true) {
    const c = config === true ? {} : config;
    this.sensitivity = c.sensitivity || 'medium';
    this.onDetection = c.onDetection || 'block';
    this.customPatterns = (c.customPatterns || []).map((p, i) => ({
      regex: p, weight: 8, category: 'custom', desc: `Custom pattern ${i + 1}`,
    }));
  }

  processInput(text: string, _ctx: InterceptorContext): InterceptorResult {
    return this.detect(text);
  }

  processOutput(text: string, _ctx: InterceptorContext): InterceptorResult {
    return { allowed: true, blocked: false, violations: [], metadata: {} };
  }

  private detect(text: string): InterceptorResult {
    const normalized = text.normalize('NFKC');
    const allPatterns = [...PATTERNS, ...this.customPatterns];
    let totalWeight = 0;
    const matches: Array<{ desc: string; category: string; weight: number; matched: string }> = [];

    for (const p of allPatterns) {
      const regex = new RegExp(p.regex.source, p.regex.flags);
      let m: RegExpExecArray | null;
      while ((m = regex.exec(normalized)) !== null) {
        totalWeight += p.weight;
        matches.push({ desc: p.desc, category: p.category, weight: p.weight, matched: m[0].slice(0, 100) });
      }
    }

    const score = Math.min(100, Math.round((totalWeight / 100) * 100));
    const threshold = THRESHOLDS[this.sensitivity];

    if (score < threshold) {
      return { allowed: true, blocked: false, violations: [], metadata: { score } };
    }

    const violations: Violation[] = matches.map((m) => ({
      interceptor: 'injection',
      rule: m.category,
      severity: m.weight >= 9 ? 'critical' as const : m.weight >= 7 ? 'high' as const : 'medium' as const,
      message: `${m.desc}: "${m.matched}"`,
      action: this.onDetection,
    }));

    if (this.onDetection === 'block') {
      return { allowed: false, blocked: true, reason: `Injection detected (score: ${score}/100)`, violations, metadata: { score, patterns: matches.length } };
    }

    return { allowed: true, blocked: false, violations, metadata: { score, patterns: matches.length } };
  }
}
