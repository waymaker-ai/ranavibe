import { describe, it, expect, beforeEach } from 'vitest';
import { collectEvidence } from '../evidence-collector';
import type { CollectionConfig, CollectionResult } from '../evidence-collector';
import { generateSOC2Report } from '../report-generator';
import type { GenerateOptions } from '../report-generator';
import {
  SOC2Controls,
  getControlsByCategory,
  getControlById,
  createControlObjective,
  getAvailableCategories,
  getControlSummary,
} from '../controls';
import {
  renderMarkdownReport,
  renderHTMLReport,
  renderEvidenceMarkdown,
  getStatusLabel,
  getCategoryLabel,
} from '../templates';
import type {
  SOC2Report,
  Evidence,
  ControlObjective,
  ReportConfig,
  EvidenceSource,
  DashboardMetrics,
  AuditLogEntry,
  PolicySummary,
  CIScanSummary,
  GuardReportSummary,
  TrustServiceCategory,
  ComplianceStatus,
  AuditPeriod,
} from '../types';

// =============================================================================
// Test Data Factories
// =============================================================================

const AUDIT_PERIOD: AuditPeriod = { startDate: '2025-01-01', endDate: '2025-06-30' };

function makeDashboardSource(): EvidenceSource {
  return {
    type: 'dashboard',
    data: {
      totalRequests: 100000,
      blockedRequests: 150,
      piiDetections: 45,
      injectionAttempts: 12,
      complianceViolations: 8,
      avgResponseTime: 45,
      uptime: 99.95,
      period: AUDIT_PERIOD,
    } as unknown as Record<string, unknown>,
  };
}

function makeAuditLogSource(): EvidenceSource {
  const entries: AuditLogEntry[] = [
    { timestamp: '2025-02-15', eventType: 'access', severity: 'info', actor: 'user-1', action: 'login', resource: 'api', outcome: 'success', details: {} },
    { timestamp: '2025-03-01', eventType: 'access', severity: 'warning', actor: 'user-2', action: 'login', resource: 'api', outcome: 'failure', details: { reason: 'bad password' } },
    { timestamp: '2025-03-10', eventType: 'authentication', severity: 'critical', actor: 'attacker', action: 'brute-force', resource: 'api', outcome: 'blocked', details: {} },
    { timestamp: '2025-04-01', eventType: 'configuration_change', severity: 'info', actor: 'admin-1', action: 'update-policy', resource: 'pii-policy', outcome: 'success', details: {} },
    { timestamp: '2025-05-01', eventType: 'policy_update', severity: 'info', actor: 'admin-2', action: 'enable-guard', resource: 'injection-guard', outcome: 'success', details: {} },
  ];
  return { type: 'audit_log', data: { entries } as unknown as Record<string, unknown> };
}

function makePolicySource(): EvidenceSource {
  const policies: PolicySummary[] = [
    {
      id: 'pol-1',
      name: 'PII Protection Policy',
      version: '2.1',
      lastUpdated: '2025-03-15',
      rules: [
        { type: 'pii', description: 'Detect email addresses', enabled: true },
        { type: 'pii', description: 'Detect SSNs', enabled: true },
        { type: 'redaction', description: 'Auto-redact PII', enabled: false },
      ],
    },
    {
      id: 'pol-2',
      name: 'Injection Prevention Policy',
      version: '1.5',
      lastUpdated: '2025-04-01',
      rules: [
        { type: 'injection', description: 'Block prompt injection', enabled: true },
        { type: 'injection', description: 'Detect jailbreak attempts', enabled: true },
      ],
    },
  ];
  return { type: 'policy', data: { policies } as unknown as Record<string, unknown> };
}

function makeCIScanSource(): EvidenceSource {
  const scans: CIScanSummary[] = [
    { scanId: 'scan-1', timestamp: '2025-02-01', repository: 'main-app', branch: 'main', passed: true, findings: 2, criticalFindings: 0, details: {} },
    { scanId: 'scan-2', timestamp: '2025-03-15', repository: 'main-app', branch: 'feature/auth', passed: false, findings: 5, criticalFindings: 1, details: {} },
    { scanId: 'scan-3', timestamp: '2025-04-20', repository: 'api-service', branch: 'main', passed: true, findings: 0, criticalFindings: 0, details: {} },
  ];
  return { type: 'ci_scan', data: { scans } as unknown as Record<string, unknown> };
}

