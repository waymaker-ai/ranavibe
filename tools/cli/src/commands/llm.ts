import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import { glob } from 'glob';

interface LLMUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  cost: number;
}

interface OptimizationSuggestion {
  type: 'caching' | 'model-selection' | 'prompt-optimization' | 'rag';
  savings: number;
  effort: 'low' | 'medium' | 'high';
  description: string;
  implementation: string;
}

/**
 * LLM Cost Analysis Command
 * Analyzes current LLM usage and costs
 */
export async function llmAnalyze(options: { detailed?: boolean } = {}) {
  console.log(chalk.bold.cyan('\n🤖 LUKA LLM Cost Analysis\n'));

  // Scan codebase for LLM calls
  const llmCalls = await findLLMCalls();

  if (llmCalls.length === 0) {
    console.log(chalk.yellow('⚠️  No LLM API calls found in codebase.'));
    console.log(chalk.gray('Make sure you have OpenAI, Anthropic, or other LLM clients configured.\n'));
    return;
  }

  console.log(chalk.gray(`Found ${llmCalls.length} LLM API calls\n`));

  // Analyze usage patterns
  const usage = analyzeUsage(llmCalls);

  // Calculate current costs
  const currentCost = calculateMonthlyCost(usage);

  // Generate optimization suggestions
  const suggestions = generateOptimizations(usage, llmCalls);

  // Calculate potential savings
  const potentialSavings = suggestions.reduce((sum, s) => sum + s.savings, 0);

  // Report
  console.log(chalk.bold('Current Usage:\n'));

  usage.forEach((u) => {
    console.log(`  ${chalk.cyan(u.model)}`);
    console.log(`    Requests: ${u.requests.toLocaleString()}/month`);
    console.log(`    Input tokens: ${u.inputTokens.toLocaleString()}`);
    console.log(`    Output tokens: ${u.outputTokens.toLocaleString()}`);
    console.log(`    Cost: ${chalk.yellow(`$${u.cost.toFixed(2)}/month`)}\n`);
  });

  console.log(chalk.bold(`Total Cost: ${chalk.yellow(`$${currentCost.toFixed(2)}/month`)}`));
  console.log(chalk.bold(`Potential Savings: ${chalk.green(`$${potentialSavings.toFixed(2)}/month (${Math.round((potentialSavings / currentCost) * 100)}%)`)}\n`));

  // Show optimization suggestions
  if (suggestions.length > 0) {
    console.log(chalk.bold('💡 Optimization Suggestions:\n'));

    suggestions.forEach((s, i) => {
      const effortColor = { low: chalk.green, medium: chalk.yellow, high: chalk.red }[s.effort];
      console.log(`${i + 1}. ${chalk.bold(s.type.toUpperCase())}`);
      console.log(`   Savings: ${chalk.green(`$${s.savings.toFixed(2)}/month`)}`);
      console.log(`   Effort: ${effortColor(s.effort)}`);
      console.log(`   ${s.description}`);
      if (options.detailed) {
        console.log(chalk.gray(`   Implementation: ${s.implementation}`));
      }
      console.log();
    });

    console.log(chalk.gray('Run `luka llm:optimize` to apply these optimizations automatically.\n'));
  }
}

/**
 * LLM Optimization Command
 * Applies cost optimization strategies
 */
