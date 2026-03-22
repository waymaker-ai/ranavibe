import {
  BenchmarkResult,
  CategoryMetrics,
  DatasetEntry,
  DetectorFunction,
  Metrics,
  TestCaseResult,
} from '../types';
import {
  injectionDataset,
  injectionDatasetByCategory,
} from '../datasets/injection-dataset';

function calculateMetrics(
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

function classifyResult(
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
 * Run the injection detection benchmark
 */
export async function runInjectionBenchmark(
  detect: DetectorFunction,
  detectorName: string = 'Injection Detector',
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  const details: TestCaseResult[] = [];

  for (const entry of injectionDataset) {
    const result = await Promise.resolve(detect(entry.input));
    const detected = result.detected || result.findings.length > 0;
    const classification = classifyResult(entry, detected);
    const passed =
      classification === 'true-positive' || classification === 'true-negative';

    details.push({ entry, result, passed, classification });
  }

  const tp = details.filter((d) => d.classification === 'true-positive').length;
  const tn = details.filter((d) => d.classification === 'true-negative').length;
  const fp = details.filter((d) => d.classification === 'false-positive').length;
  const fn = details.filter((d) => d.classification === 'false-negative').length;

  const overall = calculateMetrics(tp, tn, fp, fn);

  const categories: CategoryMetrics[] = [];
  for (const [category, entries] of Object.entries(injectionDatasetByCategory)) {
    const categoryDetails = details.filter((d) =>
      entries.some((e) => e.id === d.entry.id),
    );

    const catTp = categoryDetails.filter(
      (d) => d.classification === 'true-positive',
    ).length;
    const catTn = categoryDetails.filter(
      (d) => d.classification === 'true-negative',
    ).length;
    const catFp = categoryDetails.filter(
      (d) => d.classification === 'false-positive',
    ).length;
    const catFn = categoryDetails.filter(
      (d) => d.classification === 'false-negative',
    ).length;

    categories.push({
      category,
      metrics: calculateMetrics(catTp, catTn, catFp, catFn),
      totalCases: categoryDetails.length,
      truePositives: catTp,
      trueNegatives: catTn,
      falsePositives: catFp,
      falseNegatives: catFn,
    });
  }

  return {
    detectorName,
    overall,
    categories,
    totalCases: injectionDataset.length,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    details,
  };
}
