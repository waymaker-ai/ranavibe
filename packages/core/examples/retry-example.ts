/**
 * Example: Using Retry with Exponential Backoff
 *
 * This example demonstrates:
 * 1. Basic retry configuration
 * 2. Provider-specific retry settings
 * 3. Custom retry conditions
 * 4. Retry metadata inspection
 */

import { createRana } from '../src/index';

async function basicRetryExample() {
  console.log('=== Basic Retry Example ===\n');

  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
    },
    // Enable retry with default settings
    retry: {
      enabled: true,
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      retryOn: ['rate_limit', 'timeout', 'server_error', 'network_error'],
    },
    logging: {
      level: 'info',
      enabled: true,
    },
  });

  try {
    const response = await rana.chat({
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      messages: [
        { role: 'user', content: 'What is exponential backoff?' },
      ],
    });

    console.log('Response:', response.content);

    // Check if retries were attempted
    if (response.retry) {
      console.log('\nRetry Metadata:');
      console.log('  Retry Count:', response.retry.retryCount);
      console.log('  Total Retry Time:', response.retry.totalRetryTime, 'ms');
      console.log('  Retry Delays:', response.retry.retryDelays);
      if (response.retry.lastRetryError) {
        console.log('  Last Error:', response.retry.lastRetryError);
      }
    } else {
      console.log('\nNo retries were needed - request succeeded on first attempt');
    }

    console.log('Total Latency:', response.latency_ms, 'ms');
    console.log('Cost:', `$${response.cost.total_cost.toFixed(4)}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function customRetryConfigExample() {
  console.log('\n=== Custom Retry Configuration ===\n');

  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
    },
    retry: {
      enabled: true,
      maxRetries: 5, // More aggressive retry
      baseDelay: 500, // Shorter initial delay
      maxDelay: 60000, // Longer max delay
      jitter: true, // Add randomness to prevent thundering herd
      backoffMultiplier: 2, // Double delay each time
      retryOn: ['rate_limit', 'timeout'], // Only retry these errors
      onRetry: (error, attempt, delay) => {
        console.log(`Retry attempt ${attempt} after ${delay}ms delay`);
        console.log(`  Error: ${error.message}`);
      },
    },
  });

  try {
    const response = await rana.chat('Explain jitter in retry strategies');
    console.log('Response:', response.content.substring(0, 200) + '...');
  } catch (error) {
    console.error('Error after all retries:', error);
  }
}

async function providerSpecificRetryExample() {
  console.log('\n=== Provider-Specific Retry Settings ===\n');

  // Each provider has optimized default retry settings
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
      ollama: 'http://localhost:11434', // Local - different retry strategy
    },
    retry: {
      enabled: true,
      // Override defaults with custom config
      maxRetries: 4,
    },
  });

  // Anthropic: Uses provider defaults (3 retries, 1s base delay)
  console.log('Testing Anthropic with provider-specific retry settings...');
  try {
    const anthropicResponse = await rana.chat({
      provider: 'anthropic',
      messages: [{ role: 'user', content: 'Hello!' }],
    });
    console.log('Anthropic response received');
  } catch (error) {
    console.error('Anthropic error:', error);
  }

  // Ollama: Uses local-optimized retry settings (2 retries, focus on network errors)
  console.log('\nTesting Ollama with local-optimized retry settings...');
  try {
    const ollamaResponse = await rana.chat({
      provider: 'ollama',
      model: 'llama3.2',
      messages: [{ role: 'user', content: 'Hello!' }],
    });
    console.log('Ollama response received');
  } catch (error) {
    console.error('Ollama error:', error);
  }
}

async function disableRetryExample() {
  console.log('\n=== Disable Retry Example ===\n');

  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
    },
    retry: {
      enabled: false, // Disable retry
    },
  });

  try {
    const response = await rana.chat('Hello without retry');
    console.log('Response:', response.content);
    console.log('Retry metadata:', response.retry); // Should be undefined
  } catch (error) {
    console.error('Error (no retry):', error);
  }
}

async function retryWithFallbackExample() {
  console.log('\n=== Retry + Fallback Example ===\n');

  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
    },
    retry: {
      enabled: true,
      maxRetries: 2,
      retryOn: ['rate_limit', 'timeout'],
    },
    // Fallback to OpenAI if Anthropic fails after retries
    fallback: {
      enabled: true,
      providers: ['anthropic', 'openai'],
    },
  });

  try {
    const response = await rana.chat({
      messages: [{ role: 'user', content: 'Hello with retry + fallback!' }],
    });

    console.log('Provider used:', response.provider);
    console.log('Response:', response.content);

    if (response.retry) {
      console.log('Retries attempted:', response.retry.retryCount);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
async function main() {
  try {
    await basicRetryExample();
    await customRetryConfigExample();
    await providerSpecificRetryExample();
    await disableRetryExample();
    await retryWithFallbackExample();
  } catch (error) {
    console.error('Example error:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

export {
  basicRetryExample,
  customRetryConfigExample,
  providerSpecificRetryExample,
  disableRetryExample,
  retryWithFallbackExample,
};
