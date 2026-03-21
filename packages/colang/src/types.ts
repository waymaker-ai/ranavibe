/**
 * @cofounder/colang - Types for Colang parsing and CoFounder policy conversion
 */

/** A user or bot message pattern in Colang */
export interface ColangMessage {
  /** 'user' or 'bot' */
  role: 'user' | 'bot';
  /** The canonical name/intent */
  name: string;
  /** Example utterances / response templates */
  examples: string[];
}

/** An action that can be executed in a flow */
export interface ColangAction {
  /** Action type: 'utter', 'execute', 'set', 'if', 'stop', 'goto' */
  type: 'utter' | 'execute' | 'set' | 'if' | 'stop' | 'goto';
  /** Target name (e.g., bot message name for utter, function name for execute) */
  target: string;
  /** Parameters for the action */
  params?: Record<string, string>;
  /** Child actions (for if blocks) */
  children?: ColangAction[];
  /** Else branch actions (for if blocks) */
  elseChildren?: ColangAction[];
}

/** A conversation flow rule */
export interface ColangFlow {
  /** Name of the flow */
  name: string;
  /** Whether this is a subflow */
  isSubflow: boolean;
  /** Steps in the flow (user messages trigger bot responses/actions) */
  steps: ColangFlowStep[];
  /** Optional priority (lower = higher priority) */
  priority?: number;
}

/** A single step in a flow */
export interface ColangFlowStep {
  /** Type of step */
  type: 'user' | 'bot' | 'action' | 'if' | 'when';
  /** Intent/message name or action */
  value: string;
  /** Parameters */
  params?: Record<string, string>;
  /** Nested steps (for if/when blocks) */
  children?: ColangFlowStep[];
  /** Else branch */
  elseChildren?: ColangFlowStep[];
}

/** A Colang rule (define rule) */
export interface ColangRule {
  /** Rule name */
  name: string;
  /** Trigger condition */
  trigger: string;
  /** Actions to take */
  actions: ColangAction[];
}

/** Fully parsed Colang document */
export interface ParsedColang {
  /** All user message definitions */
  userMessages: ColangMessage[];
  /** All bot message definitions */
  botMessages: ColangMessage[];
  /** All conversation flows */
  flows: ColangFlow[];
  /** All rules */
  rules: ColangRule[];
  /** Raw source text */
  source: string;
  /** Parse warnings */
  warnings: ParseWarning[];
}

export interface ParseWarning {
  line: number;
  message: string;
}

/** CoFounder policy rule types for conversion output */
export interface CoFounderPolicyRule {
  /** Rule identifier */
  id: string;
  /** Rule type */
  type: 'content' | 'input-validation' | 'output' | 'flow';
  /** What triggers this rule */
  trigger: 'input' | 'output' | 'both';
  /** Action to take when matched */
  action: 'block' | 'warn' | 'rewrite' | 'allow';
  /** Patterns to match */
  patterns: string[];
  /** Response template if applicable */
  response?: string;
  /** Description of the rule */
  description: string;
  /** Original Colang source reference */
  sourceRef?: string;
  /** Priority */
  priority?: number;
}

/** Result of converting Colang to CoFounder policy */
export interface ConversionResult {
  /** Generated CoFounder policy rules */
  rules: CoFounderPolicyRule[];
  /** Policy metadata */
  metadata: {
    /** Original file name */
    sourceName: string;
    /** Conversion timestamp */
    convertedAt: string;
    /** Number of Colang flows processed */
    flowsProcessed: number;
    /** Number of rules generated */
    rulesGenerated: number;
    /** Conversion warnings */
    warnings: string[];
  };
}
