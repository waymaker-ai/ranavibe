# @cofounder/soc2

Auto-generate SOC 2 Type II audit evidence from CoFounder guardrail data. Zero runtime dependencies.

## Overview

This package maps CoFounder AI guardrail features to SOC 2 Trust Service Criteria and generates comprehensive audit reports with evidence collection from multiple CoFounder components.

## Features

- **19 SOC 2 controls** mapped to CoFounder guardrail features across all five Trust Service Categories
- **Automated evidence collection** from dashboard metrics, audit logs, policies, CI/CD scans, and guard reports
- **Report generation** in JSON, HTML, and Markdown formats
- **Professional formatting** with executive summaries, control test results, and exception tracking
- **Zero runtime dependencies**

## Installation

```bash
npm install @cofounder/soc2
```

## Quick Start

```typescript
import { generateSOC2Report, collectEvidence, SOC2Controls } from '@cofounder/soc2';

// Generate a SOC 2 report
const { report, formatted } = generateSOC2Report({
  organizationName: 'Acme Corp',
  systemName: 'AI Assistant Platform',
  systemDescription: 'AI-powered customer service platform with CoFounder guardrails',
  auditPeriod: {
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
  trustServiceCategories: ['security', 'privacy', 'confidentiality'],
  exportFormat: 'markdown',
  includeEvidence: true,
}, {
  evidenceSources: [
    {
      type: 'dashboard',
      data: {
        totalRequests: 1_000_000,
        blockedRequests: 1_250,
        piiDetections: 3_400,
        injectionAttempts: 89,
        complianceViolations: 12,
        avgResponseTime: 45,
        uptime: 99.97,
        period: { startDate: '2025-01-01', endDate: '2025-12-31' },
      },
    },
    {
      type: 'guard_report',
      data: {
        reports: [
          {
            guardType: 'pii-detection',
            period: { startDate: '2025-01-01', endDate: '2025-12-31' },
            totalChecks: 500_000,
            violations: 3_400,
            falsePositives: 12,
            topFindings: [
              { type: 'email', count: 1800, severity: 'medium' },
              { type: 'ssn', count: 900, severity: 'high' },
            ],
          },
        ],
      },
    },
  ],
});

console.log(formatted);
```

## Trust Service Categories

| Category | Controls | Example CoFounder Mappings |
|----------|----------|---------------------|
| Security | CC6.1-CC8.1 | Access policies, injection detection, PII redaction, audit logs |
| Availability | A1.1-A1.2 | Performance metrics, rate limiting, fallback mechanisms |
| Processing Integrity | PI1.1 | Guardrail accuracy, false positive tracking |
| Confidentiality | C1.1-C1.2 | Data classification, PII categories, log retention |
| Privacy | P3.1-P6.7 | PII policies, data retention, content validation |

## API

### `generateSOC2Report(config, options?)`

Generate a complete SOC 2 Type II report.

### `collectEvidence(sources, config)`

Collect and aggregate evidence from CoFounder data sources.

### `SOC2Controls`

Array of all SOC 2 control definitions with CoFounder feature mappings.

### `getControlsByCategory(category)`

Filter controls by Trust Service Category.

### `renderMarkdownReport(report)` / `renderHTMLReport(report)`

Render a report object into formatted output.

## License

MIT
