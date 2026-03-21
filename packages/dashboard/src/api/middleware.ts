/**
 * API Middleware - CORS, auth, rate limiting
 */

import type { IncomingMessage, ServerResponse } from 'node:http';

// ============================================================================
// CORS
// ============================================================================

export interface CorsOptions {
  origins?: string[];
  methods?: string[];
  headers?: string[];
}

export function corsMiddleware(options: CorsOptions = {}) {
  const allowedOrigins = options.origins ?? ['*'];
  const methods = options.methods ?? ['GET', 'POST', 'OPTIONS'];
  const headers = options.headers ?? ['Content-Type', 'Authorization', 'X-API-Key'];

  return (req: IncomingMessage, res: ServerResponse): boolean => {
    const origin = req.headers.origin ?? '*';
    const allowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);

    if (allowed) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : origin);
      res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', headers.join(', '));
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return true; // request handled
    }

    return false; // continue to next middleware
  };
}

// ============================================================================
// API Key Auth
// ============================================================================

export interface AuthOptions {
  apiKey: string;
}

export function authMiddleware(options: AuthOptions) {
  const { apiKey } = options;

  return (req: IncomingMessage, res: ServerResponse): boolean => {
    // Allow health checks without auth
    if (req.url === '/api/health') return false;

    const providedKey =
      req.headers['x-api-key'] as string ??
      req.headers.authorization?.replace('Bearer ', '') ??
      '';

    if (providedKey !== apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing API key' }));
      return true; // request handled (blocked)
    }

    return false; // continue
  };
}

// ============================================================================
// Rate Limiting (in-memory sliding window)
// ============================================================================

export interface RateLimitOptions {
  maxRequestsPerMinute: number;
}

interface RateLimitEntry {
  timestamps: number[];
}

export function rateLimitMiddleware(options: RateLimitOptions) {
  const { maxRequestsPerMinute } = options;
  const clients = new Map<string, RateLimitEntry>();
  const windowMs = 60_000;

  // Periodic cleanup every 5 minutes
  const cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, entry] of clients) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length === 0) {
        clients.delete(key);
      }
    }
  }, 300_000);

  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }

  return (req: IncomingMessage, res: ServerResponse): boolean => {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const cutoff = now - windowMs;

    let entry = clients.get(clientIp);
    if (!entry) {
      entry = { timestamps: [] };
      clients.set(clientIp, entry);
    }

    // Remove old timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    entry.timestamps.push(now);

    if (entry.timestamps.length > maxRequestsPerMinute) {
      const retryAfter = Math.ceil((entry.timestamps[0] + windowMs - now) / 1000);
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      });
      res.end(JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Max ${maxRequestsPerMinute} requests per minute.`,
        retryAfter,
      }));
      return true; // request handled (blocked)
    }

    return false; // continue
  };
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

export type Middleware = (req: IncomingMessage, res: ServerResponse) => boolean;
