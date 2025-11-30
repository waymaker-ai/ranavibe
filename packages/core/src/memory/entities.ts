/**
 * Entity Extraction Module
 * Extracts and tracks named entities from text with relationship graphs
 */

/**
 * LocalStorage-like interface for type safety
 */
interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Helper to safely access localStorage in both browser and Node environments
 */
const getLocalStorage = (): StorageInterface | null => {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return (globalThis as any).localStorage;
    }
  } catch {
    // Ignore errors
  }
  return null;
};

/**
 * Supported entity types
 */
export type EntityType =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'LOCATION'
  | 'DATE'
  | 'TIME'
  | 'PRODUCT'
  | 'EVENT'
  | 'CONCEPT'
  | 'CUSTOM';

/**
 * Entity confidence score (0-1)
 */
export type ConfidenceScore = number;

/**
 * Individual entity instance
 */
export interface Entity {
  /** Unique entity identifier */
  id: string;
  /** Entity type classification */
  type: EntityType;
  /** Canonical entity name/value */
  value: string;
  /** Alternative names/aliases for this entity */
  aliases: string[];
  /** Custom entity type (when type is 'CUSTOM') */
  customType?: string;
  /** Confidence score for entity extraction (0-1) */
  confidence: ConfidenceScore;
  /** Number of times this entity appeared */
  occurrences: number;
  /** When entity was first seen */
  firstSeen: Date;
  /** When entity was last seen */
  lastSeen: Date;
  /** Metadata associated with entity */
  metadata: Record<string, any>;
  /** Context snippets where entity appeared */
  contexts: EntityContext[];
}

/**
 * Context where an entity appeared
 */
export interface EntityContext {
  /** Text snippet containing the entity */
  text: string;
  /** Position in original text */
  position: number;
  /** Timestamp when this context was captured */
  timestamp: Date;
  /** Source identifier (e.g., message ID) */
  sourceId?: string;
}

/**
 * Relationship between two entities
 */
export interface EntityRelationship {
  /** ID of first entity */
  entityId1: string;
  /** ID of second entity */
  entityId2: string;
  /** Type of relationship (optional) */
  relationType?: string;
  /** Number of times entities co-occurred */
  coOccurrences: number;
  /** Strength of relationship (0-1) */
  strength: number;
  /** When relationship was first observed */
  firstSeen: Date;
  /** When relationship was last observed */
  lastSeen: Date;
  /** Context where relationship appeared */
  contexts: string[];
}

/**
 * Entity graph containing entities and their relationships
 */
export interface EntityGraph {
  /** All entities indexed by ID */
  entities: Map<string, Entity>;
  /** Relationships between entities */
  relationships: Map<string, EntityRelationship>;
  /** Index for quick lookup by value */
  valueIndex: Map<string, string[]>; // value -> entity IDs
  /** Index for quick lookup by type */
  typeIndex: Map<EntityType, string[]>; // type -> entity IDs
}

/**
 * Entity extraction result
 */
export interface ExtractionResult {
  /** Extracted entities */
  entities: Entity[];
  /** Detected relationships */
  relationships: EntityRelationship[];
  /** Original text analyzed */
  text: string;
  /** Extraction timestamp */
  timestamp: Date;
}

/**
 * Timeline event for entity history
 */
export interface EntityTimelineEvent {
  /** Event timestamp */
  timestamp: Date;
  /** Entity ID */
  entityId: string;
  /** Entity value at this time */
  value: string;
  /** Entity type */
  type: EntityType;
  /** Event type (created, updated, mentioned) */
  eventType: 'created' | 'updated' | 'mentioned' | 'merged';
  /** Context for this event */
  context?: string;
  /** Metadata for this event */
  metadata?: Record<string, any>;
}

/**
 * Entity extraction configuration
 */
