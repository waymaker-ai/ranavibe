# Code Generation Examples

Complete examples demonstrating the new code generation features in `@rana/generate`.

## 🚀 Quick Start

```bash
# Install dependencies
npm install @rana/generate

# Run examples
npx tsx api-generation.ts
npx tsx database-generation.ts
npx tsx file-integration.ts
```

## 📚 Examples

### 1. API Generation (`api-generation.ts`)

Demonstrates complete CRUD API generation for multiple frameworks:

- **Next.js App Router** - Full REST APIs with authentication, validation, rate limiting
- **Express.js** - Classic routing with middleware
- **Fastify** - High-performance API generation
- **GraphQL** - Schema and resolver generation

**Features:**
- ✅ Automatic Zod validation schemas
- ✅ Authentication middleware
- ✅ Rate limiting
- ✅ Pagination, sorting, search
- ✅ Error handling with proper HTTP codes
- ✅ Unique constraint handling

**Run:**
```bash
npx tsx api-generation.ts
```

### 2. Database Generation (`database-generation.ts`)

Shows how to generate database schemas for multiple ORMs:

- **Prisma** - TypeScript-first ORM with auto-migrations
- **Drizzle** - PostgreSQL, MySQL, SQLite support
- **Raw SQL** - Full control with migration scripts

**Features:**
- ✅ Timestamps (createdAt, updatedAt)
- ✅ Soft deletes
- ✅ Auto-generated indexes
- ✅ Relations (one-to-one, one-to-many, many-to-many)
- ✅ Default values
- ✅ Type safety

**Run:**
```bash
npx tsx database-generation.ts
```

### 3. File Integration (`file-integration.ts`)

Demonstrates intelligent file placement and import management:

- **Codebase Analysis** - Detect framework, dependencies, patterns
- **Smart Placement** - Framework-aware file paths
- **Conflict Detection** - Detect existing files, naming conflicts
- **Import Management** - Sort, deduplicate, convert to aliases
- **Suggestions** - Missing dependencies, integration tips

**Features:**
- ✅ Framework detection (Next.js, React, Express)
- ✅ Auto-barrel exports (index.ts)
- ✅ Conflict resolution strategies
- ✅ Dependency detection
- ✅ Import organization

**Run:**
```bash
npx tsx file-integration.ts
```

## 🎯 Use Cases

### Build a Complete Blog API

```typescript
import { APIGenerator, DatabaseGenerator } from '@rana/generate';

// 1. Generate database schema
const postSchema = DatabaseGenerator.generatePrismaSchema({
  name: 'Post',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'content', type: 'text', required: true },
    { name: 'published', type: 'boolean', required: true },
  ],
  relations: [
    { type: 'one-to-many', target: 'Comment' },
  ],
});

// 2. Generate API endpoints
const postAPI = APIGenerator.generateCRUD({
  entity: 'Post',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'content', type: 'string', required: true },
    { name: 'published', type: 'boolean', required: true },
  ],
  operations: ['create', 'read', 'update', 'delete', 'list'],
  authentication: true,
}, {
  framework: 'next',
  apiType: 'rest',
  includeValidation: true,
  includeAuth: true,
});

// 3. Save to files
// schema.prisma gets the Prisma schema
// app/api/posts/route.ts gets the API code
```

### Generate E-commerce Backend

```typescript
// Generate schemas for Product, Order, Customer
const ecommerceEntities = ['Product', 'Order', 'Customer'].map(name => ({
  name,
  fields: [/* ... */],
  relations: [/* ... */],
}));

ecommerceEntities.forEach(entity => {
  const schema = DatabaseGenerator.generatePrismaSchema(entity);
  const api = APIGenerator.generateCRUD(/* ... */);
  // Save files...
});
```

### Integrate Generated Code

```typescript
import { generate, analyzeCodebase, integrateFiles } from '@rana/generate';

// 1. Analyze your codebase
const context = await analyzeCodebase('./my-app');

// 2. Generate code
const result = await generate('user authentication system');

// 3. Integrate smartly
const integration = await integrateFiles(result.files, context, {
  autoImport: true,
  autoExport: true,
  resolveConflicts: 'ask',
});

// 4. Review placements
integration.placements.forEach(p => {
  console.log(`${p.file.path} → ${p.path}`);
});

// 5. Handle conflicts
integration.conflicts.forEach(c => {
  console.log(`Conflict: ${c.message}`);
});
```

## 📖 Documentation

See the main [@rana/generate README](../../packages/generate/README.md) for full API documentation.

## 🛠️ Next Steps

1. Copy generated code to your project
2. Install suggested dependencies
3. Run database migrations
4. Test your endpoints
5. Customize as needed

## 💡 Tips

- **Start with templates**: Use the built-in generators before going custom
- **Review generated code**: Always review before committing
- **Use validation**: Enable Zod validation for all APIs
- **Enable auth**: Add authentication to sensitive endpoints
- **Test thoroughly**: Generate tests alongside your code
- **Version control**: Commit generated code for review

## 🤝 Contributing

Found a bug or have a suggestion? Open an issue at [github.com/waymaker-ai/ranavibe](https://github.com/waymaker-ai/ranavibe).

## 📝 License

MIT © Waymaker
