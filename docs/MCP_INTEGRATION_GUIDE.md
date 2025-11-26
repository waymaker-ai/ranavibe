# MCP Integration Guide for RANA

**Version:** 1.0.0
**Last Updated:** 2025-11-09
**Status:** Production Ready

---

## Overview

This guide extends RANA with Model Context Protocol (MCP) standards, enabling AI assistants to securely connect to data sources, tools, and services while maintaining RANA quality gates.

---

## Table of Contents

1. [MCP Architecture](#mcp-architecture)
2. [Integration Patterns](#integration-patterns)
3. [Building MCP Servers](#building-mcp-servers)
4. [Consuming MCP Servers](#consuming-mcp-servers)
5. [RANA Quality Gates for MCP](#aads-quality-gates-for-mcp)
6. [Security Best Practices](#security-best-practices)
7. [Examples](#examples)

---

## MCP Architecture

### Three-Tier Model

```
┌─────────────────────────────────────────────────────────┐
│                    HOST (LLM Application)               │
│  Examples: Claude Desktop, Custom AI Apps, IDEs        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Connector)                   │
│  Manages: Connection lifecycle, message routing        │
│  Protocol: JSON-RPC 2.0 over stdio/HTTP+SSE           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVER (Service)                     │
│  Provides: Resources, Prompts, Tools                   │
│  Can Request: Sampling (LLM interactions)              │
└─────────────────────────────────────────────────────────┘
```

### Core Concepts

**Resources**
- Contextual data exposed to users/models
- Examples: File contents, database records, API responses
- URI-based addressing (e.g., `file:///path/to/doc.md`)

**Prompts**
- Templated messages and workflows
- Examples: Code review templates, analysis workflows
- Parameters for customization

**Tools**
- Executable functions callable by AI models
- Examples: Database queries, API calls, file operations
- Must follow explicit consent model

**Sampling**
- Server-initiated LLM interactions
- Enables recursive agentic behaviors
- Requires user control and transparency

---

## Integration Patterns

### Pattern 1: MCP-Enhanced Development Workflow

```yaml
# .rana.yml with MCP integration
version: 1.0.0

project:
  name: "My App"
  type: "fullstack"

mcp:
  enabled: true
  servers:
    # Filesystem access
    - name: "filesystem"
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]

    # Database access
    - name: "postgres"
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-postgres"]
      env:
        DATABASE_URL: "${POSTGRES_URL}"

    # Custom business logic
    - name: "business-logic"
      command: "python"
      args: ["-m", "mcp_servers.business_logic"]

standards:
  mcp_principles:
    - explicit_consent_required
    - data_minimization
    - secure_tool_execution
    - sampling_transparency
```

### Pattern 2: Custom MCP Server Architecture

```typescript
// src/mcp/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

class MyMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "my-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Resource handler
    this.server.setRequestHandler(
      "resources/list",
      async () => ({
        resources: [
          {
            uri: "app://data/users",
            name: "User Data",
            description: "Access user records",
            mimeType: "application/json",
          },
        ],
      })
    );

    // Tool handler
    this.server.setRequestHandler(
      "tools/list",
      async () => ({
        tools: [
          {
            name: "query_users",
            description: "Query user database",
            inputSchema: {
              type: "object",
              properties: {
                filter: { type: "string" },
              },
            },
          },
        ],
      })
    );

    // Tool execution
    this.server.setRequestHandler(
      "tools/call",
      async (request) => {
        if (request.params.name === "query_users") {
          // ✅ RANA: Real data only (no mocks)
          const result = await this.queryDatabase(request.params.arguments);
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        }
      }
    );
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

---

## Building MCP Servers

### RANA Quality Gates for MCP Server Development

#### Pre-Implementation
- [ ] Define clear resource/tool boundaries
- [ ] Document security model
- [ ] Plan error handling strategy
- [ ] Review existing MCP servers for similar functionality

#### Implementation
- [ ] **No mock data** - All resources return real data
- [ ] **Error handling** - All async operations wrapped in try-catch
- [ ] **Input validation** - Validate all tool parameters
- [ ] **Security checks** - Verify user permissions before data access
- [ ] **Rate limiting** - Prevent abuse of expensive operations

#### Testing
- [ ] Unit tests for all tools
- [ ] Integration tests with real data sources
- [ ] Security tests for authorization
- [ ] Performance tests for expensive operations

#### Deployment
- [ ] Document installation process
- [ ] Provide example configuration
- [ ] Include security guidelines
- [ ] Publish to MCP server registry (if public)

### MCP Server Template (TypeScript)

```typescript
// mcp-servers/my-server/src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

class ProductionMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "production-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "execute_query",
          description: "Execute a database query with proper error handling",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "SQL query to execute",
              },
            },
            required: ["query"],
          },
        },
      ],
    }));

    // Execute tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // ✅ RANA: Input validation
        if (!this.validateInput(name, args)) {
          throw new Error("Invalid input parameters");
        }

        // ✅ RANA: Security check
        if (!this.checkPermissions(name)) {
          throw new Error("Unauthorized access");
        }

        switch (name) {
          case "execute_query":
            // ✅ RANA: Real data, error handling
            const result = await this.executeQuery(args.query);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        // ✅ RANA: Proper error handling
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private validateInput(toolName: string, args: any): boolean {
    // ✅ RANA: Input validation
    // Add your validation logic
    return true;
  }

  private checkPermissions(toolName: string): boolean {
    // ✅ RANA: Security check
    // Add your permission logic
    return true;
  }

  private async executeQuery(query: string): Promise<any> {
    // ✅ RANA: Real database connection (no mocks)
    // Implement your database logic here
    throw new Error("Not implemented");
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MCP Server running on stdio");
  }
}

