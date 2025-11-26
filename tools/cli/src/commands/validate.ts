/**
 * Validate Command
 * Validate .rana.yml configuration
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_FIELDS = ['version', 'project', 'standards', 'quality_gates'];
const VALID_PROJECT_TYPES = ['frontend', 'backend', 'fullstack', 'mobile', 'cli', 'library', 'tooling'];
const VALID_PRINCIPLES = [
  'search_before_create',
  'real_data_only',
  'test_everything',
  'deploy_to_production',
  'documentation_required',
  'design_system_compliance'
];

export async function validateConfig() {
  console.log(chalk.bold.cyan('\n📋 Validating RANA Configuration\n'));

  const configPath = path.join(process.cwd(), '.rana.yml');

  // Check if file exists
  if (!fs.existsSync(configPath)) {
    console.log(chalk.red('✗ No .rana.yml found in current directory'));
    console.log(chalk.gray('  Run `rana init` to create one.\n'));
    return;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(content) as Record<string, unknown>;

    const result = validate(config);

    if (result.valid) {
      console.log(chalk.green('✓ Configuration is valid!\n'));

      // Show config summary
      console.log(chalk.bold('📊 Configuration Summary'));
      console.log(chalk.gray('─'.repeat(50)));

      if (config.version) {
        console.log(chalk.white('  Version:     ') + chalk.cyan(config.version));
      }

      const project = config.project as Record<string, unknown> | undefined;
      if (project) {
        console.log(chalk.white('  Project:     ') + chalk.cyan(project.name || 'Unknown'));
        console.log(chalk.white('  Type:        ') + chalk.cyan(project.type || 'Unknown'));
      }

      const standards = config.standards as Record<string, unknown> | undefined;
      if (standards?.principles) {
        const principles = standards.principles as string[];
        console.log(chalk.white('  Principles:  ') + chalk.cyan(principles.length + ' configured'));
      }

      const qualityGates = config.quality_gates as Record<string, unknown> | undefined;
      if (qualityGates) {
        const gateCount = Object.keys(qualityGates).length;
        console.log(chalk.white('  Quality Gates: ') + chalk.cyan(gateCount + ' phases'));
      }

      console.log();
    } else {
      console.log(chalk.red('✗ Configuration has errors:\n'));

      result.errors.forEach(error => {
        console.log(chalk.red(`  ✗ ${error}`));
      });

      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\n  Warnings:'));
        result.warnings.forEach(warning => {
          console.log(chalk.yellow(`  ⚠ ${warning}`));
        });
      }

      console.log();
    }
  } catch (error) {
    console.log(chalk.red('✗ Failed to parse .rana.yml'));
    console.log(chalk.gray(`  ${error}\n`));
  }
}

function validate(config: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    if (!config[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate version
  if (config.version) {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(String(config.version))) {
      errors.push(`Invalid version format: ${config.version} (expected: semver like 1.0.0)`);
    }
  }

  // Validate project
  const project = config.project as Record<string, unknown> | undefined;
  if (project) {
    if (!project.name) {
      errors.push('Project name is required');
    }
    if (!project.type) {
      errors.push('Project type is required');
    } else if (!VALID_PROJECT_TYPES.includes(String(project.type))) {
      errors.push(`Invalid project type: ${project.type}. Valid types: ${VALID_PROJECT_TYPES.join(', ')}`);
    }
  }

  // Validate standards
  const standards = config.standards as Record<string, unknown> | undefined;
  if (standards?.principles) {
    const principles = standards.principles as string[];
    principles.forEach(principle => {
      if (!VALID_PRINCIPLES.includes(principle)) {
        warnings.push(`Unknown principle: ${principle}`);
      }
    });
  }

  // Validate quality_gates
  const qualityGates = config.quality_gates as Record<string, unknown> | undefined;
  if (qualityGates) {
    const requiredGates = ['pre_implementation', 'implementation', 'testing', 'deployment'];
    requiredGates.forEach(gate => {
      if (!qualityGates[gate]) {
        warnings.push(`Recommended quality gate missing: ${gate}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
