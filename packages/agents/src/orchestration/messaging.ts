/**
 * Agent-to-Agent Messaging Protocol
 *
 * Enhanced messaging system for agent communication with:
 * - Typed message channels
 * - Request/response patterns
 * - Pub/sub for broadcasts
 * - Message queuing with priorities
 * - Acknowledgment and delivery guarantees
 * - Message routing and filtering
 *
 * @example
 * ```typescript
 * import { MessageBroker, createChannel } from '@ranavibe/agents';
 *
 * const broker = new MessageBroker();
 *
 * // Create typed channels
 * const taskChannel = createChannel<TaskMessage>('tasks');
 * const eventChannel = createChannel<EventMessage>('events');
 *
 * // Subscribe to messages
 * broker.subscribe('agent-1', 'tasks', async (msg) => {
 *   console.log('Received task:', msg);
 *   return { status: 'completed' };
 * });
 *
 * // Send with acknowledgment
 * const ack = await broker.send('agent-2', 'tasks', {
 *   type: 'request',
 *   payload: { action: 'analyze', data: {} },
 * });
 * ```
 */

import type {
  AgentMessage,
  MessageType,
  MessagePriority,
  OrchestratorEvent,
  EventHandler,
} from './types';

// ============================================================================
// Enhanced Message Types
// ============================================================================

export interface TypedMessage<T = unknown> {
  id: string;
  channel: string;
  type: MessageType;
  from: string;
  to: string | string[] | '*';
  payload: T;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
  priority: MessagePriority;
  ttl?: number;
  headers?: MessageHeaders;
  metadata?: MessageMetadata;
}

export interface MessageHeaders {
  contentType?: string;
  encoding?: string;
  compression?: string;
  traceId?: string;
  spanId?: string;
  custom?: Record<string, string>;
}

export interface MessageMetadata {
  retryCount?: number;
  originalTimestamp?: Date;
  deliveredAt?: Date;
  processedAt?: Date;
  acknowledgedAt?: Date;
  routedVia?: string[];
}

export interface MessageEnvelope<T = unknown> {
  message: TypedMessage<T>;
  deliveryId: string;
  attempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  status: DeliveryStatus;
}

export type DeliveryStatus =
  | 'pending'
  | 'in_flight'
  | 'delivered'
  | 'acknowledged'
  | 'rejected'
  | 'expired'
  | 'dead_letter';

export interface Acknowledgment {
  messageId: string;
  deliveryId: string;
  status: 'ack' | 'nack' | 'reject';
  timestamp: Date;
  response?: unknown;
  error?: string;
}

// ============================================================================
// Channel Types
// ============================================================================

export interface Channel<T = unknown> {
  name: string;
  type: ChannelType;
  schema?: ChannelSchema;
  options?: ChannelOptions;
}

export type ChannelType =
  | 'direct'      // Point-to-point
  | 'topic'       // Pub/sub with topic matching
  | 'fanout'      // Broadcast to all subscribers
  | 'request'     // Request/response pattern
  | 'stream';     // Streaming messages

export interface ChannelSchema {
  payloadType?: string;
  version?: string;
  validator?: (payload: unknown) => boolean;
}

export interface ChannelOptions {
  durable?: boolean;
  maxSize?: number;
  ttl?: number;
  retryPolicy?: RetryOptions;
  deadLetterChannel?: string;
}

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// ============================================================================
// Subscription Types
// ============================================================================

export interface Subscription<T = unknown> {
  id: string;
  agentId: string;
  channel: string;
  pattern?: string;
  filter?: MessageFilter<T>;
  handler: MessageHandler<T>;
  options?: SubscriptionOptions;
  createdAt: Date;
  status: 'active' | 'paused' | 'cancelled';
}

export type MessageHandler<T = unknown> = (
  message: TypedMessage<T>,
  context: HandlerContext
) => Promise<unknown | void>;

export interface HandlerContext {
  acknowledge: () => Promise<void>;
  reject: (reason?: string) => Promise<void>;
  requeue: () => Promise<void>;
  reply: <R>(response: R) => Promise<void>;
}

export interface MessageFilter<T = unknown> {
  types?: MessageType[];
  priorities?: MessagePriority[];
  fromAgents?: string[];
  predicate?: (message: TypedMessage<T>) => boolean;
}

export interface SubscriptionOptions {
  prefetch?: number;
  autoAck?: boolean;
  exclusive?: boolean;
  priority?: number;
}

// ============================================================================
// Router Types
// ============================================================================

export interface Route {
  id: string;
  source: string;
  destination: string | ((message: TypedMessage) => string);
  filter?: MessageFilter;
  transform?: MessageTransform;
  priority?: number;
}

export type MessageTransform = (message: TypedMessage) => TypedMessage;

export interface RoutingTable {
  routes: Route[];
  defaultRoute?: string;
}

// ============================================================================
// Message Broker Implementation
// ============================================================================

export class MessageBroker {
  private channels: Map<string, Channel> = new Map();
  private subscriptions: Map<string, Subscription[]> = new Map();
  private pendingMessages: Map<string, MessageEnvelope[]> = new Map();
  private messageLog: MessageEnvelope[] = [];
  private eventHandlers: Set<EventHandler> = new Set();
  private routes: Route[] = [];

  constructor(private options?: MessageBrokerOptions) {
    // Initialize default channels
    this.createChannel({ name: 'default', type: 'direct' });
    this.createChannel({ name: 'broadcast', type: 'fanout' });
    this.createChannel({ name: 'requests', type: 'request' });
  }

  // --------------------------------------------------------------------------
  // Channel Management
  // --------------------------------------------------------------------------

  createChannel<T = unknown>(config: Channel<T>): Channel<T> {
    if (this.channels.has(config.name)) {
      throw new Error(`Channel already exists: ${config.name}`);
    }

    this.channels.set(config.name, config);
    this.pendingMessages.set(config.name, []);

    this.emit({
      type: 'message_sent',
      message: {
        id: `channel_created_${config.name}`,
        type: 'notification',
        from: 'broker',
        to: '*',
        payload: { channel: config.name, type: config.type },
        timestamp: new Date(),
      },
    });

    return config;
  }

  getChannel(name: string): Channel | undefined {
    return this.channels.get(name);
  }

  deleteChannel(name: string): boolean {
    const channel = this.channels.get(name);
    if (!channel) return false;

    // Cancel all subscriptions
    const subs = this.subscriptions.get(name) || [];
    subs.forEach(sub => {
      sub.status = 'cancelled';
    });

    this.subscriptions.delete(name);
    this.pendingMessages.delete(name);
    this.channels.delete(name);

    return true;
  }

  // --------------------------------------------------------------------------
  // Messaging
  // --------------------------------------------------------------------------

  async send<T>(
    to: string | string[],
    channel: string,
    payload: T,
    options?: SendOptions
  ): Promise<Acknowledgment> {
    const channelConfig = this.channels.get(channel);
    if (!channelConfig) {
      throw new Error(`Channel not found: ${channel}`);
    }

    // Validate payload if schema exists
    if (channelConfig.schema?.validator) {
      if (!channelConfig.schema.validator(payload)) {
        throw new Error(`Invalid message payload for channel: ${channel}`);
      }
    }

    const message: TypedMessage<T> = {
      id: this.generateId(),
      channel,
      type: options?.type || 'request',
      from: options?.from || 'anonymous',
      to,
      payload,
      timestamp: new Date(),
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
      priority: options?.priority || 'normal',
      ttl: options?.ttl,
      headers: options?.headers,
      metadata: {},
    };

    const envelope: MessageEnvelope<T> = {
      message,
      deliveryId: this.generateId(),
      attempts: 0,
      status: 'pending',
    };

    // Apply routing
    const routed = this.applyRouting(message);

    // Deliver to subscribers
    const ack = await this.deliver(routed, envelope);

    // Store in log
    this.messageLog.push(envelope);
    if (this.messageLog.length > (this.options?.maxLogSize || 10000)) {
      this.messageLog.shift();
    }

    return ack;
  }

