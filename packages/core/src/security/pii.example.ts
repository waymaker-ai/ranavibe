/**
 * PII Detection and Redaction Examples
 * Demonstrates usage of RANA's PII detection and protection features
 */

import {
  PIIDetector,
  createPIIDetector,
  detectPIIAdvanced,
  redactPII,
  maskPII,
  validateCreditCard,
  detectCreditCardType,
  type PIIDetectorConfig,
  type PIIResult,
} from './pii.js';

// ============================================================================
// Example 1: Basic Detection
// ============================================================================

console.log('\n=== Example 1: Basic PII Detection ===\n');

const detector = createPIIDetector();

const userInput = `
  Hi, I'm John Doe. You can reach me at:
  Email: john.doe@company.com
  Phone: (555) 123-4567
  SSN: 123-45-6789
  My server is at 192.168.1.100
`;

const detectResult = detector.detect(userInput);

console.log('PII Detected:', detectResult.detected);
console.log('Total PII found:', detectResult.stats.total);
console.log('By type:', detectResult.stats.byType);
console.log('\nDetections:');
detectResult.detections.forEach((detection) => {
  console.log(`  - ${detection.type}: ${detection.value} (at position ${detection.start})`);
});

// ============================================================================
// Example 2: Redaction
// ============================================================================

console.log('\n=== Example 2: PII Redaction ===\n');

const sensitiveText = 'Contact john@example.com or call 555-123-4567';
const redactedResult = detector.redact(sensitiveText);

console.log('Original:', redactedResult.original);
console.log('Redacted:', redactedResult.processed);

// ============================================================================
// Example 3: Masking (Partial Hiding)
// ============================================================================

console.log('\n=== Example 3: PII Masking ===\n');

const maskedResult = detector.mask(sensitiveText);

console.log('Original:', maskedResult.original);
console.log('Masked:  ', maskedResult.processed);

// ============================================================================
// Example 4: Custom Placeholders
// ============================================================================

console.log('\n=== Example 4: Custom Placeholders ===\n');

const customDetector = createPIIDetector({
  placeholders: {
    email: '***EMAIL_REMOVED***',
    phone: '***PHONE_REMOVED***',
    ssn: '***SSN_REMOVED***',
  },
});

const customRedacted = customDetector.redact(
  'Email: john@example.com, Phone: 555-123-4567, SSN: 123-45-6789'
);

console.log('Custom Redaction:', customRedacted.processed);

// ============================================================================
// Example 5: Selective Detection
// ============================================================================

console.log('\n=== Example 5: Selective Detection ===\n');

const emailOnlyDetector = createPIIDetector({
  enabledTypes: ['email'], // Only detect emails
});

const selectiveResult = emailOnlyDetector.detect(
  'Email: john@example.com, Phone: 555-123-4567'
);

console.log('Email-only detection:', selectiveResult.detections);
console.log('Stats:', selectiveResult.stats.byType);

// ============================================================================
// Example 6: Name Detection (Heuristic-Based)
// ============================================================================

console.log('\n=== Example 6: Name Detection ===\n');

const nameDetector = createPIIDetector({
  enabledTypes: ['name'],
  detectNames: true,
  nameConfidenceThreshold: 0.5,
});

const nameTexts = [
  'My name is John Smith',
  'Dr. Jane Doe will see you now',
  'Contact Michael Johnson for details',
];

nameTexts.forEach((text) => {
  const result = nameDetector.detect(text);
  console.log(`Text: "${text}"`);
  if (result.detected) {
    result.detections.forEach((d) => {
      console.log(`  Found: ${d.value} (confidence: ${d.confidence?.toFixed(2)})`);
    });
  } else {
    console.log('  No names detected');
  }
});

// ============================================================================
// Example 7: Custom Patterns
// ============================================================================

console.log('\n=== Example 7: Custom Patterns ===\n');

const customPatternDetector = createPIIDetector({
  enabledTypes: ['custom'],
  customPatterns: [
    {
      name: 'employeeId',
      pattern: /EMP-\d{6}/g,
      placeholder: '[EMPLOYEE_ID]',
    },
    {
      name: 'patientId',
      pattern: /PAT-[A-Z]{2}-\d{4}/g,
      placeholder: '[PATIENT_ID]',
    },
  ],
});

const customText = 'Employee EMP-123456 treated patient PAT-AB-1234';
const customResult = customPatternDetector.redact(customText);

console.log('Original:', customResult.original);
console.log('Redacted:', customResult.processed);
console.log('Detections:', customResult.detections.map((d) => d.value));

// ============================================================================
// Example 8: Region-Specific Patterns
// ============================================================================

console.log('\n=== Example 8: Region-Specific Patterns ===\n');

const usDetector = createPIIDetector({ region: 'US' });
const ukDetector = createPIIDetector({ region: 'UK' });

const usPhone = '555-123-4567';
const ukPhone = '+44 20 7123 4567';

console.log('US Detector:');
console.log(`  US Phone detected: ${usDetector.hasPII(usPhone)}`);
console.log(`  UK Phone detected: ${usDetector.hasPII(ukPhone)}`);

console.log('UK Detector:');
console.log(`  US Phone detected: ${ukDetector.hasPII(usPhone)}`);
console.log(`  UK Phone detected: ${ukDetector.hasPII(ukPhone)}`);

// ============================================================================
// Example 9: Credit Card Validation
// ============================================================================

console.log('\n=== Example 9: Credit Card Validation ===\n');

const cardNumbers = [
  '4532015112830366', // Valid Visa
  '5425233430109903', // Valid Mastercard
  '374245455400126', // Valid Amex
  '1234567890123456', // Invalid
];

