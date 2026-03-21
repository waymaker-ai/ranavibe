/**
 * Pre-built sandbox policies for common use cases.
 */

import type { SandboxPolicy } from '../types.js';

/**
 * Default base policy — moderate restrictions.
 * Other policies can extend this.
 */
export const defaultPolicy: SandboxPolicy = {
  name: 'default',
  filesystem: {
    allow: [
      { path: './workspace/**', permissions: ['read', 'write'] },
      { path: '/tmp/**', permissions: ['read', 'write'] },
    ],
    deny: [
      { path: '~/.ssh/**' },
      { path: '~/.env' },
      { path: '/etc/shadow' },
      { path: '/etc/passwd' },
    ],
  },
  network: {
    allow: [],
    deny: [],
  },
  process: {
    allow: ['node', 'npx'],
    deny: ['sudo', 'chmod', 'chown', 'rm -rf /'],
    maxConcurrent: 5,
  },
  limits: {
    timeout: 30_000,
    memoryMB: 512,
    maxFileSize: 10_485_760, // 10 MB
  },
};

/**
 * Restricted agent — only workspace + tmp filesystem, only LLM API domains,
 * no dangerous commands.
 */
export const restrictedAgent: SandboxPolicy = {
  name: 'restricted-agent',
  filesystem: {
    allow: [
      { path: './workspace/**', permissions: ['read', 'write'] },
      { path: '/tmp/**', permissions: ['read', 'write'] },
    ],
    deny: [
      { path: '~/.ssh/**' },
      { path: '~/.env' },
      { path: '~/.aws/**' },
      { path: '~/.config/**' },
      { path: '/etc/**' },
      { path: '/usr/**' },
      { path: '/var/**' },
    ],
  },
  network: {
    allow: [
      { domain: 'api.anthropic.com', ports: [443] },
      { domain: 'api.openai.com', ports: [443] },
    ],
    deny: [{ domain: '*' }],
  },
  process: {
    allow: ['node', 'npx', 'git'],
    deny: ['rm', 'sudo', 'chmod', 'chown', 'curl', 'wget', 'ssh', 'scp'],
    maxConcurrent: 3,
  },
  limits: {
    timeout: 30_000,
    memoryMB: 512,
    maxFileSize: 10_485_760,
  },
};

/**
 * Open agent — broad access but no system files, no sudo.
 */
export const openAgent: SandboxPolicy = {
  name: 'open-agent',
  filesystem: {
    allow: [
      { path: './**', permissions: ['read', 'write', 'execute'] },
      { path: '/tmp/**', permissions: ['read', 'write'] },
      { path: '~/**', permissions: ['read'] },
    ],
    deny: [
      { path: '~/.ssh/**' },
      { path: '~/.gnupg/**' },
      { path: '/etc/shadow' },
      { path: '/etc/sudoers' },
    ],
  },
  network: {
    allow: [{ domain: '*' }],
    deny: [],
  },
  process: {
    allow: ['node', 'npx', 'npm', 'git', 'python', 'python3', 'pip', 'cargo', 'go'],
    deny: ['sudo', 'su', 'chmod', 'chown'],
    maxConcurrent: 10,
  },
  limits: {
    timeout: 120_000,
    memoryMB: 1024,
    maxFileSize: 52_428_800, // 50 MB
  },
};

/**
 * CI runner — read-only source, write to output dirs, npm/git allowed.
 */
export const ciRunner: SandboxPolicy = {
  name: 'ci-runner',
  filesystem: {
    allow: [
      { path: './src/**', permissions: ['read'] },
      { path: './package.json', permissions: ['read'] },
      { path: './tsconfig.json', permissions: ['read'] },
      { path: './*.config.*', permissions: ['read'] },
      { path: './dist/**', permissions: ['read', 'write'] },
      { path: './output/**', permissions: ['read', 'write'] },
      { path: './coverage/**', permissions: ['read', 'write'] },
      { path: './node_modules/**', permissions: ['read'] },
      { path: '/tmp/**', permissions: ['read', 'write'] },
    ],
    deny: [
      { path: '~/.ssh/**' },
      { path: '~/.env' },
      { path: '/etc/**' },
    ],
  },
  network: {
    allow: [
      { domain: 'registry.npmjs.org', ports: [443] },
      { domain: '*.github.com', ports: [443] },
    ],
    deny: [],
  },
  process: {
    allow: ['node', 'npm', 'npx', 'git', 'tsc', 'vitest', 'jest'],
    deny: ['sudo', 'rm', 'chmod', 'curl', 'wget'],
    maxConcurrent: 5,
  },
  limits: {
    timeout: 300_000, // 5 minutes
    memoryMB: 1024,
    maxFileSize: 52_428_800,
  },
};

/**
 * Fully sandboxed — extremely restricted. No network, no filesystem outside /tmp.
 */
export const sandboxed: SandboxPolicy = {
  name: 'sandboxed',
  filesystem: {
    allow: [
      { path: '/tmp/**', permissions: ['read', 'write'] },
    ],
    deny: [
      { path: '/**' },
      { path: '~/**' },
      { path: './**' },
    ],
  },
  network: {
    allow: [],
    deny: [{ domain: '*' }],
  },
  process: {
    allow: ['node'],
    deny: ['*'],
    maxConcurrent: 1,
  },
  limits: {
    timeout: 10_000,
    memoryMB: 256,
    maxFileSize: 1_048_576, // 1 MB
  },
};

/** All preset policies keyed by name */
export const presets: Record<string, SandboxPolicy> = {
  default: defaultPolicy,
  'restricted-agent': restrictedAgent,
  'open-agent': openAgent,
  'ci-runner': ciRunner,
  sandboxed,
};
