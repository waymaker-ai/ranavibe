import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Finding, RanaConfig, Severity } from '../types.js';

/** Valid severity values */
const VALID_SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

/** Known rule IDs */
const KNOWN_RULES = [
  'no-hardcoded-keys',
  'no-pii-in-prompts',
  'no-injection-vuln',
  'approved-models',
  'cost-estimation',
  'safe-defaults',
];

/**
 * Minimal YAML parser for .rana.yml files.
 * Handles simple key: value, nested objects, and arrays.
 * Zero dependencies -- intentionally limited to the structures we expect.
 */
export function parseSimpleYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split('\n');
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [
    { obj: result, indent: -1 },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const rawLine = line;

    // Skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Calculate indentation
    const indent = rawLine.search(/\S/);

    // Parse key: value
    const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*)?$/);
    if (!kvMatch) {
      // Array item: - value
      const arrMatch = trimmed.match(/^-\s+(.+)$/);
      if (arrMatch) {
        // Find current object and last key set on it
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop();
        }
        const parent = stack[stack.length - 1].obj;
        // Find the last key that was added to parent
        const keys = Object.keys(parent);
        const lastKey = keys[keys.length - 1];
        if (lastKey) {
          if (!Array.isArray(parent[lastKey])) {
            parent[lastKey] = [];
          }
          (parent[lastKey] as unknown[]).push(parseValue(arrMatch[1]));
        }
        continue;
      }
      continue;
    }

    const key = kvMatch[1];
    const valueStr = kvMatch[2]?.trim() || '';

    // Pop stack entries at same or deeper indentation
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1].obj;

    if (valueStr === '' || valueStr === '|' || valueStr === '>') {
      // Nested object or block scalar
      const nested: Record<string, unknown> = {};
      current[key] = nested;
      stack.push({ obj: nested, indent });
    } else {
      current[key] = parseValue(valueStr);
    }
  }

  return result;
}

function parseValue(value: string): unknown {
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  // Null
  if (value === 'null' || value === '~') return null;
  // Number
  if (/^-?\d+(\.\d+)?$/.test(value)) return parseFloat(value);
  // Quoted string
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  // Inline array [a, b, c]
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map(s => parseValue(s.trim()));
  }
  // Plain string
  return value;
}

/**
 * Validate a .rana.yml config file and return findings for any issues.
 */
export function validateConfig(configPath: string): Finding[] {
  const findings: Finding[] = [];
  const resolvedPath = path.resolve(configPath);

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    findings.push({
      file: configPath,
      line: 1,
      column: 1,
      rule: 'config-validation',
      severity: 'info',
      message: `Config file not found at ${configPath}. Using default configuration.`,
    });
    return findings;
  }

  let content: string;
  try {
    content = fs.readFileSync(resolvedPath, 'utf-8');
  } catch {
    findings.push({
      file: configPath,
      line: 1,
      column: 1,
      rule: 'config-validation',
      severity: 'high',
      message: `Cannot read config file: ${configPath}`,
    });
    return findings;
  }

  let config: Record<string, unknown>;
  try {
    config = parseSimpleYaml(content);
  } catch (err) {
    findings.push({
      file: configPath,
      line: 1,
      column: 1,
      rule: 'config-validation',
      severity: 'high',
      message: `Failed to parse YAML: ${err instanceof Error ? err.message : String(err)}`,
    });
    return findings;
  }

  // Validate top-level keys
  const validTopKeys = ['rules', 'scan', 'models', 'budget', 'ignore'];
  for (const key of Object.keys(config)) {
    if (!validTopKeys.includes(key)) {
      findings.push({
        file: configPath,
        line: findKeyLine(content, key),
        column: 1,
        rule: 'config-validation',
        severity: 'low',
        message: `Unknown top-level key "${key}". Valid keys: ${validTopKeys.join(', ')}.`,
      });
    }
  }

  // Validate rules section
  const rules = config.rules as Record<string, unknown> | undefined;
  if (rules && typeof rules === 'object') {
    for (const ruleId of Object.keys(rules)) {
      if (!KNOWN_RULES.includes(ruleId)) {
        findings.push({
          file: configPath,
          line: findKeyLine(content, ruleId),
          column: 1,
          rule: 'config-validation',
          severity: 'low',
          message: `Unknown rule "${ruleId}". Known rules: ${KNOWN_RULES.join(', ')}.`,
        });
      }

      const ruleConfig = rules[ruleId] as Record<string, unknown> | undefined;
      if (ruleConfig && typeof ruleConfig === 'object') {
        if ('severity' in ruleConfig) {
          const sev = ruleConfig.severity as string;
          if (!VALID_SEVERITIES.includes(sev as Severity)) {
            findings.push({
              file: configPath,
              line: findKeyLine(content, 'severity'),
              column: 1,
              rule: 'config-validation',
              severity: 'medium',
              message: `Invalid severity "${sev}" for rule "${ruleId}". Valid: ${VALID_SEVERITIES.join(', ')}.`,
            });
          }
        }
      }
    }
  }

  // Validate budget section
  const budget = config.budget as Record<string, unknown> | undefined;
  if (budget && typeof budget === 'object') {
    if ('monthly' in budget && typeof budget.monthly !== 'number') {
      findings.push({
        file: configPath,
        line: findKeyLine(content, 'monthly'),
        column: 1,
        rule: 'config-validation',
        severity: 'medium',
        message: 'budget.monthly must be a number.',
      });
    }
    if ('perCall' in budget && typeof budget.perCall !== 'number') {
      findings.push({
        file: configPath,
        line: findKeyLine(content, 'perCall'),
        column: 1,
        rule: 'config-validation',
        severity: 'medium',
        message: 'budget.perCall must be a number.',
      });
    }
  }

  return findings;
}

function findKeyLine(content: string, key: string): number {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(key + ':') || lines[i].trim().startsWith(key)) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Load and parse .rana.yml configuration
 */
export function loadConfig(configPath: string): RanaConfig | null {
  try {
    const content = fs.readFileSync(path.resolve(configPath), 'utf-8');
    return parseSimpleYaml(content) as unknown as RanaConfig;
  } catch {
    return null;
  }
}
