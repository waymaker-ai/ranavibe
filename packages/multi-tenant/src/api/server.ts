import * as http from 'http';
import { TenantManager } from '../tenant-manager';
import { TenantStorage } from '../storage/interface';
import { MemoryStorage } from '../storage/memory';
import { FileStorage } from '../storage/file';
import { ServerConfig } from '../types';
import {
  applyCORS,
  authenticateRequest,
  matchRoute,
  parseBody,
  parseQuery,
  RateLimiter,
  RequestContext,
  sendError,
  sendJSON,
} from './middleware';
import * as routes from './routes';

interface RouteDefinition {
  method: string;
  pattern: string;
  handler: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    ctx: RequestContext,
    manager: TenantManager,
  ) => Promise<void>;
  /** Whether this route requires authentication */
  requiresAuth: boolean;
}

const ROUTES: RouteDefinition[] = [
  { method: 'POST', pattern: '/api/tenants', handler: routes.createTenant, requiresAuth: false },
  { method: 'GET', pattern: '/api/tenants/:id', handler: routes.getTenant, requiresAuth: true },
  { method: 'POST', pattern: '/api/tenants/:id/projects', handler: routes.createProject, requiresAuth: true },
  { method: 'GET', pattern: '/api/tenants/:id/projects', handler: routes.listProjects, requiresAuth: true },
  { method: 'PUT', pattern: '/api/projects/:id/policies', handler: routes.assignPolicies, requiresAuth: true },
  { method: 'GET', pattern: '/api/projects/:id/policies', handler: routes.getProjectPolicies, requiresAuth: true },
  { method: 'POST', pattern: '/api/projects/:id/evaluate', handler: routes.evaluateContent, requiresAuth: true },
  { method: 'POST', pattern: '/api/keys', handler: routes.createApiKey, requiresAuth: true },
  { method: 'GET', pattern: '/api/usage/:tenantId', handler: routes.getUsageReport, requiresAuth: true },
];

/**
 * HTTP API server for multi-tenant policy management.
 * Built with Node.js http module (zero dependencies).
 */
export class APIServer {
  private server: http.Server | null = null;
  private manager: TenantManager;
  private config: ServerConfig;
  private rateLimiter: RateLimiter;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(storage: TenantStorage, config: ServerConfig) {
    this.manager = new TenantManager(storage);
    this.config = config;
    this.rateLimiter = new RateLimiter();
  }

  getManager(): TenantManager {
    return this.manager;
  }

  /**
   * Start the HTTP server
   */
  async start(options: { port: number; host?: string }): Promise<void> {
    const { port, host = '0.0.0.0' } = options;

    this.server = http.createServer(async (req, res) => {
      await this.handleRequest(req, res);
    });

    // Periodic cleanup of rate limiter
    this.cleanupInterval = setInterval(() => {
      this.rateLimiter.cleanup();
    }, 60000);

    return new Promise((resolve, reject) => {
      this.server!.on('error', reject);
      this.server!.listen(port, host, () => {
        resolve();
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    try {
      // Apply CORS
      const isPreflight = applyCORS(req, res, this.config.corsOrigins || ['*']);
      if (isPreflight) return;

      // Parse URL
      const url = req.url || '/';
      const pathname = url.split('?')[0];
      const method = req.method || 'GET';
      const query = parseQuery(url);

      // Health check endpoint
      if (pathname === '/health' && method === 'GET') {
        sendJSON(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
        return;
      }

      // Find matching route
      let matchedRoute: RouteDefinition | null = null;
      let params: Record<string, string> = {};

      for (const route of ROUTES) {
        if (route.method !== method) continue;
        const routeParams = matchRoute(route.pattern, pathname);
        if (routeParams !== null) {
          matchedRoute = route;
          params = routeParams;
          break;
        }
      }

      if (!matchedRoute) {
        sendError(res, 404, 'Not found');
        return;
      }

      // Authenticate if required
      let tenantId: string | undefined;
      let permissions: string[] | undefined;

      if (matchedRoute.requiresAuth) {
        const auth = await authenticateRequest(req, this.manager);
        if (!auth) {
          sendError(res, 401, 'Authentication required. Provide X-API-Key header.');
          return;
        }
        tenantId = auth.tenantId;
        permissions = auth.permissions;

        // Rate limiting
        const rateLimit = this.config.defaultRateLimit || 60;
        if (!this.rateLimiter.check(tenantId, rateLimit)) {
          const remaining = this.rateLimiter.remaining(tenantId, rateLimit);
          res.setHeader('X-RateLimit-Remaining', String(remaining));
          sendError(res, 429, 'Rate limit exceeded. Try again later.');
          return;
        }
        res.setHeader(
          'X-RateLimit-Remaining',
          String(this.rateLimiter.remaining(tenantId, rateLimit)),
        );
      }

      // Parse body for POST/PUT requests
      let body: unknown;
      if (method === 'POST' || method === 'PUT') {
        try {
          body = await parseBody(req);
        } catch (err) {
          sendError(res, 400, (err as Error).message);
          return;
        }
      }

      // Build request context
      const ctx: RequestContext = {
        tenantId,
        permissions,
        body,
        params,
        query,
      };

      // Execute route handler
      await matchedRoute.handler(req, res, ctx, this.manager);
    } catch (err) {
      sendError(res, 500, 'Internal server error');
    }
  }
}

/**
 * Create a storage instance from config
 */
export function createStorage(config: ServerConfig): TenantStorage {
  switch (config.storage) {
    case 'file':
      if (!config.dataDir) {
        throw new Error('dataDir is required for file storage');
      }
      return new FileStorage(config.dataDir);
    case 'memory':
    default:
      return new MemoryStorage();
  }
}
