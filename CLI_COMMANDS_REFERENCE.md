# RANA CLI Commands Reference

**Version:** 2.2
**Last Updated:** 2025-12-11

---

## Complete Command List

RANA now has **30+ production-ready CLI commands** across all frameworks!

---

## 📦 Core Commands

### `rana init`
Initialize RANA in your project
```bash
rana init                    # Default template
rana init -t nextjs          # Next.js template
rana init -f                 # Force overwrite
```

### `rana check`
Check compliance with RANA standards
```bash
rana check                   # Quick check
rana check -v                # Verbose output
rana check -f                # Auto-fix issues
```

### `rana deploy`
Deploy with RANA verification workflow
```bash
rana deploy                  # Deploy to default platform
rana deploy --verify         # Verify deployment
rana deploy --skip-tests     # Skip tests (not recommended)
```

### `rana status`
Show RANA project status
```bash
rana status                  # Current project status
```

### `rana config`
Show current RANA configuration
```bash
rana config                  # Display configuration
```

### `rana validate`
Validate .rana.yml configuration
```bash
rana validate                # Validate config file
```

---

## 🗄️ Database Commands

### `rana db:setup`
Interactive database setup wizard
```bash
rana db:setup               # Choose: Supabase, Prisma, MySQL, SQLite
```

**Features:**
- Provider selection (Supabase, PostgreSQL, MySQL, SQLite)
- Automatic client generation
- .env configuration
- Migration setup

### `rana db:migrate`
Run database migrations
```bash
rana db:migrate             # Run all pending migrations
```

### `rana db:seed`
Seed database with data
```bash
rana db:seed                # Run seed script
```

### `rana db:reset`
Reset database (WARNING: deletes all data)
```bash
rana db:reset               # Reset with confirmation
```

### `rana db:studio`
Open Prisma Studio
```bash
rana db:studio              # Visual database editor
```

### `rana db:status`
Show database status
```bash
rana db:status              # Show tables, models, connection
```

---

## 🔒 Security Commands

### `rana security:audit`
Run comprehensive security audit
```bash
rana security:audit          # Quick audit
rana security:audit --fix    # Auto-fix issues
rana security:audit --verbose # Detailed output
```

**Checks:**
- Environment variable security
- Authentication configuration
- API route security
- SQL injection vulnerabilities
- XSS vulnerabilities
- Hardcoded secrets
- CORS configuration
- Rate limiting
- Input validation
- Dependency vulnerabilities

**Output:**
- Security score (0-100)
- Issue categorization
- Fix suggestions
- Auto-fix capabilities

### `rana security:setup`
Interactive security setup wizard
```bash
rana security:setup          # Configure auth, rate limiting, headers
```

**Features:**
- Auth provider selection (Supabase, NextAuth, Clerk, Auth0)
- Rate limiting setup (Upstash Redis)
- Security headers configuration
- Automatic code generation

---

## 🤖 LLM Commands

### `rana llm:analyze`
Analyze LLM usage and costs
```bash
rana llm:analyze             # Cost analysis
rana llm:analyze --detailed  # Detailed breakdown
```

**Analysis:**
- Current monthly costs
- Token usage per model
- Request counts
- Optimization opportunities
- Potential savings (70%+ reduction)

### `rana llm:optimize`
Apply LLM cost optimizations
```bash
rana llm:optimize            # Interactive selection
rana llm:optimize --all      # Apply all optimizations
```

**Optimizations:**
- Response caching (40% savings)
- Model selection strategies (25% savings)
- Prompt optimization (15% savings)
- RAG implementation (30% savings)

**Auto-generates:**
- Caching layer (Redis)
- Model selection logic
- Cost tracking utilities

### `rana llm:compare`
Compare LLM models and pricing
```bash
rana llm:compare             # Show all models with costs
```

**Models Covered:**
- GPT-4 Turbo
- GPT-3.5 Turbo
- Claude 3.5 Sonnet
- Claude 3 Haiku
- Grok Beta
- Gemini Pro
- Local (Ollama)

### `rana llm:setup`
Setup LLM providers
```bash
rana llm:setup               # Configure API keys
```

**Providers:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- xAI (Grok)
- Google (Gemini)
- Local (Ollama)

---

## 🔍 SEO Commands

### `rana seo:check`
Validate SEO setup
```bash
rana seo:check               # Quick check
rana seo:check --fix         # Auto-fix issues
rana seo:check --verbose     # Detailed output
```

**Checks:**
- Meta tags (title, description)
- Open Graph tags
- Twitter Cards
- Structured data (JSON-LD)
- Sitemap existence
- Robots.txt
- Image optimization
- Performance metrics

