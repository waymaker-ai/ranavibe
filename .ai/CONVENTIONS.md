# RANA Project Conventions

> Standards and patterns for consistent development across the project.

**Version:** 1.0.0
**Last Updated:** 2024-11-29
**Status:** Active

---

## 1. Markdown Document Standards

### 1.1 Required Frontmatter

Every markdown file must start with:

```markdown
# Title

> One-line description

**Version:** X.Y.Z
**Last Updated:** YYYY-MM-DD
**Status:** Active | Deprecated | Draft | Review
```

### 1.2 Document Types

| Type | Location | Naming | Purpose |
|------|----------|--------|---------|
| Rules | `.ai/` | CAPS.md | AI behavior rules |
| Status | `.ai/` | STATUS.md | Project state |
| Roadmap | Root | ROADMAP.md | Feature planning |
| API Docs | `docs/` | kebab-case.md | User documentation |
| Changelogs | Root | CHANGELOG.md | Version history |
| READMEs | Package root | README.md | Package overview |

### 1.3 Deprecation Markers

```markdown
---
⚠️ **DEPRECATED** - This document is no longer maintained.
**Superseded By:** [New Document](./new-doc.md)
**Deprecated On:** YYYY-MM-DD
**Archive After:** YYYY-MM-DD
---
```

### 1.4 Todo Markers in Documents

Use consistent markers for tracking:
- `[ ]` - Open item
- `[x]` - Completed item
- `[~]` - In progress (custom, use sparingly)
- `[?]` - Needs decision (custom, use sparingly)

---

## 2. Code Conventions

### 2.1 File Structure

```
packages/
├── core/                 # @rana/core
│   ├── src/
│   │   ├── index.ts     # Public exports
│   │   ├── client.ts    # Main client
│   │   ├── types.ts     # Type definitions
│   │   ├── utils/       # Utilities
│   │   └── providers/   # Provider implementations
│   └── package.json
├── testing/             # @rana/testing
└── mcp/                 # @rana/mcp

tools/
└── cli/                 # rana CLI
    ├── src/
    │   ├── cli.ts       # Command registration
    │   ├── commands/    # Individual commands
    │   └── utils/       # CLI utilities
    └── package.json

website/                 # rana.dev
```

### 2.2 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `cost-tracker.ts` |
| Classes | PascalCase | `CostTracker` |
| Functions | camelCase | `calculateCost()` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `RanaConfig` |
| CLI Commands | kebab:colon | `rana config:set` |

### 2.3 Export Patterns

```typescript
// Single responsibility files
export function doThing() { }
export type ThingConfig = { };

// Index files - re-export public API
export { doThing } from './do-thing';
export type { ThingConfig } from './do-thing';
```

### 2.4 Error Handling

```typescript
// Use typed errors
export class RanaError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string
  ) {
    super(message);
    this.name = 'RanaError';
  }
}

// Specific error types
export class RanaAuthError extends RanaError { }
export class RanaBudgetExceededError extends RanaError { }
```

---

## 3. CLI Command Conventions

### 3.1 Command Structure

```typescript
// tools/cli/src/commands/example.ts

/**
 * RANA Example Command
 *
 * Brief description of what this does.
 *
 * @example
 * ```bash
 * rana example
 * rana example:subcommand --option value
 * ```
 */

import chalk from 'chalk';

export async function exampleCommand(options: {
  flag?: boolean;
}): Promise<void> {
  console.log(chalk.bold.cyan('\n🔧 Command Title\n'));

  // Implementation

  console.log(chalk.green('✓ Success message\n'));
}
```

### 3.2 Command Naming

- Main command: `rana <noun>`
- Subcommands: `rana <noun>:<verb>`
- Aliases: Short forms for common commands

```
rana budget              # Status (noun alone = status)
rana budget:set          # Action
rana budget:clear        # Action

rana config              # Show config
rana config:set          # Modify
rana config:list         # List
```

### 3.3 Output Formatting

```typescript
// Headers
console.log(chalk.bold.cyan('\n📊 Section Title\n'));

// Success
console.log(chalk.green('✓ Operation completed'));

// Warning
console.log(chalk.yellow('⚠ Warning message'));

// Error
console.log(chalk.red('✗ Error message'));

// Info/hints
console.log(chalk.gray('Hint: additional info'));

// Tables
console.log(chalk.gray('─'.repeat(60)));
```

---

## 4. Git Conventions

### 4.1 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 4.2 Commit Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes nor adds |
| `test` | Adding tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvement |

### 4.3 Branch Naming

```
main                    # Production
feat/feature-name       # New features
fix/issue-description   # Bug fixes
docs/what-documented    # Documentation
```

---

## 5. Testing Conventions

### 5.1 Test File Location

```
packages/core/
├── src/
│   └── client.ts
└── tests/              # Or __tests__/
    └── client.test.ts
```

### 5.2 Test Naming

```typescript
describe('CostTracker', () => {
  describe('trackRequest', () => {
    it('should record cost for successful request', () => { });
    it('should throw when budget exceeded', () => { });
  });
});
```

### 5.3 AI Test Patterns

```typescript
import { aiTest, semanticMatch, toMostlyBe } from '@rana/testing';

aiTest('should generate greeting', async ({ rana }) => {
  const response = await rana.chat('Say hello');
  expect(response).toMatchSemantic('a friendly greeting');
});
```

---

## 6. Documentation Conventions

### 6.1 JSDoc for Public APIs

```typescript
/**
 * Create a new RANA client instance.
 *
 * @param config - Configuration options
 * @param config.providers - API keys for providers
 * @param config.cache - Enable response caching
 * @returns Configured RANA client
 *
 * @example
 * ```typescript
 * const rana = createRana({
 *   providers: { openai: process.env.OPENAI_KEY }
 * });
 * ```
 */
export function createRana(config: RanaConfig): RanaClient {
```

### 6.2 README Structure

```markdown
# Package Name

> One-line description

## Installation

## Quick Start

## API Reference

## Examples

## License
```

---

## 7. Review Checklist

Before completing any PR or significant change:

- [ ] Code builds without errors
- [ ] Types are correct (no unnecessary `any`)
- [ ] Error handling is appropriate
- [ ] Documentation updated if needed
- [ ] ROADMAP.md updated if feature complete
- [ ] Commit message follows convention
- [ ] No secrets or credentials committed
