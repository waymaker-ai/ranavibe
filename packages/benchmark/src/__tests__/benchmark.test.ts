import { describe, it, expect } from 'vitest';
import {
  calculateMetrics,
  classifyResult,
  confusionCounts,
  runDetector,
  compareDetectors,
  runBenchmarkSuite,
  runBenchmarkSuiteJSON,
} from '../runner';
import type {
  DatasetEntry,
  DetectionResult,
  DetectorFunction,
  Metrics,
  TestCaseResult,
} from '../types';

/* ------------------------------------------------------------------ */
/*  Helper detector factories                                          */
/* ------------------------------------------------------------------ */

/** Always detects something */
const alwaysDetect: DetectorFunction = () => ({
  detected: true,
  findings: [{ type: 'test', match: 'anything' }],
});

/** Never detects anything */
const neverDetect: DetectorFunction = () => ({
  detected: false,
  findings: [],
});

/** Detects only when the input contains "PII" or known PII markers */
const smartPiiDetector: DetectorFunction = (input: string) => {
  const findings: { type: string; match: string }[] = [];

  // Email
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  for (const m of input.matchAll(emailRe)) {
    if (!m[0].includes('example.com') && !m[0].includes('example.org') && !m[0].includes('test.com')) {
      findings.push({ type: 'email', match: m[0] });
    }
  }

  // SSN
  const ssnRe = /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g;
  for (const m of input.matchAll(ssnRe)) {
    if (!m[0].startsWith('000') && !m[0].startsWith('999') && !m[0].startsWith('666')) {
      findings.push({ type: 'ssn', match: m[0] });
    }
  }

  return { detected: findings.length > 0, findings };
};

/* ------------------------------------------------------------------ */
/*  1. calculateMetrics                                                */
/* ------------------------------------------------------------------ */

describe('calculateMetrics', () => {
  it('should return perfect scores for all-correct predictions', () => {
    const m = calculateMetrics(50, 50, 0, 0);
    expect(m.precision).toBe(1);
    expect(m.recall).toBe(1);
    expect(m.f1).toBe(1);
    expect(m.accuracy).toBe(1);
    expect(m.falsePositiveRate).toBe(0);
    expect(m.falseNegativeRate).toBe(0);
  });

  it('should return zero scores when everything is wrong', () => {
    const m = calculateMetrics(0, 0, 50, 50);
    expect(m.precision).toBe(0);
    expect(m.recall).toBe(0);
    expect(m.f1).toBe(0);
    expect(m.accuracy).toBe(0);
    expect(m.falsePositiveRate).toBe(1);
    expect(m.falseNegativeRate).toBe(1);
  });

  it('should handle all-zeros gracefully', () => {
    const m = calculateMetrics(0, 0, 0, 0);
    expect(m.precision).toBe(0);
    expect(m.recall).toBe(0);
    expect(m.f1).toBe(0);
    expect(m.accuracy).toBe(0);
  });

  it('should calculate correct precision when there are false positives', () => {
    // 80 correct detections, 20 false alarms
    const m = calculateMetrics(80, 0, 20, 0);
    expect(m.precision).toBe(0.8);
    expect(m.recall).toBe(1); // no false negatives
  });

  it('should calculate correct recall when there are false negatives', () => {
    // 60 detected out of 100 actual positives
    const m = calculateMetrics(60, 0, 0, 40);
    expect(m.recall).toBe(0.6);
    expect(m.precision).toBe(1); // no false positives
  });

  it('should calculate F1 as harmonic mean of precision and recall', () => {
    const m = calculateMetrics(80, 10, 20, 10);
    const expectedPrecision = 80 / 100;
    const expectedRecall = 80 / 90;
    const expectedF1 =
      (2 * expectedPrecision * expectedRecall) /
      (expectedPrecision + expectedRecall);
    expect(m.f1).toBeCloseTo(expectedF1, 6);
  });

  it('should calculate false positive rate correctly', () => {
    // FPR = FP / (FP + TN) = 5 / (5 + 95) = 0.05
    const m = calculateMetrics(90, 95, 5, 10);
    expect(m.falsePositiveRate).toBeCloseTo(0.05, 6);
  });

  it('should calculate false negative rate correctly', () => {
    // FNR = FN / (FN + TP) = 10 / (10 + 90) = 0.1
    const m = calculateMetrics(90, 95, 5, 10);
    expect(m.falseNegativeRate).toBeCloseTo(0.1, 6);
  });
});

/* ------------------------------------------------------------------ */
/*  2. classifyResult                                                  */
/* ------------------------------------------------------------------ */

