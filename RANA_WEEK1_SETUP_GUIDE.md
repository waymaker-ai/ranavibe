# RANA Week 1 Setup Guide

**Goal:** Complete foundation setup for RANA project
**Timeline:** December 1-7, 2025 (7 days)
**Status:** Ready to execute

---

## Summary

**What we're building:**
RANA (Rapid AI Native Architecture) - A multi-platform tool that provides quality gates and strategic validation for AI-assisted development.

**What we have:**
- ✅ REPM methodology integrated into .rana.yml
- ✅ Multi-platform distribution strategy
- ✅ Implementation roadmap
- ✅ Comprehensive prompt library
- ✅ Open source + monetization model
- ✅ Technical architecture designed

**What we need:**
- [ ] Domain registration (rana.cx)
- [ ] GitHub repository (waymaker-ai/rana)
- [ ] Monorepo structure
- [ ] MCP server package initialized
- [ ] Basic landing page

---

## Day 1: Domain & Repository Setup

### Task 1.1: Register Domains (30 min)

**Domains needed:**
- `rana.cx` - Main domain (marketing + redirect)
- Subdomains (will point via DNS):
  - `api.rana.cx` - REST API
  - `docs.rana.cx` - Documentation
  - `app.rana.cx` - Dashboard (Pro tier)

**Steps:**

1. **Check if rana.cx is available:**
   ```bash
   # Option 1: Use WHOIS
   whois rana.cx

   # Option 2: Check at registrar
   # Visit: namecheap.com, gandi.net, or cloudflare.com
   ```

2. **If available - Register:**
   - **Recommended registrar:** Cloudflare (cheapest, best DNS)
   - **Cost:** ~$10-15/year for .cx domain
   - **Steps:**
     1. Go to cloudflare.com/products/registrar
     2. Search for "rana.cx"
     3. Add to cart
     4. Complete purchase
     5. Set nameservers to Cloudflare

3. **Alternative domains if rana.cx taken:**
   - `userana.com` - $10-12/year
   - `rana.dev` - $12-15/year
   - `ranadev.com` - $10-12/year
   - `ranaframework.com` - $10-12/year

4. **DNS Setup (after registration):**
   ```
   A     @              76.76.21.21  (Vercel)
   A     api            76.76.21.21  (Vercel or Railway)
   A     docs           76.76.21.21  (Vercel)
   A     app            76.76.21.21  (Vercel)
   CNAME www            cname.vercel-dns.com.
   ```

**Deliverable:** Domain registered and DNS configured ✅

---

### Task 1.2: Create GitHub Repository (30 min)

**Repository setup:**

1. **Go to GitHub:**
   ```bash
   # Option 1: Create via GitHub web interface
   # 1. Go to github.com/new
   # 2. Repository name: rana
   # 3. Description: "Rapid AI Native Architecture - Quality gates and strategic validation for AI-assisted development"
   # 4. Public repository
   # 5. Add README: Yes
   # 6. Add .gitignore: Node
   # 7. Add license: MIT
   # 8. Create repository

   # Option 2: Create via CLI
   gh repo create waymaker-ai/rana --public --description "Rapid AI Native Architecture" --clone
   ```

2. **Clone locally:**
   ```bash
   cd ~/projects
   git clone git@github.com:waymaker-ai/rana.git
   cd rana
   ```

3. **Update README.md:**
   ```markdown
   # RANA - Rapid AI Native Architecture

   Quality gates and strategic validation for AI-assisted development.

   ## 🚀 What is RANA?

   RANA helps developers using AI assistants (Claude, ChatGPT, Gemini) build production-quality code through:

   1. **Quality Gates** - Tactical checks for code quality
   2. **REPM Validation** - Strategic validation for major features
   3. **Multi-Platform** - Works with any AI assistant

   ## 📦 Installation

   Coming soon! MCP server launches February 2025.

   ## 🎯 Features

   - ✅ Search-before-create patterns
   - ✅ Real data only (no mocks)
   - ✅ Comprehensive error handling
   - ✅ Design system compliance
   - ✅ Test-driven development
   - ✅ Production deployment verification
   - ✅ Strategic REPM validation for major features

   ## 🌟 Status

   **Phase:** Foundation (Week 1 of 24)
   **Launch:** February 2025 (MCP Server)
   **License:** MIT (Open Core)

   ## 📖 Documentation

   Coming soon at docs.rana.cx

   ## 🤝 Contributing

   We welcome contributions! More details coming soon.

   ## 📝 License

   MIT License - see LICENSE file

   ---

   Built with ❤️ by [Waymaker](https://waymaker.cx)
   ```

