'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, AlertTriangle, Terminal, Zap, DollarSign, Lock, Bug } from 'lucide-react';

const faqs = [
  {
    category: 'Installation',
    icon: Terminal,
    items: [
      {
        question: 'How do I install RANA?',
        answer: `Install all packages at once:

\`\`\`bash
npm install @rana/core @rana/helpers @rana/prompts @rana/rag
\`\`\`

Or install the CLI globally:

\`\`\`bash
npm install -g @rana/cli
\`\`\``,
      },
      {
        question: 'I get "Module not found" errors after installation',
        answer: `Try these steps:

1. Clear your node_modules and reinstall:
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

2. Make sure you're using Node.js 18 or higher:
\`\`\`bash
node --version
\`\`\`

3. If using TypeScript, ensure your tsconfig.json has:
\`\`\`json
{
  "compilerOptions": {
    "moduleResolution": "node16" // or "bundler"
  }
}
\`\`\``,
      },
      {
        question: 'TypeScript types are not working',
        answer: `RANA is fully typed. Make sure you have:

1. TypeScript 5.0 or higher
2. Proper moduleResolution in tsconfig.json

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "esModuleInterop": true
  }
}
\`\`\``,
      },
    ],
  },
  {
    category: 'API Keys',
    icon: Lock,
    items: [
      {
        question: 'Where do I put my API keys?',
        answer: `Create a \`.env\` file in your project root:

\`\`\`bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
\`\`\`

Make sure to add \`.env\` to your \`.gitignore\`!

For production, use your platform's environment variable system (Vercel, Railway, etc.)`,
      },
      {
        question: 'I get "Invalid API key" errors',
        answer: `1. Check that your API key is correct and hasn't expired
2. Make sure there are no extra spaces or quotes around the key
3. Verify the key is for the correct environment (production vs test)
4. Check your provider's dashboard to ensure the key is active

\`\`\`bash
# Validate your setup
npx rana doctor
\`\`\``,
      },
      {
        question: 'How do I use different API keys per environment?',
        answer: `Use different .env files:

\`\`\`
.env.local          # Local development
.env.development    # Development server
.env.production     # Production
\`\`\`

Or use environment-specific configuration:

\`\`\`typescript
import { configure } from '@rana/core';

configure({
  providers: {
    openai: {
      apiKey: process.env.NODE_ENV === 'production'
        ? process.env.OPENAI_API_KEY_PROD
        : process.env.OPENAI_API_KEY_DEV
    }
  }
});
\`\`\``,
      },
    ],
  },
  {
    category: 'Performance',
    icon: Zap,
    items: [
      {
        question: 'Requests are slow. How can I speed them up?',
        answer: `Several strategies:

1. **Use streaming** for faster perceived response:
\`\`\`typescript
for await (const chunk of agent.stream(message)) {
  process.stdout.write(chunk.content);
}
\`\`\`

2. **Enable caching** for repeated queries:
\`\`\`typescript
configure({
  cache: { enabled: true, ttl: '1h' }
});
\`\`\`

3. **Use a faster model** for simple tasks:
\`\`\`typescript
const agent = new Agent({
  model: 'claude-3-haiku-20240307'  // Faster than Sonnet
});
\`\`\`

4. **Reduce token count** by shortening prompts`,
      },
      {
        question: 'How do I handle rate limits?',
        answer: `RANA handles rate limits automatically with retries and backoff.

For additional control:

\`\`\`typescript
import { RateLimiter } from '@rana/core';

const limiter = new RateLimiter({
  requests: { max: 100, window: '1m' }
});

// Check before making request
const allowed = await limiter.checkLimit('requests');
if (!allowed.success) {
  await delay(allowed.retryAfter);
}
\`\`\`

Or configure fallbacks to switch providers when rate limited.`,
      },
      {
        question: 'Memory usage is too high',
        answer: `1. **Clear conversation memory** periodically:
\`\`\`typescript
conversation.clear();
\`\`\`

2. **Use streaming** instead of buffering full responses

3. **Limit conversation history**:
\`\`\`typescript
const memory = new ConversationMemory({
  maxMessages: 20  // Keep only recent messages
});
\`\`\`

4. **Use compression** for long conversations:
\`\`\`typescript
const compressor = new MemoryCompressor({
  targetTokens: 1000
});
\`\`\``,
      },
    ],
  },
  {
    category: 'Costs',
    icon: DollarSign,
    items: [
      {
        question: 'How do I track my AI spending?',
        answer: `RANA tracks costs automatically:

\`\`\`typescript
import { CostTracker } from '@rana/core';

const tracker = new CostTracker();

const result = await tracker.wrap(
  () => agent.run(message)
);

console.log(result.cost);  // $0.0023
\`\`\`

Or use the dashboard:

\`\`\`bash
npx rana dashboard
\`\`\``,
      },
      {
        question: 'How do I set budget limits?',
        answer: `Set hard budget limits to prevent overspending:

\`\`\`typescript
import { BudgetManager } from '@rana/core';

const budget = new BudgetManager();

await budget.setGlobalBudget({
  daily: 100,    // $100/day
  monthly: 2000  // $2000/month
});

// Per-user budgets
await budget.setUserBudget(userId, {
  daily: 5
});
\`\`\``,
      },
      {
        question: 'How can I reduce costs?',
        answer: `1. **Enable caching** - avoid duplicate requests
2. **Use cheaper models** for simple tasks
3. **Compress prompts** - shorter prompts = lower costs
4. **Use model routing** - automatically pick cheapest suitable model

\`\`\`typescript
import { CostOptimizer } from '@rana/core';

const optimizer = new CostOptimizer({
  strategies: ['caching', 'model-routing', 'prompt-compression']
});

const result = await optimizer.optimize(
  () => agent.run(message)
);

console.log(result.savings);  // "60%"
\`\`\``,
      },
    ],
  },
  {
    category: 'Common Errors',
    icon: Bug,
    items: [
      {
        question: 'Error: "Request timeout"',
        answer: `Increase the timeout or use streaming:

\`\`\`typescript
// Increase timeout
configure({
  timeout: 60000  // 60 seconds
});

// Or use streaming for long responses
for await (const chunk of agent.stream(message)) {
  // Process chunks as they arrive
}
\`\`\``,
      },
      {
        question: 'Error: "Context length exceeded"',
        answer: `Your prompt + response exceeds the model's context limit.

Solutions:
1. **Use a model with larger context** (e.g., claude-3 has 200k tokens)
2. **Compress your prompt**:
\`\`\`typescript
import { compressPrompt } from '@rana/helpers';
const compressed = await compressPrompt(longPrompt);
\`\`\`

3. **Chunk your input**:
\`\`\`typescript
import { SemanticChunker } from '@rana/rag';
const chunks = await chunker.chunk(longDocument);
\`\`\``,
      },
      {
        question: 'Error: "Provider unavailable"',
        answer: `The AI provider is temporarily down. RANA can auto-fallback:

\`\`\`typescript
import { FallbackChain } from '@rana/core';

const chain = new FallbackChain({
  providers: [
    { name: 'primary', provider: anthropicClient },
    { name: 'backup', provider: openaiClient }
  ]
});

// Automatically uses backup if primary fails
const result = await chain.chat({ messages });
\`\`\``,
      },
      {
        question: 'Error: "Invalid response format"',
        answer: `The model didn't return the expected format.

Use structured output to ensure correct format:

\`\`\`typescript
import { extract } from '@rana/helpers';

const data = await extract(text, {
  name: 'string',
  age: 'number',
  skills: 'string[]'
});
// Guaranteed to match schema
\`\`\`

Or enable retries on format errors:

\`\`\`typescript
configure({
  retry: {
    retryOn: ['format_error'],
    maxAttempts: 3
  }
});
\`\`\``,
      },
    ],
  },
];

