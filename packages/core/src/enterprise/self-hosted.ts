/**
 * Self-Hosted Deployment
 *
 * Enterprise self-hosted deployment capabilities:
 * - Air-gapped deployment support
 * - Custom model endpoints
 * - Private vector store integration
 * - Local telemetry
 * - Configuration management
 */

// ============================================================================
// Types
// ============================================================================

export type DeploymentMode = 'cloud' | 'hybrid' | 'self-hosted' | 'air-gapped';
export type ComponentStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface DeploymentConfig {
  mode: DeploymentMode;
  region?: string;
  environment?: 'production' | 'staging' | 'development';
  components: ComponentConfig[];
  networking: NetworkingConfig;
  storage: StorageConfig;
  security: SecurityConfig;
  telemetry: TelemetryConfig;
}

export interface ComponentConfig {
  name: string;
  type: 'api' | 'worker' | 'scheduler' | 'gateway' | 'cache' | 'database' | 'vector_store';
  replicas?: number;
  resources?: {
    cpu?: string;
    memory?: string;
    gpu?: string;
  };
  endpoints?: string[];
  healthCheck?: {
    path: string;
    interval: number;
    timeout: number;
  };
  env?: Record<string, string>;
}

export interface NetworkingConfig {
  ingressEnabled?: boolean;
  ingressHost?: string;
  tlsEnabled?: boolean;
  tlsCertPath?: string;
  tlsKeyPath?: string;
  allowedOrigins?: string[];
  rateLimiting?: {
    enabled: boolean;
    requestsPerSecond: number;
    burstSize: number;
  };
  proxy?: {
    enabled: boolean;
    http?: string;
    https?: string;
    noProxy?: string[];
  };
}

export interface StorageConfig {
  type: 'local' | 's3' | 'gcs' | 'azure' | 'minio';
  endpoint?: string;
  bucket?: string;
  region?: string;
  credentials?: {
    accessKey?: string;
    secretKey?: string;
  };
  encryption?: {
    enabled: boolean;
    keyId?: string;
  };
}

export interface SecurityConfig {
  encryptionAtRest?: boolean;
  encryptionInTransit?: boolean;
  keyManagement?: 'local' | 'aws-kms' | 'azure-kv' | 'hashicorp-vault' | 'custom';
  keyManagementEndpoint?: string;
  auditLogging?: boolean;
  secretsManager?: 'env' | 'file' | 'aws-secrets' | 'hashicorp-vault' | 'kubernetes';
}

export interface TelemetryConfig {
  enabled: boolean;
  exporters?: TelemetryExporter[];
  sampling?: number;
  excludePaths?: string[];
  redactFields?: string[];
}

export interface TelemetryExporter {
  type: 'otlp' | 'jaeger' | 'zipkin' | 'prometheus' | 'cloudwatch' | 'datadog' | 'custom';
  endpoint: string;
  headers?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
}

export interface ModelEndpoint {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'local' | 'custom';
  baseUrl: string;
  apiKey?: string;
  models: string[];
  capabilities: ('chat' | 'completion' | 'embedding' | 'image' | 'audio')[];
  rateLimit?: number;
  timeout?: number;
  retries?: number;
}

export interface VectorStoreEndpoint {
  id: string;
  name: string;
  provider: 'pinecone' | 'weaviate' | 'qdrant' | 'milvus' | 'chroma' | 'pgvector' | 'custom';
  endpoint: string;
  apiKey?: string;
  namespace?: string;
  dimensions?: number;
}

export interface HealthStatus {
  overall: ComponentStatus;
  components: Array<{
    name: string;
    status: ComponentStatus;
    latency?: number;
    lastCheck: Date;
    error?: string;
  }>;
  uptime: number;
  version: string;
}

export interface SelfHostedConfig {
  deploymentConfig: DeploymentConfig;
  modelEndpoints?: ModelEndpoint[];
  vectorStores?: VectorStoreEndpoint[];
  licenseKey?: string;
  features?: string[];
}