// Start server
const server = new ProductionMCPServer();
server.run().catch(console.error);
```

### MCP Server Template (Python)

```python
# mcp_servers/my_server/server.py
import asyncio
import logging
from typing import Any
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductionMCPServer:
    def __init__(self):
        self.server = Server("production-mcp-server")
        self._setup_handlers()

    def _setup_handlers(self):
        @self.server.list_tools()
        async def list_tools() -> list[Tool]:
            return [
                Tool(
                    name="execute_query",
                    description="Execute database query with error handling",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "SQL query to execute"
                            }
                        },
                        "required": ["query"]
                    }
                )
            ]

        @self.server.call_tool()
        async def call_tool(name: str, arguments: Any) -> list[TextContent]:
            try:
                # ✅ RANA: Input validation
                if not self._validate_input(name, arguments):
                    raise ValueError("Invalid input parameters")

                # ✅ RANA: Security check
                if not self._check_permissions(name):
                    raise PermissionError("Unauthorized access")

                if name == "execute_query":
                    # ✅ RANA: Real data, error handling
                    result = await self._execute_query(arguments["query"])
                    return [TextContent(
                        type="text",
                        text=str(result)
                    )]

                raise ValueError(f"Unknown tool: {name}")

            except Exception as e:
                # ✅ RANA: Proper error handling
                logger.error(f"Tool execution error: {e}")
                return [TextContent(
                    type="text",
                    text=f"Error: {str(e)}"
                )]

    def _validate_input(self, tool_name: str, args: Any) -> bool:
        # ✅ RANA: Input validation
        return True

    def _check_permissions(self, tool_name: str) -> bool:
        # ✅ RANA: Security check
        return True

    async def _execute_query(self, query: str) -> Any:
        # ✅ RANA: Real database connection
        raise NotImplementedError("Implement database logic")

    async def run(self):
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                self.server.create_initialization_options()
            )

if __name__ == "__main__":
    server = ProductionMCPServer()
    asyncio.run(server.run())
```

---

## Consuming MCP Servers

### Configuration in AI Applications

```typescript
// config/mcp.config.ts
export const mcpConfig = {
  servers: {
    // Filesystem access
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
      description: "Access project files",
    },

    // Database access
    database: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
      },
      description: "Query production database",
    },

    // Custom business logic
    analytics: {
      command: "python",
      args: ["-m", "mcp_servers.analytics"],
      description: "Access analytics data",
    },
  },
};
```

### Client Usage Pattern

```typescript
// src/services/mcp-client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

class MCPClientService {
  private clients: Map<string, Client> = new Map();

  async connectToServer(serverName: string, config: any) {
    try {
      const client = new Client({
        name: "my-app",
        version: "1.0.0",
      });

      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env,
      });

