#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execa } from 'execa';
import { getComponent, getAllComponents, resolveComponentDependencies } from './registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('rana-ui')
  .description('CLI for installing RANA UI components')
  .version('0.1.0');

// Command: init
program
  .command('init')
  .description('Initialize RANA UI in your project')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n✨ Welcome to RANA UI!\n'));

    // Check if already initialized
    const configPath = path.join(process.cwd(), 'rana-ui.json');
    if (fs.existsSync(configPath)) {
      console.log(chalk.yellow('⚠️  RANA UI is already initialized in this project.\n'));
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: 'Overwrite existing configuration?',
        initial: false,
      });
      if (!overwrite) return;
    }

    let config;
    if (options.yes) {
      config = {
        componentPath: 'src/components/ui',
        utilPath: 'src/lib',
        tailwindConfig: 'tailwind.config.js',
        typescript: true,
      };
    } else {
      const answers = await prompts([
        {
          type: 'text',
          name: 'componentPath',
          message: 'Where should components be installed?',
          initial: 'src/components/ui',
        },
        {
          type: 'text',
          name: 'utilPath',
          message: 'Where should utilities be installed?',
          initial: 'src/lib',
        },
        {
          type: 'text',
          name: 'tailwindConfig',
          message: 'Path to your Tailwind config:',
          initial: 'tailwind.config.js',
        },
        {
          type: 'confirm',
          name: 'typescript',
          message: 'Are you using TypeScript?',
          initial: true,
        },
      ]);

      config = answers;
    }

    // Create config file
    const spinner = ora('Creating configuration...').start();
    await fs.writeJSON(configPath, config, { spaces: 2 });
    spinner.succeed(chalk.green('Configuration created!'));

    // Create directories
    spinner.start('Creating directories...');
    await fs.ensureDir(config.componentPath);
    await fs.ensureDir(config.utilPath);
    spinner.succeed(chalk.green('Directories created!'));

    // Check dependencies
    spinner.start('Checking dependencies...');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      spinner.fail(chalk.red('No package.json found!'));
      console.log(chalk.yellow('\nRun `npm init` first.\n'));
      return;
    }

    const packageJson = await fs.readJSON(packageJsonPath);
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const required = ['tailwindcss', 'class-variance-authority', 'clsx', 'tailwind-merge'];
    const missing = required.filter((dep) => !dependencies[dep]);

    if (missing.length > 0) {
      spinner.warn(chalk.yellow(`Missing dependencies: ${missing.join(', ')}`));

      const { install } = await prompts({
        type: 'confirm',
        name: 'install',
        message: 'Install missing dependencies?',
        initial: true,
      });

      if (install) {
        spinner.start('Installing dependencies...');
        try {
          await execa('npm', ['install', ...missing]);
          spinner.succeed(chalk.green('Dependencies installed!'));
        } catch (error) {
          spinner.fail(chalk.red('Failed to install dependencies'));
          console.error(error);
        }
      }
    } else {
      spinner.succeed(chalk.green('All dependencies found!'));
    }

    console.log(chalk.green.bold('\n✅ RANA UI initialized successfully!\n'));
    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray('  1. Run `rana-ui add glass-card` to add a component'));
    console.log(chalk.gray('  2. Import and use in your app'));
    console.log(chalk.gray('  3. Customize styles in Tailwind config\n'));
  });

