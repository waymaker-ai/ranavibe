import {
  ColangFlow,
  ColangMessage,
  ColangRule,
  ConversionResult,
  ParsedColang,
  CoFounderPolicyRule,
} from './types';

/**
 * Convert parsed Colang to CoFounder policy format.
 *
 * Conversion mapping:
 * - Dialog flows with refusal patterns -> content rules (block action)
 * - Topic restriction flows -> content rules (prohibited patterns)
 * - User message patterns -> input validation rules
 * - Bot response templates -> output rules
 * - Rules with stop actions -> blocking rules
 */
export function convertToPolicy(
  colang: ParsedColang,
  sourceName: string = 'colang-import',
): ConversionResult {
  const rules: CoFounderPolicyRule[] = [];
  const warnings: string[] = [];
  let ruleIndex = 0;

  function nextId(): string {
    return `${sourceName}-rule-${++ruleIndex}`;
  }

  // Convert user message definitions to input validation rules
  for (const userMsg of colang.userMessages) {
    const rule = convertUserMessage(userMsg, nextId());
    if (rule) {
      rules.push(rule);
    }
  }

  // Convert bot message definitions to output rules
  for (const botMsg of colang.botMessages) {
    const rule = convertBotMessage(botMsg, nextId());
    if (rule) {
      rules.push(rule);
    }
  }

  // Convert flows to content/flow rules
  for (const flow of colang.flows) {
    const flowRules = convertFlow(flow, nextId, warnings);
    rules.push(...flowRules);
  }

  // Convert rules to policy rules
  for (const colangRule of colang.rules) {
    const policyRules = convertRule(colangRule, nextId, warnings);
    rules.push(...policyRules);
  }

  return {
    rules,
    metadata: {
      sourceName,
      convertedAt: new Date().toISOString(),
      flowsProcessed: colang.flows.length,
      rulesGenerated: rules.length,
      warnings: [
        ...colang.warnings.map((w) => `Line ${w.line}: ${w.message}`),
        ...warnings,
      ],
    },
  };
}

/**
 * Convert a user message definition to an input validation rule.
 * User messages define patterns that categorize user intents.
 */
function convertUserMessage(msg: ColangMessage, id: string): CoFounderPolicyRule | null {
  if (msg.examples.length === 0) return null;

  // Check if this is a prohibited topic (name contains "ask about" harmful things)
  const isProhibited = isProhibitedIntent(msg.name);

  return {
    id,
    type: 'input-validation',
    trigger: 'input',
    action: isProhibited ? 'block' : 'allow',
    patterns: msg.examples,
    description: `Input pattern: ${msg.name}`,
    sourceRef: `define user ${msg.name}`,
  };
}

/**
 * Convert a bot message definition to an output rule.
 * Bot messages define response templates.
 */
function convertBotMessage(msg: ColangMessage, id: string): CoFounderPolicyRule | null {
  if (msg.examples.length === 0) return null;

  // Determine if this is a refusal or informational response
  const isRefusal = isRefusalMessage(msg.name, msg.examples);

  return {
    id,
    type: 'output',
    trigger: 'output',
    action: 'allow',
    patterns: msg.examples,
    response: msg.examples[0],
    description: isRefusal
      ? `Refusal response template: ${msg.name}`
      : `Response template: ${msg.name}`,
    sourceRef: `define bot ${msg.name}`,
  };
}

/**
 * Convert a flow to CoFounder policy rules.
 * Flows that pair user intents with bot refusals become content rules.
 */
