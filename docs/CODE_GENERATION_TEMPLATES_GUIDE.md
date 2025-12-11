# Code Generation Templates Guide

RANA's code generation system provides 30+ templates for common patterns. This guide covers how to use built-in templates and create custom ones.

## Overview

The template system provides:
- **Pre-built Templates** - React, Next.js, API, database, testing patterns
- **Context-Aware Generation** - Analyzes your codebase for consistent output
- **Quality Validation** - Generated code passes RANA quality gates
- **Customization** - Extend or create your own templates

## Quick Start

### Using CLI

```bash
# Generate from description
rana generate "create a user profile component with avatar and bio"

# List available templates
rana templates

# Generate from specific template
rana generate --template react-component "UserProfile"

# Generate with options
rana generate --template api-route --method POST "create user"
```

### Using SDK

```typescript
import { generate, listTemplates, getTemplate } from '@rana/generate';

// Generate from natural language
const code = await generate('create a login form with email and password');

// Generate from template
const component = await generate({
  template: 'react-component',
  name: 'UserProfile',
  props: ['user', 'onUpdate']
});

// List templates
const templates = listTemplates();
```

## Built-in Templates

### React Component Templates

#### `react-component`
Basic React functional component with TypeScript.

```bash
rana generate --template react-component "ProductCard"
```

Output:
```typescript
interface ProductCardProps {
  // props
}

export function ProductCard({ }: ProductCardProps) {
  return (
    <div>
      {/* content */}
    </div>
  );
}
```

#### `react-form`
Form component with validation and submission.

```bash
rana generate --template react-form "ContactForm"
```

#### `react-modal`
Modal/dialog component with accessibility.

#### `react-data-table`
Data table with sorting, filtering, pagination.

#### `react-hook`
Custom React hook.

```bash
rana generate --template react-hook "useDebounce"
```

### Next.js Templates

#### `nextjs-api-route`
API route handler with validation.

```bash
rana generate --template nextjs-api-route "users/[id]"
```

Output:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = paramsSchema.parse(params);

  // Implementation

  return NextResponse.json({ id });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = paramsSchema.parse(params);
  const body = await request.json();

  // Implementation

  return NextResponse.json({ id, ...body });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = paramsSchema.parse(params);

  // Implementation

  return NextResponse.json({ deleted: true });
}
```

#### `nextjs-server-action`
Server actions for forms and mutations.

```bash
rana generate --template nextjs-server-action "createPost"
```

Output:
```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export async function createPost(formData: FormData) {
  const data = createPostSchema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  // Implementation

  revalidatePath('/posts');
  return { success: true };
}
```

#### `nextjs-page`
Page component with metadata.

#### `nextjs-layout`
Layout component with providers.

### State Management Templates

#### `zustand-store`
Zustand store with TypeScript.

```bash
rana generate --template zustand-store "cart"
```

Output:
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        total: 0,

        addItem: (item) => set((state) => {
          const existing = state.items.find(i => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
              total: state.total + item.price,
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
            total: state.total + item.price,
          };
        }),

        removeItem: (id) => set((state) => {
          const item = state.items.find(i => i.id === id);
          return {
            items: state.items.filter(i => i.id !== id),
            total: state.total - (item ? item.price * item.quantity : 0),
          };
        }),

        updateQuantity: (id, quantity) => set((state) => {
          const item = state.items.find(i => i.id === id);
          if (!item) return state;
          const diff = (quantity - item.quantity) * item.price;
          return {
            items: state.items.map(i =>
              i.id === id ? { ...i, quantity } : i
            ),
            total: state.total + diff,
          };
        }),

        clearCart: () => set({ items: [], total: 0 }),
      }),
      { name: 'cart-storage' }
    )
  )
);
```

#### `react-context`
React Context provider with TypeScript.

#### `tanstack-query`
TanStack Query hooks for data fetching.

```bash
rana generate --template tanstack-query "users"
```

### Testing Templates

#### `vitest-component`
Vitest component test with React Testing Library.

```bash
rana generate --template vitest-component "ProductCard"
```

