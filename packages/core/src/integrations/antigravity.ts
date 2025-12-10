/**
 * Google Antigravity Integration for RANA
 *
 * Enables RANA framework to work seamlessly within Google's Antigravity IDE
 * (announced November 2025 alongside Gemini 3)
 *
 * Antigravity is Google's AI-powered IDE built as a fork of VS Code,
 * designed for agentic development with autonomous AI agents.
 */

export interface AntigravityConfig {
  /**
   * Enable RANA guardrails for Antigravity agents
   */
  enableGuardrails?: boolean;

  /**
   * Auto-validate agent outputs against design system
   */
  designSystemValidation?: boolean;

  /**
   * Require security checks before deployment
   */
  securityChecks?: boolean;

  /**
   * Enable prompt management for agent interactions
   */
  promptManagement?: boolean;

  /**
   * Prevent fake/mock data in production code
   */
  realDataOnly?: boolean;

  /**
   * Quality gates for agent-generated code
   */
  qualityGates?: {
    preImplementation?: boolean;
    implementation?: boolean;
    testing?: boolean;
    deployment?: boolean;
  };
}

export interface AntigravityAgent {
  id: string;
  name: string;
  type: 'coding' | 'testing' | 'deployment' | 'refactoring';
  model?: 'gemini-3-pro' | 'claude-sonnet-4.5' | 'claude-opus-4.5';
}

export interface AgentOutput {
  agent: AntigravityAgent;
  code: string;
  explanation: string;
  timestamp: Date;
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  guardrailsApplied: string[];
}

/**
 * Antigravity Integration Manager
 *
 * Provides RANA guardrails for Google Antigravity agents
 */
export class AntigravityIntegration {
  private config: AntigravityConfig;

  constructor(config: AntigravityConfig = {}) {
    this.config = {
      enableGuardrails: true,
      designSystemValidation: true,
      securityChecks: true,
      promptManagement: true,
      realDataOnly: true,
      qualityGates: {
        preImplementation: true,
        implementation: true,
        testing: true,
        deployment: true,
      },
      ...config,
    };
  }

  /**
   * Validate agent output against RANA guardrails
   */
  async validateAgentOutput(output: AgentOutput): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const guardrailsApplied: string[] = [];

    if (!this.config.enableGuardrails) {
      return { passed: true, errors, warnings, guardrailsApplied };
    }

    // Check for security issues
    if (this.config.securityChecks) {
      const securityIssues = this.checkSecurity(output.code);
      errors.push(...securityIssues.errors);
      warnings.push(...securityIssues.warnings);
      if (securityIssues.errors.length === 0) {
        guardrailsApplied.push('Security checks passed');
      }
    }

    // Check for design system violations
    if (this.config.designSystemValidation) {
      const designIssues = this.checkDesignSystem(output.code);
      errors.push(...designIssues.errors);
      warnings.push(...designIssues.warnings);
      if (designIssues.errors.length === 0) {
        guardrailsApplied.push('Design system validated');
      }
    }

    // Check for fake/mock data
    if (this.config.realDataOnly) {
      const dataIssues = this.checkRealData(output.code);
      errors.push(...dataIssues.errors);
      warnings.push(...dataIssues.warnings);
      if (dataIssues.errors.length === 0) {
        guardrailsApplied.push('Real data enforcement applied');
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      guardrailsApplied,
    };
  }

  /**
   * Check code for security issues
   */
  private checkSecurity(code: string): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for common security issues
    if (code.includes('eval(')) {
      errors.push('Security: Detected use of eval() - potential code injection vulnerability');
    }

    if (code.match(/process\.env\.\w+/g) && !code.includes('// Safe: using env vars')) {
      warnings.push('Security: Environment variables detected - ensure they are properly validated');
    }

    if (code.includes('dangerouslySetInnerHTML')) {
      warnings.push('Security: dangerouslySetInnerHTML detected - ensure content is sanitized');
    }

    if (code.match(/\.innerHTML\s*=/)) {
      warnings.push('Security: innerHTML assignment detected - prefer textContent or sanitize input');
    }

