/**
 * SOC 2 Trust Service Criteria controls mapped to CoFounder features.
 *
 * Each control defines a standard SOC 2 criterion, its description,
 * and how CoFounder guardrails provide evidence for that criterion.
 */

import type { ControlObjective, TrustServiceCategory, ComplianceStatus } from './types';

/** Definition of a SOC 2 control with its CoFounder feature mapping */
export interface ControlDefinition {
  id: string;
  criteria: string;
  title: string;
  description: string;
  category: TrustServiceCategory;
  cofounderMapping: string[];
  cofounderMappingDescription: string;
  testProcedure: string;
}

/**
 * SOC 2 Trust Service Criteria controls relevant to AI systems,
 * mapped to CoFounder guardrail features.
 */
export const SOC2Controls: ControlDefinition[] = [
  // --- Security (Common Criteria) ---
  {
    id: 'CC6.1',
    criteria: 'CC6.1',
    title: 'Logical Access Controls',
    description:
      'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events.',
    category: 'security',
    cofounderMapping: ['access-policies', 'api-key-auth', 'role-based-access'],
    cofounderMappingDescription:
      'CoFounder enforces API key authentication, role-based access controls on policy management, and scoped access to guardrail configurations.',
    testProcedure:
      'Review CoFounder access policies, verify API key requirements, confirm role assignments for policy administration.',
  },
  {
    id: 'CC6.2',
    criteria: 'CC6.2',
    title: 'User Authentication',
    description:
      'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.',
    category: 'security',
    cofounderMapping: ['api-key-management', 'user-registration'],
    cofounderMappingDescription:
      'CoFounder manages API key lifecycle including generation, rotation, and revocation. All users must be registered before accessing guardrail services.',
    testProcedure:
      'Review API key issuance process, verify key rotation policies, confirm deprovisioning procedures.',
  },
  {
    id: 'CC6.3',
    criteria: 'CC6.3',
    title: 'Access Authorization',
    description:
      'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles.',
    category: 'security',
    cofounderMapping: ['policy-permissions', 'guardrail-scoping'],
    cofounderMappingDescription:
      'CoFounder policies define which guardrails apply to which contexts. Access to modify policies is restricted by role.',
    testProcedure:
      'Review policy permission model, verify role-based access to guardrail configuration, test unauthorized access attempts.',
  },
  {
    id: 'CC6.6',
    criteria: 'CC6.6',
    title: 'Security Measures Against Threats',
    description:
      'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.',
    category: 'security',
    cofounderMapping: ['injection-detection', 'content-filtering', 'prompt-guard'],
    cofounderMappingDescription:
      'CoFounder provides injection detection guardrails that identify and block prompt injection, jailbreak attempts, and malicious payloads in real time.',
    testProcedure:
      'Review injection detection rules, test with known attack patterns, verify blocking actions and alert generation.',
  },
  {
    id: 'CC6.7',
    criteria: 'CC6.7',
    title: 'Restriction of Data Transmission',
    description:
      'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes.',
    category: 'security',
    cofounderMapping: ['pii-detection', 'data-redaction', 'output-filtering'],
    cofounderMappingDescription:
      'CoFounder PII detection guardrails identify and redact sensitive data before it is transmitted to LLMs or returned in responses.',
    testProcedure:
      'Review PII detection configuration, test with sample PII data, verify redaction occurs before transmission.',
  },
  {
    id: 'CC6.8',
    criteria: 'CC6.8',
    title: 'Prevention of Unauthorized Software',
    description:
      'The entity implements controls to prevent or detect and act upon the introduction of unauthorized changes to software.',
    category: 'security',
    cofounderMapping: ['ci-cd-scanning', 'policy-validation'],
    cofounderMappingDescription:
      'CoFounder CI/CD integration scans code changes for policy violations before deployment. Policy changes require validation.',
    testProcedure:
      'Review CI/CD scan configuration, verify scan execution on code changes, confirm policy validation workflow.',
  },
  // --- Monitoring ---
  {
    id: 'CC7.1',
    criteria: 'CC7.1',
    title: 'Detection of Unauthorized Activities',
    description:
      'The entity uses detection and monitoring procedures to identify changes to configurations and new vulnerabilities.',
    category: 'security',
    cofounderMapping: ['audit-logs', 'violation-tracking', 'alert-system'],
    cofounderMappingDescription:
      'CoFounder maintains comprehensive audit logs of all guardrail evaluations, policy violations, and configuration changes with full traceability.',
    testProcedure:
      'Review audit log completeness, verify violation tracking, confirm alert triggers for security events.',
  },
  {
    id: 'CC7.2',
    criteria: 'CC7.2',
    title: 'Monitoring of System Components',
    description:
      'The entity monitors system components and the operation of those components for anomalies.',
    category: 'security',
    cofounderMapping: ['dashboard-metrics', 'real-time-alerts', 'health-monitoring'],
    cofounderMappingDescription:
      'CoFounder dashboard provides real-time metrics on guardrail performance, request volumes, violation rates, and system health.',
    testProcedure:
      'Review dashboard metrics, verify alert thresholds, confirm monitoring coverage of all guardrail components.',
  },
  {
    id: 'CC7.3',
    criteria: 'CC7.3',
    title: 'Evaluation of Security Events',
    description:
      'The entity evaluates identified security events and determines whether they constitute security incidents.',
    category: 'security',
    cofounderMapping: ['violation-classification', 'severity-assessment', 'incident-workflow'],
    cofounderMappingDescription:
      'CoFounder classifies violations by severity, enables investigation through detailed audit trails, and supports incident response workflows.',
    testProcedure:
      'Review violation classification criteria, verify severity assessment accuracy, confirm incident escalation procedures.',
  },
  // --- Change Management ---
  {
    id: 'CC8.1',
    criteria: 'CC8.1',
    title: 'Change Management',
    description:
      'The entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes to infrastructure and software.',
    category: 'security',
    cofounderMapping: ['policy-versioning', 'ci-cd-scans', 'change-audit-trail'],
    cofounderMappingDescription:
      'CoFounder policies are versioned with full change history. CI/CD scans validate changes before deployment. All modifications are logged.',
    testProcedure:
      'Review policy version history, verify CI/CD scan results, confirm change approval workflow and audit trail.',
  },
  // --- Availability ---
  {
    id: 'A1.1',
    criteria: 'A1.1',
    title: 'System Availability Commitments',
    description:
      'The entity maintains, monitors, and evaluates current processing capacity and use of system components to manage capacity demand.',
    category: 'availability',
    cofounderMapping: ['performance-metrics', 'capacity-monitoring', 'rate-limiting'],
    cofounderMappingDescription:
      'CoFounder monitors guardrail processing capacity, tracks response times, and supports rate limiting to manage demand.',
    testProcedure:
      'Review capacity metrics, verify rate limiting configuration, confirm performance SLA compliance.',
  },
  {
    id: 'A1.2',
    criteria: 'A1.2',
    title: 'Environmental Protections',
    description:
      'The entity authorizes, designs, develops, implements, operates, approves, maintains, and monitors environmental protections.',
    category: 'availability',
    cofounderMapping: ['fallback-mechanisms', 'graceful-degradation'],
    cofounderMappingDescription:
      'CoFounder guardrails support fallback mechanisms when primary detection fails and graceful degradation under high load.',
    testProcedure:
      'Test fallback behavior when primary guardrails are unavailable, verify graceful degradation under load.',
  },
  // --- Processing Integrity ---
  {
    id: 'PI1.1',
    criteria: 'PI1.1',
    title: 'Processing Accuracy',
    description:
      'The entity implements policies and procedures over system processing to result in products, services, and reporting to meet objectives.',
    category: 'processing_integrity',
    cofounderMapping: ['guardrail-accuracy', 'false-positive-tracking', 'validation-rules'],
    cofounderMappingDescription:
      'CoFounder tracks guardrail accuracy metrics including false positive/negative rates and provides validation rules for content processing.',
    testProcedure:
      'Review accuracy metrics, analyze false positive rates, verify validation rule effectiveness.',
  },
  // --- Confidentiality ---
  {
    id: 'C1.1',
    criteria: 'C1.1',
    title: 'Confidential Information Identification',
    description:
      'The entity identifies and maintains confidential information to meet the entity\'s objectives related to confidentiality.',
    category: 'confidentiality',
    cofounderMapping: ['data-classification', 'pii-categories', 'sensitivity-levels'],
    cofounderMappingDescription:
      'CoFounder classifies data by sensitivity level, identifies PII categories, and applies appropriate guardrails based on classification.',
    testProcedure:
      'Review data classification rules, verify PII category coverage, confirm sensitivity-based guardrail application.',
  },
  {
    id: 'C1.2',
    criteria: 'C1.2',
    title: 'Confidential Information Disposal',
    description:
      'The entity disposes of confidential information to meet the entity\'s objectives related to confidentiality.',
    category: 'confidentiality',
    cofounderMapping: ['data-redaction', 'log-retention-policies', 'data-minimization'],
    cofounderMappingDescription:
      'CoFounder redacts sensitive data in transit, enforces log retention policies, and supports data minimization principles.',
    testProcedure:
      'Review redaction effectiveness, verify log retention enforcement, confirm data minimization practices.',
  },
  // --- Privacy ---
  {
    id: 'P3.1',
    criteria: 'P3.1',
    title: 'Personal Information Collection',
    description:
      'Personal information is collected consistent with the entity\'s objectives related to privacy.',
    category: 'privacy',
    cofounderMapping: ['pii-policies', 'consent-tracking', 'collection-limits'],
    cofounderMappingDescription:
      'CoFounder PII detection policies define what personal information is identified and how it is handled, supporting collection limitation principles.',
    testProcedure:
      'Review PII policy configuration, verify collection limitation rules, confirm consent tracking mechanisms.',
  },
  {
    id: 'P3.2',
    criteria: 'P3.2',
    title: 'Data Retention',
    description:
      'The entity retains personal information consistent with the entity\'s objectives related to privacy.',
    category: 'privacy',
    cofounderMapping: ['data-retention-rules', 'log-expiration', 'purge-policies'],
    cofounderMappingDescription:
      'CoFounder supports configurable data retention rules for audit logs and detected PII, with automated purge capabilities.',
    testProcedure:
      'Review data retention configuration, verify log expiration enforcement, confirm purge policy execution.',
  },
  {
    id: 'P6.1',
    criteria: 'P6.1',
    title: 'Data Quality',
    description:
      'The entity collects and maintains accurate, up-to-date, complete, and relevant personal information.',
    category: 'privacy',
    cofounderMapping: ['content-validation', 'data-accuracy-checks', 'quality-metrics'],
    cofounderMappingDescription:
      'CoFounder content validation guardrails ensure data quality by checking completeness and accuracy of processed content.',
    testProcedure:
      'Review content validation rules, verify data quality metrics, confirm accuracy of guardrail assessments.',
  },
  {
    id: 'P6.7',
    criteria: 'P6.7',
    title: 'Data Disclosure',
    description:
      'The entity discloses personal information to third parties only for the purposes identified in the notice.',
    category: 'privacy',
    cofounderMapping: ['output-filtering', 'third-party-data-controls', 'disclosure-policies'],
    cofounderMappingDescription:
      'CoFounder output filtering prevents unauthorized disclosure of personal information to LLM providers and downstream consumers.',
    testProcedure:
      'Review output filtering rules, verify third-party data controls, confirm disclosure policy enforcement.',
  },
];

