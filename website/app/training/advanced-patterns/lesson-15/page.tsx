import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Advanced Error Recovery | Advanced Patterns',
  description: 'Master error taxonomy, partial result recovery, checkpoint/resume patterns, and dead letter queues for failed agent tasks.',
};

export default function Lesson15Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 15 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Advanced Error Recovery</h1>
          <p className="lead">
            In production, things will go wrong: models time out, tool calls fail, context windows overflow, and responses violate safety guards. Advanced error recovery goes beyond simple retries to preserve partial results, resume from checkpoints, and route irrecoverable failures to dead letter queues for later analysis and reprocessing.
          </p>

          <h2>Error Taxonomy</h2>
          <p>
            Not all errors are equal. A robust error handling strategy starts with classifying errors into actionable categories. Transient errors (rate limits, timeouts, temporary server errors) should be retried. Content errors (safety violations, malformed output) need different prompting. Resource errors (context overflow, budget exceeded) require strategy changes. Permanent errors (invalid API keys, model deprecation) need human intervention.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, ErrorClassifier } from '@waymakerai/aicofounder-core';

const errorHandler = new ErrorClassifier({
  categories: {
    transient: {
      match: (err) => [429, 500, 502, 503, 504].includes(err.status) || err.code === 'TIMEOUT',
      strategy: 'retry',
      maxRetries: 3,
    },
    content: {
      match: (err) => err.code === 'CONTENT_FILTER' || err.code === 'GUARD_VIOLATION',
      strategy: 'rephrase',
      // Automatically rephrase the prompt and retry
      rephrasePrompt: 'Rephrase the following to be appropriate: ',
    },
    resource: {
      match: (err) => err.code === 'CONTEXT_OVERFLOW' || err.code === 'BUDGET_EXCEEDED',
      strategy: 'degrade',
      // Switch to a cheaper model or compress context
      fallbackModel: 'gpt-4o-mini',
    },
    permanent: {
      match: (err) => err.code === 'AUTH_FAILED' || err.code === 'MODEL_NOT_FOUND',
      strategy: 'alert',
      // Notify ops team immediately
      alertChannel: 'slack',
    },
  },
});

const agent = createAgent({
  model: 'gpt-4o',
  errorHandler,
});`}</code></pre></div>

          <h2>Partial Result Recovery</h2>
          <p>
            When a streaming response fails midway, you may have already received valuable content. Discarding it and starting over wastes time and money. Partial result recovery saves what was received and either presents it to the user with a note that the response is incomplete, or uses it as context for a continuation request.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  model: 'gpt-4o',
  streaming: true,
  recovery: {
    preservePartialResults: true,
    onPartialResult: async (partial, error) => {
      // Save what we got
      console.log(\`Recovered \${partial.tokens.length} tokens before failure\`);

      if (partial.tokens.length > 100) {
        // Enough content to be useful - try to continue
        const continuation = await agent.run(
          \`Continue from where this was cut off: \${partial.text.slice(-200)}\`,
          { maxTokens: partial.remainingBudget }
        );
        return { text: partial.text + continuation.text, recovered: true };
      }

      // Not enough content - retry from scratch
      return null; // Triggers full retry
    },
  },
});`}</code></pre></div>

          <h2>Checkpoint and Resume</h2>
          <p>
            For long-running agent pipelines, checkpointing lets you save progress at each stage so that a failure in step 5 of a 7-step pipeline does not require rerunning steps 1 through 4. CoFounder&apos;s pipeline system supports automatic checkpointing to Supabase, with resume capability that skips completed steps.
          </p>
          <p>
            Checkpoints store the output of each completed step along with the pipeline state. When resuming, the pipeline loads the last checkpoint and continues from there. This is especially valuable for pipelines that involve expensive operations like embedding generation or external API calls.
          </p>

          <h2>Dead Letter Queues</h2>
          <p>
            Some failures cannot be resolved automatically. Instead of dropping these requests, route them to a dead letter queue (DLQ) for later analysis and reprocessing. A DLQ stores the original request, the error details, the number of retry attempts, and any partial results. Operations teams can review the DLQ, fix underlying issues, and replay failed requests.
          </p>
          <p>
            CoFounder implements DLQs using Supabase tables with a simple status workflow: <code>failed</code> to <code>reviewing</code> to <code>retrying</code> to <code>resolved</code> or <code>discarded</code>. A dashboard shows DLQ depth over time, helping you identify systemic issues (like a model that consistently fails on certain input patterns) versus isolated incidents.
          </p>

          <h2>Building Resilient Systems</h2>
          <p>
            The ultimate goal is an agent system that degrades gracefully under failure. Combine the patterns from this lesson: classify errors to choose the right strategy, preserve partial results to minimize waste, checkpoint pipelines to enable resume, and route irrecoverable failures to DLQs. With these patterns in place, your application can weather provider outages, unexpected input, and edge cases while maintaining a good user experience.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-14" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Semantic Caching
          </Link>
          <Link href="/training/production-deployment" className="btn-primary px-6 py-3 group">
            Next Course: Production Deployment
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
