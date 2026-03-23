// ---------------------------------------------------------------------------
// @waymakerai/aicofounder-conversation-guard - Core type definitions
// ---------------------------------------------------------------------------

/** Severity level for a conversation violation. */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** The phase of a conversation. */
export type ConversationPhase =
  | 'greeting'
  | 'question'
  | 'answer'
  | 'follow-up'
  | 'farewell'
  | 'unknown';

/** Action to take when a topic restriction is triggered. */
export type RestrictionAction = 'block' | 'redirect' | 'warn';

/** Escalation reason detected. */
export type EscalationReason =
  | 'frustration'
  | 'explicit-request'
  | 'repeated-issue'
  | 'profanity'
  | 'threat';

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Topic restrictions
// ---------------------------------------------------------------------------

export interface TopicRestriction {
  /** Unique identifier for the topic. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Keywords or regex patterns that identify this topic. */
  patterns: string[];
  /** Action when the topic is detected. */
  action: RestrictionAction;
  /** Message to return when the topic is blocked or redirected. */
  responseMessage?: string;
  /** Severity of the violation. */
  severity?: Severity;
  /** Language code for multi-language matching (default: all). */
  language?: string;
}

// ---------------------------------------------------------------------------
// Flow rules
// ---------------------------------------------------------------------------

export interface FlowRule {
  /** Unique identifier for the rule. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Description of what this rule enforces. */
  description?: string;
  /** Condition function: returns true if the rule is violated. */
  condition: (state: ConversationState, message: string, history: Message[]) => boolean;
  /** Action to take when violated. */
  action: RestrictionAction;
  /** Message to return on violation. */
  responseMessage?: string;
  /** Severity of the violation. */
  severity?: Severity;
}

// ---------------------------------------------------------------------------
// Gated information
// ---------------------------------------------------------------------------

export interface GatedInfo {
  /** Unique key for the gated information. */
  key: string;
  /** Description of what info is gated. */
  description?: string;
  /** Patterns in user messages that request this info. */
  triggerPatterns: string[];
  /** Verification steps required before releasing. */
  requiredVerifications: string[];
}

// ---------------------------------------------------------------------------
// Conversation state
// ---------------------------------------------------------------------------

export interface ConversationState {
  /** Current phase of the conversation. */
  phase: ConversationPhase;
  /** Total number of turns (user messages). */
  turnCount: number;
  /** Topics discussed so far. */
  topicsDiscussed: string[];
  /** Current active topic. */
  currentTopic: string | null;
  /** Number of turns on the current topic. */
  turnsOnCurrentTopic: number;
  /** Whether escalation has been detected. */
  escalationDetected: boolean;
  /** Escalation reasons detected. */
  escalationReasons: EscalationReason[];
  /** Verification steps that have been completed. */
  completedVerifications: string[];
  /** Timestamp of session start. */
  sessionStartedAt: number;
  /** Last message timestamp. */
  lastMessageAt: number;
  /** Detected language of the conversation. */
  detectedLanguage: string | null;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface ConversationViolation {
  rule: string;
  category: string;
  severity: Severity;
  message: string;
  action: RestrictionAction;
}

export interface ConversationResult {
  /** Whether the message is allowed to proceed. */
  allowed: boolean;
  /** Violations found. */
  violations: ConversationViolation[];
  /** Updated conversation state. */
  state: ConversationState;
  /** Suggested response (if redirecting or blocking). */
  suggestedResponse?: string;
  /** Summary of the conversation so far (from summarization hook). */
  summary?: string;
  /** Duration of processing in ms. */
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface TurnLimits {
  /** Maximum total turns per session. */
  maxTurnsPerSession?: number;
  /** Maximum turns on the same topic before suggesting a move. */
  maxTurnsPerTopic?: number;
}

export interface RoleConfig {
  /** Name of the role the assistant should maintain. */
  roleName: string;
  /** Patterns that indicate the assistant is breaking character. */
  breakPatterns?: string[];
  /** Patterns that indicate the user is asking the assistant to impersonate. */
  impersonationPatterns?: string[];
}

export interface SummarizationHook {
  /** Called to produce a summary of the conversation. */
  summarize: (history: Message[]) => string;
}

export interface ConversationConfig {
  /** Topic restrictions. */
  topics?: TopicRestriction[];
  /** Flow rules. */
  flowRules?: FlowRule[];
  /** Turn limits. */
  turnLimits?: TurnLimits;
  /** Role enforcement configuration. */
  role?: RoleConfig;
  /** Gated information definitions. */
  gatedInfo?: GatedInfo[];
  /** Summarization hook. */
  summarization?: SummarizationHook;
  /** Enable escalation detection (default: true). */
  detectEscalation?: boolean;
  /** Custom escalation patterns (added to built-in ones). */
  escalationPatterns?: string[];
}
