import type { RuleDefinition, RuleResult, Finding, ScanConfig } from '../types.js';

/** Default approved models */
const DEFAULT_APPROVED_MODELS = [
  // Anthropic
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  // OpenAI
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'o1',
  'o1-mini',
  'o1-preview',
  'o3-mini',
  // Google
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  // Meta (via providers)
  'llama-3.1-70b',
  'llama-3.1-8b',
  'llama-3.2-90b',
  // Mistral
  'mistral-large-latest',
  'mistral-small-latest',
];

/** Models that are deprecated or preview and should warn */
const DEPRECATED_MODELS: Record<string, string> = {
  'gpt-4-0314': 'Deprecated. Use gpt-4-turbo instead.',
  'gpt-4-0613': 'Deprecated. Use gpt-4-turbo instead.',
  'gpt-3.5-turbo-0301': 'Deprecated. Use gpt-3.5-turbo instead.',
  'gpt-3.5-turbo-0613': 'Deprecated. Use gpt-3.5-turbo instead.',
  'claude-2': 'Deprecated. Use claude-3-5-sonnet-20241022 instead.',
  'claude-2.1': 'Deprecated. Use claude-3-5-sonnet-20241022 instead.',
  'claude-instant-1.2': 'Deprecated. Use claude-3-haiku-20240307 instead.',
  'text-davinci-003': 'Deprecated. Use gpt-3.5-turbo instead.',
  'code-davinci-002': 'Deprecated. Use gpt-4 instead.',
};

/** Regex to find model references in code */
const MODEL_PATTERNS = [
  // model = "..." or model: "..."
  /(?:model|model_name|model_id|modelId|modelName)\s*[:=]\s*["']([^"']+)["']/gi,
  // Anthropic client usage
  /\.create\s*\(\s*\{[^}]*model\s*:\s*["']([^"']+)["']/gi,
  // OpenAI client usage
  /(?:openai|client|anthropic)\.(?:chat|messages|completions)\.create\s*\([^)]*model\s*[:=]\s*["']([^"']+)["']/gi,
];

export const approvedModels: RuleDefinition = {
  id: 'approved-models',
  name: 'Approved Models',
  description: 'Check that model references use approved models and warn about deprecated or preview models.',
  severity: 'medium',
  fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py', '.yml', '.yaml', '.json'],

  run(filePath: string, content: string, config: ScanConfig): RuleResult {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    const approvedList = config.approvedModels && config.approvedModels.length > 0
      ? config.approvedModels
      : DEFAULT_APPROVED_MODELS;

    // Normalize approved list for comparison
    const approvedSet = new Set(approvedList.map(m => m.toLowerCase()));

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) continue;

      for (const pattern of MODEL_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(line)) !== null) {
          const modelName = match[1];
          const modelLower = modelName.toLowerCase();

          // Check deprecated first
          const deprecationMsg = DEPRECATED_MODELS[modelLower];
          if (deprecationMsg) {
            findings.push({
              file: filePath,
              line: lineIdx + 1,
              column: match.index + 1,
              rule: 'approved-models',
              severity: 'medium',
              message: `Deprecated model "${modelName}". ${deprecationMsg}`,
              suggestion: deprecationMsg,
              source: trimmed,
            });
            continue;
          }

          // Check against approved list
          if (!approvedSet.has(modelLower)) {
            findings.push({
              file: filePath,
              line: lineIdx + 1,
              column: match.index + 1,
              rule: 'approved-models',
              severity: 'medium',
              message: `Model "${modelName}" is not in the approved models list.`,
              suggestion: `Use one of the approved models: ${approvedList.slice(0, 5).join(', ')}...`,
              source: trimmed,
            });
          }
        }
      }
    }

    return { findings };
  },
};

export default approvedModels;
