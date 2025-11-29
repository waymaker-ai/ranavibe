/**
 * RANA Error Handler
 *
 * Provides actionable error messages with fix suggestions
 * Inspired by Elm's friendly compiler errors
 *
 * @example
 * ```typescript
 * import { handleError, RanaCliError } from './utils/errors.js';
 *
 * try {
 *   // ... some operation
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */

import chalk from 'chalk';

/**
 * Error categories for better organization
 */
export type ErrorCategory =
  | 'auth'
  | 'config'
  | 'network'
  | 'file'
  | 'validation'
  | 'provider'
  | 'budget'
  | 'dependency'
  | 'permission'
  | 'unknown';

/**
 * Structured error with actionable information
 */
export interface RanaError {
  code: string;
  category: ErrorCategory;
  title: string;
  message: string;
  suggestion?: string;
  command?: string;
  docs?: string;
  context?: Record<string, string>;
}

/**
 * Known error patterns and their solutions
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp | ((error: any) => boolean);
  error: Omit<RanaError, 'context'>;
}> = [
  // Authentication errors
  {
    pattern: /API key not configured|OPENAI_API_KEY|api_key/i,
    error: {
      code: 'AUTH_001',
      category: 'auth',
      title: 'API Key Not Configured',
      message: 'No API key found for the requested provider.',
      suggestion: 'Configure your API key using the RANA CLI:',
      command: 'rana config:set -p <provider> -k <your-api-key>',
      docs: 'https://rana.dev/docs/configuration#api-keys',
    },
  },
  {
    pattern: /401|Unauthorized|Invalid API key|incorrect_api_key/i,
    error: {
      code: 'AUTH_002',
      category: 'auth',
      title: 'Invalid API Key',
      message: 'The provided API key is invalid or expired.',
      suggestion: 'Verify your API key and update it:',
      command: 'rana config:validate -p <provider>',
      docs: 'https://rana.dev/docs/configuration#validating-keys',
    },
  },
  {
    pattern: /insufficient_quota|rate_limit|429/i,
    error: {
      code: 'AUTH_003',
      category: 'auth',
      title: 'Rate Limited or Quota Exceeded',
      message: 'You have exceeded your API quota or hit rate limits.',
      suggestion: 'Wait a moment and try again, or check your usage:',
      command: 'rana llm:analyze',
      docs: 'https://rana.dev/docs/cost-management',
    },
  },

  // Configuration errors
  {
    pattern: /\.rana\.yml|rana\.config|config.*not found/i,
    error: {
      code: 'CONFIG_001',
      category: 'config',
      title: 'Configuration Not Found',
      message: 'No RANA configuration file found in this directory.',
      suggestion: 'Initialize RANA in your project:',
      command: 'rana init',
      docs: 'https://rana.dev/docs/quick-start',
    },
  },
  {
    pattern: /invalid.*yaml|yaml.*parse|YAMLException/i,
    error: {
      code: 'CONFIG_002',
      category: 'config',
      title: 'Invalid Configuration File',
      message: 'The .rana.yml file contains invalid YAML syntax.',
      suggestion: 'Validate your configuration file:',
      command: 'rana validate',
      docs: 'https://rana.dev/docs/configuration',
    },
  },
  {
    pattern: /unknown provider|provider not supported|PROVIDER_NOT_SUPPORTED/i,
    error: {
      code: 'CONFIG_003',
      category: 'config',
      title: 'Unknown Provider',
      message: 'The specified LLM provider is not recognized.',
      suggestion: 'View supported providers:',
      command: 'rana llm:compare',
      docs: 'https://rana.dev/docs/providers',
    },
  },

  // Network errors
  {
    pattern: /ECONNREFUSED|ENOTFOUND|network|fetch failed/i,
    error: {
      code: 'NETWORK_001',
      category: 'network',
      title: 'Connection Failed',
      message: 'Could not connect to the API endpoint.',
      suggestion: 'Check your internet connection and try again. For local models:',
      command: 'rana ollama',
      docs: 'https://rana.dev/docs/troubleshooting#network',
    },
  },
  {
    pattern: /timeout|ETIMEDOUT|request.*timed out/i,
    error: {
      code: 'NETWORK_002',
      category: 'network',
      title: 'Request Timeout',
      message: 'The API request took too long and timed out.',
      suggestion: 'Try again or use a faster model:',
      command: 'rana llm:compare',
      docs: 'https://rana.dev/docs/performance',
    },
  },
  {
    pattern: /ECONNRESET|socket hang up/i,
    error: {
      code: 'NETWORK_003',
      category: 'network',
      title: 'Connection Reset',
      message: 'The connection was unexpectedly closed.',
      suggestion: 'This is usually a temporary issue. Try again.',
    },
  },

  // File errors
  {
    pattern: /ENOENT|file not found|no such file/i,
    error: {
      code: 'FILE_001',
      category: 'file',
      title: 'File Not Found',
      message: 'The specified file does not exist.',
      suggestion: 'Check the file path and try again.',
    },
  },
  {
    pattern: /EACCES|permission denied/i,
    error: {
      code: 'FILE_002',
      category: 'permission',
      title: 'Permission Denied',
      message: 'You do not have permission to access this file.',
      suggestion: 'Check file permissions or run with elevated privileges.',
    },
  },
  {
    pattern: /EEXIST|file.*exists|already exists/i,
    error: {
      code: 'FILE_003',
      category: 'file',
      title: 'File Already Exists',
      message: 'A file with this name already exists.',
      suggestion: 'Use --force to overwrite, or choose a different name.',
    },
  },

  // Provider errors
  {
    pattern: /model.*not found|model_not_found|invalid.*model/i,
    error: {
      code: 'PROVIDER_001',
      category: 'provider',
      title: 'Model Not Found',
      message: 'The specified model does not exist or is not accessible.',
      suggestion: 'Check available models:',
      command: 'rana llm:compare',
      docs: 'https://rana.dev/docs/models',
    },
  },
  {
    pattern: /context.*length|max.*tokens|too many tokens/i,
    error: {
      code: 'PROVIDER_002',
      category: 'provider',
      title: 'Context Length Exceeded',
      message: 'Your prompt exceeds the model\'s maximum context length.',
      suggestion: 'Reduce your prompt size or use a model with larger context:',
      command: 'rana llm:compare',
      docs: 'https://rana.dev/docs/context-management',
    },
  },
  {
    pattern: /content.*filter|safety|moderation/i,
    error: {
      code: 'PROVIDER_003',
      category: 'provider',
      title: 'Content Filtered',
      message: 'The request was blocked by the provider\'s content filter.',
      suggestion: 'Review your prompt content and try again.',
      docs: 'https://rana.dev/docs/safety',
    },
  },

  // Ollama errors
  {
    pattern: /ollama.*not running|localhost:11434|ollama.*error/i,
    error: {
      code: 'OLLAMA_001',
      category: 'provider',
      title: 'Ollama Not Running',
      message: 'The Ollama server is not running or not accessible.',
      suggestion: 'Start Ollama and check its status:',
      command: 'ollama serve && rana ollama',
      docs: 'https://rana.dev/docs/local-development',
    },
  },
  {
    pattern: /ollama.*model.*not found|pull.*model/i,
    error: {
      code: 'OLLAMA_002',
      category: 'provider',
      title: 'Ollama Model Not Installed',
      message: 'The requested model is not installed locally.',
      suggestion: 'Pull the model first:',
      command: 'rana ollama:pull <model-name>',
      docs: 'https://rana.dev/docs/ollama',
    },
  },

  // Budget errors
  {
    pattern: /budget.*exceeded|spending.*limit|BUDGET_EXCEEDED/i,
    error: {
      code: 'BUDGET_001',
      category: 'budget',
      title: 'Budget Exceeded',
      message: 'You have exceeded your configured spending budget.',
      suggestion: 'Check your budget status and adjust if needed:',
      command: 'rana budget',
      docs: 'https://rana.dev/docs/budget-enforcement',
    },
  },
  {
    pattern: /budget.*warning|approaching.*limit/i,
    error: {
      code: 'BUDGET_002',
      category: 'budget',
      title: 'Approaching Budget Limit',
      message: 'You are approaching your configured spending limit.',
      suggestion: 'Review your usage and consider adjusting your budget:',
      command: 'rana budget',
    },
  },

  // Dependency errors
  {
    pattern: /module not found|cannot find module|ERR_MODULE_NOT_FOUND/i,
    error: {
      code: 'DEP_001',
      category: 'dependency',
      title: 'Missing Dependency',
      message: 'A required module or package is not installed.',
      suggestion: 'Install dependencies:',
      command: 'npm install',
    },
  },
  {
    pattern: /node.*version|requires node|engine.*incompatible/i,
    error: {
      code: 'DEP_002',
      category: 'dependency',
      title: 'Node.js Version Incompatible',
      message: 'RANA requires Node.js 18 or higher.',
      suggestion: 'Update Node.js to version 18+:',
      command: 'nvm install 18 && nvm use 18',
      docs: 'https://nodejs.org/en/download',
    },
  },

  // Validation errors
  {
    pattern: /validation.*failed|invalid.*input|schema.*error/i,
    error: {
      code: 'VALID_001',
      category: 'validation',
      title: 'Validation Error',
      message: 'The provided input failed validation.',
      suggestion: 'Check the input format and try again.',
    },
  },
];

/**
 * Format an error message with colors and structure
 */
