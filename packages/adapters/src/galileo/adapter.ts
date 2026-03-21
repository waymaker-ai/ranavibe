/**
 * Galileo adapter — converts between RANA and Galileo evaluation formats.
 */

import type {
  Adapter,
  AdapterResult,
  ExportResult,
  GalileoConfig,
  ImportResult,
  PolicyMapping,
  RanaCategory,
  Severity,
  UnifiedFinding,
} from '../types';

// ---------------------------------------------------------------------------
// Galileo metric → RANA category mapping
// ---------------------------------------------------------------------------

const GALILEO_METRIC_TO_RANA: Record<string, RanaCategory> = {
  hallucination: 'hallucination',
  factuality: 'hallucination',
  groundedness: 'hallucination',
  chunk_attribution: 'hallucination',
  completeness: 'quality',
  context_adherence: 'quality',
  correctness: 'quality',
  toxicity: 'toxicity',
  pii: 'pii',
  tone: 'bias',
  sexism: 'bias',
  racism: 'hate_speech',
  prompt_injection: 'injection',
  data_leakage: 'confidential',
};

const RANA_TO_GALILEO_METRIC: Record<string, string> = {
  hallucination: 'hallucination',
  quality: 'completeness',
  toxicity: 'toxicity',
  pii: 'pii',
  bias: 'tone',
  hate_speech: 'racism',
  injection: 'prompt_injection',
  confidential: 'data_leakage',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function galileoScoreToSeverity(score: number, isInverted: boolean): Severity {
  // For hallucination/toxicity: high score = bad.
  // For quality metrics: low score = bad (inverted).
  const effectiveScore = isInverted ? 1 - score : score;
  if (effectiveScore >= 0.9) return 'critical';
  if (effectiveScore >= 0.7) return 'high';
  if (effectiveScore >= 0.4) return 'medium';
  if (effectiveScore >= 0.2) return 'low';
  return 'info';
}

/** Metrics where a HIGH score means a problem. */
const BAD_HIGH_METRICS = new Set([
  'hallucination',
  'toxicity',
  'pii',
  'sexism',
  'racism',
  'prompt_injection',
  'data_leakage',
]);

function policyForCategory(
  policies: PolicyMapping[],
  category: RanaCategory,
): PolicyMapping | undefined {
  return policies.find((p) => p.ranaCategory === category);
}

// ---------------------------------------------------------------------------
// Galileo adapter class
// ---------------------------------------------------------------------------

class GalileoAdapter implements Adapter {
  readonly name = 'galileo';
  private readonly config: GalileoConfig;

  constructor(config: GalileoConfig) {
    this.config = {
      ...config,
      consoleUrl: config.consoleUrl ?? 'https://console.galileo.ai',
    };
  }

  /**
   * Evaluate text using Galileo Protect API.
   */
  async evaluate(text: string): Promise<AdapterResult> {
    const start = Date.now();
    const endpoint = `${this.config.consoleUrl}/api/v1/protect/evaluate`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          text,
          project_name: this.config.projectName ?? 'rana-integration',
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        return {
          adapter: this.name,
          passed: false,
          findings: [
            {
              source: 'galileo',
              category: 'custom',
              severity: 'critical',
              action: 'flag',
              message: `Galileo API error ${response.status}: ${errBody}`,
              confidence: 1,
            },
          ],
          latencyMs: Date.now() - start,
          timestamp: new Date().toISOString(),
          raw: { status: response.status, body: errBody },
        };
      }

      const raw = (await response.json()) as GalileoRawResponse;
      const findings = this.convertRawToFindings(raw);

      return {
        adapter: this.name,
        passed: findings.every((f) => f.action !== 'block'),
        findings,
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
        raw,
      };
    } catch (err) {
      return {
        adapter: this.name,
        passed: false,
        findings: [
          {
            source: 'galileo',
            category: 'custom',
            severity: 'critical',
            action: 'flag',
            message: `Galileo request failed: ${err instanceof Error ? err.message : String(err)}`,
            confidence: 1,
          },
        ],
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Export RANA metrics into Galileo-compatible format.
   */
  exportPolicies(): ExportResult {
    const galileoMetrics = this.config.policies
      .map((p) => {
        const galileoMetric = RANA_TO_GALILEO_METRIC[p.ranaCategory];
        if (!galileoMetric) return null;
        return {
          metric: galileoMetric,
          threshold: p.threshold ?? 0.5,
          action: p.action,
          ranaCategory: p.ranaCategory,
        };
      })
      .filter(Boolean);

    return {
      format: 'galileo',
      data: {
        project_name: this.config.projectName ?? 'rana-integration',
        metrics: galileoMetrics,
        console_url: this.config.consoleUrl,
      },
      count: galileoMetrics.length,
    };
  }

  /**
   * Import raw Galileo evaluation results into RANA-normalised findings.
   */
  importResults(raw: unknown): ImportResult {
    if (!raw || typeof raw !== 'object') {
      return {
        imported: 0,
        skipped: 0,
        errors: ['Invalid Galileo result payload'],
        findings: [],
      };
    }

    const response = raw as GalileoRawResponse;
    const findings = this.convertRawToFindings(response);

    return {
      imported: findings.length,
      skipped: 0,
      errors: [],
      findings,
    };
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private convertRawToFindings(raw: GalileoRawResponse): UnifiedFinding[] {
    const findings: UnifiedFinding[] = [];

    for (const metric of raw.metrics ?? []) {
      const ranaCategory = GALILEO_METRIC_TO_RANA[metric.name] ?? 'custom';
      const isInverted = !BAD_HIGH_METRICS.has(metric.name);
      const severity = galileoScoreToSeverity(metric.score, isInverted);
      const policy = policyForCategory(this.config.policies, ranaCategory);
      const threshold = policy?.threshold ?? 0.5;

      // Determine whether this metric indicates a problem
      const isProblem = BAD_HIGH_METRICS.has(metric.name)
        ? metric.score >= threshold
        : metric.score < threshold;

      if (!isProblem) continue;

      findings.push({
        source: 'galileo',
        category: ranaCategory,
        severity,
        action: policy?.action ?? 'flag',
        message: `Galileo ${metric.name}: ${metric.score.toFixed(2)}${metric.explanation ? ` — ${metric.explanation}` : ''}`,
        confidence: BAD_HIGH_METRICS.has(metric.name) ? metric.score : 1 - metric.score,
        raw: metric,
      });
    }

    return findings;
  }
}

// ---------------------------------------------------------------------------
// Internal Galileo response types
// ---------------------------------------------------------------------------

interface GalileoMetric {
  name: string;
  score: number;
  explanation?: string;
}

interface GalileoRawResponse {
  metrics?: GalileoMetric[];
  status?: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a Galileo adapter.
 */
export function createGalileoAdapter(
  config: Omit<GalileoConfig, 'name' | 'enabled'> & { enabled?: boolean },
): Adapter {
  return new GalileoAdapter({
    ...config,
    name: 'galileo',
    enabled: config.enabled ?? true,
  });
}
