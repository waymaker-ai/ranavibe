/**
 * Queue Example
 * Demonstrates request queuing with priority, concurrency, and timeout
 */

import { createRana } from '../src';

async function main() {
  console.log('=== RANA Request Queue Example ===\n');

  // Create RANA client with queue enabled
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || 'demo-key',
      openai: process.env.OPENAI_API_KEY || 'demo-key',
    },
    queue: {
      enabled: true,
      maxConcurrency: 2, // Only 2 concurrent requests per provider
      defaultPriority: 'normal',
      timeout: 30000, // 30 second timeout
      debug: true,
      onQueueChange: (stats) => {
        console.log(`[Queue Stats] Pending: ${stats.pending}, Processing: ${stats.processing}, Completed: ${stats.completed}`);
      },
    },
    logging: {
      level: 'info',
      enabled: true,
    },
  });

  console.log('Queue enabled:', rana.queue.enabled());
  console.log('Initial stats:', rana.queue.stats());

  // Access the queue instance directly for advanced usage
  const queue = rana.queue.instance();
  if (queue) {
    // Listen to queue events
    queue.on('added', (event) => {
      console.log(`[Event] Request ${event.requestId} added with priority ${event.priority}`);
    });

    queue.on('processing', (event) => {
      console.log(`[Event] Request ${event.requestId} now processing (waited ${event.waitTime}ms)`);
    });

    queue.on('completed', (event) => {
      console.log(`[Event] Request ${event.requestId} completed (total time: ${event.waitTime}ms)`);
    });

    queue.on('timeout', (event) => {
      console.log(`[Event] Request ${event.requestId} timed out: ${event.error?.message}`);
    });
  }

  // Example 1: Send multiple requests with different priorities
  console.log('\n--- Example 1: Priority Queue ---');

  const requests = [
    { priority: 'low' as const, message: 'Low priority request' },
    { priority: 'normal' as const, message: 'Normal priority request' },
    { priority: 'high' as const, message: 'High priority request' },
    { priority: 'low' as const, message: 'Another low priority' },
    { priority: 'high' as const, message: 'Another high priority' },
  ];

  // Send all requests concurrently
  const promises = requests.map(req =>
    rana.chat({
      messages: [{ role: 'user', content: req.message }],
      priority: req.priority,
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 50,
    }).catch(err => ({ error: err.message }))
  );

  console.log('\nSent 5 requests with different priorities...');
  console.log('High priority requests should be processed first!\n');

  // Wait for all to complete
  const results = await Promise.all(promises);

  console.log('\n--- Results ---');
  results.forEach((result, i) => {
    if ('error' in result) {
      console.log(`${i + 1}. Error: ${result.error}`);
    } else {
      console.log(`${i + 1}. Success - Provider: ${result.provider}, Model: ${result.model}`);
    }
  });

  // Example 2: Queue statistics
  console.log('\n--- Example 2: Queue Statistics ---');
  const finalStats = rana.queue.stats();
  if (finalStats) {
    console.log('Final Statistics:');
    console.log(`  Total Completed: ${finalStats.completed}`);
    console.log(`  Total Failed: ${finalStats.failed}`);
    console.log(`  Total Timed Out: ${finalStats.timedOut}`);
    console.log(`  Average Wait Time: ${finalStats.avgWaitTime.toFixed(2)}ms`);
    console.log(`  Currently Pending: ${finalStats.pending}`);
    console.log(`  Currently Processing: ${finalStats.processing}`);

    if (Object.keys(finalStats.byProvider).length > 0) {
      console.log('\n  By Provider:');
      Object.entries(finalStats.byProvider).forEach(([provider, stats]) => {
        console.log(`    ${provider}:`);
        console.log(`      Pending: ${stats.pending}`);
        console.log(`      Processing: ${stats.processing}`);
        console.log(`      Completed: ${stats.completed}`);
      });
    }
  }

  console.log('\n=== Example Complete ===');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };
