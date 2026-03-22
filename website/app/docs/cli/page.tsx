'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Terminal } from 'lucide-react';

const commands = [
  {
    category: 'Core Commands',
    items: [
      { cmd: 'aicofounder init', desc: 'Initialize CoFounder in your project' },
      { cmd: 'aicofounder check', desc: 'Check compliance with CoFounder standards' },
      { cmd: 'aicofounder fix', desc: 'Automatically fix detected issues' },
      { cmd: 'aicofounder deploy', desc: 'Deploy with verification workflow' },
      { cmd: 'aicofounder status', desc: 'Show project status' },
      { cmd: 'aicofounder doctor', desc: 'Diagnose project setup' },
      { cmd: 'aicofounder playground', desc: 'Interactive testing playground' },
      { cmd: 'aicofounder demo', desc: 'Run quick feature demo' },
      { cmd: 'aicofounder quickstart', desc: 'Show quickstart guide' },
    ],
  },
  {
    category: 'Code Generation',
    items: [
      { cmd: 'aicofounder generate "<prompt>"', desc: 'Generate code from natural language' },
      { cmd: 'aicofounder generate:templates', desc: 'List available templates' },
      { cmd: 'aicofounder generate:interactive', desc: 'Interactive code generation' },
    ],
  },
  {
    category: 'Prompt Management',
    items: [
      { cmd: 'aicofounder prompts save', desc: 'Save a new prompt with metadata' },
      { cmd: 'aicofounder prompts list', desc: 'List saved prompts with filters' },
      { cmd: 'aicofounder prompts use <name>', desc: 'Get and use a saved prompt' },
      { cmd: 'aicofounder prompts analyze', desc: 'Analyze prompt quality score' },
      { cmd: 'aicofounder prompts improve', desc: 'Get AI improvement suggestions' },
      { cmd: 'aicofounder prompts compare <a> <b>', desc: 'Compare two prompts side-by-side' },
      { cmd: 'aicofounder prompts export', desc: 'Export prompts to JSON' },
      { cmd: 'aicofounder prompts import', desc: 'Import prompts from file' },
    ],
  },
  {
    category: 'MCP Servers',
    items: [
      { cmd: 'aicofounder mcp:create', desc: 'Create new MCP server from template' },
      { cmd: 'aicofounder mcp:list', desc: 'List installed MCP servers' },
      { cmd: 'aicofounder mcp:install', desc: 'Install MCP server from npm/git' },
      { cmd: 'aicofounder mcp:configure', desc: 'Configure MCP server settings' },
      { cmd: 'aicofounder mcp:test', desc: 'Test MCP server tools' },
    ],
  },
  {
    category: 'Cost & Analytics',
    items: [
      { cmd: 'aicofounder dashboard', desc: 'Real-time cost dashboard' },
      { cmd: 'aicofounder analyze', desc: 'Analyze project and get recommendations' },
      { cmd: 'aicofounder optimize', desc: 'Apply cost optimizations automatically' },
      { cmd: 'aicofounder cost:estimate', desc: 'Estimate LLM costs' },
      { cmd: 'aicofounder cost:compare', desc: 'Compare provider pricing' },
    ],
  },
  {
    category: 'LLM Management',
    items: [
      { cmd: 'aicofounder llm:setup', desc: 'Setup LLM providers' },
      { cmd: 'aicofounder llm:analyze', desc: 'Analyze LLM usage and costs' },
      { cmd: 'aicofounder llm:optimize', desc: 'Apply LLM optimizations' },
      { cmd: 'aicofounder llm:compare', desc: 'Compare models and pricing' },
    ],
  },
  {
    category: 'Database',
    items: [
      { cmd: 'aicofounder db:setup', desc: 'Interactive database setup wizard' },
      { cmd: 'aicofounder db:migrate', desc: 'Run database migrations' },
      { cmd: 'aicofounder db:seed', desc: 'Seed database with data' },
      { cmd: 'aicofounder db:studio', desc: 'Open Prisma Studio' },
      { cmd: 'aicofounder db:status', desc: 'Show database status' },
    ],
  },
  {
    category: 'Security',
    items: [
      { cmd: 'aicofounder security:audit', desc: 'Run security audit' },
      { cmd: 'aicofounder security:setup', desc: 'Interactive security setup' },
      { cmd: 'aicofounder audit', desc: 'Quick security audit' },
    ],
  },
  {
    category: 'SEO',
    items: [
      { cmd: 'aicofounder seo:check', desc: 'Validate SEO setup' },
      { cmd: 'aicofounder seo:generate', desc: 'Generate sitemap, robots.txt' },
      { cmd: 'aicofounder seo:analyze', desc: 'Analyze pages for SEO' },
    ],
  },
  {
    category: 'Process Intelligence',
    items: [
      { cmd: 'aicofounder analyze:velocity', desc: 'Development velocity & DORA metrics' },
      { cmd: 'aicofounder analyze:legacy', desc: 'Legacy code modernization analysis' },
      { cmd: 'aicofounder benchmark:run', desc: 'Benchmark LLM providers' },
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
            Complete guide to all CoFounder CLI commands
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="code-block font-mono text-sm mb-12"
        >
          <div className="text-foreground-secondary"># Install globally</div>
          <div>npm install -g @waymakerai/aicofounder-cli</div>
          <div className="mt-4 text-foreground-secondary"># Or use with npx</div>
          <div>npx @waymakerai/aicofounder-cli init</div>
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
            aicofounder generate --help
          </div>
        </motion.div>
      </div>
    </div>
  );
}
