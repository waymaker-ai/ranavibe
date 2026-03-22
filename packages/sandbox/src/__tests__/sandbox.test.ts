import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sandbox } from '../sandbox';
import { defaultPolicy, restrictedAgent, openAgent, ciRunner, presets } from '../policies/presets';
import { parsePolicy, validatePolicy } from '../policies/parser';
import type {
  SandboxConfig,
  SandboxPolicy,
  SandboxResult,
  Violation,
  ResourceUsage,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePolicy(overrides: Partial<SandboxPolicy> = {}): SandboxPolicy {
  return {
    name: 'test-policy',
    filesystem: {
      allow: [{ path: '/tmp/**', permissions: ['read', 'write'] }],
      deny: [{ path: '/etc/**' }],
    },
    network: {
      allow: [],
      deny: [{ domain: '*' }],
    },
    process: {
      allow: [],
      deny: ['*'],
      maxConcurrent: 0,
    },
    limits: {
      timeout: 5000,
      memoryMB: 128,
      maxFileSize: 1024 * 1024,
    },
    ...overrides,
  };
}

function makeConfig(overrides: Partial<SandboxConfig> = {}): SandboxConfig {
  return {
    policy: makePolicy(),
    env: {},
    workingDir: '/tmp',
    ...overrides,
  };
}

// ===========================================================================
// Policy Presets
// ===========================================================================

describe('Policy Presets', () => {
  it('should provide a default policy', () => {
    expect(defaultPolicy).toBeDefined();
    expect(defaultPolicy.name).toBeDefined();
    expect(defaultPolicy.filesystem).toBeDefined();
    expect(defaultPolicy.network).toBeDefined();
    expect(defaultPolicy.process).toBeDefined();
    expect(defaultPolicy.limits).toBeDefined();
  });

  it('should provide a restricted agent policy', () => {
    expect(restrictedAgent).toBeDefined();
    expect(restrictedAgent.name).toBeDefined();
    expect(restrictedAgent.limits.timeout).toBeGreaterThan(0);
  });

  it('should provide an open agent policy', () => {
    expect(openAgent).toBeDefined();
    expect(openAgent.name).toBeDefined();
  });

  it('should provide a CI runner policy', () => {
    expect(ciRunner).toBeDefined();
    expect(ciRunner.name).toBeDefined();
  });

  it('should expose all presets in the presets object', () => {
    expect(presets).toBeDefined();
    expect(typeof presets).toBe('object');
  });
});

// ===========================================================================
// Sandbox - Basic Execution
// ===========================================================================

describe('Sandbox - Basic Execution', () => {
  it('should execute simple synchronous code', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run('console.log("Hello from sandbox")');

    expect(result.output).toContain('Hello from sandbox');
    expect(result.exitCode).toBe(0);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should capture multiple console.log outputs', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      console.log("line1");
      console.log("line2");
      console.log("line3");
    `);

    expect(result.output).toContain('line1');
    expect(result.output).toContain('line2');
    expect(result.output).toContain('line3');
  });

  it('should capture console.error as stderr output', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run('console.error("error message")');

    expect(result.output).toContain('stderr');
    expect(result.output).toContain('error message');
  });

  it('should support variable declarations and computations', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      const a = 10;
      const b = 20;
      console.log(a + b);
    `);

    expect(result.output).toContain('30');
  });

  it('should support JSON operations', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      const data = { name: "Alice", age: 30 };
      console.log(JSON.stringify(data));
    `);

    expect(result.output).toContain('"name":"Alice"');
    expect(result.output).toContain('"age":30');
  });

  it('should expose environment variables', async () => {
    const sandbox = new Sandbox(makeConfig({
      env: { MY_VAR: 'hello-env' },
    }));
    const result = await sandbox.run('console.log(process.env.MY_VAR)');

    expect(result.output).toContain('hello-env');
  });

  it('should provide process.cwd()', async () => {
    const sandbox = new Sandbox(makeConfig({ workingDir: '/tmp' }));
    const result = await sandbox.run('console.log(process.cwd())');

    expect(result.output).toContain('/tmp');
  });

  it('should handle errors in executed code', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run('throw new Error("test error")');

    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain('test error');
  });

  it('should handle syntax errors', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run('function( invalid syntax {{{');

    expect(result.exitCode).not.toBe(0);
  });

  it('should support process.exit()', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      console.log("before exit");
      process.exit(0);
      console.log("after exit");
    `);

    expect(result.output).toContain('before exit');
    expect(result.output).not.toContain('after exit');
    expect(result.exitCode).toBe(0);
  });

  it('should support process.exit with non-zero code', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run('process.exit(42)');

    expect(result.exitCode).toBe(42);
  });
});

// ===========================================================================
// Sandbox - Timeouts
// ===========================================================================

