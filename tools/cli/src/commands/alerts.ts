/**
 * RANA Cost Alerts
 *
 * Configure alerts for cost thresholds via Slack, email, or webhooks
 *
 * @example
 * ```bash
 * # Setup alerts interactively
 * rana alerts:setup
 *
 * # Add a Slack webhook
 * rana alerts:add slack https://hooks.slack.com/...
 *
 * # Add an email alert
 * rana alerts:add email team@company.com
 *
 * # Add a custom webhook
 * rana alerts:add webhook https://api.company.com/alerts
 *
 * # List configured alerts
 * rana alerts:list
 *
 * # Test alerts
 * rana alerts:test
 *
 * # Remove an alert
 * rana alerts:remove <id>
 * ```
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Alert types
type AlertType = 'slack' | 'email' | 'webhook' | 'discord';

interface AlertConfig {
  id: string;
  type: AlertType;
  target: string;
  enabled: boolean;
  thresholds: {
    warning: number;   // Percentage of budget (e.g., 80)
    critical: number;  // Percentage of budget (e.g., 95)
  };
  createdAt: string;
}

interface AlertsConfig {
  alerts: AlertConfig[];
  globalThresholds: {
    warning: number;
    critical: number;
  };
  cooldownMinutes: number;  // Prevent spam
  lastAlertSent?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.rana');
const ALERTS_FILE = path.join(CONFIG_DIR, 'alerts.json');

/**
 * Load alerts configuration
 */
function loadAlertsConfig(): AlertsConfig {
  try {
    if (fs.existsSync(ALERTS_FILE)) {
      return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return {
    alerts: [],
    globalThresholds: { warning: 80, critical: 95 },
    cooldownMinutes: 60,
  };
}

/**
 * Save alerts configuration
 */
function saveAlertsConfig(config: AlertsConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(config, null, 2));
}

/**
 * Generate a simple ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Interactive alerts setup
 */
export async function alertsSetupCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n🔔 RANA Cost Alerts Setup\n'));

  console.log(chalk.gray('Cost alerts notify you when spending approaches your budget.'));
  console.log(chalk.gray('Supports: Slack, Discord, Email, Custom Webhooks\n'));

  console.log(chalk.bold('Quick Setup Commands:\n'));

  console.log(chalk.white('1. Add Slack webhook:'));
  console.log(chalk.cyan('   rana alerts:add slack <webhook-url>\n'));

  console.log(chalk.white('2. Add Discord webhook:'));
  console.log(chalk.cyan('   rana alerts:add discord <webhook-url>\n'));

  console.log(chalk.white('3. Add email notification:'));
  console.log(chalk.cyan('   rana alerts:add email <email@example.com>\n'));

  console.log(chalk.white('4. Add custom webhook:'));
  console.log(chalk.cyan('   rana alerts:add webhook <url>\n'));

  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.bold('\nThreshold Configuration:\n'));

  const config = loadAlertsConfig();
  console.log(chalk.gray(`Current thresholds:`));
  console.log(chalk.yellow(`  Warning:  ${config.globalThresholds.warning}% of budget`));
  console.log(chalk.red(`  Critical: ${config.globalThresholds.critical}% of budget`));
  console.log(chalk.gray(`  Cooldown: ${config.cooldownMinutes} minutes between alerts\n`));

  console.log(chalk.white('To change thresholds:'));
  console.log(chalk.cyan('  rana alerts:threshold --warning 75 --critical 90\n'));
}

/**
 * Add a new alert
 */
