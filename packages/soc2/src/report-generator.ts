/**
 * SOC 2 report generator.
 *
 * Generates SOC 2 Type II style reports from RANA guardrail data,
 * combining control definitions, evidence, and test results into
 * a comprehensive audit document.
 */

import type {
  SOC2Report,
  SOC2Section,
  ReportConfig,
  ControlObjective,
  ControlTest,
  ControlTestResult,
  Evidence,
  ComplianceStatus,
  ExportFormat,
  EvidenceSource,
} from './types';
import { SOC2Controls, createControlObjective, getControlsByCategory } from './controls';
import type { ControlDefinition } from './controls';
import { collectEvidence, type CollectionConfig, type CollectionResult } from './evidence-collector';
import { renderMarkdownReport, renderHTMLReport } from './templates';

/** Options for the report generation process */
export interface GenerateOptions {
  evidenceSources?: EvidenceSource[];
  controlOverrides?: Record<string, Partial<ControlObjective>>;
  customTests?: ControlTest[];
}

/**
 * Generate a complete SOC 2 Type II report.
 *
 * @param config - Report configuration
 * @param options - Additional generation options
 * @returns The report in the requested format
 */
export function generateSOC2Report(
  config: ReportConfig,
  options: GenerateOptions = {}
): { report: SOC2Report; formatted: string } {
  // 1. Build controls for requested trust service categories
  const controls = buildControls(config, options);

  // 2. Collect evidence if sources provided
  let collectionResult: CollectionResult | undefined;
  if (options.evidenceSources && options.evidenceSources.length > 0) {
    const collectionConfig: CollectionConfig = {
      auditPeriod: config.auditPeriod,
      includeRawData: config.includeEvidence,
    };
    collectionResult = collectEvidence(options.evidenceSources, collectionConfig);

    // Attach evidence to controls based on source mapping
    attachEvidenceToControls(controls, collectionResult.evidence);
  }

  // 3. Build control tests
  const controlTests = buildControlTests(controls, options.customTests);

  // 4. Determine control statuses based on tests
  updateControlStatuses(controls, controlTests);

  // 5. Identify exceptions
  const exceptions = identifyExceptions(controls, controlTests);

  // 6. Determine overall status
  const overallStatus = determineOverallStatus(controls);

  // 7. Build report sections
  const sections = buildSections(config);

  // 8. Assemble report
  const report: SOC2Report = {
    id: `SOC2-${Date.now()}`,
    title: `SOC 2 Type II Report - ${config.systemName}`,
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    auditPeriod: config.auditPeriod,
    organizationName: config.organizationName,
    systemDescription: config.systemDescription,
    trustServiceCategories: config.trustServiceCategories,
    sections,
    controls,
    controlTests,
    overallStatus,
    exceptions,
    metadata: {
      generator: '@ranavibe/soc2',
      format: config.exportFormat,
      auditorName: config.auditorName,
      auditorFirm: config.auditorFirm,
      evidenceSourcesProcessed: collectionResult?.sourcesProcessed ?? 0,
      evidenceCollectionErrors: collectionResult?.errors ?? [],
    },
  };

  // 9. Format report
  const formatted = formatReport(report, config.exportFormat);

  return { report, formatted };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildControls(
  config: ReportConfig,
  options: GenerateOptions
): ControlObjective[] {
  const controls: ControlObjective[] = [];

  for (const category of config.trustServiceCategories) {
    const definitions = getControlsByCategory(category);
    for (const def of definitions) {
      const control = createControlObjective(def);

      // Apply overrides
      if (options.controlOverrides?.[def.id]) {
        Object.assign(control, options.controlOverrides[def.id]);
      }

      controls.push(control);
    }
  }

  return controls;
}

function attachEvidenceToControls(
  controls: ControlObjective[],
  evidence: Evidence[]
): void {
  // Map evidence to controls based on source and type
  const sourceMapping: Record<string, string[]> = {
    'rana-dashboard': ['CC7.2', 'A1.1', 'PI1.1'],
    'rana-audit-log': ['CC7.1', 'CC7.3', 'CC6.1', 'CC6.2', 'CC6.3'],
    'rana-policies': ['CC6.6', 'CC6.7', 'CC8.1', 'P3.1', 'P3.2', 'P6.1', 'P6.7', 'C1.1', 'C1.2'],
    'rana-ci-scans': ['CC6.8', 'CC8.1'],
    'rana-guards': ['CC6.6', 'CC6.7', 'PI1.1', 'P3.1', 'P6.1', 'C1.1'],
  };

  for (const ev of evidence) {
    const controlIds = sourceMapping[ev.source] || [];
    for (const controlId of controlIds) {
      const control = controls.find((c) => c.id === controlId);
      if (control) {
        control.evidence.push(ev);
      }
    }
  }
}

function buildControlTests(
  controls: ControlObjective[],
  customTests?: ControlTest[]
): ControlTest[] {
  const tests: ControlTest[] = [];

  // Add custom tests
  if (customTests) {
    tests.push(...customTests);
  }

  // Generate automatic tests based on evidence
  for (const control of controls) {
    const hasCustomTest = tests.some((t) => t.controlId === control.id);
    if (hasCustomTest) continue;

    // Find matching control definition for test procedure
    const definition = SOC2Controls.find((d) => d.id === control.id);
    if (!definition) continue;

    const hasEvidence = control.evidence.length > 0;

    tests.push({
      controlId: control.id,
      testDescription: `Automated evidence review for ${control.id}: ${control.title}`,
      testProcedure: definition.testProcedure,
      result: {
        passed: hasEvidence,
        details: hasEvidence
          ? `${control.evidence.length} evidence item(s) collected from ${uniqueSources(control.evidence).join(', ')}`
          : 'No evidence collected for this control',
        testedAt: new Date().toISOString(),
        sampleSize: control.evidence.length,
        exceptionsFound: 0,
      },
      evidence: control.evidence,
    });
  }

  return tests;
}

function uniqueSources(evidence: Evidence[]): string[] {
  return Array.from(new Set(evidence.map((e) => e.source)));
}

function updateControlStatuses(
  controls: ControlObjective[],
  tests: ControlTest[]
): void {
  for (const control of controls) {
    const controlTests = tests.filter((t) => t.controlId === control.id);
    if (controlTests.length === 0) {
      control.status = 'not_tested';
      continue;
    }

    const allPassed = controlTests.every((t) => t.result.passed);
    const anyExceptions = controlTests.some(
      (t) => t.result.exceptionsFound && t.result.exceptionsFound > 0
    );

    if (allPassed && !anyExceptions) {
      control.status = 'effective';
    } else if (allPassed && anyExceptions) {
      control.status = 'effective_with_exceptions';
    } else {
      control.status = 'not_effective';
    }
  }
}

function identifyExceptions(
  controls: ControlObjective[],
  tests: ControlTest[]
): SOC2Report['exceptions'] {
  const exceptions: SOC2Report['exceptions'] = [];

  for (const control of controls) {
    if (
      control.status === 'effective_with_exceptions' ||
      control.status === 'not_effective'
    ) {
      const failedTests = tests.filter(
        (t) => t.controlId === control.id && !t.result.passed
      );
      const details = failedTests.map((t) => t.result.details).join('; ');

      exceptions.push({
        controlId: control.id,
        description:
          control.status === 'not_effective'
            ? `Control ${control.id} (${control.title}) was found not effective. ${details}`
            : `Control ${control.id} (${control.title}) has exceptions. ${details}`,
        remediation:
          control.status === 'not_effective'
            ? `Implement corrective actions for ${control.title}. Ensure RANA features [${control.ranaMapping.join(', ')}] are properly configured and evidence is collected.`
            : `Address exceptions identified in ${control.title}. Review and remediate findings.`,
      });
    }
  }

  return exceptions;
}

function determineOverallStatus(controls: ControlObjective[]): ComplianceStatus {
  if (controls.length === 0) return 'not_tested';

  const statuses = controls.map((c) => c.status);

  if (statuses.every((s) => s === 'effective' || s === 'not_applicable')) {
    return 'effective';
  }
  if (statuses.some((s) => s === 'not_effective')) {
    return statuses.filter((s) => s === 'not_effective').length > controls.length / 2
      ? 'not_effective'
      : 'effective_with_exceptions';
  }
  if (statuses.some((s) => s === 'effective_with_exceptions')) {
    return 'effective_with_exceptions';
  }
  return 'not_tested';
}

function buildSections(config: ReportConfig): SOC2Section[] {
  const sections: SOC2Section[] = [];

  // Auditor information section
  if (config.auditorName || config.auditorFirm) {
    sections.push({
      id: 'auditor-info',
      title: 'Auditor Information',
      content: [
        config.auditorFirm ? `Firm: ${config.auditorFirm}` : '',
        config.auditorName ? `Auditor: ${config.auditorName}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  // Methodology section
  sections.push({
    id: 'methodology',
    title: 'Methodology',
    content:
      'This report was generated using automated evidence collection from RANA AI guardrail components. ' +
      'Evidence was gathered from dashboard metrics, audit logs, policy configurations, CI/CD scan results, ' +
      'and guard reports. Each control was evaluated against the collected evidence to determine its effectiveness.',
    subsections: [
      {
        id: 'scope',
        title: 'Scope',
        content: `The scope of this examination covers the ${config.systemName} system and its RANA guardrail controls ` +
          `for the period ${config.auditPeriod.startDate} to ${config.auditPeriod.endDate}. ` +
          `Trust service categories in scope: ${config.trustServiceCategories.join(', ')}.`,
      },
    ],
  });

  // Add custom sections
  if (config.customSections) {
    sections.push(...config.customSections);
  }

  return sections;
}

function formatReport(report: SOC2Report, format: ExportFormat): string {
  switch (format) {
    case 'markdown':
      return renderMarkdownReport(report);
    case 'html':
      return renderHTMLReport(report);
    case 'json':
      return JSON.stringify(report, null, 2);
    default:
      return JSON.stringify(report, null, 2);
  }
}
