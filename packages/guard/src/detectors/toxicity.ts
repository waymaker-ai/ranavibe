import type { ToxicityFinding, ToxicityCategory, Severity } from '../types.js';

interface ToxicityPattern {
  category: ToxicityCategory;
  patterns: RegExp[];
  severity: Severity;
}

const TOXICITY_PATTERNS: ToxicityPattern[] = [
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
      /(.)\1{10,}/g, // Repeated characters
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
