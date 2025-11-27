# Bettr UI Deployment Guide

## ✅ What's Complete

### 1. **@bettr/ui** - Component Library ✅
- 5 glass morphism components with CVA variants
- Full TypeScript + Tailwind CSS support
- Copy-paste model (users own the code)
- Built and tested locally

### 2. **@bettr/ui-cli** - CLI Tool ✅
- `bettr-ui init` - Project initialization
- `bettr-ui add [components]` - Install components
- `bettr-ui list` - List available components
- Component registry system
- Automatic dependency resolution
- Built and ready to use

### 3. **bettr-ui-docs** - Documentation Site ✅
- Nextra-based documentation
- Live component examples
- API reference tables
- Installation guides
- Runs locally on port 3001
- Code pushed to GitHub

### 4. **bettr-ui-example** - Example Project ✅
- Full Next.js demonstration
- All 5 components showcased
- Responsive design
- Runs locally on port 3002
- Code pushed to GitHub

### 5. **RANA Integration** ✅
- DesignSystemChecker class in @rana/core
- `rana check-design-system` - Compliance checking
- `rana design-coverage` - Coverage metrics
- `rana design-violations` - List violations
- All pushed to GitHub

### 6. **Git Repository** ✅
- All code committed to `implementation-2025-v2` branch
- 3 commits pushed successfully
- Clean working tree

---

## ⚠️ What Needs Manual Setup

### Vercel Deployment (Manual Configuration Required)

The bettr-ui-docs site requires manual Vercel dashboard configuration because it's part of a pnpm monorepo with workspace dependencies.

#### **Steps to Deploy via Vercel Dashboard:**

1. **Go to https://vercel.com/waymakerai**
2. **Import the GitHub repository:**
   - Repository: `waymaker-ai/ranavibe`
   - Branch: `implementation-2025-v2`

3. **Configure the project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/bettr-ui-docs`
   - **Build Command:**
     ```bash
     cd ../.. && pnpm install && pnpm --filter @bettr/ui build && pnpm --filter @bettr/ui-docs build
     ```
   - **Install Command:**
     ```bash
     pnpm install
     ```
   - **Output Directory:** `.next` (default)
   - **Node Version:** 20.x or 22.x

4. **Environment Variables:** None required

5. **Deploy!**

#### **Why Manual Setup is Needed:**

Vercel CLI has limitations with pnpm workspace monorepos:
- `workspace:*` dependencies aren't supported via auto-detection
- The Root Directory setting must be configured in the dashboard
- Build commands need to run from monorepo root

---

## 🚀 Quick Start (Local Development)

### Run Documentation Site Locally:
```bash
cd /Users/ashleykays/ranavibe
pnpm install
pnpm --filter @bettr/ui build
pnpm --filter @bettr/ui-docs dev
```

Visit: http://localhost:3001

### Run Example Project Locally:
```bash
cd /Users/ashleykays/ranavibe
pnpm install
pnpm --filter @bettr/ui build
pnpm --filter bettr-ui-example dev
```

Visit: http://localhost:3002

### Use the CLI Tool:
```bash
cd /Users/ashleykays/ranavibe
pnpm --filter @bettr/ui-cli build
cd ../.. # go to any Next.js project
node /Users/ashleykays/ranavibe/packages/bettr-ui-cli/dist/index.js init
node /Users/ashleykays/ranavibe/packages/bettr-ui-cli/dist/index.js list
node /Users/ashleykays/ranavibe/packages/bettr-ui-cli/dist/index.js add glass-card
```

---

## 📦 Optional: Publish to npm

To make @bettr/ui and @bettr/ui-cli available publicly:

1. **Update package.json files** (remove `private: true`)
2. **Build packages:**
   ```bash
   pnpm --filter @bettr/ui build
   pnpm --filter @bettr/ui-cli build
   ```

3. **Publish to npm:**
   ```bash
   cd packages/bettr-ui && npm publish --access public
   cd ../bettr-ui-cli && npm publish --access public
   ```

4. **Update docs to use published version:**
   ```json
   "dependencies": {
     "@bettr/ui": "^0.1.0"
   }
   ```

---

## 📊 Summary

| Component | Status | Location |
|-----------|--------|----------|
| @bettr/ui | ✅ Complete | `packages/bettr-ui/` |
| @bettr/ui-cli | ✅ Complete | `packages/bettr-ui-cli/` |
| Documentation | ✅ Complete | `apps/bettr-ui-docs/` |
| Example | ✅ Complete | `examples/bettr-ui-example/` |
| RANA Integration | ✅ Complete | `packages/core/src/design-system/` |
| Local Testing | ✅ Working | Run with pnpm commands above |
| GitHub | ✅ Pushed | `implementation-2025-v2` branch |
| Vercel Deployment | ⚠️ Manual Setup | Follow dashboard steps above |

---

**Last Updated:** November 27, 2025
**Status:** Ready for deployment - requires Vercel dashboard configuration