// ============================================================================
// Self-Hosted Manager Class
// ============================================================================

export class SelfHostedManager {
  private config: SelfHostedConfig;
  private modelEndpoints: Map<string, ModelEndpoint> = new Map();
  private vectorStores: Map<string, VectorStoreEndpoint> = new Map();
  private startTime: Date = new Date();

  constructor(config: SelfHostedConfig) {
    this.config = config;

    // Initialize endpoints
    if (config.modelEndpoints) {
      for (const endpoint of config.modelEndpoints) {
        this.modelEndpoints.set(endpoint.id, endpoint);
      }
    }

    if (config.vectorStores) {
      for (const store of config.vectorStores) {
        this.vectorStores.set(store.id, store);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Configuration Management
  // --------------------------------------------------------------------------

  /**
   * Get current deployment configuration
   */
  getDeploymentConfig(): DeploymentConfig {
    return this.config.deploymentConfig;
  }

  /**
   * Update deployment configuration
   */
  updateDeploymentConfig(updates: Partial<DeploymentConfig>): void {
    this.config.deploymentConfig = {
      ...this.config.deploymentConfig,
      ...updates,
    };
  }

  /**
   * Get deployment mode
   */
  getDeploymentMode(): DeploymentMode {
    return this.config.deploymentConfig.mode;
  }

  /**
   * Check if running in air-gapped mode
   */
  isAirGapped(): boolean {
    return this.config.deploymentConfig.mode === 'air-gapped';
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required components
    const requiredTypes = ['api', 'worker'];
    for (const type of requiredTypes) {
      const hasComponent = this.config.deploymentConfig.components.some(
        (c) => c.type === type
      );
      if (!hasComponent) {
        errors.push(`Missing required component: ${type}`);
      }
    }

    // Check model endpoints
    if (this.modelEndpoints.size === 0) {
      errors.push('No model endpoints configured');
    }

    // Check TLS in production
    if (
      this.config.deploymentConfig.environment === 'production' &&
      !this.config.deploymentConfig.networking.tlsEnabled
    ) {
      errors.push('TLS should be enabled in production');
    }

    // Check license for self-hosted/air-gapped
    if (
      ['self-hosted', 'air-gapped'].includes(this.config.deploymentConfig.mode) &&
      !this.config.licenseKey
    ) {
      errors.push('License key required for self-hosted deployment');
    }

    return { valid: errors.length === 0, errors };
  }

  // --------------------------------------------------------------------------
  // Model Endpoint Management
  // --------------------------------------------------------------------------

  /**
   * Add a model endpoint
   */
  addModelEndpoint(endpoint: ModelEndpoint): void {
    this.modelEndpoints.set(endpoint.id, endpoint);
  }

  /**
   * Remove a model endpoint
   */
  removeModelEndpoint(endpointId: string): void {
    this.modelEndpoints.delete(endpointId);
  }

  /**
   * Get all model endpoints
   */
  getModelEndpoints(): ModelEndpoint[] {
    return Array.from(this.modelEndpoints.values());
  }

  /**
   * Get endpoint by ID
   */
  getModelEndpoint(endpointId: string): ModelEndpoint | undefined {
    return this.modelEndpoints.get(endpointId);
  }

  /**
   * Find endpoint for a specific model
   */
  findEndpointForModel(modelName: string): ModelEndpoint | undefined {
    for (const endpoint of this.modelEndpoints.values()) {
      if (endpoint.models.includes(modelName)) {
        return endpoint;
      }
    }
    return undefined;
  }

  /**
   * Test model endpoint connectivity
   */
  async testModelEndpoint(endpointId: string): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    const endpoint = this.modelEndpoints.get(endpointId);

    if (!endpoint) {
      return { success: false, error: 'Endpoint not found' };
    }

    const startTime = Date.now();

    try {
      // Would make actual health check request
      const response = await this.makeHealthCheckRequest(endpoint.baseUrl);

      return {
        success: response.ok,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // --------------------------------------------------------------------------
  // Vector Store Management
  // --------------------------------------------------------------------------

  /**
   * Add a vector store
   */
  addVectorStore(store: VectorStoreEndpoint): void {
    this.vectorStores.set(store.id, store);
  }

  /**
   * Remove a vector store
   */
  removeVectorStore(storeId: string): void {
    this.vectorStores.delete(storeId);
  }

  /**
   * Get all vector stores
   */
  getVectorStores(): VectorStoreEndpoint[] {
    return Array.from(this.vectorStores.values());
  }

  /**
   * Get vector store by ID
   */
  getVectorStore(storeId: string): VectorStoreEndpoint | undefined {
    return this.vectorStores.get(storeId);
  }

  /**
   * Test vector store connectivity
   */
  async testVectorStore(storeId: string): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    const store = this.vectorStores.get(storeId);

    if (!store) {
      return { success: false, error: 'Store not found' };
    }

    const startTime = Date.now();

    try {
      // Would make actual health check request
      const response = await this.makeHealthCheckRequest(store.endpoint);

      return {
        success: response.ok,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // --------------------------------------------------------------------------
  // Health Monitoring
  // --------------------------------------------------------------------------

  /**
   * Get overall health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const componentStatuses = await Promise.all(
      this.config.deploymentConfig.components.map(async (component) => {
        const status = await this.checkComponentHealth(component);
        return {
          name: component.name,
          ...status,
        };
      })
    );

    // Determine overall status
    const hasUnhealthy = componentStatuses.some((c) => c.status === 'unhealthy');
    const hasDegraded = componentStatuses.some((c) => c.status === 'degraded');

    let overall: ComponentStatus = 'healthy';
    if (hasUnhealthy) {
      overall = 'unhealthy';
    } else if (hasDegraded) {
      overall = 'degraded';
    }

    return {
      overall,
      components: componentStatuses,
      uptime: (Date.now() - this.startTime.getTime()) / 1000,
      version: '2.0.0', // Would come from package.json
    };
  }

  private async checkComponentHealth(
    component: ComponentConfig
  ): Promise<{
    status: ComponentStatus;
    latency?: number;
    lastCheck: Date;
    error?: string;
  }> {
    if (!component.endpoints?.length || !component.healthCheck) {
      return {
        status: 'unknown',
        lastCheck: new Date(),
      };
    }

    const startTime = Date.now();

    try {
      const endpoint = component.endpoints[0];
      const healthUrl = `${endpoint}${component.healthCheck.path}`;

      const response = await this.makeHealthCheckRequest(healthUrl, {
        timeout: component.healthCheck.timeout,
      });

      return {
        status: response.ok ? 'healthy' : 'degraded',
        latency: Date.now() - startTime,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // --------------------------------------------------------------------------
  // Secrets Management
  // --------------------------------------------------------------------------

  /**
   * Get a secret value
   */
  async getSecret(key: string): Promise<string | undefined> {
    const secretsManager = this.config.deploymentConfig.security.secretsManager ?? 'env';

    switch (secretsManager) {
      case 'env':
        return process.env[key];

      case 'file':
        // Would read from file system
        return undefined;

      case 'aws-secrets':
        // Would fetch from AWS Secrets Manager
        return undefined;

      case 'hashicorp-vault':
        // Would fetch from Vault
        return undefined;

      case 'kubernetes':
        // Would read from Kubernetes secret
        return undefined;

      default:
        return undefined;
    }
  }

  /**
   * Set a secret value
   */
  async setSecret(key: string, value: string): Promise<void> {
    const secretsManager = this.config.deploymentConfig.security.secretsManager ?? 'env';

    switch (secretsManager) {
      case 'env':
        process.env[key] = value;
        break;

      case 'file':
        // Would write to file system
        break;

      case 'aws-secrets':
        // Would write to AWS Secrets Manager
        break;

      case 'hashicorp-vault':
        // Would write to Vault
        break;

      case 'kubernetes':
        // Would update Kubernetes secret
        break;
    }
  }

  // --------------------------------------------------------------------------
  // License Management
  // --------------------------------------------------------------------------

  /**
   * Validate license
   */
  async validateLicense(): Promise<{
    valid: boolean;
    expiresAt?: Date;
    features?: string[];
    error?: string;
  }> {
    if (!this.config.licenseKey) {
      return { valid: false, error: 'No license key provided' };
    }

    // Would validate license with licensing server or offline validation
    // For air-gapped deployments, would use offline validation

    return {
      valid: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      features: this.config.features ?? ['core', 'enterprise'],
    };
  }

  /**
   * Check if a feature is enabled
   */
  hasFeature(feature: string): boolean {
    return this.config.features?.includes(feature) ?? false;
  }

  // --------------------------------------------------------------------------
  // Telemetry
  // --------------------------------------------------------------------------

  /**
   * Get telemetry configuration
   */
  getTelemetryConfig(): TelemetryConfig {
    return this.config.deploymentConfig.telemetry;
  }

  /**
   * Update telemetry configuration
   */
  updateTelemetryConfig(updates: Partial<TelemetryConfig>): void {
    this.config.deploymentConfig.telemetry = {
      ...this.config.deploymentConfig.telemetry,
      ...updates,
    };
  }

  /**
   * Disable telemetry (for air-gapped)
   */
  disableTelemetry(): void {
    this.config.deploymentConfig.telemetry.enabled = false;
    this.config.deploymentConfig.telemetry.exporters = [];
  }

  // --------------------------------------------------------------------------
  // Export Configuration
  // --------------------------------------------------------------------------

  /**
   * Export configuration for deployment
   */
  exportConfig(format: 'yaml' | 'json' | 'env'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.config.deploymentConfig, null, 2);

      case 'yaml':
        return this.toYAML(this.config.deploymentConfig);

      case 'env':
        return this.toEnvFile(this.config.deploymentConfig);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate Kubernetes manifests
   */
  generateKubernetesManifests(): string {
    const manifests: string[] = [];

    // Generate deployment for each component
    for (const component of this.config.deploymentConfig.components) {
      manifests.push(this.generateDeployment(component));
      manifests.push(this.generateService(component));
    }

    // Generate ingress if enabled
    if (this.config.deploymentConfig.networking.ingressEnabled) {
      manifests.push(this.generateIngress());
    }

    return manifests.join('\n---\n');
  }

  /**
   * Generate Docker Compose configuration
   */
  generateDockerCompose(): string {
    const services: Record<string, unknown> = {};

    for (const component of this.config.deploymentConfig.components) {
      services[component.name] = {
        image: `rana/${component.type}:latest`,
        replicas: component.replicas ?? 1,
        environment: component.env ?? {},
        resources: {
          limits: {
            cpus: component.resources?.cpu ?? '1',
            memory: component.resources?.memory ?? '1G',
          },
        },
      };
    }

    return this.toYAML({
      version: '3.8',
      services,
    });
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private async makeHealthCheckRequest(
    url: string,
    options?: { timeout?: number }
  ): Promise<{ ok: boolean }> {
    // Would make actual HTTP request
    console.log(`[SelfHosted] Health check: ${url}`);
    return { ok: true };
  }

  private toYAML(obj: unknown): string {
    // Simple YAML serialization (would use proper library in production)
    return JSON.stringify(obj, null, 2)
      .replace(/"([^"]+)":/g, '$1:')
      .replace(/"/g, '');
  }

  private toEnvFile(config: DeploymentConfig): string {
    const lines: string[] = [];

    lines.push(`DEPLOYMENT_MODE=${config.mode}`);
    lines.push(`ENVIRONMENT=${config.environment ?? 'production'}`);

    if (config.networking.ingressHost) {
      lines.push(`INGRESS_HOST=${config.networking.ingressHost}`);
    }

    if (config.storage.endpoint) {
      lines.push(`STORAGE_ENDPOINT=${config.storage.endpoint}`);
    }

    return lines.join('\n');
  }

  private generateDeployment(component: ComponentConfig): string {
    return `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${component.name}
spec:
  replicas: ${component.replicas ?? 1}
  selector:
    matchLabels:
      app: ${component.name}
  template:
    metadata:
      labels:
        app: ${component.name}
    spec:
      containers:
      - name: ${component.name}
        image: rana/${component.type}:latest
        resources:
          limits:
            cpu: ${component.resources?.cpu ?? '1'}
            memory: ${component.resources?.memory ?? '1Gi'}
`.trim();
  }

  private generateService(component: ComponentConfig): string {
    return `
apiVersion: v1
kind: Service
metadata:
  name: ${component.name}
spec:
  selector:
    app: ${component.name}
  ports:
  - port: 80
    targetPort: 8080
`.trim();
  }

  private generateIngress(): string {
    const host = this.config.deploymentConfig.networking.ingressHost ?? 'rana.local';

    return `
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rana-ingress
spec:
  rules:
  - host: ${host}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api
            port:
              number: 80
`.trim();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createSelfHostedManager(
  config: SelfHostedConfig
): SelfHostedManager {
  return new SelfHostedManager(config);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a minimal self-hosted configuration
 */
export function createMinimalConfig(options: {
  mode: DeploymentMode;
  modelEndpoint?: ModelEndpoint;
}): SelfHostedConfig {
  return {
    deploymentConfig: {
      mode: options.mode,
      environment: 'production',
      components: [
        {
          name: 'api',
          type: 'api',
          replicas: 1,
          healthCheck: {
            path: '/health',
            interval: 30,
            timeout: 5,
          },
        },
        {
          name: 'worker',
          type: 'worker',
          replicas: 1,
        },
      ],
      networking: {
        ingressEnabled: true,
        tlsEnabled: true,
      },
      storage: {
        type: 'local',
      },
      security: {
        encryptionAtRest: true,
        encryptionInTransit: true,
        auditLogging: true,
        secretsManager: 'env',
      },
      telemetry: {
        enabled: options.mode !== 'air-gapped',
      },
    },
    modelEndpoints: options.modelEndpoint ? [options.modelEndpoint] : [],
  };
}

/**
 * Create air-gapped configuration
 */
export function createAirGappedConfig(options: {
  localModelEndpoint: ModelEndpoint;
  localVectorStore?: VectorStoreEndpoint;
  licenseKey: string;
}): SelfHostedConfig {
  return {
    deploymentConfig: {
      mode: 'air-gapped',
      environment: 'production',
      components: [
        {
          name: 'api',
          type: 'api',
          replicas: 2,
          healthCheck: {
            path: '/health',
            interval: 30,
            timeout: 5,
          },
        },
        {
          name: 'worker',
          type: 'worker',
          replicas: 3,
        },
        {
          name: 'scheduler',
          type: 'scheduler',
          replicas: 1,
        },
      ],
      networking: {
        ingressEnabled: true,
        tlsEnabled: true,
        proxy: {
          enabled: false,
        },
      },
      storage: {
        type: 'local',
        encryption: {
          enabled: true,
        },
      },
      security: {
        encryptionAtRest: true,
        encryptionInTransit: true,
        keyManagement: 'local',
        auditLogging: true,
        secretsManager: 'file',
      },
      telemetry: {
        enabled: false,
        exporters: [],
      },
    },
    modelEndpoints: [options.localModelEndpoint],
    vectorStores: options.localVectorStore ? [options.localVectorStore] : [],
    licenseKey: options.licenseKey,
    features: ['core', 'enterprise', 'air-gapped'],
  };
}
