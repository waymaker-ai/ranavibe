'use client';

import { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

const commands = {
  init: {
    command: 'npx @rana/cli init',
    description: 'Initialize a new RANA project',
    flags: [
      { flag: '--template <name>', description: 'Use a specific template' },
      { flag: '--typescript', description: 'Use TypeScript (default)' },
      { flag: '--javascript', description: 'Use JavaScript' },
      { flag: '--skip-install', description: 'Skip dependency installation' },
    ],
  },
  check: {
    command: 'npx @rana/cli check',
    description: 'Validate your RANA configuration',
    flags: [
      { flag: '--fix', description: 'Automatically fix issues' },
      { flag: '--verbose', description: 'Show detailed output' },
    ],
  },
  db: {
    command: 'npx @rana/cli db',
    description: 'Database management commands',
    subcommands: [
      { command: 'migrate', description: 'Run database migrations' },
      { command: 'reset', description: 'Reset database to initial state' },
      { command: 'seed', description: 'Seed database with sample data' },
      { command: 'status', description: 'Show migration status' },
    ],
  },
  deploy: {
    command: 'npx @rana/cli deploy',
    description: 'Deploy your RANA application',
    flags: [
      { flag: '--prod', description: 'Deploy to production' },
      { flag: '--preview', description: 'Create preview deployment' },
      { flag: '--env <file>', description: 'Use specific environment file' },
    ],
  },
  analyze: {
    command: 'npx @rana/cli analyze',
    description: 'Analyze your project for issues',
    flags: [
      { flag: '--performance', description: 'Focus on performance issues' },
      { flag: '--security', description: 'Focus on security issues' },
      { flag: '--cost', description: 'Analyze LLM API costs' },
    ],
  },
};

type CommandKey = keyof typeof commands;

export default function CLIHelperPage() {
  const [selectedCommand, setSelectedCommand] = useState<CommandKey>('init');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const command = commands[selectedCommand];

  return (
    <div className="py-12 md:py-20">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex p-4 rounded-full bg-background-secondary mb-6">
            <Terminal className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">CLI Helper</h1>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Interactive guide for RANA CLI commands with examples and flag
            explanations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Command list */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="font-semibold mb-4">Commands</h2>
              <div className="space-y-2">
                {(Object.keys(commands) as CommandKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCommand(key)}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      selectedCommand === key
                        ? 'bg-foreground text-background'
                        : 'hover:bg-background-secondary'
                    }`}
                  >
                    <div className="font-mono text-sm">{key}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Command details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Command card */}
            <div className="card bg-background-secondary">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedCommand}
                  </h2>
                  <p className="text-foreground-secondary">
                    {command.description}
                  </p>
                </div>
              </div>

              {/* Command */}
              <div className="code-block flex items-center justify-between">
                <code className="font-mono text-sm">{command.command}</code>
                <button
                  onClick={() => handleCopy(command.command)}
                  className="p-2 rounded hover:bg-background-secondary transition-colors"
                  aria-label="Copy command"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-gradient-from" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Flags */}
            {'flags' in command && command.flags && (
              <div className="card">
                <h3 className="font-semibold mb-4">Available Flags</h3>
                <div className="space-y-4">
                  {command.flags.map((item) => (
                    <div key={item.flag}>
                      <div className="font-mono text-sm text-gradient-from mb-1">
                        {item.flag}
                      </div>
                      <div className="text-sm text-foreground-secondary">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subcommands */}
            {'subcommands' in command && command.subcommands && (
              <div className="card">
                <h3 className="font-semibold mb-4">Subcommands</h3>
                <div className="space-y-4">
                  {command.subcommands.map((sub) => (
                    <div key={sub.command} className="flex items-start gap-4">
                      <div className="font-mono text-sm text-gradient-from whitespace-nowrap">
                        {sub.command}
                      </div>
                      <div className="text-sm text-foreground-secondary">
                        {sub.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Examples */}
            <div className="card">
              <h3 className="font-semibold mb-4">Examples</h3>
              <div className="space-y-4">
                {selectedCommand === 'init' && (
                  <>
                    <div>
                      <div className="text-sm text-foreground-secondary mb-2">
                        Create a new project with TypeScript:
                      </div>
                      <div className="code-block font-mono text-sm">
                        npx @rana/cli init my-agent
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-foreground-secondary mb-2">
                        Use a specific template:
                      </div>
                      <div className="code-block font-mono text-sm">
                        npx @rana/cli init my-agent --template chatbot
                      </div>
                    </div>
                  </>
                )}

                {selectedCommand === 'check' && (
                  <>
                    <div>
                      <div className="text-sm text-foreground-secondary mb-2">
                        Check configuration:
                      </div>
                      <div className="code-block font-mono text-sm">
                        npx @rana/cli check
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-foreground-secondary mb-2">
                        Auto-fix issues:
                      </div>
                      <div className="code-block font-mono text-sm">
                        npx @rana/cli check --fix
                      </div>
                    </div>
                  </>
                )}

                {selectedCommand === 'db' && (
                  <>
                    <div>
                      <div className="text-sm text-foreground-secondary mb-2">
                        Run migrations:
                      </div>
                      <div className="code-block font-mono text-sm">
                        npx @rana/cli db migrate
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-foreground-secondary mb-2">
                        Check migration status:
                      </div>
                      <div className="code-block font-mono text-sm">
                        npx @rana/cli db status
                      </div>
                    </div>
                  </>
                )}

                {selectedCommand === 'deploy' && (
                  <>
                    <div>
                      <div className="text-sm text-foreground-secondary mb-2">
                        Deploy to production:
                      </div>
                      <div className="code-block font-mono text-sm">
                        npx @rana/cli deploy --prod
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-foreground-secondary mb-2">
                        Create preview deployment:
                      </div>
                      <div className="code-block font-mono text-sm">
                        npx @rana/cli deploy --preview
                      </div>
                    </div>
                  </>
                )}

                {selectedCommand === 'analyze' && (
                  <>
                    <div>
                      <div className="text-sm text-foreground-secondary mb-2">
                        Analyze all aspects:
                      </div>
                      <div className="code-block font-mono text-sm">
                        npx @rana/cli analyze
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-foreground-secondary mb-2">
                        Focus on security:
                      </div>
                      <div className="code-block font-mono text-sm">
                        npx @rana/cli analyze --security
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
