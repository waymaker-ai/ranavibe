# Discord Plugin for RANA

A comprehensive Discord integration plugin that enables RANA-powered AI bots with advanced features including conversation memory, rate limiting, rich embeds, slash commands, and more.

## Features

- **Message Handling**: DMs, mentions, and channel messages
- **Conversation Memory**: Per-user context tracking across channels and guilds
- **Slash Commands**: Full support for Discord slash commands
- **Rich Embeds**: Beautiful formatted messages with embeds
- **Button Interactions**: Interactive buttons for enhanced UX
- **Thread Support**: Create and manage conversation threads
- **Rate Limiting**: Configurable rate limits per channel, user, and command
- **Presence Management**: Set bot status and activity
- **Auto-reconnect**: Resilient connection handling

## Installation

```bash
npm install @rana/core
```

For production use with real Discord bots, also install:

```bash
npm install discord.js
```

## Quick Start

```typescript
import { createRana } from '@rana/core';
import { DiscordPlugin } from '@rana/core/plugins/discord';

// Initialize RANA
const rana = createRana({
  providers: {
    openai: process.env.OPENAI_API_KEY,
  },
});

// Create Discord plugin
const discord = new DiscordPlugin({
  token: process.env.DISCORD_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  defaultModel: 'gpt-4o-mini',
});

// Initialize bot
await discord.createBot({
  intents: ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES', 'MESSAGE_CONTENT'],
  presence: {
    status: 'online',
    activity: 'Powered by RANA',
  },
});

// Handle messages
discord.onMessage(async (message) => {
  if (message.author.bot) return;

  const response = await rana.chat(message.content);
  await discord.reply(message.channel, response.content);
});
```

## Configuration

### DiscordPluginConfig

```typescript
interface DiscordPluginConfig {
  /** Discord bot token (required) */
  token: string;

  /** Discord application client ID (required) */
  clientId: string;

  /** Guild ID for development/testing (optional) */
  guildId?: string;

  /** Default AI model to use */
  defaultModel?: LLMModel;

  /** Rate limiting configuration */
  rateLimit?: {
    messagesPerMinute?: number;    // Default: 60
    messagesPerUser?: number;       // Default: 10
    commandsPerMinute?: number;     // Default: 30
    enabled?: boolean;              // Default: true
  };

  /** Auto-respond to bot mentions */
  autoRespondToMentions?: boolean;  // Default: true

  /** Max message length (Discord limit: 2000) */
  maxMessageLength?: number;        // Default: 2000

  /** Enable thread support */
  enableThreads?: boolean;          // Default: true
}
```

### DiscordBotConfig

```typescript
interface DiscordBotConfig {
  /** Discord gateway intents */
  intents?: Array<
    | 'GUILDS'
    | 'GUILD_MEMBERS'
    | 'GUILD_MESSAGES'
    | 'GUILD_MESSAGE_REACTIONS'
    | 'DIRECT_MESSAGES'
    | 'MESSAGE_CONTENT'
  >;

  /** Bot presence/status */
  presence?: {
    status: 'online' | 'idle' | 'dnd' | 'invisible';
    activity?: string;
    activityType?: 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING';
  };

  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
}
```

## Usage Examples

### Message Handling with Context

```typescript
discord.onMessage(async (message) => {
  if (message.author.bot) return;

  // Get user's conversation history
  const context = discord.getUserContext(
    message.author.id,
    message.channel.id,
    message.guild?.id
  );

  // Build message array from history
  const messages = [
    ...context.messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: message.content },
  ];

  // Get AI response with context
  const response = await rana.chat({ messages });

  // Reply
  await discord.reply(message.channel, response.content);
});
```

### Slash Commands

```typescript
// Register commands
await discord.registerCommands([
  {
    name: 'ask',
    description: 'Ask the AI a question',
    options: [
      {
        name: 'question',
        description: 'Your question',
        type: 'STRING',
        required: true,
      },
    ],
  },
]);

// Handle command
discord.onCommand('ask', async (interaction) => {
  const question = interaction.options.get('question')?.value;

  await interaction.deferReply();

  const response = await rana.chat(question);
  await interaction.followUp(response.content);
});
```

### Rich Embeds

```typescript
const embed = DiscordPlugin.formatAsEmbed(
  'Your AI-generated content here',
  {
    title: '🤖 AI Response',
    color: 0x00AE86,
    footer: 'Powered by RANA',
    timestamp: true,
  }
);

await discord.sendEmbed(message.channel, embed);
```

### Custom Embeds

```typescript
await discord.sendEmbed(message.channel, {
  title: 'Custom Embed',
  description: 'This is a custom embed',
  color: 0x5865F2,
  fields: [
    { name: 'Field 1', value: 'Value 1', inline: true },
    { name: 'Field 2', value: 'Value 2', inline: true },
  ],
  footer: { text: 'Footer text' },
  thumbnail: { url: 'https://example.com/image.png' },
  timestamp: new Date(),
});
```

### Interactive Buttons

