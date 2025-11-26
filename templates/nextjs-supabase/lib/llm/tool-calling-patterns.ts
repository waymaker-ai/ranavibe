/**
 * LUKA - Tool Calling & Function Patterns
 * Native tool use with Gemini 2.0 Flash, GPT-4, Claude
 */

import { luka, Tool, Message } from './unified-client';

/**
 * Define available tools/functions
 */
export const tools: Tool[] = [
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or zip code',
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature unit',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'search_database',
    description: 'Search the product database',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        category: {
          type: 'string',
          description: 'Product category filter',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'send_email',
    description: 'Send an email to a user',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address',
        },
        subject: {
          type: 'string',
          description: 'Email subject',
        },
        body: {
          type: 'string',
          description: 'Email body content',
        },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: 'get_current_time',
    description: 'Get the current time in a specific timezone',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'IANA timezone identifier (e.g., America/New_York)',
        },
      },
      required: ['timezone'],
    },
  },
];

/**
 * Tool implementations
 */
export const toolImplementations = {
  async get_weather(args: { location: string; unit?: string }) {
    // In production, call actual weather API
    return {
      location: args.location,
      temperature: 72,
      unit: args.unit || 'fahrenheit',
      conditions: 'Partly cloudy',
      humidity: 65,
    };
  },

  async search_database(args: { query: string; category?: string; limit?: number }) {
    // In production, query actual database
    return {
      results: [
        { id: 1, name: 'Product A', category: args.category || 'general', price: 29.99 },
        { id: 2, name: 'Product B', category: args.category || 'general', price: 49.99 },
      ],
      total: 2,
      query: args.query,
    };
  },

  async send_email(args: { to: string; subject: string; body: string }) {
    // In production, use email service (SendGrid, Resend, etc.)
    console.log(`Sending email to ${args.to}: ${args.subject}`);
    return {
      success: true,
      message: `Email sent to ${args.to}`,
    };
  },

  async calculate(args: { expression: string }) {
    try {
      // IMPORTANT: In production, use a safe math parser, not eval()
      // This is for demonstration only
      const result = eval(args.expression);
      return { result, expression: args.expression };
    } catch (error) {
      return { error: 'Invalid expression' };
    }
  },

  async get_current_time(args: { timezone: string }) {
    const now = new Date();
    return {
      timezone: args.timezone,
      time: now.toLocaleString('en-US', { timeZone: args.timezone }),
      timestamp: now.getTime(),
    };
  },
};

/**
 * Agent with tool calling
 * This implements a complete tool-calling loop
 */
export async function agentChat(userMessage: string, maxIterations = 5) {
  const messages: Message[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant with access to tools. Use them when needed to answer user questions accurately.',
    },
    {
      role: 'user',
      content: userMessage,
    },
  ];

  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    // Call LLM with tools
    const response = await luka.chat({
      model: 'gpt-4o', // or 'gemini-2.0-flash-exp' or 'claude-3-5-sonnet-20241022'
      messages,
      tools,
      temperature: 0.7,
    });

    // If no tool calls, we're done
    if (!response.toolCalls || response.toolCalls.length === 0) {
      return {
        answer: response.content,
        iterations: iteration,
        totalCost: response.cost,
      };
    }

    // Execute tool calls
    for (const toolCall of response.toolCalls) {
      const toolName = toolCall.name as keyof typeof toolImplementations;
      const toolFunction = toolImplementations[toolName];

      if (!toolFunction) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      // Execute the tool
      const toolResult = await toolFunction(toolCall.arguments as any);

      // Add tool result to conversation
      messages.push({
        role: 'assistant',
        content: JSON.stringify(toolCall),
      });

      messages.push({
        role: 'user',
        content: `Tool ${toolName} returned: ${JSON.stringify(toolResult)}`,
      });
    }
  }

  throw new Error('Max iterations reached');
}

/**
 * RAG (Retrieval Augmented Generation) Pattern
 * Combines vector search with LLM generation
 */
