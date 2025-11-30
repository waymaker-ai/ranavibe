# Shared Memory System

The Shared Memory system enables multiple RANA agents to share memory space with namespace isolation, permission management, and event-driven synchronization.

## Features

### 1. Namespace Isolation
- Organize memory into logical namespaces
- Each namespace has independent configuration
- Prevent accidental cross-contamination of data

### 2. Permission Management
- Fine-grained access control per agent
- Three permission levels: `read`, `write`, `admin`
- Default permissions for new agents
- Agent-specific permission overrides

### 3. Conflict Resolution
- **latest-wins**: Last write takes precedence (default)
- **first-wins**: First write locks the value
- **merge**: Automatically merge objects and arrays
- **version**: Version-based optimistic locking
- **custom**: User-defined resolution logic

### 4. Event System
- `memory:write` - Fired when data is written
- `memory:read` - Fired when data is read
- `memory:conflict` - Fired on write conflicts
- `memory:broadcast` - Fired on broadcasts
- `namespace:created` - Namespace created
- `namespace:cleared` - Namespace cleared
- `namespace:deleted` - Namespace deleted
- `namespace:permissions_updated` - Permissions changed

### 5. Real-time Subscriptions
- Subscribe to namespace changes
- Receive notifications on write/delete
- Multiple subscribers per namespace
- Automatic cleanup on unsubscribe

### 6. Broadcasting
- Send messages to all agents with namespace access
- Useful for coordination and announcements
- Event-driven delivery

### 7. Access Logging
- Comprehensive audit trail
- Track all read/write/delete operations
- Filter by agent, namespace, or action
- Configurable log size limits

### 8. TTL and Cleanup
- Per-namespace time-to-live settings
- Automatic expiration of stale data
- Periodic cleanup intervals
- Configurable cleanup frequency

## Basic Usage

```typescript
import { createSharedMemory } from '@rana-ai/core';

// Create shared memory instance
const memory = createSharedMemory({
  maxLogSize: 1000,
  cleanupIntervalMs: 60000, // Clean up every minute
});

// Create a namespace
memory.createNamespace('team-chat', {
  defaultPermission: 'write',
  conflictStrategy: 'latest-wins',
});

// Agent 1 writes data
memory.write('team-chat', 'status', 'ready', 'agent-1');

// Agent 2 reads data
const status = memory.read('team-chat', 'status', 'agent-2');
console.log(status); // 'ready'
```

## Permission Control

```typescript
// Create namespace with specific permissions
memory.createNamespace('sensitive', {
  defaultPermission: null, // No default access
  permissions: {
    'admin-agent': 'admin',    // Full control
    'writer-agent': 'write',   // Read + Write
    'reader-agent': 'read',    // Read only
  },
});

// Admin can do everything
memory.write('sensitive', 'key', 'value', 'admin-agent'); // ✓
memory.delete('sensitive', 'key', 'admin-agent');         // ✓

// Writer can read and write
memory.write('sensitive', 'key', 'value', 'writer-agent'); // ✓
memory.read('sensitive', 'key', 'writer-agent');           // ✓

// Reader can only read
memory.read('sensitive', 'key', 'reader-agent');           // ✓
memory.write('sensitive', 'key', 'value', 'reader-agent'); // ✗

// Unknown agent has no access
memory.read('sensitive', 'key', 'unknown-agent');          // ✗
```

## Real-time Subscriptions

```typescript
// Subscribe to namespace changes
const unsubscribe = memory.subscribe('events', 'agent-1', (data) => {
  console.log('Change detected:', {
    key: data.key,
    value: data.value,
    agentId: data.agentId,
    action: data.action, // 'write' or 'delete'
  });
});

// Other agents make changes (triggers notification)
memory.write('events', 'user-joined', { id: '123' }, 'agent-2');

// Unsubscribe when done
unsubscribe();
```

## Broadcasting

```typescript
// Listen for broadcasts
memory.on('memory:broadcast', (msg) => {
  console.log('Broadcast from', msg.from, ':', msg.message);
});

// Broadcast a message to all agents in namespace
memory.broadcast('announcements', {
  type: 'alert',
  text: 'System maintenance in 1 hour',
}, 'system-agent');
```

## Conflict Resolution

### Latest Wins (Default)
```typescript
memory.createNamespace('latest', {
  conflictStrategy: 'latest-wins',
});

memory.write('latest', 'value', 1, 'agent-1');
memory.write('latest', 'value', 2, 'agent-2');
// Result: 2
```

### First Wins
```typescript
memory.createNamespace('first', {
  conflictStrategy: 'first-wins',
});

memory.write('first', 'value', 1, 'agent-1');
memory.write('first', 'value', 2, 'agent-2'); // Rejected
// Result: 1
```

### Merge
```typescript
memory.createNamespace('merge', {
  conflictStrategy: 'merge',
});

memory.write('merge', 'user', { name: 'Alice' }, 'agent-1');
memory.write('merge', 'user', { age: 30 }, 'agent-2');
// Result: { name: 'Alice', age: 30 }
```

### Custom
```typescript
memory.createNamespace('custom', {
  conflictStrategy: 'custom',
  conflictResolver: (existing, incoming, key) => {
    // Keep the higher value
    if (existing.value > incoming.value) {
      return existing;
    }
    return incoming;
  },
});

memory.write('custom', 'score', 100, 'agent-1');
memory.write('custom', 'score', 50, 'agent-2'); // Rejected
// Result: 100
```

## TTL and Cleanup

```typescript
// Create namespace with 5-minute TTL
memory.createNamespace('session', {
  ttl: 300000, // 5 minutes in milliseconds
});

memory.write('session', 'token', 'abc123', 'agent-1');

// After 5 minutes, token will be automatically removed
```

