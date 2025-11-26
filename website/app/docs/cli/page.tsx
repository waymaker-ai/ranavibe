'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Terminal } from 'lucide-react';

const commands = [
  {
    category: 'Core Commands',
    items: [
      { cmd: 'rana init', desc: 'Initialize RANA in your project' },
      { cmd: 'rana check', desc: 'Check compliance with RANA standards' },
      { cmd: 'rana fix', desc: 'Automatically fix detected issues' },
      { cmd: 'rana deploy', desc: 'Deploy with verification workflow' },
      { cmd: 'rana status', desc: 'Show project status' },
      { cmd: 'rana doctor', desc: 'Diagnose project setup' },
    ],
  },
  {
    category: 'Code Generation',
    items: [
      { cmd: 'rana generate "<prompt>"', desc: 'Generate code from natural language' },
      { cmd: 'rana generate:templates', desc: 'List available templates' },
      { cmd: 'rana generate:interactive', desc: 'Interactive code generation' },
    ],
  },
  {
    category: 'Cost & Analytics',
    items: [
      { cmd: 'rana dashboard', desc: 'Real-time cost dashboard' },
      { cmd: 'rana analyze', desc: 'Analyze project and get recommendations' },
      { cmd: 'rana optimize', desc: 'Apply cost optimizations automatically' },
      { cmd: 'rana cost:estimate', desc: 'Estimate LLM costs' },
      { cmd: 'rana cost:compare', desc: 'Compare provider pricing' },
    ],
  },
  {
    category: 'LLM Management',
    items: [
      { cmd: 'rana llm:setup', desc: 'Setup LLM providers' },
      { cmd: 'rana llm:analyze', desc: 'Analyze LLM usage and costs' },
      { cmd: 'rana llm:optimize', desc: 'Apply LLM optimizations' },
      { cmd: 'rana llm:compare', desc: 'Compare models and pricing' },
    ],
  },
  {
    category: 'Database',
    items: [
      { cmd: 'rana db:setup', desc: 'Interactive database setup wizard' },
      { cmd: 'rana db:migrate', desc: 'Run database migrations' },
      { cmd: 'rana db:seed', desc: 'Seed database with data' },
      { cmd: 'rana db:studio', desc: 'Open Prisma Studio' },
      { cmd: 'rana db:status', desc: 'Show database status' },
    ],
  },
  {
    category: 'Security',
    items: [
      { cmd: 'rana security:audit', desc: 'Run security audit' },
      { cmd: 'rana security:setup', desc: 'Interactive security setup' },
      { cmd: 'rana audit', desc: 'Quick security audit' },
    ],
  },
  {
    category: 'SEO',
    items: [
      { cmd: 'rana seo:check', desc: 'Validate SEO setup' },
      { cmd: 'rana seo:generate', desc: 'Generate sitemap, robots.txt' },
      { cmd: 'rana seo:analyze', desc: 'Analyze pages for SEO' },
    ],
  },
  {
    category: 'Process Intelligence',
    items: [
      { cmd: 'rana analyze:velocity', desc: 'Development velocity & DORA metrics' },
      { cmd: 'rana analyze:legacy', desc: 'Legacy code modernization analysis' },
      { cmd: 'rana benchmark:run', desc: 'Benchmark LLM providers' },
    ],
  },
];

export default function CLIPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-5xl">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Docs
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">CLI Reference</h1>
          <p className="text-lg text-foreground-secondary mb-8">
            Complete guide to all RANA CLI commands
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="code-block font-mono text-sm mb-12"
        >
          <div className="text-foreground-secondary"># Install globally</div>
          <div>npm install -g @rana/cli</div>
          <div className="mt-4 text-foreground-secondary"># Or use with npx</div>
          <div>npx @rana/cli init</div>
        </motion.div>

        <div className="space-y-12">
          {commands.map((section, index) => (
            <motion.section
              key={section.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Terminal className="mr-2 h-5 w-5 text-gradient-from" />
                {section.category}
              </h2>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {section.items.map((item, i) => (
                      <tr
                        key={item.cmd}
                        className={i !== section.items.length - 1 ? 'border-b border-border' : ''}
                      >
                        <td className="py-3 px-4 font-mono text-sm whitespace-nowrap">
                          {item.cmd}
                        </td>
                        <td className="py-3 px-4 text-foreground-secondary text-sm">
                          {item.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 rounded-lg bg-background-secondary border border-border"
        >
          <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
          <p className="text-foreground-secondary mb-4">
            Run any command with --help for detailed options
          </p>
          <div className="code-block font-mono text-sm">
            rana generate --help
          </div>
        </motion.div>
      </div>
    </div>
  );
}
