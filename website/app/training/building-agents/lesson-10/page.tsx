import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Error Handling Strategies | Building AI Agents',
  description: 'Learn retry logic, fallback models, graceful degradation, error classification, and user-friendly error messages for agents.',
};

export default function Lesson10Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 10 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Error Handling Strategies</h1>
          <p className="lead">
            Production agents encounter failures constantly -- API rate limits, network timeouts,
            malformed LLM output, and tool execution errors. Robust error handling is what separates
            a demo from a production-ready agent.
          </p>

          <h2>Error Classification</h2>
          <p>
            Not all errors are equal. CoFounder classifies errors into categories so you can handle
            each appropriately:
          </p>
          <ul>
            <li><strong>Retryable</strong> -- Rate limits (429), temporary network failures, server errors (500/503). These should be retried with backoff.</li>
            <li><strong>Recoverable</strong> -- Tool validation errors, malformed LLM output. The agent can self-correct on the next step.</li>
            <li><strong>Fatal</strong> -- Authentication failures (401), missing permissions, invalid configuration. These require human intervention.</li>
          </ul>
          <div className="code-block"><pre><code>{`import { createAgent, ErrorCategory } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  name: 'resilient-agent',
  model: 'gpt-4o',
  errorHandling: {
    classify: (error) => {
      if (error.status === 429) return ErrorCategory.RETRYABLE;
      if (error.status === 401) return ErrorCategory.FATAL;
      if (error.message?.includes('invalid JSON')) return ErrorCategory.RECOVERABLE;
      return ErrorCategory.RETRYABLE; // Default to retryable
    },
  },
  tools: [searchTool, databaseTool],
});`}</code></pre></div>

          <h2>Retry Logic with Backoff</h2>
          <p>
            CoFounder provides built-in retry logic with exponential backoff. Configure it per-agent
            or per-tool:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  name: 'retrying-agent',
  model: 'gpt-4o',
  errorHandling: {
    retry: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      retryableStatuses: [429, 500, 502, 503],
    },
    onRetry: (error, attempt) => {
      console.warn(\`Retry attempt \${attempt}: \${error.message}\`);
    },
  },
  tools: [searchTool],
});`}</code></pre></div>

          <h2>Fallback Models</h2>
          <p>
            When a primary model is unavailable or returns errors, CoFounder can automatically
            switch to a fallback model:
          </p>
          <div className="code-block"><pre><code>{`const agent = createAgent({
  name: 'fallback-agent',
  model: 'gpt-4o',
  fallbackModels: [
    { model: 'claude-sonnet-4-20250514', provider: 'anthropic' },
    { model: 'gpt-4o-mini', provider: 'openai' },
  ],
  errorHandling: {
    useFallbackOn: [429, 500, 503],
    onFallback: (fromModel, toModel, error) => {
      console.warn(\`Falling back from \${fromModel} to \${toModel}: \${error.message}\`);
    },
  },
});`}</code></pre></div>
          <p>
            Fallback models are tried in order. If all models fail, the agent raises the final
            error. Use cheaper or more available models as fallbacks.
          </p>

          <h2>Graceful Degradation</h2>
          <p>
            Sometimes the best response to an error is a partial result rather than a complete
            failure. CoFounder&apos;s hooks let you implement graceful degradation:
          </p>
          <div className="code-block"><pre><code>{`const agent = createAgent({
  name: 'graceful-agent',
  model: 'gpt-4o',
  hooks: {
    onToolError: async (toolName, error, context) => {
      // If search fails, continue with what we have
      if (toolName === 'web_search') {
        return {
          handled: true,
          result: JSON.stringify({
            partial: true,
            message: 'Web search is temporarily unavailable. Answering with available knowledge.',
          }),
        };
      }
      return { handled: false }; // Let other errors propagate
    },
    onStepError: async (error, step, context) => {
      if (step >= context.maxSteps - 1) {
        // On last step, return whatever we have
        return {
          handled: true,
          output: 'I was unable to complete the full analysis, but here is what I found so far: ' +
            context.partialResults.join('\\n'),
        };
      }
      return { handled: false };
    },
  },
  tools: [searchTool, databaseTool],
});`}</code></pre></div>

          <h2>User-Friendly Error Messages</h2>
          <p>
            End users should never see raw stack traces or technical error codes. Map internal errors
            to helpful messages:
          </p>
          <ul>
            <li>Rate limit errors: &quot;I&apos;m processing many requests right now. Please try again in a moment.&quot;</li>
            <li>Tool failures: &quot;I wasn&apos;t able to access that information, but I can try a different approach.&quot;</li>
            <li>Context overflow: &quot;Our conversation has gotten long. Let me summarize what we&apos;ve discussed and we can continue.&quot;</li>
            <li>Model errors: &quot;I encountered an issue generating a response. Let me try again.&quot;</li>
          </ul>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-9" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Building a Code Assistant
          </Link>
          <Link href="/training/building-agents/lesson-11" className="btn-primary px-6 py-3 group">
            Next: Testing Your Agents
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
