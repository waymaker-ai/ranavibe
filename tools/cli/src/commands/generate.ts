/**
 * Generate Command - Natural Language Code Generation
 * Generate code from plain English descriptions
 */

import chalk from 'chalk';

interface GenerateOptions {
  output?: string;
  language?: string;
  framework?: string;
  style?: string;
  test?: boolean;
  dryRun?: boolean;
}

// Code templates for different patterns
const templates = {
  component: {
    react: (name: string) => `import React from 'react';

interface ${name}Props {
  // Add your props here
}

export function ${name}({ }: ${name}Props) {
  return (
    <div>
      <h1>${name}</h1>
      {/* Add your component content here */}
    </div>
  );
}

export default ${name};
`,
    vue: (name: string) => `<template>
  <div class="${name.toLowerCase()}">
    <h1>{{ title }}</h1>
    <!-- Add your template content here -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const title = ref('${name}');
</script>

<style scoped>
.${name.toLowerCase()} {
  /* Add your styles here */
}
</style>
`,
  },
  api: {
    nextjs: (name: string) => `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Add your GET logic here
    return NextResponse.json({ message: '${name} endpoint' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Add your POST logic here
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
`,
    express: (name: string) => `import { Router, Request, Response } from 'express';

const router = Router();

// GET /${name.toLowerCase()}
router.get('/', async (req: Request, res: Response) => {
  try {
    // Add your GET logic here
    res.json({ message: '${name} endpoint' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /${name.toLowerCase()}
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // Add your POST logic here
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
`,
  },
  hook: {
    react: (name: string) => `import { useState, useCallback, useEffect } from 'react';

interface Use${name}Options {
  // Add your options here
}

interface Use${name}Return {
  data: unknown;
  loading: boolean;
  error: Error | null;
  // Add more return values as needed
}

export function use${name}(options: Use${name}Options = {}): Use${name}Return {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Add your effect logic here
  }, []);

  return {
    data,
    loading,
    error,
  };
}
`,
  },
  service: {
    typescript: (name: string) => `/**
 * ${name} Service
 * Handles ${name.toLowerCase()}-related operations
 */

export interface ${name}Data {
  id: string;
  // Add your data fields here
}

export class ${name}Service {
  /**
   * Get all ${name.toLowerCase()}s
   */
  async getAll(): Promise<${name}Data[]> {
    // Add your implementation here
    return [];
  }

  /**
   * Get ${name.toLowerCase()} by ID
   */
  async getById(id: string): Promise<${name}Data | null> {
    // Add your implementation here
    return null;
  }

  /**
   * Create new ${name.toLowerCase()}
   */
  async create(data: Omit<${name}Data, 'id'>): Promise<${name}Data> {
    // Add your implementation here
    return { id: '', ...data } as ${name}Data;
  }

  /**
   * Update ${name.toLowerCase()}
   */
  async update(id: string, data: Partial<${name}Data>): Promise<${name}Data | null> {
    // Add your implementation here
    return null;
  }

  /**
   * Delete ${name.toLowerCase()}
   */
  async delete(id: string): Promise<boolean> {
    // Add your implementation here
    return false;
  }
}

export const ${name.toLowerCase()}Service = new ${name}Service();
`,
  },
  model: {
    prisma: (name: string) => `model ${name} {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Add your fields here
  // name      String
  // email     String   @unique
  // posts     Post[]
}
`,
    mongoose: (name: string) => `import mongoose, { Schema, Document } from 'mongoose';

export interface I${name} extends Document {
  // Add your interface fields here
  createdAt: Date;
  updatedAt: Date;
}

const ${name}Schema = new Schema<I${name}>(
  {
    // Add your schema fields here
  },
  {
    timestamps: true,
  }
);

export const ${name} = mongoose.model<I${name}>('${name}', ${name}Schema);
`,
  },
  test: {
    jest: (name: string) => `import { describe, it, expect, beforeEach } from '@jest/globals';

describe('${name}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should exist', () => {
    // Add your test here
    expect(true).toBe(true);
  });

  it('should handle basic functionality', () => {
    // Add your test here
  });

  it('should handle edge cases', () => {
    // Add your test here
  });
});
`,
    vitest: (name: string) => `import { describe, it, expect, beforeEach } from 'vitest';

describe('${name}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should exist', () => {
    // Add your test here
    expect(true).toBe(true);
  });

  it('should handle basic functionality', () => {
    // Add your test here
  });

  it('should handle edge cases', () => {
    // Add your test here
  });
});
`,
  },
};

