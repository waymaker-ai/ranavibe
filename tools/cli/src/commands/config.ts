/**
 * Config Command
 * Show current RANA configuration
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function showConfig() {
  console.log(chalk.bold.cyan('\n⚙️ RANA Configuration\n'));

  const configPath = path.join(process.cwd(), '.rana.yml');

  if (!fs.existsSync(configPath)) {
    console.log(chalk.yellow('No .rana.yml found in current directory.'));
    console.log(chalk.gray('Run `rana init` to create one.\n'));
    return;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(content) as Record<string, unknown>;

    console.log(chalk.bold('📁 File: ') + chalk.cyan('.rana.yml'));
    console.log(chalk.gray('─'.repeat(60)));

    // Display formatted config
    displayConfig(config, 0);

    console.log();
  } catch (error) {
    console.log(chalk.red('Failed to read .rana.yml:'));
    console.log(chalk.gray(`${error}\n`));
  }
}

function displayConfig(obj: unknown, indent: number) {
  const spaces = '  '.repeat(indent);

  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      console.log(chalk.white(`${spaces}${key}:`));
      value.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          console.log(chalk.gray(`${spaces}  -`));
          displayConfig(item, indent + 2);
        } else {
          console.log(chalk.cyan(`${spaces}  - ${item}`));
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      console.log(chalk.white(`${spaces}${key}:`));
      displayConfig(value, indent + 1);
    } else {
      console.log(chalk.white(`${spaces}${key}: `) + chalk.cyan(String(value)));
    }
  });
}
