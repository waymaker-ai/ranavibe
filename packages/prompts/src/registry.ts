/**
 * Prompt Registry - Storage and versioning for prompts
 */

import type {
  PromptDefinition,
  PromptVersion,
  PromptRegistryOptions,
} from './types';

/**
 * Prompt Registry for storing and versioning prompts
 */
export class PromptRegistry {
  private prompts: Map<string, PromptDefinition> = new Map();
  private versions: Map<string, PromptVersion[]> = new Map();
  private options: PromptRegistryOptions;

  constructor(options: PromptRegistryOptions = {}) {
    this.options = {
      storage: 'memory',
      ...options,
    };
  }

  /**
   * Register a new prompt
   */
  async register(
    id: string,
    config: {
      name?: string;
      template: string;
      variables?: string[];
      description?: string;
      tags?: string[];
      model?: string;
      provider?: string;
      maxTokens?: number;
      temperature?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<PromptDefinition> {
    const variables = config.variables || this.extractVariables(config.template);
    const now = new Date();

    const prompt: PromptDefinition = {
      id,
      name: config.name || id,
      template: config.template,
      variables,
      version: '1.0.0',
      description: config.description,
      tags: config.tags,
      model: config.model,
      provider: config.provider,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      metadata: config.metadata,
      createdAt: now,
      updatedAt: now,
    };

    this.prompts.set(id, prompt);

    // Initialize version history
    const version: PromptVersion = {
      version: '1.0.0',
      template: config.template,
      variables,
      createdAt: now,
      isActive: true,
    };
    this.versions.set(id, [version]);

    return prompt;
  }

  /**
   * Get a prompt by ID
   */
  async get(id: string, version?: string): Promise<PromptDefinition | null> {
    const prompt = this.prompts.get(id);
    if (!prompt) return null;

    if (version) {
      const versions = this.versions.get(id) || [];
      const targetVersion = versions.find(v => v.version === version);
      if (targetVersion) {
        return {
          ...prompt,
          template: targetVersion.template,
          variables: targetVersion.variables,
          version: targetVersion.version,
        };
      }
    }

    return prompt;
  }

  /**
   * Update a prompt (creates new version)
   */
  async update(
    id: string,
    updates: {
      template?: string;
      variables?: string[];
      description?: string;
      tags?: string[];
      model?: string;
      provider?: string;
      changelog?: string;
    }
  ): Promise<PromptDefinition | null> {
    const prompt = this.prompts.get(id);
    if (!prompt) return null;

    const newVersion = this.incrementVersion(prompt.version);
    const now = new Date();

    // Update prompt
    const updated: PromptDefinition = {
      ...prompt,
      ...updates,
      version: newVersion,
      updatedAt: now,
    };

    if (updates.template) {
      updated.variables = updates.variables || this.extractVariables(updates.template);
    }

    this.prompts.set(id, updated);

    // Add version
    const versions = this.versions.get(id) || [];
    versions.forEach(v => (v.isActive = false)); // Deactivate old versions

    const version: PromptVersion = {
      version: newVersion,
      template: updated.template,
      variables: updated.variables,
      changelog: updates.changelog,
      createdAt: now,
      isActive: true,
    };
    versions.push(version);
    this.versions.set(id, versions);

    return updated;
  }

  /**
   * List all prompts
   */
  async list(filters?: {
    tags?: string[];
    search?: string;
  }): Promise<PromptDefinition[]> {
    let prompts = Array.from(this.prompts.values());

    if (filters?.tags?.length) {
      prompts = prompts.filter(p =>
        filters.tags!.some(tag => p.tags?.includes(tag))
      );
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      prompts = prompts.filter(
        p =>
          p.name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.template.toLowerCase().includes(search)
      );
    }

    return prompts;
  }

  /**
   * Get version history for a prompt
   */
  async getVersions(id: string): Promise<PromptVersion[]> {
    return this.versions.get(id) || [];
  }

  /**
   * Rollback to a previous version
   */
  async rollback(id: string, version: string): Promise<PromptDefinition | null> {
    const versions = this.versions.get(id) || [];
    const targetVersion = versions.find(v => v.version === version);
    if (!targetVersion) return null;

    return this.update(id, {
      template: targetVersion.template,
      variables: targetVersion.variables,
      changelog: `Rolled back to version ${version}`,
    });
  }

  /**
   * Delete a prompt
   */
  async delete(id: string): Promise<boolean> {
    const existed = this.prompts.has(id);
    this.prompts.delete(id);
    this.versions.delete(id);
    return existed;
  }

  /**
   * Render a prompt template with variables
   */
  render(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (key in variables) {
        return variables[key];
      }
      throw new Error(`Missing variable: ${key}`);
    });
  }

  /**
   * Extract variables from template
   */
  private extractVariables(template: string): string[] {
    const matches = template.matchAll(/\{\{(\w+)\}\}/g);
    const variables = new Set<string>();
    for (const match of matches) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  }

  /**
   * Increment version number
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }

  /**
   * Export all prompts
   */
  async export(): Promise<{
    prompts: PromptDefinition[];
    versions: Record<string, PromptVersion[]>;
  }> {
    return {
      prompts: Array.from(this.prompts.values()),
      versions: Object.fromEntries(this.versions.entries()),
    };
  }

  /**
   * Import prompts
   */
  async import(data: {
    prompts: PromptDefinition[];
    versions?: Record<string, PromptVersion[]>;
  }): Promise<void> {
    for (const prompt of data.prompts) {
      this.prompts.set(prompt.id, prompt);
      if (data.versions?.[prompt.id]) {
        this.versions.set(prompt.id, data.versions[prompt.id]);
      }
    }
  }
}
