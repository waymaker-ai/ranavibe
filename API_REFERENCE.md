# RANA/RANA Framework - Complete API Reference

> **Production-ready AI apps in 5 minutes**

This document provides complete API documentation for the RANA/RANA Framework.

---

## Table of Contents

1. [CLI Commands](#cli-commands)
2. [Configuration](#configuration)
3. [Core Modules](#core-modules)
4. [LLM Integration](#llm-integration)
5. [Database](#database)
6. [Security](#security)
7. [SEO](#seo)
8. [Mobile](#mobile)
9. [Deployment](#deployment)

---

## CLI Commands

### Installation

```bash
# Install globally
npm install -g @rana/cli

# Or use npx
npx @rana/cli init
```

### Core Commands

#### `rana init`

Initialize RANA in your project.

```bash
rana init [options]

Options:
  -t, --template <type>  Template to use: default, react, nextjs, vue
  -f, --force            Overwrite existing configuration
  --skip-install         Skip npm install

Examples:
  rana init                    # Use default template
  rana init -t nextjs          # Use Next.js template
  rana init -t react --force   # Force overwrite existing config
```

**What it does:**
- Creates `.rana.yml` configuration file
- Installs dependencies
- Sets up project structure
- Creates example files

---

#### `rana check`

Check compliance with RANA standards.

```bash
rana check [options]

Options:
  -v, --verbose  Show detailed output
  -f, --fix      Automatically fix issues where possible

Examples:
  rana check           # Quick check
  rana check -v        # Detailed output
  rana check --fix     # Auto-fix issues
```

**Checks:**
- ✅ Security score (95+ required)
- ✅ SEO score (90+ required)
- ✅ Mobile score (95+ required)
- ✅ Accessibility score (90+ required)
- ✅ Performance score (90+ required)
- ✅ Configuration validity
- ✅ Dependencies up to date
- ✅ No security vulnerabilities

**Exit codes:**
- `0` - All checks passed
- `1` - Some checks failed
- `2` - Critical issues found

---

#### `rana deploy`

Deploy with RANA verification workflow.

```bash
rana deploy [options]

Options:
  --verify           Verify deployment in production
  --skip-tests       Skip testing phase (not recommended)
  --environment <env> Target environment (staging, production)
  --dry-run          Preview deployment without executing

Examples:
  rana deploy                      # Deploy to production
  rana deploy --verify             # Deploy with verification
  rana deploy --environment staging # Deploy to staging
  rana deploy --dry-run            # Preview deployment
```

**Deployment flow:**
1. Run quality checks (`rana check`)
2. Run tests
3. Build project
4. Deploy to target environment
5. Verify deployment (if `--verify`)
6. Rollback on failure

---

#### `rana status`

Show RANA project status.

```bash
rana status

Output:
  - RANA version
  - Project name
  - Quality scores
  - Last check date
  - Last deploy date
  - Configuration summary
```

---

#### `rana validate`

Validate `.rana.yml` configuration.

```bash
rana validate

Output:
  - Configuration validity
  - Missing required fields
  - Invalid values
  - Warnings
```

---

### Database Commands

#### `rana db:setup`

Interactive database setup wizard.

```bash
rana db:setup

Interactive prompts:
  1. Choose database provider (Supabase, PostgreSQL, MySQL, MongoDB)
  2. Enter connection details
  3. Configure authentication
  4. Set up migrations
```

**Supported databases:**
- Supabase (PostgreSQL + Auth)
- PostgreSQL
- MySQL
- MongoDB
- SQLite (dev only)

---

#### `rana db:migrate`

Run database migrations.

```bash
rana db:migrate [options]

Options:
  --create <name>   Create new migration
  --up              Run pending migrations (default)
  --down            Rollback last migration
  --reset           Reset all migrations
  --dry-run         Preview migrations without executing

Examples:
  rana db:migrate                    # Run pending migrations
  rana db:migrate --create add-users # Create new migration
  rana db:migrate --down             # Rollback last migration
```

---

#### `rana db:seed`

Seed database with data.

```bash
rana db:seed [options]

Options:
  --file <path>  Path to seed file
  --clear        Clear existing data first

Examples:
  rana db:seed                  # Run all seed files
  rana db:seed --file users.ts  # Run specific seed
  rana db:seed --clear          # Clear and seed
```

---

#### `rana db:reset`

Reset database (WARNING: deletes all data).

```bash
rana db:reset [options]

Options:
  --force  Skip confirmation prompt

Example:
  rana db:reset         # Reset with confirmation
  rana db:reset --force # Force reset
```

---

#### `rana db:studio`

Open database management UI.

```bash
rana db:studio

Opens:
  - Prisma Studio (for Prisma projects)
  - Supabase Studio (for Supabase projects)
  - pgAdmin (for PostgreSQL projects)
```

---

#### `rana db:status`

Show database status.

```bash
rana db:status

Output:
  - Database provider
  - Connection status
  - Migration status
  - Table count
  - Last backup
```

---

### Security Commands

#### `rana security:audit`

Run security audit on codebase.

```bash
rana security:audit [options]

Options:
  --fix      Automatically fix issues where possible
  --verbose  Show detailed output
  --json     Output results as JSON

Examples:
  rana security:audit           # Run audit
  rana security:audit --fix     # Auto-fix issues
  rana security:audit --verbose # Detailed output
```

**Checks:**
1. **OWASP Top 10 Protection**
   - Broken Access Control
   - Cryptographic Failures
   - Injection Attacks
   - Insecure Design
   - Security Misconfiguration
   - Vulnerable Components
   - Authentication Failures
   - Data Integrity Failures
   - Security Logging
   - SSRF Prevention

2. **Dependency Vulnerabilities**
   - npm audit
   - Known CVEs
   - Outdated packages

3. **Code Security**
   - Hardcoded secrets
   - SQL injection risks
   - XSS vulnerabilities
   - CSRF protection
   - Rate limiting

4. **GDPR Compliance**
   - Cookie consent
   - Privacy policy
   - Data retention
   - Right to be forgotten

**Output:**
```
Security Audit Results:

✅ OWASP Top 10: 10/10 passed
✅ Dependency Security: No vulnerabilities
⚠️  Code Security: 2 warnings
   - Line 45: Potential XSS vulnerability
   - Line 102: Missing CSRF token

✅ GDPR Compliance: Fully compliant

Overall Security Score: 96/100
```

---

#### `rana security:setup`

Interactive security setup wizard.

```bash
rana security:setup

Interactive prompts:
  1. Choose authentication provider (Supabase, NextAuth, Clerk, Auth0)
  2. Configure rate limiting
  3. Set up security headers
  4. Enable GDPR compliance tools
  5. Configure CORS
  6. Set up API key management
```

---

### LLM Commands

#### `rana llm:setup`

Setup LLM providers.

```bash
rana llm:setup

Interactive prompts:
  1. Choose providers (OpenAI, Anthropic, Google, xAI, Mistral, etc.)
  2. Enter API keys (saved to .env.local)
  3. Configure default provider
  4. Set up cost tracking
  5. Enable caching
```

**Supported providers:**
1. OpenAI (GPT-4o, GPT-4o-mini)
2. Anthropic (Claude 3.5 Sonnet, Haiku)
3. Google (Gemini 3, Gemini 2.0 Flash)
4. xAI (Grok 2, Grok 2 Vision)
5. Mistral AI
6. Cohere
7. Together.ai
8. Groq
9. Ollama (local)

---

#### `rana llm:analyze`

Analyze LLM usage and costs.

```bash
rana llm:analyze [options]

Options:
  --detailed     Show detailed analysis
  --provider <name>  Analyze specific provider
  --timeframe <days> Analyze last N days (default: 30)

Examples:
  rana llm:analyze                # Last 30 days
  rana llm:analyze --detailed     # Detailed breakdown
  rana llm:analyze --provider openai --timeframe 7
```

**Output:**
```
LLM Cost Analysis (Last 30 Days):

Total Requests: 12,450
Total Tokens: 45,230,000
Total Cost: $1,245.50

By Provider:
  OpenAI GPT-4o:        $850.00 (68%)
  Anthropic Claude:     $295.50 (24%)
  Google Gemini:        $100.00 (8%)

By Category:
  Cached responses:     $0.00 (saved $500.00)
  Streaming:            $745.50
  Batch:                $500.00

Optimization Opportunities:
  ⚡ Enable caching:     Save $500/month (40%)
  ⚡ Use Gemini Flash:   Save $250/month (20%)
  ⚡ Batch requests:     Save $150/month (12%)

Total Potential Savings: $900/month (72%)
```

---

#### `rana llm:optimize`

Apply LLM cost optimizations.

```bash
rana llm:optimize [options]

Options:
  --all              Apply all optimizations without prompting
  --caching          Enable response caching
  --routing          Enable smart model routing
  --batching         Enable request batching
  --prompts          Optimize prompt templates

Examples:
  rana llm:optimize           # Interactive mode
  rana llm:optimize --all     # Apply all optimizations
  rana llm:optimize --caching # Only enable caching
```

**Optimizations applied:**

1. **Response Caching (40% savings)**
   - Adds Redis caching layer
   - Caches identical queries
   - Configurable TTL

2. **Smart Model Routing (25% savings)**
   - Routes simple queries to cheap models
   - Complex queries to powerful models
   - Automatic task classification

3. **Request Batching (15% savings)**
   - Batches multiple requests
   - Reduces API calls
   - Configurable batch size

4. **Prompt Optimization (15% savings)**
   - Removes unnecessary tokens
   - Compresses prompts
   - Maintains quality

**Total potential savings: 60-70%**

---

#### `rana llm:compare`

Compare LLM models and pricing.

```bash
rana llm:compare [options]

Options:
  --providers <list>  Compare specific providers (comma-separated)
  --metric <type>     Sort by: cost, speed, quality
  --task <type>       Task type: chat, completion, embedding, multimodal

Examples:
  rana llm:compare                        # Compare all providers
  rana llm:compare --providers openai,anthropic
  rana llm:compare --metric cost --task chat
```

**Output:**
```
LLM Provider Comparison (Chat Task):

Provider              Model                Cost (per 1M tokens)   Speed      Quality
─────────────────────────────────────────────────────────────────────────────────────
Google                Gemini 2.0 Flash     $0.10                  ⚡⚡⚡      ★★★★☆
OpenAI                GPT-4o-mini          $0.15                  ⚡⚡       ★★★★☆
Groq                  Llama 3.1            $0.20 (free tier)      ⚡⚡⚡⚡     ★★★☆☆
xAI                   Grok 2               $2.00                  ⚡⚡       ★★★★★
Anthropic             Claude 3.5 Sonnet    $3.00                  ⚡⚡       ★★★★★
OpenAI                GPT-4o               $5.00                  ⚡⚡       ★★★★★

Recommendation:
  💰 Best Value: Google Gemini 2.0 Flash ($0.10/1M)
  ⚡ Fastest: Groq Llama 3.1
  ⭐ Highest Quality: OpenAI GPT-4o, Claude 3.5 Sonnet

For your use case (10M tokens/month):
  - Current cost: $1,500 (GPT-4o)
  - Optimized cost: $450 (Smart routing)
  - Savings: $1,050/month (70%)
```

---

### SEO Commands

#### `rana seo:check`

Validate SEO setup.

```bash
rana seo:check [options]

Options:
  --fix      Automatically fix issues where possible
  --verbose  Show detailed output
  --url <url> Check specific URL

Examples:
  rana seo:check           # Check all pages
  rana seo:check --fix     # Auto-fix issues
  rana seo:check --url /about
```

**Checks:**
- Meta tags (title, description, Open Graph)
- Sitemap.xml
- Robots.txt
- Structured data (JSON-LD)
- Image alt tags
- Internal linking
- Mobile-friendliness
- Page speed
- SSL certificate
- Canonical URLs

**Output:**
```
SEO Check Results:

✅ Meta Tags: All pages have valid meta tags
✅ Sitemap: sitemap.xml found and valid
✅ Robots.txt: robots.txt found and valid
⚠️  Structured Data: 2 pages missing JSON-LD
✅ Images: All images have alt tags
⚠️  Internal Links: 5 broken links found
✅ Mobile: All pages mobile-friendly
✅ Speed: Average load time: 1.2s
✅ SSL: Valid SSL certificate
✅ Canonical: All pages have canonical URLs

Overall SEO Score: 92/100
```

---

#### `rana seo:generate`

Generate SEO files.

```bash
rana seo:generate [options]

Options:
  --all          Generate all SEO files
  --sitemap      Generate sitemap.xml
  --robots       Generate robots.txt
  --manifest     Generate manifest.json (PWA)
  --meta         Generate meta tags

Examples:
  rana seo:generate --all       # Generate everything
  rana seo:generate --sitemap   # Just sitemap
```

**Generated files:**
- `public/sitemap.xml`
- `public/robots.txt`
- `public/manifest.json`
- `components/SEOHead.tsx` (meta tags component)

---

#### `rana seo:analyze`

Analyze pages for SEO.

```bash
rana seo:analyze [options]

Options:
  --url <url>    Analyze specific URL
  --export <format> Export results (json, csv, pdf)

Examples:
  rana seo:analyze                    # Analyze all pages
  rana seo:analyze --url /blog/post-1
  rana seo:analyze --export json
```

---

#### `rana seo:setup`

Interactive SEO setup wizard.

```bash
rana seo:setup

Interactive prompts:
  1. Enter site name
  2. Enter site description
  3. Enter primary keywords
  4. Configure social media URLs
  5. Set up Google Analytics
  6. Configure sitemap settings
  7. Set up robots.txt rules
```

---

### Mobile Commands

#### `rana mobile:validate`

Validate mobile-first compliance.

```bash
rana mobile:validate [options]

Options:
  --fix      Automatically fix issues where possible
  --verbose  Show detailed output

Examples:
  rana mobile:validate           # Check compliance
  rana mobile:validate --fix     # Auto-fix issues
```

**Checks:**
- Touch targets (44x44px minimum)
- Responsive breakpoints
- Mobile navigation
- Font sizes (16px minimum)
- Viewport configuration
- Touch gestures
- Offline support (PWA)
- Mobile performance

**Output:**
```
Mobile-First Compliance Check:

✅ Touch Targets: All buttons ≥ 44x44px
✅ Responsive: Breakpoints correctly configured
⚠️  Navigation: Mobile menu missing on 2 pages
✅ Font Sizes: All text ≥ 16px
✅ Viewport: Meta viewport tag present
✅ Gestures: Swipe gestures implemented
⚠️  Offline: Service worker not registered
✅ Performance: Mobile load time: 1.5s

Overall Mobile Score: 88/100
```

---

#### `rana mobile:test`

Test on different mobile viewports.

```bash
rana mobile:test [options]

Options:
  --devices <list>  Test specific devices (comma-separated)
  --url <url>       Test specific URL
  --screenshot      Capture screenshots

Examples:
  rana mobile:test                    # Test all common devices
  rana mobile:test --devices iphone14,pixel7
  rana mobile:test --url /pricing --screenshot
```

**Tested devices:**
- iPhone 14 Pro (393x852)
- iPhone 14 Pro Max (430x932)
- iPhone SE (375x667)
- Samsung Galaxy S23 (360x800)
- Google Pixel 7 (412x915)
- iPad Pro (1024x1366)

---

#### `rana mobile:setup`

Interactive mobile setup wizard.

```bash
rana mobile:setup

Interactive prompts:
  1. Configure viewport meta tag
  2. Set up responsive breakpoints
  3. Add touch-optimized components
  4. Configure PWA (Progressive Web App)
  5. Set up mobile navigation
  6. Configure gestures
  7. Add mobile-specific styles
```

---

## Configuration

### `.rana.yml` Configuration File

```yaml
# RANA/RANA Configuration
version: 2.0
name: my-rana-app
description: Built with RANA Framework

# Quality thresholds
quality:
  security: 95    # Minimum security score
  seo: 90         # Minimum SEO score
  mobile: 95      # Minimum mobile score
  accessibility: 90 # Minimum a11y score
  performance: 90  # Minimum performance score

# LLM Configuration
llm:
  providers:
    - name: openai
      models: [gpt-4o, gpt-4o-mini]
      default: true
    - name: anthropic
      models: [claude-3-5-sonnet-20241022, claude-3-haiku-20240307]
    - name: google
      models: [gemini-2.0-flash, gemini-3-exp]

  optimization:
    caching:
      enabled: true
      ttl: 3600 # seconds
      provider: redis
    routing:
      enabled: true
      rules:
        - condition: "tokens < 100"
          model: gemini-2.0-flash
        - condition: "tokens >= 100"
          model: gpt-4o
    batching:
      enabled: true
      size: 10
      timeout: 1000 # milliseconds

# Database Configuration
database:
  provider: supabase # or postgres, mysql, mongodb
  connection:
    url: ${SUPABASE_URL}
    key: ${SUPABASE_ANON_KEY}
  auth:
    enabled: true
    providers: [email, google, github]

# Security Configuration
security:
  authentication:
    provider: supabase # or nextauth, clerk, auth0
  rateLimit:
    enabled: true
    max: 100 # requests per window
    window: 60000 # 1 minute
  cors:
    enabled: true
    origins: [https://yourdomain.com]
  headers:
    csp: true
    hsts: true
    xframe: DENY

# SEO Configuration
seo:
  siteName: My RANA App
  siteUrl: https://yourdomain.com
  description: Production-ready AI app
  keywords: [ai, app, rana]
  og:
    image: /og-image.png
    type: website
  twitter:
    card: summary_large_image
    site: '@yourhandle'
  analytics:
    google: G-XXXXXXXXXX

# Mobile Configuration
mobile:
  pwa:
    enabled: true
    name: My RANA App
    shortName: RANA
    themeColor: '#000000'
    backgroundColor: '#ffffff'
  touchTargets:
    minSize: 44 # pixels
  breakpoints:
    mobile: 640
    tablet: 768
    desktop: 1024

# Deployment Configuration
deployment:
  provider: vercel # or netlify, cloudflare, aws
  environments:
    - name: staging
      url: https://staging.yourdomain.com
      branch: develop
    - name: production
      url: https://yourdomain.com
      branch: main
  verification:
    enabled: true
    timeout: 300000 # 5 minutes
    checks:
      - health
      - smoke-tests
      - performance
```

---

## Core Modules

### Unified LLM Client

```typescript
import { UnifiedLLMClient } from '@rana/core';

const rana = new UnifiedLLMClient({
  providers: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_API_KEY,
  },
  defaultProvider: 'openai',
  optimization: {
    caching: true,
    routing: true,
  }
});

// Basic chat
const response = await rana.chat({
  provider: 'openai', // optional, uses default if not specified
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.content); // "Hello! How can I help you today?"

// Streaming
const stream = await rana.chat({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}

// Multimodal (with images)
const visionResponse = await rana.chat({
  provider: 'google',
  model: 'gemini-2.0-flash',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        { type: 'image_url', image_url: { url: 'https://...' } }
      ]
    }
  ]
});

// Function calling (tools)
const toolResponse = await rana.chat({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What is the weather in NYC?' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get the current weather',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          }
        }
      }
    }
  ]
});

// Cost tracking
const stats = rana.getStats();
console.log(stats.totalCost); // "$1.25"
console.log(stats.totalTokens); // 50000
console.log(stats.byProvider); // { openai: { cost: "$1.00", tokens: 40000 }, ... }
```

---

## Security Module

```typescript
import { SecurityModule } from '@rana/security';

// Initialize security
const security = new SecurityModule({
  rateLimit: {
    max: 100,
    window: 60000
  },
  cors: {
    origins: ['https://yourdomain.com']
  },
  csrf: true
});

// Rate limiting middleware (Express)
app.use(security.rateLimit());

// CORS middleware
app.use(security.cors());

// CSRF protection
app.use(security.csrf());

// Security headers
app.use(security.headers({
  csp: true,
  hsts: true,
  xframe: 'DENY'
}));

// Input validation
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

app.post('/signup', security.validate(userSchema), async (req, res) => {
  // req.body is validated and sanitized
});

// Audit logging
security.log('user_login', {
  userId: '123',
  ip: req.ip,
  timestamp: new Date()
});
```

---

## Questions?

- **Documentation:** https://rana.dev/docs
- **GitHub:** https://github.com/waymaker/rana
- **Discord:** https://discord.gg/rana
- **Email:** support@waymaker.ai

---

**Made with love to help you succeed faster ❤️**

**Waymaker** - https://waymaker.cx
