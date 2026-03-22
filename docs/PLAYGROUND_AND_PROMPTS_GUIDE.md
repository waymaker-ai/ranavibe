# Playground & Prompt Management Guide

CoFounder provides interactive tools for testing features and managing prompts efficiently.

## Playground (REPL)

The playground provides an interactive environment for experimenting with CoFounder features without writing full applications.

### Quick Start

```bash
# Start interactive playground
cofounder playground

# Run quick demo
cofounder demo

# Show quickstart guide
cofounder quickstart
```

### Interactive REPL

When you run `cofounder playground`, you enter an interactive session:

```
$ cofounder playground

CoFounder Playground v2.1.0
Type 'help' for available commands, 'exit' to quit.

playground> help

Available Commands:
  template <name>  - Load a quick template (agent, tool, orchestrator, mcp, security)
  run <file>       - Execute a TypeScript/JavaScript file
  save <name>      - Save current code snippet
  load <name>      - Load a saved snippet
  list             - List saved snippets
  clear            - Clear the screen
  context          - Show current context/variables
  reset            - Reset session
  history          - Show command history
  export           - Export session to file
  help             - Show this help
  exit             - Exit playground

playground>
```

### Quick Templates

Load pre-built code templates for rapid experimentation:

```bash
playground> template agent
```

Loads:
```typescript
import { createAgent, createCoFounder } from '@cofounder/agents';

const cofounder = createCoFounder({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY }
});

const agent = createAgent({
  cofounder,
  tools: [],
  user: { id: 'user-1', orgId: 'org-1', roles: ['user'] },
}, {
  id: 'test_agent',
  name: 'Test Agent',
  description: 'A test agent for experimentation',
});

const result = await agent.handle({
  user: { id: 'user-1', orgId: 'org-1', roles: ['user'] },
  message: 'Hello, can you help me?',
});

console.log(result);
```

Available templates:

| Template | Description |
|----------|-------------|
| `agent` | Basic agent setup |
| `tool` | Custom tool creation |
| `orchestrator` | Multi-agent orchestration |
| `mcp` | MCP server scaffold |
| `security` | Security validation |

### Demo Mode

Run a quick demonstration of CoFounder features:

```bash
cofounder demo
```

This shows:
- Agent creation
- Tool definition
- Orchestration patterns
- Security features
- Code generation

### Session Management

```bash
# Save current work
playground> save my-experiment

# Load previous work
playground> load my-experiment

# List saved snippets
playground> list

# Export full session
playground> export session-2024-01-15.json
```

---

## Prompt Management

Manage, organize, and improve prompts for your CoFounder projects.

### Commands Overview

```bash
# Save a new prompt
cofounder prompts save

# List all prompts
cofounder prompts list

# Get and use a prompt
cofounder prompts use <name>

# Analyze prompt quality
cofounder prompts analyze

# Get improvement suggestions
cofounder prompts improve

# Compare two prompts
cofounder prompts compare <a> <b>

# Import prompts
cofounder prompts import <file>

# Export prompts
cofounder prompts export [--category <cat>]
```

### Saving Prompts

```bash
$ cofounder prompts save

? Enter prompt name: research-agent
? Enter description: Agent for deep research tasks
? Select category: agent
? Enter tags (comma-separated): research, analysis, web
? Enter prompt content (end with empty line):

You are a research agent specialized in gathering and synthesizing
information from multiple sources. When given a topic:

1. Identify key aspects to research
2. Search for authoritative sources
3. Cross-reference information
4. Synthesize findings into a coherent summary
5. Cite sources with links


Prompt saved successfully!
```

### Prompt Categories

| Category | Description | Use Case |
|----------|-------------|----------|
| `agent` | Agent system prompts | Agent personas and behaviors |
| `generation` | Code generation | Template prompts for code gen |
| `mcp` | MCP server prompts | MCP tool descriptions |
| `system` | System configuration | Config and setup prompts |
| `task` | Task-specific | One-off task prompts |
| `custom` | User-defined | Personal prompts |

### Listing Prompts

```bash
$ cofounder prompts list

Saved Prompts (12 total)

 agent (4)
  ├─ research-agent     Deep research assistant           ⭐ 15 uses
  ├─ code-reviewer      Code review specialist            8 uses
  ├─ qa-tester          QA and testing agent              5 uses
  └─ documentation      Documentation writer              3 uses

 generation (3)
  ├─ react-component    Generate React components         ⭐ 22 uses
  ├─ api-endpoint       Generate API routes               12 uses
  └─ test-suite         Generate test files               7 uses

 task (5)
  ├─ summarize          Summarize long content            10 uses
  ├─ translate          Translation task                  6 uses
  └─ ... (3 more)

Use 'cofounder prompts use <name>' to get a prompt
Use 'cofounder prompts list --category agent' to filter
```

### Using Prompts

```bash
$ cofounder prompts use research-agent

research-agent
Category: agent | Tags: research, analysis, web
─────────────────────────────────────────────

You are a research agent specialized in gathering and synthesizing
information from multiple sources. When given a topic:

1. Identify key aspects to research
2. Search for authoritative sources
3. Cross-reference information
4. Synthesize findings into a coherent summary
5. Cite sources with links

─────────────────────────────────────────────
Copied to clipboard!
```

With variable substitution:

```bash
$ cofounder prompts use greeting-template --vars name=Alice,role=Developer

Hello {{name}}, welcome as our new {{role}}!
→ Hello Alice, welcome as our new Developer!
```

### Analyzing Prompts

Get quality scores and suggestions:

```bash
$ cofounder prompts analyze research-agent

Prompt Analysis: research-agent
─────────────────────────────────────────────

Quality Scores:
  Clarity:        ████████░░  85/100
  Specificity:    ███████░░░  72/100
  Actionability:  █████████░  92/100

Overall Score: 83/100 (Good)

Variables Detected: none
Estimated Tokens: 156

Issues:
  ⚠️  Warning: No examples provided
     Suggestion: Add 1-2 examples of expected output

  ℹ️  Info: Consider adding constraints
     Suggestion: Define response length or format expectations

Suggestions:
  • Add concrete examples of good research output
  • Specify preferred citation format
  • Define scope limits (time period, source types)
```

### Improving Prompts

Get AI-powered improvement suggestions:

```bash
$ cofounder prompts improve research-agent

Analyzing prompt for improvements...

Current prompt (156 tokens):
─────────────────────────────────────────────
You are a research agent specialized in gathering...
─────────────────────────────────────────────

Suggested improvements:

1. Add Role Clarification
   Original: "You are a research agent..."
   Improved: "You are an expert research analyst with access to
             web search tools. Your role is to..."

2. Add Output Format
   Add: "Format your response as:
         ## Summary
         [2-3 sentence overview]

         ## Key Findings
         - Finding 1 (Source)
         - Finding 2 (Source)

         ## Sources
         1. [Title](URL)"

3. Add Constraints
   Add: "Limit research to sources from the last 2 years.
         Prioritize peer-reviewed sources when available."

Apply suggestions? (y/n)
```

### Comparing Prompts

Side-by-side comparison:

```bash
$ cofounder prompts compare research-agent research-agent-v2

Prompt Comparison
─────────────────────────────────────────────

                    research-agent    research-agent-v2
Tokens:             156               243
Clarity:            85                92
Specificity:        72                88
Actionability:      92                95

Differences:
  + Added output format specification
  + Added source constraints
  + Added example output
  - Removed generic instructions

Recommendation: research-agent-v2 scores higher overall
```

### Import/Export

Share prompts between projects:

```bash
# Export all prompts
cofounder prompts export --output my-prompts.json

# Export by category
cofounder prompts export --category agent --output agent-prompts.json

# Import prompts
cofounder prompts import team-prompts.json

# Import with merge strategy
cofounder prompts import team-prompts.json --strategy merge  # merge with existing
cofounder prompts import team-prompts.json --strategy replace  # replace existing
```

### Built-in Templates

CoFounder includes pre-built prompt templates:

```bash
$ cofounder prompts templates

Available Templates:

 Agent Templates
  • chat-assistant     - Conversational assistant
  • code-reviewer      - Code review specialist
  • research-agent     - Research and analysis
  • task-planner       - Task decomposition

 Generation Templates
  • react-component    - React component generation
  • api-handler        - API endpoint generation
  • test-writer        - Test case generation
  • documentation      - Doc generation

 MCP Templates
  • tool-description   - MCP tool descriptions
  • resource-schema    - Resource definitions

Use 'cofounder prompts use-template <name>' to start with a template
```

### Prompt Variables

Use `{{variable}}` syntax for dynamic prompts:

```markdown
You are a {{role}} assistant helping {{user_type}} users.
Focus on {{domain}} topics and respond in {{language}}.
```

```bash
$ cofounder prompts use my-prompt --vars role=technical,user_type=enterprise,domain=security,language=English
```

### Analytics

View prompt usage statistics:

```bash
$ cofounder prompts analytics

Prompt Usage Analytics (Last 30 days)
─────────────────────────────────────────────

Most Used:
  1. react-component      87 uses   ████████████████████
  2. research-agent       45 uses   ██████████
  3. code-reviewer        32 uses   ███████

By Category:
  generation:  52%  ████████████████████
  agent:       28%  ███████████
  task:        15%  ██████
  other:        5%  ██

Token Usage:
  Total tokens:     125,430
  Avg per prompt:   892
  Most expensive:   detailed-analysis (2,340 tokens)

Favorites: 5 prompts starred
```

## Best Practices

### Writing Effective Prompts

1. **Be Specific**: Define exactly what you want
2. **Add Examples**: Show expected input/output
3. **Set Constraints**: Limit scope and format
4. **Use Variables**: Make prompts reusable
5. **Test Variations**: A/B test different versions

### Organizing Prompts

1. **Use Categories**: Group related prompts
2. **Tag Consistently**: Use a tagging convention
3. **Version Important Prompts**: Keep history
4. **Share Team Prompts**: Export for collaboration
5. **Archive Unused**: Clean up periodically

### Prompt Security

1. **No Secrets**: Never include API keys or passwords
2. **Sanitize Variables**: Validate variable inputs
3. **Review Imports**: Check imported prompts
4. **Audit Usage**: Monitor prompt analytics

## Related Documentation

- [Prompt Management System Spec](./PROMPT_MANAGEMENT_SYSTEM_SPEC.md)
- [Agent Development Kit Guide](./AGENT_DEVELOPMENT_KIT_GUIDE.md)
- [CLI Commands Reference](../CLI_COMMANDS_REFERENCE.md)
