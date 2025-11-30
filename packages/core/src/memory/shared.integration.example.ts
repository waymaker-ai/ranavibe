/**
 * SharedMemory Integration Example with RANA Agents
 * Demonstrates how to use SharedMemory in a multi-agent system
 */

import { BaseAgent, AgentConfig } from '../agents/base';
import { createSharedMemory, SharedMemory } from './shared';

/**
 * Research Agent - Gathers information and shares findings
 */
class ResearchAgent extends BaseAgent {
  private sharedMemory: SharedMemory;

  constructor(config: AgentConfig, sharedMemory: SharedMemory) {
    super(config);
    this.sharedMemory = sharedMemory;
  }

  protected async executeLoop(input: string): Promise<string> {
    this.log('Starting research...');

    // Simulate research
    const findings = {
      topic: input,
      summary: 'Research findings on ' + input,
      sources: ['source1', 'source2'],
      confidence: 0.85,
    };

    // Share findings with other agents
    this.sharedMemory.write(
      'research-findings',
      `research-${Date.now()}`,
      findings,
      this.config.name
    );

    this.log('Research complete, findings shared');
    return `Research complete on "${input}". Findings shared with team.`;
  }
}

/**
 * Writer Agent - Uses research to write content
 */
class WriterAgent extends BaseAgent {
  private sharedMemory: SharedMemory;

  constructor(config: AgentConfig, sharedMemory: SharedMemory) {
    super(config);
    this.sharedMemory = sharedMemory;

    // Subscribe to research findings
    this.sharedMemory.subscribe('research-findings', this.config.name, (data) => {
      this.log(`New research available: ${data.key}`);
      this.handleNewResearch(data.value);
    });
  }

  private handleNewResearch(research: any): void {
    // Store in agent's context for later use
    this.setContext('latest-research', research);
  }

  protected async executeLoop(input: string): Promise<string> {
    this.log('Starting writing...');

    // Check for available research
    const allResearch = this.sharedMemory.getAll('research-findings', this.config.name);

    const draft = {
      title: input,
      content: 'Content based on research...',
      references: allResearch,
    };

    // Share draft for review
    this.sharedMemory.write(
      'drafts',
      `draft-${Date.now()}`,
      draft,
      this.config.name
    );

    this.log('Draft complete and shared for review');
    return `Draft written on "${input}". Sent for review.`;
  }
}

/**
 * Editor Agent - Reviews and approves content
 */
class EditorAgent extends BaseAgent {
  private sharedMemory: SharedMemory;

  constructor(config: AgentConfig, sharedMemory: SharedMemory) {
    super(config);
    this.sharedMemory = sharedMemory;

    // Subscribe to drafts
    this.sharedMemory.subscribe('drafts', this.config.name, (data) => {
      this.log(`New draft available: ${data.key}`);
      this.handleNewDraft(data.key, data.value);
    });
  }

  private async handleNewDraft(key: string, draft: any): Promise<void> {
    // Simulate review
    const approved = true; // In real scenario, this would be LLM-based review

    if (approved) {
      this.sharedMemory.write(
        'approved-content',
        key.replace('draft-', 'approved-'),
        { ...draft, status: 'approved' },
        this.config.name
      );

      // Notify team
      this.sharedMemory.broadcast(
        'team-updates',
        {
          type: 'approval',
          draft: key,
          message: 'Content approved and ready for publication',
        },
        this.config.name
      );
    }
  }

  protected async executeLoop(input: string): Promise<string> {
    this.log('Reviewing content...');

    const drafts = this.sharedMemory.getAll('drafts', this.config.name);
    const draftCount = Object.keys(drafts || {}).length;

    return `Reviewed ${draftCount} drafts. Approvals sent to team.`;
  }
}

/**
 * Coordinator Agent - Orchestrates the workflow
 */
class CoordinatorAgent extends BaseAgent {
  private sharedMemory: SharedMemory;
  private researchers: ResearchAgent[] = [];
  private writers: WriterAgent[] = [];
  private editors: EditorAgent[] = [];

