/**
 * CoFounder Core SDK Examples
 * Complete demonstrations of all SDK features
 */

import { createCoFounder } from '@aicofounder/core';
import type { Message } from '@aicofounder/core';

// ============================================================================
// 1. Simple Setup
// ============================================================================

async function example1_SimpleSetup() {
  console.log('\n📘 Example 1: Simple Setup\n');

  const cofounder = createCoFounder({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
    },
  });

  // One-liner chat
  const response = await cofounder.chat('What is TypeScript?');
  console.log('Response:', response.content.substring(0, 100) + '...');
  console.log('Cost:', `$${response.cost.total_cost.toFixed(4)}`);
}

// ============================================================================
// 2. Fluent API
// ============================================================================

async function example2_FluentAPI() {
  console.log('\n📘 Example 2: Fluent API\n');

  const cofounder = createCoFounder({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
    },
  });

  // Chainable methods
  const response = await cofounder
    .provider('anthropic')
    .model('claude-3-5-sonnet-20241022')
    .temperature(0.7)
    .maxTokens(500)
    .optimize('cost')
    .cache(true)
    .chat({
      messages: [
        { role: 'user', content: 'Explain React hooks in 2 sentences' },
      ],
    });

  console.log('Response:', response.content);
  console.log('Cached:', response.cached);
  console.log('Latency:', `${response.latency_ms}ms`);
}

// ============================================================================
// 3. Provider Switching
// ============================================================================

async function example3_ProviderSwitching() {
  console.log('\n📘 Example 3: Provider Switching\n');

  const cofounder = createCoFounder({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
      google: process.env.GOOGLE_AI_API_KEY || '',
    },
  });

  const question = 'What is 2+2?';

  // Try different providers
  const claude = await cofounder.anthropic().chat(question);
  console.log('Claude:', claude.content.substring(0, 50));

  const gpt = await cofounder.openai().chat(question);
  console.log('GPT:', gpt.content.substring(0, 50));

  const gemini = await cofounder.google().chat(question);
  console.log('Gemini:', gemini.content.substring(0, 50));

  // Compare costs
  console.log('\nCost comparison:');
  console.log(`Claude: $${claude.cost.total_cost.toFixed(6)}`);
  console.log(`GPT: $${gpt.cost.total_cost.toFixed(6)}`);
  console.log(`Gemini: $${gemini.cost.total_cost.toFixed(6)}`);
}

// ============================================================================
// 4. Cost Optimization
// ============================================================================

async function example4_CostOptimization() {
  console.log('\n📘 Example 4: Cost Optimization\n');

  const cofounder = createCoFounder({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
      google: process.env.GOOGLE_AI_API_KEY || '',
    },
  });

  // Optimize for cost (uses cheapest provider)
  const costOptimized = await cofounder.chat({
    messages: [{ role: 'user', content: 'Say hello' }],
    optimize: 'cost',
  });

  console.log('Cost-optimized provider:', costOptimized.provider);
  console.log('Cost:', `$${costOptimized.cost.total_cost.toFixed(6)}`);

  // Optimize for quality (uses best model)
  const qualityOptimized = await cofounder.chat({
    messages: [{ role: 'user', content: 'Say hello' }],
    optimize: 'quality',
  });

  console.log('\nQuality-optimized provider:', qualityOptimized.provider);
  console.log('Cost:', `$${qualityOptimized.cost.total_cost.toFixed(6)}`);

  // Compare
  const savings =
    qualityOptimized.cost.total_cost - costOptimized.cost.total_cost;
  console.log(
    `\nSavings: $${savings.toFixed(6)} (${((savings / qualityOptimized.cost.total_cost) * 100).toFixed(0)}%)`
  );
}

// ============================================================================
// 5. Cost Tracking
// ============================================================================

async function example5_CostTracking() {
  console.log('\n📘 Example 5: Cost Tracking\n');

  const cofounder = createCoFounder({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
    },
    cost_tracking: {
      enabled: true,
      log_to_console: true,
    },
  });

  // Make several requests
  await cofounder.chat('Hello');
  await cofounder.chat('How are you?');
  await cofounder.chat('Tell me a joke');

  // Get statistics
  const stats = await cofounder.cost.stats();

  console.log('\n💰 Cost Statistics');
  console.log('─'.repeat(50));
  console.log(`Total Spent:     $${stats.total_spent.toFixed(4)}`);
  console.log(`Total Saved:     $${stats.total_saved.toFixed(4)}`);
  console.log(`Savings:         ${stats.savings_percentage.toFixed(0)}%`);
  console.log(`Total Requests:  ${stats.total_requests}`);
  console.log(`Cache Hit Rate:  ${(stats.cache_hit_rate * 100).toFixed(0)}%`);

  console.log('\n📊 Breakdown by Provider:');
  stats.breakdown.forEach((b) => {
    console.log(
      `  ${b.provider.padEnd(12)} $${b.total_cost.toFixed(4)} (${b.percentage.toFixed(0)}%)`
    );
  });
}

