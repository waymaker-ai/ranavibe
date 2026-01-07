/**
 * API Generation Examples
 *
 * This example demonstrates how to use @rana/generate to create
 * complete CRUD APIs with authentication, validation, and rate limiting.
 */

import { APIGenerator, type CRUDSpec } from '@rana/generate';

// ============================================================================
// Example 1: Simple REST API
// ============================================================================

console.log('📡 Example 1: Simple User API\n');

const userAPI: CRUDSpec = {
  entity: 'User',
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, validation: 'email' },
    { name: 'name', type: 'string', required: true },
    { name: 'age', type: 'number', required: false },
    { name: 'bio', type: 'string', required: false },
  ],
  operations: ['create', 'read', 'update', 'delete', 'list'],
  authentication: false,
};

const simpleAPI = APIGenerator.generateCRUD(userAPI, {
  framework: 'next',
  apiType: 'rest',
  includeValidation: true,
  includeAuth: false,
  includeRateLimit: false,
});

console.log('Generated Next.js API:');
console.log(simpleAPI.substring(0, 500) + '...\n');

// ============================================================================
// Example 2: Authenticated API with Rate Limiting
// ============================================================================

console.log('🔒 Example 2: Authenticated Blog API\n');

const blogAPI: CRUDSpec = {
  entity: 'Post',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'slug', type: 'string', required: true, unique: true },
    { name: 'content', type: 'string', required: true },
    { name: 'published', type: 'boolean', required: true },
    { name: 'publishedAt', type: 'datetime', required: false },
  ],
  operations: ['create', 'read', 'update', 'delete', 'list'],
  authentication: true,
  authorization: ['admin', 'editor'],
};

const authAPI = APIGenerator.generateCRUD(blogAPI, {
  framework: 'next',
  apiType: 'rest',
  includeValidation: true,
  includeAuth: true,
  includeRateLimit: true,
  includeDocs: true,
});

console.log('Generated Authenticated API with Rate Limiting:');
console.log(authAPI.substring(0, 500) + '...\n');

// ============================================================================
// Example 3: Express.js API
// ============================================================================

console.log('⚡ Example 3: Express.js Product API\n');

const productAPI: CRUDSpec = {
  entity: 'Product',
  fields: [
    { name: 'name', type: 'string', required: true },
    { name: 'sku', type: 'string', required: true, unique: true },
    { name: 'price', type: 'number', required: true },
    { name: 'stock', type: 'number', required: true },
    { name: 'description', type: 'string', required: false },
  ],
  operations: ['create', 'read', 'update', 'delete', 'list'],
  authentication: false,
};

const expressAPI = APIGenerator.generateCRUD(productAPI, {
  framework: 'express',
  apiType: 'rest',
  includeValidation: true,
});

console.log('Generated Express.js API:');
console.log(expressAPI.substring(0, 500) + '...\n');

// ============================================================================
// Example 4: GraphQL Schema
// ============================================================================

console.log('🎯 Example 4: GraphQL Schema for E-commerce\n');

const orderAPI: CRUDSpec = {
  entity: 'Order',
  fields: [
    { name: 'orderNumber', type: 'string', required: true, unique: true },
    { name: 'customerEmail', type: 'email', required: true },
    { name: 'total', type: 'number', required: true },
    { name: 'status', type: 'string', required: true },
    { name: 'items', type: 'string', required: true }, // JSON array
  ],
  operations: ['create', 'read', 'update', 'list'],
  authentication: true,
};

const { schema, resolvers } = APIGenerator.generateGraphQL(orderAPI);

console.log('Generated GraphQL Schema:');
console.log(schema);
console.log('\nGenerated GraphQL Resolvers:');
console.log(resolvers.substring(0, 500) + '...\n');

// ============================================================================
// Example 5: Fastify API
// ============================================================================

console.log('🚀 Example 5: Fastify API for Real-time Chat\n');

const messageAPI: CRUDSpec = {
  entity: 'Message',
  fields: [
    { name: 'content', type: 'string', required: true },
    { name: 'senderId', type: 'string', required: true },
    { name: 'channelId', type: 'string', required: true },
    { name: 'readAt', type: 'datetime', required: false },
  ],
  operations: ['create', 'read', 'list'],
  authentication: true,
};

const fastifyAPI = APIGenerator.generateCRUD(messageAPI, {
  framework: 'fastify',
  apiType: 'rest',
  includeValidation: true,
  includeAuth: true,
});

console.log('Generated Fastify API:');
console.log(fastifyAPI.substring(0, 500) + '...\n');

// ============================================================================
// Example 6: Full E-commerce API Suite
// ============================================================================

console.log('🛒 Example 6: Complete E-commerce API Suite\n');

// Generate multiple related APIs
const ecommerceAPIs = [
  {
    name: 'Product',
    spec: {
      entity: 'Product',
      fields: [
        { name: 'name', type: 'string', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'stock', type: 'number', required: true },
      ],
      operations: ['create', 'read', 'update', 'delete', 'list'] as const,
    },
  },
  {
    name: 'Category',
    spec: {
      entity: 'Category',
      fields: [
        { name: 'name', type: 'string', required: true, unique: true },
        { name: 'description', type: 'string', required: false },
      ],
      operations: ['create', 'read', 'update', 'delete', 'list'] as const,
    },
  },
  {
    name: 'Customer',
    spec: {
      entity: 'Customer',
      fields: [
        { name: 'email', type: 'email', required: true, unique: true },
        { name: 'name', type: 'string', required: true },
        { name: 'phone', type: 'string', required: false },
      ],
      operations: ['create', 'read', 'update', 'list'] as const,
      authentication: true,
    },
  },
];

ecommerceAPIs.forEach(({ name, spec }) => {
  const api = APIGenerator.generateCRUD(spec as CRUDSpec, {
    framework: 'next',
    apiType: 'rest',
    includeValidation: true,
    includeAuth: spec.authentication || false,
  });

  console.log(`Generated ${name} API - ${api.split('\n').length} lines`);
});

console.log('\n✅ All examples generated successfully!');
console.log('\nKey Features Demonstrated:');
console.log('- Next.js App Router APIs');
console.log('- Express.js routing');
console.log('- Fastify routing');
console.log('- GraphQL schema & resolvers');
console.log('- Authentication & authorization');
console.log('- Rate limiting');
console.log('- Zod validation');
console.log('- Pagination & search');
console.log('- Error handling');

// ============================================================================
// Usage Instructions
// ============================================================================

console.log('\n📚 Usage Instructions:\n');
console.log('1. Copy generated code to your project');
console.log('2. Install dependencies: npm install zod prisma next-auth');
console.log('3. Configure Prisma schema');
console.log('4. Run migrations: npx prisma migrate dev');
console.log('5. Test endpoints with curl or Postman');
console.log('\nExample cURL command:');
console.log('curl -X POST http://localhost:3000/api/users \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"email":"user@example.com","name":"John Doe"}\'');
