/**
 * Skills namespace for the marketplace.
 *
 * Mirrors the policy marketplace API but for community-contributed skills
 * (third-party packages with `keywords: ["cofounder-skill"]`).
 *
 * Skills are markdown files with YAML frontmatter — see
 * @waymakerai/aicofounder-skills for the full schema. This module exposes
 * search / install / publish without taking a dependency on the runtime
 * (so installs work in environments that don't have node fs).
 */

export interface SkillPackageMeta {
  /** npm package id, e.g. "@yourorg/cofounder-skill-name". */
  identifier: string;
  /** Display name. */
  name: string;
  /** Short description shown in catalog. */
  description: string;
  /** Author name or org. */
  author: string;
  /** SPDX license id. MIT/Apache-2.0 preferred. */
  license: string;
  /** Optional homepage / repo URL. */
  homepage?: string;
  /** Skill IDs the package contributes. */
  skillIds: string[];
  /** Categories the skills belong to. */
  categories: string[];
  /** Whether the package ships fixtures. */
  hasFixtures: boolean;
  /** Whether the package has been verified by the CoFounder team. */
  verified: boolean;
  /** Last updated ISO timestamp. */
  updatedAt: string;
}

export interface SkillSearchQuery {
  query?: string;
  category?: string;
  verifiedOnly?: boolean;
  hasFixtures?: boolean;
}

export interface SkillSearchResult {
  total: number;
  results: SkillPackageMeta[];
}

export interface SkillInstallRequest {
  /** "npm" — fetch from npm registry. "git" — clone a git URL. "local" — file path. */
  source: 'npm' | 'git' | 'local';
  /** npm package id, git URL, or local path. */
  identifier: string;
}

export interface SkillInstallResult {
  ok: boolean;
  installed?: SkillPackageMeta;
  error?: string;
}

export interface SkillPublishRequest {
  /** Local path to the package root that contains a `package.json`. */
  packagePath: string;
  /** npm scope or organization name. */
  scope: string;
  /** Skill IDs the package will export. */
  skillIds: string[];
}

export interface SkillPublishResult {
  ok: boolean;
  identifier?: string;
  error?: string;
}

/**
 * Marketplace client for community skills.
 *
 * In the current version, install and publish operations return a
 * structured intent — the actual fetch/build steps are handled by the
 * caller's package manager. This keeps the marketplace package zero-dep
 * and runnable in any environment.
 */
export class SkillMarketplace {
  private catalog: SkillPackageMeta[];

  constructor(catalog: SkillPackageMeta[] = []) {
    this.catalog = catalog;
  }

  search(q: SkillSearchQuery): SkillSearchResult {
    let pool = this.catalog.slice();
    if (q.query) {
      const needle = q.query.toLowerCase();
      pool = pool.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle) ||
          p.identifier.toLowerCase().includes(needle),
      );
    }
    if (q.category) {
      pool = pool.filter((p) => p.categories.includes(q.category!));
    }
    if (q.verifiedOnly) {
      pool = pool.filter((p) => p.verified);
    }
    if (q.hasFixtures != null) {
      pool = pool.filter((p) => p.hasFixtures === q.hasFixtures);
    }
    return { total: pool.length, results: pool };
  }

  browse(category: string): SkillPackageMeta[] {
    return this.catalog.filter((p) => p.categories.includes(category));
  }

  getPackage(identifier: string): SkillPackageMeta | undefined {
    return this.catalog.find((p) => p.identifier === identifier);
  }

  /**
   * Returns the install intent. The caller should run the suggested
   * command — we deliberately don't shell out from this package.
   */
  install(req: SkillInstallRequest): SkillInstallResult {
    const existing = this.catalog.find((p) => p.identifier === req.identifier);
    if (req.source === 'npm') {
      return {
        ok: true,
        installed: existing,
      };
    }
    if (req.source === 'git' || req.source === 'local') {
      return {
        ok: true,
        installed: existing,
      };
    }
    return { ok: false, error: `Unknown install source: ${(req as { source: string }).source}` };
  }

  /**
   * Returns publish intent (npm package preparation steps). The caller
   * runs `npm publish` — same reason as install.
   */
  publish(req: SkillPublishRequest): SkillPublishResult {
    if (!req.scope.startsWith('@')) {
      return { ok: false, error: 'Scope must start with @' };
    }
    if (req.skillIds.length === 0) {
      return { ok: false, error: 'At least one skill ID is required' };
    }
    return {
      ok: true,
      identifier: `${req.scope}/${req.skillIds[0]}`,
    };
  }

  /**
   * Recommended npm install command for the install intent.
   */
  static installCommand(req: SkillInstallRequest): string {
    if (req.source === 'npm') return `npm install ${req.identifier}`;
    if (req.source === 'git') return `npm install ${req.identifier}`;
    if (req.source === 'local') return `npm install ${req.identifier}`;
    return '';
  }
}

/**
 * Tiny seed catalog. Real catalog entries land via PR or via a registry
 * service when one exists.
 */
export const SKILL_CATALOG_SEED: SkillPackageMeta[] = [
  {
    identifier: '@waymakerai/aicofounder-skills',
    name: 'CoFounder Skill Library',
    description:
      'Bundled skill library — feature flow, codebase intelligence, documentation, VCS, testing, compliance, cost routing, sandbox preview, second opinion.',
    author: 'Waymaker AI',
    license: 'MIT',
    homepage: 'https://cofounder.cx/docs/skills',
    skillIds: [
      'cofounder-feature-new',
      'cofounder-feature-implement',
      'cofounder-check',
      'cofounder-spec-review',
      'cofounder-pattern-scout',
      'cofounder-diagram',
      'cofounder-readme',
      'cofounder-pr-summary',
      'cofounder-commit',
      'cofounder-test-plan',
      'cofounder-vibespec-author',
      'cofounder-compliance-frame',
      'cofounder-cost-route',
      'cofounder-context-fit',
      'cofounder-sandbox-preview',
      'cofounder-second-opinion',
    ],
    categories: ['feature-flow', 'codebase-intel', 'documentation', 'vcs', 'testing', 'native'],
    hasFixtures: true,
    verified: true,
    updatedAt: '2026-05-09T00:00:00.000Z',
  },
];
