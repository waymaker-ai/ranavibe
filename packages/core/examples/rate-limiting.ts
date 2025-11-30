/**
 * Rate Limiting Example
 *
 * This example demonstrates how to use rate limiting with RANA
 */

import { createRana } from '../src';

async function main() {
  // Create a RANA client with rate limiting enabled
  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY || '',
      anthropic: process.env.ANTHROPIC_API_KEY || '',
    },
    rate_limit: {
      enabled: true,
      // Enable auto-throttling based on provider feedback
      autoThrottle: true,
      // Per-provider rate limits
      providers: {
        openai: {
          requestsPerMinute: 60,  // 60 requests per minute
          requestsPerSecond: 3,    // 3 requests per second
        },
        anthropic: {
          requestsPerMinute: 100,  // 100 requests per minute
          requestsPerSecond: 5,    // 5 requests per second
        },
      },
      // Maximum queue size for requests waiting for rate limit
      maxQueueSize: 100,
    },
    logging: {
      enabled: true,
      level: 'info',
    },
  });

  console.log('Rate Limiting Example\n');

  // Example 1: Making rapid requests - rate limiter will queue them
  console.log('Example 1: Making rapid requests (will be queued)...\n');

  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < 10; i++) {
    promises.push(
      rana.chat({
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        messages: [
          { role: 'user', content: `Count to ${i + 1}` }
        ],
        max_tokens: 50,
      }).then(response => {
        const elapsed = Date.now() - startTime;
        console.log(`[${elapsed}ms] Request ${i + 1} completed: ${response.content.substring(0, 50)}...`);
        return response;
      }).catch(error => {
        console.error(`Request ${i + 1} failed:`, error.message);
      })
    );
  }

  await Promise.all(promises);

  const totalTime = Date.now() - startTime;
  console.log(`\nAll 10 requests completed in ${totalTime}ms`);
  console.log('Notice how requests were automatically queued to respect rate limits\n');

  // Example 2: Checking rate limit status
  console.log('Example 2: Checking rate limit status\n');

  const status = rana.providers.getRateLimitStatus('anthropic');
  if (status) {
    console.log('Anthropic Rate Limit Status:');
    console.log(`  - Requests in last second: ${status.requestsInLastSecond}`);
    console.log(`  - Requests in last minute: ${status.requestsInLastMinute}`);
    console.log(`  - Queued requests: ${status.queuedRequests}`);
    if (status.rateLimitInfo) {
      console.log('  - Rate limit info from provider:');
      console.log(`    - Remaining: ${status.rateLimitInfo.remaining}`);
      console.log(`    - Limit: ${status.rateLimitInfo.limit}`);
      if (status.rateLimitInfo.reset) {
        const resetDate = new Date(status.rateLimitInfo.reset * 1000);
        console.log(`    - Resets at: ${resetDate.toISOString()}`);
      }
    }
  }
  console.log();

  // Example 3: Auto-throttling based on provider headers
  console.log('Example 3: Auto-throttling demonstration');
  console.log('The rate limiter automatically parses X-RateLimit-* headers');
  console.log('from provider responses and adjusts throttling accordingly.\n');

  // Make a request and show the raw rate limit headers
  const response = await rana.chat({
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    messages: [
      { role: 'user', content: 'Say hello!' }
    ],
    max_tokens: 20,
  });

  console.log('Request completed successfully!');
  console.log(`Response: ${response.content}\n`);

  // Get updated status after the request
  const updatedStatus = rana.providers.getRateLimitStatus('anthropic');
  if (updatedStatus?.rateLimitInfo) {
    console.log('Updated rate limit info from provider response:');
    console.log(`  - Remaining requests: ${updatedStatus.rateLimitInfo.remaining}`);
    console.log(`  - Total limit: ${updatedStatus.rateLimitInfo.limit}`);
  }
}

main().catch(console.error);
