/**
 * Worker thread entry point for sandbox execution.
 *
 * Receives code + policy via parentPort, executes in a guarded vm context,
 * and reports results back.
 */

import { parentPort, workerData } from 'node:worker_threads';
import { createContext, runInContext, Script } from 'node:vm';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createFilesystemGuard } from './guards/filesystem-guard.js';
import { createNetworkGuard, validateRequestOptions } from './guards/network-guard.js';
import { createProcessGuard } from './guards/process-guard.js';
import type { WorkerRequest, WorkerResponse, SandboxResult, Violation } from './types.js';

function sendMessage(msg: WorkerResponse): void {
  parentPort?.postMessage(msg);
}

function sendViolation(violation: Violation): void {
  sendMessage({ type: 'violation', violation });
}

function sendOutput(output: string): void {
  sendMessage({ type: 'output', output });
}

async function execute(request: WorkerRequest): Promise<void> {
  const { code, policy, env, workingDir, timeout } = request;
  const startTime = Date.now();
  const violations: Violation[] = [];
  let output = '';

  // Set up guards
  const fsGuard = createFilesystemGuard(policy.filesystem, policy.limits, workingDir);
  const netGuard = createNetworkGuard(policy.network);
  const procGuard = createProcessGuard(policy.process);

  // Capture console output
  const capturedConsole = {
    log: (...args: unknown[]) => {
      const line = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n';
      output += line;
      sendOutput(line);
    },
    error: (...args: unknown[]) => {
      const line = '[stderr] ' + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n';
      output += line;
      sendOutput(line);
    },
    warn: (...args: unknown[]) => {
      const line = '[warn] ' + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n';
      output += line;
      sendOutput(line);
    },
    info: (...args: unknown[]) => {
      capturedConsole.log(...args);
    },
    debug: (...args: unknown[]) => {
      capturedConsole.log(...args);
    },
  };

  // Create guarded require
  function guardedRequire(moduleName: string): unknown {
    if (moduleName === 'fs' || moduleName === 'node:fs') {
      return fsGuard.guardedFs;
    }
    if (moduleName === 'path' || moduleName === 'node:path') {
      return path;
    }
    if (moduleName === 'child_process' || moduleName === 'node:child_process') {
      return createGuardedChildProcess(procGuard);
    }
    if (moduleName === 'http' || moduleName === 'node:http' || moduleName === 'https' || moduleName === 'node:https') {
      return createGuardedHttp(moduleName, netGuard);
    }
    if (moduleName === 'net' || moduleName === 'node:net') {
      return createGuardedNet(netGuard);
    }
    // Block dangerous modules
    const blocked = ['child_process', 'cluster', 'dgram', 'dns', 'tls', 'worker_threads'];
    if (blocked.includes(moduleName) || blocked.includes(moduleName.replace('node:', ''))) {
      throw new Error(`SANDBOX: module "${moduleName}" is not available in the sandbox`);
    }
    // Allow safe built-ins
    const safe = ['util', 'events', 'stream', 'string_decoder', 'querystring', 'url', 'buffer', 'crypto', 'os', 'assert', 'timers'];
    const baseName = moduleName.replace('node:', '');
    if (safe.includes(baseName)) {
      return require(moduleName);
    }
    throw new Error(`SANDBOX: module "${moduleName}" is not available in the sandbox`);
  }

  // Build sandbox context
  const context = createContext({
    console: capturedConsole,
    require: guardedRequire,
    process: {
      env: { ...env },
      cwd: () => workingDir,
      exit: (code?: number) => {
        throw new SandboxExit(code ?? 0);
      },
      version: process.version,
      versions: process.versions,
      platform: process.platform,
      arch: process.arch,
      hrtime: process.hrtime,
      stdout: {
        write: (data: string) => { output += data; sendOutput(data); return true; },
      },
      stderr: {
        write: (data: string) => { output += '[stderr] ' + data; sendOutput(data); return true; },
      },
    },
    Buffer: Buffer,
    setTimeout: globalThis.setTimeout,
    setInterval: globalThis.setInterval,
    setImmediate: globalThis.setImmediate,
    clearTimeout: globalThis.clearTimeout,
    clearInterval: globalThis.clearInterval,
    clearImmediate: globalThis.clearImmediate,
    Promise: Promise,
    URL: URL,
    URLSearchParams: URLSearchParams,
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
    __filename: path.join(workingDir, 'sandbox.js'),
    __dirname: workingDir,
  });

  let exitCode = 0;

  try {
    const script = new Script(code, {
      filename: 'sandbox.js',
      timeout,
    });

    const result = script.runInContext(context, { timeout });

    // If result is a promise, await it with timeout
    if (result && typeof result === 'object' && typeof result.then === 'function') {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('SANDBOX: execution timed out'));
        }, timeout);
      });
      await Promise.race([result, timeoutPromise]);
    }
  } catch (err) {
    if (err instanceof SandboxExit) {
      exitCode = err.code;
    } else {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('timed out') || message.includes('Script execution timed out')) {
        violations.push({
          type: 'timeout',
          rule: `timeout (${timeout}ms)`,
          details: `Execution timed out after ${timeout}ms`,
          timestamp: Date.now(),
        });
        exitCode = 124; // Standard timeout exit code
      } else {
        output += `\nError: ${message}\n`;
        exitCode = 1;
      }
    }
  }

  // Collect all violations
  const allViolations = [
    ...violations,
    ...fsGuard.state.violations,
    ...netGuard.state.violations,
    ...procGuard.state.violations,
  ];

  // Report violations
  for (const v of allViolations) {
    sendViolation(v);
  }

  const duration = Date.now() - startTime;
  const memUsage = process.memoryUsage();

  const sandboxResult: SandboxResult = {
    output,
    exitCode,
    violations: allViolations,
    resourceUsage: {
      cpuMs: duration, // approximation in worker
      memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      networkBytes: netGuard.state.bytesTransferred,
      filesAccessed: Array.from(fsGuard.state.filesAccessed),
    },
    duration,
  };

  sendMessage({ type: 'result', result: sandboxResult });
}