**Output:**
- SEO score (0-100)
- Category scores
- Fix suggestions

### `rana seo:generate`
Generate sitemap, robots.txt, and other SEO files
```bash
rana seo:generate            # Interactive selection
rana seo:generate --all      # Generate all files
```

**Generates:**
- `app/sitemap.ts` - Dynamic sitemap
- `app/robots.ts` - Robots.txt
- `app/manifest.ts` - Web manifest (PWA)
- `components/SEO.tsx` - SEO component
- `components/StructuredData.tsx` - JSON-LD templates

### `rana seo:analyze`
Analyze pages for SEO
```bash
rana seo:analyze             # Analyze all pages
```

**Per-page Analysis:**
- Title presence
- Description quality
- OG image
- Structured data
- SEO score

### `rana seo:setup`
Interactive SEO setup wizard
```bash
rana seo:setup               # Complete SEO setup
```

**Configures:**
- Site name & URL
- Default meta tags
- OG images
- Generates all SEO files

---

## 📊 Process Intelligence Commands ⭐ NEW

### `rana analyze:velocity`
Analyze development velocity and DORA metrics
```bash
rana analyze:velocity              # 30-day analysis
rana analyze:velocity -p 7d        # Last 7 days
rana analyze:velocity --detailed   # Show contributors
rana analyze:velocity --export json # Export report
```

**Metrics Tracked:**
- Commit velocity (total, weekly, daily)
- Code changes (files, lines added/deleted)
- AI-generated code estimation
- DORA metrics (deployment frequency, lead time, MTTR, CFR)
- Cost analysis (LLM usage, savings)

**Output:**
- Development velocity dashboard
- Cost insights (70% savings calculation)
- DORA performance levels
- Actionable recommendations

### `rana analyze:legacy`
AI-powered legacy code analysis
```bash
rana analyze:legacy                # Analyze current directory
rana analyze:legacy --path ./src   # Specific directory
rana analyze:legacy --detailed     # All issues
rana analyze:legacy --export md    # Markdown report
```

**Patterns Detected:**
- JavaScript: var, callbacks, jQuery, eval
- TypeScript: any types, missing strict
- React: class components, deprecated lifecycle
- CSS: inline styles, float layouts
- Security: innerHTML, hardcoded secrets

**Output:**
- Health score (0-100)
- Technical debt estimate (hours + cost)
- Modernization plan (phased)
- Prioritized recommendations

### `rana velocity:setup`
Setup velocity tracking
```bash
rana velocity:setup                # Configure tracking
```

---

## 💰 Cost & Benchmarking Commands ⭐ NEW

### `rana cost:estimate`
Estimate LLM costs for your application
```bash
rana cost:estimate                 # Medium scenario (default)
rana cost:estimate -s light        # Hobby usage
rana cost:estimate -s enterprise   # Enterprise usage
rana cost:estimate -r 5000         # Custom daily requests
rana cost                          # Shortcut alias
```

**Usage Scenarios:**
- Light (Hobby): 100 daily requests
- Medium (Startup): 1,000 daily requests
- Heavy (Growth): 10,000 daily requests
- Enterprise: 100,000 daily requests

**Output:**
- Monthly cost estimates for all providers
- Standard vs RANA-optimized costs
- 70% savings breakdown
- Cheapest/most expensive options
- Recommendations by use case

### `rana cost:compare`
Compare LLM provider pricing
```bash
rana cost:compare                  # All providers pricing table
```

**Providers Covered (Jan 2025 pricing):**
- OpenAI (GPT-4 Turbo, GPT-4o, GPT-4o-mini, GPT-3.5)
- Anthropic (Claude 3 Opus, Sonnet, Haiku)
- Google (Gemini 1.5 Pro, Flash, 2.0 Flash)
- Groq (Llama 3.1 70B/8B, Mixtral)
- Together (Llama 3.1 70B/8B, Qwen 2.5)

### `rana benchmark:run`
Benchmark LLM providers for your specific use case
```bash
rana benchmark:run                 # All providers
rana benchmark:run -p openai,groq  # Specific providers
rana benchmark:run -i 5            # 5 iterations
rana benchmark                     # Shortcut alias
```

**Metrics:**
- Latency (ms)
- Tokens per second (TPS)
- Quality score (0-100)
- Cost per 1K tokens
- Overall weighted score

**Output:**
- Ranked benchmark results
- Color-coded performance indicators
- Recommendations by use case (speed, quality, cost, throughput)
- RANA smart routing suggestions

