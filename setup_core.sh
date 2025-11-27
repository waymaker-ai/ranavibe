#!/bin/bash
set -e

echo "🚀 Setting up RANA Core Package..."

# Create quality-gates checker
cat > packages/core/src/quality-gates/index.ts << 'EOF'
import { RanaConfig, QualityGate } from '../config';

export interface QualityGateResult {
  gate: QualityGate;
  passed: boolean;
  message: string;
}

export interface PhaseResults {
  phase: string;
  gates: QualityGateResult[];
  allPassed: boolean;
}

export class QualityGateChecker {
  private config: RanaConfig;

  constructor(config: RanaConfig) {
    this.config = config;
  }

  /**
   * Check all quality gates for a specific phase
   */
  checkPhase(
    phase: 'pre_implementation' | 'implementation' | 'testing' | 'deployment'
  ): PhaseResults {
    const gates = this.config.quality_gates[phase];
    const results: QualityGateResult[] = [];

    for (const gate of gates) {
      // For now, gates require manual verification
      // In future, we can add automated checks
      results.push({
        gate,
        passed: false, // Manual verification required
        message: `Manual verification required: ${gate.description}`,
      });
    }

    return {
      phase,
      gates: results,
      allPassed: results.every((r) => r.passed),
    };
  }

  /**
   * Get gates that apply to a major feature
   */
  getMajorFeatureGates(): QualityGate[] {
    const gates = this.config.quality_gates.pre_implementation;
    return gates.filter((g) => g.required_for === 'major_features');
  }
}
EOF

# Create REPM validator
cat > packages/core/src/repm/index.ts << 'EOF'
export interface REPMPhase {
  name: string;
  description: string;
  questions: string[];
  template: string;
}

export const REPM_PHASES: REPMPhase[] = [
  {
    name: 'outcome',
    description: 'Define desired outcome',
    questions: [
      'What does success look like in 3 years?',
      'What metrics matter most?',
      'What problem is permanently solved?',
    ],
    template: 'Desired Outcome (3 years)\nBusiness Metrics:\n- Revenue: $___\n- Users: ___\n- Impact: ___',
  },
  {
    name: 'monetization',
    description: 'Validate monetization model',
    questions: [
      'What is the pricing model?',
      'What are unit economics (CAC, LTV)?',
      'Is there a clear path to profitability?',
    ],
    template: 'Monetization Model\nPricing: $___/month\nCAC: $___\nLTV: $___\nLTV:CAC: ___',
  },
  {
    name: 'gtm',
    description: 'Design go-to-market strategy',
    questions: [
      'Who is the target customer?',
      'How do we reach them?',
      'What channels work best?',
    ],
    template: 'Go-to-Market Strategy\nTarget Customer: ___\nChannels:\n1. ___\n2. ___',
  },
  {
    name: 'ux',
    description: 'Map user experience journey',
    questions: [
      'What is the user journey?',
      'Where is the "aha moment"?',
      'How do we activate users?',
    ],
    template: 'User Experience\nDiscovery: ___\nActivation: ___\nAha moment: ___',
  },
  {
    name: 'product',
    description: 'Design product',
    questions: [
      'What features are MVP?',
      'What can we punt to V2?',
      'What is the scope?',
    ],
    template: 'Product Design\nMVP Features:\n- ___\n- ___\nV2 Features:\n- ___',
  },
  {
    name: 'build',
    description: 'Plan build',
    questions: [
      'What is the tech stack?',
      'How long to build?',
      'What dependencies exist?',
    ],
    template: 'Build Plan\nTech Stack: ___\nTimeline: ___ weeks\nDependencies: ___',
  },
  {
    name: 'idea',
    description: 'Validate idea (GO/NO-GO)',
    questions: [
      'Does market validation pass?',
      'Do unit economics work?',
      'Can we execute?',
      'GO or NO-GO?',
    ],
    template: 'Validation\nMarket: [ ] Pass\nBusiness: [ ] Pass\nExecution: [ ] Pass\nDecision: ___',
  },
];

export class REPMValidator {
  /**
   * Get all REPM phases
   */
  getPhases(): REPMPhase[] {
    return REPM_PHASES;
  }

  /**
   * Get a specific REPM phase
   */
  getPhase(phaseName: string): REPMPhase | undefined {
    return REPM_PHASES.find((p) => p.name === phaseName);
  }

  /**
   * Generate REPM validation checklist
   */
  generateChecklist(): string {
    return REPM_PHASES.map(
      (phase, idx) =>
        `${idx + 1}. ${phase.description}\n   Questions:\n${phase.questions.map((q) => `   - ${q}`).join('\n')}`
    ).join('\n\n');
  }
}
EOF

# Create templates manager
cat > packages/core/src/templates/index.ts << 'EOF'
export const DEFAULT_RANA_CONFIG = `version: "1.0.0"

project:
  name: "My Project"
  type: "fullstack"
  description: "Project description"
  languages:
    - "typescript"

standards:
  principles:
    - search_before_create
    - real_data_only
    - test_everything
    - design_system_compliance
    - deploy_to_production

quality_gates:
  pre_implementation:
    - name: "Search for existing implementations"
      description: "Find existing patterns before creating new ones"
      required: true

  implementation:
    - name: "TypeScript strict mode compliance"
      description: "No 'any' types, proper type definitions"
      required: true

  testing:
    - name: "Manual testing completed"
      description: "Test all user flows manually"
      required: true

  deployment:
    - name: "Deploy to production"
      description: "Deploy and verify feature works"
      required: true
`;

export class TemplateManager {
  /**
   * Get default RANA config template
   */
  getDefaultConfig(): string {
    return DEFAULT_RANA_CONFIG;
  }

  /**
   * Generate config for a specific project type
   */
  generateConfig(projectType: 'nextjs' | 'react' | 'python'): string {
    // TODO: Add project-specific templates
    return DEFAULT_RANA_CONFIG;
  }
}
EOF

# Create utils
cat > packages/core/src/utils/index.ts << 'EOF'
/**
 * Utility functions for RANA core
 */

export function validateYamlSyntax(content: string): boolean {
  try {
    require('js-yaml').load(content);
    return true;
  } catch {
    return false;
  }
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
EOF

echo "✅ Core package implementation complete"
