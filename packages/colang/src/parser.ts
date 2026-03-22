import {
  ColangAction,
  ColangFlow,
  ColangFlowStep,
  ColangMessage,
  ColangRule,
  ParsedColang,
  ParseWarning,
} from './types';

/**
 * Parse Colang 1.0 source text into structured representation.
 *
 * Handles:
 * - `define user ...` blocks (user message patterns)
 * - `define bot ...` blocks (bot response templates)
 * - `define flow ...` blocks (conversation flow rules)
 * - `define subflow ...` blocks (sub-flows)
 * - `define rule ...` blocks (trigger-action rules)
 * - Indentation-based block structure (Python-like)
 */
export function parseColang(source: string): ParsedColang {
  const lines = source.split('\n');
  const userMessages: ColangMessage[] = [];
  const botMessages: ColangMessage[] = [];
  const flows: ColangFlow[] = [];
  const rules: ColangRule[] = [];
  const warnings: ParseWarning[] = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (trimmed === '' || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    // Parse define blocks
    if (trimmed.startsWith('define ')) {
      const defineResult = parseDefineBlock(lines, i, warnings);
      i = defineResult.nextIndex;

      if (defineResult.type === 'user') {
        userMessages.push(defineResult.message!);
      } else if (defineResult.type === 'bot') {
        botMessages.push(defineResult.message!);
      } else if (defineResult.type === 'flow' || defineResult.type === 'subflow') {
        flows.push(defineResult.flow!);
      } else if (defineResult.type === 'rule') {
        rules.push(defineResult.rule!);
      }
    } else {
      warnings.push({ line: i + 1, message: `Unexpected line outside of define block: "${trimmed}"` });
      i++;
    }
  }

  return { userMessages, botMessages, flows, rules, source, warnings };
}

interface DefineBlockResult {
  type: 'user' | 'bot' | 'flow' | 'subflow' | 'rule';
  nextIndex: number;
  message?: ColangMessage;
  flow?: ColangFlow;
  rule?: ColangRule;
}

function parseDefineBlock(
  lines: string[],
  startIndex: number,
  warnings: ParseWarning[],
): DefineBlockResult {
  const headerLine = lines[startIndex].trim();

  // Parse the define header
  const userMatch = headerLine.match(/^define\s+user\s+(.+)$/);
  const botMatch = headerLine.match(/^define\s+bot\s+(.+)$/);
  const flowMatch = headerLine.match(/^define\s+flow\s+(.+)$/);
  const subflowMatch = headerLine.match(/^define\s+subflow\s+(.+)$/);
  const ruleMatch = headerLine.match(/^define\s+rule\s+(.+)$/);

  if (userMatch) {
    const { examples, nextIndex } = parseIndentedBlock(lines, startIndex + 1);
    return {
      type: 'user',
      nextIndex,
      message: { role: 'user', name: userMatch[1].trim(), examples },
    };
  }

  if (botMatch) {
    const { examples, nextIndex } = parseIndentedBlock(lines, startIndex + 1);
    return {
      type: 'bot',
      nextIndex,
      message: { role: 'bot', name: botMatch[1].trim(), examples },
    };
  }

  if (flowMatch) {
    const { steps, nextIndex } = parseFlowBody(lines, startIndex + 1, warnings);
    return {
      type: 'flow',
      nextIndex,
      flow: { name: flowMatch[1].trim(), isSubflow: false, steps },
    };
  }

  if (subflowMatch) {
    const { steps, nextIndex } = parseFlowBody(lines, startIndex + 1, warnings);
    return {
      type: 'subflow',
      nextIndex,
      flow: { name: subflowMatch[1].trim(), isSubflow: true, steps },
    };
  }

  if (ruleMatch) {
    const { actions, trigger, nextIndex } = parseRuleBody(lines, startIndex + 1, warnings);
    return {
      type: 'rule',
      nextIndex,
      rule: { name: ruleMatch[1].trim(), trigger, actions },
    };
  }

  warnings.push({
    line: startIndex + 1,
    message: `Unrecognized define type: "${headerLine}"`,
  });
  return { type: 'flow', nextIndex: startIndex + 1 };
}

function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function parseIndentedBlock(
  lines: string[],
  startIndex: number,
): { examples: string[]; nextIndex: number } {
  const examples: string[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty lines within a block are OK, but stop at non-indented content
    if (trimmed === '') {
      // Check if next non-empty line is still indented
      let nextNonEmpty = i + 1;
      while (nextNonEmpty < lines.length && lines[nextNonEmpty].trim() === '') {
        nextNonEmpty++;
      }
      if (nextNonEmpty >= lines.length || getIndentLevel(lines[nextNonEmpty]) === 0) {
        i = nextNonEmpty;
        break;
      }
      i++;
      continue;
    }

    // If we hit a non-indented line, we're done with this block
    if (getIndentLevel(line) === 0) {
      break;
    }

    // Remove leading quotes and whitespace
    let example = trimmed;
    if (example.startsWith('"') && example.endsWith('"')) {
      example = example.slice(1, -1);
    } else if (example.startsWith("'") && example.endsWith("'")) {
      example = example.slice(1, -1);
    }
    examples.push(example);
    i++;
  }

  return { examples, nextIndex: i };
}

