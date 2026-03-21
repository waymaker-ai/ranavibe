/**
 * CoFounder Learn Command
 *
 * Interactive tutorial system for learning CoFounder
 * Inspired by Rails Guides - but interactive in the terminal
 *
 * @example
 * ```bash
 * # Start interactive learning
 * cofounder learn
 *
 * # Learn specific topic
 * cofounder learn prompts
 * cofounder learn rag
 * cofounder learn agents
 * cofounder learn testing
 * cofounder learn cost
 * ```
 */

import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';

interface LessonStep {
  title: string;
  content: string;
  code?: string;
  action?: 'create-file' | 'run-command' | 'show-example' | 'quiz';
  file?: string;
  command?: string;
  quiz?: {
    question: string;
    options: string[];
    correct: number;
  };
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  steps: LessonStep[];
}

/**
 * All available lessons
 */
const LESSONS: Lesson[] = [
  {
    id: 'getting-started',
    title: '🚀 Getting Started with CoFounder',
    description: 'Learn the basics of CoFounder in 5 minutes',
    duration: '5 min',
    steps: [
      {
        title: 'Welcome to CoFounder!',
        content: `
CoFounder (Rapid AI Native Architecture) helps you build production-ready
AI applications with:

  • 9 LLM Providers (OpenAI, Anthropic, Google, and more)
  • 70% Cost Reduction through smart caching and optimization
  • Enterprise Security built-in
  • One unified API - no vendor lock-in

Let's build your first AI-powered feature!
        `.trim(),
      },
      {
        title: 'Install CoFounder',
        content: 'First, install the CoFounder core package:',
        code: 'npm install @cofounder/core',
        action: 'show-example',
      },
      {
        title: 'Configure Your API Key',
        content: `
You'll need an API key from at least one provider.
OpenAI is the most common starting point.

Run this command to securely store your key:
        `.trim(),
        code: 'cofounder config:set --provider openai --key YOUR_API_KEY',
        action: 'show-example',
      },
      {
        title: 'Your First AI Call',
        content: 'Create a simple chat completion:',
        code: `
import { CoFounderClient } from '@cofounder/core';

const cofounder = new CoFounderClient();

const response = await cofounder.chat({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'user', content: 'Hello, CoFounder!' }
  ]
});

console.log(response.content);
        `.trim(),
        action: 'show-example',
      },
      {
        title: 'Quick Check',
        content: 'Let\'s make sure you understood the basics:',
        action: 'quiz',
        quiz: {
          question: 'What does CoFounder help you with?',
          options: [
            'Building video games',
            'Building AI applications with cost optimization',
            'Managing databases',
            'Creating websites',
          ],
          correct: 1,
        },
      },
    ],
  },
  {
    id: 'prompts',
    title: '✏️ Prompt Engineering with CoFounder',
    description: 'Master prompt management, versioning, and A/B testing',
    duration: '10 min',
    steps: [
      {
        title: 'Why Prompt Management Matters',
        content: `
Prompts are the "code" of AI applications. Just like code, they need:

  • Version control - track changes over time
  • Testing - know when prompts break
  • A/B testing - optimize for quality and cost
  • Organization - find and reuse prompts

CoFounder's @cofounder/prompts package solves all of this.
        `.trim(),
      },
      {
        title: 'Install Prompts Package',
        content: 'Add the prompts package to your project:',
        code: 'npm install @cofounder/prompts',
        action: 'show-example',
      },
      {
        title: 'Register a Prompt',
        content: 'Create and register your first managed prompt:',
        code: `
import { PromptManager } from '@cofounder/prompts';

const pm = new PromptManager({ workspace: 'my-app' });

// Register a prompt with variables
await pm.register('greeting', {
  template: 'Hello {{name}}! How can I help you with {{topic}} today?',
  description: 'Friendly greeting prompt',
  tags: ['customer-support'],
});

// Use the prompt
const result = await pm.execute('greeting', {
  variables: { name: 'Alice', topic: 'billing' }
});
        `.trim(),
        action: 'show-example',
      },
      {
        title: 'A/B Test Your Prompts',
        content: 'Test different prompt variations:',
        code: `
// Create an A/B test
await pm.createABTest('greeting', {
  variants: [
    { name: 'formal', template: 'Good day, {{name}}. How may I assist you?' },
    { name: 'casual', template: 'Hey {{name}}! What can I do for you?' }
  ],
  metric: 'user_satisfaction',
  trafficSplit: [50, 50]
});

// CoFounder automatically tracks which variant performs better!
        `.trim(),
        action: 'show-example',
      },
    ],
  },
  {
    id: 'rag',
    title: '📚 RAG (Retrieval Augmented Generation)',
    description: 'Build AI apps that use your own data',
    duration: '15 min',
    steps: [
      {
        title: 'What is RAG?',
        content: `
RAG lets your AI use YOUR data to answer questions.

Instead of the AI making things up, it:
  1. Searches your documents
  2. Finds relevant information
  3. Uses that to generate accurate answers

Perfect for:
  • Documentation chatbots
  • Customer support
  • Internal knowledge bases
        `.trim(),
      },
      {
        title: 'Install RAG Package',
        content: 'Add the RAG package:',
        code: 'npm install @cofounder/rag',
        action: 'show-example',
      },
      {
        title: 'Create a RAG Pipeline',
        content: 'Build your first RAG system in 10 lines:',
        code: `
import { RAGPresets } from '@cofounder/rag';

// Use the balanced preset (good quality + speed)
const pipeline = RAGPresets.balanced();

// Index your documents
await pipeline.index([
  { content: 'CoFounder supports 9 LLM providers', metadata: { source: 'docs' } },
  { content: 'Use caching to reduce costs by 70%', metadata: { source: 'docs' } },
]);

// Query with automatic citation
const result = await pipeline.query({
  query: 'How many providers does CoFounder support?'
});

console.log(result.answer);    // "CoFounder supports 9 LLM providers"
console.log(result.citations); // Sources used
        `.trim(),
        action: 'show-example',
      },
    ],
  },
  {
    id: 'agents',
    title: '🤖 AI Agents',
    description: 'Build autonomous AI agents that can use tools',
    duration: '15 min',
    steps: [
      {
        title: 'What are AI Agents?',
        content: `
AI Agents are LLMs that can:

  • Use tools (search, calculate, call APIs)
  • Make decisions
  • Complete multi-step tasks
  • Work together with other agents

Think of them as AI assistants that can actually DO things.
        `.trim(),
      },
      {
        title: 'Create Your First Agent',
        content: 'Build an agent with tools:',
        code: `
import { LLMAgent, calculatorTool, webSearchTool } from '@cofounder/core';

const agent = new LLMAgent({
  name: 'Assistant',
  model: 'gpt-4o',
  systemPrompt: 'You are a helpful assistant.',
  tools: [calculatorTool, webSearchTool],
});

// The agent decides which tools to use
const result = await agent.run('What is 15% of 847?');
// Agent uses calculator tool automatically!
        `.trim(),
        action: 'show-example',
      },
      {
        title: 'Multi-Agent Systems',
        content: 'Have agents work together:',
        code: `
import { Orchestrator, LLMAgent } from '@cofounder/core';

const researcher = new LLMAgent({
  name: 'Researcher',
  tools: [webSearchTool],
});

const writer = new LLMAgent({
  name: 'Writer',
  systemPrompt: 'You write clear, concise summaries.',
});

const orchestrator = new Orchestrator({
  agents: [researcher, writer],
  strategy: 'sequential', // or 'parallel'
});

const result = await orchestrator.run(
  'Research and summarize the latest AI news'
);
        `.trim(),
        action: 'show-example',
      },
    ],
  },
  {
    id: 'testing',
    title: '🧪 Testing AI Code',
    description: 'Learn to test AI applications properly',
    duration: '10 min',
    steps: [
      {
        title: 'The Challenge of Testing AI',
        content: `
Testing AI is different because:

  • Outputs are non-deterministic
  • "Correct" is subjective
  • You can't do exact string matching

CoFounder's @cofounder/testing solves this with:

  • Semantic matching (compare meaning, not strings)
  • Statistical assertions (80% should be X)
  • Regression testing (did my change make it worse?)
  • Cost assertions (stay within budget)
        `.trim(),
      },
      {
        title: 'Write Your First AI Test',
        content: 'Test AI outputs by meaning:',
        code: `
import { describe, aiTest, runTimes } from '@cofounder/testing';

describe('Summarization', () => {
  aiTest('should summarize correctly', async ({ expect }) => {
    const result = await summarize(article);

    // Compare by meaning, not exact string
    await expect(result).toSemanticMatch(
      'A concise overview of the main points'
    );

    // Ensure cost stays low
    await expect(result).toCostLessThan(0.01);
  });

  aiTest('should be consistent', async ({ expect }) => {
    // Run 10 times for non-deterministic outputs
    const results = await runTimes(10, () => classify(email));

    // At least 80% should be 'spam'
    await expect(results).toMostlyBe('spam', { threshold: 0.8 });
  });
});
        `.trim(),
        action: 'show-example',
      },
      {
        title: 'Run Your Tests',
        content: 'Use the CoFounder test runner:',
        code: `
# Run all tests
cofounder test

# Watch mode
cofounder test --watch

# With cost budget
cofounder test --max-cost 1.00
        `.trim(),
        action: 'show-example',
      },
    ],
  },
  {
    id: 'cost',
    title: '💰 Cost Optimization',
    description: 'Reduce AI costs by 70% or more',
    duration: '10 min',
    steps: [
      {
        title: 'Why Cost Matters',
        content: `
AI API costs can explode quickly:

  • GPT-4o: $2.50/1M input, $10/1M output
  • Claude Opus: $15/1M input, $75/1M output

A busy app can cost thousands per month!

CoFounder helps you:
  • Cache responses (same question = free)
  • Choose right-sized models
  • Track costs in real-time
  • Set hard budget limits
        `.trim(),
      },
      {
        title: 'Enable Caching',
        content: 'Cache identical requests:',
        code: `
import { CoFounderClient } from '@cofounder/core';

const cofounder = new CoFounderClient({
  cache: {
    type: 'redis', // or 'memory', 'file'
    ttl: 3600,     // Cache for 1 hour
  }
});

// First call: hits API, costs money
await cofounder.chat({ messages: [{ role: 'user', content: 'Hi' }] });

// Second call: returns cached response, FREE!
await cofounder.chat({ messages: [{ role: 'user', content: 'Hi' }] });
        `.trim(),
        action: 'show-example',
      },
      {
        title: 'Track Costs',
        content: 'Monitor your spending:',
        code: `
// Get cost report
const tracker = cofounder.getCostTracker();

console.log(tracker.getReport());
// {
//   totalSpent: 12.50,
//   totalSaved: 87.30,  // From caching!
//   savingsPercent: 87.5,
//   byProvider: { openai: 8.50, anthropic: 4.00 }
// }

// Or use the CLI
// $ cofounder dashboard
        `.trim(),
        action: 'show-example',
      },
      {
        title: 'Use the Dashboard',
        content: 'See costs in real-time:',
        code: 'cofounder dashboard --live',
        action: 'show-example',
      },
    ],
  },
];