### `rana benchmark:quick`
Quick latency check for all providers
```bash
rana benchmark:quick               # Check all provider latencies
```

**Output:**
- Provider status (online/offline)
- Current latency
- Average latency

---

## 🩺 Diagnostic Commands ⭐ NEW

### `rana doctor`
Diagnose project setup and fix common issues
```bash
rana doctor                        # Run diagnostics
rana doctor --fix                  # Auto-fix issues
rana doctor --verbose              # Detailed output
```

**Checks Performed:**
- Node.js version (>= 18 required)
- package.json presence
- .rana.yml configuration
- node_modules installation
- Git repository
- TypeScript configuration
- TypeScript strict mode
- Environment variables (.env)
- LLM API keys
- ESLint configuration
- Prettier configuration
- Security vulnerabilities (npm audit)

**Output:**
- Pass/Warn/Fail for each check
- Health score (0-100%)
- Auto-fixable issues list
- Critical issues summary
- Next steps recommendations

**Auto-fixes Available:**
- Copy .env.example to .env
- Initialize git repository
- Install dependencies (npm install)
- Fix security vulnerabilities (npm audit fix)

---

## 📱 Mobile Commands

### `rana mobile:validate`
Validate mobile-first compliance
```bash
rana mobile:validate         # Quick validation
rana mobile:validate --fix   # Auto-fix issues
rana mobile:validate --verbose # Detailed output
```

**Checks:**
- Touch target sizes (≥ 44px)
- Viewport configuration
- Mobile navigation
- Responsive images
- PWA setup
- Mobile performance
- Touch gestures
- Font sizes

**Output:**
- Mobile score (0-100)
- Issue categorization
- Fix suggestions

### `rana mobile:test`
Test on different mobile viewports
```bash
rana mobile:test             # Show viewport guide
```

**Viewports:**
- iPhone SE (375x667)
- iPhone 12 (390x844)
- iPhone 14 Pro Max (430x932)
- iPad Mini (768x1024)
- iPad Pro (1024x1366)
- Galaxy S21 (360x800)
- Pixel 5 (393x851)

### `rana mobile:setup`
Interactive mobile setup wizard
```bash
rana mobile:setup            # Configure mobile features
```

**Features:**
- Touch-optimized components
- PWA configuration
- Mobile navigation
- Gesture handlers
- Responsive images
- Service worker (offline support)

---

## 🎮 Playground Commands ⭐ NEW

### `rana playground`
Interactive REPL for testing RANA features
```bash
rana playground              # Start interactive playground
```

**Available REPL Commands:**
- `template <name>` - Load quick template (agent, tool, orchestrator, mcp, security)
- `run <file>` - Execute TypeScript/JavaScript file
- `save <name>` - Save current code snippet
- `load <name>` - Load saved snippet
- `list` - List saved snippets
- `context` - Show current variables
- `reset` - Reset session
- `history` - Show command history
- `export` - Export session
- `help` - Show help
- `exit` - Exit playground

### `rana demo`
Run quick feature demonstration
```bash
rana demo                    # Show RANA features in action
```

### `rana quickstart`
Show interactive quickstart guide
```bash
rana quickstart              # Step-by-step getting started
```

---

## 📝 Prompt Management Commands ⭐ NEW

### `rana prompts save`
Save a new prompt
```bash
rana prompts save            # Interactive prompt creation
```

**Prompts Include:**
- Name and description
- Category (agent, generation, mcp, system, task, custom)
- Tags for organization
- Variable placeholders ({{variable}})

### `rana prompts list`
List all saved prompts
```bash
rana prompts list            # All prompts
rana prompts list --category agent  # Filter by category
rana prompts list --search "code"   # Search prompts
```

### `rana prompts use <name>`
Get and use a saved prompt
```bash
rana prompts use my-prompt   # Copy to clipboard
rana prompts use my-prompt --vars name=John,role=dev  # With variables
```

### `rana prompts analyze`
Analyze prompt quality
```bash
rana prompts analyze my-prompt  # Quality analysis
```

**Metrics:**
- Clarity score (0-100)
- Specificity score (0-100)
- Actionability score (0-100)
- Estimated tokens
- Issues and suggestions

### `rana prompts improve`
Get AI-powered improvement suggestions
```bash
rana prompts improve my-prompt  # Get suggestions
rana prompts improve my-prompt --apply  # Apply changes
```

### `rana prompts compare <a> <b>`
Compare two prompts side-by-side
```bash
rana prompts compare old-prompt new-prompt
```

