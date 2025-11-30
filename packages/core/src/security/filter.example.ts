/**
 * Content Filter Examples
 * Demonstrates usage of the RANA Content Filter
 */

import {
  ContentFilter,
  createContentFilter,
  isContentSafe,
  assertContentSafe,
  type ContentFilterConfig,
  type FilterResult,
} from './filter';

// ============================================================================
// Example 1: Basic Usage
// ============================================================================

console.log('=== Example 1: Basic Content Filtering ===\n');

const basicFilter = createContentFilter({
  defaultAction: 'warn',
  enableProfanityFilter: true,
  enableHarmfulContentFilter: true,
  enableSpamFilter: true,
});

const testContent = 'This is a damn good example of content filtering.';
const result: FilterResult = basicFilter.filter(testContent);

console.log('Content:', testContent);
console.log('Passed:', result.passed);
console.log('Action:', result.action_taken);
console.log('Violations:', result.violations);
console.log('Metadata:', result.metadata);
console.log();

// ============================================================================
// Example 2: Content Redaction
// ============================================================================

console.log('=== Example 2: Content Redaction ===\n');

const redactFilter = createContentFilter({
  defaultAction: 'redact',
  enableProfanityFilter: true,
  redactionText: '***',
});

const profaneContent = 'This damn thing is a piece of crap!';
const redactResult = redactFilter.filter(profaneContent);

console.log('Original:', profaneContent);
console.log('Filtered:', redactResult.filtered_content);
console.log('Violations found:', redactResult.violations.length);
console.log();

// ============================================================================
// Example 3: Custom Blocklist
// ============================================================================

console.log('=== Example 3: Custom Blocklist ===\n');

const customFilter = createContentFilter({
  blocklist: [
    {
      pattern: /\b(confidential|secret|internal)\b/i,
      category: 'custom',
      severity: 'high',
    },
    {
      pattern: /password|api[_-]?key/i,
      category: 'custom',
      severity: 'critical',
    },
  ],
  defaultAction: 'block',
  categoryActions: {
    custom: 'block',
  },
});

const sensitiveContent = 'The confidential API_KEY is stored in the database.';
const customResult = customFilter.filter(sensitiveContent);

console.log('Content:', sensitiveContent);
console.log('Passed:', customResult.passed);
console.log('Action:', customResult.action_taken);
console.log('Violations:');
customResult.violations.forEach(v => {
  console.log(`  - ${v.category}: "${v.match}" (${v.severity})`);
});
console.log();

// ============================================================================
// Example 4: Allowlist (Exceptions)
// ============================================================================

console.log('=== Example 4: Allowlist Exceptions ===\n');

const allowlistFilter = createContentFilter({
  allowlist: ['damn', 'hell'],
  enableProfanityFilter: true,
  defaultAction: 'warn',
});

const allowedContent = 'Damn, this is good! Hell yeah!';
const notAllowedContent = 'This is complete shit!';

const allowed = allowlistFilter.filter(allowedContent);
const notAllowed = allowlistFilter.filter(notAllowedContent);

console.log('Allowed content:', allowedContent);
console.log('  Violations:', allowed.violations.length);
console.log();
console.log('Not allowed content:', notAllowedContent);
console.log('  Violations:', notAllowed.violations.length);
console.log();

// ============================================================================
// Example 5: Severity Threshold
// ============================================================================

console.log('=== Example 5: Severity Threshold ===\n');

const severityFilter = createContentFilter({
  severityThreshold: 'high',
  enableProfanityFilter: true,
  enableHarmfulContentFilter: true,
  defaultAction: 'block',
});

const lowSeverity = 'This is damn annoying.';
const highSeverity = 'How to kill someone with a weapon.';

const lowResult = severityFilter.filter(lowSeverity);
const highResult = severityFilter.filter(highSeverity);

console.log('Low severity content:', lowSeverity);
console.log('  Passed:', lowResult.passed);
console.log('  Action:', lowResult.action_taken);
console.log();
console.log('High severity content:', highSeverity);
console.log('  Passed:', highResult.passed);
console.log('  Action:', highResult.action_taken);
console.log('  Violations:', highResult.violations.map(v => `${v.category} (${v.severity})`));
console.log();

// ============================================================================
// Example 6: Category-Specific Actions
// ============================================================================

console.log('=== Example 6: Category-Specific Actions ===\n');

const categoryFilter = createContentFilter({
  enableProfanityFilter: true,
  enableHarmfulContentFilter: true,
  enableSpamFilter: true,
  categoryActions: {
    violence: 'block',
    profanity: 'redact',
    spam: 'warn',
  },
});

