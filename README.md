# RANA - Rapid AI Native Architecture

**Quality gates and strategic validation for AI-assisted development.**

> Build production-quality products with AI assistants through proven quality gates (tactical) and REPM validation (strategic).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Alpha](https://img.shields.io/badge/Status-Alpha-orange)](https://github.com/waymaker-ai/ranavibe)

---

## 🚀 What is RANA?

RANA helps developers using AI assistants (Claude, ChatGPT, Gemini, Grok) build production-quality code through:

1. **Quality Gates (Tactical)** - Ensure code quality, testing, deployment
2. **REPM Validation (Strategic)** - Validate major features before implementation
3. **Multi-Platform** - Works with any AI assistant
4. **Open Core** - Free framework + optional paid hosted services

---

## 🎯 The Problem

**90% of AI-generated code needs fixes:**
- ❌ No error handling
- ❌ Mock data in production
- ❌ Missing loading states
- ❌ No tests
- ❌ Never deployed
- ❌ No strategic validation

**RANA fixes this.**

---

## ✨ Key Features

### Tactical: Quality Gates
- ✅ **Search-before-create** - Find existing patterns first
- ✅ **Real data only** - No mock data in production
- ✅ **Error handling** - Comprehensive try-catch
- ✅ **Loading states** - UX during async operations
- ✅ **Design system** - Consistent UI components
- ✅ **Test-driven** - Manual + automated testing
- ✅ **Deploy to production** - Features aren't done until deployed
- ✅ **Verify in production** - Test with real users

### Strategic: REPM (Reverse Engineering Product Methodology)
- ✅ **Outcome first** - Define success before building
- ✅ **Monetization** - Validate unit economics
- ✅ **Go-to-market** - Plan distribution
- ✅ **User experience** - Map journey and activation
- ✅ **Product design** - Prioritize features
- ✅ **Build plan** - Technical approach
- ✅ **GO/NO-GO** - Evidence-based decision

---

## 📦 Installation

### For Claude (MCP Server)

```bash
# Install globally
npm install -g @rana/mcp-server

# Or use with npx
npx @rana/mcp-server
```

**Configure Claude Desktop:**

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "rana": {
      "command": "npx",
      "args": ["-y", "@rana/mcp-server"]
    }
  }
}
```

### For ChatGPT

Visit [ChatGPT GPT Store](https://chat.openai.com/gpts) and search for "RANA Development Assistant"

### For Other AI Platforms

Coming soon: Gemini Extensions, Grok, Universal API

---

## 🎓 Quick Start

### 1. Initialize RANA in Your Project

```bash
cd your-project
npx @rana/cli init
```

This creates `.rana.yml` with quality gates and patterns.

### 2. Use with AI Assistant

**In Claude:**
```
Follow the RANA framework in .rana.yml to add a user profile page.

Pre-implementation:
- Search for existing user-related components
- Review authentication patterns
- Identify design system components

Implementation:
- Use existing patterns
- Add error handling and loading states
- Support dark mode
- Test before deploying

Post-implementation:
- Deploy to production
- Verify it works
```

**Result:** Production-quality code, first time.

---

## 📚 Documentation

- [Quick Start Guide](./RANA_QUICK_START_GUIDE.md) - Get started in 5 minutes
- [Week 1 Setup Guide](./RANA_WEEK1_SETUP_GUIDE.md) - Complete setup instructions
- [Prompt Library](./RANA_PROMPT_LIBRARY.md) - 100+ prompt templates
- [REPM Methodology](./REVERSE_ENGINEERING_PRODUCT_METHODOLOGY.md) - Strategic validation
- [Multi-Platform Guide](./RANA_MULTI_PLATFORM_DISTRIBUTION.md) - All AI platforms
- [Open Source Model](./RANA_OPEN_SOURCE_MODEL.md) - Free vs Pro vs Enterprise
- [Implementation Roadmap](./RANA_IMPLEMENTATION_ROADMAP.md) - Development timeline

---

## 🏗️ Architecture

RANA is built as a monorepo with multiple packages:

```
ranavibe/
├── packages/
│   ├── core/           # Config parser, validation engine
│   ├── mcp-server/     # Claude MCP server
│   ├── api/            # REST API for hosted service
│   ├── sdk/            # TypeScript/JavaScript SDK
│   └── cli/            # Command-line tool
├── apps/
│   ├── web/            # Marketing website (rana.cx)
│   └── docs/           # Documentation site (docs.rana.cx)
├── examples/
│   ├── nextjs/         # Next.js example project
│   ├── react/          # React example project
│   └── python/         # Python example project
└── templates/          # Project templates
```

---

## 🌟 Examples

### Example 1: Simple Feature

```yaml
# .rana.yml
quality_gates:
  pre_implementation:
    - name: "Search existing"
      description: "Find similar patterns"

  implementation:
    - name: "Error handling"
      description: "Try-catch all async"
    - name: "Loading states"
      description: "Show loading indicators"

  deployment:
    - name: "Deploy to production"
      required: true
    - name: "Verify in production"
      required: true
