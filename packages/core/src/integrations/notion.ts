/**
 * Notion Integration for RANA
 *
 * Enables AI-powered knowledge management with Notion.
 * Create, query, and manage pages, databases, and blocks.
 *
 * @see https://developers.notion.com
 */

import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

export interface NotionConfig {
  /** Notion integration token */
  apiKey: string;
  /** Notion API version */
  apiVersion?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface NotionUser {
  id: string;
  type: 'person' | 'bot';
  name?: string;
  avatarUrl?: string;
  email?: string;
}

export interface NotionDatabase {
  id: string;
  createdTime: string;
  lastEditedTime: string;
  title: NotionRichText[];
  description?: NotionRichText[];
  icon?: NotionIcon;
  cover?: NotionFile;
  properties: Record<string, NotionPropertySchema>;
  parent: NotionParent;
  url: string;
  archived: boolean;
  isInline: boolean;
}

export interface NotionPage {
  id: string;
  createdTime: string;
  lastEditedTime: string;
  createdBy: { id: string };
  lastEditedBy: { id: string };
  cover?: NotionFile;
  icon?: NotionIcon;
  parent: NotionParent;
  archived: boolean;
  properties: Record<string, NotionPropertyValue>;
  url: string;
}

export interface NotionBlock {
  id: string;
  type: NotionBlockType;
  createdTime: string;
  lastEditedTime: string;
  hasChildren: boolean;
  archived: boolean;
  parent: NotionParent;
  [key: string]: any;
}

export type NotionBlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'to_do'
  | 'toggle'
  | 'code'
  | 'quote'
  | 'callout'
  | 'divider'
  | 'table_of_contents'
  | 'breadcrumb'
  | 'column_list'
  | 'column'
  | 'image'
  | 'video'
  | 'file'
  | 'pdf'
  | 'bookmark'
  | 'embed'
  | 'table'
  | 'table_row'
  | 'synced_block'
  | 'template'
  | 'link_to_page'
  | 'equation'
  | 'child_page'
  | 'child_database'
  | 'unsupported';

export interface NotionRichText {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string };
  };
  mention?: {
    type: 'user' | 'page' | 'database' | 'date' | 'link_preview';
    [key: string]: any;
  };
  equation?: {
    expression: string;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plainText: string;
  href?: string;
}

export interface NotionIcon {
  type: 'emoji' | 'external' | 'file';
  emoji?: string;
  external?: { url: string };
  file?: { url: string; expiryTime: string };
}

export interface NotionFile {
  type: 'external' | 'file';
  external?: { url: string };
  file?: { url: string; expiryTime: string };
}

export interface NotionParent {
  type: 'database_id' | 'page_id' | 'block_id' | 'workspace';
  database_id?: string;
  page_id?: string;
  block_id?: string;
  workspace?: boolean;
}

export type NotionPropertyType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'people'
  | 'files'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by'
  | 'status'
  | 'unique_id';

export interface NotionPropertySchema {
  id: string;
  name: string;
  type: NotionPropertyType;
  [key: string]: any;
}

export interface NotionPropertyValue {
  id: string;
  type: NotionPropertyType;
  [key: string]: any;
}

export interface QueryDatabaseOptions {
  filter?: NotionFilter;
  sorts?: NotionSort[];
  startCursor?: string;
  pageSize?: number;
}

export interface NotionFilter {
  and?: NotionFilter[];
  or?: NotionFilter[];
  property?: string;
  [key: string]: any;
}

export interface NotionSort {
  property?: string;
  timestamp?: 'created_time' | 'last_edited_time';
  direction: 'ascending' | 'descending';
}

export interface SearchOptions {
  query?: string;
  filter?: {
    value: 'page' | 'database';
    property: 'object';
  };
  sort?: {
    direction: 'ascending' | 'descending';
    timestamp: 'last_edited_time';
  };
  startCursor?: string;
  pageSize?: number;
}

export interface CreatePageOptions {
  parent: { database_id: string } | { page_id: string };
  properties: Record<string, any>;
  children?: any[];
  icon?: NotionIcon;
  cover?: { external: { url: string } };
}

export interface UpdatePageOptions {
  properties?: Record<string, any>;
  icon?: NotionIcon | null;
  cover?: { external: { url: string } } | null;
  archived?: boolean;
}