export interface EntityExtractorConfig {
  /** Whether to enable persistence */
  enablePersistence?: boolean;
  /** Storage key for persistence */
  storageKey?: string;
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Maximum context snippets per entity */
  maxContexts?: number;
  /** Co-occurrence window size (words) */
  coOccurrenceWindow?: number;
  /** Custom entity patterns */
  customPatterns?: Array<{
    type: string;
    pattern: RegExp;
    confidence?: number;
  }>;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<EntityExtractorConfig> = {
  enablePersistence: false,
  storageKey: 'rana_entity_graph',
  minConfidence: 0.5,
  maxContexts: 10,
  coOccurrenceWindow: 20,
  customPatterns: [],
};

/**
 * Entity extraction patterns
 * Simple pattern-based extraction (can be enhanced with NLP libraries)
 */
const ENTITY_PATTERNS: Record<EntityType, RegExp[]> = {
  PERSON: [
    /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g, // John Smith
    /\b(Mr\.|Mrs\.|Ms\.|Dr\.) [A-Z][a-z]+\b/g, // Mr. Smith
  ],
  ORGANIZATION: [
    /\b([A-Z][a-z]+ (?:Inc\.|LLC|Corp\.|Corporation|Ltd\.|Limited))\b/g,
    /\b([A-Z][a-z]+ [A-Z][a-z]+ (?:Company|Group|Association))\b/g,
  ],
  LOCATION: [
    /\b([A-Z][a-z]+(?:, [A-Z]{2})?)\b/g, // City, State
    /\b(New York|Los Angeles|Chicago|Houston|Phoenix|San Francisco)\b/gi,
  ],
  DATE: [
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g, // MM/DD/YYYY
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/gi,
    /\b(\d{4}-\d{2}-\d{2})\b/g, // YYYY-MM-DD
  ],
  TIME: [
    /\b(\d{1,2}:\d{2}(?::\d{2})?(?: ?(?:AM|PM))?)\b/gi,
  ],
  PRODUCT: [
    /\b([A-Z][a-z]+ [0-9]+(?:\.[0-9]+)?)\b/g, // iPhone 15
    /\b(version \d+(?:\.\d+)*)\b/gi,
  ],
  EVENT: [
    /\b([A-Z][a-z]+ (?:Conference|Summit|Meeting|Event))\b/g,
  ],
  CONCEPT: [
    /\b([A-Z][A-Z]+)\b/g, // Acronyms
  ],
  CUSTOM: [],
};

/**
 * EntityExtractor Class
 * Extracts and manages entities with relationship tracking
 */
export class EntityExtractor {
  private graph: EntityGraph;
  private config: Required<EntityExtractorConfig>;
  private timeline: EntityTimelineEvent[];

  constructor(config: EntityExtractorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.graph = {
      entities: new Map(),
      relationships: new Map(),
      valueIndex: new Map(),
      typeIndex: new Map(),
    };
    this.timeline = [];

    // Load from persistence if enabled
    if (this.config.enablePersistence) {
      this.loadFromStorage();
    }
  }

  /**
   * Extract entities from text
   */
  extract(text: string, sourceId?: string): ExtractionResult {
    const timestamp = new Date();
    const entities: Entity[] = [];
    const relationships: EntityRelationship[] = [];
    const extractedData: Array<{ value: string; type: EntityType; position: number; customType?: string }> = [];

    // Extract using built-in patterns
    for (const [type, patterns] of Object.entries(ENTITY_PATTERNS) as Array<[EntityType, RegExp[]]>) {
      for (const pattern of patterns) {
        let match;
        const regex = new RegExp(pattern);
        while ((match = regex.exec(text)) !== null) {
          const value = match[1] || match[0];
          extractedData.push({
            value: value.trim(),
            type,
            position: match.index,
          });
        }
      }
    }

    // Extract using custom patterns
    for (const customPattern of this.config.customPatterns) {
      let match;
      const regex = new RegExp(customPattern.pattern);
      while ((match = regex.exec(text)) !== null) {
        const value = match[1] || match[0];
        extractedData.push({
          value: value.trim(),
          type: 'CUSTOM',
          position: match.index,
          customType: customPattern.type,
        });
      }
    }

    // Process extracted data
    for (const data of extractedData) {
      const entity = this.addOrUpdateEntity(
        data.value,
        data.type,
        text,
        data.position,
        timestamp,
        sourceId,
        data.customType
      );

      if (entity.confidence >= this.config.minConfidence) {
        entities.push(entity);
      }
    }

    // Detect co-occurrences and relationships
    const detectedRelationships = this.detectRelationships(entities, text, timestamp);
    relationships.push(...detectedRelationships);

    // Persist if enabled
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }

    return {
      entities,
      relationships,
      text,
      timestamp,
    };
  }

