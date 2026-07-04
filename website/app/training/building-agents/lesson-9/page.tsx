import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Building a Code Assistant | Building AI Agents',
  description: 'Full tutorial: build a code review agent with file reading, code analysis, diff generation, and test writing capabilities.',
};

export default function Lesson9Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 9 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Building a Code Assistant</h1>
          <p className="lead">
            In this hands-on tutorial, you will build a code assistant agent that can read files,
            analyze code structure, generate diffs, and write tests. This agent demonstrates how to
            work with file system tools and structured code output.
          </p>

          <h2>Defining the Code Tools</h2>
          <p>
            A code assistant needs tools for reading files, listing directories, and analyzing code.
            Here are the core tools:
          </p>
          <div className="code-block"><pre><code>{`import { createToolWithValidation } from '@waymakerai/aicofounder-core';
import { z } from 'zod';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

const readFileTool = createToolWithValidation({
  name: 'read_file',
  description: 'Read the contents of a file. Use this to examine source code, configs, or any text file.',
  schema: z.object({
    path: z.string().min(1),
    startLine: z.number().int().min(1).optional(),
    endLine: z.number().int().min(1).optional(),
  }),
  execute: async ({ path, startLine, endLine }) => {
    const content = await readFile(path, 'utf-8');
    const lines = content.split('\\n');
    const selected = startLine && endLine
      ? lines.slice(startLine - 1, endLine)
      : lines;
    return JSON.stringify({
      path,
      totalLines: lines.length,
      content: selected.join('\\n'),
      range: startLine ? \`\${startLine}-\${endLine || lines.length}\` : 'full',
    });
  },
});

const listDirectoryTool = createToolWithValidation({
  name: 'list_directory',
  description: 'List files and directories in a given path. Use this to explore project structure.',
  schema: z.object({
    path: z.string().min(1),
    recursive: z.boolean().default(false),
  }),
  execute: async ({ path, recursive }) => {
    const entries = await readdir(path, { withFileTypes: true });
    const items = entries.map((e) => ({
      name: e.name,
      type: e.isDirectory() ? 'directory' : 'file',
      path: join(path, e.name),
    }));
    return JSON.stringify(items);
  },
});`}</code></pre></div>

          <h2>Code Analysis Tool</h2>
          <p>
            For deeper analysis, add a tool that extracts structure from source files -- functions,
            classes, imports, and exports:
          </p>
          <div className="code-block"><pre><code>{`const analyzeCodeTool = createToolWithValidation({
  name: 'analyze_code',
  description: 'Analyze a source file to extract its structure: imports, exports, functions, and classes. Use this before making suggestions about code organization.',
  schema: z.object({
    path: z.string().min(1),
  }),
  execute: async ({ path }) => {
    const content = await readFile(path, 'utf-8');
    const lines = content.split('\\n');

    const imports = lines.filter((l) => l.match(/^import /));
    const exports = lines.filter((l) => l.match(/^export /));
    const functions = lines
      .map((l, i) => ({ line: i + 1, match: l.match(/(?:function|const|let)\\s+(\\w+)/) }))
      .filter((l) => l.match)
      .map((l) => ({ name: l.match![1], line: l.line }));

    return JSON.stringify({
      path,
      lineCount: lines.length,
      imports: imports.length,
      exports: exports.length,
      functions,
      language: path.endsWith('.ts') ? 'typescript' : path.endsWith('.py') ? 'python' : 'unknown',
    });
  },
});`}</code></pre></div>

          <h2>Assembling the Code Assistant</h2>
          <p>
            Wire the tools together with a system prompt designed for code review:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const codeAssistant = createAgent({
  name: 'code-assistant',
  model: 'gpt-4o',
  temperature: 0.2, // Low temperature for precise code analysis
  maxSteps: 20,
  systemPrompt: \`You are an expert code reviewer and assistant. You can:

1. Read and analyze source files
2. Explore project structure
3. Identify bugs, performance issues, and code smells
4. Suggest improvements with specific code changes
5. Write tests for existing code

When reviewing code:
- Start by understanding the project structure with list_directory
- Read relevant files to understand context
- Use analyze_code for structural overview
- Provide specific, actionable feedback with code examples
- Format code suggestions as diffs when possible\`,
  tools: [readFileTool, listDirectoryTool, analyzeCodeTool],
  memory: { type: 'sliding-window', maxMessages: 40 },
});`}</code></pre></div>

          <h2>Generating Diffs and Suggestions</h2>
          <p>
            The agent uses its understanding of the code to generate specific improvement suggestions.
            Here is how to prompt it for different tasks:
          </p>
          <div className="code-block"><pre><code>{`// Code review
const review = await codeAssistant.run(
  'Review the file at src/utils/auth.ts for security issues and suggest fixes.'
);

// Test generation
const tests = await codeAssistant.run(
  'Read src/services/userService.ts and write comprehensive unit tests for it using Jest.'
);

// Refactoring suggestions
const refactor = await codeAssistant.run(
  'Analyze the src/components directory and suggest how to reduce code duplication.'
);`}</code></pre></div>

          <h2>Security Considerations</h2>
          <p>
            File system tools are powerful and potentially dangerous. Always apply safety guards:
          </p>
          <ul>
            <li>Restrict file access to specific directories using a base path allowlist.</li>
            <li>Make the agent read-only -- do not include write or delete tools unless you have robust review gates.</li>
            <li>Sanitize paths to prevent directory traversal attacks (<code>../../../etc/passwd</code>).</li>
            <li>Use CoFounder&apos;s built-in security guards to block PII exposure in tool results.</li>
          </ul>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-8" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Building a Research Agent
          </Link>
          <Link href="/training/building-agents/lesson-10" className="btn-primary px-6 py-3 group">
            Next: Error Handling Strategies
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
