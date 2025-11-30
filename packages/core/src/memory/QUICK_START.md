# SharedMemory Quick Start Guide

## Installation

SharedMemory is part of `@rana-ai/core`. No additional installation needed.

```typescript
import { createSharedMemory } from '@rana-ai/core';
```

## 30-Second Start

```typescript
// 1. Create shared memory
const memory = createSharedMemory();

// 2. Create a namespace
memory.createNamespace('my-namespace', {
  defaultPermission: 'write',
});

// 3. Write data
memory.write('my-namespace', 'key', 'value', 'agent-1');

// 4. Read data
const value = memory.read('my-namespace', 'key', 'agent-2');
console.log(value); // 'value'
```

## Common Patterns

### Pattern 1: Agent Collaboration

```typescript
// Setup
const memory = createSharedMemory();
memory.createNamespace('tasks', { defaultPermission: 'write' });

// Agent 1: Assign task
memory.write('tasks', 'task-1', {
  status: 'pending',
  assignedTo: 'agent-2'
}, 'agent-1');

// Agent 2: Get and update task
const task = memory.read('tasks', 'task-1', 'agent-2');
task.status = 'in-progress';
memory.write('tasks', 'task-1', task, 'agent-2');
```

### Pattern 2: Real-time Updates

```typescript
// Agent subscribes to changes
const unsubscribe = memory.subscribe('events', 'agent-1', (data) => {
  console.log(`${data.agentId} ${data.action}d ${data.key}: ${data.value}`);
});

// Other agents trigger notifications
memory.write('events', 'user-joined', { id: '123' }, 'agent-2');
// → Logs: "agent-2 wrote user-joined: { id: '123' }"

// Cleanup when done
unsubscribe();
```

### Pattern 3: Secure Data Sharing

```typescript
// Create namespace with permissions
memory.createNamespace('sensitive', {
  defaultPermission: null, // No default access
  permissions: {
    'admin': 'admin',
    'worker': 'read',
  },
});

// Only admin can write
memory.write('sensitive', 'secret', 'value', 'admin'); // ✓
memory.write('sensitive', 'secret', 'value', 'worker'); // ✗ (returns false)

// Worker can read
memory.read('sensitive', 'secret', 'worker'); // ✓
```

### Pattern 4: Conflict-Free Merging

```typescript
// Create namespace with merge strategy
memory.createNamespace('config', {
  defaultPermission: 'write',
  conflictStrategy: 'merge',
});

// Multiple agents contribute to config
memory.write('config', 'settings', { theme: 'dark' }, 'agent-1');
memory.write('config', 'settings', { language: 'en' }, 'agent-2');

// Result is merged
const settings = memory.read('config', 'settings', 'agent-1');
console.log(settings); // { theme: 'dark', language: 'en' }
```

### Pattern 5: Broadcasting Announcements

```typescript
// Listen for broadcasts
memory.on('memory:broadcast', (msg) => {
  console.log(`${msg.from}: ${msg.message.text}`);
});

// Send announcement
memory.broadcast('announcements', {
  type: 'alert',
  text: 'System maintenance in 10 minutes'
}, 'system');
```

## Permission Levels

| Level | Can Read | Can Write | Can Delete | Can Admin |
|-------|----------|-----------|------------|-----------|
| read  | ✓        | ✗         | ✗          | ✗         |
| write | ✓        | ✓         | ✓          | ✗         |
| admin | ✓        | ✓         | ✓          | ✓         |

## Conflict Strategies

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| latest-wins | Last write wins | General use, logs, status updates |
| first-wins | First write locks | Claims, reservations |
| merge | Combine objects/arrays | Configurations, collections |
| version | Optimistic locking | Critical data requiring coordination |
| custom | User-defined | Special business logic |

## Quick API Reference

### Namespace Operations
```typescript
createNamespace(name, config)      // Create/update namespace
deleteNamespace(name, agentId)     // Delete namespace (admin only)
clearNamespace(name, agentId)      // Clear all data (admin only)
getNamespaceConfig(name)           // Get namespace configuration
updatePermissions(ns, agent, perms, requestor) // Update permissions
```

### Data Operations
```typescript
write(ns, key, value, agentId)     // Write data
read(ns, key, agentId)             // Read data
delete(ns, key, agentId)           // Delete data
getKeys(ns, agentId)               // Get all keys
getAll(ns, agentId)                // Get all entries
```

### Events & Communication
```typescript
subscribe(ns, agentId, callback)   // Subscribe to changes
broadcast(ns, message, agentId)    // Broadcast message
on('event', handler)               // Listen to events
```

### Monitoring
```typescript
getAccessLog(filter?)              // Get access logs
getStats()                         // Get statistics
```

## Events You Can Listen To

```typescript
memory.on('memory:write', (event) => { ... })
memory.on('memory:read', (event) => { ... })
memory.on('memory:conflict', (event) => { ... })
memory.on('memory:broadcast', (event) => { ... })
memory.on('namespace:created', (event) => { ... })
memory.on('namespace:cleared', (event) => { ... })
memory.on('namespace:deleted', (event) => { ... })
```

## Best Practices

1. **Always call `destroy()` when done**
   ```typescript
   const memory = createSharedMemory();
   // ... use memory ...
   memory.destroy(); // Cleanup
   ```

2. **Check return values**
   ```typescript
   const success = memory.write('ns', 'key', 'value', 'agent');
   if (!success) {
     console.error('Write failed - check permissions');
   }
   ```

3. **Use descriptive namespace names**
   ```typescript
   // Good
   memory.createNamespace('user-sessions', { ... });
   memory.createNamespace('task-queue', { ... });

   // Avoid
   memory.createNamespace('data', { ... });
   memory.createNamespace('stuff', { ... });
   ```

4. **Unsubscribe when done**
   ```typescript
   const unsub = memory.subscribe('ns', 'agent', callback);
   // Later...
   unsub(); // Prevent memory leaks
   ```

5. **Set TTL for temporary data**
   ```typescript
   memory.createNamespace('sessions', {
     ttl: 3600000, // 1 hour
   });
   ```

## Common Errors & Solutions

### Error: "Namespace does not exist"
```typescript
// ✗ Wrong
memory.write('ns', 'key', 'value', 'agent');

// ✓ Correct
memory.createNamespace('ns', { defaultPermission: 'write' });
memory.write('ns', 'key', 'value', 'agent');
```

### Error: Write returns false
```typescript
// Check permissions
const config = memory.getNamespaceConfig('ns');
console.log(config?.permissions);

// Grant permission
memory.updatePermissions('ns', 'agent-id', {
  'agent-id': 'write'
}, 'admin-agent');
```

### Error: Read returns null
```typescript
// Could be:
// 1. Key doesn't exist
// 2. No read permission
// 3. Data expired (TTL)

// Check access log
const logs = memory.getAccessLog({
  agentId: 'agent-id',
  action: 'read'
});
console.log(logs[logs.length - 1].error);
```

## Examples

See complete examples:
- `shared.example.ts` - 9 basic examples
- `shared.integration.example.ts` - Multi-agent workflow
- `SHARED_MEMORY.md` - Comprehensive documentation

## Support

For issues or questions:
1. Check `SHARED_MEMORY.md` for detailed documentation
2. Review examples in `shared.example.ts`
3. Inspect access logs: `memory.getAccessLog()`
4. Check statistics: `memory.getStats()`