  /**
   * Add or update an entity
   */
  private addOrUpdateEntity(
    value: string,
    type: EntityType,
    text: string,
    position: number,
    timestamp: Date,
    sourceId?: string,
    customType?: string
  ): Entity {
    // Check if entity already exists
    const existingId = this.findExistingEntity(value, type);

    if (existingId) {
      // Update existing entity
      const entity = this.graph.entities.get(existingId)!;
      entity.occurrences++;
      entity.lastSeen = timestamp;

      // Add context (limit to maxContexts)
      const contextStart = Math.max(0, position - 50);
      const contextEnd = Math.min(text.length, position + 50);
      const contextText = text.substring(contextStart, contextEnd);

      entity.contexts.push({
        text: contextText,
        position,
        timestamp,
        sourceId,
      });

      if (entity.contexts.length > this.config.maxContexts) {
        entity.contexts.shift();
      }

      // Add timeline event
      this.timeline.push({
        timestamp,
        entityId: existingId,
        value: entity.value,
        type: entity.type,
        eventType: 'mentioned',
        context: contextText,
      });

      return entity;
    } else {
      // Create new entity
      const id = this.generateId();
      const contextStart = Math.max(0, position - 50);
      const contextEnd = Math.min(text.length, position + 50);
      const contextText = text.substring(contextStart, contextEnd);

      const entity: Entity = {
        id,
        type,
        value,
        aliases: [],
        customType,
        confidence: this.calculateConfidence(value, type),
        occurrences: 1,
        firstSeen: timestamp,
        lastSeen: timestamp,
        metadata: {},
        contexts: [
          {
            text: contextText,
            position,
            timestamp,
            sourceId,
          },
        ],
      };

      // Add to graph
      this.graph.entities.set(id, entity);

      // Update indices
      this.addToValueIndex(value, id);
      this.addToTypeIndex(type, id);

      // Add timeline event
      this.timeline.push({
        timestamp,
        entityId: id,
        value,
        type,
        eventType: 'created',
        context: contextText,
      });

      return entity;
    }
  }