      await client.connect(transport);
      this.clients.set(serverName, client);

      return client;
    } catch (error) {
      // ✅ RANA: Error handling
      console.error(`Failed to connect to MCP server ${serverName}:`, error);
      throw error;
    }
  }

  async callTool(serverName: string, toolName: string, args: any) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Not connected to server: ${serverName}`);
    }

    try {
      // ✅ RANA: Real tool execution (no mocks)
      const result = await client.request(
        {
          method: "tools/call",
          params: {
            name: toolName,
            arguments: args,
          },
        },
        { timeout: 30000 }
      );

      return result;
    } catch (error) {
      // ✅ RANA: Error handling
      console.error(`Tool execution failed: ${toolName}`, error);
      throw error;
    }
  }

  async listResources(serverName: string) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Not connected to server: ${serverName}`);
    }

    return await client.request({
      method: "resources/list",
      params: {},
    });
  }
}

export const mcpClient = new MCPClientService();
```

---

## RANA Quality Gates for MCP

### MCP-Specific Quality Gates

Add to `.rana.yml`:

```yaml
quality_gates:
  mcp_implementation:
    - explicit_user_consent      # User approves all data access
    - data_minimization          # Only request necessary data
    - secure_tool_execution      # Validate and sanitize all inputs
    - error_handling_complete    # All MCP calls wrapped in try-catch
    - connection_lifecycle       # Proper connect/disconnect
    - timeout_configuration      # All requests have timeouts
    - logging_and_monitoring     # Log all MCP interactions

  mcp_security:
    - permission_checks          # Verify permissions before tool execution
    - input_validation           # Validate all tool parameters
    - output_sanitization        # Sanitize data before returning
    - rate_limiting              # Prevent abuse
    - audit_logging              # Log security events
```

### MCP Development Checklist

```markdown
## MCP Server Development

### Planning
- [ ] Define clear resource/tool boundaries
- [ ] Document security model
- [ ] Plan error handling strategy
- [ ] Review existing servers

### Implementation
- [ ] No mock data in server
- [ ] All async operations have error handling
- [ ] Input validation on all tools
- [ ] Permission checks implemented
- [ ] Rate limiting configured
- [ ] Logging configured

### Testing
- [ ] Unit tests for all tools
- [ ] Integration tests with real data
- [ ] Security tests
- [ ] Performance tests
- [ ] Error scenario tests

### Documentation
- [ ] Installation instructions
- [ ] Configuration examples
- [ ] Security guidelines
- [ ] API documentation

### Deployment
- [ ] Server tested in production-like environment
- [ ] Monitoring configured
- [ ] Error tracking setup
- [ ] Published to registry (if public)
```

---

## Security Best Practices

### 1. Explicit Consent Architecture

```typescript
// Never automatically access resources
async function accessUserData(userId: string) {
  // ❌ BAD: Auto-access
  // return await database.getUser(userId);

  // ✅ GOOD: Request permission
  const hasConsent = await requestUserConsent(
    `Access data for user ${userId}?`,
    ["Read user profile", "Access user settings"]
  );

  if (!hasConsent) {
    throw new Error("User denied access");
  }

  return await database.getUser(userId);
}
```

### 2. Data Minimization

```typescript
// Return only what's needed
async function getUserForDisplay(userId: string) {
  // ❌ BAD: Return everything
  // return await database.getUser(userId);

  // ✅ GOOD: Return only required fields
  const user = await database.getUser(userId);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    // Exclude sensitive fields
  };
}
```

### 3. Tool Caution

```typescript
// Treat tools as arbitrary code execution
async function executeTool(toolName: string, args: any) {
  // ✅ RANA: Validate inputs
  const validation = validateToolInput(toolName, args);
  if (!validation.valid) {
    throw new Error(`Invalid input: ${validation.error}`);
  }

  // ✅ RANA: Check permissions
  if (!hasPermission(toolName)) {
    throw new Error("Unauthorized");
  }

  // ✅ RANA: Sanitize outputs
  const result = await executeToolSafely(toolName, args);
  return sanitizeOutput(result);
}
```

### 4. Sampling Transparency

```typescript
// User controls sampling behavior
const samplingConfig = {
  enabled: await getUserPreference("allow_sampling"),
  showPrompts: true,
  requireApproval: true,
  logResults: true,
};

