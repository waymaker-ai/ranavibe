'use client';

import Link from 'next/link';

const codeExamples = [
  {
    title: 'Creating a Crew',
    crewai: `from crewai import Agent, Task, Crew, Process

# Define agents
researcher = Agent(
    role='Senior Research Analyst',
    goal='Uncover cutting-edge developments',
    backstory='You are a senior researcher...',
    verbose=True,
    allow_delegation=False,
    tools=[SearchTool(), WebScraperTool()]
)

writer = Agent(
    role='Content Writer',
    goal='Create engaging content',
    backstory='You are a skilled writer...',
    verbose=True,
    allow_delegation=True
)

# Define tasks
research_task = Task(
    description='Research the latest AI trends',
    expected_output='A comprehensive report',
    agent=researcher
)

write_task = Task(
    description='Write an article based on research',
    expected_output='A blog article',
    agent=writer,
    context=[research_task]
)

# Create and run crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential,
    verbose=True
)

result = crew.kickoff()`,
    rana: `import { createPipeline } from '@rana/agents';

const { orchestrator, execute } = createPipeline([
  {
    id: 'researcher',
    name: 'Research Analyst',
    capabilities: ['research', 'summarize'],
  },
  {
    id: 'writer',
    name: 'Content Writer',
    capabilities: ['write', 'edit'],
  },
]);

const result = await execute({
  taskId: 'ai-trends-article',
  description: 'Research AI trends and write an article',
  input: { topic: 'AI trends' },
});`,
  },
  {
    title: 'Parallel Execution',
    crewai: `from crewai import Crew, Process

# Define multiple agents for parallel work
agent1 = Agent(role='Analyst 1', ...)
agent2 = Agent(role='Analyst 2', ...)
agent3 = Agent(role='Analyst 3', ...)

task1 = Task(description='Analyze market A', agent=agent1)
task2 = Task(description='Analyze market B', agent=agent2)
task3 = Task(description='Analyze market C', agent=agent3)

# CrewAI hierarchical process
crew = Crew(
    agents=[agent1, agent2, agent3],
    tasks=[task1, task2, task3],
    process=Process.hierarchical,  # Not truly parallel
    manager_llm=ChatOpenAI()
)

result = crew.kickoff()`,
    rana: `import { createWorkerPool } from '@rana/agents';

const { execute } = createWorkerPool([
  { id: 'analyst-1', name: 'Analyst 1', capabilities: ['analyze'] },
  { id: 'analyst-2', name: 'Analyst 2', capabilities: ['analyze'] },
  { id: 'analyst-3', name: 'Analyst 3', capabilities: ['analyze'] },
]);

// True parallel execution
const results = await execute([
  { taskId: 'market-a', description: 'Analyze market A', input: {} },
  { taskId: 'market-b', description: 'Analyze market B', input: {} },
  { taskId: 'market-c', description: 'Analyze market C', input: {} },
]);

// results = [resultA, resultB, resultC] - all executed in parallel`,
  },
  {
    title: 'Tool Integration',
    crewai: `from crewai import Agent
from crewai_tools import SerperDevTool, WebsiteSearchTool

# Tools require separate crewai_tools package
search_tool = SerperDevTool()
web_tool = WebsiteSearchTool()

agent = Agent(
    role='Researcher',
    goal='Find information',
    backstory='...',
    tools=[search_tool, web_tool],
    verbose=True
)

# Tool execution is handled by the agent
# Custom tools require specific interface implementation`,
    rana: `import { createTool, createAgent } from '@rana/agents';

// Simple tool creation
const searchTool = createTool({
  name: 'search',
  description: 'Search the web',
  parameters: { query: { type: 'string' } },
  handler: async ({ query }) => {
    // Your search implementation
    return results;
  },
});

const webTool = createTool({
  name: 'fetch_page',
  description: 'Fetch a webpage',
  parameters: { url: { type: 'string' } },
  handler: async ({ url }) => {
    const res = await fetch(url);
    return res.text();
  },
});

// Use with any agent
const agent = createAgent({
  tools: [searchTool, webTool],
});`,
  },
  {
    title: 'Memory & Context',
    crewai: `from crewai import Agent
from crewai.memory import LongTermMemory, ShortTermMemory

# Memory configuration
agent = Agent(
    role='Assistant',
    goal='Help users',
    backstory='...',
    memory=True,  # Enable memory
    long_term_memory=LongTermMemory(),
    short_term_memory=ShortTermMemory()
)

# Memory is implicit and managed internally
# Limited control over memory operations`,
    rana: `import { SharedStateManager, createOrchestrator } from '@rana/agents';

const orchestrator = createOrchestrator({
  conversationHistory: [],
  userPreferences: {},
});

// Explicit state management
await orchestrator.updateState({
  type: 'append',
  key: 'conversationHistory',
  value: { role: 'user', content: 'Hello' },
});

// Transaction support for complex updates
await orchestrator.transaction('update-context', async (state) => {
  state.conversationHistory.push(newMessage);
  state.lastUpdated = Date.now();
  return state;
});

// Subscribe to state changes
orchestrator.subscribeToState((state) => {
  console.log('Memory updated:', state);
});`,
  },
];

