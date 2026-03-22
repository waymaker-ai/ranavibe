/**
 * @waymakerai/aicofounder-benchmark/runner
 *
 * Standalone benchmark runner that evaluates detection functions against the
 * built-in curated datasets, calculates per-category and overall metrics,
 * compares multiple engines side-by-side, and outputs structured JSON results.
 */

import {
  BenchmarkResult,
  CategoryMetrics,
  CombinedReport,
  DatasetEntry,
  DetectedFinding,
  DetectionResult,
  DetectorBenchmark,
  DetectorFunction,
  Metrics,
  TestCaseResult,
} from './types';
import { piiDataset, piiDatasetByCategory } from './datasets/pii-dataset';
import { injectionDataset, injectionDatasetByCategory } from './datasets/injection-dataset';
import { toxicityDataset, toxicityDatasetByCategory } from './datasets/toxicity-dataset';

/* ------------------------------------------------------------------ */
/*  Metric helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Calculate precision, recall, F1, accuracy, FPR, and FNR from the
 * four confusion-matrix counts.
 */
export function calculateMetrics(
  tp: number,
  tn: number,
  fp: number,
  fn: number,
): Metrics {
  const total = tp + tn + fp + fn;
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);
  const accuracy = total === 0 ? 0 : (tp + tn) / total;
  const falsePositiveRate = fp + tn === 0 ? 0 : fp / (fp + tn);
  const falseNegativeRate = fn + tp === 0 ? 0 : fn / (fn + tp);

  return { precision, recall, f1, accuracy, falsePositiveRate, falseNegativeRate };
}

/**
 * Classify a single test-case result into one of the four confusion-matrix
 * categories based on the expected vs actual detection.
 */
export function classifyResult(
  entry: DatasetEntry,
  detected: boolean,
): 'true-positive' | 'true-negative' | 'false-positive' | 'false-negative' {
  const shouldDetect = entry.expectedFindings.length > 0;
  if (shouldDetect && detected) return 'true-positive';
  if (!shouldDetect && !detected) return 'true-negative';
  if (!shouldDetect && detected) return 'false-positive';
  return 'false-negative';
}

/**
 * Count confusion-matrix values from a list of TestCaseResults.
 */
export function confusionCounts(details: TestCaseResult[]): {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
} {
  return {
    tp: details.filter((d) => d.classification === 'true-positive').length,
    tn: details.filter((d) => d.classification === 'true-negative').length,
    fp: details.filter((d) => d.classification === 'false-positive').length,
    fn: details.filter((d) => d.classification === 'false-negative').length,
  };
}

/* ------------------------------------------------------------------ */
/*  Dataset resolver                                                   */
/* ------------------------------------------------------------------ */