// =============================================================================
// Error Classes
// =============================================================================

export class NotionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'NotionError';
  }
}

// =============================================================================
// Notion Integration
// =============================================================================

export class NotionIntegration extends EventEmitter {
  private config: Required<NotionConfig>;
  private baseUrl = 'https://api.notion.com/v1';

  constructor(config: NotionConfig) {
    super();
    this.config = {
      apiVersion: '2022-06-28',
      timeout: 30000,
      debug: false,
      ...config,
    };
  }

  // ===========================================================================
  // User Operations
  // ===========================================================================

  /**
   * Get the bot user
   */
  async getMe(): Promise<NotionUser> {
    const response = await this.request('GET', '/users/me');
    return this.transformUser(response);
  }

  /**
   * List all users
   */
  async listUsers(startCursor?: string): Promise<{
    users: NotionUser[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = startCursor ? `?start_cursor=${startCursor}` : '';
    const response = await this.request('GET', `/users${params}`);

    return {
      users: response.results.map((u: any) => this.transformUser(u)),
      nextCursor: response.next_cursor || undefined,
      hasMore: response.has_more,
    };
  }

  // ===========================================================================
  // Database Operations
  // ===========================================================================

  /**
   * Get a database
   */
  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    const response = await this.request('GET', `/databases/${databaseId}`);
    return this.transformDatabase(response);
  }