export function formatError(error: RanaError): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(chalk.red.bold(`  ERROR [${error.code}]: ${error.title}`));
  lines.push('');

  // Message
  lines.push(chalk.white(`  ${error.message}`));
  lines.push('');

  // Context (if any)
  if (error.context && Object.keys(error.context).length > 0) {
    lines.push(chalk.gray('  Details:'));
    for (const [key, value] of Object.entries(error.context)) {
      lines.push(chalk.gray(`    ${key}: ${value}`));
    }
    lines.push('');
  }

  // Suggestion
  if (error.suggestion) {
    lines.push(chalk.yellow(`  ${error.suggestion}`));
    if (error.command) {
      lines.push('');
      lines.push(chalk.cyan(`    $ ${error.command}`));
    }
    lines.push('');
  }

  // Documentation link
  if (error.docs) {
    lines.push(chalk.gray(`  Learn more: ${error.docs}`));
    lines.push('');
  }

  // Help hint
  lines.push(chalk.gray('  Need help? Run: rana doctor'));
  lines.push('');

  return lines.join('\n');
}

/**
 * Match an error to a known pattern
 */
function matchError(error: any): RanaError | null {
  const errorString = String(error?.message || error);

  for (const { pattern, error: ranaError } of ERROR_PATTERNS) {
    let matches = false;

    if (pattern instanceof RegExp) {
      matches = pattern.test(errorString);
    } else if (typeof pattern === 'function') {
      matches = pattern(error);
    }

    if (matches) {
      // Extract context from error if available
      const context: Record<string, string> = {};

      if (error?.provider) context.provider = error.provider;
      if (error?.model) context.model = error.model;
      if (error?.status) context.status = String(error.status);
      if (error?.code) context.errorCode = error.code;

      return {
        ...ranaError,
        context: Object.keys(context).length > 0 ? context : undefined,
      };
    }
  }

  return null;
}

