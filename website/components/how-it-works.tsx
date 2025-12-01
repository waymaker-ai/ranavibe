'use client';

import { motion } from 'framer-motion';
import { Terminal, Code2, Rocket, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Terminal,
    step: '01',
    title: 'Install',
    description: 'One command to get started. No complex setup.',
    code: 'npx create-rana-app my-ai-app',
    duration: '30 seconds',
  },
  {
    icon: Code2,
    step: '02',
    title: 'Build',
    description: 'Write clean, simple AI code with full TypeScript support.',
    code: `const rana = createRana();
const response = await rana.chat('Hello!');`,
    duration: '2 minutes',
  },
  {
    icon: CheckCircle,
    step: '03',
    title: 'Test',
    description: 'Built-in testing framework for AI applications.',
    code: `aiTest('works', async () => {
  await expect(response).toSemanticMatch('greeting');
});`,
    duration: '1 minute',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Deploy',
    description: 'One-click deploy to Vercel, AWS, or any platform.',
    code: 'vercel deploy',
    duration: '30 seconds',
  },
];

export function HowItWorks() {
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
            Zero to Production in{' '}
            <span className="gradient-text">5 Minutes</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            From first command to production deployment in under 5 minutes
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-border -translate-x-1/2 z-0" />
              )}

              <div className="card relative z-10 h-full">
                {/* Step number */}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-background">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-bold text-foreground/20">{step.step}</span>
                </div>

                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-foreground-secondary mb-4">{step.description}</p>

                {/* Code snippet */}
                <div className="code-block text-xs overflow-x-auto">
                  <pre>
                    <code className="text-foreground-secondary">{step.code}</code>
                  </pre>
                </div>

                {/* Duration */}
                <div className="mt-4 text-xs text-foreground-secondary">
                  ~{step.duration}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-border bg-background-secondary">
            <span className="text-foreground-secondary">Total time:</span>
            <span className="text-xl font-bold gradient-text">~5 minutes</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
