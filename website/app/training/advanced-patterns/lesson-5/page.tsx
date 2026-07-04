import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Caching Strategies | Advanced Patterns',
  description: 'Implement Redis cache integration, semantic caching, TTL strategies, cache invalidation, and CoFounder\'s built-in cache layer.',
};

export default function Lesson5Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 5 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Caching Strategies</h1>
          <p className="lead">
            LLM calls are expensive and often slow. A well-designed caching strategy can dramatically reduce costs and latency. This lesson covers Redis integration for caching agent responses, TTL strategies for different content types, cache invalidation patterns, and CoFounder&apos;s built-in caching layer.
          </p>

          <h2>Redis Cache Integration</h2>
          <p>
            Redis is the ideal backend for caching LLM responses: it is fast, supports TTL natively, and can handle the concurrent access patterns typical of web applications. CoFounder provides a Redis cache adapter that plugs into the agent pipeline transparently.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, RedisCacheAdapter } from '@waymakerai/aicofounder-core';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const cache = new RedisCacheAdapter({
  client: redis,
  prefix: 'agent:cache:',
  defaultTTL: 3600, // 1 hour
});

const agent = createAgent({
  model: 'gpt-4o',
  cache: {
    adapter: cache,
    // Cache key is derived from the prompt + model + system prompt
    keyStrategy: 'content-hash',
    // Only cache successful completions
    cacheErrors: false,
  },
});

// First call hits the LLM
const result1 = await agent.run('What is the capital of France?');
console.log(result1.cached); // false

// Second identical call returns from cache
const result2 = await agent.run('What is the capital of France?');
console.log(result2.cached); // true
console.log(result2.latencyMs); // ~2ms vs ~800ms`}</code></pre></div>

          <h2>TTL Strategies</h2>
          <p>
            Different types of content need different TTL values. Factual knowledge queries can be cached for hours or days. Creative outputs should have shorter TTLs or not be cached at all, since users expect unique responses. Time-sensitive queries (weather, stock prices) need very short TTLs or should bypass the cache entirely.
          </p>
          <p>
            CoFounder lets you define TTL strategies per prompt category. The cache adapter accepts a <code>ttlResolver</code> function that examines the prompt and response to determine the appropriate TTL. This lets you implement intelligent caching that adapts to the content.
          </p>

          <h2>Cache Invalidation</h2>
          <p>
            Cache invalidation is famously one of the two hard problems in computer science. For LLM caches, the main triggers for invalidation are: model updates (when the provider ships a new model version), context changes (when the system prompt or tools change), and data freshness (when underlying data the agent references is updated).
          </p>
          <div className="code-block"><pre><code>{`import { RedisCacheAdapter } from '@waymakerai/aicofounder-core';

const cache = new RedisCacheAdapter({ client: redis, prefix: 'agent:cache:' });

// Invalidate by pattern when system prompt changes
await cache.invalidateByPattern('agent:cache:gpt-4o:sys-v2:*');

// Invalidate specific keys when source data changes
await cache.invalidateByTag('datasource:products');

// Version-based invalidation: include version in cache key
const agent = createAgent({
  model: 'gpt-4o',
  cache: {
    adapter: cache,
    keyStrategy: 'content-hash',
    version: 'v3', // Bump this when system prompt changes
  },
});

// Scheduled cache warming for common queries
async function warmCache(commonQueries: string[]) {
  for (const query of commonQueries) {
    await agent.run(query); // Populates cache
  }
}`}</code></pre></div>

          <h2>CoFounder&apos;s Built-in Cache Layer</h2>
          <p>
            CoFounder ships with a two-tier caching system: an in-memory LRU cache for the current process and an optional Redis layer for distributed caching. The in-memory cache handles repeated queries within a single server instance with sub-millisecond latency, while Redis provides cache sharing across instances in a horizontally scaled deployment.
          </p>
          <p>
            The built-in cache is content-addressable: the cache key is a hash of the prompt, system message, model identifier, temperature, and tool definitions. This means identical requests always hit the cache, regardless of which user or session made the request. For personalized responses, you can include user-specific context in the cache key to prevent cross-user cache contamination.
          </p>

          <h2>Measuring Cache Effectiveness</h2>
          <p>
            CoFounder exposes cache metrics through its cost tracking system: hit rate, miss rate, average latency saved, and estimated cost savings. Monitor these metrics to tune your TTL values and identify opportunities for cache warming. A well-tuned cache typically achieves 40-60% hit rates for production applications, translating directly to cost and latency reductions.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-4" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Optimistic Updates
          </Link>
          <Link href="/training/advanced-patterns/lesson-6" className="btn-primary px-6 py-3 group">
            Next: Parallel Agent Execution
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
