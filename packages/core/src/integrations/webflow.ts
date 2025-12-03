/**
 * Webflow CMS Integration for RANA
 *
 * Enables AI-powered content management with Webflow CMS.
 * Create, update, and manage CMS items using natural language.
 *
 * @see https://developers.webflow.com
 */

import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

export interface WebflowConfig {
  /** Webflow API token */
  apiToken: string;
  /** Site ID (optional, can be specified per operation) */
  siteId?: string;
  /** API version */
  apiVersion?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface WebflowSite {
  /** Site ID */
  id: string;
  /** Workspace ID */
  workspaceId: string;
  /** Display name */
  displayName: string;
  /** Short name (subdomain) */
  shortName: string;
  /** Preview URL */
  previewUrl?: string;
  /** Custom domains */
  customDomains: string[];
  /** Last published date */
  lastPublished?: Date;
  /** Last updated date */
  lastUpdated: Date;
  /** Timezone */
  timeZone: string;
  /** Locales */
  locales?: WebflowLocale[];
}

export interface WebflowLocale {
  id: string;
  cmsId: string;
  enabled: boolean;
  displayName: string;
  redirect: boolean;
  subdirectory: string;
  tag: string;
}

export interface WebflowCollection {
  /** Collection ID */
  id: string;
  /** Display name */
  displayName: string;
  /** Singular name */
  singularName: string;
  /** Slug */
  slug: string;
  /** Creation date */
  createdOn: Date;
  /** Last updated date */
  lastUpdated: Date;
  /** Collection fields */
  fields: WebflowField[];
}

export interface WebflowField {
  /** Field ID */
  id: string;
  /** Field name */
  displayName: string;
  /** Slug */
  slug: string;
  /** Field type */
  type: WebflowFieldType;
  /** Is required */
  isRequired: boolean;
  /** Is editable */
  isEditable: boolean;
  /** Validation rules */
  validations?: Record<string, any>;
}

export type WebflowFieldType =
  | 'PlainText'
  | 'RichText'
  | 'Image'
  | 'MultiImage'
  | 'Video'
  | 'Link'
  | 'Email'
  | 'Phone'
  | 'Number'
  | 'DateTime'
  | 'Switch'
  | 'Color'
  | 'Option'
  | 'File'
  | 'Reference'
  | 'MultiReference'
  | 'User';

export interface WebflowItem {
  /** Item ID */
  id: string;
  /** CMS locale ID */
  cmsLocaleId?: string;
  /** Last published date */
  lastPublished?: Date;
  /** Last updated date */
  lastUpdated: Date;
  /** Created date */
  createdOn: Date;
  /** Is archived */
  isArchived: boolean;
  /** Is draft */
  isDraft: boolean;
  /** Field data */
  fieldData: Record<string, any>;
}

export interface CreateItemData {
  /** Field data for the item */
  fieldData: Record<string, any>;
  /** Is draft */
  isDraft?: boolean;
  /** Is archived */
  isArchived?: boolean;
  /** CMS locale ID */
  cmsLocaleId?: string;
}

export interface UpdateItemData {
  /** Field data to update */
  fieldData: Record<string, any>;
  /** Is draft */
  isDraft?: boolean;
  /** Is archived */
  isArchived?: boolean;
}

export interface ListItemsOptions {
  /** Number of items to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** CMS locale ID */
  cmsLocaleId?: string;
  /** Sort by field */
  sortBy?: string;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

export interface PublishOptions {
  /** Item IDs to publish */
  itemIds?: string[];
  /** Collection IDs to publish */
  collectionIds?: string[];
  /** Publish all items */
  publishAll?: boolean;
}

export interface WebflowWebhook {
  id: string;
  siteId: string;
  triggerType: WebflowWebhookTrigger;
  url: string;
  createdOn: Date;
  lastTriggered?: Date;
  filter?: Record<string, any>;
}

export type WebflowWebhookTrigger =
  | 'form_submission'
  | 'site_publish'
  | 'page_created'
  | 'page_metadata_updated'
  | 'page_deleted'
  | 'collection_item_created'
  | 'collection_item_changed'
  | 'collection_item_deleted'
  | 'collection_item_unpublished'
  | 'ecomm_new_order'
  | 'ecomm_order_updated'
  | 'ecomm_inventory_changed'
  | 'user_account_added'
  | 'user_account_updated'
  | 'user_account_deleted';

// =============================================================================
// Error Classes
// =============================================================================

export class WebflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'WebflowError';
  }
}

