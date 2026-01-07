/**
 * @rana/guidelines - Basic Usage Example
 *
 * This example demonstrates how to use the guideline system
 * to control AI agent behavior based on context.
 */

import {
  createGuidelineManager,
  createGuideline,
  Conditions,
  PresetGuidelines,
} from '@rana/guidelines';

async function main() {
  console.log('🎯 RANA Guidelines - Basic Usage\n');

  // Create guideline manager
  const manager = createGuidelineManager({
    enableAnalytics: true,
    defaultEnforcement: 'advisory',
  });

  console.log('📝 Adding guidelines...\n');

  // Add preset guidelines
  await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
  await manager.addGuideline(PresetGuidelines.financialDisclaimer());
  await manager.addGuideline(PresetGuidelines.professionalTone());

  // Add custom guideline
  await manager.addGuideline(
    createGuideline({
      id: 'customer-support-empathy',
      name: 'Customer Support Empathy',
      description: 'Show empathy in support conversations',
      condition: Conditions.and(
        Conditions.category('support'),
        Conditions.messageContains(['issue', 'problem', 'broken', 'not working'])
      ),
      content: `The customer is frustrated. Show empathy:
        - Acknowledge their frustration
        - Apologize for the inconvenience
        - Focus on solutions
        - Use phrases like "I understand how frustrating this must be"`,
      enforcement: 'advisory',
      priority: 70,
      category: 'support',
    })
  );

  console.log('✅ Added 4 guidelines\n');

  // Example 1: Medical question
  console.log('Example 1: Medical Question');
  console.log('User: "I have a headache, what should I take?"\n');

  const medicalMatches = await manager.match({
    topic: 'medical',
    message: 'I have a headache, what should I take?',
  });

  console.log(`Matched ${medicalMatches.length} guideline(s):`);
  medicalMatches.forEach((match) => {
    console.log(`  - ${match.guideline.name} (${match.guideline.enforcement})`);
    console.log(`    Priority: ${match.guideline.priority}`);
    console.log(`    Content: ${match.resolvedContent.substring(0, 100)}...\n`);
  });

  // Example 2: Financial question
  console.log('\nExample 2: Financial Question');
  console.log('User: "Should I invest in Bitcoin?"\n');

  const financeMatches = await manager.match({
    topic: 'investment',
    message: 'Should I invest in Bitcoin?',
  });

  console.log(`Matched ${financeMatches.length} guideline(s):`);
  financeMatches.forEach((match) => {
    console.log(`  - ${match.guideline.name} (${match.guideline.enforcement})`);
    console.log(`    Priority: ${match.guideline.priority}`);
    console.log(`    Content: ${match.resolvedContent.substring(0, 100)}...\n`);
  });

  // Example 3: Support question
  console.log('\nExample 3: Customer Support');
  console.log('User: "My app is broken and not working at all!"\n');

  const supportMatches = await manager.match({
    category: 'support',
    message: 'My app is broken and not working at all!',
  });

  console.log(`Matched ${supportMatches.length} guideline(s):`);
  supportMatches.forEach((match) => {
    console.log(`  - ${match.guideline.name} (${match.guideline.enforcement})`);
    console.log(`    Priority: ${match.guideline.priority}`);
    console.log(`    Content: ${match.resolvedContent.substring(0, 150)}...\n`);
  });

  // Show analytics
  console.log('\n📊 Analytics:\n');
  const stats = manager.getAllAnalytics();
  stats.forEach((analytics, id) => {
    const guideline = manager.getGuideline(id);
    if (analytics.matchCount > 0) {
      console.log(`${guideline?.name}:`);
      console.log(`  Matches: ${analytics.matchCount}`);
      console.log(`  Compliance Rate: ${(analytics.complianceRate * 100).toFixed(0)}%`);
    }
  });
}

main().catch(console.error);
