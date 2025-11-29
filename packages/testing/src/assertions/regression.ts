/**
 * Regression Testing
 * Detect when AI outputs get worse over time
 */

import type { RegressionOptions } from '../types';
import { semanticSimilarity } from './semantic';

/**
 * Quality metrics for regression testing
 */
export interface QualityMetrics {
  coherence: number;
  coverage: number;
  conciseness: number;
  accuracy: number;
  relevance: number;
}

/**
 * Baseline data structure
 */
export interface Baseline {
  id: string;
  text: string;
  metrics: Partial<QualityMetrics>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * Evaluate quality metrics using LLM
 */
export async function evaluateQuality(
  text: string,
  reference: string,
  metrics: (keyof QualityMetrics)[]
): Promise<Partial<QualityMetrics>> {
  const result: Partial<QualityMetrics> = {};

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback to semantic similarity for each metric
    const similarity = await semanticSimilarity(text, reference);
    for (const metric of metrics) {
      result[metric] = similarity;
    }
    return result;
  }

  const prompt = `You are an AI output quality evaluator. Rate the following text on a scale of 0.0 to 1.0 for each metric.

TEXT TO EVALUATE:
${text}

REFERENCE/CONTEXT:
${reference}

METRICS TO EVALUATE:
${metrics.map((m) => `- ${m}`).join('\n')}

Respond with ONLY a JSON object containing the scores, like:
{"coherence": 0.85, "coverage": 0.9}

Be strict but fair. A score of 0.8+ is good, 0.9+ is excellent.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    interface ChatResponse {
      choices: Array<{ message: { content: string } }>;
    }

    const data = (await response.json()) as ChatResponse;
    const content = data.choices[0].message.content;
    const scores = JSON.parse(content) as Record<string, number>;

    for (const metric of metrics) {
      if (typeof scores[metric] === 'number') {
        result[metric] = Math.max(0, Math.min(1, scores[metric]));
      }
    }
  } catch {
    // Fallback to semantic similarity for each metric
    const similarity = await semanticSimilarity(text, reference);
    for (const metric of metrics) {
      result[metric] = similarity;
    }
  }

  return result;
}

/**
 * Load baseline from storage
 */
export async function loadBaseline(
  baselineId: string,
  baselineDir: string = '.rana/baselines'
): Promise<Baseline | null> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const baselinePath = path.join(baselineDir, `${baselineId}.json`);

  try {
    const data = await fs.readFile(baselinePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save baseline to storage
 */
export async function saveBaseline(
  baseline: Baseline,
  baselineDir: string = '.rana/baselines'
): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  await fs.mkdir(baselineDir, { recursive: true });
  const baselinePath = path.join(baselineDir, `${baseline.id}.json`);
  await fs.writeFile(baselinePath, JSON.stringify(baseline, null, 2));
}

/**
 * Assert output passes regression test
 */
export async function assertPassesRegression(
  actual: string,
  baselineId: string,
  options: RegressionOptions = {}
): Promise<void> {
  const {
    metrics = ['coherence', 'relevance'],
    threshold = 0.85,
    updateBaseline = false,
  } = options;

  const baseline = await loadBaseline(baselineId);

  if (!baseline) {
    // Create new baseline
    const newBaseline: Baseline = {
      id: baselineId,
      text: actual,
      metrics: await evaluateQuality(actual, actual, metrics),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    await saveBaseline(newBaseline);
    console.log(`Created regression baseline: ${baselineId}`);
    return;
  }

  // Evaluate current output
  const currentMetrics = await evaluateQuality(actual, baseline.text, metrics);

  // Compare metrics
  const failures: string[] = [];
  let passCount = 0;

  for (const metric of metrics) {
    const baselineScore = baseline.metrics[metric] || 0;
    const currentScore = currentMetrics[metric] || 0;

    // Allow small regression but not below threshold
    const minAcceptable = Math.max(threshold, baselineScore - 0.1);

    if (currentScore < minAcceptable) {
      failures.push(
        `${metric}: ${currentScore.toFixed(2)} < ${minAcceptable.toFixed(2)} (baseline: ${baselineScore.toFixed(2)})`
      );
    } else {
      passCount++;
    }
  }

  if (failures.length > 0) {
    const error = new Error(
      `Regression test failed for "${baselineId}".\n` +
        `${passCount}/${metrics.length} metrics passed.\n\n` +
        `Failures:\n${failures.map((f) => `  - ${f}`).join('\n')}\n\n` +
        `Current output:\n${actual.slice(0, 500)}${actual.length > 500 ? '...' : ''}\n\n` +
        `Baseline output:\n${baseline.text.slice(0, 500)}${baseline.text.length > 500 ? '...' : ''}`
    );
    error.name = 'RegressionError';
    throw error;
  }

  // Optionally update baseline if current is better
  if (updateBaseline) {
    let shouldUpdate = true;
    for (const metric of metrics) {
      if ((currentMetrics[metric] || 0) < (baseline.metrics[metric] || 0)) {
        shouldUpdate = false;
        break;
      }
    }

    if (shouldUpdate) {
      baseline.text = actual;
      baseline.metrics = currentMetrics;
      baseline.updatedAt = new Date().toISOString();
      baseline.version++;
      await saveBaseline(baseline);
      console.log(`Updated regression baseline: ${baselineId} (v${baseline.version})`);
    }
  }
}

/**
 * Compare two versions and report differences
 */
export async function compareVersions(
  version1: string,
  version2: string,
  reference: string
): Promise<{
  version1Scores: Partial<QualityMetrics>;
  version2Scores: Partial<QualityMetrics>;
  winner: 'version1' | 'version2' | 'tie';
  differences: Record<string, number>;
}> {
  const metrics: (keyof QualityMetrics)[] = [
    'coherence',
    'coverage',
    'conciseness',
    'accuracy',
    'relevance',
  ];

  const [v1Scores, v2Scores] = await Promise.all([
    evaluateQuality(version1, reference, metrics),
    evaluateQuality(version2, reference, metrics),
  ]);

  const differences: Record<string, number> = {};
  let v1Total = 0;
  let v2Total = 0;

  for (const metric of metrics) {
    const v1 = v1Scores[metric] || 0;
    const v2 = v2Scores[metric] || 0;
    differences[metric] = v2 - v1;
    v1Total += v1;
    v2Total += v2;
  }

  const winner: 'version1' | 'version2' | 'tie' =
    v1Total > v2Total + 0.05
      ? 'version1'
      : v2Total > v1Total + 0.05
        ? 'version2'
        : 'tie';

  return {
    version1Scores: v1Scores,
    version2Scores: v2Scores,
    winner,
    differences,
  };
}

/**
 * List all baselines
 */
export async function listBaselines(
  baselineDir: string = '.rana/baselines'
): Promise<Baseline[]> {
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    const files = await fs.readdir(baselineDir);
    const baselines: Baseline[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(baselineDir, file), 'utf-8');
        baselines.push(JSON.parse(data));
      }
    }

    return baselines.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Delete a baseline
 */
export async function deleteBaseline(
  baselineId: string,
  baselineDir: string = '.rana/baselines'
): Promise<boolean> {
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    await fs.unlink(path.join(baselineDir, `${baselineId}.json`));
    return true;
  } catch {
    return false;
  }
}
