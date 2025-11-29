/**
 * RANA Multi-Agent Example
 * Demonstrates the agent orchestration framework
 *
 * This example shows:
 * - Creating specialized agents with different capabilities
 * - Using the Orchestrator to coordinate agents
 * - Tool usage within agents
 * - Different orchestration strategies (sequential, parallel, router)
 *
 * Run with: npx ts-node index.ts
 */

// Simple Agent implementation for the example
// In a real app, you'd import from @rana/core

interface Tool {
  name: string;
  description: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  tools?: Tool[];
}

class SimpleAgent {
  private config: AgentConfig;
  private tools: Map<string, Tool> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
    config.tools?.forEach(t => this.tools.set(t.name, t));
  }

  async run(input: string): Promise<string> {
    console.log(`\x1b[33m[${this.config.name}]\x1b[0m Processing: "${input.substring(0, 50)}..."`);

    // Simulate agent thinking
    await sleep(500);

    // Check if any tools should be used
    for (const [name, tool] of this.tools) {
      if (input.toLowerCase().includes(name.replace('_', ' '))) {
        console.log(`\x1b[36m  Using tool: ${name}\x1b[0m`);
        const result = await tool.execute({ input });
        return `[${this.config.name}] Used ${name}: ${JSON.stringify(result)}`;
      }
    }

    // Simulate response based on agent type
    return this.generateResponse(input);
  }

  private generateResponse(input: string): string {
    const name = this.config.name.toLowerCase();

    if (name.includes('research')) {
      return `[Research Agent] Here's what I found about "${input}":
The topic involves multiple aspects that require careful analysis...`;
    }

    if (name.includes('code') || name.includes('developer')) {
      return `[Code Agent] Here's the implementation:
\`\`\`typescript
// Solution for: ${input}
function solution() {
  // Implementation details...
}
\`\`\``;
    }

    if (name.includes('writer') || name.includes('content')) {
      return `[Writer Agent] Here's the content:

# ${input}

This engaging content has been crafted to inform and inspire...`;
    }

    return `[${this.config.name}] Processed: ${input}`;
  }
}

// ============================================================================
// Define Specialized Agents
// ============================================================================

// Research Agent - Good at finding information
const researchAgent = new SimpleAgent({
  name: 'Research Agent',
  description: 'Specializes in finding and synthesizing information',
  systemPrompt: 'You are a research specialist. Find accurate, relevant information.',
  tools: [
    {
      name: 'web_search',
      description: 'Search the web for information',
      execute: async (args) => ({
        results: [
          { title: 'Relevant Result 1', snippet: 'Key information about the topic...' },
          { title: 'Relevant Result 2', snippet: 'Additional context and details...' },
        ],
      }),
    },
  ],
});

// Code Agent - Good at writing code
const codeAgent = new SimpleAgent({
  name: 'Code Agent',
  description: 'Specializes in writing and reviewing code',
  systemPrompt: 'You are a senior developer. Write clean, efficient code.',
  tools: [
    {
      name: 'code_execute',
      description: 'Execute code in a sandbox',
      execute: async (args) => ({
        output: 'Code executed successfully',
        result: 42,
      }),
    },
  ],
});

// Writer Agent - Good at creating content
const writerAgent = new SimpleAgent({
  name: 'Writer Agent',
  description: 'Specializes in creating engaging content',
  systemPrompt: 'You are a professional writer. Create clear, engaging content.',
});

// Analyst Agent - Good at analyzing data
const analystAgent = new SimpleAgent({
  name: 'Analyst Agent',
  description: 'Specializes in data analysis and insights',
  systemPrompt: 'You are a data analyst. Provide clear insights from data.',
  tools: [
    {
      name: 'calculator',
      description: 'Perform calculations',
      execute: async (args) => {
        const input = args.input as string;
        // Simple calculation simulation
        const numbers = input.match(/\d+/g)?.map(Number) || [];
        const sum = numbers.reduce((a, b) => a + b, 0);
        return { calculation: 'sum', result: sum };
      },
    },
  ],
});

// ============================================================================
// Simple Orchestrator
// ============================================================================

type Strategy = 'sequential' | 'parallel' | 'router';

interface AgentRegistration {
  agent: SimpleAgent;
  name: string;
  description: string;
  capabilities: string[];
}

class SimpleOrchestrator {
  private agents: AgentRegistration[] = [];
  private strategy: Strategy;

  constructor(strategy: Strategy) {
    this.strategy = strategy;
  }

  register(reg: AgentRegistration): this {
    this.agents.push(reg);
    return this;
  }

  async run(input: string): Promise<string> {
    console.log(`\n\x1b[35m=== Orchestrator (${this.strategy}) ===\x1b[0m`);
    console.log(`Input: "${input}"\n`);

    switch (this.strategy) {
      case 'sequential':
        return this.runSequential(input);
      case 'parallel':
        return this.runParallel(input);
      case 'router':
        return this.runRouter(input);
    }
  }