    return { errors, warnings };
  }

  /**
   * Check code for design system compliance
   */
  private checkDesignSystem(code: string): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for inline styles (should use design system)
    if (code.match(/style=\{\{/g) || code.match(/style="/g)) {
      warnings.push('Design System: Detected inline styles - prefer design system classes');
    }

    // Check for hardcoded colors
    if (code.match(/#[0-9a-fA-F]{6}/g) || code.match(/rgb\(/g)) {
      warnings.push('Design System: Hardcoded colors detected - use design system color variables');
    }

    // Check for hardcoded spacing values
    if (code.match(/padding:\s*\d+px/g) || code.match(/margin:\s*\d+px/g)) {
      warnings.push('Design System: Hardcoded spacing detected - use design system spacing scale');
    }

    return { errors, warnings };
  }

  /**
   * Check code for fake/mock data
   */
  private checkRealData(code: string): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for common fake data patterns
    const fakeDataPatterns = [
      { pattern: /\bfakeData\b/gi, name: 'fakeData variable' },
      { pattern: /\bmockData\b/gi, name: 'mockData variable' },
      { pattern: /\bdummyData\b/gi, name: 'dummyData variable' },
      { pattern: /\bplaceholderData\b/gi, name: 'placeholderData variable' },
      { pattern: /'Lorem ipsum'/gi, name: 'Lorem ipsum text' },
      { pattern: /'test@test\.com'/gi, name: 'test email' },
      { pattern: /'example\.com'/gi, name: 'example.com domain' },
    ];

    for (const { pattern, name } of fakeDataPatterns) {
      if (pattern.test(code)) {
        if (code.includes('// Safe: test environment only') || code.includes('// Safe: development only')) {
          warnings.push(`Data: ${name} detected - marked as safe for non-production`);
        } else {
          errors.push(`Data: ${name} detected - replace with real data sources`);
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Generate Antigravity-compatible RANA config
   */
  generateConfig(): {
    '.antigravity/rana.json': any;
    'README.antigravity.md': string;
  } {
    return {
      '.antigravity/rana.json': {
        version: '2.0',
        framework: 'rana',
        guardrails: {
          enabled: this.config.enableGuardrails,
          security: this.config.securityChecks,
          designSystem: this.config.designSystemValidation,
          realDataOnly: this.config.realDataOnly,
          promptManagement: this.config.promptManagement,
        },
        qualityGates: this.config.qualityGates,
        agents: {
          allowedModels: ['gemini-3-pro', 'claude-sonnet-4.5', 'claude-opus-4.5'],
          validateOutputs: true,
          enforceStandards: true,
        },
      },
      'README.antigravity.md': this.generateReadme(),
    };
  }

  /**
   * Generate README for Antigravity integration
   */
  private generateReadme(): string {
    return `# RANA Framework Integration for Google Antigravity

This project uses RANA (Rapid AI Native Architecture) to provide guardrails for Google Antigravity agents.

## Features

- **Security Guardrails**: Automatic security checks for agent-generated code
- **Design System Enforcement**: Validates compliance with your design system
- **Real Data Only**: Prevents fake/mock data in production code
- **Prompt Management**: Version control and A/B testing for agent prompts
- **Quality Gates**: Multi-phase validation for all code changes

## Configuration

RANA is configured via \`.antigravity/rana.json\`:

\`\`\`json
{
  "framework": "rana",
  "guardrails": {
    "security": ${this.config.securityChecks},
    "designSystem": ${this.config.designSystemValidation},
    "realDataOnly": ${this.config.realDataOnly}
  }
}
\`\`\`

## Usage with Antigravity Agents

When Antigravity agents generate code, RANA will:

1. **Validate Security**: Check for common vulnerabilities (XSS, injection, etc.)
2. **Check Design Compliance**: Ensure design system usage
3. **Verify Real Data**: Block fake/mock data patterns
4. **Apply Quality Gates**: Run pre-implementation, implementation, testing, and deployment checks

## Learn More

- [RANA Documentation](https://rana.dev/docs)
- [Google Antigravity](https://antigravity.google/)
- [Waymaker Pro ($29/mo)](https://waymaker.cx/pricing) - Includes API tokens

## Support

- GitHub: https://github.com/waymaker/rana
- Discord: https://discord.gg/rana
- Email: ashley@waymaker.cx
`;
  }

  /**
   * Get integration status
   */
  getStatus(): {
    enabled: boolean;
    guardrails: string[];
    qualityGates: string[];
  } {
    const guardrails: string[] = [];
    const qualityGates: string[] = [];

    if (this.config.securityChecks) guardrails.push('Security');
    if (this.config.designSystemValidation) guardrails.push('Design System');
    if (this.config.realDataOnly) guardrails.push('Real Data Only');
    if (this.config.promptManagement) guardrails.push('Prompt Management');

    if (this.config.qualityGates?.preImplementation) qualityGates.push('Pre-Implementation');
    if (this.config.qualityGates?.implementation) qualityGates.push('Implementation');
    if (this.config.qualityGates?.testing) qualityGates.push('Testing');
    if (this.config.qualityGates?.deployment) qualityGates.push('Deployment');

    return {
      enabled: this.config.enableGuardrails || false,
      guardrails,
      qualityGates,
    };
  }
}

/**
 * Create Antigravity integration with default config
 */
export function createAntigravityIntegration(config?: AntigravityConfig): AntigravityIntegration {
  return new AntigravityIntegration(config);
}

/**
 * Quick setup for Antigravity + RANA
 */
export async function setupAntigravity(): Promise<{
  integration: AntigravityIntegration;
  config: ReturnType<AntigravityIntegration['generateConfig']>;
}> {
  const integration = createAntigravityIntegration();
  const config = integration.generateConfig();

  return {
    integration,
    config,
  };
}
