import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Creating Custom Tools | Building AI Agents',
  description: 'Learn the Tool interface, define tools with schemas, validate input with Zod, and handle errors in async tool execution.',
};

export default function Lesson3Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 3 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Creating Custom Tools</h1>
          <p className="lead">
            Tools are what give agents their power. A tool is a function that an agent can call
            to interact with the outside world -- fetching data, running calculations, writing files,
            or calling APIs. In this lesson, you will learn how to define, validate, and implement
            custom tools using CoFounder&apos;s tool interface.
          </p>

          <h2>The Tool Interface</h2>
          <p>
            Every tool in CoFounder implements the <code>Tool</code> interface. It requires four pieces:
            a name, a description the LLM uses to decide when to call it, a parameter schema, and
            an execute function.
          </p>
          <div className="code-block"><pre><code>{`import { Tool } from '@waymakerai/aicofounder-core';

const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Perform basic arithmetic calculations. Use this when you need exact math results.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'A mathematical expression like "2 + 2" or "15 * 3.14"',
      },
    },
    required: ['expression'],
  },
  execute: async ({ expression }) => {
    const result = Function(\`"use strict"; return (\${expression})\`)();
    return JSON.stringify({ result });
  },
};`}</code></pre></div>
          <p>
            The description is critical -- it tells the LLM when and why to use this tool. Be specific
            about what the tool does and when it should be chosen over other tools.
          </p>

          <h2>Input Validation with Zod</h2>
          <p>
            LLMs sometimes produce malformed tool arguments. CoFounder integrates with Zod so you can
            validate inputs before execution:
          </p>
          <div className="code-block"><pre><code>{`import { Tool, createToolWithValidation } from '@waymakerai/aicofounder-core';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  maxResults: z.number().int().min(1).max(20).default(5),
  language: z.enum(['en', 'es', 'fr', 'de']).default('en'),
});

const searchTool = createToolWithValidation({
  name: 'web_search',
  description: 'Search the web for information. Returns titles, URLs, and snippets.',
  schema: searchSchema,
  execute: async ({ query, maxResults, language }) => {
    const results = await performSearch(query, { maxResults, language });
    return JSON.stringify(results);
  },
});`}</code></pre></div>
          <p>
            When validation fails, CoFounder automatically returns a structured error to the agent
            so it can retry with corrected parameters.
          </p>

          <h2>Async Tool Execution</h2>
          <p>
            All tool execute functions are async by default. This lets you call external APIs, query
            databases, or perform any I/O operation:
          </p>
          <div className="code-block"><pre><code>{`import { Tool } from '@waymakerai/aicofounder-core';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const databaseQueryTool: Tool = {
  name: 'query_database',
  description: 'Query the product database. Use this to look up product details, inventory, or pricing.',
  parameters: {
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name to query' },
      filters: { type: 'object', description: 'Key-value pairs for WHERE clauses' },
      limit: { type: 'number', description: 'Max rows to return' },
    },
    required: ['table'],
  },
  execute: async ({ table, filters = {}, limit = 10 }) => {
    let query = supabase.from(table).select('*').limit(limit);
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return JSON.stringify(data);
  },
};`}</code></pre></div>

          <h2>Error Handling in Tools</h2>
          <p>
            Robust tools handle errors gracefully. There are two strategies:
          </p>
          <ul>
            <li><strong>Throw errors</strong> -- CoFounder catches them and passes the error message back to the agent, which can decide to retry or use a different approach.</li>
            <li><strong>Return error objects</strong> -- For expected failure modes, return a structured error response so the agent can reason about it.</li>
          </ul>
          <p>
            The best practice is to throw for unexpected errors (network failures, auth issues) and
            return structured messages for expected ones (no results found, invalid input):
          </p>
          <div className="code-block"><pre><code>{`execute: async ({ url }) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      return JSON.stringify({
        error: true,
        message: \`HTTP \${response.status}: \${response.statusText}\`,
        suggestion: 'Try a different URL or check if the site is accessible.',
      });
    }
    const html = await response.text();
    return JSON.stringify({ content: extractText(html) });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return JSON.stringify({ error: true, message: 'Request timed out after 10 seconds.' });
    }
    throw err; // Unexpected error -- let CoFounder handle it
  }
}`}</code></pre></div>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-2" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Agent Configuration Deep Dive
          </Link>
          <Link href="/training/building-agents/lesson-4" className="btn-primary px-6 py-3 group">
            Next: Tool Execution Patterns
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
