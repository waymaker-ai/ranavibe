/**
 * LUKA - Claude MCP (Model Context Protocol) Integration
 * Connect Claude to external data sources, tools, and services
 *
 * MCP allows Claude to:
 * - Access real-time data (databases, APIs, files)
 * - Use external tools (search, calculations, code execution)
 * - Maintain context across conversations
 * - Connect to enterprise systems
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * MCP Server Configuration
 */
export interface MCPServer {
  name: string;
  description: string;
  tools: MCPTool[];
  resources?: MCPResource[];
}

export interface MCPTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

/**
 * Pre-built MCP Servers
 */

// 1. Database MCP Server
export const databaseMCP: MCPServer = {
  name: 'database',
  description: 'Query and manage database records',
  tools: [
    {
      name: 'query_database',
      description: 'Execute SQL query on the database',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'SQL query to execute',
          },
          params: {
            type: 'array',
            description: 'Query parameters',
          },
        },
        required: ['query'],
      },
      handler: async (params) => {
        // Implementation with Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase.rpc('execute_sql', {
          query: params.query,
        });

        if (error) throw error;
        return data;
      },
    },
    {
      name: 'search_documents',
      description: 'Semantic search across documents using vector similarity',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          limit: {
            type: 'number',
            description: 'Maximum results',
            default: 5,
          },
        },
        required: ['query'],
      },
      handler: async (params) => {
        const { semanticSearch } = await import('../vector/supabase-vector');
        return await semanticSearch(params.query, params.limit || 5);
      },
    },
  ],
};

// 2. File System MCP Server
export const filesystemMCP: MCPServer = {
  name: 'filesystem',
  description: 'Read and write files',
  tools: [
    {
      name: 'read_file',
      description: 'Read contents of a file',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path to read',
          },
        },
        required: ['path'],
      },
      handler: async (params) => {
        const fs = await import('fs/promises');
        return await fs.readFile(params.path, 'utf-8');
      },
    },
    {
      name: 'write_file',
      description: 'Write content to a file',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path to write',
          },
          content: {
            type: 'string',
            description: 'Content to write',
          },
        },
        required: ['path', 'content'],
      },
      handler: async (params) => {
        const fs = await import('fs/promises');
        await fs.writeFile(params.path, params.content, 'utf-8');
        return { success: true, path: params.path };
      },
    },
    {
      name: 'list_directory',
      description: 'List files in a directory',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path',
          },
        },
        required: ['path'],
      },
      handler: async (params) => {
        const fs = await import('fs/promises');
        const files = await fs.readdir(params.path, { withFileTypes: true });
        return files.map(f => ({
          name: f.name,
          isDirectory: f.isDirectory(),
        }));
      },
    },
  ],
};

// 3. Web Search MCP Server
export const webSearchMCP: MCPServer = {
  name: 'web_search',
  description: 'Search the web for real-time information',
  tools: [
    {
      name: 'search_web',
      description: 'Search Google for information',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          num_results: {
            type: 'number',
            description: 'Number of results',
            default: 5,
          },
        },
        required: ['query'],
      },
      handler: async (params) => {
        // Implementation with SerpAPI or similar
        const response = await fetch(
          `https://serpapi.com/search.json?q=${encodeURIComponent(params.query)}&api_key=${process.env.SERPAPI_KEY}`
        );
        const data = await response.json();
        return data.organic_results?.slice(0, params.num_results || 5);
      },
    },
    {
      name: 'fetch_webpage',
      description: 'Fetch and extract content from a webpage',
      input_schema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to fetch',
          },
        },
        required: ['url'],
      },
      handler: async (params) => {
        const response = await fetch(params.url);
        const html = await response.text();
        // Simple text extraction (use cheerio for better parsing)
        return html.replace(/<[^>]*>/g, '').trim();
      },
    },
  ],
};

// 4. Email MCP Server
export const emailMCP: MCPServer = {
  name: 'email',
  description: 'Send emails via Resend/SendGrid',
  tools: [
    {
      name: 'send_email',
      description: 'Send an email',
      input_schema: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email',
          },
          subject: {
            type: 'string',
            description: 'Email subject',
          },
          body: {
            type: 'string',
            description: 'Email body (HTML or text)',
          },
        },
        required: ['to', 'subject', 'body'],
      },
      handler: async (params) => {
        // Implementation with Resend
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const result = await resend.emails.send({
          from: 'noreply@luka.dev',
          to: params.to,
          subject: params.subject,
          html: params.body,
        });

        return result;
      },
    },
  ],
};