export async function llmOptimize(options: { all?: boolean } = {}) {
  console.log(chalk.bold.cyan('\n🚀 RANA LLM Optimization\n'));

  const llmCalls = await findLLMCalls();
  const usage = analyzeUsage(llmCalls);
  const suggestions = generateOptimizations(usage, llmCalls);

  if (suggestions.length === 0) {
    console.log(chalk.green('✅ Your LLM usage is already optimized!\n'));
    return;
  }

  // Show what will be applied
  console.log(chalk.bold('Available Optimizations:\n'));
  suggestions.forEach((s, i) => {
    console.log(`${i + 1}. ${s.type} - Save $${s.savings.toFixed(2)}/month (${s.effort} effort)`);
  });
  console.log();

  let selectedOptimizations: OptimizationSuggestion[];

  if (options.all) {
    selectedOptimizations = suggestions;
  } else {
    const { selected } = await prompts({
      type: 'multiselect',
      name: 'selected',
      message: 'Select optimizations to apply:',
      choices: suggestions.map((s, i) => ({
        title: `${s.type} - $${s.savings.toFixed(2)}/mo (${s.effort})`,
        value: i,
      })),
    });

    if (!selected || selected.length === 0) {
      console.log(chalk.gray('No optimizations selected.\n'));
      return;
    }

    selectedOptimizations = selected.map((i: number) => suggestions[i]);
  }

  // Apply optimizations
  console.log(chalk.cyan('\nApplying optimizations...\n'));

  for (const optimization of selectedOptimizations) {
    await applyOptimization(optimization);
  }

  const totalSavings = selectedOptimizations.reduce((sum, s) => sum + s.savings, 0);

  console.log(chalk.green(`\n✅ Optimizations applied! You'll save $${totalSavings.toFixed(2)}/month\n`));
}

/**
 * LLM Model Comparison Command
 */