function convertFlow(
  flow: ColangFlow,
  nextId: () => string,
  warnings: string[],
): CoFounderPolicyRule[] {
  const rules: CoFounderPolicyRule[] = [];

  // Look for patterns: user says X -> bot refuses
  // This indicates a content restriction
  for (let i = 0; i < flow.steps.length - 1; i++) {
    const step = flow.steps[i];
    const nextStep = flow.steps[i + 1];

    if (step.type === 'user' && nextStep.type === 'bot') {
      const userIntent = step.value;
      const botResponse = nextStep.value;

      // If the bot response is a refusal, this is a content rule
      if (isRefusalPattern(botResponse)) {
        rules.push({
          id: nextId(),
          type: 'content',
          trigger: 'input',
          action: 'block',
          patterns: [userIntent],
          response: botResponse,
          description: `Flow "${flow.name}": Block "${userIntent}" with refusal`,
          sourceRef: `define ${flow.isSubflow ? 'subflow' : 'flow'} ${flow.name}`,
          priority: flow.priority,
        });
      } else {
        // Normal dialog flow - create a flow rule
        rules.push({
          id: nextId(),
          type: 'flow',
          trigger: 'input',
          action: 'allow',
          patterns: [userIntent],
          response: botResponse,
          description: `Flow "${flow.name}": "${userIntent}" -> "${botResponse}"`,
          sourceRef: `define ${flow.isSubflow ? 'subflow' : 'flow'} ${flow.name}`,
          priority: flow.priority,
        });
      }
    }

    // Handle action steps that indicate blocking
    if (step.type === 'user' && nextStep.type === 'action' && nextStep.value === 'stop') {
      rules.push({
        id: nextId(),
        type: 'content',
        trigger: 'input',
        action: 'block',
        patterns: [step.value],
        description: `Flow "${flow.name}": Block "${step.value}" (stop action)`,
        sourceRef: `define ${flow.isSubflow ? 'subflow' : 'flow'} ${flow.name}`,
        priority: flow.priority,
      });
    }
  }

  // If no step pairs were found, create a generic flow rule
  if (rules.length === 0 && flow.steps.length > 0) {
    const userSteps = flow.steps.filter((s) => s.type === 'user');
    const botSteps = flow.steps.filter((s) => s.type === 'bot');

    if (userSteps.length > 0) {
      rules.push({
        id: nextId(),
        type: 'flow',
        trigger: 'both',
        action: 'allow',
        patterns: userSteps.map((s) => s.value),
        response: botSteps.length > 0 ? botSteps[0].value : undefined,
        description: `Flow "${flow.name}": General conversation flow`,
        sourceRef: `define ${flow.isSubflow ? 'subflow' : 'flow'} ${flow.name}`,
        priority: flow.priority,
      });
    }
  }

  return rules;
}

/**
 * Convert a Colang rule to CoFounder policy rules.
 */
function convertRule(
  colangRule: ColangRule,
  nextId: () => string,
  warnings: string[],
): CoFounderPolicyRule[] {
  const rules: CoFounderPolicyRule[] = [];

  // Check if any action is a stop (blocking rule)
  const hasStop = colangRule.actions.some((a) => a.type === 'stop');
  const utterActions = colangRule.actions.filter((a) => a.type === 'utter');

  if (hasStop || utterActions.some((a) => isRefusalPattern(a.target))) {
    // This is a blocking/refusal rule
    rules.push({
      id: nextId(),
      type: 'content',
      trigger: 'input',
      action: 'block',
      patterns: [colangRule.trigger],
      response: utterActions.length > 0 ? utterActions[0].target : undefined,
      description: `Rule "${colangRule.name}": Block trigger "${colangRule.trigger}"`,
      sourceRef: `define rule ${colangRule.name}`,
    });
  } else {
    // Normal response rule
    rules.push({
      id: nextId(),
      type: 'flow',
      trigger: 'input',
      action: 'allow',
      patterns: [colangRule.trigger],
      response: utterActions.length > 0 ? utterActions[0].target : undefined,
      description: `Rule "${colangRule.name}": Handle "${colangRule.trigger}"`,
      sourceRef: `define rule ${colangRule.name}`,
    });
  }

  // Convert execute actions to separate rules
  const executeActions = colangRule.actions.filter((a) => a.type === 'execute');
  for (const action of executeActions) {
    warnings.push(
      `Rule "${colangRule.name}": Execute action "${action.target}" requires manual mapping to CoFounder action`,
    );
  }

  return rules;
}

// --- Helpers ---

/** Common patterns indicating a prohibited user intent */
const prohibitedPatterns = [
  'harmful', 'illegal', 'dangerous', 'weapon', 'drug', 'hack',
  'exploit', 'attack', 'abuse', 'violence', 'hate', 'discriminat',
  'off.?topic', 'restricted', 'prohibited', 'not.?allowed',
];

function isProhibitedIntent(name: string): boolean {
  const lower = name.toLowerCase();
  return prohibitedPatterns.some((p) => new RegExp(p).test(lower));
}

/** Common patterns indicating a refusal bot message */
const refusalPatterns = [
  'cannot', "can't", 'not able to', 'not allowed', 'refuse',
  'sorry', 'apologize', 'inappropriate', 'not appropriate',
  'against my', 'unable to', 'decline', 'will not', "won't",
  'off.?topic', 'outside.*scope', 'not designed to',
];

function isRefusalMessage(name: string, examples: string[]): boolean {
  const lower = name.toLowerCase();
  if (refusalPatterns.some((p) => new RegExp(p).test(lower))) return true;

  // Check if examples contain refusal language
  return examples.some((ex) => {
    const exLower = ex.toLowerCase();
    return refusalPatterns.some((p) => new RegExp(p).test(exLower));
  });
}

function isRefusalPattern(value: string): boolean {
  const lower = value.toLowerCase();
  return refusalPatterns.some((p) => new RegExp(p).test(lower));
}
