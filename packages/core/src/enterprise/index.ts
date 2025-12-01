/**
 * Enterprise Features
 *
 * Production-ready enterprise capabilities:
 * - SSO/SAML authentication
 * - Role-based access control (RBAC)
 * - Compliance reporting
 * - Self-hosted deployment
 * - SLA support
 */

// ============================================================================
// SSO/SAML
// ============================================================================

export {
  SSOManager,
  MemoryStorageAdapter as SSOMemoryStorage,
  createSSOManager,
} from './sso';

export type {
  SSOProvider,
  IdentityProvider,
  SAMLConfig,
  OIDCConfig,
  SSOUser,
  SSOSession,
  AuthenticationResult,
  SSOProviderConfig,
  SSOManagerConfig,
  StorageAdapter as SSOStorageAdapter,
} from './sso';

// ============================================================================
// RBAC
// ============================================================================

export {
  RBACManager,
  MemoryRBACStorage,
  createRBACManager,
  SYSTEM_ROLES,
} from './rbac';

export type {
  Permission,
  ResourceType,
  Action,
  Role,
  Policy,
  PolicyCondition,
  UserRoleAssignment,
  AccessCheckResult,
  RBACContext,
  AuditLogEntry as RBACAuditLogEntry,
  RBACConfig,
  RBACStorageAdapter,
} from './rbac';

// ============================================================================
// Compliance
// ============================================================================

export {
  ComplianceManager,
  MemoryComplianceStorage,
  createComplianceManager,
} from './compliance';

export type {
  ComplianceStandard,
  DataCategory,
  RetentionAction,
  AuditEvent,
  DataInventoryItem,
  RetentionPolicy,
  DataSubjectRequest,
  ComplianceReport,
  ComplianceControl,
  ComplianceFinding,
  ComplianceManagerConfig,
  ComplianceStorageAdapter,
  AuditQuery,
} from './compliance';

// ============================================================================
// Self-Hosted
// ============================================================================

export {
  SelfHostedManager,
  createSelfHostedManager,
  createMinimalConfig,
  createAirGappedConfig,
} from './self-hosted';

export type {
  DeploymentMode,
  ComponentStatus,
  DeploymentConfig,
  ComponentConfig,
  NetworkingConfig,
  StorageConfig,
  SecurityConfig,
  TelemetryConfig,
  TelemetryExporter,
  ModelEndpoint,
  VectorStoreEndpoint,
  HealthStatus,
  SelfHostedConfig,
} from './self-hosted';

// ============================================================================
// SLA Support
// ============================================================================

export {
  SLAManager,
  MemorySLAStorage,
  createSLAManager,
  SLA_TEMPLATES,
} from './sla';

export type {
  SLOType,
  TimeWindow,
  AlertSeverity,
  SLODefinition,
  SLOStatus,
  SLADefinition,
  SLAPenalty,
  SLAReport,
  SLABreach,
  AppliedPenalty,
  MetricDataPoint,
  AlertRule,
  AlertChannel,
  Alert,
  SLAManagerConfig,
  SLAStorageAdapter,
} from './sla';

// ============================================================================
// Unified Enterprise Interface
// ============================================================================

import { SSOManager, SSOManagerConfig } from './sso';
import { RBACManager, RBACConfig } from './rbac';
import { ComplianceManager, ComplianceManagerConfig } from './compliance';
import { SelfHostedManager, SelfHostedConfig } from './self-hosted';
import { SLAManager, SLAManagerConfig } from './sla';

export interface EnterpriseConfig {
  sso?: SSOManagerConfig;
  rbac?: RBACConfig;
  compliance?: ComplianceManagerConfig;
  selfHosted?: SelfHostedConfig;
  sla?: SLAManagerConfig;
}

/**
 * Unified enterprise features manager
 */
export class Enterprise {
  public readonly sso?: SSOManager;
  public readonly rbac: RBACManager;
  public readonly compliance?: ComplianceManager;
  public readonly selfHosted?: SelfHostedManager;
  public readonly sla?: SLAManager;

  constructor(config: EnterpriseConfig) {
    // SSO is optional
    if (config.sso) {
      this.sso = new SSOManager(config.sso);
    }

    // RBAC is always available
    this.rbac = new RBACManager(config.rbac ?? {});

    // Compliance is optional
    if (config.compliance) {
      this.compliance = new ComplianceManager(config.compliance);
    }

    // Self-hosted is optional
    if (config.selfHosted) {
      this.selfHosted = new SelfHostedManager(config.selfHosted);
    }

    // SLA is optional
    if (config.sla) {
      this.sla = new SLAManager(config.sla);
    }
  }

  // --------------------------------------------------------------------------
  // Quick Access Methods
  // --------------------------------------------------------------------------

  /**
   * Check if user has access
   */
  async checkAccess(
    userId: string,
    action: string,
    resource: { type: string; id?: string }
  ): Promise<boolean> {
    const roles = await this.rbac.getUserRoles(userId);

    const result = await this.rbac.checkAccess(
      {
        userId,
        roles: roles.map((r) => r.roleId),
      },
      action as any,
      resource as any
    );

    return result.allowed;
  }

  /**
   * Log an audit event
   */
  async logAudit(
    event: {
      eventType: string;
      actor: { id: string; type: 'user' | 'service' | 'system' };
      action: string;
      resource: { type: string; id: string };
      outcome: 'success' | 'failure';
      details?: Record<string, unknown>;
    }
  ): Promise<void> {
    if (this.compliance) {
      await this.compliance.logEvent(event);
    }
  }

  /**
   * Get system health
   */
  async getHealth(): Promise<{
    status: string;
    components: Record<string, unknown>;
  }> {
    const health: Record<string, unknown> = {};

    if (this.selfHosted) {
      const selfHostedHealth = await this.selfHosted.getHealthStatus();
      health.infrastructure = selfHostedHealth;
    }

    if (this.sla) {
      const slas = this.sla.getSLAs();
      const slaStatuses = await Promise.all(
        slas.map((sla) => this.sla!.getSLAStatus(sla.id))
      );
      health.sla = slaStatuses;
    }

    const hasIssues = Object.values(health).some((h: any) =>
      h?.overall === 'unhealthy' || h?.overall === 'degraded'
    );

    return {
      status: hasIssues ? 'degraded' : 'healthy',
      components: health,
    };
  }

  /**
   * Start all monitoring
   */
  startMonitoring(): void {
    if (this.sla) {
      this.sla.startMonitoring();
    }
  }

  /**
   * Stop all monitoring
   */
  stopMonitoring(): void {
    if (this.sla) {
      this.sla.stopMonitoring();
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createEnterprise(config: EnterpriseConfig): Enterprise {
  return new Enterprise(config);
}

// ============================================================================
// Convenience Export
// ============================================================================

let globalEnterprise: Enterprise | null = null;

export function getGlobalEnterprise(): Enterprise {
  if (!globalEnterprise) {
    globalEnterprise = createEnterprise({});
  }
  return globalEnterprise;
}

export function initializeEnterprise(config: EnterpriseConfig): Enterprise {
  globalEnterprise = createEnterprise(config);
  return globalEnterprise;
}
