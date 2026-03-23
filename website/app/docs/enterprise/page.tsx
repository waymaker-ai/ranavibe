'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Building2, Shield, Users, FileCheck, Server,
  Lock, CheckCircle, ClipboardList
} from 'lucide-react';

export default function EnterprisePage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-4xl">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Docs
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Enterprise Guide</h1>
          <p className="text-lg text-foreground-secondary mb-12">
            Production-ready compliance, multi-tenancy, self-hosted deployment, and audit trail
            capabilities for regulated industries and large organizations.
          </p>
        </motion.div>

        {/* SOC2 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Shield className="mr-3 h-6 w-6 text-gradient-from" />
            SOC 2 Compliance
          </h2>
          <p className="text-foreground-secondary mb-4">
            The <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-soc2</code> package
            automates SOC 2 evidence collection and report generation. It maps CoFounder&apos;s guardrails, audit
            logs, CI scan results, and dashboard metrics to the five AICPA Trust Service Categories: Security,
            Availability, Processing Integrity, Confidentiality, and Privacy.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import {
  EvidenceCollector,
  SOC2ReportGenerator,
} from '@waymakerai/aicofounder-soc2';

// Step 1: Collect evidence from CoFounder sources
const collector = new EvidenceCollector();

// Collect from dashboard metrics
await collector.collectFromDashboard({
  totalRequests: 450000,
  blockedRequests: 1200,
  piiDetections: 3400,
  injectionAttempts: 89,
  complianceViolations: 12,
  avgResponseTime: 1200,
  uptime: 99.95,
  period: { startDate: '2025-01-01', endDate: '2025-12-31' },
});

// Collect from audit logs
await collector.collectFromAuditLog({
  timestamp: '2025-06-15T10:30:00Z',
  eventType: 'data_access',
  severity: 'info',
  actor: 'user-123',
  action: 'read',
  resource: 'agent-config',
  outcome: 'success',
  details: { ip: '10.0.0.1' },
});

// Collect from CI scans
await collector.collectFromCIScan({
  scanId: 'scan-2025-001',
  timestamp: '2025-06-15T08:00:00Z',
  repository: 'my-org/my-app',
  branch: 'main',
  passed: true,
  findings: 3,
  criticalFindings: 0,
  details: {},
});

// Collect from guard reports
await collector.collectFromGuardReport({
  guardType: 'openclaw',
  period: { startDate: '2025-01-01', endDate: '2025-12-31' },
  totalChecks: 450000,
  violations: 1200,
  falsePositives: 23,
  topFindings: [
    { type: 'pii_email', count: 2100, severity: 'high' },
    { type: 'injection_direct', count: 45, severity: 'critical' },
  ],
});

// Step 2: Generate the SOC 2 report
const generator = new SOC2ReportGenerator({
  organizationName: 'Acme Corp',
  systemName: 'AI Customer Service Platform',
  systemDescription: 'LLM-powered customer support with guardrails',
  auditPeriod: {
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
  trustServiceCategories: [
    'security',
    'availability',
    'processing_integrity',
    'confidentiality',
    'privacy',
  ],
  exportFormat: 'html',
  includeEvidence: true,
  includeTestResults: true,
  auditorName: 'Jane Doe, CPA',
  auditorFirm: 'Big Four Audit LLP',
});

const report = await generator.generate(collector.getEvidence());

console.log(report.overallStatus);     // 'effective'
console.log(report.controls.length);   // Number of controls tested
console.log(report.exceptions);        // Any control exceptions

// Export the report
await generator.exportReport(report, './reports/soc2-2025.html');`}</pre>
          </div>
        </motion.section>

        {/* Multi-tenant */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Users className="mr-3 h-6 w-6 text-gradient-from" />
            Multi-Tenant Setup
          </h2>
          <p className="text-foreground-secondary mb-4">
            The <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-multi-tenant</code> package
            provides tenant isolation for SaaS applications. Each tenant gets their own guard configuration,
            compliance rules, budget limits, and audit trail.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createMultiTenantManager } from '@waymakerai/aicofounder-multi-tenant';

