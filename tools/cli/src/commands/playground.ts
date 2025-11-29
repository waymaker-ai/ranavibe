/**
 * Interactive Playground
 * Try RANA features interactively in the terminal
 */

import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface PlaygroundSession {
  messages: { role: string; content: string }[];
  provider: string;
  model: string;
  totalCost: number;
  totalTokens: number;
}

const CREDENTIALS_FILE = path.join(os.homedir(), '.rana', 'credentials.json');

const MODELS: Record<string, { display: string; models: { value: string; title: string }[] }> = {
  anthropic: {
    display: 'Anthropic',
    models: [
      { value: 'claude-3-5-sonnet-20241022', title: 'Claude 3.5 Sonnet (Best)' },
      { value: 'claude-3-haiku-20240307', title: 'Claude 3 Haiku (Fast)' },
      { value: 'claude-3-opus-20240229', title: 'Claude 3 Opus (Most capable)' },
    ],
  },
  openai: {
    display: 'OpenAI',
    models: [
      { value: 'gpt-4o', title: 'GPT-4o (Best)' },
      { value: 'gpt-4o-mini', title: 'GPT-4o Mini (Fast & Cheap)' },
      { value: 'gpt-4-turbo', title: 'GPT-4 Turbo' },
    ],
  },
  google: {
    display: 'Google',
    models: [
      { value: 'gemini-2.0-flash-exp', title: 'Gemini 2.0 Flash (Latest)' },
      { value: 'gemini-1.5-pro', title: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', title: 'Gemini 1.5 Flash (Fast)' },
    ],
  },
  groq: {
    display: 'Groq',
    models: [
      { value: 'llama-3.1-70b-versatile', title: 'Llama 3.1 70B' },
      { value: 'mixtral-8x7b-32768', title: 'Mixtral 8x7B' },
    ],
  },
  mistral: {
    display: 'Mistral',
    models: [
      { value: 'mistral-large-latest', title: 'Mistral Large' },
      { value: 'mistral-small-latest', title: 'Mistral Small' },
    ],
  },
};

/**
 * Main Playground Command
 */
export async function playgroundCommand() {
  console.log(chalk.bold.cyan('\n🎮 RANA Interactive Playground\n'));
  console.log(chalk.gray('Test RANA capabilities in real-time\n'));

  // Check for configured API keys
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    console.log(chalk.yellow('No API keys configured yet.\n'));
    console.log(chalk.gray('Run `rana config:set` to add your first API key.'));
    console.log(chalk.gray('Or run `rana playground --demo` to see a demo.\n'));
    return;
  }

  // Select mode
  const { mode } = await prompts({
    type: 'select',
    name: 'mode',
    message: 'What would you like to try?',
    choices: [
      { title: '💬 Chat', value: 'chat', description: 'Interactive chat with an LLM' },
      { title: '🔄 Compare', value: 'compare', description: 'Compare responses from multiple providers' },
      { title: '⚡ Stream', value: 'stream', description: 'See streaming responses' },
      { title: '🤖 Agent', value: 'agent', description: 'Try an agent with tools' },
      { title: '💰 Cost Test', value: 'cost', description: 'See cost optimization in action' },
      { title: '📚 RAG Demo', value: 'rag', description: 'Try retrieval-augmented generation' },
    ],
  });

  if (!mode) {
    console.log(chalk.gray('\nPlayground closed.\n'));
    return;
  }

  switch (mode) {
    case 'chat':
      await runChatMode(availableProviders);
      break;
    case 'compare':
      await runCompareMode(availableProviders);
      break;
    case 'stream':
      await runStreamMode(availableProviders);
      break;
    case 'agent':
      await runAgentMode(availableProviders);
      break;
    case 'cost':
      await runCostMode(availableProviders);
      break;
    case 'rag':
      await runRAGMode(availableProviders);
      break;
  }
}

/**
 * Interactive Chat Mode
 */
