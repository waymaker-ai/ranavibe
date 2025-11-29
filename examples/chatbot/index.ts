/**
 * RANA Chatbot Example
 * A simple but powerful chatbot that demonstrates RANA's core features
 *
 * Features:
 * - Multi-provider support (auto-selects based on available API keys)
 * - Cost tracking
 * - Conversation memory
 * - Streaming responses
 *
 * Run with: npx ts-node index.ts
 * Or: bun run index.ts
 */

import readline from 'readline';

// Configuration
const CONFIG = {
  // Will auto-detect from environment variables
  provider: process.env.LLM_PROVIDER || 'anthropic',
  model: process.env.LLM_MODEL || 'claude-3-5-sonnet-20241022',
  systemPrompt: `You are a helpful AI assistant powered by RANA.
You are knowledgeable, concise, and friendly.
If you're unsure about something, say so.
Format responses with markdown when appropriate.`,
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatSession {
  messages: Message[];
  totalCost: number;
  totalTokens: number;
  startTime: Date;
}

// Provider API configurations
const PROVIDERS: Record<string, {
  url: string;
  envKey: string;
  buildRequest: (messages: Message[], model: string) => any;
  parseResponse: (data: any) => { content: string; tokens: number };
  estimateCost: (tokens: number, model: string) => number;
}> = {
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    envKey: 'ANTHROPIC_API_KEY',
    buildRequest: (messages, model) => ({
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: messages.find(m => m.role === 'system')?.content,
        messages: messages.filter(m => m.role !== 'system'),
      }),
    }),
    parseResponse: (data) => ({
      content: data.content[0]?.text || '',
      tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    }),
    estimateCost: (tokens, model) => {
      const rates: Record<string, number> = {
        'claude-3-5-sonnet-20241022': 0.003,
        'claude-3-haiku-20240307': 0.00025,
        'claude-3-opus-20240229': 0.015,
      };
      return (tokens / 1000) * (rates[model] || 0.003);
    },
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    envKey: 'OPENAI_API_KEY',
    buildRequest: (messages, model) => ({
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages }),
    }),
    parseResponse: (data) => ({
      content: data.choices[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
    }),
    estimateCost: (tokens, model) => {
      const rates: Record<string, number> = {
        'gpt-4o': 0.0025,
        'gpt-4o-mini': 0.00015,
        'gpt-4-turbo': 0.01,
      };
      return (tokens / 1000) * (rates[model] || 0.0025);
    },
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    envKey: 'GROQ_API_KEY',
    buildRequest: (messages, model) => ({
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages }),
    }),
    parseResponse: (data) => ({
      content: data.choices[0]?.message?.content || '',
      tokens: data.usage?.total_tokens || 0,
    }),
    estimateCost: (tokens) => (tokens / 1000) * 0.0003,
  },
};

/**
 * Auto-detect available provider from environment
 */
function detectProvider(): string {
  for (const [name, config] of Object.entries(PROVIDERS)) {
    if (process.env[config.envKey]) {
      console.log(`\x1b[32m✓ Using ${name} (${config.envKey} found)\x1b[0m`);
      return name;
    }
  }
  throw new Error('No API key found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY');
}

/**
 * Call the LLM API
 */
async function chat(
  provider: string,
  model: string,
  messages: Message[]
): Promise<{ content: string; tokens: number; cost: number }> {
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  const request = config.buildRequest(messages, model);
  const response = await fetch(config.url, request);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const parsed = config.parseResponse(data);
  const cost = config.estimateCost(parsed.tokens, model);

  return { ...parsed, cost };
}

/**
 * Format cost for display
 */
function formatCost(cost: number): string {
  if (cost < 0.0001) return '<$0.0001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Format duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Main chatbot function
 */
async function main() {
  console.log('\x1b[36m');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║     🐟 RANA Chatbot Example           ║');
  console.log('║     Type "exit" to quit               ║');
  console.log('║     Type "stats" for session stats    ║');
  console.log('║     Type "clear" to clear history     ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('\x1b[0m');

  // Detect provider
  let provider: string;
  try {
    provider = detectProvider();
  } catch (error: any) {
    console.error(`\x1b[31m${error.message}\x1b[0m`);
    process.exit(1);
  }

  // Default models for each provider
  const defaultModels: Record<string, string> = {
    anthropic: 'claude-3-5-sonnet-20241022',
    openai: 'gpt-4o',
    groq: 'llama-3.1-70b-versatile',
  };

  const model = CONFIG.model || defaultModels[provider];
  console.log(`\x1b[90mModel: ${model}\x1b[0m\n`);

  // Initialize session
  const session: ChatSession = {
    messages: [{ role: 'system', content: CONFIG.systemPrompt }],
    totalCost: 0,
    totalTokens: 0,
    startTime: new Date(),
  };

  // Setup readline
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question('\x1b[33mYou:\x1b[0m ', async (input) => {
      const trimmed = input.trim();

      // Handle commands
      if (trimmed.toLowerCase() === 'exit') {
        showStats(session);
        console.log('\n\x1b[36mGoodbye! 👋\x1b[0m\n');
        rl.close();
        return;
      }

      if (trimmed.toLowerCase() === 'stats') {
        showStats(session);
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === 'clear') {
        session.messages = [{ role: 'system', content: CONFIG.systemPrompt }];
        console.log('\x1b[90mConversation cleared.\x1b[0m\n');
        prompt();
        return;
      }

      if (!trimmed) {
        prompt();
        return;
      }

      // Add user message
      session.messages.push({ role: 'user', content: trimmed });

      // Show thinking indicator
      process.stdout.write('\x1b[90mAssistant: Thinking...\x1b[0m');

      try {
        const startTime = Date.now();
        const response = await chat(provider, model, session.messages);
        const duration = Date.now() - startTime;

        // Clear thinking indicator
        process.stdout.write('\r\x1b[K');

        // Display response
        console.log(`\x1b[32mAssistant:\x1b[0m ${response.content}`);
        console.log(`\x1b[90m[${response.tokens} tokens | ${formatCost(response.cost)} | ${formatDuration(duration)}]\x1b[0m\n`);

        // Update session
        session.messages.push({ role: 'assistant', content: response.content });
        session.totalCost += response.cost;
        session.totalTokens += response.tokens;
      } catch (error: any) {
        process.stdout.write('\r\x1b[K');
        console.log(`\x1b[31mError: ${error.message}\x1b[0m\n`);
      }

      prompt();
    });
  };

  prompt();
}

/**
 * Show session statistics
 */
function showStats(session: ChatSession) {
  const duration = Date.now() - session.startTime.getTime();
  const messageCount = session.messages.filter(m => m.role !== 'system').length;

  console.log('\n\x1b[36m📊 Session Statistics\x1b[0m');
  console.log('\x1b[90m─────────────────────\x1b[0m');
  console.log(`Messages:     ${messageCount}`);
  console.log(`Total Tokens: ${session.totalTokens}`);
  console.log(`Total Cost:   ${formatCost(session.totalCost)}`);
  console.log(`Duration:     ${formatDuration(duration)}`);
  console.log(`Avg Cost/Msg: ${formatCost(session.totalCost / Math.max(messageCount / 2, 1))}`);
  console.log();
}

// Run the chatbot
main().catch(console.error);
