import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Semantic Caching | Advanced Patterns',
  description: 'Implement embedding-based cache keys, similarity thresholds, cache hit strategies, and Supabase vector caching.',
};

export default function Lesson14Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 14 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Semantic Caching</h1>
          <p className="lead">
            Traditional caching requires exact key matches, but users rarely phrase the same question the same way twice. Semantic caching uses embeddings to find cache entries that are semantically similar to the current query, dramatically increasing cache hit rates. This lesson covers the implementation, tuning, and trade-offs of semantic caching for LLM applications.
          </p>

          <h2>Embedding-Based Cache Keys</h2>
          <p>
            Instead of hashing the prompt text as a cache key, semantic caching generates an embedding of the prompt and searches for similar embeddings in the cache. If a cached entry is similar enough (above a similarity threshold), the cached response is returned instead of making a new LLM call.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, SemanticCache } from '@waymakerai/aicofounder-core';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const semanticCache = new SemanticCache({
  store: supabase,
  table: 'semantic_cache',
  embeddingModel: 'text-embedding-3-small',
  similarityThreshold: 0.95,  // High threshold for accuracy
  ttl: 3600,                  // 1 hour TTL
});

const agent = createAgent({
  model: 'gpt-4o',
  cache: semanticCache,
});

// These will likely hit the same cache entry:
await agent.run('What is the capital of France?');
await agent.run('What city is the capital of France?');
await agent.run("France's capital city is what?");

// Check cache stats
const stats = await semanticCache.getStats();
console.log(\`Hit rate: \${stats.hitRate}%\`);
console.log(\`Avg similarity on hit: \${stats.avgSimilarity}\`);
console.log(\`Cost saved: $\${stats.costSaved}\`);`}</code></pre></div>

          <h2>Similarity Thresholds</h2>
          <p>
            The similarity threshold is the most critical tuning parameter. Too high (0.99+) and the cache rarely hits, defeating the purpose. Too low (below 0.85) and semantically different questions return incorrect cached responses. The right threshold depends on your application.
          </p>
          <p>
            For factual Q&amp;A, a threshold of 0.93-0.97 works well because slight rephrasings should return the same answer. For creative tasks, you want a higher threshold (0.98+) or should skip semantic caching entirely, since similar prompts should produce different outputs. CoFounder lets you set per-category thresholds so you can optimize for each use case.
          </p>

          <h2>Cache Hit Strategies</h2>
          <p>
            When multiple cache entries exceed the similarity threshold, you need a strategy for which one to return. Options include: highest similarity (most similar prompt), most recent (freshest data), most popular (most frequently accessed, suggesting it is a well-validated response), or ensemble (combine multiple cached responses).
          </p>
          <div className="code-block"><pre><code>{`const semanticCache = new SemanticCache({
  store: supabase,
  table: 'semantic_cache',
  embeddingModel: 'text-embedding-3-small',
  similarityThreshold: 0.93,
  hitStrategy: 'highest-similarity',  // or 'most-recent', 'most-popular'

  // Validate cache hits before returning
  validateHit: async (cachedEntry, query) => {
    // Reject cache hits that are too old for time-sensitive queries
    if (isTimeSensitive(query) && cachedEntry.age > 300000) {
      return false;  // Force a fresh LLM call
    }

    // Reject if the cached response was poorly rated
    if (cachedEntry.metadata.avgRating < 3) {
      return false;
    }

    return true;
  },
});`}</code></pre></div>

          <h2>Supabase Vector Cache Implementation</h2>
          <p>
            Supabase is ideal for semantic caching because it combines vector storage (pgvector) with relational data (metadata, TTLs, access counts) in a single database. The cache table stores the prompt embedding, the response, metadata, and timestamps. A similarity search query finds matching cache entries, and PostgreSQL handles TTL expiration through a scheduled cleanup function.
          </p>
          <p>
            For high-traffic applications, add a Redis layer in front of the Supabase semantic cache. Redis handles exact-match lookups with sub-millisecond latency, and only on a Redis miss do you fall through to the more expensive vector similarity search in Supabase. This two-tier approach gives you the best of both worlds.
          </p>

          <h2>Monitoring and Iteration</h2>
          <p>
            Track semantic cache performance carefully. Monitor the distribution of similarity scores on cache hits to identify if your threshold needs adjustment. Log cache misses to find opportunities for cache warming. And periodically audit cache hits to ensure the returned responses are actually correct for the queries they match. A semantic cache that returns wrong answers is worse than no cache at all.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-13" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: RAG Implementation Patterns
          </Link>
          <Link href="/training/advanced-patterns/lesson-15" className="btn-primary px-6 py-3 group">
            Next: Advanced Error Recovery
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
