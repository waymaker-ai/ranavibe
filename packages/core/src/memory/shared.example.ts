/**
 * Shared Memory Example
 * Demonstrates how to use shared memory for multi-agent collaboration
 */

import { createSharedMemory } from './shared';

/**
 * Example 1: Basic multi-agent memory sharing
 */
async function basicSharing() {
  console.log('=== Example 1: Basic Memory Sharing ===\n');

  const memory = createSharedMemory();

  // Create a shared namespace for all agents
  memory.createNamespace('team-chat', {
    defaultPermission: 'write',
    conflictStrategy: 'latest-wins',
  });

  // Agent 1 writes a message
  memory.write('team-chat', 'task-status', 'in-progress', 'agent-1');

  // Agent 2 reads the message
  const status = memory.read('team-chat', 'task-status', 'agent-2');
  console.log('Agent 2 reads:', status); // 'in-progress'

  // Agent 3 updates the status
  memory.write('team-chat', 'task-status', 'completed', 'agent-3');

  // Agent 1 reads the updated status
  const updatedStatus = memory.read('team-chat', 'task-status', 'agent-1');
  console.log('Agent 1 reads updated status:', updatedStatus); // 'completed'

  console.log('\n');
}

/**
 * Example 2: Permission-based access control
 */
async function permissionControl() {
  console.log('=== Example 2: Permission Control ===\n');

  const memory = createSharedMemory();

  // Create a namespace with specific permissions
  memory.createNamespace('sensitive-data', {
    defaultPermission: null, // No default access
    permissions: {
      'admin-agent': 'admin',
      'writer-agent': 'write',
      'reader-agent': 'read',
    },
    conflictStrategy: 'latest-wins',
  });

  // Admin can write
  const adminWrite = memory.write('sensitive-data', 'secret', 'top-secret', 'admin-agent');
  console.log('Admin write:', adminWrite); // true

  // Reader can read
  const readerRead = memory.read('sensitive-data', 'secret', 'reader-agent');
  console.log('Reader reads:', readerRead); // 'top-secret'

  // Reader cannot write
  const readerWrite = memory.write('sensitive-data', 'secret', 'modified', 'reader-agent');
  console.log('Reader write:', readerWrite); // false

  // Unauthorized agent cannot read
  const unauthorizedRead = memory.read('sensitive-data', 'secret', 'unknown-agent');
  console.log('Unauthorized read:', unauthorizedRead); // null

  console.log('\n');
}

/**
 * Example 3: Real-time subscriptions
 */
async function subscriptions() {
  console.log('=== Example 3: Real-time Subscriptions ===\n');

  const memory = createSharedMemory();

  memory.createNamespace('events', {
    defaultPermission: 'write',
  });

  // Agent 1 subscribes to changes
  const unsubscribe = memory.subscribe('events', 'agent-1', (data) => {
    console.log(`Agent 1 received notification:`, {
      key: data.key,
      value: data.value,
      from: data.agentId,
      action: data.action,
    });
  });

  // Agent 2 writes data (triggers notification)
  memory.write('events', 'user-joined', { userId: '123', name: 'Alice' }, 'agent-2');

  // Agent 3 writes data (triggers another notification)
  memory.write('events', 'user-left', { userId: '456', name: 'Bob' }, 'agent-3');

  // Unsubscribe
  unsubscribe();

  // This write won't trigger a notification
  memory.write('events', 'user-joined', { userId: '789', name: 'Charlie' }, 'agent-2');

  console.log('\n');
}

/**
 * Example 4: Broadcasting messages
 */
async function broadcasting() {
  console.log('=== Example 4: Broadcasting ===\n');

  const memory = createSharedMemory();

  memory.createNamespace('announcements', {
    defaultPermission: 'read',
    permissions: {
      'broadcaster': 'write',
    },
  });

  // Listen for broadcasts
  memory.on('memory:broadcast', (msg) => {
    console.log(`Broadcast received:`, {
      from: msg.from,
      namespace: msg.namespace,
      message: msg.message,
    });
  });

  // Broadcast a message
  memory.broadcast('announcements', { type: 'alert', text: 'System maintenance in 1 hour' }, 'broadcaster');

  console.log('\n');
}

