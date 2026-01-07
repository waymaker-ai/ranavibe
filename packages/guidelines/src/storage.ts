/**
 * @rana/guidelines - Storage implementations
 */

import type { Guideline, GuidelineStorage } from './types';

/**
 * In-memory storage (default)
 */
export class MemoryStorage implements GuidelineStorage {
  private store: Map<string, Guideline> = new Map();

  async save(guideline: Guideline): Promise<void> {
    this.store.set(guideline.id, guideline);
  }

  async get(id: string): Promise<Guideline | null> {
    return this.store.get(id) ?? null;
  }

  async getAll(): Promise<Guideline[]> {
    return Array.from(this.store.values());
  }

  async update(id: string, updates: Partial<Guideline>): Promise<void> {
    const guideline = this.store.get(id);
    if (!guideline) {
      throw new Error(`Guideline ${id} not found`);
    }

    this.store.set(id, { ...guideline, ...updates, updatedAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async query(filter: Partial<Guideline>): Promise<Guideline[]> {
    const all = Array.from(this.store.values());

    return all.filter(guideline => {
      return Object.entries(filter).every(([key, value]) => {
        const guidelineValue = guideline[key as keyof Guideline];
        return guidelineValue === value;
      });
    });
  }

  /**
   * Clear all guidelines
   */
  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Get count
   */
  async count(): Promise<number> {
    return this.store.size;
  }
}

/**
 * File-based storage (JSON)
 */
export class FileStorage implements GuidelineStorage {
  private filePath: string;
  private cache: Map<string, Guideline> = new Map();
  private loaded = false;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private async load(): Promise<void> {
    if (this.loaded) return;

    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(this.filePath, 'utf-8');
      const guidelines: Guideline[] = JSON.parse(data);

      for (const guideline of guidelines) {
        this.cache.set(guideline.id, guideline);
      }

      this.loaded = true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, create empty
        this.loaded = true;
        await this.persist();
      } else {
        throw error;
      }
    }
  }

  private async persist(): Promise<void> {
    const fs = await import('fs/promises');
    const guidelines = Array.from(this.cache.values());
    await fs.writeFile(this.filePath, JSON.stringify(guidelines, null, 2), 'utf-8');
  }

  async save(guideline: Guideline): Promise<void> {
    await this.load();
    this.cache.set(guideline.id, guideline);
    await this.persist();
  }

  async get(id: string): Promise<Guideline | null> {
    await this.load();
    return this.cache.get(id) ?? null;
  }

  async getAll(): Promise<Guideline[]> {
    await this.load();
    return Array.from(this.cache.values());
  }

  async update(id: string, updates: Partial<Guideline>): Promise<void> {
    await this.load();
    const guideline = this.cache.get(id);
    if (!guideline) {
      throw new Error(`Guideline ${id} not found`);
    }

    this.cache.set(id, { ...guideline, ...updates, updatedAt: new Date() });
    await this.persist();
  }

  async delete(id: string): Promise<void> {
    await this.load();
    this.cache.delete(id);
    await this.persist();
  }

  async query(filter: Partial<Guideline>): Promise<Guideline[]> {
    const all = await this.getAll();

    return all.filter(guideline => {
      return Object.entries(filter).every(([key, value]) => {
        const guidelineValue = guideline[key as keyof Guideline];
        return guidelineValue === value;
      });
    });
  }
}

/**
 * Create storage instance
 */
export function createStorage(type: 'memory' | 'file', options?: { filePath?: string }): GuidelineStorage {
  switch (type) {
    case 'memory':
      return new MemoryStorage();
    case 'file':
      if (!options?.filePath) {
        throw new Error('File storage requires filePath option');
      }
      return new FileStorage(options.filePath);
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
}
