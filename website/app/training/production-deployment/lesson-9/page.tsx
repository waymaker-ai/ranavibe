import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Scaling Strategies | Production Deployment',
  description: 'Horizontal scaling, connection pooling with PgBouncer, Redis cluster, CDN for static assets, and queue-based agent execution.',
};

export default function Lesson9Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/production-deployment" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 9 of 10</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Scaling Strategies</h1>
          <p className="lead">
            AI agent applications face unique scaling challenges: LLM calls are slow and expensive,
            database connections are limited, and agent executions can hold resources for seconds
            or minutes. This lesson covers the patterns that let your CoFounder application handle
            thousands of concurrent users without falling over.
          </p>

          <h2>Horizontal Scaling</h2>
          <p>
            Scale your application horizontally by running multiple instances behind a load balancer.
            On Vercel, this happens automatically. On AWS or Kubernetes, configure auto-scaling
            based on CPU, memory, or custom metrics like active agent count:
          </p>
          <div className="code-block"><pre><code>{`# Kubernetes HorizontalPodAutoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cofounder-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cofounder-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: cofounder_active_agents
        target:
          type: AverageValue
          averageValue: "5"  # Scale up when avg active agents per pod > 5`}</code></pre></div>

          <h2>Connection Pooling with PgBouncer</h2>
          <p>
            Serverless functions and auto-scaled containers open and close database connections
            rapidly, which can exhaust PostgreSQL&apos;s connection limit. PgBouncer sits between
            your application and database, pooling connections efficiently. Supabase includes
            PgBouncer on port 6543:
          </p>
          <div className="code-block"><pre><code>{`// lib/db.ts — connection pooling configuration
import { Pool } from 'pg';

// Direct connection (for migrations, admin tasks)
const directPool = new Pool({
  connectionString: process.env.DATABASE_URL, // port 5432
  max: 5,
});

// Pooled connection via PgBouncer (for application queries)
const pooledConnection = new Pool({
  connectionString: process.env.DATABASE_URL_POOLED, // port 6543
  max: 20, // Can be higher since PgBouncer manages the actual DB connections
});

// With Supabase, use the pooled URL for all application queries
// DATABASE_URL_POOLED=postgresql://postgres:password@db.project.supabase.co:6543/postgres

// For Prisma, set the connection in schema.prisma:
// datasource db {
//   provider  = "postgresql"
//   url       = env("DATABASE_URL_POOLED")
//   directUrl = env("DATABASE_URL")
// }`}</code></pre></div>

          <h2>Redis Cluster and Caching</h2>
          <p>
            Redis serves multiple roles in a CoFounder application: session storage, rate limiting,
            LLM response caching, and pub/sub for real-time updates. As traffic grows, move from
            a single Redis instance to a cluster:
          </p>
          <div className="code-block"><pre><code>{`// lib/redis.ts
import Redis from 'ioredis';

// Single instance (development / small scale)
const redis = new Redis(process.env.REDIS_URL!);

// Redis Cluster (production at scale)
// const redis = new Redis.Cluster([
//   { host: 'redis-1.example.com', port: 6379 },
//   { host: 'redis-2.example.com', port: 6379 },
//   { host: 'redis-3.example.com', port: 6379 },
// ]);

// Cache LLM responses for identical inputs
export async function cachedLLMCall(
  cacheKey: string,
  ttlSeconds: number,
  callFn: () => Promise<any>
) {
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await callFn();
  await redis.setex(cacheKey, ttlSeconds, JSON.stringify(result));
  return result;
}

// Rate limiting with sliding window
export async function checkRateLimit(
  userId: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const key = \`ratelimit:\${userId}\`;
  const now = Date.now();

  const pipe = redis.pipeline();
  pipe.zremrangebyscore(key, 0, now - windowSeconds * 1000);
  pipe.zadd(key, now.toString(), \`\${now}\`);
  pipe.zcard(key);
  pipe.expire(key, windowSeconds);

  const results = await pipe.exec();
  const count = results?.[2]?.[1] as number;
  return count <= maxRequests;
}`}</code></pre></div>

          <h2>Queue-Based Agent Execution</h2>
          <p>
            For agents that take more than a few seconds to complete, move execution to a
            background queue. This frees up your API servers and lets you control concurrency.
            Use BullMQ with Redis or AWS SQS:
          </p>
          <div className="code-block"><pre><code>{`// lib/agent-queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

// Create the queue
export const agentQueue = new Queue('agent-execution', { connection });

// API route: enqueue agent work
export async function POST(req: Request) {
  const { agentId, input, userId } = await req.json();

  const job = await agentQueue.add('execute', {
    agentId,
    input,
    userId,
    traceContext: extractTraceContext(), // Propagate OTel context
  }, {
    priority: getUserPriority(userId),
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  });

  return Response.json({ jobId: job.id, status: 'queued' });
}

// Worker process (runs separately or in a dedicated container)
const worker = new Worker('agent-execution', async (job) => {
  const { agentId, input, userId, traceContext } = job.data;

  const result = await executeAgentWithContext(agentId, input, traceContext);

  // Store result for polling or push via WebSocket
  await redis.setex(\`result:\${job.id}\`, 3600, JSON.stringify(result));

  return result;
}, {
  connection,
  concurrency: 5, // Process 5 agents concurrently per worker
  limiter: { max: 10, duration: 60_000 }, // Max 10 jobs per minute
});`}</code></pre></div>

          <h2>CDN and Static Asset Optimization</h2>
          <p>
            Offload static assets (JS bundles, images, fonts) to a CDN so your servers focus on
            dynamic agent requests. On Vercel this is automatic. On AWS, use CloudFront in front
            of S3. Set long cache headers for hashed assets and short TTLs for HTML:
          </p>
          <ul>
            <li><code>_next/static/**</code> — immutable, cache for 1 year.</li>
            <li><code>public/**</code> — cache for 1 day with stale-while-revalidate.</li>
            <li>HTML pages — cache for 60 seconds or use ISR (Incremental Static Regeneration).</li>
          </ul>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/production-deployment/lesson-8" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Cost Monitoring &amp; Alerts
          </Link>
          <Link href="/training/production-deployment/lesson-10" className="btn-primary px-6 py-3 group">
            Next: Security Hardening
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
