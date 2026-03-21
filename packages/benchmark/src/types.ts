/**
 * @cofounder/benchmark - Types for detection accuracy benchmarking
 */

export interface BenchmarkConfig {
  /** Which detectors to benchmark */
  detectors: DetectorBenchmark[];
  /** Whether to include edge cases */
  includeEdgeCases: boolean;
  /** Timeout per test case in ms */
  timeoutMs: number;
  /** Output format */
  outputFormat: 'console' | 'json' | 'markdown';
  /** Whether to run in verbose mode */
  verbose: boolean;
}

export interface DatasetEntry {
  /** Unique identifier for this test case */
  id: string;
  /** The input text to test */
  input: string;
  /** Expected findings (empty array means no findings expected) */
  expectedFindings: ExpectedFinding[];
  /** Category of this test case */
  category: 'positive' | 'negative' | 'edge';
  /** Human-readable description */
  description: string;
}

export interface ExpectedFinding {
  /** Type of finding (e.g., 'email', 'ssn', 'injection', 'toxicity') */
  type: string;
  /** The matched text, if applicable */
  match?: string;
  /** Severity level */
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DetectionResult {
  /** Whether something was detected */
  detected: boolean;
  /** List of findings */
  findings: DetectedFinding[];
}

export interface DetectedFinding {
  /** Type of finding */
  type: string;
  /** The matched text */
  match?: string;
  /** Confidence score 0-1 */
  confidence?: number;
  /** Severity level */
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface Metrics {
  /** True positives / (True positives + False positives) */
  precision: number;
  /** True positives / (True positives + False negatives) */
  recall: number;
  /** Harmonic mean of precision and recall */
  f1: number;
  /** (True positives + True negatives) / Total */
  accuracy: number;
  /** False positives / (False positives + True negatives) */
  falsePositiveRate: number;
  /** False negatives / (False negatives + True positives) */
  falseNegativeRate: number;
}

export interface CategoryMetrics {
  category: string;
  metrics: Metrics;
  totalCases: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface BenchmarkResult {
  /** Name of the detector benchmarked */
  detectorName: string;
  /** Overall metrics */
  overall: Metrics;
  /** Per-category breakdown */
  categories: CategoryMetrics[];
  /** Total test cases */
  totalCases: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Timestamp of the run */
  timestamp: string;
  /** Individual test results for debugging */
  details: TestCaseResult[];
}

export interface TestCaseResult {
  entry: DatasetEntry;
  result: DetectionResult;
  passed: boolean;
  classification: 'true-positive' | 'true-negative' | 'false-positive' | 'false-negative';
}

export type DetectorFunction = (input: string) => DetectionResult | Promise<DetectionResult>;

export interface DetectorBenchmark {
  /** Name of the detector */
  name: string;
  /** The detector function to benchmark */
  detect: DetectorFunction;
  /** Which dataset to use */
  dataset: 'pii' | 'injection' | 'toxicity';
}

export interface CombinedReport {
  results: BenchmarkResult[];
  generatedAt: string;
  totalDurationMs: number;
}
