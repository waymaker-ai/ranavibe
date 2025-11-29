/**
 * Test Setup
 * Common utilities and mocks for CLI tests
 */

import { vi } from 'vitest';

// Mock console methods to capture output
export function mockConsole() {
  const logs: string[] = [];
  const errors: string[] = [];
  const warns: string[] = [];

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(' '));
  };

  console.error = (...args: unknown[]) => {
    errors.push(args.map(String).join(' '));
  };

  console.warn = (...args: unknown[]) => {
    warns.push(args.map(String).join(' '));
  };

  return {
    logs,
    errors,
    warns,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
}

// Mock file system for testing
export function mockFileSystem(files: Record<string, string>) {
  const fs = {
    existsSync: vi.fn((path: string) => path in files),
    readFileSync: vi.fn((path: string) => {
      if (path in files) return files[path];
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }),
    writeFileSync: vi.fn((path: string, content: string) => {
      files[path] = content;
    }),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(() => Object.keys(files)),
    statSync: vi.fn(() => ({
      isDirectory: () => false,
      isFile: () => true,
      size: 1024,
      mtime: new Date(),
    })),
  };

  return fs;
}

// Mock HTTP responses
export function mockFetch(responses: Record<string, { status: number; body: unknown }>) {
  return vi.fn(async (url: string) => {
    const response = responses[url] || { status: 404, body: { error: 'Not found' } };
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.body,
      text: async () => JSON.stringify(response.body),
    };
  });
}

// Mock Commander types
interface MockSubCommand {
  description: ReturnType<typeof vi.fn>;
  option: ReturnType<typeof vi.fn>;
  argument: ReturnType<typeof vi.fn>;
  action: ReturnType<typeof vi.fn>;
}

interface MockProgram {
  name: ReturnType<typeof vi.fn>;
  description: ReturnType<typeof vi.fn>;
  version: ReturnType<typeof vi.fn>;
  option: ReturnType<typeof vi.fn>;
  argument: ReturnType<typeof vi.fn>;
  action: ReturnType<typeof vi.fn>;
  command: ReturnType<typeof vi.fn>;
  parse: ReturnType<typeof vi.fn>;
  opts: ReturnType<typeof vi.fn>;
  executeAction: (name: string, ...args: unknown[]) => Promise<unknown>;
}

// Create mock Commander program
export function createMockProgram(): MockProgram {
  const actions: Record<string, (...args: unknown[]) => unknown> = {};

  const program: MockProgram = {
    name: vi.fn(() => program),
    description: vi.fn(() => program),
    version: vi.fn(() => program),
    option: vi.fn(() => program),
    argument: vi.fn(() => program),
    action: vi.fn((fn: (...args: unknown[]) => unknown) => {
      actions['default'] = fn;
      return program;
    }),
    command: vi.fn((name: string): MockSubCommand => {
      const subCommand: MockSubCommand = {
        description: vi.fn(() => subCommand),
        option: vi.fn(() => subCommand),
        argument: vi.fn(() => subCommand),
        action: vi.fn((fn: (...args: unknown[]) => unknown) => {
          actions[name] = fn;
          return subCommand;
        }),
      };
      return subCommand;
    }),
    parse: vi.fn(),
    opts: vi.fn(() => ({})),
    executeAction: async (name: string, ...args: unknown[]): Promise<unknown> => {
      if (actions[name]) {
        return actions[name](...args);
      }
      throw new Error(`No action registered for ${name}`);
    },
  };

  return program;
}

// Wait helper
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean ANSI codes from string
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
}