```

**Prompt to AI:**
```
Add user profile editing following RANA quality gates in .rana.yml
```

**Result:** Production-ready code with error handling, loading states, deployed and verified.

### Example 2: Major Feature (REPM Required)

```yaml
# .rana.yml
major_features:
  triggers:
    - "New revenue streams"
    - "New products"
    - "Pricing changes"
```

**Prompt to AI:**
```
I want to add white-label offering. This is a MAJOR FEATURE.

Run complete REPM validation first:
1. Desired outcome
2. Monetization model
3. Go-to-market strategy
4. User experience
5. Product design
6. Build plan
7. GO/NO-GO decision

Only implement if GO decision.
```

**Result:** Strategic validation prevents bad ideas, validates good ones.

---

## 💰 Pricing

### Free Tier (Forever)
- ✅ Core framework (.rana.yml)
- ✅ CLI tool
- ✅ Local validation
- ✅ Documentation
- ✅ Community support
- ✅ Self-hosted everything

### Pro Tier ($29/month)
- ✅ Hosted API (no local setup)
- ✅ Analytics dashboard
- ✅ REPM guided validation
- ✅ Team collaboration
- ✅ Priority support

### Enterprise Tier (Custom)
- ✅ SSO/SAML
- ✅ On-premise deployment
- ✅ Custom quality gates
- ✅ SLA guarantees
- ✅ Compliance (SOC2, HIPAA)

**[Compare Plans →](./RANA_OPEN_SOURCE_MODEL.md)**

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/waymaker-ai/ranavibe.git
cd ranavibe

# Install dependencies
pnpm install

# Run all packages in dev mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

---

## 🗺️ Roadmap

### Phase 1: Foundation (Current)
- [x] REPM methodology documented
- [x] Quality gates defined
- [x] Multi-platform strategy
- [x] Open source model
- [x] Prompt library
- [ ] MCP server implementation
- [ ] Core package
- [ ] CLI tool

### Phase 2: MCP Launch (Feb 2025)
- [ ] Publish `@rana/mcp-server` to npm
- [ ] Documentation site live
- [ ] 3 example projects
- [ ] Beta testing (10 users)
- [ ] ProductHunt launch

### Phase 3: Multi-Platform (Mar-Apr 2025)
- [ ] ChatGPT Custom GPT
- [ ] OpenAI GPT Store submission
- [ ] Gemini Extensions
- [ ] TypeScript SDK
- [ ] Python SDK

### Phase 4: Scale (May-Jun 2025)
- [ ] Pro tier launch ($29/mo)
- [ ] Analytics dashboard
- [ ] Team features
- [ ] Enterprise features
- [ ] 500+ Pro users target

**[Full Roadmap →](./RANA_IMPLEMENTATION_ROADMAP.md)**

---

## 📊 Success Metrics

### Technical
- **Code Quality:** 0 TypeScript 'any' types
- **Design System:** 100% component usage
- **Deployment Speed:** Features in production within 24 hours
- **Production Bugs:** <0.1% error rate

### Business
- **Month 1:** 100 free users, 10 Pro users ($290 MRR)
- **Month 3:** 1,000 free users, 50 Pro users ($1,450 MRR)
- **Month 6:** 5,000 free users, 500 Pro users ($14,500 MRR)

---

## 💬 Community

- **GitHub:** [github.com/waymaker-ai/ranavibe](https://github.com/waymaker-ai/ranavibe)
- **Discord:** Coming soon
- **Twitter:** [@rana_dev](https://twitter.com/rana_dev) (coming soon)
- **Website:** [rana.cx](https://rana.cx) (coming soon)

---

## 📜 License

**Open Core Model:**
- Core framework, CLI, docs: **MIT License** (see [LICENSE](./LICENSE))
- Hosted services (Pro/Enterprise): Proprietary

**What this means:**
- ✅ Use commercially for free
- ✅ Modify and distribute
- ✅ Create proprietary forks
- ✅ No attribution required (appreciated!)

**[Learn more about our Open Source Model →](./RANA_OPEN_SOURCE_MODEL.md)**

---

## 🙏 Acknowledgments

Built with ❤️ by [Waymaker](https://waymaker.cx)

Inspired by:
- Anthropic's Model Context Protocol (MCP)
- OpenAI's GPT Actions
- The Lean Startup methodology
- 12-Factor App principles

---

## 📖 Learn More

- **REPM in 5 minutes:** [REVERSE_ENGINEERING_PRODUCT_METHODOLOGY.md](./REVERSE_ENGINEERING_PRODUCT_METHODOLOGY.md)
- **Prompt templates:** [RANA_PROMPT_LIBRARY.md](./RANA_PROMPT_LIBRARY.md)
- **Setup guide:** [RANA_WEEK1_SETUP_GUIDE.md](./RANA_WEEK1_SETUP_GUIDE.md)
- **Business model:** [RANA_OPEN_SOURCE_MODEL.md](./RANA_OPEN_SOURCE_MODEL.md)

---

**Ready to build better with AI?**

```bash
npx @rana/cli init
```

*Let's ship production-quality code, every time.* 🚀
