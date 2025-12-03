/**
 * Airtable Integration for RANA
 *
 * Enables AI-powered database operations with Airtable.
 * Create, read, update, and query records using natural language.
 *
 * @see https://airtable.com/developers/web/api
 */

import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

export interface AirtableConfig {
  /** Personal access token */
  apiKey: string;
  /** Base ID (optional, can be specified per operation) */
  baseId?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface AirtableBase {
  /** Base ID */
  id: string;
  /** Base name */
  name: string;
  /** Permission level */
  permissionLevel: 'none' | 'read' | 'comment' | 'edit' | 'create';
}

export interface AirtableTable {
  /** Table ID */
  id: string;
  /** Table name */
  name: string;
  /** Primary field ID */
  primaryFieldId: string;
  /** Table fields */
  fields: AirtableField[];
  /** Table views */
  views: AirtableView[];
}

export interface AirtableField {
  /** Field ID */
  id: string;
  /** Field name */
  name: string;
  /** Field type */
  type: AirtableFieldType;
  /** Field description */
  description?: string;
  /** Field options */
  options?: Record<string, any>;
}

export type AirtableFieldType =
  | 'singleLineText'
  | 'email'
  | 'url'
  | 'multilineText'
  | 'number'
  | 'percent'
  | 'currency'
  | 'singleSelect'
  | 'multipleSelects'
  | 'singleCollaborator'
  | 'multipleCollaborators'
  | 'multipleRecordLinks'
  | 'date'
  | 'dateTime'
  | 'phoneNumber'
  | 'multipleAttachments'
  | 'checkbox'
  | 'formula'
  | 'createdTime'
  | 'rollup'
  | 'count'
  | 'lookup'
  | 'multipleLookupValues'
  | 'autoNumber'
  | 'barcode'
  | 'rating'
  | 'richText'
  | 'duration'
  | 'lastModifiedTime'
  | 'button'
  | 'createdBy'
  | 'lastModifiedBy'
  | 'externalSyncSource'
  | 'aiText';

export interface AirtableView {
  /** View ID */
  id: string;
  /** View name */
  name: string;
  /** View type */
  type: 'grid' | 'form' | 'calendar' | 'gallery' | 'kanban' | 'timeline' | 'block';
}

export interface AirtableRecord {
  /** Record ID */
  id: string;
  /** Creation time */
  createdTime: string;
  /** Field values */
  fields: Record<string, any>;
}

export interface ListRecordsOptions {
  /** Fields to return */
  fields?: string[];
  /** Filter formula */
  filterByFormula?: string;
  /** Max records to return */
  maxRecords?: number;
  /** Page size */
  pageSize?: number;
  /** Sort by fields */
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  /** View ID or name */
  view?: string;
  /** Cell format */
  cellFormat?: 'json' | 'string';
  /** Time zone */
  timeZone?: string;
  /** User locale */
  userLocale?: string;
  /** Return fields by ID */
  returnFieldsByFieldId?: boolean;
  /** Offset for pagination */
  offset?: string;
}

export interface CreateRecordData {
  /** Field values */
  fields: Record<string, any>;
  /** Typecast values */
  typecast?: boolean;
}

export interface UpdateRecordData {
  /** Record ID */
  id: string;
  /** Field values to update */
  fields: Record<string, any>;
  /** Typecast values */
  typecast?: boolean;
}

export interface WebhookPayload {
  /** Base ID */
  base: { id: string };
  /** Webhook ID */
  webhook: { id: string };
  /** Timestamp */
  timestamp: string;
  /** Action details */
  actionMetadata: {
    source: 'client' | 'publicApi' | 'automation' | 'sync' | 'system';
    sourceMetadata?: Record<string, any>;
  };
  /** Payload by table */
  payloadsByTable: Record<string, {
    created?: string[];
    updated?: string[];
    deleted?: string[];
    changedFieldsById?: Record<string, string[]>;
  }>;
}

// =============================================================================
// Error Classes
// =============================================================================

export class AirtableError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AirtableError';
  }
}

// =============================================================================
// Airtable Integration
// =============================================================================