describe('Sandbox - Timeouts', () => {
  it('should timeout on infinite loops', async () => {
    const sandbox = new Sandbox(makeConfig({
      policy: makePolicy({ limits: { timeout: 100, memoryMB: 128, maxFileSize: 1024 } }),
    }));

    const result = await sandbox.run('while(true) {}');

    expect(result.exitCode).toBe(124);
    expect(result.violations.some(v => v.type === 'timeout')).toBe(true);
  });

  it('should respect custom timeout from config', async () => {
    const sandbox = new Sandbox(makeConfig({
      timeout: 200,
      policy: makePolicy(),
    }));

    const start = Date.now();
    const result = await sandbox.run('while(true) {}');
    const elapsed = Date.now() - start;

    expect(result.violations.some(v => v.type === 'timeout')).toBe(true);
    // Should finish around 200ms (with some margin)
    expect(elapsed).toBeLessThan(2000);
  });
});

// ===========================================================================
// Sandbox - Module Blocking
// ===========================================================================

describe('Sandbox - Module Blocking', () => {
  it('should block http module', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      try {
        const http = require('http');
      } catch (e) {
        console.log(e.message);
      }
    `);

    expect(result.output).toContain('SANDBOX');
    expect(result.output).toContain('not available');
  });

  it('should block https module', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      try {
        const https = require('https');
      } catch (e) {
        console.log(e.message);
      }
    `);

    expect(result.output).toContain('not available');
  });

  it('should block net module', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      try {
        require('net');
      } catch (e) {
        console.log(e.message);
      }
    `);

    expect(result.output).toContain('not available');
  });

  it('should block worker_threads module', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      try {
        require('worker_threads');
      } catch (e) {
        console.log(e.message);
      }
    `);

    expect(result.output).toContain('not available');
  });

  it('should allow path module', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      const path = require('path');
      console.log(path.join('/tmp', 'test'));
    `);

    expect(result.output).toContain('/tmp/test');
    expect(result.exitCode).toBe(0);
  });

  it('should allow crypto module', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      const crypto = require('crypto');
      console.log(typeof crypto.createHash);
    `);

    expect(result.output).toContain('function');
  });

  it('should allow util module', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      const util = require('util');
      console.log(typeof util.inspect);
    `);

    expect(result.output).toContain('function');
  });

  it('should record network violations', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      try { require('http'); } catch(e) {}
    `);

    expect(result.violations.some(v => v.type === 'network')).toBe(true);
  });
});

// ===========================================================================
// Sandbox - Resource Tracking
// ===========================================================================

describe('Sandbox - Resource Tracking', () => {
  it('should track execution duration', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run('console.log("quick")');

    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.resourceUsage).toBeDefined();
    expect(result.resourceUsage.cpuMs).toBeGreaterThanOrEqual(0);
  });

  it('should track memory usage', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run('const arr = new Array(1000).fill("data")');

    expect(result.resourceUsage.memoryMB).toBeGreaterThan(0);
  });

  it('should provide resource usage via getResourceUsage()', async () => {
    const sandbox = new Sandbox(makeConfig());
    await sandbox.run('console.log("test")');

    const usage = sandbox.getResourceUsage();
    expect(usage.cpuMs).toBeGreaterThanOrEqual(0);
    expect(typeof usage.memoryMB).toBe('number');
    expect(typeof usage.networkBytes).toBe('number');
    expect(Array.isArray(usage.filesAccessed)).toBe(true);
  });

  it('should provide violations via getViolations()', async () => {
    const sandbox = new Sandbox(makeConfig());
    await sandbox.run('try { require("http"); } catch(e) {}');

    const violations = sandbox.getViolations();
    expect(Array.isArray(violations)).toBe(true);
    expect(violations.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Sandbox - Kill
// ===========================================================================

describe('Sandbox - Kill', () => {
  it('should throw after being killed', async () => {
    const sandbox = new Sandbox(makeConfig());
    sandbox.kill();

    await expect(sandbox.run('console.log("test")')).rejects.toThrow('killed');
  });
});

// ===========================================================================
// Sandbox - Built-in Globals
// ===========================================================================

describe('Sandbox - Built-in Globals', () => {
  it('should expose Math', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run('console.log(Math.max(1, 5, 3))');
    expect(result.output).toContain('5');
  });

  it('should expose Date', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run('console.log(typeof new Date().getTime())');
    expect(result.output).toContain('number');
  });

  it('should expose Buffer', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      const buf = Buffer.from('hello');
      console.log(buf.toString('hex'));
    `);
    expect(result.output).toContain('68656c6c6f');
  });

  it('should expose URL and URLSearchParams', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      const url = new URL('https://example.com/path?q=1');
      console.log(url.hostname);
    `);
    expect(result.output).toContain('example.com');
  });

  it('should expose Map and Set', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      const m = new Map();
      m.set('key', 'value');
      console.log(m.get('key'));
    `);
    expect(result.output).toContain('value');
  });

  it('should expose Promise', async () => {
    const sandbox = new Sandbox(makeConfig());
    const result = await sandbox.run(`
      console.log(typeof Promise);
    `);
    expect(result.output).toContain('function');
  });
});
