/**
 * Prompt Collaboration Example
 * Demonstrates Git-like version control for prompts
 */

import { PromptRegistry, PromptVersion, PromptReview } from '@rana/core';

async function main() {
  // Example 1: Basic prompt registry
  console.log('=== Prompt Registry Setup ===');

  const registry = new PromptRegistry({
    storage: 'database', // or 'filesystem', 'git'
    connection: process.env.DATABASE_URL,
    namespace: 'my-app',
  });

  // Create a new prompt
  const prompt = await registry.create({
    id: 'customer-support',
    name: 'Customer Support Agent',
    description: 'Handles customer inquiries and support requests',
    template: `You are a helpful customer support agent for {{company_name}}.

Your responsibilities:
- Answer customer questions about products and services
- Help resolve issues and complaints
- Provide accurate information

Customer Name: {{customer_name}}
Issue Category: {{category}}

Guidelines:
- Be professional and empathetic
- If you cannot help, escalate to a human agent
- Never share sensitive customer information`,
    variables: [
      { name: 'company_name', type: 'string', required: true },
      { name: 'customer_name', type: 'string', required: true },
      { name: 'category', type: 'enum', values: ['billing', 'technical', 'general'], required: true },
    ],
    metadata: {
      author: 'alice@example.com',
      tags: ['support', 'customer-facing'],
      model: 'gpt-4o',
    },
  });

  console.log(`Created prompt: ${prompt.id} (v${prompt.version})`);

  // Example 2: Render prompt with variables
  console.log('\n=== Render Prompt ===');

  const rendered = await registry.render('customer-support', {
    company_name: 'TechCorp',
    customer_name: 'John Doe',
    category: 'billing',
  });

  console.log('Rendered prompt:');
  console.log(rendered);

  // Example 3: Update and commit changes
  console.log('\n=== Version Control ===');

  // Update the prompt
  await registry.update('customer-support', {
    template: `You are a helpful customer support agent for {{company_name}}.

Your responsibilities:
- Answer customer questions about products and services
- Help resolve issues and complaints
- Provide accurate information
- Suggest relevant products when appropriate

Customer Name: {{customer_name}}
Issue Category: {{category}}

Guidelines:
- Be professional and empathetic
- Respond within 2 sentences when possible
- If you cannot help, escalate to a human agent
- Never share sensitive customer information
- Always confirm the customer's satisfaction before closing`,
  });

  // Commit the changes
  await registry.commit('customer-support', {
    message: 'Added product suggestions and satisfaction confirmation',
    author: 'bob@example.com',
  });

  console.log('Changes committed');

  // View version history
  const history = await registry.getHistory('customer-support');
  console.log('\nVersion history:');
  for (const version of history) {
    console.log(`  v${version.version} - ${version.message} (${version.author}, ${version.timestamp})`);
  }

  // Example 4: Compare versions
  console.log('\n=== Version Diff ===');

  const diff = await registry.diff('customer-support', { from: 1, to: 2 });

  console.log('Changes from v1 to v2:');
  for (const change of diff.changes) {
    if (change.type === 'added') {
      console.log(`  + ${change.line}`);
    } else if (change.type === 'removed') {
      console.log(`  - ${change.line}`);
    } else {
      console.log(`    ${change.line}`);
    }
  }

  // Example 5: Review workflow
  console.log('\n=== Review Workflow ===');

  // Request review
  const reviewRequest = await registry.requestReview('customer-support', {
    reviewers: ['charlie@example.com', 'diana@example.com'],
    version: 2,
    message: 'Please review the updated customer support prompt',
  });

  console.log(`Review requested: ${reviewRequest.id}`);

  // Simulate reviewer actions
  await registry.addReviewComment('customer-support', reviewRequest.id, {
    author: 'charlie@example.com',
    comment: 'Looks good, but consider adding a greeting template',
    line: 1,
  });

  await registry.approveReview('customer-support', reviewRequest.id, {
    author: 'charlie@example.com',
    comment: 'LGTM after addressing the greeting',
  });

  await registry.approveReview('customer-support', reviewRequest.id, {
    author: 'diana@example.com',
    comment: 'Approved!',
  });

  // Check review status
  const review = await registry.getReview('customer-support', reviewRequest.id);
  console.log(`Review status: ${review.status}`);
  console.log(`Approvals: ${review.approvals.length}/${review.requiredApprovals}`);

  // Example 6: Publishing
  console.log('\n=== Publishing ===');

  // Publish to production
  await registry.publish('customer-support', {
    version: 2,
    environment: 'production',
    changelog: 'Added product suggestions and satisfaction confirmation',
  });

  console.log('Published to production');

  // Check deployment status
  const deployments = await registry.getDeployments('customer-support');
  console.log('\nDeployments:');
  for (const deployment of deployments) {
    console.log(`  ${deployment.environment}: v${deployment.version} (${deployment.status})`);
  }

  // Example 7: Rollback
  console.log('\n=== Rollback ===');

  // Rollback to previous version
  await registry.rollback('customer-support', {
    version: 1,
    reason: 'Performance regression detected',
    author: 'alice@example.com',
  });

  console.log('Rolled back to v1');

  // Example 8: Branching (for experimentation)
  console.log('\n=== Branching ===');

  // Create an experimental branch
  await registry.branch('customer-support', {
    name: 'experiment/more-empathy',
    from: 2,
  });

  // Make changes on branch
  await registry.update('customer-support', {
    template: '... more empathetic version ...',
    branch: 'experiment/more-empathy',
  });

  await registry.commit('customer-support', {
    message: 'Testing more empathetic responses',
    branch: 'experiment/more-empathy',
  });

  // List branches
  const branches = await registry.listBranches('customer-support');
  console.log('Branches:', branches.map(b => b.name).join(', '));

  // Merge branch (after testing)
  await registry.merge('customer-support', {
    from: 'experiment/more-empathy',
    to: 'main',
    strategy: 'squash',
  });

  console.log('Branch merged');

  // Example 9: A/B Testing
  console.log('\n=== A/B Testing ===');

  // Create variants
  await registry.createVariant('customer-support', {
    name: 'variant-a',
    version: 2,
    weight: 50,
  });

  await registry.createVariant('customer-support', {
    name: 'variant-b',
    version: 3,
    weight: 50,
  });

  // Get variant for a user
  const variant = await registry.getVariant('customer-support', {
    userId: 'user-123',
  });

  console.log(`User assigned to: ${variant.name} (v${variant.version})`);

  // Track variant performance
  await registry.trackMetric('customer-support', variant.name, {
    metric: 'satisfaction',
    value: 4.5,
  });

  // Get A/B test results
  const abResults = await registry.getABTestResults('customer-support');
  console.log('\nA/B Test Results:');
  for (const result of abResults) {
    console.log(`  ${result.variant}: ${result.avgSatisfaction} satisfaction, ${result.sampleSize} samples`);
  }

  // Example 10: Import/Export
  console.log('\n=== Import/Export ===');

  // Export all prompts
  const exported = await registry.export({
    format: 'yaml', // or 'json'
    includeHistory: true,
  });

  console.log('Exported prompts to YAML');

  // Import prompts (e.g., from another environment)
  await registry.import({
    source: './prompts/production.yaml',
    strategy: 'merge', // or 'replace', 'skip-existing'
    onConflict: 'prompt', // or 'overwrite', 'skip'
  });

  console.log('Imported prompts');

  // Example 11: Analytics
  console.log('\n=== Analytics ===');

  const analytics = await registry.getAnalytics('customer-support', {
    period: '7d',
  });

  console.log('Prompt Analytics:');
  console.log(`  Total uses: ${analytics.totalUses}`);
  console.log(`  Avg tokens: ${analytics.avgTokens}`);
  console.log(`  Avg cost: $${analytics.avgCost.toFixed(4)}`);
  console.log(`  Success rate: ${analytics.successRate}%`);
  console.log(`  Avg latency: ${analytics.avgLatency}ms`);

  // Example 12: Validation and testing
  console.log('\n=== Prompt Validation ===');

  const validation = await registry.validate('customer-support', {
    checks: [
      'syntax', // Check for syntax errors
      'variables', // Verify all variables are defined
      'length', // Check token limits
      'injection', // Check for prompt injection vulnerabilities
      'consistency', // Check for contradictions
    ],
    testCases: [
      {
        variables: { company_name: 'Test', customer_name: 'User', category: 'billing' },
        expectedBehavior: 'Should greet customer professionally',
      },
    ],
  });

  console.log('Validation results:');
  console.log(`  Passed: ${validation.passed}`);
  for (const check of validation.checks) {
    console.log(`  ${check.name}: ${check.passed ? '✓' : '✗'} ${check.message || ''}`);
  }

  // Cleanup
  console.log('\n=== Cleanup ===');
  await registry.archive('customer-support', {
    reason: 'Demo complete',
  });
  console.log('Prompt archived');
}

main().catch(console.error);