export default function CrewAIComparisonPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Link
          href="/compare"
          className="text-gray-400 hover:text-white mb-8 inline-flex items-center gap-2"
        >
          ← Back to comparisons
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            RANA vs CrewAI
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            CrewAI made multi-agent systems accessible but is Python-only.
            RANA brings similar patterns to TypeScript with better parallel
            execution and state management.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">True</div>
            <div className="text-gray-400">Parallel Execution</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">ACID</div>
            <div className="text-gray-400">State Transactions</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">Simple</div>
            <div className="text-gray-400">Tool Creation</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">Web</div>
            <div className="text-gray-400">Native Deployment</div>
          </div>
        </div>

        <div className="space-y-16">
          {codeExamples.map((example, index) => (
            <div key={index} className="space-y-6">
              <h2 className="text-2xl font-semibold">{example.title}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                      CrewAI
                    </span>
                    <span className="text-gray-500 text-sm">
                      {example.crewai.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto text-sm">
                    <code className="text-gray-300">{example.crewai}</code>
                  </pre>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                      RANA
                    </span>
                    <span className="text-gray-500 text-sm">
                      {example.rana.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto text-sm">
                    <code className="text-gray-300">{example.rana}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-orange-900/20 to-red-900/20">
          <h2 className="text-2xl font-semibold mb-6">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-4 px-4 font-semibold">Feature</th>
                  <th className="py-4 px-4 font-semibold text-center">RANA</th>
                  <th className="py-4 px-4 font-semibold text-center">CrewAI</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Primary Language</td>
                  <td className="py-4 px-4 text-center text-green-400">TypeScript</td>
                  <td className="py-4 px-4 text-center text-yellow-400">Python</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">True parallel execution</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-yellow-400">Limited</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Sequential pipeline</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Hierarchical teams</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Consensus voting</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Transactional state</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Custom tool creation</td>
                  <td className="py-4 px-4 text-center text-green-400">Simple</td>
                  <td className="py-4 px-4 text-center text-yellow-400">Separate pkg</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">Event system</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-yellow-400">Callbacks</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-900/20 to-purple-900/20">
          <h2 className="text-2xl font-semibold mb-6">When to Choose RANA</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-4">Choose RANA if you:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Build with TypeScript/JavaScript
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Need true parallel task execution
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Want transactional state management
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Need consensus-based decisions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Deploy to serverless/edge
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-yellow-400 mb-4">Choose CrewAI if you:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Prefer Python ecosystem
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Like role-based agent personas
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Need crewai_tools integrations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Have existing Python infrastructure
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="https://github.com/waymaker-ai/ranavibe"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
          >
            Try RANA Now
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
