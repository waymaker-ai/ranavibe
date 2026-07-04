import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Testing Your Agents | Building AI Agents',
  description: 'Learn unit testing tools, mocking LLM responses, integration testing, snapshot testing agent outputs, and CI integration.',
};

export default function Lesson11Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 11 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Testing Your Agents</h1>
          <p className="lead">
            AI agents are inherently non-deterministic, which makes testing challenging. But untested
            agents break in production. This lesson covers practical strategies for testing every
            layer of your agent -- from individual tools to full end-to-end flows.
          </p>

          <h2>Unit Testing Tools</h2>
          <p>
            Tools are pure functions with clear inputs and outputs, making them the easiest part of
            an agent to test. Test each tool independently:
          </p>
          <div className="code-block"><pre><code>{`import { describe, it, expect, vi } from 'vitest';
import { calculatorTool } from './tools/calculator';
import { searchTool } from './tools/search';

describe('calculatorTool', () => {
  it('evaluates simple expressions', async () => {
    const result = await calculatorTool.execute({ expression: '2 + 3' });
    expect(JSON.parse(result)).toEqual({ result: 5 });
  });

  it('handles division by zero', async () => {
    const result = await calculatorTool.execute({ expression: '1 / 0' });
    expect(JSON.parse(result)).toEqual({ result: Infinity });
  });

  it('rejects invalid expressions', async () => {
    await expect(
      calculatorTool.execute({ expression: 'drop table users' })
    ).rejects.toThrow();
  });
});

describe('searchTool', () => {
  it('returns structured results', async () => {
    // Mock the fetch call
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        results: [{ title: 'Test', url: 'https://example.com', snippet: 'A result' }],
      }))
    );

    const result = await searchTool.execute({ query: 'test query', maxResults: 1 });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toHaveProperty('title');
    expect(parsed[0]).toHaveProperty('url');
  });
});`}</code></pre></div>

          <h2>Mocking LLM Responses</h2>
          <p>
            CoFounder provides a mock LLM client for testing. It lets you define predetermined
            responses so your tests are deterministic and free:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, createMockLLM } from '@waymakerai/aicofounder-core';

const mockLLM = createMockLLM({
  responses: [
    // First LLM call: agent decides to use a tool
    {
      content: null,
      toolCalls: [
        { name: 'web_search', arguments: { query: 'React 19 features', maxResults: 3 } },
      ],
    },
    // Second call: agent produces final answer
    {
      content: 'React 19 introduces several new features including...',
      toolCalls: [],
    },
  ],
});

const agent = createAgent({
  name: 'test-agent',
  model: 'mock',
  llmClient: mockLLM,
  tools: [searchTool],
});

const result = await agent.run('What are the new features in React 19?');
expect(result.output).toContain('React 19');
expect(mockLLM.callCount).toBe(2);`}</code></pre></div>

          <h2>Integration Testing</h2>
          <p>
            Integration tests verify that tools work correctly when orchestrated by the agent.
            Use the mock LLM to control the agent&apos;s decisions while using real tool implementations:
          </p>
          <div className="code-block"><pre><code>{`import { describe, it, expect } from 'vitest';
import { createAgent, createMockLLM } from '@waymakerai/aicofounder-core';
import { databaseTool } from './tools/database';
import { setupTestDatabase, teardownTestDatabase } from './test-utils';

describe('Agent + Database Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase(); // Seed test data
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('queries the database and summarizes results', async () => {
    const mockLLM = createMockLLM({
      responses: [
        {
          content: null,
          toolCalls: [
            { name: 'query_database', arguments: { table: 'products', filters: { category: 'electronics' } } },
          ],
        },
        {
          content: 'Found 3 electronics products in the database.',
          toolCalls: [],
        },
      ],
    });

    const agent = createAgent({
      name: 'db-agent',
      model: 'mock',
      llmClient: mockLLM,
      tools: [databaseTool],
    });

    const result = await agent.run('List electronics products');
    expect(result.output).toContain('electronics');
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].toolCalls[0].name).toBe('query_database');
  });
});`}</code></pre></div>

          <h2>Snapshot Testing Agent Outputs</h2>
          <p>
            For agents that produce structured output (like code, reports, or JSON), snapshot
            tests catch unexpected changes:
          </p>
          <ul>
            <li>Snapshot the tool call sequence (which tools were called, in what order, with what arguments).</li>
            <li>Snapshot structured output formats (JSON shape, required fields).</li>
            <li>Avoid snapshotting natural language output -- it varies too much even with low temperature.</li>
          </ul>

          <h2>CI Integration</h2>
          <p>
            Add agent tests to your CI pipeline. Use mock LLMs for fast, free tests that run on
            every commit. Reserve integration tests with real LLM calls for nightly or pre-release
            pipelines to manage cost:
          </p>
          <div className="code-block"><pre><code>{`// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run --dir tests/unit",
    "test:integration": "vitest run --dir tests/integration",
    "test:e2e": "REAL_LLM=true vitest run --dir tests/e2e"
  }
}

// vitest.config.ts
export default {
  test: {
    testTimeout: 30000, // Agent tests need longer timeouts
    env: {
      MOCK_LLM: process.env.REAL_LLM ? 'false' : 'true',
    },
  },
};`}</code></pre></div>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-10" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Error Handling Strategies
          </Link>
          <Link href="/training/building-agents/lesson-12" className="btn-primary px-6 py-3 group">
            Next: Agent Best Practices
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
