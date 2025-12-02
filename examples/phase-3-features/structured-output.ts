/**
 * Structured Output Example
 * Demonstrates schema-based LLM response generation and validation
 */

import { StructuredOutput, SchemaGenerator } from '@rana/core';
import { z } from 'zod';

async function main() {
  // Example 1: Basic structured output with Zod schema
  console.log('=== Zod Schema Generation ===');

  const PersonSchema = z.object({
    name: z.string().describe('Full name of the person'),
    age: z.number().min(0).max(150).describe('Age in years'),
    email: z.string().email().describe('Email address'),
    occupation: z.string().optional().describe('Current job title'),
    skills: z.array(z.string()).describe('List of skills'),
    experience: z.object({
      years: z.number(),
      level: z.enum(['junior', 'mid', 'senior', 'lead']),
    }),
  });

  const generator = new StructuredOutput({
    model: 'gpt-4o',
    schema: PersonSchema,
    maxRetries: 3,
  });

  const person = await generator.generate({
    prompt: `Extract the person information from this text:
      John Doe is a 32-year-old senior software engineer at TechCorp.
      You can reach him at john.doe@techcorp.com. He has 8 years of
      experience and is skilled in TypeScript, React, Node.js, and Python.`,
  });

  console.log('Extracted person:', JSON.stringify(person, null, 2));

  // Example 2: JSON Schema
  console.log('\n=== JSON Schema Generation ===');

  const jsonSchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      dueDate: { type: 'string', format: 'date' },
      assignees: {
        type: 'array',
        items: { type: 'string' },
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['title', 'priority'],
  };

  const taskGenerator = new StructuredOutput({
    model: 'claude-3-5-sonnet',
    schema: jsonSchema,
  });

  const task = await taskGenerator.generate({
    prompt: 'Create a task for implementing user authentication with OAuth2',
  });

  console.log('Generated task:', JSON.stringify(task, null, 2));

  // Example 3: Complex nested schema
  console.log('\n=== Complex Nested Schema ===');

  const APISchema = z.object({
    endpoint: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    description: z.string(),
    parameters: z.array(z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
      required: z.boolean(),
      description: z.string(),
    })),
    requestBody: z.object({
      contentType: z.string(),
      schema: z.record(z.any()),
    }).optional(),
    responses: z.array(z.object({
      status: z.number(),
      description: z.string(),
      schema: z.record(z.any()).optional(),
    })),
    authentication: z.enum(['none', 'api-key', 'bearer', 'oauth2']),
    rateLimit: z.object({
      requests: z.number(),
      period: z.string(),
    }).optional(),
  });

  const apiGenerator = new StructuredOutput({
    schema: APISchema,
    temperature: 0.2, // Lower temperature for more consistent output
  });

  const apiSpec = await apiGenerator.generate({
    prompt: 'Generate an API specification for a user registration endpoint',
  });

  console.log('API Specification:', JSON.stringify(apiSpec, null, 2));

  // Example 4: Partial extraction
  console.log('\n=== Partial Extraction ===');

  const partialGenerator = new StructuredOutput({
    schema: PersonSchema,
    partialExtraction: true, // Extract what's available even if incomplete
    requireAllFields: false,
  });

  const partialPerson = await partialGenerator.generate({
    prompt: 'Extract from: "Alice works as a designer"',
  });

  console.log('Partial extraction:', JSON.stringify(partialPerson, null, 2));

  // Example 5: Array generation
  console.log('\n=== Array Generation ===');

  const ProductSchema = z.object({
    name: z.string(),
    price: z.number(),
    category: z.string(),
    inStock: z.boolean(),
  });

  const productsGenerator = new StructuredOutput({
    schema: z.array(ProductSchema),
    minItems: 3,
    maxItems: 5,
  });

  const products = await productsGenerator.generate({
    prompt: 'Generate a list of office supplies products',
  });

  console.log('Products:', JSON.stringify(products, null, 2));

  // Example 6: Schema inference from sample data
  console.log('\n=== Schema Inference ===');

  const sampleData = {
    orderId: 'ORD-12345',
    customer: {
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    items: [
      { productId: 'P1', quantity: 2, price: 29.99 },
      { productId: 'P2', quantity: 1, price: 49.99 },
    ],
    total: 109.97,
    status: 'pending',
    createdAt: '2024-01-15T10:30:00Z',
  };

  const inferredSchema = SchemaGenerator.fromSample(sampleData);
  console.log('Inferred schema:', JSON.stringify(inferredSchema, null, 2));

  // Generate Zod schema code
  const zodCode = SchemaGenerator.toZod(inferredSchema);
  console.log('\nGenerated Zod schema:\n', zodCode);

  // Generate TypeScript interface
  const tsInterface = SchemaGenerator.toTypeScript(inferredSchema, 'Order');
  console.log('\nGenerated TypeScript interface:\n', tsInterface);

  // Example 7: Validation with custom error handling
  console.log('\n=== Validation with Error Handling ===');

  const strictGenerator = new StructuredOutput({
    schema: PersonSchema,
    onValidationError: async (error, attempt, lastResponse) => {
      console.log(`Validation failed (attempt ${attempt}):`, error.message);
      console.log('Last response:', lastResponse);

      // Custom retry logic
      if (attempt < 3) {
        return {
          action: 'retry',
          feedback: `The response was invalid: ${error.message}. Please fix and try again.`,
        };
      }
      return { action: 'fail' };
    },
  });

  try {
    const result = await strictGenerator.generate({
      prompt: 'Extract person: Bob, age unknown, email bob@test',
    });
    console.log('Result:', result);
  } catch (error) {
    console.log('Failed after retries:', error.message);
  }

  // Example 8: Streaming structured output
  console.log('\n=== Streaming Structured Output ===');

  const streamGenerator = new StructuredOutput({
    schema: ProductSchema,
    streaming: true,
  });

  const stream = await streamGenerator.generateStream({
    prompt: 'Generate a product listing for a laptop',
  });

  for await (const partial of stream) {
    console.log('Partial result:', JSON.stringify(partial, null, 2));
  }
}

main().catch(console.error);