  private async runSequential(input: string): Promise<string> {
    let currentInput = input;

    for (const reg of this.agents) {
      console.log(`\x1b[90m→ Delegating to ${reg.name}\x1b[0m`);
      currentInput = await reg.agent.run(currentInput);
    }

    return currentInput;
  }

  private async runParallel(input: string): Promise<string> {
    console.log(`\x1b[90m→ Running ${this.agents.length} agents in parallel\x1b[0m\n`);

    const results = await Promise.all(
      this.agents.map(async (reg) => {
        const result = await reg.agent.run(input);
        return { name: reg.name, result };
      })
    );

    return results.map(r => `${r.name}:\n${r.result}`).join('\n\n');
  }

  private async runRouter(input: string): Promise<string> {
    // Simple keyword-based routing
    const inputLower = input.toLowerCase();

    for (const reg of this.agents) {
      for (const cap of reg.capabilities) {
        if (inputLower.includes(cap.toLowerCase())) {
          console.log(`\x1b[90m→ Routed to ${reg.name} (matched: "${cap}")\x1b[0m\n`);
          return reg.agent.run(input);
        }
      }
    }

    // Default to first agent
    console.log(`\x1b[90m→ Default routing to ${this.agents[0].name}\x1b[0m\n`);
    return this.agents[0].agent.run(input);
  }
}

// ============================================================================
// Demo Functions
// ============================================================================

async function demoSequential() {
  console.log('\x1b[36m');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Sequential Agent Pipeline Demo      ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('\x1b[0m');

  const orchestrator = new SimpleOrchestrator('sequential');
  orchestrator
    .register({
      agent: researchAgent,
      name: 'Research',
      description: 'Find information',
      capabilities: ['research', 'search', 'find'],
    })
    .register({
      agent: analystAgent,
      name: 'Analyst',
      description: 'Analyze the findings',
      capabilities: ['analyze', 'data', 'calculate'],
    })
    .register({
      agent: writerAgent,
      name: 'Writer',
      description: 'Write the final report',
      capabilities: ['write', 'content', 'blog'],
    });

  const result = await orchestrator.run(
    'Research the impact of AI on software development and write a report'
  );

  console.log('\n\x1b[32m=== Final Result ===\x1b[0m');
  console.log(result);
}

async function demoParallel() {
  console.log('\x1b[36m');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Parallel Agent Execution Demo       ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('\x1b[0m');

  const orchestrator = new SimpleOrchestrator('parallel');
  orchestrator
    .register({
      agent: researchAgent,
      name: 'Research',
      description: 'Research perspective',
      capabilities: [],
    })
    .register({
      agent: codeAgent,
      name: 'Code',
      description: 'Technical perspective',
      capabilities: [],
    })
    .register({
      agent: writerAgent,
      name: 'Writer',
      description: 'Communication perspective',
      capabilities: [],
    });

  const result = await orchestrator.run(
    'What are the best practices for building AI applications?'
  );

  console.log('\n\x1b[32m=== Aggregated Results ===\x1b[0m');
  console.log(result);
}

async function demoRouter() {
  console.log('\x1b[36m');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Smart Router Agent Demo             ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('\x1b[0m');

  const orchestrator = new SimpleOrchestrator('router');
  orchestrator
    .register({
      agent: researchAgent,
      name: 'Research',
      description: 'Information lookup',
      capabilities: ['research', 'search', 'find', 'learn', 'what is'],
    })
    .register({
      agent: codeAgent,
      name: 'Code',
      description: 'Code generation',
      capabilities: ['code', 'implement', 'function', 'class', 'typescript', 'javascript'],
    })
    .register({
      agent: writerAgent,
      name: 'Writer',
      description: 'Content creation',
      capabilities: ['write', 'blog', 'article', 'content', 'email', 'documentation'],
    })
    .register({
      agent: analystAgent,
      name: 'Analyst',
      description: 'Data analysis',
      capabilities: ['analyze', 'calculate', 'data', 'metrics', 'statistics'],
    });

  // Test different queries
  const queries = [
    'What is machine learning?',
    'Write a function to sort an array in TypeScript',
    'Calculate the average of 10, 20, 30, 40, 50',
    'Write a blog post about RANA',
  ];

  for (const query of queries) {
    console.log('\x1b[90m─────────────────────────────────────\x1b[0m');
    const result = await orchestrator.run(query);
    console.log('\n\x1b[32mResult:\x1b[0m');
    console.log(result);
    console.log();
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('\x1b[36m');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   🤖 RANA Multi-Agent Orchestration Demo  ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('\x1b[0m\n');

  // Run all demos
  await demoSequential();
  console.log('\n');

  await demoParallel();
  console.log('\n');

  await demoRouter();

  console.log('\x1b[36m\n=== Demo Complete ===\x1b[0m');
  console.log('This demonstrates RANA\'s agent orchestration capabilities.');
  console.log('In a real application, agents would be powered by LLMs and');
  console.log('connected to real tools and data sources.\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
