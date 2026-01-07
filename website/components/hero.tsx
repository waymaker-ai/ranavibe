'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Gradient background effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-gradient-from to-gradient-to opacity-20 blur-3xl" />
      </div>

      <div className="container-wide">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 mb-8 rounded-full border border-border bg-background-secondary"
          >
            <Sparkles className="h-4 w-4 text-gradient-from" />
            <span className="text-sm font-medium">New: RANA 2.1 with Compliance & Guidelines</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-6"
          >
            The Only Framework{' '}
            <span className="gradient-text">With Built-in Compliance</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-foreground-secondary text-balance mb-10 max-w-2xl mx-auto"
          >
            Production-ready TypeScript framework with <span className="text-foreground font-semibold">HIPAA, SEC, GDPR compliance, dynamic guidelines, 400K context optimization</span>, and 70% cost savings. Works with Cursor, Windsurf, Antigravity, and all your favorite tools.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/docs/quick-start"
              className="btn-primary px-6 py-3 text-base group"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/training"
              className="btn-secondary px-6 py-3 text-base"
            >
              View Training
            </Link>
          </motion.div>

          {/* Stats - Updated with cost savings prominence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            <div className="text-center p-4 rounded-lg bg-background-secondary border border-border">
              <div className="text-3xl md:text-4xl font-bold gradient-text">70%</div>
              <div className="text-sm text-foreground-secondary mt-1">Cost Savings</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background-secondary border border-border">
              <div className="text-3xl md:text-4xl font-bold gradient-text">400K</div>
              <div className="text-sm text-foreground-secondary mt-1">Token Context</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background-secondary border border-border">
              <div className="text-3xl md:text-4xl font-bold gradient-text">17+</div>
              <div className="text-sm text-foreground-secondary mt-1">Packages</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background-secondary border border-border">
              <div className="text-3xl md:text-4xl font-bold gradient-text">5min</div>
              <div className="text-sm text-foreground-secondary mt-1">To Production</div>
            </div>
          </motion.div>

          {/* Code snippet preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 text-left"
          >
            <div className="code-block font-mono text-sm">
              <div className="text-foreground-secondary">$ npm install @rana/compliance @rana/guidelines @rana/context-optimizer</div>
              <div className="mt-2 text-gradient-from">✓ Installed RANA 2.1 packages</div>
              <div className="text-foreground-secondary mt-2">{`import { ComplianceEnforcer, PresetRules } from '@rana/compliance';`}</div>
              <div className="text-foreground-secondary">{`import { GuidelineManager, Conditions } from '@rana/guidelines';`}</div>
              <div className="text-foreground-secondary">{`import { ContextOptimizer } from '@rana/context-optimizer';`}</div>
              <div className="mt-2 text-gradient-to">{`// HIPAA-compliant AI with built-in guardrails`}</div>
              <div className="text-foreground-secondary">{`const enforcer = new ComplianceEnforcer([PresetRules.hipaa()]);`}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
