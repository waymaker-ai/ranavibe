/**
 * PolicyRegistry — search and browse the built-in catalog of community policies.
 */

import { BUILT_IN_CATALOG } from './catalog';
import type {
  PolicyCategory,
  PolicyPackage,
  RegistryConfig,
  SearchQuery,
  SearchResult,
} from './types';

export class PolicyRegistry {
  private readonly config: RegistryConfig;
  private readonly catalog: PolicyPackage[];

  constructor(config: RegistryConfig = {}) {
    this.config = config;
    this.catalog = [...BUILT_IN_CATALOG];
  }

  /**
   * Search available policy packages by query, category, or tags.
   */
  search(query: SearchQuery = {}): SearchResult {
    let results = [...this.catalog];

    // Free-text search across name, description, and tags
    if (query.query) {
      const q = query.query.toLowerCase();
      results = results.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(q) ||
          pkg.description.toLowerCase().includes(q) ||
          pkg.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Category filter
    if (query.category) {
      results = results.filter((pkg) =>
        pkg.categories.includes(query.category as PolicyCategory),
      );
    }

    // Tags filter (all specified tags must be present)
    if (query.tags && query.tags.length > 0) {
      const lowerTags = query.tags.map((t) => t.toLowerCase());
      results = results.filter((pkg) =>
        lowerTags.every((tag) => pkg.tags.some((t) => t.toLowerCase() === tag)),
      );
    }

    // Sort
    const sortBy = query.sortBy ?? 'downloads';
    const sortOrder = query.sortOrder ?? 'desc';
    results.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'downloads':
          cmp = a.downloads - b.downloads;
          break;
        case 'rating':
          cmp = a.rating - b.rating;
          break;
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'updatedAt':
          cmp = a.updatedAt.localeCompare(b.updatedAt);
          break;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    // Pagination
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 20));
    const total = results.length;
    const start = (page - 1) * pageSize;
    const paged = results.slice(start, start + pageSize);

    return { packages: paged, total, page, pageSize };
  }

  /**
   * List packages belonging to a specific category.
   */
  listByCategory(category: PolicyCategory): PolicyPackage[] {
    return this.catalog.filter((pkg) => pkg.categories.includes(category));
  }

  /**
   * Get full details for a package by name.
   */
  getPackage(name: string): PolicyPackage | undefined {
    return this.catalog.find((pkg) => pkg.name === name);
  }

  /**
   * Return all available categories with package counts.
   */
  getCategories(): Array<{ category: PolicyCategory; count: number }> {
    const counts = new Map<PolicyCategory, number>();
    for (const pkg of this.catalog) {
      for (const cat of pkg.categories) {
        counts.set(cat, (counts.get(cat) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Return the total number of packages in the catalog.
   */
  get size(): number {
    return this.catalog.length;
  }
}
