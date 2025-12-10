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
  Gauge
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Security Guardrails',
    description: 'OWASP Top 10 protection, GDPR compliance, PII detection, and prompt injection defense built into every request.',
    highlight: true,
  },
  {
    icon: Code2,
    title: 'Design System Enforcement',
    description: 'Automatically enforce your design library usage and component patterns. No more inconsistent UIs.',
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
    title: 'Controlled Features',
    description: 'Quality gates prevent unauthorized feature additions. Every change must meet your standards before deployment.',
  },
  {
    icon: Gauge,
    title: 'Works With Your Tools',
    description: 'Use Rana with Cursor, Windsurf, Google Antigravity, Claude Code, or any IDE. Complementary, not competitive.',
  },
  {
    icon: Search,
    title: 'Zero Vendor Lock-in',
    description: 'Switch between 9 LLM providers in one line. OpenAI, Anthropic, Google, xAI, Mistral, Cohere, Together, Groq, Ollama.',
  },
  {
    icon: Smartphone,
    title: '70% Cost Savings',
    description: 'Automatic cost reduction through intelligent model routing, caching, prompt optimization, and budget enforcement.',
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
            The Guardrails You Need
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            A framework that works WITH your tools to enforce security, consistency, and quality at every step
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
              className="card hover:border-foreground/10 group"
            >
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
