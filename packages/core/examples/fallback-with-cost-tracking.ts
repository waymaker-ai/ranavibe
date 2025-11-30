/**
 * Example: Fallback with Cost Tracking
 *
 * This example demonstrates how the fallback system integrates
 * seamlessly with RANA's cost tracking and budget enforcement.
 */

import { createRana } from '../src';

async function costOptimizedWithTracking() {
  console.log('\n=== Cost-Optimized Fallback with Tracking ===\n');

  const rana = createRana({
    providers: {
      google: process.env.GOOGLE_API_KEY!, // Free during preview
      anthropic: process.env.ANTHROPIC_API_KEY!,
      openai: process.env.OPENAI_API_KEY!,
    },
    // Try cheapest providers first
    fallback: {
      order: ['google', 'anthropic', 'openai'],
      onFallback: (from, to, error) => {
        console.log(`⚠️  ${from} failed, switching to ${to}`);
        console.log(`   Error: ${error.message}`);
      },
      maxRetries: 1,
    },
    // Enable cost tracking
    cost_tracking: {
      enabled: true,
      log_to_console: true,
    },
  });

  // Make several requests
  const prompts = [
    'What is 2+2?',
    'Name a color.',
    'What is the capital of France?',
  ];

  console.log('Making requests...\n');

  for (const prompt of prompts) {
    const response = await rana.chat(prompt);

    console.log(`\nPrompt: "${prompt}"`);
    console.log(`Response: ${response.content}`);
    console.log(`Provider: ${response.provider}`);
    console.log(`Cost: $${response.cost.total_cost.toFixed(6)}`);
    console.log(`Latency: ${response.latency_ms}ms`);

    if ('fallbackMetadata' in response && response.fallbackMetadata.usedFallback) {
      console.log(`⚠️  Fallback was used!`);
      console.log(`   Attempts: ${response.fallbackMetadata.totalAttempts}`);
      console.log(`   Tried: ${response.fallbackMetadata.attemptedProviders.join(' -> ')}`);
    }
  }

  // Get cost statistics
  console.log('\n=== Cost Statistics ===\n');
  const stats = await rana.cost.stats();

  console.log(`Total Spent: $${stats.total_spent.toFixed(6)}`);
  console.log(`Total Requests: ${stats.total_requests}`);
  console.log(`Total Tokens: ${stats.total_tokens.toLocaleString()}`);
  console.log(`Cache Hit Rate: ${(stats.cache_hit_rate * 100).toFixed(1)}%`);

  if (stats.total_saved > 0) {
    console.log(`Total Saved: $${stats.total_saved.toFixed(6)}`);
    console.log(`Savings: ${stats.savings_percentage.toFixed(1)}%`);
  }

  console.log('\n=== Cost Breakdown by Provider ===\n');
  stats.breakdown.forEach((breakdown) => {
    console.log(`${breakdown.provider}:`);
    console.log(`  Requests: ${breakdown.requests}`);
    console.log(`  Tokens: ${breakdown.total_tokens.toLocaleString()}`);
    console.log(`  Cost: $${breakdown.total_cost.toFixed(6)} (${breakdown.percentage.toFixed(1)}%)`);
  });
}

async function budgetEnforcementWithFallback() {
  console.log('\n=== Budget Enforcement with Fallback ===\n');

  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY!,
      anthropic: process.env.ANTHROPIC_API_KEY!,
    },
    fallback: {
      order: ['openai', 'anthropic'],
    },
    cost_tracking: {
      enabled: true,
      budget: {
        limit: 0.10, // $0.10 limit
        period: 'daily',
        action: 'warn', // Warn instead of block
        warningThreshold: 50, // Warn at 50%
        onWarning: (spent, limit, percent) => {
          console.log(`⚠️  Budget Warning: ${percent.toFixed(1)}% used ($${spent.toFixed(4)} of $${limit.toFixed(2)})`);
        },
      },
    },
  });

  console.log('Budget: $0.10 daily limit\n');

  // Check budget status before making requests
  const budgetBefore = rana.cost.budget();
  console.log('Initial Budget Status:');
  console.log(`  Spent: $${budgetBefore.spent.toFixed(6)}`);
  console.log(`  Remaining: $${budgetBefore.remaining.toFixed(6)}`);
  console.log(`  Used: ${budgetBefore.percentUsed.toFixed(1)}%\n`);

  // Make requests
  const response = await rana.chat('Explain quantum computing in one sentence.');

  console.log(`Response: ${response.content}`);
  console.log(`Provider: ${response.provider}`);
  console.log(`Cost: $${response.cost.total_cost.toFixed(6)}\n`);

  // Check budget after
  const budgetAfter = rana.cost.budget();
  console.log('Budget Status After Request:');
  console.log(`  Spent: $${budgetAfter.spent.toFixed(6)}`);
  console.log(`  Remaining: $${budgetAfter.remaining.toFixed(6)}`);
  console.log(`  Used: ${budgetAfter.percentUsed.toFixed(1)}%`);

  if (budgetAfter.isWarning) {
    console.log(`  ⚠️  WARNING: Approaching budget limit!`);
  }
}

async function cachingWithFallback() {
  console.log('\n=== Caching with Fallback ===\n');

  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY!,
      anthropic: process.env.ANTHROPIC_API_KEY!,
    },
    fallback: {
      order: ['openai', 'anthropic'],
      onFallback: (from, to) => {
        console.log(`Falling back from ${from} to ${to}`);
      },
    },
    cache: {
      enabled: true,
      ttl: 3600, // 1 hour
    },
    cost_tracking: {
      enabled: true,
    },
  });

  const prompt = 'What is the meaning of life?';

  // First request - will use provider (potentially with fallback)
  console.log('First request (will call provider)...');
  const response1 = await rana.chat(prompt);
  console.log(`Provider: ${response1.provider}`);
  console.log(`Cost: $${response1.cost.total_cost.toFixed(6)}`);
  console.log(`Cached: ${response1.cached}`);

  // Second request - will use cache (no provider calls, no fallback)
  console.log('\nSecond request (from cache)...');
  const response2 = await rana.chat(prompt);
  console.log(`Provider: ${response2.provider}`);
  console.log(`Cost: $${response2.cost.total_cost.toFixed(6)}`);
  console.log(`Cached: ${response2.cached}`);

  // Get cost stats showing savings from cache
  const stats = await rana.cost.stats();
  console.log('\nCost Statistics:');
  console.log(`Total Spent: $${stats.total_spent.toFixed(6)}`);
  console.log(`Total Saved: $${stats.total_saved.toFixed(6)}`);
  console.log(`Savings: ${stats.savings_percentage.toFixed(1)}%`);
  console.log(`Cache Hit Rate: ${(stats.cache_hit_rate * 100).toFixed(1)}%`);
}

async function main() {
  try {
    // Uncomment the example you want to run:

    await costOptimizedWithTracking();
    // await budgetEnforcementWithFallback();
    // await cachingWithFallback();

    console.log('\n✅ Example completed!\n');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export {
  costOptimizedWithTracking,
  budgetEnforcementWithFallback,
  cachingWithFallback,
};
