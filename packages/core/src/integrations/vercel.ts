/**
 * @rana/integrations/vercel
 * Vercel one-click deploy integration
 *
 * Features:
 * - One-click deployment configuration
 * - Environment variable management
 * - Edge function optimization
 * - Preview deployments
 * - Custom domains
 *
 * @example
 * ```typescript
 * import { createVercelConfig, deployToVercel } from '@rana/core';
 *
 * // Generate vercel.json
 * const config = createVercelConfig({
 *   name: 'my-rana-app',
 *   framework: 'nextjs',
 *   regions: ['iad1', 'sfo1'],
 * });
 *
 * // Deploy programmatically
 * const deployment = await deployToVercel({
 *   token: process.env.VERCEL_TOKEN,
 *   projectName: 'my-rana-app',
 * });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type VercelFramework =
  | 'nextjs'
  | 'remix'
  | 'sveltekit'
  | 'nuxt'
  | 'astro'
  | 'express'
  | 'fastify'
  | 'hono'
  | 'static';

export type VercelRegion =
  | 'iad1'  // Washington DC
  | 'sfo1'  // San Francisco
  | 'pdx1'  // Portland
  | 'cle1'  // Cleveland
  | 'gru1'  // São Paulo
  | 'hnd1'  // Tokyo
  | 'icn1'  // Seoul
  | 'kix1'  // Osaka
  | 'sin1'  // Singapore
  | 'syd1'  // Sydney
  | 'hkg1'  // Hong Kong
  | 'bom1'  // Mumbai
  | 'lhr1'  // London
  | 'fra1'  // Frankfurt
  | 'arn1'  // Stockholm
  | 'cdg1'; // Paris

export interface VercelConfigOptions {
  /** Project name */
  name?: string;
  /** Framework to use */
  framework?: VercelFramework;
  /** Regions to deploy to */
  regions?: VercelRegion[];
  /** Build command */
  buildCommand?: string;
  /** Output directory */
  outputDirectory?: string;
  /** Install command */
  installCommand?: string;
  /** Dev command */
  devCommand?: string;
  /** Root directory */
  rootDirectory?: string;
  /** Node.js version */
  nodeVersion?: '18.x' | '20.x';
  /** Environment variables */
  env?: Record<string, string>;
  /** Build environment variables */
  buildEnv?: Record<string, string>;
  /** Enable Edge Functions */
  edgeFunctions?: boolean;
  /** Function timeout (Pro: 60s, Enterprise: 900s) */
  functionTimeout?: number;
  /** Function memory (128-3008 MB) */
  functionMemory?: number;
  /** Cron jobs */
  crons?: CronJob[];
  /** Rewrites */
  rewrites?: Rewrite[];
  /** Redirects */
  redirects?: Redirect[];
  /** Headers */
  headers?: Header[];
  /** Git integration settings */
  git?: GitSettings;
}

export interface CronJob {
  /** Path to invoke */
  path: string;
  /** Cron schedule */
  schedule: string;
}

export interface Rewrite {
  /** Source path */
  source: string;
  /** Destination */
  destination: string;
  /** Has regex */
  has?: Array<{
    type: 'header' | 'cookie' | 'query';
    key: string;
    value?: string;
  }>;
}

export interface Redirect {
  /** Source path */
  source: string;
  /** Destination */
  destination: string;
  /** Permanent redirect */
  permanent?: boolean;
  /** Status code */
  statusCode?: 301 | 302 | 307 | 308;
}

export interface Header {
  /** Source path */
  source: string;
  /** Headers to set */
  headers: Array<{ key: string; value: string }>;
}

export interface GitSettings {
  /** Deploy only from main branch */
  deployOnPush?: boolean;
  /** Enable preview deployments */
  previewEnabled?: boolean;
  /** Preview deployment expiration (days) */
  previewExpire?: number;
}

export interface VercelDeployOptions {
  /** Vercel API token */
  token: string;
  /** Project name */
  projectName: string;
  /** Team ID (optional) */
  teamId?: string;
  /** Directory to deploy */
  directory?: string;
  /** Production deployment */
  production?: boolean;
  /** Force new deployment */
  force?: boolean;
  /** Environment variables */
  env?: Record<string, string>;
  /** Build environment variables */
  buildEnv?: Record<string, string>;
  /** Deployment alias */
  alias?: string[];
}

