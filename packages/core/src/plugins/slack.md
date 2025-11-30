# Slack Bot Plugin for RANA

A comprehensive Slack integration plugin that enables RANA-powered chatbots with support for messages, slash commands, interactive components, and more.

## Features

- **Message Handling**: Direct messages, mentions, and channel messages
- **Thread Support**: Automatic or manual thread management
- **Slash Commands**: Register custom commands with handler functions
- **Interactive Components**: Buttons, modals, and other Block Kit elements
- **Event Subscriptions**: Subscribe to custom Slack events
- **User Context Tracking**: Maintain conversation state per user
- **Rate Limiting**: Built-in rate limiting for Slack API compliance
- **Error Handling**: Automatic retries with exponential backoff
- **Block Kit Helpers**: Utility functions for creating rich messages

## Installation

The Slack plugin is included in `@rana/core`:

```bash
npm install @rana/core
```

## Basic Setup

### 1. Get Slack Credentials

You'll need:
- **Bot Token** (`xoxb-...`): From your Slack app's OAuth & Permissions page
- **App Token** (`xapp-...`): For Socket Mode (recommended for development)
- **Signing Secret**: For webhook verification (alternative to Socket Mode)

### 2. Create a Basic Bot

```typescript
import { createRana } from '@rana/core';
import { createSlackPlugin } from '@rana/core/plugins/slack';

// Initialize RANA
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  },
  defaults: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
  },
});

// Create Slack bot
const slack = createSlackPlugin({
  botToken: process.env.SLACK_BOT_TOKEN!,
  appToken: process.env.SLACK_APP_TOKEN, // Optional, for Socket Mode
  signingSecret: process.env.SLACK_SIGNING_SECRET, // Optional, for webhooks
  defaultModel: 'claude-3-5-sonnet-20241022',
});

// Handle incoming messages
slack.onMessage(async (message) => {
  const response = await rana.chat(message.text);
  await slack.reply(message.channel, response.content, {
    thread_ts: message.ts, // Reply in thread
  });
});

// Start the bot
await slack.start();
```

## Configuration

```typescript
interface SlackConfig {
  /** Slack Bot Token (xoxb-...) */
  botToken: string;

  /** Slack App Token (xapp-...) for Socket Mode */
  appToken?: string;

  /** Slack Signing Secret for request verification */
  signingSecret?: string;

  /** Default model to use for RANA chat */
  defaultModel?: LLMModel;

  /** Rate limit: max requests per minute (default: 60) */
  maxRequestsPerMinute?: number;

  /** Enable automatic thread replies (default: true) */
  autoThreadReplies?: boolean;

  /** Retry configuration */
  retry?: {
    maxRetries?: number;      // Default: 3
    baseDelay?: number;       // Default: 1000ms
    maxDelay?: number;        // Default: 10000ms
  };
}
```

## Core Methods

### Message Handling

```typescript
// Register message handler
slack.onMessage(async (message) => {
  console.log('Received:', message.text);
  await slack.reply(message.channel, 'Got it!');
});
```

### Slash Commands

```typescript
// Register a slash command handler
slack.onCommand('ask', async (command) => {
  const response = await rana.chat(command.text);
  return response.content; // Auto-sends response
});

// Multiple commands
slack.onCommand('summarize', async (command) => {
  const response = await rana.chat({
    messages: [{ role: 'user', content: `Summarize: ${command.text}` }],
    optimize: 'cost',
  });
  return response.content;
});
```

### Sending Messages

```typescript
// Simple text reply
await slack.reply(channel, 'Hello, world!');

// Reply in thread
await slack.reply(channel, 'Thread reply', {
  thread_ts: message.ts,
});

// Rich message with blocks
await slack.reply(channel, {
  text: 'Fallback text',
  blocks: [
    SlackBot.createHeader('Analysis Results'),
    SlackBot.createSection('Here is your analysis...'),
  ],
});
```

### Thread Management

```typescript
// Start a new thread
const thread = await slack.startThread(channel, 'Starting discussion...');

// Reply in existing thread
await slack.reply(channel, 'Follow-up message', {
  thread_ts: thread.ts,
});
```

### Updating Messages

```typescript
// Update an existing message
await slack.updateMessage(channel, messageTs, 'Updated text');

// Delete a message
await slack.deleteMessage(channel, messageTs);
```

### Reactions

```typescript
// Add reaction
await slack.addReaction(channel, timestamp, 'thumbsup');
await slack.addReaction(channel, timestamp, 'eyes');
```

### Interactive Components

```typescript
// Handle button clicks
slack.onInteraction(async (interaction) => {
  if (interaction.type === 'block_actions') {
    const action = interaction.actions[0];
    console.log('Button clicked:', action.value);
  }
});

// Send message with buttons
await slack.reply(channel, {
  text: 'Choose an option:',
  blocks: [
    SlackBot.createSection('*Select a model:*'),
    SlackBot.createActions([
      SlackBot.createButton('Claude', 'select_claude', 'claude', 'primary'),
      SlackBot.createButton('GPT-4', 'select_gpt4', 'gpt4'),
    ]),
  ],
});
```

### Modals

```typescript
// Open a modal
await slack.openModal(triggerId, {
  type: 'modal',
  title: { type: 'plain_text', text: 'My Modal' },
  blocks: [
    SlackBot.createSection('Modal content here'),
  ],
  submit: { type: 'plain_text', text: 'Submit' },
});
```

## User Context Management

Track conversation state per user:

```typescript
slack.onMessage(async (message) => {
  // Get or create user context
  let context = slack.getUserContext(message.user) || {
    messages: [],
  };

  // Add user message to history
  context.messages.push({
    role: 'user',
    content: message.text,
  });

  // Keep last 10 messages
  if (context.messages.length > 10) {
    context.messages = context.messages.slice(-10);
  }

  // Get response with conversation history
  const response = await rana.chat({
    messages: context.messages,
  });

  // Add assistant response to history
  context.messages.push({
    role: 'assistant',
    content: response.content,
  });

  // Save context
  slack.setUserContext(message.user, context);

  // Reply
  await slack.reply(message.channel, response.content);
});

// Clear context when done
slack.clearUserContext(userId);
```

## Block Kit Helpers

Utility functions for creating rich messages:

```typescript
// Create section block
const section = SlackBot.createSection('*Bold text* and _italic_');

// Create header
const header = SlackBot.createHeader('My Header');

// Create divider
const divider = SlackBot.createDivider();

// Create button
const button = SlackBot.createButton(
  'Click Me',    // text
  'action_id',   // action ID
  'value',       // value
  'primary'      // style (optional)
);

// Create actions block with buttons
const actions = SlackBot.createActions([
  SlackBot.createButton('Option 1', 'opt1'),
  SlackBot.createButton('Option 2', 'opt2', undefined, 'danger'),
]);

// Use in message
await slack.reply(channel, {
  text: 'Fallback',
  blocks: [header, divider, section, actions],
});
```

## Advanced Examples

### Auto-Reply with Context

```typescript
const slack = createSlackPlugin({
  botToken: process.env.SLACK_BOT_TOKEN!,
  autoThreadReplies: true,
});

slack.onMessage(async (message) => {
  // Skip bot messages
  if (message.subtype === 'bot_message') return;

  // Maintain conversation history
  let context = slack.getUserContext(message.user) || { messages: [] };

  context.messages.push({ role: 'user', content: message.text });

  const response = await rana.chat({
    messages: context.messages,
    max_tokens: 1000,
  });

  context.messages.push({ role: 'assistant', content: response.content });
  slack.setUserContext(message.user, context);

  // Auto-reply in thread
  await slack.reply(message.channel, response.content, {
    thread_ts: message.thread_ts || message.ts,
  });
});
```

### Multi-Provider Strategy

```typescript
slack.onCommand('ask', async (command) => {
  let provider: 'anthropic' | 'openai' = 'anthropic';
  let optimize: 'cost' | 'speed' | 'quality' = 'quality';

  // Parse flags
  if (command.text.includes('--fast')) {
    provider = 'openai';
    optimize = 'speed';
  } else if (command.text.includes('--cheap')) {
    provider = 'openai';
    optimize = 'cost';
  }

  const cleanText = command.text.replace(/--\w+/g, '').trim();

  const response = await rana.chat({
    provider,
    optimize,
    messages: [{ role: 'user', content: cleanText }],
  });

  return `${response.content}\n\n_${response.provider}/${response.model} - $${response.cost.total_cost.toFixed(6)}_`;
});
```

### Progress Indicators

```typescript
slack.onMessage(async (message) => {
  // Show processing
  await slack.addReaction(message.channel, message.ts, 'hourglass');

  try {
    const response = await rana.chat(message.text);

    // Show success
    await slack.addReaction(message.channel, message.ts, 'white_check_mark');

    await slack.reply(message.channel, response.content, {
      thread_ts: message.ts,
    });
  } catch (error) {
    // Show error
    await slack.addReaction(message.channel, message.ts, 'x');

    await slack.reply(message.channel, `Error: ${error.message}`, {
      thread_ts: message.ts,
    });
  }
});
```

### Custom Events

```typescript
// Listen for custom events
slack.onEvent('app_mention', async (event) => {
  console.log('Bot mentioned:', event);
});

slack.onEvent('reaction_added', async (event) => {
  console.log('Reaction added:', event);
});
```

## Plugin Integration

Use as a RANA plugin for automatic integration:

```typescript
import { createRana } from '@rana/core';
import { slackPlugin } from '@rana/core/plugins/slack';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  plugins: [
    slackPlugin({
      botToken: process.env.SLACK_BOT_TOKEN!,
      autoReply: true, // Automatically reply to messages
      autoThreadReplies: true,
      defaultModel: 'claude-3-5-sonnet-20241022',
    }),
  ],
});
```

## Rate Limiting

The plugin automatically handles Slack's rate limits:

- Default: 60 requests per minute
- Configurable via `maxRequestsPerMinute`
- Automatic queuing of excess requests
- Exponential backoff on errors

```typescript
const slack = createSlackPlugin({
  botToken: process.env.SLACK_BOT_TOKEN!,
  maxRequestsPerMinute: 30, // Custom limit
  retry: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000,
  },
});
```

## Error Handling

Built-in retry logic with exponential backoff:

```typescript
try {
  await slack.reply(channel, message);
} catch (error) {
  console.error('Failed to send message:', error);
  // Error is thrown after all retries exhausted
}
```

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import type {
  SlackConfig,
  SlackMessage,
  SlackCommand,
  SlackBlock,
  SlackAttachment,
  SlackInteraction,
  MessageHandler,
  CommandHandler,
  InteractionHandler,
} from '@rana/core/plugins/slack';
```

## Best Practices

1. **Use threads** for conversations to keep channels organized
2. **Track context** per user for coherent conversations
3. **Limit history** to avoid context window issues (keep last 10-20 messages)
4. **Use reactions** for quick feedback (processing, success, error)
5. **Handle errors gracefully** with user-friendly messages
6. **Rate limit** to avoid API throttling
7. **Use Block Kit** for rich, interactive messages

## Examples

See `slack.example.ts` for comprehensive examples including:
- Basic setup
- Slash commands
- Interactive components
- Conversation history
- Rich messages with Block Kit
- Plugin integration
- Rate limiting
- Multi-provider strategies

## License

MIT
