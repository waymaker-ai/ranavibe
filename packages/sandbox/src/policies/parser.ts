/**
 * Policy parser — validates and resolves YAML-like policy objects.
 * Supports policy inheritance via `extends`.
 */

import type {
  SandboxPolicy,
  FilesystemPolicy,
  FilesystemRule,
  FilesystemDenyRule,
  FilesystemPermission,
  NetworkPolicy,
  NetworkRule,
  NetworkProtocol,
  ProcessRule,
  Limits,
} from '../types.js';

// ── Validation helpers ──────────────────────────────────────────────────────

const VALID_PERMISSIONS: FilesystemPermission[] = ['read', 'write', 'execute', 'none'];
const VALID_PROTOCOLS: NetworkProtocol[] = ['http', 'https', 'tcp', 'udp'];

function assertString(val: unknown, label: string): asserts val is string {
  if (typeof val !== 'string' || val.length === 0) {
    throw new Error(`Policy validation: "${label}" must be a non-empty string`);
  }
}

function assertNumber(val: unknown, label: string): asserts val is number {
  if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) {
    throw new Error(`Policy validation: "${label}" must be a non-negative number`);
  }
}

// ── Parse individual sections ───────────────────────────────────────────────

function parseFilesystemRule(raw: unknown, index: number): FilesystemRule {
  const r = raw as Record<string, unknown>;
  assertString(r?.path, `filesystem.allow[${index}].path`);
  const perms = r.permissions;
  if (!Array.isArray(perms) || perms.length === 0) {
    throw new Error(`Policy validation: filesystem.allow[${index}].permissions must be a non-empty array`);
  }
  for (const p of perms) {
    if (!VALID_PERMISSIONS.includes(p as FilesystemPermission)) {
      throw new Error(`Policy validation: invalid permission "${p}" in filesystem.allow[${index}]`);
    }
  }
  return { path: r.path as string, permissions: perms as FilesystemPermission[] };
}

function parseFilesystemDenyRule(raw: unknown, index: number): FilesystemDenyRule {
  const r = raw as Record<string, unknown>;
  assertString(r?.path, `filesystem.deny[${index}].path`);
  const result: FilesystemDenyRule = { path: r.path as string };
  if (r.permissions) {
    if (!Array.isArray(r.permissions)) {
      throw new Error(`Policy validation: filesystem.deny[${index}].permissions must be an array`);
    }
    result.permissions = r.permissions as FilesystemPermission[];
  }
  return result;
}

function parseFilesystem(raw: unknown): FilesystemPolicy {
  if (!raw || typeof raw !== 'object') {
    return { allow: [], deny: [] };
  }
  const obj = raw as Record<string, unknown>;
  const allow = Array.isArray(obj.allow)
    ? obj.allow.map((r, i) => parseFilesystemRule(r, i))
    : [];
  const deny = Array.isArray(obj.deny)
    ? obj.deny.map((r, i) => parseFilesystemDenyRule(r, i))
    : [];
  return { allow, deny };
}

function parseNetworkRule(raw: unknown, index: number, section: string): NetworkRule {
  const r = raw as Record<string, unknown>;
  assertString(r?.domain, `network.${section}[${index}].domain`);
  const rule: NetworkRule = { domain: r.domain as string };
  if (r.ports !== undefined) {
    if (!Array.isArray(r.ports)) {
      throw new Error(`Policy validation: network.${section}[${index}].ports must be an array`);
    }
    rule.ports = r.ports as number[];
  }
  if (r.protocols !== undefined) {
    if (!Array.isArray(r.protocols)) {
      throw new Error(`Policy validation: network.${section}[${index}].protocols must be an array`);
    }
    for (const p of r.protocols as string[]) {
      if (!VALID_PROTOCOLS.includes(p as NetworkProtocol)) {
        throw new Error(`Policy validation: invalid protocol "${p}" in network.${section}[${index}]`);
      }
    }
    rule.protocols = r.protocols as NetworkProtocol[];
  }
  return rule;
}

function parseNetwork(raw: unknown): NetworkPolicy {
  if (!raw || typeof raw !== 'object') {
    return { allow: [], deny: [] };
  }
  const obj = raw as Record<string, unknown>;
  const allow = Array.isArray(obj.allow)
    ? obj.allow.map((r, i) => parseNetworkRule(r, i, 'allow'))
    : [];
  const deny = Array.isArray(obj.deny)
    ? obj.deny.map((r, i) => parseNetworkRule(r, i, 'deny'))
    : [];
  return { allow, deny };
}