// ── Helper classes ──────────────────────────────────────────────────────────

class SandboxExit {
  constructor(public code: number) {}
}

// ── Guarded module factories ────────────────────────────────────────────────

function createGuardedChildProcess(guard: ReturnType<typeof createProcessGuard>) {
  function blockedSpawn(command: string, ...args: unknown[]) {
    if (!guard.checkCommand(command)) {
      throw new Error(`SANDBOX: command "${command}" is not allowed`);
    }
    if (!guard.onProcessStart()) {
      throw new Error(`SANDBOX: max concurrent processes exceeded`);
    }
    throw new Error(`SANDBOX: child_process.spawn is not available in the sandbox`);
  }

  return {
    spawn: blockedSpawn,
    exec: (cmd: string, ...args: unknown[]) => {
      if (!guard.checkCommand(cmd)) {
        const lastArg = args[args.length - 1];
        if (typeof lastArg === 'function') {
          (lastArg as Function)(new Error(`SANDBOX: command "${cmd}" is not allowed`));
          return;
        }
        throw new Error(`SANDBOX: command "${cmd}" is not allowed`);
      }
      throw new Error(`SANDBOX: child_process.exec is not available in the sandbox`);
    },
    execSync: (cmd: string) => {
      if (!guard.checkCommand(cmd)) {
        throw new Error(`SANDBOX: command "${cmd}" is not allowed`);
      }
      throw new Error(`SANDBOX: child_process.execSync is not available in the sandbox`);
    },
    execFile: blockedSpawn,
    fork: () => { throw new Error(`SANDBOX: child_process.fork is not available`); },
    spawnSync: (cmd: string) => {
      if (!guard.checkCommand(cmd)) {
        throw new Error(`SANDBOX: command "${cmd}" is not allowed`);
      }
      throw new Error(`SANDBOX: child_process.spawnSync is not available in the sandbox`);
    },
  };
}

function createGuardedHttp(
  moduleName: string,
  guard: ReturnType<typeof createNetworkGuard>,
) {
  return {
    request: (options: Record<string, unknown>, callback?: Function) => {
      if (!validateRequestOptions(options as any, guard)) {
        throw new Error(`SANDBOX: network connection blocked by policy`);
      }
      throw new Error(`SANDBOX: direct HTTP requests are not available in the sandbox`);
    },
    get: (options: Record<string, unknown>, callback?: Function) => {
      if (!validateRequestOptions(options as any, guard)) {
        throw new Error(`SANDBOX: network connection blocked by policy`);
      }
      throw new Error(`SANDBOX: direct HTTP requests are not available in the sandbox`);
    },
    createServer: () => {
      throw new Error(`SANDBOX: creating servers is not allowed`);
    },
  };
}

function createGuardedNet(guard: ReturnType<typeof createNetworkGuard>) {
  return {
    connect: (options: { host?: string; port?: number } | number, ...args: unknown[]) => {
      const host = typeof options === 'object' ? (options.host || 'localhost') : 'localhost';
      const port = typeof options === 'number' ? options : (options.port || 0);
      if (!guard.checkConnection(host, port)) {
        throw new Error(`SANDBOX: connection to ${host}:${port} blocked by policy`);
      }
      throw new Error(`SANDBOX: net.connect is not available in the sandbox`);
    },
    createConnection: (...args: unknown[]) => {
      throw new Error(`SANDBOX: net.createConnection is not available in the sandbox`);
    },
    createServer: () => {
      throw new Error(`SANDBOX: creating servers is not allowed`);
    },
  };
}

// ── Entry point ─────────────────────────────────────────────────────────────

if (parentPort) {
  parentPort.on('message', (msg: WorkerRequest) => {
    if (msg.type === 'execute') {
      execute(msg).catch((err) => {
        sendMessage({
          type: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  });
}
