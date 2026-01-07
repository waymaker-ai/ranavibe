/**
 * Database Schema Generation Examples
 *
 * This example demonstrates how to use @rana/generate to create
 * database schemas for Prisma, Drizzle, and raw SQL.
 */

import { DatabaseGenerator, type Entity } from '@rana/generate';

// ============================================================================
// Example 1: Simple User Entity with Prisma
// ============================================================================

console.log('👤 Example 1: User Entity (Prisma)\n');

const userEntity: Entity = {
  name: 'User',
  fields: [
    { name: 'email', type: 'string', required: true, unique: true },
    { name: 'name', type: 'string', required: true },
    { name: 'password', type: 'string', required: true },
    { name: 'emailVerified', type: 'boolean', required: false, default: 'false' },
  ],
  relations: [],
};

const userPrisma = DatabaseGenerator.generatePrismaSchema(userEntity, {
  orm: 'prisma',
  includeTimestamps: true,
  includeSoftDelete: false,
  includeIndexes: true,
});

console.log('Generated Prisma Schema:');
console.log(userPrisma);

// ============================================================================
// Example 2: Blog with Relations (Prisma)
// ============================================================================

console.log('\n📝 Example 2: Blog Entities with Relations (Prisma)\n');

const postEntity: Entity = {
  name: 'Post',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'slug', type: 'string', required: true, unique: true },
    { name: 'content', type: 'text', required: true },
    { name: 'published', type: 'boolean', required: true, default: 'false' },
    { name: 'viewCount', type: 'int', required: false, default: '0' },
  ],
  relations: [
    { type: 'one-to-many', target: 'Comment' },
    { type: 'many-to-many', target: 'Tag' },
  ],
};

const postPrisma = DatabaseGenerator.generatePrismaSchema(postEntity, {
  orm: 'prisma',
  includeTimestamps: true,
  includeSoftDelete: true,
  includeIndexes: true,
});

console.log('Generated Post Schema with Relations:');
console.log(postPrisma);

// ============================================================================
// Example 3: E-commerce Product (Drizzle + PostgreSQL)
// ============================================================================

console.log('\n🛍️ Example 3: Product Entity (Drizzle - PostgreSQL)\n');

const productEntity: Entity = {
  name: 'Product',
  fields: [
    { name: 'name', type: 'string', required: true },
    { name: 'sku', type: 'string', required: true, unique: true },
    { name: 'price', type: 'decimal', required: true },
    { name: 'stock', type: 'int', required: true, default: '0' },
    { name: 'description', type: 'text', required: false },
    { name: 'active', type: 'boolean', required: true, default: 'true' },
  ],
  relations: [
    { type: 'one-to-many', target: 'Review' },
  ],
};

const productDrizzle = DatabaseGenerator.generateDrizzleSchema(productEntity, {
  orm: 'drizzle',
  database: 'postgresql',
  includeTimestamps: true,
  includeSoftDelete: false,
  includeIndexes: true,
});

console.log('Generated Drizzle Schema (PostgreSQL):');
console.log(productDrizzle);

// ============================================================================
// Example 4: MySQL with Drizzle
// ============================================================================

console.log('\n📊 Example 4: Analytics Event (Drizzle - MySQL)\n');

const eventEntity: Entity = {
  name: 'Event',
  fields: [
    { name: 'userId', type: 'string', required: true },
    { name: 'eventName', type: 'string', required: true },
    { name: 'eventData', type: 'json', required: false },
    { name: 'timestamp', type: 'datetime', required: true },
  ],
  relations: [],
};

const eventDrizzleMySQL = DatabaseGenerator.generateDrizzleSchema(eventEntity, {
  orm: 'drizzle',
  database: 'mysql',
  includeTimestamps: false, // Using custom timestamp field
  includeIndexes: true,
});

console.log('Generated Drizzle Schema (MySQL):');
console.log(eventDrizzleMySQL);

// ============================================================================
// Example 5: SQLite with Drizzle
// ============================================================================

console.log('\n💾 Example 5: Local Settings (Drizzle - SQLite)\n');

const settingsEntity: Entity = {
  name: 'Setting',
  fields: [
    { name: 'key', type: 'string', required: true, unique: true },
    { name: 'value', type: 'string', required: true },
    { name: 'category', type: 'string', required: false },
  ],
  relations: [],
};

const settingsDrizzleSQLite = DatabaseGenerator.generateDrizzleSchema(settingsEntity, {
  orm: 'drizzle',
  database: 'sqlite',
  includeTimestamps: true,
});

console.log('Generated Drizzle Schema (SQLite):');
console.log(settingsDrizzleSQLite);

// ============================================================================
// Example 6: Raw SQL Migration (PostgreSQL)
// ============================================================================