function parseProcess(raw: unknown): ProcessRule {
  if (!raw || typeof raw !== 'object') {
    return { allow: [], deny: [], maxConcurrent: 5 };
  }
  const obj = raw as Record<string, unknown>;
  return {
    allow: Array.isArray(obj.allow) ? (obj.allow as string[]) : [],
    deny: Array.isArray(obj.deny) ? (obj.deny as string[]) : [],
    maxConcurrent: typeof obj.maxConcurrent === 'number' ? obj.maxConcurrent : 5,
  };
}

function parseLimits(raw: unknown): Limits {
  if (!raw || typeof raw !== 'object') {
    return { timeout: 30_000, memoryMB: 512, maxFileSize: 10_485_760 };
  }
  const obj = raw as Record<string, unknown>;
  const timeout = typeof obj.timeout === 'number' ? obj.timeout : 30_000;
  const memoryMB = typeof obj.memoryMB === 'number' ? obj.memoryMB : 512;
  const maxFileSize = typeof obj.maxFileSize === 'number' ? obj.maxFileSize : 10_485_760;
  assertNumber(timeout, 'limits.timeout');
  assertNumber(memoryMB, 'limits.memoryMB');
  assertNumber(maxFileSize, 'limits.maxFileSize');
  return { timeout, memoryMB, maxFileSize };
}

// ── Deep merge for inheritance ──────────────────────────────────────────────

function mergeFilesystem(base: FilesystemPolicy, child: FilesystemPolicy): FilesystemPolicy {
  return {
    allow: [...base.allow, ...child.allow],
    deny: [...base.deny, ...child.deny],
  };
}

function mergeNetwork(base: NetworkPolicy, child: NetworkPolicy): NetworkPolicy {
  return {
    allow: [...base.allow, ...child.allow],
    deny: [...base.deny, ...child.deny],
  };
}

function mergeProcess(base: ProcessRule, child: ProcessRule): ProcessRule {
  return {
    allow: [...new Set([...base.allow, ...child.allow])],
    deny: [...new Set([...base.deny, ...child.deny])],
    maxConcurrent: child.maxConcurrent ?? base.maxConcurrent,
  };
}

function mergeLimits(base: Limits, child: Partial<Limits>): Limits {
  return {
    timeout: child.timeout ?? base.timeout,
    memoryMB: child.memoryMB ?? base.memoryMB,
    maxFileSize: child.maxFileSize ?? base.maxFileSize,
  };
}

function mergePolicies(base: SandboxPolicy, child: SandboxPolicy): SandboxPolicy {
  return {
    name: child.name,
    filesystem: mergeFilesystem(base.filesystem, child.filesystem),
    network: mergeNetwork(base.network, child.network),
    process: mergeProcess(base.process, child.process),
    limits: mergeLimits(base.limits, child.limits),
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Registry of named policies for inheritance resolution */
const policyRegistry = new Map<string, SandboxPolicy>();

/**
 * Register a policy so other policies can extend it.
 */
export function registerPolicy(policy: SandboxPolicy): void {
  policyRegistry.set(policy.name, policy);
}

/**
 * Parse and validate a raw policy object.
 * Resolves `extends` by looking up the parent in the registry.
 */
export function parsePolicy(raw: Record<string, unknown>): SandboxPolicy {
  assertString(raw.name, 'name');

  const parsed: SandboxPolicy = {
    name: raw.name as string,
    filesystem: parseFilesystem(raw.filesystem),
    network: parseNetwork(raw.network),
    process: parseProcess(raw.process),
    limits: parseLimits(raw.limits),
  };

  if (typeof raw.extends === 'string') {
    const parent = policyRegistry.get(raw.extends);
    if (!parent) {
      throw new Error(`Policy "${raw.name}" extends unknown policy "${raw.extends}"`);
    }
    return mergePolicies(parent, parsed);
  }

  return parsed;
}

/**
 * Validate an already-typed policy object.
 * Throws on invalid values.
 */
export function validatePolicy(policy: SandboxPolicy): void {
  assertString(policy.name, 'name');

  for (let i = 0; i < policy.filesystem.allow.length; i++) {
    const rule = policy.filesystem.allow[i];
    assertString(rule.path, `filesystem.allow[${i}].path`);
    for (const p of rule.permissions) {
      if (!VALID_PERMISSIONS.includes(p)) {
        throw new Error(`Invalid permission "${p}" in filesystem.allow[${i}]`);
      }
    }
  }

  for (let i = 0; i < policy.filesystem.deny.length; i++) {
    assertString(policy.filesystem.deny[i].path, `filesystem.deny[${i}].path`);
  }

  assertNumber(policy.limits.timeout, 'limits.timeout');
  assertNumber(policy.limits.memoryMB, 'limits.memoryMB');
  assertNumber(policy.limits.maxFileSize, 'limits.maxFileSize');
  assertNumber(policy.process.maxConcurrent, 'process.maxConcurrent');
}
