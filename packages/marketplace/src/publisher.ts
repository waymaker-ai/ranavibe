/**
 * Policy publisher — prepare policies for npm publishing.
 */

import type {
  PolicyPackage,
  PolicyRule,
  PublishConfig,
  PublishResult,
} from './types';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateForPublish(pkg: PolicyPackage): string[] {
  const errors: string[] = [];

  if (!pkg.name || pkg.name.length === 0) {
    errors.push('Package name is required');
  }
  if (!pkg.version || !/^\d+\.\d+\.\d+/.test(pkg.version)) {
    errors.push('Valid semver version is required (e.g., "1.0.0")');
  }
  if (!pkg.description || pkg.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  if (!pkg.policies || pkg.policies.length === 0) {
    errors.push('At least one policy rule is required');
  }

  // Validate individual rules
  const ruleIds = new Set<string>();
  for (let i = 0; i < (pkg.policies ?? []).length; i++) {
    const rule = pkg.policies[i];
    if (!rule.id) {
      errors.push(`Policy rule at index ${i}: missing "id"`);
    } else if (ruleIds.has(rule.id)) {
      errors.push(`Duplicate policy rule id: "${rule.id}"`);
    } else {
      ruleIds.add(rule.id);
    }
    if (!rule.description) {
      errors.push(`Policy rule "${rule.id ?? i}": missing "description"`);
    }
  }

  if (!pkg.author || pkg.author.length === 0) {
    errors.push('Author is required');
  }

  return errors;
}

// ---------------------------------------------------------------------------
// README generation
// ---------------------------------------------------------------------------

function generateReadme(pkg: PolicyPackage, config: PublishConfig): string {
  const lines: string[] = [];

  lines.push(`# ${pkg.name}`);
  lines.push('');
  lines.push(pkg.description);
  lines.push('');
  lines.push('## Installation');
  lines.push('');
  lines.push('```bash');
  lines.push(pkg.installCommand || `npm install ${pkg.name}`);
  lines.push('```');
  lines.push('');
  lines.push('## Policy Rules');
  lines.push('');
  lines.push('| Rule | Category | Severity | Action | Description |');
  lines.push('|------|----------|----------|--------|-------------|');

  for (const rule of pkg.policies) {
    lines.push(
      `| \`${rule.id}\` | ${rule.category} | ${rule.severity} | ${rule.action} | ${rule.description} |`,
    );
  }

  lines.push('');
  lines.push('## Tags');
  lines.push('');
  lines.push(pkg.tags.map((t) => `\`${t}\``).join(', '));
  lines.push('');

  if (pkg.categories.length > 0) {
    lines.push('## Categories');
    lines.push('');
    lines.push(pkg.categories.join(', '));
    lines.push('');
  }

  lines.push('## License');
  lines.push('');
  lines.push(config.license ?? 'MIT');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// package.json generation
// ---------------------------------------------------------------------------

function generatePackageJson(
  pkg: PolicyPackage,
  config: PublishConfig,
): Record<string, unknown> {
  const name = config.scope
    ? `${config.scope}/${pkg.name.replace(/^@[^/]+\//, '')}`
    : pkg.name;

  return {
    name,
    version: pkg.version,
    description: pkg.description,
    main: 'policies.json',
    files: ['policies.json', 'README.md'],
    keywords: [
      'cofounder',
      'cofounder-policy',
      'ai-safety',
      'guardrails',
      ...pkg.tags,
      ...(config.keywords ?? []),
    ],
    author: config.author,
    license: config.license ?? 'MIT',
    repository: config.repository
      ? { type: 'git', url: config.repository }
      : undefined,
    publishConfig: { access: 'public' },
    cofounder: {
      categories: pkg.categories,
      ruleCount: pkg.policies.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Policy file generation
// ---------------------------------------------------------------------------

function generatePolicyFile(pkg: PolicyPackage): string {
  const payload = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    author: pkg.author,
    categories: pkg.categories,
    tags: pkg.tags,
    policies: pkg.policies,
  };

  return JSON.stringify(payload, null, 2);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Prepare a policy package for publishing to npm.
 *
 * Returns all the files needed to publish: package.json, README.md, and
 * policies.json. The caller is responsible for writing these to disk and
 * running `npm publish`.
 */
export function prepareForPublish(
  policy: PolicyPackage,
  config: PublishConfig,
): PublishResult {
  const errors = validateForPublish(policy);
  const packageJson = generatePackageJson(policy, config);
  const readme = generateReadme(policy, config);
  const policyFile = generatePolicyFile(policy);

  return {
    packageName: packageJson.name as string,
    packageJson,
    readme,
    policyFile,
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a minimal policy package from a set of rules.
 * Useful for quickly authoring policies without filling in all metadata.
 */
export function createPolicyPackage(options: {
  name: string;
  description: string;
  author: string;
  policies: PolicyRule[];
  tags?: string[];
  version?: string;
}): PolicyPackage {
  return {
    name: options.name,
    version: options.version ?? '1.0.0',
    author: options.author,
    description: options.description,
    policies: options.policies,
    tags: options.tags ?? [],
    downloads: 0,
    rating: 0,
    categories: ['general'],
    installCommand: `npm install ${options.name}`,
    updatedAt: new Date().toISOString(),
  };
}
