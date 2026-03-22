/**
 * Evidence collection from CoFounder components for SOC 2 audit reports.
 *
 * Collects and aggregates evidence from dashboard metrics, audit logs,
 * policies, CI scans, and guard reports.
 */

import type {
  Evidence,
  EvidenceType,
  EvidenceSource,
  AuditPeriod,
  DashboardMetrics,
  AuditLogEntry,
  PolicySummary,
  CIScanSummary,
  GuardReportSummary,
} from './types';

/** Configuration for evidence collection */
export interface CollectionConfig {
  auditPeriod: AuditPeriod;
  includeRawData?: boolean;
  maxLogEntries?: number;
}

/** Result of evidence collection */
export interface CollectionResult {
  evidence: Evidence[];
  collectedAt: string;
  sourcesProcessed: number;
  errors: Array<{ source: string; error: string }>;
}

let evidenceCounter = 0;

function generateEvidenceId(prefix: string): string {
  evidenceCounter += 1;
  return `${prefix}-${Date.now()}-${evidenceCounter}`;
}

/**
 * Collect evidence from all provided sources.
 */
export function collectEvidence(
  sources: EvidenceSource[],
  config: CollectionConfig
): CollectionResult {
  const evidence: Evidence[] = [];
  const errors: Array<{ source: string; error: string }> = [];

  for (const source of sources) {
    try {
      switch (source.type) {
        case 'dashboard':
          evidence.push(
            ...collectDashboardEvidence(source.data as unknown as DashboardMetrics, config)
          );
          break;
        case 'audit_log':
          evidence.push(
            ...collectAuditLogEvidence(source.data as unknown as { entries: AuditLogEntry[] }, config)
          );
          break;
        case 'policy':
          evidence.push(
            ...collectPolicyEvidence(source.data as unknown as { policies: PolicySummary[] }, config)
          );
          break;
        case 'ci_scan':
          evidence.push(
            ...collectCIScanEvidence(source.data as unknown as { scans: CIScanSummary[] }, config)
          );
          break;
        case 'guard_report':
          evidence.push(
            ...collectGuardReportEvidence(
              source.data as unknown as { reports: GuardReportSummary[] },
              config
            )
          );
          break;
        default:
          errors.push({
            source: source.type,
            error: `Unknown evidence source type: ${source.type}`,
          });
      }
    } catch (err) {
      errors.push({
        source: source.type,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    evidence,
    collectedAt: new Date().toISOString(),
    sourcesProcessed: sources.length - errors.length,
    errors,
  };
}

/**
 * Collect evidence from CoFounder dashboard metrics.
 */
function collectDashboardEvidence(
  metrics: DashboardMetrics,
  config: CollectionConfig
): Evidence[] {
  const evidence: Evidence[] = [];
  const now = new Date().toISOString();

  // Overall system metrics
  evidence.push({
    id: generateEvidenceId('dashboard-overview'),
    type: 'metric' as EvidenceType,
    title: 'System Metrics Overview',
    description: `Aggregate guardrail metrics for period ${config.auditPeriod.startDate} to ${config.auditPeriod.endDate}`,
    collectedAt: now,
    source: 'aicofounder-dashboard',
    data: {
      totalRequests: metrics.totalRequests,
      blockedRequests: metrics.blockedRequests,
      blockRate: metrics.totalRequests > 0
        ? ((metrics.blockedRequests / metrics.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: metrics.avgResponseTime,
      uptime: metrics.uptime,
    },
  });

  // PII detection metrics
  evidence.push({
    id: generateEvidenceId('dashboard-pii'),
    type: 'metric' as EvidenceType,
    title: 'PII Detection Metrics',
    description: `PII detection statistics for the audit period`,
    collectedAt: now,
    source: 'aicofounder-dashboard',
    data: {
      totalDetections: metrics.piiDetections,
      detectionRate: metrics.totalRequests > 0
        ? ((metrics.piiDetections / metrics.totalRequests) * 100).toFixed(4) + '%'
        : '0%',
    },
  });

  // Injection detection metrics
  evidence.push({
    id: generateEvidenceId('dashboard-injection'),
    type: 'metric' as EvidenceType,
    title: 'Injection Detection Metrics',
    description: `Injection attempt detection statistics for the audit period`,
    collectedAt: now,
    source: 'aicofounder-dashboard',
    data: {
      totalAttempts: metrics.injectionAttempts,
      attemptRate: metrics.totalRequests > 0
        ? ((metrics.injectionAttempts / metrics.totalRequests) * 100).toFixed(4) + '%'
        : '0%',
    },
  });

  // Compliance violation metrics
  evidence.push({
    id: generateEvidenceId('dashboard-compliance'),
    type: 'metric' as EvidenceType,
    title: 'Compliance Violation Metrics',
    description: `Compliance violation statistics for the audit period`,
    collectedAt: now,
    source: 'aicofounder-dashboard',
    data: {
      totalViolations: metrics.complianceViolations,
      violationRate: metrics.totalRequests > 0
        ? ((metrics.complianceViolations / metrics.totalRequests) * 100).toFixed(4) + '%'
        : '0%',
    },
  });

  // Uptime metrics
  evidence.push({
    id: generateEvidenceId('dashboard-availability'),
    type: 'metric' as EvidenceType,
    title: 'System Availability Metrics',
    description: `System uptime and availability for the audit period`,
    collectedAt: now,
    source: 'aicofounder-dashboard',
    data: {
      uptimePercentage: metrics.uptime,
      meetsTarget: metrics.uptime >= 99.9,
    },
  });

  return evidence;
}

/**
 * Collect evidence from CoFounder audit logs.
 */
function collectAuditLogEvidence(
  logData: { entries: AuditLogEntry[] },
  config: CollectionConfig
): Evidence[] {
  const evidence: Evidence[] = [];
  const now = new Date().toISOString();
  const maxEntries = config.maxLogEntries ?? 1000;

  // Filter entries within audit period
  const periodEntries = logData.entries.filter((entry) => {
    return entry.timestamp >= config.auditPeriod.startDate &&
      entry.timestamp <= config.auditPeriod.endDate;
  });

  const limitedEntries = periodEntries.slice(0, maxEntries);

  // Security events summary
  const securityEvents = limitedEntries.filter(
    (e) => e.severity === 'critical' || e.severity === 'error'
  );
  evidence.push({
    id: generateEvidenceId('audit-security'),
    type: 'log' as EvidenceType,
    title: 'Security Events Summary',
    description: `Summary of security events during audit period (${securityEvents.length} events)`,
    collectedAt: now,
    source: 'aicofounder-audit-log',
    data: {
      totalEvents: securityEvents.length,
      bySeverity: countBy(securityEvents, 'severity'),
      byEventType: countBy(securityEvents, 'eventType'),
      byOutcome: countBy(securityEvents, 'outcome'),
      ...(config.includeRawData ? { events: securityEvents } : {}),
    },
  });

  // Access events summary
  const accessEvents = limitedEntries.filter(
    (e) => e.eventType === 'access' || e.eventType === 'authentication'
  );
  evidence.push({
    id: generateEvidenceId('audit-access'),
    type: 'log' as EvidenceType,
    title: 'Access Events Summary',
    description: `Summary of access and authentication events during audit period`,
    collectedAt: now,
    source: 'aicofounder-audit-log',
    data: {
      totalEvents: accessEvents.length,
      successfulAccess: accessEvents.filter((e) => e.outcome === 'success').length,
      failedAccess: accessEvents.filter((e) => e.outcome === 'failure').length,
      blockedAccess: accessEvents.filter((e) => e.outcome === 'blocked').length,
      uniqueActors: new Set(accessEvents.map((e) => e.actor)).size,
    },
  });

  // Configuration change events
  const changeEvents = limitedEntries.filter(
    (e) => e.eventType === 'configuration_change' || e.eventType === 'policy_update'
  );
  evidence.push({
    id: generateEvidenceId('audit-changes'),
    type: 'log' as EvidenceType,
    title: 'Configuration Change Events',
    description: `Summary of configuration and policy changes during audit period`,
    collectedAt: now,
    source: 'aicofounder-audit-log',
    data: {
      totalChanges: changeEvents.length,
      byAction: countBy(changeEvents, 'action'),
      uniqueActors: new Set(changeEvents.map((e) => e.actor)).size,
      ...(config.includeRawData ? { events: changeEvents } : {}),
    },
  });

  // Violation events
  const violationEvents = limitedEntries.filter(
    (e) => e.outcome === 'blocked'
  );
  evidence.push({
    id: generateEvidenceId('audit-violations'),
    type: 'log' as EvidenceType,
    title: 'Violation Events Summary',
    description: `Summary of blocked/violation events during audit period`,
    collectedAt: now,
    source: 'aicofounder-audit-log',
    data: {
      totalViolations: violationEvents.length,
      byEventType: countBy(violationEvents, 'eventType'),
      bySeverity: countBy(violationEvents, 'severity'),
    },
  });

  return evidence;
}

/**
 * Collect evidence from CoFounder policy documents.
 */
function collectPolicyEvidence(
  policyData: { policies: PolicySummary[] },
  config: CollectionConfig
): Evidence[] {
  const evidence: Evidence[] = [];
  const now = new Date().toISOString();

  // Active policies summary
  evidence.push({
    id: generateEvidenceId('policy-summary'),
    type: 'policy' as EvidenceType,
    title: 'Active Compliance Policies',
    description: `Summary of active CoFounder compliance policies as of ${config.auditPeriod.endDate}`,
    collectedAt: now,
    source: 'aicofounder-policies',
    data: {
      totalPolicies: policyData.policies.length,
      policies: policyData.policies.map((p) => ({
        name: p.name,
        version: p.version,
        lastUpdated: p.lastUpdated,
        totalRules: p.rules.length,
        enabledRules: p.rules.filter((r) => r.enabled).length,
        disabledRules: p.rules.filter((r) => !r.enabled).length,
        ruleTypes: countByProp(p.rules, 'type'),
      })),
    },
  });

  // Individual policy details
  for (const policy of policyData.policies) {
    evidence.push({
      id: generateEvidenceId(`policy-${policy.id}`),
      type: 'policy' as EvidenceType,
      title: `Policy: ${policy.name}`,
      description: `Details of policy "${policy.name}" v${policy.version}`,
      collectedAt: now,
      source: 'aicofounder-policies',
      data: {
        policyId: policy.id,
        name: policy.name,
        version: policy.version,
        lastUpdated: policy.lastUpdated,
        rules: policy.rules,
      },
    });
  }

  return evidence;
}

/**
 * Collect evidence from CoFounder CI/CD scan results.
 */
function collectCIScanEvidence(
  scanData: { scans: CIScanSummary[] },
  config: CollectionConfig
): Evidence[] {
  const evidence: Evidence[] = [];
  const now = new Date().toISOString();

  // Filter scans within audit period
  const periodScans = scanData.scans.filter((scan) => {
    return scan.timestamp >= config.auditPeriod.startDate &&
      scan.timestamp <= config.auditPeriod.endDate;
  });

  // CI scan summary
  const passedScans = periodScans.filter((s) => s.passed);
  const failedScans = periodScans.filter((s) => !s.passed);

  evidence.push({
    id: generateEvidenceId('ci-summary'),
    type: 'scan_result' as EvidenceType,
    title: 'CI/CD Scan Results Summary',
    description: `Summary of CI/CD compliance scans during audit period`,
    collectedAt: now,
    source: 'aicofounder-ci-scans',
    data: {
      totalScans: periodScans.length,
      passed: passedScans.length,
      failed: failedScans.length,
      passRate: periodScans.length > 0
        ? ((passedScans.length / periodScans.length) * 100).toFixed(1) + '%'
        : 'N/A',
      totalFindings: periodScans.reduce((sum, s) => sum + s.findings, 0),
      criticalFindings: periodScans.reduce((sum, s) => sum + s.criticalFindings, 0),
      uniqueRepositories: new Set(periodScans.map((s) => s.repository)).size,
    },
  });

  // Failed scans detail
  if (failedScans.length > 0) {
    evidence.push({
      id: generateEvidenceId('ci-failures'),
      type: 'scan_result' as EvidenceType,
      title: 'Failed CI/CD Scans',
      description: `Details of failed CI/CD scans during audit period`,
      collectedAt: now,
      source: 'aicofounder-ci-scans',
      data: {
        failedScans: failedScans.map((s) => ({
          scanId: s.scanId,
          timestamp: s.timestamp,
          repository: s.repository,
          branch: s.branch,
          findings: s.findings,
          criticalFindings: s.criticalFindings,
        })),
      },
    });
  }

  return evidence;
}

/**
 * Collect evidence from CoFounder guard reports.
 */
function collectGuardReportEvidence(
  reportData: { reports: GuardReportSummary[] },
  config: CollectionConfig
): Evidence[] {
  const evidence: Evidence[] = [];
  const now = new Date().toISOString();

  // Overall guard effectiveness
  const totalChecks = reportData.reports.reduce((sum, r) => sum + r.totalChecks, 0);
  const totalViolations = reportData.reports.reduce((sum, r) => sum + r.violations, 0);
  const totalFalsePositives = reportData.reports.reduce((sum, r) => sum + r.falsePositives, 0);

  evidence.push({
    id: generateEvidenceId('guard-overview'),
    type: 'guard_report' as EvidenceType,
    title: 'Guard Effectiveness Overview',
    description: `Aggregate guard effectiveness metrics for audit period`,
    collectedAt: now,
    source: 'aicofounder-guard'',
    data: {
      totalChecks,
      totalViolations,
      totalFalsePositives,
      violationRate: totalChecks > 0
        ? ((totalViolations / totalChecks) * 100).toFixed(4) + '%'
        : '0%',
      falsePositiveRate: totalViolations > 0
        ? ((totalFalsePositives / totalViolations) * 100).toFixed(2) + '%'
        : '0%',
      guardTypes: reportData.reports.map((r) => r.guardType),
    },
  });

  // Per-guard reports
  for (const report of reportData.reports) {
    evidence.push({
      id: generateEvidenceId(`guard-${report.guardType}`),
      type: 'guard_report' as EvidenceType,
      title: `Guard Report: ${report.guardType}`,
      description: `Detailed report for ${report.guardType} guard`,
      collectedAt: now,
      source: 'aicofounder-guard'',
      data: {
        guardType: report.guardType,
        totalChecks: report.totalChecks,
        violations: report.violations,
        falsePositives: report.falsePositives,
        accuracy: report.totalChecks > 0
          ? (((report.totalChecks - report.falsePositives) / report.totalChecks) * 100).toFixed(2) + '%'
          : 'N/A',
        topFindings: report.topFindings,
      },
    });
  }

  return evidence;
}

/** Count occurrences of values for a given key in an array of objects. */
function countBy<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const value = String(item[key]);
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

/** Count occurrences of a property value in an array. */
function countByProp<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T
): Record<string, number> {
  return countBy(items, key);
}