export async function alertsAddCommand(type: string, target: string): Promise<void> {
  if (!type || !target) {
    console.log(chalk.yellow('\nUsage: rana alerts:add <type> <target>\n'));
    console.log('Types:');
    console.log(chalk.gray('  slack    - Slack webhook URL'));
    console.log(chalk.gray('  discord  - Discord webhook URL'));
    console.log(chalk.gray('  email    - Email address'));
    console.log(chalk.gray('  webhook  - Custom webhook URL\n'));
    console.log('Examples:');
    console.log(chalk.cyan('  rana alerts:add slack https://hooks.slack.com/services/...'));
    console.log(chalk.cyan('  rana alerts:add email alerts@company.com'));
    console.log('');
    return;
  }

  const alertType = type.toLowerCase() as AlertType;
  if (!['slack', 'discord', 'email', 'webhook'].includes(alertType)) {
    console.log(chalk.red(`\nUnknown alert type: ${type}`));
    console.log(chalk.gray('Valid types: slack, discord, email, webhook\n'));
    return;
  }

  // Validate target based on type
  if (alertType === 'email' && !target.includes('@')) {
    console.log(chalk.red('\nInvalid email address'));
    return;
  }

  if (['slack', 'discord', 'webhook'].includes(alertType)) {
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      console.log(chalk.red('\nWebhook URL must start with http:// or https://'));
      return;
    }
  }

  const config = loadAlertsConfig();

  const newAlert: AlertConfig = {
    id: generateId(),
    type: alertType,
    target,
    enabled: true,
    thresholds: { ...config.globalThresholds },
    createdAt: new Date().toISOString(),
  };

  config.alerts.push(newAlert);
  saveAlertsConfig(config);

  console.log(chalk.green(`\n✓ Alert added successfully!\n`));
  console.log(chalk.gray(`  ID:     ${newAlert.id}`));
  console.log(chalk.gray(`  Type:   ${alertType}`));
  console.log(chalk.gray(`  Target: ${maskTarget(alertType, target)}`));
  console.log(chalk.gray(`\nTest your alert:`));
  console.log(chalk.cyan(`  rana alerts:test ${newAlert.id}\n`));
}

/**
 * List all configured alerts
 */
export async function alertsListCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n🔔 Configured Alerts\n'));

  const config = loadAlertsConfig();

  if (config.alerts.length === 0) {
    console.log(chalk.yellow('No alerts configured.\n'));
    console.log(chalk.gray('Add an alert:'));
    console.log(chalk.cyan('  rana alerts:add slack <webhook-url>\n'));
    return;
  }

  // Table header
  console.log(
    chalk.gray('  ') +
    chalk.bold('ID'.padEnd(10)) +
    chalk.bold('Type'.padEnd(10)) +
    chalk.bold('Target'.padEnd(35)) +
    chalk.bold('Status')
  );
  console.log(chalk.gray('  ' + '-'.repeat(65)));

  for (const alert of config.alerts) {
    const status = alert.enabled ? chalk.green('Active') : chalk.gray('Disabled');
    console.log(
      chalk.gray('  ') +
      chalk.white(alert.id.padEnd(10)) +
      chalk.cyan(alert.type.padEnd(10)) +
      chalk.gray(maskTarget(alert.type, alert.target).padEnd(35)) +
      status
    );
  }

  console.log(chalk.gray('\n  Thresholds:'));
  console.log(chalk.yellow(`    Warning:  ${config.globalThresholds.warning}%`));
  console.log(chalk.red(`    Critical: ${config.globalThresholds.critical}%`));
  console.log('');
}

/**
 * Test an alert
 */
export async function alertsTestCommand(alertId?: string): Promise<void> {
  const config = loadAlertsConfig();

  if (config.alerts.length === 0) {
    console.log(chalk.yellow('\nNo alerts configured.'));
    console.log(chalk.gray('Add an alert first: rana alerts:add slack <url>\n'));
    return;
  }

  const alertsToTest = alertId
    ? config.alerts.filter(a => a.id === alertId)
    : config.alerts.filter(a => a.enabled);

  if (alertsToTest.length === 0) {
    console.log(chalk.yellow(`\nNo alert found with ID: ${alertId}\n`));
    return;
  }

  console.log(chalk.bold.cyan('\n🔔 Testing Alerts\n'));

  for (const alert of alertsToTest) {
    console.log(chalk.gray(`Testing ${alert.type} alert (${alert.id})...`));

    try {
      await sendAlert(alert, {
        level: 'test',
        message: 'This is a test alert from RANA',
        spent: 5.00,
        budget: 10.00,
        percentage: 50,
      });
      console.log(chalk.green(`  ✓ ${alert.type} alert sent successfully`));
    } catch (error: any) {
      console.log(chalk.red(`  ✗ Failed: ${error.message}`));
    }
  }

  console.log('');
}

