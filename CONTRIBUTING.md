# Contributing to RANA 🚀

Thank you for your interest in contributing to RANA! We're building the most helpful, accessible AI framework for developers.

**RANA succeeds when developers succeed.** Every contribution, big or small, helps make AI development better for everyone.

---

## Vision

RANA is a **comprehensive AI development framework** that emphasizes:

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
- Answer questions in [Discussions](https://github.com/waymaker-ai/ranavibe/discussions)
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

### 5. Enhance Compliance
- Add new compliance rules (@rana/compliance)
- Improve PII detection patterns
- Add industry-specific regulations
- Test compliance enforcement

### 6. Improve Guidelines
- Create preset guidelines (@rana/guidelines)
- Add condition builders
- Improve matching logic
- Build analytics features

### 7. Optimize Context Handling
- Enhance context optimization strategies (@rana/context-optimizer)
- Improve file prioritization
- Add better summarization
- Test with large codebases

### 8. Build MCP Servers
- Create new MCP connectors
- Improve existing servers
- Test MCP integrations
- Document MCP usage

### 9. Write Code
- Fix bugs across packages
- Implement new features
- Improve performance
- Add comprehensive tests

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

### Build for Production

RANA is a **comprehensive AI development framework** that emphasizes quality, compliance, and developer experience:

- Focus on features that make production deployment easier
- Prioritize safety, validation, and monitoring
- Build with enterprise requirements in mind (HIPAA, SEC, GDPR)
- Keep the API surface intuitive and TypeScript-first

### Keep It Integration-Friendly

- Adapters should be thin wrappers
- Don't force users into RANA-specific patterns
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

## Contact

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Email**: ashley@waymaker.cx

---

## Recognition & Community

### RANA Champions Program

We celebrate contributors who:

- Help others in Discussions and Discord
- Create tutorials and educational content
- Build templates and starter projects
- Report and fix bugs
- Improve documentation
- Share RANA with others

**Benefits:**
- Featured in our newsletter and social media
- Early access to new features
- Co-creation opportunities
- Direct access to core team
- Recognition in our Hall of Fame

[Learn more about the Champions Program](./docs/COMMUNITY_GROWTH_STRATEGY.md#rana-champions-program)

---

**Thanks for helping make AI development better for everyone!** 🚀