const tenantManager = createMultiTenantManager({
  // Default configuration for all tenants
  defaults: {
    guard: {
      pii: 'redact',
      injectionSensitivity: 'medium',
      toxicity: 'warn',
    },
    budget: {
      limit: 100,
      period: 'month',
    },
  },
});

// Register tenants with custom configurations
await tenantManager.registerTenant({
  id: 'tenant-healthcare',
  name: 'HealthCo',
  config: {
    guard: {
      pii: 'block',                     // Stricter PII handling
      injectionSensitivity: 'high',
      compliance: ['hipaa'],
    },
    budget: {
      limit: 500,
      period: 'month',
    },
    allowedModels: ['claude-sonnet-4-20250514'],
    dataResidency: 'us-east-1',
  },
});

await tenantManager.registerTenant({
  id: 'tenant-fintech',
  name: 'FinanceApp',
  config: {
    guard: {
      pii: 'redact',
      compliance: ['sec', 'pci', 'sox'],
    },
    budget: {
      limit: 1000,
      period: 'month',
    },
    dataResidency: 'eu-west-1',
  },
});

// Get tenant-specific guard instance
const guard = tenantManager.getGuard('tenant-healthcare');
const result = await guard.check(userMessage, context);

// Get tenant-specific dashboard
const dashboard = tenantManager.getDashboard('tenant-healthcare');
const metrics = await dashboard.getSummary({ period: 'day' });

