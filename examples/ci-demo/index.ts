/**
 * @waymakerai/aicofounder-ci Demo
 *
 * Run with: npx tsx index.ts
 *
 * Demonstrates running a CoFounder CI scan programmatically: scanning files,
 * generating reports, and checking results.
 */

import {
  scan,
  formatReport,
  runAndFormat,
  ALL_RULES,
  getRules,
} from '@waymakerai/aicofounder-ci';

// ─── 1. List available rules ────────────────────────────────────────────────────

console.log('=== 1. Available CI Rules ===\n');

for (const rule of ALL_RULES) {
  console.log(`  [${rule.id}] ${rule.name} (severity: ${rule.severity})`);
  console.log(`    ${rule.description}`);
}

// ─── 2. Run a scan ──────────────────────────────────────────────────────────────

console.log('\n=== 2. Run Scan ===\n');

// Scan the current demo directory as an example
const result = scan({
  paths: ['.'],
  rules: ['no-hardcoded-keys', 'no-pii-in-prompts', 'no-injection-vuln', 'approved-models', 'cost-estimation', 'safe-defaults'],
  ignorePatterns: ['node_modules', 'dist', '.git'],
  failOn: 'high',
  format: 'console',
  approvedModels: ['claude-sonnet-4-6', 'gpt-4o', 'gpt-4o-mini'],
  budgetLimit: 100,
});

console.log('Scan result:');
console.log('  Files scanned:', result.filesScanned);
console.log('  Rules applied:', result.rulesApplied);
console.log('  Duration:', result.durationMs + 'ms');
console.log('  Passed:', result.passed);
console.log('  Summary:', result.summary);

if (result.findings.length > 0) {
  console.log('\nFindings:');
  for (const finding of result.findings.slice(0, 10)) {
    console.log(`  [${finding.severity}] ${finding.rule}: ${finding.message}`);
    if (finding.file) {
      console.log(`    at ${finding.file}:${finding.line || '?'}`);
    }
  }
} else {
  console.log('\nNo findings -- all clean!');
}

// ─── 3. Format as different report types ────────────────────────────────────────

console.log('\n=== 3. Report Formats ===\n');

// Console format
const consoleReport = formatReport(result, 'console');
console.log('Console report preview:');
console.log(consoleReport.split('\n').slice(0, 5).join('\n'));

// JSON format
const jsonReport = formatReport(result, 'json');
const parsed = JSON.parse(jsonReport);
console.log('\nJSON report keys:', Object.keys(parsed));

// Markdown format
const mdReport = formatReport(result, 'markdown');
console.log('\nMarkdown report preview:');
console.log(mdReport.split('\n').slice(0, 5).join('\n'));

// SARIF format (for GitHub Code Scanning)
const sarifReport = formatReport(result, 'sarif');
const sarif = JSON.parse(sarifReport);
console.log('\nSARIF version:', sarif.version);
console.log('SARIF runs:', sarif.runs?.length);

// ─── 4. Run and format in one step ──────────────────────────────────────────────

console.log('\n=== 4. Run + Format ===\n');

const { result: r2, output: o2 } = runAndFormat({
  paths: ['.'],
  rules: ['no-hardcoded-keys', 'no-pii-in-prompts'],
  ignorePatterns: ['node_modules', 'dist', '.git'],
  failOn: 'critical',
  format: 'json',
});

console.log('Quick scan passed:', r2.passed);
console.log('Output length:', o2.length, 'chars');

console.log('\nDone.');