  /**
   * Query a database
   */
  async queryDatabase(
    databaseId: string,
    options: QueryDatabaseOptions = {}
  ): Promise<{
    results: NotionPage[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const body: any = {};
    if (options.filter) body.filter = options.filter;
    if (options.sorts) body.sorts = options.sorts;
    if (options.startCursor) body.start_cursor = options.startCursor;
    if (options.pageSize) body.page_size = options.pageSize;

    const response = await this.request('POST', `/databases/${databaseId}/query`, body);

    return {
      results: response.results.map((p: any) => this.transformPage(p)),
      nextCursor: response.next_cursor || undefined,
      hasMore: response.has_more,
    };
  }

  /**
   * Query all pages from a database (handles pagination)
   */
  async queryAllPages(
    databaseId: string,
    options: Omit<QueryDatabaseOptions, 'startCursor' | 'pageSize'> = {}
  ): Promise<NotionPage[]> {
    const allPages: NotionPage[] = [];
    let cursor: string | undefined;

    do {
      const result = await this.queryDatabase(databaseId, {
        ...options,
        startCursor: cursor,
        pageSize: 100,
      });
      allPages.push(...result.results);
      cursor = result.nextCursor;
    } while (cursor);

    return allPages;
  }

  /**
   * Create a database
   */
  async createDatabase(options: {
    parent: { page_id: string };
    title: string;
    properties: Record<string, any>;
    icon?: NotionIcon;
    cover?: { external: { url: string } };
    isInline?: boolean;
  }): Promise<NotionDatabase> {
    const body = {
      parent: options.parent,
      title: [{ type: 'text', text: { content: options.title } }],
      properties: options.properties,
      icon: options.icon,
      cover: options.cover,
      is_inline: options.isInline,
    };

    const response = await this.request('POST', '/databases', body);
    const database = this.transformDatabase(response);

    this.emit('database:created', database);
    return database;
  }

  /**
   * Update a database
   */
  async updateDatabase(
    databaseId: string,
    options: {
      title?: string;
      description?: string;
      properties?: Record<string, any>;
      icon?: NotionIcon | null;
      cover?: { external: { url: string } } | null;
      archived?: boolean;
    }
  ): Promise<NotionDatabase> {
    const body: any = {};

    if (options.title) {
      body.title = [{ type: 'text', text: { content: options.title } }];
    }
    if (options.description !== undefined) {
      body.description = options.description
        ? [{ type: 'text', text: { content: options.description } }]
        : [];
    }
    if (options.properties) body.properties = options.properties;
    if (options.icon !== undefined) body.icon = options.icon;
    if (options.cover !== undefined) body.cover = options.cover;
    if (options.archived !== undefined) body.archived = options.archived;

    const response = await this.request('PATCH', `/databases/${databaseId}`, body);
    return this.transformDatabase(response);
  }

  // ===========================================================================
  // Page Operations
  // ===========================================================================

  /**
   * Get a page
   */
  async getPage(pageId: string): Promise<NotionPage> {
    const response = await this.request('GET', `/pages/${pageId}`);
    return this.transformPage(response);
  }

  /**
   * Create a page
   */
  async createPage(options: CreatePageOptions): Promise<NotionPage> {
    const body = {
      parent: options.parent,
      properties: options.properties,
      children: options.children,
      icon: options.icon,
      cover: options.cover,
    };

    const response = await this.request('POST', '/pages', body);
    const page = this.transformPage(response);

    this.emit('page:created', page);

    if (this.config.debug) {
      console.log(`[Notion] Created page ${page.id}`);
    }

    return page;
  }

  /**
   * Update a page
   */
  async updatePage(pageId: string, options: UpdatePageOptions): Promise<NotionPage> {
    const body: any = {};

    if (options.properties) body.properties = options.properties;
    if (options.icon !== undefined) body.icon = options.icon;
    if (options.cover !== undefined) body.cover = options.cover;
    if (options.archived !== undefined) body.archived = options.archived;

    const response = await this.request('PATCH', `/pages/${pageId}`, body);
    const page = this.transformPage(response);

    this.emit('page:updated', page);
    return page;
  }

  /**
   * Archive a page (soft delete)
   */
  async archivePage(pageId: string): Promise<NotionPage> {
    return this.updatePage(pageId, { archived: true });
  }

  /**
   * Restore a page
   */
  async restorePage(pageId: string): Promise<NotionPage> {
    return this.updatePage(pageId, { archived: false });
  }

  // ===========================================================================
  // Block Operations
  // ===========================================================================

  /**
   * Get a block
   */
  async getBlock(blockId: string): Promise<NotionBlock> {
    const response = await this.request('GET', `/blocks/${blockId}`);
    return this.transformBlock(response);
  }

  /**
   * Get block children
   */
  async getBlockChildren(
    blockId: string,
    startCursor?: string
  ): Promise<{
    results: NotionBlock[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = startCursor ? `?start_cursor=${startCursor}` : '';
    const response = await this.request('GET', `/blocks/${blockId}/children${params}`);

    return {
      results: response.results.map((b: any) => this.transformBlock(b)),
      nextCursor: response.next_cursor || undefined,
      hasMore: response.has_more,
    };
  }

  /**
   * Get all block children (handles pagination)
   */
  async getAllBlockChildren(blockId: string): Promise<NotionBlock[]> {
    const allBlocks: NotionBlock[] = [];
    let cursor: string | undefined;

    do {
      const result = await this.getBlockChildren(blockId, cursor);
      allBlocks.push(...result.results);
      cursor = result.nextCursor;
    } while (cursor);

    return allBlocks;
  }

  /**
   * Append block children
   */
  async appendBlockChildren(
    blockId: string,
    children: any[]
  ): Promise<NotionBlock[]> {
    const response = await this.request('PATCH', `/blocks/${blockId}/children`, {
      children,
    });

    const blocks = response.results.map((b: any) => this.transformBlock(b));
    this.emit('blocks:appended', { parentId: blockId, blocks });

    return blocks;
  }

  /**
   * Update a block
   */
  async updateBlock(blockId: string, data: Record<string, any>): Promise<NotionBlock> {
    const response = await this.request('PATCH', `/blocks/${blockId}`, data);
    return this.transformBlock(response);
  }

  /**
   * Delete a block
   */
  async deleteBlock(blockId: string): Promise<void> {
    await this.request('DELETE', `/blocks/${blockId}`);
    this.emit('block:deleted', blockId);
  }

  // ===========================================================================
  // Search
  // ===========================================================================

  /**
   * Search across all pages and databases
   */
  async search(options: SearchOptions = {}): Promise<{
    results: Array<NotionPage | NotionDatabase>;
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const body: any = {};
    if (options.query) body.query = options.query;
    if (options.filter) body.filter = options.filter;
    if (options.sort) body.sort = options.sort;
    if (options.startCursor) body.start_cursor = options.startCursor;
    if (options.pageSize) body.page_size = options.pageSize;

    const response = await this.request('POST', '/search', body);

    return {
      results: response.results.map((r: any) =>
        r.object === 'page' ? this.transformPage(r) : this.transformDatabase(r)
      ),
      nextCursor: response.next_cursor || undefined,
      hasMore: response.has_more,
    };
  }

  // ===========================================================================
  // Content Helpers
  // ===========================================================================

  /**
   * Create rich text from plain string
   */
  createRichText(text: string, options?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
    link?: string;
  }): any {
    return {
      type: 'text',
      text: {
        content: text,
        link: options?.link ? { url: options.link } : undefined,
      },
      annotations: {
        bold: options?.bold || false,
        italic: options?.italic || false,
        strikethrough: options?.strikethrough || false,
        underline: options?.underline || false,
        code: options?.code || false,
        color: options?.color || 'default',
      },
    };
  }

  /**
   * Create a paragraph block
   */
  createParagraph(text: string): any {
    return {
      type: 'paragraph',
      paragraph: {
        rich_text: [this.createRichText(text)],
      },
    };
  }

  /**
   * Create a heading block
   */
  createHeading(text: string, level: 1 | 2 | 3 = 1): any {
    const type = `heading_${level}`;
    return {
      type,
      [type]: {
        rich_text: [this.createRichText(text)],
      },
    };
  }

  /**
   * Create a bulleted list item
   */
  createBulletedListItem(text: string): any {
    return {
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [this.createRichText(text)],
      },
    };
  }

