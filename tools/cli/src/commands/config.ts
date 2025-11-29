/**
 * Config Command
 * Manage API keys and RANA configuration
 * Securely stores keys in ~/.rana/credentials
 */

import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

interface ProviderCredentials {
  [provider: string]: string;
}

interface RanaCredentials {
  providers: ProviderCredentials;
  defaultProvider?: string;
  lastUpdated: string;
}

const CREDENTIALS_DIR = path.join(os.homedir(), '.rana');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json');

const PROVIDERS = [
  { name: 'openai', display: 'OpenAI', envVar: 'OPENAI_API_KEY', keyPrefix: 'sk-' },
  { name: 'anthropic', display: 'Anthropic', envVar: 'ANTHROPIC_API_KEY', keyPrefix: 'sk-ant-' },
  { name: 'google', display: 'Google AI', envVar: 'GOOGLE_AI_API_KEY', keyPrefix: 'AI' },
  { name: 'groq', display: 'Groq', envVar: 'GROQ_API_KEY', keyPrefix: 'gsk_' },
  { name: 'mistral', display: 'Mistral', envVar: 'MISTRAL_API_KEY', keyPrefix: '' },
  { name: 'cohere', display: 'Cohere', envVar: 'COHERE_API_KEY', keyPrefix: '' },
  { name: 'together', display: 'Together AI', envVar: 'TOGETHER_API_KEY', keyPrefix: '' },
  { name: 'xai', display: 'xAI (Grok)', envVar: 'XAI_API_KEY', keyPrefix: 'xai-' },
  { name: 'ollama', display: 'Ollama (Local)', envVar: 'OLLAMA_URL', keyPrefix: 'http' },
];

/**
 * Show current RANA configuration
 */
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

/**
 * Set API Key Command
 */
export async function configSet(options: { provider?: string; key?: string } = {}) {
  console.log(chalk.bold.cyan('\n🔑 RANA API Key Configuration\n'));

  let provider = options.provider;
  let apiKey = options.key;

  // Select provider if not specified
  if (!provider) {
    const { selectedProvider } = await prompts({
      type: 'select',
      name: 'selectedProvider',
      message: 'Select provider to configure:',
      choices: PROVIDERS.map((p) => ({
        title: p.display,
        value: p.name,
        description: p.envVar,
      })),
    });

    if (!selectedProvider) {
      console.log(chalk.gray('Configuration cancelled.\n'));
      return;
    }
    provider = selectedProvider;
  }

  const providerInfo = PROVIDERS.find((p) => p.name === provider);
  if (!providerInfo) {
    console.log(chalk.red(`Unknown provider: ${provider}\n`));
    console.log(chalk.gray('Available providers: ' + PROVIDERS.map((p) => p.name).join(', ')));
    return;
  }

  // Get API key if not specified
  if (!apiKey) {
    if (providerInfo.name === 'ollama') {
      const { url } = await prompts({
        type: 'text',
        name: 'url',
        message: 'Enter Ollama URL:',
        initial: 'http://localhost:11434',
      });
      apiKey = url;
    } else {
      // Show help for getting API key
      console.log(chalk.gray(`\nGet your ${providerInfo.display} API key from:`));
      console.log(chalk.cyan(getApiKeyUrl(providerInfo.name)));
      console.log();

      const { key } = await prompts({
        type: 'password',
        name: 'key',
        message: `Enter ${providerInfo.display} API key:`,
      });
      apiKey = key;
    }
  }

  if (!apiKey) {
    console.log(chalk.gray('No key provided. Configuration cancelled.\n'));
    return;
  }

  // Validate key format
  if (providerInfo.keyPrefix && !apiKey.startsWith(providerInfo.keyPrefix)) {
    console.log(chalk.yellow(`\n⚠ Key doesn't match expected format (should start with "${providerInfo.keyPrefix}")`));
    const { proceed } = await prompts({
      type: 'confirm',
      name: 'proceed',
      message: 'Save anyway?',
      initial: false,
    });
    if (!proceed) {
      console.log(chalk.gray('Configuration cancelled.\n'));
      return;
    }
  }

  // Save credentials
  saveCredential(provider!, apiKey);

  console.log(chalk.green(`\n✓ ${providerInfo.display} API key saved successfully!\n`));

  // Ask about setting as default
  const credentials = loadCredentials();
  if (!credentials.defaultProvider || credentials.defaultProvider !== provider) {
    const { setDefault } = await prompts({
      type: 'confirm',
      name: 'setDefault',
      message: `Set ${providerInfo.display} as default provider?`,
      initial: true,
    });

    if (setDefault) {
      credentials.defaultProvider = provider;
      saveCredentials(credentials);
      console.log(chalk.green(`✓ ${providerInfo.display} set as default provider\n`));
    }
  }

  // Show usage
  console.log(chalk.bold('Usage:\n'));
  console.log(chalk.gray('  In your code:'));
  console.log(chalk.cyan(`    import { rana } from '@rana/core';`));
  console.log(chalk.cyan(`    const response = await rana.chat('Hello!');`));
  console.log();
  console.log(chalk.gray('  Or set environment variable:'));
  console.log(chalk.cyan(`    export ${providerInfo.envVar}="${maskKey(apiKey)}"`));
  console.log();
}

