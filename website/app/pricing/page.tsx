'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Sparkles, Building, Rocket } from 'lucide-react';

const tiers = [
  {
    name: 'Open Source',
    price: 'Free',
    description: 'Everything you need to build AI applications',
    icon: Sparkles,
    features: [
      'All RANA packages (@rana/helpers, @rana/prompts, @rana/rag)',
      '25+ CLI commands',
      '9 LLM provider integrations',
      'Automatic cost optimization',
      'TypeScript support',
      'React hooks included',
      'Community support on GitHub',
      'MIT License',
    ],
    cta: 'Get Started',
    ctaLink: '/docs/quick-start',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For teams that need advanced features and support',
    icon: Rocket,
    features: [
      'Everything in Open Source',
      'Priority support via email',
      'Advanced analytics dashboard',
      'Team collaboration features',
      'Custom model fine-tuning guides',
      'Private Discord channel',
      'Monthly office hours',
      'Early access to new features',
    ],
    cta: 'Coming Soon',
    ctaLink: '#',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For organizations with custom requirements',
    icon: Building,
    features: [
      'Everything in Pro',
      'Dedicated support engineer',
      'Custom integrations',
      'On-premise deployment option',
      'SLA guarantees',
      'Security audit & compliance',
      'Training & workshops',
      'Custom feature development',
    ],
    cta: 'Contact Sales',
    ctaLink: 'mailto:sales@waymaker.cx',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Is RANA really free?',
    a: 'Yes! All RANA packages are open source under the MIT license. You can use them in any project, commercial or personal, completely free.',
  },
  {
    q: 'What LLM costs should I expect?',
    a: 'RANA helps reduce LLM costs by up to 70% through intelligent caching, model routing, and prompt optimization. Actual costs depend on your usage and chosen providers.',
  },
  {
    q: 'Can I use RANA with my existing LLM provider?',
    a: 'Yes! RANA supports 9 providers out of the box: OpenAI, Anthropic, Google, xAI (Grok), Mistral, Cohere, Together, Groq, and Ollama.',
  },
  {
    q: 'Do I need the Pro tier to use RANA in production?',
    a: 'No. The open source version is production-ready and used by companies of all sizes. Pro and Enterprise tiers offer additional support and features for teams.',
  },
];

export default function PricingPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-foreground-secondary">
            Start free, scale as you grow. No hidden fees.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`card relative flex flex-col ${
                tier.highlighted
                  ? 'border-gradient-from ring-2 ring-gradient-from/20'
                  : ''
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle w-fit mb-4">
                  <tier.icon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{tier.name}</h2>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && (
                    <span className="text-foreground-secondary">{tier.period}</span>
                  )}
                </div>
                <p className="text-foreground-secondary text-sm">
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaLink}
                className={`w-full py-3 text-center rounded-lg font-medium transition-colors ${
                  tier.highlighted
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Cost Savings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="card bg-gradient-subtle">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Save Up to 70% on LLM Costs
            </h2>
            <p className="text-foreground-secondary text-center mb-8">
              RANA&apos;s built-in optimizations automatically reduce your AI infrastructure costs
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Intelligent Caching', value: '40%', desc: 'reduction' },
                { label: 'Model Routing', value: '20%', desc: 'savings' },
                { label: 'Prompt Optimization', value: '15%', desc: 'efficiency' },
                { label: 'Batch Processing', value: '10%', desc: 'cost cut' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-foreground-secondary">{stat.desc}</div>
                  <div className="text-xs text-foreground-secondary mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="card">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-foreground-secondary text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-foreground-secondary mb-6">
            Join thousands of developers building AI applications with RANA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs/quick-start" className="btn-primary px-6 py-3">
              Start Building Free
            </Link>
            <Link href="mailto:sales@waymaker.cx" className="btn-secondary px-6 py-3">
              Contact Sales
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
