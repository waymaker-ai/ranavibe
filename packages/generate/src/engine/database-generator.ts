import { Entity, EntityField, EntityRelation } from '../types';

/**
 * Enhanced Database Schema Generator
 * Supports Prisma, Drizzle ORM, and raw SQL migrations
 */

export interface DatabaseGeneratorConfig {
  orm: 'prisma' | 'drizzle' | 'sql';
  database?: 'postgresql' | 'mysql' | 'sqlite';
  includeTimestamps?: boolean;
  includeSoftDelete?: boolean;
  includeIndexes?: boolean;
}

export class DatabaseGenerator {
  /**
   * Generate Prisma schema for an entity
   */
  static generatePrismaSchema(
    entity: Entity,
    config: DatabaseGeneratorConfig = { orm: 'prisma' }
  ): string {
    const modelName = this.pascalCase(entity.name);
    const tableName = this.pluralize(this.snakeCase(entity.name));

    const fields = entity.fields.map(field => {
      const fieldName = this.camelCase(field.name);
      const prismaType = this.getPrismaType(field);
      const optional = !field.required ? '?' : '';
      const unique = field.unique ? ' @unique' : '';
      const defaultValue = field.default ? ` @default(${field.default})` : '';

      return `  ${fieldName} ${prismaType}${optional}${unique}${defaultValue}`;
    });

    // Add relations
    const relations = entity.relations.map(rel => {
      const relName = this.camelCase(rel.target);

      switch (rel.type) {
        case 'one-to-one':
          return `  ${relName} ${this.pascalCase(rel.target)}? @relation(fields: [${relName}Id], references: [id])
  ${relName}Id String? @unique`;

        case 'one-to-many':
          return `  ${this.pluralize(relName)} ${this.pascalCase(rel.target)}[]`;

        case 'many-to-many':
          if (rel.through) {
            return `  ${this.pluralize(relName)} ${this.pascalCase(rel.target)}[] @relation("${modelName}To${this.pascalCase(rel.target)}")`;
          }
          return `  ${this.pluralize(relName)} ${this.pascalCase(rel.target)}[]`;

        default:
          return '';
      }
    }).filter(Boolean);

    const timestamps = config.includeTimestamps !== false
      ? ['  createdAt DateTime @default(now())', '  updatedAt DateTime @updatedAt']
      : [];

    const softDelete = config.includeSoftDelete
      ? ['  deletedAt DateTime?']
      : [];

    const indexes = config.includeIndexes
      ? this.generatePrismaIndexes(entity)
      : [];

    return `model ${modelName} {
  id String @id @default(cuid())
${fields.join('\n')}
${relations.join('\n')}
${[...timestamps, ...softDelete].join('\n')}

${indexes.join('\n')}
  @@map("${tableName}")
}
`;
  }

  /**
   * Generate Prisma indexes
   */
  private static generatePrismaIndexes(entity: Entity): string[] {
    const indexes: string[] = [];

    // Index unique fields
    const uniqueFields = entity.fields.filter(f => f.unique);
    uniqueFields.forEach(field => {
      indexes.push(`  @@index([${this.camelCase(field.name)}])`);
    });

    // Index commonly queried string fields
    const stringFields = entity.fields
      .filter(f => f.type === 'string' && !f.unique)
      .slice(0, 2);

    stringFields.forEach(field => {
      indexes.push(`  @@index([${this.camelCase(field.name)}])`);
    });

    return indexes;
  }

  /**
   * Generate Drizzle schema
   */
  static generateDrizzleSchema(
    entity: Entity,
    config: DatabaseGeneratorConfig = { orm: 'drizzle', database: 'postgresql' }
  ): string {
    const tableName = this.pluralize(this.snakeCase(entity.name));
    const modelName = this.camelCase(tableName);

    const db = config.database || 'postgresql';
    const prefix = db === 'postgresql' ? 'pg' : db === 'mysql' ? 'mysql' : 'sqlite';

    const fields = entity.fields.map(field => {
      const fieldName = this.camelCase(field.name);
      const drizzleType = this.getDrizzleType(field, db);
      const notNull = field.required ? '.notNull()' : '';
      const unique = field.unique ? '.unique()' : '';
      const defaultValue = field.default ? `.default(${field.default})` : '';

      return `  ${fieldName}: ${drizzleType}${notNull}${unique}${defaultValue},`;
    });

    const timestamps = config.includeTimestamps !== false
      ? [
          `  createdAt: timestamp('created_at').defaultNow().notNull(),`,
          `  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),`
        ]
      : [];

    const softDelete = config.includeSoftDelete
      ? [`  deletedAt: timestamp('deleted_at'),`]
      : [];

    return `import { ${prefix}Table, varchar, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/${prefix}-core';

export const ${modelName} = ${prefix}Table('${tableName}', {
  id: uuid('id').primaryKey().defaultRandom(),
${fields.join('\n')}
${[...timestamps, ...softDelete].join('\n')}
});

export type ${this.pascalCase(entity.name)} = typeof ${modelName}.$inferSelect;
export type New${this.pascalCase(entity.name)} = typeof ${modelName}.$inferInsert;
`;
  }

