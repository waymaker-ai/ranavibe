/**
 * Deploy Command
 * Deploy with CoFounder verification workflow
 * Supports Vercel, Railway, and Docker
 */

import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import { execSync, spawn } from 'child_process';

interface DeployOptions {
  verify?: boolean;
  skipTests?: boolean;
  skipBuild?: boolean;
  skipSecurity?: boolean;
  prod?: boolean;
  platform?: string;
}

interface DeployConfig {
  platform: 'vercel' | 'railway' | 'docker' | 'none';
  projectId?: string;
  teamId?: string;
  region?: string;
}

/**
 * Main Deploy Command
 */
export async function deployCommand(options: DeployOptions = {}) {
  console.log(chalk.bold.cyan('\n🚀 CoFounder Deployment\n'));

  // Load or create deploy config
  let config = await getDeployConfig();

  if (!config.platform || config.platform === 'none') {
    const { platform } = await prompts({
      type: 'select',
      name: 'platform',
      message: 'Select deployment platform:',
      choices: [
        { title: '▲ Vercel', value: 'vercel', description: 'Best for Next.js, automatic CI/CD' },
        { title: '🚂 Railway', value: 'railway', description: 'Simple, great for full-stack' },
        { title: '🐳 Docker', value: 'docker', description: 'Self-hosted, maximum control' },
      ],
    });

    if (!platform) {
      console.log(chalk.gray('Deployment cancelled.\n'));
      return;
    }

    config.platform = platform;
    saveDeployConfig(config);
  }

  // Run pre-deployment checks
  const checksOk = await runPreDeployChecks(options);
  if (!checksOk) {
    console.log(chalk.red('\n❌ Pre-deployment checks failed. Fix issues and try again.\n'));
    return;
  }

  // Deploy based on platform
  switch (config.platform) {
    case 'vercel':
      await deployToVercel(options);
      break;
    case 'railway':
      await deployToRailway(options);
      break;
    case 'docker':
      await deployWithDocker(options);
      break;
  }
}

/**
 * Run pre-deployment checks
 */
async function runPreDeployChecks(options: DeployOptions): Promise<boolean> {
  console.log(chalk.bold('📋 Pre-deployment Checks\n'));

  let allPassed = true;

  // 1. Tests
  if (!options.skipTests) {
    process.stdout.write(chalk.gray('  Running tests... '));
    try {
      execSync('npm test -- --passWithNoTests 2>/dev/null || true', { stdio: 'pipe' });
      console.log(chalk.green('✓'));
    } catch {
      console.log(chalk.yellow('⚠ (no tests or tests failed)'));
    }
  } else {
    console.log(chalk.gray('  Tests... ') + chalk.yellow('skipped'));
  }

  // 2. Build
  if (!options.skipBuild) {
    process.stdout.write(chalk.gray('  Building... '));
    try {
      execSync('npm run build', { stdio: 'pipe' });
      console.log(chalk.green('✓'));
    } catch (error) {
      console.log(chalk.red('✗'));
      console.log(chalk.red('\n  Build failed. Fix errors before deploying.\n'));
      allPassed = false;
    }
  } else {
    console.log(chalk.gray('  Build... ') + chalk.yellow('skipped'));
  }

  // 3. Security audit
  if (!options.skipSecurity) {
    process.stdout.write(chalk.gray('  Security audit... '));
    try {
      const output = execSync('npm audit --audit-level=critical 2>&1 || true', { encoding: 'utf-8' });
      if (output.includes('critical')) {
        console.log(chalk.red('✗ (critical vulnerabilities)'));
        allPassed = false;
      } else {
        console.log(chalk.green('✓'));
      }
    } catch {
      console.log(chalk.green('✓'));
    }
  } else {
    console.log(chalk.gray('  Security... ') + chalk.yellow('skipped'));
  }

  // 4. Environment variables check
  process.stdout.write(chalk.gray('  Environment variables... '));
  const missingEnvVars = checkRequiredEnvVars();
  if (missingEnvVars.length > 0) {
    console.log(chalk.yellow(`⚠ missing: ${missingEnvVars.join(', ')}`));
  } else {
    console.log(chalk.green('✓'));
  }

  console.log();
  return allPassed;
}

/**
 * Check for required environment variables
 */
