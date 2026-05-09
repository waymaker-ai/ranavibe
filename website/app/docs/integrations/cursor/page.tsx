'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Code2 } from 'lucide-react';

export default function CursorIntegrationPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-4xl mx-auto px-6">
        <Link href="/docs" className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-6">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Documentation
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Code2 className="h-7 w-7" />
            <h1 className="text-4xl font-bold">CoFounder Skills in Cursor</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Cursor speaks MCP. The CoFounder MCP server auto-publishes every skill as a{' '}
            <code className="font-mono text-sm">cofounder.skill.*</code> tool, so the same 16 skills you use in
            Claude Code are available in Cursor with no skill-specific code changes.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">1. Install the MCP server</h2>
          <p className="text-sm text-foreground-secondary mb-3">
            Clone the repo (or install from npm once published) so the MCP server binary is on disk:
          </p>
          <div className="code-block font-mono text-sm">
            git clone https://github.com/waymaker-ai/cofounder.git<br />
            cd cofounder/packages/claude-code-plugin/mcp-server<br />
            npm install && npm run build
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">2. Add to Cursor's MCP config</h2>
          <p className="text-sm text-foreground-secondary mb-3">
            In Cursor, open <strong>Settings → MCP</strong> and add a new server. Or edit{' '}
            <code className="font-mono text-xs">~/.cursor/mcp.json</code> directly:
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
            Restart Cursor. The agent context will now include 16 + 4 = 20 tools (16 skills, 4 spec/check helpers).
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">3. Verify</h2>
          <p className="text-sm text-foreground-secondary mb-3">
            In a Cursor chat, ask:
          </p>
          <div className="code-block font-mono text-sm mb-3">
            What tools do you have available from cofounder?
          </div>
          <p className="text-sm text-foreground-secondary mb-2">
            You should see entries like:
          </p>
          <ul className="text-sm text-foreground-secondary list-disc list-inside space-y-1">
            <li><code className="font-mono text-xs">cofounder.skill.feature-new</code></li>
            <li><code className="font-mono text-xs">cofounder.skill.feature-implement</code></li>
            <li><code className="font-mono text-xs">cofounder.skill.check</code></li>
            <li><code className="font-mono text-xs">cofounder.skill.compliance-frame</code></li>
            <li><code className="font-mono text-xs">cofounder.skill.sandbox-preview</code></li>
            <li><code className="font-mono text-xs">cofounder.listVibeSpecs</code></li>
            <li>… plus the rest of the manifest</li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">4. How tool-calls work</h2>
          <p className="text-sm text-foreground-secondary mb-3">
            Each skill tool has the same input shape:
          </p>
          <div className="code-block font-mono text-xs overflow-x-auto">
            <pre>{`{
  "task": "Add team billing settings to the admin page",
  "repoRoot": "/optional/override/of/cwd"
}`}</pre>
          </div>
          <p className="text-sm text-foreground-secondary mt-3">
            The MCP server returns the SKILL.md instructions, the recommended modelClass, and any chain hints. Cursor
            then loads those instructions as system context for the active model.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card mb-8">
          <h2 className="text-xl font-bold mb-3">Caveats</h2>
          <ul className="text-sm text-foreground-secondary list-disc list-inside space-y-2">
            <li>
              <strong className="text-foreground">No PreToolUse hooks in Cursor.</strong> The Claude-Code-only hooks
              (secret detection on Edit/Write) don't run. The skill-side guards (cofounder-commit, cofounder-check)
              still do.
            </li>
            <li>
              <strong className="text-foreground">Cursor rules vs CoFounder VibeSpecs.</strong> They coexist. Cursor
              rules govern Cursor; VibeSpecs govern the skill. If they conflict, the skill defers to the VibeSpec.
            </li>
            <li>
              <strong className="text-foreground">Agent tool allowlist.</strong> Cursor lets you scope which MCP tools
              the agent can call. We recommend allowing the full <code className="font-mono text-xs">cofounder.*</code>{' '}
              namespace.
            </li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex justify-between items-center pt-8 border-t border-border">
          <Link href="/docs/integrations" className="text-foreground-secondary hover:text-foreground">
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Integrations
          </Link>
          <Link href="/docs/integrations/cline" className="btn-primary px-4 py-2 inline-flex items-center">
            Cline setup
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