export async function ragQuery(question: string, context: string[]) {
  const messages: Message[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant. Answer questions based on the provided context. If the answer is not in the context, say so.',
    },
    {
      role: 'user',
      content: `Context:\n${context.join('\n\n')}\n\nQuestion: ${question}`,
    },
  ];

  return await luka.chat({
    model: 'gemini-2.0-flash-exp', // Fast and cheap for RAG
    messages,
    temperature: 0.3, // Low temperature for factual answers
  });
}

/**
 * Multi-step Agent Pattern
 * Break down complex tasks into steps
 */
export async function multiStepAgent(task: string) {
  // Step 1: Break down the task
  const planResponse = await luka.chat({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Break down complex tasks into clear, numbered steps. Return only the steps as a JSON array.',
      },
      {
        role: 'user',
        content: task,
      },
    ],
    temperature: 0.5,
  });

  const steps = JSON.parse(planResponse.content);
  const results: any[] = [];

  // Step 2: Execute each step
  for (const step of steps) {
    const stepResult = await agentChat(step, 3);
    results.push({
      step,
      result: stepResult.answer,
      cost: stepResult.totalCost,
    });
  }

  // Step 3: Synthesize final answer
  const synthesisResponse = await luka.chat({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Synthesize the results of multiple steps into a coherent final answer.',
      },
      {
        role: 'user',
        content: `Original task: ${task}\n\nStep results:\n${JSON.stringify(results, null, 2)}`,
      },
    ],
  });

  return {
    task,
    steps,
    stepResults: results,
    finalAnswer: synthesisResponse.content,
    totalCost: results.reduce((sum, r) => sum + r.cost, 0) + synthesisResponse.cost,
  };
}

/**
 * Agentic Coding Pattern (Gemini 3 feature)
 * Single-prompt app generation
 */
export async function generateApp(appDescription: string) {
  const messages: Message[] = [
    {
      role: 'system',
      content: 'You are an expert full-stack developer. Generate complete, production-ready code based on user descriptions.',
    },
    {
      role: 'user',
      content: `Create a ${appDescription}. Include:
- Complete file structure
- All necessary code files
- Setup instructions
- Dependencies (package.json)

Return as JSON with this structure:
{
  "files": [
    { "path": "src/index.ts", "content": "..." },
    ...
  ],
  "setup": "installation instructions",
  "dependencies": { ... }
}`,
    },
  ];

  return await luka.chat({
    model: 'gemini-3', // Best for agentic coding
    messages,
    temperature: 0.7,
    maxTokens: 8192,
  });
}

/**
 * Example: Using Native Google Search with Gemini 2.0 Flash
 */
export async function searchAndAnswer(question: string) {
  // Gemini 2.0 Flash can natively call Google Search
  // This is a simplified example - actual implementation depends on Gemini API
  const messages: Message[] = [
    {
      role: 'user',
      content: `Use Google Search to find current information and answer: ${question}`,
    },
  ];

  return await luka.chat({
    model: 'gemini-2.0-flash-exp',
    messages,
    tools: [
      {
        name: 'google_search',
        description: 'Search Google for real-time information',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        },
      },
    ],
  });
}

/**
 * Parallel Tool Execution Pattern
 * Execute multiple tools simultaneously for speed
 */
export async function parallelToolExecution(tasks: string[]) {
  const promises = tasks.map(task => agentChat(task, 3));
  const results = await Promise.all(promises);

  return results.map((result, i) => ({
    task: tasks[i],
    answer: result.answer,
    cost: result.totalCost,
  }));
}

/**
 * Example Usage
 */
export const exampleToolUsage = `
// Simple agent chat
const result = await agentChat("What's the weather in San Francisco and send an email summary to team@company.com");
console.log(result.answer);

// RAG query
const docs = ["Document 1 content...", "Document 2 content..."];
const answer = await ragQuery("What does the policy say about refunds?", docs);

// Multi-step complex task
const project = await multiStepAgent("Build a todo app with authentication and database");
console.log(project.finalAnswer);

// Generate app with Gemini 3
const app = await generateApp("simple blog with markdown support");
const appCode = JSON.parse(app.content);
console.log(appCode.files);

// Parallel execution
const tasks = [
  "Calculate 15% tip on $85",
  "What time is it in Tokyo?",
  "Search for latest Next.js features"
];
const results = await parallelToolExecution(tasks);
`;