/**
 * List Configured Keys Command
 */
export async function configList() {
  console.log(chalk.bold.cyan('\n🔑 Configured API Keys\n'));

  const credentials = loadCredentials();
  const envKeys = loadEnvKeys();

  let hasAnyKey = false;

  for (const provider of PROVIDERS) {
    const savedKey = credentials.providers[provider.name];
    const envKey = envKeys[provider.name];
    const isDefault = credentials.defaultProvider === provider.name;

    let status: string;
    let source: string;

    if (savedKey) {
      status = chalk.green('✓ Configured');
      source = chalk.gray('(~/.rana/credentials)');
      hasAnyKey = true;
    } else if (envKey) {
      status = chalk.green('✓ Configured');
      source = chalk.gray(`(${provider.envVar})`);
      hasAnyKey = true;
    } else {
      status = chalk.gray('○ Not configured');
      source = '';
    }

    const defaultBadge = isDefault ? chalk.yellow(' [default]') : '';
    const keyPreview = savedKey ? chalk.gray(` ${maskKey(savedKey)}`) : envKey ? chalk.gray(` ${maskKey(envKey)}`) : '';

    console.log(`  ${provider.display.padEnd(15)} ${status}${defaultBadge}${keyPreview} ${source}`);
  }

  console.log();

  if (!hasAnyKey) {
    console.log(chalk.yellow('No API keys configured yet.\n'));
    console.log(chalk.gray('Run `rana config:set` to add your first API key.\n'));
  } else {
    console.log(chalk.gray(`Credentials stored in: ${CREDENTIALS_FILE}\n`));
  }
}

/**
 * Validate Keys Command
 */
export async function configValidate(options: { provider?: string } = {}) {
  console.log(chalk.bold.cyan('\n🔍 Validating API Keys\n'));

  const credentials = loadCredentials();
  const envKeys = loadEnvKeys();

  const providersToCheck = options.provider
    ? PROVIDERS.filter((p) => p.name === options.provider)
    : PROVIDERS;

  let allValid = true;

  for (const provider of providersToCheck) {
    const key = credentials.providers[provider.name] || envKeys[provider.name];

    if (!key) {
      console.log(`  ${provider.display.padEnd(15)} ${chalk.gray('○ Not configured')}`);
      continue;
    }

    process.stdout.write(`  ${provider.display.padEnd(15)} `);

    try {
      const isValid = await validateProviderKey(provider.name, key);
      if (isValid) {
        console.log(chalk.green('✓ Valid'));
      } else {
        console.log(chalk.red('✗ Invalid'));
        allValid = false;
      }
    } catch (error: any) {
      console.log(chalk.red(`✗ Error: ${error.message}`));
      allValid = false;
    }
  }

  console.log();

  if (allValid) {
    console.log(chalk.green('✓ All configured keys are valid!\n'));
  } else {
    console.log(chalk.yellow('⚠ Some keys are invalid. Run `rana config:set` to update them.\n'));
  }
}

/**
 * Remove Key Command
 */
export async function configRemove(options: { provider?: string } = {}) {
  console.log(chalk.bold.cyan('\n🗑️  Remove API Key\n'));

  const credentials = loadCredentials();
  const configuredProviders = PROVIDERS.filter((p) => credentials.providers[p.name]);

  if (configuredProviders.length === 0) {
    console.log(chalk.gray('No API keys configured.\n'));
    return;
  }

  let provider = options.provider;

  if (!provider) {
    const { selectedProvider } = await prompts({
      type: 'select',
      name: 'selectedProvider',
      message: 'Select provider to remove:',
      choices: configuredProviders.map((p) => ({
        title: p.display,
        value: p.name,
      })),
    });

    if (!selectedProvider) {
      console.log(chalk.gray('Cancelled.\n'));
      return;
    }
    provider = selectedProvider;
  }

  const providerInfo = PROVIDERS.find((p) => p.name === provider);
  if (!providerInfo || !provider || !credentials.providers[provider]) {
    console.log(chalk.red(`No key configured for ${provider}\n`));
    return;
  }

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: `Remove ${providerInfo.display} API key?`,
    initial: false,
  });

  if (!confirm) {
    console.log(chalk.gray('Cancelled.\n'));
    return;
  }

  delete credentials.providers[provider];
  if (credentials.defaultProvider === provider) {
    credentials.defaultProvider = undefined;
  }
  saveCredentials(credentials);

  console.log(chalk.green(`\n✓ ${providerInfo.display} API key removed.\n`));
}

/**
 * Export Keys to .env Command
 */
