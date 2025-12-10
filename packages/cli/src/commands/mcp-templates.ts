/**
 * Advanced MCP Server Templates
 * Production-ready templates for common use cases
 */

export interface MCPTemplate {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'integration' | 'ai' | 'utility' | 'enterprise';
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  generateCode: (config: TemplateConfig) => string;
}

export interface TemplateConfig {
  name: string;
  description?: string;
  isTypeScript: boolean;
}

// ============================================================================
// Template Registry
// ============================================================================

export const mcpTemplates: MCPTemplate[] = [
  // -------------------------------------------------------------------------
  // DATABASE TEMPLATE
  // -------------------------------------------------------------------------
  {
    id: 'database',
    name: 'Database Server',
    description: 'MCP server for database operations (PostgreSQL, MySQL, SQLite)',
    category: 'data',
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      'zod': '^3.23.0',
      'pg': '^8.11.0',
      'mysql2': '^3.9.0',
      'better-sqlite3': '^9.4.0',
    },
    devDependencies: {
      '@types/pg': '^8.11.0',
      '@types/better-sqlite3': '^7.6.0',
    },
    generateCode: (config) => `#!/usr/bin/env node
/**
 * ${config.name}
 * MCP Server for Database Operations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Database connection (configure via environment)
const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const DB_CONNECTION = process.env.DB_CONNECTION || ':memory:';

// Connection pool placeholder
let db${config.isTypeScript ? ': any' : ''};

async function initDatabase() {
  switch (DB_TYPE) {
    case 'postgres': {
      const { Pool } = await import('pg');
      db = new Pool({ connectionString: DB_CONNECTION });
      break;
    }
    case 'mysql': {
      const mysql = await import('mysql2/promise');
      db = await mysql.createPool(DB_CONNECTION);
      break;
    }
    case 'sqlite':
    default: {
      const Database = (await import('better-sqlite3')).default;
      db = new Database(DB_CONNECTION);
      break;
    }
  }
}

// Schema validation
const QuerySchema = z.object({
  sql: z.string().describe('SQL query to execute'),
  params: z.array(z.unknown()).optional().describe('Query parameters'),
});

const TableSchema = z.object({
  table: z.string().describe('Table name'),
  limit: z.number().optional().default(100).describe('Row limit'),
  offset: z.number().optional().default(0).describe('Row offset'),
});

// Server setup
const server = new Server(
  { name: '${config.name}', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// Tools
const tools = [
  {
    name: 'query',
    description: 'Execute a read-only SQL query',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL SELECT query' },
        params: { type: 'array', description: 'Query parameters' },
      },
      required: ['sql'],
    },
  },
  {
    name: 'list_tables',
    description: 'List all tables in the database',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'describe_table',
    description: 'Get schema information for a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
      },
      required: ['table'],
    },
  },
  {
    name: 'sample_data',
    description: 'Get sample rows from a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        limit: { type: 'number', description: 'Number of rows' },
      },
      required: ['table'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query': {
        const { sql, params } = QuerySchema.parse(args);

        // Security: Only allow SELECT queries
        if (!sql.trim().toLowerCase().startsWith('select')) {
          return {
            content: [{ type: 'text', text: 'Error: Only SELECT queries are allowed' }],
            isError: true,
          };
        }

        let result;
        if (DB_TYPE === 'sqlite') {
          result = db.prepare(sql).all(...(params || []));
        } else {
          const [rows] = await db.query(sql, params);
          result = rows;
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_tables': {
        let sql;
        switch (DB_TYPE) {
          case 'postgres':
            sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
            break;
          case 'mysql':
            sql = 'SHOW TABLES';
            break;
          default:
            sql = "SELECT name FROM sqlite_master WHERE type='table'";
        }

        let result;
        if (DB_TYPE === 'sqlite') {
          result = db.prepare(sql).all();
        } else {
          const [rows] = await db.query(sql);
          result = rows;
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'describe_table': {
        const { table } = TableSchema.pick({ table: true }).parse(args);

        // Sanitize table name
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
          return {
            content: [{ type: 'text', text: 'Error: Invalid table name' }],
            isError: true,
          };
        }

        let sql;
        switch (DB_TYPE) {
          case 'postgres':
            sql = \`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '\${table}'\`;
            break;
          case 'mysql':
            sql = \`DESCRIBE \${table}\`;
            break;
          default:
            sql = \`PRAGMA table_info(\${table})\`;
        }

        let result;
        if (DB_TYPE === 'sqlite') {
          result = db.prepare(sql).all();
        } else {
          const [rows] = await db.query(sql);
          result = rows;
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'sample_data': {
        const { table, limit = 10 } = TableSchema.parse(args);

        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
          return {
            content: [{ type: 'text', text: 'Error: Invalid table name' }],
            isError: true,
          };
        }

        const sql = \`SELECT * FROM \${table} LIMIT \${Math.min(limit, 100)}\`;

        let result;
        if (DB_TYPE === 'sqlite') {
          result = db.prepare(sql).all();
        } else {
          const [rows] = await db.query(sql);
          result = rows;
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: \`Unknown tool: \${name}\` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: \`Database error: \${error}\` }],
      isError: true,
    };
  }
});

// Resources
const resources = [
  {
    uri: '${config.name}://schema',
    name: 'Database Schema',
    description: 'Full database schema information',
    mimeType: 'application/json',
  },
];

server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources }));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === '${config.name}://schema') {
    // Get full schema
    let tables;
    if (DB_TYPE === 'sqlite') {
      tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    } else {
      const [rows] = await db.query(
        DB_TYPE === 'postgres'
          ? "SELECT table_name as name FROM information_schema.tables WHERE table_schema = 'public'"
          : 'SHOW TABLES'
      );
      tables = rows;
    }

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({ database: DB_TYPE, tables }, null, 2),
      }],
    };
  }

  throw new Error(\`Unknown resource: \${uri}\`);
});

// Start server
async function main() {
  await initDatabase();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${config.name} MCP server running');
}

main().catch(console.error);
`,
  },

  // -------------------------------------------------------------------------
  // GITHUB INTEGRATION TEMPLATE
  // -------------------------------------------------------------------------
  {
    id: 'github',
    name: 'GitHub Integration',
    description: 'MCP server for GitHub operations (repos, issues, PRs)',
    category: 'integration',
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      'zod': '^3.23.0',
      '@octokit/rest': '^20.0.0',
    },
    generateCode: (config) => `#!/usr/bin/env node
/**
 * ${config.name}
 * MCP Server for GitHub Integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';
import { z } from 'zod';

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Schemas
const RepoSchema = z.object({
  owner: z.string(),
  repo: z.string(),
});

const IssueSchema = RepoSchema.extend({
  issue_number: z.number(),
});

const CreateIssueSchema = RepoSchema.extend({
  title: z.string(),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

const SearchSchema = z.object({
  query: z.string(),
  type: z.enum(['repositories', 'issues', 'code']).default('repositories'),
  per_page: z.number().default(10),
});

// Server setup
const server = new Server(
  { name: '${config.name}', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// Tools
const tools = [
  {
    name: 'get_repo',
    description: 'Get information about a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'list_issues',
    description: 'List issues in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_issue',
    description: 'Get details of a specific issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        issue_number: { type: 'number' },
      },
      required: ['owner', 'repo', 'issue_number'],
    },
  },
  {
    name: 'create_issue',
    description: 'Create a new issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } },
      },
      required: ['owner', 'repo', 'title'],
    },
  },
  {
    name: 'list_prs',
    description: 'List pull requests in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'search',
    description: 'Search GitHub for repositories, issues, or code',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        type: { type: 'string', enum: ['repositories', 'issues', 'code'] },
        per_page: { type: 'number', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_file_contents',
    description: 'Get contents of a file from a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        path: { type: 'string', description: 'File path in repository' },
        ref: { type: 'string', description: 'Branch, tag, or commit SHA' },
      },
      required: ['owner', 'repo', 'path'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_repo': {
        const { owner, repo } = RepoSchema.parse(args);
        const { data } = await octokit.repos.get({ owner, repo });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              name: data.name,
              full_name: data.full_name,
              description: data.description,
              stars: data.stargazers_count,
              forks: data.forks_count,
              language: data.language,
              topics: data.topics,
              url: data.html_url,
            }, null, 2),
          }],
        };
      }

      case 'list_issues': {
        const { owner, repo } = RepoSchema.parse(args);
        const state = (args${config.isTypeScript ? ' as any' : ''}).state || 'open';
        const { data } = await octokit.issues.listForRepo({ owner, repo, state, per_page: 20 });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data.map(i => ({
              number: i.number,
              title: i.title,
              state: i.state,
              labels: i.labels.map((l${config.isTypeScript ? ': any' : ''}) => typeof l === 'string' ? l : l.name),
              created_at: i.created_at,
              url: i.html_url,
            })), null, 2),
          }],
        };
      }

      case 'get_issue': {
        const { owner, repo, issue_number } = IssueSchema.parse(args);
        const { data } = await octokit.issues.get({ owner, repo, issue_number });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              number: data.number,
              title: data.title,
              body: data.body,
              state: data.state,
              labels: data.labels,
              assignees: data.assignees?.map(a => a.login),
              created_at: data.created_at,
              updated_at: data.updated_at,
              url: data.html_url,
            }, null, 2),
          }],
        };
      }

      case 'create_issue': {
        const { owner, repo, title, body, labels } = CreateIssueSchema.parse(args);
        const { data } = await octokit.issues.create({ owner, repo, title, body, labels });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              number: data.number,
              title: data.title,
              url: data.html_url,
              created: true,
            }, null, 2),
          }],
        };
      }

      case 'list_prs': {
        const { owner, repo } = RepoSchema.parse(args);
        const state = (args${config.isTypeScript ? ' as any' : ''}).state || 'open';
        const { data } = await octokit.pulls.list({ owner, repo, state, per_page: 20 });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data.map(pr => ({
              number: pr.number,
              title: pr.title,
              state: pr.state,
              draft: pr.draft,
              user: pr.user?.login,
              created_at: pr.created_at,
              url: pr.html_url,
            })), null, 2),
          }],
        };
      }

      case 'search': {
        const { query, type, per_page } = SearchSchema.parse(args);
        let data;

        switch (type) {
          case 'issues':
            data = (await octokit.search.issuesAndPullRequests({ q: query, per_page })).data;
            break;
          case 'code':
            data = (await octokit.search.code({ q: query, per_page })).data;
            break;
          default:
            data = (await octokit.search.repos({ q: query, per_page })).data;
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(data.items, null, 2) }],
        };
      }

      case 'get_file_contents': {
        const { owner, repo } = RepoSchema.parse(args);
        const path = (args${config.isTypeScript ? ' as any' : ''}).path;
        const ref = (args${config.isTypeScript ? ' as any' : ''}).ref;

        const { data } = await octokit.repos.getContent({ owner, repo, path, ref });

        if ('content' in data) {
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          return {
            content: [{ type: 'text', text: content }],
          };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: \`Unknown tool: \${name}\` }],
          isError: true,
        };
    }
  } catch (error${config.isTypeScript ? ': any' : ''}) {
    return {
      content: [{ type: 'text', text: \`GitHub API error: \${error.message}\` }],
      isError: true,
    };
  }
});

// Resources
const resources = [
  {
    uri: '${config.name}://user',
    name: 'Authenticated User',
    description: 'Information about the authenticated GitHub user',
    mimeType: 'application/json',
  },
];

server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources }));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === '${config.name}://user') {
    const { data } = await octokit.users.getAuthenticated();
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      }],
    };
  }
  throw new Error(\`Unknown resource: \${request.params.uri}\`);
});

// Start
async function main() {
  if (!process.env.GITHUB_TOKEN) {
    console.error('Warning: GITHUB_TOKEN not set. Some operations may fail.');
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${config.name} MCP server running');
}

main().catch(console.error);
`,
  },

  // -------------------------------------------------------------------------
  // SEMANTIC SEARCH TEMPLATE
  // -------------------------------------------------------------------------
  {
    id: 'semantic-search',
    name: 'Semantic Search',
    description: 'MCP server for semantic search with embeddings',
    category: 'ai',
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      'zod': '^3.23.0',
      'openai': '^4.0.0',
    },
    generateCode: (config) => `#!/usr/bin/env node
/**
 * ${config.name}
 * MCP Server for Semantic Search with Embeddings
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory vector store
interface Document {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

const documents: Document[] = [];

// Embedding model
const EMBEDDING_MODEL = 'text-embedding-3-small';

// Schemas
const AddDocSchema = z.object({
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const SearchSchema = z.object({
  query: z.string(),
  limit: z.number().default(5),
  threshold: z.number().default(0.7),
});

const IngestFileSchema = z.object({
  path: z.string(),
  chunkSize: z.number().default(500),
  overlap: z.number().default(50),
});

// Helper: Generate embedding
async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

// Helper: Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
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

// Helper: Chunk text
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  const words = text.split(/\\s+/);

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

// Server setup
const server = new Server(
  { name: '${config.name}', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// Tools
const tools = [
  {
    name: 'add_document',
    description: 'Add a document to the search index',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Document content' },
        metadata: { type: 'object', description: 'Optional metadata' },
      },
      required: ['content'],
    },
  },
  {
    name: 'search',
    description: 'Search for documents semantically similar to a query',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results', default: 5 },
        threshold: { type: 'number', description: 'Min similarity (0-1)', default: 0.7 },
      },
      required: ['query'],
    },
  },
  {
    name: 'ingest_file',
    description: 'Ingest a text file into the search index',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        chunkSize: { type: 'number', description: 'Words per chunk', default: 500 },
        overlap: { type: 'number', description: 'Overlap between chunks', default: 50 },
      },
      required: ['path'],
    },
  },
  {
    name: 'clear_index',
    description: 'Clear all documents from the index',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'index_stats',
    description: 'Get statistics about the search index',
    inputSchema: { type: 'object', properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'add_document': {
        const { content, metadata } = AddDocSchema.parse(args);

        const embedding = await getEmbedding(content);
        const doc: Document = {
          id: \`doc_\${Date.now()}_\${Math.random().toString(36).slice(2, 8)}\`,
          content,
          embedding,
          metadata: metadata || {},
        };

        documents.push(doc);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ id: doc.id, indexed: true }),
          }],
        };
      }

      case 'search': {
        const { query, limit, threshold } = SearchSchema.parse(args);

        const queryEmbedding = await getEmbedding(query);

        const results = documents
          .map(doc => ({
            ...doc,
            similarity: cosineSimilarity(queryEmbedding, doc.embedding),
          }))
          .filter(doc => doc.similarity >= threshold)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit)
          .map(({ embedding, ...rest }) => rest); // Remove embedding from output

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2),
          }],
        };
      }

      case 'ingest_file': {
        const { path: filePath, chunkSize, overlap } = IngestFileSchema.parse(args);

        const content = await fs.readFile(filePath, 'utf-8');
        const chunks = chunkText(content, chunkSize, overlap);

        const results = await Promise.all(
          chunks.map(async (chunk, index) => {
            const embedding = await getEmbedding(chunk);
            const doc: Document = {
              id: \`\${path.basename(filePath)}_chunk_\${index}\`,
              content: chunk,
              embedding,
              metadata: {
                source: filePath,
                chunkIndex: index,
                totalChunks: chunks.length,
              },
            };
            documents.push(doc);
            return doc.id;
          })
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              file: filePath,
              chunksCreated: chunks.length,
              documentIds: results,
            }, null, 2),
          }],
        };
      }

      case 'clear_index': {
        const count = documents.length;
        documents.length = 0;
        return {
          content: [{ type: 'text', text: JSON.stringify({ cleared: count }) }],
        };
      }

      case 'index_stats': {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              documentCount: documents.length,
              embeddingModel: EMBEDDING_MODEL,
              embeddingDimensions: documents[0]?.embedding.length || 0,
            }, null, 2),
          }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: \`Unknown tool: \${name}\` }],
          isError: true,
        };
    }
  } catch (error${config.isTypeScript ? ': any' : ''}) {
    return {
      content: [{ type: 'text', text: \`Error: \${error.message}\` }],
      isError: true,
    };
  }
});

// Resources
const resources = [
  {
    uri: '${config.name}://index',
    name: 'Search Index',
    description: 'Current state of the search index',
    mimeType: 'application/json',
  },
];

server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources }));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === '${config.name}://index') {
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          documentCount: documents.length,
          documents: documents.map(({ embedding, ...rest }) => rest),
        }, null, 2),
      }],
    };
  }
  throw new Error(\`Unknown resource: \${request.params.uri}\`);
});

// Start
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY required for embeddings');
    process.exit(1);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${config.name} MCP server running');
}

main().catch(console.error);
`,
  },

  // -------------------------------------------------------------------------
  // SLACK INTEGRATION TEMPLATE
  // -------------------------------------------------------------------------
  {
    id: 'slack',
    name: 'Slack Integration',
    description: 'MCP server for Slack operations (messages, channels, users)',
    category: 'integration',
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      'zod': '^3.23.0',
      '@slack/web-api': '^6.11.0',
    },
    generateCode: (config) => `#!/usr/bin/env node
/**
 * ${config.name}
 * MCP Server for Slack Integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { WebClient } from '@slack/web-api';
import { z } from 'zod';

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Schemas
const SendMessageSchema = z.object({
  channel: z.string(),
  text: z.string(),
  thread_ts: z.string().optional(),
});

const SearchSchema = z.object({
  query: z.string(),
  count: z.number().default(20),
});

// Server setup
const server = new Server(
  { name: '${config.name}', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Tools
const tools = [
  {
    name: 'send_message',
    description: 'Send a message to a Slack channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel ID or name' },
        text: { type: 'string', description: 'Message text' },
        thread_ts: { type: 'string', description: 'Thread timestamp for replies' },
      },
      required: ['channel', 'text'],
    },
  },
  {
    name: 'list_channels',
    description: 'List all Slack channels',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_channel_history',
    description: 'Get recent messages from a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel ID' },
        limit: { type: 'number', default: 20 },
      },
      required: ['channel'],
    },
  },
  {
    name: 'search_messages',
    description: 'Search for messages',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        count: { type: 'number', default: 20 },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_users',
    description: 'List workspace users',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_user_info',
    description: 'Get information about a user',
    inputSchema: {
      type: 'object',
      properties: {
        user: { type: 'string', description: 'User ID' },
      },
      required: ['user'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'send_message': {
        const { channel, text, thread_ts } = SendMessageSchema.parse(args);
        const result = await slack.chat.postMessage({ channel, text, thread_ts });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ ok: result.ok, ts: result.ts, channel: result.channel }),
          }],
        };
      }

      case 'list_channels': {
        const result = await slack.conversations.list({ types: 'public_channel,private_channel' });
        const channels = result.channels?.map(c => ({
          id: c.id,
          name: c.name,
          is_private: c.is_private,
          num_members: c.num_members,
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(channels, null, 2) }],
        };
      }

      case 'get_channel_history': {
        const channel = (args${config.isTypeScript ? ' as any' : ''}).channel;
        const limit = (args${config.isTypeScript ? ' as any' : ''}).limit || 20;
        const result = await slack.conversations.history({ channel, limit });
        const messages = result.messages?.map(m => ({
          user: m.user,
          text: m.text,
          ts: m.ts,
          thread_ts: m.thread_ts,
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(messages, null, 2) }],
        };
      }

      case 'search_messages': {
        const { query, count } = SearchSchema.parse(args);
        const result = await slack.search.messages({ query, count });
        const matches = result.messages?.matches?.map(m => ({
          channel: m.channel?.name,
          user: m.user,
          text: m.text,
          ts: m.ts,
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }],
        };
      }

      case 'list_users': {
        const result = await slack.users.list();
        const users = result.members?.filter(u => !u.is_bot && !u.deleted).map(u => ({
          id: u.id,
          name: u.name,
          real_name: u.real_name,
          email: u.profile?.email,
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(users, null, 2) }],
        };
      }

      case 'get_user_info': {
        const user = (args${config.isTypeScript ? ' as any' : ''}).user;
        const result = await slack.users.info({ user });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: result.user?.id,
              name: result.user?.name,
              real_name: result.user?.real_name,
              email: result.user?.profile?.email,
              title: result.user?.profile?.title,
            }, null, 2),
          }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: \`Unknown tool: \${name}\` }],
          isError: true,
        };
    }
  } catch (error${config.isTypeScript ? ': any' : ''}) {
    return {
      content: [{ type: 'text', text: \`Slack API error: \${error.message}\` }],
      isError: true,
    };
  }
});

// Start
async function main() {
  if (!process.env.SLACK_BOT_TOKEN) {
    console.error('Error: SLACK_BOT_TOKEN required');
    process.exit(1);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${config.name} MCP server running');
}

main().catch(console.error);
`,
  },

  // -------------------------------------------------------------------------
  // NOTION INTEGRATION TEMPLATE
  // -------------------------------------------------------------------------
  {
    id: 'notion',
    name: 'Notion Integration',
    description: 'MCP server for Notion operations (pages, databases, blocks)',
    category: 'integration',
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      'zod': '^3.23.0',
      '@notionhq/client': '^2.2.0',
    },
    generateCode: (config) => `#!/usr/bin/env node
/**
 * ${config.name}
 * MCP Server for Notion Integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@notionhq/client';
import { z } from 'zod';

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Server setup
const server = new Server(
  { name: '${config.name}', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Tools
const tools = [
  {
    name: 'search',
    description: 'Search Notion for pages and databases',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        filter: { type: 'string', enum: ['page', 'database'], description: 'Filter by type' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_page',
    description: 'Get a Notion page by ID',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'Page ID' },
      },
      required: ['page_id'],
    },
  },
  {
    name: 'get_page_content',
    description: 'Get the content blocks of a page',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'Page ID' },
      },
      required: ['page_id'],
    },
  },
  {
    name: 'create_page',
    description: 'Create a new Notion page',
    inputSchema: {
      type: 'object',
      properties: {
        parent_id: { type: 'string', description: 'Parent page or database ID' },
        parent_type: { type: 'string', enum: ['page', 'database'], default: 'page' },
        title: { type: 'string', description: 'Page title' },
        content: { type: 'string', description: 'Page content (markdown-ish)' },
      },
      required: ['parent_id', 'title'],
    },
  },
  {
    name: 'query_database',
    description: 'Query a Notion database',
    inputSchema: {
      type: 'object',
      properties: {
        database_id: { type: 'string', description: 'Database ID' },
        filter: { type: 'object', description: 'Filter object' },
        sorts: { type: 'array', description: 'Sort array' },
      },
      required: ['database_id'],
    },
  },
  {
    name: 'append_blocks',
    description: 'Append content blocks to a page',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'Page ID' },
        content: { type: 'string', description: 'Content to append' },
      },
      required: ['page_id', 'content'],
    },
  },
];

// Helper: Convert text to Notion blocks
function textToBlocks(text: string)${config.isTypeScript ? ': any[]' : ''} {
  const lines = text.split('\\n');
  return lines.map(line => {
    if (line.startsWith('# ')) {
      return {
        type: 'heading_1',
        heading_1: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] },
      };
    }
    if (line.startsWith('## ')) {
      return {
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: line.slice(3) } }] },
      };
    }
    if (line.startsWith('- ')) {
      return {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] },
      };
    }
    return {
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: line } }] },
    };
  }).filter(b => b.paragraph?.rich_text[0]?.text?.content || b.type !== 'paragraph');
}

// Helper: Extract text from blocks
function blocksToText(blocks${config.isTypeScript ? ': any[]' : ''}): string {
  return blocks.map(block => {
    const type = block.type;
    const content = block[type];
    if (content?.rich_text) {
      return content.rich_text.map((t${config.isTypeScript ? ': any' : ''}) => t.plain_text || t.text?.content || '').join('');
    }
    return '';
  }).filter(Boolean).join('\\n');
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search': {
        const query = (args${config.isTypeScript ? ' as any' : ''}).query;
        const filter = (args${config.isTypeScript ? ' as any' : ''}).filter;

        const results = await notion.search({
          query,
          filter: filter ? { property: 'object', value: filter } : undefined,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results.results.map((r${config.isTypeScript ? ': any' : ''}) => ({
              id: r.id,
              type: r.object,
              title: r.properties?.title?.title?.[0]?.plain_text ||
                     r.properties?.Name?.title?.[0]?.plain_text ||
                     r.title?.[0]?.plain_text ||
                     'Untitled',
            })), null, 2),
          }],
        };
      }

      case 'get_page': {
        const page_id = (args${config.isTypeScript ? ' as any' : ''}).page_id;
        const page = await notion.pages.retrieve({ page_id });
        return {
          content: [{ type: 'text', text: JSON.stringify(page, null, 2) }],
        };
      }

      case 'get_page_content': {
        const page_id = (args${config.isTypeScript ? ' as any' : ''}).page_id;
        const blocks = await notion.blocks.children.list({ block_id: page_id });
        const text = blocksToText(blocks.results);
        return {
          content: [{ type: 'text', text }],
        };
      }

      case 'create_page': {
        const { parent_id, parent_type, title, content } = args${config.isTypeScript ? ' as any' : ''};

        const parent = parent_type === 'database'
          ? { database_id: parent_id }
          : { page_id: parent_id };

        const properties = parent_type === 'database'
          ? { Name: { title: [{ text: { content: title } }] } }
          : { title: { title: [{ text: { content: title } }] } };

        const children = content ? textToBlocks(content) : [];

        const page = await notion.pages.create({
          parent,
          properties,
          children,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ id: page.id, url: (page${config.isTypeScript ? ' as any' : ''}).url }),
          }],
        };
      }

      case 'query_database': {
        const { database_id, filter, sorts } = args${config.isTypeScript ? ' as any' : ''};
        const results = await notion.databases.query({
          database_id,
          filter,
          sorts,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results.results.map((r${config.isTypeScript ? ': any' : ''}) => ({
              id: r.id,
              properties: r.properties,
            })), null, 2),
          }],
        };
      }

      case 'append_blocks': {
        const { page_id, content } = args${config.isTypeScript ? ' as any' : ''};
        const blocks = textToBlocks(content);

        await notion.blocks.children.append({
          block_id: page_id,
          children: blocks,
        });

        return {
          content: [{ type: 'text', text: JSON.stringify({ appended: blocks.length }) }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: \`Unknown tool: \${name}\` }],
          isError: true,
        };
    }
  } catch (error${config.isTypeScript ? ': any' : ''}) {
    return {
      content: [{ type: 'text', text: \`Notion API error: \${error.message}\` }],
      isError: true,
    };
  }
});

// Start
async function main() {
  if (!process.env.NOTION_API_KEY) {
    console.error('Error: NOTION_API_KEY required');
    process.exit(1);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${config.name} MCP server running');
}

main().catch(console.error);
`,
  },
];

// ============================================================================
// Template Helpers
// ============================================================================

export function getTemplate(id: string): MCPTemplate | undefined {
  return mcpTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: MCPTemplate['category']): MCPTemplate[] {
  return mcpTemplates.filter(t => t.category === category);
}

export function listTemplates(): Array<{ id: string; name: string; description: string; category: string }> {
  return mcpTemplates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
  }));
}
