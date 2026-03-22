export * from './types';
export * from './datasets';
export * from './runners';
export { formatReport, formatConsoleTable, formatJSON, formatMarkdownTable } from './reporter';
export {
  calculateMetrics,
  classifyResult,
  confusionCounts,
  runDetector,
  compareDetectors,
  runBenchmarkSuite,
  runBenchmarkSuiteJSON,
} from './runner';
export type { RunOptions, ComparisonEntry, ComparisonReport, SuiteConfig } from './runner';

import {
  BenchmarkConfig,
  BenchmarkResult,
  CombinedReport,
  DetectorBenchmark,
} from './types';
import { runPiiBenchmark } from './runners/pii-runner';
import { runInjectionBenchmark } from './runners/injection-runner';
import { runToxicityBenchmark } from './runners/toxicity-runner';
import { formatReport } from './reporter';

const defaultConfig: BenchmarkConfig = {
  detectors: [],
  includeEdgeCases: true,
  timeoutMs: 30000,
  outputFormat: 'console',
  verbose: false,
};

/**
 * Run all configured benchmarks and return a combined report.
 *
 * @example
 * ```typescript
 * import { runBenchmarks } from '@waymakerai/aicofounder-benchmark';
 *
 * const report = await runBenchmarks({
 *   detectors: [
 *     { name: 'My PII Detector', detect: myPiiDetect, dataset: 'pii' },
 *     { name: 'My Injection Detector', detect: myInjDetect, dataset: 'injection' },
 *   ],
 *   outputFormat: 'markdown',
 * });
 *
 * console.log(report.formatted);
 * ```
 */
export async function runBenchmarks(
  config: Partial<BenchmarkConfig> & { detectors: DetectorBenchmark[] },
): Promise<CombinedReport & { formatted: string }> {
  const fullConfig: BenchmarkConfig = { ...defaultConfig, ...config };
  const startTime = Date.now();
  const results: BenchmarkResult[] = [];

  for (const detector of fullConfig.detectors) {
    let result: BenchmarkResult;

    switch (detector.dataset) {
      case 'pii':
        result = await runPiiBenchmark(detector.detect, detector.name);
        break;
      case 'injection':
        result = await runInjectionBenchmark(detector.detect, detector.name);
        break;
      case 'toxicity':
        result = await runToxicityBenchmark(detector.detect, detector.name);
        break;
      default:
        throw new Error(`Unknown dataset: ${detector.dataset}`);
    }

    results.push(result);
  }

  const report: CombinedReport = {
    results,
    generatedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
  };

  const formatted = formatReport(report, fullConfig.outputFormat);

  return { ...report, formatted };
}
