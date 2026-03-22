/**
 * AWS Bedrock Guardrails adapter — converts between CoFounder and Bedrock formats.
 */

import type {
  Adapter,
  AdapterResult,
  BedrockConfig,
  ExportResult,
  ImportResult,
  PolicyMapping,
  RanaAction,
  RanaCategory,
  Severity,
  UnifiedFinding,
} from '../types';

// ---------------------------------------------------------------------------
// Bedrock content filter → CoFounder category mapping
// ---------------------------------------------------------------------------

const BEDROCK_CONTENT_FILTER_TO_CoFounder: Record<string, RanaCategory> = {
  HATE: 'hate_speech',
  INSULTS: 'toxicity',
  SEXUAL: 'sexual_content',
  VIOLENCE: 'violence',
  MISCONDUCT: 'harmful_content',
  PROMPT_ATTACK: 'injection',
};

const CoFounder_TO_BEDROCK_CONTENT_FILTER: Record<string, string> = {
  hate_speech: 'HATE',
  toxicity: 'INSULTS',
  sexual_content: 'SEXUAL',
  violence: 'VIOLENCE',
  harmful_content: 'MISCONDUCT',
  injection: 'PROMPT_ATTACK',
};

// ---------------------------------------------------------------------------
// Bedrock PII types → CoFounder PII mapping
// ---------------------------------------------------------------------------

const BEDROCK_PII_TYPES: string[] = [
  'ADDRESS',
  'AGE',
  'AWS_ACCESS_KEY',
  'AWS_SECRET_KEY',
  'CA_HEALTH_NUMBER',
  'CA_SOCIAL_INSURANCE_NUMBER',
  'CREDIT_DEBIT_CARD_CVV',
  'CREDIT_DEBIT_CARD_EXPIRY',
  'CREDIT_DEBIT_CARD_NUMBER',
  'DRIVER_ID',
  'EMAIL',
  'INTERNATIONAL_BANK_ACCOUNT_NUMBER',
  'IP_ADDRESS',
  'LICENSE_PLATE',
  'MAC_ADDRESS',
  'NAME',
  'PASSWORD',
  'PHONE',
  'PIN',
  'SSN',
  'SWIFT_CODE',
  'UK_NATIONAL_HEALTH_SERVICE_NUMBER',
  'UK_NATIONAL_INSURANCE_NUMBER',
  'UK_UNIQUE_TAXPAYER_REFERENCE_NUMBER',
  'URL',
  'USERNAME',
  'US_BANK_ACCOUNT_NUMBER',
  'US_BANK_ROUTING_NUMBER',
  'US_INDIVIDUAL_TAX_IDENTIFICATION_NUMBER',
  'US_PASSPORT_NUMBER',
  'US_SOCIAL_SECURITY_NUMBER',
  'VEHICLE_IDENTIFICATION_NUMBER',
];

// ---------------------------------------------------------------------------
// Severity mapping
// ---------------------------------------------------------------------------

function mapBedrockStrength(strength: string): Severity {
  switch (strength) {
    case 'HIGH':
      return 'critical';
    case 'MEDIUM':
      return 'high';
    case 'LOW':
      return 'medium';
    case 'NONE':
      return 'info';
    default:
      return 'medium';
  }
}

function cofounderActionToBedrockAction(action: RanaAction): string {
  switch (action) {
    case 'block':
      return 'BLOCKED';
    case 'redact':
      return 'ANONYMIZED';
    case 'flag':
    case 'log':
    case 'allow':
      return 'NONE';
  }
}

function cofounderActionToBedrockStrength(action: RanaAction): string {
  switch (action) {
    case 'block':
      return 'HIGH';
    case 'redact':
      return 'MEDIUM';
    case 'flag':
      return 'LOW';
    case 'log':
    case 'allow':
      return 'NONE';
  }
}

function policyForCategory(
  policies: PolicyMapping[],
  category: RanaCategory,
): PolicyMapping | undefined {
  return policies.find((p) => p.cofounderCategory === category);
}

// ---------------------------------------------------------------------------
// Bedrock adapter class
// ---------------------------------------------------------------------------

class BedrockAdapter implements Adapter {
  readonly name = 'bedrock';
  private readonly config: BedrockConfig;

  constructor(config: BedrockConfig) {
    this.config = {
      ...config,
      guardrailVersion: config.guardrailVersion ?? 'DRAFT',
    };
  }