4. **Commit and push:**
   ```bash
   git add README.md
   git commit -m "docs: Update README with project overview"
   git push origin main
   ```

**Deliverable:** GitHub repository created and README updated ✅

---

## Day 2: Monorepo Structure

### Task 2.1: Initialize Monorepo (1 hour)

**Directory structure:**

```bash
cd ~/projects/rana

# Create monorepo structure
mkdir -p packages/core
mkdir -p packages/mcp-server
mkdir -p packages/api
mkdir -p packages/sdk
mkdir -p packages/cli
mkdir -p apps/web
mkdir -p apps/docs
mkdir -p examples/nextjs
mkdir -p examples/react
mkdir -p examples/python
mkdir -p templates
mkdir -p .github/workflows
```

**Initialize pnpm workspace:**

```bash
# Install pnpm if not installed
npm install -g pnpm

# Initialize
pnpm init

# Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
  - 'apps/*'
  - 'examples/*'
EOF

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "rana-monorepo",
  "version": "0.1.0",
  "private": true,
  "description": "RANA - Rapid AI Native Architecture",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.3",
    "@types/node": "^20.10.0",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0"
  },
  "packageManager": "pnpm@8.12.0",
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Install dependencies
pnpm install

# Create turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp/
.pnp.js

# Build outputs
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Misc
.turbo/
EOF

# Create .prettierrc
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
EOF
```

**Deliverable:** Monorepo structure created with pnpm + Turbo ✅

---

## Day 3: Core Package

### Task 3.1: Initialize Core Package (2 hours)

**Core package contains:**
- Config parser (.rana.yml)
- Quality gate definitions
- Validation logic
- REPM framework

**Setup:**

```bash
cd packages/core

# Initialize package
pnpm init

# Update package.json
cat > package.json << 'EOF'
{
  "name": "@rana/core",
  "version": "0.1.0",
  "description": "RANA core framework - config parsing, quality gates, validation",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint src/",
    "test": "vitest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "js-yaml": "^4.1.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "tsup": "^8.0.1",
    "vitest": "^1.0.4",
    "@types/js-yaml": "^4.0.9"
  },
  "keywords": [
    "rana",
    "ai",
    "development",
    "quality-gates",
    "validation"
  ],
  "license": "MIT"
}
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create source structure
mkdir -p src/config
mkdir -p src/quality-gates
mkdir -p src/repm
mkdir -p src/utils

# Create index.ts
cat > src/index.ts << 'EOF'
export * from './config';
export * from './quality-gates';
export * from './repm';
export * from './utils';
EOF

# Create config parser
cat > src/config/index.ts << 'EOF'
import yaml from 'js-yaml';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// RANA config schema
export const RanaConfigSchema = z.object({
  version: z.string(),
  project: z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    languages: z.array(z.string()),
  }),
  standards: z.object({
    principles: z.array(z.string()),
    design_system: z.any().optional(),
    patterns: z.any().optional(),
    code_quality: z.any().optional(),
  }),
  quality_gates: z.object({
    pre_implementation: z.array(z.any()),
    implementation: z.array(z.any()),
    testing: z.array(z.any()),
    deployment: z.array(z.any()),
  }),
  major_features: z.any().optional(),
});

export type RanaConfig = z.infer<typeof RanaConfigSchema>;

export class ConfigParser {
  static parse(filePath: string): RanaConfig {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content);
    return RanaConfigSchema.parse(data);
  }

  static validate(config: any): { valid: boolean; errors: string[] } {
    try {
      RanaConfigSchema.parse(config);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  }

  static findConfig(startDir: string = process.cwd()): string | null {
    let currentDir = startDir;

    while (currentDir !== path.parse(currentDir).root) {
      const configPath = path.join(currentDir, '.rana.yml');
      if (fs.existsSync(configPath)) {
        return configPath;
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }
}
EOF

# Install dependencies
pnpm install

# Build
pnpm build
```