// =============================================================================
// Webflow Integration
// =============================================================================

export class WebflowIntegration extends EventEmitter {
  private config: Required<Omit<WebflowConfig, 'siteId'>> & Pick<WebflowConfig, 'siteId'>;
  private baseUrl = 'https://api.webflow.com/v2';

  constructor(config: WebflowConfig) {
    super();
    this.config = {
      apiVersion: 'v2',
      timeout: 30000,
      debug: false,
      ...config,
    };
  }

  // ===========================================================================
  // Sites
  // ===========================================================================

  /**
   * List all sites
   */
  async listSites(): Promise<WebflowSite[]> {
    const response = await this.request('GET', '/sites');
    return response.sites.map((s: any) => this.transformSite(s));
  }

  /**
   * Get a specific site
   */
  async getSite(siteId?: string): Promise<WebflowSite> {
    const id = siteId || this.config.siteId;
    if (!id) throw new WebflowError('Site ID required', 'SITE_ID_REQUIRED');

    const response = await this.request('GET', `/sites/${id}`);
    return this.transformSite(response);
  }

  /**
   * Publish a site
   */
  async publishSite(siteId?: string, options: PublishOptions = {}): Promise<void> {
    const id = siteId || this.config.siteId;
    if (!id) throw new WebflowError('Site ID required', 'SITE_ID_REQUIRED');

    await this.request('POST', `/sites/${id}/publish`, {
      publishToWebflowSubdomain: true,
      publishToCustomDomains: true,
      ...options,
    });

    this.emit('site:published', id);
  }

  // ===========================================================================
  // Collections
  // ===========================================================================

  /**
   * List all collections for a site
   */
  async listCollections(siteId?: string): Promise<WebflowCollection[]> {
    const id = siteId || this.config.siteId;
    if (!id) throw new WebflowError('Site ID required', 'SITE_ID_REQUIRED');

    const response = await this.request('GET', `/sites/${id}/collections`);
    return response.collections.map((c: any) => this.transformCollection(c));
  }

  /**
   * Get a specific collection
   */
  async getCollection(collectionId: string): Promise<WebflowCollection> {
    const response = await this.request('GET', `/collections/${collectionId}`);
    return this.transformCollection(response);
  }

  /**
   * Get collection by name
   */
  async getCollectionByName(name: string, siteId?: string): Promise<WebflowCollection | null> {
    const collections = await this.listCollections(siteId);
    return collections.find(
      c => c.displayName.toLowerCase() === name.toLowerCase() ||
           c.slug.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  // ===========================================================================
  // Items
  // ===========================================================================

  /**
   * List items in a collection
   */
  async listItems(collectionId: string, options: ListItemsOptions = {}): Promise<{
    items: WebflowItem[];
    pagination: { limit: number; offset: number; total: number };
  }> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());
    if (options.cmsLocaleId) params.set('cmsLocaleId', options.cmsLocaleId);
    if (options.sortBy) params.set('sortBy', options.sortBy);
    if (options.sortOrder) params.set('sortOrder', options.sortOrder);

    const response = await this.request(
      'GET',
      `/collections/${collectionId}/items?${params.toString()}`
    );

    return {
      items: response.items.map((i: any) => this.transformItem(i)),
      pagination: {
        limit: response.pagination?.limit || options.limit || 100,
        offset: response.pagination?.offset || options.offset || 0,
        total: response.pagination?.total || response.items.length,
      },
    };
  }

  /**
   * Get a specific item
   */
  async getItem(collectionId: string, itemId: string): Promise<WebflowItem> {
    const response = await this.request(
      'GET',
      `/collections/${collectionId}/items/${itemId}`
    );
    return this.transformItem(response);
  }

  /**
   * Create a new item
   */
  async createItem(collectionId: string, data: CreateItemData): Promise<WebflowItem> {
    const response = await this.request(
      'POST',
      `/collections/${collectionId}/items`,
      data
    );

    const item = this.transformItem(response);
    this.emit('item:created', { collectionId, item });

    if (this.config.debug) {
      console.log(`[Webflow] Created item ${item.id} in collection ${collectionId}`);
    }

    return item;
  }

