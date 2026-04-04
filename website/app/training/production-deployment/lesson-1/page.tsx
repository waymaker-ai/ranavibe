import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Preparing for Production | Production Deployment',
  description: 'Production readiness checklist, environment separation, config management, feature flags, and health checks for CoFounder AI agents.',
};

export default function Lesson1Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/production-deployment" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 1 of 10</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Preparing for Production</h1>
          <p className="lead">
            Before deploying your CoFounder AI agents to production, you need a solid checklist
            covering environment separation, configuration management, feature flags, and health
            checks. This lesson walks through every step to ensure a smooth launch.
          </p>

          <h2>Production Readiness Checklist</h2>
          <p>
            A production-ready CoFounder application goes far beyond &quot;it works on my machine.&quot;
            You need to verify that every layer of your stack is configured for reliability, security,
            and observability. Here is a practical checklist to work through before your first deploy:
          </p>
          <ul>
            <li>All environment variables are defined and validated (no fallback to dev defaults).</li>
            <li>Database migrations are up to date and tested against a staging database.</li>
            <li>Supabase Row Level Security (RLS) policies are enabled on every table.</li>
            <li>API keys are stored in a secrets manager, never committed to source control.</li>
            <li>Error tracking (Sentry or equivalent) is wired up and tested.</li>
            <li>Health check endpoints return meaningful status codes.</li>
            <li>Rate limiting is configured on all public-facing endpoints.</li>
          </ul>
          <div className="code-block"><pre><code>{`# .cofounder.yml — production readiness section
project:
  name: my-ai-app
  env: production

checks:
  database_migrations: true
  rls_policies: true
  env_validation: true
  health_endpoint: /api/health
  error_tracking: sentry
  rate_limiting:
    enabled: true
    max_requests_per_minute: 60`}</code></pre></div>

          <h2>Environment Separation</h2>
          <p>
            Running development, staging, and production on the same resources is a recipe for
            data corruption and security incidents. CoFounder projects should maintain strict
            separation across three tiers:
          </p>
          <ul>
            <li><strong>Development</strong> — local Supabase instance, local Redis, mock LLM calls when possible.</li>
            <li><strong>Staging</strong> — mirrors production infrastructure but uses isolated databases and a separate Supabase project.</li>
            <li><strong>Production</strong> — locked-down access, secrets managed via Vercel/AWS Secrets Manager, real LLM provider keys with budget caps.</li>
          </ul>
          <div className="code-block"><pre><code>{`// lib/env.ts — environment-aware config loader
const ENV = process.env.NODE_ENV ?? 'development';

export const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  redisUrl: process.env.REDIS_URL!,
  llmProvider: process.env.LLM_PROVIDER ?? 'openai',
  isProd: ENV === 'production',
  isStaging: ENV === 'staging' || process.env.VERCEL_ENV === 'preview',
};

if (config.isProd && !process.env.SENTRY_DSN) {
  throw new Error('SENTRY_DSN is required in production');
}`}</code></pre></div>

          <h2>Feature Flags</h2>
          <p>
            Feature flags let you ship code to production without exposing unfinished features to
            users. They are especially important for AI agents where prompt behavior or tool
            availability may change between releases. A simple pattern using environment variables
            works well for small teams:
          </p>
          <div className="code-block"><pre><code>{`// lib/flags.ts
export const flags = {
  newAgentPipeline: process.env.FLAG_NEW_AGENT_PIPELINE === 'true',
  costDashboard: process.env.FLAG_COST_DASHBOARD === 'true',
  streamingResponses: process.env.FLAG_STREAMING === 'true',
};

// Usage in a route handler
import { flags } from '@/lib/flags';

export async function POST(req: Request) {
  if (flags.newAgentPipeline) {
    return handleWithNewPipeline(req);
  }
  return handleWithLegacyPipeline(req);
}`}</code></pre></div>

          <h2>Health Checks</h2>
          <p>
            A health check endpoint lets your load balancer, container orchestrator, or monitoring
            tool verify that the application is alive and its dependencies are reachable. A good
            health check tests the database connection, Redis, and any critical external services.
          </p>
          <div className="code-block"><pre><code>{`// app/api/health/route.ts
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {};

  // Database check
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('_health').select('id').limit(1);
    checks.database = error ? 'unhealthy' : 'ok';
  } catch {
    checks.database = 'unreachable';
  }

  // Redis check
  try {
    const redis = new Redis(process.env.REDIS_URL!);
    await redis.ping();
    checks.redis = 'ok';
    await redis.quit();
  } catch {
    checks.redis = 'unreachable';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');
  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks },
    { status: healthy ? 200 : 503 }
  );
}`}</code></pre></div>

          <h2>Configuration Management Best Practices</h2>
          <p>
            Keep configuration close to the code but never in the code. Use <code>.env.local</code> for
            development, platform-level environment variables for staging and production, and
            validate every value at startup. The next lesson dives deep into environment
            configuration with Zod validation and secret rotation.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <span className="text-foreground-secondary text-sm">
            Previous lesson
          </span>
          <Link href="/training/production-deployment/lesson-2" className="btn-primary px-6 py-3 group">
            Next: Environment Configuration
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