console.log('\n🗄️ Example 6: Order Entity (Raw SQL - PostgreSQL)\n');

const orderEntity: Entity = {
  name: 'Order',
  fields: [
    { name: 'orderNumber', type: 'string', required: true, unique: true },
    { name: 'customerId', type: 'string', required: true },
    { name: 'total', type: 'decimal', required: true },
    { name: 'status', type: 'string', required: true, default: "'pending'" },
    { name: 'notes', type: 'text', required: false },
  ],
  relations: [],
};

const orderSQL = DatabaseGenerator.generateSQLMigration(orderEntity, {
  orm: 'sql',
  database: 'postgresql',
  includeTimestamps: true,
  includeSoftDelete: true,
  includeIndexes: true,
});

console.log('Generated SQL Migration (PostgreSQL):');
console.log(orderSQL);

// ============================================================================
// Example 7: Raw SQL Migration (MySQL)
// ============================================================================

console.log('\n📋 Example 7: Task Entity (Raw SQL - MySQL)\n');

const taskEntity: Entity = {
  name: 'Task',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'text', required: false },
    { name: 'completed', type: 'boolean', required: true, default: '0' },
    { name: 'priority', type: 'int', required: false, default: '0' },
    { name: 'dueDate', type: 'datetime', required: false },
  ],
  relations: [],
};

const taskSQLMySQL = DatabaseGenerator.generateSQLMigration(taskEntity, {
  orm: 'sql',
  database: 'mysql',
  includeTimestamps: true,
  includeIndexes: true,
});

console.log('Generated SQL Migration (MySQL):');
console.log(taskSQLMySQL);

// ============================================================================
// Example 8: Complete Blog Schema (Prisma)
// ============================================================================

console.log('\n📚 Example 8: Complete Blog Schema (Multiple Entities)\n');

const blogEntities: Entity[] = [
  {
    name: 'User',
    fields: [
      { name: 'email', type: 'string', required: true, unique: true },
      { name: 'name', type: 'string', required: true },
      { name: 'avatar', type: 'string', required: false },
    ],
    relations: [
      { type: 'one-to-many', target: 'Post' },
      { type: 'one-to-many', target: 'Comment' },
    ],
  },
  {
    name: 'Post',
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'slug', type: 'string', required: true, unique: true },
      { name: 'content', type: 'text', required: true },
      { name: 'published', type: 'boolean', required: true, default: 'false' },
    ],
    relations: [
      { type: 'one-to-many', target: 'Comment' },
      { type: 'many-to-many', target: 'Tag', through: 'PostTag' },
    ],
  },
  {
    name: 'Comment',
    fields: [
      { name: 'content', type: 'text', required: true },
      { name: 'approved', type: 'boolean', required: true, default: 'false' },
    ],
    relations: [],
  },
  {
    name: 'Tag',
    fields: [
      { name: 'name', type: 'string', required: true, unique: true },
      { name: 'slug', type: 'string', required: true, unique: true },
    ],
    relations: [
      { type: 'many-to-many', target: 'Post', through: 'PostTag' },
    ],
  },
];

console.log('Generating complete blog schema...\n');

blogEntities.forEach(entity => {
  const schema = DatabaseGenerator.generatePrismaSchema(entity, {
    orm: 'prisma',
    includeTimestamps: true,
    includeIndexes: true,
  });

  console.log(`// ${entity.name} Model`);
  console.log(schema);
});

console.log('\n✅ All database schemas generated successfully!');

// ============================================================================
// Summary & Next Steps
// ============================================================================

console.log('\n📊 Summary:\n');
console.log('Generated schemas for:');
console.log('- Prisma ORM (TypeScript-first, auto-migrations)');
console.log('- Drizzle ORM (PostgreSQL, MySQL, SQLite)');
console.log('- Raw SQL (Full control, manual migrations)');
console.log('\nFeatures included:');
console.log('✅ Automatic timestamps (createdAt, updatedAt)');
console.log('✅ Soft deletes (deletedAt)');
console.log('✅ Indexes on unique/searchable fields');
console.log('✅ Relations (one-to-one, one-to-many, many-to-many)');
console.log('✅ Default values');
console.log('✅ Type safety');
console.log('\n📚 Next Steps:\n');
console.log('1. Choose your ORM (Prisma recommended for TypeScript)');
console.log('2. Add generated schema to your project');
console.log('3. Run migrations:');
console.log('   - Prisma: npx prisma migrate dev --name init');
console.log('   - Drizzle: npx drizzle-kit generate:pg');
console.log('   - SQL: Run the migration.sql file');
console.log('4. Generate client:');
console.log('   - Prisma: npx prisma generate');
console.log('5. Start querying your database!');