/**
 * Create an unknown error response
 */
function createUnknownError(error: any): RanaError {
  const message = error?.message || String(error);

  return {
    code: 'UNKNOWN_001',
    category: 'unknown',
    title: 'Unexpected Error',
    message: message.slice(0, 200) + (message.length > 200 ? '...' : ''),
    suggestion: 'Try running the doctor command to diagnose issues:',
    command: 'rana doctor',
    docs: 'https://rana.dev/docs/troubleshooting',
    context: error?.stack ? { stack: error.stack.split('\n')[1]?.trim() } : undefined,
  };
}

/**
 * Main error handler - converts any error to a friendly message
 */
export function handleError(error: any): void {
  const ranaError = matchError(error) || createUnknownError(error);
  console.error(formatError(ranaError));
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T> | void> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error);
      process.exit(1);
    }
  };
}

/**
 * Create a custom RANA CLI error
 */
export class RanaCliError extends Error {
  public code: string;
  public category: ErrorCategory;
  public suggestion?: string;
  public command?: string;
  public docs?: string;

  constructor(
    message: string,
    options: {
      code?: string;
      category?: ErrorCategory;
      suggestion?: string;
      command?: string;
      docs?: string;
    } = {}
  ) {
    super(message);
    this.name = 'RanaCliError';
    this.code = options.code || 'RANA_ERROR';
    this.category = options.category || 'unknown';
    this.suggestion = options.suggestion;
    this.command = options.command;
    this.docs = options.docs;
  }
}

/**
 * Quick error helpers
 */
export const errors = {
  missingApiKey: (provider: string) =>
    new RanaCliError(`No API key configured for ${provider}`, {
      code: 'AUTH_001',
      category: 'auth',
      suggestion: 'Configure your API key:',
      command: `rana config:set -p ${provider} -k <your-api-key>`,
      docs: 'https://rana.dev/docs/configuration#api-keys',
    }),

  configNotFound: () =>
    new RanaCliError('No .rana.yml configuration file found', {
      code: 'CONFIG_001',
      category: 'config',
      suggestion: 'Initialize RANA in your project:',
      command: 'rana init',
      docs: 'https://rana.dev/docs/quick-start',
    }),

  budgetExceeded: (spent: number, limit: number) =>
    new RanaCliError(`Budget exceeded: $${spent.toFixed(2)} of $${limit.toFixed(2)}`, {
      code: 'BUDGET_001',
      category: 'budget',
      suggestion: 'Check your budget status:',
      command: 'rana budget',
      docs: 'https://rana.dev/docs/budget-enforcement',
    }),

  modelNotFound: (model: string, provider: string) =>
    new RanaCliError(`Model "${model}" not found on ${provider}`, {
      code: 'PROVIDER_001',
      category: 'provider',
      suggestion: 'Check available models:',
      command: 'rana llm:compare',
      docs: 'https://rana.dev/docs/models',
    }),

  ollamaNotRunning: () =>
    new RanaCliError('Ollama is not running', {
      code: 'OLLAMA_001',
      category: 'provider',
      suggestion: 'Start Ollama:',
      command: 'ollama serve && rana ollama',
      docs: 'https://rana.dev/docs/local-development',
    }),
};

/**
 * Show a warning message (non-fatal)
 */
export function showWarning(message: string, suggestion?: string): void {
  console.log('');
  console.log(chalk.yellow.bold('  WARNING: ') + chalk.white(message));
  if (suggestion) {
    console.log(chalk.gray(`  Suggestion: ${suggestion}`));
  }
  console.log('');
}

/**
 * Show an info message
 */
export function showInfo(title: string, message: string): void {
  console.log('');
  console.log(chalk.cyan.bold(`  INFO: ${title}`));
  console.log(chalk.white(`  ${message}`));
  console.log('');
}

/**
 * Show a success message
 */
export function showSuccess(message: string): void {
  console.log('');
  console.log(chalk.green.bold('  SUCCESS: ') + chalk.white(message));
  console.log('');
}