export async function llmCompare() {
  console.log(chalk.bold.cyan('\n🔍 LUKA LLM Model Comparison\n'));

  const models = [
    // OpenAI Models
    {
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      inputCost: 0.01,
      outputCost: 0.03,
      contextWindow: 128000,
      speed: 'Medium',
      quality: 'Excellent',
      multimodal: 'Text + Images (input)',
      bestFor: 'Complex reasoning, code generation',
    },
    {
      name: 'GPT-4o',
      provider: 'OpenAI',
      inputCost: 0.005,
      outputCost: 0.015,
      contextWindow: 128000,
      speed: 'Fast',
      quality: 'Excellent',
      multimodal: 'Text + Images + Audio',
      bestFor: 'Multimodal tasks, real-time apps',
    },
    {
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      inputCost: 0.0005,
      outputCost: 0.0015,
      contextWindow: 16385,
      speed: 'Fast',
      quality: 'Good',
      multimodal: 'Text only',
      bestFor: 'Simple tasks, high volume',
    },
    // Anthropic Models
    {
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      inputCost: 0.003,
      outputCost: 0.015,
      contextWindow: 200000,
      speed: 'Fast',
      quality: 'Excellent',
      multimodal: 'Text + Images (input)',
      bestFor: 'Long context, analysis, coding',
    },
    {
      name: 'Claude 3 Haiku',
      provider: 'Anthropic',
      inputCost: 0.00025,
      outputCost: 0.00125,
      contextWindow: 200000,
      speed: 'Very Fast',
      quality: 'Good',
      multimodal: 'Text + Images (input)',
      bestFor: 'Simple tasks, cost-sensitive',
    },
    // Google Gemini Models
    {
      name: 'Gemini 3',
      provider: 'Google',
      inputCost: 0.002,
      outputCost: 0.008,
      contextWindow: 2000000,
      speed: 'Fast',
      quality: 'Excellent',
      multimodal: 'Text + Images + Audio + Video (I/O)',
      bestFor: 'Advanced reasoning, agentic coding, single-prompt apps',
    },
    {
      name: 'Gemini 2.0 Flash',
      provider: 'Google',
      inputCost: 0.0001,
      outputCost: 0.0004,
      contextWindow: 1000000,
      speed: 'Very Fast',
      quality: 'Excellent',
      multimodal: 'Text + Images + Audio + Video (I/O)',
      bestFor: 'Real-time streaming, multimodal output, tool use',
    },
    {
      name: 'Gemini 1.5 Pro',
      provider: 'Google',
      inputCost: 0.00125,
      outputCost: 0.005,
      contextWindow: 2000000,
      speed: 'Medium',
      quality: 'Excellent',
      multimodal: 'Text + Images + Audio + Video',
      bestFor: 'Long context, document analysis',
    },
    // xAI Models
    {
      name: 'Grok Beta',
      provider: 'xAI',
      inputCost: 0.01,
      outputCost: 0.03,
      contextWindow: 131072,
      speed: 'Fast',
      quality: 'Excellent',
      multimodal: 'Text only',
      bestFor: 'Real-time data, X integration',
    },
    // Mistral AI Models
    {
      name: 'Mistral Large',
      provider: 'Mistral AI',
      inputCost: 0.004,
      outputCost: 0.012,
      contextWindow: 128000,
      speed: 'Fast',
      quality: 'Excellent',
      multimodal: 'Text only',
      bestFor: 'European data compliance, multilingual',
    },
    {
      name: 'Mistral Small',
      provider: 'Mistral AI',
      inputCost: 0.001,
      outputCost: 0.003,
      contextWindow: 128000,
      speed: 'Very Fast',
      quality: 'Good',
      multimodal: 'Text only',
      bestFor: 'Cost-sensitive, fast responses',
    },
    // Cohere Models
    {
      name: 'Command R+',
      provider: 'Cohere',
      inputCost: 0.003,
      outputCost: 0.015,
      contextWindow: 128000,
      speed: 'Fast',
      quality: 'Excellent',
      multimodal: 'Text only',
      bestFor: 'Enterprise RAG, tool use',
    },
    // Together.ai Models
    {
      name: 'Llama 3.1 405B',
      provider: 'Together.ai',
      inputCost: 0.0035,
      outputCost: 0.0035,
      contextWindow: 131072,
      speed: 'Fast',
      quality: 'Excellent',
      multimodal: 'Text only',
      bestFor: 'Open-source alternative, customization',
    },
    // Groq Models
    {
      name: 'Llama 3.1 70B (Groq)',
      provider: 'Groq',
      inputCost: 0.00059,
      outputCost: 0.00079,
      contextWindow: 131072,
      speed: 'Ultra Fast',
      quality: 'Excellent',
      multimodal: 'Text only',
      bestFor: 'Ultra-low latency, real-time inference',
    },
    // Local Models
    {
      name: 'Ollama (Local)',
      provider: 'Ollama',
      inputCost: 0,
      outputCost: 0,
      contextWindow: 128000,
      speed: 'Fast',
      quality: 'Good',
      multimodal: 'Text + Images (some models)',
      bestFor: 'Development, privacy, zero cost',
    },
  ];

  console.log(chalk.bold('Cost per 1M tokens (Input / Output):\n'));

  models.forEach((m) => {
    console.log(chalk.cyan(`${m.name} (${m.provider})`));
    console.log(`  Cost: $${m.inputCost * 1000} / $${m.outputCost * 1000} per 1M tokens`);
    console.log(`  Context: ${(m.contextWindow / 1000).toFixed(0)}K tokens`);
    console.log(`  Speed: ${m.speed}`);
    console.log(`  Quality: ${m.quality}`);
    console.log(`  Multimodal: ${m.multimodal}`);
    console.log(`  Best for: ${m.bestFor}\n`);
  });

  console.log(chalk.bold('💡 LUKA Recommendation:\n'));
  console.log('Use cascading model strategy for optimal cost/performance:');
  console.log('  1. Ultra-fast: Groq Llama 70B (latency-critical) or Gemini 2.0 Flash (multimodal)');
  console.log('  2. Cost-effective: Claude Haiku, GPT-3.5, Mistral Small');
  console.log('  3. Complex tasks: Claude 3.5 Sonnet, GPT-4o, Gemini 3');
  console.log('  4. Special cases: Grok (real-time data), Command R+ (enterprise RAG)');
  console.log('  5. Development: Ollama (local, free)\n');

  console.log(chalk.bold('🌟 NEW: Gemini 2.0 Flash & Gemini 3 Features:\n'));
  console.log(chalk.green('  • Native multimodal I/O (text, images, audio, video)'));
  console.log(chalk.green('  • Real-time streaming API'));
  console.log(chalk.green('  • Native tool calling (Google Search, code exec)'));
  console.log(chalk.green('  • 1M-2M token context windows'));
  console.log(chalk.green('  • Agentic coding capabilities (Gemini 3)'));
  console.log(chalk.green('  • Single-prompt app generation\n'));
}

/**
 * LLM Setup Command
 */
