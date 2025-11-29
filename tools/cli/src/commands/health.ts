/**
 * Health & Monitoring Commands
 * Uptime checks, health endpoints, monitoring integration
 */

import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface HealthCheckResult {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  statusCode?: number;
  latencyMs?: number;
  error?: string;
}

interface MonitorConfig {
  provider: string;
  apiKey?: string;
  endpoints: string[];
  interval: number;
  alerts: {
    email?: string;
    slack?: string;
    webhook?: string;
  };
}

/**
 * Health Check Command
 * Check health of all endpoints
 */
export async function healthCheck(options: {
  url?: string;
  verbose?: boolean;
} = {}) {
  console.log(chalk.bold.cyan('\n🏥 RANA Health Check\n'));

  // Determine base URL
  let baseUrl = options.url;
  if (!baseUrl) {
    // Try to detect from environment
    if (fs.existsSync('.env')) {
      const env = fs.readFileSync('.env', 'utf-8');
      const urlMatch = env.match(/NEXT_PUBLIC_SITE_URL=(.+)/);
      if (urlMatch) {
        baseUrl = urlMatch[1].trim();
      }
    }
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }
  }

  console.log(chalk.gray(`Base URL: ${baseUrl}\n`));

  // Define endpoints to check
  const endpoints = [
    { path: '/', name: 'Home' },
    { path: '/api/health', name: 'Health API' },
    { path: '/api/healthz', name: 'Healthz (K8s)' },
    { path: '/_next/static', name: 'Static Assets' },
  ];

  // Check for custom endpoints in config
  if (fs.existsSync('.rana/health.json')) {
    try {
      const config = JSON.parse(fs.readFileSync('.rana/health.json', 'utf-8'));
      if (config.endpoints) {
        config.endpoints.forEach((ep: string) => {
          endpoints.push({ path: ep, name: ep });
        });
      }
    } catch {
      // Ignore
    }
  }

  const results: HealthCheckResult[] = [];

  console.log(chalk.bold('Checking endpoints...\n'));

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint.path}`;
    const result = await checkEndpoint(url, endpoint.name);
    results.push(result);

    const icon = getStatusIcon(result.status);
    const latency = result.latencyMs ? chalk.gray(`${result.latencyMs}ms`) : '';

    console.log(
      `  ${icon} ${endpoint.name.padEnd(20)} ${getStatusColor(result.status)(result.status.padEnd(10))} ${latency}`
    );

    if (options.verbose && result.error) {
      console.log(chalk.gray(`     └─ ${result.error}`));
    }
  }

  // Summary
  const healthy = results.filter((r) => r.status === 'healthy').length;
  const degraded = results.filter((r) => r.status === 'degraded').length;
  const unhealthy = results.filter((r) => r.status === 'unhealthy').length;

  console.log(chalk.gray('\n' + '─'.repeat(50)));

  if (unhealthy > 0) {
    console.log(chalk.red(`\n⚠️ ${unhealthy} endpoint(s) unhealthy`));
  } else if (degraded > 0) {
    console.log(chalk.yellow(`\n⚡ ${degraded} endpoint(s) degraded`));
  } else {
    console.log(chalk.green(`\n✅ All ${healthy} endpoints healthy`));
  }

  // Calculate overall health score
  const score = Math.round((healthy / results.length) * 100);
  const scoreColor = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
  console.log(chalk.white(`\nHealth Score: ${scoreColor(`${score}%`)}\n`));

  // Suggest next steps
  if (results.some((r) => r.status === 'unknown' && r.endpoint.includes('/api/health'))) {
    console.log(chalk.gray('Tip: Run `rana health:setup` to add health endpoints to your app.\n'));
  }
}

async function checkEndpoint(url: string, name: string): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    if (response.ok) {
      return {
        endpoint: name,
        status: latencyMs > 2000 ? 'degraded' : 'healthy',
        statusCode: response.status,
        latencyMs,
      };
    } else {
      return {
        endpoint: name,
        status: response.status >= 500 ? 'unhealthy' : 'degraded',
        statusCode: response.status,
        latencyMs,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    return {
      endpoint: name,
      status: error.name === 'AbortError' ? 'unhealthy' : 'unknown',
      error: error.name === 'AbortError' ? 'Timeout (5s)' : error.message,
    };
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'healthy':
      return chalk.green('●');
    case 'degraded':
      return chalk.yellow('●');
    case 'unhealthy':
      return chalk.red('●');
    default:
      return chalk.gray('○');
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'healthy':
      return chalk.green;
    case 'degraded':
      return chalk.yellow;
    case 'unhealthy':
      return chalk.red;
    default:
      return chalk.gray;
  }
}

/**
 * Health Setup Command
 * Add health endpoint to your app
 */
export async function healthSetup() {
  console.log(chalk.bold.cyan('\n🏥 RANA Health Endpoint Setup\n'));

  // Detect framework
  const hasNextJs = fs.existsSync('next.config.js') || fs.existsSync('next.config.ts');
  const hasExpress = fs.existsSync('package.json') &&
    fs.readFileSync('package.json', 'utf-8').includes('"express"');

  if (!hasNextJs && !hasExpress) {
    console.log(chalk.yellow('Could not detect framework. Showing Next.js example.\n'));
  }

  const { framework } = await prompts({
    type: 'select',
    name: 'framework',
    message: 'Select your framework:',
    choices: [
      { title: 'Next.js App Router', value: 'nextjs-app' },
      { title: 'Next.js Pages Router', value: 'nextjs-pages' },
      { title: 'Express.js', value: 'express' },
      { title: 'Fastify', value: 'fastify' },
    ],
    initial: hasNextJs ? 0 : hasExpress ? 2 : 0,
  });

  if (!framework) {
    console.log(chalk.gray('Cancelled.'));
    return;
  }

  // Generate health endpoint
  let code: string;
  let filePath: string;

  switch (framework) {
    case 'nextjs-app':
      filePath = 'app/api/health/route.ts';
      code = `import { NextResponse } from 'next/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database?: 'ok' | 'error';
    cache?: 'ok' | 'error';
    llm?: 'ok' | 'error';
  };
}