function makeGuardReportSource(): EvidenceSource {
  const reports: GuardReportSummary[] = [
    {
      guardType: 'pii-detection',
      period: AUDIT_PERIOD,
      totalChecks: 50000,
      violations: 120,
      falsePositives: 15,
      topFindings: [
        { type: 'email', count: 80, severity: 'medium' },
        { type: 'ssn', count: 30, severity: 'high' },
      ],
    },
    {
      guardType: 'injection-detection',
      period: AUDIT_PERIOD,
      totalChecks: 50000,
      violations: 45,
      falsePositives: 3,
      topFindings: [
        { type: 'prompt-override', count: 30, severity: 'critical' },
        { type: 'jailbreak', count: 15, severity: 'critical' },
      ],
    },
  ];
  return { type: 'guard_report', data: { reports } as unknown as Record<string, unknown> };
}

function makeReportConfig(overrides?: Partial<ReportConfig>): ReportConfig {
  return {
    organizationName: 'Acme Corp',
    systemName: 'AI Guardrail System',
    systemDescription: 'Enterprise AI safety platform using CoFounder guardrails.',
    auditPeriod: AUDIT_PERIOD,
    trustServiceCategories: ['security', 'availability', 'processing_integrity'],
    exportFormat: 'json',
    includeEvidence: true,
    auditorName: 'Jane Auditor',
    auditorFirm: 'Big Four LLP',
    ...overrides,
  };
}

// =============================================================================
// Controls Tests
// =============================================================================

describe('SOC2Controls', () => {
  it('should define at least 15 controls', () => {
    expect(SOC2Controls.length).toBeGreaterThanOrEqual(15);
  });

  it('should have unique IDs', () => {
    const ids = SOC2Controls.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have all required fields on each control', () => {
    for (const control of SOC2Controls) {
      expect(control.id).toBeDefined();
      expect(control.title).toBeDefined();
      expect(control.description).toBeTruthy();
      expect(control.category).toBeDefined();
      expect(control.cofounderMapping.length).toBeGreaterThan(0);
      expect(control.testProcedure).toBeTruthy();
    }
  });
});

describe('getControlsByCategory()', () => {
  it('should return security controls', () => {
    const security = getControlsByCategory('security');
    expect(security.length).toBeGreaterThan(5);
    expect(security.every(c => c.category === 'security')).toBe(true);
  });

  it('should return privacy controls', () => {
    const privacy = getControlsByCategory('privacy');
    expect(privacy.length).toBeGreaterThan(0);
    expect(privacy.every(c => c.category === 'privacy')).toBe(true);
  });

  it('should return empty array for nonexistent category', () => {
    const result = getControlsByCategory('nonexistent' as TrustServiceCategory);
    expect(result).toEqual([]);
  });
});

describe('getControlById()', () => {
  it('should find CC6.1', () => {
    const control = getControlById('CC6.1');
    expect(control).toBeDefined();
    expect(control!.title).toBe('Logical Access Controls');
  });

  it('should return undefined for unknown ID', () => {
    expect(getControlById('XX99.99')).toBeUndefined();
  });
});

describe('createControlObjective()', () => {
  it('should create a ControlObjective from definition', () => {
    const def = SOC2Controls[0];
    const obj = createControlObjective(def);
    expect(obj.id).toBe(def.id);
    expect(obj.status).toBe('not_tested');
    expect(obj.evidence).toEqual([]);
    expect(obj.cofounderMapping).toEqual(def.cofounderMapping);
  });

  it('should accept custom initial status', () => {
    const def = SOC2Controls[0];
    const obj = createControlObjective(def, 'effective');
    expect(obj.status).toBe('effective');
  });
});

describe('getAvailableCategories()', () => {
  it('should return all 5 trust service categories', () => {
    const categories = getAvailableCategories();
    expect(categories).toContain('security');
    expect(categories).toContain('availability');
    expect(categories).toContain('processing_integrity');
    expect(categories).toContain('confidentiality');
    expect(categories).toContain('privacy');
  });
});

describe('getControlSummary()', () => {
  it('should return counts per category', () => {
    const summary = getControlSummary();
    expect(summary.security).toBeGreaterThan(0);
    expect(summary.privacy).toBeGreaterThan(0);
  });
});

// =============================================================================
// Evidence Collection Tests
// =============================================================================

