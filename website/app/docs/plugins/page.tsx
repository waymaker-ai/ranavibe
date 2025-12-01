'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Puzzle, MessageSquare, Mail, Mic, FileText, Hash, Plug } from 'lucide-react';

const plugins = [
  {
    icon: Hash,
    title: 'Slack Integration',
    description: 'Build AI-powered Slack bots with conversation context',
    code: `import { SlackPlugin } from '@rana/plugins/slack';

const slack = new SlackPlugin({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN
});

// Handle messages
slack.onMessage(async (message, context) => {
  const response = await chat({
    messages: [
      ...context.threadHistory,  // Previous messages in thread
      { role: 'user', content: message.text }
    ]
  });

  await context.reply(response.content);
});

// Handle slash commands
slack.onCommand('/ask', async (command, context) => {
  const answer = await agent.run(command.text);
  await context.respond(answer);
});

// Start listening
await slack.start();`,
  },
  {
    icon: MessageSquare,
    title: 'Discord Integration',
    description: 'Create Discord bots with slash commands and threads',
    code: `import { DiscordPlugin } from '@rana/plugins/discord';

const discord = new DiscordPlugin({
  token: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID
});

// Handle mentions
discord.onMention(async (message, context) => {
  const response = await chat({
    messages: [{ role: 'user', content: message.content }]
  });

  await message.reply(response.content);
});

// Register slash commands
discord.registerCommand({
  name: 'ask',
  description: 'Ask the AI a question',
  handler: async (interaction) => {
    const question = interaction.options.getString('question');
    const answer = await agent.run(question);
    await interaction.reply(answer);
  }
});

await discord.start();`,
  },
  {
    icon: Mic,
    title: 'Voice Integration',
    description: 'Build voice-enabled AI applications',
    code: `import { VoicePlugin } from '@rana/plugins/voice';

const voice = new VoicePlugin({
  sttProvider: 'whisper',       // Speech-to-text
  ttsProvider: 'elevenlabs',    // Text-to-speech
  ttsVoice: 'rachel'
});

// Transcribe audio
const transcript = await voice.transcribe(audioBuffer, {
  language: 'en',
  format: 'mp3'
});

// Generate speech
const audio = await voice.synthesize(text, {
  speed: 1.0,
  emotion: 'friendly'
});

// Full voice conversation
const response = await voice.converse(audioInput, async (text) => {
  return await chat({
    messages: [{ role: 'user', content: text }]
  });
});
// Returns { text: string, audio: Buffer }`,
  },
  {
    icon: Mail,
    title: 'Email Integration',
    description: 'AI-powered email processing and responses',
    code: `import { EmailPlugin } from '@rana/plugins/email';

const email = new EmailPlugin({
  imap: {
    host: 'imap.gmail.com',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  },
  smtp: {
    host: 'smtp.gmail.com',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  }
});

// Process incoming emails
email.onEmail(async (message, context) => {
  // Classify the email
  const category = await classify(message.text, [
    'support', 'sales', 'feedback', 'spam'
  ]);

  if (category === 'support') {
    const response = await agent.run(
      \`Respond to this support email: \${message.text}\`
    );

    await context.reply({
      subject: \`Re: \${message.subject}\`,
      body: response
    });
  }
});

await email.start();`,
  },
  {
    icon: FileText,
    title: 'Document Processing',
    description: 'Extract and process documents with AI',
    code: `import { DocsPlugin } from '@rana/plugins/docs';

const docs = new DocsPlugin({
  ocrProvider: 'google-vision',   // For scanned documents
  extractors: ['pdf', 'docx', 'xlsx', 'pptx']
});

// Extract text from any document
const content = await docs.extract(fileBuffer, {
  filename: 'report.pdf',
  ocr: true  // Enable OCR for scanned pages
});

// Extract structured data
const data = await docs.extractStructured(invoice, {
  schema: {
    vendor: 'string',
    amount: 'number',
    date: 'date',
    lineItems: 'array'
  }
});

// Summarize document
const summary = await docs.summarize(fileBuffer, {
  maxLength: 500,
  style: 'executive-summary'
});`,
  },
  {
    icon: Plug,
    title: 'Custom Plugins',
    description: 'Create your own plugins with the plugin API',
    code: `import { createPlugin, PluginContext } from '@rana/core';

const myPlugin = createPlugin({
  name: 'my-plugin',
  version: '1.0.0',

  // Initialize
  async init(context: PluginContext) {
    console.log('Plugin initialized');
  },

  // Add tools to agents
  tools: [
    {
      name: 'my_tool',
      description: 'Does something useful',
      parameters: { query: { type: 'string' } },
      handler: async ({ query }) => {
        return await doSomething(query);
      }
    }
  ],

  // Add middleware
  middleware: [
    async (request, next) => {
      console.log('Before request');
      const response = await next(request);
      console.log('After request');
      return response;
    }
  ]
});

// Register plugin
agent.use(myPlugin);`,
  },
];

export default function PluginsPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Puzzle className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Official Plugins</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Extend RANA with official plugins for Slack, Discord, voice, email,
            and document processing. Or create your own custom plugins.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/plugins
          </div>
        </motion.div>

        {/* Plugins */}
        <div className="space-y-12">
          {plugins.map((plugin, index) => (
            <motion.div
              key={plugin.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <plugin.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{plugin.title}</h2>
                  <p className="text-foreground-secondary">{plugin.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{plugin.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Available Plugins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-6">All Available Plugins</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              '@rana/plugins/slack',
              '@rana/plugins/discord',
              '@rana/plugins/voice',
              '@rana/plugins/email',
              '@rana/plugins/docs',
              '@rana/plugins/notion',
              '@rana/plugins/github',
              '@rana/plugins/jira'
            ].map((pkg) => (
              <div
                key={pkg}
                className="p-4 rounded-lg bg-background-secondary text-center font-mono text-sm"
              >
                {pkg}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