  /**
   * Update an existing item
   */
  async updateItem(
    collectionId: string,
    itemId: string,
    data: UpdateItemData
  ): Promise<WebflowItem> {
    const response = await this.request(
      'PATCH',
      `/collections/${collectionId}/items/${itemId}`,
      data
    );

    const item = this.transformItem(response);
    this.emit('item:updated', { collectionId, itemId, item });

    return item;
  }

  /**
   * Delete an item
   */
  async deleteItem(collectionId: string, itemId: string): Promise<void> {
    await this.request('DELETE', `/collections/${collectionId}/items/${itemId}`);
    this.emit('item:deleted', { collectionId, itemId });
  }

  /**
   * Publish items
   */
  async publishItems(collectionId: string, itemIds: string[]): Promise<void> {
    await this.request('POST', `/collections/${collectionId}/items/publish`, {
      itemIds,
    });

    this.emit('items:published', { collectionId, itemIds });
  }

  // ===========================================================================
  // Webhooks
  // ===========================================================================

  /**
   * List webhooks for a site
   */
  async listWebhooks(siteId?: string): Promise<WebflowWebhook[]> {
    const id = siteId || this.config.siteId;
    if (!id) throw new WebflowError('Site ID required', 'SITE_ID_REQUIRED');

    const response = await this.request('GET', `/sites/${id}/webhooks`);
    return response.webhooks.map((w: any) => this.transformWebhook(w));
  }

  /**
   * Create a webhook
   */
  async createWebhook(
    triggerType: WebflowWebhookTrigger,
    url: string,
    siteId?: string,
    filter?: Record<string, any>
  ): Promise<WebflowWebhook> {
    const id = siteId || this.config.siteId;
    if (!id) throw new WebflowError('Site ID required', 'SITE_ID_REQUIRED');

    const response = await this.request('POST', `/sites/${id}/webhooks`, {
      triggerType,
      url,
      filter,
    });

    const webhook = this.transformWebhook(response);
    this.emit('webhook:created', webhook);
    return webhook;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string, siteId?: string): Promise<void> {
    const id = siteId || this.config.siteId;
    if (!id) throw new WebflowError('Site ID required', 'SITE_ID_REQUIRED');

    await this.request('DELETE', `/sites/${id}/webhooks/${webhookId}`);
    this.emit('webhook:deleted', webhookId);
  }

  // ===========================================================================
  // AI-Powered Content Helpers
  // ===========================================================================

  /**
   * Create content item from natural language description
   */
  async createFromDescription(
    collectionId: string,
    description: string,
    llm: { generate: (prompt: string) => Promise<string> }
  ): Promise<WebflowItem> {
    // Get collection schema
    const collection = await this.getCollection(collectionId);

    // Build prompt for LLM
    const prompt = this.buildContentPrompt(collection, description);
    const jsonResponse = await llm.generate(prompt);

    // Parse and validate
    let fieldData: Record<string, any>;
    try {
      fieldData = JSON.parse(jsonResponse);
    } catch {
      throw new WebflowError(
        'Failed to parse LLM response as JSON',
        'PARSE_ERROR',
        undefined,
        { response: jsonResponse }
      );
    }

    // Create the item
    return this.createItem(collectionId, { fieldData });
  }

  /**
   * Update content based on natural language instructions
   */
  async updateFromInstructions(
    collectionId: string,
    itemId: string,
    instructions: string,
    llm: { generate: (prompt: string) => Promise<string> }
  ): Promise<WebflowItem> {
    // Get current item and collection
    const [item, collection] = await Promise.all([
      this.getItem(collectionId, itemId),
      this.getCollection(collectionId),
    ]);

    // Build prompt for LLM
    const prompt = this.buildUpdatePrompt(collection, item, instructions);
    const jsonResponse = await llm.generate(prompt);

    // Parse and validate
    let fieldData: Record<string, any>;
    try {
      fieldData = JSON.parse(jsonResponse);
    } catch {
      throw new WebflowError(
        'Failed to parse LLM response as JSON',
        'PARSE_ERROR',
        undefined,
        { response: jsonResponse }
      );
    }

    // Update the item
    return this.updateItem(collectionId, itemId, { fieldData });
  }