describe('collectEvidence()', () => {
  const collectionConfig: CollectionConfig = {
    auditPeriod: AUDIT_PERIOD,
    includeRawData: false,
  };

  it('should collect dashboard evidence', () => {
    const result = collectEvidence([makeDashboardSource()], collectionConfig);
    expect(result.evidence.length).toBeGreaterThanOrEqual(4);
    expect(result.sourcesProcessed).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should include system metrics in dashboard evidence', () => {
    const result = collectEvidence([makeDashboardSource()], collectionConfig);
    const overview = result.evidence.find(e => e.title === 'System Metrics Overview');
    expect(overview).toBeDefined();
    expect((overview!.data as any).totalRequests).toBe(100000);
    expect((overview!.data as any).uptime).toBe(99.95);
  });

  it('should collect audit log evidence', () => {
    const result = collectEvidence([makeAuditLogSource()], collectionConfig);
    expect(result.evidence.length).toBeGreaterThanOrEqual(3);
    const security = result.evidence.find(e => e.title === 'Security Events Summary');
    expect(security).toBeDefined();
  });

  it('should filter audit logs by period', () => {
    const outOfPeriodEntries: AuditLogEntry[] = [
      { timestamp: '2024-01-01', eventType: 'access', severity: 'info', actor: 'old', action: 'login', resource: 'api', outcome: 'success', details: {} },
    ];
    const source: EvidenceSource = { type: 'audit_log', data: { entries: outOfPeriodEntries } as any };
    const result = collectEvidence([source], collectionConfig);
    const accessEvidence = result.evidence.find(e => e.title === 'Access Events Summary');
    if (accessEvidence) {
      expect((accessEvidence.data as any).totalEvents).toBe(0);
    }
  });

  it('should collect policy evidence', () => {
    const result = collectEvidence([makePolicySource()], collectionConfig);
    expect(result.evidence.length).toBeGreaterThanOrEqual(2);
    const summary = result.evidence.find(e => e.title === 'Active Compliance Policies');
    expect(summary).toBeDefined();
    expect((summary!.data as any).totalPolicies).toBe(2);
  });

  it('should create per-policy evidence items', () => {
    const result = collectEvidence([makePolicySource()], collectionConfig);
    const piiPolicy = result.evidence.find(e => e.title === 'Policy: PII Protection Policy');
    expect(piiPolicy).toBeDefined();
  });

  it('should collect CI scan evidence', () => {
    const result = collectEvidence([makeCIScanSource()], collectionConfig);
    const summary = result.evidence.find(e => e.title === 'CI/CD Scan Results Summary');
    expect(summary).toBeDefined();
    expect((summary!.data as any).totalScans).toBe(3);
    expect((summary!.data as any).failed).toBe(1);
  });

  it('should include failed scan details when present', () => {
    const result = collectEvidence([makeCIScanSource()], collectionConfig);
    const failures = result.evidence.find(e => e.title === 'Failed CI/CD Scans');
    expect(failures).toBeDefined();
  });

  it('should collect guard report evidence', () => {
    const result = collectEvidence([makeGuardReportSource()], collectionConfig);
    const overview = result.evidence.find(e => e.title === 'Guard Effectiveness Overview');
    expect(overview).toBeDefined();
    expect((overview!.data as any).totalChecks).toBe(100000);
  });

  it('should handle unknown source type gracefully', () => {
    const unknown: EvidenceSource = { type: 'unknown' as any, data: {} };
    const result = collectEvidence([unknown], collectionConfig);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].source).toBe('unknown');
  });

  it('should collect from all sources at once', () => {
    const sources = [
      makeDashboardSource(),
      makeAuditLogSource(),
      makePolicySource(),
      makeCIScanSource(),
      makeGuardReportSource(),
    ];
    const result = collectEvidence(sources, collectionConfig);
    expect(result.sourcesProcessed).toBe(5);
    expect(result.evidence.length).toBeGreaterThan(15);
    expect(result.errors).toHaveLength(0);
  });
});

// =============================================================================
// Report Generation Tests
// =============================================================================

