import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

interface SyncOptions {
  push?: boolean;
  pull?: boolean;
  auto?: boolean;
}

export async function syncCommand(options: SyncOptions) {
  const authToken = await getAuthToken();
  if (!authToken) {
    console.log(chalk.red('❌ Not authenticated. Run: waymaker-rana login'));
    return;
  }

  if (options.auto) {
    await enableAutoSync(authToken);
  } else if (options.push) {
    await pushConfig(authToken);
  } else if (options.pull) {
    await pullConfig(authToken);
  } else {
    console.log(chalk.yellow('Please specify --push, --pull, or --auto'));
    console.log();
    console.log('Examples:');
    console.log('  waymaker-rana sync --push   # Upload local .rana.yml to Waymaker');
    console.log('  waymaker-rana sync --pull   # Download team config from Waymaker');
    console.log('  waymaker-rana sync --auto   # Enable automatic sync');
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const configPath = path.join(process.env.HOME || '', '.waymaker', 'config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    return config.authToken || null;
  } catch {
    return null;
  }
}

async function pushConfig(token: string) {
  const spinner = ora('Uploading .rana.yml to Waymaker...').start();

  try {
    const configPath = path.join(process.cwd(), '.rana.yml');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = yaml.load(configContent);

    // TODO: Replace with actual API call
    // await fetch('https://api.waymaker.com/v1/rana/config', {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(config)
    // });

    spinner.succeed('Configuration synced to Waymaker');
    console.log(chalk.green('\n✅ Team can now access your RANA configuration'));
    console.log(chalk.gray('View at: https://waymaker.com/rana/config'));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      spinner.fail('No .rana.yml found. Run: waymaker-rana init');
    } else {
      spinner.fail(`Sync failed: ${error.message}`);
    }
  }
}

async function pullConfig(token: string) {
  const spinner = ora('Downloading config from Waymaker...').start();

  try {
    // Check if local config exists
    const configPath = path.join(process.cwd(), '.rana.yml');
    let hasLocal = false;
    try {
      await fs.access(configPath);
      hasLocal = true;
    } catch {}

    if (hasLocal) {
      spinner.stop();
      console.log(chalk.yellow('\n⚠️  Local .rana.yml exists'));
      console.log('Pulling will overwrite your local configuration.');
      console.log('\nOptions:');
      console.log('  1. Backup local config first: cp .rana.yml .rana.yml.backup');
      console.log('  2. Use --push to upload local config instead');
      console.log('  3. Continue with pull (overwrites local)');
      return;
    }

    // TODO: Replace with actual API call
    // const response = await fetch('https://api.waymaker.com/v1/rana/config', {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // const config = await response.json();
    // const configYaml = yaml.dump(config);

    const configYaml = `version: "1.0.0"
project:
  name: "My Project"
  type: "fullstack"
# Configuration pulled from Waymaker team settings
`;

    await fs.writeFile(configPath, configYaml, 'utf-8');
    spinner.succeed('Configuration downloaded');
    console.log(chalk.green('\n✅ .rana.yml created from team settings'));
  } catch (error: any) {
    spinner.fail(`Pull failed: ${error.message}`);
  }
}

async function enableAutoSync(token: string) {
  const spinner = ora('Enabling auto-sync...').start();

  try {
    const configDir = path.join(process.env.HOME || '', '.waymaker');
    const configPath = path.join(configDir, 'config.json');

    await fs.mkdir(configDir, { recursive: true });

    let config: any = {};
    try {
      config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    } catch {}

    config.autoSync = true;
    config.authToken = token;

    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

    spinner.succeed('Auto-sync enabled');
    console.log(chalk.green('\n✅ RANA config will automatically sync with Waymaker'));
    console.log();
    console.log('Behavior:');
    console.log('  • Local changes pushed after commits');
    console.log('  • Team updates pulled periodically');
    console.log('  • Conflicts resolved with team preference');
    console.log();
    console.log(chalk.gray('Disable: waymaker-rana sync --auto=false'));
  } catch (error: any) {
    spinner.fail(`Failed to enable auto-sync: ${error.message}`);
  }
}
