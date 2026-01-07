/**
 * Full Integration Example: Guidelines + Compliance + RANA Core
 *
 * This example shows how to build a production-ready AI agent
 * with comprehensive guidelines and compliance enforcement.
 */

import { createRana } from '@rana/core';
import { createGuidelineManager, Conditions, PresetGuidelines } from '@rana/guidelines';
import { createComplianceEnforcer, PresetRules } from '@rana/compliance';

interface ConversationContext {
  userId: string;
  category?: string;
  topic?: string;
  userTier?: string;
}

class CompliantAIAgent {
  private rana: any;
  private guidelines: any;
  private compliance: any;

  constructor() {
    // Initialize RANA
    this.rana = createRana({
      providers: {
        anthropic: process.env.ANTHROPIC_API_KEY,
      },
      defaults: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      },
    });

    // Initialize guidelines
    this.guidelines = createGuidelineManager({
      enableAnalytics: true,
      defaultEnforcement: 'advisory',
    });

    // Initialize compliance
    this.compliance = createComplianceEnforcer({
      enableAllPresets: true,
      strictMode: true,
      logViolations: true,

      onViolation: async (violation) => {
        console.log(`\n🚨 Compliance Violation:`);
        console.log(`   Rule: ${violation.rule.name}`);
        console.log(`   Severity: ${violation.rule.severity}`);
        console.log(`   Action: ${violation.actionTaken}`);

        // In production, send to monitoring/logging system
        // await monitoring.logViolation(violation);
      },
    });

    this.setupGuidelines();
  }

  private setupGuidelines() {
    // Add healthcare guidelines
    this.guidelines.addGuideline(PresetGuidelines.noMedicalAdvice());

    // Add finance guidelines
    this.guidelines.addGuideline(PresetGuidelines.financialDisclaimer());

    // Add general guidelines
    this.guidelines.addGuideline(PresetGuidelines.professionalTone());
    this.guidelines.addGuideline(PresetGuidelines.dataPrivacy());
    this.guidelines.addGuideline(PresetGuidelines.customerEmpathy());

    // Add custom business guideline
    this.guidelines.addGuideline({
      id: 'premium-user-benefits',
      name: 'Premium User Benefits',
      description: 'Highlight premium features to free users',
      condition: (context: any) => {
        return context.userTier === 'free' && context.category === 'support';
      },
      content: `This user is on the free tier. When appropriate:
        - Mention premium features that could solve their problem
        - Be helpful but highlight premium value
        - Provide upgrade path if relevant
        - Never be pushy or aggressive about upgrades`,
      enforcement: 'advisory',
      priority: 60,
      category: 'business',
    });
  }

  /**
   * Send a message with full guidelines + compliance enforcement
   */
  async chat(message: string, context: ConversationContext) {
    console.log('\n' + '='.repeat(70));
    console.log(`💬 User: ${message}`);
    console.log('='.repeat(70));

    // 1. Match guidelines based on context
    const matchedGuidelines = await this.guidelines.match({
      message,
      category: context.category,
      topic: context.topic,
      user: {
        id: context.userId,
        metadata: { tier: context.userTier },
      },
    });

    console.log(`\n📋 Matched ${matchedGuidelines.length} guideline(s):`);
    matchedGuidelines.forEach((match) => {
      console.log(`   - ${match.guideline.name} (priority: ${match.guideline.priority})`);
    });

    // 2. Build system prompts from guidelines
    const guidelinePrompts = matchedGuidelines
      .map((m) => m.resolvedContent)
      .join('\n\n---\n\n');

    const systemPrompt = `You are a helpful AI assistant.

${guidelinePrompts ? `Important Guidelines:\n${guidelinePrompts}` : ''}

Always follow these guidelines in your response.`;

    // 3. Generate response with RANA
    console.log('\n🤖 Generating response...');

    const response = await this.rana.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });

    // 4. Enforce compliance
    console.log('🛡️ Checking compliance...');

    const complianceResult = await this.compliance.enforce(message, response.content, {
      topic: context.topic,
      category: context.category,
      user: { id: context.userId },
    });

    // 5. Return final result
    console.log('\n' + '-'.repeat(70));
    console.log('Response Status:');
    console.log(`   Compliant: ${complianceResult.compliant ? '✅' : '❌'}`);
    console.log(`   Action: ${complianceResult.action}`);
    console.log(`   Modified: ${complianceResult.wasModified ? 'Yes' : 'No'}`);

    if (complianceResult.violations.length > 0) {
      console.log(`   Violations: ${complianceResult.violations.length}`);
    }

    if (complianceResult.warnings && complianceResult.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      complianceResult.warnings.forEach((warning) => {
        console.log(`   - ${warning}`);
      });
    }

    console.log('\n🤖 Assistant:');
    console.log(complianceResult.finalOutput);
    console.log('-'.repeat(70));

    // 6. Validate against guidelines
    const validation = await this.guidelines.validate(
      complianceResult.finalOutput,
      { message, ...context },
      matchedGuidelines
    );

    return {
      message: complianceResult.finalOutput,
      compliant: complianceResult.compliant,
      guidelinesMatched: matchedGuidelines.length,
      violations: complianceResult.violations.length,
      wasModified: complianceResult.wasModified,
      validation,
    };
  }

  /**
   * Get analytics and stats
   */
  getStats() {
    return {
      guidelines: {
        total: this.guidelines.getAllGuidelines().length,
        analytics: Array.from(this.guidelines.getAllAnalytics().entries()).map(
          ([id, analytics]) => ({
            id,
            name: this.guidelines.getGuideline(id)?.name,
            matchCount: analytics.matchCount,
            complianceRate: analytics.complianceRate,
          })
        ),
      },
      compliance: this.compliance.getStats(),
    };
  }
}