// Track server start time
const startTime = Date.now();

export async function GET() {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {},
  };

  // Check database connection
  try {
    // Add your database check here
    // Example: await prisma.$queryRaw\`SELECT 1\`;
    health.checks.database = 'ok';
  } catch {
    health.checks.database = 'error';
    health.status = 'degraded';
  }

  // Check cache connection
  try {
    // Add your cache check here
    // Example: await redis.ping();
    health.checks.cache = 'ok';
  } catch {
    health.checks.cache = 'error';
    health.status = 'degraded';
  }

  // Check LLM API
  try {
    // Add your LLM check here
    // Example: await openai.models.list();
    health.checks.llm = 'ok';
  } catch {
    health.checks.llm = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

// Kubernetes liveness probe
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
`;
      break;

    case 'nextjs-pages':
      filePath = 'pages/api/health.ts';
      code = `import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
}

const startTime = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus>
) {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  res.status(200).json(health);
}
`;
      break;

    case 'express':
      filePath = 'routes/health.ts';
      code = `import { Router, Request, Response } from 'express';

const router = Router();
const startTime = Date.now();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
}

router.get('/health', async (req: Request, res: Response) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  res.json(health);
});

// Kubernetes probes
router.get('/healthz', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

router.get('/readyz', (req: Request, res: Response) => {
  // Add readiness checks here
  res.status(200).send('OK');
});

export default router;
`;
      break;

    case 'fastify':
      filePath = 'routes/health.ts';
      code = `import { FastifyInstance } from 'fastify';

const startTime = Date.now();

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
  });

  // Kubernetes probes
  fastify.get('/healthz', async (request, reply) => {
    return reply.status(200).send('OK');
  });
}
`;
      break;

    default:
      console.log(chalk.red('Unknown framework'));
      return;
  }

  // Create directory if needed
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(filePath, code);

  console.log(chalk.green(`\n✅ Health endpoint created: ${filePath}\n`));

  // Also create healthz for Kubernetes
  if (framework === 'nextjs-app') {
    const healthzPath = 'app/api/healthz/route.ts';
    const healthzDir = path.dirname(healthzPath);
    if (!fs.existsSync(healthzDir)) {
      fs.mkdirSync(healthzDir, { recursive: true });
    }

    fs.writeFileSync(healthzPath, `import { NextResponse } from 'next/server';

