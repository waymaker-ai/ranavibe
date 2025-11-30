/**
 * Discord Plugin Example Usage
 *
 * This example demonstrates how to use the Discord plugin with RANA.
 * Note: This requires a real Discord bot token to run in production.
 */

import { createRana } from '../client';
import { DiscordPlugin } from './discord';

async function main() {
  // ============================================================================
  // 1. Initialize RANA
  // ============================================================================

  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY!,
      anthropic: process.env.ANTHROPIC_API_KEY!,
    },
    defaults: {
      provider: 'openai',
      model: 'gpt-4o-mini',
    },
  });

  // ============================================================================
  // 2. Create Discord Plugin
  // ============================================================================

  const discord = new DiscordPlugin({
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
    guildId: process.env.DISCORD_GUILD_ID, // Optional, for development
    defaultModel: 'gpt-4o-mini',
    rateLimit: {
      messagesPerMinute: 10,
      messagesPerUser: 5,
      commandsPerMinute: 20,
      enabled: true,
    },
    autoRespondToMentions: true,
    enableThreads: true,
  });

  // ============================================================================
  // 3. Initialize Bot
  // ============================================================================

  await discord.createBot({
    intents: ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES', 'MESSAGE_CONTENT'],
    presence: {
      status: 'online',
      activity: 'Powered by RANA AI',
      activityType: 'PLAYING',
    },
  });

  // ============================================================================
  // 4. Register Message Handler (Basic AI Chat)
  // ============================================================================

  discord.onMessage(async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Only respond to direct messages or mentions
    const botMentioned = message.mentions.length > 0;
    if (!message.isDirectMessage && !botMentioned) return;

    console.log(`Received message from ${message.author.username}: ${message.content}`);

    try {
      // Get user context for conversation history
      const context = discord.getUserContext(
        message.author.id,
        message.channel.id,
        message.guild?.id
      );

      // Build messages array from history
      const messages = context.messageHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add current message
      messages.push({
        role: 'user' as const,
        content: message.content,
      });

      // Get AI response
      const response = await rana.chat({
        messages,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 500,
      });

      // Store assistant response in context
      context.messageHistory.push({
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      });

      // Send reply
      await discord.reply(message.channel, response.content);

      console.log(`✓ Sent response to ${message.author.username}`);
    } catch (error) {
      console.error('Error processing message:', error);
      await discord.reply(
        message.channel,
        'Sorry, I encountered an error processing your message.'
      );
    }
  });

  // ============================================================================
  // 5. Register Slash Commands
  // ============================================================================

  // Register commands with Discord
  await discord.registerCommands([
    {
      name: 'ask',
      description: 'Ask the AI a question',
      options: [
        {
          name: 'question',
          description: 'Your question for the AI',
          type: 'STRING',
          required: true,
        },
        {
          name: 'model',
          description: 'AI model to use',
          type: 'STRING',
          required: false,
          choices: [
            { name: 'GPT-4o', value: 'gpt-4o' },
            { name: 'GPT-4o Mini', value: 'gpt-4o-mini' },
            { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
          ],
        },
      ],
    },
    {
      name: 'clear',
      description: 'Clear your conversation history',
    },
    {
      name: 'stats',
      description: 'Show bot statistics',
    },
  ]);

  // Handle /ask command
  discord.onCommand('ask', async (interaction) => {
    const question = interaction.options.get('question')?.value as string;
    const model = (interaction.options.get('model')?.value as string) || 'gpt-4o-mini';

    await interaction.deferReply();

    try {
      const response = await rana.chat({
        messages: [{ role: 'user', content: question }],
        model: model as any,
      });

      // Create rich embed for response
      const embed = DiscordPlugin.formatAsEmbed(response.content, {
        title: '🤖 AI Response',
        color: 0x00AE86,
        footer: `Model: ${model} | Tokens: ${response.usage.total_tokens} | Cost: $${response.cost.total_cost.toFixed(4)}`,
        timestamp: true,
      });

      await interaction.followUp(embed as any);
    } catch (error) {
      console.error('Error processing command:', error);
      await interaction.followUp('Sorry, I encountered an error processing your question.');
    }
  });

  // Handle /clear command
  discord.onCommand('clear', async (interaction) => {
    discord.clearUserContext(
      interaction.user.id,
      interaction.channel.id,
      interaction.guild?.id
    );

    await interaction.reply('✓ Your conversation history has been cleared.');
  });

  // Handle /stats command
  discord.onCommand('stats', async (interaction) => {
    const stats = discord.getStats();
    const rateLimitInfo = discord.getRateLimitInfo(
      interaction.channel.id,
      interaction.user.id
    );

    const embed = DiscordPlugin.formatAsEmbed('', {
      title: '📊 Bot Statistics',
      color: 0x5865F2,
    });

    embed.fields = [
      {
        name: 'Status',
        value: stats.bot.ready ? '✅ Online' : '❌ Offline',
        inline: true,
      },
      {
        name: 'Active Contexts',
        value: stats.contexts.totalContexts.toString(),
        inline: true,
      },
      {
        name: 'Avg History Length',
        value: stats.contexts.averageHistoryLength.toFixed(1),
        inline: true,
      },
      {
        name: 'Rate Limits',
        value: [
          `Channel: ${rateLimitInfo.channelRemaining} remaining`,
          `User: ${rateLimitInfo.userRemaining} remaining`,
          `Commands: ${rateLimitInfo.commandRemaining} remaining`,
        ].join('\n'),
        inline: false,
      },
    ];

    await interaction.reply(embed as any);
  });

  // ============================================================================
  // 6. Advanced: Rich Embeds with Buttons
  // ============================================================================

  discord.onCommand('help', async (interaction) => {
    const embed = DiscordPlugin.formatAsEmbed('', {
      title: '🤖 RANA AI Bot Help',
      color: 0x00AE86,
    });

    embed.fields = [
      {
        name: '💬 Message Commands',
        value: '• Mention me or DM me to chat\n• I remember conversation history',
        inline: false,
      },
      {
        name: '⚡ Slash Commands',
        value: [
          '• `/ask` - Ask a question',
          '• `/clear` - Clear your history',
          '• `/stats` - View bot statistics',
          '• `/help` - Show this help',
        ].join('\n'),
        inline: false,
      },
      {
        name: '🎯 Features',
        value: [
          '✓ Multi-model AI support',
          '✓ Conversation memory',
          '✓ Rate limiting',
          '✓ Thread support',
        ].join('\n'),
        inline: false,
      },
    ];

    await interaction.reply(embed as any);
  });

  // ============================================================================
  // 7. Example: Creating Threads for Long Conversations
  // ============================================================================

  discord.onMessage(async (message) => {
    // Create a thread for complex questions
    if (message.content.toLowerCase().includes('explain in detail')) {
      const threadId = await discord.createThread(
        message.channel,
        message.id,
        `Discussion: ${message.content.substring(0, 50)}...`
      );
      console.log(`Created thread: ${threadId}`);
    }
  });

  // ============================================================================
  // 8. Graceful Shutdown
  // ============================================================================

  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await discord.shutdown();
    process.exit(0);
  });

  console.log('✓ Discord bot is running!');
  console.log('Press Ctrl+C to stop.');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };
