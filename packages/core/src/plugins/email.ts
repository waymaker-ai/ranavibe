/**
 * RANA Email Plugin
 * AI-powered email processing with support for multiple providers
 */

import { definePlugin } from './helpers';
import type { RanaClient } from '../client';
import type { RanaChatRequest } from '../types';

// ============================================================================
// Types
// ============================================================================

export type EmailProvider = 'imap' | 'gmail' | 'outlook' | 'custom';

export type EmailPriority = 'urgent' | 'high' | 'normal' | 'low';

export type EmailCategory =
  | 'personal'
  | 'work'
  | 'promotional'
  | 'social'
  | 'updates'
  | 'spam'
  | 'other';

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  data?: Buffer | string; // Buffer for binary, string for base64
  encoding?: 'base64' | 'binary';
}

export interface Email {
  id: string;
  messageId: string;
  threadId?: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: {
    text?: string;
    html?: string;
  };
  attachments?: EmailAttachment[];
  date: Date;
  inReplyTo?: string;
  references?: string[];
  headers?: Record<string, string>;
  labels?: string[];
  flags?: string[];
}

export interface EmailClassification {
  category: EmailCategory;
  priority: EmailPriority;
  isSpam: boolean;
  confidence: number;
  reasoning: string;
  suggestedLabels?: string[];
  requiresResponse?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface EmailSummary {
  subject: string;
  keyPoints: string[];
  actionItems?: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  participants: EmailAddress[];
  emailCount: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface EmailReply {
  to: EmailAddress[];
  cc?: EmailAddress[];
  subject: string;
  body: {
    text: string;
    html?: string;
  };
  inReplyTo?: string;
  references?: string[];
  tone?: 'formal' | 'casual' | 'friendly' | 'professional';
}

export interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
}

export interface OutlookConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  refreshToken: string;
  accessToken?: string;
}

export interface EmailFilter {
  from?: string | string[] | RegExp;
  to?: string | string[] | RegExp;
  subject?: string | RegExp;
  hasAttachment?: boolean;
  labels?: string[];
  flags?: string[];
  dateAfter?: Date;
  dateBefore?: Date;
}

export interface EmailPluginConfig {
  provider: EmailProvider;
  credentials:
    | { imap: IMAPConfig; smtp: SMTPConfig }
    | { gmail: GmailConfig }
    | { outlook: OutlookConfig }
    | { custom: any };
  pollingInterval?: number; // milliseconds
  filters?: EmailFilter;
  autoClassify?: boolean;
  spamThreshold?: number; // 0-1
  llmProvider?: string; // Which LLM provider to use for AI features
  llmModel?: string;
}

export type EmailHandler = (email: Email) => void | Promise<void>;

// ============================================================================
// Email Plugin Implementation
// ============================================================================

export class EmailPlugin {
  private config: EmailPluginConfig;
  private ranaClient?: RanaClient;
  private handlers: EmailHandler[] = [];
  private connected: boolean = false;
  private pollingTimer?: NodeJS.Timeout;
  private lastProcessedId?: string;

  constructor(config: EmailPluginConfig) {
    this.config = {
      pollingInterval: 60000, // Default: 1 minute
      autoClassify: true,
      spamThreshold: 0.7,
      ...config,
    };
  }

  /**
   * Set the RANA client for AI processing
   */
  setRanaClient(client: RanaClient): void {
    this.ranaClient = client;
  }

  /**
   * Connect to the email service
   */
  async connect(config?: Partial<EmailPluginConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (this.connected) {
      throw new Error('Email plugin already connected');
    }

    // Validate configuration
    this.validateConfig();

    // Connect based on provider
    switch (this.config.provider) {
      case 'imap':
        await this.connectIMAP();
        break;
      case 'gmail':
        await this.connectGmail();
        break;
      case 'outlook':
        await this.connectOutlook();
        break;
      case 'custom':
        await this.connectCustom();
        break;
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }

    this.connected = true;

    // Start polling if enabled
    if (this.config.pollingInterval && this.config.pollingInterval > 0) {
      this.startPolling();
    }
  }

  /**
   * Disconnect from the email service
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    this.stopPolling();

    // Disconnect based on provider
    switch (this.config.provider) {
      case 'imap':
        await this.disconnectIMAP();
        break;
      case 'gmail':
        await this.disconnectGmail();
        break;
      case 'outlook':
        await this.disconnectOutlook();
        break;
      case 'custom':
        await this.disconnectCustom();
        break;
    }

    this.connected = false;
  }

  /**
   * Register a handler for incoming emails
   */
  onEmail(handler: EmailHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Classify an email using AI
   */
  async classify(email: Email): Promise<EmailClassification> {
    if (!this.ranaClient) {
      throw new Error('RANA client not set. Call setRanaClient() first.');
    }

    const prompt = this.buildClassificationPrompt(email);

    const response = await this.ranaClient.chat({
      messages: [
        {
          role: 'system',
          content:
            'You are an AI email classifier. Analyze emails and provide structured classification data in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      provider: this.config.llmProvider as any,
      model: this.config.llmModel,
      temperature: 0.3,
    });

    try {
      const classification = this.parseClassificationResponse(response.content);
      return classification;
    } catch (error) {
      throw new Error(`Failed to parse classification response: ${error}`);
    }
  }

  /**
   * Generate an AI-powered reply to an email
   */
  async generateReply(
    email: Email,
    context?: {
      tone?: 'formal' | 'casual' | 'friendly' | 'professional';
      instructions?: string;
      maxLength?: number;
      includeOriginal?: boolean;
    }
  ): Promise<EmailReply> {
    if (!this.ranaClient) {
      throw new Error('RANA client not set. Call setRanaClient() first.');
    }

    const prompt = this.buildReplyPrompt(email, context);

    const response = await this.ranaClient.chat({
      messages: [
        {
          role: 'system',
          content:
            'You are an AI email assistant. Generate professional, contextual email replies in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      provider: this.config.llmProvider as any,
      model: this.config.llmModel,
      temperature: 0.7,
    });

    try {
      const reply = this.parseReplyResponse(response.content, email);
      return reply;
    } catch (error) {
      throw new Error(`Failed to parse reply response: ${error}`);
    }
  }

  /**
   * Summarize an email thread
   */
  async summarize(emails: Email[]): Promise<EmailSummary> {
    if (!this.ranaClient) {
      throw new Error('RANA client not set. Call setRanaClient() first.');
    }

    if (emails.length === 0) {
      throw new Error('No emails to summarize');
    }

    const prompt = this.buildSummarizationPrompt(emails);

    const response = await this.ranaClient.chat({
      messages: [
        {
          role: 'system',
          content:
            'You are an AI email summarizer. Create concise, actionable summaries of email threads in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      provider: this.config.llmProvider as any,
      model: this.config.llmModel,
      temperature: 0.5,
    });

    try {
      const summary = this.parseSummaryResponse(response.content, emails);
      return summary;
    } catch (error) {
      throw new Error(`Failed to parse summary response: ${error}`);
    }
  }

  /**
   * Send an email
   */
  async send(
    to: string | EmailAddress | (string | EmailAddress)[],
    subject: string,
    body: string | { text?: string; html?: string },
    options?: {
      cc?: string | EmailAddress | (string | EmailAddress)[];
      bcc?: string | EmailAddress | (string | EmailAddress)[];
      attachments?: EmailAttachment[];
      inReplyTo?: string;
      references?: string[];
    }
  ): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to email service');
    }

    const normalizedTo = this.normalizeAddresses(to);
    const normalizedCc = options?.cc ? this.normalizeAddresses(options.cc) : undefined;
    const normalizedBcc = options?.bcc ? this.normalizeAddresses(options.bcc) : undefined;

    const normalizedBody =
      typeof body === 'string' ? { text: body } : body;

    const email = {
      to: normalizedTo,
      cc: normalizedCc,
      bcc: normalizedBcc,
      subject,
      body: normalizedBody,
      attachments: options?.attachments,
      inReplyTo: options?.inReplyTo,
      references: options?.references,
    };

    // Send based on provider
    switch (this.config.provider) {
      case 'imap':
        await this.sendSMTP(email);
        break;
      case 'gmail':
        await this.sendGmail(email);
        break;
      case 'outlook':
        await this.sendOutlook(email);
        break;
      case 'custom':
        await this.sendCustom(email);
        break;
    }
  }

  /**
   * Fetch emails with optional filters
   */
  async fetch(filters?: EmailFilter, limit?: number): Promise<Email[]> {
    if (!this.connected) {
      throw new Error('Not connected to email service');
    }

    let emails: Email[] = [];

    switch (this.config.provider) {
      case 'imap':
        emails = await this.fetchIMAP(filters, limit);
        break;
      case 'gmail':
        emails = await this.fetchGmail(filters, limit);
        break;
      case 'outlook':
        emails = await this.fetchOutlook(filters, limit);
        break;
      case 'custom':
        emails = await this.fetchCustom(filters, limit);
        break;
    }

    // Auto-classify if enabled
    if (this.config.autoClassify) {
      for (const email of emails) {
        try {
          const classification = await this.classify(email);
          // Store classification in email metadata
          (email as any)._classification = classification;
        } catch (error) {
          console.error(`Failed to classify email ${email.id}:`, error);
        }
      }
    }

    return emails;
  }

  // ============================================================================
  // Private Methods - Prompt Building
  // ============================================================================

  private buildClassificationPrompt(email: Email): string {
    return `Analyze the following email and provide a classification:

From: ${email.from.address}${email.from.name ? ` (${email.from.name})` : ''}
To: ${email.to.map((a) => a.address).join(', ')}
Subject: ${email.subject}
Body: ${email.body.text || email.body.html || '(empty)'}

Provide a JSON response with the following structure:
{
  "category": "personal|work|promotional|social|updates|spam|other",
  "priority": "urgent|high|normal|low",
  "isSpam": boolean,
  "confidence": number (0-1),
  "reasoning": "brief explanation",
  "suggestedLabels": ["label1", "label2"],
  "requiresResponse": boolean,
  "sentiment": "positive|neutral|negative"
}`;
  }

  private buildReplyPrompt(
    email: Email,
    context?: {
      tone?: string;
      instructions?: string;
      maxLength?: number;
      includeOriginal?: boolean;
    }
  ): string {
    let prompt = `Generate a reply to the following email:

From: ${email.from.address}${email.from.name ? ` (${email.from.name})` : ''}
Subject: ${email.subject}
Body: ${email.body.text || email.body.html || '(empty)'}

`;

    if (context?.tone) {
      prompt += `Tone: ${context.tone}\n`;
    }

    if (context?.instructions) {
      prompt += `Additional instructions: ${context.instructions}\n`;
    }

    if (context?.maxLength) {
      prompt += `Maximum length: ${context.maxLength} characters\n`;
    }

    prompt += `
Provide a JSON response with the following structure:
{
  "subject": "Re: original subject",
  "body": {
    "text": "plain text reply",
    "html": "optional HTML version"
  }
}`;

    return prompt;
  }

  private buildSummarizationPrompt(emails: Email[]): string {
    const emailsText = emails
      .map(
        (e, i) => `
Email ${i + 1}:
From: ${e.from.address}${e.from.name ? ` (${e.from.name})` : ''}
Date: ${e.date.toISOString()}
Subject: ${e.subject}
Body: ${e.body.text || e.body.html || '(empty)'}
---`
      )
      .join('\n');

    return `Summarize the following email thread:

${emailsText}

Provide a JSON response with the following structure:
{
  "subject": "thread subject",
  "keyPoints": ["point 1", "point 2", ...],
  "actionItems": ["action 1", "action 2", ...],
  "sentiment": "positive|neutral|negative"
}`;
  }

  // ============================================================================
  // Private Methods - Response Parsing
  // ============================================================================

  private parseClassificationResponse(content: string): EmailClassification {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                      content.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const classification = JSON.parse(jsonMatch[1]);

    return {
      category: classification.category || 'other',
      priority: classification.priority || 'normal',
      isSpam: classification.isSpam || false,
      confidence: classification.confidence || 0.5,
      reasoning: classification.reasoning || '',
      suggestedLabels: classification.suggestedLabels || [],
      requiresResponse: classification.requiresResponse || false,
      sentiment: classification.sentiment || 'neutral',
    };
  }

  private parseReplyResponse(content: string, originalEmail: Email): EmailReply {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                      content.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const reply = JSON.parse(jsonMatch[1]);

    return {
      to: [originalEmail.from],
      subject: reply.subject || `Re: ${originalEmail.subject}`,
      body: reply.body || { text: '' },
      inReplyTo: originalEmail.messageId,
      references: [
        ...(originalEmail.references || []),
        originalEmail.messageId,
      ],
    };
  }

  private parseSummaryResponse(content: string, emails: Email[]): EmailSummary {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                      content.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const summary = JSON.parse(jsonMatch[1]);

    // Extract unique participants
    const participantMap = new Map<string, EmailAddress>();
    for (const email of emails) {
      participantMap.set(email.from.address, email.from);
      for (const to of email.to) {
        participantMap.set(to.address, to);
      }
    }

    // Get date range
    const dates = emails.map((e) => e.date.getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    return {
      subject: summary.subject || emails[0]?.subject || 'Email Thread',
      keyPoints: summary.keyPoints || [],
      actionItems: summary.actionItems || [],
      sentiment: summary.sentiment || 'neutral',
      participants: Array.from(participantMap.values()),
      emailCount: emails.length,
      dateRange: {
        start: minDate,
        end: maxDate,
      },
    };
  }

  // ============================================================================
  // Private Methods - Utilities
  // ============================================================================

  private normalizeAddresses(
    addresses: string | EmailAddress | (string | EmailAddress)[]
  ): EmailAddress[] {
    const arr = Array.isArray(addresses) ? addresses : [addresses];
    return arr.map((addr) =>
      typeof addr === 'string' ? { address: addr } : addr
    );
  }

  private validateConfig(): void {
    if (!this.config.provider) {
      throw new Error('Email provider is required');
    }

    if (!this.config.credentials) {
      throw new Error('Email credentials are required');
    }

    // Provider-specific validation
    switch (this.config.provider) {
      case 'imap':
        if (!('imap' in this.config.credentials) || !('smtp' in this.config.credentials)) {
          throw new Error('IMAP/SMTP credentials are required');
        }
        break;
      case 'gmail':
        if (!('gmail' in this.config.credentials)) {
          throw new Error('Gmail credentials are required');
        }
        break;
      case 'outlook':
        if (!('outlook' in this.config.credentials)) {
          throw new Error('Outlook credentials are required');
        }
        break;
      case 'custom':
        if (!('custom' in this.config.credentials)) {
          throw new Error('Custom provider credentials are required');
        }
        break;
    }
  }

  private startPolling(): void {
    if (this.pollingTimer) {
      return;
    }

    this.pollingTimer = setInterval(async () => {
      try {
        await this.poll();
      } catch (error) {
        console.error('Error polling emails:', error);
      }
    }, this.config.pollingInterval);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = undefined;
    }
  }

  private async poll(): Promise<void> {
    const emails = await this.fetch(this.config.filters);

    // Process new emails
    for (const email of emails) {
      if (this.lastProcessedId && email.id <= this.lastProcessedId) {
        continue;
      }

      // Run handlers
      for (const handler of this.handlers) {
        try {
          await handler(email);
        } catch (error) {
          console.error(`Error in email handler:`, error);
        }
      }

      this.lastProcessedId = email.id;
    }
  }

  private matchesFilter(email: Email, filter?: EmailFilter): boolean {
    if (!filter) {
      return true;
    }

    // From filter
    if (filter.from) {
      const fromMatch = this.matchesAddressFilter(email.from.address, filter.from);
      if (!fromMatch) return false;
    }

    // To filter
    if (filter.to) {
      const toMatch = email.to.some((addr) =>
        this.matchesAddressFilter(addr.address, filter.to!)
      );
      if (!toMatch) return false;
    }

    // Subject filter
    if (filter.subject) {
      const subjectMatch =
        filter.subject instanceof RegExp
          ? filter.subject.test(email.subject)
          : email.subject.includes(filter.subject);
      if (!subjectMatch) return false;
    }

    // Attachment filter
    if (filter.hasAttachment !== undefined) {
      const hasAttachment = email.attachments && email.attachments.length > 0;
      if (filter.hasAttachment !== hasAttachment) return false;
    }

    // Labels filter
    if (filter.labels && filter.labels.length > 0) {
      const hasLabel = filter.labels.some((label) =>
        email.labels?.includes(label)
      );
      if (!hasLabel) return false;
    }

    // Date filters
    if (filter.dateAfter && email.date < filter.dateAfter) {
      return false;
    }

    if (filter.dateBefore && email.date > filter.dateBefore) {
      return false;
    }

    return true;
  }

  private matchesAddressFilter(
    address: string,
    filter: string | string[] | RegExp
  ): boolean {
    if (filter instanceof RegExp) {
      return filter.test(address);
    }

    if (Array.isArray(filter)) {
      return filter.some((f) => address.includes(f));
    }

    return address.includes(filter);
  }

  // ============================================================================
  // Private Methods - Provider-Specific Implementations
  // ============================================================================

  private async connectIMAP(): Promise<void> {
    // TODO: Implement IMAP connection
    // This would use a library like 'imap' or 'node-imap'
    throw new Error('IMAP connection not yet implemented. Use external library like "imap" or "node-imap".');
  }

  private async disconnectIMAP(): Promise<void> {
    // TODO: Implement IMAP disconnection
  }

  private async fetchIMAP(filters?: EmailFilter, limit?: number): Promise<Email[]> {
    // TODO: Implement IMAP fetch
    // This would fetch emails from IMAP server and convert to Email format
    throw new Error('IMAP fetch not yet implemented');
  }

  private async sendSMTP(email: any): Promise<void> {
    // TODO: Implement SMTP send
    // This would use a library like 'nodemailer'
    throw new Error('SMTP send not yet implemented. Use external library like "nodemailer".');
  }

  private async connectGmail(): Promise<void> {
    // TODO: Implement Gmail API connection
    // This would use the Google APIs client library
    throw new Error('Gmail connection not yet implemented. Use googleapis library.');
  }

  private async disconnectGmail(): Promise<void> {
    // TODO: Implement Gmail disconnection
  }

  private async fetchGmail(filters?: EmailFilter, limit?: number): Promise<Email[]> {
    // TODO: Implement Gmail API fetch
    throw new Error('Gmail fetch not yet implemented');
  }

  private async sendGmail(email: any): Promise<void> {
    // TODO: Implement Gmail API send
    throw new Error('Gmail send not yet implemented');
  }

  private async connectOutlook(): Promise<void> {
    // TODO: Implement Microsoft Graph API connection
    throw new Error('Outlook connection not yet implemented. Use @microsoft/microsoft-graph-client.');
  }

  private async disconnectOutlook(): Promise<void> {
    // TODO: Implement Outlook disconnection
  }

  private async fetchOutlook(filters?: EmailFilter, limit?: number): Promise<Email[]> {
    // TODO: Implement Microsoft Graph API fetch
    throw new Error('Outlook fetch not yet implemented');
  }

  private async sendOutlook(email: any): Promise<void> {
    // TODO: Implement Microsoft Graph API send
    throw new Error('Outlook send not yet implemented');
  }

  private async connectCustom(): Promise<void> {
    // Custom provider hook
    // Users can extend this class and override these methods
  }

  private async disconnectCustom(): Promise<void> {
    // Custom provider hook
  }

  private async fetchCustom(filters?: EmailFilter, limit?: number): Promise<Email[]> {
    // Custom provider hook
    return [];
  }

  private async sendCustom(email: any): Promise<void> {
    // Custom provider hook
  }
}

// ============================================================================
// Default Plugin Export
// ============================================================================

/**
 * Create and configure an email plugin
 *
 * @example
 * ```typescript
 * import { createEmailPlugin } from '@rana/core';
 *
 * const emailPlugin = createEmailPlugin({
 *   provider: 'gmail',
 *   credentials: {
 *     gmail: {
 *       clientId: 'YOUR_CLIENT_ID',
 *       clientSecret: 'YOUR_CLIENT_SECRET',
 *       refreshToken: 'YOUR_REFRESH_TOKEN',
 *     },
 *   },
 *   pollingInterval: 60000,
 *   autoClassify: true,
 * });
 *
 * // Use with RANA
 * const rana = new RanaClient({
 *   providers: { anthropic: 'sk-...' },
 * });
 *
 * emailPlugin.setRanaClient(rana);
 * await emailPlugin.connect();
 *
 * // Handle incoming emails
 * emailPlugin.onEmail(async (email) => {
 *   console.log('New email:', email.subject);
 *
 *   const classification = await emailPlugin.classify(email);
 *   if (classification.requiresResponse) {
 *     const reply = await emailPlugin.generateReply(email);
 *     console.log('Generated reply:', reply.body.text);
 *   }
 * });
 * ```
 */
export function createEmailPlugin(config: EmailPluginConfig): EmailPlugin {
  return new EmailPlugin(config);
}

/**
 * RANA plugin definition for email processing
 *
 * @example
 * ```typescript
 * import { RanaClient } from '@rana/core';
 * import { emailPlugin } from '@rana/core/plugins/email';
 *
 * const rana = new RanaClient({
 *   providers: { anthropic: 'sk-...' },
 *   plugins: [emailPlugin],
 * });
 * ```
 */
export default definePlugin({
  name: 'email',
  version: '1.0.0',

  async onInit(config) {
    console.log('Email plugin initialized');
  },

  async onBeforeRequest(request) {
    // Can modify requests before they're sent to LLM
    // Useful for adding email-specific context
    return request;
  },

  async onAfterResponse(response) {
    // Can process responses after they're received
    // Useful for logging email processing metrics
    return response;
  },
});
