import * as http from 'http';
import { TenantManager } from '../tenant-manager';

export interface RequestContext {
  tenantId?: string;
  permissions?: string[];
  body?: unknown;
  params: Record<string, string>;
  query: Record<string, string>;
}

/**
 * Parse the JSON body of a request
 */
export function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw || raw.trim() === '') {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send a JSON response
 */
export function sendJSON(
  res: http.ServerResponse,
  statusCode: number,
  data: unknown,
): void {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * Send an error response
 */
export function sendError(
  res: http.ServerResponse,
  statusCode: number,
  message: string,
): void {
  sendJSON(res, statusCode, { error: message });
}

/**
 * Apply CORS headers
 */
export function applyCORS(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  allowedOrigins: string[],
): boolean {
  const origin = req.headers.origin || '*';

  if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
}

/**
 * Authenticate request via API key header.
 * Returns the tenant context or null if authentication fails.
 */
export async function authenticateRequest(
  req: http.IncomingMessage,
  manager: TenantManager,
): Promise<{ tenantId: string; permissions: string[] } | null> {
  const apiKey =
    req.headers['x-api-key'] as string ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '');

  if (!apiKey) {
    return null;
  }

  const result = await manager.validateApiKey(apiKey);
  if (!result.valid || !result.tenantId) {
    return null;
  }

  return {
    tenantId: result.tenantId,
    permissions: result.permissions || [],
  };
}

/**
 * Check if the authenticated tenant has access to a specific resource.
 * Ensures tenant isolation.
 */
export function checkTenantAccess(
  ctx: RequestContext,
  resourceTenantId: string,
): boolean {
  return ctx.tenantId === resourceTenantId;
}

/**
 * Check if the request has a required permission
 */
export function hasPermission(
  ctx: RequestContext,
  required: string,
): boolean {
  if (!ctx.permissions) return false;
  return ctx.permissions.includes(required) || ctx.permissions.includes('admin');
}

/**
 * Simple in-memory rate limiter
 */
export class RateLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();

  /**
   * Check if a request is within rate limits
   * @returns true if allowed, false if rate limited
   */
  check(key: string, maxPerMinute: number): boolean {
    const now = Date.now();
    const window = this.windows.get(key);

    if (!window || now > window.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + 60000 });
      return true;
    }

    if (window.count >= maxPerMinute) {
      return false;
    }

    window.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  remaining(key: string, maxPerMinute: number): number {
    const now = Date.now();
    const window = this.windows.get(key);
    if (!window || now > window.resetAt) {
      return maxPerMinute;
    }
    return Math.max(0, maxPerMinute - window.count);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, window] of this.windows.entries()) {
      if (now > window.resetAt) {
        this.windows.delete(key);
      }
    }
  }
}

/**
 * Parse URL path parameters by matching against a pattern.
 * Pattern example: '/api/tenants/:id/projects'
 */
export function matchRoute(
  pattern: string,
  pathname: string,
): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

/**
 * Parse query string from URL
 */
export function parseQuery(url: string): Record<string, string> {
  const query: Record<string, string> = {};
  const questionMark = url.indexOf('?');
  if (questionMark === -1) return query;

  const qs = url.slice(questionMark + 1);
  const pairs = qs.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      query[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }
  return query;
}