/**
 * Get controls filtered by trust service category.
 */
export function getControlsByCategory(category: TrustServiceCategory): ControlDefinition[] {
  return SOC2Controls.filter((c) => c.category === category);
}

/**
 * Get a specific control by its ID.
 */
export function getControlById(id: string): ControlDefinition | undefined {
  return SOC2Controls.find((c) => c.id === id);
}

/**
 * Create a ControlObjective from a ControlDefinition with initial status.
 */
export function createControlObjective(
  definition: ControlDefinition,
  status: ComplianceStatus = 'not_tested'
): ControlObjective {
  return {
    id: definition.id,
    criteria: definition.criteria,
    title: definition.title,
    description: definition.description,
    category: definition.category,
    cofounderMapping: definition.cofounderMapping,
    evidence: [],
    status,
    notes: definition.cofounderMappingDescription,
  };
}

/**
 * Get all unique trust service categories represented in the controls.
 */
export function getAvailableCategories(): TrustServiceCategory[] {
  const categories = new Set(SOC2Controls.map((c) => c.category));
  return Array.from(categories);
}

/**
 * Get a summary of controls by category.
 */
export function getControlSummary(): Record<TrustServiceCategory, number> {
  const summary: Record<string, number> = {};
  for (const control of SOC2Controls) {
    summary[control.category] = (summary[control.category] || 0) + 1;
  }
  return summary as Record<TrustServiceCategory, number>;
}
