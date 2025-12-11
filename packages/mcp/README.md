# @rana/mcp

Model Context Protocol (MCP) client, server, scaffolding, and testing utilities for RANA applications.

## Installation

```bash
npm install @rana/mcp
```

## Quick Start

### MCP Client

Connect to MCP servers and use their tools:

```typescript
import { createMCPClient } from '@rana/mcp';

const client = await createMCPClient({
  name: 'my-app',
  servers: [
    {
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir']
    },
    {
      name: 'github',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN }
    }
  ]
});

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool('filesystem', 'read_file', {
  path: '/path/to/file.txt'
});

console.log(result);
```

### MCP Server

Create your own MCP server:

```typescript
import { createRanaMCPServer } from '@rana/mcp';

const server = createRanaMCPServer({
  name: 'my-server',
  version: '1.0.0',
  tools: [
    {
      name: 'greet',
      description: 'Greet a user',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name to greet' }
        },
        required: ['name']
      },
      handler: async ({ name }) => {
        return { greeting: `Hello, ${name}!` };
      }
    }
  ],
  resources: [
    {
      uri: 'config://app',
      name: 'App Configuration',
      description: 'Current application configuration',
      mimeType: 'application/json',
      handler: async () => {
        return { version: '1.0.0', env: 'production' };
      }
    }
  ]
});

// Start the server
await server.start();
```

## Scaffolding

Generate production-ready MCP servers from templates:

```typescript
import { scaffoldMCPServer, TEMPLATES } from '@rana/mcp';

// List available templates
console.log(TEMPLATES);
// ['database', 'github', 'search', 'slack', 'notion', 'filesystem']

// Scaffold a new server
const result = await scaffoldMCPServer({
  template: 'database',
  name: 'my-db-server',
  outputDir: './servers/db',
  options: {
    database: 'postgresql',
    includeTests: true
  }
});

console.log('Generated files:', result.files);
```

### Available Templates

| Template | Description | Tools |
|----------|-------------|-------|
| `database` | Database operations | query, insert, update, delete, schema |
| `github` | GitHub integration | search_repos, get_issues, create_pr |
| `search` | Semantic search | search, index, delete |
| `slack` | Slack integration | send_message, list_channels, search |
| `notion` | Notion integration | search_pages, create_page, update |
| `filesystem` | File operations | read, write, list, search |

### CLI Usage

```bash
# Create MCP server from template
rana mcp create my-server --template database

# Add a tool to existing server
rana mcp add-tool search

# Add a resource
rana mcp add-resource users
```

## Testing

Test your MCP servers with built-in utilities:

```typescript
import {
  createMockServer,
  runToolTests,
  assertToolExists,
  assertToolSuccess
} from '@rana/mcp';

// Create a mock server for testing
const mockServer = createMockServer({
  name: 'test-server',
  tools: [
    {
      tool: {
        name: 'add',
        description: 'Add two numbers',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' }
          }
        }
      },
      handler: async ({ a, b }) => ({ result: a + b })
    }
  ]
});

// Test tools
const results = await runToolTests(mockServer, [
  {
    name: 'add positive numbers',
    tool: 'add',
    args: { a: 2, b: 3 },
    expect: {
      success: true,
      validate: (result) => result.content[0].text.includes('5')
    }
  },
  {
    name: 'add negative numbers',
    tool: 'add',
    args: { a: -1, b: -2 },
    expect: { success: true }
  }
]);

console.log(`Passed: ${results.passed}/${results.total}`);
```

### Assertions

```typescript
// Assert tool exists
assertToolExists(server, 'my_tool');

// Assert resource exists
assertResourceExists(server, 'config://app');

// Assert tool call succeeds
await assertToolSuccess(server, 'my_tool', { arg: 'value' });

// Assert result contains string
await assertResultContains(server, 'search', { query: 'test' }, 'found');
```

### Snapshot Testing

```typescript
import { createSnapshot, compareSnapshot } from '@rana/mcp';

// Create snapshot of server state
const snapshot = await createSnapshot(server);

// Compare with previous snapshot
const diff = compareSnapshot(previousSnapshot, snapshot);
if (diff.changed) {
  console.log('Changes:', diff.changes);
}
```

## Examples

See the `examples/` directory for complete examples:

- `weather-server.ts` - API integration example
- `notes-server.ts` - CRUD operations example

## API Reference

### Client

| Function | Description |
|----------|-------------|
| `createMCPClient(config)` | Create MCP client |
| `client.listTools()` | List all tools |
| `client.callTool(server, tool, args)` | Call a tool |
| `client.listResources()` | List resources |
| `client.readResource(server, uri)` | Read resource |

### Server

| Function | Description |
|----------|-------------|
| `createRanaMCPServer(config)` | Create MCP server |
| `server.start()` | Start server |
| `server.stop()` | Stop server |

### Scaffolding

| Function | Description |
|----------|-------------|
| `scaffoldMCPServer(options)` | Generate server from template |
| `TEMPLATES` | Available template names |
| `mcpTemplates` | Template definitions |

### Testing

| Function | Description |
|----------|-------------|
| `createMockServer(config)` | Create mock server |
| `runToolTests(server, tests)` | Run test suite |
| `assertToolExists(server, name)` | Assert tool exists |
| `assertResourceExists(server, uri)` | Assert resource exists |
| `assertToolSuccess(server, tool, args)` | Assert tool succeeds |
| `createSnapshot(server)` | Create state snapshot |
| `compareSnapshot(a, b)` | Compare snapshots |

## Documentation

- [MCP Integration Guide](../../docs/MCP_INTEGRATION_GUIDE.md)
- [CLI Commands Reference](../../CLI_COMMANDS_REFERENCE.md)

## License

MIT