// Command: add
program
  .command('add [components...]')
  .description('Add components to your project')
  .option('-a, --all', 'Add all components')
  .option('-o, --overwrite', 'Overwrite existing files')
  .action(async (components: string[], options) => {
    // Load config
    const configPath = path.join(process.cwd(), 'rana-ui.json');
    if (!fs.existsSync(configPath)) {
      console.error(chalk.red('❌ RANA UI not initialized!'));
      console.log(chalk.gray('\nRun `rana-ui init` first.\n'));
      return;
    }

    const config = await fs.readJSON(configPath);

    // Get components to install
    let toInstall: string[] = [];
    if (options.all) {
      toInstall = Object.keys(getAllComponents());
    } else if (components.length > 0) {
      toInstall = components;
    } else {
      // Interactive selection
      const choices = getAllComponents().map((c) => ({
        title: c.name,
        description: c.description,
        value: c.name,
      }));

      const { selected } = await prompts({
        type: 'multiselect',
        name: 'selected',
        message: 'Select components to install:',
        choices,
        min: 1,
      });

      if (!selected || selected.length === 0) return;
      toInstall = selected;
    }

    // Resolve dependencies
    const spinner = ora('Resolving dependencies...').start();
    const allComponents = new Set<string>();
    for (const name of toInstall) {
      const deps = resolveComponentDependencies(name);
      deps.forEach((d) => allComponents.add(d));
    }

    // Always include utils
    allComponents.add('utils');

    spinner.succeed(chalk.green(`Found ${allComponents.size} component(s) to install`));

    // Show what will be installed
    console.log(chalk.blue('\nComponents to install:'));
    Array.from(allComponents).forEach((name) => {
      const component = getComponent(name);
      if (component) {
        console.log(chalk.gray(`  • ${name} - ${component.description}`));
      }
    });

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Continue with installation?',
      initial: true,
    });

    if (!confirm) return;

    // Install npm dependencies
    const allDeps = new Set<string>();
    Array.from(allComponents).forEach((name) => {
      const component = getComponent(name);
      if (component) {
        component.dependencies.forEach((d) => allDeps.add(d));
      }
    });

    if (allDeps.size > 0) {
      spinner.start('Installing npm dependencies...');
      const packageJson = await fs.readJSON(path.join(process.cwd(), 'package.json'));
      const installed = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const toInstallDeps = Array.from(allDeps).filter((d) => !installed[d]);

      if (toInstallDeps.length > 0) {
        try {
          await execa('npm', ['install', ...toInstallDeps]);
          spinner.succeed(chalk.green('Dependencies installed!'));
        } catch (error) {
          spinner.fail(chalk.red('Failed to install dependencies'));
          console.error(error);
          return;
        }
      } else {
        spinner.succeed(chalk.green('All dependencies already installed!'));
      }
    }

    // Copy component files
    const componentsDir = path.resolve(__dirname, '../../rana-ui/src');

    for (const name of Array.from(allComponents)) {
      const component = getComponent(name);
      if (!component) continue;

      spinner.start(`Installing ${name}...`);

      for (const file of component.files) {
        const sourcePath = path.join(componentsDir, file.path.replace('components/ui/', 'components/').replace('lib/', 'lib/'));
        const targetDir =
          file.type === 'util'
            ? config.utilPath
            : config.componentPath;

        const filename = path.basename(sourcePath);
        const targetPath = path.join(targetDir, filename);

        // Check if file exists
        if (fs.existsSync(targetPath) && !options.overwrite) {
          spinner.warn(chalk.yellow(`${name} already exists, skipping...`));
          continue;
        }

        // Read source file
        if (fs.existsSync(sourcePath)) {
          let content = await fs.readFile(sourcePath, 'utf-8');

          // Update imports
          content = content.replace(
            /'\.\.\/lib\/utils'/g,
            `'@/lib/utils'`
          );

          // Ensure directory exists
          await fs.ensureDir(targetDir);

          // Write file
          await fs.writeFile(targetPath, content);
        }
      }

      spinner.succeed(chalk.green(`Installed ${name}`));
    }

    console.log(chalk.green.bold('\n✅ Components installed successfully!\n'));
    console.log(chalk.gray('Import and use in your components:'));
    console.log(chalk.gray(`  import { GlassCard } from '@/components/ui/glass-card';\n`));
  });

// Command: list
program
  .command('list')
  .description('List all available components')
  .action(() => {
    console.log(chalk.blue.bold('\n📦 Available RANA UI Components:\n'));

    const components = getAllComponents();
    components.forEach((component) => {
      console.log(chalk.white.bold(`  ${component.name}`));
      console.log(chalk.gray(`    ${component.description}`));
      console.log();
    });

    console.log(chalk.gray(`Total: ${components.length} components\n`));
  });

program.parse();
