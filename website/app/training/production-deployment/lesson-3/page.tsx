import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Deploying to Vercel | Production Deployment',
  description: 'Set up Vercel for your CoFounder AI agent app with vercel.json config, environment variables, edge functions, and preview deployments.',
};

export default function Lesson3Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/production-deployment" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 3 of 10</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Deploying to Vercel</h1>
          <p className="lead">
            Vercel is the recommended deployment platform for CoFounder projects built on Next.js.
            This lesson covers project setup, configuration, environment variables, edge functions
            for low-latency agent responses, serverless limits to watch for, and preview deployments
            for safe iteration.
          </p>

          <h2>Vercel Project Setup</h2>
          <p>
            Connect your repository to Vercel through the dashboard or CLI. CoFounder projects
            use the standard Next.js build pipeline, but AI agent routes often need longer
            timeouts and larger payloads than typical web apps.
          </p>
          <div className="code-block"><pre><code>{`# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod`}</code></pre></div>

          <h2>Configuring vercel.json</h2>
          <p>
            The <code>vercel.json</code> file controls function timeouts, regions, headers, and
            rewrites. AI agent endpoints typically need extended timeouts because LLM calls can
            take several seconds, especially with multi-step tool use:
          </p>
          <div className="code-block"><pre><code>{`{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/agents/*/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    },
    "app/api/chat/route.ts": {
      "maxDuration": 30,
      "memory": 512
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/cron/cost-report",
      "schedule": "0 9 * * 1"
    }
  ]
}`}</code></pre></div>

          <h2>Environment Variables on Vercel</h2>
          <p>
            Vercel supports environment variables scoped to Production, Preview, and Development.
            Always set sensitive keys at the platform level, never in code. Use the CLI for
            bulk operations:
          </p>
          <div className="code-block"><pre><code>{`# Set a secret for production only
vercel env add OPENAI_API_KEY production

# Set a variable for all environments
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development

# Pull all env vars to .env.local for local dev
vercel env pull .env.local

# List all environment variables
vercel env ls`}</code></pre></div>

          <h2>Edge Functions for Low-Latency Responses</h2>
          <p>
            Edge functions run closer to your users and start faster than serverless functions.
            Use them for lightweight agent routing, authentication checks, and streaming responses.
            Note that edge functions have a more limited runtime -- no Node.js filesystem access
            and a 25 MB size limit.
          </p>
          <div className="code-block"><pre><code>{`// app/api/agent-router/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { agentId, message } = await req.json();

  // Route to the appropriate agent handler
  // Edge function handles routing; the actual LLM call
  // happens in a serverless function with longer timeout
  const response = await fetch(
    \`\${process.env.NEXT_PUBLIC_APP_URL}/api/agents/\${agentId}/execute\`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') ?? '',
      },
      body: JSON.stringify({ message }),
    }
  );

  // Stream the response back to the client
  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}`}</code></pre></div>

          <h2>Serverless Limits and Preview Deployments</h2>
          <p>
            Be aware of Vercel&apos;s serverless limits: 10-second default timeout (extendable to
            300s on Pro/Enterprise), 4.5 MB request body, and 250 MB function bundle size.
            For AI agents that process large documents, consider streaming uploads to S3 first.
          </p>
          <p>
            Preview deployments are created automatically for every pull request. Use them to
            test agent behavior changes safely before merging. CoFounder recommends setting a
            lower LLM budget for preview environments to avoid runaway costs during testing.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/production-deployment/lesson-2" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Environment Configuration
          </Link>
          <Link href="/training/production-deployment/lesson-4" className="btn-primary px-6 py-3 group">
            Next: Deploying to AWS
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
