# Contributing to RANA

Thank you for your interest in contributing to RANA!

---

## Vision

RANA exists to **prevent AI-assisted dev chaos**, not to orchestrate it. We believe:

- AI assistants should **enhance** existing workflows, not replace them
- Safety rails matter more than speed
- Integration > reinvention
- Practical tooling > impressive demos

If that resonates with you, welcome!

---

## Ways to Contribute

### 1. Guardrails
- Improve existing safety checks
- Add new detection patterns (PII, secrets, injection)
- Propose constraint configurations

### 2. VibeSpecs
- Submit example `.yml` configs for common use cases
- Improve the VibeSpec schema
- Build tooling around spec validation

### 3. Integrations
- Improve LangChain/CrewAI adapters
- Add support for new frameworks
- Build MCP tool providers

### 4. Docs
- Improve README clarity
- Add real-world examples
- Document edge cases and gotchas

### 5. Core Improvements
- Bug fixes
- Performance optimizations
- Type safety improvements

---

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/rana.git
cd rana

# Add upstream remote
git remote add upstream https://github.com/AshleyMcKays/rana.git
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

### Avoid Building "Another Orchestrator"

RANA is a **guardrail layer**, not an orchestration framework. When contributing:

- Don't add features that duplicate LangChain/CrewAI/AutoGen functionality
- Focus on safety, validation, and integration
- Keep the API surface minimal
- Prefer composition over inheritance

### Keep It Integration-Friendly

- Adapters should be thin wrappers
- Don't force users into RANA-specific patterns
- Support existing tools, don't replace them

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

## Non-Goals (Out of Scope)

We intentionally **don't** want to:

- Build a full agent orchestration framework
- Compete with LangChain/CrewAI/AutoGen
- Create a "do everything" monolith
- Add features that compromise simplicity

If your contribution heads in these directions, we'll likely suggest a different approach or politely decline.

---

## Contact

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Email**: ashley@waymaker.cx

---

**Thanks for helping make AI-assisted development safer!**
