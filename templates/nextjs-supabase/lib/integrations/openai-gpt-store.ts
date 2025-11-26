/**
 * LUKA - OpenAI GPT Store Integration
 * Build and deploy custom GPTs to the OpenAI GPT Store
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * GPT Configuration for OpenAI GPT Store
 */
export interface GPTConfig {
  name: string;
  description: string;
  instructions: string;
  welcome_message?: string;
  prompt_starters?: string[];
  tools?: GPTTool[];
  files?: string[]; // File IDs for knowledge base
  model?: 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  capabilities?: {
    web_browsing?: boolean;
    dalle_image_generation?: boolean;
    code_interpreter?: boolean;
  };
}

export interface GPTTool {
  type: 'function' | 'code_interpreter' | 'retrieval';
  function?: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/**
 * Create a Custom GPT
 */
export async function createCustomGPT(config: GPTConfig) {
  // Create assistant with GPT Store configuration
  const assistant = await openai.beta.assistants.create({
    name: config.name,
    description: config.description,
    instructions: config.instructions,
    model: config.model || 'gpt-4o',
    tools: config.tools?.map(t => ({
      type: t.type,
      ...(t.function && { function: t.function }),
    })) || [],
    file_ids: config.files || [],
  });

  return {
    id: assistant.id,
    name: assistant.name,
    url: `https://chat.openai.com/g/${assistant.id}`,
    instructions: config.instructions,
    promptStarters: config.prompt_starters,
  };
}

/**
 * Pre-configured GPT Templates
 */

// 1. Code Review GPT
export const codeReviewGPT: GPTConfig = {
  name: 'LUKA Code Reviewer',
  description: 'Expert code reviewer that analyzes code quality, security, and best practices',
  instructions: `You are an expert code reviewer with deep knowledge of software engineering best practices, security, and performance optimization.

Your responsibilities:
1. Review code for bugs, security vulnerabilities, and performance issues
2. Suggest improvements following SOLID principles and design patterns
3. Check for proper error handling and edge cases
4. Ensure code readability and maintainability
5. Validate test coverage

Always provide:
- Specific line-by-line feedback
- Severity rating (Critical/High/Medium/Low)
- Code examples for improvements
- Security considerations (OWASP Top 10)`,
  prompt_starters: [
    'Review this React component for best practices',
    'Check this API endpoint for security issues',
    'Analyze this database query for performance',
    'Review my error handling implementation',
  ],
  tools: [
    {
      type: 'code_interpreter',
    },
  ],
  capabilities: {
    web_browsing: true,
    code_interpreter: true,
  },
};

// 2. Product Manager GPT
export const productManagerGPT: GPTConfig = {
  name: 'LUKA Product Manager',
  description: 'AI Product Manager that helps with PRDs, user stories, and roadmaps',
  instructions: `You are an experienced Product Manager with expertise in:
- Writing detailed Product Requirements Documents (PRDs)
- Creating user stories and acceptance criteria
- Building product roadmaps and prioritization
- Conducting competitive analysis
- Defining metrics and KPIs

Format outputs as:
- User stories: "As a [user], I want [goal], so that [benefit]"
- Acceptance criteria: Given/When/Then format
- PRDs: Problem, Solution, Requirements, Success Metrics
- Always include technical considerations for engineering teams`,
  prompt_starters: [
    'Create a PRD for a new feature',
    'Write user stories for authentication',
    'Build a product roadmap',
    'Define KPIs for user engagement',
  ],
  capabilities: {
    web_browsing: true,
  },
};

// 3. Marketing Content GPT
export const marketingContentGPT: GPTConfig = {
  name: 'LUKA Marketing Writer',
  description: 'Expert marketing copywriter for ads, emails, landing pages, and social media',
  instructions: `You are a seasoned marketing copywriter specializing in:
- Conversion-focused landing pages
- Email campaigns (subject lines, body, CTAs)
- Social media posts (Twitter, LinkedIn, Facebook)
- Ad copy (Google Ads, Facebook Ads)
- SEO-optimized blog posts

Writing principles:
- AIDA framework (Attention, Interest, Desire, Action)
- Clear value propositions
- Strong CTAs
- Benefit-focused language
- SEO keywords naturally integrated

Always provide:
- 3-5 variations for A/B testing
- Character counts for platforms
- SEO keyword suggestions
- Target audience considerations`,
  prompt_starters: [
    'Write a landing page for LUKA framework',
    'Create email campaign for product launch',
    'Generate social media posts for LinkedIn',
    'Write Google Ads copy for AI developers',
  ],
  capabilities: {
    web_browsing: true,
  },
};

// 4. Data Analyst GPT
export const dataAnalystGPT: GPTConfig = {
  name: 'LUKA Data Analyst',
  description: 'AI Data Analyst for insights, visualizations, and SQL queries',
  instructions: `You are an expert Data Analyst proficient in:
- SQL query writing and optimization
- Data visualization recommendations
- Statistical analysis
- KPI tracking and metrics
- Python/Pandas for data manipulation

When analyzing data:
1. Ask clarifying questions about the dataset
2. Suggest appropriate visualizations
3. Provide SQL queries with explanations
4. Calculate relevant statistics
5. Identify trends and anomalies
6. Recommend actionable insights

Output format:
- SQL queries with comments
- Chart recommendations (bar, line, pie, etc.)
- Statistical summaries
- Business insights and recommendations`,
  prompt_starters: [
    'Analyze user engagement metrics',
    'Write SQL for revenue by category',
    'Suggest visualizations for dashboard',
    'Calculate customer churn rate',
  ],
  tools: [
    {
      type: 'code_interpreter',
    },
  ],
  capabilities: {
    code_interpreter: true,
  },
};

// 5. Customer Support GPT
export const customerSupportGPT: GPTConfig = {
  name: 'LUKA Support Agent',
  description: 'AI customer support agent with product knowledge and empathy',
  instructions: `You are a helpful, empathetic customer support agent with deep product knowledge.

Guidelines:
- Always be friendly, patient, and professional
- Use the customer's name when provided
- Acknowledge frustration and show empathy
- Provide step-by-step solutions
- Escalate to human when needed
- Follow up to ensure issue resolution

Response structure:
1. Empathy statement
2. Understanding of the issue
3. Step-by-step solution
4. Additional resources/links
5. Follow-up question

Never:
- Make promises you can't keep
- Blame the customer
- Use technical jargon without explanation
- Provide incorrect information (say "I'll check" instead)`,
  prompt_starters: [
    "I can't log into my account",
    'How do I integrate LUKA with my project?',
    'My deployment failed, what should I do?',
    'Can you explain the pricing?',
  ],
  capabilities: {
    web_browsing: true,
  },
};

/**
 * Upload files for GPT knowledge base
 */
export async function uploadKnowledgeBase(filePath: string) {
  const file = await openai.files.create({
    file: await fetch(filePath).then(r => r.blob()),
    purpose: 'assistants',
  });

  return file.id;
}

/**
 * Create GPT with custom actions (API integrations)
 */
export async function createGPTWithActions(config: GPTConfig & {
  actions: {
    name: string;
    description: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    parameters?: Record<string, any>;
  }[];
}) {
  // Convert actions to function tools
  const tools: GPTTool[] = config.actions.map(action => ({
    type: 'function' as const,
    function: {
      name: action.name,
      description: action.description,
      parameters: action.parameters || {
        type: 'object',
        properties: {},
      },
    },
  }));

  return createCustomGPT({
    ...config,
    tools,
  });
}

/**
 * Example: LUKA Framework Assistant GPT
 */
export const lukaFrameworkGPT: GPTConfig = {
  name: 'LUKA Framework Assistant',
  description: 'Expert assistant for the LUKA AI development framework',
  instructions: `You are the official LUKA Framework assistant, helping developers build production AI apps.

Knowledge:
- LUKA supports 9 LLM providers (OpenAI, Anthropic, Google Gemini 3 & 2.0 Flash, xAI Grok, Mistral, Cohere, Together.ai, Groq, Ollama)
- 70% LLM cost reduction through caching, smart routing, prompt optimization
- Complete frameworks: Database, Security, LLM, SEO, Mobile
- Quality gates enforced: Security 95/100, SEO 90/100, Mobile 95/100
- 22+ CLI commands for automation
- Next.js 14 + Supabase production template
- RAG with vector databases (Supabase pgvector)
- Multimodal support (Gemini 2.0 Flash)
- Real-time streaming, agent patterns, tool calling

Help developers:
1. Choose the right LLM provider for their use case
2. Optimize costs (compare providers, suggest caching)
3. Implement features (RAG, multimodal, agents)
4. Debug issues
5. Deploy to production

Always:
- Provide code examples
- Explain trade-offs
- Suggest cost-effective solutions
- Link to documentation
- Show CLI commands`,
  prompt_starters: [
    'How do I add Gemini 2.0 Flash to my project?',
    'What's the cheapest provider for simple tasks?',
    'Help me implement RAG with vector search',
    'How do I optimize my LLM costs?',
  ],
  capabilities: {
    web_browsing: true,
    code_interpreter: true,
  },
};

/**
 * Deploy GPT to store
 */
export async function deployToGPTStore(gpt: GPTConfig) {
  const assistant = await createCustomGPT(gpt);

  console.log(`
✅ GPT Created Successfully!

Name: ${assistant.name}
URL: ${assistant.url}

Next steps:
1. Visit ${assistant.url}
2. Test your GPT
3. Submit for review (Settings → Builder → Publish)
4. Choose visibility: Public, Anyone with link, or Private

Publishing requirements:
- Unique name
- Clear description
- Verified domain (for public GPTs)
- Compliant with OpenAI usage policies
`);

  return assistant;
}

/**
 * Example: Deploy all LUKA GPTs
 */
export async function deployAllLukaGPTs() {
  const gpts = [
    lukaFrameworkGPT,
    codeReviewGPT,
    productManagerGPT,
    marketingContentGPT,
    dataAnalystGPT,
    customerSupportGPT,
  ];

  const results = await Promise.all(
    gpts.map(gpt => deployToGPTStore(gpt))
  );

  console.log(`
🎉 Deployed ${results.length} GPTs to OpenAI!

Access them at:
${results.map(r => `- ${r.name}: ${r.url}`).join('\n')}

Share your GPTs:
- Add to GPT Store for monetization
- Share with team members
- Embed in your website
`);

  return results;
}

/**
 * Installation:
 * Already using OpenAI SDK
 *
 * Usage:
 * import { createCustomGPT, lukaFrameworkGPT } from '@/lib/integrations/openai-gpt-store';
 *
 * const gpt = await createCustomGPT(lukaFrameworkGPT);
 * console.log(gpt.url);
 */
