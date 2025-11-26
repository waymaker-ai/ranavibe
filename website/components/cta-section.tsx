'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-border p-12 md:p-20 text-center"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-gradient-from to-gradient-to opacity-5" />

          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
            Ready to build your AI agent?
          </h2>
          <p className="text-lg text-foreground-secondary mb-8 max-w-2xl mx-auto text-balance">
            Start building production-ready AI agents in minutes with our comprehensive training and documentation. Need expert help? Waymaker offers implementation services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
              Start Training
            </Link>
            <Link
              href="https://waymaker.cx"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-6 py-3 text-base"
            >
              Waymaker Services
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
