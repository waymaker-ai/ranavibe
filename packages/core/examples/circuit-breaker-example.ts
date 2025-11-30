/**
 * Circuit Breaker Example
 * Demonstrates how to use the circuit breaker pattern with RANA
 */

import { createRana } from '../src';

async function main() {
  // Example 1: Basic circuit breaker configuration
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
    },
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5, // Open circuit after 5 consecutive failures
      failureRateThreshold: 50, // Or if 50% of requests fail
      resetTimeout: 30000, // Try to recover after 30 seconds
      onStateChange: (provider, from, to) => {
        console.log(`[Circuit Breaker] ${provider}: ${from} -> ${to}`);
      },
      onOpen: (provider, failures) => {
        console.log(`[Circuit Breaker] ${provider} circuit OPENED after ${failures} failures`);
      },
      onClose: (provider) => {
        console.log(`[Circuit Breaker] ${provider} circuit CLOSED - recovered`);
      },
    },
  });

  // Example 2: Check circuit breaker status
  console.log('\n=== Circuit Breaker Status ===');
  const anthropicStats = rana.circuitBreaker.getStats('anthropic');
  console.log('Anthropic Stats:', {
    state: anthropicStats.state,
    failureRate: `${anthropicStats.failureRate.toFixed(1)}%`,
    totalRequests: anthropicStats.totalRequests,
  });

  // Example 3: Make requests - circuit breaker will automatically handle failures
  try {
    const response = await rana.chat({
      provider: 'anthropic',
      messages: [{ role: 'user', content: 'Hello!' }],
    });
    console.log('\nResponse:', response.content.substring(0, 100) + '...');
  } catch (error: any) {
    if (error.name === 'CircuitBreakerError') {
      console.error('\nCircuit breaker is open - provider may be experiencing issues');
      console.error('Error:', error.message);
    } else {
      console.error('\nRequest failed:', error.message);
    }
  }

  // Example 4: Get stats for all providers
  console.log('\n=== All Provider Stats ===');
  const allStats = rana.circuitBreaker.getAllStats();
  for (const [provider, stats] of Object.entries(allStats)) {
    console.log(`${provider}:`, {
      state: stats.state,
      failureRate: `${stats.failureRate.toFixed(1)}%`,
      failureCount: stats.failureCount,
    });
  }

  // Example 5: Manual circuit reset (if needed)
  // rana.circuitBreaker.reset('anthropic');
  // console.log('\nManually reset anthropic circuit');

  // Example 6: Using with fallback for extra resilience
  const ranaWithFallback = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      google: process.env.GOOGLE_API_KEY,
    },
    // Circuit breaker will open the circuit if a provider fails
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeout: 60000,
      onOpen: (provider) => {
        console.log(`[CB] ${provider} circuit opened - fallback will be used`);
      },
    },
    // Fallback will try other providers when circuit is open
    fallback: {
      order: ['anthropic', 'openai', 'google'],
      onFallback: (from, to, error) => {
        console.log(`[Fallback] Switching from ${from} to ${to}: ${error.message}`);
      },
    },
  });

  // This will automatically fallback if anthropic's circuit is open
  try {
    const response = await ranaWithFallback.chat('What is AI?');
    console.log('\nWith Fallback:', response.provider, '-', response.content.substring(0, 50));
  } catch (error: any) {
    console.error('\nAll providers failed:', error.message);
  }
}

main().catch(console.error);
