import type { RuleDefinition, RuleResult, Finding, ScanConfig } from '../types.js';

/** Pricing per 1M tokens (input / output) in USD */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-sonnet-4-20250514':        { input: 3.00, output: 15.00 },
  'claude-opus-4-20250514':          { input: 15.00, output: 75.00 },
  'claude-sonnet-4-5-20250929':      { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022':       { input: 0.80, output: 4.00 },
  'claude-3-opus-20240229':          { input: 15.00, output: 75.00 },
  'claude-3-sonnet-20240229':        { input: 3.00, output: 15.00 },
  'claude-3-haiku-20240307':         { input: 0.25, output: 1.25 },
  // OpenAI
  'gpt-4o':                          { input: 2.50, output: 10.00 },
  'gpt-4o-mini':                     { input: 0.15, output: 0.60 },
  'gpt-4-turbo':                     { input: 10.00, output: 30.00 },
  'gpt-4':                           { input: 30.00, output: 60.00 },
  'gpt-3.5-turbo':                   { input: 0.50, output: 1.50 },
  'o1':                              { input: 15.00, output: 60.00 },
  'o1-mini':                         { input: 3.00, output: 12.00 },
  'o1-preview':                      { input: 15.00, output: 60.00 },
  'o3-mini':                         { input: 1.10, output: 4.40 },
  // Google
  'gemini-2.0-flash':                { input: 0.10, output: 0.40 },
  'gemini-1.5-pro':                  { input: 1.25, output: 5.00 },
  'gemini-1.5-flash':                { input: 0.075, output: 0.30 },
  // Mistral
  'mistral-large-latest':            { input: 2.00, output: 6.00 },
  'mistral-small-latest':            { input: 0.20, output: 0.60 },
};

/** Regex to find LLM API calls with model references */
const CALL_PATTERNS = [
  /(?:model|model_name|model_id|modelId)\s*[:=]\s*["']([^"']+)["']/gi,
];

/** Regex to find max_tokens settings */
const MAX_TOKENS_PATTERN = /(?:max_tokens|maxTokens|max_output_tokens)\s*[:=]\s*(\d+)/gi;

/** Estimate average tokens per call (if max_tokens not specified) */
const DEFAULT_ESTIMATED_TOKENS = 2000;

/** Assumed calls per month for a single code reference */
const ASSUMED_MONTHLY_CALLS = 10000;

export const costEstimation: RuleDefinition = {
  id: 'cost-estimation',
  name: 'Cost Estimation',
  description: 'Estimate costs from LLM calls found in code and warn about expensive configurations.',
  severity: 'medium',
  fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py'],

  run(filePath: string, content: string, config: ScanConfig): RuleResult {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // First pass: find max_tokens settings near model references
    const maxTokensByLine: Map<number, number> = new Map();
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      MAX_TOKENS_PATTERN.lastIndex = 0;
      const mtMatch = MAX_TOKENS_PATTERN.exec(line);
      if (mtMatch) {
        maxTokensByLine.set(lineIdx, parseInt(mtMatch[1], 10));
      }
    }

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) continue;

      for (const pattern of CALL_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(line)) !== null) {
          const modelName = match[1].toLowerCase();
          const pricing = MODEL_PRICING[modelName];

          if (!pricing) continue;

          // Look for max_tokens within ~10 lines
          let estimatedTokens = DEFAULT_ESTIMATED_TOKENS;
          for (let nearby = Math.max(0, lineIdx - 5); nearby <= Math.min(lines.length - 1, lineIdx + 10); nearby++) {
            const mt = maxTokensByLine.get(nearby);
            if (mt !== undefined) {
              estimatedTokens = mt;
              break;
            }
          }

          // Calculate estimated cost per call
          const inputCost = (pricing.input / 1_000_000) * estimatedTokens;
          const outputCost = (pricing.output / 1_000_000) * estimatedTokens;
          const perCallCost = inputCost + outputCost;

          // Estimated monthly cost
          const monthlyCost = perCallCost * ASSUMED_MONTHLY_CALLS;

          // Determine severity based on cost
          let severity: 'high' | 'medium' | 'low' | 'info' = 'info';
          if (config.budgetLimit && monthlyCost > config.budgetLimit) {
            severity = 'high';
          } else if (monthlyCost > 1000) {
            severity = 'medium';
          } else if (monthlyCost > 100) {
            severity = 'low';
          }

          const costMsg = `Model "${match[1]}" estimated ~$${perCallCost.toFixed(4)}/call ` +
            `($${monthlyCost.toFixed(2)}/month at ${ASSUMED_MONTHLY_CALLS.toLocaleString()} calls). ` +
            `Pricing: $${pricing.input}/M input, $${pricing.output}/M output.`;

          findings.push({
            file: filePath,
            line: lineIdx + 1,
            column: match.index + 1,
            rule: 'cost-estimation',
            severity,
            message: costMsg,
            suggestion: monthlyCost > 500
              ? `Consider using a cheaper model or reducing max_tokens. Current estimate: $${monthlyCost.toFixed(2)}/month.`
              : undefined,
            source: trimmed,
          });
        }
      }
    }

    return { findings };
  },
};

export default costEstimation;
