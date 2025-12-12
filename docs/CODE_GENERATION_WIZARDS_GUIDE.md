# Code Generation Wizards Guide

**Version:** 2.1.0
**Last Updated:** December 2025
**Status:** Production Ready

---

## Overview

RANA provides interactive wizards for generating production-ready code. Each wizard guides you through options and generates complete, tested code.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Full Wizard](#full-wizard)
3. [Database Schema Wizard](#database-schema-wizard)
4. [API Wizard](#api-wizard)
5. [Component Wizard](#component-wizard)
6. [Form Wizard](#form-wizard)
7. [Authentication Wizard](#authentication-wizard)
8. [Dashboard Wizard](#dashboard-wizard)
9. [Feature Wizard](#feature-wizard)

---

## Quick Start

```bash
# Launch the full wizard
rana generate wizard

# Or use specific wizards directly
rana generate schema          # Database schema wizard
rana generate api             # API generation wizard
rana generate component       # Component wizard

# Non-interactive mode
rana generate schema "User, Post, Comment with Prisma"
rana generate api "REST API for products with CRUD"
rana generate component UserCard
```

---

## Full Wizard

The full wizard (`rana generate wizard`) provides a guided entry point to all generation options.

### Usage

```bash
rana generate wizard
# or
rana generate w
```

### Options

The wizard presents these generation types:

| Option | Description |
|--------|-------------|
| Full Feature | Complete feature with UI, API, and database |
| Database Schema | Models, migrations, and ORM setup |
| REST API | CRUD endpoints with validation |
| React Component | UI component with props and tests |
| Form | Form with validation and submission |
| Authentication | Auth flow with providers |
| Dashboard | Admin dashboard with charts |

---

## Database Schema Wizard

Generate database schemas, models, and migrations.

### Usage

```bash
rana generate schema
# or
rana generate schema "User, Post, Comment with Prisma for PostgreSQL"
```

### Options

| Option | Choices |
|--------|---------|
| ORM | Prisma, Drizzle, TypeORM, Mongoose, Raw SQL |
| Database | PostgreSQL, MySQL, SQLite, MongoDB |
| Entities | Comma-separated model names |
| Timestamps | createdAt, updatedAt fields |
| Soft Delete | deletedAt field |
| Features | Relations, indexes, seeds, migrations, types |

### Example Output

```
# Files generated:
+ prisma/schema.prisma
+ prisma/migrations/001_initial.sql
+ src/db/types.ts
+ src/db/seed.ts
```

### Generated Schema Example

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  comments  Comment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String    @id @default(cuid())
  title     String
  content   String?
  published Boolean   @default(false)
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([authorId])
}
```

---

## API Wizard

Generate REST, GraphQL, or tRPC APIs.

### Usage

```bash
rana generate api
# or
rana generate api "users CRUD API with authentication"
```

### Options

| Option | Choices |
|--------|---------|
| Style | REST, GraphQL, tRPC |
| Framework | Next.js, Express, Fastify, Hono, Apollo, Pothos |
| Resources | Comma-separated endpoint names |
| Operations | Create, Read, List, Update, Delete, Search, Bulk |
| Features | Validation, Auth, Rate limiting, Pagination, Filtering, OpenAPI |

### Example Output (REST)

```
# Files generated:
+ src/app/api/users/route.ts
+ src/app/api/users/[id]/route.ts
+ src/lib/validations/user.ts
+ src/types/user.ts
+ tests/api/users.test.ts
```

### Generated API Example

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const users = await prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.user.count();

  return NextResponse.json({
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const POST = withAuth(
  withRateLimit(async (req: NextRequest) => {
    const body = await req.json();
    const data = createUserSchema.parse(body);

    const user = await prisma.user.create({ data });

    return NextResponse.json({ data: user }, { status: 201 });
  })
);
```

---

## Component Wizard

Generate React/Next.js components with styling and tests.

### Usage

```bash
rana generate component
# or
rana generate component UserCard
rana generate c UserCard
```

### Options

| Option | Choices |
|--------|---------|
| Type | UI, Feature, Page, Layout, Form |
| Styling | Tailwind, CSS Modules, styled-components, Emotion |
| Features | TypeScript, Tests, Storybook, Loading, Error, Dark mode, A11y, Animation |
| Props | Custom props definition |

### Example Output

```
# Files generated:
+ src/components/UserCard/UserCard.tsx
+ src/components/UserCard/UserCard.test.tsx
+ src/components/UserCard/UserCard.stories.tsx
+ src/components/UserCard/index.ts
```

### Generated Component Example

```tsx
// src/components/UserCard/UserCard.tsx
'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

export interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  onClick?: () => void;
  className?: string;
}

export const UserCard = memo(function UserCard({
  user,
  onClick,
  className,
}: UserCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm',
        'hover:shadow-md transition-shadow',
        'dark:bg-card-dark dark:border-gray-700',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-3">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-medium text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h3 className="font-medium text-foreground">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
    </div>
  );
});
```

---

## Form Wizard

Generate forms with validation and submission handling.

### Usage

```bash
rana generate form
```

### Options

| Option | Choices |
|--------|---------|
| Library | React Hook Form, Formik, Native state |
| Validation | Zod, Yup, Built-in |
| Fields | name:type pairs (email:email, password:password) |
| Features | Server action, API submission, Loading, Errors, Multi-step |

### Example Output

```
# Files generated:
+ src/components/ContactForm/ContactForm.tsx
+ src/components/ContactForm/schema.ts
+ src/components/ContactForm/ContactForm.test.tsx
```

### Generated Form Example

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export function LoginForm({ onSubmit }: { onSubmit: (data: FormData) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## Authentication Wizard

Generate complete authentication flows.

### Usage

```bash
rana generate auth
```

### Options

| Option | Choices |
|--------|---------|
| Provider | NextAuth.js, Clerk, Supabase, Custom JWT, Firebase |
| Methods | Email/Password, Google, GitHub, Magic Link, Phone, Apple |
| Features | Login, Register, Forgot password, Email verification, Middleware, Profile, Sessions, Roles |

### Example Output

```
# Files generated:
+ src/app/api/auth/[...nextauth]/route.ts
+ src/app/(auth)/login/page.tsx
+ src/app/(auth)/register/page.tsx
+ src/app/(auth)/forgot-password/page.tsx
+ src/lib/auth.ts
+ src/middleware.ts
+ src/components/auth/LoginForm.tsx
+ src/components/auth/RegisterForm.tsx
```

---

## Dashboard Wizard

Generate admin dashboards with charts and data tables.

### Usage

```bash
rana generate dashboard
```

### Options

| Option | Choices |
|--------|---------|
| Widgets | Stats cards, Line/Bar/Pie charts, Data table, Activity feed, Calendar |
| Chart Library | Recharts, Chart.js, Tremor, Nivo |
| Features | Sidebar, Dark mode, Real-time, Export, Date filter, Search, Responsive |

### Example Output

```
# Files generated:
+ src/app/dashboard/page.tsx
+ src/app/dashboard/layout.tsx
+ src/components/dashboard/Sidebar.tsx
+ src/components/dashboard/StatsCard.tsx
+ src/components/dashboard/LineChart.tsx
+ src/components/dashboard/DataTable.tsx
+ src/components/dashboard/DateRangePicker.tsx
```

---

## Feature Wizard

Generate complete full-stack features.

### Usage

```bash
rana generate feature
```

### Options

| Option | Choices |
|--------|---------|
| Framework | Next.js, React + Express, React + Fastify |
| Layers | Database, API, UI, Pages, Unit tests, E2E tests |
| Security | Auth, Authorization, Validation, Rate limiting, CSRF |

### Example

**Input:** "User management with roles"

**Output:**
```
# Files generated:
+ prisma/schema.prisma (User, Role models)
+ src/app/api/users/route.ts
+ src/app/api/users/[id]/route.ts
+ src/app/users/page.tsx
+ src/app/users/[id]/page.tsx
+ src/components/users/UserList.tsx
+ src/components/users/UserForm.tsx
+ src/lib/validations/user.ts
+ tests/api/users.test.ts
+ tests/components/UserList.test.tsx
```

---

## SDK Usage

All wizards can be used programmatically:

```typescript
import {
  generate,
  parseIntent,
  createPlan,
  generateFromPlan,
} from '@rana/generate';

// High-level API
const result = await generate('User authentication with OAuth', {
  framework: 'next',
  includeTests: true,
  autoFix: true,
});

console.log(result.files);      // Generated files
console.log(result.plan);       // Implementation plan
console.log(result.validation); // Quality check results

// Step-by-step API
const intent = await parseIntent('Create a blog with posts and comments');
const plan = await createPlan(intent, { cwd: process.cwd() });
const files = await generateFromPlan(plan);
```

---

## See Also

- [Code Generation Templates Guide](./CODE_GENERATION_TEMPLATES_GUIDE.md)
- [Natural Language Code Generation Spec](./NATURAL_LANGUAGE_CODE_GENERATION_SPEC.md)
- [@rana/generate Package](../packages/generate/)