  /**
   * Detect relationships between entities
   */
  private detectRelationships(
    entities: Entity[],
    text: string,
    timestamp: Date
  ): EntityRelationship[] {
    const relationships: EntityRelationship[] = [];
    const words = text.split(/\s+/);

    // Check each pair of entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];

        // Calculate word distance between entities
        const positions1 = entity1.contexts.map((c) => c.position);
        const positions2 = entity2.contexts.map((c) => c.position);

        let minDistance = Infinity;
        for (const pos1 of positions1) {
          for (const pos2 of positions2) {
            const distance = Math.abs(pos1 - pos2);
            minDistance = Math.min(minDistance, distance);
          }
        }

        // If within co-occurrence window, create/update relationship
        if (minDistance <= this.config.coOccurrenceWindow * 5) {
          // Approximate word distance
          const relKey = this.getRelationshipKey(entity1.id, entity2.id);
          let relationship = this.graph.relationships.get(relKey);

          if (relationship) {
            relationship.coOccurrences++;
            relationship.lastSeen = timestamp;
            relationship.strength = Math.min(
              1,
              relationship.strength + 0.1
            );

            // Add context
            const contextStart = Math.min(positions1[0], positions2[0]);
            const contextEnd = Math.max(
              positions1[positions1.length - 1],
              positions2[positions2.length - 1]
            );
            const context = text.substring(contextStart, contextEnd + 50);
            relationship.contexts.push(context);
          } else {
            const contextStart = Math.min(positions1[0], positions2[0]);
            const contextEnd = Math.max(
              positions1[positions1.length - 1],
              positions2[positions2.length - 1]
            );
            const context = text.substring(contextStart, contextEnd + 50);

            relationship = {
              entityId1: entity1.id,
              entityId2: entity2.id,
              coOccurrences: 1,
              strength: 0.5,
              firstSeen: timestamp,
              lastSeen: timestamp,
              contexts: [context],
            };

            this.graph.relationships.set(relKey, relationship);
          }

          relationships.push(relationship);
        }
      }
    }

    return relationships;
  }

  /**
   * Get entity by ID
   */
  getEntity(id: string): Entity | null {
    return this.graph.entities.get(id) || null;
  }

  /**
   * Get related entities
   */
  getRelated(entityId: string, limit: number = 10): Array<{ entity: Entity; strength: number }> {
    const related: Array<{ entity: Entity; strength: number }> = [];

    for (const [, relationship] of this.graph.relationships) {
      if (relationship.entityId1 === entityId) {
        const entity = this.graph.entities.get(relationship.entityId2);
        if (entity) {
          related.push({ entity, strength: relationship.strength });
        }
      } else if (relationship.entityId2 === entityId) {
        const entity = this.graph.entities.get(relationship.entityId1);
        if (entity) {
          related.push({ entity, strength: relationship.strength });
        }
      }
    }

    // Sort by strength and limit
    return related
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);
  }

  /**
   * Get entity timeline/history
   */
  getHistory(entityId?: string): EntityTimelineEvent[] {
    if (entityId) {
      return this.timeline.filter((event) => event.entityId === entityId);
    }
    return [...this.timeline].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Merge duplicate entities
   */
  merge(entityId1: string, entityId2: string): Entity | null {
    const entity1 = this.graph.entities.get(entityId1);
    const entity2 = this.graph.entities.get(entityId2);

    if (!entity1 || !entity2) {
      return null;
    }

    // Merge into entity1
    entity1.aliases.push(entity2.value, ...entity2.aliases);
    entity1.occurrences += entity2.occurrences;
    entity1.confidence = Math.max(entity1.confidence, entity2.confidence);
    entity1.contexts.push(...entity2.contexts);

    // Limit contexts
    if (entity1.contexts.length > this.config.maxContexts) {
      entity1.contexts = entity1.contexts.slice(-this.config.maxContexts);
    }

    // Update metadata
    entity1.metadata = { ...entity2.metadata, ...entity1.metadata };

    // Update first/last seen
    entity1.firstSeen = new Date(
      Math.min(entity1.firstSeen.getTime(), entity2.firstSeen.getTime())
    );
    entity1.lastSeen = new Date(
      Math.max(entity1.lastSeen.getTime(), entity2.lastSeen.getTime())
    );

    // Update relationships
    for (const [key, rel] of this.graph.relationships) {
      if (rel.entityId1 === entityId2) {
        rel.entityId1 = entityId1;
      }
      if (rel.entityId2 === entityId2) {
        rel.entityId2 = entityId1;
      }
    }

    // Remove entity2 from graph
    this.graph.entities.delete(entityId2);
    this.removeFromValueIndex(entity2.value, entityId2);
    this.removeFromTypeIndex(entity2.type, entityId2);

    // Add timeline event
    this.timeline.push({
      timestamp: new Date(),
      entityId: entityId1,
      value: entity1.value,
      type: entity1.type,
      eventType: 'merged',
      metadata: { mergedFrom: entityId2 },
    });

    // Persist if enabled
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }

    return entity1;
  }

  /**
   * Get all entities by type
   */
  getByType(type: EntityType): Entity[] {
    const ids = this.graph.typeIndex.get(type) || [];
    return ids.map((id) => this.graph.entities.get(id)!).filter(Boolean);
  }

  /**
   * Search entities by value
   */
  search(query: string, fuzzy: boolean = false): Entity[] {
    const results: Entity[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [, entity] of this.graph.entities) {
      const lowerValue = entity.value.toLowerCase();
      const matchAliases = entity.aliases.some((alias) =>
        alias.toLowerCase().includes(lowerQuery)
      );

      if (fuzzy) {
        if (lowerValue.includes(lowerQuery) || matchAliases) {
          results.push(entity);
        }
      } else {
        if (lowerValue === lowerQuery || matchAliases) {
          results.push(entity);
        }
      }
    }

    return results;
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    totalEntities: number;
    totalRelationships: number;
    entitiesByType: Record<EntityType, number>;
    avgOccurrences: number;
    avgConfidence: number;
  } {
    const entitiesByType: Record<string, number> = {};
    let totalOccurrences = 0;
    let totalConfidence = 0;

    for (const [, entity] of this.graph.entities) {
      entitiesByType[entity.type] = (entitiesByType[entity.type] || 0) + 1;
      totalOccurrences += entity.occurrences;
      totalConfidence += entity.confidence;
    }

    const totalEntities = this.graph.entities.size;

    return {
      totalEntities,
      totalRelationships: this.graph.relationships.size,
      entitiesByType: entitiesByType as Record<EntityType, number>,
      avgOccurrences: totalEntities > 0 ? totalOccurrences / totalEntities : 0,
      avgConfidence: totalEntities > 0 ? totalConfidence / totalEntities : 0,
    };
  }

  /**
   * Export graph data
   */
  export(): {
    entities: Entity[];
    relationships: EntityRelationship[];
    timeline: EntityTimelineEvent[];
  } {
    return {
      entities: Array.from(this.graph.entities.values()),
      relationships: Array.from(this.graph.relationships.values()),
      timeline: [...this.timeline],
    };
  }

  /**
   * Import graph data
   */
  import(data: {
    entities: Entity[];
    relationships: EntityRelationship[];
    timeline?: EntityTimelineEvent[];
  }): void {
    this.graph.entities.clear();
    this.graph.relationships.clear();
    this.graph.valueIndex.clear();
    this.graph.typeIndex.clear();
    this.timeline = [];

    // Import entities
    for (const entity of data.entities) {
      this.graph.entities.set(entity.id, entity);
      this.addToValueIndex(entity.value, entity.id);
      this.addToTypeIndex(entity.type, entity.id);
    }

    // Import relationships
    for (const relationship of data.relationships) {
      const key = this.getRelationshipKey(relationship.entityId1, relationship.entityId2);
      this.graph.relationships.set(key, relationship);
    }

    // Import timeline
    if (data.timeline) {
      this.timeline = [...data.timeline];
    }

    // Persist if enabled
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.graph.entities.clear();
    this.graph.relationships.clear();
    this.graph.valueIndex.clear();
    this.graph.typeIndex.clear();
    this.timeline = [];

    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Helper: Find existing entity by value
   */
  private findExistingEntity(value: string, type: EntityType): string | null {
    const candidates = this.graph.valueIndex.get(value.toLowerCase()) || [];

    for (const id of candidates) {
      const entity = this.graph.entities.get(id);
      if (entity && entity.type === type) {
        return id;
      }
    }

    return null;
  }

  /**
   * Helper: Calculate confidence score
   */
  private calculateConfidence(value: string, type: EntityType): number {
    // Simple heuristic-based confidence
    let confidence = 0.5;

    // Increase confidence based on entity characteristics
    if (value.length > 2) confidence += 0.1;
    if (value.length > 5) confidence += 0.1;
    if (/^[A-Z]/.test(value)) confidence += 0.1; // Starts with capital
    if (type === 'DATE' || type === 'TIME') confidence += 0.2; // Structured types

    return Math.min(1, confidence);
  }

  /**
   * Helper: Generate unique ID
   */
  private generateId(): string {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Get relationship key
   */
  private getRelationshipKey(id1: string, id2: string): string {
    // Always use lexicographic order for consistency
    return id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
  }

  /**
   * Helper: Add to value index
   */
  private addToValueIndex(value: string, id: string): void {
    const key = value.toLowerCase();
    const ids = this.graph.valueIndex.get(key) || [];
    if (!ids.includes(id)) {
      ids.push(id);
      this.graph.valueIndex.set(key, ids);
    }
  }

  /**
   * Helper: Remove from value index
   */
  private removeFromValueIndex(value: string, id: string): void {
    const key = value.toLowerCase();
    const ids = this.graph.valueIndex.get(key) || [];
    const filtered = ids.filter((i) => i !== id);
    if (filtered.length > 0) {
      this.graph.valueIndex.set(key, filtered);
    } else {
      this.graph.valueIndex.delete(key);
    }
  }

  /**
   * Helper: Add to type index
   */
  private addToTypeIndex(type: EntityType, id: string): void {
    const ids = this.graph.typeIndex.get(type) || [];
    if (!ids.includes(id)) {
      ids.push(id);
      this.graph.typeIndex.set(type, ids);
    }
  }

  /**
   * Helper: Remove from type index
   */
  private removeFromTypeIndex(type: EntityType, id: string): void {
    const ids = this.graph.typeIndex.get(type) || [];
    const filtered = ids.filter((i) => i !== id);
    if (filtered.length > 0) {
      this.graph.typeIndex.set(type, filtered);
    } else {
      this.graph.typeIndex.delete(type);
    }
  }

  /**
   * Helper: Save to storage
   */
  private saveToStorage(): void {
    const storage = getLocalStorage();
    if (!storage) {
      return; // Not in browser environment
    }

    try {
      const data = this.export();
      const serialized = JSON.stringify({
        entities: data.entities,
        relationships: data.relationships,
        timeline: data.timeline,
      });
      storage.setItem(this.config.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save entity graph to storage:', error);
    }
  }

  /**
   * Helper: Load from storage
   */
  private loadFromStorage(): void {
    const storage = getLocalStorage();
    if (!storage) {
      return; // Not in browser environment
    }

    try {
      const serialized = storage.getItem(this.config.storageKey);
      if (serialized) {
        const data = JSON.parse(serialized);

        // Convert date strings back to Date objects
        if (data.entities) {
          data.entities = data.entities.map((e: any) => ({
            ...e,
            firstSeen: new Date(e.firstSeen),
            lastSeen: new Date(e.lastSeen),
            contexts: e.contexts.map((c: any) => ({
              ...c,
              timestamp: new Date(c.timestamp),
            })),
          }));
        }

        if (data.relationships) {
          data.relationships = data.relationships.map((r: any) => ({
            ...r,
            firstSeen: new Date(r.firstSeen),
            lastSeen: new Date(r.lastSeen),
          }));
        }

        if (data.timeline) {
          data.timeline = data.timeline.map((t: any) => ({
            ...t,
            timestamp: new Date(t.timestamp),
          }));
        }

        this.import(data);
      }
    } catch (error) {
      console.error('Failed to load entity graph from storage:', error);
    }
  }
}

/**
 * Create an entity extractor
 */
export function createEntityExtractor(config?: EntityExtractorConfig): EntityExtractor {
  return new EntityExtractor(config);
}