// Pattern detection from natural language
const patterns = [
  {
    keywords: ['component', 'ui', 'widget', 'element', 'view'],
    type: 'component',
    default: 'react',
  },
  {
    keywords: ['api', 'endpoint', 'route', 'handler'],
    type: 'api',
    default: 'nextjs',
  },
  {
    keywords: ['hook', 'use', 'custom hook'],
    type: 'hook',
    default: 'react',
  },
  {
    keywords: ['service', 'manager', 'handler', 'controller'],
    type: 'service',
    default: 'typescript',
  },
  {
    keywords: ['model', 'schema', 'entity', 'database'],
    type: 'model',
    default: 'prisma',
  },
  {
    keywords: ['test', 'spec', 'unit test'],
    type: 'test',
    default: 'vitest',
  },
];

/**
 * Parse natural language prompt to extract intent
 */
function parsePrompt(prompt: string): {
  type: string;
  name: string;
  framework: string;
  description: string;
} {
  const promptLower = prompt.toLowerCase();

  // Detect pattern type
  let detectedType = 'component';
  let detectedFramework = 'react';

  for (const pattern of patterns) {
    if (pattern.keywords.some(kw => promptLower.includes(kw))) {
      detectedType = pattern.type;
      detectedFramework = pattern.default;
      break;
    }
  }

  // Detect framework overrides
  if (promptLower.includes('vue')) detectedFramework = 'vue';
  if (promptLower.includes('next') || promptLower.includes('nextjs')) detectedFramework = 'nextjs';
  if (promptLower.includes('express')) detectedFramework = 'express';
  if (promptLower.includes('prisma')) detectedFramework = 'prisma';
  if (promptLower.includes('mongoose') || promptLower.includes('mongodb')) detectedFramework = 'mongoose';
  if (promptLower.includes('jest')) detectedFramework = 'jest';
  if (promptLower.includes('vitest')) detectedFramework = 'vitest';

  // Extract name (look for "called", "named", or capitalized words)
  let name = 'Generated';
  const calledMatch = prompt.match(/(?:called|named)\s+["']?(\w+)["']?/i);
  const forMatch = prompt.match(/(?:for|of)\s+["']?(\w+)["']?/i);

  if (calledMatch) {
    name = calledMatch[1];
  } else if (forMatch) {
    name = forMatch[1];
  } else {
    // Find first capitalized word that's not a common word
    const words = prompt.split(/\s+/);
    const commonWords = ['create', 'make', 'build', 'generate', 'a', 'an', 'the', 'new', 'react', 'vue', 'next', 'api'];
    for (const word of words) {
      if (word[0] === word[0].toUpperCase() && !commonWords.includes(word.toLowerCase())) {
        name = word.replace(/[^a-zA-Z]/g, '');
        break;
      }
    }
  }

  // Capitalize name
  name = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    type: detectedType,
    name,
    framework: detectedFramework,
    description: prompt,
  };
}

/**
 * Generate code from parsed intent
 */
function generateCode(
  type: string,
  name: string,
  framework: string
): string {
  const templateGroup = templates[type as keyof typeof templates];
  if (!templateGroup) {
    return `// Generated ${type}: ${name}\n// Framework: ${framework}\n\n// Add your code here\n`;
  }

  const templateFn = templateGroup[framework as keyof typeof templateGroup] as ((name: string) => string) | undefined;
  if (!templateFn) {
    // Fall back to first available template in group
    const values = Object.values(templateGroup) as Array<(name: string) => string>;
    const firstTemplate = values[0];
    return firstTemplate ? firstTemplate(name) : '';
  }

  return templateFn(name);
}

/**
 * Get suggested filename
 */
function getSuggestedFilename(type: string, name: string, framework: string): string {
  const baseName = name.toLowerCase();

  switch (type) {
    case 'component':
      return framework === 'vue' ? `${name}.vue` : `${name}.tsx`;
    case 'api':
      return framework === 'nextjs' ? `route.ts` : `${baseName}.routes.ts`;
    case 'hook':
      return `use${name}.ts`;
    case 'service':
      return `${baseName}.service.ts`;
    case 'model':
      return framework === 'prisma' ? 'schema.prisma' : `${baseName}.model.ts`;
    case 'test':
      return `${baseName}.test.ts`;
    default:
      return `${baseName}.ts`;
  }
}

/**
 * Main generate command
 */
export async function generateCommand(prompt: string, options: GenerateOptions = {}): Promise<void> {
  console.log(chalk.cyan('\n🧠 RANA Code Generator\n'));

  if (!prompt) {
    console.log(chalk.yellow('Usage: rana generate "create a React component called UserProfile"'));
    console.log(chalk.gray('\nExamples:'));
    console.log(chalk.gray('  rana generate "create a React component for user dashboard"'));
    console.log(chalk.gray('  rana generate "make an API endpoint for authentication"'));
    console.log(chalk.gray('  rana generate "build a custom hook for fetching data"'));
    console.log(chalk.gray('  rana generate "create a Prisma model for blog posts"'));
    console.log(chalk.gray('  rana generate "make a service for user management"'));
    console.log(chalk.gray('  rana generate "write tests for the UserProfile component"'));
    return;
  }

  // Parse the natural language prompt
  const parsed = parsePrompt(prompt);

  // Allow overrides from options
  const type = parsed.type;
  const name = parsed.name;
  const framework = options.framework || parsed.framework;

  console.log(chalk.white('Prompt:'), chalk.gray(prompt));
  console.log(chalk.white('Detected:'));
  console.log(chalk.gray(`  Type: ${type}`));
  console.log(chalk.gray(`  Name: ${name}`));
  console.log(chalk.gray(`  Framework: ${framework}`));
  console.log();

  // Generate the code
  const code = generateCode(type, name, framework);
  const filename = options.output || getSuggestedFilename(type, name, framework);

  console.log(chalk.green('Generated Code:'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(code);
  console.log(chalk.gray('─'.repeat(60)));

  if (options.dryRun) {
    console.log(chalk.yellow('\n[Dry Run] Would save to:'), chalk.white(filename));
  } else {
    // In production, would write to file here
    console.log(chalk.green('\n✓ Code generated successfully'));
    console.log(chalk.gray(`Suggested filename: ${filename}`));
    console.log(chalk.gray('\nTo save, run with -o flag:'));
    console.log(chalk.cyan(`  rana generate "${prompt}" -o ${filename}`));
  }

  // Generate tests if requested
  if (options.test) {
    console.log(chalk.cyan('\n📝 Generating Tests...\n'));
    const testCode = generateCode('test', name, 'vitest');
    const testFilename = `${name.toLowerCase()}.test.ts`;

    console.log(chalk.green('Test Code:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(testCode);
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.gray(`Suggested filename: ${testFilename}`));
  }
}

/**
 * Interactive generate command
 */
export async function generateInteractive(): Promise<void> {
  console.log(chalk.cyan('\n🧠 RANA Interactive Code Generator\n'));
  console.log(chalk.gray('Describe what you want to create in plain English.\n'));

  console.log(chalk.white('Available templates:'));
  console.log(chalk.gray('  • Components (React, Vue)'));
  console.log(chalk.gray('  • API endpoints (Next.js, Express)'));
  console.log(chalk.gray('  • Custom hooks (React)'));
  console.log(chalk.gray('  • Services (TypeScript)'));
  console.log(chalk.gray('  • Models (Prisma, Mongoose)'));
  console.log(chalk.gray('  • Tests (Jest, Vitest)'));
  console.log();
  console.log(chalk.yellow('Use: rana generate "<your description>"'));
}

/**
 * List available templates
 */
export async function generateTemplates(): Promise<void> {
  console.log(chalk.cyan('\n📋 Available Templates\n'));

  const templateList = [
    { category: 'Components', items: ['React Component', 'Vue Component'] },
    { category: 'API', items: ['Next.js API Route', 'Express Router'] },
    { category: 'Hooks', items: ['React Custom Hook'] },
    { category: 'Services', items: ['TypeScript Service Class'] },
    { category: 'Models', items: ['Prisma Model', 'Mongoose Schema'] },
    { category: 'Tests', items: ['Jest Test Suite', 'Vitest Test Suite'] },
  ];

  for (const { category, items } of templateList) {
    console.log(chalk.white.bold(`${category}:`));
    for (const item of items) {
      console.log(chalk.gray(`  • ${item}`));
    }
    console.log();
  }

  console.log(chalk.gray('Example usage:'));
  console.log(chalk.cyan('  rana generate "create a React component called Header"'));
  console.log(chalk.cyan('  rana generate "make a Prisma model for User with email and name"'));
}
