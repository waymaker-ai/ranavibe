# @ranavibe/sandbox

Lightweight Node.js agent execution sandbox. The NemoClaw/OpenShell alternative that runs anywhere without Docker or NVIDIA GPUs.

**Zero runtime dependencies.** Uses Node.js `vm` module and `worker_threads`.

## Install

```bash
npm install @ranavibe/sandbox
```

## Quick Start

```typescript
import { Sandbox, restrictedAgent } from '@ranavibe/sandbox';

const sandbox = new Sandbox({
  policy: restrictedAgent,
  workingDir: './workspace',
  env: { NODE_ENV: 'sandbox' },
});

const result = await sandbox.run(`
  console.log('Hello from the sandbox!');
  const fs = require('fs');
  // This will be blocked by the policy:
  // fs.readFileSync('/etc/passwd');
`);

console.log(result.output);       // "Hello from the sandbox!\n"
console.log(result.exitCode);     // 0
console.log(result.violations);   // []
console.log(result.duration);     // 12 (ms)
```

## API

### `Sandbox`

```typescript
import { Sandbox } from '@ranavibe/sandbox';

const sandbox = new Sandbox(config: SandboxConfig);

// Run arbitrary code
const result = await sandbox.run(code: string): Promise<SandboxResult>;

// Run a file
const result = await sandbox.runFile(filePath: string): Promise<SandboxResult>;

// Run an agent function (serialized and executed in isolation)
const result = await sandbox.runAgent(fn: () => Promise<string>): Promise<SandboxResult>;

// Inspect after execution
sandbox.getViolations(): Violation[];
sandbox.getResourceUsage(): ResourceUsage;

// Terminate
sandbox.kill(): void;
```

### `SandboxResult`

```typescript
interface SandboxResult {
  output: string;           // Captured stdout/stderr
  exitCode: number;         // 0 = success, 124 = timeout
  violations: Violation[];  // Policy violations (logged, not crashed)
  resourceUsage: ResourceUsage;
  duration: number;         // Wall-clock ms
}
```

## Policy Format

Policies define what sandbox code can access. They follow a YAML-like structure:

```yaml
name: restricted-agent
extends: default
filesystem:
  allow:
    - path: "./workspace/**"
      permissions: [read, write]
    - path: "/tmp/**"
      permissions: [read, write]
  deny:
    - path: "~/.ssh/**"
    - path: "~/.env"
    - path: "/etc/**"
network:
  allow:
    - domain: "api.anthropic.com"
      ports: [443]
    - domain: "api.openai.com"
      ports: [443]
  deny:
    - domain: "*"
process:
  allow: [node, npx, git]
  deny: [rm, sudo, chmod, curl, wget]
  maxConcurrent: 3
limits:
  timeout: 30000
  memoryMB: 512
  maxFileSize: 10485760
```

In TypeScript:

```typescript
import { parsePolicy, registerPolicy, defaultPolicy } from '@ranavibe/sandbox';

// Register a base policy for inheritance
registerPolicy(defaultPolicy);

// Parse a policy object (resolves `extends`)
const policy = parsePolicy({
  name: 'my-policy',
  extends: 'default',
  filesystem: {
    allow: [{ path: './data/**', permissions: ['read'] }],
    deny: [],
  },
  network: { allow: [], deny: [{ domain: '*' }] },
  process: { allow: ['node'], deny: ['sudo'], maxConcurrent: 2 },
  limits: { timeout: 15000, memoryMB: 256, maxFileSize: 5242880 },
});
```

## Preset Policies

| Preset | Filesystem | Network | Processes | Timeout |
|--------|-----------|---------|-----------|---------|
| `restrictedAgent` | workspace + /tmp only | LLM APIs only | node, npx, git | 30s |
| `openAgent` | Broad (no system files) | All | Most tools | 120s |
| `ciRunner` | Read-only source, write to output | npm registry, GitHub | npm, git, test runners | 5m |
| `sandboxed` | /tmp only | None | node only | 10s |

```typescript
import { restrictedAgent, openAgent, ciRunner, sandboxed } from '@ranavibe/sandbox';
```

## Guards

Guards are the enforcement layer. They intercept operations and check them against policy rules.

- **FilesystemGuard** -- Proxies `fs` module, checks paths against glob patterns, enforces max file size
- **NetworkGuard** -- Validates domains/ports against allow/deny rules, tracks bytes transferred
- **ProcessGuard** -- Checks commands against allow/deny lists, enforces max concurrent processes

For advanced usage, guards can be used directly:

```typescript
import { createFilesystemGuard, createNetworkGuard, createProcessGuard } from '@ranavibe/sandbox';

const fsGuard = createFilesystemGuard(policy.filesystem, policy.limits, workingDir);
const netGuard = createNetworkGuard(policy.network);
const procGuard = createProcessGuard(policy.process);

// Use fsGuard.guardedFs as a drop-in replacement for `fs`
// Use netGuard.checkConnection(domain, port) before network calls
// Use procGuard.checkCommand(cmd) before spawning processes
```

## How It Works

1. Creates an isolated `vm.Context` with restricted globals
2. Wraps `fs`, `net`, `child_process` with guard proxies
3. Enforces timeout via `vm.Script` timeout option
4. Tracks all resource usage (CPU, memory, network, files)
5. Collects violations without crashing -- logs and blocks, then returns structured results

## Comparison with OpenShell / NemoClaw

| Feature | @ranavibe/sandbox | OpenShell | NemoClaw |
|---------|-------------------|-----------|----------|
| Runtime | Node.js (any platform) | Docker required | NVIDIA GPU + Docker |
| Dependencies | Zero | Docker, container images | CUDA, Docker, GPU drivers |
| Setup time | `npm install` | Container build | GPU provisioning |
| Isolation | vm + guards | Container | GPU sandbox |
| Policy system | Declarative YAML-like | Dockerfile | Config files |
| Use case | Agent sandboxing | General isolation | GPU workloads |

## License

MIT
