'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, RefreshCw, Zap, Timer, GitBranch, Activity } from 'lucide-react';

const features = [
  {
    icon: RefreshCw,
    title: 'Automatic Retry',
    description: 'Smart retry logic with exponential backoff and jitter',
    code: `import { withRetry, RetryConfig } from '@rana/core';

const config: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 30000,         // 30 seconds max
  backoffMultiplier: 2,
  jitter: true,            // Add randomness to prevent thundering herd
  retryOn: [
    'rate_limit',
    'timeout',
    'server_error'
  ]
};

// Wrap any async function
const result = await withRetry(
  () => chat('Hello, world!'),
  config
);

// Or use as middleware
const client = createClient({
  retry: config
});`,
  },
  {
    icon: Shield,
    title: 'Circuit Breaker',
    description: 'Prevent cascade failures with circuit breaker pattern',
    code: `import { CircuitBreaker } from '@rana/core';

const breaker = new CircuitBreaker({
  failureThreshold: 5,     // Open after 5 failures
  successThreshold: 2,     // Close after 2 successes
  timeout: 30000,          // Half-open after 30s
  volumeThreshold: 10      // Minimum requests before tripping
});

// Execute with circuit breaker
try {
  const result = await breaker.execute(
    () => externalAPICall()
  );
} catch (error) {
  if (error.name === 'CircuitOpenError') {
    // Circuit is open, use fallback
    return fallbackResponse();
  }
  throw error;
}

// Check circuit state
console.log(breaker.state);  // 'closed' | 'open' | 'half-open'
console.log(breaker.stats);  // { failures: 3, successes: 10, ... }`,
  },
  {
    icon: GitBranch,
    title: 'Fallback Chains',
    description: 'Chain multiple providers with automatic failover',
    code: `import { FallbackChain } from '@rana/core';

const chain = new FallbackChain({
  providers: [
    {
      name: 'primary',
      provider: openAIClient,
      timeout: 10000
    },
    {
      name: 'secondary',
      provider: anthropicClient,
      timeout: 15000
    },
    {
      name: 'local',
      provider: localLLMClient,
      timeout: 30000
    }
  ],
  onFallback: (from, to, error) => {
    console.log(\`Falling back from \${from} to \${to}: \${error.message}\`);
  }
});

// Automatically tries each provider
const result = await chain.chat({
  messages: [{ role: 'user', content: 'Hello' }]
});

console.log(result.provider);  // Which provider succeeded`,
  },
  {
    icon: Timer,
    title: 'Timeout Management',
    description: 'Configurable timeouts with graceful cancellation',
    code: `import { withTimeout, TimeoutError } from '@rana/core';

// Simple timeout wrapper
try {
  const result = await withTimeout(
    longRunningOperation(),
    { timeout: 5000 }  // 5 seconds
  );
} catch (error) {
  if (error instanceof TimeoutError) {
    console.log('Operation timed out');
  }
}

// With cleanup on timeout
const result = await withTimeout(
  streamingChat(messages),
  {
    timeout: 30000,
    onTimeout: async (controller) => {
      await controller.abort();  // Clean up resources
    }
  }
);`,
  },
  {
    icon: Zap,
    title: 'Rate Limiting',
    description: 'Client-side rate limiting to respect API limits',
    code: `import { RateLimiter } from '@rana/core';

const limiter = new RateLimiter({
  requests: {
    max: 100,
    window: '1m'
  },
  tokens: {
    max: 100000,
    window: '1m'
  }
});

// Check before making request
const allowed = await limiter.checkLimit('requests');
if (!allowed.success) {
  console.log(\`Rate limited. Retry in \${allowed.retryAfter}ms\`);
  await delay(allowed.retryAfter);
}

// Or use automatic queuing
const result = await limiter.execute(
  () => chat(messages),
  { cost: { requests: 1, tokens: estimatedTokens } }
);`,
  },
  {
    icon: Activity,
    title: 'Health Checks',
    description: 'Monitor provider health and availability',
    code: `import { HealthChecker } from '@rana/core';

const health = new HealthChecker({
  providers: ['openai', 'anthropic', 'local'],
  checkInterval: 30000,  // Check every 30s
  timeout: 5000
});

// Start monitoring
health.start();

// Get current status
const status = await health.getStatus();
// {
//   openai: { healthy: true, latency: 150, lastCheck: '...' },
//   anthropic: { healthy: true, latency: 200, lastCheck: '...' },
//   local: { healthy: false, error: 'Connection refused', lastCheck: '...' }
// }

// Get healthy providers only
const available = health.getHealthyProviders();

// Subscribe to status changes
health.on('statusChange', (provider, status) => {
  if (!status.healthy) {
    alertOps(\`\${provider} is unhealthy: \${status.error}\`);
  }
});`,
  },
];

export default function ReliabilityPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Reliability</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Build resilient AI applications with automatic retries, circuit breakers,
            fallback chains, and health monitoring.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/core
          </div>
        </motion.div>

        {/* Features */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Best Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card bg-gradient-subtle"
        >
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <ul className="space-y-3 text-foreground-secondary">
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold">1.</span>
              Always configure timeouts - never let requests hang indefinitely
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold">2.</span>
              Use circuit breakers for external dependencies to prevent cascade failures
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold">3.</span>
              Implement fallback chains with at least 2 providers for critical paths
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold">4.</span>
              Add jitter to retries to prevent thundering herd problems
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold">5.</span>
              Monitor health checks and alert on degraded states before failures
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