Output:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const defaultProps = {
    id: '1',
    name: 'Test Product',
    price: 29.99,
    onAddToCart: vi.fn(),
  };

  it('renders product information', () => {
    render(<ProductCard {...defaultProps} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when button clicked', () => {
    render(<ProductCard {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(defaultProps.onAddToCart).toHaveBeenCalledWith('1');
  });

  it('disables button when out of stock', () => {
    render(<ProductCard {...defaultProps} inStock={false} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### `playwright-e2e`
Playwright end-to-end test.

```bash
rana generate --template playwright-e2e "checkout-flow"
```

#### `vitest-hook`
Custom hook test.

#### `vitest-api`
API endpoint test.

### Database Templates

#### `prisma-model`
Prisma schema model with relations.

#### `drizzle-schema`
Drizzle ORM schema.

#### `supabase-migration`
Supabase SQL migration.

### Utility Templates

#### `utility-hook`
Reusable utility hook.

```bash
rana generate --template utility-hook "useLocalStorage"
```

#### `error-boundary`
React error boundary component.

#### `loading-skeleton`
Loading skeleton component.

### Agent Templates

#### `rana-agent`
RANA agent with tools.

```bash
rana generate --template rana-agent "research-agent"
```

#### `mcp-server`
MCP server scaffold.

#### `langchain-chain`
LangChain chain setup.

## Template Variables

Templates support variables for customization:

```typescript
await generate({
  template: 'react-component',
  variables: {
    name: 'ProductCard',
    hasState: true,
    hasEffects: false,
    props: ['product', 'onBuy'],
    styling: 'tailwind'
  }
});
```

Common variables:

| Variable | Description |
|----------|-------------|
| `name` | Component/function name |
| `props` | List of props/parameters |
| `hasState` | Include useState |
| `hasEffects` | Include useEffect |
| `styling` | CSS approach (tailwind, styled, css-modules) |
| `validation` | Validation library (zod, yup) |
| `testing` | Include test file |

## Context-Aware Generation

RANA analyzes your codebase for consistent output:

```typescript
import { generate, analyzeContext } from '@rana/generate';

// Analyze codebase patterns
const context = await analyzeContext('./src');
console.log(context);
// {
//   framework: 'next.js',
//   styling: 'tailwind',
//   stateManagement: 'zustand',
//   validation: 'zod',
//   testing: 'vitest',
//   patterns: { components: 'functional', exports: 'named' }
// }

// Generate with context
const code = await generate('user profile component', { context });
// Output matches your codebase patterns
```

## Creating Custom Templates

### Template Structure

```typescript
import { Template } from '@rana/generate';

export const myTemplate: Template = {
  id: 'my-custom-template',
  name: 'My Custom Template',
  description: 'Description of what this generates',
  category: 'custom',

  // Variables the template accepts
  variables: [
    { name: 'name', required: true, description: 'Component name' },
    { name: 'includeTests', default: false }
  ],

  // File(s) to generate
  files: [
    {
      path: '{{kebabCase name}}.tsx',
      content: `
import React from 'react';

export function {{pascalCase name}}() {
  return <div>{{name}}</div>;
}
      `.trim()
    }
  ],

  // Optional: Additional files based on conditions
  conditionalFiles: [
    {
      condition: 'includeTests',
      file: {
        path: '{{kebabCase name}}.test.tsx',
        content: `/* test file */`
      }
    }
  ]
};
```

### Register Custom Template

```typescript
import { registerTemplate } from '@rana/generate';
import { myTemplate } from './my-template';

registerTemplate(myTemplate);

// Now available via CLI and SDK
// rana generate --template my-custom-template "MyComponent"
```

### Template Helpers

Available in template strings:

| Helper | Example Input | Output |
|--------|---------------|--------|
| `pascalCase` | `user profile` | `UserProfile` |
| `camelCase` | `user profile` | `userProfile` |
| `kebabCase` | `user profile` | `user-profile` |
| `snakeCase` | `user profile` | `user_profile` |
| `upperCase` | `user profile` | `USER PROFILE` |
| `lowerCase` | `User Profile` | `user profile` |
| `pluralize` | `user` | `users` |
| `singularize` | `users` | `user` |

## Quality Validation

Generated code automatically runs through quality gates:

```typescript
const result = await generate('login form', {
  validate: true,  // Default: true
  fix: true        // Auto-fix issues
});

console.log(result.validation);
// {
//   passed: true,
//   checks: {
//     typescript: { passed: true },
//     eslint: { passed: true, fixed: 2 },
//     security: { passed: true },
//     accessibility: { passed: true }
//   }
// }
```

## Natural Language Generation

Beyond templates, generate from descriptions:

```typescript
// Simple description
await generate('create a button component');

// Detailed requirements
await generate(`
  Create a data table component with:
  - Sortable columns
  - Pagination (10, 25, 50 per page)
  - Row selection with checkboxes
  - Search/filter functionality
  - Export to CSV
  - Mobile responsive
`);

// With context
await generate('add authentication middleware', {
  context: {
    framework: 'express',
    auth: 'jwt'
  }
});
```

## Advanced Features

### Multi-File Generation

```typescript
await generate({
  template: 'feature',
  name: 'user-management',
  // Generates:
  // - components/UserList.tsx
  // - components/UserForm.tsx
  // - hooks/useUsers.ts
  // - api/users.ts
  // - types/user.ts
  // - tests/users.test.ts
});
```

### Import Management

Generated code automatically manages imports:

```typescript
const code = await generate('form with validation');
// Automatically adds:
// import { z } from 'zod';
// import { useForm } from 'react-hook-form';
// etc.
```

### IDE Integration

```typescript
// VS Code extension support
import { generateAtCursor } from '@rana/generate/vscode';

// Generates code at cursor position with context
await generateAtCursor(editor, 'add error handling');
```

## CLI Reference

```bash
# Generate from description
rana generate "description"

# Use specific template
rana generate --template <template-id> "name"

# List templates
rana templates
rana templates --category react
rana templates --search "form"

# Preview without writing
rana generate --dry-run "component"

# Specify output directory
rana generate --output ./src/components "component"

# Skip validation
rana generate --no-validate "quick prototype"

# Generate with specific framework context
rana generate --framework next.js "api route"
```

## Related Documentation

- [Natural Language Code Generation Spec](./NATURAL_LANGUAGE_CODE_GENERATION_SPEC.md)
- [CLI Commands Reference](../CLI_COMMANDS_REFERENCE.md)
- [VIBE Coding Standards](./VIBE_CODING_DESIGN_STANDARDS.md)