const violentContent = 'Instructions on how to kill someone.';
const profaneContent2 = 'This is a damn good filter.';
const spamContent = 'Click here now! Buy now!';

console.log('Violent content:', violentContent);
console.log('  Action:', categoryFilter.filter(violentContent).action_taken);
console.log();
console.log('Profane content:', profaneContent2);
const profaneResult = categoryFilter.filter(profaneContent2);
console.log('  Action:', profaneResult.action_taken);
console.log('  Filtered:', profaneResult.filtered_content);
console.log();
console.log('Spam content:', spamContent);
console.log('  Action:', categoryFilter.filter(spamContent).action_taken);
console.log();

// ============================================================================
// Example 7: Callbacks
// ============================================================================

console.log('=== Example 7: Using Callbacks ===\n');

const callbackFilter = createContentFilter({
  enableProfanityFilter: true,
  enableHarmfulContentFilter: true,
  defaultAction: 'block',
  onViolation: (violation, content) => {
    console.log(`[VIOLATION] ${violation.severity.toUpperCase()}: ${violation.category} - "${violation.match}"`);
  },
  onBlock: (result) => {
    console.log(`[BLOCKED] Content blocked with ${result.violations.length} violation(s)`);
  },
});

const violationContent = 'This damn violent content about how to kill.';
console.log('Processing:', violationContent);
const callbackResult = callbackFilter.filter(violationContent);
console.log('Result:', callbackResult.passed ? 'PASSED' : 'FAILED');
console.log();

// ============================================================================
// Example 8: Quick Utility Functions
// ============================================================================

console.log('=== Example 8: Quick Utility Functions ===\n');

const safeContent = 'This is perfectly safe content.';
const unsafeContent = 'How to murder someone.';

console.log('Safe content:', safeContent);
console.log('  Is safe:', isContentSafe(safeContent));
console.log();
console.log('Unsafe content:', unsafeContent);
console.log('  Is safe:', isContentSafe(unsafeContent));
console.log();

// Try assertContentSafe (will throw if unsafe)
try {
  assertContentSafe(safeContent);
  console.log('Safe content assertion: PASSED');
} catch (error) {
  console.log('Safe content assertion: FAILED');
}

try {
  assertContentSafe(unsafeContent);
  console.log('Unsafe content assertion: PASSED');
} catch (error) {
  console.log('Unsafe content assertion: FAILED (expected)');
}
console.log();

// ============================================================================
// Example 9: Dynamic Pattern Management
// ============================================================================

console.log('=== Example 9: Dynamic Pattern Management ===\n');

const dynamicFilter = createContentFilter({
  enableProfanityFilter: false,
  defaultAction: 'warn',
});

console.log('Initial stats:', dynamicFilter.getStats());

// Add custom patterns
dynamicFilter.addPattern({
  pattern: /\b(restricted|forbidden)\b/i,
  category: 'custom',
  severity: 'medium',
});

console.log('After adding pattern:', dynamicFilter.getStats());

const dynamicContent = 'This is restricted content.';
const dynamicResult = dynamicFilter.filter(dynamicContent);
console.log('Content:', dynamicContent);
console.log('Violations:', dynamicResult.violations.length);
console.log();

// ============================================================================
// Example 10: Integration with RANA Chat
// ============================================================================

console.log('=== Example 10: Integration with RANA ===\n');

// Example of how to integrate with RANA chat requests
const ranaFilter = createContentFilter({
  enableProfanityFilter: true,
  enableHarmfulContentFilter: true,
  defaultAction: 'block',
  categoryActions: {
    violence: 'block',
    'self-harm': 'block',
    hate: 'block',
  },
  onBlock: (result) => {
    console.error('User message blocked:', {
      violations: result.violations.length,
      categories: result.metadata?.categories_triggered,
    });
  },
});

// Simulate filtering a user message before sending to LLM
function filterUserMessage(message: string): string {
  const result = ranaFilter.filter(message);

  if (result.action_taken === 'block') {
    throw new Error('Message contains prohibited content and cannot be processed.');
  }

  if (result.action_taken === 'redact') {
    return result.filtered_content;
  }

  return message;
}

const userMessage = 'Can you help me with this task?';
const filteredMessage = filterUserMessage(userMessage);
console.log('Original message:', userMessage);
console.log('Filtered message:', filteredMessage);
console.log();

console.log('=== Examples Complete ===');
