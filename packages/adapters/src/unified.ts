/**
 * Unified adapter — runs CoFounder policies alongside enterprise adapters and
 * merges all findings into a single result.
 */

import type {
  Adapter,
  AdapterResult,
  PolicyMapping,
  RanaAction,
  RanaCategory,
  CoFounderPolicyConfig,
  UnifiedAdapterConfig,
  UnifiedFinding,
} from './types';
import { createLakeraAdapter } from './lakera/adapter';
import { createBedrockAdapter } from './bedrock/adapter';
import { createGalileoAdapter } from './galileo/adapter';

// ---------------------------------------------------------------------------
// Built-in CoFounder "local" evaluator (lightweight pattern checks)
// ---------------------------------------------------------------------------

const PII_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { label: 'Email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
  { label: 'Phone', pattern: /\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { label: 'Credit Card', pattern: /\b(?:\d[ -]*?){13,19}\b/g },
  { label: 'IP Address', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
];

const INJECTION_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Ignore instructions', pattern: /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi },
  { label: 'System prompt leak', pattern: /(?:reveal|show|display|print|output)\s+(?:your\s+)?(?:system\s+)?prompt/gi },
  { label: 'Role override', pattern: /you\s+are\s+now\s+(?:a|an|the)\s+/gi },
  { label: 'DAN jailbreak', pattern: /\bDAN\b.*\b(?:Do\s+Anything\s+Now|jailbreak)\b/gi },
];

function runLocalRana(text: string, policies: CoFounderPolicyConfig): UnifiedFinding[] {
  const findings: UnifiedFinding[] = [];

  if (policies.pii && policies.pii !== 'allow') {
    for (const { label, pattern } of PII_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          findings.push({
            source: 'cofounder',
            category: 'pii',
            severity: 'high',
            action: policies.pii,
            message: `PII detected: ${label} ("${match}")`,
            confidence: 0.9,
          });
        }
      }
    }
  }

  if (policies.injection && policies.injection !== 'allow') {
    for (const { label, pattern } of INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        findings.push({
          source: 'cofounder',
          category: 'injection',
          severity: 'critical',
          action: policies.injection,
          message: `Prompt injection detected: ${label}`,
          confidence: 0.85,
        });
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Unified adapter
// ---------------------------------------------------------------------------

export interface UnifiedResult {
  /** Whether all evaluations passed (no blocking findings) */
  passed: boolean;
  /** Combined findings from all adapters */
  findings: UnifiedFinding[];
  /** Per-adapter results */
  adapterResults: AdapterResult[];
  /** Total latency in milliseconds */
  totalLatencyMs: number;
  /** ISO 8601 timestamp */
  timestamp: string;
}

class UnifiedAdapter {
  private readonly config: UnifiedAdapterConfig;
  private readonly adapters: Adapter[] = [];

  constructor(config: UnifiedAdapterConfig) {
    this.config = config;

    if (config.lakera) {
      this.adapters.push(
        createLakeraAdapter({
          apiKey: config.lakera.apiKey,
          endpoint: config.lakera.endpoint,
          categories: config.lakera.categories,
          policies: config.lakera.policies ?? [],
        }),
      );
    }

    if (config.bedrock) {
      this.adapters.push(
        createBedrockAdapter({
          region: config.bedrock.region,
          guardrailId: config.bedrock.guardrailId,
          guardrailVersion: config.bedrock.guardrailVersion,
          accessKeyId: config.bedrock.accessKeyId,
          secretAccessKey: config.bedrock.secretAccessKey,
          sessionToken: config.bedrock.sessionToken,
          policies: config.bedrock.policies ?? [],
        }),
      );
    }

    if (config.galileo) {
      this.adapters.push(
        createGalileoAdapter({
          apiKey: config.galileo.apiKey,
          consoleUrl: config.galileo.consoleUrl,
          projectName: config.galileo.projectName,
          policies: config.galileo.policies ?? [],
        }),
      );
    }
  }

  /**
   * Evaluate text against all active adapters (CoFounder + enterprise) in parallel.
   */
  async evaluate(text: string): Promise<UnifiedResult> {
    const start = Date.now();
    const allFindings: UnifiedFinding[] = [];
    const adapterResults: AdapterResult[] = [];

    // Run local CoFounder checks synchronously
    if (this.config.cofounder) {
      const cofounderFindings = runLocalRana(text, this.config.cofounder);
      allFindings.push(...cofounderFindings);

      adapterResults.push({
        adapter: 'cofounder',
        passed: cofounderFindings.every((f) => f.action !== 'block'),
        findings: cofounderFindings,
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      });
    }

    // Run enterprise adapters in parallel
    if (this.adapters.length > 0) {
      const results = await Promise.allSettled(
        this.adapters.map((adapter) => adapter.evaluate(text)),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          adapterResults.push(result.value);
          allFindings.push(...result.value.findings);
        } else {
          adapterResults.push({
            adapter: 'unknown',
            passed: false,
            findings: [
              {
                source: 'cofounder',
                category: 'custom',
                severity: 'critical',
                action: 'flag',
                message: `Adapter error: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
                confidence: 1,
              },
            ],
            latencyMs: Date.now() - start,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return {
      passed: allFindings.every((f) => f.action !== 'block'),
      findings: allFindings,
      adapterResults,
      totalLatencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Return the list of active adapter names.
   */
  getActiveAdapters(): string[] {
    const names = this.adapters.map((a) => a.name);
    if (this.config.cofounder) names.unshift('cofounder');
    return names;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a unified adapter that evaluates text against CoFounder policies and
 * one or more enterprise guardrail products simultaneously.
 *
 * @example
 * ```typescript
 * const unified = createUnifiedAdapter({
 *   aicofounder: { pii: 'redact', injection: 'block' },
 *   lakera: { apiKey: '...', endpoint: '...' },
 *   bedrock: { region: 'us-east-1', guardrailId: '...' },
 * });
 * const result = await unified.evaluate(text);
 * ```
 */
export function createUnifiedAdapter(config: UnifiedAdapterConfig): UnifiedAdapter {
  return new UnifiedAdapter(config);
}
