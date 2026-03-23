import { describe, it, expect, vi } from 'vitest';
import {
  ToolAuthorizer,
  createToolAuthorizer,
  globToRegex,
  matchesPattern,
} from '../index';
import type { ToolCall, AuthContext, RoleDefinition, ToolAuthConfig } from '../types';

// ---------------------------------------------------------------------------
// Glob pattern matching tests
// ---------------------------------------------------------------------------

describe('globToRegex', () => {
  it('should match exact strings', () => {
    expect(globToRegex('file.read').test('file.read')).toBe(true);
    expect(globToRegex('file.read').test('file.write')).toBe(false);
  });

  it('should match wildcard (*) within segment', () => {
    expect(matchesPattern('file.read', 'file.*')).toBe(true);
    expect(matchesPattern('file.write', 'file.*')).toBe(true);
    expect(matchesPattern('http.get', 'file.*')).toBe(false);
  });

  it('should match double wildcard (**) across segments', () => {
    expect(matchesPattern('a.b.c', 'a.**')).toBe(true);
    expect(matchesPattern('a.b', 'a.**')).toBe(true);
  });

  it('should match single character wildcard (?)', () => {
    expect(matchesPattern('file.a', 'file.?')).toBe(true);
    expect(matchesPattern('file.ab', 'file.?')).toBe(false);
  });

  it('should escape special regex characters', () => {
    expect(matchesPattern('file.read', 'file.read')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ToolAuthorizer - basic allow/deny
// ---------------------------------------------------------------------------

describe('ToolAuthorizer', () => {
  describe('allowlist/denylist', () => {
    it('should allow tools on the allowlist', () => {
      const auth = new ToolAuthorizer({
        allowedTools: ['file.read', 'search.*'],
      });
      const result = auth.authorize({ tool: 'file.read', arguments: {} });
      expect(result.authorized).toBe(true);
    });

    it('should deny tools not on the allowlist', () => {
      const auth = new ToolAuthorizer({
        allowedTools: ['file.read'],
      });
      const result = auth.authorize({ tool: 'file.write', arguments: {} });
      expect(result.authorized).toBe(false);
    });

    it('should deny tools on the denylist', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        deniedTools: ['exec.*'],
      });
      const result = auth.authorize({ tool: 'exec.shell', arguments: {} });
      expect(result.authorized).toBe(false);
    });

    it('should prioritize denylist over allowlist', () => {
      const auth = new ToolAuthorizer({
        allowedTools: ['file.*'],
        deniedTools: ['file.delete'],
      });
      const result = auth.authorize({ tool: 'file.delete', arguments: {} });
      expect(result.authorized).toBe(false);
    });

    it('should allow adding tools dynamically', () => {
      const auth = new ToolAuthorizer({
        allowedTools: ['file.read'],
      });
      auth.allow('file.write');
      expect(auth.authorize({ tool: 'file.write', arguments: {} }).authorized).toBe(true);
    });

    it('should allow denying tools dynamically', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
      });
      auth.deny('exec.*');
      expect(auth.authorize({ tool: 'exec.shell', arguments: {} }).authorized).toBe(false);
    });

    it('should support glob patterns in allowlist', () => {
      const auth = new ToolAuthorizer({
        allowedTools: ['search.*', 'file.read'],
      });
      expect(auth.authorize({ tool: 'search.web', arguments: {} }).authorized).toBe(true);
      expect(auth.authorize({ tool: 'search.files', arguments: {} }).authorized).toBe(true);
      expect(auth.authorize({ tool: 'exec.cmd', arguments: {} }).authorized).toBe(false);
    });

    it('should allow array input to allow()', () => {
      const auth = new ToolAuthorizer();
      auth.allow(['file.read', 'file.write']);
      expect(auth.authorize({ tool: 'file.read', arguments: {} }).authorized).toBe(true);
      expect(auth.authorize({ tool: 'file.write', arguments: {} }).authorized).toBe(true);
    });

    it('should allow array input to deny()', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      auth.deny(['exec.*', 'shell.*']);
      expect(auth.authorize({ tool: 'exec.cmd', arguments: {} }).authorized).toBe(false);
      expect(auth.authorize({ tool: 'shell.bash', arguments: {} }).authorized).toBe(false);
    });
  });

  describe('default policy', () => {
    it('should deny by default when policy is deny', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'deny' });
      expect(auth.authorize({ tool: 'anything', arguments: {} }).authorized).toBe(false);
    });

    it('should allow by default when policy is allow', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      expect(auth.authorize({ tool: 'anything', arguments: {} }).authorized).toBe(true);
    });
  });

  describe('role-based access', () => {
    const roles: RoleDefinition[] = [
      {
        name: 'admin',
        allowedTools: ['**'],
      },
      {
        name: 'user',
        allowedTools: ['search.*', 'file.read'],
        deniedTools: ['exec.*'],
      },
      {
        name: 'viewer',
        allowedTools: ['search.*'],
      },
    ];

    it('should allow admin to access any tool', () => {
      const auth = new ToolAuthorizer({ roles });
      const result = auth.authorize(
        { tool: 'exec.shell', arguments: {} },
        { roles: ['admin'] }
      );
      expect(result.authorized).toBe(true);
    });

    it('should restrict user to allowed tools', () => {
      const auth = new ToolAuthorizer({ roles });
      expect(
        auth.authorize({ tool: 'search.web', arguments: {} }, { roles: ['user'] }).authorized
      ).toBe(true);
      expect(
        auth.authorize({ tool: 'file.read', arguments: {} }, { roles: ['user'] }).authorized
      ).toBe(true);
    });

    it('should deny user from denied tools', () => {
      const auth = new ToolAuthorizer({ roles });
      expect(
        auth.authorize({ tool: 'exec.shell', arguments: {} }, { roles: ['user'] }).authorized
      ).toBe(false);
    });

    it('should deny viewer from non-allowed tools', () => {
      const auth = new ToolAuthorizer({ roles });
      expect(
        auth.authorize({ tool: 'file.read', arguments: {} }, { roles: ['viewer'] }).authorized
      ).toBe(false);
    });

    it('should support adding roles dynamically', () => {
      const auth = new ToolAuthorizer();
      auth.addRole({ name: 'editor', allowedTools: ['file.*'] });
      expect(
        auth.authorize({ tool: 'file.write', arguments: {} }, { roles: ['editor'] }).authorized
      ).toBe(true);
    });

    it('should support removing roles', () => {
      const auth = new ToolAuthorizer({ roles });
      auth.removeRole('admin');
      // admin role no longer exists, so no role matches
      const result = auth.authorize(
        { tool: 'exec.shell', arguments: {} },
        { roles: ['admin'] }
      );
      expect(result.authorized).toBe(false);
    });
  });

  describe('rate limiting', () => {
    it('should allow calls within rate limit', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        rateLimits: [{ tool: 'search.*', maxCalls: 3, windowMs: 10000 }],
      });

      expect(auth.authorize({ tool: 'search.web', arguments: {} }).authorized).toBe(true);
      expect(auth.authorize({ tool: 'search.web', arguments: {} }).authorized).toBe(true);
      expect(auth.authorize({ tool: 'search.web', arguments: {} }).authorized).toBe(true);
    });

    it('should deny calls exceeding rate limit', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        rateLimits: [{ tool: 'search.*', maxCalls: 2, windowMs: 10000 }],
      });

      auth.authorize({ tool: 'search.web', arguments: {} });
      auth.authorize({ tool: 'search.web', arguments: {} });
      const result = auth.authorize({ tool: 'search.web', arguments: {} });
      expect(result.authorized).toBe(false);
      expect(result.rateLimited).toBe(true);
    });

    it('should check rate limit without recording', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        rateLimits: [{ tool: 'api.*', maxCalls: 1, windowMs: 10000 }],
      });

      expect(auth.checkRateLimit('api.call')).toBe(true);
      auth.authorize({ tool: 'api.call', arguments: {} });
      expect(auth.checkRateLimit('api.call')).toBe(false);
    });

    it('should reset rate limits', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        rateLimits: [{ tool: 'api.*', maxCalls: 1, windowMs: 10000 }],
      });

      auth.authorize({ tool: 'api.call', arguments: {} });
      expect(auth.authorize({ tool: 'api.call', arguments: {} }).rateLimited).toBe(true);

      auth.resetRateLimits();
      expect(auth.authorize({ tool: 'api.call', arguments: {} }).authorized).toBe(true);
    });

    it('should add rate limit rules dynamically', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      auth.addRateLimit({ tool: 'test.*', maxCalls: 1, windowMs: 10000 });

      auth.authorize({ tool: 'test.a', arguments: {} });
      expect(auth.authorize({ tool: 'test.a', arguments: {} }).rateLimited).toBe(true);
    });

    it('should report remaining quota', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        rateLimits: [{ tool: 'api.*', maxCalls: 3, windowMs: 10000 }],
      });

      const r1 = auth.authorize({ tool: 'api.call', arguments: {} });
      expect(r1.remainingQuota).toBe(2);

      const r2 = auth.authorize({ tool: 'api.call', arguments: {} });
      expect(r2.remainingQuota).toBe(1);
    });
  });

  describe('argument validation', () => {
    it('should validate argument patterns', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        argumentRules: [{
          tool: 'file.*',
          argument: 'path',
          validation: { type: 'pattern', regex: '^/safe/', message: 'Path must start with /safe/' },
        }],
      });

      expect(
        auth.authorize({ tool: 'file.read', arguments: { path: '/safe/data.txt' } }).authorized
      ).toBe(true);

      const denied = auth.authorize({ tool: 'file.read', arguments: { path: '/etc/passwd' } });
      expect(denied.authorized).toBe(false);
      expect(denied.argumentErrors?.length).toBe(1);
    });

    it('should validate path prefixes', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        argumentRules: [{
          tool: 'file.*',
          argument: 'path',
          validation: { type: 'pathPrefix', prefixes: ['/safe/', '/tmp/'] },
        }],
      });

      expect(
        auth.authorize({ tool: 'file.read', arguments: { path: '/safe/data.txt' } }).authorized
      ).toBe(true);
      expect(
        auth.authorize({ tool: 'file.read', arguments: { path: '/tmp/cache.json' } }).authorized
      ).toBe(true);
      expect(
        auth.authorize({ tool: 'file.read', arguments: { path: '/etc/passwd' } }).authorized
      ).toBe(false);
    });

    it('should validate allowed values', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        argumentRules: [{
          tool: 'db.*',
          argument: 'table',
          validation: { type: 'allowedValues', values: ['users', 'posts', 'comments'] },
        }],
      });

      expect(
        auth.authorize({ tool: 'db.query', arguments: { table: 'users' } }).authorized
      ).toBe(true);
      expect(
        auth.authorize({ tool: 'db.query', arguments: { table: 'secrets' } }).authorized
      ).toBe(false);
    });

    it('should validate max length', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        argumentRules: [{
          tool: 'search.*',
          argument: 'query',
          validation: { type: 'maxLength', max: 100 },
        }],
      });

      expect(
        auth.authorize({ tool: 'search.web', arguments: { query: 'short query' } }).authorized
      ).toBe(true);
      expect(
        auth.authorize({ tool: 'search.web', arguments: { query: 'a'.repeat(101) } }).authorized
      ).toBe(false);
    });

    it('should validate numeric ranges', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        argumentRules: [{
          tool: 'api.*',
          argument: 'limit',
          validation: { type: 'range', min: 1, max: 100 },
        }],
      });

      expect(
        auth.authorize({ tool: 'api.list', arguments: { limit: 50 } }).authorized
      ).toBe(true);
      expect(
        auth.authorize({ tool: 'api.list', arguments: { limit: 200 } }).authorized
      ).toBe(false);
      expect(
        auth.authorize({ tool: 'api.list', arguments: { limit: 0 } }).authorized
      ).toBe(false);
    });

    it('should validate with custom function', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        argumentRules: [{
          tool: 'custom.*',
          argument: 'data',
          validation: {
            type: 'custom',
            validate: (v) => typeof v === 'string' && v.length > 0,
            message: 'Data must be a non-empty string',
          },
        }],
      });

      expect(
        auth.authorize({ tool: 'custom.process', arguments: { data: 'hello' } }).authorized
      ).toBe(true);
      expect(
        auth.authorize({ tool: 'custom.process', arguments: { data: '' } }).authorized
      ).toBe(false);
    });

    it('should add argument rules dynamically', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      auth.addArgumentRule({
        tool: 'test.*',
        argument: 'x',
        validation: { type: 'range', min: 0, max: 10 },
      });

      expect(
        auth.authorize({ tool: 'test.a', arguments: { x: 5 } }).authorized
      ).toBe(true);
      expect(
        auth.authorize({ tool: 'test.a', arguments: { x: 20 } }).authorized
      ).toBe(false);
    });

    it('should skip validation for absent arguments', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        argumentRules: [{
          tool: 'file.*',
          argument: 'path',
          validation: { type: 'pathPrefix', prefixes: ['/safe/'] },
        }],
      });

      // No path argument provided — should still pass
      expect(
        auth.authorize({ tool: 'file.list', arguments: {} }).authorized
      ).toBe(true);
    });
  });

  describe('dangerous tool detection', () => {
    it('should detect dangerous tools', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      expect(auth.isDangerous('exec.shell')).toBe(true);
      expect(auth.isDangerous('file.write')).toBe(true);
      expect(auth.isDangerous('http.get')).toBe(true);
      expect(auth.isDangerous('search.web')).toBe(false);
    });

    it('should report dangerous flag in auth result', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      const result = auth.authorize({ tool: 'exec.shell', arguments: {} });
      expect(result.dangerous).toBe(true);
    });

    it('should detect custom dangerous patterns', () => {
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        dangerousPatterns: ['custom.danger*'],
      });
      expect(auth.isDangerous('custom.dangerous')).toBe(true);
      expect(auth.isDangerous('custom.safe')).toBe(false);
    });

    it('should disable dangerous detection when configured', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow', detectDangerous: false });
      expect(auth.isDangerous('exec.shell')).toBe(false);
    });

    it('should get dangerous category', () => {
      const auth = new ToolAuthorizer();
      expect(auth.getDangerousCategory('exec.shell')).toBe('code_execution');
      expect(auth.getDangerousCategory('file.write')).toBe('filesystem_write');
      expect(auth.getDangerousCategory('http.get')).toBe('network');
      expect(auth.getDangerousCategory('search.web')).toBeNull();
    });
  });

  describe('audit logging', () => {
    it('should record audit entries', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      auth.authorize({ tool: 'test.tool', arguments: {} });
      const log = auth.getAuditLog();
      expect(log.length).toBe(1);
      expect(log[0].toolCall.tool).toBe('test.tool');
      expect(log[0].result.authorized).toBe(true);
      expect(log[0].durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should include context in audit', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      const context: AuthContext = { userId: 'user-1', roles: ['admin'] };
      auth.authorize({ tool: 'test.tool', arguments: {} }, context);
      const log = auth.getAuditLog();
      expect(log[0].context?.userId).toBe('user-1');
    });

    it('should clear audit log', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      auth.authorize({ tool: 'test.tool', arguments: {} });
      auth.clearAuditLog();
      expect(auth.getAuditLog().length).toBe(0);
    });

    it('should respect max audit size', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow', maxAuditSize: 3 });
      for (let i = 0; i < 5; i++) {
        auth.authorize({ tool: `test.${i}`, arguments: {} });
      }
      expect(auth.getAuditLog().length).toBe(3);
    });

    it('should not log when audit is disabled', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow', enableAudit: false });
      auth.authorize({ tool: 'test.tool', arguments: {} });
      expect(auth.getAuditLog().length).toBe(0);
    });

    it('should call onDenied callback', () => {
      const onDenied = vi.fn();
      const auth = new ToolAuthorizer({
        defaultPolicy: 'deny',
        onDenied,
      });
      auth.authorize({ tool: 'test.tool', arguments: {} });
      expect(onDenied).toHaveBeenCalledOnce();
    });

    it('should call onRateLimited callback', () => {
      const onRateLimited = vi.fn();
      const auth = new ToolAuthorizer({
        defaultPolicy: 'allow',
        rateLimits: [{ tool: 'test.*', maxCalls: 1, windowMs: 10000 }],
        onRateLimited,
      });
      auth.authorize({ tool: 'test.a', arguments: {} });
      auth.authorize({ tool: 'test.a', arguments: {} });
      expect(onRateLimited).toHaveBeenCalledOnce();
    });
  });

  describe('statistics', () => {
    it('should compute stats', () => {
      const auth = new ToolAuthorizer({
        allowedTools: ['search.*'],
        deniedTools: ['exec.*'],
      });

      auth.authorize({ tool: 'search.web', arguments: {} });
      auth.authorize({ tool: 'search.files', arguments: {} });
      auth.authorize({ tool: 'exec.shell', arguments: {} });

      const stats = auth.getStats();
      expect(stats.totalCalls).toBe(3);
      expect(stats.authorizedCalls).toBe(2);
      expect(stats.deniedCalls).toBe(1);
      expect(stats.callsByTool['search.web']).toBe(1);
      expect(stats.callsByTool['exec.shell']).toBe(1);
    });

    it('should track dangerous calls', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      auth.authorize({ tool: 'exec.shell', arguments: {} });
      auth.authorize({ tool: 'search.web', arguments: {} });

      const stats = auth.getStats();
      expect(stats.dangerousCallsAttempted).toBe(1);
    });
  });

  describe('factory function', () => {
    it('should create instance with createToolAuthorizer', () => {
      const auth = createToolAuthorizer({ defaultPolicy: 'allow' });
      expect(auth).toBeInstanceOf(ToolAuthorizer);
    });

    it('should work with no config', () => {
      const auth = createToolAuthorizer();
      expect(auth).toBeInstanceOf(ToolAuthorizer);
    });
  });

  describe('edge cases', () => {
    it('should handle empty tool name', () => {
      const auth = new ToolAuthorizer({ defaultPolicy: 'allow' });
      const result = auth.authorize({ tool: '', arguments: {} });
      expect(result).toBeDefined();
    });

    it('should handle tools with many segments', () => {
      const auth = new ToolAuthorizer({
        allowedTools: ['a.b.**'],
      });
      expect(
        auth.authorize({ tool: 'a.b.c.d.e', arguments: {} }).authorized
      ).toBe(true);
    });
  });
});
