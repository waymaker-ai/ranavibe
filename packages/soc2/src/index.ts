/**
 * @ranavibe/soc2
 *
 * Auto-generate SOC 2 audit evidence from RANA guardrail data.
 * Zero runtime dependencies.
 */

export { generateSOC2Report } from './report-generator';
export type { GenerateOptions } from './report-generator';

export { collectEvidence } from './evidence-collector';
export type { CollectionConfig, CollectionResult } from './evidence-collector';

export {
  SOC2Controls,
  getControlsByCategory,
  getControlById,
  createControlObjective,
  getAvailableCategories,
  getControlSummary,
} from './controls';
export type { ControlDefinition } from './controls';

export {
  renderMarkdownReport,
  renderHTMLReport,
  renderEvidenceMarkdown,
  getStatusLabel,
  getCategoryLabel,
} from './templates';

export type {
  SOC2Report,
  SOC2Section,
  ControlObjective,
  Evidence,
  EvidenceType,
  TrustServiceCategory,
  AuditPeriod,
  ComplianceStatus,
  ControlTest,
  ControlTestResult,
  ReportConfig,
  ExportFormat,
  EvidenceSource,
  DashboardMetrics,
  AuditLogEntry,
  PolicySummary,
  CIScanSummary,
  GuardReportSummary,
} from './types';