export interface Deployment {
  id: string;
  url: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'QUEUED';
  readyState: 'READY' | 'NOT_READY';
  createdAt: Date;
  buildingAt?: Date;
  ready?: Date;
  alias?: string[];
  target?: 'production' | 'preview';
  meta?: Record<string, string>;
}

export interface DeploymentStatus {
  deployment: Deployment;
  buildLogs: BuildLog[];
  error?: string;
}

export interface BuildLog {
  type: 'stdout' | 'stderr';
  text: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  framework?: VercelFramework;
  createdAt: Date;
  updatedAt: Date;
  latestDeployments?: Deployment[];
}

export interface Domain {
  name: string;
  apexName: string;
  verified: boolean;
  createdAt: Date;
}

// ============================================================================
// Vercel Config Generator
// ============================================================================

export interface VercelJson {
  version?: number;
  name?: string;
  regions?: string[];
  build?: {
    env?: Record<string, string>;
  };
  builds?: Array<{
    src: string;
    use: string;
    config?: Record<string, unknown>;
  }>;
  routes?: Array<{
    src: string;
    dest?: string;
    headers?: Record<string, string>;
    status?: number;
  }>;
  functions?: Record<
    string,
    {
      memory?: number;
      maxDuration?: number;
      runtime?: string;
    }
  >;
  crons?: CronJob[];
  rewrites?: Rewrite[];
  redirects?: Redirect[];
  headers?: Header[];
  git?: GitSettings;
}

/**
 * Create vercel.json configuration
 */
export function createVercelConfig(options: VercelConfigOptions = {}): VercelJson {
  const config: VercelJson = {
    version: 2,
  };

  if (options.name) {
    config.name = options.name;
  }

  if (options.regions?.length) {
    config.regions = options.regions;
  }

  // Build configuration
  if (options.buildEnv) {
    config.build = { env: options.buildEnv };
  }

  // Function configuration
  if (options.edgeFunctions || options.functionTimeout || options.functionMemory) {
    config.functions = {
      'api/**/*.ts': {
        ...(options.functionMemory && { memory: options.functionMemory }),
        ...(options.functionTimeout && { maxDuration: options.functionTimeout }),
        ...(options.edgeFunctions && { runtime: 'edge' }),
      },
    };
  }

  // Cron jobs
  if (options.crons?.length) {
    config.crons = options.crons;
  }

  // Rewrites
  if (options.rewrites?.length) {
    config.rewrites = options.rewrites;
  }

  // Redirects
  if (options.redirects?.length) {
    config.redirects = options.redirects;
  }

  // Headers
  if (options.headers?.length) {
    config.headers = options.headers;
  }

  // Git settings
  if (options.git) {
    config.git = options.git;
  }

  return config;
}

/**
 * Create RANA-optimized vercel.json
 */