  constructor(config: AgentConfig, sharedMemory: SharedMemory) {
    super(config);
    this.sharedMemory = sharedMemory;

    // Listen to all team updates
    this.sharedMemory.on('memory:broadcast', (msg) => {
      if (msg.namespace === 'team-updates') {
        this.log(`Team update from ${msg.from}: ${JSON.stringify(msg.message)}`);
      }
    });
  }

  async setupTeam(): Promise<void> {
    this.log('Setting up shared memory namespaces...');

    // Create namespaces with appropriate permissions
    this.sharedMemory.createNamespace('research-findings', {
      defaultPermission: 'read',
      permissions: {
        'researcher-1': 'write',
        'researcher-2': 'write',
        [this.config.name]: 'admin',
      },
      conflictStrategy: 'merge',
    });

    this.sharedMemory.createNamespace('drafts', {
      defaultPermission: 'read',
      permissions: {
        'writer-1': 'write',
        'writer-2': 'write',
        'editor-1': 'write',
        [this.config.name]: 'admin',
      },
      conflictStrategy: 'latest-wins',
    });

    this.sharedMemory.createNamespace('approved-content', {
      defaultPermission: 'read',
      permissions: {
        'editor-1': 'write',
        [this.config.name]: 'admin',
      },
    });

    this.sharedMemory.createNamespace('team-updates', {
      defaultPermission: 'read',
    });

    // Create agents
    this.researchers = [
      new ResearchAgent(
        { name: 'researcher-1', description: 'Research Agent 1' },
        this.sharedMemory
      ),
    ];

    this.writers = [
      new WriterAgent(
        { name: 'writer-1', description: 'Writer Agent 1' },
        this.sharedMemory
      ),
    ];

    this.editors = [
      new EditorAgent(
        { name: 'editor-1', description: 'Editor Agent 1' },
        this.sharedMemory
      ),
    ];

    this.log('Team setup complete');
  }

  async executeWorkflow(topic: string): Promise<string> {
    this.log(`Starting workflow for topic: ${topic}`);

    // Step 1: Research
    await this.researchers[0].run(`Research topic: ${topic}`);

    // Step 2: Write (automatically triggered by subscription)
    await this.writers[0].run(`Write article: ${topic}`);

    // Step 3: Review (automatically triggered by subscription)
    await this.editors[0].run(`Review content`);

    // Get final results
    const approvedContent = this.sharedMemory.getAll('approved-content', this.config.name);
    const stats = this.sharedMemory.getStats();

    this.log('Workflow complete', { stats, approvedCount: Object.keys(approvedContent || {}).length });

    return `Workflow complete. ${Object.keys(approvedContent || {}).length} pieces approved.`;
  }

  protected async executeLoop(input: string): Promise<string> {
    await this.setupTeam();
    return await this.executeWorkflow(input);
  }
}

/**
 * Example usage
 */
export async function runMultiAgentExample() {
  console.log('=== Multi-Agent Collaboration Example ===\n');

  // Create shared memory
  const sharedMemory = createSharedMemory({
    maxLogSize: 500,
    cleanupIntervalMs: 60000,
  });

  // Create coordinator
  const coordinator = new CoordinatorAgent(
    {
      name: 'coordinator',
      description: 'Workflow Coordinator',
      verbose: true,
    },
    sharedMemory
  );

  // Run workflow
  const result = await coordinator.run('Artificial Intelligence trends in 2024');
  console.log('\nResult:', result);

  // Show statistics
  const stats = sharedMemory.getStats();
  console.log('\nMemory Statistics:', {
    namespaces: stats.namespaces,
    totalEntries: stats.totalEntries,
    accessLogs: stats.totalAccessLogs,
  });

  // Show access log
  const logs = sharedMemory.getAccessLog({ limit: 10 });
  console.log('\nRecent Access Log:');
  logs.forEach(log => {
    console.log(`  ${log.timestamp.toISOString()}: ${log.agentId} ${log.action} ${log.namespace}/${log.key || ''} - ${log.success ? 'OK' : 'FAILED'}`);
  });

  // Cleanup
  sharedMemory.destroy();
}

// Export for use in other modules
export {
  ResearchAgent,
  WriterAgent,
  EditorAgent,
  CoordinatorAgent,
};