/**
 * Example 5: Conflict resolution strategies
 */
async function conflictResolution() {
  console.log('=== Example 5: Conflict Resolution ===\n');

  const memory = createSharedMemory();

  // Strategy 1: Latest wins (default)
  memory.createNamespace('latest-wins', {
    defaultPermission: 'write',
    conflictStrategy: 'latest-wins',
  });

  memory.write('latest-wins', 'counter', 1, 'agent-1');
  memory.write('latest-wins', 'counter', 2, 'agent-2');
  console.log('Latest wins:', memory.read('latest-wins', 'counter', 'agent-1')); // 2

  // Strategy 2: First wins
  memory.createNamespace('first-wins', {
    defaultPermission: 'write',
    conflictStrategy: 'first-wins',
  });

  memory.write('first-wins', 'counter', 1, 'agent-1');
  memory.write('first-wins', 'counter', 2, 'agent-2'); // This will be rejected
  console.log('First wins:', memory.read('first-wins', 'counter', 'agent-1')); // 1

  // Strategy 3: Merge (for objects)
  memory.createNamespace('merge', {
    defaultPermission: 'write',
    conflictStrategy: 'merge',
  });

  memory.write('merge', 'user', { name: 'Alice' }, 'agent-1');
  memory.write('merge', 'user', { age: 30 }, 'agent-2');
  console.log('Merged:', memory.read('merge', 'user', 'agent-1')); // { name: 'Alice', age: 30 }

  // Strategy 4: Custom resolver
  memory.createNamespace('custom', {
    defaultPermission: 'write',
    conflictStrategy: 'custom',
    conflictResolver: (existing, incoming) => {
      // Keep the higher value
      if (typeof existing.value === 'number' && typeof incoming.value === 'number') {
        return existing.value > incoming.value ? existing : incoming;
      }
      return incoming;
    },
  });

  memory.write('custom', 'score', 100, 'agent-1');
  memory.write('custom', 'score', 50, 'agent-2'); // Won't replace because 50 < 100
  console.log('Custom (max):', memory.read('custom', 'score', 'agent-1')); // 100

  memory.write('custom', 'score', 150, 'agent-3'); // Will replace because 150 > 100
  console.log('Custom (max):', memory.read('custom', 'score', 'agent-1')); // 150

  console.log('\n');
}

/**
 * Example 6: TTL and automatic cleanup
 */
async function ttlAndCleanup() {
  console.log('=== Example 6: TTL and Cleanup ===\n');

  const memory = createSharedMemory({ cleanupIntervalMs: 1000 });

  // Create namespace with 2-second TTL
  memory.createNamespace('temporary', {
    defaultPermission: 'write',
    ttl: 2000, // 2 seconds
  });

  memory.write('temporary', 'session-token', 'abc123', 'agent-1');
  console.log('Immediate read:', memory.read('temporary', 'session-token', 'agent-1')); // 'abc123'

  // Wait 2.5 seconds
  await new Promise(resolve => setTimeout(resolve, 2500));

  console.log('After TTL:', memory.read('temporary', 'session-token', 'agent-1')); // null (expired)

  memory.destroy();
  console.log('\n');
}

/**
 * Example 7: Access logging and auditing
 */
