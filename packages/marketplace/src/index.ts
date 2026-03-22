/**
 * @waymakerai/aicofounder-marketplace — Community policy sharing infrastructure.
 *
 * Search, browse, import, and publish CoFounder policy packages.
 */

import { PolicyRegistry } from './registry';
import {
  importFromFile,
  importFromNpm,
  importFromUrl,
  importPolicy,
  mergePolicies,
} from './importer';
import { createPolicyPackage, prepareForPublish } from './publisher';
import type {
  PolicyCategory,
  PolicyImport,
  PolicyImportResult,
  PolicyPackage,
  PolicyRule,
  PublishConfig,
  PublishResult,
  RegistryConfig,
  SearchQuery,
  SearchResult,
} from './types';

// ---------------------------------------------------------------------------
// PolicyMarketplace — high-level facade
// ---------------------------------------------------------------------------

export class PolicyMarketplace {
  private readonly registry: PolicyRegistry;

  constructor(config: RegistryConfig = {}) {
    this.registry = new PolicyRegistry(config);
  }

  /**
   * Search available policy packages.
   */
  search(query: SearchQuery = {}): SearchResult {
    return this.registry.search(query);
  }

  /**
   * Browse packages by category.
   */
  browse(category: PolicyCategory): PolicyPackage[] {
    return this.registry.listByCategory(category);
  }

  /**
   * Get details for a specific package.
   */
  getPackage(name: string): PolicyPackage | undefined {
    return this.registry.getPackage(name);
  }

  /**
   * List all categories with counts.
   */
  getCategories(): Array<{ category: PolicyCategory; count: number }> {
    return this.registry.getCategories();
  }

  /**
   * Install (import) a policy from npm, URL, or file.
   */
  async install(source: PolicyImport): Promise<PolicyImportResult> {
    return importPolicy(source);
  }

  /**
   * Prepare a policy package for publishing to npm.
   */
  publish(policy: PolicyPackage, config: PublishConfig): PublishResult {
    return prepareForPublish(policy, config);
  }

  /**
   * Return the total number of packages in the built-in catalog.
   */
  get catalogSize(): number {
    return this.registry.size;
  }
}

// Re-exports
export { PolicyRegistry } from './registry';
export { BUILT_IN_CATALOG } from './catalog';
export {
  importFromFile,
  importFromNpm,
  importFromUrl,
  importPolicy,
  mergePolicies,
} from './importer';
export { createPolicyPackage, prepareForPublish } from './publisher';

// Type re-exports
export type {
  PolicyCategory,
  PolicyImport,
  PolicyImportResult,
  PolicyPackage,
  PolicyRule,
  PublishConfig,
  PublishResult,
  RegistryConfig,
  SearchQuery,
  SearchResult,
} from './types';
