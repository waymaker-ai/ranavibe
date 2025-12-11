# @rana/generate

Natural language code generation with 30+ templates and context-aware output.

## Installation

```bash
npm install @rana/generate
```

## Quick Start

```typescript
import { generate, listTemplates } from '@rana/generate';

// Generate from natural language
const code = await generate('create a login form with email and password');
console.log(code);

// Generate from template
const component = await generate({
  template: 'react-component',
  name: 'UserProfile',
  props: ['user', 'onUpdate']
});

// List available templates
const templates = listTemplates();
console.log(templates);
```

## Features

### Natural Language Generation

```typescript
// Simple description
const button = await generate('create a button component');

// Detailed requirements
const table = await generate(`
  Create a data table component with:
  - Sortable columns
  - Pagination (10, 25, 50 per page)
  - Row selection with checkboxes
  - Search/filter functionality
  - Export to CSV
`);
```

### Template-Based Generation

```typescript
// React component
const card = await generate({
  template: 'react-component',
  name: 'ProductCard',
  variables: {
    hasState: true,
    styling: 'tailwind'
  }
});

// API route
const api = await generate({
  template: 'nextjs-api-route',
  name: 'users/[id]',
  methods: ['GET', 'PUT', 'DELETE']
});

// Zustand store
const store = await generate({
  template: 'zustand-store',
  name: 'cart'
});
```

### Context-Aware Generation

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
//   testing: 'vitest'
// }

// Generate code matching your patterns
const code = await generate('user profile component', { context });
```

### Quality Validation

```typescript
const result = await generate('login form', {
  validate: true,
  fix: true
});

console.log(result.validation);
// {
//   passed: true,
//   checks: {
//     typescript: { passed: true },
//     eslint: { passed: true, fixed: 2 },
//     security: { passed: true }
//   }
// }
```

## Available Templates

### React

| Template | Description |
|----------|-------------|
| `react-component` | Functional component |
| `react-form` | Form with validation |
| `react-modal` | Modal/dialog |
| `react-data-table` | Data table |
| `react-hook` | Custom hook |

### Next.js

| Template | Description |
|----------|-------------|
| `nextjs-api-route` | API route handler |
| `nextjs-server-action` | Server actions |
| `nextjs-page` | Page component |
| `nextjs-layout` | Layout component |

### State Management

| Template | Description |
|----------|-------------|
| `zustand-store` | Zustand store |
| `react-context` | Context provider |
| `tanstack-query` | TanStack Query hooks |

### Testing

| Template | Description |
|----------|-------------|
| `vitest-component` | Component tests |
| `vitest-hook` | Hook tests |
| `vitest-api` | API tests |
| `playwright-e2e` | E2E tests |

### Database

| Template | Description |
|----------|-------------|
| `prisma-model` | Prisma schema |
| `drizzle-schema` | Drizzle schema |
| `supabase-migration` | SQL migration |

### Utilities

| Template | Description |
|----------|-------------|
| `utility-hook` | Utility hooks |
| `error-boundary` | Error boundary |
| `loading-skeleton` | Skeleton loader |

## Creating Custom Templates

```typescript
import { registerTemplate, Template } from '@rana/generate';

const myTemplate: Template = {
  id: 'my-template',
  name: 'My Template',
  description: 'Custom template',
  category: 'custom',

  variables: [
    { name: 'name', required: true },
    { name: 'includeTests', default: false }
  ],

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
  ]
};

registerTemplate(myTemplate);
```

## API Reference

### Generation

| Function | Description |
|----------|-------------|
| `generate(input)` | Generate code |
| `generateFromTemplate(template, vars)` | Template generation |
| `generateMultiple(inputs)` | Batch generation |

### Templates

| Function | Description |
|----------|-------------|
| `listTemplates()` | List all templates |
| `getTemplate(id)` | Get template by ID |
| `registerTemplate(template)` | Register custom template |
| `searchTemplates(query)` | Search templates |

### Context

| Function | Description |
|----------|-------------|
| `analyzeContext(path)` | Analyze codebase |
| `detectFramework(path)` | Detect framework |
| `detectPatterns(path)` | Detect code patterns |

### Validation

| Function | Description |
|----------|-------------|
| `validate(code)` | Validate generated code |
| `fix(code)` | Auto-fix issues |

## CLI Usage

```bash
# Generate from description
rana generate "create a button component"

# Use specific template
rana generate --template react-component "Button"

# List templates
rana templates

# Preview without writing
rana generate --dry-run "component"
```

## Documentation

- [Code Generation Templates Guide](../../docs/CODE_GENERATION_TEMPLATES_GUIDE.md)
- [Natural Language Code Generation Spec](../../docs/NATURAL_LANGUAGE_CODE_GENERATION_SPEC.md)
- [CLI Commands Reference](../../CLI_COMMANDS_REFERENCE.md)

## License

MIT