// Kubernetes liveness probe - lightweight check
export async function GET() {
  return new NextResponse('OK', { status: 200 });
}
`);
    console.log(chalk.green(`✅ K8s probe created: ${healthzPath}\n`));
  }

  // Save config
  if (!fs.existsSync('.rana')) {
    fs.mkdirSync('.rana', { recursive: true });
  }

  fs.writeFileSync('.rana/health.json', JSON.stringify({
    endpoints: ['/api/health', '/api/healthz'],
    framework,
    createdAt: new Date().toISOString(),
  }, null, 2));

  console.log(chalk.gray('Test your health endpoint:'));
  console.log(chalk.cyan('  rana health:check\n'));
}

/**
 * Monitor Setup Command
 * Setup external monitoring
 */
export async function monitorSetup() {
  console.log(chalk.bold.cyan('\n📊 RANA Monitoring Setup\n'));

  const { provider } = await prompts({
    type: 'select',
    name: 'provider',
    message: 'Select monitoring provider:',
    choices: [
      {
        title: 'BetterStack (Recommended)',
        value: 'betterstack',
        description: 'Modern uptime monitoring with incident management',
      },
      {
        title: 'UptimeRobot',
        value: 'uptimerobot',
        description: 'Free tier available, simple setup',
      },
      {
        title: 'Checkly',
        value: 'checkly',
        description: 'API & browser checks, great for E2E',
      },
      {
        title: 'Custom Webhook',
        value: 'webhook',
        description: 'Use any monitoring service with webhooks',
      },
    ],
  });

  if (!provider) {
    console.log(chalk.gray('Cancelled.'));
    return;
  }

  let config: MonitorConfig = {
    provider,
    endpoints: ['/api/health'],
    interval: 60,
    alerts: {},
  };

  // Get provider-specific config
  switch (provider) {
    case 'betterstack':
      console.log(chalk.cyan('\nGet your API key: https://betterstack.com/uptime\n'));
      break;
    case 'uptimerobot':
      console.log(chalk.cyan('\nGet your API key: https://uptimerobot.com/dashboard\n'));
      break;
    case 'checkly':
      console.log(chalk.cyan('\nGet your API key: https://app.checklyhq.com\n'));
      break;
  }

  const responses = await prompts([
    {
      type: provider !== 'webhook' ? 'password' : null,
      name: 'apiKey',
      message: 'API Key:',
    },
    {
      type: 'text',
      name: 'productionUrl',
      message: 'Production URL to monitor:',
      validate: (v) => v.startsWith('http') || 'Must be a valid URL',
    },
    {
      type: 'number',
      name: 'interval',
      message: 'Check interval (seconds):',
      initial: 60,
    },
    {
      type: 'text',
      name: 'alertEmail',
      message: 'Alert email (optional):',
    },
    {
      type: 'text',
      name: 'slackWebhook',
      message: 'Slack webhook URL (optional):',
    },
  ]);

  if (!responses.productionUrl) {
    console.log(chalk.gray('Cancelled.'));
    return;
  }

  config = {
    ...config,
    apiKey: responses.apiKey,
    endpoints: [responses.productionUrl + '/api/health'],
    interval: responses.interval || 60,
    alerts: {
      email: responses.alertEmail,
      slack: responses.slackWebhook,
    },
  };

  // Save config (without API key in plain text)
  if (!fs.existsSync('.rana')) {
    fs.mkdirSync('.rana', { recursive: true });
  }

  fs.writeFileSync('.rana/monitor.json', JSON.stringify({
    provider: config.provider,
    endpoints: config.endpoints,
    interval: config.interval,
    alerts: {
      email: config.alerts.email ? '***configured***' : undefined,
      slack: config.alerts.slack ? '***configured***' : undefined,
    },
    configuredAt: new Date().toISOString(),
  }, null, 2));

  // Save API key to .env
  if (config.apiKey) {
    let envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
    const keyName = `${provider.toUpperCase()}_API_KEY`;
    envContent = envContent.replace(new RegExp(`${keyName}=.*\n?`, 'g'), '');
    envContent += `\n${keyName}=${config.apiKey}\n`;
    fs.writeFileSync('.env', envContent);
    console.log(chalk.green(`\n✓ API key saved to .env as ${keyName}`));
  }

  // Generate integration code
  const integrationCode = generateMonitorIntegration(config);
  fs.writeFileSync('.rana/monitor-integration.ts', integrationCode);

  console.log(chalk.green('\n✅ Monitoring configured!\n'));
  console.log(chalk.gray('Files created:'));
  console.log(chalk.gray('  - .rana/monitor.json'));
  console.log(chalk.gray('  - .rana/monitor-integration.ts'));
  console.log();

  // Provider-specific next steps
  if (provider === 'betterstack') {
    console.log(chalk.gray('Next steps:'));
    console.log(chalk.cyan('  1. Log in to BetterStack dashboard'));
    console.log(chalk.cyan('  2. Create a new monitor with your health endpoint'));
    console.log(chalk.cyan('  3. Configure alert escalation policy'));
    console.log();
  }
}

function generateMonitorIntegration(config: MonitorConfig): string {
  return `/**
 * Monitor Integration
 * Generated by \`rana monitor:setup\`
 */

