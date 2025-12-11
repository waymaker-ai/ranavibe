# MCP Server Examples

Example MCP servers demonstrating different patterns and use cases.

## Available Examples

### 1. Weather Server (`weather-server.ts`)
Simple API integration pattern. Shows how to:
- Expose API data as MCP tools
- Handle optional parameters
- Return structured JSON responses

**Tools:** `get_weather`, `get_forecast`

### 2. Notes Server (`notes-server.ts`)
CRUD operations with resources. Demonstrates:
- Create, read, update, delete operations
- In-memory data storage
- Resources for data access
- Search and filtering

**Tools:** `create_note`, `update_note`, `delete_note`, `search_notes`, `list_notes`
**Resources:** `notes://all`, `notes://tags`

### 3. Calculator Server (`calculator-server.ts`)
Tool validation and error handling. Shows:
- Input validation
- Error handling
- Unit conversions
- Statistical calculations

**Tools:** `calculate`, `convert_units`, `statistics`

### 4. System Info Server (`system-info-server.ts`)
System monitoring and information. Demonstrates:
- Accessing system APIs
- Real-time data (CPU, memory)
- Safe environment variable access
- Resources for status monitoring

**Tools:** `get_system_info`, `get_cpu_usage`, `get_memory_usage`, `get_disk_usage`, `get_network_info`, `get_process_info`, `get_env_var`
**Resources:** `system://info`, `system://status`

### 5. Time Server (`time-server.ts`)
Time and date operations with prompts. Shows:
- Timezone handling
- Date calculations
- Prompt templates for complex workflows

**Tools:** `get_current_time`, `convert_timezone`, `get_date_info`, `calculate_duration`, `add_time`, `list_timezones`
**Prompts:** `schedule_meeting`, `countdown`

## Running Examples

1. Install dependencies:
```bash
npm install @modelcontextprotocol/sdk
```

2. Compile TypeScript:
```bash
npx tsc examples/weather-server.ts --outDir dist --module NodeNext --moduleResolution NodeNext --esModuleInterop
```

3. Run with MCP Inspector:
```bash
npx @anthropic-ai/mcp-inspector node dist/weather-server.js
```

4. Or add to Claude Desktop config:
```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/path/to/dist/weather-server.js"]
    }
  }
}
```

## Creating Your Own Server

Use the RANA CLI to scaffold a new server:

```bash
rana mcp create my-server
```

Or use the scaffolding API:

```typescript
import { scaffoldMCPServer, TEMPLATES } from '@rana/mcp';

const result = scaffoldMCPServer({
  name: 'my-server',
  description: 'My custom MCP server',
  template: 'database', // or 'api', 'filesystem', 'github', 'slack', 'minimal'
  includeTests: true,
  includeClaude: true,
});

// result.files contains all generated files
// result.instructions contains setup steps
```

## Best Practices

1. **Validate inputs** - Check all required parameters and types
2. **Handle errors gracefully** - Return `isError: true` with helpful messages
3. **Use descriptive names** - Tools and parameters should be self-documenting
4. **Return structured data** - JSON is preferred for complex responses
5. **Implement resources** - For data that should be browseable
6. **Add prompts** - For complex multi-step workflows
7. **Test thoroughly** - Use the MCP Inspector before deploying