// 5. Calendar MCP Server
export const calendarMCP: MCPServer = {
  name: 'calendar',
  description: 'Manage calendar events',
  tools: [
    {
      name: 'create_event',
      description: 'Create a calendar event',
      input_schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Event title',
          },
          start: {
            type: 'string',
            description: 'Start date/time (ISO 8601)',
          },
          end: {
            type: 'string',
            description: 'End date/time (ISO 8601)',
          },
          description: {
            type: 'string',
            description: 'Event description',
          },
        },
        required: ['title', 'start', 'end'],
      },
      handler: async (params) => {
        // Integration with Google Calendar API
        return {
          id: 'event_123',
          title: params.title,
          start: params.start,
          end: params.end,
          url: 'https://calendar.google.com/event?id=123',
        };
      },
    },
  ],
};

/**
 * Claude Chat with MCP
 */
export async function claudeWithMCP(
  message: string,
  mcpServers: MCPServer[],
  conversationHistory: Anthropic.MessageParam[] = []
) {
  // Combine all tools from MCP servers
  const allTools = mcpServers.flatMap(server =>
    server.tools.map(tool => ({
      name: `${server.name}__${tool.name}`,
      description: tool.description,
      input_schema: tool.input_schema,
      handler: tool.handler,
    }))
  );

  // Convert to Anthropic tools format
  const anthropicTools = allTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
  }));

  // Initial Claude call
  let response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      ...conversationHistory,
      { role: 'user', content: message },
    ],
    tools: anthropicTools as any,
  });

  // Tool execution loop
  while (response.stop_reason === 'tool_use') {
    const toolUseBlock = response.content.find(
      block => block.type === 'tool_use'
    ) as any;

    if (!toolUseBlock) break;

    // Find and execute the tool
    const tool = allTools.find(t => t.name === toolUseBlock.name);
    if (!tool) {
      throw new Error(`Tool not found: ${toolUseBlock.name}`);
    }

    const toolResult = await tool.handler(toolUseBlock.input);

    // Continue conversation with tool result
    response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: response.content },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: JSON.stringify(toolResult),
            },
          ],
        },
      ],
      tools: anthropicTools as any,
    });
  }

  // Extract final text response
  const textBlock = response.content.find(block => block.type === 'text') as any;
  return textBlock?.text || '';
}

/**
 * Example: LUKA Framework Assistant with MCP
 */
export async function lukaAssistant(userMessage: string) {
  const response = await claudeWithMCP(
    userMessage,
    [databaseMCP, filesystemMCP, webSearchMCP, emailMCP],
    []
  );

  return response;
}

/**
 * MCP Server Manager
 */
export class MCPManager {
  private servers: Map<string, MCPServer> = new Map();

  register(server: MCPServer) {
    this.servers.set(server.name, server);
  }

  getServer(name: string): MCPServer | undefined {
    return this.servers.get(name);
  }

  getAllServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  async executeToolCall(serverName: string, toolName: string, params: any) {
    const server = this.servers.get(serverName);
    if (!server) throw new Error(`Server not found: ${serverName}`);

    const tool = server.tools.find(t => t.name === toolName);
    if (!tool) throw new Error(`Tool not found: ${toolName}`);

    return await tool.handler(params);
  }
}

// Global MCP manager
export const mcpManager = new MCPManager();

// Register default servers
mcpManager.register(databaseMCP);
mcpManager.register(filesystemMCP);
mcpManager.register(webSearchMCP);
mcpManager.register(emailMCP);
mcpManager.register(calendarMCP);

/**
 * Example Usage
 */
export const exampleUsage = `
// Use Claude with MCP servers
import { claudeWithMCP, databaseMCP, webSearchMCP } from '@/lib/integrations/claude-mcp';

const response = await claudeWithMCP(
  "Search for the latest AI news and save to database",
  [webSearchMCP, databaseMCP]
);

console.log(response);

// Create custom MCP server
const customMCP: MCPServer = {
  name: 'analytics',
  description: 'Track and analyze user events',
  tools: [
    {
      name: 'track_event',
      description: 'Track a user event',
      input_schema: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          properties: { type: 'object' },
        },
        required: ['event'],
      },
      handler: async (params) => {
        // Send to analytics service
        return { tracked: true };
      },
    },
  ],
};

// Use custom MCP
const result = await claudeWithMCP(
  "Track a page view event",
  [customMCP]
);
`;

/**
 * Installation:
 * Already using Anthropic SDK
 *
 * Additional dependencies:
 * npm install resend @supabase/supabase-js
 *
 * Environment variables:
 * ANTHROPIC_API_KEY=sk-ant-xxx
 * SERPAPI_KEY=xxx (for web search)
 * RESEND_API_KEY=re_xxx (for email)
 */