  /**
   * Generate SQL migration for creating table
   */
  static generateSQLMigration(
    entity: Entity,
    config: DatabaseGeneratorConfig = { orm: 'sql', database: 'postgresql' }
  ): string {
    const tableName = this.pluralize(this.snakeCase(entity.name));
    const db = config.database || 'postgresql';

    const idColumn = db === 'postgresql'
      ? 'id UUID PRIMARY KEY DEFAULT gen_random_uuid()'
      : db === 'mysql'
      ? 'id VARCHAR(36) PRIMARY KEY DEFAULT (UUID())'
      : 'id TEXT PRIMARY KEY';

    const fields = entity.fields.map(field => {
      const columnName = this.snakeCase(field.name);
      const sqlType = this.getSQLType(field, db);
      const notNull = field.required ? ' NOT NULL' : '';
      const unique = field.unique ? ' UNIQUE' : '';
      const defaultValue = field.default ? ` DEFAULT ${this.formatSQLDefault(field.default, field.type)}` : '';

      return `  ${columnName} ${sqlType}${notNull}${unique}${defaultValue}`;
    });

    const timestamps = config.includeTimestamps !== false
      ? [
          '  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
          '  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'
        ]
      : [];

    const softDelete = config.includeSoftDelete
      ? ['  deleted_at TIMESTAMP']
      : [];

    const indexes = config.includeIndexes
      ? this.generateSQLIndexes(entity, tableName, db)
      : { create: [], drop: [] };

    const upMigration = `-- Migration: Create ${tableName} table
-- Generated: ${new Date().toISOString()}

BEGIN;

CREATE TABLE ${tableName} (
  ${idColumn},
${fields.join(',\n')}${timestamps.length > 0 ? ',\n' + timestamps.join(',\n') : ''}${softDelete.length > 0 ? ',\n' + softDelete.join(',\n') : ''}
);

${indexes.create.join('\n')}

${db === 'postgresql' ? `
-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_${tableName}_updated_at
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
` : ''}

COMMIT;
`;

    const downMigration = `-- Migration: Drop ${tableName} table
-- Generated: ${new Date().toISOString()}

BEGIN;

${db === 'postgresql' ? `
DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName};
DROP FUNCTION IF EXISTS update_updated_at_column();
` : ''}

${indexes.drop.join('\n')}

DROP TABLE IF EXISTS ${tableName};

COMMIT;
`;