```typescript
await discord.sendWithButtons(
  message.channel,
  'Choose an option:',
  [
    {
      customId: 'option_1',
      label: 'Option 1',
      style: 'PRIMARY',
    },
    {
      customId: 'option_2',
      label: 'Option 2',
      style: 'SECONDARY',
    },
  ]
);

// Handle button clicks
discord.onButton('option_1', async (interaction) => {
  await interaction.reply('You selected Option 1!');
});
```

### Thread Management

```typescript
// Create a thread from a message
const threadId = await discord.createThread(
  message.channel,
  message.id,
  'Discussion Thread'
);

console.log(`Created thread: ${threadId}`);
```

### Presence/Status Updates

```typescript
await discord.setPresence({
  status: 'online',
  activity: 'with AI models',
  activityType: 'PLAYING',
});
```

### Context Management

```typescript
// Get user context
const context = discord.getUserContext(userId, channelId, guildId);

// Clear user context
discord.clearUserContext(userId, channelId, guildId);

// Access conversation history
context.messageHistory.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
});
```

### Rate Limit Monitoring

```typescript
const rateLimitInfo = discord.getRateLimitInfo(channelId, userId);

console.log('Rate limits:', {
  channelRemaining: rateLimitInfo.channelRemaining,
  userRemaining: rateLimitInfo.userRemaining,
  commandRemaining: rateLimitInfo.commandRemaining,
});
```

### Statistics

```typescript
const stats = discord.getStats();

console.log('Bot stats:', {
  ready: stats.bot.ready,
  activeContexts: stats.contexts.totalContexts,
  avgHistoryLength: stats.contexts.averageHistoryLength,
});
```

## Types

### DiscordMessage

```typescript
interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    bot: boolean;
  };
  channel: DiscordChannel;
  guild?: {
    id: string;
    name: string;
  };
  mentions: string[];
  timestamp: Date;
  isDirectMessage: boolean;
  isThread: boolean;
  threadId?: string;
}
```

### DiscordInteraction

```typescript
interface DiscordInteraction {
  id: string;
  type: 'COMMAND' | 'BUTTON' | 'SELECT_MENU';
  commandName?: string;
  customId?: string;
  user: {
    id: string;
    username: string;
  };
  channel: DiscordChannel;
  options: Map<string, any>;
  reply: (content: string | DiscordEmbed) => Promise<void>;
  deferReply: () => Promise<void>;
  followUp: (content: string | DiscordEmbed) => Promise<void>;
}
```

## Advanced Features

### Multi-Model Support

```typescript
discord.onCommand('compare', async (interaction) => {
  const question = interaction.options.get('question')?.value;

  // Get responses from multiple models
  const [gpt4, claude] = await Promise.all([
    rana.chat({ messages: [{ role: 'user', content: question }], model: 'gpt-4o' }),
    rana.chat({ messages: [{ role: 'user', content: question }], model: 'claude-3-5-sonnet-20241022' }),
  ]);

  const embed = {
    title: 'Model Comparison',
    fields: [
      { name: 'GPT-4o', value: gpt4.content.substring(0, 1024) },
      { name: 'Claude 3.5', value: claude.content.substring(0, 1024) },
    ],
  };

  await interaction.reply(embed);
});
```

### Error Handling

```typescript
discord.onMessage(async (message) => {
  try {
    const response = await rana.chat(message.content);
    await discord.reply(message.channel, response.content);
  } catch (error) {
    console.error('Error:', error);

    if (error.code === 'RATE_LIMIT_ERROR') {
      await discord.reply(
        message.channel,
        'I\'m being rate limited. Please try again in a moment.'
      );
    } else {
      await discord.reply(
        message.channel,
        'Sorry, I encountered an error. Please try again.'
      );
    }
  }
});
```

### Graceful Shutdown

```typescript
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await discord.shutdown();
  process.exit(0);
});
```

## Production Setup

For production use, replace the mock Discord bot with actual Discord.js:

1. Install Discord.js:
   ```bash
   npm install discord.js
   ```

2. Update the `MockDiscordBot` class in `discord.ts` to use Discord.js Client

3. Map Discord.js events to RANA handlers:
   ```typescript
   client.on('messageCreate', (message) => {
     // Convert Discord.js message to DiscordMessage
     // Call registered handlers
   });

   client.on('interactionCreate', (interaction) => {
     // Handle slash commands and buttons
   });
   ```

## Environment Variables

Required environment variables:

```bash
# Discord
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id  # Optional, for development

# RANA/AI Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## Best Practices

1. **Always check for bot messages**: Prevent infinite loops
2. **Use rate limiting**: Prevent abuse and API overuse
3. **Clear old contexts**: Manage memory for long-running bots
4. **Handle errors gracefully**: Provide user-friendly error messages
5. **Use deferred replies**: For slow AI responses (>3 seconds)
6. **Respect Discord limits**: Max 2000 chars per message
7. **Use threads**: For long conversations
8. **Monitor costs**: Track RANA usage with cost tracking

## License

MIT
