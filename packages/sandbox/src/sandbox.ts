/**
 * Main Sandbox class — creates isolated execution environments
 * using Node.js vm module and worker_threads.
 *
 * Zero runtime dependencies.
 */

import { Worker } from 'node:worker_threads';
import { createContext, Script } from 'node:vm';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { createFilesystemGuard } from './guards/filesystem-guard.js';
import { createNetworkGuard } from './guards/network-guard.js';
import { createProcessGuard } from './guards/process-guard.js';
import type {
  SandboxConfig,
  SandboxResult,
  Violation,
  ResourceUsage,
  WorkerRequest,
  WorkerResponse,
} from './types.js';

export class Sandbox {
  private config: SandboxConfig;
  private violations: Violation[] = [];
  private resourceUsage: ResourceUsage = {
    cpuMs: 0,
    memoryMB: 0,
    networkBytes: 0,
    filesAccessed: [],
  };
  private worker: Worker | null = null;
  private killed = false;

  constructor(config: SandboxConfig) {
    this.config = config;
  }

  /**
   * Run arbitrary code in the sandbox.
   */
  async run(code: string): Promise<SandboxResult> {
    if (this.killed) {
      throw new Error('Sandbox has been killed');
    }

    return this.executeInProcess(code);
  }

  /**
   * Run a file in the sandbox.
   */
  async runFile(filePath: string): Promise<SandboxResult> {
    const resolved = path.resolve(this.config.workingDir || process.cwd(), filePath);
    const code = fs.readFileSync(resolved, 'utf-8');
    return this.run(code);
  }

  /**
   * Run an agent function in the sandbox.
   * The function is serialized and executed in an isolated context.
   */
  async runAgent(agentFn: () => Promise<string>): Promise<SandboxResult> {
    const code = `(${agentFn.toString()})()`;
    return this.run(code);
  }

  /**
   * Get all violations that occurred during execution.
   */
  getViolations(): Violation[] {
    return [...this.violations];
  }

  /**
   * Get resource usage from the last execution.
   */
  getResourceUsage(): ResourceUsage {
    return { ...this.resourceUsage };
  }

