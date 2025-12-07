'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Users,
  FileCheck,
  Server,
  Activity,
  Building2,
  Lock,
  Key,
} from 'lucide-react';

const features = [
  {
    icon: Key,
    title: 'SSO/SAML Authentication',
    description: 'Enterprise single sign-on with SAML 2.0 and OIDC support',
    code: `import { createSSOManager } from '@rana/core';

const sso = createSSOManager({
  providers: [{
    name: 'okta',
    type: 'saml',
    enabled: true,
    config: {
      entityId: 'https://your-app.com/saml',
      assertionConsumerServiceUrl: 'https://your-app.com/saml/acs',
      idpMetadataUrl: 'https://your-okta.okta.com/app/.../sso/saml/metadata'
    },
    jitProvisioning: true,  // Auto-create users
    defaultRoles: ['developer']
  }]
});

// Initiate login
const { redirectUrl } = await sso.initiateLogin('okta');

// Handle callback
const result = await sso.handleCallback('okta', callbackData);
if (result.success) {
  console.log(result.user);     // Authenticated user
  console.log(result.session);  // Session token
}`,
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    description: 'Fine-grained permissions with roles, policies, and audit logging',
    code: `import { createRBACManager, SYSTEM_ROLES } from '@rana/core';

const rbac = createRBACManager({
  defaultDenyAll: true,
  enableAuditLog: true
});

// Built-in roles: super_admin, admin, developer, analyst, viewer

// Create custom role
await rbac.createRole({
  name: 'ml_engineer',
  permissions: ['agents:*', 'prompts:*', 'models:read'],
  inherits: ['developer']  // Inherit from other roles
});

// Assign role to user
await rbac.assignRole(userId, 'ml_engineer', {
  scope: 'team:ml-team',
  expiresAt: new Date('2025-12-31')
});

// Check access
const result = await rbac.checkAccess(
  { userId, roles: ['ml_engineer'] },
  'execute',
  { type: 'agent', id: 'agent-123' }
);

if (!result.allowed) {
  console.log(result.reason);  // Why access was denied
}`,
  },
  {
    icon: FileCheck,
    title: 'Compliance Reporting',
    description: 'SOC 2, GDPR, HIPAA compliance with audit trails and data management',
    code: `import { createComplianceManager } from '@rana/core';

const compliance = createComplianceManager({
  standards: ['soc2', 'gdpr', 'hipaa'],
  enableRealTimeMonitoring: true,
  onViolation: async (finding) => {
    await notifySecurityTeam(finding);
  }
});

// Log audit events
await compliance.logEvent({
  eventType: 'data_access',
  actor: { id: userId, type: 'user' },
  action: 'read',
  resource: { type: 'agent', id: 'agent-123' },
  outcome: 'success'
});

// Handle GDPR data subject requests
const request = await compliance.createDataSubjectRequest({
  type: 'erasure',  // or 'access', 'portability'
  subjectId: userId,
  subjectEmail: 'user@example.com'
});

await compliance.processDataSubjectRequest(request.id);

// Generate compliance report
const report = await compliance.generateReport('soc2', {
  start: new Date('2024-01-01'),
  end: new Date('2024-12-31')
});`,
  },
  {
    icon: Server,
    title: 'Self-Hosted Deployment',
    description: 'Air-gapped deployment with custom model endpoints and local infrastructure',
    code: `import {
  createSelfHostedManager,
  createAirGappedConfig
} from '@rana/core';

// Air-gapped configuration
const config = createAirGappedConfig({
  localModelEndpoint: {
    id: 'local-llm',
    name: 'Local LLM',
    provider: 'local',
    baseUrl: 'http://localhost:11434',
    models: ['llama3', 'mistral'],
    capabilities: ['chat', 'completion']
  },
  localVectorStore: {
    id: 'local-qdrant',
    provider: 'qdrant',
    endpoint: 'http://localhost:6333'
  },
  licenseKey: process.env.RANA_LICENSE_KEY
});

const selfHosted = createSelfHostedManager(config);

// Validate configuration
const { valid, errors } = selfHosted.validateConfig();

// Generate Kubernetes manifests
const k8sManifests = selfHosted.generateKubernetesManifests();

// Generate Docker Compose
const dockerCompose = selfHosted.generateDockerCompose();

// Health monitoring
const health = await selfHosted.getHealthStatus();
console.log(health.overall);     // 'healthy' | 'degraded' | 'unhealthy'
console.log(health.components);  // Individual component status`,
  },
  {
    icon: Activity,
    title: 'SLA Support',
    description: 'SLO monitoring, error budgets, alerting, and SLA reporting',
    code: `import { createSLAManager, SLA_TEMPLATES } from '@rana/core';

const sla = createSLAManager({
  slas: [{
    ...SLA_TEMPLATES.gold,
    id: 'customer-sla',
    customerId: 'customer-123',
    effectiveDate: new Date()
  }],
  alertRules: [{
    id: 'availability-alert',
    name: 'Availability Below Target',
    sloId: 'availability',
    condition: 'below_target',
    severity: 'critical',
    channels: [{
      type: 'slack',
      config: { webhook: process.env.SLACK_WEBHOOK }
    }]
  }]
});

// Record metrics
await sla.recordAvailability('availability', true);
await sla.recordLatency('latency-p99', responseTime);

// Get SLO status
const status = await sla.getSLOStatus('availability');
console.log(status.current);           // 99.95
console.log(status.target);            // 99.9
console.log(status.errorBudgetRemaining); // 85%

// Generate SLA report
const report = await sla.generateReport('customer-sla', {
  start: startOfMonth,
  end: endOfMonth
});

// Start monitoring
sla.startMonitoring();`,
  },
];

