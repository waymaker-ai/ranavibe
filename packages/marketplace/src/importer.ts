/**
 * Policy importer — import policies from npm, URL, file, or registry.
 */

import type {
  PolicyImport,
  PolicyImportResult,
  PolicyPackage,
  PolicyRule,
} from './types';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validatePolicyRule(rule: unknown, index: number): string[] {
  const warnings: string[] = [];
  if (!rule || typeof rule !== 'object') {
    warnings.push(`Rule at index ${index}: must be an object`);
    return warnings;
  }
  const r = rule as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id.length === 0) {
    warnings.push(`Rule at index ${index}: missing or empty "id"`);
  }
  if (typeof r.description !== 'string' || r.description.length === 0) {
    warnings.push(`Rule at index ${index}: missing or empty "description"`);
  }
  if (typeof r.category !== 'string') {
    warnings.push(`Rule at index ${index}: missing "category"`);
  }
  const validSeverities = ['critical', 'high', 'medium', 'low'];
  if (!validSeverities.includes(r.severity as string)) {
    warnings.push(`Rule at index ${index}: invalid severity "${String(r.severity)}"`);
  }
  const validActions = ['block', 'redact', 'flag', 'log', 'allow'];
  if (!validActions.includes(r.action as string)) {
    warnings.push(`Rule at index ${index}: invalid action "${String(r.action)}"`);
  }
  return warnings;
}

function validatePolicyPackage(
  data: unknown,
): { pkg: PolicyPackage | null; warnings: string[]; error?: string } {
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { pkg: null, warnings, error: 'Payload is not a valid object' };
  }

  const d = data as Record<string, unknown>;

  if (typeof d.name !== 'string' || d.name.length === 0) {
    return { pkg: null, warnings, error: 'Missing or empty "name" field' };
  }

  if (typeof d.version !== 'string') {
    warnings.push('Missing "version", defaulting to "0.0.0"');
  }

  if (!Array.isArray(d.policies)) {
    return { pkg: null, warnings, error: '"policies" must be an array' };
  }

  for (let i = 0; i < d.policies.length; i++) {
    warnings.push(...validatePolicyRule(d.policies[i], i));
  }

  const pkg: PolicyPackage = {
    name: d.name as string,
    version: (d.version as string) ?? '0.0.0',
    author: (d.author as string) ?? 'Unknown',
    description: (d.description as string) ?? '',
    policies: d.policies as PolicyRule[],
    tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
    downloads: typeof d.downloads === 'number' ? d.downloads : 0,
    rating: typeof d.rating === 'number' ? d.rating : 0,
    categories: Array.isArray(d.categories) ? d.categories : ['general'],
    installCommand: (d.installCommand as string) ?? `npm install ${d.name}`,
    updatedAt: (d.updatedAt as string) ?? new Date().toISOString(),
  };

  return { pkg, warnings };
}

// ---------------------------------------------------------------------------
// Import functions
// ---------------------------------------------------------------------------

/**
 * Import a policy package from npm by fetching its package.json from the
 * npm registry.
 */
export async function importFromNpm(packageName: string): Promise<PolicyImportResult> {
  try {
    const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`;
    const response = await fetch(registryUrl);

    if (!response.ok) {
      return {
        success: false,
        source: 'npm',
        error: `npm registry returned ${response.status} for "${packageName}"`,
        warnings: [],
      };
    }

    const data = await response.json();

    // npm packages store RANA policies under a "rana" or "policies" key
    const policyData = (data as Record<string, unknown>).rana ?? data;
    const { pkg, warnings, error } = validatePolicyPackage(policyData);

    if (error || !pkg) {
      return { success: false, source: 'npm', error: error ?? 'Validation failed', warnings };
    }

    return { success: true, source: 'npm', package: pkg, warnings };
  } catch (err) {
    return {
      success: false,
      source: 'npm',
      error: `Failed to fetch from npm: ${err instanceof Error ? err.message : String(err)}`,
      warnings: [],
    };
  }
}

/**
 * Import a policy package from a URL pointing to a JSON or YAML policy file.
 */
export async function importFromUrl(url: string): Promise<PolicyImportResult> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        source: 'url',
        error: `URL returned ${response.status}: ${url}`,
        warnings: [],
      };
    }

    const text = await response.text();
    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        source: 'url',
        error: 'Response is not valid JSON. YAML import requires a YAML parser.',
        warnings: [],
      };
    }

    const { pkg, warnings, error } = validatePolicyPackage(data);

    if (error || !pkg) {
      return { success: false, source: 'url', error: error ?? 'Validation failed', warnings };
    }

    return { success: true, source: 'url', package: pkg, warnings };
  } catch (err) {
    return {
      success: false,
      source: 'url',
      error: `Failed to fetch from URL: ${err instanceof Error ? err.message : String(err)}`,
      warnings: [],
    };
  }
}

/**
 * Import a policy package from a local file path.
 *
 * Uses dynamic import for JSON files. In Node.js environments the caller
 * should ensure the path is absolute.
 */
export async function importFromFile(filePath: string): Promise<PolicyImportResult> {
  try {
    // Use Node.js fs via dynamic import — keeps the module free of hard deps
    const fs = await import('fs');
    const content = fs.readFileSync(filePath, 'utf-8');

    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch {
      return {
        success: false,
        source: 'file',
        error: `File is not valid JSON: ${filePath}`,
        warnings: [],
      };
    }

    const { pkg, warnings, error } = validatePolicyPackage(data);

    if (error || !pkg) {
      return { success: false, source: 'file', error: error ?? 'Validation failed', warnings };
    }

    return { success: true, source: 'file', package: pkg, warnings };
  } catch (err) {
    return {
      success: false,
      source: 'file',
      error: `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
      warnings: [],
    };
  }
}

/**
 * Import from any supported source.
 */
export async function importPolicy(source: PolicyImport): Promise<PolicyImportResult> {
  switch (source.source) {
    case 'npm':
      return importFromNpm(source.identifier);
    case 'url':
      return importFromUrl(source.identifier);
    case 'file':
      return importFromFile(source.identifier);
    case 'registry':
      return importFromUrl(source.identifier);
    default:
      return {
        success: false,
        source: source.source,
        error: `Unsupported import source: ${source.source}`,
        warnings: [],
      };
  }
}

/**
 * Merge an imported policy package into an existing set of rules.
 * Duplicate rule IDs from the imported package will overwrite existing ones.
 */
export function mergePolicies(
  existing: PolicyRule[],
  imported: PolicyRule[],
): { merged: PolicyRule[]; added: number; overwritten: number } {
  const ruleMap = new Map<string, PolicyRule>();
  let overwritten = 0;

  for (const rule of existing) {
    ruleMap.set(rule.id, rule);
  }

  for (const rule of imported) {
    if (ruleMap.has(rule.id)) {
      overwritten++;
    }
    ruleMap.set(rule.id, rule);
  }

  const merged = Array.from(ruleMap.values());
  const added = imported.length - overwritten;

  return { merged, added, overwritten };
}
