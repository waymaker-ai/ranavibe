/**
 * @waymakerai/aicofounder-soc2 - Type definitions for SOC 2 audit evidence generation
 */

/** Trust Service Categories as defined by AICPA */
export type TrustServiceCategory =
  | 'security'
  | 'availability'
  | 'processing_integrity'
  | 'confidentiality'
  | 'privacy';

/** Status of a compliance control */
export type ComplianceStatus =
  | 'effective'
  | 'effective_with_exceptions'
  | 'not_effective'
  | 'not_tested'
  | 'not_applicable';

/** Types of evidence that can be collected */
export type EvidenceType =
  | 'configuration'
  | 'log'
  | 'metric'
  | 'policy'
  | 'scan_result'
  | 'guard_report'
  | 'screenshot'
  | 'attestation';

/** Export format for generated reports */
export type ExportFormat = 'json' | 'html' | 'markdown';

/** Defines the audit period for a SOC 2 report */
export interface AuditPeriod {
  startDate: string;
  endDate: string;
  description?: string;
}

/** A piece of evidence supporting a control objective */
export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  collectedAt: string;
  source: string;
  data: Record<string, unknown>;
  attachments?: string[];
}

/** A single control objective within a trust service category */
export interface ControlObjective {
  id: string;
  criteria: string;
  title: string;
  description: string;
  category: TrustServiceCategory;
  cofounderMapping: string[];
  evidence: Evidence[];
  status: ComplianceStatus;
  notes?: string;
}

/** Result of testing a specific control */
export interface ControlTestResult {
  passed: boolean;
  details: string;
  testedAt: string;
  sampleSize?: number;
  exceptionsFound?: number;
}

/** A control test linking a control objective to its test results */
export interface ControlTest {
  controlId: string;
  testDescription: string;
  testProcedure: string;
  result: ControlTestResult;
  evidence: Evidence[];
}

/** A section of the SOC 2 report */
export interface SOC2Section {
  id: string;
  title: string;
  content: string;
  subsections?: SOC2Section[];
}

/** The complete SOC 2 report */
export interface SOC2Report {
  id: string;
  title: string;
  version: string;
  generatedAt: string;
  auditPeriod: AuditPeriod;
  organizationName: string;
  systemDescription: string;
  trustServiceCategories: TrustServiceCategory[];
  sections: SOC2Section[];
  controls: ControlObjective[];
  controlTests: ControlTest[];
  overallStatus: ComplianceStatus;
  exceptions: Array<{
    controlId: string;
    description: string;
    remediation: string;
    remediationDate?: string;
  }>;
  metadata: Record<string, unknown>;
}

/** Configuration for generating a SOC 2 report */
export interface ReportConfig {
  organizationName: string;
  systemName: string;
  systemDescription: string;
  auditPeriod: AuditPeriod;
  trustServiceCategories: TrustServiceCategory[];
  exportFormat: ExportFormat;
  includeEvidence?: boolean;
  includeTestResults?: boolean;
  auditorName?: string;
  auditorFirm?: string;
  customSections?: SOC2Section[];
}

/** Data sources for evidence collection */
export interface EvidenceSource {
  type: 'dashboard' | 'audit_log' | 'policy' | 'ci_scan' | 'guard_report';
  data: Record<string, unknown>;
}

/** Aggregated dashboard metrics for a period */
export interface DashboardMetrics {
  totalRequests: number;
  blockedRequests: number;
  piiDetections: number;
  injectionAttempts: number;
  complianceViolations: number;
  avgResponseTime: number;
  uptime: number;
  period: AuditPeriod;
}

/** Audit log entry */
export interface AuditLogEntry {
  timestamp: string;
  eventType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  actor: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'blocked';
  details: Record<string, unknown>;
}

/** Policy document summary */
export interface PolicySummary {
  id: string;
  name: string;
  version: string;
  lastUpdated: string;
  rules: Array<{
    type: string;
    description: string;
    enabled: boolean;
  }>;
}

/** CI scan result summary */
export interface CIScanSummary {
  scanId: string;
  timestamp: string;
  repository: string;
  branch: string;
  passed: boolean;
  findings: number;
  criticalFindings: number;
  details: Record<string, unknown>;
}

/** Guard report summary */
export interface GuardReportSummary {
  guardType: string;
  period: AuditPeriod;
  totalChecks: number;
  violations: number;
  falsePositives: number;
  topFindings: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
}
