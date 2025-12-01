'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Book, Zap, Package, Terminal, ArrowRight, GitCompare, BookOpen,
  Brain, Layers, Building2, Shield, Activity, FlaskConical,
  Database, RefreshCw, Puzzle, Link2
} from 'lucide-react';

const sections = [
  {
    icon: Zap,
    title: 'Quick Start',
    description: 'Get up and running with RANA in 5 minutes',
    href: '/docs/quick-start',
  },
  {
    icon: Package,
    title: 'Packages',
    description: 'Learn about @rana/helpers, @rana/prompts, and @rana/rag',
    href: '/docs/packages',
  },
  {
    icon: Terminal,
    title: 'CLI Reference',
    description: 'Complete guide to all 25+ CLI commands',
    href: '/docs/cli',
  },
  {
    icon: Book,
    title: 'API Reference',
    description: 'Full API documentation for all packages',
    href: '/docs/api',
  },
  {
    icon: Brain,
    title: 'AI-Native Features',
    description: 'Hallucination detection, confidence scoring, fact verification',
    href: '/docs/ai-native',
  },
  {
    icon: Layers,
    title: 'Multi-Modal',
    description: 'Image, audio, and video understanding and generation',
    href: '/docs/multi-modal',
  },
  {
    icon: Building2,
    title: 'Enterprise',
    description: 'SSO, RBAC, compliance, self-hosted, and SLA support',
    href: '/docs/enterprise',
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Prompt injection detection, PII redaction, rate limiting',
    href: '/docs/security',
  },
  {
    icon: Activity,
    title: 'Observability',
    description: 'Tracing, metrics, logging, and OpenTelemetry support',
    href: '/docs/observability',
  },
  {
    icon: FlaskConical,
    title: 'Testing',
    description: 'Semantic matching, statistical assertions, cost tracking',
    href: '/docs/testing',
  },
  {
    icon: RefreshCw,
    title: 'Reliability',
    description: 'Retries, circuit breakers, fallbacks, health checks',
    href: '/docs/reliability',
  },
  {
    icon: Database,
    title: 'Memory & Context',
    description: 'Conversation memory, semantic search, compression',
    href: '/docs/memory',
  },
  {
    icon: Puzzle,
    title: 'Plugins',
    description: 'Slack, Discord, voice, email, and document processing',
    href: '/docs/plugins',
  },
  {
    icon: Link2,
    title: 'Integrations',
    description: 'Hugging Face, Supabase, W&B, Sentry, MCP support',
    href: '/docs/integrations',
  },
];

const resources = [
  {
    icon: GitCompare,
    title: 'Comparisons',
    description: 'See how RANA compares to LangChain, Vercel AI SDK, and more',
    href: '/compare',
  },
  {
    icon: BookOpen,
    title: 'Case Studies',
    description: 'Real-world examples of teams using RANA in production',
    href: '/case-studies',
  },
];

export default function DocsPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation</h1>
          <p className="text-lg text-foreground-secondary">
            Everything you need to build production AI applications with RANA
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={section.href}
                className="card hover:border-foreground/20 group flex flex-col h-full"
              >
                <div className="mb-4 p-3 rounded-lg bg-background-secondary w-fit group-hover:bg-gradient-subtle transition-colors">
                  <section.icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold mb-2 group-hover:text-gradient-from transition-colors">
                  {section.title}
                </h2>
                <p className="text-foreground-secondary text-sm mb-4 flex-grow">
                  {section.description}
                </p>
                <div className="flex items-center text-sm font-medium text-gradient-from">
                  Read more
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Install */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">Quick Install</h2>
          <div className="code-block font-mono text-sm">
            <div className="text-foreground-secondary"># Install all RANA packages</div>
            <div className="mt-2">npm install @rana/core @rana/helpers @rana/prompts @rana/rag</div>
            <div className="mt-4 text-foreground-secondary"># Or install the CLI globally</div>
            <div className="mt-2">npm install -g @rana/cli</div>
          </div>
        </motion.div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((resource, index) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="card hover:border-foreground/20 group flex items-start gap-4"
              >
                <div className="p-3 rounded-lg bg-background-secondary group-hover:bg-gradient-subtle transition-colors">
                  <resource.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 group-hover:text-gradient-from transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {resource.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
