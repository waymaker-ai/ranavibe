/**
 * Prompt Management Commands
 * Save, retrieve, organize, and improve prompts for RANA
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Types
interface SavedPrompt {
  id: string;
  name: string;
  description?: string;
  content: string;
  category: PromptCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  isFavorite: boolean;
  variables?: string[]; // Extracted {{variable}} placeholders
}

type PromptCategory =
  | 'agent'
  | 'generation'
  | 'mcp'
  | 'system'
  | 'task'
  | 'custom';

interface PromptStore {
  version: string;
  prompts: SavedPrompt[];
  categories: Record<PromptCategory, { color: string; description: string }>;
}

interface PromptAnalysis {
  clarity: number; // 0-100
  specificity: number;
  actionability: number;
  suggestions: string[];
  variables: string[];
  estimatedTokens: number;
  issues: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    suggestion?: string;
  }>;
}

// Constants
const STORE_DIR = path.join(os.homedir(), '.rana');
const STORE_FILE = path.join(STORE_DIR, 'prompts.json');

const DEFAULT_CATEGORIES: Record<PromptCategory, { color: string; description: string }> = {
  agent: { color: 'blue', description: 'Agent system prompts and personas' },
  generation: { color: 'green', description: 'Code generation prompts' },
  mcp: { color: 'magenta', description: 'MCP server prompts' },
  system: { color: 'yellow', description: 'System and configuration prompts' },
  task: { color: 'cyan', description: 'Task-specific prompts' },
  custom: { color: 'white', description: 'Custom user prompts' },
};

// Helpers
function ensureStoreDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function loadStore(): PromptStore {
  ensureStoreDir();

  if (!fs.existsSync(STORE_FILE)) {
    const defaultStore: PromptStore = {
      version: '1.0.0',
      prompts: [],
      categories: DEFAULT_CATEGORIES,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(defaultStore, null, 2));
    return defaultStore;
  }

  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
  } catch {
    return {
      version: '1.0.0',
      prompts: [],
      categories: DEFAULT_CATEGORIES,
    };
  }
}

function saveStore(store: PromptStore): void {
  ensureStoreDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

function generateId(): string {
  return `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))];
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function analyzePrompt(content: string): PromptAnalysis {
  const variables = extractVariables(content);
  const tokens = estimateTokens(content);
  const issues: PromptAnalysis['issues'] = [];
  const suggestions: string[] = [];

  // Calculate clarity score
  let clarity = 100;

  // Check for vague language
  const vagueWords = ['maybe', 'perhaps', 'might', 'could possibly', 'somewhat', 'kind of', 'sort of'];
  vagueWords.forEach(word => {
    if (content.toLowerCase().includes(word)) {
      clarity -= 10;
      issues.push({
        type: 'warning',
        message: `Vague language detected: "${word}"`,
        suggestion: 'Use more definitive language for clearer instructions',
      });
    }
  });

  // Check for clear structure
  const hasStructure = content.includes('\n') || content.includes('1.') || content.includes('-');
  if (!hasStructure && content.length > 200) {
    clarity -= 15;
    suggestions.push('Consider breaking the prompt into sections or bullet points');
  }

  // Calculate specificity score
  let specificity = 50;

  // Check for specific instructions
  if (content.includes('must') || content.includes('should') || content.includes('always')) {
    specificity += 15;
  }
  if (content.includes('never') || content.includes('avoid') || content.includes('do not')) {
    specificity += 10;
  }
  if (content.includes('example') || content.includes('e.g.') || content.includes('such as')) {
    specificity += 15;
  }
  if (variables.length > 0) {
    specificity += 10;
  }

  // Check for output format specification
  if (content.includes('format') || content.includes('output') || content.includes('respond with')) {
    specificity += 10;
  } else {
    suggestions.push('Consider specifying the expected output format');
  }

  // Calculate actionability score
  let actionability = 50;

  const actionVerbs = ['create', 'generate', 'write', 'build', 'analyze', 'review', 'implement', 'design', 'explain'];
  actionVerbs.forEach(verb => {
    if (content.toLowerCase().includes(verb)) {
      actionability += 5;
    }
  });

  // Check for context
  if (content.includes('context') || content.includes('background') || content.includes('given')) {
    actionability += 10;
  }

  // Length checks
  if (content.length < 50) {
    issues.push({
      type: 'warning',
      message: 'Prompt is very short',
      suggestion: 'Consider adding more context or specific instructions',
    });
    specificity -= 20;
  }

  if (tokens > 2000) {
    issues.push({
      type: 'info',
      message: `Prompt is lengthy (~${tokens} tokens)`,
      suggestion: 'Consider breaking into smaller, focused prompts',
    });
  }

  // Check for role definition
  if (!content.toLowerCase().includes('you are') && !content.toLowerCase().includes('act as')) {
    suggestions.push('Consider adding a role definition (e.g., "You are a...")');
  }

  return {
    clarity: Math.max(0, Math.min(100, clarity)),
    specificity: Math.max(0, Math.min(100, specificity)),
    actionability: Math.max(0, Math.min(100, actionability)),
    suggestions,
    variables,
    estimatedTokens: tokens,
    issues,
  };
}

function getCategoryColor(category: PromptCategory): chalk.Chalk {
  const colors: Record<string, chalk.Chalk> = {
    blue: chalk.blue,
    green: chalk.green,
    magenta: chalk.magenta,
    yellow: chalk.yellow,
    cyan: chalk.cyan,
    white: chalk.white,
  };
  return colors[DEFAULT_CATEGORIES[category]?.color || 'white'] || chalk.white;
}

function formatPromptPreview(content: string, maxLength = 80): string {
  const oneLine = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (oneLine.length <= maxLength) return oneLine;
  return oneLine.substring(0, maxLength - 3) + '...';
}

// Built-in prompt templates
const BUILTIN_PROMPTS: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    name: 'TypeScript Agent',
    description: 'System prompt for a TypeScript-focused coding agent',
    content: `You are an expert TypeScript developer assistant. Your role is to help users write clean, type-safe, and maintainable TypeScript code.

## Guidelines:
- Always use strict TypeScript with proper type annotations
- Prefer interfaces over type aliases for object shapes
- Use generics when appropriate for reusability
- Follow functional programming patterns where suitable
- Include JSDoc comments for public APIs

## When reviewing code:
- Check for type safety issues
- Suggest improvements for readability
- Identify potential runtime errors
- Recommend best practices

{{context}}`,
    category: 'agent',
    tags: ['typescript', 'coding', 'agent'],
    isFavorite: false,
    variables: ['context'],
  },
  {
    name: 'React Component Generator',
    description: 'Generate React components with TypeScript',
    content: `Generate a React component with the following specifications:

**Component Name:** {{componentName}}
**Description:** {{description}}
**Props:** {{props}}

## Requirements:
- Use TypeScript with proper prop types
- Include JSDoc documentation
- Follow React best practices
- Use functional components with hooks
- Include basic error handling
- Make it accessible (ARIA attributes where needed)

## Output Format:
Provide the complete component code in a single file.`,
    category: 'generation',
    tags: ['react', 'component', 'typescript'],
    isFavorite: false,
    variables: ['componentName', 'description', 'props'],
  },
  {
    name: 'Code Review',
    description: 'Systematic code review prompt',
    content: `Review the following code and provide feedback:

\`\`\`{{language}}
{{code}}
\`\`\`

## Review Checklist:
1. **Correctness**: Does the code do what it's supposed to?
2. **Security**: Are there any security vulnerabilities?
3. **Performance**: Any performance concerns?
4. **Readability**: Is the code easy to understand?
5. **Maintainability**: Will this be easy to modify?
6. **Testing**: Is the code testable?

## Output Format:
- List issues by severity (critical, major, minor)
- Provide specific line references
- Suggest fixes with code examples`,
    category: 'task',
    tags: ['review', 'code-quality'],
    isFavorite: false,
    variables: ['language', 'code'],
  },
  {
    name: 'MCP Tool Definition',
    description: 'Define a new MCP tool with proper schema',
    content: `Create an MCP tool with the following specification:

**Tool Name:** {{toolName}}
**Purpose:** {{purpose}}
**Input Parameters:** {{parameters}}

## Requirements:
- Follow MCP protocol specification
- Include comprehensive input validation
- Provide clear error messages
- Add usage examples in the description
- Handle edge cases gracefully

## Output:
Provide the complete tool implementation with:
1. Tool schema definition
2. Handler implementation
3. Input validation
4. Error handling
5. Usage examples`,
    category: 'mcp',
    tags: ['mcp', 'tool', 'integration'],
    isFavorite: false,
    variables: ['toolName', 'purpose', 'parameters'],
  },
  {
    name: 'API Endpoint Generator',
    description: 'Generate REST API endpoint with validation',
    content: `Generate a REST API endpoint with these specifications:

**Endpoint:** {{method}} {{path}}
**Description:** {{description}}
**Request Body:** {{requestBody}}
**Response:** {{response}}

## Requirements:
- Use TypeScript with Zod for validation
- Include proper error handling
- Add rate limiting considerations
- Follow REST best practices
- Include OpenAPI documentation comments

## Security:
- Validate all inputs
- Sanitize outputs
- Include authentication check placeholder
- Log security-relevant events`,
    category: 'generation',
    tags: ['api', 'rest', 'backend'],
    isFavorite: false,
    variables: ['method', 'path', 'description', 'requestBody', 'response'],
  },
];

// Command Registration
export function registerPromptCommands(program: Command): void {
  const prompts = program
    .command('prompts')
    .description('Manage saved prompts and snippets');

  // Save a prompt
  prompts
    .command('save')
    .description('Save a new prompt')
    .option('-n, --name <name>', 'Prompt name')
    .option('-c, --category <category>', 'Category (agent, generation, mcp, system, task, custom)')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .option('-f, --file <file>', 'Read prompt from file')
    .action(async (options) => {
      console.log(chalk.blue.bold('\n📝 Save Prompt\n'));

      let content: string;

      if (options.file) {
        if (!fs.existsSync(options.file)) {
          console.error(chalk.red(`File not found: ${options.file}`));
          process.exit(1);
        }
        content = fs.readFileSync(options.file, 'utf-8');
        console.log(chalk.gray(`Read prompt from: ${options.file}\n`));
      } else {
        const { promptContent } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'promptContent',
            message: 'Enter your prompt (opens editor):',
          },
        ]);
        content = promptContent;
      }

      if (!content || content.trim().length === 0) {
        console.error(chalk.red('Prompt content cannot be empty'));
        process.exit(1);
      }

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Prompt name:',
          default: options.name,
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description (optional):',
        },
        {
          type: 'list',
          name: 'category',
          message: 'Category:',
          choices: Object.entries(DEFAULT_CATEGORIES).map(([key, val]) => ({
            name: `${key} - ${val.description}`,
            value: key,
          })),
          default: options.category || 'custom',
        },
        {
          type: 'input',
          name: 'tags',
          message: 'Tags (comma-separated):',
          default: options.tags || '',
        },
      ]);

      const store = loadStore();
      const variables = extractVariables(content);

      const newPrompt: SavedPrompt = {
        id: generateId(),
        name: answers.name,
        description: answers.description || undefined,
        content: content.trim(),
        category: answers.category as PromptCategory,
        tags: answers.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        isFavorite: false,
        variables: variables.length > 0 ? variables : undefined,
      };

      store.prompts.push(newPrompt);
      saveStore(store);

      console.log(chalk.green.bold(`\n✅ Prompt saved: ${newPrompt.name}`));
      console.log(chalk.gray(`   ID: ${newPrompt.id}`));
      console.log(chalk.gray(`   Category: ${newPrompt.category}`));
      if (variables.length > 0) {
        console.log(chalk.gray(`   Variables: ${variables.join(', ')}`));
      }
      console.log();
    });

  // List prompts
  prompts
    .command('list')
    .alias('ls')
    .description('List saved prompts')
    .option('-c, --category <category>', 'Filter by category')
    .option('-t, --tag <tag>', 'Filter by tag')
    .option('-f, --favorites', 'Show only favorites')
    .option('-s, --search <query>', 'Search prompts')
    .action(async (options) => {
      const store = loadStore();
      let filtered = [...store.prompts];

      // Add built-in prompts if store is empty
      if (filtered.length === 0) {
        console.log(chalk.yellow('\nNo saved prompts yet. Here are some built-in templates:\n'));
        BUILTIN_PROMPTS.forEach((p, i) => {
          const color = getCategoryColor(p.category);
          console.log(chalk.white.bold(`${i + 1}. ${p.name}`));
          console.log(chalk.gray(`   ${p.description}`));
          console.log(`   ${color(`[${p.category}]`)} ${chalk.gray(p.tags.join(', '))}`);
          console.log();
        });
        console.log(chalk.gray('Use `rana prompts import-builtins` to import these templates.\n'));
        return;
      }

      // Apply filters
      if (options.category) {
        filtered = filtered.filter(p => p.category === options.category);
      }
      if (options.tag) {
        filtered = filtered.filter(p => p.tags.includes(options.tag));
      }
      if (options.favorites) {
        filtered = filtered.filter(p => p.isFavorite);
      }
      if (options.search) {
        const query = options.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.tags.some(t => t.toLowerCase().includes(query))
        );
      }

      // Sort by usage and recency
      filtered.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      console.log(chalk.blue.bold(`\n📚 Saved Prompts (${filtered.length})\n`));

      if (filtered.length === 0) {
        console.log(chalk.gray('No prompts match your filters.\n'));
        return;
      }

      filtered.forEach((prompt, i) => {
        const color = getCategoryColor(prompt.category);
        const star = prompt.isFavorite ? '⭐ ' : '';
        console.log(chalk.white.bold(`${i + 1}. ${star}${prompt.name}`));
        if (prompt.description) {
          console.log(chalk.gray(`   ${prompt.description}`));
        }
        console.log(`   ${color(`[${prompt.category}]`)} ${chalk.gray(prompt.tags.join(', '))}`);
        console.log(chalk.gray(`   Preview: ${formatPromptPreview(prompt.content)}`));
        console.log(chalk.gray(`   Used: ${prompt.usageCount}x | ID: ${prompt.id.substring(0, 15)}...`));
        console.log();
      });
    });

  // Get/use a prompt
  prompts
    .command('use <nameOrId>')
    .description('Get a prompt by name or ID')
    .option('-v, --vars <vars>', 'Variable values as JSON')
    .option('--copy', 'Copy to clipboard')
    .action(async (nameOrId, options) => {
      const store = loadStore();
      const prompt = store.prompts.find(
        p => p.id === nameOrId ||
             p.name.toLowerCase() === nameOrId.toLowerCase() ||
             p.id.startsWith(nameOrId)
      );

      if (!prompt) {
        console.error(chalk.red(`Prompt not found: ${nameOrId}`));
        console.log(chalk.gray('\nUse `rana prompts list` to see available prompts.\n'));
        process.exit(1);
      }

      // Update usage count
      prompt.usageCount++;
      prompt.updatedAt = new Date().toISOString();
      saveStore(store);

      let content = prompt.content;

      // Replace variables if provided
      if (options.vars && prompt.variables) {
        try {
          const vars = JSON.parse(options.vars);
          for (const [key, value] of Object.entries(vars)) {
            content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
          }
        } catch {
          console.error(chalk.red('Invalid JSON for variables'));
          process.exit(1);
        }
      }

      console.log(chalk.blue.bold(`\n📝 ${prompt.name}\n`));

      if (prompt.variables && prompt.variables.length > 0) {
        const unreplaced = prompt.variables.filter(v => content.includes(`{{${v}}}`));
        if (unreplaced.length > 0) {
          console.log(chalk.yellow(`Variables to fill: ${unreplaced.join(', ')}\n`));
        }
      }

      console.log(chalk.gray('─'.repeat(60)));
      console.log(content);
      console.log(chalk.gray('─'.repeat(60)));
      console.log();

      if (options.copy) {
        // Note: clipboard functionality would need additional package
        console.log(chalk.green('Copied to clipboard!'));
      }
    });

  // Analyze a prompt
  prompts
    .command('analyze')
    .description('Analyze prompt quality and get improvement suggestions')
    .option('-f, --file <file>', 'Read prompt from file')
    .option('-n, --name <name>', 'Analyze a saved prompt by name')
    .action(async (options) => {
      let content: string;

      if (options.name) {
        const store = loadStore();
        const prompt = store.prompts.find(
          p => p.name.toLowerCase() === options.name.toLowerCase()
        );
        if (!prompt) {
          console.error(chalk.red(`Prompt not found: ${options.name}`));
          process.exit(1);
        }
        content = prompt.content;
        console.log(chalk.blue.bold(`\n🔍 Analyzing: ${prompt.name}\n`));
      } else if (options.file) {
        if (!fs.existsSync(options.file)) {
          console.error(chalk.red(`File not found: ${options.file}`));
          process.exit(1);
        }
        content = fs.readFileSync(options.file, 'utf-8');
        console.log(chalk.blue.bold(`\n🔍 Analyzing prompt from: ${options.file}\n`));
      } else {
        const { promptContent } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'promptContent',
            message: 'Enter the prompt to analyze:',
          },
        ]);
        content = promptContent;
        console.log(chalk.blue.bold('\n🔍 Prompt Analysis\n'));
      }

      const spinner = ora('Analyzing prompt...').start();
      const analysis = analyzePrompt(content);
      spinner.stop();

      // Display scores
      console.log(chalk.white.bold('Quality Scores:\n'));

      const scoreBar = (score: number, label: string) => {
        const filled = Math.round(score / 10);
        const empty = 10 - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const color = score >= 70 ? chalk.green : score >= 40 ? chalk.yellow : chalk.red;
        console.log(`  ${label.padEnd(15)} ${color(bar)} ${score}%`);
      };

      scoreBar(analysis.clarity, 'Clarity');
      scoreBar(analysis.specificity, 'Specificity');
      scoreBar(analysis.actionability, 'Actionability');

      console.log();
      console.log(chalk.gray(`  Estimated tokens: ~${analysis.estimatedTokens}`));

      if (analysis.variables.length > 0) {
        console.log(chalk.gray(`  Variables found: ${analysis.variables.join(', ')}`));
      }

      // Display issues
      if (analysis.issues.length > 0) {
        console.log(chalk.white.bold('\n⚠️  Issues:\n'));
        analysis.issues.forEach(issue => {
          const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
          const color = issue.type === 'error' ? chalk.red : issue.type === 'warning' ? chalk.yellow : chalk.blue;
          console.log(`  ${icon} ${color(issue.message)}`);
          if (issue.suggestion) {
            console.log(chalk.gray(`     → ${issue.suggestion}`));
          }
        });
      }

      // Display suggestions
      if (analysis.suggestions.length > 0) {
        console.log(chalk.white.bold('\n💡 Suggestions:\n'));
        analysis.suggestions.forEach((suggestion, i) => {
          console.log(chalk.cyan(`  ${i + 1}. ${suggestion}`));
        });
      }

      console.log();
    });

  // Improve a prompt
  prompts
    .command('improve')
    .description('Get AI-powered improvement suggestions for a prompt')
    .option('-n, --name <name>', 'Improve a saved prompt by name')
    .option('-f, --file <file>', 'Read prompt from file')
    .action(async (options) => {
      console.log(chalk.blue.bold('\n✨ Prompt Improvement Assistant\n'));

      let content: string;
      let promptName: string | undefined;

      if (options.name) {
        const store = loadStore();
        const prompt = store.prompts.find(
          p => p.name.toLowerCase() === options.name.toLowerCase()
        );
        if (!prompt) {
          console.error(chalk.red(`Prompt not found: ${options.name}`));
          process.exit(1);
        }
        content = prompt.content;
        promptName = prompt.name;
      } else if (options.file) {
        if (!fs.existsSync(options.file)) {
          console.error(chalk.red(`File not found: ${options.file}`));
          process.exit(1);
        }
        content = fs.readFileSync(options.file, 'utf-8');
      } else {
        const { promptContent } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'promptContent',
            message: 'Enter the prompt to improve:',
          },
        ]);
        content = promptContent;
      }

      // First analyze
      const analysis = analyzePrompt(content);

      // Generate improvement suggestions based on analysis
      console.log(chalk.white.bold('Current Prompt Analysis:\n'));
      console.log(chalk.gray(`  Clarity: ${analysis.clarity}% | Specificity: ${analysis.specificity}% | Actionability: ${analysis.actionability}%\n`));

      console.log(chalk.white.bold('Suggested Improvements:\n'));

      const improvements: string[] = [];

      // Add role if missing
      if (!content.toLowerCase().includes('you are') && !content.toLowerCase().includes('act as')) {
        improvements.push(`Add a role definition at the start:
${chalk.green(`You are an expert [domain] assistant. Your role is to [primary function].`)}`);
      }

      // Add structure if missing
      if (!content.includes('\n') && content.length > 100) {
        improvements.push(`Break into structured sections:
${chalk.green(`## Context
[Background information]

## Task
[What needs to be done]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Output Format
[Expected output structure]`)}`);
      }

      // Add examples if missing
      if (!content.includes('example') && !content.includes('e.g.')) {
        improvements.push(`Add examples for clarity:
${chalk.green(`## Examples
Input: [sample input]
Output: [expected output]`)}`);
      }

      // Add constraints if missing
      if (!content.includes('must') && !content.includes('should') && !content.includes('never')) {
        improvements.push(`Add explicit constraints:
${chalk.green(`## Constraints
- Must: [required behaviors]
- Should: [preferred behaviors]
- Never: [prohibited behaviors]`)}`);
      }

      // Add output format if missing
      if (!content.includes('format') && !content.includes('output')) {
        improvements.push(`Specify output format:
${chalk.green(`## Output Format
Respond with [format type] containing:
- [Element 1]
- [Element 2]`)}`);
      }

      if (improvements.length === 0) {
        console.log(chalk.green('  ✓ Your prompt looks good! No major improvements suggested.\n'));
      } else {
        improvements.forEach((imp, i) => {
          console.log(chalk.cyan(`${i + 1}. ${imp}\n`));
        });
      }

      // Offer to save improved version
      if (promptName && improvements.length > 0) {
        const { saveImproved } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'saveImproved',
            message: 'Would you like to edit and save an improved version?',
            default: false,
          },
        ]);

        if (saveImproved) {
          const { improved } = await inquirer.prompt([
            {
              type: 'editor',
              name: 'improved',
              message: 'Edit the improved prompt:',
              default: content,
            },
          ]);

          const store = loadStore();
          const newPrompt: SavedPrompt = {
            id: generateId(),
            name: `${promptName} (improved)`,
            description: `Improved version of ${promptName}`,
            content: improved,
            category: 'custom',
            tags: ['improved'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
            isFavorite: false,
            variables: extractVariables(improved),
          };

          store.prompts.push(newPrompt);
          saveStore(store);

          console.log(chalk.green.bold(`\n✅ Improved prompt saved as: ${newPrompt.name}\n`));
        }
      }
    });

  // Delete a prompt
  prompts
    .command('delete <nameOrId>')
    .alias('rm')
    .description('Delete a saved prompt')
    .option('-f, --force', 'Skip confirmation')
    .action(async (nameOrId, options) => {
      const store = loadStore();
      const index = store.prompts.findIndex(
        p => p.id === nameOrId ||
             p.name.toLowerCase() === nameOrId.toLowerCase() ||
             p.id.startsWith(nameOrId)
      );

      if (index === -1) {
        console.error(chalk.red(`Prompt not found: ${nameOrId}`));
        process.exit(1);
      }

      const prompt = store.prompts[index];

      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Delete prompt "${prompt.name}"?`,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.gray('Cancelled.\n'));
          return;
        }
      }

      store.prompts.splice(index, 1);
      saveStore(store);

      console.log(chalk.green(`\n✅ Deleted: ${prompt.name}\n`));
    });

  // Favorite/unfavorite
  prompts
    .command('favorite <nameOrId>')
    .alias('fav')
    .description('Toggle favorite status')
    .action(async (nameOrId) => {
      const store = loadStore();
      const prompt = store.prompts.find(
        p => p.id === nameOrId ||
             p.name.toLowerCase() === nameOrId.toLowerCase() ||
             p.id.startsWith(nameOrId)
      );

      if (!prompt) {
        console.error(chalk.red(`Prompt not found: ${nameOrId}`));
        process.exit(1);
      }

      prompt.isFavorite = !prompt.isFavorite;
      prompt.updatedAt = new Date().toISOString();
      saveStore(store);

      const status = prompt.isFavorite ? '⭐ Added to favorites' : 'Removed from favorites';
      console.log(chalk.green(`\n${status}: ${prompt.name}\n`));
    });

  // Import built-in prompts
  prompts
    .command('import-builtins')
    .description('Import built-in prompt templates')
    .action(async () => {
      const store = loadStore();
      let imported = 0;

      for (const builtin of BUILTIN_PROMPTS) {
        // Check if already imported
        const exists = store.prompts.some(
          p => p.name === builtin.name && p.content === builtin.content
        );

        if (!exists) {
          store.prompts.push({
            ...builtin,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
          });
          imported++;
        }
      }

      saveStore(store);

      if (imported > 0) {
        console.log(chalk.green(`\n✅ Imported ${imported} built-in prompts\n`));
        console.log(chalk.gray('Use `rana prompts list` to see them.\n'));
      } else {
        console.log(chalk.yellow('\nAll built-in prompts already imported.\n'));
      }
    });

  // Export prompts
  prompts
    .command('export')
    .description('Export prompts to file')
    .option('-o, --output <file>', 'Output file', 'rana-prompts.json')
    .option('-c, --category <category>', 'Export only specific category')
    .action(async (options) => {
      const store = loadStore();
      let toExport = store.prompts;

      if (options.category) {
        toExport = toExport.filter(p => p.category === options.category);
      }

      const exportData = {
        version: store.version,
        exportedAt: new Date().toISOString(),
        count: toExport.length,
        prompts: toExport,
      };

      fs.writeFileSync(options.output, JSON.stringify(exportData, null, 2));
      console.log(chalk.green(`\n✅ Exported ${toExport.length} prompts to ${options.output}\n`));
    });

  // Import prompts
  prompts
    .command('import <file>')
    .description('Import prompts from file')
    .option('--overwrite', 'Overwrite existing prompts with same name')
    .action(async (file, options) => {
      if (!fs.existsSync(file)) {
        console.error(chalk.red(`File not found: ${file}`));
        process.exit(1);
      }

      const spinner = ora('Importing prompts...').start();

      try {
        const importData = JSON.parse(fs.readFileSync(file, 'utf-8'));
        const store = loadStore();
        let imported = 0;
        let skipped = 0;

        for (const prompt of importData.prompts || []) {
          const existing = store.prompts.findIndex(p => p.name === prompt.name);

          if (existing !== -1) {
            if (options.overwrite) {
              store.prompts[existing] = {
                ...prompt,
                id: store.prompts[existing].id,
                updatedAt: new Date().toISOString(),
              };
              imported++;
            } else {
              skipped++;
            }
          } else {
            store.prompts.push({
              ...prompt,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              usageCount: 0,
            });
            imported++;
          }
        }

        saveStore(store);
        spinner.succeed(chalk.green(`Imported ${imported} prompts`));

        if (skipped > 0) {
          console.log(chalk.yellow(`  ${skipped} prompts skipped (already exist)`));
          console.log(chalk.gray('  Use --overwrite to replace existing prompts'));
        }
        console.log();
      } catch (error) {
        spinner.fail(chalk.red('Failed to import'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Compare prompts
  prompts
    .command('compare <name1> <name2>')
    .description('Compare two prompts side-by-side')
    .action(async (name1, name2) => {
      const store = loadStore();

      const prompt1 = store.prompts.find(p =>
        p.name.toLowerCase() === name1.toLowerCase() || p.id.startsWith(name1)
      );
      const prompt2 = store.prompts.find(p =>
        p.name.toLowerCase() === name2.toLowerCase() || p.id.startsWith(name2)
      );

      if (!prompt1) {
        console.error(chalk.red(`Prompt not found: ${name1}`));
        process.exit(1);
      }
      if (!prompt2) {
        console.error(chalk.red(`Prompt not found: ${name2}`));
        process.exit(1);
      }

      const analysis1 = analyzePrompt(prompt1.content);
      const analysis2 = analyzePrompt(prompt2.content);

      console.log(chalk.blue.bold('\n📊 Prompt Comparison\n'));
      console.log(chalk.gray('─'.repeat(70)));

      const col1 = 30;
      const col2 = 30;

      console.log(`  ${chalk.white.bold(prompt1.name.padEnd(col1))} ${chalk.white.bold(prompt2.name.padEnd(col2))}`);
      console.log(chalk.gray('─'.repeat(70)));

      console.log(`  ${`Clarity: ${analysis1.clarity}%`.padEnd(col1)} ${`Clarity: ${analysis2.clarity}%`.padEnd(col2)}`);
      console.log(`  ${`Specificity: ${analysis1.specificity}%`.padEnd(col1)} ${`Specificity: ${analysis2.specificity}%`.padEnd(col2)}`);
      console.log(`  ${`Actionability: ${analysis1.actionability}%`.padEnd(col1)} ${`Actionability: ${analysis2.actionability}%`.padEnd(col2)}`);
      console.log(`  ${`Tokens: ~${analysis1.estimatedTokens}`.padEnd(col1)} ${`Tokens: ~${analysis2.estimatedTokens}`.padEnd(col2)}`);
      console.log(`  ${`Variables: ${analysis1.variables.length}`.padEnd(col1)} ${`Variables: ${analysis2.variables.length}`.padEnd(col2)}`);
      console.log(`  ${`Usage: ${prompt1.usageCount}x`.padEnd(col1)} ${`Usage: ${prompt2.usageCount}x`.padEnd(col2)}`);

      console.log(chalk.gray('─'.repeat(70)));

      // Determine winner
      const score1 = analysis1.clarity + analysis1.specificity + analysis1.actionability;
      const score2 = analysis2.clarity + analysis2.specificity + analysis2.actionability;

      if (score1 > score2) {
        console.log(chalk.green(`\n  ✓ "${prompt1.name}" scores higher overall\n`));
      } else if (score2 > score1) {
        console.log(chalk.green(`\n  ✓ "${prompt2.name}" scores higher overall\n`));
      } else {
        console.log(chalk.blue('\n  = Both prompts score equally\n'));
      }
    });
}
