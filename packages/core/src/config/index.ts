import yaml from 'js-yaml';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * RANA Configuration Schema
 *
 * Defines the structure of .rana.yml configuration files
 */

const QualityGateSchema = z.object({
  name: z.string(),
  description: z.string(),
  required: z.boolean().optional(),
  required_for: z.string().optional(),
  reference: z.string().optional(),
  phases: z.array(z.string()).optional(),
});

export const RanaConfigSchema = z.object({
  version: z.string(),
  project: z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    languages: z.array(z.string()),
  }),
  standards: z.object({
    principles: z.array(z.string()),
    design_system: z.any().optional(),
    patterns: z.any().optional(),
    code_quality: z.any().optional(),
    file_structure: z.any().optional(),
  }),
  quality_gates: z.object({
    pre_implementation: z.array(QualityGateSchema),
    implementation: z.array(QualityGateSchema),
    testing: z.array(QualityGateSchema),
    deployment: z.array(QualityGateSchema),
  }),
  major_features: z.any().optional(),
  deployment: z.any().optional(),
  ai_assistant: z.any().optional(),
  high_risk_areas: z.array(z.any()).optional(),
  documentation: z.any().optional(),
  metrics: z.any().optional(),
  context: z.any().optional(),
  assistant_notes: z.string().optional(),
});

export type RanaConfig = z.infer<typeof RanaConfigSchema>;
export type QualityGate = z.infer<typeof QualityGateSchema>;

/**
 * Configuration Parser
 *
 * Handles reading, parsing, and validating RANA config files
 */
export class ConfigParser {
  /**
   * Parse a .rana.yml file
   */
  static parse(filePath: string): RanaConfig {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Config file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content);

    try {
      return RanaConfigSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('\n');
        throw new Error(`Invalid RANA config:\n${errorMessages}`);
      }
      throw error;
    }
  }

  /**
   * Validate a config object
   */
  static validate(config: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    try {
      RanaConfigSchema.parse(config);
      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        valid: false,
        errors: ['Unknown validation error'],
        warnings: [],
      };
    }
  }

  /**
   * Find .rana.yml in current directory or parent directories
   */
  static findConfig(startDir: string = process.cwd()): string | null {
    let currentDir = startDir;

    while (currentDir !== path.parse(currentDir).root) {
      const configPath = path.join(currentDir, '.rana.yml');
      if (fs.existsSync(configPath)) {
        return configPath;
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  /**
   * Load config from current directory or parent
   */
  static load(startDir?: string): RanaConfig | null {
    const configPath = this.findConfig(startDir);
    if (!configPath) {
      return null;
    }
    return this.parse(configPath);
  }

  /**
   * Check if a feature is a "major feature" based on config
   */
  static isMajorFeature(
    config: RanaConfig,
    featureDescription: string
  ): boolean {
    const majorFeatures = config.major_features;
    if (!majorFeatures || !majorFeatures.triggers) {
      return false;
    }

    const triggers = majorFeatures.triggers as string[];
    const lowerDesc = featureDescription.toLowerCase();

    return triggers.some((trigger: string) =>
      lowerDesc.includes(trigger.toLowerCase())
    );
  }

  /**
   * Get quality gates for a specific phase
   */
  static getQualityGates(
    config: RanaConfig,
    phase:
      | 'pre_implementation'
      | 'implementation'
      | 'testing'
      | 'deployment'
  ): QualityGate[] {
    return config.quality_gates[phase];
  }
}

export { yaml };
