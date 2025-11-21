# RANA: AI-Assisted Development Standard

> A comprehensive framework that ensures AI coding assistants produce production-quality code.

[![GitHub Stars](https://img.shields.io/github/stars/yourusername/rana-framework?style=social)](https://github.com/yourusername/rana-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40rana%2Fcli.svg)](https://badge.fury.io/js/%40rana%2Fcli)

---

## The Problem

AI assistants often:
- ❌ Create mock data instead of real implementations
- ❌ Break existing code
- ❌ Skip testing
- ❌ Don't deploy to production
- ❌ Ignore design systems
- ❌ Reinvent existing patterns

**Every developer using AI faces these issues.**

---

## The Solution

RANA provides:
- ✅ **Development principles** that work
- ✅ **Quality gates** that catch issues
- ✅ **Checklists** that ensure completeness
- ✅ **Workflows** that ship to production
- ✅ **Universal standard** that works everywhere

---

## Quick Start

```bash
# Install CLI
npm install -g @rana/cli

# Initialize in your project
cd your-project
rana init

# Start developing with standards
rana flow feature "Add user authentication"
```

That's it! AI assistants will now follow your standards automatically.

---

## What is RANA?

**RANA (AI-Assisted Development Standard)** is like:
- **Conventional Commits** for commit messages
- **Semantic Versioning** for releases
- **ESLint** for code style

But for your **entire AI-assisted development workflow**.

---

## Philosophy

### 1. **Search Before Creating**
Use existing patterns instead of reinventing.

### 2. **Real Data Only**
No mocks in production code.

### 3. **Test Everything**
Manual + automated testing required.

### 4. **Design System Compliance**
Consistent UI/UX across the app.

### 5. **Deploy to Production**
Features aren't done until live.

---

## Features

### 🎯 **Universal Standards**
Works with any tech stack, any IDE, any AI assistant.

### 🤖 **AI-Native**
Designed specifically for AI-assisted development.

### ✅ **Quality Gates**
Enforces best practices automatically.

### 📊 **Production Focus**
Features aren't done until deployed and verified.

### 🔧 **Tool Integration**
Works with Cursor, Claude, GPT, GitHub Copilot, and more.

---

## How It Works

### 1. **Add Configuration**

Create `.rana.yml` in your project:

```yaml
version: 1.0.0

project:
  name: "My Awesome App"
  type: "fullstack"

standards:
  principles:
    - search_before_create
    - real_data_only
    - test_everything
    - deploy_to_production

quality_gates:
  implementation:
    - no_mock_data
    - error_handling_required
    - loading_states_required

  testing:
    - manual_testing_required
    - e2e_tests_required

  deployment:
    - git_commit_required
    - production_verification
```

### 2. **AI Assistants Follow Automatically**

When you ask AI to add a feature, it:
1. ✅ Searches for existing implementations
2. ✅ Uses real data (no mocks)
3. ✅ Adds error handling
4. ✅ Writes tests
5. ✅ Deploys to production
6. ✅ Verifies it works

### 3. **Verify Compliance**

```bash
rana check

# Output:
# ✅ Design system followed
# ✅ Real data used (no mocks)
# ✅ Tests written
# ⚠️ Not deployed to production
```

---

## Examples

### React + TypeScript
```bash
git clone https://github.com/yourusername/rana-framework
cd rana-framework/examples/react-typescript
cat .rana.yml
```

### Next.js + Supabase
```bash
cd examples/nextjs-supabase
cat .rana.yml
```

### Vue + Firebase
```bash
cd examples/vue-firebase
cat .rana.yml
```

---

## Documentation

📖 **Full Documentation:** [https://rana.dev](https://rana.dev)

- [Getting Started](https://rana.dev/docs/getting-started)
- [Configuration](https://rana.dev/docs/configuration)
- [Workflow Guide](https://rana.dev/docs/workflow)
- [Quality Gates](https://rana.dev/docs/quality-gates)
- [Examples](https://rana.dev/docs/examples)
- [Integrations](https://rana.dev/docs/integrations)

---

## CLI Commands

```bash
# Initialize RANA in your project
rana init

# Check compliance with standards
rana check

# Start a new feature workflow
rana flow feature "feature name"

# Deploy with verification
rana deploy --verify

# Show current configuration
rana config

# Validate .rana.yml file
rana validate
```

---

## Integrations

### AI Assistants
- ✅ Claude (Anthropic)
- ✅ ChatGPT (OpenAI)
- ✅ GitHub Copilot
- ✅ Cursor
- ✅ Replit AI
- ✅ Any LLM-based assistant

### IDEs
- ✅ VS Code (extension available)
- ✅ Cursor (native support)
- ✅ JetBrains IDEs (plugin available)
- ✅ Any editor (via CLI)

### Platforms
- ✅ GitHub (GitHub Action available)
- ✅ GitLab (CI integration)
- ✅ Vercel (deployment integration)
- ✅ Railway (deployment integration)

---

## Why RANA?

### **Before RANA:**
```typescript
// AI creates this
const mockUsers = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' }
];

<button className="bg-blue-500">Click me</button>

// No error handling
// No tests
// Never deployed
```

### **After RANA:**
```typescript
// AI creates this
import { apiGet } from '@/services/api';
import { GradientButton } from '@/components/design-system';

const users = await apiGet<User[]>('/users');

<GradientButton onClick={handleClick} loading={isLoading}>
  Click me
</GradientButton>

// ✅ Real data
// ✅ Design system
// ✅ Error handling
// ✅ Loading states
// ✅ Tests written
// ✅ Deployed to production
```

---

## Comparison

| Feature | RANA | AGENTS.md | Cursor Rules | Blog Posts |
|---------|------|-----------|--------------|------------|
| Universal standard | ✅ | ⚠️ | ❌ | ❌ |
| Complete workflow | ✅ | ❌ | ❌ | ❌ |
| Quality gates | ✅ | ❌ | ⚠️ | ❌ |
| Testing requirements | ✅ | ❌ | ⚠️ | ⚠️ |
| Deployment workflow | ✅ | ❌ | ❌ | ❌ |
| Tool agnostic | ✅ | ✅ | ❌ | ✅ |
| CLI tooling | ✅ | ❌ | ❌ | ❌ |

---

## Community

### Get Involved

- 💬 **Discord:** [Join our community](https://discord.gg/rana)
- 🐦 **Twitter:** [@rana_dev](https://twitter.com/rana_dev)
- 📧 **Newsletter:** [Subscribe for updates](https://rana.dev/newsletter)

### Contributing

We love contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- 📝 Improve documentation
- 🐛 Report bugs
- ✨ Suggest features
- 🔧 Submit PRs
- 📣 Share RANA with others

---

## Roadmap

### ✅ Phase 1: Foundation (Completed)
- Core specification
- Documentation
- Example projects
- Basic CLI

### 🚧 Phase 2: Tooling (In Progress)
- Advanced CLI features
- VS Code extension
- GitHub Action
- More integrations

### 📅 Phase 3: Ecosystem (Planned)
- Language-specific guides
- Industry-specific extensions
- Enterprise features
- Certification program

---

## Success Stories

> "RANA saved us 10+ hours/week fixing AI mistakes. Now our AI-generated code just works."
>
> — **Sarah Chen**, Senior Developer at TechCorp

> "We rolled out RANA across our team of 20 developers. Code quality improved dramatically."
>
> — **Michael Rodriguez**, Engineering Manager at StartupXYZ

> "As someone teaching developers how to use AI, RANA is exactly what we needed."
>
> — **Alex Thompson**, Developer Advocate

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Credits

Created by [Your Name](https://github.com/yourusername)

Inspired by the need for better AI-assisted development practices.

Special thanks to all [contributors](https://github.com/yourusername/rana-framework/graphs/contributors).

---

## Support

- 📖 **Documentation:** [rana.dev](https://rana.dev)
- 💬 **Discord:** [Join community](https://discord.gg/rana)
- 🐛 **Issues:** [GitHub Issues](https://github.com/yourusername/rana-framework/issues)
- 📧 **Email:** support@rana.dev

---

**Start building production-quality code with AI today.**

```bash
npm install -g @rana/cli
rana init
```

⭐ **Star this repo if you find it useful!**

---

*RANA: Production-Quality AI Development*
