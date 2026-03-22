/**
 * @aicofounder/marketplace - Type definitions for policy marketplace
 */

// ---------------------------------------------------------------------------
// Policy package
// ---------------------------------------------------------------------------

export type PolicyCategory =
  | 'healthcare'
  | 'finance'
  | 'education'
  | 'safety'
  | 'enterprise'
  | 'legal'
  | 'government'
  | 'insurance'
  | 'real-estate'
  | 'hr'
  | 'marketing'
  | 'content-moderation'
  | 'customer-support'
  | 'code-generation'
  | 'data-analytics'
  | 'research'
  | 'general';

export interface PolicyRule {
  /** Rule identifier */
  id: string;
  /** Human-readable description */
  description: string;
  /** Category this rule belongs to */
  category: string;
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Action to take */
  action: 'block' | 'redact' | 'flag' | 'log' | 'allow';
}

export interface PolicyPackage {
  /** Package name (e.g., "@aicofounder-policies/healthcare-us") */
  name: string;
  /** Semantic version */
  version: string;
  /** Author or organisation */
  author: string;
  /** Short description */
  description: string;
  /** Policy rules included in this package */
  policies: PolicyRule[];
  /** Searchable tags */
  tags: string[];
  /** Approximate download count */
  downloads: number;
  /** Average rating (0-5) */
  rating: number;
  /** Categories this package belongs to */
  categories: PolicyCategory[];
  /** npm install command */
  installCommand: string;
  /** URL to documentation */
  docsUrl?: string;
  /** Date last updated (ISO 8601) */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface RegistryConfig {
  /** Base URL for the policy registry API (if using remote) */
  registryUrl?: string;
  /** API key for authenticated access */
  apiKey?: string;
  /** Cache TTL in seconds */
  cacheTtlSeconds?: number;
}

export interface SearchQuery {
  /** Free-text search term */
  query?: string;
  /** Filter by category */
  category?: PolicyCategory;
  /** Filter by tags */
  tags?: string[];
  /** Sort field */
  sortBy?: 'downloads' | 'rating' | 'name' | 'updatedAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Page number (1-based) */
  page?: number;
  /** Results per page */
  pageSize?: number;
}

export interface SearchResult {
  /** Matching packages */
  packages: PolicyPackage[];
  /** Total number of matches */
  total: number;
  /** Current page */
  page: number;
  /** Results per page */
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export type ImportSource = 'npm' | 'url' | 'file' | 'registry';

export interface PolicyImport {
  /** Where to import from */
  source: ImportSource;
  /** Package name, URL, or file path */
  identifier: string;
}

export interface PolicyImportResult {
  /** Whether the import succeeded */
  success: boolean;
  /** Source of the import */
  source: ImportSource;
  /** Imported package (if successful) */
  package?: PolicyPackage;
  /** Error message (if failed) */
  error?: string;
  /** Validation warnings */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Publisher
// ---------------------------------------------------------------------------

export interface PublishConfig {
  /** npm scope (e.g., "@aicofounder-policies") */
  scope?: string;
  /** Author name */
  author: string;
  /** License */
  license?: string;
  /** Repository URL */
  repository?: string;
  /** Keywords for npm */
  keywords?: string[];
}

export interface PublishResult {
  /** Package name */
  packageName: string;
  /** Generated package.json content */
  packageJson: Record<string, unknown>;
  /** Generated README content */
  readme: string;
  /** Policy file content (JSON) */
  policyFile: string;
  /** Validation passed */
  valid: boolean;
  /** Validation errors */
  errors: string[];
}