  async broadcast<T>(
    channel: string,
    payload: T,
    options?: Omit<SendOptions, 'to'>
  ): Promise<Acknowledgment[]> {
    const subs = this.subscriptions.get(channel) || [];
    const acks: Acknowledgment[] = [];

    for (const sub of subs) {
      if (sub.status !== 'active') continue;

      try {
        const ack = await this.send(sub.agentId, channel, payload, {
          ...options,
          type: 'broadcast',
        });
        acks.push(ack);
      } catch (error) {
        acks.push({
          messageId: '',
          deliveryId: '',
          status: 'reject',
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return acks;
  }

  async request<T, R>(
    to: string,
    channel: string,
    payload: T,
    timeout = 30000
  ): Promise<R> {
    const replyChannel = `reply_${this.generateId()}`;

    return new Promise<R>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.unsubscribe(replyChannel, to);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      // Subscribe to reply
      this.subscribe(to, replyChannel, async (msg) => {
        clearTimeout(timer);
        this.unsubscribe(replyChannel, to);
        resolve(msg.payload as R);
      });

      // Send request
      this.send(to, channel, payload, {
        type: 'request',
        replyTo: replyChannel,
      }).catch(reject);
    });
  }

  // --------------------------------------------------------------------------
  // Subscriptions
  // --------------------------------------------------------------------------

  subscribe<T = unknown>(
    agentId: string,
    channel: string,
    handler: MessageHandler<T>,
    options?: SubscriptionOptions
  ): Subscription<T> {
    if (!this.channels.has(channel)) {
      this.createChannel({ name: channel, type: 'direct' });
    }

    const subscription: Subscription<T> = {
      id: this.generateId(),
      agentId,
      channel,
      handler: handler as MessageHandler,
      options,
      createdAt: new Date(),
      status: 'active',
    };

    const channelSubs = this.subscriptions.get(channel) || [];
    channelSubs.push(subscription as Subscription);
    this.subscriptions.set(channel, channelSubs);

    // Process pending messages
    this.processPending(channel, agentId);

    return subscription;
  }

  subscribeWithFilter<T = unknown>(
    agentId: string,
    channel: string,
    filter: MessageFilter<T>,
    handler: MessageHandler<T>,
    options?: SubscriptionOptions
  ): Subscription<T> {
    const subscription = this.subscribe(agentId, channel, async (msg, ctx) => {
      // Apply filter
      if (filter.types && !filter.types.includes(msg.type)) return;
      if (filter.priorities && !filter.priorities.includes(msg.priority)) return;
      if (filter.fromAgents && !filter.fromAgents.includes(msg.from)) return;
      if (filter.predicate && !filter.predicate(msg as TypedMessage<T>)) return;

      return handler(msg as TypedMessage<T>, ctx);
    }, options) as Subscription<T>;

    subscription.filter = filter;
    return subscription;
  }

  unsubscribe(channel: string, agentId: string): boolean {
    const subs = this.subscriptions.get(channel);
    if (!subs) return false;

    const index = subs.findIndex(s => s.agentId === agentId);
    if (index === -1) return false;

    subs[index].status = 'cancelled';
    subs.splice(index, 1);

    return true;
  }

  pauseSubscription(subscriptionId: string): boolean {
    for (const subs of this.subscriptions.values()) {
      const sub = subs.find(s => s.id === subscriptionId);
      if (sub) {
        sub.status = 'paused';
        return true;
      }
    }
    return false;
  }

  resumeSubscription(subscriptionId: string): boolean {
    for (const subs of this.subscriptions.values()) {
      const sub = subs.find(s => s.id === subscriptionId);
      if (sub && sub.status === 'paused') {
        sub.status = 'active';
        return true;
      }
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // Routing
  // --------------------------------------------------------------------------

  addRoute(route: Route): void {
    this.routes.push(route);
    this.routes.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  removeRoute(routeId: string): boolean {
    const index = this.routes.findIndex(r => r.id === routeId);
    if (index === -1) return false;

    this.routes.splice(index, 1);
    return true;
  }

  private applyRouting(message: TypedMessage): TypedMessage {
    let routed = message;

    for (const route of this.routes) {
      if (route.source !== message.channel && route.source !== '*') continue;

      // Apply filter
      if (route.filter) {
        if (route.filter.types && !route.filter.types.includes(message.type)) continue;
        if (route.filter.priorities && !route.filter.priorities.includes(message.priority)) continue;
        if (route.filter.predicate && !route.filter.predicate(message)) continue;
      }

      // Determine destination
      const dest = typeof route.destination === 'function'
        ? route.destination(message)
        : route.destination;

      // Apply transform
      routed = route.transform
        ? { ...route.transform(message), metadata: { ...message.metadata, routedVia: [...(message.metadata?.routedVia || []), route.id] } }
        : { ...message, to: dest };

      break; // First matching route wins
    }

    return routed;
  }

  // --------------------------------------------------------------------------
  // Delivery
  // --------------------------------------------------------------------------

  private async deliver<T>(
    message: TypedMessage<T>,
    envelope: MessageEnvelope<T>
  ): Promise<Acknowledgment> {
    envelope.attempts++;
    envelope.lastAttempt = new Date();
    envelope.status = 'in_flight';

    const channel = this.channels.get(message.channel);
    const recipients = Array.isArray(message.to) ? message.to : [message.to];

    // Handle broadcast
    if (message.to === '*') {
      const subs = this.subscriptions.get(message.channel) || [];
      const activeSubs = subs.filter(s => s.status === 'active');

      for (const sub of activeSubs) {
        await this.deliverToSubscription(message, sub, envelope);
      }

      envelope.status = 'delivered';
      return {
        messageId: message.id,
        deliveryId: envelope.deliveryId,
        status: 'ack',
        timestamp: new Date(),
      };
    }

    // Deliver to specific recipients
    for (const recipient of recipients) {
      const subs = this.subscriptions.get(message.channel) || [];
      const sub = subs.find(s => s.agentId === recipient && s.status === 'active');

      if (!sub) {
        // Queue for later delivery
        const pending = this.pendingMessages.get(message.channel) || [];
        pending.push(envelope);
        this.pendingMessages.set(message.channel, pending);

        envelope.status = 'pending';
        continue;
      }

      await this.deliverToSubscription(message, sub, envelope);
    }

    envelope.status = envelope.status === 'pending' ? 'pending' : 'delivered';
    envelope.message.metadata = {
      ...envelope.message.metadata,
      deliveredAt: new Date(),
    };

    return {
      messageId: message.id,
      deliveryId: envelope.deliveryId,
      status: envelope.status === 'delivered' ? 'ack' : 'nack',
      timestamp: new Date(),
    };
  }

  private async deliverToSubscription<T>(
    message: TypedMessage<T>,
    subscription: Subscription,
    envelope: MessageEnvelope<T>
  ): Promise<void> {
    const context: HandlerContext = {
      acknowledge: async () => {
        envelope.status = 'acknowledged';
        envelope.message.metadata = {
          ...envelope.message.metadata,
          acknowledgedAt: new Date(),
        };
      },
      reject: async (reason?: string) => {
        envelope.status = 'rejected';
        this.emit({
          type: 'error',
          error: reason || 'Message rejected',
          context: { messageId: message.id },
        });
      },
      requeue: async () => {
        envelope.status = 'pending';
        const pending = this.pendingMessages.get(message.channel) || [];
        pending.push(envelope);
        this.pendingMessages.set(message.channel, pending);
      },
      reply: async <R>(response: R) => {
        if (message.replyTo) {
          await this.send(message.from, message.replyTo, response, {
            type: 'response',
            correlationId: message.id,
          });
        }
      },
    };

    try {
      const response = await subscription.handler(message as TypedMessage, context);

      // Auto-acknowledge if configured
      if (subscription.options?.autoAck && envelope.status !== 'acknowledged') {
        await context.acknowledge();
      }

      // Auto-reply if response provided
      if (response !== undefined && message.replyTo) {
        await context.reply(response);
      }

      envelope.message.metadata = {
        ...envelope.message.metadata,
        processedAt: new Date(),
      };
    } catch (error) {
      envelope.status = 'rejected';
      this.emit({
        type: 'error',
        error: error instanceof Error ? error.message : 'Handler error',
        context: { messageId: message.id, subscriptionId: subscription.id },
      });

      // Retry logic
      const retryPolicy = this.channels.get(message.channel)?.options?.retryPolicy;
      if (retryPolicy && envelope.attempts < retryPolicy.maxRetries) {
        const delay = Math.min(
          retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, envelope.attempts - 1),
          retryPolicy.maxDelay
        );

        envelope.nextRetry = new Date(Date.now() + delay);
        envelope.status = 'pending';

        setTimeout(() => {
          this.deliver(message, envelope);
        }, delay);
      } else if (this.channels.get(message.channel)?.options?.deadLetterChannel) {
        // Move to dead letter channel
        envelope.status = 'dead_letter';
        const dlc = this.channels.get(message.channel)!.options!.deadLetterChannel!;
        await this.send(message.to, dlc, message.payload, {
          headers: {
            ...message.headers,
            custom: {
              ...message.headers?.custom,
              originalChannel: message.channel,
              failureReason: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        });
      }
    }
  }

  private processPending(channel: string, agentId: string): void {
    const pending = this.pendingMessages.get(channel) || [];
    const subs = this.subscriptions.get(channel) || [];
    const sub = subs.find(s => s.agentId === agentId && s.status === 'active');

    if (!sub) return;

    const toProcess = pending.filter(env => {
      const msg = env.message;
      if (msg.to === '*') return true;
      const recipients = Array.isArray(msg.to) ? msg.to : [msg.to];
      return recipients.includes(agentId);
    });

    for (const envelope of toProcess) {
      const index = pending.indexOf(envelope);
      if (index > -1) {
        pending.splice(index, 1);
      }
      this.deliverToSubscription(envelope.message, sub, envelope);
    }

    this.pendingMessages.set(channel, pending);
  }

  // --------------------------------------------------------------------------
  // Events
  // --------------------------------------------------------------------------

  on(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: OrchestratorEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  getMessageLog(options?: {
    channel?: string;
    from?: string;
    to?: string;
    status?: DeliveryStatus;
    limit?: number;
  }): MessageEnvelope[] {
    let log = [...this.messageLog];

    if (options?.channel) {
      log = log.filter(e => e.message.channel === options.channel);
    }
    if (options?.from) {
      log = log.filter(e => e.message.from === options.from);
    }
    if (options?.to) {
      log = log.filter(e => {
        const to = e.message.to;
        if (to === '*') return true;
        const recipients = Array.isArray(to) ? to : [to];
        return recipients.includes(options.to!);
      });
    }
    if (options?.status) {
      log = log.filter(e => e.status === options.status);
    }

    return log.slice(-(options?.limit || 100));
  }

  getStats(): MessageBrokerStats {
    const channelStats: Record<string, ChannelStats> = {};

    for (const [name, channel] of this.channels) {
      const subs = this.subscriptions.get(name) || [];
      const pending = this.pendingMessages.get(name) || [];
      const logs = this.messageLog.filter(e => e.message.channel === name);

      channelStats[name] = {
        type: channel.type,
        subscribers: subs.filter(s => s.status === 'active').length,
        pendingMessages: pending.length,
        totalMessages: logs.length,
        acknowledgedMessages: logs.filter(e => e.status === 'acknowledged').length,
        rejectedMessages: logs.filter(e => e.status === 'rejected').length,
      };
    }

    return {
      channels: channelStats,
      totalChannels: this.channels.size,
      totalSubscriptions: Array.from(this.subscriptions.values())
        .reduce((sum, subs) => sum + subs.length, 0),
      totalPendingMessages: Array.from(this.pendingMessages.values())
        .reduce((sum, msgs) => sum + msgs.length, 0),
      totalProcessedMessages: this.messageLog.length,
    };
  }
}

// ============================================================================
// Types for Options
// ============================================================================

export interface MessageBrokerOptions {
  maxLogSize?: number;
  defaultTTL?: number;
  defaultRetryPolicy?: RetryOptions;
}

export interface SendOptions {
  from?: string;
  type?: MessageType;
  priority?: MessagePriority;
  correlationId?: string;
  replyTo?: string;
  ttl?: number;
  headers?: MessageHeaders;
}

export interface MessageBrokerStats {
  channels: Record<string, ChannelStats>;
  totalChannels: number;
  totalSubscriptions: number;
  totalPendingMessages: number;
  totalProcessedMessages: number;
}

export interface ChannelStats {
  type: ChannelType;
  subscribers: number;
  pendingMessages: number;
  totalMessages: number;
  acknowledgedMessages: number;
  rejectedMessages: number;
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createChannel<T = unknown>(
  name: string,
  type: ChannelType = 'direct',
  options?: ChannelOptions
): Channel<T> {
  return { name, type, options };
}

export function createMessageBroker(options?: MessageBrokerOptions): MessageBroker {
  return new MessageBroker(options);
}

export function createRequestChannel<Req, Res>(
  name: string,
  timeout = 30000
): {
  channel: Channel<Req>;
  request: (broker: MessageBroker, to: string, payload: Req) => Promise<Res>;
} {
  const channel = createChannel<Req>(name, 'request');

  return {
    channel,
    request: (broker, to, payload) => broker.request<Req, Res>(to, name, payload, timeout),
  };
}

// ============================================================================
// Convenience Message Builders
// ============================================================================

export const MessageBuilders = {
  task<T>(payload: T, options?: Partial<SendOptions>): SendOptions & { payload: T } {
    return {
      type: 'request',
      priority: 'normal',
      ...options,
      payload,
    };
  },

  notification<T>(payload: T, options?: Partial<SendOptions>): SendOptions & { payload: T } {
    return {
      type: 'notification',
      priority: 'low',
      ...options,
      payload,
    };
  },

  urgent<T>(payload: T, options?: Partial<SendOptions>): SendOptions & { payload: T } {
    return {
      type: 'request',
      priority: 'urgent',
      ...options,
      payload,
    };
  },

  broadcast<T>(payload: T, options?: Partial<SendOptions>): SendOptions & { payload: T } {
    return {
      type: 'broadcast',
      priority: 'normal',
      ...options,
      payload,
    };
  },
};
