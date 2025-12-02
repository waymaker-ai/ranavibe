/**
 * Agent Debugger Example
 * Demonstrates step-through debugging for AI agents
 */

import { AgentDebugger, DebugSession, Agent } from '@rana/core';

// Define a sample agent for debugging
class ResearchAgent extends Agent {
  async run(query: string) {
    // Simulate agent execution with multiple steps
    await this.think(`Analyzing query: ${query}`);

    const searchResults = await this.useTool('web_search', { query });
    await this.think(`Found ${searchResults.length} results`);

    for (const result of searchResults.slice(0, 3)) {
      const content = await this.useTool('read_page', { url: result.url });
      await this.updateState({ [`source_${result.id}`]: content });
    }

    const summary = await this.generateResponse(
      `Summarize the following sources about: ${query}\n\n${this.getState().sources}`
    );

    return summary;
  }
}

async function main() {
  // Create the agent
  const agent = new ResearchAgent({
    name: 'research-agent',
    model: 'claude-3-5-sonnet',
  });

  // Example 1: Basic debugging with step mode
  console.log('=== Step-Through Debugging ===');
  const debugger1 = new AgentDebugger({
    stepMode: true,
    captureState: true,
  });

  const session = await debugger1.startSession(agent);

  // Execute with stepping
  session.on('step', async (event) => {
    console.log(`[${event.timestamp}] ${event.type}: ${event.description}`);
    console.log(`  State: ${JSON.stringify(event.state, null, 2)}`);

    // In a real debugger, you might prompt for user input here
    // For demo, we auto-continue
    await session.continue();
  });

  await session.run('What are the latest developments in quantum computing?');

  // Example 2: Debugging with breakpoints
  console.log('\n=== Breakpoint Debugging ===');
  const debugger2 = new AgentDebugger({
    breakpoints: [
      { type: 'tool-call', toolName: 'web_search' },
      { type: 'llm-request' },
      { type: 'state-change', variable: 'searchResults' },
    ],
  });

  const session2 = await debugger2.startSession(agent);

  session2.on('breakpoint', async (event) => {
    console.log(`\nBreakpoint hit: ${event.breakpoint.type}`);
    console.log(`Event: ${event.description}`);

    // Inspect state at breakpoint
    const state = session2.getState();
    console.log('Current state:', state);

    // Inspect call stack
    const stack = session2.getCallStack();
    console.log('Call stack:', stack);

    // Continue execution
    await session2.continue();
  });

  await session2.run('Explain machine learning basics');

  // Example 3: Time-travel debugging
  console.log('\n=== Time-Travel Debugging ===');
  const debugger3 = new AgentDebugger({
    recordHistory: true,
    maxHistorySize: 1000,
  });

  const session3 = await debugger3.startSession(agent);
  await session3.run('Compare Python and JavaScript');

  // Get execution history
  const history = session3.getHistory();
  console.log(`Recorded ${history.length} events`);

  // Travel back to a specific point
  const targetEvent = history.find(e => e.type === 'tool-call');
  if (targetEvent) {
    await session3.travelTo(targetEvent.id);
    console.log('Traveled back to:', targetEvent.description);
    console.log('State at that point:', session3.getState());
  }

  // Replay from a point
  console.log('\nReplaying from tool call...');
  await session3.replayFrom(targetEvent.id, {
    speed: 2, // 2x speed
    onEvent: (event) => console.log(`Replaying: ${event.type}`),
  });

  // Example 4: Decision tree visualization
  console.log('\n=== Decision Tree Visualization ===');
  const tree = session3.getDecisionTree();

  // Print tree structure
  function printTree(node: any, indent = 0) {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}${node.type}: ${node.description}`);
    if (node.children) {
      for (const child of node.children) {
        printTree(child, indent + 1);
      }
    }
  }
  printTree(tree);

  // Export as Mermaid diagram
  const mermaid = session3.exportDecisionTree('mermaid');
  console.log('\nMermaid diagram:');
  console.log(mermaid);

  // Example 5: Watch variables
  console.log('\n=== Variable Watching ===');
  const debugger4 = new AgentDebugger({
    watchVariables: ['query', 'searchResults', 'sources'],
  });

  const session4 = await debugger4.startSession(agent);

  session4.on('variable-change', (event) => {
    console.log(`Variable changed: ${event.variable}`);
    console.log(`  Old value: ${JSON.stringify(event.oldValue)}`);
    console.log(`  New value: ${JSON.stringify(event.newValue)}`);
  });

  await session4.run('What is the future of AI?');

  // Example 6: Conditional breakpoints
  console.log('\n=== Conditional Breakpoints ===');
  const debugger5 = new AgentDebugger({
    breakpoints: [
      {
        type: 'tool-result',
        condition: (event) => event.result.length > 5, // Break if more than 5 results
      },
      {
        type: 'llm-response',
        condition: (event) => event.tokens > 500, // Break if response is long
      },
    ],
  });

  const session5 = await debugger5.startSession(agent);
  await session5.run('History of the internet');

  // Example 7: Export debug session
  console.log('\n=== Export Debug Session ===');
  const sessionData = session3.export();
  console.log('Session ID:', sessionData.id);
  console.log('Duration:', sessionData.duration, 'ms');
  console.log('Events:', sessionData.events.length);
  console.log('Final state:', sessionData.finalState);

  // Save to file
  // await fs.writeFile('debug-session.json', JSON.stringify(sessionData, null, 2));

  // Later, import and analyze
  // const loadedSession = await DebugSession.import(sessionData);
  // const analysis = loadedSession.analyze();
  // console.log('Analysis:', analysis);
}

main().catch(console.error);