**Deliverable:** Core package with config parser created ✅

---

## Day 4-5: MCP Server Package

### Task 4.1: Initialize MCP Server (4 hours)

**MCP server for Claude integration:**

```bash
cd packages/mcp-server

# Initialize package
pnpm init

# Update package.json
cat > package.json << 'EOF'
{
  "name": "@rana/mcp-server",
  "version": "0.1.0",
  "description": "RANA MCP server for Claude integration",
  "bin": {
    "rana-mcp": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "prepare": "npm run build"
  },
  "dependencies": {
    "@rana/core": "workspace:*",
    "@modelcontextprotocol/sdk": "^0.4.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.0"
  },
  "keywords": [
    "rana",
    "mcp",
    "claude",
    "ai-development"
  ],
  "license": "MIT"
}
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create source structure
mkdir -p src/tools
mkdir -p src/resources
mkdir -p src/prompts

# Create main server file
cat > src/index.ts << 'EOF'
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'rana-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'validate_rana_config',
      description: 'Validate .rana.yml configuration file',
      inputSchema: {
        type: 'object',
        properties: {
          config_path: {
            type: 'string',
            description: 'Path to .rana.yml file',
          },
        },
        required: ['config_path'],
      },
    },
    {
      name: 'check_quality_gates',
      description: 'Run RANA quality gate checks',
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            enum: ['pre_implementation', 'implementation', 'testing', 'deployment'],
            description: 'Development phase to check',
          },
          project_path: {
            type: 'string',
            description: 'Path to project directory',
          },
        },
        required: ['phase', 'project_path'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'validate_rana_config') {
    // TODO: Implement validation
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              valid: true,
              message: 'Config validation coming soon!',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === 'check_quality_gates') {
    // TODO: Implement quality gate checks
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              phase: args.phase,
              checks: [],
              message: 'Quality gate checks coming soon!',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'rana://docs/quality-gates',
      name: 'RANA Quality Gates Documentation',
      mimeType: 'text/markdown',
    },
  ],
}));

// Prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'init_rana_project',
      description: 'Initialize RANA in a new project',
      arguments: [
        {
          name: 'project_type',
          description: 'Type of project (nextjs, react, python, etc.)',
          required: true,
        },
      ],
    },
  ],
}));

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('RANA MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
EOF

# Make executable
chmod +x src/index.ts

# Install dependencies
pnpm install

# Build
pnpm build
```

**Deliverable:** Basic MCP server package created ✅

---

## Day 6: Landing Page

### Task 6.1: Create Landing Page (3 hours)

**Simple Next.js landing page:**

```bash
cd apps/web

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Update package.json
# Add "name": "@rana/web"

# Create simple landing page
# Edit app/page.tsx
```

**Landing page content:**

```typescript
// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            RANA
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            Rapid AI Native Architecture
          </p>
          <p className="text-xl text-gray-600 mb-12">
            Quality gates and strategic validation for AI-assisted development
          </p>

          {/* CTA */}
          <div className="flex gap-4 justify-center">
            <a
              href="https://github.com/waymaker-ai/rana"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              View on GitHub
            </a>
            <a
              href="#waitlist"
              className="px-8 py-4 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition"
            >
              Join Waitlist
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Quality Gates
            </h3>
            <p className="text-gray-600">
              Tactical checks for code quality, testing, and deployment.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              REPM Validation
            </h3>
            <p className="text-gray-600">
              Strategic validation for major features before implementation.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Multi-Platform
            </h3>
            <p className="text-gray-600">
              Works with Claude, ChatGPT, Gemini, and more.
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mt-20">
          <p className="text-gray-600">
            <strong>Status:</strong> Foundation Phase (Week 1 of 24)
          </p>
          <p className="text-gray-600">
            <strong>Launch:</strong> MCP Server - February 2025
          </p>
        </div>

        {/* Waitlist */}
        <div id="waitlist" className="max-w-md mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center mb-6">Join Waitlist</h2>
          <form className="space-y-4">
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-600 outline-none"
            />
            <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition">
              Get Early Access
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
```

