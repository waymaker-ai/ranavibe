'use client';

import Link from 'next/link';

const codeExamples = [
  {
    title: 'Basic Chat Completion',
    openai: `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
});

console.log(completion.choices[0].message.content);`,
    rana: `import { createRana } from '@rana/core';

const rana = createRana();

const response = await rana
  .system('You are a helpful assistant.')
  .chat('Hello!');

console.log(response.content);`,
  },
  {
    title: 'Multi-Provider Support',
    openai: `// OpenAI SDK - only supports OpenAI
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Need separate clients for each provider
const openai = new OpenAI();
const anthropic = new Anthropic();

// Different APIs for each
const openaiResponse = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }],
});

const anthropicResponse = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }],
});`,
    rana: `import { createRana } from '@rana/core';

const rana = createRana();

// Same API for all providers
const gpt4 = await rana.model('gpt-4').chat('Hello');

const claude = await rana.model('claude-3-sonnet').chat('Hello');

const gemini = await rana.model('gemini-pro').chat('Hello');

// Switch providers with one line
const response = await rana
  .model(process.env.MODEL || 'gpt-4')
  .chat('Hello');`,
  },
  {
    title: 'Tool Calling',
    openai: `import OpenAI from 'openai';

const openai = new OpenAI();

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the weather in a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city name',
          },
        },
        required: ['location'],
      },
    },
  },
];

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Weather in SF?' }],
  tools,
});

// Manually handle tool calls
const toolCall = completion.choices[0].message.tool_calls?.[0];
if (toolCall) {
  const args = JSON.parse(toolCall.function.arguments);
  // Execute function, make another API call...
}`,
    rana: `import { createRana, createTool } from '@rana/core';

const rana = createRana();

const weather = createTool({
  name: 'get_weather',
  description: 'Get the weather in a location',
  parameters: { location: { type: 'string' } },
  handler: async ({ location }) => {
    return \`Weather in \${location}: Sunny, 72°F\`;
  },
});

// RANA automatically executes tools
const response = await rana
  .tools([weather])
  .chat('Weather in SF?');

// Response includes the result directly
console.log(response.content);`,
  },
  {
    title: 'Streaming',
    openai: `import OpenAI from 'openai';

const openai = new OpenAI();

const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Tell a story' }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}`,
    rana: `import { createRana } from '@rana/core';

const rana = createRana();

for await (const chunk of rana.stream('Tell a story')) {
  process.stdout.write(chunk);
}`,
  },
];

const features = [
  {
    feature: 'OpenAI Models',
    openai: true,
    rana: true,
    note: 'Both support all OpenAI models',
  },
  {
    feature: 'Anthropic Models',
    openai: false,
    rana: true,
    note: 'RANA supports Claude models natively',
  },
  {
    feature: 'Google Models',
    openai: false,
    rana: true,
    note: 'RANA supports Gemini models',
  },
  {
    feature: 'Local Models (Ollama)',
    openai: false,
    rana: true,
    note: 'RANA supports local models out of the box',
  },
  {
    feature: 'Unified API',
    openai: false,
    rana: true,
    note: 'One API for all providers',
  },
  {
    feature: 'Automatic Tool Execution',
    openai: false,
    rana: true,
    note: 'RANA runs tools automatically',
  },
  {
    feature: 'Cost Tracking',
    openai: false,
    rana: true,
    note: 'RANA tracks costs across providers',
  },
  {
    feature: 'Built-in Testing',
    openai: false,
    rana: true,
    note: 'RANA includes testing utilities',
  },
  {
    feature: 'Automatic Fallbacks',
    openai: false,
    rana: true,
    note: 'RANA falls back between providers',
  },
  {
    feature: 'Security Features',
    openai: false,
    rana: true,
    note: 'RANA includes injection detection, PII filtering',
  },
];

export default function OpenAISDKComparisonPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Link
          href="/compare"
          className="text-gray-400 hover:text-white mb-8 inline-flex items-center gap-2"
        >
          ← Back to comparisons
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            RANA vs OpenAI SDK
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            The OpenAI SDK is great for OpenAI models. RANA gives you the same experience
            across all providers, plus production features you actually need.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">5+</div>
            <div className="text-gray-400 text-sm">Providers Supported</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">1</div>
            <div className="text-gray-400 text-sm">Unified API</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">Auto</div>
            <div className="text-gray-400 text-sm">Tool Execution</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">Built-in</div>
            <div className="text-gray-400 text-sm">Fallbacks</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 overflow-hidden mb-16">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="py-4 px-6 text-left font-semibold">Feature</th>
                <th className="py-4 px-6 text-center font-semibold">OpenAI SDK</th>
                <th className="py-4 px-6 text-center font-semibold">RANA</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-800 hover:bg-gray-900/50"
                >
                  <td className="py-4 px-6">
                    <div className="font-medium">{item.feature}</div>
                    <div className="text-sm text-gray-500">{item.note}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {item.openai ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {item.rana ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-16">
          {codeExamples.map((example, index) => (
            <div key={index} className="space-y-6">
              <h2 className="text-2xl font-semibold">{example.title}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                      OpenAI SDK
                    </span>
                    <span className="text-gray-500 text-sm">
                      {example.openai.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto text-sm">
                    <code className="text-gray-300">{example.openai}</code>
                  </pre>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                      RANA
                    </span>
                    <span className="text-gray-500 text-sm">
                      {example.rana.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto text-sm">
                    <code className="text-gray-300">{example.rana}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-900/20 to-purple-900/20">
          <h2 className="text-2xl font-semibold mb-6">The Multi-Provider Advantage</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-black/30">
              <h3 className="font-medium text-green-400 mb-2">Automatic Fallbacks</h3>
              <p className="text-sm text-gray-400">
                If OpenAI is down, automatically switch to Anthropic or Google.
                Zero downtime, zero code changes.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-black/30">
              <h3 className="font-medium text-blue-400 mb-2">Cost Optimization</h3>
              <p className="text-sm text-gray-400">
                Route simple queries to cheaper models automatically.
                Use GPT-4 only when needed.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-black/30">
              <h3 className="font-medium text-purple-400 mb-2">Best Model Selection</h3>
              <p className="text-sm text-gray-400">
                Different models excel at different tasks.
                Use Claude for analysis, GPT-4 for code, Gemini for multimodal.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-900/50">
          <h2 className="text-2xl font-semibold mb-6">When to Choose Each</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-4">Choose RANA if you:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Want flexibility to use multiple providers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Need automatic fallbacks and reliability
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Want built-in cost tracking and testing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Prefer cleaner, simpler APIs
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-yellow-400 mb-4">Choose OpenAI SDK if you:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Only ever need OpenAI models
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Need direct access to OpenAI-specific features
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Have existing code using OpenAI SDK
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="https://github.com/waymaker-ai/ranavibe"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
          >
            Try RANA Now
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
