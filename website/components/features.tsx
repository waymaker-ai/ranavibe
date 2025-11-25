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
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized performance with streaming responses and intelligent caching.',
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'Built-in security framework with input validation, rate limiting, and encryption.',
  },
  {
    icon: Code2,
    title: 'Type Safe',
    description: '100% TypeScript with full type inference and autocompletion.',
  },
  {
    icon: Database,
    title: 'Database Ready',
    description: 'Supabase integration with migrations, RLS policies, and real-time subscriptions.',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Responsive components with touch targets and WCAG accessibility standards.',
  },
  {
    icon: Search,
    title: 'SEO Optimized',
    description: 'Meta tags, structured data, sitemaps, and Core Web Vitals optimization.',
  },
  {
    icon: Lock,
    title: 'Authentication',
    description: 'Multi-provider auth with session management and role-based access control.',
  },
  {
    icon: Gauge,
    title: 'Cost Efficient',
    description: 'LLM optimization with prompt caching, streaming, and intelligent model selection.',
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
            Everything you need to build AI agents
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            Production-ready features that scale with your application
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