**Deliverable:** Landing page created and ready to deploy ✅

---

## Day 7: Deploy & Document

### Task 7.1: Deploy Landing Page (30 min)

**Deploy to Vercel:**

```bash
cd apps/web

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set custom domain (after DNS is configured)
vercel domains add rana.cx
```

**Deliverable:** Landing page live at rana.cx ✅

---

### Task 7.2: Update Documentation (1 hour)

**Create CONTRIBUTING.md:**

```markdown
# Contributing to RANA

Thank you for your interest in contributing to RANA!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone git@github.com:your-username/rana.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development

```bash
# Run all packages in dev mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## Submitting Changes

1. Commit your changes: `git commit -m "feat: your feature"`
2. Push to your fork: `git push origin feature/your-feature`
3. Open a Pull Request

## Code Style

We use Prettier and ESLint. Run `pnpm lint` before committing.

## Questions?

Open an issue or join our Discord (coming soon).
```

**Create LICENSE:**

```text
MIT License

Copyright (c) 2025 Waymaker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Deliverable:** Documentation complete ✅

---

## Week 1 Checklist

### Day 1: Setup ✅
- [ ] Register rana.cx domain
- [ ] Configure DNS
- [ ] Create GitHub repository
- [ ] Update README

### Day 2: Structure ✅
- [ ] Initialize monorepo
- [ ] Configure pnpm workspace
- [ ] Set up Turbo
- [ ] Create directory structure

### Day 3: Core ✅
- [ ] Initialize @rana/core package
- [ ] Create config parser
- [ ] Add validation logic
- [ ] Build and test

### Day 4-5: MCP ✅
- [ ] Initialize @rana/mcp-server
- [ ] Set up MCP SDK
- [ ] Create basic tools
- [ ] Add resources and prompts

### Day 6: Landing ✅
- [ ] Create Next.js app
- [ ] Build landing page
- [ ] Add waitlist form
- [ ] Test locally

### Day 7: Deploy ✅
- [ ] Deploy to Vercel
- [ ] Configure custom domain
- [ ] Add CONTRIBUTING.md
- [ ] Add LICENSE
- [ ] Update docs

---

## Post-Week 1

**You will have:**
- ✅ Domain: rana.cx
- ✅ Repository: github.com/waymaker-ai/rana
- ✅ Monorepo structure
- ✅ Core package (config parser)
- ✅ MCP server (basic)
- ✅ Landing page (live)
- ✅ Documentation

**Next (Week 2):**
- Implement MCP tools fully
- Add quality gate checking logic
- Add REPM validation engine
- Test with Claude Desktop
- Beta test with 5 users

---

## Commands Reference

```bash
# Domain check
whois rana.cx

# Repository
gh repo create waymaker-ai/rana --public

# Monorepo
pnpm init
pnpm install

# Development
pnpm dev           # Run all packages in dev mode
pnpm build         # Build all packages
pnpm test          # Run tests
pnpm lint          # Lint all packages

# MCP Server
cd packages/mcp-server
pnpm build
node dist/index.js

# Landing page
cd apps/web
pnpm dev           # Local development
vercel --prod      # Deploy

# Commit
git add .
git commit -m "feat: complete week 1 setup"
git push origin main
```

---

## Need Help?

**Questions about setup?**
- Check the main README
- Review the roadmap
- Open a GitHub issue

**Ready to proceed to Week 2?**
- See: RANA_IMPLEMENTATION_ROADMAP.md

---

*Let's build RANA together!* 🚀