  /**
   * Evaluate text by calling the Bedrock Guardrail ApplyGuardrail API.
   */
  async evaluate(text: string): Promise<AdapterResult> {
    const start = Date.now();
    const region = this.config.region;
    const guardrailId = this.config.guardrailId;
    const version = this.config.guardrailVersion ?? 'DRAFT';
    const endpoint = `https://bedrock-runtime.${region}.amazonaws.com/guardrail/${guardrailId}/version/${version}/apply`;

    const body = JSON.stringify({
      source: 'INPUT',
      content: [{ text: { text } }],
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // If explicit credentials provided, create a basic authorization header.
    // In production you would use SigV4 signing; here we pass the access key
    // so consumers can layer on real signing externally.
    if (this.config.accessKeyId) {
      headers['X-Amz-Access-Key'] = this.config.accessKeyId;
    }
    if (this.config.sessionToken) {
      headers['X-Amz-Security-Token'] = this.config.sessionToken;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        return {
          adapter: this.name,
          passed: false,
          findings: [
            {
              source: 'bedrock',
              category: 'custom',
              severity: 'critical',
              action: 'flag',
              message: `Bedrock API error ${response.status}: ${errBody}`,
              confidence: 1,
            },
          ],
          latencyMs: Date.now() - start,
          timestamp: new Date().toISOString(),
          raw: { status: response.status, body: errBody },
        };
      }

      const raw = (await response.json()) as BedrockRawResponse;
      const findings = this.convertRawToFindings(raw);

      return {
        adapter: this.name,
        passed: raw.action !== 'GUARDRAIL_INTERVENED',
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
            source: 'bedrock',
            category: 'custom',
            severity: 'critical',
            action: 'flag',
            message: `Bedrock request failed: ${err instanceof Error ? err.message : String(err)}`,
            confidence: 1,
          },
        ],
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Export CoFounder policies into a Bedrock guardrail configuration format.
   */
  exportPolicies(): ExportResult {
    const contentFilters: BedrockContentFilter[] = [];
    const piiEntities: BedrockPiiEntity[] = [];
    const topicPolicies: BedrockTopicPolicy[] = [];

    for (const policy of this.config.policies) {
      const bedrockFilter = CoFounder_TO_BEDROCK_CONTENT_FILTER[policy.cofounderCategory];
      if (bedrockFilter) {
        contentFilters.push({
          type: bedrockFilter,
          inputStrength: cofounderActionToBedrockStrength(policy.action),
          outputStrength: cofounderActionToBedrockStrength(policy.action),
        });
        continue;
      }

      if (policy.cofounderCategory === 'pii') {
        for (const piiType of BEDROCK_PII_TYPES) {
          piiEntities.push({
            type: piiType,
            action: cofounderActionToBedrockAction(policy.action),
          });
        }
        continue;
      }

      // Everything else → topic policy
      topicPolicies.push({
        name: policy.cofounderCategory,
        definition: `Block content related to ${policy.cofounderCategory}`,
        action: cofounderActionToBedrockAction(policy.action),
      });
    }

    const guardrailConfig = {
      name: `aicofounder-guardrail-${this.config.guardrailId}`,
      contentPolicyConfig: { filtersConfig: contentFilters },
      sensitiveInformationPolicyConfig: { piiEntitiesConfig: piiEntities },
      topicPolicyConfig: { topicsConfig: topicPolicies },
    };

    return {
      format: 'bedrock',
      data: guardrailConfig,
      count: contentFilters.length + piiEntities.length + topicPolicies.length,
    };
  }

  /**
   * Import raw Bedrock evaluation results into CoFounder-normalised findings.
   */
  importResults(raw: unknown): ImportResult {
    if (!raw || typeof raw !== 'object') {
      return {
        imported: 0,
        skipped: 0,
        errors: ['Invalid Bedrock result payload'],
        findings: [],
      };
    }

    const response = raw as BedrockRawResponse;
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

  private convertRawToFindings(raw: BedrockRawResponse): UnifiedFinding[] {
    const findings: UnifiedFinding[] = [];

    // Content filter assessments
    for (const assessment of raw.assessments ?? []) {
      // Content filters
      for (const filter of assessment.contentPolicy?.filters ?? []) {
        const cofounderCategory = BEDROCK_CONTENT_FILTER_TO_CoFounder[filter.type] ?? 'custom';
        const severity = mapBedrockStrength(filter.strength ?? 'MEDIUM');
        const policy = policyForCategory(this.config.policies, cofounderCategory);
        const confidence = filter.confidence ?? 0.8;

        findings.push({
          source: 'bedrock',
          category: cofounderCategory,
          severity,
          action: policy?.action ?? (filter.action === 'BLOCKED' ? 'block' : 'flag'),
          message: `Bedrock content filter: ${filter.type} (strength: ${filter.strength ?? 'MEDIUM'})`,
          confidence,
          raw: filter,
        });
      }

      // PII detections
      for (const pii of assessment.sensitiveInformationPolicy?.piiEntities ?? []) {
        const policy = policyForCategory(this.config.policies, 'pii');
        findings.push({
          source: 'bedrock',
          category: 'pii',
          severity: 'high',
          action: policy?.action ?? (pii.action === 'ANONYMIZED' ? 'redact' : 'flag'),
          message: `Bedrock PII detected: ${pii.type}`,
          confidence: 0.9,
          raw: pii,
        });
      }

      // Topic policies
      for (const topic of assessment.topicPolicy?.topics ?? []) {
        const cofounderCategory: RanaCategory =
          (topic.name as RanaCategory) ?? 'custom';
        const policy = policyForCategory(this.config.policies, cofounderCategory);
        findings.push({
          source: 'bedrock',
          category: cofounderCategory,
          severity: 'high',
          action: policy?.action ?? (topic.action === 'BLOCKED' ? 'block' : 'flag'),
          message: `Bedrock topic policy: ${topic.name}`,
          confidence: 0.85,
          raw: topic,
        });
      }
    }

    return findings;
  }
}

// ---------------------------------------------------------------------------
// Internal Bedrock response types
// ---------------------------------------------------------------------------

interface BedrockContentFilter {
  type: string;
  inputStrength?: string;
  outputStrength?: string;
  strength?: string;
  confidence?: number;
  action?: string;
}

interface BedrockPiiEntity {
  type: string;
  action: string;
  match?: string;
}

interface BedrockTopicPolicy {
  name: string;
  definition?: string;
  action: string;
}

interface BedrockAssessment {
  contentPolicy?: { filters?: BedrockContentFilter[] };
  sensitiveInformationPolicy?: { piiEntities?: BedrockPiiEntity[] };
  topicPolicy?: { topics?: BedrockTopicPolicy[] };
}

interface BedrockRawResponse {
  action?: string;
  assessments?: BedrockAssessment[];
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an AWS Bedrock Guardrails adapter.
 */
export function createBedrockAdapter(
  config: Omit<BedrockConfig, 'name' | 'enabled'> & { enabled?: boolean },
): Adapter {
  return new BedrockAdapter({
    ...config,
    name: 'bedrock',
    enabled: config.enabled ?? true,
  });
}