export const MONITOR_CONFIG = {
  provider: '${config.provider}',
  endpoints: ${JSON.stringify(config.endpoints)},
  interval: ${config.interval},
};

/**
 * Report incident to monitoring service
 */
export async function reportIncident(incident: {
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
}) {
  ${config.alerts.slack ? `
  // Send to Slack
  await fetch('${config.alerts.slack}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: \`🚨 \${incident.severity.toUpperCase()}: \${incident.title}\`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: \`*\${incident.title}*\\n\${incident.description}\`,
          },
        },
      ],
    }),
  });
  ` : '// No Slack webhook configured'}
}

/**
 * Health check function for monitoring
 */
export async function performHealthCheck(endpoint: string): Promise<{
  healthy: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    return {
      healthy: response.ok,
      latencyMs: Date.now() - start,
      error: response.ok ? undefined : \`HTTP \${response.status}\`,
    };
  } catch (error: any) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: error.message,
    };
  }
}
`;
}

/**
 * Monitor Status Command
 * Check monitoring status
 */
export async function monitorStatus() {
  console.log(chalk.bold.cyan('\n📊 Monitoring Status\n'));

  const configFile = '.rana/monitor.json';

  if (!fs.existsSync(configFile)) {
    console.log(chalk.yellow('No monitoring configured.'));
    console.log(chalk.gray('\nRun `rana monitor:setup` to configure monitoring.\n'));
    return;
  }

  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));

  console.log(chalk.bold('Configuration:'));
  console.log(`  Provider:     ${chalk.cyan(config.provider)}`);
  console.log(`  Endpoints:    ${chalk.cyan(config.endpoints.join(', '))}`);
  console.log(`  Interval:     ${chalk.cyan(config.interval + 's')}`);
  console.log(`  Email Alerts: ${config.alerts?.email ? chalk.green('✓') : chalk.gray('✗')}`);
  console.log(`  Slack Alerts: ${config.alerts?.slack ? chalk.green('✓') : chalk.gray('✗')}`);
  console.log(`  Configured:   ${chalk.gray(config.configuredAt)}`);
  console.log();

  // Check if API key is set
  const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
  const keyName = `${config.provider.toUpperCase()}_API_KEY`;
  const hasKey = envFile.includes(keyName);

  console.log(chalk.bold('API Key:'));
  console.log(`  ${keyName}: ${hasKey ? chalk.green('✓ configured') : chalk.red('✗ missing')}`);
  console.log();
}
