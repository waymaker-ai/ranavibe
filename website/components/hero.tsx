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
            <span className="text-sm font-medium">Introducing RANA Framework 2.0</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-6"
          >
            Build AI Agents{' '}
            <span className="gradient-text">The Right Way</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-foreground-secondary text-balance mb-10 max-w-2xl mx-auto"
          >
            The only AI framework with enterprise security, multi-agent orchestration, and MCP server creation. Built by developers, for developers.
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

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">Enterprise</div>
              <div className="text-sm text-foreground-secondary mt-1">Security Built-in</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">Multi-Agent</div>
              <div className="text-sm text-foreground-secondary mt-1">Orchestration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">MCP</div>
              <div className="text-sm text-foreground-secondary mt-1">Server Creation</div>
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
              <div className="text-foreground-secondary">$ npx @rana/cli init</div>
              <div className="mt-2 text-gradient-from">✓ Created RANA project</div>
              <div className="text-gradient-to">✓ Installed dependencies</div>
              <div className="text-foreground-secondary mt-2">$ npm run dev</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