function getDataset(datasetName: string): {
  entries: DatasetEntry[];
  byCategory: Record<string, DatasetEntry[]>;
} {
  switch (datasetName) {
    case 'pii':
      return { entries: piiDataset, byCategory: piiDatasetByCategory };
    case 'injection':
      return { entries: injectionDataset, byCategory: injectionDatasetByCategory };
    case 'toxicity':
      return { entries: toxicityDataset, byCategory: toxicityDatasetByCategory };
    default:
      throw new Error(`Unknown dataset: ${datasetName}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Single-detector runner                                             */
/* ------------------------------------------------------------------ */

export interface RunOptions {
  /** Maximum time (ms) allowed per test case before it counts as a miss. */
  timeoutMs?: number;
  /** If true, also collect per-finding match accuracy (not just binary). */
  matchLevel?: boolean;
}

/**
 * Run a single detector against one of the curated datasets (pii, injection,
 * or toxicity). Returns a full BenchmarkResult with overall and per-category
 * metrics and every individual test-case outcome.
 */
export async function runDetector(
  detect: DetectorFunction,
  datasetName: 'pii' | 'injection' | 'toxicity',
  detectorName: string,
  options: RunOptions = {},
): Promise<BenchmarkResult> {
  const { entries, byCategory } = getDataset(datasetName);
  const timeoutMs = options.timeoutMs ?? 30_000;
  const startTime = Date.now();
  const details: TestCaseResult[] = [];

  for (const entry of entries) {
    let result: DetectionResult;
    try {
      result = await Promise.race([
        Promise.resolve(detect(entry.input)),
        new Promise<DetectionResult>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutMs),
        ),
      ]);
    } catch {
      // On timeout or error, treat as "nothing detected"
      result = { detected: false, findings: [] };
    }

    const detected = result.detected || result.findings.length > 0;
    const classification = classifyResult(entry, detected);
    const passed =
      classification === 'true-positive' || classification === 'true-negative';

    details.push({ entry, result, passed, classification });
  }

  const { tp, tn, fp, fn } = confusionCounts(details);
  const overall = calculateMetrics(tp, tn, fp, fn);

  // Per-category metrics
  const categories: CategoryMetrics[] = [];
  for (const [category, catEntries] of Object.entries(byCategory)) {
    const categoryDetails = details.filter((d) =>
      catEntries.some((e) => e.id === d.entry.id),
    );
    const c = confusionCounts(categoryDetails);
    categories.push({
      category,
      metrics: calculateMetrics(c.tp, c.tn, c.fp, c.fn),
      totalCases: categoryDetails.length,
      truePositives: c.tp,
      trueNegatives: c.tn,
      falsePositives: c.fp,
      falseNegatives: c.fn,
    });
  }

  return {
    detectorName,
    overall,
    categories,
    totalCases: entries.length,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    details,
  };
}

/* ------------------------------------------------------------------ */
/*  Multi-detector comparison                                          */
/* ------------------------------------------------------------------ */

export interface ComparisonEntry {
  detectorName: string;
  datasetName: 'pii' | 'injection' | 'toxicity';
  result: BenchmarkResult;
}

export interface ComparisonReport {
  /** Per-detector results */
  entries: ComparisonEntry[];
  /** Side-by-side overall metrics keyed by detector name */
  comparison: Record<string, Metrics>;
  /** Which detector scored highest F1 overall */
  bestOverallF1: { name: string; f1: number };
  /** Timestamp */
  generatedAt: string;
  totalDurationMs: number;
}

/**
 * Run multiple detectors against the same dataset and produce a side-by-side
 * comparison report.
 */
export async function compareDetectors(
  detectors: Array<{
    name: string;
    detect: DetectorFunction;
    dataset: 'pii' | 'injection' | 'toxicity';
  }>,
  options: RunOptions = {},
): Promise<ComparisonReport> {
  const startTime = Date.now();
  const entries: ComparisonEntry[] = [];
  const comparison: Record<string, Metrics> = {};

  for (const det of detectors) {
    const result = await runDetector(det.detect, det.dataset, det.name, options);
    entries.push({ detectorName: det.name, datasetName: det.dataset, result });
    comparison[det.name] = result.overall;
  }

  // Find best F1
  let bestName = '';
  let bestF1 = -1;
  for (const [name, m] of Object.entries(comparison)) {
    if (m.f1 > bestF1) {
      bestF1 = m.f1;
      bestName = name;
    }
  }

  return {
    entries,
    comparison,
    bestOverallF1: { name: bestName, f1: bestF1 },
    generatedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
  };
}

/* ------------------------------------------------------------------ */
/*  Full benchmark suite runner                                        */
/* ------------------------------------------------------------------ */

export interface SuiteConfig {
  /** Detectors to benchmark */
  detectors: DetectorBenchmark[];
  /** Options per run */
  options?: RunOptions;
}

/**
 * Run the full benchmark suite across all configured detectors and datasets.
 * Returns a CombinedReport compatible with the existing reporter formatters.
 */
export async function runBenchmarkSuite(config: SuiteConfig): Promise<CombinedReport> {
  const startTime = Date.now();
  const results: BenchmarkResult[] = [];

  for (const det of config.detectors) {
    const result = await runDetector(
      det.detect,
      det.dataset,
      det.name,
      config.options,
    );
    results.push(result);
  }

  return {
    results,
    generatedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
  };
}

/* ------------------------------------------------------------------ */
/*  JSON output                                                        */
/* ------------------------------------------------------------------ */

/**
 * Convenience wrapper: run the suite and return the results as a JSON string.
 */
export async function runBenchmarkSuiteJSON(config: SuiteConfig): Promise<string> {
  const report = await runBenchmarkSuite(config);
  return JSON.stringify(report, null, 2);
}
