'use client';

import Link from 'next/link';

const codeExamples = [
  {
    title: 'Multi-Agent Team Setup',
    metagpt: `from metagpt.roles import ProductManager, Architect, Engineer
from metagpt.team import Team
from metagpt.config import Config

config = Config.default()

team = Team()
team.hire([
    ProductManager(),
    Architect(),
    Engineer(),
])

team.invest(investment=10.0)
team.run_project(idea="Build a weather app")

# Complex setup with roles, actions, and memories
# Requires understanding MetaGPT's role-based architecture`,
    rana: `import { createTeam, createOrchestrator } from '@rana/agents';

const orchestrator = createOrchestrator();

const { execute } = createTeam({
  coordinator: {
    id: 'pm',
    name: 'Product Manager',
    capabilities: ['planning', 'coordination'],
  },
  workers: [
    { id: 'architect', name: 'Architect', capabilities: ['design'] },
    { id: 'engineer', name: 'Engineer', capabilities: ['code'] },
  ],
});

const result = await execute({
  taskId: 'weather-app',
  description: 'Build a weather app',
  input: { idea: 'weather app with forecasts' },
});`,
  },
  {
    title: 'Agent Communication',
    metagpt: `from metagpt.roles import Role
from metagpt.actions import Action
from metagpt.messages import Message

class CustomAction(Action):
    name: str = "CustomAction"

    async def run(self, messages: list[Message]) -> str:
        # Process messages
        return "result"

class CustomRole(Role):
    name: str = "CustomRole"
    profile: str = "A custom agent"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.set_actions([CustomAction()])

    async def _act(self) -> Message:
        result = await self.todo.run(self.rc.memory.get())
        return Message(content=result, role=self.profile)

# Requires understanding OOP patterns and async execution`,
    rana: `import { AgentOrchestrator } from '@rana/agents';

const orchestrator = new AgentOrchestrator();

// Register agents
orchestrator.registerAgent({
  id: 'custom-agent',
  name: 'Custom Agent',
  capabilities: ['custom-task'],
});

// Simple message passing
await orchestrator.sendMessage('custom-agent', {
  type: 'task',
  content: { action: 'process', data: input },
});

// Listen for responses
orchestrator.on((event) => {
  if (event.type === 'message') {
    console.log('Agent response:', event.message);
  }
});`,
  },
  {
    title: 'Shared State Management',
    metagpt: `from metagpt.environment import Environment
from metagpt.memory import Memory, LongTermMemory

# MetaGPT uses environment and memory classes
env = Environment()

# Memory is tied to roles
class MyRole(Role):
    def __init__(self):
        super().__init__()
        self.rc.memory = Memory()
        self.rc.long_term_memory = LongTermMemory()

    async def _observe(self):
        # Observe messages from environment
        await super()._observe()

    async def _think(self):
        # Access memory for context
        memories = self.rc.memory.get()
        # Complex memory management`,
    rana: `import { SharedStateManager } from '@rana/agents';

const stateManager = new SharedStateManager({ taskCount: 0 });

// Simple state updates
await stateManager.update({
  type: 'set',
  key: 'currentTask',
  value: 'weather-app',
});

// Transactions for consistency
await stateManager.transaction('tx-1', async (state) => {
  state.taskCount++;
  state.lastUpdated = Date.now();
  return state;
});

// Subscribe to changes
stateManager.subscribe((state) => {
  console.log('State changed:', state);
});`,
  },
  {
    title: 'Consensus & Voting',
    metagpt: `# MetaGPT doesn't have built-in consensus mechanisms
# You would need to implement custom logic:

class ConsensusRole(Role):
    async def vote(self, proposal):
        # Manual implementation needed
        pass

# Coordinate multiple roles manually
results = []
for role in team.roles:
    vote = await role.vote(proposal)
    results.append(vote)

# Count votes manually
consensus = sum(results) > len(results) / 2`,
    rana: `import { createConsensusGroup } from '@rana/agents';

const { vote } = createConsensusGroup([
  { id: 'reviewer-1', name: 'Reviewer 1', capabilities: ['review'] },
  { id: 'reviewer-2', name: 'Reviewer 2', capabilities: ['review'] },
  { id: 'reviewer-3', name: 'Reviewer 3', capabilities: ['review'] },
], {
  quorum: 2,
  votingStrategy: 'majority',
});

const result = await vote({
  taskId: 'approve-design',
  description: 'Approve the weather app design',
  input: { design: designDoc },
});

console.log(result.consensusReached); // true/false
console.log(result.votes); // { approve: 2, reject: 1 }`,
  },
];

export default function MetaGPTComparisonPage() {
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
            RANA vs MetaGPT
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            MetaGPT pioneered multi-agent frameworks but requires Python and
            complex OOP patterns. RANA brings the same power to TypeScript with
            a simpler API.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">TypeScript</div>
            <div className="text-gray-400">First-class Support</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">4</div>
            <div className="text-gray-400">Orchestration Patterns</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">Built-in</div>
            <div className="text-gray-400">State Management</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">Simpler</div>
            <div className="text-gray-400">Learning Curve</div>
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
                      MetaGPT
                    </span>
                    <span className="text-gray-500 text-sm">
                      {example.metagpt.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto text-sm">
                    <code className="text-gray-300">{example.metagpt}</code>
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

        <div className="mt-16 p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
          <h2 className="text-2xl font-semibold mb-6">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-4 px-4 font-semibold">Feature</th>
                  <th className="py-4 px-4 font-semibold text-center">RANA</th>
                  <th className="py-4 px-4 font-semibold text-center">MetaGPT</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Primary Language</td>
                  <td className="py-4 px-4 text-center text-green-400">TypeScript</td>
                  <td className="py-4 px-4 text-center text-yellow-400">Python</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Multi-agent orchestration</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Built-in consensus voting</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Transactional state</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Event system</td>
                  <td className="py-4 px-4 text-center text-green-400">✓</td>
                  <td className="py-4 px-4 text-center text-yellow-400">Limited</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-4 px-4">Web deployment</td>
                  <td className="py-4 px-4 text-center text-green-400">Native</td>
                  <td className="py-4 px-4 text-center text-yellow-400">FastAPI</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">Learning curve</td>
                  <td className="py-4 px-4 text-center text-green-400">Easy</td>
                  <td className="py-4 px-4 text-center text-yellow-400">Steep</td>
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
                  Need simpler multi-agent patterns
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Want built-in consensus voting
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Prefer functional over OOP
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Deploy to web platforms (Vercel, etc.)
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-yellow-400 mb-4">Choose MetaGPT if you:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Need Python ecosystem integration
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Want predefined software team roles
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Prefer OOP architecture patterns
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Have existing Python AI infrastructure
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
