import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Docker Containerization | Production Deployment',
  description: 'Dockerfile best practices, multi-stage builds, docker-compose for local dev, and container security for CoFounder AI agent applications.',
};

export default function Lesson5Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/production-deployment" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 5 of 10</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Docker Containerization</h1>
          <p className="lead">
            Containers give you reproducible builds and consistent environments from development
            through production. This lesson covers Dockerfile best practices for Next.js apps,
            multi-stage builds to minimize image size, docker-compose for local development, and
            container security essentials.
          </p>

          <h2>Dockerfile Best Practices</h2>
          <p>
            A production Dockerfile for a CoFounder Next.js application should use multi-stage
            builds, pin base image versions, leverage layer caching for dependencies, and run
            as a non-root user. Here is a battle-tested pattern:
          </p>
          <div className="code-block"><pre><code>{`# Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && cp -R node_modules /prod_modules
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]`}</code></pre></div>

          <h2>Next.js Standalone Output</h2>
          <p>
            Enable standalone output in your Next.js config to produce a self-contained build
            that includes only the files needed for production. This dramatically reduces your
            Docker image size:
          </p>
          <div className="code-block"><pre><code>{`// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true, // For OpenTelemetry
  },
};

module.exports = nextConfig;`}</code></pre></div>

          <h2>Docker Compose for Local Development</h2>
          <p>
            CoFounder projects typically depend on Supabase (PostgreSQL), Redis, and sometimes
            additional services. Use docker-compose to spin up the full stack locally with a
            single command:
          </p>
          <div className="code-block"><pre><code>{`# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: deps  # Use deps stage for dev with hot reload
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_SUPABASE_URL=http://supabase-kong:8000
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - redis
      - supabase-db
    command: npm run dev

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  supabase-db:
    image: supabase/postgres:15.1.1.41
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cofounder_dev
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  redis_data:
  db_data:`}</code></pre></div>

          <h2>Container Security</h2>
          <p>
            Containers are not inherently secure. Follow these practices to harden your
            production images:
          </p>
          <ul>
            <li><strong>Non-root user:</strong> Always run the application process as a non-root user (as shown in the Dockerfile above).</li>
            <li><strong>Minimal base image:</strong> Use Alpine or distroless images to reduce the attack surface.</li>
            <li><strong>No secrets in images:</strong> Pass secrets via environment variables at runtime, never bake them into the image.</li>
            <li><strong>Scan for vulnerabilities:</strong> Run <code>docker scout cves</code> or <code>trivy image</code> in your CI pipeline.</li>
            <li><strong>Read-only filesystem:</strong> Mount the container filesystem as read-only where possible.</li>
          </ul>
          <div className="code-block"><pre><code>{`# CI pipeline: scan image for vulnerabilities
docker build -t cofounder-app:latest .
docker scout cves cofounder-app:latest --only-severity critical,high

# Run with read-only filesystem and security options
docker run \\
  --read-only \\
  --tmpfs /tmp \\
  --security-opt no-new-privileges \\
  --cap-drop ALL \\
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \\
  -p 3000:3000 \\
  cofounder-app:latest`}</code></pre></div>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/production-deployment/lesson-4" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Deploying to AWS
          </Link>
          <Link href="/training/production-deployment/lesson-6" className="btn-primary px-6 py-3 group">
            Next: Setting Up Monitoring
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
