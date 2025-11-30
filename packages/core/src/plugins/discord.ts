/**
 * Discord Integration Plugin for RANA
 *
 * Provides a complete Discord bot integration with:
 * - Message handling (DMs, mentions, channels)
 * - Thread support
 * - Slash commands
 * - Button interactions
 * - Rich embed messages
 * - User context tracking
 * - Rate limiting
 * - Presence management
 *
 * @example
 * ```typescript
 * import { createRana } from '@rana/core';
 * import { DiscordPlugin } from '@rana/core/plugins/discord';
 *
 * const discord = new DiscordPlugin({
 *   token: process.env.DISCORD_TOKEN!,
 *   clientId: process.env.DISCORD_CLIENT_ID!,
 *   defaultModel: 'gpt-4o-mini',
 *   rateLimit: {
 *     messagesPerMinute: 10,
 *     messagesPerUser: 5
 *   }
 * });
 *
 * const rana = createRana({
 *   providers: {
 *     openai: process.env.OPENAI_API_KEY
 *   }
 * });
 *
 * // Create bot and setup handlers
 * discord.createBot({
 *   intents: ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES'],
 *   presence: {
 *     status: 'online',
 *     activity: 'Powered by RANA'
 *   }
 * });
 *
 * // Handle messages
 * discord.onMessage(async (message) => {
 *   const response = await rana.chat({
 *     messages: [{ role: 'user', content: message.content }],
 *     model: 'gpt-4o-mini'
 *   });
 *   await discord.reply(message.channel, response.content);
 * });
 *
 * // Handle slash commands
 * discord.onCommand('ask', async (interaction) => {
 *   const question = interaction.options.get('question');
 *   const response = await rana.chat(question.value);
 *   await interaction.reply(response.content);
 * });
 * ```
 */

import { definePlugin } from './helpers';
import type { RanaPlugin, RanaChatRequest, LLMModel } from '../types';

// ============================================================================
// Types
// ============================================================================

export type DiscordIntentFlag =
  | 'GUILDS'
  | 'GUILD_MEMBERS'
  | 'GUILD_MESSAGES'
  | 'GUILD_MESSAGE_REACTIONS'
  | 'DIRECT_MESSAGES'
  | 'MESSAGE_CONTENT';

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

export type ActivityType = 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING' | 'CUSTOM' | 'COMPETING';

export interface DiscordPresence {
  status: PresenceStatus;
  activity?: string;
  activityType?: ActivityType;
}

export interface DiscordBotConfig {
  intents?: DiscordIntentFlag[];
  presence?: DiscordPresence;
  autoReconnect?: boolean;
}

export interface DiscordRateLimitConfig {
  messagesPerMinute?: number;
  messagesPerUser?: number;
  commandsPerMinute?: number;
  enabled?: boolean;
}

export interface DiscordPluginConfig {
  /** Discord bot token */
  token: string;
  /** Discord application client ID */
  clientId: string;
  /** Guild ID (optional, for development/testing) */
  guildId?: string;
  /** Default model to use for responses */
  defaultModel?: LLMModel;
  /** Rate limiting configuration */
  rateLimit?: DiscordRateLimitConfig;
  /** Auto-respond to mentions */
  autoRespondToMentions?: boolean;
  /** Max message length (Discord limit is 2000) */
  maxMessageLength?: number;
  /** Enable thread support */
  enableThreads?: boolean;
}

export interface DiscordMessage {
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
  referencedMessage?: {
    id: string;
    content: string;
  };
}

export interface DiscordChannel {
  id: string;
  name?: string;
  type: 'text' | 'dm' | 'thread' | 'voice' | 'category';
}

export interface DiscordInteraction {
  id: string;
  type: 'COMMAND' | 'BUTTON' | 'SELECT_MENU';
  commandName?: string;
  customId?: string;
  user: {
    id: string;
    username: string;
  };
  channel: DiscordChannel;
  guild?: {
    id: string;
    name: string;
  };
  options: Map<string, DiscordInteractionOption>;
  reply: (content: string | DiscordEmbed) => Promise<void>;
  deferReply: () => Promise<void>;
  followUp: (content: string | DiscordEmbed) => Promise<void>;
}