export class AirtableIntegration extends EventEmitter {
  private config: Required<Omit<AirtableConfig, 'baseId'>> & Pick<AirtableConfig, 'baseId'>;
  private baseUrl = 'https://api.airtable.com/v0';
  private metaUrl = 'https://api.airtable.com/v0/meta';

  constructor(config: AirtableConfig) {
    super();
    this.config = {
      timeout: 30000,
      debug: false,
      ...config,
    };
  }

  // ===========================================================================
  // Base Operations
  // ===========================================================================

  /**
   * List all accessible bases
   */
  async listBases(): Promise<AirtableBase[]> {
    const response = await this.request('GET', '/bases', undefined, true);
    return response.bases.map((b: any) => ({
      id: b.id,
      name: b.name,
      permissionLevel: b.permissionLevel,
    }));
  }

  /**
   * Get base schema (tables and fields)
   */
  async getBaseSchema(baseId?: string): Promise<{ tables: AirtableTable[] }> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    const response = await this.request('GET', `/bases/${id}/tables`, undefined, true);
    return {
      tables: response.tables.map((t: any) => this.transformTable(t)),
    };
  }

  // ===========================================================================
  // Table Operations
  // ===========================================================================

  /**
   * Create a new table
   */
  async createTable(
    name: string,
    fields: Array<{
      name: string;
      type: AirtableFieldType;
      description?: string;
      options?: Record<string, any>;
    }>,
    baseId?: string
  ): Promise<AirtableTable> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    const response = await this.request(
      'POST',
      `/bases/${id}/tables`,
      { name, fields },
      true
    );

    const table = this.transformTable(response);
    this.emit('table:created', table);
    return table;
  }

  /**
   * Update table schema
   */
  async updateTable(
    tableId: string,
    updates: { name?: string; description?: string },
    baseId?: string
  ): Promise<AirtableTable> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    const response = await this.request(
      'PATCH',
      `/bases/${id}/tables/${tableId}`,
      updates,
      true
    );

    return this.transformTable(response);
  }

  // ===========================================================================
  // Record Operations
  // ===========================================================================

  /**
   * List records from a table
   */
  async listRecords(
    tableIdOrName: string,
    options: ListRecordsOptions = {},
    baseId?: string
  ): Promise<{ records: AirtableRecord[]; offset?: string }> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    const params = new URLSearchParams();
    if (options.fields) {
      options.fields.forEach(f => params.append('fields[]', f));
    }
    if (options.filterByFormula) params.set('filterByFormula', options.filterByFormula);
    if (options.maxRecords) params.set('maxRecords', options.maxRecords.toString());
    if (options.pageSize) params.set('pageSize', options.pageSize.toString());
    if (options.sort) {
      options.sort.forEach((s, i) => {
        params.set(`sort[${i}][field]`, s.field);
        params.set(`sort[${i}][direction]`, s.direction);
      });
    }
    if (options.view) params.set('view', options.view);
    if (options.cellFormat) params.set('cellFormat', options.cellFormat);
    if (options.timeZone) params.set('timeZone', options.timeZone);
    if (options.userLocale) params.set('userLocale', options.userLocale);
    if (options.returnFieldsByFieldId) params.set('returnFieldsByFieldId', 'true');
    if (options.offset) params.set('offset', options.offset);

    const queryString = params.toString();
    const path = `/${id}/${encodeURIComponent(tableIdOrName)}${queryString ? `?${queryString}` : ''}`;

    const response = await this.request('GET', path);

    return {
      records: response.records.map((r: any) => this.transformRecord(r)),
      offset: response.offset,
    };
  }

  /**
   * Get all records (handles pagination automatically)
   */
  async getAllRecords(
    tableIdOrName: string,
    options: Omit<ListRecordsOptions, 'offset' | 'pageSize'> = {},
    baseId?: string
  ): Promise<AirtableRecord[]> {
    const allRecords: AirtableRecord[] = [];
    let offset: string | undefined;

    do {
      const result = await this.listRecords(
        tableIdOrName,
        { ...options, offset, pageSize: 100 },
        baseId
      );
      allRecords.push(...result.records);
      offset = result.offset;
    } while (offset);

    return allRecords;
  }

  /**
   * Get a single record
   */
  async getRecord(
    tableIdOrName: string,
    recordId: string,
    baseId?: string
  ): Promise<AirtableRecord> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    const response = await this.request(
      'GET',
      `/${id}/${encodeURIComponent(tableIdOrName)}/${recordId}`
    );

    return this.transformRecord(response);
  }

  /**
   * Create a new record
   */
  async createRecord(
    tableIdOrName: string,
    data: CreateRecordData,
    baseId?: string
  ): Promise<AirtableRecord> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    const response = await this.request(
      'POST',
      `/${id}/${encodeURIComponent(tableIdOrName)}`,
      data
    );

    const record = this.transformRecord(response);
    this.emit('record:created', { table: tableIdOrName, record });

    if (this.config.debug) {
      console.log(`[Airtable] Created record ${record.id} in ${tableIdOrName}`);
    }

    return record;
  }

  /**
   * Create multiple records
   */
  async createRecords(
    tableIdOrName: string,
    records: CreateRecordData[],
    baseId?: string
  ): Promise<AirtableRecord[]> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    // Airtable allows max 10 records per request
    const results: AirtableRecord[] = [];
    const batches = this.chunk(records, 10);

    for (const batch of batches) {
      const response = await this.request(
        'POST',
        `/${id}/${encodeURIComponent(tableIdOrName)}`,
        { records: batch }
      );

      const created = response.records.map((r: any) => this.transformRecord(r));
      results.push(...created);
      this.emit('records:created', { table: tableIdOrName, records: created });

      // Rate limit protection
      await this.sleep(200);
    }

    return results;
  }

  /**
   * Update a record
   */
  async updateRecord(
    tableIdOrName: string,
    recordId: string,
    fields: Record<string, any>,
    options: { typecast?: boolean } = {},
    baseId?: string
  ): Promise<AirtableRecord> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    const response = await this.request(
      'PATCH',
      `/${id}/${encodeURIComponent(tableIdOrName)}/${recordId}`,
      { fields, typecast: options.typecast }
    );

    const record = this.transformRecord(response);
    this.emit('record:updated', { table: tableIdOrName, record });

    return record;
  }

  /**
   * Update multiple records
   */
  async updateRecords(
    tableIdOrName: string,
    updates: UpdateRecordData[],
    baseId?: string
  ): Promise<AirtableRecord[]> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    const results: AirtableRecord[] = [];
    const batches = this.chunk(updates, 10);

    for (const batch of batches) {
      const response = await this.request(
        'PATCH',
        `/${id}/${encodeURIComponent(tableIdOrName)}`,
        { records: batch }
      );

      const updated = response.records.map((r: any) => this.transformRecord(r));
      results.push(...updated);

      await this.sleep(200);
    }

    this.emit('records:updated', { table: tableIdOrName, records: results });
    return results;
  }

  /**
   * Replace a record (destructive update)
   */
  async replaceRecord(
    tableIdOrName: string,
    recordId: string,
    fields: Record<string, any>,
    options: { typecast?: boolean } = {},
    baseId?: string
  ): Promise<AirtableRecord> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    const response = await this.request(
      'PUT',
      `/${id}/${encodeURIComponent(tableIdOrName)}/${recordId}`,
      { fields, typecast: options.typecast }
    );

    return this.transformRecord(response);
  }

  /**
   * Delete a record
   */
  async deleteRecord(
    tableIdOrName: string,
    recordId: string,
    baseId?: string
  ): Promise<void> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    await this.request(
      'DELETE',
      `/${id}/${encodeURIComponent(tableIdOrName)}/${recordId}`
    );

    this.emit('record:deleted', { table: tableIdOrName, recordId });
  }

  /**
   * Delete multiple records
   */
  async deleteRecords(
    tableIdOrName: string,
    recordIds: string[],
    baseId?: string
  ): Promise<void> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    const batches = this.chunk(recordIds, 10);

    for (const batch of batches) {
      const params = batch.map(rid => `records[]=${rid}`).join('&');
      await this.request(
        'DELETE',
        `/${id}/${encodeURIComponent(tableIdOrName)}?${params}`
      );

      await this.sleep(200);
    }

    this.emit('records:deleted', { table: tableIdOrName, recordIds });
  }

  // ===========================================================================
  // Query Helpers
  // ===========================================================================

  /**
   * Build a filter formula from conditions
   */
  buildFormula(conditions: Array<{
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'blank' | 'notblank';
    value?: any;
  }>, logic: 'AND' | 'OR' = 'AND'): string {
    const formulas = conditions.map(c => {
      const fieldRef = `{${c.field}}`;

      switch (c.operator) {
        case '=':
          return `${fieldRef} = ${this.formatValue(c.value)}`;
        case '!=':
          return `${fieldRef} != ${this.formatValue(c.value)}`;
        case '>':
          return `${fieldRef} > ${this.formatValue(c.value)}`;
        case '<':
          return `${fieldRef} < ${this.formatValue(c.value)}`;
        case '>=':
          return `${fieldRef} >= ${this.formatValue(c.value)}`;
        case '<=':
          return `${fieldRef} <= ${this.formatValue(c.value)}`;
        case 'contains':
          return `FIND("${c.value}", ${fieldRef})`;
        case 'blank':
          return `${fieldRef} = BLANK()`;
        case 'notblank':
          return `${fieldRef} != BLANK()`;
        default:
          return '';
      }
    }).filter(Boolean);

    if (formulas.length === 0) return '';
    if (formulas.length === 1) return formulas[0];

    return `${logic}(${formulas.join(', ')})`;
  }

  /**
   * Search records by text
   */
  async searchRecords(
    tableIdOrName: string,
    query: string,
    options: {
      searchFields?: string[];
      limit?: number;
      baseId?: string;
    } = {}
  ): Promise<AirtableRecord[]> {
    const { searchFields, limit = 100, baseId } = options;

    // Get all records (or with field filter)
    const records = await this.getAllRecords(
      tableIdOrName,
      { fields: searchFields, maxRecords: limit },
      baseId
    );

    // Simple text search
    const queryLower = query.toLowerCase();
    return records.filter(record => {
      const searchText = JSON.stringify(record.fields).toLowerCase();
      return searchText.includes(queryLower);
    });
  }

  // ===========================================================================
  // AI-Powered Operations
  // ===========================================================================

  /**
   * Create record from natural language description
   */
  async createFromDescription(
    tableIdOrName: string,
    description: string,
    llm: { generate: (prompt: string) => Promise<string> },
    baseId?: string
  ): Promise<AirtableRecord> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    // Get table schema
    const schema = await this.getBaseSchema(id);
    const table = schema.tables.find(
      t => t.id === tableIdOrName || t.name === tableIdOrName
    );

    if (!table) {
      throw new AirtableError(`Table not found: ${tableIdOrName}`, 'TABLE_NOT_FOUND');
    }

    // Build prompt
    const prompt = this.buildCreatePrompt(table, description);
    const jsonResponse = await llm.generate(prompt);

    // Parse and create
    let fields: Record<string, any>;
    try {
      fields = JSON.parse(jsonResponse);
    } catch {
      throw new AirtableError('Failed to parse LLM response', 'PARSE_ERROR');
    }

    return this.createRecord(tableIdOrName, { fields }, id);
  }

  /**
   * Query records using natural language
   */
  async queryNatural(
    tableIdOrName: string,
    query: string,
    llm: { generate: (prompt: string) => Promise<string> },
    baseId?: string
  ): Promise<AirtableRecord[]> {
    const id = baseId || this.config.baseId;
    if (!id) throw new AirtableError('Base ID required', 'BASE_ID_REQUIRED');

    // Get table schema
    const schema = await this.getBaseSchema(id);
    const table = schema.tables.find(
      t => t.id === tableIdOrName || t.name === tableIdOrName
    );

    if (!table) {
      throw new AirtableError(`Table not found: ${tableIdOrName}`, 'TABLE_NOT_FOUND');
    }

    // Build prompt for formula generation
    const prompt = this.buildQueryPrompt(table, query);
    const formula = await llm.generate(prompt);

    // Execute query
    return this.getAllRecords(tableIdOrName, { filterByFormula: formula.trim() }, id);
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
        name: 'airtable_list_records',
        description: 'List records from an Airtable table with optional filtering',
        parameters: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name or ID' },
            filter: { type: 'string', description: 'Airtable formula for filtering' },
            maxRecords: { type: 'number', description: 'Maximum records to return' },
          },
          required: ['table'],
        },
      },
      {
        name: 'airtable_create_record',
        description: 'Create a new record in an Airtable table',
        parameters: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name or ID' },
            fields: { type: 'object', description: 'Field values for the record' },
          },
          required: ['table', 'fields'],
        },
      },
      {
        name: 'airtable_update_record',
        description: 'Update an existing Airtable record',
        parameters: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name or ID' },
            recordId: { type: 'string', description: 'Record ID to update' },
            fields: { type: 'object', description: 'Field values to update' },
          },
          required: ['table', 'recordId', 'fields'],
        },
      },
      {
        name: 'airtable_delete_record',
        description: 'Delete an Airtable record',
        parameters: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name or ID' },
            recordId: { type: 'string', description: 'Record ID to delete' },
          },
          required: ['table', 'recordId'],
        },
      },
      {
        name: 'airtable_search',
        description: 'Search records by text',
        parameters: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name or ID' },
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Max results' },
          },
          required: ['table', 'query'],
        },
      },
    ];
  }

  /**
   * Execute a tool call
   */
  async executeTool(name: string, params: Record<string, any>): Promise<any> {
    switch (name) {
      case 'airtable_list_records':
        return this.listRecords(params.table, {
          filterByFormula: params.filter,
          maxRecords: params.maxRecords,
        });

      case 'airtable_create_record':
        return this.createRecord(params.table, { fields: params.fields });

      case 'airtable_update_record':
        return this.updateRecord(params.table, params.recordId, params.fields);

      case 'airtable_delete_record':
        await this.deleteRecord(params.table, params.recordId);
        return { success: true };

      case 'airtable_search':
        return this.searchRecords(params.table, params.query, {
          limit: params.limit,
        });

      default:
        throw new AirtableError(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
    }
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private buildCreatePrompt(table: AirtableTable, description: string): string {
    const fieldDescriptions = table.fields
      .filter(f => !['formula', 'rollup', 'count', 'lookup', 'autoNumber', 'createdTime', 'lastModifiedTime', 'createdBy', 'lastModifiedBy'].includes(f.type))
      .map(f => `- ${f.name} (${f.type})${f.description ? `: ${f.description}` : ''}`)
      .join('\n');

    return `You are creating a record for an Airtable table.

Table: ${table.name}
Fields:
${fieldDescriptions}

Based on this description, generate JSON with field values:
"${description}"

Respond with ONLY valid JSON matching the field names above. No explanation.`;
  }

  private buildQueryPrompt(table: AirtableTable, query: string): string {
    const fieldDescriptions = table.fields
      .map(f => `- ${f.name} (${f.type})`)
      .join('\n');

    return `You are writing an Airtable formula to filter records.

Table: ${table.name}
Fields:
${fieldDescriptions}

User query: "${query}"

Write an Airtable formula to filter records matching this query.
Only respond with the formula, nothing else.
Use proper Airtable formula syntax (e.g., {Field Name} = "value", AND(), OR(), FIND(), etc.)`;
  }

  private formatValue(value: any): string {
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'TRUE()' : 'FALSE()';
    if (value === null) return 'BLANK()';
    return JSON.stringify(value);
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request(
    method: string,
    path: string,
    data?: Record<string, any>,
    useMeta?: boolean
  ): Promise<any> {
    const baseUrl = useMeta ? this.metaUrl : this.baseUrl;
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
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
        throw new AirtableError(
          errorBody.error?.message || `Request failed: ${response.statusText}`,
          errorBody.error?.type || 'REQUEST_FAILED',
          response.status,
          errorBody
        );
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AirtableError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AirtableError('Request timeout', 'TIMEOUT', 408);
      }

      throw new AirtableError(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR'
      );
    }
  }

  private transformTable(data: any): AirtableTable {
    return {
      id: data.id,
      name: data.name,
      primaryFieldId: data.primaryFieldId,
      fields: data.fields || [],
      views: data.views || [],
    };
  }

  private transformRecord(data: any): AirtableRecord {
    return {
      id: data.id,
      createdTime: data.createdTime,
      fields: data.fields || {},
    };
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an Airtable integration instance
 */
export function createAirtableIntegration(config: AirtableConfig): AirtableIntegration {
  return new AirtableIntegration(config);
}
