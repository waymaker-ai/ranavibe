/**
 * Prometheus Exporter - Exposition format output
 * See: https://prometheus.io/docs/instrumenting/exposition_formats/
 */

import type {
  CostMetrics,
  SecurityMetrics,
  ComplianceMetrics,
  PerformanceMetrics,
  UsageMetrics,
} from '../types.js';

/**
 * Export metrics in Prometheus exposition format
 */
export function exportPrometheus(metrics: {
  cost?: CostMetrics;
  security?: SecurityMetrics;
  compliance?: ComplianceMetrics;
  performance?: PerformanceMetrics;
  usage?: UsageMetrics;
}): string {
  const lines: string[] = [];

  // Cost metrics
  if (metrics.cost) {
    const c = metrics.cost;
    lines.push('# HELP cofounder_cost_total_dollars Total cost in dollars');
    lines.push('# TYPE cofounder_cost_total_dollars gauge');
    lines.push(`cofounder_cost_total_dollars ${c.total}`);
    lines.push('');

    lines.push('# HELP cofounder_cost_projected_monthly_dollars Projected monthly cost in dollars');
    lines.push('# TYPE cofounder_cost_projected_monthly_dollars gauge');
    lines.push(`cofounder_cost_projected_monthly_dollars ${c.projectedMonthly}`);
    lines.push('');

    lines.push('# HELP cofounder_cost_by_provider_dollars Cost by provider in dollars');
    lines.push('# TYPE cofounder_cost_by_provider_dollars gauge');
    for (const [provider, cost] of Object.entries(c.byProvider)) {
      lines.push(`cofounder_cost_by_provider_dollars{provider="${escapeLabel(provider)}"} ${cost}`);
    }
    lines.push('');

    lines.push('# HELP cofounder_cost_by_model_dollars Cost by model in dollars');
    lines.push('# TYPE cofounder_cost_by_model_dollars gauge');
    for (const [model, cost] of Object.entries(c.byModel)) {
      lines.push(`cofounder_cost_by_model_dollars{model="${escapeLabel(model)}"} ${cost}`);
    }
    lines.push('');
  }

  // Security metrics
  if (metrics.security) {
    const s = metrics.security;
    lines.push('# HELP cofounder_security_events_total Total security events');
    lines.push('# TYPE cofounder_security_events_total counter');
    lines.push(`cofounder_security_events_total ${s.totalEvents}`);
    lines.push('');

    lines.push('# HELP cofounder_security_content_filtered_total Content filtered count');
    lines.push('# TYPE cofounder_security_content_filtered_total counter');
    lines.push(`cofounder_security_content_filtered_total ${s.contentFiltered}`);
    lines.push('');

    lines.push('# HELP cofounder_security_pii_detections PII detections by type');
    lines.push('# TYPE cofounder_security_pii_detections counter');
    for (const [piiType, count] of Object.entries(s.piiDetections)) {
      lines.push(`cofounder_security_pii_detections{type="${escapeLabel(piiType)}"} ${count}`);
    }
    lines.push('');

    lines.push('# HELP cofounder_security_injection_attempts Injection attempts by severity');
    lines.push('# TYPE cofounder_security_injection_attempts counter');
    for (const [severity, count] of Object.entries(s.injectionAttempts)) {
      lines.push(`cofounder_security_injection_attempts{severity="${escapeLabel(severity)}"} ${count}`);
    }
    lines.push('');
  }

  // Compliance metrics
  if (metrics.compliance) {
    const cm = metrics.compliance;
    lines.push('# HELP cofounder_compliance_score Compliance score percentage');
    lines.push('# TYPE cofounder_compliance_score gauge');
    lines.push(`cofounder_compliance_score ${cm.complianceScore}`);
    lines.push('');

    lines.push('# HELP cofounder_compliance_violations_total Total compliance violations');
    lines.push('# TYPE cofounder_compliance_violations_total counter');
    lines.push(`cofounder_compliance_violations_total ${cm.totalViolations}`);
    lines.push('');

    lines.push('# HELP cofounder_compliance_violations_by_framework Violations by framework');
    lines.push('# TYPE cofounder_compliance_violations_by_framework counter');
    for (const [framework, count] of Object.entries(cm.violationsByFramework)) {
      lines.push(`cofounder_compliance_violations_by_framework{framework="${escapeLabel(framework)}"} ${count}`);
    }
    lines.push('');
  }

  // Performance metrics
  if (metrics.performance) {
    const p = metrics.performance;
    lines.push('# HELP cofounder_latency_milliseconds Latency distribution in milliseconds');
    lines.push('# TYPE cofounder_latency_milliseconds histogram');
    lines.push(`cofounder_latency_milliseconds{quantile="0.5"} ${p.latency.p50}`);
    lines.push(`cofounder_latency_milliseconds{quantile="0.95"} ${p.latency.p95}`);
    lines.push(`cofounder_latency_milliseconds{quantile="0.99"} ${p.latency.p99}`);
    lines.push(`cofounder_latency_milliseconds_sum ${p.latency.avg * p.totalRequests}`);
    lines.push(`cofounder_latency_milliseconds_count ${p.totalRequests}`);
    lines.push('');

    lines.push('# HELP cofounder_throughput_rps Requests per second');
    lines.push('# TYPE cofounder_throughput_rps gauge');
    lines.push(`cofounder_throughput_rps ${p.throughput}`);
    lines.push('');

    lines.push('# HELP cofounder_error_rate Error rate percentage');
    lines.push('# TYPE cofounder_error_rate gauge');
    lines.push(`cofounder_error_rate ${p.errorRate}`);
    lines.push('');

    lines.push('# HELP cofounder_requests_total Total requests');
    lines.push('# TYPE cofounder_requests_total counter');
    lines.push(`cofounder_requests_total ${p.totalRequests}`);
    lines.push('');

    lines.push('# HELP cofounder_errors_total Total errors');
    lines.push('# TYPE cofounder_errors_total counter');
    lines.push(`cofounder_errors_total ${p.totalErrors}`);
    lines.push('');
  }

  // Usage metrics
  if (metrics.usage) {
    const u = metrics.usage;
    lines.push('# HELP cofounder_usage_requests_total Total usage requests');
    lines.push('# TYPE cofounder_usage_requests_total counter');
    lines.push(`cofounder_usage_requests_total ${u.totalRequests}`);
    lines.push('');

    lines.push('# HELP cofounder_usage_tokens_total Total tokens consumed');
    lines.push('# TYPE cofounder_usage_tokens_total counter');
    lines.push(`cofounder_usage_tokens_total ${u.totalTokens}`);
    lines.push('');

    lines.push('# HELP cofounder_usage_input_tokens_total Total input tokens');
    lines.push('# TYPE cofounder_usage_input_tokens_total counter');
    lines.push(`cofounder_usage_input_tokens_total ${u.inputTokens}`);
    lines.push('');

    lines.push('# HELP cofounder_usage_output_tokens_total Total output tokens');
    lines.push('# TYPE cofounder_usage_output_tokens_total counter');
    lines.push(`cofounder_usage_output_tokens_total ${u.outputTokens}`);
    lines.push('');

    lines.push('# HELP cofounder_usage_unique_models Number of unique models');
    lines.push('# TYPE cofounder_usage_unique_models gauge');
    lines.push(`cofounder_usage_unique_models ${u.uniqueModels.length}`);
    lines.push('');

    lines.push('# HELP cofounder_usage_unique_providers Number of unique providers');
    lines.push('# TYPE cofounder_usage_unique_providers gauge');
    lines.push(`cofounder_usage_unique_providers ${u.uniqueProviders.length}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Escape a label value for Prometheus format
 */
function escapeLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export { escapeLabel };