export interface DiscordInteractionOption {
  name: string;
  type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' | 'ROLE';
  value: string | number | boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    iconUrl?: string;
  };
  timestamp?: Date;
  author?: {
    name: string;
    iconUrl?: string;
    url?: string;
  };
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  url?: string;
}

export interface DiscordButton {
  customId: string;
  label: string;
  style: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER' | 'LINK';
  emoji?: string;
  url?: string;
  disabled?: boolean;
}

export interface DiscordSlashCommand {
  name: string;
  description: string;
  options?: Array<{
    name: string;
    description: string;
    type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' | 'ROLE';
    required?: boolean;
    choices?: Array<{
      name: string;
      value: string | number;
    }>;
  }>;
}

// Message handler type
export type DiscordMessageHandler = (message: DiscordMessage) => void | Promise<void>;
export type DiscordCommandHandler = (interaction: DiscordInteraction) => void | Promise<void>;
export type DiscordButtonHandler = (interaction: DiscordInteraction) => void | Promise<void>;

// ============================================================================
// User Context Tracking
// ============================================================================

interface UserContext {
  userId: string;
  guildId?: string;
  channelId: string;
  messageHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  metadata: Record<string, any>;
  lastInteraction: Date;
}

class ContextManager {
  private contexts = new Map<string, UserContext>();
  private maxHistoryLength = 20;
  private contextTTL = 1000 * 60 * 60; // 1 hour

  private getContextKey(userId: string, channelId: string, guildId?: string): string {
    return `${userId}:${guildId || 'dm'}:${channelId}`;
  }

  getContext(userId: string, channelId: string, guildId?: string): UserContext {
    const key = this.getContextKey(userId, channelId, guildId);
    const existing = this.contexts.get(key);

    if (existing) {
      // Check if context has expired
      if (Date.now() - existing.lastInteraction.getTime() > this.contextTTL) {
        this.contexts.delete(key);
      } else {
        return existing;
      }
    }

    // Create new context
    const context: UserContext = {
      userId,
      guildId,
      channelId,
      messageHistory: [],
      metadata: {},
      lastInteraction: new Date(),
    };
    this.contexts.set(key, context);
    return context;
  }

  addMessage(userId: string, channelId: string, role: 'user' | 'assistant', content: string, guildId?: string): void {
    const context = this.getContext(userId, channelId, guildId);
    context.messageHistory.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Keep only recent messages
    if (context.messageHistory.length > this.maxHistoryLength) {
      context.messageHistory = context.messageHistory.slice(-this.maxHistoryLength);
    }

    context.lastInteraction = new Date();
  }

  clearContext(userId: string, channelId: string, guildId?: string): void {
    const key = this.getContextKey(userId, channelId, guildId);
    this.contexts.delete(key);
  }

  getContextStats(): { totalContexts: number; averageHistoryLength: number } {
    const contexts = Array.from(this.contexts.values());
    const avgHistory = contexts.length > 0
      ? contexts.reduce((sum, ctx) => sum + ctx.messageHistory.length, 0) / contexts.length
      : 0;

    return {
      totalContexts: contexts.length,
      averageHistoryLength: Math.round(avgHistory * 100) / 100,
    };
  }
}

// ============================================================================
// Rate Limiter
// ============================================================================

class DiscordRateLimiter {
  private messageTimestamps = new Map<string, number[]>();
  private userMessageTimestamps = new Map<string, number[]>();
  private commandTimestamps: number[] = [];
  private config: Required<DiscordRateLimitConfig>;

  constructor(config: DiscordRateLimitConfig = {}) {
    this.config = {
      messagesPerMinute: config.messagesPerMinute ?? 60,
      messagesPerUser: config.messagesPerUser ?? 10,
      commandsPerMinute: config.commandsPerMinute ?? 30,
      enabled: config.enabled ?? true,
    };
  }