if (samplingConfig.enabled) {
  const approval = await showPromptToUser(prompt);
  if (approval) {
    const result = await performSampling(prompt);
    if (samplingConfig.logResults) {
      await logSamplingResult(result);
    }
  }
}
```

---

## Examples

### Example 1: Project Context Server

```typescript
// mcp-servers/project-context/src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";

class ProjectContextServer {
  private server: Server;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.server = new Server(
      {
        name: "project-context",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List resources
    this.server.setRequestHandler("resources/list", async () => ({
      resources: [
        {
          uri: `file://${this.projectRoot}/package.json`,
          name: "Package Configuration",
          description: "Project dependencies and scripts",
          mimeType: "application/json",
        },
        {
          uri: `file://${this.projectRoot}/README.md`,
          name: "Project README",
          description: "Project documentation",
          mimeType: "text/markdown",
        },
      ],
    }));

    // Read resources
    this.server.setRequestHandler("resources/read", async (request) => {
      const uri = request.params.uri as string;
      const filePath = uri.replace("file://", "");

      try {
        // ✅ RANA: Real file access (no mocks)
        const content = await fs.readFile(filePath, "utf-8");
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: content,
            },
          ],
        };
      } catch (error) {
        // ✅ RANA: Error handling
        throw new Error(`Failed to read file: ${error.message}`);
      }
    });

    // List tools
    this.server.setRequestHandler("tools/list", async () => ({
      tools: [
        {
          name: "search_code",
          description: "Search for code patterns in the project",
          inputSchema: {
            type: "object",
            properties: {
              pattern: { type: "string" },
              fileType: { type: "string" },
            },
            required: ["pattern"],
          },
        },
      ],
    }));

    // Execute tools
    this.server.setRequestHandler("tools/call", async (request) => {
      if (request.params.name === "search_code") {
        const { pattern, fileType } = request.params.arguments as any;

        try {
          // ✅ RANA: Real search implementation
          const results = await this.searchCode(pattern, fileType);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        } catch (error) {
          // ✅ RANA: Error handling
          return {
            content: [
              {
                type: "text",
                text: `Search failed: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    });
  }

  private async searchCode(pattern: string, fileType?: string): Promise<any> {
    // ✅ RANA: Real implementation (implement actual search logic)
    throw new Error("Not implemented");
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Usage
const projectRoot = process.argv[2] || process.cwd();
const server = new ProjectContextServer(projectRoot);
server.run().catch(console.error);
```

---

## Integration with RANA Workflow

### Enhanced RANA Workflow with MCP

```
1. UNDERSTANDING
   - Clarify requirements
   └─> MCP: Access project documentation resources

2. RESEARCH
   - Search existing implementations
   └─> MCP: Use code search tools
   └─> MCP: Access database schema resources

3. PLANNING
   - Design approach
   └─> MCP: Query similar implementations
   └─> MCP: Access design system resources

4. IMPLEMENTATION
   - Write code
   └─> MCP: Access API documentation
   └─> MCP: Query database for real data

5. TESTING
   - Test manually and automatically
   └─> MCP: Execute test tools
   └─> MCP: Query test results

6. DEPLOYMENT
   - Deploy to production
   └─> MCP: Trigger deployment tools
   └─> MCP: Monitor deployment status

7. VERIFICATION
   - Verify in production
   └─> MCP: Access monitoring resources
   └─> MCP: Query production logs
```

---

## Conclusion

MCP provides a powerful, standardized way to extend AI capabilities while maintaining RANA quality standards. By following these patterns and quality gates, you can build secure, production-ready MCP integrations that enhance the AI development workflow.

**Key Takeaways:**
- MCP enables secure, standardized AI-to-system connections
- RANA quality gates apply to MCP implementations
- Security (explicit consent, data minimization) is paramount
- Real data and proper error handling are non-negotiable
- Test and deploy MCP servers like any other production code

---

**Next Steps:**
1. Read the [official MCP specification](https://modelcontextprotocol.io/specification/2025-03-26)
2. Explore [MCP server examples](https://github.com/modelcontextprotocol)
3. Build your first MCP server following RANA standards
4. Integrate MCP into your development workflow

---

*Part of the RANA Framework - Production-Quality AI Development*