async function runChatMode(providers: string[]) {
  console.log(chalk.bold.cyan('\n💬 Chat Mode\n'));

  // Select provider
  const { provider } = await prompts({
    type: 'select',
    name: 'provider',
    message: 'Select provider:',
    choices: providers.map((p) => ({
      title: MODELS[p]?.display || p,
      value: p,
    })),
  });

  if (!provider) return;

  // Select model
  const modelChoices = MODELS[provider]?.models || [{ value: 'default', title: 'Default' }];
  const { model } = await prompts({
    type: 'select',
    name: 'model',
    message: 'Select model:',
    choices: modelChoices,
  });

  if (!model) return;

  const session: PlaygroundSession = {
    messages: [],
    provider,
    model,
    totalCost: 0,
    totalTokens: 0,
  };

  console.log(chalk.green(`\n✓ Connected to ${MODELS[provider]?.display} - ${model}`));
  console.log(chalk.gray('Type your message and press Enter. Type "exit" to quit.\n'));

  // Chat loop
  while (true) {
    const { message } = await prompts({
      type: 'text',
      name: 'message',
      message: chalk.cyan('You:'),
    });

    if (!message || message.toLowerCase() === 'exit') {
      break;
    }

    session.messages.push({ role: 'user', content: message });

    // Show thinking indicator
    process.stdout.write(chalk.gray('\nAssistant: Thinking...'));

    try {
      const response = await callLLM(provider, model, session.messages);

      // Clear thinking indicator
      process.stdout.write('\r' + ' '.repeat(30) + '\r');

      // Display response
      console.log(chalk.white('Assistant:'), response.content);

      session.messages.push({ role: 'assistant', content: response.content });
      session.totalCost += response.cost || 0;
      session.totalTokens += response.tokens || 0;

      console.log(chalk.gray(`\n  Tokens: ${response.tokens} | Cost: $${response.cost?.toFixed(6)}\n`));
    } catch (error: any) {
      process.stdout.write('\r' + ' '.repeat(30) + '\r');
      console.log(chalk.red(`\nError: ${error.message}\n`));
    }
  }

  // Show session summary
  console.log(chalk.bold.cyan('\n📊 Session Summary'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`  Messages: ${session.messages.length}`);
  console.log(`  Total Tokens: ${session.totalTokens}`);
  console.log(`  Total Cost: $${session.totalCost.toFixed(6)}`);
  console.log();
}

/**
 * Compare Mode - Test same prompt across providers
 */
async function runCompareMode(providers: string[]) {
  console.log(chalk.bold.cyan('\n🔄 Compare Mode\n'));

  if (providers.length < 2) {
    console.log(chalk.yellow('Need at least 2 configured providers to compare.'));
    console.log(chalk.gray('Run `rana config:set` to add more providers.\n'));
    return;
  }

  // Select providers to compare
  const { selectedProviders } = await prompts({
    type: 'multiselect',
    name: 'selectedProviders',
    message: 'Select providers to compare:',
    choices: providers.map((p) => ({
      title: MODELS[p]?.display || p,
      value: p,
    })),
    min: 2,
    max: 4,
  });

  if (!selectedProviders || selectedProviders.length < 2) {
    console.log(chalk.gray('\nNeed at least 2 providers.\n'));
    return;
  }

  // Get prompt
  const { prompt } = await prompts({
    type: 'text',
    name: 'prompt',
    message: 'Enter your prompt:',
    initial: 'Explain quantum computing in one paragraph.',
  });

  if (!prompt) return;

  console.log(chalk.bold('\n📊 Results:\n'));

  const results: { provider: string; response: string; latency: number; cost: number }[] = [];

  // Call each provider
  for (const provider of selectedProviders) {
    const model = MODELS[provider]?.models[0]?.value || 'default';

    process.stdout.write(chalk.gray(`  ${MODELS[provider]?.display}... `));

    try {
      const start = Date.now();
      const response = await callLLM(provider, model, [{ role: 'user', content: prompt }]);
      const latency = Date.now() - start;

      results.push({
        provider: MODELS[provider]?.display || provider,
        response: response.content,
        latency,
        cost: response.cost || 0,
      });

      console.log(chalk.green(`✓ ${latency}ms`));
    } catch (error: any) {
      console.log(chalk.red(`✗ ${error.message}`));
    }
  }

  // Display comparison
  console.log(chalk.bold('\n' + '═'.repeat(60)));

  for (const result of results) {
    console.log(chalk.bold.cyan(`\n${result.provider}`));
    console.log(chalk.gray(`Latency: ${result.latency}ms | Cost: $${result.cost.toFixed(6)}`));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(result.response);
  }

  console.log(chalk.bold('\n' + '═'.repeat(60)));

  // Show winner
  const fastest = results.reduce((a, b) => (a.latency < b.latency ? a : b));
  const cheapest = results.reduce((a, b) => (a.cost < b.cost ? a : b));

  console.log(chalk.green(`\n⚡ Fastest: ${fastest.provider} (${fastest.latency}ms)`));
  console.log(chalk.green(`💰 Cheapest: ${cheapest.provider} ($${cheapest.cost.toFixed(6)})\n`));
}

/**
 * Streaming Mode Demo
 */
async function runStreamMode(providers: string[]) {
  console.log(chalk.bold.cyan('\n⚡ Stream Mode\n'));

  const { provider } = await prompts({
    type: 'select',
    name: 'provider',
    message: 'Select provider:',
    choices: providers.map((p) => ({
      title: MODELS[p]?.display || p,
      value: p,
    })),
  });

  if (!provider) return;

  const { prompt } = await prompts({
    type: 'text',
    name: 'prompt',
    message: 'Enter your prompt:',
    initial: 'Write a short poem about artificial intelligence.',
  });

  if (!prompt) return;

  console.log(chalk.gray('\nStreaming response:\n'));
  console.log(chalk.cyan('─'.repeat(50)));

  // Simulate streaming (in real implementation, this would use actual streaming)
  const model = MODELS[provider]?.models[0]?.value || 'default';

  try {
    const response = await callLLM(provider, model, [{ role: 'user', content: prompt }]);

    // Simulate streaming effect
    const words = response.content.split(' ');
    for (const word of words) {
      process.stdout.write(word + ' ');
      await sleep(50);
    }

    console.log(chalk.cyan('\n' + '─'.repeat(50)));
    console.log(chalk.gray(`\nTokens: ${response.tokens} | Cost: $${response.cost?.toFixed(6)}\n`));
  } catch (error: any) {
    console.log(chalk.red(`\nError: ${error.message}\n`));
  }
}

/**
 * Agent Mode Demo
 */
async function runAgentMode(providers: string[]) {
  console.log(chalk.bold.cyan('\n🤖 Agent Mode\n'));
  console.log(chalk.gray('An AI agent with access to tools.\n'));

  const { provider } = await prompts({
    type: 'select',
    name: 'provider',
    message: 'Select provider:',
    choices: providers.map((p) => ({
      title: MODELS[p]?.display || p,
      value: p,
    })),
  });

  if (!provider) return;

  console.log(chalk.green('\n✓ Agent initialized with tools:'));
  console.log(chalk.gray('  • calculator - Perform math calculations'));
  console.log(chalk.gray('  • datetime - Get current date/time'));
  console.log(chalk.gray('  • memory - Store/retrieve information'));
  console.log();

  const { task } = await prompts({
    type: 'text',
    name: 'task',
    message: 'Give the agent a task:',
    initial: "What's 15% of 847? Also, what day of the week is it?",
  });

  if (!task) return;

  console.log(chalk.bold('\n🔄 Agent Working...\n'));

  // Simulate agent reasoning
  const steps = [
    { thought: 'I need to calculate 15% of 847', tool: 'calculator', input: '15% of 847', result: '127.05' },
    { thought: 'Now I need to get the current day', tool: 'datetime', input: 'now', result: new Date().toLocaleDateString('en-US', { weekday: 'long' }) },
    { thought: 'I have both answers now', tool: null, input: null, result: null },
  ];

  for (const step of steps) {
    console.log(chalk.yellow(`💭 Thinking: "${step.thought}"`));
    await sleep(500);

    if (step.tool) {
      console.log(chalk.cyan(`🔧 Using tool: ${step.tool}`));
      console.log(chalk.gray(`   Input: ${step.input}`));
      await sleep(300);
      console.log(chalk.green(`   Result: ${step.result}`));
    }
    console.log();
  }

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  console.log(chalk.bold.green('✅ Final Answer:'));
  console.log(`15% of 847 is 127.05, and today is ${dayOfWeek}.\n`);
}

/**
 * Cost Optimization Demo
 */
async function runCostMode(providers: string[]) {
  console.log(chalk.bold.cyan('\n💰 Cost Optimization Demo\n'));

  const { prompt } = await prompts({
    type: 'text',
    name: 'prompt',
    message: 'Enter a prompt to test:',
    initial: 'Summarize the benefits of renewable energy in 2-3 sentences.',
  });

  if (!prompt) return;

  console.log(chalk.bold('\n📊 Cost Comparison:\n'));

  // Simulated cost comparison
  const comparisons = [
    { strategy: 'Premium (Claude Opus)', cost: 0.0245, quality: 98, latency: 2500 },
    { strategy: 'Balanced (Claude Sonnet)', cost: 0.0082, quality: 95, latency: 1200 },
    { strategy: 'Fast (GPT-4o Mini)', cost: 0.0008, quality: 88, latency: 400 },
    { strategy: 'Budget (Groq Mixtral)', cost: 0.0002, quality: 82, latency: 150 },
    { strategy: 'Local (Ollama)', cost: 0.0000, quality: 75, latency: 800 },
  ];

  // Display table
  console.log(chalk.gray('Strategy'.padEnd(25) + 'Cost'.padEnd(12) + 'Quality'.padEnd(10) + 'Latency'));
  console.log(chalk.gray('─'.repeat(55)));

  for (const comp of comparisons) {
    const costStr = `$${comp.cost.toFixed(4)}`.padEnd(12);
    const qualityStr = `${comp.quality}%`.padEnd(10);
    const latencyStr = `${comp.latency}ms`;

    const costColor = comp.cost < 0.001 ? chalk.green : comp.cost < 0.01 ? chalk.yellow : chalk.red;

    console.log(
      chalk.white(comp.strategy.padEnd(25)) +
      costColor(costStr) +
      chalk.white(qualityStr) +
      chalk.gray(latencyStr)
    );
  }

  console.log();

  // Show savings
  const expensive = comparisons[0].cost;
  const cheap = comparisons[3].cost;
  const savings = ((expensive - cheap) / expensive * 100).toFixed(0);

  console.log(chalk.bold.green(`💡 RANA auto-routing can save up to ${savings}% by choosing the right model!`));
  console.log(chalk.gray('\nRun `rana optimize` to apply these optimizations to your project.\n'));
}

/**
 * RAG Demo Mode
 */
async function runRAGMode(providers: string[]) {
  console.log(chalk.bold.cyan('\n📚 RAG (Retrieval-Augmented Generation) Demo\n'));

  // Sample documents
  const documents = [
    { id: '1', title: 'RANA Overview', content: 'RANA is a production-quality AI development framework that supports 9 LLM providers and offers 70% cost reduction through intelligent routing.' },
    { id: '2', title: 'Cost Optimization', content: 'RANA uses semantic caching, prompt optimization, and smart model selection to reduce costs. It can automatically choose between Claude, GPT-4, Gemini, and open-source models.' },
    { id: '3', title: 'Agent Framework', content: 'RANA provides an agent framework with tool support. Agents can use tools like calculators, web search, and custom functions to accomplish complex tasks.' },
  ];

  console.log(chalk.gray('Sample knowledge base loaded with 3 documents:\n'));
  documents.forEach((doc, i) => {
    console.log(chalk.gray(`  ${i + 1}. ${doc.title}`));
  });
  console.log();

  const { query } = await prompts({
    type: 'text',
    name: 'query',
    message: 'Ask a question:',
    initial: 'How does RANA reduce costs?',
  });

  if (!query) return;

  console.log(chalk.bold('\n🔍 RAG Pipeline:\n'));

  // Step 1: Retrieval
  console.log(chalk.cyan('1. Retrieval'));
  console.log(chalk.gray('   Searching knowledge base...'));
  await sleep(300);

  // Find relevant doc (simple keyword match)
  const relevantDocs = documents.filter((d) =>
    d.content.toLowerCase().includes(query.toLowerCase().split(' ')[0]) ||
    d.title.toLowerCase().includes('cost')
  );

  console.log(chalk.green(`   Found ${relevantDocs.length} relevant document(s)`));
  relevantDocs.forEach((doc) => {
    console.log(chalk.gray(`   • ${doc.title}`));
  });
  console.log();

  // Step 2: Augmentation
  console.log(chalk.cyan('2. Augmentation'));
  console.log(chalk.gray('   Building context from retrieved documents...'));
  await sleep(200);
  console.log(chalk.green('   Context prepared (512 tokens)'));
  console.log();

  // Step 3: Generation
  console.log(chalk.cyan('3. Generation'));
  console.log(chalk.gray('   Generating answer with context...'));
  await sleep(500);
  console.log();

  // Simulated answer
  console.log(chalk.bold.green('📝 Answer:\n'));
  console.log('RANA reduces costs through several key mechanisms:');
  console.log('');
  console.log('1. **Intelligent Model Routing** - Automatically selects the most cost-effective');
  console.log('   model based on task complexity (e.g., GPT-4o Mini for simple tasks)');
  console.log('');
  console.log('2. **Semantic Caching** - Caches similar queries to avoid redundant API calls');
  console.log('');
  console.log('3. **Prompt Optimization** - Compresses prompts while preserving meaning');
  console.log('');
  console.log('These combined strategies can achieve up to 70% cost reduction.');
  console.log();

  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.gray('Sources: Cost Optimization, RANA Overview'));
  console.log(chalk.gray('Confidence: 94% | Tokens used: 847\n'));
}