describe('classifyResult', () => {
  const positiveEntry: DatasetEntry = {
    id: 'test-pos',
    input: 'SSN: 123-45-6789',
    expectedFindings: [{ type: 'ssn', match: '123-45-6789' }],
    category: 'positive',
    description: 'Positive test',
  };

  const negativeEntry: DatasetEntry = {
    id: 'test-neg',
    input: 'No PII here',
    expectedFindings: [],
    category: 'negative',
    description: 'Negative test',
  };

  it('should return true-positive when expected and detected', () => {
    expect(classifyResult(positiveEntry, true)).toBe('true-positive');
  });

  it('should return false-negative when expected but not detected', () => {
    expect(classifyResult(positiveEntry, false)).toBe('false-negative');
  });

  it('should return true-negative when not expected and not detected', () => {
    expect(classifyResult(negativeEntry, false)).toBe('true-negative');
  });

  it('should return false-positive when not expected but detected', () => {
    expect(classifyResult(negativeEntry, true)).toBe('false-positive');
  });
});

/* ------------------------------------------------------------------ */
/*  3. confusionCounts                                                 */
/* ------------------------------------------------------------------ */

describe('confusionCounts', () => {
  it('should count classifications correctly', () => {
    const details: TestCaseResult[] = [
      { entry: {} as DatasetEntry, result: {} as DetectionResult, passed: true, classification: 'true-positive' },
      { entry: {} as DatasetEntry, result: {} as DetectionResult, passed: true, classification: 'true-positive' },
      { entry: {} as DatasetEntry, result: {} as DetectionResult, passed: true, classification: 'true-negative' },
      { entry: {} as DatasetEntry, result: {} as DetectionResult, passed: false, classification: 'false-positive' },
      { entry: {} as DatasetEntry, result: {} as DetectionResult, passed: false, classification: 'false-negative' },
    ];
    const counts = confusionCounts(details);
    expect(counts.tp).toBe(2);
    expect(counts.tn).toBe(1);
    expect(counts.fp).toBe(1);
    expect(counts.fn).toBe(1);
  });

  it('should return all zeros for empty array', () => {
    const counts = confusionCounts([]);
    expect(counts.tp).toBe(0);
    expect(counts.tn).toBe(0);
    expect(counts.fp).toBe(0);
    expect(counts.fn).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  4. runDetector                                                     */
/* ------------------------------------------------------------------ */

describe('runDetector', () => {
  it('should run against the PII dataset and return a BenchmarkResult', async () => {
    const result = await runDetector(alwaysDetect, 'pii', 'Always-Detect');
    expect(result.detectorName).toBe('Always-Detect');
    expect(result.totalCases).toBeGreaterThan(0);
    expect(result.overall).toBeDefined();
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.details.length).toBe(result.totalCases);
  });

  it('should run against the injection dataset', async () => {
    const result = await runDetector(neverDetect, 'injection', 'Never-Detect');
    expect(result.detectorName).toBe('Never-Detect');
    expect(result.totalCases).toBeGreaterThan(0);
  });

  it('should run against the toxicity dataset', async () => {
    const result = await runDetector(neverDetect, 'toxicity', 'Never-Detect');
    expect(result.totalCases).toBeGreaterThan(0);
  });

  it('should throw for unknown dataset', async () => {
    await expect(
      runDetector(neverDetect, 'unknown' as any, 'test'),
    ).rejects.toThrow('Unknown dataset');
  });

  it('should have 0 false negatives and some false positives for always-detect', async () => {
    const result = await runDetector(alwaysDetect, 'pii', 'Always');
    const { fn, fp } = confusionCounts(result.details);
    // Always detecting means every positive is caught (no FN)
    expect(fn).toBe(0);
    // But negatives are wrongly flagged
    expect(fp).toBeGreaterThan(0);
  });

  it('should have 0 false positives and some false negatives for never-detect', async () => {
    const result = await runDetector(neverDetect, 'pii', 'Never');
    const { fp, fn } = confusionCounts(result.details);
    expect(fp).toBe(0);
    expect(fn).toBeGreaterThan(0);
  });

  it('should record timestamps and durations', async () => {
    const result = await runDetector(neverDetect, 'pii', 'Timer-Test');
    expect(typeof result.timestamp).toBe('string');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should handle detectors that throw errors gracefully', async () => {
    const throwingDetector: DetectorFunction = () => {
      throw new Error('Detector crashed');
    };
    const result = await runDetector(throwingDetector, 'pii', 'Crasher');
    // Should complete without throwing, counting errors as non-detections
    expect(result.totalCases).toBeGreaterThan(0);
    const { fp } = confusionCounts(result.details);
    expect(fp).toBe(0); // errors = not detected = no false positives
  });

  it('should produce per-category breakdowns that sum to total', async () => {
    const result = await runDetector(smartPiiDetector, 'pii', 'Smart');
    const totalFromCats = result.categories.reduce((s, c) => s + c.totalCases, 0);
    expect(totalFromCats).toBe(result.totalCases);
  });
});

/* ------------------------------------------------------------------ */
/*  5. compareDetectors                                                */
/* ------------------------------------------------------------------ */

describe('compareDetectors', () => {
  it('should compare two detectors on the same dataset', async () => {
    const report = await compareDetectors([
      { name: 'Always', detect: alwaysDetect, dataset: 'pii' },
      { name: 'Never', detect: neverDetect, dataset: 'pii' },
    ]);
    expect(report.entries.length).toBe(2);
    expect(report.comparison['Always']).toBeDefined();
    expect(report.comparison['Never']).toBeDefined();
    expect(report.bestOverallF1.name).toBeDefined();
    expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('should identify the best detector by F1', async () => {
    const report = await compareDetectors([
      { name: 'Smart', detect: smartPiiDetector, dataset: 'pii' },
      { name: 'Never', detect: neverDetect, dataset: 'pii' },
    ]);
    // Smart detector should beat never-detect
    expect(report.bestOverallF1.name).toBe('Smart');
    expect(report.bestOverallF1.f1).toBeGreaterThan(0);
  });

  it('should handle empty detectors list', async () => {
    const report = await compareDetectors([]);
    expect(report.entries.length).toBe(0);
    expect(report.bestOverallF1.f1).toBe(-1);
  });
});

/* ------------------------------------------------------------------ */
/*  6. runBenchmarkSuite                                               */
/* ------------------------------------------------------------------ */

describe('runBenchmarkSuite', () => {
  it('should run a multi-dataset suite', async () => {
    const report = await runBenchmarkSuite({
      detectors: [
        { name: 'PII-Always', detect: alwaysDetect, dataset: 'pii' },
        { name: 'Inj-Never', detect: neverDetect, dataset: 'injection' },
      ],
    });
    expect(report.results.length).toBe(2);
    expect(report.results[0].detectorName).toBe('PII-Always');
    expect(report.results[1].detectorName).toBe('Inj-Never');
    expect(report.generatedAt).toBeTruthy();
    expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('should pass timeout options through', async () => {
    const report = await runBenchmarkSuite({
      detectors: [{ name: 'Fast', detect: neverDetect, dataset: 'pii' }],
      options: { timeoutMs: 100 },
    });
    expect(report.results.length).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/*  7. runBenchmarkSuiteJSON                                           */
/* ------------------------------------------------------------------ */

describe('runBenchmarkSuiteJSON', () => {
  it('should return valid JSON string', async () => {
    const json = await runBenchmarkSuiteJSON({
      detectors: [{ name: 'Test', detect: neverDetect, dataset: 'pii' }],
    });
    const parsed = JSON.parse(json);
    expect(parsed.results).toBeDefined();
    expect(parsed.generatedAt).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  8. Metric edge cases                                               */
/* ------------------------------------------------------------------ */

describe('metric edge cases', () => {
  it('should handle precision=0 when no positives predicted (tp=0, fp=0)', () => {
    const m = calculateMetrics(0, 100, 0, 0);
    expect(m.precision).toBe(0);
    expect(m.recall).toBe(0);
    expect(m.f1).toBe(0);
    expect(m.accuracy).toBe(1);
  });

  it('should handle recall=0 when no actual positives (tp=0, fn=0)', () => {
    const m = calculateMetrics(0, 50, 50, 0);
    expect(m.recall).toBe(0);
    expect(m.precision).toBe(0);
  });

  it('should handle single TP', () => {
    const m = calculateMetrics(1, 0, 0, 0);
    expect(m.precision).toBe(1);
    expect(m.recall).toBe(1);
    expect(m.f1).toBe(1);
    expect(m.accuracy).toBe(1);
  });

  it('should handle large counts without overflow', () => {
    const m = calculateMetrics(1_000_000, 1_000_000, 100, 100);
    expect(m.precision).toBeGreaterThan(0.999);
    expect(m.recall).toBeGreaterThan(0.999);
    expect(m.f1).toBeGreaterThan(0.999);
  });
});
