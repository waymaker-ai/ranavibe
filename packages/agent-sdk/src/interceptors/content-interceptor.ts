import type { Interceptor, InterceptorResult, InterceptorContext, ContentFilterConfig, ContentCategory, Violation } from '../types.js';

const CATEGORY_PATTERNS: Record<ContentCategory, RegExp[]> = {
  profanity: [
    /\b(?:fuck|shit|damn|bitch|bastard|crap|dick|cunt|twat|wanker|ass(?:hole)?)\b/gi,
  ],
  violence: [
    /\b(?:how\s+to\s+(?:kill|murder|assassinate|poison|stab))\b/gi,
    /\b(?:instructions?\s+(?:for|to)\s+(?:making|building)\s+(?:a\s+)?(?:bomb|weapon|explosive))\b/gi,
    /\b(?:I\s+(?:will|want\s+to|'m\s+going\s+to)\s+(?:kill|murder|hurt|attack))\b/gi,
  ],
  hate: [
    /\b(?:kill\s+all|exterminate|genocide)\b/gi,
    /\b(?:racial|ethnic)\s+(?:cleansing|superiority)\b/gi,
    /\b(?:white\s+(?:power|supremacy)|neo[\s-]?nazi|master\s+race)\b/gi,
  ],
  adult: [
    /\b(?:explicit\s+sexual|pornograph(?:y|ic))\b/gi,
    /\b(?:sexual\s+(?:content|acts?)\s+(?:with|involving)\s+(?:minor|child|underage))\b/gi,
  ],
  spam: [
    /\b(?:buy\s+now|limited\s+time|act\s+now|click\s+here|free\s+money)\b/gi,
    /\b(?:congratulations\s*!?\s*you(?:'ve)?\s+won)\b/gi,
  ],
  selfHarm: [
    /\b(?:how\s+to\s+(?:kill\s+myself|commit\s+suicide|end\s+(?:my|it\s+all)))\b/gi,
    /\b(?:best\s+(?:way|method)\s+to\s+die)\b/gi,
    /\b(?:suicide\s+(?:methods?|instructions?|guide))\b/gi,
  ],
};

const SEVERITY_MAP: Record<ContentCategory, 'low' | 'medium' | 'high' | 'critical'> = {
  profanity: 'low',
  spam: 'low',
  violence: 'high',
  hate: 'critical',
  adult: 'high',
  selfHarm: 'critical',
};

export class ContentInterceptor implements Interceptor {
  name = 'content_filter';
  private categories: ContentCategory[];
  private action: 'block' | 'redact' | 'warn';
  filteredCount = 0;

  constructor(config: ContentFilterConfig | true) {
    const c = config === true ? {} : config;
    this.categories = c.categories || (['profanity', 'violence', 'hate', 'adult', 'selfHarm'] as ContentCategory[]);
    this.action = c.action || 'block';
  }

  processInput(text: string, _ctx: InterceptorContext): InterceptorResult {
    return this.filter(text);
  }

  processOutput(text: string, _ctx: InterceptorContext): InterceptorResult {
    return this.filter(text);
  }

  private filter(text: string): InterceptorResult {
    const violations: Violation[] = [];

    for (const cat of this.categories) {
      const patterns = CATEGORY_PATTERNS[cat];
      if (!patterns) continue;

      for (const pattern of patterns) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          this.filteredCount++;
          violations.push({
            interceptor: 'content_filter',
            rule: cat,
            severity: SEVERITY_MAP[cat],
            message: `${cat} content detected`,
            action: this.action,
            details: { matched: match[0].slice(0, 50) },
          });
        }
      }
    }

    if (violations.length === 0) {
      return { allowed: true, blocked: false, violations: [], metadata: {} };
    }

    const hasSevere = violations.some((v) => v.severity === 'critical' || v.severity === 'high');

    if (this.action === 'block' && hasSevere) {
      return {
        allowed: false, blocked: true,
        reason: `Content filtered: ${[...new Set(violations.map((v) => v.rule))].join(', ')}`,
        violations, metadata: { categories: [...new Set(violations.map((v) => v.rule))] },
      };
    }

    return { allowed: true, blocked: false, violations, metadata: {} };
  }
}
