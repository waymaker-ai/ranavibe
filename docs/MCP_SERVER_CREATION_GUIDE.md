# MCP Server Creation Guide

**Version:** 2.1.0
**Last Updated:** December 2025
**Status:** Production Ready

---

## Overview

RANA provides a complete toolkit for creating, testing, and publishing MCP (Model Context Protocol) servers. This guide covers the scaffolding system, templates, testing utilities, and CLI commands.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [CLI Commands](#cli-commands)
3. [Scaffolding API](#scaffolding-api)
4. [Templates](#templates)
5. [Testing Utilities](#testing-utilities)
6. [Example Servers](#example-servers)
7. [Publishing](#publishing)

---

## Quick Start

### Create a new MCP server in seconds:

```bash
# Interactive mode
rana mcp create

# With options
rana mcp create my-server --template database --ts

# Validate existing server
rana mcp validate ./my-server

# Test server
rana mcp test ./my-server

# Publish to npm
rana mcp publish ./my-server
```

---

## CLI Commands

### `rana mcp create [name]`

Create a new MCP server project.

```bash
rana mcp create my-server
rana mcp create my-server --template api-wrapper
rana mcp create my-server --js  # JavaScript instead of TypeScript
```

**Options:**
- `-t, --template <template>` - Server template (basic, data-source, api-wrapper, full)
- `-d, --dir <directory>` - Output directory
- `--ts` - Use TypeScript (default)
- `--js` - Use JavaScript

### `rana mcp templates`

List available templates.

```bash
rana mcp templates
```

### `rana mcp add-tool <name>`

Add a new tool to an existing server.

```bash
rana mcp add-tool search --description "Search for content"
```

### `rana mcp add-resource <uri>`

Add a new resource to an existing server.

```bash
rana mcp add-resource "myserver://data" --name "Data" --description "Server data"
```

### `rana mcp config`

Generate Claude Desktop configuration.

```bash
rana mcp config --name my-server --path ./my-server
```

### `rana mcp validate [dir]`

Validate MCP server structure.

```bash
rana mcp validate ./my-server
```

**Checks:**
- package.json exists with correct dependencies
- Source files present
- TypeScript config (if TypeScript project)
- Build script presence
- MCP SDK dependency

### `rana mcp test [dir]`

Test MCP server.

```bash
rana mcp test ./my-server
```

**Tests:**
- Structure validation
- TypeScript compilation (if applicable)
- Main entry point exists
- MCP SDK usage
- Stdio transport setup

### `rana mcp publish [dir]`

Publish MCP server to npm.

```bash
rana mcp publish ./my-server
rana mcp publish ./my-server --dry-run
rana mcp publish ./my-server --tag beta
```

---

## Scaffolding API

### Basic Usage

```typescript
import { scaffoldMCPServer, TEMPLATES } from '@rana/mcp';

const result = scaffoldMCPServer({
  name: 'my-server',
  description: 'My custom MCP server',
  template: 'database',
  includeTests: true,
  includeClaude: true,
  includeDocker: true,
});

// result.files - Array of generated files
// result.instructions - Setup instructions
```

### ScaffoldOptions

```typescript
interface ScaffoldOptions {
  name: string;           // Server name
  description: string;    // Server description
  template?: string;      // Template name
  outputDir?: string;     // Output directory
  author?: string;        // Author name
  license?: string;       // License (default: MIT)
  includeTests?: boolean; // Generate tests
  includeDocker?: boolean;// Generate Dockerfile
  includeClaude?: boolean;// Generate Claude Desktop config
  typescript?: boolean;   // Use TypeScript (default: true)
}
```

### ScaffoldResult

```typescript
interface ScaffoldResult {
  files: GeneratedFile[];    // Generated files with path and content
  instructions: string[];    // Setup instructions
}

interface GeneratedFile {
  path: string;
  content: string;
}
```

---

## Templates

### Available Templates

| Template | Description | Use Case |
|----------|-------------|----------|
| `minimal` | Minimal server with one example tool | Learning, simple integrations |
| `database` | Database operations server | PostgreSQL, MySQL, SQLite access |
| `api` | REST API wrapper | Third-party API integration |
| `filesystem` | File system operations | File access, search |
| `github` | GitHub integration | Repos, issues, PRs |
| `slack` | Slack integration | Messages, channels |

### Database Template

Includes tools for:
- `query` - Execute SQL queries
- `insert` - Insert records
- `update` - Update records
- `delete` - Delete records
- `list_tables` - List all tables
- `describe_table` - Get table schema

```typescript
const result = scaffoldMCPServer({
  name: 'my-db-server',
  template: 'database',
});
```

### API Template

Includes tools for:
- `get` - HTTP GET requests
- `post` - HTTP POST requests
- `put` - HTTP PUT requests
- `delete` - HTTP DELETE requests

### Filesystem Template

Includes tools for:
- `read_file` - Read file contents
- `write_file` - Write to files
- `list_directory` - List directory contents
- `search` - Search for files

### GitHub Template

Includes tools for:
- `get_repo` - Get repository info
- `list_issues` - List issues
- `create_issue` - Create issues
- `list_prs` - List pull requests
- `create_pr` - Create pull requests

---

## Testing Utilities

### createMockServer

Create a mock MCP server for testing.

```typescript
import { createMockServer, runToolTests } from '@rana/mcp';

const server = createMockServer({
  name: 'test-server',
  tools: [
    {
      tool: {
        name: 'echo',
        description: 'Echo input',
        inputSchema: {
          type: 'object',
          properties: { message: { type: 'string' } },
          required: ['message'],
        },
      },
      handler: async (args) => ({ echo: args.message }),
    },
  ],
});
```

### runToolTests

Run test cases against a server.

```typescript
const results = await runToolTests(server, [
  {
    name: 'echo test',
    tool: 'echo',
    args: { message: 'hello' },
    expect: { success: true, contains: 'hello' },
  },
]);

console.log(results.passed, results.failed);
```

### Assertions

```typescript
import {
  assertToolExists,
  assertResourceExists,
  assertToolSuccess,
  assertResultContains,
} from '@rana/mcp';

assertToolExists(server, 'echo');
assertResourceExists(server, 'myserver://data');
assertToolSuccess(result);
assertResultContains(result, 'expected text');
```

### generateToolTestCases

Auto-generate test cases for all tools.

```typescript
const testCases = generateToolTestCases(server);
const results = await runToolTests(server, testCases);
```

### formatTestResults

Format test results for console output.

```typescript
console.log(formatTestResults(results));
```

Output:
```
📊 Test Results: test-server
──────────────────────────────────────────────────
✓ [PASS] echo test (5ms)
✗ [FAIL] search test (12ms)
  └─ Expected response to contain "results"
──────────────────────────────────────────────────
Total: 2 | Passed: 1 | Failed: 1
Duration: 17ms
```

---

## Example Servers

RANA includes 5 example MCP servers demonstrating different patterns:

### 1. Weather Server (`weather-server.ts`)

Simple API integration pattern.

```typescript
// Tools: get_weather, get_forecast
const result = await server.callTool({
  name: 'get_weather',
  arguments: { location: 'New York', units: 'celsius' },
});
```

### 2. Notes Server (`notes-server.ts`)

CRUD operations with resources.

```typescript
// Tools: create_note, update_note, delete_note, search_notes, list_notes
// Resources: notes://all, notes://tags
```

### 3. Calculator Server (`calculator-server.ts`)

Validation and error handling.

```typescript
// Tools: calculate, convert_units, statistics
const result = await server.callTool({
  name: 'statistics',
  arguments: { numbers: [1, 2, 3, 4, 5] },
});
// Returns: mean, median, stdDev, etc.
```

### 4. System Info Server (`system-info-server.ts`)

System monitoring with resources.

```typescript
// Tools: get_system_info, get_cpu_usage, get_memory_usage, get_disk_usage
// Resources: system://info, system://status
```

### 5. Time Server (`time-server.ts`)

Prompts and timezone handling.

```typescript
// Tools: get_current_time, convert_timezone, calculate_duration
// Prompts: schedule_meeting, countdown
```

---

## Publishing

### Pre-publish Checklist

1. **Validate structure:**
   ```bash
   rana mcp validate
   ```

2. **Run tests:**
   ```bash
   rana mcp test
   ```

3. **Build TypeScript:**
   ```bash
   npm run build
   ```

4. **Test locally with Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "my-server": {
         "command": "node",
         "args": ["/path/to/dist/index.js"]
       }
     }
   }
   ```

### Publishing to npm

```bash
# Dry run first
rana mcp publish --dry-run

# Publish
rana mcp publish

# Publish with tag
rana mcp publish --tag beta
```

### Post-publish

After publishing, users can install with:

```bash
npm install -g mcp-server-my-server
```

And configure in Claude Desktop:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "mcp-server-my-server"
    }
  }
}
```

---

## Best Practices

### 1. Security

- Validate all inputs
- Use environment variables for secrets
- Implement rate limiting for external APIs
- Don't expose sensitive system information

### 2. Error Handling

- Return `isError: true` for failures
- Provide helpful error messages
- Log errors for debugging

### 3. Documentation

- Write clear tool descriptions
- Document all parameters
- Include usage examples

### 4. Testing

- Test all tools with various inputs
- Test error cases
- Use the testing utilities

### 5. Performance

- Cache expensive operations
- Use connection pooling for databases
- Implement timeouts

---

## See Also

- [MCP Integration Guide](./MCP_INTEGRATION_GUIDE.md) - Consuming MCP servers
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Example Servers](../packages/mcp/examples/)
