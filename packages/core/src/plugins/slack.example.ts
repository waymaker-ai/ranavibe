/**
 * Slack Plugin Examples
 *
 * This file demonstrates how to use the Slack plugin with RANA
 */

import { createRana } from '../client';
import { createSlackPlugin, slackPlugin } from './slack';
import type { SlackMessage, SlackCommand } from './slack';

// ============================================================================
// Example 1: Basic Setup
// ============================================================================

async function basicSetup() {
  // Create RANA client
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
    appToken: process.env.SLACK_APP_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    defaultModel: 'claude-3-5-sonnet-20241022',
  });

  // Handle messages
  slack.onMessage(async (message: SlackMessage) => {
    console.log('Received message:', message.text);

    // Use RANA to generate response
    const response = await rana.chat(message.text);

    // Reply in Slack
    await slack.reply(message.channel, response.content, {
      thread_ts: message.thread_ts || message.ts, // Reply in thread
    });
  });

  // Start the bot
  await slack.start();
}

// ============================================================================
// Example 2: Slash Commands
// ============================================================================

async function slashCommands() {
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
  });

  const slack = createSlackPlugin({
    botToken: process.env.SLACK_BOT_TOKEN!,
  });

  // Handle /ask command
  slack.onCommand('ask', async (command: SlackCommand) => {
    const response = await rana.chat(command.text);
    return response.content;
  });

  // Handle /summarize command with cost optimization
  slack.onCommand('summarize', async (command: SlackCommand) => {
    const response = await rana.chat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `Summarize this: ${command.text}` }],
      optimize: 'cost',
    });

    return `Summary: ${response.content}\n\nCost: $${response.cost.total_cost.toFixed(6)}`;
  });

  await slack.start();
}

// ============================================================================
// Example 3: Interactive Components (Buttons)
// ============================================================================

async function interactiveComponents() {
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
  });

  const slack = createSlackPlugin({
    botToken: process.env.SLACK_BOT_TOKEN!,
  });

  // Send message with buttons
  slack.onMessage(async (message: SlackMessage) => {
    if (message.text.toLowerCase().includes('options')) {
      await slack.reply(message.channel, {
        text: 'Choose an AI model:',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Choose an AI model:*',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Claude (Quality)',
                  emoji: true,
                },
                action_id: 'select_claude',
                value: 'claude',
                style: 'primary',
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'GPT-4 (Speed)',
                  emoji: true,
                },
                action_id: 'select_gpt4',
                value: 'gpt4',
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'GPT-3.5 (Cost)',
                  emoji: true,
                },
                action_id: 'select_gpt35',
                value: 'gpt35',
              },
            ],
          },
        ],
      });
    }
  });

  // Handle button interactions
  slack.onInteraction(async (interaction) => {
    if (interaction.type === 'block_actions' && interaction.actions) {
      const action = interaction.actions[0];
      const modelName = action.value;

      // Store user preference
      slack.setUserContext(interaction.user.id, {
        preferredModel: modelName,
      });

      // Acknowledge the selection
      if (interaction.channel && interaction.message) {
        await slack.reply(
          interaction.channel.id,
          `Got it! You selected ${modelName}. I'll use that for your requests.`
        );
      }
    }
  });

  await slack.start();
}

// ============================================================================
// Example 4: User Context & Conversation History
// ============================================================================

async function conversationHistory() {
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
  });

  const slack = createSlackPlugin({
    botToken: process.env.SLACK_BOT_TOKEN!,
    autoThreadReplies: true, // Automatically reply in threads
  });

  slack.onMessage(async (message: SlackMessage) => {
    // Get or create conversation history
    let context = slack.getUserContext(message.user) || {
      messages: [],
    };

    // Add user message
    context.messages.push({
      role: 'user',
      content: message.text,
    });

    // Keep only last 10 messages to stay within context limits
    if (context.messages.length > 10) {
      context.messages = context.messages.slice(-10);
    }

    // Get response with conversation history
    const response = await rana.chat({
      messages: context.messages,
      max_tokens: 1000,
    });

    // Add assistant response to history
    context.messages.push({
      role: 'assistant',
      content: response.content,
    });

    // Save context
    slack.setUserContext(message.user, context);

    // Reply in thread
    await slack.reply(message.channel, response.content, {
      thread_ts: message.thread_ts || message.ts,
    });
  });

  await slack.start();
}

