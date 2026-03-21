export * from './types';
export { TenantStorage } from './storage/interface';
export { MemoryStorage } from './storage/memory';
export { FileStorage } from './storage/file';
export { TenantManager } from './tenant-manager';
export { APIServer, createStorage } from './api/server';
export { RateLimiter } from './api/middleware';

import { APIServer, createStorage } from './api/server';
import { ServerConfig } from './types';

/**
 * Multi-tenant policy server for managing CoFounder policies per-project.
 *
 * @example
 * ```typescript
 * const server = new TenantServer({ storage: 'file', dataDir: './tenants' });
 * await server.start({ port: 3457 });
 * ```
 */
export class TenantServer {
  private apiServer: APIServer;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    const storage = createStorage(config);
    this.apiServer = new APIServer(storage, config);
  }

  /**
   * Start the tenant server
   */
  async start(options: { port: number; host?: string }): Promise<void> {
    await this.apiServer.start(options);
  }

  /**
   * Stop the tenant server
   */
  async stop(): Promise<void> {
    await this.apiServer.stop();
  }

  /**
   * Get the underlying tenant manager for programmatic access
   */
  getManager() {
    return this.apiServer.getManager();
  }
}
