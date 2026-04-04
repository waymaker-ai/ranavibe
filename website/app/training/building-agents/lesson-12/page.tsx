import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agent Best Practices | Building AI Agents',
  description: 'Production checklist for AI agents: security, input sanitization, output validation, cost optimization, monitoring, and logging.',
};

export default function Lesson12Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 12 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Agent Best Practices</h1>
          <p className="lead">
            You have learned how to build agents, design tools, manage memory, orchestrate multi-agent
            systems, and test everything. This final lesson covers the security, cost, and operational
            practices that make your agents production-ready.
          </p>

          <h2>Security: Input Sanitization</h2>
          <p>
            User input flows directly into your agent&apos;s context and tool calls. Without sanitization,
            attackers can inject malicious instructions. CoFounder provides built-in security guards:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, SecurityGuard } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  name: 'secure-agent',
  model: 'gpt-4o',
  security: {
    guards: [
      SecurityGuard.PROMPT_INJECTION, // Blocks prompt injection attempts
      SecurityGuard.PII_DETECTION,     // Detects and redacts PII in inputs
      SecurityGuard.SQL_INJECTION,     // Blocks SQL injection in tool parameters
    ],
    onViolation: (violation) => {
      console.error(\`Security violation: \${violation.type} - \${violation.message}\`);
      return {
        blocked: true,
        userMessage: 'I cannot process that request for security reasons.',
      };
    },
  },
  tools: [databaseTool, searchTool],
});`}</code></pre></div>
          <p>
            Always enable prompt injection detection in production. It catches common attacks like
            &quot;ignore your instructions and...&quot; or hidden instructions embedded in tool results.
          </p>

          <h2>Security: Output Validation</h2>
          <p>
            Agent output can also be a security risk. Validate what your agent produces before
            showing it to users:
          </p>
          <ul>
            <li><strong>PII filtering</strong> -- Ensure the agent does not leak emails, phone numbers, or other personal data from its training or tool results.</li>
            <li><strong>Content filtering</strong> -- Block harmful, offensive, or off-topic content from agent responses.</li>
            <li><strong>Format validation</strong> -- If your agent should produce JSON, HTML, or code, validate the output format before rendering.</li>
          </ul>
          <div className="code-block"><pre><code>{`const agent = createAgent({
  name: 'validated-agent',
  model: 'gpt-4o',
  hooks: {
    beforeRespond: async (output) => {
      // Redact any email addresses the agent might expose
      const sanitized = output.replace(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g,
        '[email redacted]'
      );
      // Redact phone numbers
      const cleaned = sanitized.replace(
        /\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b/g,
        '[phone redacted]'
      );
      return cleaned;
    },
  },
  tools: [databaseTool],
});`}</code></pre></div>

          <h2>Cost Optimization</h2>
          <p>
            LLM API calls are expensive at scale. Here are proven strategies to reduce costs:
          </p>
          <ul>
            <li><strong>Use the right model</strong> -- Not every task needs GPT-4o. Use cheaper models for simple routing, summarization, and classification.</li>
            <li><strong>Minimize context</strong> -- Keep conversation history lean. Summarize old messages instead of sending the full history.</li>
            <li><strong>Cache tool results</strong> -- If the same tool is called with the same arguments, return cached results.</li>
            <li><strong>Set token limits</strong> -- Cap <code>maxTokens</code> to prevent unnecessarily long responses.</li>
            <li><strong>Monitor per-user costs</strong> -- Track spending by user or session and set budget limits.</li>
          </ul>
          <div className="code-block"><pre><code>{`import { createAgent, CostTracker } from '@waymakerai/aicofounder-core';

const costTracker = new CostTracker({
  budgetPerUser: 0.50,    // $0.50 per user per session
  budgetPerDay: 100.00,   // $100 daily budget
  onBudgetExceeded: (type, current, limit) => {
    console.warn(\`Budget exceeded: \${type} - $\${current.toFixed(2)} / $\${limit.toFixed(2)}\`);
  },
});

const agent = createAgent({
  name: 'budget-agent',
  model: 'gpt-4o',
  costTracker,
  tools: [searchTool, databaseTool],
});`}</code></pre></div>

          <h2>Monitoring and Logging</h2>
          <p>
            Production agents need observability. Log every agent step so you can debug issues and
            understand agent behavior:
          </p>
          <ul>
            <li>Log each agent step: which tool was called, what arguments were passed, what was returned.</li>
            <li>Track latency per step, per tool, and end-to-end.</li>
            <li>Monitor error rates by tool and by error category.</li>
            <li>Alert on anomalies: sudden cost spikes, increased error rates, or unusually long runs.</li>
          </ul>

          <h2>Production Checklist</h2>
          <p>
            Before deploying an agent to production, verify each of these:
          </p>
          <ul>
            <li>All security guards are enabled (prompt injection, PII detection).</li>
            <li>Rate limits are configured for each external API tool.</li>
            <li>Fallback models are configured for resilience.</li>
            <li>Cost tracking and budget limits are in place.</li>
            <li>Error handling covers retryable, recoverable, and fatal errors.</li>
            <li>Logging captures every step for debugging.</li>
            <li>Unit tests cover all tools. Integration tests cover key agent flows.</li>
            <li>The system prompt is reviewed for safety and accuracy.</li>
            <li>Memory management prevents context overflow.</li>
            <li>Output validation prevents PII leakage and harmful content.</li>
          </ul>
          <p>
            Congratulations -- you have completed the Building AI Agents course. You now have the
            knowledge to design, build, test, and deploy production-ready AI agents with CoFounder.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-11" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Testing Your Agents
          </Link>
          <Link href="/training/advanced-patterns" className="btn-primary px-6 py-3 group">
            Next Course: Advanced Patterns
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
