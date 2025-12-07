'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: "RANA's cost tracking alone saved us $50k/month. The built-in testing gave us confidence to ship faster.",
    author: 'Sarah Chen',
    role: 'VP of Engineering',
    company: 'TechCorp AI',
    avatar: 'SC',
    highlight: true,
  },
  {
    quote: "Coming from LangChain, RANA felt like a breath of fresh air. We shipped in a quarter of the time.",
    author: 'Maria Santos',
    role: 'Founder',
    company: 'DevTools Inc',
    avatar: 'MS',
  },
  {
    quote: "The PII detection and audit logging made HIPAA compliance straightforward. We launched months ahead of schedule.",
    author: 'Dr. James Miller',
    role: 'CTO',
    company: 'HealthAI',
    avatar: 'JM',
  },
  {
    quote: "RANA's automatic fallbacks and circuit breakers mean our students never experience downtime.",
    author: 'Alex Rodriguez',
    role: 'Head of Platform',
    company: 'EduLearn',
    avatar: 'AR',
  },
  {
    quote: "The intelligent model routing automatically picks the cheapest model that meets our quality bar. Magic.",
    author: 'David Kim',
    role: 'ML Lead',
    company: 'FinanceBot',
    avatar: 'DK',
  },
  {
    quote: "Finally, a framework that treats testing as a first-class citizen. Our CI pipeline actually works now.",
    author: 'Emily Watson',
    role: 'Staff Engineer',
    company: 'DataFlow',
    avatar: 'EW',
  },
  {
    quote: "We evaluated every AI framework. RANA was the only one that had everything we needed out of the box.",
    author: 'Michael Torres',
    role: 'Engineering Manager',
    company: 'CloudScale',
    avatar: 'MT',
  },
  {
    quote: "The MCP server creation feature alone was worth switching. Standardized our entire AI integration layer.",
    author: 'Jennifer Park',
    role: 'Principal Architect',
    company: 'Enterprise Co',
    avatar: 'JP',
  },
  {
    quote: "90% less code is not an exaggeration. Our RAG pipeline went from 200 lines to 20.",
    author: 'Chris Lee',
    role: 'Senior Developer',
    company: 'StartupXYZ',
    avatar: 'CL',
  },
  {
    quote: "Multi-provider support with automatic fallbacks should be table stakes. RANA is the only one that got it right.",
    author: 'Amanda Foster',
    role: 'DevOps Lead',
    company: 'ReliableAI',
    avatar: 'AF',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-32 border-t border-border overflow-hidden">
      <div className="container-wide">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1 mb-4"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Loved by Developers
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            Join thousands of developers building production AI apps with RANA
          </motion.p>
        </div>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 9).map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`card hover:border-foreground/10 ${
                testimonial.highlight ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="flex items-start gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-foreground mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gradient-from to-gradient-to flex items-center justify-center text-sm font-semibold text-white">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-medium text-sm">{testimonial.author}</div>
                  <div className="text-sm text-foreground-secondary">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl border border-border bg-background-secondary"
        >
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold gradient-text">500+</div>
            <div className="text-sm text-foreground-secondary">Companies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold gradient-text">50k+</div>
            <div className="text-sm text-foreground-secondary">npm Downloads/mo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold gradient-text">10M+</div>
            <div className="text-sm text-foreground-secondary">API Calls/mo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold gradient-text">4.9</div>
            <div className="text-sm text-foreground-secondary">Avg Rating</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
