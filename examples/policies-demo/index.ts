/**
 * @waymakerai/aicofounder-policies Demo
 *
 * Run with: npx tsx index.ts
 *
 * Demonstrates the policy engine: loading presets, evaluating text,
 * composing policies, and building custom rules.
 */

import {
  PolicyEngine,
  hipaaPolicy,
  gdprPolicy,
  safetyPolicy,
  listPresets,
  compose,
  PolicyBuilder,
} from '@waymakerai/aicofounder-policies';

// ─── 1. Available presets ──────────────────────────────────────────────────────

console.log('=== 1. Available Policy Presets ===\n');

const presets = listPresets();
console.log('Presets:', presets);
// Output: [ 'hipaa', 'gdpr', 'ccpa', 'sec', 'pci', 'ferpa', 'sox', 'safety', 'enterprise' ]

console.log('Engine also lists them:', PolicyEngine.availablePresets());

// ─── 2. Load presets and evaluate ──────────────────────────────────────────────

console.log('\n=== 2. HIPAA + Safety Evaluation ===\n');

const engine = PolicyEngine.fromPresets(['hipaa', 'safety']);
console.log('Loaded policies:', engine.listPolicies());
console.log('Policy count:', engine.size);

// Evaluate text with PII -- should fail HIPAA
const result1 = engine.evaluate({
  content: 'Patient John Smith, SSN 123-45-6789, was diagnosed with diabetes on 03/15/2024.',
  model: 'claude-sonnet-4-6',
  provider: 'anthropic',
});

console.log('\nHIPAA check (text with SSN):');
console.log('  Passed:', result1.passed);
console.log('  Violations:', result1.violations.length);
for (const v of result1.violations) {
  console.log(`  - [${v.severity}] ${v.message}`);
}
console.log('  Duration:', result1.durationMs + 'ms');

// Evaluate clean text -- should pass
const result2 = engine.evaluate({
  content: 'Please schedule a follow-up appointment for the patient in two weeks.',
  model: 'claude-sonnet-4-6',
  provider: 'anthropic',
});

console.log('\nClean text check:');
console.log('  Passed:', result2.passed);
console.log('  Violations:', result2.violations.length);

// ─── 3. GDPR evaluation ───────────────────────────────────────────────────────

console.log('\n=== 3. GDPR Evaluation ===\n');

const gdprEngine = new PolicyEngine([gdprPolicy]);

const gdprResult = gdprEngine.evaluate({
  content: 'User email: hans@example.de, IP: 192.168.1.100, accessing from Germany.',
  model: 'gpt-4o',
  provider: 'openai',
});

console.log('GDPR check (email + IP):');
console.log('  Passed:', gdprResult.passed);
console.log('  Violations:', gdprResult.violations.length);
for (const v of gdprResult.violations) {
  console.log(`  - [${v.severity}] ${v.message}`);
}

// ─── 4. Policy composition ─────────────────────────────────────────────────────

console.log('\n=== 4. Policy Composition ===\n');

// Compose HIPAA + GDPR + Safety into a single strict policy
const composedEngine = PolicyEngine.compose(
  [hipaaPolicy, gdprPolicy, safetyPolicy],
  'strictest',
);

console.log('Composed engine policies:', composedEngine.listPolicies());

const composedResult = composedEngine.evaluate({
  content: 'Transfer patient records for SSN 123-45-6789 to the EU server.',
  model: 'claude-sonnet-4-6',
  provider: 'anthropic',
});

console.log('Composed policy check:');
console.log('  Passed:', composedResult.passed);
console.log('  Violations:', composedResult.violations.length);
for (const v of composedResult.violations.slice(0, 5)) {
  console.log(`  - [${v.severity}] ${v.message}`);
}

// ─── 5. Single policy evaluation ───────────────────────────────────────────────

console.log('\n=== 5. Evaluate Against a Specific Policy ===\n');

const multiEngine = PolicyEngine.fromPresets(['hipaa', 'gdpr', 'safety']);

// Only check against HIPAA
const hipaaOnly = multiEngine.evaluateWith('hipaa', {
  content: 'Patient DOB: 01/01/1980',
  model: 'claude-sonnet-4-6',
  provider: 'anthropic',
});

console.log('HIPAA-only check (DOB):');
console.log('  Passed:', hipaaOnly.passed);
console.log('  Policies evaluated:', hipaaOnly.policiesEvaluated);

// ─── 6. Export and import ──────────────────────────────────────────────────────

console.log('\n=== 6. Serialization ===\n');

const schema = engine.toSchema();
console.log('Exported', schema.policies.length, 'policies to JSON schema');

const restored = PolicyEngine.fromSchema(schema);
console.log('Restored engine has', restored.size, 'policies');
console.log('Policy IDs:', restored.listPolicies());

console.log('\nDone.');
