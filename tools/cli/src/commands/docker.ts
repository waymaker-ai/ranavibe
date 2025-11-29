/**
 * Docker Commands
 * Container build and deployment
 */

import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

interface DockerConfig {
  imageName: string;
  registry?: string;
  baseImage: string;
  port: number;
}

/**
 * Docker Build Command
 * Build Docker image for your app
 */
export async function dockerBuild(options: {
  tag?: string;
  push?: boolean;
} = {}) {
  console.log(chalk.bold.cyan('\n🐳 RANA Docker Build\n'));

  // Check if Docker is installed
  try {
    execSync('docker --version', { stdio: 'pipe' });
  } catch {
    console.log(chalk.red('Docker is not installed or not running.'));
    console.log(chalk.gray('Install Docker: https://docs.docker.com/get-docker/\n'));
    return;
  }

  // Check for Dockerfile
  if (!fs.existsSync('Dockerfile')) {
    console.log(chalk.yellow('No Dockerfile found. Creating one...\n'));
    await createDockerfile();
  }

  // Get image name from package.json or config
  let imageName = 'rana-app';
  if (fs.existsSync('package.json')) {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      imageName = pkg.name?.replace('@', '').replace('/', '-') || imageName;
    } catch {
      // Use default
    }
  }

  // Check for .rana/docker.json config
  let registry = '';
  if (fs.existsSync('.rana/docker.json')) {
    const config = JSON.parse(fs.readFileSync('.rana/docker.json', 'utf-8'));
    imageName = config.imageName || imageName;
    registry = config.registry || '';
  }

  const tag = options.tag || 'latest';
  const fullImageName = registry ? `${registry}/${imageName}:${tag}` : `${imageName}:${tag}`;

  console.log(chalk.gray(`Building image: ${fullImageName}\n`));

  // Build
  try {
    console.log(chalk.yellow('⏳ Building Docker image...\n'));

    const buildProcess = spawn('docker', ['build', '-t', fullImageName, '.'], {
      stdio: 'inherit',
    });

    await new Promise<void>((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Build failed with code ${code}`));
      });
    });

    console.log(chalk.green(`\n✅ Image built successfully: ${fullImageName}\n`));

    // Show image size
    try {
      const sizeOutput = execSync(`docker images ${fullImageName} --format "{{.Size}}"`, {
        encoding: 'utf-8',
      }).trim();
      console.log(chalk.gray(`Image size: ${sizeOutput}\n`));
    } catch {
      // Ignore
    }

    // Push if requested
    if (options.push) {
      await dockerPush({ tag, registry });
    } else {
      console.log(chalk.gray('To push to registry:'));
      console.log(chalk.cyan(`  rana docker:push --tag ${tag}\n`));
    }

    // Show run command
    console.log(chalk.gray('To run locally:'));
    console.log(chalk.cyan(`  docker run -p 3000:3000 ${fullImageName}\n`));

  } catch (error: any) {
    console.log(chalk.red(`\n❌ Build failed: ${error.message}\n`));
  }
}

/**
 * Docker Push Command
 * Push Docker image to registry
 */
export async function dockerPush(options: {
  tag?: string;
  registry?: string;
} = {}) {
  console.log(chalk.bold.cyan('\n🐳 RANA Docker Push\n'));

  // Get image config
  let imageName = 'rana-app';
  let registry = options.registry || '';

  if (fs.existsSync('.rana/docker.json')) {
    const config = JSON.parse(fs.readFileSync('.rana/docker.json', 'utf-8'));
    imageName = config.imageName || imageName;
    registry = registry || config.registry || '';
  }

  if (!registry) {
    const responses = await prompts([
      {
        type: 'select',
        name: 'registry',
        message: 'Select registry:',
        choices: [
          { title: 'Docker Hub', value: 'docker.io' },
          { title: 'GitHub Container Registry', value: 'ghcr.io' },
          { title: 'Google Container Registry', value: 'gcr.io' },
          { title: 'AWS ECR', value: 'ecr' },
          { title: 'Custom', value: 'custom' },
        ],
      },
      {
        type: (prev) => prev === 'custom' ? 'text' : null,
        name: 'customRegistry',
        message: 'Registry URL:',
      },
      {
        type: 'text',
        name: 'namespace',
        message: 'Namespace/username:',
      },
    ]);

    if (!responses.registry) {
      console.log(chalk.gray('Cancelled.'));
      return;
    }

    registry = responses.customRegistry || responses.registry;
    if (responses.namespace) {
      registry = `${registry}/${responses.namespace}`;
    }

    // Save config
    if (!fs.existsSync('.rana')) {
      fs.mkdirSync('.rana', { recursive: true });
    }
    fs.writeFileSync('.rana/docker.json', JSON.stringify({
      imageName,
      registry,
    }, null, 2));
  }

  const tag = options.tag || 'latest';
  const localImage = `${imageName}:${tag}`;
  const remoteImage = `${registry}/${imageName}:${tag}`;

  console.log(chalk.gray(`Pushing ${localImage} to ${remoteImage}\n`));

  try {
    // Tag for remote
    console.log(chalk.yellow('Tagging image...'));
    execSync(`docker tag ${localImage} ${remoteImage}`, { stdio: 'inherit' });

    // Push
    console.log(chalk.yellow('\n⏳ Pushing to registry...\n'));

    const pushProcess = spawn('docker', ['push', remoteImage], {
      stdio: 'inherit',
    });

    await new Promise<void>((resolve, reject) => {
      pushProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Push failed with code ${code}`));
      });
    });

    console.log(chalk.green(`\n✅ Image pushed successfully: ${remoteImage}\n`));

  } catch (error: any) {
    console.log(chalk.red(`\n❌ Push failed: ${error.message}`));
    console.log(chalk.gray('\nMake sure you are logged in:'));
    console.log(chalk.cyan('  docker login\n'));
  }
}