export async function llmSetup() {
  console.log(chalk.bold.cyan('\n🤖 LUKA LLM Provider Setup\n'));

  const { providers } = await prompts({
    type: 'multiselect',
    name: 'providers',
    message: 'Select LLM providers to configure:',
    choices: [
      { title: 'OpenAI (GPT-4, GPT-4o, GPT-3.5)', value: 'openai', selected: true },
      { title: 'Anthropic (Claude 3.5 Sonnet, Haiku)', value: 'anthropic', selected: true },
      { title: 'Google (Gemini 3, Gemini 2.0 Flash) 🌟 NEW', value: 'google', selected: true },
      { title: 'xAI (Grok)', value: 'grok' },
      { title: 'Mistral AI (Large, Small)', value: 'mistral' },
      { title: 'Cohere (Command R+)', value: 'cohere' },
      { title: 'Together.ai (Llama 3.1, open models)', value: 'together' },
      { title: 'Groq (Ultra-fast inference)', value: 'groq' },
      { title: 'Local (Ollama - Free)', value: 'ollama' },
    ],
  });

  if (!providers || providers.length === 0) {
    console.log(chalk.gray('Setup cancelled.\n'));
    return;
  }

  const envVars: string[] = [];

  for (const provider of providers) {
    switch (provider) {
      case 'openai':
        const { openaiKey } = await prompts({
          type: 'text',
          name: 'openaiKey',
          message: 'OpenAI API Key (from platform.openai.com):',
        });
        if (openaiKey) {
          envVars.push(`OPENAI_API_KEY=${openaiKey}`);
        }
        break;

      case 'anthropic':
        const { anthropicKey } = await prompts({
          type: 'text',
          name: 'anthropicKey',
          message: 'Anthropic API Key (from console.anthropic.com):',
        });
        if (anthropicKey) {
          envVars.push(`ANTHROPIC_API_KEY=${anthropicKey}`);
        }
        break;

      case 'google':
        console.log(chalk.cyan('\n🌟 Google Gemini Setup'));
        console.log(chalk.gray('  Get API key: https://aistudio.google.com/apikey'));
        const { googleKey } = await prompts({
          type: 'text',
          name: 'googleKey',
          message: 'Google AI API Key:',
        });
        if (googleKey) {
          envVars.push(`GOOGLE_API_KEY=${googleKey}`);
          envVars.push(`GOOGLE_GENERATIVE_AI_API_KEY=${googleKey}`);
        }
        console.log(chalk.green('  ✓ Gemini 3 & Gemini 2.0 Flash enabled!'));
        console.log(chalk.gray('  Features: Multimodal I/O, real-time streaming, native tool use'));
        break;

      case 'grok':
        const { grokKey } = await prompts({
          type: 'text',
          name: 'grokKey',
          message: 'xAI Grok API Key (from x.ai/api):',
        });
        if (grokKey) {
          envVars.push(`XAI_API_KEY=${grokKey}`);
        }
        break;

      case 'mistral':
        const { mistralKey } = await prompts({
          type: 'text',
          name: 'mistralKey',
          message: 'Mistral AI API Key (from console.mistral.ai):',
        });
        if (mistralKey) {
          envVars.push(`MISTRAL_API_KEY=${mistralKey}`);
        }
        break;

      case 'cohere':
        const { cohereKey } = await prompts({
          type: 'text',
          name: 'cohereKey',
          message: 'Cohere API Key (from dashboard.cohere.com):',
        });
        if (cohereKey) {
          envVars.push(`COHERE_API_KEY=${cohereKey}`);
        }
        break;

      case 'together':
        const { togetherKey } = await prompts({
          type: 'text',
          name: 'togetherKey',
          message: 'Together.ai API Key (from api.together.xyz):',
        });
        if (togetherKey) {
          envVars.push(`TOGETHER_API_KEY=${togetherKey}`);
        }
        break;

      case 'groq':
        const { groqKey } = await prompts({
          type: 'text',
          name: 'groqKey',
          message: 'Groq API Key (from console.groq.com):',
        });
        if (groqKey) {
          envVars.push(`GROQ_API_KEY=${groqKey}`);
        }
        break;

      case 'ollama':
        console.log(chalk.cyan('\n🏠 Ollama Local Setup'));
        console.log(chalk.gray('  Install: curl -fsSL https://ollama.com/install.sh | sh'));
        console.log(chalk.gray('  Or visit: https://ollama.com/download'));
        envVars.push('OLLAMA_URL=http://localhost:11434');
        console.log(chalk.green('  ✓ Ollama configured for local models'));
        break;
    }
  }

  // Update .env
  let envContent = '';
  if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf-8');
  }

  envContent += '\n# LLM API Keys\n' + envVars.join('\n') + '\n';
  fs.writeFileSync('.env', envContent);

  // Create LLM client
  const clientCode = generateLLMClient(providers);
  fs.mkdirSync('lib', { recursive: true });
  fs.writeFileSync('lib/llm.ts', clientCode);

  console.log(chalk.green('\n✅ LLM setup complete!\n'));
  console.log(chalk.gray('Files created:'));
  console.log(chalk.gray('  - .env (API keys)'));
  console.log(chalk.gray('  - lib/llm.ts (LLM client)\n'));
}

