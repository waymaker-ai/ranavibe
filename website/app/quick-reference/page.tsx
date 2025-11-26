import { Metadata } from 'next';
import { Terminal, Code, Database, Shield, Rocket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Quick Reference',
  description: 'Quick reference guide for RANA framework commands, APIs, and patterns',
};

const sections = [
  {
    title: 'CLI Commands',
    icon: Terminal,
    items: [
      {
        command: 'npx @rana/cli init',
        description: 'Initialize a new RANA project',
      },
      {
        command: 'npx @rana/cli check',
        description: 'Validate your RANA configuration',
      },
      {
        command: 'npx @rana/cli db migrate',
        description: 'Run database migrations',
      },
      {
        command: 'npx @rana/cli deploy',
        description: 'Deploy to production',
      },
    ],
  },
  {
    title: 'Core Hooks',
    icon: Code,
    items: [
      {
        command: 'useAgent(options)',
        description: 'Create and manage an AI agent instance',
      },
      {
        command: 'useChat(options)',
        description: 'Build chat interfaces with streaming',
      },
      {
        command: 'useCompletion(options)',
        description: 'Single completion with type inference',
      },
      {
        command: 'useAgentState()',
        description: 'Access global agent state',
      },
    ],
  },
  {
    title: 'Database',
    icon: Database,
    items: [
      {
        command: 'createClient()',
        description: 'Initialize Supabase client',
      },
      {
        command: 'createServerClient()',
        description: 'Server-side database client',
      },
      {
        command: 'db.from("table")',
        description: 'Query database tables',
      },
      {
        command: 'db.rpc("function")',
        description: 'Call database functions',
      },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      {
        command: 'validateInput(schema)',
        description: 'Validate user input with Zod',
      },
      {
        command: 'rateLimit(options)',
        description: 'Apply rate limiting',
      },
      {
        command: 'sanitize(content)',
        description: 'Sanitize user-generated content',
      },
      {
        command: 'requireAuth()',
        description: 'Protect routes with authentication',
      },
    ],
  },
  {
    title: 'Deployment',
    icon: Rocket,
    items: [
      {
        command: 'vercel deploy',
        description: 'Deploy to Vercel',
      },
      {
        command: 'npm run build',
        description: 'Build for production',
      },
      {
        command: 'npm run start',
        description: 'Start production server',
      },
      {
        command: 'docker build',
        description: 'Build Docker image',
      },
    ],
  },
];

export default function QuickReferencePage() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Quick Reference</h1>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Essential commands, APIs, and patterns for RANA framework development.
            Bookmark this page for quick access.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-background-secondary">
                  <section.icon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item) => (
                  <div
                    key={item.command}
                    className="card"
                  >
                    <div className="font-mono text-sm mb-2 text-gradient-from font-semibold">
                      {item.command}
                    </div>
                    <div className="text-sm text-foreground-secondary">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Code Examples */}
        <div className="mt-16 card bg-background-secondary">
          <h2 className="text-2xl font-bold mb-6">Common Patterns</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Basic Agent Setup</h3>
              <div className="code-block font-mono text-sm">
                <pre>{`import { useAgent } from '@rana/react';

function MyAgent() {
  const { send, messages, isLoading } = useAgent({
    model: 'gpt-4',
    systemPrompt: 'You are a helpful assistant',
  });

  return <ChatInterface messages={messages} onSend={send} />;
}`}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Database Query</h3>
              <div className="code-block font-mono text-sm">
                <pre>{`import { createClient } from '@rana/core';

async function getConversations() {
  const db = createClient();
  const { data, error } = await db
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false });

  return data;
}`}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Streaming Response</h3>
              <div className="code-block font-mono text-sm">
                <pre>{`import { RANAClient } from '@rana/core';

const client = new RANAClient({ apiKey: process.env.OPENAI_API_KEY });

const stream = await client.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