/**
 * Docker Run Command
 * Run app in Docker locally
 */
export async function dockerRun(options: {
  port?: string;
} = {}) {
  console.log(chalk.bold.cyan('\n🐳 RANA Docker Run\n'));

  // Get image name
  let imageName = 'rana-app';
  if (fs.existsSync('.rana/docker.json')) {
    const config = JSON.parse(fs.readFileSync('.rana/docker.json', 'utf-8'));
    imageName = config.imageName || imageName;
  } else if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    imageName = pkg.name?.replace('@', '').replace('/', '-') || imageName;
  }

  const port = options.port || '3000';
  const fullImage = `${imageName}:latest`;

  // Check if image exists
  try {
    execSync(`docker images -q ${fullImage}`, { encoding: 'utf-8' });
  } catch {
    console.log(chalk.yellow(`Image ${fullImage} not found. Building first...\n`));
    await dockerBuild({ tag: 'latest' });
  }

  // Collect environment variables
  let envArgs: string[] = [];
  if (fs.existsSync('.env')) {
    console.log(chalk.gray('Loading environment variables from .env\n'));
    const envContent = fs.readFileSync('.env', 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key] = trimmed.split('=');
        if (key) {
          envArgs.push('--env-file');
          envArgs.push('.env');
        }
      }
    });
    // Dedupe
    envArgs = ['--env-file', '.env'];
  }

  console.log(chalk.yellow(`Starting container on port ${port}...\n`));

  try {
    const args = [
      'run',
      '--rm',
      '-p', `${port}:3000`,
      ...envArgs,
      '--name', `${imageName}-dev`,
      fullImage,
    ];

    console.log(chalk.gray(`docker ${args.join(' ')}\n`));

    const runProcess = spawn('docker', args, {
      stdio: 'inherit',
    });

    console.log(chalk.green(`\n✅ Container running at http://localhost:${port}\n`));
    console.log(chalk.gray('Press Ctrl+C to stop.\n'));

    // Handle shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\nStopping container...'));
      try {
        execSync(`docker stop ${imageName}-dev`, { stdio: 'pipe' });
      } catch {
        // Container may already be stopped
      }
      process.exit(0);
    });

    await new Promise<void>((resolve) => {
      runProcess.on('close', () => resolve());
    });

  } catch (error: any) {
    console.log(chalk.red(`\n❌ Run failed: ${error.message}\n`));
  }
}