  /**
   * Kill the sandbox, terminating any running worker.
   */
  kill(): void {
    this.killed = true;
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  // ── Private ─────────────────────────────────────────────────────────────

  /**
   * Execute code in-process using vm.createContext with guarded modules.
   * This is the primary execution mode — lightweight and fast.
   */
  private async executeInProcess(code: string): Promise<SandboxResult> {
    const startTime = Date.now();
    const policy = this.config.policy;
    const workingDir = this.config.workingDir || process.cwd();
    const timeout = this.config.timeout ?? policy.limits.timeout;
    const env = this.config.env ?? {};

    // Set up guards
    const fsGuard = createFilesystemGuard(policy.filesystem, policy.limits, workingDir);
    const netGuard = createNetworkGuard(policy.network);
    const procGuard = createProcessGuard(policy.process);

    let output = '';
    let exitCode = 0;
    const localViolations: Violation[] = [];

    // Captured console
    const makeLogger = (prefix?: string) => (...args: unknown[]) => {
      const parts = args.map(a => typeof a === 'string' ? a : JSON.stringify(a));
      const line = (prefix ? `[${prefix}] ` : '') + parts.join(' ') + '\n';
      output += line;
    };

    const capturedConsole = {
      log: makeLogger(),
      error: makeLogger('stderr'),
      warn: makeLogger('warn'),
      info: makeLogger(),
      debug: makeLogger(),
      trace: makeLogger('trace'),
      dir: makeLogger(),
      table: makeLogger(),
      time: () => {},
      timeEnd: () => {},
      timeLog: () => {},
      assert: (cond: unknown, ...args: unknown[]) => {
        if (!cond) makeLogger('assert')(...args);
      },
      clear: () => {},
      count: () => {},
      countReset: () => {},
      group: () => {},
      groupEnd: () => {},
      groupCollapsed: () => {},
    };

    // Guarded require
    const guardedRequire = (moduleName: string): unknown => {
      if (moduleName === 'fs' || moduleName === 'node:fs') {
        return fsGuard.guardedFs;
      }
      if (moduleName === 'path' || moduleName === 'node:path') {
        return path;
      }
      if (moduleName === 'child_process' || moduleName === 'node:child_process') {
        return this.createGuardedChildProcess(procGuard);
      }
      // Block all network and dangerous modules in sandbox
      const blocked = [
        'http', 'https', 'net', 'tls', 'dgram', 'dns',
        'cluster', 'worker_threads',
        'node:http', 'node:https', 'node:net', 'node:tls',
        'node:dgram', 'node:dns', 'node:cluster', 'node:worker_threads',
      ];
      if (blocked.includes(moduleName)) {
        localViolations.push({
          type: 'network',
          rule: `blocked module "${moduleName}"`,
          details: `Module "${moduleName}" is not available in the sandbox`,
          timestamp: Date.now(),
        });
        throw new Error(`SANDBOX: module "${moduleName}" is not available`);
      }
      // Allow safe built-ins
      const safe = [
        'util', 'events', 'stream', 'string_decoder', 'querystring',
        'url', 'buffer', 'crypto', 'assert', 'timers', 'os',
      ];
      const baseName = moduleName.replace('node:', '');
      if (safe.includes(baseName)) {
        return require(moduleName);
      }
      throw new Error(`SANDBOX: module "${moduleName}" is not available`);
    };

    // Build vm context
    const context = createContext({
      console: capturedConsole,
      require: guardedRequire,
      module: { exports: {} },
      exports: {},
      process: {
        env: { ...env },
        cwd: () => workingDir,
        exit: (code?: number) => { throw new SandboxExit(code ?? 0); },
        version: process.version,
        versions: process.versions,
        platform: process.platform,
        arch: process.arch,
        hrtime: process.hrtime.bind(process),
        stdout: { write: (d: string) => { output += d; return true; } },
        stderr: { write: (d: string) => { output += `[stderr] ${d}`; return true; } },
      },
      Buffer,
      setTimeout: globalThis.setTimeout,
      setInterval: globalThis.setInterval,
      setImmediate: globalThis.setImmediate,
      clearTimeout: globalThis.clearTimeout,
      clearInterval: globalThis.clearInterval,
      clearImmediate: globalThis.clearImmediate,
      Promise,
      URL,
      URLSearchParams,
      TextEncoder,
      TextDecoder,
      JSON,
      Math,
      Date,
      RegExp,
      Map,
      Set,
      WeakMap,
      WeakSet,
      Symbol,
      Error,
      TypeError,
      RangeError,
      Array,
      Object,
      Number,
      String,
      Boolean,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURIComponent,
      decodeURIComponent,
      encodeURI,
      decodeURI,
      atob: globalThis.atob,
      btoa: globalThis.btoa,
      __filename: path.join(workingDir, 'sandbox.js'),
      __dirname: workingDir,
    });

    try {
      const script = new Script(code, {
        filename: 'sandbox.js',
        timeout,
      });

      const result = script.runInContext(context, { timeout });

      // If result is a promise, await with timeout
      if (result && typeof result === 'object' && typeof (result as any).then === 'function') {
        const timeoutPromise = new Promise<never>((_, reject) => {
          const t = setTimeout(() => {
            reject(new Error('SANDBOX: execution timed out'));
          }, timeout);
          // Don't let the timer keep the process alive
          if (typeof t === 'object' && 'unref' in t) t.unref();
        });
        await Promise.race([result, timeoutPromise]);
      }
    } catch (err) {
      if (err instanceof SandboxExit) {
        exitCode = err.code;
      } else {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('timed out') || message.includes('Script execution timed out')) {
          localViolations.push({
            type: 'timeout',
            rule: `timeout (${timeout}ms)`,
            details: `Execution timed out after ${timeout}ms`,
            timestamp: Date.now(),
          });
          exitCode = 124;
        } else {
          output += `\nError: ${message}\n`;
          exitCode = 1;
        }
      }
    }

    const duration = Date.now() - startTime;
    const memUsage = process.memoryUsage();

    // Collect all violations
    const allViolations = [
      ...localViolations,
      ...fsGuard.state.violations,
      ...netGuard.state.violations,
      ...procGuard.state.violations,
    ];

    this.violations = allViolations;
    this.resourceUsage = {
      cpuMs: duration,
      memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      networkBytes: netGuard.state.bytesTransferred,
      filesAccessed: Array.from(fsGuard.state.filesAccessed),
    };

    return {
      output,
      exitCode,
      violations: allViolations,
      resourceUsage: this.resourceUsage,
      duration,
    };
  }

  /**
   * Create a guarded child_process module that checks commands against policy.
   */
  private createGuardedChildProcess(guard: ReturnType<typeof createProcessGuard>) {
    const checkAndBlock = (command: string) => {
      guard.checkCommand(command);
      throw new Error(`SANDBOX: child_process execution is sandboxed`);
    };

    return {
      spawn: checkAndBlock,
      exec: (cmd: string, ...args: unknown[]) => {
        guard.checkCommand(cmd);
        const cb = args.find(a => typeof a === 'function') as Function | undefined;
        if (cb) {
          cb(new Error(`SANDBOX: child_process.exec is sandboxed`));
          return;
        }
        throw new Error(`SANDBOX: child_process.exec is sandboxed`);
      },
      execSync: checkAndBlock,
      execFile: checkAndBlock,
      spawnSync: checkAndBlock,
      fork: () => { throw new Error(`SANDBOX: child_process.fork is not available`); },
    };
  }
}

class SandboxExit {
  constructor(public code: number) {}
}
