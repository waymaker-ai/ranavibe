// ---------------------------------------------------------------------------
// @waymakerai/aicofounder-conversation-guard - ConversationGuard implementation
// ---------------------------------------------------------------------------

import type {
  ConversationConfig,
  ConversationResult,
  ConversationState,
  ConversationViolation,
  ConversationPhase,
  EscalationReason,
  FlowRule,
  GatedInfo,
  Message,
  TopicRestriction,
} from './types.js';

// ---------------------------------------------------------------------------
// Built-in patterns
// ---------------------------------------------------------------------------

const GREETING_PATTERNS = [
  /\b(hi|hello|hey|good\s+(morning|afternoon|evening)|greetings|howdy|sup)\b/i,
  /\b(hola|bonjour|hallo|ciao|oi|salut|merhaba|namaste)\b/i,
];

const FAREWELL_PATTERNS = [
  /\b(bye|goodbye|good\s*bye|see\s+you|farewell|take\s+care|later|adios|ciao|au\s+revoir)\b/i,
  /\b(thanks?\s+(for|you)|that'?s?\s+all|nothing\s+else|done\s+here|end\s+chat)\b/i,
];

const QUESTION_PATTERNS = [
  /\?$/,
  /\b(what|how|why|when|where|who|which|can\s+you|could\s+you|would\s+you|do\s+you|is\s+there|are\s+there)\b/i,
  /\b(tell\s+me|explain|describe|show\s+me|help\s+me)\b/i,
];

const FOLLOW_UP_PATTERNS = [
  /\b(also|additionally|another\s+(thing|question)|more\s+about|what\s+about|and\s+also)\b/i,
  /\b(follow[\s-]?up|related\s+to\s+that|on\s+that\s+note|speaking\s+of)\b/i,
];

const ESCALATION_FRUSTRATION_PATTERNS = [
  /\b(frustrated|annoyed|angry|furious|useless|terrible|horrible|worst|stupid|dumb|pathetic|incompetent|waste\s+of\s+time)\b/i,
  /\b(this\s+is\s+(ridiculous|absurd|unacceptable|outrageous))\b/i,
  /\b(doesn'?t?\s+work|not\s+working|broken|still\s+wrong|same\s+(issue|problem|error))\b/i,
];

const ESCALATION_EXPLICIT_PATTERNS = [
  /\b(speak\s+to\s+(a\s+)?(human|person|agent|manager|supervisor|representative|rep|someone\s+real))\b/i,
  /\b(transfer\s+me|escalate|real\s+(person|human|agent)|human\s+agent|live\s+agent)\b/i,
  /\b(let\s+me\s+talk\s+to|connect\s+me\s+(to|with))\b/i,
];

const ESCALATION_PROFANITY_PATTERNS = [
  /\b(fuck|shit|damn|ass|hell|crap|bastard|bitch)\b/i,
  /\b\w*(fuck|shit|bastard|bitch|ass)\w*\b/i,
];

const ESCALATION_THREAT_PATTERNS = [
  /\b(sue|lawyer|attorney|legal\s+action|report\s+you|complaint|cancel|unsubscribe|refund)\b/i,
];

const IMPERSONATION_PATTERNS = [
  /\b(pretend\s+to\s+be|act\s+as|role[\s-]?play\s+as|you\s+are\s+now|from\s+now\s+on\s+you\s+are)\b/i,
  /\b(ignore\s+(previous|prior|above)\s+(instructions?|rules?|guidelines?))\b/i,
  /\b(forget\s+(everything|all|your)\s+(you|previous|instructions?))\b/i,
];

// ---------------------------------------------------------------------------
// Language detection (basic heuristic)
// ---------------------------------------------------------------------------

const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  es: [/\b(hola|gracias|por\s+favor|si|no|como|donde|cuando|porque|bueno|malo)\b/i],
  fr: [/\b(bonjour|merci|s'?il\s+vous\s+pla[iî]t|oui|non|comment|pourquoi|bien|mal)\b/i],
  de: [/\b(hallo|danke|bitte|ja|nein|wie|warum|gut|schlecht|und)\b/i],
  pt: [/\b(ol[aá]|obrigad[oa]|por\s+favor|sim|n[aã]o|como|onde|quando|porque|bom)\b/i],
  tr: [/\b(merhaba|te[sş]ekk[uü]r|l[uü]tfen|evet|hay[iı]r|nas[iı]l|neden|iyi|k[oö]t[uü])\b/i],
  hi: [/\b(namaste|dhanyavaad|kripaya|haan|nahi|kaise|kyon|accha|bura)\b/i],
  en: [/\b(the|is|are|was|were|have|has|will|would|could|should)\b/i],
};

function detectLanguage(text: string): string | null {
  let bestLang: string | null = null;
  let bestScore = 0;
  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0;
    for (const p of patterns) {
      const matches = text.match(new RegExp(p.source, 'gi'));
      if (matches) score += matches.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }
  return bestScore > 0 ? bestLang : null;
}

// ---------------------------------------------------------------------------
// ConversationGuard
// ---------------------------------------------------------------------------

export class ConversationGuard {
  private config: ConversationConfig;
  private state: ConversationState;
  private topics: TopicRestriction[];
  private flowRules: FlowRule[];
  private gatedInfo: GatedInfo[];

  constructor(config: ConversationConfig) {
    this.config = config;
    this.topics = config.topics ? [...config.topics] : [];
    this.flowRules = config.flowRules ? [...config.flowRules] : [];
    this.gatedInfo = config.gatedInfo ? [...config.gatedInfo] : [];
    this.state = this.createInitialState();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Process a message in conversation context. */
  process(message: string, history: Message[]): ConversationResult {
    const start = Date.now();
    const violations: ConversationViolation[] = [];
    let suggestedResponse: string | undefined;

    // Update turn count
    this.state.turnCount += 1;
    this.state.lastMessageAt = Date.now();

    // Detect language
    const lang = detectLanguage(message);
    if (lang) this.state.detectedLanguage = lang;

    // Detect conversation phase
    this.state.phase = this.detectPhase(message, history);

    // --- Check turn limits ---
    const turnViolation = this.checkTurnLimits(message);
    if (turnViolation) {
      violations.push(turnViolation.violation);
      if (!suggestedResponse) suggestedResponse = turnViolation.suggested;
    }

    // --- Check topic restrictions ---
    const topicResults = this.checkTopics(message);
    for (const tr of topicResults) {
      violations.push(tr.violation);
      if (!suggestedResponse && tr.suggested) suggestedResponse = tr.suggested;
    }

    // --- Check escalation ---
    if (this.config.detectEscalation !== false) {
      this.detectEscalation(message);
    }

    // --- Check role enforcement ---
    if (this.config.role) {
      const roleViolation = this.checkRole(message, history);
      if (roleViolation) {
        violations.push(roleViolation.violation);
        if (!suggestedResponse) suggestedResponse = roleViolation.suggested;
      }
    }

    // --- Check gated information ---
    const gateViolation = this.checkGatedInfo(message);
    if (gateViolation) {
      violations.push(gateViolation.violation);
      if (!suggestedResponse) suggestedResponse = gateViolation.suggested;
    }

    // --- Check custom flow rules ---
    for (const rule of this.flowRules) {
      try {
        if (rule.condition(this.state, message, history)) {
          const violation: ConversationViolation = {
            rule: rule.id,
            category: 'flow-rule',
            severity: rule.severity ?? 'medium',
            message: rule.responseMessage ?? `Flow rule "${rule.name}" violated`,
            action: rule.action,
          };
          violations.push(violation);
          if (!suggestedResponse && rule.responseMessage) {
            suggestedResponse = rule.responseMessage;
          }
        }
      } catch {
        // Silently skip rules that throw
      }
    }

    // Update topic tracking
    this.updateTopicTracking(message);

    // Build summary
    let summary: string | undefined;
    if (this.config.summarization) {
      try {
        summary = this.config.summarization.summarize(history);
      } catch {
        // Silently skip if summarization fails
      }
    }

    const hasBlocking = violations.some((v) => v.action === 'block');

    return {
      allowed: !hasBlocking,
      violations,
      state: { ...this.state },
      suggestedResponse,
      summary,
      durationMs: Date.now() - start,
    };
  }

  /** Define topic restrictions. */
  restrictTopics(topics: TopicRestriction[]): void {
    this.topics.push(...topics);
  }

  /** Add a conversation flow rule. */
  addFlowRule(rule: FlowRule): void {
    this.flowRules.push(rule);
  }

  /** Get current conversation state. */
  getState(): ConversationState {
    return { ...this.state };
  }

  /** Reset conversation to initial state. */
  reset(): void {
    this.state = this.createInitialState();
  }

  /** Mark a verification step as completed. */
  completeVerification(step: string): void {
    if (!this.state.completedVerifications.includes(step)) {
      this.state.completedVerifications.push(step);
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private createInitialState(): ConversationState {
    return {
      phase: 'unknown',
      turnCount: 0,
      topicsDiscussed: [],
      currentTopic: null,
      turnsOnCurrentTopic: 0,
      escalationDetected: false,
      escalationReasons: [],
      completedVerifications: [],
      sessionStartedAt: Date.now(),
      lastMessageAt: Date.now(),
      detectedLanguage: null,
    };
  }

  private detectPhase(message: string, history: Message[]): ConversationPhase {
    if (history.length === 0 || this.state.turnCount <= 1) {
      for (const p of GREETING_PATTERNS) {
        if (p.test(message)) return 'greeting';
      }
    }

    for (const p of FAREWELL_PATTERNS) {
      if (p.test(message)) return 'farewell';
    }

    if (history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        for (const p of FOLLOW_UP_PATTERNS) {
          if (p.test(message)) return 'follow-up';
        }
      }
    }

    for (const p of QUESTION_PATTERNS) {
      if (p.test(message)) return 'question';
    }

    // If the last message was a question (from user), this is likely an answer context
    if (history.length > 0) {
      const prev = history[history.length - 1];
      if (prev && prev.role === 'assistant') return 'follow-up';
    }

    return 'unknown';
  }

  private checkTurnLimits(
    _message: string
  ): { violation: ConversationViolation; suggested?: string } | null {
    const limits = this.config.turnLimits;
    if (!limits) return null;

    if (limits.maxTurnsPerSession && this.state.turnCount > limits.maxTurnsPerSession) {
      return {
        violation: {
          rule: 'turn-limit-session',
          category: 'turn-limit',
          severity: 'medium',
          message: `Session turn limit exceeded (${this.state.turnCount}/${limits.maxTurnsPerSession})`,
          action: 'block',
        },
        suggested:
          'This session has reached the maximum number of turns. Please start a new conversation.',
      };
    }

    if (
      limits.maxTurnsPerTopic &&
      this.state.turnsOnCurrentTopic >= limits.maxTurnsPerTopic
    ) {
      return {
        violation: {
          rule: 'turn-limit-topic',
          category: 'turn-limit',
          severity: 'low',
          message: `Topic turn limit reached (${this.state.turnsOnCurrentTopic}/${limits.maxTurnsPerTopic})`,
          action: 'redirect',
        },
        suggested:
          'We have been discussing this topic for a while. Would you like to explore a different topic or is there something else I can help with?',
      };
    }

    return null;
  }

  private checkTopics(
    message: string
  ): Array<{ violation: ConversationViolation; suggested?: string }> {
    const results: Array<{ violation: ConversationViolation; suggested?: string }> = [];
    const lowerMessage = message.toLowerCase();

    for (const topic of this.topics) {
      // If language is specified, only match if the detected language matches
      if (
        topic.language &&
        this.state.detectedLanguage &&
        topic.language !== this.state.detectedLanguage
      ) {
        continue;
      }

      for (const pattern of topic.patterns) {
        let matched = false;
        try {
          const regex = new RegExp(pattern, 'gi');
          matched = regex.test(message);
        } catch {
          // Fall back to keyword matching
          matched = lowerMessage.includes(pattern.toLowerCase());
        }

        if (matched) {
          results.push({
            violation: {
              rule: `topic-restriction-${topic.id}`,
              category: 'topic-restriction',
              severity: topic.severity ?? 'medium',
              message: `Restricted topic detected: ${topic.name}`,
              action: topic.action,
            },
            suggested: topic.responseMessage,
          });
          break; // One match per topic is enough
        }
      }
    }

    return results;
  }

  private detectEscalation(message: string): void {
    const allPatterns: Array<{ patterns: RegExp[]; reason: EscalationReason }> = [
      { patterns: ESCALATION_FRUSTRATION_PATTERNS, reason: 'frustration' },
      { patterns: ESCALATION_EXPLICIT_PATTERNS, reason: 'explicit-request' },
      { patterns: ESCALATION_PROFANITY_PATTERNS, reason: 'profanity' },
      { patterns: ESCALATION_THREAT_PATTERNS, reason: 'threat' },
    ];

    // Add custom patterns as frustration
    if (this.config.escalationPatterns) {
      const customRegexes = this.config.escalationPatterns.map((p) => {
        try {
          return new RegExp(p, 'gi');
        } catch {
          return new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        }
      });
      allPatterns.push({ patterns: customRegexes, reason: 'frustration' });
    }

    for (const { patterns, reason } of allPatterns) {
      for (const p of patterns) {
        if (p.test(message)) {
          this.state.escalationDetected = true;
          if (!this.state.escalationReasons.includes(reason)) {
            this.state.escalationReasons.push(reason);
          }
          break;
        }
      }
    }

    // Repeated issue detection: if the same message appears 3+ times
    // We check turnsOnCurrentTopic as a proxy
    if (this.state.turnsOnCurrentTopic >= 3) {
      this.state.escalationDetected = true;
      if (!this.state.escalationReasons.includes('repeated-issue')) {
        this.state.escalationReasons.push('repeated-issue');
      }
    }
  }

  private checkRole(
    message: string,
    history: Message[]
  ): { violation: ConversationViolation; suggested?: string } | null {
    const role = this.config.role!;

    // Check if user is trying to make the assistant impersonate
    const impersonationPats = [
      ...IMPERSONATION_PATTERNS,
      ...(role.impersonationPatterns ?? []).map((p) => {
        try {
          return new RegExp(p, 'gi');
        } catch {
          return new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        }
      }),
    ];

    for (const p of impersonationPats) {
      if (p.test(message)) {
        return {
          violation: {
            rule: 'role-impersonation',
            category: 'role-enforcement',
            severity: 'high',
            message: `Impersonation attempt detected. Assistant must remain in role: ${role.roleName}`,
            action: 'block',
          },
          suggested: `I'm ${role.roleName} and I need to stay in my role. How can I help you within my area of expertise?`,
        };
      }
    }

    // Check if the last assistant message broke character
    if (role.breakPatterns && history.length > 0) {
      const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
      if (lastAssistant) {
        for (const pattern of role.breakPatterns) {
          let matched = false;
          try {
            matched = new RegExp(pattern, 'gi').test(lastAssistant.content);
          } catch {
            matched = lastAssistant.content.toLowerCase().includes(pattern.toLowerCase());
          }
          if (matched) {
            return {
              violation: {
                rule: 'role-break',
                category: 'role-enforcement',
                severity: 'medium',
                message: `Assistant broke character from role: ${role.roleName}`,
                action: 'warn',
              },
            };
          }
        }
      }
    }

    return null;
  }

  private checkGatedInfo(
    message: string
  ): { violation: ConversationViolation; suggested?: string } | null {
    for (const gate of this.gatedInfo) {
      let triggered = false;
      for (const pattern of gate.triggerPatterns) {
        try {
          if (new RegExp(pattern, 'gi').test(message)) {
            triggered = true;
            break;
          }
        } catch {
          if (message.toLowerCase().includes(pattern.toLowerCase())) {
            triggered = true;
            break;
          }
        }
      }

      if (triggered) {
        const missingVerifications = gate.requiredVerifications.filter(
          (v) => !this.state.completedVerifications.includes(v)
        );

        if (missingVerifications.length > 0) {
          return {
            violation: {
              rule: `gated-info-${gate.key}`,
              category: 'information-gate',
              severity: 'high',
              message: `Gated information requested without required verification: ${missingVerifications.join(', ')}`,
              action: 'block',
            },
            suggested: `Before I can provide that information, I need to verify your identity. Please complete: ${missingVerifications.join(', ')}.`,
          };
        }
      }
    }

    return null;
  }

  private updateTopicTracking(message: string): void {
    // Simple topic extraction: use the first matched topic restriction, or use
    // the most prominent noun-like words as a pseudo-topic
    let detectedTopic: string | null = null;

    for (const topic of this.topics) {
      for (const pattern of topic.patterns) {
        try {
          if (new RegExp(pattern, 'gi').test(message)) {
            detectedTopic = topic.id;
            break;
          }
        } catch {
          if (message.toLowerCase().includes(pattern.toLowerCase())) {
            detectedTopic = topic.id;
            break;
          }
        }
      }
      if (detectedTopic) break;
    }

    if (!detectedTopic) {
      // Use a simple hash of significant words as topic ID
      const words = message
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .slice(0, 3);
      if (words.length > 0) {
        detectedTopic = words.join('-');
      }
    }

    if (detectedTopic) {
      if (this.state.currentTopic === detectedTopic) {
        this.state.turnsOnCurrentTopic += 1;
      } else {
        this.state.currentTopic = detectedTopic;
        this.state.turnsOnCurrentTopic = 1;
        if (!this.state.topicsDiscussed.includes(detectedTopic)) {
          this.state.topicsDiscussed.push(detectedTopic);
        }
      }
    }
  }
}
