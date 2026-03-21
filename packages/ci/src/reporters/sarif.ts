import type { ScanResult, Finding, Severity } from '../types.js';

/** Map severity to SARIF level */
function toSarifLevel(severity: Severity): string {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
    case 'info':
      return 'note';
  }
}

/** Map severity to SARIF rank (0-100) */
function toSarifRank(severity: Severity): number {
  switch (severity) {
    case 'critical': return 95;
    case 'high': return 80;
    case 'medium': return 60;
    case 'low': return 30;
    case 'info': return 10;
  }
}

interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  defaultConfiguration: { level: string };
  properties: { 'security-severity': string };
}

interface SarifResult {
  ruleId: string;
  level: string;
  message: { text: string };
  locations: Array<{
    physicalLocation: {
      artifactLocation: { uri: string; uriBaseId: string };
      region: { startLine: number; startColumn: number };
    };
  }>;
  fixes?: Array<{
    description: { text: string };
  }>;
}

/**
 * Format scan results as SARIF 2.1.0 (Static Analysis Results Interchange Format).
 * Compatible with GitHub Security tab.
 */
export function formatSarif(result: ScanResult): string {
  // Collect unique rules from findings
  const ruleSet = new Map<string, Finding>();
  for (const f of result.findings) {
    if (!ruleSet.has(f.rule)) {
      ruleSet.set(f.rule, f);
    }
  }

  const rules: SarifRule[] = Array.from(ruleSet.entries()).map(([ruleId, sample]) => ({
    id: ruleId,
    name: ruleId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    shortDescription: { text: sample.message.split('.')[0] || sample.message },
    defaultConfiguration: { level: toSarifLevel(sample.severity) },
    properties: { 'security-severity': String(toSarifRank(sample.severity) / 10) },
  }));

  const results: SarifResult[] = result.findings.map(f => {
    const sarifResult: SarifResult = {
      ruleId: f.rule,
      level: toSarifLevel(f.severity),
      message: { text: f.message },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: f.file,
              uriBaseId: '%SRCROOT%',
            },
            region: {
              startLine: f.line,
              startColumn: f.column,
            },
          },
        },
      ],
    };

    if (f.suggestion) {
      sarifResult.fixes = [
        {
          description: { text: f.suggestion },
        },
      ];
    }

    return sarifResult;
  });

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json',
    version: '2.1.0' as const,
    runs: [
      {
        tool: {
          driver: {
            name: 'rana-ci',
            semanticVersion: '1.0.0',
            informationUri: 'https://rana.cx',
            rules,
          },
        },
        results,
        invocations: [
          {
            executionSuccessful: result.passed,
            endTimeUtc: new Date().toISOString(),
          },
        ],
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

export default formatSarif;