  /**
   * Create a numbered list item
   */
  createNumberedListItem(text: string): any {
    return {
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [this.createRichText(text)],
      },
    };
  }

  /**
   * Create a to-do item
   */
  createToDo(text: string, checked: boolean = false): any {
    return {
      type: 'to_do',
      to_do: {
        rich_text: [this.createRichText(text)],
        checked,
      },
    };
  }

  /**
   * Create a code block
   */
  createCodeBlock(code: string, language: string = 'plain text'): any {
    return {
      type: 'code',
      code: {
        rich_text: [this.createRichText(code)],
        language,
      },
    };
  }

  /**
   * Create a callout block
   */
  createCallout(text: string, emoji: string = '💡'): any {
    return {
      type: 'callout',
      callout: {
        rich_text: [this.createRichText(text)],
        icon: { type: 'emoji', emoji },
      },
    };
  }

  /**
   * Create a quote block
   */
  createQuote(text: string): any {
    return {
      type: 'quote',
      quote: {
        rich_text: [this.createRichText(text)],
      },
    };
  }

  /**
   * Create a divider block
   */
  createDivider(): any {
    return { type: 'divider', divider: {} };
  }

  // ===========================================================================
  // AI-Powered Operations
  // ===========================================================================

  /**
   * Create a page from natural language description
   */
  async createPageFromDescription(
    databaseId: string,
    description: string,
    llm: { generate: (prompt: string) => Promise<string> }
  ): Promise<NotionPage> {
    // Get database schema
    const database = await this.getDatabase(databaseId);

    // Build prompt
    const prompt = this.buildCreatePrompt(database, description);
    const jsonResponse = await llm.generate(prompt);

    // Parse and create
    let properties: Record<string, any>;
    try {
      properties = JSON.parse(jsonResponse);
    } catch {
      throw new NotionError('Failed to parse LLM response', 'PARSE_ERROR');
    }

    return this.createPage({
      parent: { database_id: databaseId },
      properties: this.convertToNotionProperties(properties, database.properties),
    });
  }

  /**
   * Generate page content from outline
   */
  async generatePageContent(
    outline: string,
    llm: { generate: (prompt: string) => Promise<string> }
  ): Promise<any[]> {
    const prompt = `Generate Notion page content blocks based on this outline:
${outline}

Return a JSON array of Notion blocks. Use these block types:
- heading_1, heading_2, heading_3 for headings
- paragraph for text
- bulleted_list_item for bullet points
- numbered_list_item for numbered lists
- code for code snippets
- quote for quotes
- callout for important notes

Example format:
[
  { "type": "heading_1", "content": "Title" },
  { "type": "paragraph", "content": "Some text" },
  { "type": "bulleted_list_item", "content": "A bullet point" }
]

Only return the JSON array, no explanation.`;

    const response = await llm.generate(prompt);
    let items: Array<{ type: string; content: string }>;

    try {
      items = JSON.parse(response);
    } catch {
      throw new NotionError('Failed to parse LLM response', 'PARSE_ERROR');
    }

    // Convert to Notion blocks
    return items.map(item => {
      switch (item.type) {
        case 'heading_1':
          return this.createHeading(item.content, 1);
        case 'heading_2':
          return this.createHeading(item.content, 2);
        case 'heading_3':
          return this.createHeading(item.content, 3);
        case 'paragraph':
          return this.createParagraph(item.content);
        case 'bulleted_list_item':
          return this.createBulletedListItem(item.content);
        case 'numbered_list_item':
          return this.createNumberedListItem(item.content);
        case 'code':
          return this.createCodeBlock(item.content);
        case 'quote':
          return this.createQuote(item.content);
        case 'callout':
          return this.createCallout(item.content);
        default:
          return this.createParagraph(item.content);
      }
    });
  }

  /**
   * Search pages using natural language
   */
  async searchNatural(
    query: string,
    options: {
      filterType?: 'page' | 'database';
      limit?: number;
    } = {}
  ): Promise<Array<NotionPage | NotionDatabase>> {
    const searchResult = await this.search({
      query,
      filter: options.filterType
        ? { value: options.filterType, property: 'object' }
        : undefined,
      pageSize: options.limit || 10,
    });

    return searchResult.results;
  }

  // ===========================================================================
  // RANA Integration Helpers
  // ===========================================================================

  /**
   * Get tool definitions for RANA agents
   */
  getToolDefinitions(): Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }> {
    return [
      {
        name: 'notion_search',
        description: 'Search Notion pages and databases',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            type: { type: 'string', enum: ['page', 'database'], description: 'Filter by type' },
            limit: { type: 'number', description: 'Max results' },
          },
        },
      },
      {
        name: 'notion_get_page',
        description: 'Get a Notion page by ID',
        parameters: {
          type: 'object',
          properties: {
            pageId: { type: 'string', description: 'Page ID' },
          },
          required: ['pageId'],
        },
      },
      {
        name: 'notion_create_page',
        description: 'Create a new Notion page in a database',
        parameters: {
          type: 'object',
          properties: {
            databaseId: { type: 'string', description: 'Database ID' },
            properties: { type: 'object', description: 'Page properties' },
            content: { type: 'string', description: 'Optional initial content' },
          },
          required: ['databaseId', 'properties'],
        },
      },
      {
        name: 'notion_update_page',
        description: 'Update a Notion page',
        parameters: {
          type: 'object',
          properties: {
            pageId: { type: 'string', description: 'Page ID' },
            properties: { type: 'object', description: 'Properties to update' },
          },
          required: ['pageId', 'properties'],
        },
      },
      {
        name: 'notion_query_database',
        description: 'Query a Notion database',
        parameters: {
          type: 'object',
          properties: {
            databaseId: { type: 'string', description: 'Database ID' },
            filter: { type: 'object', description: 'Filter criteria' },
            sorts: { type: 'array', description: 'Sort criteria' },
          },
          required: ['databaseId'],
        },
      },
      {
        name: 'notion_append_content',
        description: 'Append content blocks to a page',
        parameters: {
          type: 'object',
          properties: {
            pageId: { type: 'string', description: 'Page ID' },
            content: { type: 'string', description: 'Content to append' },
          },
          required: ['pageId', 'content'],
        },
      },
    ];
  }

  /**
   * Execute a tool call
   */
  async executeTool(name: string, params: Record<string, any>): Promise<any> {
    switch (name) {
      case 'notion_search':
        return this.search({
          query: params.query,
          filter: params.type
            ? { value: params.type, property: 'object' }
            : undefined,
          pageSize: params.limit,
        });

      case 'notion_get_page':
        return this.getPage(params.pageId);

      case 'notion_create_page':
        const createOptions: CreatePageOptions = {
          parent: { database_id: params.databaseId },
          properties: params.properties,
        };
        if (params.content) {
          createOptions.children = [this.createParagraph(params.content)];
        }
        return this.createPage(createOptions);

      case 'notion_update_page':
        return this.updatePage(params.pageId, {
          properties: params.properties,
        });

      case 'notion_query_database':
        return this.queryDatabase(params.databaseId, {
          filter: params.filter,
          sorts: params.sorts,
        });

      case 'notion_append_content':
        return this.appendBlockChildren(params.pageId, [
          this.createParagraph(params.content),
        ]);

      default:
        throw new NotionError(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
    }
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private buildCreatePrompt(database: NotionDatabase, description: string): string {
    const propertyDescriptions = Object.entries(database.properties)
      .filter(([_, prop]) => !['formula', 'rollup', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by'].includes(prop.type))
      .map(([name, prop]) => `- ${name} (${prop.type})`)
      .join('\n');

    const title = database.title.map(t => t.plainText).join('') || 'Untitled';

    return `You are creating a page in a Notion database.

Database: ${title}
Properties:
${propertyDescriptions}

Based on this description, generate JSON with property values:
"${description}"

Respond with ONLY valid JSON matching the property names. For title and rich_text, use plain strings.
For select/multi_select, use the option name as a string.
For date, use ISO format.
For checkbox, use boolean.`;
  }

  private convertToNotionProperties(
    data: Record<string, any>,
    schema: Record<string, NotionPropertySchema>
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [name, value] of Object.entries(data)) {
      const propSchema = schema[name];
      if (!propSchema) continue;

      switch (propSchema.type) {
        case 'title':
          result[name] = {
            title: [{ type: 'text', text: { content: String(value) } }],
          };
          break;
        case 'rich_text':
          result[name] = {
            rich_text: [{ type: 'text', text: { content: String(value) } }],
          };
          break;
        case 'number':
          result[name] = { number: Number(value) };
          break;
        case 'select':
          result[name] = { select: { name: String(value) } };
          break;
        case 'multi_select':
          result[name] = {
            multi_select: (Array.isArray(value) ? value : [value]).map((v: any) => ({ name: String(v) })),
          };
          break;
        case 'date':
          result[name] = { date: { start: value } };
          break;
        case 'checkbox':
          result[name] = { checkbox: Boolean(value) };
          break;
        case 'url':
          result[name] = { url: String(value) };
          break;
        case 'email':
          result[name] = { email: String(value) };
          break;
        case 'phone_number':
          result[name] = { phone_number: String(value) };
          break;
        case 'status':
          result[name] = { status: { name: String(value) } };
          break;
        default:
          // Skip unsupported types
          break;
      }
    }

    return result;
  }

  private async request(
    method: string,
    path: string,
    data?: Record<string, any>
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': this.config.apiVersion,
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
        throw new NotionError(
          errorBody.message || `Request failed: ${response.statusText}`,
          errorBody.code || 'REQUEST_FAILED',
          response.status,
          errorBody
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof NotionError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NotionError('Request timeout', 'TIMEOUT', 408);
      }

      throw new NotionError(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR'
      );
    }
  }

  private transformUser(data: any): NotionUser {
    return {
      id: data.id,
      type: data.type,
      name: data.name,
      avatarUrl: data.avatar_url,
      email: data.person?.email,
    };
  }

  private transformDatabase(data: any): NotionDatabase {
    return {
      id: data.id,
      createdTime: data.created_time,
      lastEditedTime: data.last_edited_time,
      title: data.title || [],
      description: data.description,
      icon: data.icon,
      cover: data.cover,
      properties: data.properties,
      parent: data.parent,
      url: data.url,
      archived: data.archived,
      isInline: data.is_inline,
    };
  }

  private transformPage(data: any): NotionPage {
    return {
      id: data.id,
      createdTime: data.created_time,
      lastEditedTime: data.last_edited_time,
      createdBy: data.created_by,
      lastEditedBy: data.last_edited_by,
      cover: data.cover,
      icon: data.icon,
      parent: data.parent,
      archived: data.archived,
      properties: data.properties,
      url: data.url,
    };
  }

  private transformBlock(data: any): NotionBlock {
    return {
      id: data.id,
      type: data.type,
      createdTime: data.created_time,
      lastEditedTime: data.last_edited_time,
      hasChildren: data.has_children,
      archived: data.archived,
      parent: data.parent,
      [data.type]: data[data.type],
    };
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Notion integration instance
 */
export function createNotionIntegration(config: NotionConfig): NotionIntegration {
  return new NotionIntegration(config);
}
