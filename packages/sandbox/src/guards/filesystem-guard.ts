/**
 * Filesystem guard — intercepts fs operations and enforces policy rules.
 * Uses a proxy approach: wraps Node's `fs` methods with policy checks.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  FilesystemPolicy,
  FilesystemPermission,
  Violation,
  Limits,
} from '../types.js';

/**
 * Simple glob matcher supporting *, **, and ? patterns.
 * Zero dependencies — no micromatch needed.
 */
function globMatch(pattern: string, target: string): boolean {
  // Normalize both
  const p = pattern.replace(/\\/g, '/');
  const t = target.replace(/\\/g, '/');

  // Convert glob to regex
  let regex = '^';
  let i = 0;
  while (i < p.length) {
    const c = p[i];
    if (c === '*') {
      if (p[i + 1] === '*') {
        // ** matches everything including /
        regex += '.*';
        i += 2;
        if (p[i] === '/') i++; // skip trailing slash after **
        continue;
      }
      // * matches everything except /
      regex += '[^/]*';
    } else if (c === '?') {
      regex += '[^/]';
    } else if (c === '.') {
      regex += '\\.';
    } else if (c === '(') {
      regex += '\\(';
    } else if (c === ')') {
      regex += '\\)';
    } else if (c === '{') {
      regex += '(';
    } else if (c === '}') {
      regex += ')';
    } else if (c === ',') {
      regex += '|';
    } else {
      regex += c;
    }
    i++;
  }
  regex += '$';

  return new RegExp(regex).test(t);
}

/** Expand ~ to home directory */
function expandPath(p: string, workingDir: string): string {
  if (p.startsWith('~/') || p === '~') {
    const home = process.env.HOME || process.env.USERPROFILE || '/home/user';
    return path.join(home, p.slice(2));
  }
  if (p.startsWith('./') || p === '.') {
    return path.resolve(workingDir, p);
  }
  return path.resolve(workingDir, p);
}

/** Map fs method names to required permission */
const METHOD_PERMISSIONS: Record<string, FilesystemPermission> = {
  readFile: 'read',
  readFileSync: 'read',
  readdir: 'read',
  readdirSync: 'read',
  stat: 'read',
  statSync: 'read',
  lstat: 'read',
  lstatSync: 'read',
  access: 'read',
  accessSync: 'read',
  exists: 'read',
  existsSync: 'read',
  createReadStream: 'read',
  realpath: 'read',
  realpathSync: 'read',
  writeFile: 'write',
  writeFileSync: 'write',
  appendFile: 'write',
  appendFileSync: 'write',
  mkdir: 'write',
  mkdirSync: 'write',
  rmdir: 'write',
  rmdirSync: 'write',
  rm: 'write',
  rmSync: 'write',
  unlink: 'write',
  unlinkSync: 'write',
  rename: 'write',
  renameSync: 'write',
  copyFile: 'write',
  copyFileSync: 'write',
  createWriteStream: 'write',
  chmod: 'execute',
  chmodSync: 'execute',
  chown: 'execute',
  chownSync: 'execute',
};

export interface FilesystemGuardState {
  violations: Violation[];
  filesAccessed: Set<string>;
}

export function createFilesystemGuard(
  policy: FilesystemPolicy,
  limits: Limits,
  workingDir: string,
): { guardedFs: typeof fs; state: FilesystemGuardState } {
  const state: FilesystemGuardState = {
    violations: [],
    filesAccessed: new Set(),
  };

  function checkAccess(filePath: string, permission: FilesystemPermission): boolean {
    const resolved = path.resolve(workingDir, filePath);
    state.filesAccessed.add(resolved);

    // Check deny rules first (deny takes precedence)
    for (const rule of policy.deny) {
      const expandedPattern = expandPath(rule.path, workingDir);
      if (globMatch(expandedPattern, resolved)) {
        // If deny rule specifies permissions, only deny those
        if (rule.permissions && !rule.permissions.includes(permission)) {
          continue;
        }
        return false;
      }
    }

    // Check allow rules
    for (const rule of policy.allow) {
      const expandedPattern = expandPath(rule.path, workingDir);
      if (globMatch(expandedPattern, resolved) && rule.permissions.includes(permission)) {
        return true;
      }
    }

    // Default: deny
    return false;
  }

  function recordViolation(filePath: string, permission: FilesystemPermission, method: string): void {
    state.violations.push({
      type: 'filesystem',
      rule: `${permission} access to ${filePath}`,
      details: `Blocked ${method}() — "${permission}" not allowed for path "${filePath}"`,
      timestamp: Date.now(),
    });
  }

  function checkFileSize(filePath: string, data: unknown): boolean {
    let size = 0;
    if (Buffer.isBuffer(data)) {
      size = data.length;
    } else if (typeof data === 'string') {
      size = Buffer.byteLength(data, 'utf8');
    }
    if (size > limits.maxFileSize) {
      state.violations.push({
        type: 'filesystem',
        rule: `maxFileSize (${limits.maxFileSize})`,
        details: `Write to "${filePath}" blocked — data size ${size} exceeds limit ${limits.maxFileSize}`,
        timestamp: Date.now(),
      });
      return false;
    }
    return true;
  }

  // Create a proxy around fs
  const handler: ProxyHandler<typeof fs> = {
    get(target, prop: string) {
      const permission = METHOD_PERMISSIONS[prop];
      if (!permission) {
        // Non-file methods (constants, etc.) pass through
        return Reflect.get(target, prop);
      }

      const original = Reflect.get(target, prop);
      if (typeof original !== 'function') {
        return original;
      }

      return function guardedMethod(this: unknown, ...args: unknown[]) {
        const filePath = typeof args[0] === 'string' ? args[0] : String(args[0]);

        if (!checkAccess(filePath, permission)) {
          recordViolation(filePath, permission, prop);
          // For sync methods, throw; for async, call callback with error or return rejected promise
          const err = new Error(
            `SANDBOX: ${permission} access denied for "${filePath}"`,
          );
          (err as NodeJS.ErrnoException).code = 'EACCES';

          if (prop.endsWith('Sync')) {
            throw err;
          }

          // Check if last arg is a callback
          const lastArg = args[args.length - 1];
          if (typeof lastArg === 'function') {
            (lastArg as (err: Error) => void)(err);
            return;
          }

          // Promise-based
          return Promise.reject(err);
        }

        // Check file size on write operations
        if (permission === 'write' && (prop === 'writeFile' || prop === 'writeFileSync' || prop === 'appendFile' || prop === 'appendFileSync')) {
          if (!checkFileSize(filePath, args[1])) {
            const err = new Error(
              `SANDBOX: write to "${filePath}" exceeds max file size`,
            );
            (err as NodeJS.ErrnoException).code = 'EFBIG';
            if (prop.endsWith('Sync')) throw err;
            const lastArg = args[args.length - 1];
            if (typeof lastArg === 'function') {
              (lastArg as (err: Error) => void)(err);
              return;
            }
            return Promise.reject(err);
          }
        }

        return (original as Function).apply(target, args);
      };
    },
  };

  const guardedFs = new Proxy(fs, handler);
  return { guardedFs, state };
}
