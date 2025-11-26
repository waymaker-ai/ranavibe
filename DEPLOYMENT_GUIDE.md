# LUKA Framework - Deployment Guide

**Created by Waymaker**
- Ashley Kays - ashley@waymaker.cx
- Christian Moore - christian@waymaker.cx

*Made with love to help others face less friction and more success — faster than ever.* ❤️

---

## Table of Contents

1. [Cost Calculator Deployment](#1-cost-calculator-deployment)
2. [Main Framework Deployment](#2-main-framework-deployment)
3. [Documentation Deployment](#3-documentation-deployment)
4. [Marketing Site Deployment](#4-marketing-site-deployment)
5. [Production Checklist](#5-production-checklist)

---

## 1. Cost Calculator Deployment

### Option A: Vercel (Recommended)

**Prerequisites:**
- Vercel account (free)
- Vercel CLI installed

**Steps:**

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to cost calculator
cd templates/cost-calculator

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set custom domain (optional)
vercel domains add calculator.luka.dev
```

**Configuration:**
- Already configured in `vercel.json`
- Automatic HTTPS
- Global CDN
- Zero config deployment

**Expected Output:**
```
✅ Deployed to production
🔗 https://luka-cost-calculator.vercel.app
🔗 Custom domain: https://calculator.luka.dev
```

---

### Option B: Netlify

**Prerequisites:**
- Netlify account (free)
- Netlify CLI installed

**Steps:**

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Navigate to cost calculator
cd templates/cost-calculator

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy to production
netlify deploy --prod --dir=.

# Set custom domain (optional)
netlify domains:add calculator.luka.dev
```

**Configuration:**
- Already configured in `netlify.toml`
- Automatic HTTPS
- Global CDN
- Continuous deployment from Git

---

### Option C: GitHub Pages

**Prerequisites:**
- GitHub account
- Repository access

**Steps:**

```bash
# Create gh-pages branch
git checkout -b gh-pages

# Copy cost calculator to root
cp -r templates/cost-calculator/* .

# Commit and push
git add .
git commit -m "Deploy cost calculator to GitHub Pages"
git push origin gh-pages

# Enable GitHub Pages in repo settings
# Settings → Pages → Source: gh-pages branch
```

**Custom Domain:**
1. Add `CNAME` file with domain: `calculator.luka.dev`
2. Configure DNS with CNAME record pointing to `<username>.github.io`

---

### Option D: Cloudflare Pages

**Steps:**

1. Login to Cloudflare Dashboard
2. Pages → Create a project
3. Connect Git repository
4. Build settings:
   - Build command: (none)
   - Build output directory: `templates/cost-calculator`
5. Deploy
6. Add custom domain: `calculator.luka.dev`

**Benefits:**
- Global CDN
- Unlimited bandwidth
- Free SSL
- DDoS protection

---

### Verify Deployment

Test your deployment:

```bash
# Check HTTP status
curl -I https://calculator.luka.dev

# Expected: 200 OK

# Check content
curl https://calculator.luka.dev | grep "LUKA Cost Calculator"

# Check security headers
curl -I https://calculator.luka.dev | grep -E 'X-Frame-Options|X-Content-Type-Options'
```

**Lighthouse Audit:**
```bash
npm i -g lighthouse

lighthouse https://calculator.luka.dev --view
```

**Expected Scores:**
- Performance: 95+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

---

## 2. Main Framework Deployment

### Deploy Next.js App (Vercel)

**Prerequisites:**
- Vercel account
- Supabase project
- Environment variables configured

**Steps:**

```bash
# Navigate to Next.js template
cd templates/nextjs-supabase

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local

# Edit .env.local with your keys:
# NEXT_PUBLIC_SUPABASE_URL=
# SUPABASE_SERVICE_ROLE_KEY=
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# GOOGLE_AI_API_KEY=
# ... (all 9 providers)

# Deploy to Vercel
vercel --prod

# Add environment variables in Vercel dashboard
vercel env add OPENAI_API_KEY
# Repeat for all env vars
```

**Vercel Configuration:**

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-key"
  }
}
```

---

### Deploy to Railway

**Alternative to Vercel:**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project
railway link

# Add environment variables
railway variables set OPENAI_API_KEY=sk-...

# Deploy
railway up
```

**Benefits:**
- PostgreSQL included
- Redis included
- $5 free credit/month
- Easy scaling

---

### Deploy with Docker

**Production Docker Compose:**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: supabase/postgres:15.1.0.147
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
```

**Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 3. Documentation Deployment

### Deploy Docs to Vercel

**Option 1: Nextra (Recommended)**

```bash
# Create docs site with Nextra
npx create-nextra-app luka-docs

# Copy documentation
cp -r docs/* luka-docs/pages/

# Deploy
cd luka-docs
vercel --prod
```

**Option 2: Docusaurus**

```bash
# Create Docusaurus site
npx create-docusaurus@latest luka-docs classic

# Copy documentation
cp -r docs/* luka-docs/docs/

# Build and deploy
cd luka-docs
npm run build
vercel --prod
```

**Option 3: GitBook**

1. Create GitBook account
2. Import GitHub repository
3. Configure root: `/docs`
4. Custom domain: `docs.luka.dev`

---

## 4. Marketing Site Deployment

### Landing Page (Next.js)

**Create landing page:**

```bash
# Create new Next.js app
npx create-next-app@latest luka-landing --typescript --tailwind --app

# Navigate
cd luka-landing

# Copy marketing content
# Use content from /marketing/COMPLETE_MARKETING_PACKAGE.md

# Deploy
vercel --prod
```

**Structure:**
```
luka-landing/
├── app/
│   ├── page.tsx              # Homepage
│   ├── pricing/page.tsx      # Pricing
│   ├── docs/page.tsx         # Documentation
│   ├── blog/page.tsx         # Blog
│   └── calculator/page.tsx   # Embed cost calculator
├── components/
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── Pricing.tsx
│   ├── Testimonials.tsx
│   └── CTA.tsx
└── public/
    └── images/
```

---

## 5. Production Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Seed data loaded (if needed)
- [ ] API keys tested (all 9 providers)
- [ ] Security audit passed
- [ ] Performance optimization complete
- [ ] Analytics configured (Posthog, Google Analytics)
- [ ] Error tracking configured (Sentry)
- [ ] Monitoring configured (Datadog, New Relic)

### Security

- [ ] HTTPS enabled (auto with Vercel/Netlify)
- [ ] Security headers configured
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Referrer-Policy: strict-origin-when-cross-origin
  - [ ] Content-Security-Policy configured
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Secrets in environment variables (not code)
- [ ] API routes protected with authentication
- [ ] OWASP Top 10 compliance verified

### Performance

- [ ] Lighthouse score 95+ (all categories)
- [ ] Core Web Vitals passing
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] Images optimized (WebP, lazy loading)
- [ ] Code splitting enabled
- [ ] CDN configured
- [ ] Caching headers set
- [ ] Database queries optimized
- [ ] API response times < 200ms

### SEO

- [ ] Meta tags on all pages
- [ ] Open Graph tags configured
- [ ] Twitter Card tags configured
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] Schema.org markup added
- [ ] Canonical URLs set
- [ ] 404 page customized
- [ ] Google Search Console verified
- [ ] Bing Webmaster Tools verified

### Monitoring

- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Datadog, New Relic)
- [ ] Analytics (Google Analytics, Posthog)
- [ ] Log aggregation (Papertrail, Logtail)
- [ ] Status page (status.luka.dev)
- [ ] Alerts configured (email, Slack, PagerDuty)

### Documentation

- [ ] README.md updated
- [ ] API documentation published
- [ ] Changelog maintained
- [ ] Contributing guidelines published
- [ ] License file present (MIT)
- [ ] Code of Conduct published

### Marketing

- [ ] Landing page live
- [ ] Blog posts published
- [ ] Social media accounts created
  - [ ] Twitter/X
  - [ ] LinkedIn
  - [ ] Discord
  - [ ] GitHub
- [ ] Email marketing configured (Resend)
- [ ] Product Hunt page created
- [ ] Press release prepared

### Legal

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Cookie Policy published
- [ ] GDPR compliance verified
- [ ] Data Processing Agreement available
- [ ] Security Policy published

---

## Deployment Commands Reference

### Quick Deploy (All Components)

```bash
# 1. Cost Calculator
cd templates/cost-calculator
vercel --prod
# → https://calculator.luka.dev

# 2. Main App
cd ../nextjs-supabase
vercel --prod
# → https://app.luka.dev

# 3. Documentation
cd ../../
npx create-nextra-app luka-docs
# Copy docs/* to luka-docs/pages/
cd luka-docs
vercel --prod
# → https://docs.luka.dev

# 4. Landing Page
npx create-next-app@latest luka-landing
# Build landing page from marketing content
cd luka-landing
vercel --prod
# → https://luka.dev
```

### DNS Configuration

**Add these DNS records:**

```
Type   Name        Value                           TTL
CNAME  luka.dev    cname.vercel-dns.com           3600
CNAME  www         cname.vercel-dns.com           3600
CNAME  app         cname.vercel-dns.com           3600
CNAME  docs        cname.vercel-dns.com           3600
CNAME  calculator  cname.vercel-dns.com           3600
CNAME  status      cname.statuspage.io            3600
A      @           76.76.21.21                     3600
```

---

## Monitoring Deployment

### Health Checks

```bash
# Check all endpoints
curl https://luka.dev                    # Landing page
curl https://app.luka.dev/api/health     # Main app
curl https://docs.luka.dev               # Documentation
curl https://calculator.luka.dev         # Cost calculator
curl https://status.luka.dev             # Status page
```

### Automated Monitoring

**UptimeRobot Configuration:**

1. Monitor: `https://luka.dev`
   - Type: HTTPS
   - Interval: 5 minutes

2. Monitor: `https://app.luka.dev/api/health`
   - Type: HTTPS
   - Interval: 5 minutes
   - Keyword: `"status":"ok"`

3. Monitor: `https://calculator.luka.dev`
   - Type: HTTPS
   - Interval: 5 minutes

**Alert Contacts:**
- Email: ashley@waymaker.cx
- Email: christian@waymaker.cx
- Slack: #luka-alerts

---

## Rollback Procedure

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>

# Or via dashboard:
# vercel.com → Project → Deployments → ... → Promote to Production
```

### Docker Rollback

```bash
# Tag current version
docker tag luka-app:latest luka-app:v1.0.0

# If issues, rollback
docker-compose down
docker-compose up -d luka-app:v0.9.0
```

---

## Post-Deployment

### Verify Deployment

```bash
# Run deployment verification script
./scripts/verify-deployment.sh
```

### Announce Launch

1. **Social Media:**
   - Twitter thread (use template from marketing package)
   - LinkedIn post
   - Discord announcement

2. **Product Hunt:**
   - Submit at 00:01 PST
   - Engage with comments all day

3. **Email:**
   - Send to mailing list
   - Use welcome email template

4. **Press:**
   - Send press release to TechCrunch, The Verge, etc.

---

## Continuous Deployment

### GitHub Actions (Automated Deployment)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Support

Questions about deployment?

- Email: ashley@waymaker.cx or christian@waymaker.cx
- Discord: https://discord.gg/luka
- GitHub Issues: https://github.com/waymaker/luka/issues

---

**Created by Waymaker** (Ashley Kays & Christian Moore)

Made with love to help you succeed faster ❤️