// ============================================================================
// Example 5: Using Block Kit for Rich Messages
// ============================================================================

async function richMessages() {
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
  });

  const slack = createSlackPlugin({
    botToken: process.env.SLACK_BOT_TOKEN!,
  });

  slack.onMessage(async (message: SlackMessage) => {
    if (message.text.toLowerCase().includes('analyze')) {
      // Get AI analysis
      const response = await rana.chat(message.text);

      // Send rich formatted response using Block Kit
      const { SlackBot } = await import('./slack');

      await slack.reply(message.channel, {
        text: 'Analysis complete',
        blocks: [
          SlackBot.createHeader('Analysis Results'),
          SlackBot.createDivider(),
          SlackBot.createSection(`*Summary:*\n${response.content}`),
          SlackBot.createDivider(),
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Cost: $${response.cost.total_cost.toFixed(6)} | Tokens: ${response.usage.total_tokens} | Latency: ${response.latency_ms}ms`,
              },
            ],
          },
        ],
      });
    }
  });

  await slack.start();
}

// ============================================================================
// Example 6: Plugin Integration with RANA
// ============================================================================

async function pluginIntegration() {
  // Create RANA with Slack plugin integrated
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
    // Note: Plugin system would need to be implemented in RanaClient
    // This is a demonstration of how it would work
  });

  // Slack will automatically handle messages and integrate with RANA
  const plugin = slackPlugin({
    botToken: process.env.SLACK_BOT_TOKEN!,
    autoReply: true, // Auto-reply to all messages
    defaultModel: 'claude-3-5-sonnet-20241022',
    autoThreadReplies: true,
  });

  // Plugin will handle everything automatically
  console.log('Slack bot is running with auto-reply enabled');
}

// ============================================================================
// Example 7: Advanced Rate Limiting & Error Handling
// ============================================================================

async function advancedFeatures() {
  const slack = createSlackPlugin({
    botToken: process.env.SLACK_BOT_TOKEN!,
    maxRequestsPerMinute: 60, // Custom rate limit
    retry: {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 30000,
    },
  });

  slack.onMessage(async (message: SlackMessage) => {
    try {
      // Add reaction to show we're processing
      await slack.addReaction(message.channel, message.ts, 'hourglass');

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove processing reaction, add success
      await slack.addReaction(message.channel, message.ts, 'white_check_mark');

      await slack.reply(message.channel, 'Done!', {
        thread_ts: message.ts,
      });
    } catch (error) {
      console.error('Error processing message:', error);

      // Add error reaction
      await slack.addReaction(message.channel, message.ts, 'x');
    }
  });

  await slack.start();
}

// ============================================================================
// Example 8: Multi-Provider Strategy
// ============================================================================

async function multiProvider() {
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
    },
    fallback: {
      order: ['anthropic', 'openai'],
      maxRetries: 2,
    },
  });

  const slack = createSlackPlugin({
    botToken: process.env.SLACK_BOT_TOKEN!,
  });

  slack.onCommand('ask', async (command: SlackCommand) => {
    // Determine which model to use based on command text
    let provider: 'anthropic' | 'openai' = 'anthropic';
    let optimize: 'cost' | 'speed' | 'quality' = 'quality';

    if (command.text.includes('--fast')) {
      provider = 'openai';
      optimize = 'speed';
    } else if (command.text.includes('--cheap')) {
      provider = 'openai';
      optimize = 'cost';
    } else if (command.text.includes('--quality')) {
      provider = 'anthropic';
      optimize = 'quality';
    }

    // Clean up the text
    const cleanText = command.text
      .replace(/--fast|--cheap|--quality/g, '')
      .trim();

    // Get response with fallback support
    const response = await rana.chat({
      provider,
      optimize,
      messages: [{ role: 'user', content: cleanText }],
    });

    return `${response.content}\n\n_Provider: ${response.provider} | Model: ${response.model} | Cost: $${response.cost.total_cost.toFixed(6)}_`;
  });

  await slack.start();
}

// ============================================================================
// Export examples
// ============================================================================

export {
  basicSetup,
  slashCommands,
  interactiveComponents,
  conversationHistory,
  richMessages,
  pluginIntegration,
  advancedFeatures,
  multiProvider,
};
