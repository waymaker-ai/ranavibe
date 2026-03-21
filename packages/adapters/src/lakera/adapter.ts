/**
 * Lakera Guard adapter — converts between RANA and Lakera formats.
 */

import type {
  Adapter,
  AdapterResult,
  ExportResult,
  ImportResult,
  LakeraConfig,
  PolicyMapping,
  RanaCategory,
  Severity,
  UnifiedFinding,
} from '../types';

// ---------------------------------------------------------------------------
// Lakera category → RANA category mapping
// ---------------------------------------------------------------------------

const LAKERA_TO_RANA: Record<string, RanaCategory> = {
  prompt_injection: 'injection',
  jailbreak: 'injection',
  pii: 'pii',
  toxicity: 'toxicity',
  sexual_content: 'sexual_content',
  hate: 'hate_speech',
  violence: 'violence',
  self_harm: 'self_harm',
  profanity: 'profanity',
  unknown_links: 'harmful_content',
  relevance: 'off_topic',
};

const RANA_TO_LAKERA: Record<string, string> = {
  injection: 'prompt_injection',
  pii: 'pii',
  toxicity: 'toxicity',
  sexual_content: 'sexual_content',
  hate_speech: 'hate',
  violence: 'violence',
  self_harm: 'self_harm',
  profanity: 'profanity',
  harmful_content: 'unknown_links',
  off_topic: 'relevance',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapLakeraSeverity(score: number): Severity {
  if (score >= 0.9) return 'critical';
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  if (score >= 0.2) return 'low';
  return 'info';
}

function policyForCategory(
  policies: PolicyMapping[],
  category: RanaCategory,
): PolicyMapping | undefined {
  return policies.find((p) => p.ranaCategory === category);
}

// ---------------------------------------------------------------------------
// Lakera adapter class
// ---------------------------------------------------------------------------

class LakeraAdapter implements Adapter {
  readonly name = 'lakera';
  private readonly config: LakeraConfig;

  constructor(config: LakeraConfig) {
    this.config = {
      ...config,
      endpoint: config.endpoint ?? 'https://api.lakera.ai',
    };
  }

  /**
   * Evaluate text against Lakera Guard API.
   */
  async evaluate(text: string): Promise<AdapterResult> {
    const start = Date.now();
    const endpoint = `${this.config.endpoint}/v1/guard`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        adapter: this.name,
        passed: false,
        findings: [
          {
            source: 'lakera',
            category: 'custom',
            severity: 'critical',
            action: 'flag',
            message: `Lakera API error ${response.status}: ${body}`,
            confidence: 1,
          },
        ],
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
        raw: { status: response.status, body },
      };
    }

    const raw = (await response.json()) as LakeraRawResponse;
    const findings = this.convertRawToFindings(raw);

    return {
      adapter: this.name,
      passed: findings.every((f) => f.action !== 'block'),
      findings,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      raw,
    };
  }

  /**
   * Export RANA policies into Lakera-compatible format.
   */
  exportPolicies(): ExportResult {
    const lakeraCategories = this.config.policies
      .map((p) => {
        const lakeraName = RANA_TO_LAKERA[p.ranaCategory];
        if (!lakeraName) return null;
        return {
          category: lakeraName,
          enabled: true,
          threshold: p.threshold ?? 0.5,
          action: p.action,
        };
      })
      .filter(Boolean);

    return {
      format: 'lakera',
      data: {
        categories: lakeraCategories,
        endpoint: this.config.endpoint,
      },
      count: lakeraCategories.length,
    };
  }

  /**
   * Import raw Lakera results into RANA-normalised findings.
   */
  importResults(raw: unknown): ImportResult {
    const errors: string[] = [];
    if (!raw || typeof raw !== 'object') {
      return { imported: 0, skipped: 0, errors: ['Invalid Lakera result payload'], findings: [] };
    }

    const response = raw as LakeraRawResponse;
    const findings = this.convertRawToFindings(response);

    return {
      imported: findings.length,
      skipped: 0,
      errors,
      findings,
    };
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private convertRawToFindings(raw: LakeraRawResponse): UnifiedFinding[] {
    const findings: UnifiedFinding[] = [];

    if (raw.results && Array.isArray(raw.results)) {
      for (const result of raw.results) {
        for (const cat of result.categories ?? []) {
          const ranaCategory = LAKERA_TO_RANA[cat.name] ?? 'custom';
          const score = cat.score ?? 0;
          const severity = mapLakeraSeverity(score);
          const policy = policyForCategory(this.config.policies, ranaCategory);
          const threshold = policy?.threshold ?? 0.5;

          if (score < threshold) continue;

          findings.push({
            source: 'lakera',
            category: ranaCategory,
            severity,
            action: policy?.action ?? 'flag',
            message: `Lakera detected ${cat.name} (score: ${score.toFixed(2)})`,
            confidence: score,
            raw: cat,
          });
        }
      }
    }

    // Handle the simple flagged response format
    if (findings.length === 0 && raw.flagged) {
      findings.push({
        source: 'lakera',
        category: 'custom',
        severity: 'high',
        action: 'flag',
        message: 'Lakera flagged this content',
        confidence: 0.8,
        raw,
      });
    }

    return findings;
  }
}

// ---------------------------------------------------------------------------
// Raw response types (internal)
// ---------------------------------------------------------------------------

interface LakeraRawCategory {
  name: string;
  score?: number;
}

interface LakeraRawResult {
  categories?: LakeraRawCategory[];
  flagged?: boolean;
}

interface LakeraRawResponse {
  flagged?: boolean;
  results?: LakeraRawResult[];
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a Lakera Guard adapter.
 */
export function createLakeraAdapter(
  config: Omit<LakeraConfig, 'name' | 'enabled'> & { enabled?: boolean },
): Adapter {
  return new LakeraAdapter({
    ...config,
    name: 'lakera',
    enabled: config.enabled ?? true,
  });
}