/**
 * Remove an alert
 */
export async function alertsRemoveCommand(alertId: string): Promise<void> {
  if (!alertId) {
    console.log(chalk.yellow('\nUsage: rana alerts:remove <id>\n'));
    console.log(chalk.gray('List alerts to find IDs: rana alerts:list\n'));
    return;
  }

  const config = loadAlertsConfig();
  const index = config.alerts.findIndex(a => a.id === alertId);

  if (index === -1) {
    console.log(chalk.yellow(`\nNo alert found with ID: ${alertId}\n`));
    return;
  }

  const removed = config.alerts.splice(index, 1)[0];
  saveAlertsConfig(config);

  console.log(chalk.green(`\n✓ Alert removed: ${removed.type} (${maskTarget(removed.type, removed.target)})\n`));
}

/**
 * Set alert thresholds
 */
export async function alertsThresholdCommand(options: {
  warning?: number;
  critical?: number;
  cooldown?: number;
}): Promise<void> {
  const config = loadAlertsConfig();

  if (options.warning !== undefined) {
    if (options.warning < 1 || options.warning > 100) {
      console.log(chalk.red('\nWarning threshold must be between 1 and 100\n'));
      return;
    }
    config.globalThresholds.warning = options.warning;
  }

  if (options.critical !== undefined) {
    if (options.critical < 1 || options.critical > 100) {
      console.log(chalk.red('\nCritical threshold must be between 1 and 100\n'));
      return;
    }
    config.globalThresholds.critical = options.critical;
  }

  if (options.cooldown !== undefined) {
    if (options.cooldown < 1) {
      console.log(chalk.red('\nCooldown must be at least 1 minute\n'));
      return;
    }
    config.cooldownMinutes = options.cooldown;
  }

  // Validate warning < critical
  if (config.globalThresholds.warning >= config.globalThresholds.critical) {
    console.log(chalk.red('\nWarning threshold must be less than critical threshold\n'));
    return;
  }

  saveAlertsConfig(config);

  console.log(chalk.green('\n✓ Thresholds updated!\n'));
  console.log(chalk.yellow(`  Warning:  ${config.globalThresholds.warning}%`));
  console.log(chalk.red(`  Critical: ${config.globalThresholds.critical}%`));
  console.log(chalk.gray(`  Cooldown: ${config.cooldownMinutes} minutes\n`));
}

/**
 * Send an alert to a configured endpoint
 */
