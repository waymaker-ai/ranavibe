import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Building a Research Agent | Building AI Agents',
  description: 'Full tutorial: build a research assistant with web search, content extraction, summarization, and source citation.',
};

export default function Lesson8Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 8 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Building a Research Agent</h1>
          <p className="lead">
            Time to put everything together. In this tutorial, you will build a complete research
            assistant agent that can search the web, extract content from pages, summarize findings,
            and cite its sources. This is a practical, end-to-end project.
          </p>

          <h2>Defining the Research Tools</h2>
          <p>
            Our research agent needs three tools: a web search tool, a page fetcher, and a
            summarizer. Let&apos;s define each one:
          </p>
          <div className="code-block"><pre><code>{`import { Tool, createToolWithValidation } from '@waymakerai/aicofounder-core';
import { z } from 'zod';

const webSearchTool = createToolWithValidation({
  name: 'web_search',
  description: 'Search the web for information on a topic. Returns titles, URLs, and snippets. Use this as the first step when researching any topic.',
  schema: z.object({
    query: z.string().min(3).max(200),
    maxResults: z.number().int().min(1).max(10).default(5),
  }),
  execute: async ({ query, maxResults }) => {
    const response = await fetch(\`https://api.search.example/v1/search?q=\${encodeURIComponent(query)}&num=\${maxResults}\`, {
      headers: { Authorization: \`Bearer \${process.env.SEARCH_API_KEY}\` },
    });
    const data = await response.json();
    return JSON.stringify(data.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    })));
  },
});

const fetchPageTool = createToolWithValidation({
  name: 'fetch_page',
  description: 'Fetch and extract the main text content from a web page URL. Use this after web_search to get full article content.',
  schema: z.object({
    url: z.string().url(),
  }),
  execute: async ({ url }) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      return JSON.stringify({ error: true, message: \`Failed to fetch: HTTP \${response.status}\` });
    }
    const html = await response.text();
    // Extract main content (simplified -- use a library like readability in production)
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').slice(0, 5000);
    return JSON.stringify({ url, content: text });
  },
});`}</code></pre></div>

          <h2>Assembling the Agent</h2>
          <p>
            Now wire the tools into an agent with a system prompt that guides research behavior:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const researchAgent = createAgent({
  name: 'research-assistant',
  model: 'gpt-4o',
  temperature: 0.3, // Lower temperature for factual accuracy
  maxSteps: 15,
  systemPrompt: \`You are a thorough research assistant. When given a research question:

1. Search for relevant information using web_search
2. Fetch the 2-3 most promising pages using fetch_page
3. Synthesize the information into a clear, well-organized answer
4. Always cite your sources with [Source Title](URL) format

Guidelines:
- Cross-reference facts across multiple sources
- If sources disagree, note the discrepancy
- Distinguish between established facts and opinions
- If you cannot find reliable information, say so honestly\`,
  tools: [webSearchTool, fetchPageTool],
  memory: {
    type: 'sliding-window',
    maxMessages: 30,
  },
});`}</code></pre></div>

          <h2>Adding Source Citation</h2>
          <p>
            Good research agents cite their sources. The system prompt already instructs the agent
            to cite in markdown link format. You can also add a post-processing step to verify citations:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, AgentHooks } from '@waymakerai/aicofounder-core';

const hooks: AgentHooks = {
  afterRun: async (result) => {
    // Extract URLs from the agent's output
    const urlRegex = /\\[([^\\]]+)\\]\\((https?:\\/\\/[^)]+)\\)/g;
    const citations: Array<{ title: string; url: string }> = [];
    let match;
    while ((match = urlRegex.exec(result.output)) !== null) {
      citations.push({ title: match[1], url: match[2] });
    }
    return {
      ...result,
      metadata: { ...result.metadata, citations, citationCount: citations.length },
    };
  },
};

const researchAgent = createAgent({
  name: 'research-assistant',
  model: 'gpt-4o',
  tools: [webSearchTool, fetchPageTool],
  hooks,
  // ... rest of config
});`}</code></pre></div>

          <h2>Connecting to a React UI</h2>
          <p>
            Finally, connect the research agent to a React frontend using CoFounder&apos;s hooks:
          </p>
          <div className="code-block"><pre><code>{`'use client';
import { useAgent } from '@waymakerai/aicofounder-react';

export function ResearchChat() {
  const { messages, sendMessage, isRunning, currentStep } = useAgent({
    agentId: 'research-assistant',
  });

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={\`message \${msg.role}\`}>
            {msg.content}
          </div>
        ))}
      </div>
      {isRunning && (
        <div className="status">
          Researching... (step {currentStep})
        </div>
      )}
      <input
        type="text"
        placeholder="Ask a research question..."
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}`}</code></pre></div>

          <h2>Testing the Agent</h2>
          <p>
            Run the agent with a real question to see the full observe-think-act cycle in action.
            Watch the logs to see how it decides which pages to fetch and how it synthesizes
            information from multiple sources. In lesson 11, we will cover how to write automated
            tests for agents like this.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-7" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Agent Orchestration
          </Link>
          <Link href="/training/building-agents/lesson-9" className="btn-primary px-6 py-3 group">
            Next: Building a Code Assistant
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
