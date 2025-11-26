'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Code, MessageSquare, FileText, Search, Brain, Sparkles, ExternalLink, Copy } from 'lucide-react';
import { useState } from 'react';

const examples = [
  {
    title: 'AI Chatbot with RAG',
    description: 'Build a knowledge-grounded chatbot that answers questions from your documentation',
    icon: MessageSquare,
    tags: ['@rana/rag', '@rana/prompts', 'Next.js'],
    code: `import { RAGPresets } from '@rana/rag';
import { PromptManager } from '@rana/prompts';

// Setup RAG pipeline
const rag = RAGPresets.chat();
await rag.index(documents);

// Setup prompt management
const pm = new PromptManager({ workspace: 'chatbot' });
await pm.register('chat', {
  template: \`Context: {{context}}

Question: {{question}}

Answer helpfully based on the context.\`,
});

// Handle user query
export async function chat(question: string) {
  const ragResult = await rag.query({ query: question });

  const response = await pm.execute('chat', {
    variables: {
      context: ragResult.citations.map(c => c.text).join('\\n'),
      question,
    },
  });

  return {
    answer: response.response,
    sources: ragResult.sources,
  };
}`,
  },
  {
    title: 'Document Summarizer',
    description: 'Summarize long documents with customizable styles and automatic caching',
    icon: FileText,
    tags: ['@rana/helpers', 'Caching'],
    code: `import { summarize, extract } from '@rana/helpers';

// Summarize a document
const summary = await summarize(longDocument, {
  style: 'brief',      // 'brief' | 'detailed' | 'bullet'
  maxLength: 500,
});

// Extract key points
const keyPoints = await extract(longDocument, {
  title: 'string',
  mainPoints: 'string[]',
  conclusion: 'string',
  sentiment: "'positive' | 'negative' | 'neutral'",
});

console.log(summary);
console.log(keyPoints);`,
  },
  {
    title: 'Email Classifier',
    description: 'Automatically classify and route incoming emails to the right department',
    icon: Brain,
    tags: ['@rana/helpers', 'Classification'],
    code: `import { classify, extract, sentiment } from '@rana/helpers';

async function processEmail(email: string) {
  // Classify into departments
  const department = await classify(email, [
    'support',
    'sales',
    'billing',
    'feedback',
    'spam'
  ]);

  // Extract key information
  const data = await extract(email, {
    senderIntent: 'string',
    urgency: "'high' | 'medium' | 'low'",
    actionRequired: 'boolean',
    topics: 'string[]',
  });

  // Analyze sentiment
  const mood = await sentiment(email);

  return {
    department,
    ...data,
    sentiment: mood,
  };
}`,
  },
  {
    title: 'Multi-Language Support',
    description: 'Translate content to multiple languages with preserved formatting',
    icon: Sparkles,
    tags: ['@rana/helpers', 'Translation'],
    code: `import { translate, rewrite } from '@rana/helpers';

const content = "Welcome to our platform!";

// Translate to multiple languages
const translations = await Promise.all([
  translate(content, { to: 'es' }),  // Spanish
  translate(content, { to: 'fr' }),  // French
  translate(content, { to: 'de' }),  // German
  translate(content, { to: 'ja' }),  // Japanese
  translate(content, { to: 'zh' }),  // Chinese
]);

// Localize tone for different markets
const usVersion = await rewrite(content, {
  style: 'casual',
  audience: 'US market'
});

const ukVersion = await rewrite(content, {
  style: 'formal',
  audience: 'UK market'
});`,
  },
  {
    title: 'Code Documentation RAG',
    description: 'Search and answer questions about your codebase',
    icon: Code,
    tags: ['@rana/rag', 'Code Search'],
    code: `import { RAGPresets, CodeChunker } from '@rana/rag';

// Create code-optimized pipeline
const pipeline = RAGPresets.code('typescript');

// Index your codebase
const files = await glob('src/**/*.ts');
const documents = await Promise.all(
  files.map(async (file) => ({
    id: file,
    content: await readFile(file, 'utf-8'),
    metadata: { path: file },
  }))
);

await pipeline.index(documents);

// Query about your code
const result = await pipeline.query({
  query: 'How does authentication work?',
});

console.log(result.answer);
console.log('Relevant files:', result.sources);`,
  },
  {
    title: 'A/B Testing Prompts',
    description: 'Test different prompt variants and measure performance',
    icon: Search,
    tags: ['@rana/prompts', 'A/B Testing'],
    code: `import { PromptManager } from '@rana/prompts';

const pm = new PromptManager({
  workspace: 'my-app',
  analytics: true,
});

// Register base prompt
await pm.register('product-description', {
  template: 'Write a description for {{product}}',
});

// Create A/B test
const testId = await pm.createABTest('product-description', {
  name: 'Tone Test',
  variants: [
    {
      name: 'professional',
      template: 'Write a professional description for {{product}}.'
    },
    {
      name: 'casual',
      template: 'Write a fun, casual description for {{product}}!'
    },
  ],
  trafficSplit: [50, 50],
  metric: 'conversion_rate',
});

// Execute (automatically assigns variant)
const result = await pm.execute('product-description', {
  variables: { product: 'Wireless Headphones' },
  userId: 'user-123',
});

// Record outcome
await pm.recordOutcome(testId, result.variantId, {
  converted: true,
});

// Get test results
const results = await pm.getABTestResults(testId);`,
  },
];

export default function ExamplesPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Examples</h1>
          <p className="text-lg text-foreground-secondary">
            Ready-to-use code examples for common AI use cases
          </p>
        </motion.div>

        <div className="space-y-8 max-w-4xl mx-auto">
          {examples.map((example, index) => (
            <motion.div
              key={example.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <example.icon className="h-6 w-6" />
                </div>
                <div className="flex-grow">
                  <h2 className="text-xl font-bold mb-1">{example.title}</h2>
                  <p className="text-foreground-secondary text-sm mb-3">
                    {example.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {example.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded-md bg-background border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => copyCode(example.code, index)}
                  className="absolute top-3 right-3 p-2 rounded-md bg-background-secondary hover:bg-background transition-colors"
                  title="Copy code"
                >
                  {copiedIndex === index ? (
                    <span className="text-xs text-green-500">Copied!</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <div className="code-block font-mono text-sm overflow-x-auto">
                  <pre className="text-foreground-secondary">{example.code}</pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-foreground-secondary mb-4">
            Want more examples? Check out our GitHub repository
          </p>
          <Link
            href="https://github.com/waymaker-ai/ranavibe/tree/main/examples"
            target="_blank"
            className="btn-primary px-6 py-3 inline-flex items-center"
          >
            View All Examples on GitHub
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
