'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Workflow, GitBranch, Repeat, Timer, CheckSquare, Layers } from 'lucide-react';

const features = [
  {
    icon: Workflow,
    title: 'Workflow Definition',
    description: 'Define multi-step AI workflows with dependencies',
    code: `import { Workflow, Step } from '@rana/core';

const contentWorkflow = new Workflow({
  name: 'content-pipeline',
  description: 'Generate and review content'
});

// Add steps
contentWorkflow.addStep(new Step({
  name: 'research',
  handler: async (input) => {
    return await agent.run(\`Research: \${input.topic}\`);
  }
}));

contentWorkflow.addStep(new Step({
  name: 'draft',
  dependsOn: ['research'],
  handler: async (input, context) => {
    const research = context.getOutput('research');
    return await agent.run(\`Write article using: \${research}\`);
  }
}));

contentWorkflow.addStep(new Step({
  name: 'review',
  dependsOn: ['draft'],
  handler: async (input, context) => {
    const draft = context.getOutput('draft');
    return await agent.run(\`Review and improve: \${draft}\`);
  }
}));

// Run workflow
const result = await contentWorkflow.run({ topic: 'AI trends' });
console.log(result.outputs.review);  // Final reviewed content`,
  },
  {
    icon: GitBranch,
    title: 'Conditional Branching',
    description: 'Branch workflows based on conditions',
    code: `import { Workflow, Step, Branch } from '@rana/core';

const supportWorkflow = new Workflow({ name: 'support-ticket' });

// Classify the ticket
supportWorkflow.addStep(new Step({
  name: 'classify',
  handler: async (input) => {
    return await classify(input.message, [
      'billing', 'technical', 'sales', 'other'
    ]);
  }
}));

// Branch based on classification
supportWorkflow.addBranch(new Branch({
  name: 'route',
  dependsOn: ['classify'],
  conditions: [
    {
      when: (ctx) => ctx.getOutput('classify') === 'billing',
      then: 'billing-handler'
    },
    {
      when: (ctx) => ctx.getOutput('classify') === 'technical',
      then: 'technical-handler'
    },
    {
      when: (ctx) => ctx.getOutput('classify') === 'sales',
      then: 'sales-handler'
    }
  ],
  default: 'general-handler'
}));

// Define handlers for each branch
supportWorkflow.addStep(new Step({
  name: 'billing-handler',
  handler: async (input, ctx) => {
    return await billingAgent.run(input.message);
  }
}));

// ... other handlers`,
  },
  {
    icon: Repeat,
    title: 'Parallel Execution',
    description: 'Run steps in parallel for performance',
    code: `import { Workflow, Step, Parallel } from '@rana/core';

const analysisWorkflow = new Workflow({ name: 'document-analysis' });

// Single input step
analysisWorkflow.addStep(new Step({
  name: 'extract-text',
  handler: async (input) => {
    return await extractText(input.document);
  }
}));

// Parallel analysis steps
analysisWorkflow.addParallel(new Parallel({
  name: 'analyze',
  dependsOn: ['extract-text'],
  steps: [
    new Step({
      name: 'sentiment',
      handler: async (_, ctx) => {
        return await sentiment(ctx.getOutput('extract-text'));
      }
    }),
    new Step({
      name: 'entities',
      handler: async (_, ctx) => {
        return await extractEntities(ctx.getOutput('extract-text'));
      }
    }),
    new Step({
      name: 'summary',
      handler: async (_, ctx) => {
        return await summarize(ctx.getOutput('extract-text'));
      }
    }),
    new Step({
      name: 'keywords',
      handler: async (_, ctx) => {
        return await extractKeywords(ctx.getOutput('extract-text'));
      }
    })
  ]
}));

// Merge results
analysisWorkflow.addStep(new Step({
  name: 'merge',
  dependsOn: ['analyze'],
  handler: async (_, ctx) => ({
    sentiment: ctx.getOutput('sentiment'),
    entities: ctx.getOutput('entities'),
    summary: ctx.getOutput('summary'),
    keywords: ctx.getOutput('keywords')
  })
}));`,
  },
  {
    icon: Timer,
    title: 'Retry & Timeout',
    description: 'Built-in retry logic and timeouts',
    code: `import { Workflow, Step, RetryPolicy } from '@rana/core';

const workflow = new Workflow({ name: 'reliable-workflow' });

// Step with retry policy
workflow.addStep(new Step({
  name: 'api-call',
  timeout: 30000,  // 30 second timeout
  retry: new RetryPolicy({
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
    retryOn: ['timeout', 'rate_limit', '5xx']
  }),
  handler: async (input) => {
    return await externalAPI.call(input);
  },
  onRetry: (attempt, error) => {
    console.log(\`Retry attempt \${attempt}: \${error.message}\`);
  }
}));

// Step with fallback
workflow.addStep(new Step({
  name: 'with-fallback',
  handler: async (input) => {
    return await primaryService.call(input);
  },
  fallback: async (input, error) => {
    console.log(\`Primary failed: \${error.message}\`);
    return await backupService.call(input);
  }
}));

// Global error handler
workflow.onError(async (step, error, context) => {
  await logError({ step: step.name, error, context });
  await notifyOps(\`Workflow error in \${step.name}\`);
});`,
  },
  {
    icon: CheckSquare,
    title: 'Human-in-the-Loop',
    description: 'Pause workflows for human review',
    code: `import { Workflow, Step, HumanReview } from '@rana/core';

const approvalWorkflow = new Workflow({ name: 'content-approval' });

// Generate content
approvalWorkflow.addStep(new Step({
  name: 'generate',
  handler: async (input) => {
    return await agent.run(\`Write: \${input.brief}\`);
  }
}));

// Human review gate
approvalWorkflow.addStep(new HumanReview({
  name: 'review',
  dependsOn: ['generate'],
  reviewers: ['editor@company.com'],
  timeout: '24h',
  ui: {
    title: 'Content Review Required',
    showOutput: 'generate',
    actions: ['approve', 'reject', 'request-changes']
  },
  onApprove: async (ctx) => {
    return { approved: true, content: ctx.getOutput('generate') };
  },
  onReject: async (ctx, feedback) => {
    // Re-generate with feedback
    return await agent.run(\`Revise based on: \${feedback}\`);
  },
  onTimeout: async (ctx) => {
    await notify('Review timed out');
    return { approved: false, reason: 'timeout' };
  }
}));

// Continue after approval
approvalWorkflow.addStep(new Step({
  name: 'publish',
  dependsOn: ['review'],
  condition: (ctx) => ctx.getOutput('review').approved,
  handler: async (_, ctx) => {
    return await publishContent(ctx.getOutput('review').content);
  }
}));`,
  },
  {
    icon: Layers,
    title: 'Workflow Composition',
    description: 'Compose workflows from reusable sub-workflows',
    code: `import { Workflow, SubWorkflow } from '@rana/core';

// Define reusable sub-workflows
const validationWorkflow = new Workflow({ name: 'validation' });
validationWorkflow.addStep(/* validation steps */);

const enrichmentWorkflow = new Workflow({ name: 'enrichment' });
enrichmentWorkflow.addStep(/* enrichment steps */);

const notificationWorkflow = new Workflow({ name: 'notification' });
notificationWorkflow.addStep(/* notification steps */);

// Compose into main workflow
const mainWorkflow = new Workflow({ name: 'main-pipeline' });

mainWorkflow.addStep(new Step({
  name: 'input',
  handler: async (input) => input.data
}));

mainWorkflow.addSubWorkflow(new SubWorkflow({
  name: 'validate',
  workflow: validationWorkflow,
  dependsOn: ['input']
}));

mainWorkflow.addSubWorkflow(new SubWorkflow({
  name: 'enrich',
  workflow: enrichmentWorkflow,
  dependsOn: ['validate']
}));

mainWorkflow.addSubWorkflow(new SubWorkflow({
  name: 'notify',
  workflow: notificationWorkflow,
  dependsOn: ['enrich'],
  parallel: true  // Run in background
}));

// Run composed workflow
const result = await mainWorkflow.run({ data: inputData });`,
  },
];

export default function WorkflowsPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Workflow className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Workflows</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Build complex multi-step AI pipelines with branching, parallel execution,
            retry logic, and human-in-the-loop capabilities.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/core
          </div>
        </motion.div>

        {/* Features */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Workflow Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card bg-gradient-subtle"
        >
          <h2 className="text-2xl font-bold mb-4">Workflow Monitoring</h2>
          <p className="text-foreground-secondary mb-4">
            Built-in monitoring and visualization for your workflows:
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { WorkflowMonitor } from '@rana/core';

const monitor = new WorkflowMonitor({
  storage: 'postgresql',
  dashboard: true
});

// Track workflow execution
workflow.use(monitor.middleware());

// Get execution history
const runs = await monitor.getRuns({
  workflow: 'content-pipeline',
  status: 'completed',
  since: '7d ago'
});

// Get performance metrics
const metrics = await monitor.getMetrics('content-pipeline');
console.log(metrics.avgDuration);    // 45s
console.log(metrics.successRate);    // 98.5%
console.log(metrics.avgCost);        // $0.15

// Start dashboard server
await monitor.startDashboard({ port: 3001 });`}</pre>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