cardNumbers.forEach((card) => {
  const isValid = validateCreditCard(card);
  const cardType = detectCreditCardType(card);
  console.log(`Card: ${card}`);
  console.log(`  Valid: ${isValid}, Type: ${cardType || 'Unknown'}`);
});

// ============================================================================
// Example 10: Real-World Use Case - Chat Application
// ============================================================================

console.log('\n=== Example 10: Chat Application Example ===\n');

const chatDetector = createPIIDetector({
  enabledTypes: ['email', 'phone', 'ssn', 'creditCard'],
  preserveFormat: true,
});

function processUserMessage(message: string): {
  safe: boolean;
  processedMessage: string;
  warnings: string[];
} {
  const result = chatDetector.mask(message);
  const warnings: string[] = [];

  if (result.detected) {
    result.detections.forEach((detection) => {
      warnings.push(`${detection.type} detected and masked`);
    });
  }

  return {
    safe: !result.detected,
    processedMessage: result.processed,
    warnings,
  };
}

const chatMessages = [
  'Can you help me with my order?',
  'My email is john@example.com',
  'Call me at 555-123-4567',
  'My credit card is 4532-1234-5678-9010',
];

chatMessages.forEach((msg) => {
  const result = processUserMessage(msg);
  console.log(`\nUser: "${msg}"`);
  console.log(`Safe: ${result.safe}`);
  console.log(`Processed: "${result.processedMessage}"`);
  if (result.warnings.length > 0) {
    console.log(`Warnings: ${result.warnings.join(', ')}`);
  }
});

// ============================================================================
// Example 11: Convenience Functions
// ============================================================================

console.log('\n=== Example 11: Convenience Functions ===\n');

const quickText = 'Email me at quick@example.com or call 555-9999';

// Quick detection
const quickDetect = detectPIIAdvanced(quickText);
console.log('Quick detect:', quickDetect.detected);

// Quick redaction
const quickRedact = redactPII(quickText);
console.log('Quick redact:', quickRedact);

// Quick masking
const quickMask = maskPII(quickText);
console.log('Quick mask:', quickMask);

// ============================================================================
// Example 12: Audit Log Sanitization
// ============================================================================

console.log('\n=== Example 12: Audit Log Sanitization ===\n');

const auditDetector = createPIIDetector({
  enabledTypes: ['email', 'phone', 'ssn', 'ipAddress'],
});

interface AuditLog {
  timestamp: Date;
  action: string;
  user: string;
  details: string;
}

function sanitizeAuditLog(log: AuditLog): AuditLog {
  return {
    ...log,
    user: redactPII(log.user),
    details: redactPII(log.details),
  };
}

const auditLogs: AuditLog[] = [
  {
    timestamp: new Date(),
    action: 'login',
    user: 'john@example.com',
    details: 'Login from 192.168.1.100',
  },
  {
    timestamp: new Date(),
    action: 'update_profile',
    user: 'jane@example.com',
    details: 'Changed phone to 555-123-4567',
  },
];

console.log('Original logs:');
auditLogs.forEach((log) => {
  console.log(`  ${log.action}: ${log.user} - ${log.details}`);
});

console.log('\nSanitized logs:');
auditLogs.map(sanitizeAuditLog).forEach((log) => {
  console.log(`  ${log.action}: ${log.user} - ${log.details}`);
});

// ============================================================================
// Example 13: Dynamic Configuration Updates
// ============================================================================

console.log('\n=== Example 13: Dynamic Configuration Updates ===\n');

const dynamicDetector = createPIIDetector({
  enabledTypes: ['email'],
});

console.log('Initial config - detecting emails only:');
const beforeUpdate = dynamicDetector.detect('Email: john@example.com, Phone: 555-123-4567');
console.log('  Detections:', beforeUpdate.stats.byType);

// Update configuration
dynamicDetector.updateConfig({
  enabledTypes: ['email', 'phone', 'ssn'],
});

console.log('After update - detecting emails, phones, and SSNs:');
const afterUpdate = dynamicDetector.detect('Email: john@example.com, Phone: 555-123-4567');
console.log('  Detections:', afterUpdate.stats.byType);

// ============================================================================
// Example 14: Processing Different Modes
// ============================================================================

console.log('\n=== Example 14: Processing Different Modes ===\n');

const multiModeDetector = createPIIDetector();
const testText = 'Contact: john@example.com, Phone: 555-123-4567';

console.log('Original:', testText);
console.log('Detect mode:', multiModeDetector.process(testText, 'detect').processed);
console.log('Redact mode:', multiModeDetector.process(testText, 'redact').processed);
console.log('Mask mode:  ', multiModeDetector.process(testText, 'mask').processed);

// ============================================================================
// Example 15: Error Handling and Edge Cases
// ============================================================================

console.log('\n=== Example 15: Edge Cases ===\n');

const edgeDetector = createPIIDetector();

const edgeCases = [
  '', // Empty string
  'No PII here!', // No PII
  'john@', // Incomplete email
  '123-45-', // Incomplete SSN
  'Multiple emails: john@example.com, jane@test.com, bob@demo.com', // Multiple same type
];

edgeCases.forEach((text) => {
  const result = edgeDetector.detect(text);
  console.log(`Text: "${text || '(empty)'}"`);
  console.log(`  Detected: ${result.detected}, Count: ${result.stats.total}`);
});

console.log('\n=== Examples Complete ===\n');

export {
  detector,
  customDetector,
  emailOnlyDetector,
  nameDetector,
  customPatternDetector,
  processUserMessage,
  sanitizeAuditLog,
};
