/**
 * RANA SDK - Programmatic access to RANA framework
 *
 * Use this SDK to integrate RANA quality gates and REPM validation
 * into your own tools, CI/CD pipelines, or applications.
 */

export {
  ConfigParser,
  QualityGateChecker,
  REPMValidator,
  TemplateManager,
  type RanaConfig,
  type QualityGate,
  type REPMPhase,
} from '@rana/core';

import { ConfigParser, QualityGateChecker, REPMValidator, TemplateManager } from '@rana/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Main RANA SDK class for convenient access to all functionality
 */
export class RANA {
  private configPath: string | null;

  constructor(configPath?: string) {
    this.configPath = configPath || ConfigParser.findConfig() || null;
  }

  /**
   * Initialize a new RANA project
   */
  static init(options: {
    projectName: string;
    projectType?: 'nextjs' | 'react' | 'python' | 'default';
    outputPath?: string;
  }): void {
    const templateManager = new TemplateManager();
    const config =
      options.projectType && options.projectType !== 'default'
        ? templateManager.generateConfig(options.projectType)
        : templateManager.getDefaultConfig();

    // Customize config
    const customConfig = config
      .replace('name: "My Project"', `name: "${options.projectName}"`)
      .replace('type: "fullstack"', `type: "${options.projectType || 'fullstack'}"`);

    const outputPath = options.outputPath || process.cwd();
    const configFile = path.join(outputPath, '.rana.yml');

    fs.writeFileSync(configFile, customConfig, 'utf8');
  }

  /**
   * Validate configuration
   */
  validate(): boolean {
    if (!this.configPath) {
      throw new Error('No .rana.yml file found');
    }

    try {
      ConfigParser.parse(this.configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check quality gates for a phase
   */
  checkPhase(phase: 'pre_implementation' | 'implementation' | 'testing' | 'deployment') {
    if (!this.configPath) {
      throw new Error('No .rana.yml file found');
    }

    const config = ConfigParser.parse(this.configPath);
    const checker = new QualityGateChecker(config);
    return checker.checkPhase(phase);
  }

  /**
   * Check if a feature is "major" and requires REPM
   */
  isMajorFeature(description: string): boolean {
    if (!this.configPath) {
      throw new Error('No .rana.yml file found');
    }

    const config = ConfigParser.parse(this.configPath);
    return ConfigParser.isMajorFeature(config, description);
  }

  /**
   * Get REPM phase information
   */
  getREPMPhase(phaseName: string) {
    const validator = new REPMValidator();
    return validator.getPhase(phaseName);
  }

  /**
   * Get all REPM phases
   */
  getREPMPhases() {
    const validator = new REPMValidator();
    return validator.getPhases();
  }

  /**
   * Generate REPM checklist
   */
  generateREPMChecklist(): string {
    const validator = new REPMValidator();
    return validator.generateChecklist();
  }

  /**
   * Get configuration
   */
  getConfig() {
    if (!this.configPath) {
      throw new Error('No .rana.yml file found');
    }

    return ConfigParser.parse(this.configPath);
  }
}

/**
 * Convenience exports for direct usage
 */
export const rana = {
  /**
   * Initialize a new RANA project
   */
  init: RANA.init,

  /**
   * Create a RANA instance
   */
  create: (configPath?: string) => new RANA(configPath),

  /**
   * Parse a config file
   */
  parseConfig: ConfigParser.parse,

  /**
   * Find config file
   */
  findConfig: ConfigParser.findConfig,
};

export default RANA;
