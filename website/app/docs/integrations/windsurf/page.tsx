'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Wind } from 'lucide-react';

export default function WindsurfIntegrationPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-4xl mx-auto px-6">
        <Link href="/docs" className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-6">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Documentation
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Wind className="h-7 w-7" />
            <h1 className="text-4xl font-bold">CoFounder Skills in Windsurf</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Windsurf&apos;s Cascade agent speaks MCP. Configure the CoFounder server once and every skill is available —
            including the spec-driven flow, compliance frame, and sandbox preview that Windsurf does not ship natively.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">1. Install the MCP server</h2>
          <div className="code-block font-mono text-sm">
            git clone https://github.com/waymaker-ai/cofounder.git<br />
            cd cofounder/packages/claude-code-plugin/mcp-server<br />
            npm install && npm run build
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">2. Configure Windsurf</h2>
          <p className="text-sm text-foreground-secondary mb-3">
            Open <strong>Windsurf Settings → Cascade → MCP servers</strong> or edit{' '}
            <code className="font-mono text-xs">~/.codeium/windsurf/mcp_config.json</code>:
          </p>
          <div className="code-block font-mono text-xs overflow-x-auto">
            <pre>{`{
  "mcpServers": {
    "cofounder": {
      "command": "node",
      "args": ["/absolute/path/to/cofounder/packages/claude-code-plugin/mcp-server/dist/index.js"],
      "env": {
        "COFOUNDER_SKILLS_MANIFEST": "/absolute/path/to/cofounder/packages/skills/MANIFEST.json"
      }
    }
  }
}`}</pre>
          </div>
          <p className="text-sm text-foreground-secondary mt-3">
            Restart Windsurf. Cascade now sees the full <code className="font-mono text-xs">cofounder.*</code>{' '}
            tool surface.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">3. Cascade memory & VibeSpecs</h2>
          <p className="text-sm text-foreground-secondary mb-3">
            Windsurf&apos;s Cascade memory and CoFounder&apos;s VibeSpecs solve different problems and pair well:
          </p>
          <ul className="text-sm text-foreground-secondary list-disc list-inside space-y-1">
            <li>
              <strong className="text-foreground">Cascade memory</strong> — long-running, learned context across sessions.
            </li>
            <li>
              <strong className="text-foreground">CoFounder VibeSpecs</strong> — declarative project rules in YAML, version-controlled.
            </li>
          </ul>
          <p className="text-sm text-foreground-secondary mt-3">
            Use Cascade memory for personal preferences and learned habits. Use VibeSpecs for team-wide policy that
            should be in the repo (design system, security rules, compliance scope).
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">Caveats</h2>
          <ul className="text-sm text-foreground-secondary list-disc list-inside space-y-2">
            <li>
              <strong className="text-foreground">Cascade write mode.</strong> Skills with{' '}
              <code className="font-mono text-xs">sensitivity.writesCode</code> still go through Cascade&apos;s
              file-edit approval flow. The skill&apos;s sandbox preview runs first if eligible.
            </li>
            <li>
              <strong className="text-foreground">Multi-file edits.</strong> Cascade is good at multi-file changes;{' '}
              <code className="font-mono text-xs">cofounder-feature-implement</code> respects the spec&apos;s{' '}
              <code className="font-mono text-xs">affectedPaths</code> as a fence.
            </li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex justify-between items-center pt-8 border-t border-border">
          <Link href="/docs/integrations/cline" className="text-foreground-secondary hover:text-foreground">
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Cline setup
          </Link>
          <Link href="/docs/skills" className="btn-primary px-4 py-2 inline-flex items-center">
            Skill Library
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