  private cleanOldTimestamps(timestamps: number[], windowMs: number = 60000): number[] {
    const now = Date.now();
    return timestamps.filter(ts => now - ts < windowMs);
  }

  canSendMessage(channelId: string): boolean {
    if (!this.config.enabled) return true;

    const timestamps = this.messageTimestamps.get(channelId) || [];
    const cleaned = this.cleanOldTimestamps(timestamps);
    this.messageTimestamps.set(channelId, cleaned);

    return cleaned.length < this.config.messagesPerMinute;
  }

  canUserSendMessage(userId: string): boolean {
    if (!this.config.enabled) return true;

    const timestamps = this.userMessageTimestamps.get(userId) || [];
    const cleaned = this.cleanOldTimestamps(timestamps);
    this.userMessageTimestamps.set(userId, cleaned);

    return cleaned.length < this.config.messagesPerUser;
  }

  canExecuteCommand(): boolean {
    if (!this.config.enabled) return true;

    this.commandTimestamps = this.cleanOldTimestamps(this.commandTimestamps);
    return this.commandTimestamps.length < this.config.commandsPerMinute;
  }

  recordMessage(channelId: string, userId: string): void {
    if (!this.config.enabled) return;

    const now = Date.now();

    // Record channel message
    const channelTs = this.messageTimestamps.get(channelId) || [];
    channelTs.push(now);
    this.messageTimestamps.set(channelId, channelTs);

    // Record user message
    const userTs = this.userMessageTimestamps.get(userId) || [];
    userTs.push(now);
    this.userMessageTimestamps.set(userId, userTs);
  }

  recordCommand(): void {
    if (!this.config.enabled) return;
    this.commandTimestamps.push(Date.now());
  }

  getRateLimitInfo(channelId: string, userId: string): {
    channelRemaining: number;
    userRemaining: number;
    commandRemaining: number;
  } {
    const channelTs = this.cleanOldTimestamps(this.messageTimestamps.get(channelId) || []);
    const userTs = this.cleanOldTimestamps(this.userMessageTimestamps.get(userId) || []);
    const commandTs = this.cleanOldTimestamps(this.commandTimestamps);

    return {
      channelRemaining: Math.max(0, this.config.messagesPerMinute - channelTs.length),
      userRemaining: Math.max(0, this.config.messagesPerUser - userTs.length),
      commandRemaining: Math.max(0, this.config.commandsPerMinute - commandTs.length),
    };
  }
}

// ============================================================================
// Mock Discord Bot Client (Interface for actual Discord.js integration)
// ============================================================================

/**
 * This is a mock implementation that provides the interface.
 * In production, this would wrap Discord.js or another Discord library.
 *
 * To use with real Discord:
 * 1. npm install discord.js
 * 2. Replace MockDiscordBot with actual Discord.js Client
 * 3. Map Discord.js events to RANA handlers
 */
class MockDiscordBot {
  private config: DiscordBotConfig;
  private token: string;
  private messageHandlers: DiscordMessageHandler[] = [];
  private commandHandlers = new Map<string, DiscordCommandHandler>();
  private buttonHandlers = new Map<string, DiscordButtonHandler>();
  private ready = false;

  constructor(token: string, config: DiscordBotConfig) {
    this.token = token;
    this.config = config;
  }

  async login(): Promise<void> {
    // In production: await client.login(this.token);
    console.log('[Discord] Bot login simulated (use discord.js in production)');
    this.ready = true;
  }

  async logout(): Promise<void> {
    // In production: await client.destroy();
    console.log('[Discord] Bot logout simulated');
    this.ready = false;
  }

  isReady(): boolean {
    return this.ready;
  }

  onMessage(handler: DiscordMessageHandler): void {
    this.messageHandlers.push(handler);
  }

  onCommand(name: string, handler: DiscordCommandHandler): void {
    this.commandHandlers.set(name, handler);
  }

