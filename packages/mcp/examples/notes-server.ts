#!/usr/bin/env node
/**
 * Notes MCP Server Example
 * Demonstrates a CRUD server with resources
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created: string;
  updated: string;
}

// In-memory storage (use a database in production)
const notes: Map<string, Note> = new Map();

const server = new Server(
  { name: 'notes-server', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// Tools
const tools = [
  {
    name: 'create_note',
    description: 'Create a new note',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Note title' },
        content: { type: 'string', description: 'Note content' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Note tags' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'update_note',
    description: 'Update an existing note',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Note ID' },
        title: { type: 'string', description: 'New title' },
        content: { type: 'string', description: 'New content' },
        tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_note',
    description: 'Delete a note',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Note ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_notes',
    description: 'Search notes by content or tags',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
        tag: { type: 'string', description: 'Filter by tag' },
      },
    },
  },
  {
    name: 'list_notes',
    description: 'List all notes',
    inputSchema: { type: 'object' as const, properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'create_note': {
      const { title, content, tags = [] } = args as { title: string; content: string; tags?: string[] };
      const id = `note_${Date.now()}`;
      const now = new Date().toISOString();
      const note: Note = { id, title, content, tags, created: now, updated: now };
      notes.set(id, note);
      return { content: [{ type: 'text', text: JSON.stringify({ created: note }, null, 2) }] };
    }

    case 'update_note': {
      const { id, title, content, tags } = args as { id: string; title?: string; content?: string; tags?: string[] };
      const note = notes.get(id);
      if (!note) {
        return { content: [{ type: 'text', text: `Note not found: ${id}` }], isError: true };
      }
      if (title) note.title = title;
      if (content) note.content = content;
      if (tags) note.tags = tags;
      note.updated = new Date().toISOString();
      return { content: [{ type: 'text', text: JSON.stringify({ updated: note }, null, 2) }] };
    }

    case 'delete_note': {
      const { id } = args as { id: string };
      if (!notes.delete(id)) {
        return { content: [{ type: 'text', text: `Note not found: ${id}` }], isError: true };
      }
      return { content: [{ type: 'text', text: `Deleted note: ${id}` }] };
    }

    case 'search_notes': {
      const { query, tag } = args as { query?: string; tag?: string };
      let results = Array.from(notes.values());
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
      }
      if (tag) {
        results = results.filter(n => n.tags.includes(tag));
      }
      return { content: [{ type: 'text', text: JSON.stringify({ count: results.length, notes: results }, null, 2) }] };
    }

    case 'list_notes': {
      const all = Array.from(notes.values());
      return { content: [{ type: 'text', text: JSON.stringify({ count: all.length, notes: all }, null, 2) }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
});

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    { uri: 'notes://all', name: 'All Notes', description: 'List of all notes', mimeType: 'application/json' },
    { uri: 'notes://tags', name: 'Tags', description: 'All available tags', mimeType: 'application/json' },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'notes://all':
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(Array.from(notes.values())) }],
      };
    case 'notes://tags': {
      const allTags = new Set<string>();
      notes.forEach(n => n.tags.forEach(t => allTags.add(t)));
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(Array.from(allTags)) }],
      };
    }
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Notes MCP server running');
}

main().catch(console.error);
