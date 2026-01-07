'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  Shield,
  Code2,
  Database,
  Smartphone,
  Search,
  Lock,
  Gauge,
  Scale,
  Layers,
  FileCheck,
  AlertTriangle
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Built-in Compliance',
    description: 'Automatic HIPAA, SEC, GDPR, CCPA enforcement. PII detection, redaction, audit trails, and disclaimers out of the box.',
    highlight: true,
    isNew: true,
  },
  {
    icon: Scale,
    title: 'Dynamic Guidelines',
    description: 'Context-aware behavioral control with priority-based rules. 8+ presets for medical, financial, legal, and brand guidelines.',
    isNew: true,
  },
  {
    icon: Layers,
    title: '400K Token Contexts',
    description: 'Handle massive codebases efficiently. Smart chunking, caching, and optimization reduce 2.5M tokens to 400K with 70% cost savings.',
    isNew: true,
  },
  {
    icon: Code2,
    title: 'Advanced Code Generation',
    description: 'Generate complete CRUD APIs, database schemas, and smart file integration for Next.js, Express, Fastify, Prisma, and Drizzle.',
    isNew: true,
  },
  {
    icon: Database,
    title: 'Prompt Management',
    description: 'Version control for prompts, A/B testing, analytics, and team collaboration. Manage AI behavior like code.',
  },
  {
    icon: Zap,
    title: 'Real Data Only',
    description: 'Framework prevents fake/mock data in production. Connect to real databases and APIs with type-safe queries.',
  },
  {
    icon: Lock,
    title: 'Quality Gates',
    description: 'Automated enforcement of security, compliance, and quality standards. Every change must pass before deployment.',
  },
  {
    icon: Gauge,
    title: 'Works With Your Tools',
    description: 'Use RANA with Cursor, Windsurf, Google Antigravity, Claude Code, or any IDE. Complementary, not competitive.',
  },
  {
    icon: Search,
    title: 'Zero Vendor Lock-in',
    description: 'Switch between 9 LLM providers in one line. OpenAI, Anthropic, Google, xAI, Mistral, Cohere, Together, Groq, Ollama.',
  },
  {
    icon: Smartphone,
    title: '70% Cost Savings',
    description: 'Automatic cost reduction through intelligent model routing, caching, prompt optimization, and context optimization.',
  },
  {
    icon: FileCheck,
    title: 'Enterprise RAG',
    description: 'Advanced retrieval with semantic chunking, hybrid search, cross-encoder re-ranking, and streaming responses.',
  },
  {
    icon: AlertTriangle,
    title: 'Violation Tracking',
    description: 'Real-time monitoring of compliance violations, guideline breaches, and security issues with comprehensive audit logs.',
    isNew: true,
  },
];

export function Features() {
  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div className="container-wide">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Enterprise-Grade AI Framework
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            The only TypeScript framework with built-in compliance, guidelines, and 400K context optimization
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="card hover:border-foreground/10 group relative"
            >
              {feature.isNew && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white">
                    NEW
                  </span>
                </div>
              )}
              <div className="mb-4 p-3 rounded-lg bg-background w-fit group-hover:bg-gradient-subtle transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground-secondary">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
