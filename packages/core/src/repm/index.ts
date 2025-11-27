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