  onButton(customId: string, handler: DiscordButtonHandler): void {
    this.buttonHandlers.set(customId, handler);
  }

  async sendMessage(channelId: string, content: string): Promise<void> {
    // In production: await channel.send(content);
    console.log(`[Discord] Send to ${channelId}: ${content.substring(0, 100)}`);
  }

  async sendEmbed(channelId: string, embed: DiscordEmbed): Promise<void> {
    // In production: await channel.send({ embeds: [embed] });
    console.log(`[Discord] Send embed to ${channelId}:`, embed.title || 'Untitled');
  }

  async sendMessageWithButtons(
    channelId: string,
    content: string,
    buttons: DiscordButton[]
  ): Promise<void> {
    // In production: await channel.send({ content, components: [row] });
    console.log(`[Discord] Send message with ${buttons.length} buttons to ${channelId}`);
  }

  async createThread(channelId: string, messageId: string, name: string): Promise<string> {
    // In production: const thread = await message.startThread({ name });
    console.log(`[Discord] Create thread "${name}" in ${channelId}`);
    return `thread-${Date.now()}`;
  }

  async setPresence(presence: DiscordPresence): Promise<void> {
    // In production: client.user.setPresence({ ... });
    console.log(`[Discord] Set presence:`, presence);
  }

  async registerSlashCommand(command: DiscordSlashCommand, guildId?: string): Promise<void> {
    // In production: await client.application.commands.create(command, guildId);
    console.log(`[Discord] Register command "${command.name}"${guildId ? ` in guild ${guildId}` : ' globally'}`);
  }

  async registerSlashCommands(commands: DiscordSlashCommand[], guildId?: string): Promise<void> {
    for (const command of commands) {
      await this.registerSlashCommand(command, guildId);
    }
  }

  // Simulate incoming message (for testing)
  simulateMessage(message: Partial<DiscordMessage>): void {
    const fullMessage: DiscordMessage = {
      id: message.id || `msg-${Date.now()}`,
      content: message.content || '',
      author: message.author || { id: 'user-123', username: 'TestUser', bot: false },
      channel: message.channel || { id: 'channel-123', type: 'text' },
      mentions: message.mentions || [],
      timestamp: message.timestamp || new Date(),
      isDirectMessage: message.isDirectMessage ?? false,
      isThread: message.isThread ?? false,
      guild: message.guild,
      threadId: message.threadId,
      referencedMessage: message.referencedMessage,
    };

    this.messageHandlers.forEach(handler => handler(fullMessage));
  }
}

// ============================================================================
// Discord Plugin Implementation
// ============================================================================

export class DiscordPlugin {
  private config: DiscordPluginConfig;
  private bot: MockDiscordBot | null = null;
  private contextManager = new ContextManager();
  private rateLimiter: DiscordRateLimiter;
  private messageHandlers: DiscordMessageHandler[] = [];
  private commandHandlers = new Map<string, DiscordCommandHandler>();
  private buttonHandlers = new Map<string, DiscordButtonHandler>();
  private botUserId?: string;

  constructor(config: DiscordPluginConfig) {
    this.config = {
      maxMessageLength: 2000,
      autoRespondToMentions: true,
      enableThreads: true,
      ...config,
    };
    this.rateLimiter = new DiscordRateLimiter(config.rateLimit);
  }

  /**
   * Create and initialize the Discord bot
   */
  async createBot(config: DiscordBotConfig = {}): Promise<void> {
    const botConfig: DiscordBotConfig = {
      intents: config.intents || ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES', 'MESSAGE_CONTENT'],
      presence: config.presence || {
        status: 'online',
        activity: 'Powered by RANA',
        activityType: 'PLAYING',
      },
      autoReconnect: config.autoReconnect ?? true,
    };

    this.bot = new MockDiscordBot(this.config.token, botConfig);

    // Setup internal message handler
    this.bot.onMessage(async (message) => {
      await this.handleIncomingMessage(message);
    });

    await this.bot.login();

    if (botConfig.presence) {
      await this.bot.setPresence(botConfig.presence);
    }

    console.log('[RANA Discord] Bot initialized successfully');
  }