  /**
   * Search items using semantic search
   */
  async semanticSearch(
    collectionId: string,
    query: string,
    options: {
      searchFields?: string[];
      limit?: number;
      embedder?: { embed: (text: string) => Promise<number[]> };
    } = {}
  ): Promise<WebflowItem[]> {
    const { items } = await this.listItems(collectionId, {
      limit: options.limit || 100,
    });

    // Simple text search if no embedder
    if (!options.embedder) {
      const queryLower = query.toLowerCase();
      return items.filter(item => {
        const searchText = JSON.stringify(item.fieldData).toLowerCase();
        return searchText.includes(queryLower);
      });
    }

    // Semantic search with embeddings
    const queryEmbedding = await options.embedder.embed(query);

    const scoredItems = await Promise.all(
      items.map(async item => {
        const searchFields = options.searchFields || Object.keys(item.fieldData);
        const text = searchFields
          .map(f => item.fieldData[f])
          .filter(v => typeof v === 'string')
          .join(' ');

        const itemEmbedding = await options.embedder!.embed(text);
        const score = this.cosineSimilarity(queryEmbedding, itemEmbedding);

        return { item, score };
      })
    );

    return scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 10)
      .map(s => s.item);
  }

  // ===========================================================================
  // Bulk Operations
  // ===========================================================================

  /**
   * Create multiple items
   */
  async createItems(collectionId: string, items: CreateItemData[]): Promise<WebflowItem[]> {
    const results: WebflowItem[] = [];

    // Webflow API doesn't support bulk create, so we do them sequentially
    // with rate limiting
    for (const itemData of items) {
      const item = await this.createItem(collectionId, itemData);
      results.push(item);
      await this.sleep(100); // Rate limit protection
    }

    return results;
  }

  /**
   * Update multiple items
   */
  async updateItems(
    collectionId: string,
    updates: Array<{ itemId: string; data: UpdateItemData }>
  ): Promise<WebflowItem[]> {
    const results: WebflowItem[] = [];

    for (const { itemId, data } of updates) {
      const item = await this.updateItem(collectionId, itemId, data);
      results.push(item);
      await this.sleep(100); // Rate limit protection
    }

    return results;
  }

  /**
   * Delete multiple items
   */
  async deleteItems(collectionId: string, itemIds: string[]): Promise<void> {
    for (const itemId of itemIds) {
      await this.deleteItem(collectionId, itemId);
      await this.sleep(100); // Rate limit protection
    }
  }

  // ===========================================================================
  // RANA Integration Helpers
  // ===========================================================================

  /**
   * Create RANA tool definitions for Webflow operations
   */
  getToolDefinitions(): Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }> {
    return [
      {
        name: 'webflow_list_collections',
        description: 'List all CMS collections for the Webflow site',
        parameters: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'Site ID (optional if default set)' },
          },
        },
      },
      {
        name: 'webflow_list_items',
        description: 'List items in a Webflow CMS collection',
        parameters: {
          type: 'object',
          properties: {
            collectionId: { type: 'string', description: 'Collection ID' },
            limit: { type: 'number', description: 'Max items to return' },
          },
          required: ['collectionId'],
        },
      },
      {
        name: 'webflow_create_item',
        description: 'Create a new item in a Webflow CMS collection',
        parameters: {
          type: 'object',
          properties: {
            collectionId: { type: 'string', description: 'Collection ID' },
            fieldData: { type: 'object', description: 'Field values for the item' },
          },
          required: ['collectionId', 'fieldData'],
        },
      },
      {
        name: 'webflow_update_item',
        description: 'Update an existing Webflow CMS item',
        parameters: {
          type: 'object',
          properties: {
            collectionId: { type: 'string', description: 'Collection ID' },
            itemId: { type: 'string', description: 'Item ID' },
            fieldData: { type: 'object', description: 'Updated field values' },
          },
          required: ['collectionId', 'itemId', 'fieldData'],
        },
      },
      {
        name: 'webflow_delete_item',
        description: 'Delete a Webflow CMS item',
        parameters: {
          type: 'object',
          properties: {
            collectionId: { type: 'string', description: 'Collection ID' },
            itemId: { type: 'string', description: 'Item ID' },
          },
          required: ['collectionId', 'itemId'],
        },
      },
      {
        name: 'webflow_publish',
        description: 'Publish the Webflow site',
        parameters: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'Site ID' },
          },
        },
      },
    ];
  }

  /**
   * Execute a tool call
   */
  async executeTool(
    name: string,
    parameters: Record<string, any>
  ): Promise<any> {
    switch (name) {
      case 'webflow_list_collections':
        return this.listCollections(parameters.siteId);

      case 'webflow_list_items':
        return this.listItems(parameters.collectionId, {
          limit: parameters.limit,
        });

      case 'webflow_create_item':
        return this.createItem(parameters.collectionId, {
          fieldData: parameters.fieldData,
        });

      case 'webflow_update_item':
        return this.updateItem(
          parameters.collectionId,
          parameters.itemId,
          { fieldData: parameters.fieldData }
        );

      case 'webflow_delete_item':
        return this.deleteItem(parameters.collectionId, parameters.itemId);

      case 'webflow_publish':
        return this.publishSite(parameters.siteId);

      default:
        throw new WebflowError(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
    }
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private buildContentPrompt(collection: WebflowCollection, description: string): string {
    const fieldDescriptions = collection.fields
      .filter(f => f.isEditable)
      .map(f => `- ${f.slug} (${f.type}${f.isRequired ? ', required' : ''}): ${f.displayName}`)
      .join('\n');

    return `You are a content creator for a Webflow CMS collection.

Collection: ${collection.displayName}
Fields:
${fieldDescriptions}

Based on the following description, generate JSON with the field values:
"${description}"

Respond with ONLY valid JSON matching the field slugs above. Do not include any explanation.`;
  }

  private buildUpdatePrompt(
    collection: WebflowCollection,
    item: WebflowItem,
    instructions: string
  ): string {
    return `You are editing a Webflow CMS item.

Current item data:
${JSON.stringify(item.fieldData, null, 2)}

Collection fields:
${collection.fields.map(f => `- ${f.slug} (${f.type})`).join('\n')}

Instructions: "${instructions}"

Respond with ONLY the updated JSON field data. Include only fields that should change.`;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request(
    method: string,
    path: string,
    data?: Record<string, any>
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new WebflowError(
          errorBody.message || `Request failed: ${response.statusText}`,
          errorBody.code || 'REQUEST_FAILED',
          response.status,
          errorBody
        );
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof WebflowError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new WebflowError('Request timeout', 'TIMEOUT', 408);
      }

      throw new WebflowError(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR'
      );
    }
  }

  private transformSite(data: any): WebflowSite {
    return {
      id: data.id,
      workspaceId: data.workspaceId,
      displayName: data.displayName,
      shortName: data.shortName,
      previewUrl: data.previewUrl,
      customDomains: data.customDomains || [],
      lastPublished: data.lastPublished ? new Date(data.lastPublished) : undefined,
      lastUpdated: new Date(data.lastUpdated),
      timeZone: data.timeZone,
      locales: data.locales,
    };
  }

  private transformCollection(data: any): WebflowCollection {
    return {
      id: data.id,
      displayName: data.displayName,
      singularName: data.singularName,
      slug: data.slug,
      createdOn: new Date(data.createdOn),
      lastUpdated: new Date(data.lastUpdated),
      fields: data.fields || [],
    };
  }

  private transformItem(data: any): WebflowItem {
    return {
      id: data.id,
      cmsLocaleId: data.cmsLocaleId,
      lastPublished: data.lastPublished ? new Date(data.lastPublished) : undefined,
      lastUpdated: new Date(data.lastUpdated),
      createdOn: new Date(data.createdOn),
      isArchived: data.isArchived || false,
      isDraft: data.isDraft || false,
      fieldData: data.fieldData || {},
    };
  }

  private transformWebhook(data: any): WebflowWebhook {
    return {
      id: data.id,
      siteId: data.siteId,
      triggerType: data.triggerType,
      url: data.url,
      createdOn: new Date(data.createdOn),
      lastTriggered: data.lastTriggered ? new Date(data.lastTriggered) : undefined,
      filter: data.filter,
    };
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Webflow integration instance
 */
export function createWebflowIntegration(config: WebflowConfig): WebflowIntegration {
  return new WebflowIntegration(config);
}
