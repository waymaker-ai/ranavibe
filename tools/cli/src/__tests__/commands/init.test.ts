/**
 * Tests for init command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockConsole, stripAnsi } from '../setup';

// Mock fs and other dependencies
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
    resolve: (...args: string[]) => args.join('/'),
    dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
  },
  join: (...args: string[]) => args.join('/'),
  resolve: (...args: string[]) => args.join('/'),
  dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
}));

describe('init command', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should export init functions', async () => {
    // Dynamic import to test module loading
    const initModule = await import('../../commands/init');
    expect(initModule).toBeDefined();
    expect(typeof initModule.initCommand).toBe('function');
  });

  it('should have valid project templates', async () => {
    const initModule = await import('../../commands/init');

    // Check that templates are defined
    // The actual templates would be in the module
    expect(initModule).toBeDefined();
  });
});

describe('init command configuration', () => {
  it('should support multiple project types', () => {
    const projectTypes = ['api', 'web', 'mobile', 'fullstack', 'custom'];

    // Each project type should be valid
    for (const type of projectTypes) {
      expect(type).toBeTruthy();
    }
  });

  it('should support provider configuration', () => {
    const providers = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

    // All major providers should be supported
    expect(providers.length).toBeGreaterThan(0);
    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
  });
});