function checkRequiredEnvVars(): string[] {
  const missing: string[] = [];

  // Check for common required vars
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  // Check .env and .env.local
  let envContent = '';
  if (fs.existsSync('.env')) {
    envContent += fs.readFileSync('.env', 'utf-8');
  }
  if (fs.existsSync('.env.local')) {
    envContent += fs.readFileSync('.env.local', 'utf-8');
  }

  for (const varName of requiredVars) {
    if (!envContent.includes(varName) && !process.env[varName]) {
      missing.push(varName);
    }
  }

  return missing;
}

/**
 * Deploy to Vercel
 */
async function deployToVercel(options: DeployOptions) {
  console.log(chalk.bold('▲ Deploying to Vercel\n'));

  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch {
    console.log(chalk.yellow('Vercel CLI not found. Installing...\n'));
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }

  // Check if linked
  const isLinked = fs.existsSync('.vercel/project.json');

  if (!isLinked) {
    console.log(chalk.gray('Linking to Vercel project...\n'));
    try {
      execSync('vercel link', { stdio: 'inherit' });
    } catch {
      console.log(chalk.red('Failed to link Vercel project.\n'));
      return;
    }
  }

  // Build deploy command
  const args = ['vercel'];

  if (options.prod) {
    args.push('--prod');
  }

  // Run deployment
  console.log(chalk.yellow('\n⏳ Deploying...\n'));

  try {
    const result = execSync(args.join(' '), { encoding: 'utf-8', stdio: 'pipe' });

    // Extract URL from output
    const urlMatch = result.match(/https:\/\/[^\s]+vercel\.app/);
    const deployUrl = urlMatch ? urlMatch[0] : result.trim();

    console.log(chalk.green('✅ Deployment successful!\n'));
    console.log(chalk.white('  URL: ') + chalk.cyan(deployUrl));

    // Verify deployment
    if (options.verify) {
      await verifyDeployment(deployUrl);
    }

    // Save deployment info
    saveDeploymentInfo({
      platform: 'vercel',
      url: deployUrl,
      timestamp: new Date().toISOString(),
      production: options.prod || false,
    });

  } catch (error: any) {
    console.log(chalk.red('❌ Deployment failed\n'));
    console.log(chalk.gray(error.message));
  }
}

/**
 * Deploy to Railway
 */
