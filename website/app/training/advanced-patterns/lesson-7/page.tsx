import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agent Pipelines | Advanced Patterns',
  description: 'Build sequential agent chains, transform data between agents, compose pipelines, and handle error propagation.',
};

export default function Lesson7Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 7 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Agent Pipelines</h1>
          <p className="lead">
            Complex AI tasks are best decomposed into a sequence of focused steps. Agent pipelines chain multiple agents together, where each agent&apos;s output feeds into the next. This lesson covers how to build, compose, and debug multi-step agent pipelines with proper error handling.
          </p>

          <h2>Sequential Agent Chains</h2>
          <p>
            A pipeline is a sequence of agents where each one has a specific role. For example, a content generation pipeline might include: a research agent that gathers facts, an outline agent that structures the content, a writing agent that produces the draft, and an editing agent that refines it. Each agent is optimized for its specific task with targeted system prompts and model selection.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, Pipeline } from '@waymakerai/aicofounder-core';

const researchAgent = createAgent({
  model: 'gpt-4o',
  systemPrompt: 'You are a research assistant. Gather key facts and sources.',
});

const outlineAgent = createAgent({
  model: 'gpt-4o-mini',
  systemPrompt: 'You create structured outlines from research notes.',
});

const writerAgent = createAgent({
  model: 'gpt-4o',
  systemPrompt: 'You write polished articles from outlines. Use clear prose.',
});

const pipeline = new Pipeline({
  name: 'content-generator',
  steps: [
    { agent: researchAgent, name: 'research' },
    { agent: outlineAgent, name: 'outline' },
    { agent: writerAgent, name: 'write' },
  ],
});

const result = await pipeline.run('Write an article about edge computing');
console.log(result.text);              // Final article
console.log(result.steps.research);    // Intermediate research output
console.log(result.steps.outline);     // Intermediate outline
console.log(result.totalTokens);       // Aggregate token usage`}</code></pre></div>

          <h2>Data Transformation Between Agents</h2>
          <p>
            Raw output from one agent is rarely the perfect input for the next. Transform functions sit between pipeline stages to reshape data, extract specific fields, validate structure, or enrich the context. This keeps each agent&apos;s prompt clean and focused.
          </p>
          <div className="code-block"><pre><code>{`const pipeline = new Pipeline({
  name: 'data-processor',
  steps: [
    {
      agent: extractorAgent,
      name: 'extract',
      transform: (output) => {
        // Parse structured data from the extractor
        const entities = JSON.parse(output.text);
        return \`Analyze the following entities: \${entities.map(e => e.name).join(', ')}\`;
      },
    },
    {
      agent: analyzerAgent,
      name: 'analyze',
      transform: (output) => {
        // Add metadata for the summarizer
        return \`Based on this analysis, write a summary:\\n\${output.text}\\n\\nTarget audience: technical managers\`;
      },
    },
    {
      agent: summarizerAgent,
      name: 'summarize',
    },
  ],
});`}</code></pre></div>

          <h2>Pipeline Composition</h2>
          <p>
            Pipelines can be nested: a pipeline step can itself be a pipeline. This lets you build complex workflows from reusable building blocks. For example, a document processing pipeline might include a sub-pipeline for entity extraction that is also used independently elsewhere in your application.
          </p>
          <p>
            CoFounder supports branching pipelines too. A router step examines the input and directs it to one of several sub-pipelines based on the content type, complexity, or domain. This pattern enables sophisticated workflows that adapt to the input dynamically.
          </p>

          <h2>Error Propagation</h2>
          <p>
            When a pipeline step fails, you need a clear strategy. The default behavior is to halt the pipeline and return the error with the context of which step failed. But you can also configure steps with fallback behavior: retry with a different model, skip the step and pass through the previous output, or use a cached result from a previous run.
          </p>
          <p>
            CoFounder&apos;s pipeline emits events at each stage, letting you build monitoring dashboards that show which steps succeed, fail, or are slow. Each step records its duration, token usage, and output size, giving you the data to optimize your pipeline&apos;s performance.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-6" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Parallel Agent Execution
          </Link>
          <Link href="/training/advanced-patterns/lesson-8" className="btn-primary px-6 py-3 group">
            Next: Human-in-the-Loop Patterns
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