export function createRanaVercelConfig(options: {
  name: string;
  providers?: string[];
  streaming?: boolean;
  edgeFunctions?: boolean;
} = { name: 'rana-app' }): VercelJson {
  // Build environment variables for common AI providers
  const buildEnv: Record<string, string> = {};
  const providers = options.providers || ['ANTHROPIC', 'OPENAI'];

  for (const provider of providers) {
    buildEnv[`${provider.toUpperCase()}_API_KEY`] = `@${provider.toLowerCase()}-api-key`;
  }

  return createVercelConfig({
    name: options.name,
    regions: ['iad1', 'sfo1'], // US East and West for low latency
    buildEnv,
    edgeFunctions: options.edgeFunctions,
    functionTimeout: 60, // Max for Pro
    headers: [
      // CORS for API routes
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      // Cache headers for static assets
      {
        source: '/(.*)\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff|woff2)$',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ],
    rewrites: options.streaming
      ? [
          // SSE endpoint for streaming
          {
            source: '/api/stream/:path*',
            destination: '/api/stream/:path*',
            has: [{ type: 'header', key: 'Accept', value: 'text/event-stream' }],
          },
        ]
      : undefined,
  });
}

// ============================================================================
// Vercel API Client
// ============================================================================

export class VercelClient {
  private baseUrl = 'https://api.vercel.com';
  private token: string;
  private teamId?: string;

  constructor(token: string, teamId?: string) {
    this.token = token;
    this.teamId = teamId;
  }

  // --------------------------------------------------------------------------
  // Deployments
  // --------------------------------------------------------------------------

  /**
   * Create a new deployment
   */
  async deploy(options: Omit<VercelDeployOptions, 'token'>): Promise<Deployment> {
    const payload: Record<string, unknown> = {
      name: options.projectName,
      target: options.production ? 'production' : undefined,
      gitSource: undefined,
    };

    if (options.env) {
      payload.env = options.env;
    }

    if (options.buildEnv) {
      payload.build = { env: options.buildEnv };
    }

    const response = await this.request<{ id: string; url: string; readyState: string }>(
      '/v13/deployments',
      {
        method: 'POST',
        body: payload,
      }
    );

    return {
      id: response.id,
      url: response.url,
      state: 'QUEUED',
      readyState: response.readyState === 'READY' ? 'READY' : 'NOT_READY',
      createdAt: new Date(),
      target: options.production ? 'production' : 'preview',
    };
  }

  /**
   * Get deployment status
   */
  async getDeployment(deploymentId: string): Promise<Deployment> {
    const response = await this.request<{
      id: string;
      url: string;
      state: string;
      readyState: string;
      createdAt: number;
      buildingAt?: number;
      ready?: number;
      alias?: string[];
      target?: string;
      meta?: Record<string, string>;
    }>(`/v13/deployments/${deploymentId}`);

    return {
      id: response.id,
      url: response.url,
      state: response.state as Deployment['state'],
      readyState: response.readyState === 'READY' ? 'READY' : 'NOT_READY',
      createdAt: new Date(response.createdAt),
      buildingAt: response.buildingAt ? new Date(response.buildingAt) : undefined,
      ready: response.ready ? new Date(response.ready) : undefined,
      alias: response.alias,
      target: response.target as 'production' | 'preview' | undefined,
      meta: response.meta,
    };
  }

  /**
   * Wait for deployment to be ready
   */
  async waitForDeployment(
    deploymentId: string,
    options?: { timeout?: number; pollInterval?: number }
  ): Promise<DeploymentStatus> {
    const timeout = options?.timeout || 300000; // 5 minutes
    const pollInterval = options?.pollInterval || 3000; // 3 seconds
    const startTime = Date.now();

    const logs: BuildLog[] = [];

    while (Date.now() - startTime < timeout) {
      const deployment = await this.getDeployment(deploymentId);

      if (deployment.state === 'READY') {
        return { deployment, buildLogs: logs };
      }

      if (deployment.state === 'ERROR') {
        const errorLogs = await this.getBuildLogs(deploymentId);
        return {
          deployment,
          buildLogs: errorLogs,
          error: 'Deployment failed',
        };
      }

      if (deployment.state === 'CANCELED') {
        return {
          deployment,
          buildLogs: logs,
          error: 'Deployment was canceled',
        };
      }

      await this.sleep(pollInterval);
    }

    throw new VercelError('Deployment timed out');
  }

  /**
   * Get build logs
   */
  async getBuildLogs(deploymentId: string): Promise<BuildLog[]> {
    const response = await this.request<{
      logs: Array<{ type: string; text: string; createdAt: number }>;
    }>(`/v2/deployments/${deploymentId}/events`);

    return response.logs.map((log) => ({
      type: log.type as 'stdout' | 'stderr',
      text: log.text,
      createdAt: new Date(log.createdAt),
    }));
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(deploymentId: string): Promise<void> {
    await this.request(`/v12/deployments/${deploymentId}/cancel`, {
      method: 'PATCH',
    });
  }

  /**
   * List deployments
   */
  async listDeployments(options?: {
    projectId?: string;
    limit?: number;
    state?: Deployment['state'];
  }): Promise<Deployment[]> {
    const params = new URLSearchParams();
    if (options?.projectId) params.set('projectId', options.projectId);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.state) params.set('state', options.state);

    const response = await this.request<{
      deployments: Array<{
        uid: string;
        url: string;
        state: string;
        readyState: string;
        createdAt: number;
        alias?: string[];
        target?: string;
      }>;
    }>(`/v6/deployments?${params}`);

    return response.deployments.map((d) => ({
      id: d.uid,
      url: d.url,
      state: d.state as Deployment['state'],
      readyState: d.readyState === 'READY' ? 'READY' : 'NOT_READY',
      createdAt: new Date(d.createdAt),
      alias: d.alias,
      target: d.target as 'production' | 'preview' | undefined,
    }));
  }

  // --------------------------------------------------------------------------
  // Projects
  // --------------------------------------------------------------------------

  /**
   * Create a new project
   */
  async createProject(name: string, options?: {
    framework?: VercelFramework;
    gitRepository?: { repo: string; type: 'github' | 'gitlab' | 'bitbucket' };
    buildCommand?: string;
    outputDirectory?: string;
    installCommand?: string;
    devCommand?: string;
  }): Promise<Project> {
    const payload: Record<string, unknown> = {
      name,
      framework: options?.framework,
      gitRepository: options?.gitRepository,
      buildCommand: options?.buildCommand,
      outputDirectory: options?.outputDirectory,
      installCommand: options?.installCommand,
      devCommand: options?.devCommand,
    };

    const response = await this.request<{
      id: string;
      name: string;
      framework?: string;
      createdAt: number;
      updatedAt: number;
    }>('/v9/projects', {
      method: 'POST',
      body: payload,
    });

    return {
      id: response.id,
      name: response.name,
      framework: response.framework as VercelFramework | undefined,
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
    };
  }

  /**
   * Get project by name or ID
   */
  async getProject(nameOrId: string): Promise<Project> {
    const response = await this.request<{
      id: string;
      name: string;
      framework?: string;
      createdAt: number;
      updatedAt: number;
      latestDeployments?: Array<{
        uid: string;
        url: string;
        state: string;
        readyState: string;
        createdAt: number;
      }>;
    }>(`/v9/projects/${nameOrId}`);

    return {
      id: response.id,
      name: response.name,
      framework: response.framework as VercelFramework | undefined,
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
      latestDeployments: response.latestDeployments?.map((d) => ({
        id: d.uid,
        url: d.url,
        state: d.state as Deployment['state'],
        readyState: d.readyState === 'READY' ? 'READY' : 'NOT_READY',
        createdAt: new Date(d.createdAt),
      })),
    };
  }

  /**
   * Delete a project
   */
  async deleteProject(nameOrId: string): Promise<void> {
    await this.request(`/v9/projects/${nameOrId}`, { method: 'DELETE' });
  }

  /**
   * List all projects
   */
  async listProjects(options?: { limit?: number }): Promise<Project[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));

    const response = await this.request<{
      projects: Array<{
        id: string;
        name: string;
        framework?: string;
        createdAt: number;
        updatedAt: number;
      }>;
    }>(`/v9/projects?${params}`);

    return response.projects.map((p) => ({
      id: p.id,
      name: p.name,
      framework: p.framework as VercelFramework | undefined,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  }

  // --------------------------------------------------------------------------
  // Environment Variables
  // --------------------------------------------------------------------------

  /**
   * Set environment variable
   */
  async setEnvVar(
    projectId: string,
    key: string,
    value: string,
    options?: { target?: ('production' | 'preview' | 'development')[]; type?: 'plain' | 'secret' }
  ): Promise<void> {
    await this.request(`/v10/projects/${projectId}/env`, {
      method: 'POST',
      body: {
        key,
        value,
        target: options?.target || ['production', 'preview', 'development'],
        type: options?.type || 'encrypted',
      },
    });
  }

  /**
   * Get environment variables
   */
  async getEnvVars(projectId: string): Promise<Array<{
    key: string;
    value?: string;
    target: string[];
    type: string;
  }>> {
    const response = await this.request<{
      envs: Array<{
        key: string;
        value?: string;
        target: string[];
        type: string;
      }>;
    }>(`/v9/projects/${projectId}/env`);

    return response.envs;
  }

  /**
   * Delete environment variable
   */
  async deleteEnvVar(projectId: string, envId: string): Promise<void> {
    await this.request(`/v9/projects/${projectId}/env/${envId}`, {
      method: 'DELETE',
    });
  }

  // --------------------------------------------------------------------------
  // Domains
  // --------------------------------------------------------------------------

  /**
   * Add domain to project
   */
  async addDomain(projectId: string, domain: string): Promise<Domain> {
    const response = await this.request<{
      name: string;
      apexName: string;
      verified: boolean;
      createdAt: number;
    }>(`/v10/projects/${projectId}/domains`, {
      method: 'POST',
      body: { name: domain },
    });

    return {
      name: response.name,
      apexName: response.apexName,
      verified: response.verified,
      createdAt: new Date(response.createdAt),
    };
  }

  /**
   * List domains for project
   */
  async listDomains(projectId: string): Promise<Domain[]> {
    const response = await this.request<{
      domains: Array<{
        name: string;
        apexName: string;
        verified: boolean;
        createdAt: number;
      }>;
    }>(`/v9/projects/${projectId}/domains`);

    return response.domains.map((d) => ({
      name: d.name,
      apexName: d.apexName,
      verified: d.verified,
      createdAt: new Date(d.createdAt),
    }));
  }

  /**
   * Remove domain from project
   */
  async removeDomain(projectId: string, domain: string): Promise<void> {
    await this.request(`/v9/projects/${projectId}/domains/${domain}`, {
      method: 'DELETE',
    });
  }

  // --------------------------------------------------------------------------
  // Aliases
  // --------------------------------------------------------------------------

  /**
   * Set alias for deployment
   */
  async setAlias(deploymentId: string, alias: string): Promise<void> {
    await this.request('/v2/aliases', {
      method: 'POST',
      body: {
        alias,
        deploymentId,
      },
    });
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private async request<T>(
    endpoint: string,
    options?: { method?: string; body?: unknown }
  ): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    }

    const response = await fetch(url.toString(), {
      method: options?.method || 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText })) as {
        error?: { message?: string };
        message?: string;
      };
      throw new VercelError(
        error.error?.message || error.message || 'Vercel API error',
        response.status
      );
    }

    return response.json() as Promise<T>;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Errors
// ============================================================================

export class VercelError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'VercelError';
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create Vercel client
 */
export function createVercelClient(token: string, teamId?: string): VercelClient {
  return new VercelClient(token, teamId);
}

/**
 * Quick deploy to Vercel
 */
export async function deployToVercel(options: VercelDeployOptions): Promise<DeploymentStatus> {
  const client = createVercelClient(options.token, options.teamId);
  const deployment = await client.deploy(options);
  return client.waitForDeployment(deployment.id);
}

/**
 * Generate deployment button badge URL
 */
export function getDeployButton(options: {
  repoUrl: string;
  projectName?: string;
  envRequired?: string[];
}): { svg: string; link: string } {
  const params = new URLSearchParams({
    repository: options.repoUrl,
  });

  if (options.projectName) {
    params.set('project-name', options.projectName);
  }

  if (options.envRequired?.length) {
    params.set('env', options.envRequired.join(','));
  }

  return {
    svg: 'https://vercel.com/button',
    link: `https://vercel.com/new/clone?${params}`,
  };
}

/**
 * Generate one-click deploy markdown
 */
export function generateDeployReadme(options: {
  repoUrl: string;
  projectName: string;
  envRequired?: Array<{ name: string; description: string }>;
}): string {
  const button = getDeployButton({
    repoUrl: options.repoUrl,
    projectName: options.projectName,
    envRequired: options.envRequired?.map((e) => e.name),
  });

  let readme = `## Deploy to Vercel

[![Deploy with Vercel](${button.svg})](${button.link})

Click the button above to deploy this project to Vercel.
`;

  if (options.envRequired?.length) {
    readme += `
### Required Environment Variables

| Variable | Description |
|----------|-------------|
`;
    for (const env of options.envRequired) {
      readme += `| \`${env.name}\` | ${env.description} |\n`;
    }
  }

  readme += `
### Manual Deployment

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
\`\`\`
`;

  return readme;
}
