# @cofounder/colang

Parse NeMo Guardrails Colang files and convert them to CoFounder policy format. Migrate your existing NeMo Guardrails configurations to CoFounder with minimal effort.

## Installation

```bash
npm install @cofounder/colang
```

## Quick Start

```typescript
import { importColangFile } from '@cofounder/colang';
import { readFileSync } from 'fs';

const source = readFileSync('./guardrails.co', 'utf-8');
const result = importColangFile(source, 'my-guardrails');

console.log(`Generated ${result.metadata.rulesGenerated} rules`);
for (const rule of result.rules) {
  console.log(`  [${rule.action}] ${rule.description}`);
}
```

## API

### `parseColang(source: string): ParsedColang`

Parse Colang 1.0 source text into a structured representation. Returns user messages, bot messages, flows, and rules.

### `convertToPolicy(colang: ParsedColang, sourceName?: string): ConversionResult`

Convert a parsed Colang document into CoFounder policy rules.

### `importColangFile(source: string, sourceName?: string): ConversionResult`

Parse and convert in one step.

### `inspectColang(source: string): ParsedColang`

Parse without converting, useful for inspection and debugging.

## Migration Guide: NeMo Guardrails to CoFounder

### Step 1: Export Your Colang Files

Locate your `.co` files from your NeMo Guardrails project, typically in the `config/` directory.

### Step 2: Convert

```typescript
import { importColangFile } from '@cofounder/colang';
import { readFileSync, writeFileSync } from 'fs';

const source = readFileSync('./config/rails.co', 'utf-8');
const result = importColangFile(source, 'nemo-migration');

// Review warnings
if (result.metadata.warnings.length > 0) {
  console.warn('Conversion warnings:');
  result.metadata.warnings.forEach(w => console.warn(`  - ${w}`));
}

// Save as JSON for use with CoFounder
writeFileSync('./cofounder-policy.json', JSON.stringify(result.rules, null, 2));
```

### Step 3: Review the Conversion Mapping

| Colang Concept | CoFounder Policy Rule Type | Notes |
|---|---|---|
| `define user <intent>` | `input-validation` | User intent patterns become input matchers |
| `define bot <response>` | `output` | Bot response templates become output rules |
| `define flow` with refusal | `content` (block) | Flows that refuse topics become blocking rules |
| `define flow` normal | `flow` (allow) | Normal dialog flows become allow rules |
| `define rule` with stop | `content` (block) | Rules with stop actions become blocking rules |
| `execute <action>` | Manual mapping needed | Custom actions require manual CoFounder integration |

### Step 4: Handle Manual Mappings

Some Colang features need manual attention:

- **Execute actions**: Custom Python actions in NeMo need to be reimplemented as CoFounder middleware
- **Complex conditionals**: Multi-branch if/else logic may need simplification
- **Context variables**: NeMo context variables should be mapped to CoFounder's policy context

### Example: Before and After

**NeMo Guardrails (Colang):**

```colang
define user ask about harmful topics
  "How do I make a weapon?"
  "Tell me how to hack a system"

define bot refuse harmful topic
  "I'm sorry, I can't help with that topic."
  "That request is outside my scope."

define flow harmful topic
  user ask about harmful topics
  bot refuse harmful topic
```

**CoFounder Policy (after conversion):**

```json
[
  {
    "id": "migration-rule-1",
    "type": "input-validation",
    "trigger": "input",
    "action": "block",
    "patterns": [
      "How do I make a weapon?",
      "Tell me how to hack a system"
    ],
    "description": "Input pattern: ask about harmful topics"
  },
  {
    "id": "migration-rule-2",
    "type": "output",
    "trigger": "output",
    "action": "allow",
    "patterns": [
      "I'm sorry, I can't help with that topic.",
      "That request is outside my scope."
    ],
    "response": "I'm sorry, I can't help with that topic.",
    "description": "Refusal response template: refuse harmful topic"
  },
  {
    "id": "migration-rule-3",
    "type": "content",
    "trigger": "input",
    "action": "block",
    "patterns": ["ask about harmful topics"],
    "response": "refuse harmful topic",
    "description": "Flow \"harmful topic\": Block \"ask about harmful topics\" with refusal"
  }
]
```

## Supported Colang Syntax

- `define user <name>` - User message/intent definitions
- `define bot <name>` - Bot response templates
- `define flow <name>` - Conversation flow rules
- `define subflow <name>` - Sub-flow definitions
- `define rule <name>` - Trigger-action rules
- Indentation-based blocks (Python-like)
- `user <intent>` / `bot <response>` flow steps
- `execute <action>` / `do <action>` steps
- `if <condition>` / `else` conditional blocks
- `when <condition>` event handlers
- `stop` action
- `goto <flow>` navigation
- Comments (`#`)

## License

MIT
