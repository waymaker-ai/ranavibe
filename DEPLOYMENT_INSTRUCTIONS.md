# Deployment Instructions

## ✅ Code is Ready - All Pushed to GitHub

Branch: `implementation-2025-v2`

---

## 🚀 Vercel Deployment Steps

### **1. Main Website (rana.cx)**

The project `waymakerai/rana` is already linked, but needs configuration:

**Manual Steps:**
1. Go to https://vercel.com/waymakerai/rana
2. Click **Settings**
3. Under **General** → **Root Directory**:
   - Click **Edit**
   - Set to: `apps/web`
   - Click **Save**
4. Go to **Deployments** tab
5. Click **Redeploy** on the latest deployment
   - Or click **Create Deployment** → **Production**

**Expected Result:**
- Production URL: https://rana.cx (after domain is configured)
- Temporary URL: https://rana-waymakerai.vercel.app

---

### **2. RANA UI Documentation**

**Option A: New Vercel Project (Recommended)**

1. Go to https://vercel.com/waymakerai
2. Click **Add New** → **Project**
3. Import repository: `waymaker-ai/ranavibe`
4. Configure:
   - **Project Name:** `rana-ui-docs`
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/rana-ui-docs`
   - **Build Command:** `cd ../.. && pnpm install && pnpm --filter @rana/ui build && pnpm --filter @rana/ui-docs build`
   - **Install Command:** `cd ../.. && pnpm install`
   - **Output Directory:** `.next` (default)
   - **Node.js Version:** 20.x or 22.x
5. Click **Deploy**

**Option B: Add to existing rana project**

1. Go to https://vercel.com/waymakerai/rana/settings
2. Under **Git** → **Branch**
3. Add deployment for different path (requires manual configuration)

---

### **3. Configure Custom Domains**

After deployments succeed:

**Main Website:**
1. Go to https://vercel.com/waymakerai/rana/settings/domains
2. Add domain: `rana.cx`
3. Follow DNS configuration instructions

**RANA UI Docs:**
1. Go to https://vercel.com/waymakerai/rana-ui-docs/settings/domains
2. Add domain: `ui.rana.cx` or `docs.rana.cx`
3. Follow DNS configuration instructions

---

## 📦 What's Included

### **Main Website** (`apps/web`)
- Next.js 14
- Waymaker/RANA landing page
- Port 3000 locally

### **RANA UI Docs** (`apps/rana-ui-docs`)
- Nextra documentation site
- 5 UI components documented
- Live examples
- Port 3001 locally

### **Packages Built:**
- `@rana/ui` - Component library ✅
- `@rana/ui-cli` - CLI tool ✅
- `@rana/core` - RANA core ✅
- `@rana/cli` - RANA CLI ✅
- `@rana/sdk` - SDK ✅
- `@rana/mcp-server` - MCP server ✅

---

## 🧪 Test Locally

```bash
# Main website
cd /Users/ashleykays/ranavibe
pnpm --filter @rana/web dev
# Visit: http://localhost:3000

# RANA UI docs
pnpm --filter @rana/ui build
pnpm --filter @rana/ui-docs dev
# Visit: http://localhost:3001
```

---

## ❓ Troubleshooting

**Build fails with "No Next.js version detected":**
- Make sure Root Directory is set correctly in Vercel dashboard
- Root should be `apps/web` for main site
- Root should be `apps/rana-ui-docs` for docs site

**Workspace dependency errors:**
- Use the custom build commands listed above
- Make sure to `cd ../..` to install from monorepo root

---

**Last Updated:** November 27, 2025
**Status:** Ready for Vercel dashboard configuration
