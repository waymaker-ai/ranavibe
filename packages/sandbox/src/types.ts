/**
 * @aicofounder/sandbox - Type definitions
 * Lightweight Node.js agent execution sandbox
 */

// ── Filesystem ──────────────────────────────────────────────────────────────

export type FilesystemPermission = 'read' | 'write' | 'execute' | 'none';

export interface FilesystemRule {
  /** Glob pattern for the path */
  path: string;
  /** Permissions granted for matching paths */
  permissions: FilesystemPermission[];
}

export interface FilesystemPolicy {
  allow: FilesystemRule[];
  deny: FilesystemDenyRule[];
}

export interface FilesystemDenyRule {
  /** Glob pattern for the path */
  path: string;
  /** Optional permissions to deny; if omitted, all are denied */
  permissions?: FilesystemPermission[];
}

// ── Network ─────────────────────────────────────────────────────────────────

export type NetworkProtocol = 'http' | 'https' | 'tcp' | 'udp';

export interface NetworkRule {
  /** Domain pattern (* for wildcard) */
  domain: string;
  /** Allowed ports (empty = all) */
  ports?: number[];
  /** Allowed protocols */
  protocols?: NetworkProtocol[];
}

export interface NetworkPolicy {
  allow: NetworkRule[];
  deny: NetworkRule[];
}

// ── Process ─────────────────────────────────────────────────────────────────

export interface ProcessRule {
  /** Commands explicitly allowed */
  allow: string[];
  /** Commands explicitly denied */
  deny: string[];
  /** Maximum concurrent child processes */
  maxConcurrent: number;
}

// ── Limits ──────────────────────────────────────────────────────────────────

export interface Limits {
  /** Execution timeout in milliseconds */
  timeout: number;
  /** Maximum memory in megabytes */
  memoryMB: number;
  /** Maximum individual file size in bytes */
  maxFileSize: number;
}

// ── Policy ──────────────────────────────────────────────────────────────────

export interface SandboxPolicy {
  /** Policy name */
  name: string;
  /** Optional parent policy to inherit from */
  extends?: string;
  /** Filesystem access rules */
  filesystem: FilesystemPolicy;
  /** Network access rules */
  network: NetworkPolicy;
  /** Process spawning rules */
  process: ProcessRule;
  /** Resource limits */
  limits: Limits;
}

// ── Config ──────────────────────────────────────────────────────────────────

export interface SandboxConfig {
  /** The policy to enforce */
  policy: SandboxPolicy;
  /** Entrypoint file (for runFile) */
  entrypoint?: string;
  /** Environment variables available inside the sandbox */
  env?: Record<string, string>;
  /** Working directory for the sandbox */
  workingDir?: string;
  /** Override timeout (takes precedence over policy.limits.timeout) */
  timeout?: number;
}

// ── Result ──────────────────────────────────────────────────────────────────

export type ViolationType =
  | 'filesystem'
  | 'network'
  | 'process'
  | 'timeout'
  | 'memory'
  | 'unknown';

export interface Violation {
  /** Category of the violation */
  type: ViolationType;
  /** The rule that was violated */
  rule: string;
  /** Human-readable description */
  details: string;
  /** When the violation occurred */
  timestamp: number;
}

export interface ResourceUsage {
  /** CPU time consumed in milliseconds */
  cpuMs: number;
  /** Peak memory usage in megabytes */
  memoryMB: number;
  /** Total network bytes transferred */
  networkBytes: number;
  /** List of file paths accessed */
  filesAccessed: string[];
}

export interface SandboxResult {
  /** Captured stdout/stderr output */
  output: string;
  /** Exit code (0 = success) */
  exitCode: number;
  /** Policy violations that occurred during execution */
  violations: Violation[];
  /** Resource usage metrics */
  resourceUsage: ResourceUsage;
  /** Wall-clock execution duration in milliseconds */
  duration: number;
}

// ── Worker Messages ─────────────────────────────────────────────────────────

export interface WorkerRequest {
  type: 'execute';
  code: string;
  policy: SandboxPolicy;
  env: Record<string, string>;
  workingDir: string;
  timeout: number;
}

export interface WorkerResponse {
  type: 'result' | 'violation' | 'output' | 'error';
  result?: SandboxResult;
  violation?: Violation;
  output?: string;
  error?: string;
}
