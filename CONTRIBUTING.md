# Contributing to CoFounder 🚀

Thank you for your interest in contributing to CoFounder! We're building the most helpful, accessible AI framework for developers.

**CoFounder succeeds when developers succeed.** Every contribution, big or small, helps make AI development better for everyone.

---

## Vision

CoFounder is a **comprehensive AI development framework** that emphasizes:

- **Quality & Compliance**: Built-in HIPAA, SEC, GDPR enforcement
- **Production-Ready**: Enterprise-grade from day one
- **Developer Experience**: TypeScript-first, great docs, helpful community
- **Safety & Guidelines**: Dynamic behavioral control, compliance automation
- **Cost Optimization**: 70% savings through smart routing and caching
- **Zero Vendor Lock-in**: 9 LLM providers, provider-agnostic

If that resonates with you, welcome!

---

## Ways to Contribute

You don't need to be an expert! Here are many ways to help:

### 1. Help Others (Most Valuable!)
- Answer questions in [Discussions](https://github.com/waymaker-ai/cofounder/discussions)
- Help troubleshoot issues
- Share your knowledge and experience
- Write blog posts and tutorials

### 2. Improve Documentation
- Fix typos and unclear explanations
- Add code examples
- Create tutorials and guides
- Record video tutorials

### 3. Report Bugs
- Found a bug? Report it with reproduction steps
- Include error messages and environment details

### 4. Create Templates
- Healthcare chatbot (HIPAA-compliant)
- Financial advisor (SEC-compliant)
- Customer support bot
- Industry-specific examples

### 5. Improve CI/CD Scanner
- Add new scanning rules to @waymakerai/aicofounder-ci
- Expand `no-exposed-assets` with new exposure patterns
- Improve false-positive filtering
- Add support for new file types and frameworks
- Write tests for edge cases

### 6. Enhance Compliance
- Add new compliance rules (@waymakerai/aicofounder-compliance)
- Improve PII detection patterns
- Add industry-specific regulations
- Test compliance enforcement

### 7. Improve Guidelines
- Create preset guidelines (@waymakerai/aicofounder-guidelines)
- Add condition builders
- Improve matching logic
- Build analytics features

### 8. Optimize Context Handling
- Enhance context optimization strategies (@waymakerai/aicofounder-context-optimizer)
- Improve file prioritization
- Add better summarization
- Test with large codebases

### 9. Build MCP Servers
- Create new MCP connectors
- Improve existing servers
- Test MCP integrations
- Document MCP usage

### 10. Write Code
- Fix bugs across packages
- Implement new features
- Improve performance
- Add comprehensive tests

---

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/cofounder.git
cd cofounder

# Add upstream remote
git remote add upstream https://github.com/AshleyMcKays/cofounder.git
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Build all packages
pnpm build
```

### 3. Create a Branch

```bash
# Create a branch for your changes
git checkout -b feature/your-feature-name

# Or for bug fixes:
git checkout -b fix/bug-description
```

---

## Code Style

- **TypeScript** for all code
- **Full type annotations** - no implicit `any`
- **Single quotes** for strings
- **2 spaces** for indentation
- **Descriptive names** over comments
- **JSDoc** for public APIs

---

## Design Guidelines

### Build for Production

CoFounder is a **comprehensive AI development framework** that emphasizes quality, compliance, and developer experience:

- Focus on features that make production deployment easier
- Prioritize safety, validation, and monitoring
- Build with enterprise requirements in mind (HIPAA, SEC, GDPR)
- Keep the API surface intuitive and TypeScript-first

### Keep It Integration-Friendly

- Adapters should be thin wrappers
- Don't force users into CoFounder-specific patterns
- Support existing tools and frameworks (LangChain, CrewAI, AutoGen)
- Work seamlessly with any LLM provider

### Quality Standards

- Full TypeScript type safety (no `any`)
- Comprehensive error handling
- Performance optimization (70% cost savings is our benchmark)
- Complete documentation with real-world examples

---

## Submitting Pull Requests

### PR Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass (`pnpm test`)
- [ ] Types check (`pnpm typecheck`)
- [ ] Builds successfully (`pnpm build`)
- [ ] Documentation updated if needed

### PR Title Format

```
feat: Add support for new feature
fix: Resolve bug description
docs: Update documentation
refactor: Improve code structure
```

---

## What We Value

We prioritize contributions that:

- **Help developers succeed** - Make AI development easier and safer
- **Solve real problems** - Address actual production needs
- **Maintain quality** - TypeScript-first, well-tested, documented
- **Enable compliance** - HIPAA, SEC, GDPR, industry regulations
- **Reduce costs** - Smart optimization and caching strategies
- **Stay flexible** - Work with any LLM, integrate with any tool

## Out of Scope

We intentionally avoid:

- Vendor lock-in or proprietary features
- Features that compromise developer experience
- Duplicating existing tools when integration is better
- Adding complexity without clear value

If your contribution doesn't align with our values, we'll work with you to find a better approach.

---

## Creating Custom CoFounder Policies

CoFounder policies define guardrail behavior through declarative configuration. To create a custom policy:

### 1. Define Your Policy File

Create a new TypeScript file in `packages/policies/src/presets/`:

```typescript
import type { PolicyConfig } from '../types';

export const myCustomPolicy: PolicyConfig = {
  name: 'my-custom-policy',
  version: '1.0.0',
  description: 'Description of what this policy enforces',
  rules: {
    pii: {
      enabled: true,
      enabledTypes: ['email', 'phone', 'ssn', 'creditCard', 'ipAddress'],
      region: 'US',
      action: 'redact',
    },
    injection: {
      enabled: true,
      sensitivity: 'medium',
    },
    toxicity: {
      enabled: true,
      minSeverity: 'low',
    },
    budget: {
      limit: 10.0,
      period: 'day',
      warningThreshold: 0.8,
      onExceeded: 'block',
    },
    compliance: ['hipaa', 'gdpr'],
  },
};
```

### 2. Register the Policy

Export your policy from the presets index so it can be discovered by the policy engine.

### 3. Add Custom PII Patterns (Optional)

If your policy requires domain-specific PII detection:

```typescript
const customPatterns = [
  {
    name: 'Employee ID',
    pattern: /\bEMP-\d{6}\b/g,
    placeholder: '[EMPLOYEE_ID]',
  },
];
```

Pass these to the PII detector via the `customPatterns` field in the detector configuration.

### 4. Configure Compliance Frameworks

Reference existing frameworks (`hipaa`, `gdpr`, `sec`, `pci`, `ferpa`) or define custom compliance checks within your policy rules.

---

## Submitting Policies to the Marketplace

To share your policy with the CoFounder community:

1. **Ensure your policy is well-tested** -- include unit tests for every rule in your policy.
2. **Add documentation** in a comment block at the top of your policy file explaining its purpose, target audience, and any regulatory context.
3. **Include example usage** showing how to activate the policy.
4. **Submit a pull request** following the [PR process](#submitting-pull-requests) with the `policy` label.
5. **Marketplace metadata**: Add a `marketplace` field to your policy config with `tags`, `category`, and `author` so it can be indexed and discovered.

---

## Creating CoFounder Skills for OpenClaw

CoFounder skills are packaged as OpenClaw-compatible skill definitions. To create a new skill:

### Skill Directory Structure

```
packages/openclaw/skill/
  SKILL.md          # The skill definition (frontmatter + instructions)
  references/       # Supporting reference documents
    *.md
```

### Write the SKILL.md

The SKILL.md file uses YAML frontmatter followed by markdown instructions that an AI agent will follow:

```markdown
---
name: your-skill-name
description: What the skill does
version: 1.0.0
metadata:
  openclaw:
    emoji: "..."
    homepage: https://your-url.com
    requires:
      bins:
        - node
      env: []
    primaryEnv: ""
---

# Skill Title

Instructions that the AI agent follows when this skill is active.
```

### Add Reference Documents

Place supporting materials in the `references/` directory. These provide the AI with detailed knowledge it can consult (compliance frameworks, detection pattern catalogs, pricing tables, etc.).

### Test Locally

Load your skill in a compatible OpenClaw environment and verify that the AI follows the instructions correctly across a range of test scenarios.

### Submit to ClawHub

Package the skill directory and submit via the ClawHub submission process. See `clawhub-submission/` in this repository for an example of the required structure.

---

## Writing Detection Patterns

CoFounder uses regular expressions organized by category. When adding new detection patterns:

### Pattern Structure

```typescript
// PII pattern (VS Code extension style)
{
  name: 'Pattern Name',
  regex: /your-regex-here/g,
  severity: 'error' | 'warning',
}

// Injection pattern (core detector style)
const INJECTION_PATTERNS = {
  categoryName: [
    /pattern-one/gi,
    /pattern-two/gi,
  ],
};

// Toxicity pattern
{
  category: 'category_name',
  severity: 'low' | 'medium' | 'high' | 'critical',
  patterns: [/pattern/gi],
}
```

### Guidelines

1. **Always use the `g` flag** for patterns that need to find multiple matches.
2. **Use `gi` flags** for injection and toxicity patterns (case-insensitive matching is important).
3. **Anchor with `\b`** word boundaries to avoid false positives inside larger words.
4. **Test against false positives**: Run your pattern against the benchmark datasets in `packages/benchmark/src/datasets/`.
5. **Assign appropriate severity**: `critical` for patterns that must always block, `high` for likely threats, `medium` for suspicious content, `low` for informational flags.
6. **Document each pattern** with a comment explaining what it catches and an example match.
7. **Consider multi-region support**: PII patterns may need variants for US, EU, UK, CA, AU, and global contexts.

### Where to Add Patterns

- **PII patterns**: `packages/core/src/security/pii.ts` (core) or `extensions/vscode-cofounder/src/detectors.ts` (VS Code)
- **Injection patterns**: `packages/core/src/security/injection.ts` (core) or `extensions/vscode-cofounder/src/detectors.ts` (VS Code)
- **Toxicity patterns**: `packages/guard/src/detectors/toxicity.ts`
- **API key patterns**: `extensions/vscode-cofounder/src/detectors.ts`

---

## Testing Requirements

All contributions must include tests:

1. **Unit tests** for new detection patterns, policies, and utility functions.
2. **Test files** should be colocated with source (e.g., `pii.test.ts` next to `pii.ts`) or in a `__tests__/` subdirectory.
3. **Minimum coverage**: All new patterns must have at least one positive match test and one negative (false positive) test.
4. **Benchmark tests**: For detection patterns, add entries to the benchmark datasets in `packages/benchmark/` so performance can be tracked.
5. **Run the full test suite** before submitting: `pnpm test`
6. **TypeScript compilation** must pass without errors: `pnpm build`
7. **Zero new runtime dependencies** unless explicitly justified and approved by a maintainer.

---

## Contact

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Email**: ashley@waymaker.cx

---

## Recognition & Community

### CoFounder Champions Program

We celebrate contributors who:

- Help others in Discussions and Discord
- Create tutorials and educational content
- Build templates and starter projects
- Report and fix bugs
- Improve documentation
- Share CoFounder with others

**Benefits:**
- Featured in our newsletter and social media
- Early access to new features
- Co-creation opportunities
- Direct access to core team
- Recognition in our Hall of Fame

[Learn more about the Champions Program](./docs/COMMUNITY_GROWTH_STRATEGY.md#cofounder-champions-program)

---

**Thanks for helping make AI development better for everyone!** 🚀
