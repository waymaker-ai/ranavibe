# Database Integration Guide for RANA

**Version:** 1.0.0
**Last Updated:** 2025-11-09
**Status:** Production Ready

---

## Overview

Every production application needs a robust, secure, and scalable database. This guide provides RANA-compliant patterns for database integration, focusing on **Supabase** (PostgreSQL) and **Prisma ORM**, with security, performance, and best practices built-in.

**RANA Principle:** Real data only. No mocks in production code.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Supabase Setup](#supabase-setup)
3. [Prisma Integration](#prisma-integration)
4. [Row-Level Security (RLS)](#row-level-security-rls)
5. [Database Patterns](#database-patterns)
6. [Migrations](#migrations)
7. [Query Optimization](#query-optimization)
8. [Real-time Subscriptions](#real-time-subscriptions)
9. [Security Best Practices](#security-best-practices)
10. [Testing](#testing)
11. [RANA Quality Gates](#aads-quality-gates)

---

## Quick Start

### Installation

```bash
# Supabase CLI
npm install -g supabase

# Prisma
npm install prisma @prisma/client

# Supabase JS Client
npm install @supabase/supabase-js

# Initialize
npx supabase init
npx prisma init
```

### Configuration in .rana.yml

```yaml
# .rana.yml
version: 1.0.0

project:
  name: "My App"
  type: "fullstack"

# Database configuration
database:
  provider: "supabase"
  orm: "prisma"

  # Connection
  connection:
    url: "${DATABASE_URL}"
    direct_url: "${DATABASE_DIRECT_URL}"
    pooling: true
    max_connections: 100

  # Features
  features:
    rls_enabled: true           # Row-Level Security
    realtime_enabled: true      # Realtime subscriptions
    pg_bouncer: true            # Connection pooling

  # Security
  security:
    ssl_mode: "require"
    rls_enforced: true
    public_schema_readonly: false

  # Quality gates
  quality_gates:
    - migrations_in_version_control
    - rls_policies_defined
    - indexes_on_foreign_keys
    - no_n_plus_one_queries
    - connection_pooling_enabled
    - secrets_not_hardcoded
```

---

## Supabase Setup

### 1. Create Supabase Project

```bash
# Login to Supabase
npx supabase login

# Link to existing project
npx supabase link --project-ref your-project-ref

# Or start local instance
npx supabase start
```

### 2. Environment Variables

```bash
# .env.local (NEVER commit this file!)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
DATABASE_DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. Supabase Client Setup

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// ✅ RANA: Environment variables, not hardcoded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client (uses anon key + RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'my-app',
    },
  },
});

// Server-side Supabase client (uses service role key, bypasses RLS)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
```

### 4. Generate TypeScript Types

```bash
# Generate types from database schema
npx supabase gen types typescript --project-id your-project-ref > lib/supabase/database.types.ts

# Add to package.json
{
  "scripts": {
    "types:supabase": "supabase gen types typescript --project-id your-project-ref > lib/supabase/database.types.ts"
  }
}
```

---

## Prisma Integration

### 1. Prisma Schema Setup

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_DIRECT_URL")
  extensions = [uuid_ossp(map: "uuid-ossp"), pgcrypto]
}

// ✅ RANA: Use proper relationships, not loose IDs
model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique
  name          String?
  avatarUrl     String?   @map("avatar_url")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  posts         Post[]
  comments      Comment[]

  @@map("users")
  @@index([email])
}

model Post {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title         String
  content       String    @db.Text
  published     Boolean   @default(false)
  authorId      String    @map("author_id") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  author        User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments      Comment[]

  @@map("posts")
  @@index([authorId])
  @@index([published])
  @@index([createdAt])
}

model Comment {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  content       String    @db.Text
  postId        String    @map("post_id") @db.Uuid
  authorId      String    @map("author_id") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  post          Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author        User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("comments")
  @@index([postId])
  @@index([authorId])
}
```

### 2. Prisma Client Setup

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// ✅ RANA: Singleton pattern for connection pooling
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// ✅ RANA: Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

### 3. Generate Prisma Client

```bash
# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy

# Add to package.json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

---

## Row-Level Security (RLS)

RLS ensures users can only access their own data. **CRITICAL for multi-tenant apps.**

### 1. Enable RLS on Tables

```sql
-- migrations/20240101_enable_rls.sql

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
```

### 2. RLS Policies

```sql
-- migrations/20240101_rls_policies.sql

-- Users: Can only read/update their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Posts: Authors can CRUD their own posts, everyone can read published
CREATE POLICY "Anyone can view published posts"
  ON posts FOR SELECT
  USING (published = true OR auth.uid() = author_id);

CREATE POLICY "Authors can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- Comments: Authors can CRUD their own comments, everyone can read
CREATE POLICY "Anyone can view comments on published posts"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND (posts.published = true OR posts.author_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);
```

### 3. Testing RLS Policies

```typescript
// tests/rls.test.ts
import { supabase } from '@/lib/supabase/client';

describe('RLS Policies', () => {
  it('users cannot access other users data', async () => {
    // Sign in as user1
    const { data: { user: user1 } } = await supabase.auth.signInWithPassword({
      email: 'user1@example.com',
      password: 'password',
    });

    // Try to read user2's profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'user2-id')
      .single();

    // ✅ Should fail due to RLS
    expect(error).toBeTruthy();
    expect(data).toBeNull();
  });

  it('users can only delete their own posts', async () => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', 'someone-elses-post-id');

    // ✅ Should fail due to RLS
    expect(error).toBeTruthy();
  });
});
```

---

## Database Patterns

### Pattern 1: Service Layer (Recommended)

```typescript
// services/posts.service.ts
import { prisma } from '@/lib/prisma';
import type { Post, Prisma } from '@prisma/client';

/**
 * ✅ RANA: Service layer for database operations
 * - Centralized logic
 * - Error handling
 * - Type safety
 * - Testable
 */

export class PostsService {
  /**
   * Get all published posts with author information
   * ✅ RANA: Includes relations, no N+1 queries
   */
  async getPublishedPosts() {
    try {
      return await prisma.post.findMany({
        where: { published: true },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching published posts:', error);
      throw new Error('Failed to fetch posts');
    }
  }

  /**
   * Get post by ID with all relations
   * ✅ RANA: Error handling, not found handling
   */
  async getPostById(id: string) {
    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!post) {
        throw new Error(`Post not found: ${id}`);
      }

      return post;
    } catch (error) {
      console.error(`Error fetching post ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new post
   * ✅ RANA: Validation, transaction, error handling
   */
  async createPost(data: Prisma.PostCreateInput) {
    try {
      // Validate input
      if (!data.title || data.title.trim().length === 0) {
        throw new Error('Post title is required');
      }

      if (!data.content || data.content.trim().length === 0) {
        throw new Error('Post content is required');
      }

      return await prisma.post.create({
        data,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }
  }

  /**
   * Update a post
   * ✅ RANA: Authorization check, validation
   */
  async updatePost(id: string, userId: string, data: Prisma.PostUpdateInput) {
    try {
      // Check ownership
      const post = await prisma.post.findUnique({
        where: { id },
        select: { authorId: true },
      });

      if (!post) {
        throw new Error(`Post not found: ${id}`);
      }

      if (post.authorId !== userId) {
        throw new Error('Unauthorized: You can only update your own posts');
      }

      return await prisma.post.update({
        where: { id },
        data,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error updating post ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a post
   * ✅ RANA: Authorization check, cascade handling
   */
  async deletePost(id: string, userId: string) {
    try {
      // Check ownership
      const post = await prisma.post.findUnique({
        where: { id },
        select: { authorId: true },
      });

      if (!post) {
        throw new Error(`Post not found: ${id}`);
      }

      if (post.authorId !== userId) {
        throw new Error('Unauthorized: You can only delete your own posts');
      }

      // Delete post (comments will cascade due to onDelete: Cascade)
      await prisma.post.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      console.error(`Error deleting post ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user's posts with pagination
   * ✅ RANA: Pagination, cursor-based
   */
  async getUserPosts(userId: string, cursor?: string, limit: number = 20) {
    try {
      const posts = await prisma.post.findMany({
        where: { authorId: userId },
        take: limit + 1, // Take one extra to determine if there are more
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1, // Skip the cursor
        }),
        orderBy: { createdAt: 'desc' },
      });

      const hasMore = posts.length > limit;
      const results = hasMore ? posts.slice(0, -1) : posts;
      const nextCursor = hasMore ? results[results.length - 1].id : null;

      return {
        posts: results,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      console.error(`Error fetching user posts for ${userId}:`, error);
      throw new Error('Failed to fetch user posts');
    }
  }
}

// Export singleton instance
export const postsService = new PostsService();
```

### Pattern 2: Transaction Handling

```typescript
// services/transactions.service.ts
import { prisma } from '@/lib/prisma';

/**
 * ✅ RANA: Use transactions for multi-table operations
 */
export async function transferPostOwnership(
  postId: string,
  fromUserId: string,
  toUserId: string
) {
  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Verify ownership
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.authorId !== fromUserId) {
        throw new Error('Unauthorized');
      }

      // Verify new owner exists
      const newOwner = await tx.user.findUnique({
        where: { id: toUserId },
      });

      if (!newOwner) {
        throw new Error('New owner not found');
      }

      // Transfer ownership
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: { authorId: toUserId },
      });

      // Log the transfer (audit trail)
      await tx.auditLog.create({
        data: {
          action: 'TRANSFER_POST_OWNERSHIP',
          userId: fromUserId,
          metadata: {
            postId,
            fromUserId,
            toUserId,
          },
        },
      });

      return updatedPost;
    });

    return result;
  } catch (error) {
    console.error('Error transferring post ownership:', error);
    throw error;
  }
}
```

### Pattern 3: Preventing N+1 Queries

```typescript
// ❌ BAD: N+1 query problem
async function getPostsWithAuthorsBad() {
  const posts = await prisma.post.findMany();

  // This creates N additional queries!
  const postsWithAuthors = await Promise.all(
    posts.map(async (post) => {
      const author = await prisma.user.findUnique({
        where: { id: post.authorId },
      });
      return { ...post, author };
    })
  );

  return postsWithAuthors;
}

// ✅ GOOD: Single query with include
async function getPostsWithAuthorsGood() {
  return await prisma.post.findMany({
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
}

// ✅ ALSO GOOD: Preload with in clause
async function getPostsWithAuthorsPreload() {
  const posts = await prisma.post.findMany();
  const authorIds = [...new Set(posts.map(p => p.authorId))];

  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
  });

  const authorMap = new Map(authors.map(a => [a.id, a]));

  return posts.map(post => ({
    ...post,
    author: authorMap.get(post.authorId),
  }));
}
```

---

## Migrations

### Migration Workflow

```bash
# Development
npx prisma migrate dev --name add_user_role

# Staging
npx prisma migrate deploy

# Production
npx prisma migrate deploy

# Reset (development only - DESTROYS DATA)
npx prisma migrate reset
```

### Migration Best Practices

```sql
-- migrations/20240101_add_user_role.sql

-- ✅ GOOD: Add column with default
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';

-- ✅ GOOD: Add index for performance
CREATE INDEX idx_users_role ON users(role);

-- ✅ GOOD: Backfill data if needed
UPDATE users SET role = 'admin' WHERE email IN ('admin@example.com');

-- ❌ BAD: Dropping columns without backup
-- ALTER TABLE users DROP COLUMN important_data;

-- ✅ GOOD: Deprecate first, drop later
ALTER TABLE users ADD COLUMN important_data_deprecated VARCHAR(255);
UPDATE users SET important_data_deprecated = important_data;
-- (Later migration) ALTER TABLE users DROP COLUMN important_data;
```

---

## Query Optimization

### Indexing Strategy

```prisma
// ✅ RANA: Index frequently queried fields
model Post {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title       String
  published   Boolean  @default(false)
  authorId    String   @map("author_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")

  // Index foreign keys
  @@index([authorId])

  // Index frequently filtered fields
  @@index([published])

  // Index fields used in ORDER BY
  @@index([createdAt])

  // Compound index for common queries
  @@index([authorId, published, createdAt])

  @@map("posts")
}
```

### Query Performance Tips

```typescript
// ✅ GOOD: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    // Don't select large fields unnecessarily
  },
});

// ✅ GOOD: Use pagination
const posts = await prisma.post.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' },
});

// ✅ GOOD: Use count for total (if needed)
const [posts, totalCount] = await Promise.all([
  prisma.post.findMany({ take: 20, skip: page * 20 }),
  prisma.post.count(),
]);

// ✅ GOOD: Use cursor-based pagination for large datasets
const posts = await prisma.post.findMany({
  take: 20,
  ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  orderBy: { createdAt: 'desc' },
});
```

---

## Real-time Subscriptions

```typescript
// lib/supabase/realtime.ts
import { supabase } from './client';

/**
 * ✅ RANA: Real-time subscriptions with error handling
 */
export function subscribeToPostUpdates(
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) {
  const subscription = supabase
    .channel('posts-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: 'published=eq.true', // Only published posts
      },
      (payload) => {
        console.log('New post:', payload);
        onInsert?.(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'posts',
      },
      (payload) => {
        console.log('Post updated:', payload);
        onUpdate?.(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'posts',
      },
      (payload) => {
        console.log('Post deleted:', payload);
        onDelete?.(payload.old);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to posts changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Subscription error');
      }
    });

  // Return cleanup function
  return () => {
    subscription.unsubscribe();
  };
}

// Usage in React component
import { useEffect } from 'react';

function PostsList() {
  useEffect(() => {
    const cleanup = subscribeToPostUpdates(
      (newPost) => {
        // Handle new post
        console.log('New post created:', newPost);
      },
      (updatedPost) => {
        // Handle update
        console.log('Post updated:', updatedPost);
      },
      (deletedPost) => {
        // Handle deletion
        console.log('Post deleted:', deletedPost);
      }
    );

    // Cleanup on unmount
    return cleanup;
  }, []);

  // ...
}
```

---

## Security Best Practices

### 1. Never Expose Secrets

```typescript
// ❌ BAD: Hardcoded credentials
const supabase = createClient(
  'https://abc123.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

// ✅ GOOD: Environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 2. Use Service Role Carefully

```typescript
// ❌ BAD: Service role in client-side code
// NEVER do this - bypasses RLS!

// ✅ GOOD: Service role only in API routes/server functions
// app/api/admin/route.ts
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: Request) {
  // Verify admin permission first!
  const session = await getServerSession();
  if (!session?.user?.isAdmin) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Now safe to use admin client
  const { data } = await supabaseAdmin
    .from('users')
    .select('*');

  return Response.json(data);
}
```

### 3. Validate All Inputs

```typescript
import { z } from 'zod';

// ✅ GOOD: Input validation
const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  published: z.boolean().optional(),
});

export async function createPost(data: unknown) {
  try {
    // Validate input
    const validated = CreatePostSchema.parse(data);

    // Now safe to use
    return await prisma.post.create({
      data: validated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.message}`);
    }
    throw error;
  }
}
```

---

## Testing

### Unit Tests for Service Layer

```typescript
// services/__tests__/posts.service.test.ts
import { prismaMock } from '@/lib/prisma-mock';
import { postsService } from '../posts.service';

describe('PostsService', () => {
  describe('getPublishedPosts', () => {
    it('should return only published posts', async () => {
      const mockPosts = [
        { id: '1', title: 'Post 1', published: true },
        { id: '2', title: 'Post 2', published: true },
      ];

      prismaMock.post.findMany.mockResolvedValue(mockPosts);

      const result = await postsService.getPublishedPosts();

      expect(result).toEqual(mockPosts);
      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        where: { published: true },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createPost', () => {
    it('should validate required fields', async () => {
      await expect(
        postsService.createPost({ title: '', content: 'Content' })
      ).rejects.toThrow('Post title is required');
    });

    it('should create post with valid data', async () => {
      const mockPost = {
        id: '1',
        title: 'New Post',
        content: 'Content',
        published: false,
      };

      prismaMock.post.create.mockResolvedValue(mockPost);

      const result = await postsService.createPost({
        title: 'New Post',
        content: 'Content',
      });

      expect(result).toEqual(mockPost);
    });
  });
});
```

---

## RANA Quality Gates

### Database Quality Gates

Add to `.rana.yml`:

```yaml
quality_gates:
  database:
    # Schema
    - migrations_in_version_control
    - schema_up_to_date
    - no_orphaned_migrations

    # Security
    - rls_enabled_on_all_tables
    - rls_policies_tested
    - secrets_not_hardcoded
    - ssl_required

    # Performance
    - indexes_on_foreign_keys
    - indexes_on_frequently_queried_fields
    - no_n_plus_one_queries
    - connection_pooling_enabled

    # Code Quality
    - service_layer_exists
    - transactions_for_multi_table_ops
    - error_handling_on_all_queries
    - input_validation_present

    # Testing
    - service_layer_unit_tests
    - rls_policies_tested
    - integration_tests_with_real_db
```

### Checklist

```markdown
## Database Implementation Checklist

### Setup
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Supabase client initialized
- [ ] TypeScript types generated
- [ ] Prisma schema defined
- [ ] Prisma client generated

### Schema
- [ ] All relations defined
- [ ] Proper indexes added
- [ ] UUID for primary keys
- [ ] Timestamps (created_at, updated_at)
- [ ] Cascade deletes configured

### Security
- [ ] RLS enabled on all tables
- [ ] RLS policies defined and tested
- [ ] Service role key secured (server-only)
- [ ] Anon key used client-side
- [ ] Input validation on all mutations

### Performance
- [ ] Indexes on foreign keys
- [ ] Indexes on frequently queried fields
- [ ] No N+1 queries
- [ ] Pagination implemented
- [ ] Connection pooling enabled

### Code Quality
- [ ] Service layer for database operations
- [ ] Error handling on all queries
- [ ] Transactions for multi-table operations
- [ ] TypeScript types for all operations
- [ ] No hardcoded values

### Testing
- [ ] Service layer unit tests
- [ ] RLS policy tests
- [ ] Integration tests with test database
- [ ] Migration tests

### Production
- [ ] Migrations run successfully
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Connection limits configured
```

---

## Conclusion

Following these patterns ensures your database layer is:

✅ **Secure** - RLS, input validation, secrets management
✅ **Performant** - Proper indexing, no N+1 queries, connection pooling
✅ **Maintainable** - Service layer, TypeScript types, migrations
✅ **Testable** - Unit tests, integration tests, RLS tests
✅ **Production-Ready** - Error handling, monitoring, backups

**Next:** [Security Framework Guide](./SECURITY_FRAMEWORK_GUIDE.md)

---

*Part of the RANA Framework - Production-Quality AI Development*
