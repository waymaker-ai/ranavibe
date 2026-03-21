import type { GuardReport, Violation } from '../types.js';

export interface ComplianceReportData {
  totalViolations: number;
  byFramework: Record<string, number>;
  bySeverity: Record<string, number>;
  complianceScore: number;
  recommendations: string[];
}

export function generateComplianceReport(report: GuardReport, violations: Violation[] = []): ComplianceReportData {
  const bySeverity: Record<string, number> = {};

  for (const v of violations) {
    bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
  }

  const totalChecks = report.totalRequests * 2; // input + output
  const violationRate = totalChecks > 0 ? report.complianceViolations / totalChecks : 0;
  const complianceScore = Math.max(0, Math.round((1 - violationRate) * 100));

  const recommendations: string[] = [];
  if (report.complianceViolations > 0) {
    recommendations.push('Review and address all compliance violations before production deployment.');
  }
  if (bySeverity['critical'] > 0) {
    recommendations.push(`URGENT: ${bySeverity['critical']} critical violations require immediate attention.`);
  }
  for (const [fw, count] of Object.entries(report.complianceByFramework)) {
    if (count > 5) {
      recommendations.push(`${fw} framework has ${count} violations - consider additional training or stricter guardrails.`);
    }
  }

  return {
    totalViolations: report.complianceViolations,
    byFramework: report.complianceByFramework,
    bySeverity,
    complianceScore,
    recommendations,
  };
}

export function formatComplianceReport(data: ComplianceReportData): string {
  const lines = [
    '=== RANA Compliance Report ===',
    '',
    `Compliance Score:    ${data.complianceScore}%`,
    `Total Violations:    ${data.totalViolations}`,
    '',
  ];

  if (Object.keys(data.byFramework).length > 0) {
    lines.push('By Framework:');
    for (const [fw, count] of Object.entries(data.byFramework)) {
      lines.push(`  ${fw.padEnd(20)} ${count} violations`);
    }
    lines.push('');
  }

  if (Object.keys(data.bySeverity).length > 0) {
    lines.push('By Severity:');
    for (const [sev, count] of Object.entries(data.bySeverity)) {
      lines.push(`  ${sev.padEnd(20)} ${count}`);
    }
    lines.push('');
  }

  if (data.recommendations.length > 0) {
    lines.push('Recommendations:');
    for (const rec of data.recommendations) {
      lines.push(`  - ${rec}`);
    }
  }

  return lines.join('\n');
}