export default function TroubleshootingPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Troubleshooting</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Common issues and their solutions. Can&apos;t find your answer?
            Check the CLI doctor command or join our Discord.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npx rana doctor
          </div>
        </motion.div>

        {/* Quick diagnostic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 p-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-500 mb-1">Quick Diagnostic</h3>
              <p className="text-foreground-secondary mb-3">
                Run the doctor command to diagnose common issues:
              </p>
              <div className="code-block font-mono text-sm">
                npx rana doctor
              </div>
              <p className="text-foreground-secondary mt-3 text-sm">
                This checks: API keys, dependencies, configuration, and connectivity.
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ sections */}
        {faqs.map((section, sIndex) => (
          <motion.div
            key={section.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (sIndex + 1) * 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <section.icon className="h-6 w-6 text-gradient-from" />
              {section.category}
            </h2>

            <div className="space-y-4">
              {section.items.map((item, iIndex) => (
                <details
                  key={iIndex}
                  className="card group"
                >
                  <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
                    {item.question}
                    <span className="text-foreground-secondary group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="mt-4 text-foreground-secondary prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{item.answer}</div>
                  </div>
                </details>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Still need help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card bg-gradient-subtle text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-foreground-secondary mb-6">
            Our community is here to help you succeed.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="https://discord.gg/rana"
              target="_blank"
              className="btn-primary"
            >
              Join Discord
            </Link>
            <Link
              href="https://github.com/waymaker-ai/ranavibe/issues"
              target="_blank"
              className="btn-secondary"
            >
              Open an Issue
            </Link>
            <Link
              href="https://github.com/waymaker-ai/ranavibe/discussions"
              target="_blank"
              className="btn-secondary"
            >
              Discussions
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