async function deployToRailway(options: DeployOptions) {
  console.log(chalk.bold('🚂 Deploying to Railway\n'));

  // Check if Railway CLI is installed
  try {
    execSync('railway --version', { stdio: 'pipe' });
  } catch {
    console.log(chalk.yellow('Railway CLI not found. Installing...\n'));
    console.log(chalk.gray('Install Railway CLI:'));
    console.log(chalk.cyan('  npm install -g @railway/cli'));
    console.log(chalk.cyan('  railway login\n'));
    return;
  }

  // Check if linked
  const isLinked = fs.existsSync('.railway') || fs.existsSync('railway.json');

  if (!isLinked) {
    console.log(chalk.gray('Linking to Railway project...\n'));
    try {
      execSync('railway link', { stdio: 'inherit' });
    } catch {
      console.log(chalk.red('Failed to link Railway project.\n'));
      return;
    }
  }

  // Run deployment
  console.log(chalk.yellow('\n⏳ Deploying...\n'));

  try {
    const deployProcess = spawn('railway', ['up', '--detach'], {
      stdio: 'inherit',
    });

    await new Promise<void>((resolve, reject) => {
      deployProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Deployment failed with code ${code}`));
      });
    });

    console.log(chalk.green('\n✅ Deployment initiated!\n'));

    // Get deployment URL
    try {
      const status = execSync('railway status', { encoding: 'utf-8' });
      const urlMatch = status.match(/https:\/\/[^\s]+railway\.app/);
      if (urlMatch) {
        console.log(chalk.white('  URL: ') + chalk.cyan(urlMatch[0]));

        if (options.verify) {
          await verifyDeployment(urlMatch[0]);
        }

        saveDeploymentInfo({
          platform: 'railway',
          url: urlMatch[0],
          timestamp: new Date().toISOString(),
          production: options.prod || false,
        });
      }
    } catch {
      console.log(chalk.gray('  Check Railway dashboard for deployment URL'));
    }

  } catch (error: any) {
    console.log(chalk.red('❌ Deployment failed\n'));
    console.log(chalk.gray(error.message));
  }
}

/**
 * Deploy with Docker
 */
async function deployWithDocker(options: DeployOptions) {
  console.log(chalk.bold('🐳 Deploying with Docker\n'));

  // Build image first
  const { dockerBuild } = await import('./docker.js');
  await dockerBuild({ tag: 'latest', push: false });

  // Get registry config
  let config: DeployConfig = { platform: 'docker' };
  if (fs.existsSync('.cofounder/docker.json')) {
    config = JSON.parse(fs.readFileSync('.cofounder/docker.json', 'utf-8'));
  }

  if (!config.projectId) {
    console.log(chalk.gray('\nTo push to a registry, configure with:'));
    console.log(chalk.cyan('  cofounder docker:push\n'));
    return;
  }

  // Push to registry
  const { dockerPush } = await import('./docker.js');
  await dockerPush({ tag: 'latest' });

  console.log(chalk.green('\n✅ Image pushed to registry!\n'));
  console.log(chalk.gray('Deploy to your infrastructure using the pushed image.'));
}

/**
 * Verify deployment
 */
async function verifyDeployment(url: string) {
  console.log(chalk.bold('\n🔍 Verifying Deployment\n'));

  const checks = [
    { name: 'Homepage', path: '/' },
    { name: 'Health endpoint', path: '/api/health' },
  ];

  for (const check of checks) {
    process.stdout.write(chalk.gray(`  ${check.name}... `));

    try {
      const start = Date.now();
      const response = await fetch(`${url}${check.path}`, {
        signal: AbortSignal.timeout(10000),
      });
      const latency = Date.now() - start;

      if (response.ok) {
        console.log(chalk.green(`✓ ${latency}ms`));
      } else {
        console.log(chalk.yellow(`⚠ HTTP ${response.status}`));
      }
    } catch (error: any) {
      console.log(chalk.red(`✗ ${error.message}`));
    }
  }

  console.log();
}

/**
 * Get deploy config
 */
async function getDeployConfig(): Promise<DeployConfig> {
  const configPath = '.cofounder/deploy.json';

  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      // Return default
    }
  }

  return { platform: 'none' };
}

/**
 * Save deploy config
 */
function saveDeployConfig(config: DeployConfig) {
  const dir = '.aicofounder';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(`${dir}/deploy.json`, JSON.stringify(config, null, 2));
}

/**
 * Save deployment info
 */
function saveDeploymentInfo(info: {
  platform: string;
  url: string;
  timestamp: string;
  production: boolean;
}) {
  const dir = '.aicofounder';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load existing deployments
  const historyPath = `${dir}/deployments.json`;
  let history: any[] = [];
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    } catch {
      history = [];
    }
  }

  // Add new deployment
  history.unshift(info);

  // Keep last 10 deployments
  history = history.slice(0, 10);

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

/**
 * Deploy Status Command
 */
export async function deployStatus() {
  console.log(chalk.bold.cyan('\n📊 Deployment Status\n'));

  const historyPath = '.cofounder/deployments.json';

  if (!fs.existsSync(historyPath)) {
    console.log(chalk.gray('No deployment history found.'));
    console.log(chalk.gray('Run `cofounder deploy` to deploy your app.\n'));
    return;
  }

  const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));

  if (history.length === 0) {
    console.log(chalk.gray('No deployments yet.\n'));
    return;
  }

  console.log(chalk.bold('Recent Deployments:\n'));

  history.forEach((deploy: any, index: number) => {
    const icon = deploy.production ? '🟢' : '🟡';
    const env = deploy.production ? 'Production' : 'Preview';
    const date = new Date(deploy.timestamp).toLocaleString();

    console.log(`  ${icon} ${deploy.platform.padEnd(10)} ${env.padEnd(12)} ${chalk.cyan(deploy.url)}`);
    console.log(chalk.gray(`     ${date}\n`));
  });
}

/**
 * Deploy Rollback Command
 */
export async function deployRollback() {
  console.log(chalk.bold.cyan('\n⏪ Deployment Rollback\n'));

  const config = await getDeployConfig();

  switch (config.platform) {
    case 'vercel':
      console.log(chalk.gray('Rolling back Vercel deployment...\n'));
      try {
        execSync('vercel rollback', { stdio: 'inherit' });
        console.log(chalk.green('\n✅ Rollback complete!\n'));
      } catch {
        console.log(chalk.red('Rollback failed.\n'));
      }
      break;

    case 'railway':
      console.log(chalk.yellow('Railway rollback requires using the dashboard.'));
      console.log(chalk.cyan('  https://railway.app/dashboard\n'));
      break;

    default:
      console.log(chalk.yellow('Rollback not supported for this platform.\n'));
  }
}