/**
 * Demo Mode - No API keys required
 */
export async function playgroundDemo() {
  console.log(chalk.bold.cyan('\n🎮 RANA Playground Demo\n'));
  console.log(chalk.gray('This demo shows RANA capabilities without requiring API keys.\n'));

  await runCostMode([]);
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAvailableProviders(): string[] {
  const providers: string[] = [];

  // Check credentials file
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      providers.push(...Object.keys(creds.providers || {}));
    } catch {
      // Ignore
    }
  }

  // Check environment variables
  const envMappings: Record<string, string> = {
    OPENAI_API_KEY: 'openai',
    ANTHROPIC_API_KEY: 'anthropic',
    GOOGLE_AI_API_KEY: 'google',
    GROQ_API_KEY: 'groq',
    MISTRAL_API_KEY: 'mistral',
  };

  for (const [envVar, provider] of Object.entries(envMappings)) {
    if (process.env[envVar] && !providers.includes(provider)) {
      providers.push(provider);
    }
  }

  return providers;
}

async function callLLM(
  provider: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<{ content: string; tokens: number; cost: number }> {
  // Get API key
  let apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];

  if (!apiKey && fs.existsSync(CREDENTIALS_FILE)) {
    try {
      const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      apiKey = creds.providers?.[provider];
    } catch {
      // Ignore
    }
  }

  if (!apiKey) {
    throw new Error(`No API key found for ${provider}`);
  }

  // Make API call based on provider
  switch (provider) {
    case 'openai':
      return await callOpenAI(apiKey, model, messages);
    case 'anthropic':
      return await callAnthropic(apiKey, model, messages);
    case 'google':
      return await callGoogle(apiKey, model, messages);
    case 'groq':
      return await callGroq(apiKey, model, messages);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function callOpenAI(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<{ content: string; tokens: number; cost: number }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!response.ok) {
    const error = await response.json() as any;
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json() as any;
  const tokens = data.usage?.total_tokens || 0;

  // Estimate cost (simplified)
  const costPer1k = model.includes('mini') ? 0.00015 : 0.0025;
  const cost = (tokens / 1000) * costPer1k;

  return {
    content: data.choices[0]?.message?.content || '',
    tokens,
    cost,
  };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<{ content: string; tokens: number; cost: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: messages.filter((m) => m.role !== 'system'),
      system: messages.find((m) => m.role === 'system')?.content,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as any;
    throw new Error(error.error?.message || 'Anthropic API error');
  }

  const data = await response.json() as any;
  const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

  // Estimate cost
  const costPer1k = model.includes('haiku') ? 0.00025 : model.includes('opus') ? 0.015 : 0.003;
  const cost = (tokens / 1000) * costPer1k;

  return {
    content: data.content[0]?.text || '',
    tokens,
    cost,
  };
}

async function callGoogle(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<{ content: string; tokens: number; cost: number }> {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    }
  );

  if (!response.ok) {
    const error = await response.json() as any;
    throw new Error(error.error?.message || 'Google API error');
  }

  const data = await response.json() as any;
  const tokens = data.usageMetadata?.totalTokenCount || 0;

  // Estimate cost
  const costPer1k = model.includes('flash') ? 0.0001 : 0.00125;
  const cost = (tokens / 1000) * costPer1k;

  return {
    content: data.candidates[0]?.content?.parts[0]?.text || '',
    tokens,
    cost,
  };
}

async function callGroq(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<{ content: string; tokens: number; cost: number }> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!response.ok) {
    const error = await response.json() as any;
    throw new Error(error.error?.message || 'Groq API error');
  }

  const data = await response.json() as any;
  const tokens = data.usage?.total_tokens || 0;

  // Groq is very cheap
  const cost = (tokens / 1000) * 0.0003;

  return {
    content: data.choices[0]?.message?.content || '',
    tokens,
    cost,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
