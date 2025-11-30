/**
 * Token Analytics Usage Examples
 *
 * This file demonstrates how to use the TokenAnalytics class
 * for tracking and analyzing LLM token usage in RANA.
 */

import { createRana } from '../client';
import {
  TokenAnalytics,
  createMemoryAnalytics,
  createFileAnalytics,
  createAutoSaveAnalytics,
} from './analytics';

// ============================================================================
// Example 1: Basic In-Memory Analytics
// ============================================================================

async function example1_basicUsage() {
  console.log('\n=== Example 1: Basic In-Memory Analytics ===\n');

  // Create a RANA client
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
    },
  });

  // Create analytics tracker (in-memory)
  const analytics = createMemoryAnalytics();

  // Make some requests
  const response1 = await rana.chat('Hello, how are you?');

  const response2 = await rana.chat('What is the capital of France?');

  const response3 = await rana.chat('Explain quantum computing in simple terms.');

  // Track responses
  await analytics.track(response1);
  await analytics.track(response2);
  await analytics.track(response3);

  // Get summary
  const summary = analytics.getSummary();
  console.log('Analytics Summary:', {
    totalTokens: summary.totalTokens,
    totalCost: `$${summary.totalCost.toFixed(4)}`,
    totalRequests: summary.totalRequests,
    avgTokensPerRequest: Math.round(summary.avgTokensPerRequest),
    avgCostPerRequest: `$${summary.avgCostPerRequest.toFixed(4)}`,
    topProvider: summary.topProvider,
    topModel: summary.topModel,
  });

  // Get usage by provider
  const byProvider = analytics.getUsageByProvider();
  console.log('\nUsage by Provider:');
  byProvider.forEach((p) => {
    console.log(`  ${p.provider}:`, {
      tokens: p.totalTokens,
      cost: `$${p.totalCost.toFixed(4)}`,
      requests: p.requestCount,
      avgTokens: Math.round(p.avgTokensPerRequest),
    });
  });

  // Get usage by model
  const byModel = analytics.getUsageByModel();
  console.log('\nUsage by Model:');
  byModel.forEach((m) => {
    console.log(`  ${m.provider}/${m.model}:`, {
      tokens: m.totalTokens,
      cost: `$${m.totalCost.toFixed(4)}`,
      requests: m.requestCount,
    });
  });
}

// ============================================================================
// Example 2: File-Based Persistence
// ============================================================================

async function example2_filePersistence() {
  console.log('\n=== Example 2: File-Based Persistence ===\n');

  const filePath = './rana-analytics.json';

  // Create analytics with file persistence
  const analytics = createFileAnalytics(filePath, {
    maxRecords: 1000,
    enableAutoCleanup: true,
    cleanupAfterDays: 30,
  });

  // Load previous data if exists
  await analytics.load();
  console.log(`Loaded ${analytics.getRecordCount()} existing records`);

  // Create RANA client
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
  });

  // Make requests
  const response = await rana.chat('Hello!');
  await analytics.track(response);

  // Save to file (auto-save is enabled by default)
  console.log('Analytics saved to', filePath);

  // Get summary
  const summary = analytics.getSummary();
  console.log('\nTotal tracked:', {
    records: analytics.getRecordCount(),
    tokens: summary.totalTokens,
    cost: `$${summary.totalCost.toFixed(4)}`,
  });
}

// ============================================================================
// Example 3: Time-Range Queries
// ============================================================================

async function example3_timeRangeQueries() {
  console.log('\n=== Example 3: Time-Range Queries ===\n');

  const analytics = createMemoryAnalytics();

  // Simulate tracking over multiple days
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
  });

  // Make some requests
  for (let i = 0; i < 5; i++) {
    const response = await rana.chat(`Request ${i + 1}`);
    await analytics.track(response);
  }

  // Get daily usage for last 7 days
  const dailyUsage = analytics.getDailyUsage(7);
  console.log('Daily Usage (last 7 days):');
  dailyUsage.forEach((day) => {
    console.log(`  ${day.date}:`, {
      tokens: day.totalTokens,
      cost: `$${day.totalCost.toFixed(4)}`,
      requests: day.requestCount,
    });
  });

  // Get hourly usage for last 24 hours
  const hourlyUsage = analytics.getHourlyUsage(24);
  console.log('\nHourly Usage (last 24 hours):');
  hourlyUsage.forEach((hour) => {
    console.log(`  ${hour.hour.toISOString()}:`, {
      tokens: hour.totalTokens,
      requests: hour.requestCount,
    });
  });

  // Custom time range
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const rangeUsage = analytics.getUsageByProvider({
    start: oneHourAgo,
    end: now,
  });
  console.log('\nUsage in last hour:', rangeUsage);
}

// ============================================================================
// Example 4: Cost Analysis
// ============================================================================