export default function EnterprisePage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Enterprise Features</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Production-ready enterprise capabilities: SSO, RBAC, compliance,
            self-hosted deployment, and SLA support.
          </p>
        </motion.div>

        {/* Enterprise Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 p-6 rounded-lg border border-foreground/10 bg-gradient-subtle"
        >
          <div className="flex items-center gap-4">
            <Shield className="h-12 w-12" />
            <div>
              <h2 className="text-xl font-bold">Enterprise License Required</h2>
              <p className="text-foreground-secondary">
                Enterprise features require a license. Contact us for pricing and a free trial.
              </p>
            </div>
            <Link
              href="/contact"
              className="ml-auto btn-primary whitespace-nowrap"
            >
              Contact Sales
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 1) * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Compliance Standards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-6">Supported Compliance Standards</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['SOC 2', 'GDPR', 'HIPAA', 'PCI DSS', 'ISO 27001', 'CCPA'].map((standard) => (
              <div
                key={standard}
                className="p-4 rounded-lg bg-background-secondary text-center"
              >
                <Lock className="h-6 w-6 mx-auto mb-2" />
                <span className="font-semibold">{standard}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SLA Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 card"
        >
          <h2 className="text-2xl font-bold mb-6">Pre-defined SLA Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Platinum', availability: '99.99%', latency: '100ms', color: 'text-blue-400' },
              { name: 'Gold', availability: '99.9%', latency: '200ms', color: 'text-yellow-400' },
              { name: 'Silver', availability: '99.5%', latency: '500ms', color: 'text-gray-400' },
              { name: 'Bronze', availability: '99%', latency: '-', color: 'text-orange-400' },
            ].map((tier) => (
              <div key={tier.name} className="p-4 rounded-lg bg-background-secondary">
                <h3 className={`font-bold text-lg mb-2 ${tier.color}`}>{tier.name}</h3>
                <div className="text-sm space-y-1 text-foreground-secondary">
                  <div>Availability: {tier.availability}</div>
                  <div>P99 Latency: {tier.latency}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
