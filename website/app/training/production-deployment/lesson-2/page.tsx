import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Environment Configuration | Production Deployment',
  description: 'Master .env management, Zod validation, secret rotation, per-environment config, and CoFounder .cofounder.yml configuration.',
};

export default function Lesson2Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/production-deployment" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 2 of 10</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Environment Configuration</h1>
          <p className="lead">
            Misconfigured environment variables are one of the most common causes of production
            incidents. This lesson covers .env management, runtime validation with Zod, secret
            rotation strategies, and the CoFounder project configuration file.
          </p>

          <h2>Structuring .env Files</h2>
          <p>
            Next.js loads <code>.env.local</code> automatically, but you should maintain a
            clear hierarchy of files. Never commit secrets to version control -- use
            <code>.env.example</code> as a template that documents every required variable
            without exposing real values.
          </p>
          <div className="code-block"><pre><code>{`# .env.example — committed to git, no real secrets
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SENTRY_DSN=https://...@sentry.io/...
COFOUNDER_BUDGET_MONTHLY_USD=500

# .env.local — local overrides, gitignored
# .env.staging — loaded in staging CI/CD
# .env.production — loaded in production CI/CD (or use platform secrets)`}</code></pre></div>

          <h2>Validating Environment Variables with Zod</h2>
          <p>
            Catching a missing or malformed variable at build time is far better than discovering
            it at 2 AM when your agent starts throwing cryptic errors. Use Zod to validate your
            entire environment at application startup:
          </p>
          <div className="code-block"><pre><code>{`// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  REDIS_URL: z.string().url(),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  SENTRY_DSN: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  COFOUNDER_BUDGET_MONTHLY_USD: z.coerce.number().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Environment validation failed. Check server logs.');
  }
  return result.data;
}

export const env = validateEnv();`}</code></pre></div>

          <h2>Secret Rotation</h2>
          <p>
            API keys and database credentials should be rotated regularly. For LLM provider keys,
            CoFounder recommends a dual-key approach: generate a new key, update the environment
            variable, verify the new key works, then revoke the old key. Automate this with a
            rotation script:
          </p>
          <div className="code-block"><pre><code>{`// scripts/rotate-secrets.ts
import { execSync } from 'child_process';

const PLATFORM = process.env.DEPLOY_PLATFORM; // 'vercel' | 'aws'

async function rotateKey(name: string, newValue: string) {
  if (PLATFORM === 'vercel') {
    // Remove old, set new
    execSync(\`vercel env rm \${name} production -y\`);
    execSync(\`echo "\${newValue}" | vercel env add \${name} production\`);
    console.log(\`Rotated \${name} on Vercel\`);
  } else if (PLATFORM === 'aws') {
    execSync(
      \`aws ssm put-parameter --name "/myapp/prod/\${name}" --value "\${newValue}" --overwrite\`
    );
    console.log(\`Rotated \${name} in AWS SSM\`);
  }
}

// Usage: npx tsx scripts/rotate-secrets.ts
rotateKey('OPENAI_API_KEY', process.argv[2]);`}</code></pre></div>

          <h2>Per-Environment Configuration</h2>
          <p>
            Different environments need different settings beyond just credentials. Development
            might use verbose logging and mock LLM responses, staging mirrors production settings
            with lower rate limits, and production is fully locked down:
          </p>
          <div className="code-block"><pre><code>{`// lib/config.ts
import { env } from './env';

const configs = {
  development: {
    logLevel: 'debug' as const,
    llmTimeout: 30_000,
    maxAgentSteps: 50,
    enableMockLLM: true,
    rateLimitRPM: 1000,
  },
  staging: {
    logLevel: 'info' as const,
    llmTimeout: 15_000,
    maxAgentSteps: 20,
    enableMockLLM: false,
    rateLimitRPM: 120,
  },
  production: {
    logLevel: 'warn' as const,
    llmTimeout: 10_000,
    maxAgentSteps: 15,
    enableMockLLM: false,
    rateLimitRPM: 60,
  },
};

export const appConfig = configs[env.NODE_ENV];`}</code></pre></div>

          <h2>CoFounder Project Configuration</h2>
          <p>
            The <code>.cofounder.yml</code> file lives at your project root and configures
            CoFounder CLI behavior, CI scanner rules, and deployment targets. It is the single
            source of truth for project-level settings:
          </p>
          <div className="code-block"><pre><code>{`# .cofounder.yml
project:
  name: my-ai-saas
  framework: nextjs

agents:
  default_provider: anthropic
  max_steps: 15
  timeout_ms: 10000

security:
  scanner:
    rules:
      - no-hardcoded-keys
      - no-exposed-assets
      - require-rls
  guards:
    input_sanitization: true
    output_filtering: true

cost:
  monthly_budget_usd: 500
  per_user_limit_usd: 10
  alert_threshold_percent: 80

deploy:
  platform: vercel
  region: us-east-1
  preview_branches: true`}</code></pre></div>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/production-deployment/lesson-1" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Preparing for Production
          </Link>
          <Link href="/training/production-deployment/lesson-3" className="btn-primary px-6 py-3 group">
            Next: Deploying to Vercel
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
