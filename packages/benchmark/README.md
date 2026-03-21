# @cofounder/benchmark

Detection accuracy benchmark suite for CoFounder guardrails. Measure precision, recall, F1, and false positive/negative rates for your PII, injection, and toxicity detectors.

## Installation

```bash
npm install @cofounder/benchmark
```

## Quick Start

```typescript
import { runBenchmarks } from '@cofounder/benchmark';

const report = await runBenchmarks({
  detectors: [
    {
      name: 'My PII Detector',
      detect: (input) => myPiiDetector.scan(input),
      dataset: 'pii',
    },
    {
      name: 'My Injection Detector',
      detect: (input) => myInjectionDetector.check(input),
      dataset: 'injection',
    },
    {
      name: 'My Toxicity Detector',
      detect: (input) => myToxicityDetector.analyze(input),
      dataset: 'toxicity',
    },
  ],
  outputFormat: 'console', // 'console' | 'json' | 'markdown'
});

console.log(report.formatted);
```

## Datasets

### PII Dataset (100+ cases)
- **40 positive cases**: Emails, phone numbers, SSNs, credit cards, IP addresses, dates of birth, addresses, medical record numbers in varying formats
- **40 negative cases**: Items that resemble PII but are not (example.com emails, localhost IPs, invalid SSNs, numbers failing Luhn check)
- **20 edge cases**: PII embedded in URLs, code, JSON, SQL, logs, YAML, HTML, and obfuscated formats

### Injection Dataset (100+ cases)
- **40 positive cases**: Direct instruction overrides, indirect injection, jailbreaks, data exfiltration, encoded attacks, multi-step attacks, context manipulation
- **40 negative cases**: Legitimate questions that contain trigger words ("ignore errors in Python", "override a method in Java", "bypass the cache")
- **20 edge cases**: Multilingual attacks, leetspeak, reversed text, injection in poetry, meta-analysis of injections

### Toxicity Dataset (50+ cases)
- **20 positive cases**: Hate speech, harassment, threats, discriminatory language, dehumanization
- **20 negative cases**: Negative reviews, frustration, sports language, technical jargon, figurative speech
- **12 edge cases**: Quoted toxicity, sarcasm, passive-aggression, academic discussion, fiction

## Detector Interface

Your detector function must return a `DetectionResult`:

```typescript
interface DetectionResult {
  detected: boolean;
  findings: DetectedFinding[];
}

interface DetectedFinding {
  type: string;
  match?: string;
  confidence?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}
```

## Output Formats

- **console**: Formatted ASCII table with metrics, per-category breakdown, and failed case details
- **json**: Full structured report as JSON
- **markdown**: GitHub-flavored markdown with tables and confusion matrices

## Running Individual Benchmarks

```typescript
import { runPiiBenchmark, runInjectionBenchmark, runToxicityBenchmark } from '@cofounder/benchmark';

const piiResult = await runPiiBenchmark(myDetector, 'My PII Detector');
const injResult = await runInjectionBenchmark(myDetector, 'My Injection Detector');
const toxResult = await runToxicityBenchmark(myDetector, 'My Toxicity Detector');
```

## Metrics

Each benchmark calculates:

| Metric | Description |
|--------|-------------|
| Precision | TP / (TP + FP) - How many detections are correct |
| Recall | TP / (TP + FN) - How many actual positives are found |
| F1 Score | Harmonic mean of precision and recall |
| Accuracy | (TP + TN) / Total |
| False Positive Rate | FP / (FP + TN) |
| False Negative Rate | FN / (FN + TP) |

## License

MIT