/**
 * Main learn command
 */
export async function learnCommand(topic?: string): Promise<void> {
  console.log(chalk.bold.cyan('\n📚 CoFounder Learning Center\n'));

  if (topic) {
    // Find and run specific lesson
    const lesson = LESSONS.find((l) => l.id === topic);
    if (!lesson) {
      console.log(chalk.yellow(`Lesson "${topic}" not found.\n`));
      console.log('Available lessons:');
      for (const l of LESSONS) {
        console.log(chalk.gray(`  • ${l.id} - ${l.title}`));
      }
      return;
    }

    await runLesson(lesson);
    return;
  }

  // Show lesson menu
  console.log(chalk.gray('Learn AI development with interactive tutorials.\n'));

  const choices = LESSONS.map((lesson) => ({
    title: `${lesson.title} ${chalk.gray(`(${lesson.duration})`)}`,
    description: lesson.description,
    value: lesson.id,
  }));

  const response = await prompts({
    type: 'select',
    name: 'lesson',
    message: 'What would you like to learn?',
    choices,
  });

  if (!response.lesson) {
    console.log(chalk.gray('\nNo lesson selected. Run `cofounder learn` anytime!\n'));
    return;
  }

  const selectedLesson = LESSONS.find((l) => l.id === response.lesson);
  if (selectedLesson) {
    await runLesson(selectedLesson);
  }
}

