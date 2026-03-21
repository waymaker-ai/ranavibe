export * from './types';
export { parseColang } from './parser';
export { convertToPolicy } from './converter';

import { parseColang } from './parser';
import { convertToPolicy } from './converter';
import { ConversionResult, ParsedColang } from './types';

/**
 * Parse a Colang file and convert it to RANA policy format in one step.
 *
 * @param source - The Colang source text
 * @param sourceName - Optional name for the source (used in rule IDs)
 * @returns Conversion result with RANA policy rules
 *
 * @example
 * ```typescript
 * import { importColangFile } from '@ranavibe/colang';
 * import { readFileSync } from 'fs';
 *
 * const source = readFileSync('./guardrails.co', 'utf-8');
 * const result = importColangFile(source, 'my-guardrails');
 *
 * console.log(`Generated ${result.metadata.rulesGenerated} rules`);
 * for (const rule of result.rules) {
 *   console.log(`  [${rule.action}] ${rule.description}`);
 * }
 * ```
 */
export function importColangFile(
  source: string,
  sourceName: string = 'colang-import',
): ConversionResult {
  const parsed = parseColang(source);
  return convertToPolicy(parsed, sourceName);
}

/**
 * Parse Colang source without converting - useful for inspection.
 */
export function inspectColang(source: string): ParsedColang {
  return parseColang(source);
}
