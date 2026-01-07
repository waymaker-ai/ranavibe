/**
 * @rana/compliance - Basic Usage Example
 *
 * This example demonstrates how to use the compliance enforcer
 * to ensure AI outputs meet regulatory requirements.
 */

import {
  createComplianceEnforcer,
  PresetRules,
  detectPII,
  redactPII,
} from '@rana/compliance';

async function main() {
  console.log('🛡️ RANA Compliance - Basic Usage\n');

  // Create compliance enforcer
  const enforcer = createComplianceEnforcer({
    enableAllPresets: true,
    strictMode: false, // Allow warnings
    logViolations: true,

    onViolation: (violation) => {
      console.log(`\n⚠️ Violation: ${violation.rule.name}`);
      console.log(`   Severity: ${violation.rule.severity}`);
      console.log(`   Action: ${violation.actionTaken}`);
    },
  });

  console.log('✅ Compliance enforcer initialized with all preset rules\n');

  // Example 1: Medical advice (HIPAA)
  console.log('='.repeat(60));
  console.log('Example 1: Medical Advice (HIPAA)\n');

  const medical = await enforcer.enforce(
    'I have a headache, what should I do?',
    'You have a migraine. Take 500mg of ibuprofen three times a day.',
    { topic: 'medical' }
  );

  console.log('Input: "I have a headache, what should I do?"');
  console.log('\nOriginal Output:');
  console.log(medical.originalOutput);
  console.log('\nFinal Output:');
  console.log(medical.finalOutput);
  console.log('\nCompliant:', medical.compliant ? '✅' : '❌');
  console.log('Action:', medical.action);
  console.log('Modified:', medical.wasModified ? 'Yes' : 'No');

  // Example 2: Financial advice (SEC/FINRA)
  console.log('\n' + '='.repeat(60));
  console.log('Example 2: Financial Advice (SEC/FINRA)\n');

  const financial = await enforcer.enforce(
    'What should I invest in?',
    'I recommend investing heavily in Tesla stock. Buy at least 100 shares.',
    { topic: 'investment' }
  );

  console.log('Input: "What should I invest in?"');
  console.log('\nOriginal Output:');
  console.log(financial.originalOutput);
  console.log('\nFinal Output:');
  console.log(financial.finalOutput);
  console.log('\nCompliant:', financial.compliant ? '✅' : '❌');
  console.log('Action:', financial.action);

  // Example 3: PII Redaction (GDPR/CCPA)
  console.log('\n' + '='.repeat(60));
  console.log('Example 3: PII Redaction (GDPR/CCPA)\n');

  const piiText = 'Contact me at john.doe@example.com or call 555-123-4567. My SSN is 123-45-6789.';

  const privacy = await enforcer.enforce(
    'How can I reach you?',
    piiText,
    { topic: 'contact' }
  );

  console.log('Original Output:');
  console.log(privacy.originalOutput);
  console.log('\nFinal Output:');
  console.log(privacy.finalOutput);
  console.log('\nPII Detected:');
  const pii = detectPII(piiText);
  pii.forEach((match) => {
    console.log(`  - ${match.type}: "${match.text}"`);
  });

  // Example 4: Financial disclaimer
  console.log('\n' + '='.repeat(60));
  console.log('Example 4: Financial Disclaimer\n');

  const disclaimer = await enforcer.enforce(
    'Is Bitcoin a good investment?',
    'Bitcoin has shown strong growth in recent years. Many investors consider it a good long-term investment.',
    { topic: 'investment' }
  );

  console.log('Original Output:');
  console.log(disclaimer.originalOutput);
  console.log('\nFinal Output (with disclaimer):');
  console.log(disclaimer.finalOutput);

  // Example 5: Password security
  console.log('\n' + '='.repeat(60));
  console.log('Example 5: Password Security\n');

  const password = await enforcer.enforce(
    'Help me log in',
    'Please enter your password so I can help you log in.',
    {}
  );

  console.log('Original Output:');
  console.log(password.originalOutput);
  console.log('\nCompliant:', password.compliant ? '✅' : '❌');
  console.log('Action:', password.action);
  if (password.action === 'block') {
    console.log('⛔ Response blocked - AI should never request passwords');
  }

  // Statistics
  console.log('\n' + '='.repeat(60));
  console.log('📊 Compliance Statistics\n');

  const stats = enforcer.getStats();
  console.log(`Total Rules: ${stats.totalRules}`);
  console.log(`Enabled Rules: ${stats.enabledRules}`);
  console.log(`Total Violations: ${stats.totalViolations}`);
  console.log('\nViolations by Rule:');
  Object.entries(stats.violationsByRule).forEach(([rule, count]) => {
    console.log(`  ${rule}: ${count}`);
  });
  console.log('\nViolations by Severity:');
  Object.entries(stats.violationsBySeverity).forEach(([severity, count]) => {
    console.log(`  ${severity}: ${count}`);
  });
}

main().catch(console.error);