  /**
   * Register a message handler
   */
  onMessage(handler: DiscordMessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Register a slash command handler
   */
  onCommand(name: string, handler: DiscordCommandHandler): void {
    this.commandHandlers.set(name, handler);
    if (this.bot) {
      this.bot.onCommand(name, async (interaction) => {
        if (!this.rateLimiter.canExecuteCommand()) {
          await interaction.reply('Rate limit exceeded. Please try again later.');
          return;
        }
        this.rateLimiter.recordCommand();
        await handler(interaction);
      });
    }
  }

  /**
   * Register a button interaction handler
   */
  onButton(customId: string, handler: DiscordButtonHandler): void {
    this.buttonHandlers.set(customId, handler);
    if (this.bot) {
      this.bot.onButton(customId, handler);
    }
  }

  /**
   * Send a reply to a channel
   */
  async reply(channel: DiscordChannel | string, message: string): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot not initialized. Call createBot() first.');
    }

    const channelId = typeof channel === 'string' ? channel : channel.id;

    if (!this.rateLimiter.canSendMessage(channelId)) {
      console.warn(`[RANA Discord] Rate limit exceeded for channel ${channelId}`);
      return;
    }

    // Split long messages
    const chunks = this.splitMessage(message);
    for (const chunk of chunks) {
      await this.bot.sendMessage(channelId, chunk);
      this.rateLimiter.recordMessage(channelId, 'bot');
    }
  }

  /**
   * Send a rich embed message
   */
  async sendEmbed(channel: DiscordChannel | string, embed: DiscordEmbed): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot not initialized. Call createBot() first.');
    }

    const channelId = typeof channel === 'string' ? channel : channel.id;

    if (!this.rateLimiter.canSendMessage(channelId)) {
      console.warn(`[RANA Discord] Rate limit exceeded for channel ${channelId}`);
      return;
    }

    await this.bot.sendEmbed(channelId, embed);
    this.rateLimiter.recordMessage(channelId, 'bot');
  }

  /**
   * Send a message with interactive buttons
   */
  async sendWithButtons(
    channel: DiscordChannel | string,
    content: string,
    buttons: DiscordButton[]
  ): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot not initialized. Call createBot() first.');
    }

    const channelId = typeof channel === 'string' ? channel : channel.id;

    if (!this.rateLimiter.canSendMessage(channelId)) {
      console.warn(`[RANA Discord] Rate limit exceeded for channel ${channelId}`);
      return;
    }

    await this.bot.sendMessageWithButtons(channelId, content, buttons);
    this.rateLimiter.recordMessage(channelId, 'bot');
  }

  /**
   * Create a thread from a message
   */
  async createThread(
    channel: DiscordChannel | string,
    messageId: string,
    name: string
  ): Promise<string> {
    if (!this.bot) {
      throw new Error('Bot not initialized. Call createBot() first.');
    }

    const channelId = typeof channel === 'string' ? channel : channel.id;
    return await this.bot.createThread(channelId, messageId, name);
  }

  /**
   * Update bot presence/status
   */
  async setPresence(presence: DiscordPresence): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot not initialized. Call createBot() first.');
    }

    await this.bot.setPresence(presence);
  }

  /**
   * Register slash commands with Discord
   */
  async registerCommands(commands: DiscordSlashCommand[]): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot not initialized. Call createBot() first.');
    }

    await this.bot.registerSlashCommands(commands, this.config.guildId);
  }

  /**
   * Get user conversation context
   */
  getUserContext(userId: string, channelId: string, guildId?: string): UserContext {
    return this.contextManager.getContext(userId, channelId, guildId);
  }

  /**
   * Clear user conversation context
   */
  clearUserContext(userId: string, channelId: string, guildId?: string): void {
    this.contextManager.clearContext(userId, channelId, guildId);
  }

  /**
   * Get rate limit info for a channel/user
   */
  getRateLimitInfo(channelId: string, userId: string): {
    channelRemaining: number;
    userRemaining: number;
    commandRemaining: number;
  } {
    return this.rateLimiter.getRateLimitInfo(channelId, userId);
  }

  /**
   * Get plugin statistics
   */
  getStats(): {
    contexts: { totalContexts: number; averageHistoryLength: number };
    bot: { ready: boolean };
  } {
    return {
      contexts: this.contextManager.getContextStats(),
      bot: {
        ready: this.bot?.isReady() ?? false,
      },
    };
  }

  /**
   * Shutdown the bot gracefully
   */
  async shutdown(): Promise<void> {
    if (this.bot) {
      await this.bot.logout();
      this.bot = null;
    }
  }

  // ============================================================================
  // Internal Methods
  // ============================================================================

  private async handleIncomingMessage(message: DiscordMessage): Promise<void> {
    // Ignore bot messages
    if (message.author.bot) {
      return;
    }

    // Check user rate limit
    if (!this.rateLimiter.canUserSendMessage(message.author.id)) {
      await this.reply(message.channel, 'You are sending messages too quickly. Please slow down.');
      return;
    }

    this.rateLimiter.recordMessage(message.channel.id, message.author.id);

    // Store message in context
    this.contextManager.addMessage(
      message.author.id,
      message.channel.id,
      'user',
      message.content,
      message.guild?.id
    );

    // Call registered handlers
    for (const handler of this.messageHandlers) {
      try {
        await handler(message);
      } catch (error) {
        console.error('[RANA Discord] Error in message handler:', error);
      }
    }
  }

  private splitMessage(message: string, maxLength: number = 2000): string[] {
    if (message.length <= maxLength) {
      return [message];
    }

    const chunks: string[] = [];
    let remaining = message;

    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }

      // Try to split at a newline
      let splitIndex = remaining.lastIndexOf('\n', maxLength);
      if (splitIndex === -1 || splitIndex < maxLength / 2) {
        // Try to split at a space
        splitIndex = remaining.lastIndexOf(' ', maxLength);
      }
      if (splitIndex === -1 || splitIndex < maxLength / 2) {
        // Force split at maxLength
        splitIndex = maxLength;
      }

      chunks.push(remaining.substring(0, splitIndex));
      remaining = remaining.substring(splitIndex).trim();
    }

    return chunks;
  }

  /**
   * Helper to format RANA response as Discord embed
   */
  static formatAsEmbed(
    content: string,
    options: {
      title?: string;
      color?: number;
      footer?: string;
      timestamp?: boolean;
    } = {}
  ): DiscordEmbed {
    return {
      title: options.title,
      description: content.substring(0, 4096), // Discord embed description limit
      color: options.color ?? 0x5865F2, // Discord blurple
      footer: options.footer ? { text: options.footer } : undefined,
      timestamp: options.timestamp ? new Date() : undefined,
    };
  }

  /**
   * Helper to create a slash command definition
   */
  static createCommand(
    name: string,
    description: string,
    options: Array<{
      name: string;
      description: string;
      type: 'STRING' | 'INTEGER' | 'BOOLEAN';
      required?: boolean;
    }> = []
  ): DiscordSlashCommand {
    return {
      name,
      description,
      options,
    };
  }
}

// ============================================================================
// Plugin Export
// ============================================================================

/**
 * Create a RANA plugin from Discord plugin instance
 */
export function createDiscordPlugin(discord: DiscordPlugin): RanaPlugin {
  return definePlugin({
    name: 'discord',
    version: '1.0.0',

    async onInit(config) {
      console.log('[RANA Discord Plugin] Initialized');
    },

    async onDestroy() {
      await discord.shutdown();
      console.log('[RANA Discord Plugin] Destroyed');
    },
  });
}

// Export for convenience
export default DiscordPlugin;