/**
 * Run a lesson interactively
 */
async function runLesson(lesson: Lesson): Promise<void> {
  console.clear();
  console.log(chalk.bold.cyan(`\n${lesson.title}\n`));
  console.log(chalk.gray(lesson.description));
  console.log(chalk.gray(`Duration: ${lesson.duration}\n`));
  console.log(chalk.gray('─'.repeat(60)) + '\n');

  for (let i = 0; i < lesson.steps.length; i++) {
    const step = lesson.steps[i];

    // Step header
    console.log(chalk.bold(`Step ${i + 1}/${lesson.steps.length}: ${step.title}\n`));

    // Step content
    console.log(step.content);
    console.log('');

    // Show code if present
    if (step.code) {
      console.log(chalk.gray('```'));
      console.log(chalk.green(step.code));
      console.log(chalk.gray('```\n'));
    }

    // Handle quiz
    if (step.action === 'quiz' && step.quiz) {
      const answer = await prompts({
        type: 'select',
        name: 'answer',
        message: step.quiz.question,
        choices: step.quiz.options.map((opt, idx) => ({
          title: opt,
          value: idx,
        })),
      });

      if (answer.answer === step.quiz.correct) {
        console.log(chalk.green('\n✓ Correct!\n'));
      } else {
        console.log(chalk.yellow('\n✗ Not quite. The correct answer is:'));
        console.log(chalk.white(`  ${step.quiz.options[step.quiz.correct]}\n`));
      }
    }

    // Continue prompt (unless last step)
    if (i < lesson.steps.length - 1) {
      const cont = await prompts({
        type: 'confirm',
        name: 'continue',
        message: 'Continue to next step?',
        initial: true,
      });

      if (!cont.continue) {
        console.log(chalk.gray('\nLesson paused. Run `cofounder learn` to continue!\n'));
        return;
      }

      console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
    }
  }

  // Lesson complete
  console.log(chalk.green.bold('\n🎉 Lesson Complete!\n'));
  console.log(chalk.gray('What\'s next?\n'));

  // Suggest next lessons
  const currentIndex = LESSONS.findIndex((l) => l.id === lesson.id);
  if (currentIndex < LESSONS.length - 1) {
    const next = LESSONS[currentIndex + 1];
    console.log(chalk.gray(`  • Next: ${next.title}`));
    console.log(chalk.gray(`    Run: cofounder learn ${next.id}\n`));
  }

  console.log(chalk.gray('  • See all lessons: cofounder learn'));
  console.log(chalk.gray('  • Get help: cofounder --help\n'));
}

/**
 * List all available lessons
 */
export function listLessons(): void {
  console.log(chalk.bold.cyan('\n📚 Available Lessons\n'));

  for (const lesson of LESSONS) {
    console.log(chalk.bold(`${lesson.title}`));
    console.log(chalk.gray(`  ${lesson.description}`));
    console.log(chalk.gray(`  Duration: ${lesson.duration}`));
    console.log(chalk.gray(`  Run: cofounder learn ${lesson.id}\n`));
  }
}