function parseFlowBody(
  lines: string[],
  startIndex: number,
  warnings: ParseWarning[],
): { steps: ColangFlowStep[]; nextIndex: number } {
  const steps: ColangFlowStep[] = [];
  let i = startIndex;

  // Determine the base indent level from the first non-empty line
  while (i < lines.length && lines[i].trim() === '') {
    i++;
  }

  if (i >= lines.length || getIndentLevel(lines[i]) === 0) {
    return { steps, nextIndex: i };
  }

  const baseIndent = getIndentLevel(lines[i]);

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    const indent = getIndentLevel(line);

    // If we've returned to a lower indent level, this block is done
    if (indent < baseIndent) {
      break;
    }

    // Only process lines at our base indent level
    if (indent > baseIndent) {
      i++;
      continue;
    }

    const step = parseFlowStep(trimmed, i, warnings);
    if (step) {
      // Check for nested steps (if/when blocks)
      if (step.type === 'if' || step.type === 'when') {
        const nested = parseFlowBody(lines, i + 1, warnings);
        step.children = nested.steps;
        i = nested.nextIndex;

        // Check for else
        if (i < lines.length && lines[i].trim().startsWith('else')) {
          const elseNested = parseFlowBody(lines, i + 1, warnings);
          step.elseChildren = elseNested.steps;
          i = elseNested.nextIndex;
        }
      } else {
        i++;
      }
      steps.push(step);
    } else {
      i++;
    }
  }

  return { steps, nextIndex: i };
}

function parseFlowStep(
  trimmed: string,
  lineIndex: number,
  warnings: ParseWarning[],
): ColangFlowStep | null {
  // user said "..." or user ...
  if (trimmed.startsWith('user ')) {
    const value = trimmed.slice(5).trim();
    return { type: 'user', value: stripQuotes(value) };
  }

  // bot said "..." or bot ...
  if (trimmed.startsWith('bot ')) {
    const value = trimmed.slice(4).trim();
    return { type: 'bot', value: stripQuotes(value) };
  }

  // execute action
  if (trimmed.startsWith('execute ') || trimmed.startsWith('do ')) {
    const prefix = trimmed.startsWith('execute ') ? 'execute ' : 'do ';
    const value = trimmed.slice(prefix.length).trim();
    return { type: 'action', value };
  }

  // if condition
  if (trimmed.startsWith('if ')) {
    const value = trimmed.slice(3).trim();
    return { type: 'if', value, children: [], elseChildren: [] };
  }

  // when condition
  if (trimmed.startsWith('when ')) {
    const value = trimmed.slice(5).trim();
    return { type: 'when', value, children: [], elseChildren: [] };
  }

  // stop
  if (trimmed === 'stop') {
    return { type: 'action', value: 'stop' };
  }

  // goto
  if (trimmed.startsWith('goto ')) {
    return { type: 'action', value: trimmed };
  }

  warnings.push({
    line: lineIndex + 1,
    message: `Unrecognized flow step: "${trimmed}"`,
  });

  return null;
}

function parseRuleBody(
  lines: string[],
  startIndex: number,
  warnings: ParseWarning[],
): { trigger: string; actions: ColangAction[]; nextIndex: number } {
  const actions: ColangAction[] = [];
  let trigger = '';
  let i = startIndex;

  while (i < lines.length && lines[i].trim() === '') {
    i++;
  }

  if (i >= lines.length || getIndentLevel(lines[i]) === 0) {
    return { trigger, actions, nextIndex: i };
  }

  const baseIndent = getIndentLevel(lines[i]);

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    const indent = getIndentLevel(line);
    if (indent < baseIndent) {
      break;
    }

    if (indent > baseIndent) {
      i++;
      continue;
    }

    // First user line is the trigger
    if (trimmed.startsWith('user ') && !trigger) {
      trigger = trimmed.slice(5).trim();
      i++;
      continue;
    }

    // Parse actions
    const action = parseAction(trimmed);
    if (action) {
      actions.push(action);
    } else {
      warnings.push({
        line: i + 1,
        message: `Unrecognized rule action: "${trimmed}"`,
      });
    }
    i++;
  }

  return { trigger, actions, nextIndex: i };
}

function parseAction(trimmed: string): ColangAction | null {
  if (trimmed.startsWith('bot ')) {
    return { type: 'utter', target: stripQuotes(trimmed.slice(4).trim()) };
  }
  if (trimmed.startsWith('execute ')) {
    return { type: 'execute', target: trimmed.slice(8).trim() };
  }
  if (trimmed.startsWith('do ')) {
    return { type: 'execute', target: trimmed.slice(3).trim() };
  }
  if (trimmed.startsWith('set ')) {
    const parts = trimmed.slice(4).split('=').map((s) => s.trim());
    return { type: 'set', target: parts[0], params: { value: parts[1] || '' } };
  }
  if (trimmed === 'stop') {
    return { type: 'stop', target: '' };
  }
  if (trimmed.startsWith('goto ')) {
    return { type: 'goto', target: trimmed.slice(5).trim() };
  }
  return null;
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}