async function accessLogging() {
  console.log('=== Example 7: Access Logging ===\n');

  const memory = createSharedMemory();

  memory.createNamespace('audited', {
    defaultPermission: 'read',
    permissions: {
      'admin': 'admin',
    },
  });

  // Perform various operations
  memory.write('audited', 'data', 'value1', 'admin');
  memory.read('audited', 'data', 'agent-1');
  memory.read('audited', 'data', 'agent-2');
  memory.write('audited', 'data', 'value2', 'agent-1'); // Will fail (no permission)

  // Get access logs
  const logs = memory.getAccessLog({ namespace: 'audited' });
  console.log('Access logs:');
  logs.forEach(log => {
    console.log(`  ${log.timestamp.toISOString()}: ${log.agentId} ${log.action} ${log.key || ''} - ${log.success ? 'SUCCESS' : 'FAILED'}`);
    if (log.error) {
      console.log(`    Error: ${log.error}`);
    }
  });

  console.log('\n');
}

/**
 * Example 8: Multi-agent collaboration scenario
 */
async function collaborationScenario() {
  console.log('=== Example 8: Multi-Agent Collaboration ===\n');

  const memory = createSharedMemory();

  // Create shared workspace
  memory.createNamespace('workspace', {
    defaultPermission: 'write',
    conflictStrategy: 'merge',
  });

  // Create task queue
  memory.createNamespace('task-queue', {
    defaultPermission: 'write',
  });

  // Agent 1: Coordinator - assigns tasks
  console.log('Coordinator: Creating tasks...');
  memory.write('task-queue', 'tasks', [
    { id: 1, type: 'fetch-data', status: 'pending' },
    { id: 2, type: 'process-data', status: 'pending' },
    { id: 3, type: 'save-results', status: 'pending' },
  ], 'coordinator');

  // Agent 2: Worker - subscribes to task updates
  memory.subscribe('task-queue', 'worker-1', (data) => {
    console.log(`Worker 1: Noticed task update on ${data.key}`);
  });

  // Agent 2: Worker - picks up a task
  const tasks = memory.read('task-queue', 'tasks', 'worker-1') as any[];
  if (tasks && tasks.length > 0) {
    const myTask = tasks[0];
    myTask.status = 'in-progress';
    myTask.assignedTo = 'worker-1';
    memory.write('task-queue', 'tasks', tasks, 'worker-1');
    console.log('Worker 1: Picked up task', myTask.id);

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 100));

    // Complete task
    myTask.status = 'completed';
    memory.write('task-queue', 'tasks', tasks, 'worker-1');
    console.log('Worker 1: Completed task', myTask.id);
  }

  // Agent 3: Monitor - observes progress
  const finalTasks = memory.read('task-queue', 'tasks', 'monitor');
  console.log('Monitor: Current task status:', finalTasks);

  // Get statistics
  const stats = memory.getStats();
  console.log('\nMemory Statistics:', {
    namespaces: stats.namespaces,
    totalEntries: stats.totalEntries,
    accessLogs: stats.totalAccessLogs,
  });

  console.log('\n');
}

/**
 * Example 9: Event-driven coordination
 */
async function eventDrivenCoordination() {
  console.log('=== Example 9: Event-driven Coordination ===\n');

  const memory = createSharedMemory();

  memory.createNamespace('coordination', {
    defaultPermission: 'write',
  });

  // Set up event listeners
  memory.on('memory:write', (event) => {
    console.log(`Write event: ${event.agentId} wrote to ${event.namespace}/${event.key}`);
  });

  memory.on('memory:conflict', (event) => {
    console.log(`Conflict: Agent ${event.agentId} conflicted on ${event.namespace}/${event.key}`);
  });

  // Simulate coordinated workflow
  memory.write('coordination', 'step-1', 'completed', 'agent-1');
  memory.write('coordination', 'step-2', 'completed', 'agent-2');
  memory.write('coordination', 'step-3', 'completed', 'agent-3');

  console.log('\n');
}

/**
 * Run all examples
 */
async function runExamples() {
  await basicSharing();
  await permissionControl();
  await subscriptions();
  await broadcasting();
  await conflictResolution();
  await ttlAndCleanup();
  await accessLogging();
  await collaborationScenario();
  await eventDrivenCoordination();
}

export { runExamples };
