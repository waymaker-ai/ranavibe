/**
 * Model Router Example
 * Demonstrates intelligent routing across multiple LLM providers
 */

import { ModelRouter, RoutingStrategy } from '@rana/core';

async function main() {
  // Initialize router with multiple providers
  const router = new ModelRouter({
    providers: {
      openai: {
        models: ['gpt-4o', 'gpt-4o-mini'],
        apiKey: process.env.OPENAI_API_KEY,
      },
      anthropic: {
        models: ['claude-3-5-sonnet', 'claude-3-haiku'],
        apiKey: process.env.ANTHROPIC_API_KEY,
      },
      google: {
        models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
        apiKey: process.env.GOOGLE_API_KEY,
      },
    },
    defaultStrategy: 'balanced',
    fallbackEnabled: true,
    circuitBreaker: {
      failureThreshold: 3,
      recoveryTimeout: 30000,
    },
  });

  // Example 1: Cost-optimized routing
  console.log('=== Cost-Optimized Routing ===');
  const costOptimizedResponse = await router.route({
    task: 'summarization',
    prompt: 'Summarize this article about climate change...',
    optimize: 'cost',
    constraints: {
      maxCost: 0.005, // Max $0.005 per request
    },
  });
  console.log(`Routed to: ${costOptimizedResponse.model}`);
  console.log(`Cost: $${costOptimizedResponse.cost.toFixed(6)}`);

  // Example 2: Quality-optimized routing
  console.log('\n=== Quality-Optimized Routing ===');
  const qualityResponse = await router.route({
    task: 'code-generation',
    prompt: 'Write a production-ready React component for a data table with sorting and pagination',
    optimize: 'quality',
  });
  console.log(`Routed to: ${qualityResponse.model}`);
  console.log(`Response quality score: ${qualityResponse.metrics.qualityScore}`);

  // Example 3: Latency-optimized routing
  console.log('\n=== Latency-Optimized Routing ===');
  const fastResponse = await router.route({
    task: 'chat',
    prompt: 'What is 2 + 2?',
    optimize: 'speed',
    constraints: {
      maxLatency: 500, // Max 500ms
    },
  });
  console.log(`Routed to: ${fastResponse.model}`);
  console.log(`Latency: ${fastResponse.latency}ms`);

  // Example 4: Adaptive routing with learning
  console.log('\n=== Adaptive Routing ===');
  const adaptiveRouter = new ModelRouter({
    providers: router.config.providers,
    defaultStrategy: 'adaptive',
    learning: {
      enabled: true,
      windowSize: 100, // Learn from last 100 requests
    },
  });

  // Simulate multiple requests to demonstrate learning
  const tasks = ['chat', 'code-generation', 'analysis', 'creative-writing'];
  for (const task of tasks) {
    const response = await adaptiveRouter.route({
      task,
      prompt: `Sample ${task} prompt...`,
    });
    console.log(`Task: ${task} -> ${response.model}`);
  }

  // Example 5: Custom routing rules
  console.log('\n=== Custom Routing Rules ===');
  const customRouter = new ModelRouter({
    providers: router.config.providers,
    rules: [
      {
        condition: { taskType: 'code-generation' },
        preferModels: ['claude-3-5-sonnet', 'gpt-4o'],
      },
      {
        condition: { maxCost: 0.001 },
        preferModels: ['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash'],
      },
      {
        condition: { requiresVision: true },
        preferModels: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'],
      },
    ],
  });

  const codeResponse = await customRouter.route({
    task: 'code-generation',
    prompt: 'Implement a binary search tree in TypeScript',
  });
  console.log(`Code task routed to: ${codeResponse.model}`);

  // Example 6: Fallback handling
  console.log('\n=== Fallback Handling ===');
  try {
    const response = await router.route({
      task: 'chat',
      prompt: 'Hello!',
      preferredProvider: 'openai', // Try OpenAI first
      fallbackProviders: ['anthropic', 'google'], // Fall back to these
    });
    console.log(`Response from: ${response.provider}/${response.model}`);
  } catch (error) {
    console.error('All providers failed:', error);
  }

  // Get routing statistics
  console.log('\n=== Routing Statistics ===');
  const stats = router.getStatistics();
  console.log(`Total requests: ${stats.totalRequests}`);
  console.log(`Average latency: ${stats.averageLatency}ms`);
  console.log(`Total cost: $${stats.totalCost.toFixed(4)}`);
  console.log('Provider distribution:', stats.providerDistribution);
}

main().catch(console.error);
