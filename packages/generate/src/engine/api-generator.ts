import { Step, CodebaseContext } from '../types';

/**
 * Enhanced API Endpoint Generator
 * Supports REST, GraphQL, and various frameworks
 */

export interface APIGeneratorConfig {
  framework: 'next' | 'express' | 'fastify';
  apiType: 'rest' | 'graphql' | 'trpc';
  includeValidation?: boolean;
  includeAuth?: boolean;
  includeRateLimit?: boolean;
  includeDocs?: boolean;
}

export interface CRUDSpec {
  entity: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    unique?: boolean;
    validation?: string;
  }[];
  operations: ('create' | 'read' | 'update' | 'delete' | 'list')[];
  authentication?: boolean;
  authorization?: string[];
}

export class APIGenerator {
  /**
   * Generate complete CRUD API for an entity
   */
  static generateCRUD(spec: CRUDSpec, config: APIGeneratorConfig): string {
    if (config.framework === 'next') {
      return this.generateNextJSCRUD(spec, config);
    } else if (config.framework === 'express') {
      return this.generateExpressCRUD(spec, config);
    } else {
      return this.generateFastifyCRUD(spec, config);
    }
  }

  /**
   * Generate Next.js App Router CRUD API
   */
  private static generateNextJSCRUD(spec: CRUDSpec, config: APIGeneratorConfig): string {
    const entityLower = spec.entity.toLowerCase();
    const entityPlural = `${entityLower}s`;

    // Build Zod schema
    const zodFields = spec.fields.map(field => {
      let zodType = 'z.string()';

      switch (field.type.toLowerCase()) {
        case 'string':
          zodType = 'z.string()';
          if (field.validation === 'email') zodType += '.email()';
          if (field.validation === 'url') zodType += '.url()';
          if (field.validation) zodType += `.regex(/${field.validation}/)`;
          break;
        case 'number':
        case 'int':
        case 'integer':
          zodType = 'z.number()';
          break;
        case 'boolean':
        case 'bool':
          zodType = 'z.boolean()';
          break;
        case 'date':
        case 'datetime':
          zodType = 'z.string().datetime()';
          break;
        case 'email':
          zodType = 'z.string().email()';
          break;
        default:
          zodType = 'z.string()';
      }

      if (field.required) {
        zodType += `.min(1, '${field.name} is required')`;
      } else {
        zodType += '.optional()';
      }

      return `  ${field.name}: ${zodType},`;
    }).join('\n');

    const authMiddleware = spec.authentication ? `
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
` : '';

    const rateLimitMiddleware = config.includeRateLimit ? `
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});
` : '';

    return `import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
${authMiddleware}${rateLimitMiddleware}

// ============================================================================
// Validation Schemas
// ============================================================================

const Create${spec.entity}Schema = z.object({
${zodFields}
});

const Update${spec.entity}Schema = Create${spec.entity}Schema.partial();

const Query${spec.entity}Schema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

// ============================================================================
// GET /api/${entityPlural} - List ${entityPlural} with pagination
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    ${config.includeRateLimit ? `
    // Rate limiting
    const remaining = await limiter.check(5, 'api_${entityPlural}');
    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
` : ''}${spec.authentication ? `
    // Authentication
    const session = await requireAuth(request);
` : ''}
    // Parse and validate query params
    const { searchParams } = new URL(request.url);
    const params = Query${spec.entity}Schema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder') || 'desc',
      search: searchParams.get('search'),
    });

    // Build query filters
    const where = params.search
      ? {
          OR: [
            ${spec.fields.filter(f => f.type === 'string').slice(0, 3).map(f =>
              `{ ${f.name}: { contains: params.search, mode: 'insensitive' as const } }`
            ).join(',\n            ')}
          ],
        }
      : {};

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      prisma.${entityLower}.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: params.sortBy
          ? { [params.sortBy]: params.sortOrder }
          : { createdAt: params.sortOrder },
      }),
      prisma.${entityLower}.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        pages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error('GET /${entityPlural} error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/${entityPlural} - Create new ${entityLower}
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    ${config.includeRateLimit ? `
    // Rate limiting
    const remaining = await limiter.check(3, 'api_${entityPlural}_create');
    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
` : ''}${spec.authentication ? `
    // Authentication
    const session = await requireAuth(request);
` : ''}
    // Parse and validate request body
    const body = await request.json();
    const validated = Create${spec.entity}Schema.parse(body);

    // Create ${entityLower}
    const ${entityLower} = await prisma.${entityLower}.create({
      data: {
        ...validated,${spec.authentication ? `\n        userId: session.user.id,` : ''}
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: ${entityLower},
        message: '${spec.entity} created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /${entityPlural} error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle unique constraint violations
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A ${entityLower} with this ${(error as any).meta?.target?.[0] || 'value'} already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/${entityPlural}/[id] - Update ${entityLower}
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    ${spec.authentication ? `
    // Authentication
    const session = await requireAuth(request);
` : ''}
    // Parse and validate request body
    const body = await request.json();
    const validated = Update${spec.entity}Schema.parse(body);

    // Update ${entityLower}
    const ${entityLower} = await prisma.${entityLower}.update({
      where: { id: params.id },
      data: validated,
    });

    return NextResponse.json({
      success: true,
      data: ${entityLower},
      message: '${spec.entity} updated successfully',
    });
  } catch (error) {
    console.error('PUT /${entityPlural}/[id] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: '${spec.entity} not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/${entityPlural}/[id] - Delete ${entityLower}
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    ${spec.authentication ? `
    // Authentication & Authorization
    const session = await requireAuth(request);
` : ''}
    // Delete ${entityLower}
    await prisma.${entityLower}.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: '${spec.entity} deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /${entityPlural}/[id] error:', error);

    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: '${spec.entity} not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
`;
  }