// ============================================================================
// 6. Streaming
// ============================================================================

async function example6_Streaming() {
  console.log('\n📘 Example 6: Streaming\n');

  const cofounder = createCoFounder({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
    },
  });

  console.log('Streaming response: ');

  for await (const chunk of cofounder.stream('Count from 1 to 10')) {
    process.stdout.write(chunk.delta);
  }

  console.log('\n');
}

// ============================================================================
// 7. Conversation
// ============================================================================

async function example7_Conversation() {
  console.log('\n📘 Example 7: Conversation\n');

  const cofounder = createCoFounder({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
    },
  });

  const messages: Message[] = [];

  // First message
  messages.push({ role: 'user', content: 'My name is Alice' });
  const response1 = await cofounder.chat({ messages });
  messages.push({ role: 'assistant', content: response1.content });
  console.log('Assistant:', response1.content.substring(0, 100));

  // Second message (references first)
  messages.push({ role: 'user', content: 'What is my name?' });
  const response2 = await cofounder.chat({ messages });
  console.log('Assistant:', response2.content.substring(0, 100));
}

// ============================================================================
// 8. Caching
// ============================================================================

async function example8_Caching() {
  console.log('\n📘 Example 8: Response Caching\n');

  const cofounder = createCoFounder({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
    },
    cache: {
      enabled: true,
      ttl: 3600,
      provider: 'memory',
    },
  });

  const question = 'What is the capital of France?';

  // First request (not cached)
  const start1 = Date.now();
  const response1 = await cofounder.chat(question);
  const time1 = Date.now() - start1;

  console.log('First request:');
  console.log('  Cached:', response1.cached);
  console.log('  Time:', `${time1}ms`);

  // Second request (cached)
  const start2 = Date.now();
  const response2 = await cofounder.chat(question);
  const time2 = Date.now() - start2;

  console.log('\nSecond request:');
  console.log('  Cached:', response2.cached);
  console.log('  Time:', `${time2}ms`);
  console.log(`\nSpeedup: ${(time1 / time2).toFixed(1)}x faster`);
}

// ============================================================================
// 9. Error Handling
// ============================================================================

async function example9_ErrorHandling() {
  console.log('\n📘 Example 9: Error Handling\n');

  const cofounder = createCoFounder({
    providers: {
      anthropic: 'invalid-key', // Intentionally wrong
    },
  });

  try {
    await cofounder.chat('Hello');
  } catch (error: any) {
    console.log('Error caught:', error.name);
    console.log('Error code:', error.code);
    console.log('Provider:', error.provider);
    console.log('Message:', error.message);
  }
}

// ============================================================================
// 10. Plugins
// ============================================================================

async function example10_Plugins() {
  console.log('\n📘 Example 10: Plugin System\n');

  const cofounder = createCoFounder({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
    },
  });

  // Simple logging plugin
  await cofounder.use({
    name: 'logger',
    async onBeforeRequest(request) {
      console.log('📤 Sending request...');
      return request;
    },
    async onAfterResponse(response) {
      console.log('📥 Received response');
      console.log(`   Cost: $${response.cost.total_cost.toFixed(6)}`);
      console.log(`   Latency: ${response.latency_ms}ms`);
      return response;
    },
  });

  await cofounder.chat('Hello');
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  console.log('🚀 CoFounder Core SDK Examples\n');
  console.log('═'.repeat(60));

  try {
    // await example1_SimpleSetup();
    // await example2_FluentAPI();
    // await example3_ProviderSwitching();
    // await example4_CostOptimization();
    await example5_CostTracking();
    // await example6_Streaming();
    // await example7_Conversation();
    // await example8_Caching();
    // await example9_ErrorHandling();
    // await example10_Plugins();

    console.log('\n✅ All examples completed!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1_SimpleSetup,
  example2_FluentAPI,
  example3_ProviderSwitching,
  example4_CostOptimization,
  example5_CostTracking,
  example6_Streaming,
  example7_Conversation,
  example8_Caching,
  example9_ErrorHandling,
  example10_Plugins,
};