    return `${upMigration}\n-- ============================================================================
-- Rollback Migration
-- ============================================================================\n
${downMigration}`;
  }

  /**
   * Generate SQL indexes
   */
  private static generateSQLIndexes(
    entity: Entity,
    tableName: string,
    database: string
  ): { create: string[]; drop: string[] } {
    const create: string[] = [];
    const drop: string[] = [];

    // Index unique fields
    entity.fields
      .filter(f => f.unique)
      .forEach((field, i) => {
        const columnName = this.snakeCase(field.name);
        const indexName = `idx_${tableName}_${columnName}`;
        create.push(`CREATE INDEX ${indexName} ON ${tableName}(${columnName});`);
        drop.push(`DROP INDEX IF EXISTS ${indexName};`);
      });

    // Index commonly queried string fields
    entity.fields
      .filter(f => f.type === 'string' && !f.unique)
      .slice(0, 2)
      .forEach((field, i) => {
        const columnName = this.snakeCase(field.name);
        const indexName = `idx_${tableName}_${columnName}`;
        create.push(`CREATE INDEX ${indexName} ON ${tableName}(${columnName});`);
        drop.push(`DROP INDEX IF EXISTS ${indexName};`);
      });

    return { create, drop };
  }

  /**
   * Get Prisma field type
   */
  private static getPrismaType(field: EntityField): string {
    switch (field.type.toLowerCase()) {
      case 'string':
      case 'text':
        return 'String';
      case 'int':
      case 'integer':
      case 'number':
        return 'Int';
      case 'float':
      case 'decimal':
        return 'Float';
      case 'boolean':
      case 'bool':
        return 'Boolean';
      case 'date':
      case 'datetime':
      case 'timestamp':
        return 'DateTime';
      case 'json':
        return 'Json';
      case 'bytes':
      case 'blob':
        return 'Bytes';
      default:
        return 'String';
    }
  }

  /**
   * Get Drizzle field type
   */
  private static getDrizzleType(field: EntityField, database: string): string {
    const type = field.type.toLowerCase();

    switch (type) {
      case 'string':
        return `varchar('${this.snakeCase(field.name)}', { length: 255 })`;
      case 'text':
        return `text('${this.snakeCase(field.name)}')`;
      case 'int':
      case 'integer':
      case 'number':
        return `integer('${this.snakeCase(field.name)}')`;
      case 'float':
      case 'decimal':
        return database === 'postgresql'
          ? `doublePrecision('${this.snakeCase(field.name)}')`
          : `real('${this.snakeCase(field.name)}')`;
      case 'boolean':
      case 'bool':
        return `boolean('${this.snakeCase(field.name)}')`;
      case 'date':
      case 'datetime':
      case 'timestamp':
        return `timestamp('${this.snakeCase(field.name)}')`;
      case 'json':
        return `json('${this.snakeCase(field.name)}')`;
      default:
        return `varchar('${this.snakeCase(field.name)}', { length: 255 })`;
    }
  }

  /**
   * Get SQL column type
   */
  private static getSQLType(field: EntityField, database: string): string {
    const type = field.type.toLowerCase();

    if (database === 'postgresql') {
      switch (type) {
        case 'string':
          return 'VARCHAR(255)';
        case 'text':
          return 'TEXT';
        case 'int':
        case 'integer':
          return 'INTEGER';
        case 'number':
        case 'float':
        case 'decimal':
          return 'DECIMAL(10,2)';
        case 'boolean':
        case 'bool':
          return 'BOOLEAN';
        case 'date':
          return 'DATE';
        case 'datetime':
        case 'timestamp':
          return 'TIMESTAMP';
        case 'json':
          return 'JSONB';
        case 'uuid':
          return 'UUID';
        default:
          return 'VARCHAR(255)';
      }
    } else if (database === 'mysql') {
      switch (type) {
        case 'string':
          return 'VARCHAR(255)';
        case 'text':
          return 'TEXT';
        case 'int':
        case 'integer':
          return 'INT';
        case 'number':
        case 'float':
        case 'decimal':
          return 'DECIMAL(10,2)';
        case 'boolean':
        case 'bool':
          return 'TINYINT(1)';
        case 'date':
          return 'DATE';
        case 'datetime':
        case 'timestamp':
          return 'DATETIME';
        case 'json':
          return 'JSON';
        default:
          return 'VARCHAR(255)';
      }
    } else {
      // SQLite
      switch (type) {
        case 'int':
        case 'integer':
        case 'boolean':
        case 'bool':
          return 'INTEGER';
        case 'number':
        case 'float':
        case 'decimal':
          return 'REAL';
        default:
          return 'TEXT';
      }
    }
  }

  /**
   * Format SQL default value
   */
  private static formatSQLDefault(value: string, type: string): string {
    const lowerType = type.toLowerCase();

    if (lowerType === 'string' || lowerType === 'text') {
      return `'${value}'`;
    }

    if (lowerType === 'boolean' || lowerType === 'bool') {
      return value.toLowerCase() === 'true' ? 'TRUE' : 'FALSE';
    }

    if (value === 'now()' || value === 'CURRENT_TIMESTAMP') {
      return 'CURRENT_TIMESTAMP';
    }

    return value;
  }

  /**
   * Utility: Convert to PascalCase
   */
  private static pascalCase(str: string): string {
    return str
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Utility: Convert to camelCase
   */
  private static camelCase(str: string): string {
    const pascal = this.pascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Utility: Convert to snake_case
   */
  private static snakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * Utility: Pluralize (simple version)
   */
  private static pluralize(str: string): string {
    if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z')) {
      return str + 'es';
    }
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies';
    }
    return str + 's';
  }
}