export async function configExport(options: { file?: string } = {}) {
  console.log(chalk.bold.cyan('\n📤 Export API Keys to .env\n'));

  const credentials = loadCredentials();
  const envKeys = loadEnvKeys();

  const lines: string[] = ['# RANA API Keys', `# Generated on ${new Date().toISOString()}`, ''];

  for (const provider of PROVIDERS) {
    const key = credentials.providers[provider.name] || envKeys[provider.name];
    if (key) {
      lines.push(`${provider.envVar}=${key}`);
    }
  }

  if (lines.length <= 3) {
    console.log(chalk.yellow('No API keys to export.\n'));
    return;
  }

  const outputFile = options.file || '.env.rana';
  const content = lines.join('\n') + '\n';

  // Check if file exists
  if (fs.existsSync(outputFile)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `${outputFile} exists. Overwrite?`,
      initial: false,
    });

    if (!overwrite) {
      console.log(chalk.gray('Export cancelled.\n'));
      return;
    }
  }

  fs.writeFileSync(outputFile, content);
  console.log(chalk.green(`✓ API keys exported to ${outputFile}\n`));

  // Add to .gitignore
  if (!fs.existsSync('.gitignore') || !fs.readFileSync('.gitignore', 'utf-8').includes(outputFile)) {
    const { addGitignore } = await prompts({
      type: 'confirm',
      name: 'addGitignore',
      message: 'Add to .gitignore?',
      initial: true,
    });

    if (addGitignore) {
      fs.appendFileSync('.gitignore', `\n# RANA API Keys\n${outputFile}\n`);
      console.log(chalk.green(`✓ Added ${outputFile} to .gitignore\n`));
    }
  }
}

/**
 * Import Keys from .env Command
 */
export async function configImport(options: { file?: string } = {}) {
  console.log(chalk.bold.cyan('\n📥 Import API Keys from .env\n'));

  const inputFile = options.file || '.env';

  if (!fs.existsSync(inputFile)) {
    console.log(chalk.red(`File not found: ${inputFile}\n`));
    return;
  }

  const content = fs.readFileSync(inputFile, 'utf-8');
  const credentials = loadCredentials();
  let imported = 0;

  for (const provider of PROVIDERS) {
    const regex = new RegExp(`^${provider.envVar}=(.+)$`, 'm');
    const match = content.match(regex);

    if (match && match[1]) {
      const key = match[1].trim().replace(/["']/g, '');
      credentials.providers[provider.name] = key;
      console.log(chalk.green(`  ✓ Imported ${provider.display}`));
      imported++;
    }
  }

  if (imported > 0) {
    saveCredentials(credentials);
    console.log(chalk.green(`\n✓ Imported ${imported} API key(s)\n`));
  } else {
    console.log(chalk.yellow('No API keys found in file.\n'));
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function loadCredentials(): RanaCredentials {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
    } catch {
      // Return default
    }
  }
  return {
    providers: {},
    lastUpdated: new Date().toISOString(),
  };
}

function saveCredentials(credentials: RanaCredentials) {
  if (!fs.existsSync(CREDENTIALS_DIR)) {
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  }

  credentials.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), { mode: 0o600 });
}

function saveCredential(provider: string, key: string) {
  const credentials = loadCredentials();
  credentials.providers[provider] = key;
  saveCredentials(credentials);
}

function loadEnvKeys(): ProviderCredentials {
  const keys: ProviderCredentials = {};

  // Check .env files
  const envFiles = ['.env', '.env.local', '.env.development'];
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const provider of PROVIDERS) {
        const regex = new RegExp(`^${provider.envVar}=(.+)$`, 'm');
        const match = content.match(regex);
        if (match && match[1]) {
          keys[provider.name] = match[1].trim().replace(/["']/g, '');
        }
      }
    }
  }

  // Check environment variables
  for (const provider of PROVIDERS) {
    if (process.env[provider.envVar] && !keys[provider.name]) {
      keys[provider.name] = process.env[provider.envVar]!;
    }
  }

  return keys;
}

function maskKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

function getApiKeyUrl(provider: string): string {
  const urls: Record<string, string> = {
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/settings/keys',
    google: 'https://aistudio.google.com/apikey',
    groq: 'https://console.groq.com/keys',
    mistral: 'https://console.mistral.ai/api-keys',
    cohere: 'https://dashboard.cohere.com/api-keys',
    together: 'https://api.together.xyz/settings/api-keys',
    xai: 'https://console.x.ai/',
    ollama: 'https://ollama.ai/download',
  };
  return urls[provider] || 'Check provider documentation';
}

async function validateProviderKey(provider: string, key: string): Promise<boolean> {
  try {
    switch (provider) {
      case 'openai': {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        return response.ok;
      }
      case 'anthropic': {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        });
        // 400 means key is valid but request is bad (which is fine for validation)
        return response.ok || response.status === 400;
      }
      case 'groq': {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        return response.ok;
      }
      case 'mistral': {
        const response = await fetch('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        return response.ok;
      }
      case 'ollama': {
        const response = await fetch(`${key}/api/tags`);
        return response.ok;
      }
      default:
        // For providers we can't easily validate, assume valid if key exists
        return key.length > 10;
    }
  } catch {
    return false;
  }
}