/**
 * Create Dockerfile
 */
async function createDockerfile() {
  // Detect framework
  const hasNextJs = fs.existsSync('next.config.js') || fs.existsSync('next.config.ts') ||
    (fs.existsSync('package.json') && fs.readFileSync('package.json', 'utf-8').includes('"next"'));

  let dockerfile: string;

  if (hasNextJs) {
    dockerfile = `# RANA Dockerfile for Next.js
# Generated by \`rana docker:build\`

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f package-lock.json ]; then npm ci; \\
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \\
  else npm i; \\
  fi

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
`;

    // Update next.config.js to enable standalone output
    const nextConfigFiles = ['next.config.js', 'next.config.ts', 'next.config.mjs'];
    let nextConfigFile = nextConfigFiles.find((f) => fs.existsSync(f));

    if (nextConfigFile) {
      let config = fs.readFileSync(nextConfigFile, 'utf-8');
      if (!config.includes('standalone')) {
        console.log(chalk.yellow(`Updating ${nextConfigFile} to enable standalone output...\n`));

        if (config.includes('output:')) {
          config = config.replace(/output:\s*['"][^'"]+['"]/, "output: 'standalone'");
        } else if (config.includes('const nextConfig')) {
          config = config.replace(
            /const nextConfig\s*=\s*\{/,
            "const nextConfig = {\n  output: 'standalone',"
          );
        } else if (config.includes('module.exports')) {
          config = config.replace(
            /module\.exports\s*=\s*\{/,
            "module.exports = {\n  output: 'standalone',"
          );
        }

        fs.writeFileSync(nextConfigFile, config);
      }
    }

  } else {
    // Generic Node.js Dockerfile
    dockerfile = `# RANA Dockerfile for Node.js
# Generated by \`rana docker:build\`

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./

USER appuser

EXPOSE 3000

CMD ["node", "dist/index.js"]
`;
  }

  fs.writeFileSync('Dockerfile', dockerfile);
  console.log(chalk.green('✅ Created Dockerfile\n'));

  // Create .dockerignore
  if (!fs.existsSync('.dockerignore')) {
    const dockerignore = `# RANA .dockerignore
# Generated by \`rana docker:build\`

# Dependencies
node_modules
npm-debug.log
yarn-debug.log
yarn-error.log

# Build outputs
.next
dist
build
out

# Environment
.env
.env.local
.env.*.local

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage
.nyc_output

# Misc
*.md
LICENSE
.git
.gitignore
`;

    fs.writeFileSync('.dockerignore', dockerignore);
    console.log(chalk.green('✅ Created .dockerignore\n'));
  }
}

/**
 * Docker Compose Command
 * Start full development stack
 */
export async function dockerCompose(options: {
  profile?: string;
  detach?: boolean;
} = {}) {
  console.log(chalk.bold.cyan('\n🐳 RANA Docker Compose\n'));

  // Check for docker-compose.yml
  if (!fs.existsSync('docker-compose.yml') && !fs.existsSync('docker-compose.yaml')) {
    console.log(chalk.yellow('No docker-compose.yml found.'));
    console.log(chalk.gray('Create one or use the RANA template:\n'));
    console.log(chalk.cyan('  rana init --template docker\n'));
    return;
  }

  const args = ['compose', 'up'];

  if (options.profile) {
    args.push('--profile', options.profile);
  }

  if (options.detach) {
    args.push('-d');
  }

  console.log(chalk.yellow('Starting services...\n'));

  try {
    const composeProcess = spawn('docker', args, {
      stdio: 'inherit',
    });

    await new Promise<void>((resolve) => {
      composeProcess.on('close', () => resolve());
    });

  } catch (error: any) {
    console.log(chalk.red(`\n❌ Failed: ${error.message}\n`));
  }
}
