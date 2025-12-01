/**
 * Collaboration Module
 * Prompt versioning, shared libraries, and review workflows
 *
 * @example
 * ```typescript
 * import { createPromptLibrary, PromptVersion } from '@rana/core';
 *
 * const library = createPromptLibrary({
 *   storage: 'file',
 *   path: './.rana/prompts',
 * });
 *
 * // Create and version prompts
 * const prompt = await library.create({
 *   name: 'customer-support',
 *   content: 'You are a helpful customer support agent...',
 *   tags: ['support', 'production'],
 * });
 *
 * // Update with new version
 * await library.update(prompt.id, {
 *   content: 'Updated prompt content...',
 *   message: 'Improved tone for enterprise clients',
 * });
 *
 * // View history
 * const history = await library.history(prompt.id);
 *
 * // Rollback
 * await library.rollback(prompt.id, history[1].version);
 *
 * // Share with team
 * await library.share(prompt.id, { team: 'engineering' });
 * ```
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type PromptStatus = 'draft' | 'review' | 'approved' | 'published' | 'deprecated';

export interface PromptMetadata {
  name: string;
  description?: string;
  tags: string[];
  category?: string;
  author?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  variables?: Record<string, { type: string; description?: string; required?: boolean }>;
}

export interface PromptVersion {
  version: number;
  hash: string;
  content: string;
  metadata: PromptMetadata;
  message?: string;
  author: string;
  createdAt: Date;
  status: PromptStatus;
  metrics?: {
    uses: number;
    avgLatency: number;
    avgCost: number;
    successRate: number;
  };
}

export interface Prompt {
  id: string;
  currentVersion: number;
  versions: PromptVersion[];
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  sharedWith: string[];
  locked: boolean;
  lockedBy?: string;
}

export interface ReviewRequest {
  id: string;
  promptId: string;
  version: number;
  requesterId: string;
  reviewers: string[];
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments: ReviewComment[];
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ReviewComment {
  id: string;
  author: string;
  content: string;
  lineStart?: number;
  lineEnd?: number;
  resolved: boolean;
  createdAt: Date;
}

export interface PromptDiff {
  additions: number;
  deletions: number;
  changes: Array<{
    type: 'add' | 'remove' | 'modify';
    lineNumber: number;
    oldContent?: string;
    newContent?: string;
  }>;
}

export interface LibraryConfig {
  storage: 'memory' | 'file' | 'database';
  path?: string;
  dbUrl?: string;
  defaultAuthor?: string;
  requireReview?: boolean;
  reviewers?: string[];
  hooks?: {
    onBeforeSave?: (prompt: Prompt) => Promise<boolean>;
    onAfterSave?: (prompt: Prompt) => Promise<void>;
    onPublish?: (prompt: Prompt, version: PromptVersion) => Promise<void>;
  };
}

// ============================================================================
// Prompt Library Implementation
// ============================================================================

export class PromptLibrary extends EventEmitter {
  private config: LibraryConfig;
  private prompts: Map<string, Prompt> = new Map();
  private reviews: Map<string, ReviewRequest> = new Map();

  constructor(config: LibraryConfig) {
    super();
    this.config = config;
  }

  /**
   * Create a new prompt
   */
  async create(
    metadata: PromptMetadata & { content: string },
    message?: string
  ): Promise<Prompt> {
    const id = `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const version: PromptVersion = {
      version: 1,
      hash: this.hashContent(metadata.content),
      content: metadata.content,
      metadata: {
        name: metadata.name,
        description: metadata.description,
        tags: metadata.tags || [],
        category: metadata.category,
        author: metadata.author || this.config.defaultAuthor,
        model: metadata.model,
        temperature: metadata.temperature,
        maxTokens: metadata.maxTokens,
        variables: metadata.variables,
      },
      message,
      author: metadata.author || this.config.defaultAuthor || 'system',
      createdAt: new Date(),
      status: 'draft',
    };

    const prompt: Prompt = {
      id,
      currentVersion: 1,
      versions: [version],
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: version.author,
      sharedWith: [],
      locked: false,
    };

    if (this.config.hooks?.onBeforeSave) {
      const proceed = await this.config.hooks.onBeforeSave(prompt);
      if (!proceed) throw new Error('Save prevented by hook');
    }

    this.prompts.set(id, prompt);
    this.emit('created', prompt);

    if (this.config.hooks?.onAfterSave) {
      await this.config.hooks.onAfterSave(prompt);
    }

    return prompt;
  }

  /**
   * Update a prompt (creates new version)
   */
  async update(
    promptId: string,
    update: {
      content?: string;
      metadata?: Partial<PromptMetadata>;
      message?: string;
      author?: string;
    }
  ): Promise<PromptVersion> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);
    if (prompt.locked) throw new Error(`Prompt ${promptId} is locked by ${prompt.lockedBy}`);

    const currentVersion = prompt.versions[prompt.currentVersion - 1];
    const newContent = update.content ?? currentVersion.content;
    const newHash = this.hashContent(newContent);

    // Check if content actually changed
    if (newHash === currentVersion.hash && !update.metadata) {
      return currentVersion;
    }

    const newVersion: PromptVersion = {
      version: prompt.currentVersion + 1,
      hash: newHash,
      content: newContent,
      metadata: {
        ...currentVersion.metadata,
        ...update.metadata,
      },
      message: update.message,
      author: update.author || this.config.defaultAuthor || 'system',
      createdAt: new Date(),
      status: this.config.requireReview ? 'review' : 'draft',
    };

    prompt.versions.push(newVersion);
    prompt.currentVersion = newVersion.version;
    prompt.updatedAt = new Date();

    this.emit('updated', prompt, newVersion);

    // Auto-create review if required
    if (this.config.requireReview && this.config.reviewers?.length) {
      await this.requestReview(promptId, newVersion.version, this.config.reviewers);
    }

    return newVersion;
  }

  /**
   * Get a prompt by ID
   */
  get(promptId: string): Prompt | undefined {
    return this.prompts.get(promptId);
  }

  /**
   * Get prompt at specific version
   */
  getVersion(promptId: string, version: number): PromptVersion | undefined {
    const prompt = this.prompts.get(promptId);
    return prompt?.versions[version - 1];
  }

  /**
   * Get version history
   */
  history(promptId: string): PromptVersion[] {
    const prompt = this.prompts.get(promptId);
    return prompt ? [...prompt.versions].reverse() : [];
  }

  /**
   * Rollback to a previous version
   */
  async rollback(
    promptId: string,
    targetVersion: number,
    message?: string
  ): Promise<PromptVersion> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    const target = prompt.versions[targetVersion - 1];
    if (!target) throw new Error(`Version ${targetVersion} not found`);

    return this.update(promptId, {
      content: target.content,
      metadata: target.metadata,
      message: message || `Rollback to version ${targetVersion}`,
    });
  }

  /**
   * Compare two versions
   */
  diff(promptId: string, fromVersion: number, toVersion: number): PromptDiff {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    const from = prompt.versions[fromVersion - 1];
    const to = prompt.versions[toVersion - 1];
    if (!from || !to) throw new Error('Version not found');

    const fromLines = from.content.split('\n');
    const toLines = to.content.split('\n');

    const changes: PromptDiff['changes'] = [];
    let additions = 0;
    let deletions = 0;

    // Simple line-by-line diff
    const maxLines = Math.max(fromLines.length, toLines.length);
    for (let i = 0; i < maxLines; i++) {
      const oldLine = fromLines[i];
      const newLine = toLines[i];

      if (oldLine === undefined && newLine !== undefined) {
        changes.push({ type: 'add', lineNumber: i + 1, newContent: newLine });
        additions++;
      } else if (oldLine !== undefined && newLine === undefined) {
        changes.push({ type: 'remove', lineNumber: i + 1, oldContent: oldLine });
        deletions++;
      } else if (oldLine !== newLine) {
        changes.push({ type: 'modify', lineNumber: i + 1, oldContent: oldLine, newContent: newLine });
        additions++;
        deletions++;
      }
    }

    return { additions, deletions, changes };
  }

  /**
   * Share prompt with team/users
   */
  async share(
    promptId: string,
    options: { users?: string[]; team?: string }
  ): Promise<void> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    if (options.users) {
      prompt.sharedWith.push(...options.users);
    }
    if (options.team) {
      prompt.sharedWith.push(`team:${options.team}`);
    }

    // Dedupe
    prompt.sharedWith = [...new Set(prompt.sharedWith)];
    this.emit('shared', prompt, options);
  }

  /**
   * Lock prompt for editing
   */
  async lock(promptId: string, userId: string): Promise<boolean> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) return false;
    if (prompt.locked) return false;

    prompt.locked = true;
    prompt.lockedBy = userId;
    this.emit('locked', prompt, userId);
    return true;
  }

  /**
   * Unlock prompt
   */
  async unlock(promptId: string, userId: string): Promise<boolean> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) return false;
    if (!prompt.locked) return true;
    if (prompt.lockedBy !== userId) return false;

    prompt.locked = false;
    prompt.lockedBy = undefined;
    this.emit('unlocked', prompt, userId);
    return true;
  }

  /**
   * Request review for a version
   */
  async requestReview(
    promptId: string,
    version: number,
    reviewers: string[]
  ): Promise<ReviewRequest> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    const review: ReviewRequest = {
      id: `review-${Date.now()}`,
      promptId,
      version,
      requesterId: prompt.ownerId,
      reviewers,
      status: 'pending',
      comments: [],
      createdAt: new Date(),
    };

    this.reviews.set(review.id, review);
    this.emit('review-requested', review);

    return review;
  }

  /**
   * Add review comment
   */
  async addComment(
    reviewId: string,
    comment: Omit<ReviewComment, 'id' | 'createdAt' | 'resolved'>
  ): Promise<ReviewComment> {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    const newComment: ReviewComment = {
      ...comment,
      id: `comment-${Date.now()}`,
      createdAt: new Date(),
      resolved: false,
    };

    review.comments.push(newComment);
    this.emit('comment-added', review, newComment);

    return newComment;
  }

  /**
   * Approve a review
   */
  async approveReview(reviewId: string, approverId: string): Promise<void> {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);
    if (!review.reviewers.includes(approverId)) {
      throw new Error('Not authorized to approve this review');
    }

    review.status = 'approved';
    review.resolvedAt = new Date();

    // Update prompt version status
    const prompt = this.prompts.get(review.promptId);
    if (prompt) {
      const version = prompt.versions[review.version - 1];
      if (version) {
        version.status = 'approved';
      }
    }

    this.emit('review-approved', review);
  }

  /**
   * Publish a version
   */
  async publish(promptId: string, version?: number): Promise<PromptVersion> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    const targetVersion = version ?? prompt.currentVersion;
    const versionData = prompt.versions[targetVersion - 1];
    if (!versionData) throw new Error(`Version ${targetVersion} not found`);

    if (this.config.requireReview && versionData.status !== 'approved') {
      throw new Error('Version must be approved before publishing');
    }

    // Deprecate previous published versions
    for (const v of prompt.versions) {
      if (v.status === 'published') {
        v.status = 'deprecated';
      }
    }

    versionData.status = 'published';
    this.emit('published', prompt, versionData);

    if (this.config.hooks?.onPublish) {
      await this.config.hooks.onPublish(prompt, versionData);
    }

    return versionData;
  }

  /**
   * Search prompts
   */
  search(query: {
    name?: string;
    tags?: string[];
    category?: string;
    status?: PromptStatus;
    author?: string;
  }): Prompt[] {
    return Array.from(this.prompts.values()).filter(prompt => {
      const current = prompt.versions[prompt.currentVersion - 1];
      if (!current) return false;

      if (query.name && !current.metadata.name.toLowerCase().includes(query.name.toLowerCase())) {
        return false;
      }
      if (query.tags?.length && !query.tags.some(t => current.metadata.tags.includes(t))) {
        return false;
      }
      if (query.category && current.metadata.category !== query.category) {
        return false;
      }
      if (query.status && current.status !== query.status) {
        return false;
      }
      if (query.author && current.author !== query.author) {
        return false;
      }

      return true;
    });
  }

  /**
   * List all prompts
   */
  list(): Prompt[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Export prompts
   */
  export(promptIds?: string[]): Record<string, any> {
    const prompts = promptIds
      ? promptIds.map(id => this.prompts.get(id)).filter(Boolean)
      : Array.from(this.prompts.values());

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: prompts.map(p => ({
        id: p!.id,
        versions: p!.versions,
        currentVersion: p!.currentVersion,
      })),
    };
  }

  /**
   * Import prompts
   */
  async import(data: Record<string, any>): Promise<number> {
    let imported = 0;

    for (const promptData of data.prompts || []) {
      const prompt: Prompt = {
        id: promptData.id || `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        currentVersion: promptData.currentVersion,
        versions: promptData.versions.map((v: any) => ({
          ...v,
          createdAt: new Date(v.createdAt),
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: this.config.defaultAuthor || 'system',
        sharedWith: [],
        locked: false,
      };

      this.prompts.set(prompt.id, prompt);
      imported++;
    }

    this.emit('imported', imported);
    return imported;
  }

  /**
   * Render prompt with variables
   */
  render(promptId: string, variables: Record<string, any>, version?: number): string {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    const targetVersion = version ?? prompt.currentVersion;
    const versionData = prompt.versions[targetVersion - 1];
    if (!versionData) throw new Error(`Version ${targetVersion} not found`);

    let content = versionData.content;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      content = content.replace(pattern, String(value));
    }

    return content;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 16);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a prompt library
 */
export function createPromptLibrary(config: LibraryConfig): PromptLibrary {
  return new PromptLibrary(config);
}

let globalLibrary: PromptLibrary | null = null;

/**
 * Get the global prompt library
 */
export function getGlobalPromptLibrary(): PromptLibrary {
  if (!globalLibrary) {
    globalLibrary = createPromptLibrary({ storage: 'memory' });
  }
  return globalLibrary;
}

/**
 * Set the global prompt library
 */
export function setGlobalPromptLibrary(library: PromptLibrary): void {
  globalLibrary = library;
}