describe('generateSOC2Report()', () => {
  it('should generate a basic report', () => {
    const config = makeReportConfig();
    const { report, formatted } = generateSOC2Report(config);
    expect(report.organizationName).toBe('Acme Corp');
    expect(report.id).toMatch(/^SOC2-/);
    expect(report.controls.length).toBeGreaterThan(0);
    expect(formatted).toBeTruthy();
  });

  it('should generate JSON formatted report', () => {
    const config = makeReportConfig({ exportFormat: 'json' });
    const { formatted } = generateSOC2Report(config);
    expect(() => JSON.parse(formatted)).not.toThrow();
  });

  it('should generate markdown formatted report', () => {
    const config = makeReportConfig({ exportFormat: 'markdown' });
    const { formatted } = generateSOC2Report(config);
    expect(formatted).toContain('# SOC 2 Type II Report');
    expect(formatted).toContain('Acme Corp');
  });

  it('should generate HTML formatted report', () => {
    const config = makeReportConfig({ exportFormat: 'html' });
    const { formatted } = generateSOC2Report(config);
    expect(formatted).toContain('<!DOCTYPE html>');
    expect(formatted).toContain('Acme Corp');
  });

  it('should include controls for requested categories', () => {
    const config = makeReportConfig({ trustServiceCategories: ['security'] });
    const { report } = generateSOC2Report(config);
    expect(report.controls.every(c => c.category === 'security')).toBe(true);
  });

  it('should include all 5 categories when requested', () => {
    const config = makeReportConfig({
      trustServiceCategories: ['security', 'availability', 'processing_integrity', 'confidentiality', 'privacy'],
    });
    const { report } = generateSOC2Report(config);
    const categories = new Set(report.controls.map(c => c.category));
    expect(categories.size).toBe(5);
  });

  it('should attach evidence to controls when sources provided', () => {
    const config = makeReportConfig();
    const options: GenerateOptions = {
      evidenceSources: [
        makeDashboardSource(),
        makeAuditLogSource(),
        makePolicySource(),
      ],
    };
    const { report } = generateSOC2Report(config, options);
    const withEvidence = report.controls.filter(c => c.evidence.length > 0);
    expect(withEvidence.length).toBeGreaterThan(0);
  });

  it('should generate control tests', () => {
    const config = makeReportConfig();
    const { report } = generateSOC2Report(config);
    expect(report.controlTests.length).toBeGreaterThan(0);
    for (const test of report.controlTests) {
      expect(test.controlId).toBeDefined();
      expect(test.result).toBeDefined();
      expect(test.result.testedAt).toBeTruthy();
    }
  });

  it('should determine overall status', () => {
    const config = makeReportConfig();
    const { report } = generateSOC2Report(config);
    const validStatuses: ComplianceStatus[] = ['effective', 'effective_with_exceptions', 'not_effective', 'not_tested', 'not_applicable'];
    expect(validStatuses).toContain(report.overallStatus);
  });

  it('should include auditor info in sections', () => {
    const config = makeReportConfig({ auditorName: 'Jane', auditorFirm: 'Big Four' });
    const { report } = generateSOC2Report(config);
    const auditorSection = report.sections.find(s => s.id === 'auditor-info');
    expect(auditorSection).toBeDefined();
    expect(auditorSection!.content).toContain('Big Four');
  });

  it('should include methodology section', () => {
    const config = makeReportConfig();
    const { report } = generateSOC2Report(config);
    const methodology = report.sections.find(s => s.id === 'methodology');
    expect(methodology).toBeDefined();
    expect(methodology!.subsections).toBeDefined();
  });

  it('should include metadata in report', () => {
    const config = makeReportConfig();
    const { report } = generateSOC2Report(config);
    expect(report.metadata.generator).toBe('@waymakerai/aicofounder-soc2');
  });
});

// =============================================================================
// Template Rendering Tests
// =============================================================================

describe('Templates', () => {
  describe('getStatusLabel()', () => {
    it('should return correct labels', () => {
      expect(getStatusLabel('effective')).toBe('Effective');
      expect(getStatusLabel('effective_with_exceptions')).toBe('Effective with Exceptions');
      expect(getStatusLabel('not_effective')).toBe('Not Effective');
      expect(getStatusLabel('not_tested')).toBe('Not Tested');
      expect(getStatusLabel('not_applicable')).toBe('Not Applicable');
    });
  });

  describe('getCategoryLabel()', () => {
    it('should return correct labels', () => {
      expect(getCategoryLabel('security')).toBe('Security');
      expect(getCategoryLabel('availability')).toBe('Availability');
      expect(getCategoryLabel('processing_integrity')).toBe('Processing Integrity');
      expect(getCategoryLabel('confidentiality')).toBe('Confidentiality');
      expect(getCategoryLabel('privacy')).toBe('Privacy');
    });
  });

  describe('renderEvidenceMarkdown()', () => {
    it('should render evidence items', () => {
      const evidence: Evidence[] = [
        {
          id: 'ev-1',
          type: 'metric',
          title: 'Test Evidence',
          description: 'Test description',
          collectedAt: '2025-06-01',
          source: 'test-source',
          data: { value: 42 },
        },
      ];
      const md = renderEvidenceMarkdown(evidence);
      expect(md).toContain('### Test Evidence');
      expect(md).toContain('**Type:** metric');
      expect(md).toContain('"value": 42');
    });

    it('should return placeholder for empty evidence', () => {
      const md = renderEvidenceMarkdown([]);
      expect(md).toContain('No evidence collected');
    });
  });
});