### `rana prompts import/export`
Import and export prompts
```bash
rana prompts export --output prompts.json
rana prompts export --category agent --output agent-prompts.json
rana prompts import team-prompts.json
rana prompts import prompts.json --strategy merge
```

### `rana prompts analytics`
View prompt usage analytics
```bash
rana prompts analytics       # Usage statistics
```

---

## 🔧 Code Generation Commands

### `rana generate <description>`
Generate code from natural language
```bash
rana generate "create a login form with email and password"
rana generate --template react-component "UserProfile"
rana generate --dry-run "button component"  # Preview only
rana generate --output ./src/components "modal"
```

### `rana templates`
List available code generation templates
```bash
rana templates               # All templates
rana templates --category react  # Filter by category
rana templates --search "form"   # Search templates
```

**Available Templates (30+):**
- React: component, form, modal, data-table, hook
- Next.js: api-route, server-action, page, layout
- State: zustand-store, react-context, tanstack-query
- Testing: vitest-component, playwright-e2e, vitest-hook
- Database: prisma-model, drizzle-schema, supabase-migration
- Utilities: error-boundary, loading-skeleton, utility-hook

### `rana explain <file>`
Explain code in a file
```bash
rana explain ./src/utils/auth.ts  # Get code explanation
```

---

## 🔌 MCP Commands

### `rana mcp create <name>`
Create a new MCP server
```bash
rana mcp create my-server    # Interactive MCP server creation
rana mcp create my-server --template database  # From template
```

**Templates:**
- `database` - Database operations (PostgreSQL, MySQL, SQLite)
- `github` - GitHub integration
- `search` - Semantic search
- `slack` - Slack integration
- `notion` - Notion integration

### `rana mcp add-tool <name>`
Add a tool to MCP server
```bash
rana mcp add-tool search     # Interactive tool creation
```

### `rana mcp add-resource <name>`
Add a resource to MCP server
```bash
rana mcp add-resource users  # Interactive resource creation
```

---

## 🎯 Command Categories Summary

### Database (6 commands)
- `db:setup` - Interactive setup
- `db:migrate` - Run migrations
- `db:seed` - Seed data
- `db:reset` - Reset database
- `db:studio` - Visual editor
- `db:status` - Show status

### Security (2 commands)
- `security:audit` - Security scan
- `security:setup` - Setup wizard

### LLM (4 commands)
- `llm:analyze` - Cost analysis
- `llm:optimize` - Apply optimizations
- `llm:compare` - Compare models
- `llm:setup` - Configure providers

### SEO (4 commands)
- `seo:check` - Validate SEO
- `seo:generate` - Generate files
- `seo:analyze` - Analyze pages
- `seo:setup` - Setup wizard

### Mobile (3 commands)
- `mobile:validate` - Compliance check
- `mobile:test` - Viewport testing
- `mobile:setup` - Setup wizard

### Process Intelligence (3 commands)
- `analyze:velocity` - Development velocity & DORA metrics
- `analyze:legacy` - Legacy code modernization analysis
- `velocity:setup` - Setup velocity tracking

### Cost & Benchmarking (4 commands) ⭐ NEW
- `cost:estimate` - Estimate LLM costs
- `cost:compare` - Compare provider pricing
- `benchmark:run` - Benchmark providers
- `benchmark:quick` - Quick latency check

### Diagnostics (1 command) ⭐ NEW
- `doctor` - Diagnose project setup

### Playground (3 commands) ⭐ NEW
- `playground` - Interactive REPL
- `demo` - Quick demo
- `quickstart` - Getting started guide

### Prompts (8 commands) ⭐ NEW
- `prompts save` - Save prompt
- `prompts list` - List prompts
- `prompts use` - Use prompt
- `prompts analyze` - Quality analysis
- `prompts improve` - AI improvements
- `prompts compare` - Compare prompts
- `prompts import/export` - Share prompts
- `prompts analytics` - Usage stats

### Code Generation (3 commands)
- `generate` - Generate code from description
- `templates` - List templates
- `explain` - Explain code

### MCP (3 commands)
- `mcp create` - Create MCP server
- `mcp add-tool` - Add tool
- `mcp add-resource` - Add resource

### Core (6 commands)
- `init` - Initialize project
- `check` - Compliance check
- `deploy` - Deploy app
- `status` - Show status
- `config` - Show config
- `validate` - Validate config

---

## 💡 Common Workflows

### New Project Setup
```bash
# 1. Initialize RANA
rana init -t nextjs

# 2. Setup database
rana db:setup

# 3. Setup security
rana security:setup

# 4. Setup LLM providers
rana llm:setup

# 5. Setup SEO
rana seo:setup

# 6. Setup mobile
rana mobile:setup

# 7. Check everything
rana check

# Total time: ~10 minutes
```

