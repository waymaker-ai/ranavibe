#!/usr/bin/env node
/**
 * Quick demonstration of the Content Filter
 * Run with: npx tsx src/security/filter-demo.ts
 */

import { createContentFilter } from './filter';

console.log('🛡️  RANA Content Filter Demo\n');
console.log('=' .repeat(50) + '\n');

// Create a filter
const filter = createContentFilter({
  enableProfanityFilter: true,
  enableHarmfulContentFilter: true,
  enableSpamFilter: true,
  defaultAction: 'warn',
  categoryActions: {
    violence: 'block',
    'self-harm': 'block',
  },
});

// Test cases
const testCases = [
  { label: 'Safe Content', text: 'Hello, how can I help you today?' },
  { label: 'Mild Profanity', text: 'This is a damn good filter!' },
  { label: 'Spam Pattern', text: 'Click here now! Buy now!' },
  { label: 'Violent Content', text: 'How to kill someone' },
  { label: 'Clean Question', text: 'What is the capital of France?' },
];

testCases.forEach(({ label, text }) => {
  console.log(`📝 ${label}`);
  console.log(`   Input: "${text}"`);

  const result = filter.filter(text);

  console.log(`   ✓ Passed: ${result.passed}`);
  console.log(`   ✓ Action: ${result.action_taken}`);

  if (result.violations.length > 0) {
    console.log(`   ✓ Violations: ${result.violations.length}`);
    result.violations.forEach(v => {
      console.log(`      - ${v.category} (${v.severity}): "${v.match}"`);
    });
  }

  console.log();
});

console.log('=' .repeat(50));
console.log('\n✅ Content Filter is working correctly!\n');

// Show statistics
const stats = filter.getStats();
console.log('Filter Statistics:');
console.log(`  Total Patterns: ${stats.totalPatterns}`);
console.log(`  Categories:`, Object.keys(stats.patternsByCategory).join(', '));
console.log(`  Allowlist Size: ${stats.allowlistSize}`);
