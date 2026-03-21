/**
 * @cofounder/sandbox
 *
 * Lightweight Node.js agent execution sandbox.
 * Zero runtime dependencies. Uses vm module and worker_threads.
 *
 * @packageDocumentation
 */

// Core
export { Sandbox } from './sandbox.js';

// Types
export type {
  SandboxPolicy,
  SandboxConfig,
  SandboxResult,
  Violation,
  ViolationType,
  ResourceUsage,
  FilesystemRule,
  FilesystemDenyRule,
  FilesystemPolicy,
  FilesystemPermission,
  NetworkRule,
  NetworkPolicy,
  NetworkProtocol,
  ProcessRule,
  Limits,
  WorkerRequest,
  WorkerResponse,
} from './types.js';

// Policies
export {
  parsePolicy,
  validatePolicy,
  registerPolicy,
} from './policies/parser.js';

export {
  defaultPolicy,
  restrictedAgent,
  openAgent,
  ciRunner,
  sandboxed,
  presets,
} from './policies/presets.js';

// Guards (for advanced usage / custom sandboxes)
export { createFilesystemGuard } from './guards/filesystem-guard.js';
export { createNetworkGuard, validateRequestOptions } from './guards/network-guard.js';
export { createProcessGuard } from './guards/process-guard.js';