async function example4_costAnalysis() {
  console.log('\n=== Example 4: Cost Analysis ===\n');

  const analytics = createMemoryAnalytics();
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
    },
  });

  // Make requests
  const response1 = await rana.chat('Hello!');
  await analytics.track(response1);

  const response2 = await rana.chat('How are you?');
  await analytics.track(response2);

  const response3 = await rana.chat('What is AI?');
  await analytics.track(response3);

  // Get cost breakdown
  const breakdown = analytics.getCostBreakdown();
  console.log('Cost Breakdown:');
  breakdown.forEach((item) => {
    console.log(`\n  ${item.provider}/${item.model}:`);
    console.log(`    Input:  $${item.inputCost.toFixed(6)} (${item.inputTokens} tokens)`);
    console.log(`    Output: $${item.outputCost.toFixed(6)} (${item.outputTokens} tokens)`);
    console.log(`    Total:  $${item.totalCost.toFixed(6)}`);
    console.log(`    Cost/Token: $${item.costPerToken.toFixed(8)}`);
    console.log(`    % of Total: ${item.percentage.toFixed(1)}%`);
  });

  // Get top models
  const topModels = analytics.getTopModels(3);
  console.log('\n\nTop 3 Models:');
  topModels.forEach((model, i) => {
    console.log(`  ${i + 1}. ${model.provider}/${model.model}:`);
    console.log(`     Tokens: ${model.totalTokens} (${model.percentage.toFixed(1)}%)`);
    console.log(`     Cost: $${model.totalCost.toFixed(4)}`);
    console.log(`     Requests: ${model.requestCount}`);
  });
}

// ============================================================================
// Example 5: Integration with CostTracker
// ============================================================================

async function example5_integrationWithCostTracker() {
  console.log('\n=== Example 5: Integration with CostTracker ===\n');

  const analytics = createMemoryAnalytics();

  // Create RANA client with cost tracking
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
    cost_tracking: {
      enabled: true,
      log_to_console: true,
      budget: {
        limit: 1.0, // $1 budget
        period: 'daily',
        action: 'warn',
        warningThreshold: 80,
      },
    },
  });

  // Make some requests
  const responses = [];
  for (let i = 0; i < 3; i++) {
    const response = await rana.chat(`Request ${i + 1}`);
    responses.push(response);
    await analytics.track(response);
  }

  // Note: CostTracker is internal to RANA client
  // We can use analytics to get usage statistics
  console.log('\nUsage tracked by analytics:');
  console.log(`  Requests: ${responses.length}`);

  // Get analytics summary
  const summary = analytics.getSummary();
  console.log('\nAnalytics Summary:');
  console.log(`  Total Tokens: ${summary.totalTokens}`);
  console.log(`  Total Cost: $${summary.totalCost.toFixed(4)}`);
  console.log(`  Avg Tokens/Request: ${Math.round(summary.avgTokensPerRequest)}`);
  console.log(`  Cache Hit Rate: ${summary.cacheHitRate.toFixed(1)}%`);
}

// ============================================================================
// Example 6: Export and Import
// ============================================================================

async function example6_exportImport() {
  console.log('\n=== Example 6: Export and Import ===\n');

  // Create and populate analytics
  const analytics1 = createMemoryAnalytics();
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
  });

  const response = await rana.chat('Hello!');
  await analytics1.track(response);

  // Export to JSON
  const exported = analytics1.export();
  console.log('Exported data:', exported.substring(0, 200) + '...');

  // Import into new analytics instance
  const analytics2 = createMemoryAnalytics();
  analytics2.import(exported);

  console.log(`\nImported ${analytics2.getRecordCount()} records`);

  // Verify data
  const summary1 = analytics1.getSummary();
  const summary2 = analytics2.getSummary();

  console.log('\nOriginal vs Imported:');
  console.log('  Tokens:', summary1.totalTokens, 'vs', summary2.totalTokens);
  console.log('  Cost:', summary1.totalCost, 'vs', summary2.totalCost);
}

// ============================================================================
// Example 7: Auto-Save with Intervals
// ============================================================================

async function example7_autoSave() {
  console.log('\n=== Example 7: Auto-Save with Intervals ===\n');

  const filePath = './rana-analytics-autosave.json';

  // Create analytics with auto-save every 30 seconds
  const analytics = createAutoSaveAnalytics(filePath, 30000, {
    maxRecords: 500,
    enableAutoCleanup: true,
  });

  console.log('Analytics will auto-save every 30 seconds to', filePath);

  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
  });

  // Make requests
  for (let i = 0; i < 3; i++) {
    const response = await rana.chat(`Request ${i + 1}`);
    await analytics.track(response);
    console.log(`Tracked request ${i + 1}`);
  }

  console.log(`Total records: ${analytics.getRecordCount()}`);
  console.log('Data will be saved automatically...');

  // Clean up
  analytics.destroy();
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  try {
    // Uncomment the examples you want to run:

    // await example1_basicUsage();
    // await example2_filePersistence();
    // await example3_timeRangeQueries();
    // await example4_costAnalysis();
    // await example5_integrationWithCostTracker();
    // await example6_exportImport();
    // await example7_autoSave();

    console.log('\n✓ All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Only run if executed directly
if (require.main === module) {
  main();
}

export {
  example1_basicUsage,
  example2_filePersistence,
  example3_timeRangeQueries,
  example4_costAnalysis,
  example5_integrationWithCostTracker,
  example6_exportImport,
  example7_autoSave,
};
