/**
 * Example: Provider Fallback System
 *
 * This example demonstrates how to use the automatic fallback system
 * to ensure your application stays resilient when providers fail.
 */

import { createRana } from '../src';

// ============================================================================
// Basic Fallback Example
// ============================================================================

async function basicFallbackExample() {
  console.log('\n=== Basic Fallback Example ===\n');

  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY!,
      anthropic: process.env.ANTHROPIC_API_KEY!,
      google: process.env.GOOGLE_API_KEY!,
    },
    fallback: {
      order: ['openai', 'anthropic', 'google'],
      onFallback: (from, to, error) => {
        console.log(`⚠️  Falling back from ${from} to ${to}`);
        console.log(`   Reason: ${error.message}`);
      },
    },
  });

  const response = await rana.chat('What is the capital of France?');
  console.log(`✅ Response: ${response.content}`);
  console.log(`   Provider used: ${response.provider}`);
}

// ============================================================================
// Fallback with Retry Configuration
// ============================================================================

async function fallbackWithRetryExample() {
  console.log('\n=== Fallback with Retry Example ===\n');

  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY!,
      anthropic: process.env.ANTHROPIC_API_KEY!,
      google: process.env.GOOGLE_API_KEY!,
    },
    fallback: {
      order: ['openai', 'anthropic', 'google'],
      maxRetries: 2, // Retry each provider up to 2 times
      retryDelay: 1000, // Wait 1 second between retries
      onFallback: (from, to, error) => {
        console.log(`⚠️  ${from} failed, trying ${to}...`);
      },
    },
  });

  const response = await rana.chat('Explain quantum computing in one sentence.');
  console.log(`✅ Response: ${response.content}`);
}

// ============================================================================
// Cost-Optimized Fallback
// ============================================================================

async function costOptimizedFallbackExample() {
  console.log('\n=== Cost-Optimized Fallback Example ===\n');

  // Try free/cheap providers first, fall back to premium ones if needed
  const rana = createRana({
    providers: {
      google: process.env.GOOGLE_API_KEY!, // Free during preview
      anthropic: process.env.ANTHROPIC_API_KEY!,
      openai: process.env.OPENAI_API_KEY!,
    },
    fallback: {
      order: ['google', 'anthropic', 'openai'], // Cheapest to most expensive
      onFallback: (from, to, error) => {
        console.log(`💰 ${from} unavailable, using ${to} (higher cost)`);
      },
    },
  });

  const response = await rana.chat('Write a haiku about AI.');
  console.log(`✅ Haiku:\n${response.content}`);
  console.log(`   Cost: $${response.cost.total_cost.toFixed(6)}`);
  console.log(`   Provider: ${response.provider}`);
}

// ============================================================================
// Tracking Fallback Metadata
// ============================================================================

async function fallbackMetadataExample() {
  console.log('\n=== Fallback Metadata Example ===\n');

  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY!,
      anthropic: process.env.ANTHROPIC_API_KEY!,
      google: process.env.GOOGLE_API_KEY!,
    },
    fallback: {
      order: ['openai', 'anthropic', 'google'],
      trackAttempts: true, // Enable detailed tracking
    },
  });

  const response = await rana.chat('Hello, world!');

  // Access fallback metadata
  if ('fallbackMetadata' in response) {
    const metadata = response.fallbackMetadata;
    console.log('Fallback Metadata:');
    console.log(`  - Successful Provider: ${metadata.successfulProvider}`);
    console.log(`  - Total Attempts: ${metadata.totalAttempts}`);
    console.log(`  - Attempted Providers: ${metadata.attemptedProviders.join(', ')}`);
    console.log(`  - Used Fallback: ${metadata.usedFallback ? 'Yes' : 'No'}`);

    if (metadata.failures.length > 0) {
      console.log('  - Failures:');
      metadata.failures.forEach((failure) => {
        console.log(`    - ${failure.provider}: ${failure.error}`);
      });
    }
  }
}

// ============================================================================
// Using Fallback Manager Directly
// ============================================================================

async function directFallbackManagerExample() {
  console.log('\n=== Direct FallbackManager Example ===\n');

  const { createFallbackManager, ProviderManager } = await import('../src');

  // Create provider manager
  const providerManager = new ProviderManager({
    openai: process.env.OPENAI_API_KEY!,
    anthropic: process.env.ANTHROPIC_API_KEY!,
  });

  // Create fallback manager
  const fallbackManager = createFallbackManager(providerManager, {
    order: ['openai', 'anthropic'],
    maxRetries: 1,
    onFallback: (from, to, error) => {
      console.log(`Switching from ${from} to ${to}`);
    },
  });

  // Make request with fallback
  const response = await fallbackManager.chat({
    messages: [{ role: 'user', content: 'What is 2+2?' }],
    max_tokens: 50,
  });

  console.log(`Result: ${response.content}`);
  console.log(`Provider: ${response.provider}`);
}

// ============================================================================
// Error Handling Example
// ============================================================================

async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===\n');

  const rana = createRana({
    providers: {
      // Intentionally using invalid keys to demonstrate error handling
      openai: 'invalid-key-1',
      anthropic: 'invalid-key-2',
      google: 'invalid-key-3',
    },
    fallback: {
      order: ['openai', 'anthropic', 'google'],
      maxRetries: 1,
      onFallback: (from, to, error) => {
        console.log(`❌ ${from} failed: ${error.message}`);
        console.log(`   Trying ${to}...`);
      },
    },
  });

  try {
    await rana.chat('This will fail because all keys are invalid');
  } catch (error) {
    console.log('\n⛔ All providers failed:');
    console.log(error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  try {
    // Uncomment the examples you want to run:

    // await basicFallbackExample();
    // await fallbackWithRetryExample();
    // await costOptimizedFallbackExample();
    // await fallbackMetadataExample();
    // await directFallbackManagerExample();
    // await errorHandlingExample();

    console.log('\n✅ Examples completed!\n');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  basicFallbackExample,
  fallbackWithRetryExample,
  costOptimizedFallbackExample,
  fallbackMetadataExample,
  directFallbackManagerExample,
  errorHandlingExample,
};