  /**
   * Generate Express CRUD API
   */
  private static generateExpressCRUD(spec: CRUDSpec, config: APIGeneratorConfig): string {
    const entityLower = spec.entity.toLowerCase();

    return `import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

// Validation schemas
const Create${spec.entity}Schema = z.object({
  ${spec.fields.map(f => `${f.name}: z.string()${f.required ? '' : '.optional()'}`).join(',\n  ')}
});

// Create ${entityLower}
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = Create${spec.entity}Schema.parse(req.body);
    const ${entityLower} = await prisma.${entityLower}.create({ data: validated });

    res.status(201).json({ success: true, data: ${entityLower} });
  } catch (error) {
    next(error);
  }
});

// List ${entityLower}s
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.${entityLower}.findMany();
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

// Get ${entityLower} by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ${entityLower} = await prisma.${entityLower}.findUnique({
      where: { id: req.params.id },
    });

    if (!${entityLower}) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    res.json({ success: true, data: ${entityLower} });
  } catch (error) {
    next(error);
  }
});

// Update ${entityLower}
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = Create${spec.entity}Schema.partial().parse(req.body);
    const ${entityLower} = await prisma.${entityLower}.update({
      where: { id: req.params.id },
      data: validated,
    });

    res.json({ success: true, data: ${entityLower} });
  } catch (error) {
    next(error);
  }
});

// Delete ${entityLower}
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.${entityLower}.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
`;
  }

  /**
   * Generate Fastify CRUD API
   */
  private static generateFastifyCRUD(spec: CRUDSpec, config: APIGeneratorConfig): string {
    const entityLower = spec.entity.toLowerCase();

    return `import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const ${entityLower}Routes: FastifyPluginAsync = async (fastify, opts) => {
  const Create${spec.entity}Schema = z.object({
    ${spec.fields.map(f => `${f.name}: z.string()${f.required ? '' : '.optional()'}`).join(',\n    ')}
  });

  // Create ${entityLower}
  fastify.post('/', async (request, reply) => {
    const validated = Create${spec.entity}Schema.parse(request.body);
    const ${entityLower} = await prisma.${entityLower}.create({ data: validated });

    return reply.status(201).send({ success: true, data: ${entityLower} });
  });

  // List ${entityLower}s
  fastify.get('/', async (request, reply) => {
    const items = await prisma.${entityLower}.findMany();
    return { success: true, data: items };
  });

  // Get ${entityLower} by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const ${entityLower} = await prisma.${entityLower}.findUnique({
      where: { id: request.params.id },
    });

    if (!${entityLower}) {
      return reply.status(404).send({ success: false, error: 'Not found' });
    }

    return { success: true, data: ${entityLower} };
  });

  // Update ${entityLower}
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const validated = Create${spec.entity}Schema.partial().parse(request.body);
    const ${entityLower} = await prisma.${entityLower}.update({
      where: { id: request.params.id },
      data: validated,
    });

    return { success: true, data: ${entityLower} };
  });

  // Delete ${entityLower}
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await prisma.${entityLower}.delete({
      where: { id: request.params.id },
    });

    return { success: true, message: 'Deleted successfully' };
  });
};

export default ${entityLower}Routes;
`;
  }

