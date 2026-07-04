import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Human-in-the-Loop Patterns | Advanced Patterns',
  description: 'Build approval workflows, confirmation steps, user feedback integration, and interactive agent loops.',
};

export default function Lesson8Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 8 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Human-in-the-Loop Patterns</h1>
          <p className="lead">
            Not every agent action should be fully autonomous. High-stakes operations like sending emails, making purchases, or modifying data require human approval. This lesson covers patterns for pausing agent execution to get user confirmation, integrating feedback into the agent loop, and designing interactive workflows.
          </p>

          <h2>Approval Workflows</h2>
          <p>
            An approval workflow pauses the agent pipeline at a designated point and presents the proposed action to the user. The agent resumes only after explicit approval. This is essential for actions with real-world consequences: API calls that modify external systems, database writes, financial transactions, or communications sent on behalf of the user.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  model: 'gpt-4o',
  tools: [
    {
      name: 'send_email',
      description: 'Send an email to a recipient',
      parameters: { to: 'string', subject: 'string', body: 'string' },
      // Mark this tool as requiring approval
      requiresApproval: true,
      execute: async (args) => {
        await emailService.send(args);
        return { sent: true };
      },
    },
  ],
  onApprovalRequired: async (toolCall) => {
    // This callback pauses execution and waits for user input
    // In a web app, this triggers a UI modal
    return new Promise((resolve) => {
      pendingApprovals.set(toolCall.id, resolve);
      // The UI will call resolve(true) or resolve(false)
    });
  },
});

// When the user clicks "Approve" in the UI:
const resolver = pendingApprovals.get(toolCallId);
resolver(true); // Agent resumes and executes the tool`}</code></pre></div>

          <h2>Confirmation Steps in React</h2>
          <p>
            On the frontend, CoFounder&apos;s React hooks integrate approval workflows seamlessly. When the agent triggers an action that requires confirmation, the <code>useAgent</code> hook exposes a <code>pendingApproval</code> state that your UI can render as a confirmation dialog.
          </p>
          <div className="code-block"><pre><code>{`import { useAgent } from '@waymakerai/aicofounder-react';

function AgentChat() {
  const { messages, send, pendingApproval, approve, reject } = useAgent({
    endpoint: '/api/agent/chat',
  });

  return (
    <div>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {pendingApproval && (
        <div className="border rounded-lg p-4 bg-yellow-500/10 border-yellow-500/30">
          <p className="font-medium mb-2">Agent wants to: {pendingApproval.toolName}</p>
          <pre className="text-sm mb-4">{JSON.stringify(pendingApproval.args, null, 2)}</pre>
          <div className="flex gap-3">
            <button onClick={() => approve(pendingApproval.id)} className="btn-primary">
              Approve
            </button>
            <button onClick={() => reject(pendingApproval.id, 'User declined')} className="btn-secondary">
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}`}</code></pre></div>

          <h2>User Feedback Integration</h2>
          <p>
            Beyond approval gates, continuous user feedback improves agent behavior over time. Thumbs up/down on responses, explicit corrections, and preference selections all feed back into the agent&apos;s context. CoFounder stores feedback alongside conversation history in Supabase, letting you use it for fine-tuning, prompt optimization, or retrieval-augmented generation.
          </p>
          <p>
            A common pattern is the feedback loop: the agent proposes a solution, the user provides feedback, and the agent refines its approach. CoFounder&apos;s <code>refinement</code> mode automatically includes previous attempts and feedback in the context window, enabling iterative improvement within a single session.
          </p>

          <h2>Interactive Agent Loops</h2>
          <p>
            Some tasks require multiple rounds of interaction. A report generation agent might ask clarifying questions, present an outline for approval, generate a draft, and then incorporate edits. Designing these multi-turn interactive loops requires careful state management and clear handoff points between agent autonomy and user control.
          </p>
          <p>
            The key design principle: make it obvious when the agent is waiting for input versus when it is processing. Use distinct visual states and clear calls-to-action so users never wonder whether the agent is stuck or waiting for them.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-7" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Agent Pipelines
          </Link>
          <Link href="/training/advanced-patterns/lesson-9" className="btn-primary px-6 py-3 group">
            Next: Retry and Fallback Strategies
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