async function main() {
  console.log('🚀 Starting Compliant AI Agent Demo\n');

  const agent = new CompliantAIAgent();

  // Example 1: Medical question
  await agent.chat('I have a persistent headache for 3 days. What should I do?', {
    userId: 'user123',
    topic: 'medical',
  });

  // Example 2: Financial question
  await agent.chat('Should I invest my savings in cryptocurrency?', {
    userId: 'user123',
    topic: 'investment',
  });

  // Example 3: Customer support (free tier)
  await agent.chat('How can I export my data to CSV?', {
    userId: 'user456',
    category: 'support',
    userTier: 'free',
  });

  // Example 4: General question
  await agent.chat('What is the capital of France?', {
    userId: 'user789',
  });

  // Show final stats
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 Final Statistics');
  console.log('='.repeat(70));

  const stats = agent.getStats();

  console.log('\n📋 Guidelines:');
  console.log(`   Total: ${stats.guidelines.total}`);
  console.log('\n   Usage:');
  stats.guidelines.analytics.forEach((g) => {
    if (g.matchCount > 0) {
      console.log(`   - ${g.name}: ${g.matchCount} matches`);
    }
  });

  console.log('\n🛡️ Compliance:');
  console.log(`   Total Rules: ${stats.compliance.totalRules}`);
  console.log(`   Total Violations: ${stats.compliance.totalViolations}`);

  if (Object.keys(stats.compliance.violationsByRule).length > 0) {
    console.log('\n   Violations by Rule:');
    Object.entries(stats.compliance.violationsByRule).forEach(([rule, count]) => {
      console.log(`   - ${rule}: ${count}`);
    });
  }

  if (Object.keys(stats.compliance.violationsBySeverity).length > 0) {
    console.log('\n   Violations by Severity:');
    Object.entries(stats.compliance.violationsBySeverity).forEach(([severity, count]) => {
      console.log(`   - ${severity}: ${count}`);
    });
  }

  console.log('\n✅ Demo Complete!\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { CompliantAIAgent };