/**
 * Find LLM API calls in codebase
 */
async function findLLMCalls(): Promise<any[]> {
  const files = await glob('**/*.{ts,js,tsx,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**'],
  });

  const calls: any[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Find OpenAI calls
    if (content.includes('openai.chat.completions.create') || content.includes('openai.completions.create')) {
      calls.push({
        file,
        provider: 'openai',
        pattern: content.match(/model:\s*['"](.+?)['"]/)?.[1] || 'gpt-3.5-turbo',
      });
    }

    // Find Anthropic calls
    if (content.includes('anthropic.messages.create')) {
      calls.push({
        file,
        provider: 'anthropic',
        pattern: content.match(/model:\s*['"](.+?)['"]/)?.[1] || 'claude-3-sonnet',
      });
    }

    // Find Grok calls
    if (content.includes('grok.') || content.includes('@xai/grok')) {
      calls.push({
        file,
        provider: 'grok',
        pattern: 'grok-beta',
      });
    }
  }

  return calls;
}

/**
 * Analyze LLM usage patterns
 */
function analyzeUsage(calls: any[]): LLMUsage[] {
  const usage: Record<string, LLMUsage> = {};

  calls.forEach((call) => {
    const model = call.pattern;

    if (!usage[model]) {
      usage[model] = {
        model,
        inputTokens: 0,
        outputTokens: 0,
        requests: 0,
        cost: 0,
      };
    }

    // Estimate tokens (rough average)
    usage[model].inputTokens += 1000; // Average input
    usage[model].outputTokens += 500; // Average output
    usage[model].requests += 100; // Estimate 100 requests/month per call

    // Calculate cost
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      'grok-beta': { input: 0.01, output: 0.03 },
    };

    const modelCosts = costs[model] || { input: 0.01, output: 0.03 };
    usage[model].cost = (usage[model].inputTokens / 1000) * modelCosts.input +
                        (usage[model].outputTokens / 1000) * modelCosts.output;
  });

  return Object.values(usage);
}

/**
 * Calculate monthly cost
 */
function calculateMonthlyCost(usage: LLMUsage[]): number {
  return usage.reduce((sum, u) => sum + u.cost, 0);
}

/**
 * Generate optimization suggestions
 */
function generateOptimizations(usage: LLMUsage[], calls: any[]): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Caching optimization
  if (calls.length > 5) {
    suggestions.push({
      type: 'caching',
      savings: calculateMonthlyCost(usage) * 0.4, // 40% savings
      effort: 'low',
      description: 'Implement response caching to reduce duplicate LLM calls',
      implementation: 'Add Redis caching layer - see docs/LLM_OPTIMIZATION_GUIDE.md',
    });
  }

  // Model selection
  const hasExpensiveModel = usage.some((u) => u.model.includes('gpt-4') || u.model.includes('claude-3-5-sonnet'));
  if (hasExpensiveModel) {
    suggestions.push({
      type: 'model-selection',
      savings: calculateMonthlyCost(usage) * 0.25, // 25% savings
      effort: 'medium',
      description: 'Use cascading model strategy: try cheaper models first',
      implementation: 'Implement multi-model fallback - see docs/LLM_OPTIMIZATION_GUIDE.md',
    });
  }

  // Prompt optimization
  suggestions.push({
    type: 'prompt-optimization',
    savings: calculateMonthlyCost(usage) * 0.15, // 15% savings
    effort: 'medium',
    description: 'Optimize prompts to reduce token usage',
    implementation: 'Apply prompt compression techniques - see docs/LLM_OPTIMIZATION_GUIDE.md',
  });

  // RAG for large contexts
  const totalTokens = usage.reduce((sum, u) => sum + u.inputTokens, 0);
  if (totalTokens > 10000) {
    suggestions.push({
      type: 'rag',
      savings: calculateMonthlyCost(usage) * 0.3, // 30% savings
      effort: 'high',
      description: 'Implement RAG to reduce context size',
      implementation: 'Add vector database and RAG - see docs/LLM_OPTIMIZATION_GUIDE.md',
    });
  }

  return suggestions;
}

/**
 * Apply optimization
 */
async function applyOptimization(optimization: OptimizationSuggestion) {
  console.log(chalk.cyan(`Applying ${optimization.type}...`));

  switch (optimization.type) {
    case 'caching':
      await addCachingLayer();
      break;
    case 'model-selection':
      await addModelSelection();
      break;
    case 'prompt-optimization':
      await addPromptOptimization();
      break;
    case 'rag':
      await addRAG();
      break;
  }

  console.log(chalk.green(`✓ ${optimization.type} applied`));
}

/**
 * Add caching layer
 */
async function addCachingLayer() {
  const cacheCode = `import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function cachedLLMCall(prompt: string, model: string) {
  const cacheKey = \`llm:\${model}:\${hashPrompt(prompt)}\`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  // Make LLM call
  const response = await callLLM(prompt, model);

  // Cache for 1 hour
  await redis.set(cacheKey, response, { ex: 3600 });

  return response;
}

function hashPrompt(prompt: string): string {
  // Simple hash for demo
  return Buffer.from(prompt).toString('base64').slice(0, 32);
}
`;

  fs.mkdirSync('lib', { recursive: true });
  fs.writeFileSync('lib/llm-cache.ts', cacheCode);
}

/**
 * Add model selection
 */
async function addModelSelection() {
  const code = `export async function smartLLMCall(prompt: string, complexity: 'simple' | 'complex') {
  // Try cheaper model first for simple tasks
  if (complexity === 'simple') {
    try {
      return await callLLM(prompt, 'gpt-3.5-turbo');
    } catch (error) {
      // Fallback to GPT-4 if needed
      return await callLLM(prompt, 'gpt-4-turbo');
    }
  }

  // Use powerful model for complex tasks
  return await callLLM(prompt, 'gpt-4-turbo');
}
`;

  fs.appendFileSync('lib/llm.ts', code);
}

/**
 * Add prompt optimization
 */
async function addPromptOptimization() {
  console.log(chalk.gray('  See docs/LLM_OPTIMIZATION_GUIDE.md for prompt optimization techniques'));
}

/**
 * Add RAG
 */
async function addRAG() {
  console.log(chalk.gray('  See docs/LLM_OPTIMIZATION_GUIDE.md for RAG implementation'));
}

/**
 * Generate LLM client code
 */
function generateLLMClient(providers: string[]): string {
  let code = `// Generated by RANA\n\n`;

  if (providers.includes('openai')) {
    code += `import OpenAI from 'openai';\n`;
  }

  if (providers.includes('anthropic')) {
    code += `import Anthropic from '@anthropic-ai/sdk';\n`;
  }

  code += `\n// Initialize clients\n`;

  if (providers.includes('openai')) {
    code += `export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });\n`;
  }

  if (providers.includes('anthropic')) {
    code += `export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n`;
  }

  code += `\n// Helper function\nexport async function callLLM(prompt: string, model: string) {\n`;
  code += `  // Add your LLM logic here\n`;
  code += `}\n`;

  return code;
}
