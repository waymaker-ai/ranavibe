'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Terminal } from 'lucide-react';

export default function ClineIntegrationPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-4xl mx-auto px-6">
        <Link href="/docs" className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-6">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Documentation
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Terminal className="h-7 w-7" />
            <h1 className="text-4xl font-bold">CoFounder Skills in Cline</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Cline (the VS Code AI agent) supports MCP. Add the CoFounder server and every skill becomes available as
            a tool — same 16 skills, same chain logic, same sensitivity declarations.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">1. Install the MCP server</h2>
          <p className="text-sm text-foreground-secondary mb-3">
            Build the server locally:
          </p>
          <div className="code-block font-mono text-sm">
            git clone https://github.com/waymaker-ai/cofounder.git<br />
            cd cofounder/packages/claude-code-plugin/mcp-server<br />
            npm install && npm run build
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">2. Configure Cline</h2>
          <p className="text-sm text-foreground-secondary mb-3">
            In VS Code, open the Cline panel → settings → <strong>MCP servers</strong>. Or edit{' '}
            <code className="font-mono text-xs">cline_mcp_settings.json</code>:
          </p>
          <div className="code-block font-mono text-xs overflow-x-auto">
            <pre>{`{
  "mcpServers": {
    "cofounder": {
      "command": "node",
      "args": ["/absolute/path/to/cofounder/packages/claude-code-plugin/mcp-server/dist/index.js"],
      "env": {
        "COFOUNDER_SKILLS_MANIFEST": "/absolute/path/to/cofounder/packages/skills/MANIFEST.json"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}`}</pre>
          </div>
          <p className="text-sm text-foreground-secondary mt-3">
            Reload the Cline panel; you'll see <strong>cofounder</strong> in the MCP server list with green status.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">3. Recommended autoApprove</h2>
          <p className="text-sm text-foreground-secondary mb-3">
            Cline can auto-approve tool calls. We recommend approving only the read-only skills, since they don't
            touch your workspace:
          </p>
          <div className="code-block font-mono text-xs overflow-x-auto">
            <pre>{`"autoApprove": [
  "cofounder.listSkills",
  "cofounder.listVibeSpecs",
  "cofounder.skill.pattern-scout",
  "cofounder.skill.diagram",
  "cofounder.skill.cost-route",
  "cofounder.skill.context-fit"
]`}</pre>
          </div>
          <p className="text-sm text-foreground-secondary mt-3">
            Skills with <code className="font-mono text-xs">sensitivity.writesCode</code> or{' '}
            <code className="font-mono text-xs">runsShell</code> should require manual approval — that's the entire
            point of declaring sensitivity in the first place.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">Caveats</h2>
          <ul className="text-sm text-foreground-secondary list-disc list-inside space-y-2">
            <li>
              <strong className="text-foreground">No SessionStart hook.</strong> The CoFounder Claude Code plugin
              prints active VibeSpecs at session start. In Cline, call{' '}
              <code className="font-mono text-xs">cofounder.listVibeSpecs</code> manually at the start of a session.
            </li>
            <li>
              <strong className="text-foreground">Plan mode.</strong> If you use Cline's Plan mode, skills with{' '}
              <code className="font-mono text-xs">sensitivity.runsShell</code> still won't execute commands —{' '}
              expected behavior.
            </li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex justify-between items-center pt-8 border-t border-border">
          <Link href="/docs/integrations/cursor" className="text-foreground-secondary hover:text-foreground">
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Cursor setup
          </Link>
          <Link href="/docs/integrations/windsurf" className="btn-primary px-4 py-2 inline-flex items-center">
            Windsurf setup
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