### Pre-Deployment Checklist
```bash
# Run all checks
rana check
rana security:audit
rana seo:check
rana mobile:validate
rana llm:analyze

# Fix issues
rana check --fix
rana security:audit --fix
rana seo:check --fix
rana mobile:validate --fix

# Deploy
rana deploy
```

### Cost Optimization
```bash
# 1. Analyze current costs
rana llm:analyze --detailed

# 2. See potential savings
rana llm:compare

# 3. Apply optimizations
rana llm:optimize --all

# Expected: 70% cost reduction
```

### SEO Optimization
```bash
# 1. Check current SEO
rana seo:check --verbose

# 2. Generate missing files
rana seo:generate --all

# 3. Analyze all pages
rana seo:analyze

# 4. Fix issues
rana seo:check --fix
```

### Mobile Optimization
```bash
# 1. Validate mobile compliance
rana mobile:validate --verbose

# 2. Setup mobile features
rana mobile:setup

# 3. Test viewports
rana mobile:test

# 4. Fix issues
rana mobile:validate --fix
```

---

## 🔧 Advanced Usage

### Chaining Commands
```bash
# Setup everything
rana db:setup && rana security:setup && rana llm:setup

# Run all checks
rana check && rana security:audit && rana seo:check && rana mobile:validate

# Generate all files
rana seo:generate --all && rana db:migrate

# Deploy with checks
rana security:audit && rana deploy --verify
```

### CI/CD Integration
```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    steps:
      - run: rana check
      - run: rana security:audit
      - run: rana seo:check
      - run: rana mobile:validate
      - run: rana deploy
```

### Git Hooks
```bash
# .husky/pre-commit
#!/bin/sh
rana check
rana security:audit

# .husky/pre-push
#!/bin/sh
rana check --fix
rana security:audit --fix
rana seo:check --fix
```

---

## 📊 Command Statistics

**Total Commands:** 47+
**Code Generated:** ~5,000 lines
**Frameworks Covered:** 12 (Database, Security, LLM, SEO, Mobile, Process Intelligence, Cost/Benchmarking, Diagnostics, Playground, Prompts, Code Generation, MCP)
**Auto-fixes Available:** 25+
**Interactive Wizards:** 7
**Quality Checks:** 60+

---

## 🚀 Coming Soon

### Phase 2 Commands (Next Release)
```bash
# Natural language interface
rana add "Stripe checkout with subscriptions"
rana add "Auth with email + Google OAuth"

# Smart analysis
rana analyze                 # Complete project analysis
rana optimize --all          # Auto-optimize everything

# Agent commands
rana agent:deploy            # Deploy with AI agent
rana agent:fix               # Fix issues with AI

# Template commands
rana template:create         # Create custom template
rana template:list           # List available templates
rana template:install        # Install community template
```

---

## 📖 Getting Help

```bash
# General help
rana --help

# Command-specific help
rana db:setup --help
rana security:audit --help
rana llm:analyze --help

# Version
rana --version

# Documentation
rana docs                    # Open documentation
```

---

## 🎯 Key Features

### Auto-Fix Capabilities
- Environment variable security
- Missing meta tags
- Sitemap generation
- Robots.txt generation
- Security headers
- Touch target sizes
- PWA manifest

### Interactive Wizards
- Database setup (provider selection, config)
- Security setup (auth, rate limiting)
- LLM setup (provider config, API keys)
- SEO setup (site config, file generation)
- Mobile setup (feature selection)

### Quality Gates
All commands integrate with `.rana.yml` quality gates:
- Minimum security score: 90
- Maximum LLM cost: $500/mo
- SEO score: 85+
- Mobile score: 90+
- Test coverage: 80%+

---

## 💎 Why RANA CLI is Unique

**No competitor offers:**
1. **30+ integrated commands** across all frameworks
2. **70% LLM cost reduction** built-in
3. **Auto-fix capabilities** for most issues
4. **Interactive wizards** for complex setup
5. **Complete quality gates** enforced
6. **Production-ready** from day 1
7. **Cost estimation & benchmarking** for all LLM providers
8. **Project health diagnostics** with auto-fix

**One command can:**
- Setup your entire database
- Audit your security
- Optimize your LLM costs by 70%
- Generate all SEO files
- Validate mobile compliance

**No other tool does this.** 🎯

---

*Ashley Kays | Waymaker | RANA v2.0*
*All commands production-ready and tested*
