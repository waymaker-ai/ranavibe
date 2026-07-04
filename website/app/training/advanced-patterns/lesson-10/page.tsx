import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rate Limiting Implementation | Advanced Patterns',
  description: 'Implement token bucket algorithms, sliding window rate limits, per-user limits, and Redis-backed rate limiting with CoFounder.',
};

export default function Lesson10Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 10 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Rate Limiting Implementation</h1>
          <p className="lead">
            LLM APIs are expensive and have strict rate limits. Your application needs its own rate limiting layer to protect against abuse, distribute capacity fairly across users, and stay within budget. This lesson covers rate limiting algorithms, per-user limits, and CoFounder&apos;s Redis-backed rate limiter.
          </p>

          <h2>Token Bucket Algorithm</h2>
          <p>
            The token bucket algorithm is the most common approach for API rate limiting. A bucket holds tokens up to a maximum capacity. Each request consumes one or more tokens. Tokens are added at a fixed rate. If the bucket is empty, the request is either rejected or queued. This naturally allows short bursts while enforcing a long-term average rate.
          </p>
          <div className="code-block"><pre><code>{`import { RateLimiter } from '@waymakerai/aicofounder-core';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const limiter = new RateLimiter({
  algorithm: 'token-bucket',
  store: redis,
  rules: [
    {
      name: 'requests-per-minute',
      capacity: 20,          // Max 20 tokens in bucket
      refillRate: 20,        // 20 tokens per minute
      refillInterval: 60000, // Refill every minute
      cost: 1,               // Each request costs 1 token
    },
    {
      name: 'tokens-per-day',
      capacity: 100000,       // 100k LLM tokens per day
      refillRate: 100000,
      refillInterval: 86400000,
      cost: (req) => req.estimatedTokens, // Cost based on token usage
    },
  ],
});

// Check rate limit before processing
const result = await limiter.check('user:123');
if (!result.allowed) {
  return Response.json(
    { error: 'Rate limited', retryAfter: result.retryAfterMs },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterMs / 1000) } }
  );
}`}</code></pre></div>

          <h2>Sliding Window Rate Limits</h2>
          <p>
            The sliding window algorithm provides smoother rate limiting than fixed windows. Instead of resetting the counter at fixed intervals (which allows bursts at window boundaries), it considers a rolling time period. CoFounder implements this using Redis sorted sets for precise tracking with minimal memory overhead.
          </p>
          <p>
            Sliding windows are particularly useful for LLM applications because they prevent the &quot;burst at window reset&quot; problem that can overwhelm your LLM provider. A user cannot stack requests at the end of one window and the beginning of the next.
          </p>

          <h2>Per-User Limits</h2>
          <p>
            Different users need different rate limits. Free tier users might get 10 requests per minute, while paid users get 100. Enterprise users might have custom limits. CoFounder&apos;s rate limiter supports tier-based configuration that integrates with your authentication layer.
          </p>
          <div className="code-block"><pre><code>{`const limiter = new RateLimiter({
  algorithm: 'sliding-window',
  store: redis,
  tiers: {
    free: {
      requestsPerMinute: 10,
      tokensPerDay: 10000,
      maxConcurrent: 1,
    },
    pro: {
      requestsPerMinute: 60,
      tokensPerDay: 500000,
      maxConcurrent: 5,
    },
    enterprise: {
      requestsPerMinute: 300,
      tokensPerDay: 5000000,
      maxConcurrent: 20,
    },
  },
  identifyUser: (req) => ({
    id: req.userId,
    tier: req.userTier,
  }),
});

// In your API route
export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  const limit = await limiter.check(user.id, { tier: user.tier });

  if (!limit.allowed) {
    return Response.json({
      error: 'Rate limit exceeded',
      limit: limit.limit,
      remaining: limit.remaining,
      resetAt: limit.resetAt,
    }, { status: 429 });
  }

  // Process the request...
}`}</code></pre></div>

          <h2>CoFounder&apos;s Rate Limiter</h2>
          <p>
            CoFounder&apos;s built-in rate limiter is designed specifically for LLM applications. It tracks both request count and token usage, supports per-model limits (since different models have different rate limits from the provider), and integrates with the cost tracker to enforce budget-based limits.
          </p>
          <p>
            The rate limiter also provides real-time usage headers in responses (<code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>) so your frontend can show users their remaining quota and prevent requests that will be rejected.
          </p>

          <h2>Monitoring and Alerts</h2>
          <p>
            Track rate limit hits as a key metric. A spike in rate-limited requests might indicate abuse, a sudden increase in legitimate traffic, or a misconfigured client. CoFounder emits rate limit events that you can forward to your monitoring system to set up alerts before your provider&apos;s hard limits are hit.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-9" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Retry and Fallback Strategies
          </Link>
          <Link href="/training/advanced-patterns/lesson-11" className="btn-primary px-6 py-3 group">
            Next: Cost Optimization Techniques
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