// Tenant isolation: each tenant's data is completely separate
const healthcoCost = await tenantManager.getTenantCost('tenant-healthcare');
const fintechCost = await tenantManager.getTenantCost('tenant-fintech');`}</pre>
          </div>
        </motion.section>

        {/* HIPAA Checklist */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <ClipboardList className="mr-3 h-6 w-6 text-gradient-from" />
            HIPAA Deployment Checklist
          </h2>
          <p className="text-foreground-secondary mb-4">
            When deploying AI applications that handle Protected Health Information (PHI), ensure
            all of the following CoFounder configurations are in place.
          </p>
          <div className="space-y-3">
            {[
              { item: 'PII mode set to "block" or "redact" for all PHI types', config: 'pii: \'block\'' },
              { item: 'HIPAA compliance framework enabled', config: 'compliance: [\'hipaa\']' },
              { item: 'Audit logging enabled at "verbose" level', config: 'audit: { enabled: true, level: \'verbose\' }' },
              { item: 'Data retention policy configured (max 6 years)', config: 'retention: { maxDays: 2190 }' },
              { item: 'Encryption at rest and in transit enabled', config: 'encryptAtRest: true, encryptInTransit: true' },
              { item: 'Access controls with role-based permissions', config: 'access: { requireAuth: true, allowedRoles: [...] }' },
              { item: 'BAA (Business Associate Agreement) in place with cloud providers', config: 'N/A - contractual requirement' },
              { item: 'SOC 2 report generation configured', config: '@waymakerai/aicofounder-soc2' },
              { item: 'Security monitoring alerts enabled for PHI access', config: 'alerts: [{ type: \'security\', enabled: true }]' },
              { item: 'Model output reviewed for PHI before returning to users', config: 'guardToolCalls: true (guard both input and output)' },
            ].map((check, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background-secondary">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">{check.item}</div>
                  <code className="text-xs text-foreground-secondary font-mono">{check.config}</code>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* GDPR Checklist */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <ClipboardList className="mr-3 h-6 w-6 text-gradient-from" />
            GDPR Deployment Checklist
          </h2>
          <p className="text-foreground-secondary mb-4">
            For applications processing data of EU residents, configure CoFounder to meet GDPR requirements.
          </p>
          <div className="space-y-3">
            {[
              { item: 'PII detection and redaction enabled for all personal data types', config: 'pii: \'redact\'' },
              { item: 'GDPR compliance framework enabled', config: 'compliance: [\'gdpr\']' },
              { item: 'Data subject request support (right to access, erasure, portability)', config: 'allowExport: true, allowDeletion: true' },
              { item: 'Consent tracking enabled', config: 'requireConsent: true' },
              { item: 'Purpose limitation configured', config: 'purposes: [\'customer_support\', \'analytics\']' },
              { item: 'Data retention limits set', config: 'retention: { maxDays: 365 }' },
              { item: 'EU data residency for processing and storage', config: 'dataResidency: \'eu-west-1\'' },
              { item: 'Audit trail for all data processing activities', config: 'requireAuditLog: true' },
              { item: 'Data Processing Agreement (DPA) with sub-processors', config: 'N/A - contractual requirement' },
              { item: 'Privacy impact assessment documented', config: 'N/A - organizational requirement' },
            ].map((check, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background-secondary">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">{check.item}</div>
                  <code className="text-xs text-foreground-secondary font-mono">{check.config}</code>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Audit Trail */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FileCheck className="mr-3 h-6 w-6 text-gradient-from" />
            Audit Trail Requirements
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder maintains a comprehensive audit trail of all AI interactions. Each audit entry
            records the action type, user, result, violations, timing, and metadata. Audit data feeds
            into SOC 2 evidence collection and compliance reporting.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createOpenClawSkill } from '@waymakerai/aicofounder-openclaw';

const skill = createOpenClawSkill({
  pii: 'redact',
  compliance: ['hipaa', 'gdpr'],
  audit: {
    enabled: true,
    level: 'verbose',       // 'minimal' | 'standard' | 'verbose'
    maxEntries: 100000,     // Max entries in memory (flush to storage)
  },
});

// Every guard check creates an audit entry
// AuditEntry structure:
// {
//   timestamp: 1705334400000,
//   action: 'input_guard',        // input_guard | output_guard | tool_guard | command | compliance_check
//   channel: 'web',
//   userId: 'user-123',
//   sessionId: 'sess-abc',
//   result: 'redacted',           // allowed | blocked | warned | redacted
//   violations: 2,
//   processingTimeMs: 12,
//   details: { piiTypes: ['email', 'phone'], ... }
// }

// Get audit log
const auditLog = skill.getAuditLog();
console.log(auditLog.length);         // Total entries

// Filter audit entries
const blockedEntries = auditLog.filter(
  entry => entry.result === 'blocked'
);

// Get guard report (aggregated statistics)
const report = skill.getReport();
console.log(report.totalChecks);       // 45,000
console.log(report.blocked);           // 120
console.log(report.warned);            // 340
console.log(report.passed);            // 44,540
console.log(report.redacted);          // 890
console.log(report.piiByType);         // { email: 500, phone: 200, ssn: 5, ... }
console.log(report.injectionAttempts); // 89
console.log(report.totalCost);         // $1,234.56
console.log(report.budgetRemaining);   // $765.44`}</pre>
          </div>
        </motion.section>

        {/* Self-hosted */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Server className="mr-3 h-6 w-6 text-gradient-from" />
            Self-Hosted Deployment
          </h2>
          <p className="text-foreground-secondary mb-4">
            Deploy CoFounder in air-gapped environments with local model endpoints.
            The <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-core</code> package
            includes utilities for generating Kubernetes manifests, Docker Compose files, and
            health monitoring for self-hosted deployments.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import {
  createSelfHostedManager,
  createAirGappedConfig,
} from '@waymakerai/aicofounder-core';

// Configure for air-gapped deployment
const config = createAirGappedConfig({
  localModelEndpoint: {
    id: 'local-llm',
    name: 'Local LLM (Ollama)',
    provider: 'local',
    baseUrl: 'http://localhost:11434',
    models: ['llama3', 'mistral', 'codellama'],
    capabilities: ['chat', 'completion'],
  },
  localVectorStore: {
    id: 'local-qdrant',
    provider: 'qdrant',
    endpoint: 'http://localhost:6333',
  },
  licenseKey: process.env.COFOUNDER_LICENSE_KEY,
});

const manager = createSelfHostedManager(config);

// Validate the configuration
const { valid, errors } = manager.validateConfig();
if (!valid) {
  console.error('Configuration errors:', errors);
  process.exit(1);
}

// Generate deployment manifests
const k8s = manager.generateKubernetesManifests();
// Outputs: deployment.yaml, service.yaml, configmap.yaml, secrets.yaml

const docker = manager.generateDockerCompose();
// Outputs: docker-compose.yml with all services

// Health monitoring
const health = await manager.getHealthStatus();
console.log(health.overall);        // 'healthy' | 'degraded' | 'unhealthy'
console.log(health.components);
// {
//   llm: { status: 'healthy', latency: 120 },
//   vectorStore: { status: 'healthy', latency: 5 },
//   guard: { status: 'healthy' },
//   dashboard: { status: 'healthy' },
// }`}</pre>
          </div>
        </motion.section>

        {/* Custom Compliance Rules */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Lock className="mr-3 h-6 w-6 text-gradient-from" />
            Custom Compliance Rules
          </h2>
          <p className="text-foreground-secondary mb-4">
            Beyond the built-in HIPAA, GDPR, CCPA, SEC, PCI, FERPA, and SOX presets, you can define
            custom compliance rules for industry-specific or organizational requirements.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { ComplianceEnforcer } from '@waymakerai/aicofounder-compliance';

const enforcer = new ComplianceEnforcer({
  strictMode: true,
  rules: [
    // Industry-specific: Insurance
    {
      id: 'insurance-disclaimer',
      name: 'Insurance Disclaimer Required',
      description: 'All insurance-related responses must include a disclaimer',
      category: 'custom',
      severity: 'high',
      tags: ['insurance', 'regulatory'],
      check: (input, output, context) => {
        const isInsurance = /policy|claim|premium|coverage|deductible/i.test(output);
        const hasDisclaimer = /not a guarantee|subject to terms/i.test(output);
        return {
          compliant: !isInsurance || hasDisclaimer,
          action: isInsurance && !hasDisclaimer ? 'append' : 'allow',
          replacement: isInsurance && !hasDisclaimer
            ? output + '\\n\\nDisclaimer: This information is for reference only and is not a guarantee of coverage. All policies are subject to terms and conditions.'
            : undefined,
        };
      },
    },
    // Organization-specific: Brand compliance
    {
      id: 'brand-voice',
      name: 'Brand Voice Compliance',
      description: 'AI responses must not use competitor names or banned phrases',
      category: 'custom',
      severity: 'medium',
      check: (input, output, context) => {
        const competitors = ['CompetitorA', 'CompetitorB'];
        const bannedPhrases = ['to be honest', 'as an AI'];
        const issues: string[] = [];

        competitors.forEach(c => {
          if (output.includes(c)) issues.push(\`Competitor mentioned: \${c}\`);
        });
        bannedPhrases.forEach(p => {
          if (output.toLowerCase().includes(p)) issues.push(\`Banned phrase: \${p}\`);
        });

        return {
          compliant: issues.length === 0,
          action: issues.length > 0 ? 'warn' : 'allow',
          issues,
        };
      },
    },
  ],
});`}</pre>
          </div>
        </motion.section>

        {/* Compliance Standards Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Supported Compliance Frameworks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'SOC 2', desc: 'Trust Service Categories' },
              { name: 'HIPAA', desc: 'Healthcare data protection' },
              { name: 'GDPR', desc: 'EU data privacy' },
              { name: 'CCPA', desc: 'California privacy' },
              { name: 'PCI DSS', desc: 'Payment card security' },
              { name: 'SEC', desc: 'Financial regulation' },
              { name: 'FERPA', desc: 'Education data' },
              { name: 'SOX', desc: 'Financial reporting' },
            ].map((standard) => (
              <div
                key={standard.name}
                className="p-4 rounded-lg bg-background-secondary text-center"
              >
                <Lock className="h-5 w-5 mx-auto mb-2" />
                <div className="font-semibold">{standard.name}</div>
                <div className="text-xs text-foreground-secondary mt-1">{standard.desc}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Link
            href="/docs/observability"
            className="text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Observability
          </Link>
          <Link
            href="/docs/cost-management"
            className="btn-primary px-4 py-2 inline-flex items-center"
          >
            Cost Management
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
