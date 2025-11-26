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
    icon: Gauge,
    title: '70% Cost Savings',
    description: 'Automatic cost reduction through intelligent model routing, caching, prompt optimization, and real-time cost tracking dashboards.',
    highlight: true,
  },
  {
    icon: Lock,
    title: 'Zero Vendor Lock-in',
    description: 'Switch between 9 LLM providers in one line. OpenAI, Anthropic, Google, xAI, Mistral, Cohere, Together, Groq, Ollama.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Built-in OWASP Top 10 protection, GDPR compliance tools, PII detection, and rate limiting for production-grade security.',
  },
  {
    icon: Zap,
    title: 'Multi-Agent Orchestration',
    description: 'Coordinate multiple AI agents seamlessly with built-in state management and intelligent routing between specialized agents.',
  },
  {
    icon: Database,
    title: 'MCP Server Creation',
    description: 'Create Model Context Protocol (MCP) servers to standardize AI integration and enable powerful context-aware applications.',
  },
  {
    icon: Code2,
    title: 'Process Intelligence',
    description: 'Track development velocity, DORA metrics, and legacy code analysis. AI-powered insights for continuous improvement.',
  },
  {
    icon: Search,
    title: 'Production-Ready',
    description: 'Deploy in 5 minutes with built-in monitoring, error handling, rate limiting, and 25+ CLI commands for automation.',
  },
  {
    icon: Smartphone,
    title: 'Training & Services',
    description: 'Optional certification programs, team workshops, and enterprise implementation from the team behind RANA.',
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
            Why RANA is Different
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            The only framework combining enterprise security, multi-agent orchestration, and MCP server capabilities
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