## Access Logging

```typescript
// Get all access logs
const allLogs = memory.getAccessLog();

// Filter by agent
const agentLogs = memory.getAccessLog({
  agentId: 'agent-1',
  limit: 100,
});

// Filter by namespace and action
const writeLogs = memory.getAccessLog({
  namespace: 'team-chat',
  action: 'write',
});

// Inspect log entry
logs.forEach(log => {
  console.log(`${log.timestamp}: ${log.agentId} ${log.action} ${log.success ? 'OK' : 'FAILED'}`);
  if (log.error) {
    console.log(`  Error: ${log.error}`);
  }
});
```

## Advanced Operations

### Get All Keys
```typescript
const keys = memory.getKeys('namespace', 'agent-id');
console.log(keys); // ['key1', 'key2', 'key3']
```

### Get All Entries
```typescript
const data = memory.getAll('namespace', 'agent-id');
console.log(data); // { key1: value1, key2: value2, ... }
```

### Clear Namespace
```typescript
// Only admins can clear
memory.clearNamespace('namespace', 'admin-agent');
```

### Delete Namespace
```typescript
// Only admins can delete
memory.deleteNamespace('namespace', 'admin-agent');
```

### Update Permissions
```typescript
memory.updatePermissions('namespace', 'agent-id', {
  'new-agent': 'write',
  'existing-agent': 'admin',
}, 'admin-agent');
```

### Get Statistics
```typescript
const stats = memory.getStats();
console.log({
  namespaces: stats.namespaces,
  totalEntries: stats.totalEntries,
  accessLogs: stats.totalAccessLogs,
  subscriptions: stats.subscriptions,
});
```

## Event Handling

```typescript
// Memory write events
memory.on('memory:write', (event) => {
  console.log('Write:', event.agentId, event.namespace, event.key);
});

// Memory read events
memory.on('memory:read', (event) => {
  console.log('Read:', event.agentId, event.namespace, event.key);
});

// Conflict events
memory.on('memory:conflict', (event) => {
  console.log('Conflict:', event.reason, event.namespace, event.key);
});

// Namespace events
memory.on('namespace:created', (event) => {
  console.log('Namespace created:', event.namespace);
});

memory.on('namespace:cleared', (event) => {
  console.log('Namespace cleared:', event.namespace);
});

memory.on('namespace:deleted', (event) => {
  console.log('Namespace deleted:', event.namespace);
});
```

## Multi-Agent Collaboration Pattern

```typescript
import { createSharedMemory } from '@rana-ai/core';
import { BaseAgent } from '@rana-ai/core';

// Create shared memory
const sharedMemory = createSharedMemory();

// Set up namespaces
sharedMemory.createNamespace('tasks', {
  defaultPermission: 'write',
  conflictStrategy: 'merge',
});

sharedMemory.createNamespace('results', {
  defaultPermission: 'read',
  permissions: {
    'worker-1': 'write',
    'worker-2': 'write',
    'coordinator': 'admin',
  },
});

// Coordinator agent
class CoordinatorAgent extends BaseAgent {
  async assignTask(task: any) {
    sharedMemory.write('tasks', `task-${task.id}`, task, this.config.name);
  }

  async checkResults() {
    return sharedMemory.getAll('results', this.config.name);
  }
}

// Worker agent
class WorkerAgent extends BaseAgent {
  constructor(config: any) {
    super(config);

    // Subscribe to task assignments
    sharedMemory.subscribe('tasks', this.config.name, async (data) => {
      if (data.action === 'write') {
        await this.processTask(data.value);
      }
    });
  }

  async processTask(task: any) {
    // Do work...
    const result = await this.executeTask(task);

    // Store result
    sharedMemory.write('results', `result-${task.id}`, result, this.config.name);
  }
}
```

## Best Practices

1. **Namespace Design**
   - Use descriptive namespace names
   - Separate concerns (tasks, results, config, etc.)
   - Set appropriate permissions from the start

2. **Permission Management**
   - Follow principle of least privilege
   - Use `read` for observers
   - Use `write` for collaborators
   - Use `admin` sparingly

3. **Conflict Resolution**
   - Choose strategy based on use case
   - Use `merge` for additive operations
   - Use `version` for critical updates
   - Implement custom logic for complex scenarios

4. **Resource Management**
   - Set TTL for temporary data
   - Use `maxEntries` to prevent unbounded growth
   - Clean up subscriptions when done
   - Call `destroy()` when shutting down

5. **Error Handling**
   - Check return values from `write()` and `read()`
   - Listen for `memory:conflict` events
   - Monitor access logs for failures
   - Handle subscription callback errors

6. **Performance**
   - Use subscriptions instead of polling
   - Batch related operations
   - Set reasonable cleanup intervals
   - Limit log size appropriately

## Integration with RANA Agents

The SharedMemory system is designed to work seamlessly with RANA's agent framework:

```typescript
import { BaseAgent, createSharedMemory } from '@rana-ai/core';

// Create shared memory for all agents
const sharedMemory = createSharedMemory();

// Set up collaboration namespace
sharedMemory.createNamespace('agent-collaboration', {
  defaultPermission: 'write',
});

// Agents can access shared memory through their context
class CollaborativeAgent extends BaseAgent {
  private memory = sharedMemory;

  async shareDiscovery(key: string, value: any) {
    this.memory.write(
      'agent-collaboration',
      key,
      value,
      this.config.name
    );
  }

  async getSharedKnowledge(key: string) {
    return this.memory.read(
      'agent-collaboration',
      key,
      this.config.name
    );
  }
}
```

## Cleanup

```typescript
// Clean up when shutting down
memory.destroy();
```

This stops cleanup intervals and removes all listeners.
