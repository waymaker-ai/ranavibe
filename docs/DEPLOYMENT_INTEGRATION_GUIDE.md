# RANA Deployment & Integration Guide

**Version:** 2.0
**Last Updated:** 2025-11-09
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Deployment Platforms](#deployment-platforms)
3. [Vercel Integration](#vercel-integration)
4. [Railway Integration](#railway-integration)
5. [Supabase Integration](#supabase-integration)
6. [MCP & Agent Integration](#mcp--agent-integration)
7. [Third-Party Tools](#third-party-tools)
8. [Design Tool Integration](#design-tool-integration)
9. [Custom Deployments](#custom-deployments)
10. [RANA Quality Gates](#aads-quality-gates)

---

## Overview

RANA is designed to work seamlessly with all major deployment platforms and integrates deeply with AI agents, MCPs, and design tools.

### Key Principles

1. **Platform Agnostic**: Works with any deployment platform
2. **One Command Deploy**: `aads deploy` handles everything
3. **Zero Config**: Sensible defaults, optional customization
4. **Extensible**: Plugin system for custom integrations
5. **Agent-First**: Deep MCP and agent integration

---

## Deployment Platforms

### Supported Out-of-the-Box

| Platform | Status | Best For | Setup Time |
|----------|--------|----------|------------|
| **Vercel** | ✅ Full | Next.js, React, static | < 2 min |
| **Railway** | ✅ Full | Full-stack, Docker, databases | < 3 min |
| **Supabase** | ✅ Full | PostgreSQL, auth, storage | < 2 min |
| Netlify | ✅ Full | Static, serverless functions | < 2 min |
| AWS Amplify | ✅ Full | Full-stack AWS apps | < 5 min |
| Render | ✅ Full | Docker, databases, cron | < 3 min |
| Fly.io | ✅ Partial | Global edge deployment | < 3 min |
| Cloudflare | ✅ Partial | Edge workers, pages | < 2 min |
| Custom/VPS | ✅ Full | Full control | < 10 min |

---

## Vercel Integration

### Overview

Vercel is the **recommended platform** for RANA projects, especially Next.js apps.

### Quick Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from RANA project
aads deploy --platform vercel

# Or use Vercel directly
vercel
```

### Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "OPENAI_API_KEY": "@openai_api_key",
    "ANTHROPIC_API_KEY": "@anthropic_api_key"
  },
  "build": {
    "env": {
      "NODE_VERSION": "20"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### Environment Variables

```bash
# Add via Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production

# Or add via dashboard:
# vercel.com/your-project/settings/environment-variables
```

### Deploy Hooks

```typescript
// aads.config.ts
export default {
  deploy: {
    platform: 'vercel',
    hooks: {
      preBuild: async () => {
        console.log('Running pre-build checks...');
        // Run RANA quality gates
        await exec('aads check');
      },
      postBuild: async () => {
        console.log('Build complete!');
        // Generate sitemap, warm caches, etc.
      },
      preDeploy: async () => {
        // Run security audit
        await exec('aads security:audit');
      },
      postDeploy: async () => {
        // Notify team, update analytics, etc.
        console.log('Deployed successfully!');
      },
    },
  },
};
```

### Vercel Edge Functions

```typescript
// app/api/edge-example/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  // Runs on Vercel Edge Network
  // < 50ms response times globally

  return new Response(JSON.stringify({ message: 'Hello from edge!' }), {
    headers: { 'content-type': 'application/json' },
  });
}
```

### Preview Deployments

```bash
# Every git push creates a preview
git push

# Vercel automatically:
# 1. Runs RANA quality gates
# 2. Builds the project
# 3. Deploys to preview URL
# 4. Comments on PR with link
```

---

## Railway Integration

### Overview

Railway is ideal for **full-stack apps with databases** and background jobs.

### Quick Setup

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize Railway project
railway init

# Deploy
aads deploy --platform railway
```

### Railway Configuration (`railway.json`)

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "services": {
    "web": {
      "type": "web",
      "port": 3000,
      "healthcheckPath": "/api/health",
      "healthcheckTimeout": 30
    },
    "worker": {
      "type": "worker",
      "startCommand": "npm run worker"
    }
  },
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "${{Postgres.DATABASE_URL}}",
    "REDIS_URL": "${{Redis.REDIS_URL}}"
  }
}
```

### Railway Services

```yaml
# Add PostgreSQL
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

# Add Redis
services:
  redis:
    image: redis:7-alpine

# Add Background Worker
services:
  worker:
    build: .
    command: npm run worker
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
```

### Railway Volumes

```typescript
// For persistent file storage
{
  "volumes": [
    {
      "name": "uploads",
      "mountPath": "/app/uploads"
    }
  ]
}
```

### Railway Cron Jobs

```typescript
// railway.json
{
  "cron": [
    {
      "schedule": "0 0 * * *", // Daily at midnight
      "command": "npm run cleanup"
    },
    {
      "schedule": "*/15 * * * *", // Every 15 minutes
      "command": "npm run sync"
    }
  ]
}
```

---

## Supabase Integration

### Overview

Supabase provides **PostgreSQL, Auth, Storage, and Real-time** out-of-the-box.

### Quick Setup

```bash
# Install Supabase CLI
npm i -g supabase

# Login
supabase login

# Initialize
supabase init

# Link to project
supabase link --project-ref your-project-ref

# Push database schema
aads db:migrate
```

### Supabase Configuration

```typescript
// lib/supabase.ts (Server)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// lib/supabase-browser.ts (Client)
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Supabase Edge Functions

```typescript
// supabase/functions/hello/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { name } = await req.json();

  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

Deploy:
```bash
supabase functions deploy hello
```

### Supabase Storage

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('user-123/avatar.png', file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl('user-123/avatar.png');
```

### Supabase Real-time

```typescript
// Subscribe to changes
const subscription = supabase
  .channel('posts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts',
  }, (payload) => {
    console.log('New post:', payload.new);
  })
  .subscribe();
```

---

## MCP & Agent Integration

### Overview

RANA has **first-class support for Model Context Protocol (MCP)** and agent systems.

### MCP Server Setup

```typescript
// lib/mcp-server.ts
import { McpServer } from '@anthropic/mcp';

export const mcpServer = new McpServer({
  name: 'aads-mcp-server',
  version: '1.0.0',
  capabilities: {
    tools: true,
    resources: true,
    prompts: true,
  },
});

// Register RANA tools
mcpServer.tool('deploy', {
  description: 'Deploy application to specified platform',
  parameters: {
    type: 'object',
    properties: {
      platform: { type: 'string', enum: ['vercel', 'railway', 'netlify'] },
      environment: { type: 'string', enum: ['production', 'preview'] },
    },
  },
  async execute({ platform, environment }) {
    // Deploy logic
    return { success: true, url: 'https://...' };
  },
});

mcpServer.tool('security-audit', {
  description: 'Run security audit on codebase',
  async execute() {
    const issues = await runSecurityAudit();
    return { issues, score: calculateSecurityScore(issues) };
  },
});

mcpServer.tool('optimize-llm', {
  description: 'Analyze and optimize LLM usage',
  async execute() {
    const analysis = await analyzeLLMUsage();
    return { currentCost: analysis.cost, potentialSavings: analysis.savings };
  },
});
```

### MCP Resources

```typescript
// Expose project resources to agents
mcpServer.resource('project-config', {
  uri: 'aads://config',
  name: 'Project Configuration',
  mimeType: 'application/json',
  async content() {
    return JSON.stringify(await loadProjectConfig());
  },
});

mcpServer.resource('codebase', {
  uri: 'aads://codebase',
  name: 'Full Codebase',
  mimeType: 'text/plain',
  async content() {
    return await generateCodebaseContext();
  },
});
```

### Agent Integration

```typescript
// lib/agents/deployment-agent.ts
import { Agent } from '@google-genai/agent';

export const deploymentAgent = new Agent({
  name: 'RANA Deployment Agent',
  description: 'Handles deployment and infrastructure',
  tools: [
    mcpServer.getTool('deploy'),
    mcpServer.getTool('security-audit'),
  ],
  async execute(task: string) {
    // Agent reasons about deployment needs
    // Uses MCP tools to accomplish task
    // Returns result
  },
});
```

### Multi-Agent Orchestration

```typescript
// lib/agents/orchestrator.ts
import { AgentOrchestrator } from '@google-genai/agent';

export const orchestrator = new AgentOrchestrator({
  agents: [
    {
      name: 'code-agent',
      role: 'Generate and modify code',
      tools: ['read', 'write', 'refactor'],
    },
    {
      name: 'security-agent',
      role: 'Audit and fix security issues',
      tools: ['security-audit', 'apply-fixes'],
    },
    {
      name: 'deploy-agent',
      role: 'Handle deployment',
      tools: ['deploy', 'rollback', 'monitor'],
    },
  ],
});

// Orchestrator coordinates agents
const result = await orchestrator.execute('Deploy app with security audit');
```

---

## Third-Party Tools

### Supported Integrations

#### Analytics
```typescript
// Google Analytics 4
export const analytics = {
  trackEvent: (name: string, params: Record<string, any>) => {
    gtag('event', name, params);
  },
};

// Plausible (privacy-focused)
export const plausible = {
  trackPageview: () => window.plausible?.('pageview'),
  trackEvent: (name: string) => window.plausible?.(name),
};
```

#### Error Tracking
```typescript
// Sentry
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
});
```

#### Monitoring
```typescript
// Datadog
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: process.env.DD_APP_ID!,
  clientToken: process.env.DD_CLIENT_TOKEN!,
  site: 'datadoghq.com',
  service: 'aads-app',
  env: process.env.NODE_ENV,
});
```

#### Payment Processing
```typescript
// Stripe
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Webhook handling
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
  }
}
```

#### Email
```typescript
// Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to,
    subject,
    html,
  });
}
```

---

## Design Tool Integration

### Figma Integration

```typescript
// lib/figma.ts
import axios from 'axios';

export class FigmaClient {
  private apiKey: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getFile(fileKey: string) {
    const response = await axios.get(`${this.baseUrl}/files/${fileKey}`, {
      headers: { 'X-Figma-Token': this.apiKey },
    });
    return response.data;
  }

  async getFileImages(fileKey: string, ids: string[]) {
    const response = await axios.get(`${this.baseUrl}/images/${fileKey}`, {
      headers: { 'X-Figma-Token': this.apiKey },
      params: { ids: ids.join(','), format: 'png', scale: 2 },
    });
    return response.data.images;
  }

  async exportComponents(fileKey: string) {
    const file = await this.getFile(fileKey);

    // Extract components
    const components = this.extractComponents(file.document);

    // Generate React components
    const reactComponents = components.map((c) => this.generateReactComponent(c));

    return reactComponents;
  }

  private generateReactComponent(figmaComponent: any) {
    // Convert Figma component to React/Tailwind
    return {
      name: figmaComponent.name,
      code: this.figmaToReact(figmaComponent),
    };
  }

  private figmaToReact(node: any): string {
    // Convert Figma styles to Tailwind classes
    const styles = this.figmaStylesToTailwind(node);

    return `
export function ${node.name}() {
  return (
    <div className="${styles}">
      {/* Component content */}
    </div>
  );
}
    `.trim();
  }

  private figmaStylesToTailwind(node: any): string {
    const classes: string[] = [];

    // Layout
    if (node.layoutMode === 'HORIZONTAL') classes.push('flex flex-row');
    if (node.layoutMode === 'VERTICAL') classes.push('flex flex-col');

    // Spacing
    if (node.paddingLeft) classes.push(`pl-[${node.paddingLeft}px]`);
    if (node.paddingTop) classes.push(`pt-[${node.paddingTop}px]`);

    // Colors
    if (node.fills?.[0]?.color) {
      const color = node.fills[0].color;
      classes.push(`bg-[rgb(${color.r*255},${color.g*255},${color.b*255})]`);
    }

    return classes.join(' ');
  }
}
```

### Figma CLI Command

```bash
# Export Figma file to React components
aads figma:export --file-key=ABC123 --output=components/figma

# Watch Figma file for changes
aads figma:watch --file-key=ABC123
```

### Penpot Integration (Open Source Alternative)

```typescript
// lib/penpot.ts
export class PenpotClient {
  async exportDesign(projectId: string) {
    // Similar to Figma, but open source
  }
}
```

---

## Custom Deployments

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/myapp
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

### VPS Deployment

```bash
# deploy.sh
#!/bin/bash

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Run migrations
aads db:migrate

# Restart with PM2
pm2 restart aads-app

# Check health
curl http://localhost:3000/api/health
```

---

## RANA Quality Gates

### Pre-Deployment Checks

```yaml
# .rana.yml
deploy:
  pre_checks:
    - security_audit: true # Run security scan
    - test_coverage: 80 # Minimum coverage
    - bundle_size: 500kb # Maximum bundle
    - lighthouse_score: 90 # Minimum performance
    - env_vars: # Required environment variables
        - DATABASE_URL
        - NEXT_PUBLIC_SUPABASE_URL
        - OPENAI_API_KEY
```

### Deployment Command

```bash
# One command deployment with all checks
aads deploy

# Output:
# ✓ Security audit passed (95/100)
# ✓ Test coverage: 85%
# ✓ Bundle size: 450kb
# ✓ Lighthouse score: 93
# ✓ Environment variables configured
#
# Deploying to vercel...
# ✓ Deployed: https://your-app.vercel.app
```

---

## Summary

RANA provides:

1. ✅ **One-command deployment** to any platform
2. ✅ **Deep MCP integration** for agent systems
3. ✅ **Third-party tool integrations** (Stripe, Sentry, etc.)
4. ✅ **Design tool integration** (Figma to React)
5. ✅ **Quality gates** before every deployment
6. ✅ **Platform agnostic** - works everywhere

**Next:** Run `aads deploy --help` to get started!

---

*Ashley Kays | Waymaker | RANA v2.0*
