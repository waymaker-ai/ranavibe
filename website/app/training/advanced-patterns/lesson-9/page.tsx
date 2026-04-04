import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Retry and Fallback Strategies | Advanced Patterns',
  description: 'Implement exponential backoff, circuit breaker patterns, model fallback chains, and degraded mode operation.',
};

export default function Lesson9Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 9 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Retry and Fallback Strategies</h1>
          <p className="lead">
            LLM APIs are inherently unreliable: rate limits, timeouts, server errors, and capacity issues are facts of life. A production application must handle these failures gracefully. This lesson covers exponential backoff, circuit breakers, model fallback chains, and designing for degraded operation.
          </p>

          <h2>Exponential Backoff</h2>
          <p>
            When an LLM API returns a transient error (429 rate limit, 500 server error, or timeout), retrying immediately usually makes things worse. Exponential backoff increases the wait time between retries, giving the service time to recover. Add jitter to prevent thundering herd problems when multiple clients retry simultaneously.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  model: 'gpt-4o',
  retry: {
    maxRetries: 3,
    strategy: 'exponential',
    initialDelayMs: 1000,  // First retry after 1s
    maxDelayMs: 30000,     // Cap at 30s
    jitter: true,          // Add randomness to prevent thundering herd
    retryableErrors: [429, 500, 502, 503, 504, 'TIMEOUT'],
    onRetry: (attempt, error, delayMs) => {
      console.warn(
        \`Retry \${attempt}: \${error.message}, waiting \${delayMs}ms\`
      );
    },
  },
});

// The agent automatically retries on transient failures
const result = await agent.run('Summarize this document');`}</code></pre></div>

          <h2>Circuit Breaker Pattern</h2>
          <p>
            A circuit breaker prevents your application from repeatedly calling a failing service. After a threshold of consecutive failures, the circuit &quot;opens&quot; and all requests fail immediately for a cool-down period. This protects both your application (from hanging on slow failures) and the service (from being overwhelmed during recovery).
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, CircuitBreaker } from '@waymakerai/aicofounder-core';

const breaker = new CircuitBreaker({
  failureThreshold: 5,      // Open after 5 consecutive failures
  resetTimeoutMs: 60000,    // Try again after 60 seconds
  halfOpenRequests: 2,      // Allow 2 test requests in half-open state
  onStateChange: (from, to) => {
    console.log(\`Circuit breaker: \${from} -> \${to}\`);
    if (to === 'open') {
      alertOps('LLM circuit breaker opened');
    }
  },
});

const agent = createAgent({
  model: 'gpt-4o',
  circuitBreaker: breaker,
});

try {
  const result = await agent.run('Hello');
} catch (error) {
  if (error.code === 'CIRCUIT_OPEN') {
    // Serve cached response or show friendly error
    return getCachedResponse() || 'Service temporarily unavailable';
  }
}`}</code></pre></div>

          <h2>Model Fallback Chains</h2>
          <p>
            When your primary model is unavailable or too slow, falling back to an alternative model keeps your application running. CoFounder supports fallback chains that automatically try the next model when the current one fails. You can configure different fallback chains for different quality requirements.
          </p>
          <p>
            A typical chain might be: GPT-4o (primary, highest quality) to Claude 3.5 Sonnet (first fallback, different provider) to GPT-4o-mini (second fallback, faster and cheaper). The key insight is to fall back across providers, not just models, so a single provider outage does not take down your application.
          </p>

          <h2>Degraded Mode Operation</h2>
          <p>
            When all LLM providers are down, your application should still function, just with reduced capabilities. Degraded mode strategies include: serving cached responses for common queries, using rule-based fallbacks for simple tasks, showing a queue notification and processing requests when the service recovers, or routing to a simpler local model.
          </p>
          <p>
            Design your UI to communicate the degraded state clearly. Users are more forgiving of reduced functionality when they understand what is happening. CoFounder&apos;s health check system monitors provider availability and triggers degraded mode automatically, while exposing status indicators for your UI.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-8" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Human-in-the-Loop Patterns
          </Link>
          <Link href="/training/advanced-patterns/lesson-10" className="btn-primary px-6 py-3 group">
            Next: Rate Limiting Implementation
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