async function sendAlert(
  alert: AlertConfig,
  data: {
    level: 'warning' | 'critical' | 'test';
    message: string;
    spent: number;
    budget: number;
    percentage: number;
  }
): Promise<void> {
  const { level, message, spent, budget, percentage } = data;

  switch (alert.type) {
    case 'slack':
      await sendSlackAlert(alert.target, level, message, spent, budget, percentage);
      break;
    case 'discord':
      await sendDiscordAlert(alert.target, level, message, spent, budget, percentage);
      break;
    case 'webhook':
      await sendWebhookAlert(alert.target, level, message, spent, budget, percentage);
      break;
    case 'email':
      // Email would require SMTP setup - show instructions
      console.log(chalk.gray(`  Email alerts require SMTP configuration`));
      console.log(chalk.gray(`  Would send to: ${alert.target}`));
      break;
  }
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(
  webhookUrl: string,
  level: string,
  message: string,
  spent: number,
  budget: number,
  percentage: number
): Promise<void> {
  const color = level === 'critical' ? '#dc2626' : level === 'warning' ? '#f59e0b' : '#3b82f6';
  const emoji = level === 'critical' ? '🚨' : level === 'warning' ? '⚠️' : '🔔';

  const payload = {
    attachments: [{
      color,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} RANA Cost Alert: ${level.toUpperCase()}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Spent:*\n$${spent.toFixed(2)}` },
            { type: 'mrkdwn', text: `*Budget:*\n$${budget.toFixed(2)}` },
            { type: 'mrkdwn', text: `*Usage:*\n${percentage.toFixed(1)}%` },
          ],
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: message },
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `Sent by RANA CLI • ${new Date().toISOString()}` },
          ],
        },
      ],
    }],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status}`);
  }
}

/**
 * Send Discord alert
 */
async function sendDiscordAlert(
  webhookUrl: string,
  level: string,
  message: string,
  spent: number,
  budget: number,
  percentage: number
): Promise<void> {
  const color = level === 'critical' ? 0xdc2626 : level === 'warning' ? 0xf59e0b : 0x3b82f6;
  const emoji = level === 'critical' ? '🚨' : level === 'warning' ? '⚠️' : '🔔';

  const payload = {
    embeds: [{
      title: `${emoji} RANA Cost Alert: ${level.toUpperCase()}`,
      color,
      fields: [
        { name: 'Spent', value: `$${spent.toFixed(2)}`, inline: true },
        { name: 'Budget', value: `$${budget.toFixed(2)}`, inline: true },
        { name: 'Usage', value: `${percentage.toFixed(1)}%`, inline: true },
      ],
      description: message,
      footer: { text: 'RANA CLI' },
      timestamp: new Date().toISOString(),
    }],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord API error: ${response.status}`);
  }
}

/**
 * Send generic webhook alert
 */
async function sendWebhookAlert(
  webhookUrl: string,
  level: string,
  message: string,
  spent: number,
  budget: number,
  percentage: number
): Promise<void> {
  const payload = {
    type: 'rana_cost_alert',
    level,
    message,
    data: {
      spent,
      budget,
      percentage,
      currency: 'USD',
    },
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status}`);
  }
}

/**
 * Mask sensitive parts of target for display
 */
function maskTarget(type: AlertType, target: string): string {
  if (type === 'email') {
    const [user, domain] = target.split('@');
    return `${user.slice(0, 2)}***@${domain}`;
  }

  if (['slack', 'discord', 'webhook'].includes(type)) {
    try {
      const url = new URL(target);
      return `${url.protocol}//${url.host}/***`;
    } catch {
      return '***';
    }
  }

  return target;
}

/**
 * Check budget and send alerts if needed (called by budget system)
 */
export async function checkAndSendAlerts(spent: number, budget: number): Promise<void> {
  const config = loadAlertsConfig();

  if (config.alerts.length === 0 || budget <= 0) {
    return;
  }

  const percentage = (spent / budget) * 100;

  // Check cooldown
  if (config.lastAlertSent) {
    const lastAlert = new Date(config.lastAlertSent);
    const cooldownMs = config.cooldownMinutes * 60 * 1000;
    if (Date.now() - lastAlert.getTime() < cooldownMs) {
      return; // Still in cooldown
    }
  }

  let level: 'warning' | 'critical' | null = null;
  let message = '';

  if (percentage >= config.globalThresholds.critical) {
    level = 'critical';
    message = `🚨 Critical: You've used ${percentage.toFixed(1)}% of your budget ($${spent.toFixed(2)} of $${budget.toFixed(2)})`;
  } else if (percentage >= config.globalThresholds.warning) {
    level = 'warning';
    message = `⚠️ Warning: You've used ${percentage.toFixed(1)}% of your budget ($${spent.toFixed(2)} of $${budget.toFixed(2)})`;
  }

  if (!level) {
    return;
  }

  // Send to all enabled alerts
  for (const alert of config.alerts.filter(a => a.enabled)) {
    try {
      await sendAlert(alert, { level, message, spent, budget, percentage });
    } catch {
      // Silently fail individual alerts
    }
  }

  // Update last alert time
  config.lastAlertSent = new Date().toISOString();
  saveAlertsConfig(config);
}
