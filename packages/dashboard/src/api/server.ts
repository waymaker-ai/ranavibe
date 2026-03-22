/**
 * HTTP API Server - Built on Node.js http module
 */

import * as http from 'node:http';
import type { Route } from './routes.js';
import type { Middleware } from './middleware.js';

export interface ServerOptions {
  port?: number;
  host?: string;
  routes: Route[];
  middlewares?: Middleware[];
}

export class DashboardServer {
  private server: http.Server | null = null;
  private readonly routes: Route[];
  private readonly middlewares: Middleware[];
  private readonly port: number;
  private readonly host: string;

  constructor(options: ServerOptions) {
    this.routes = options.routes;
    this.middlewares = options.middlewares ?? [];
    this.port = options.port ?? 3456;
    this.host = options.host ?? '0.0.0.0';
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<{ port: number; host: string }> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        try {
          await this.handleRequest(req, res);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Internal Server Error';
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error', message }));
          }
        }
      });

      this.server.on('error', reject);

      this.server.listen(this.port, this.host, () => {
        resolve({ port: this.port, host: this.host });
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => {
        this.server = null;
        resolve();
      });
    });
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    // Run middlewares
    for (const middleware of this.middlewares) {
      const handled = middleware(req, res);
      if (handled) return;
    }

    // Parse URL
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method ?? 'GET';

    // Match routes
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = pathname.match(route.pattern);
      if (!match) continue;

      // Build params from regex groups
      const params: Record<string, string> = {};
      for (let i = 1; i < match.length; i++) {
        params[String(i)] = match[i];
      }

      // Parse body for POST/PUT
      let body: unknown = undefined;
      if (method === 'POST' || method === 'PUT') {
        body = await parseBody(req);
      }

      await route.handler(req, res, params, body);
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      message: `${method} ${pathname} not found`,
    }));
  }
}

function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    const maxSize = 1024 * 1024; // 1MB

    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > maxSize) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON in request body'));
      }
    });

    req.on('error', reject);
  });
}