  /**
   * Generate GraphQL schema and resolvers
   */
  static generateGraphQL(spec: CRUDSpec): { schema: string; resolvers: string } {
    const entityLower = spec.entity.toLowerCase();

    const schema = `type ${spec.entity} {
  id: ID!
  ${spec.fields.map(f => `${f.name}: ${this.zodToGraphQLType(f.type)}${f.required ? '!' : ''}`).join('\n  ')}
  createdAt: String!
  updatedAt: String!
}

input Create${spec.entity}Input {
  ${spec.fields.map(f => `${f.name}: ${this.zodToGraphQLType(f.type)}${f.required ? '!' : ''}`).join('\n  ')}
}

input Update${spec.entity}Input {
  ${spec.fields.map(f => `${f.name}: ${this.zodToGraphQLType(f.type)}`).join('\n  ')}
}

type Query {
  ${entityLower}(id: ID!): ${spec.entity}
  ${entityLower}s(
    page: Int
    limit: Int
    search: String
  ): ${spec.entity}List!
}

type Mutation {
  create${spec.entity}(input: Create${spec.entity}Input!): ${spec.entity}!
  update${spec.entity}(id: ID!, input: Update${spec.entity}Input!): ${spec.entity}!
  delete${spec.entity}(id: ID!): Boolean!
}

type ${spec.entity}List {
  items: [${spec.entity}!]!
  total: Int!
  page: Int!
  pages: Int!
}
`;

    const resolvers = `import { prisma } from './lib/prisma';

export const resolvers = {
  Query: {
    ${entityLower}: async (_: any, { id }: { id: string }) => {
      return prisma.${entityLower}.findUnique({ where: { id } });
    },

    ${entityLower}s: async (_: any, args: { page?: number; limit?: number; search?: string }) => {
      const page = args.page || 1;
      const limit = args.limit || 10;
      const skip = (page - 1) * limit;

      const where = args.search
        ? {
            OR: [
              ${spec.fields.filter(f => f.type === 'string').slice(0, 2).map(f =>
                `{ ${f.name}: { contains: args.search, mode: 'insensitive' } }`
              ).join(',\n              ')}
            ],
          }
        : {};

      const [items, total] = await Promise.all([
        prisma.${entityLower}.findMany({ where, skip, take: limit }),
        prisma.${entityLower}.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    },
  },

  Mutation: {
    create${spec.entity}: async (_: any, { input }: { input: any }) => {
      return prisma.${entityLower}.create({ data: input });
    },

    update${spec.entity}: async (_: any, { id, input }: { id: string; input: any }) => {
      return prisma.${entityLower}.update({
        where: { id },
        data: input,
      });
    },

    delete${spec.entity}: async (_: any, { id }: { id: string }) => {
      await prisma.${entityLower}.delete({ where: { id } });
      return true;
    },
  },
};
`;

    return { schema, resolvers };
  }

  private static zodToGraphQLType(zodType: string): string {
    switch (zodType.toLowerCase()) {
      case 'number':
      case 'int':
      case 'integer':
        return 'Int';
      case 'float':
      case 'decimal':
        return 'Float';
      case 'boolean':
      case 'bool':
        return 'Boolean';
      default:
        return 'String';
    }
  }
}
