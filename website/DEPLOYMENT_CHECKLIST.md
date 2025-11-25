# RANA Website Deployment Checklist

## Pre-Deployment

### 1. Install Dependencies
```bash
cd website
npm install
```

### 2. Add Missing Tailwind Plugin
```bash
npm install @tailwindcss/typography
```

### 3. Test Locally
```bash
npm run dev
```

Visit http://localhost:3000 and verify:
- [ ] Homepage loads correctly
- [ ] Dark mode toggle works
- [ ] Navigation is responsive
- [ ] Training page accessible
- [ ] Quick reference works
- [ ] CLI helper loads
- [ ] PWA install prompt appears (may need to test in production)

### 4. Build for Production
```bash
npm run build
```

Ensure build completes without errors.

---

## Framer Setup (Optional)

If you want to use Framer for marketing pages:

### 1. Create Framer Project
1. Go to [Framer](https://www.framer.com)
2. Create new project
3. Install Geist font in project settings

### 2. Apply Design Tokens

Copy these values into Framer:

**Colors:**
```
Light Background: #FFFFFF
Dark Background: #000000
Foreground Light: #000000
Foreground Dark: #FFFFFF
Gradient Start: #A855F7
Gradient End: #3B82F6
Border Light: #E5E5E5
Border Dark: #262626
```

**Typography:**
- Font: Geist Sans
- Display: 56px
- Heading 1: 48px
- Body: 16px
- Line height: 1.6

**Spacing:**
- Grid: 8px
- Sizes: 4, 8, 16, 24, 32, 48, 64px

### 3. Create Marketing Pages
Create these pages in Framer:
- `/features` - Feature showcase
- `/pricing` - Pricing calculator
- `/about` - Company story

### 4. Publish to Framer
1. Click "Publish" in Framer
2. Get the published URL
3. Note the URLs for each page

### 5. Configure Environment Variables
Create `.env.local` in website directory:

```bash
FRAMER_FEATURES_URL=https://your-project.framer.app/features
FRAMER_PRICING_URL=https://your-project.framer.app/pricing
FRAMER_ABOUT_URL=https://your-project.framer.app/about
```

---

## Vercel Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Add RANA website with PWA and training"
git push origin main
```

### 2. Import to Vercel
1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory: `website`
5. Framework preset: Next.js
6. Click "Deploy"

### 3. Configure Environment Variables
In Vercel project settings → Environment Variables:

```bash
FRAMER_FEATURES_URL=https://...
FRAMER_PRICING_URL=https://...
FRAMER_ABOUT_URL=https://...
```

### 4. Configure Custom Domain
1. Go to Project Settings → Domains
2. Add domain: `rana.cx`
3. Update your DNS records:
   - **A Record**: Point to `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`

### 5. Wait for DNS Propagation
This can take 24-48 hours. Check status:
```bash
dig rana.cx
```

---

## Post-Deployment

### 1. Test Production Site
Visit https://rana.cx and verify:
- [ ] All pages load
- [ ] Dark mode works
- [ ] PWA install prompt appears
- [ ] Service worker registers (check DevTools → Application)
- [ ] Offline mode works (toggle offline in DevTools)
- [ ] Framer pages load (if configured)
- [ ] Navigation between Framer and Next.js is seamless

### 2. Test PWA Features
1. Click "Install" on the PWA prompt
2. Verify app installs to home screen/dock
3. Open installed app
4. Test offline functionality:
   - Go offline in DevTools
   - Navigate to /docs
   - Verify cached content loads

### 3. Performance Testing
Run Lighthouse audit:
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit for all categories
4. Verify scores > 90 for all metrics

### 4. SEO Verification
- [ ] Meta tags present (view source)
- [ ] Open Graph tags correct
- [ ] Twitter cards configured
- [ ] Sitemap accessible at /sitemap.xml
- [ ] robots.txt configured

### 5. Analytics (Optional)
Add analytics if needed:
```bash
npm install @vercel/analytics
```

Then add to `app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

// In body
<Analytics />
```

---

## Monitoring

### 1. Vercel Dashboard
Monitor in Vercel:
- Deployment status
- Build logs
- Analytics
- Error tracking

### 2. Real User Monitoring
Use Vercel Speed Insights:
```bash
npm install @vercel/speed-insights
```

Add to layout:
```tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

<SpeedInsights />
```

---

## Troubleshooting

### Build Fails
**Issue**: `Module not found: Can't resolve 'geist'`

**Solution**:
```bash
npm install geist@latest
```

### PWA Not Installing
**Issue**: Install prompt doesn't appear

**Solution**:
- PWA only works on HTTPS (localhost or production)
- Check manifest.json is accessible
- Verify service worker registers in DevTools

### Framer Pages 404
**Issue**: `/features` returns 404

**Solution**:
- Verify environment variables are set in Vercel
- Check Framer URLs are correct and published
- Test Framer URLs directly in browser

### Dark Mode Flashing
**Issue**: Light mode flashes before dark mode loads

**Solution**: Already handled with `suppressHydrationWarning` in layout.

### Fonts Not Loading
**Issue**: Geist fonts don't display

**Solution**:
```bash
npm install geist@latest
```

---

## Maintenance

### Update Dependencies
```bash
npm update
npm audit fix
```

### Update Content
1. Edit training lessons in `app/training/`
2. Update quick reference in `app/quick-reference/`
3. Modify CLI helper in `app/tools/cli-helper/`
4. Commit and push - Vercel auto-deploys

### Update Framer Pages
1. Make changes in Framer
2. Re-publish
3. No code changes needed - rewrite proxies automatically

---

## Success Checklist

Before announcing launch:

- [ ] Site loads at rana.cx
- [ ] SSL certificate active (HTTPS)
- [ ] All pages accessible
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] PWA installs correctly
- [ ] Offline mode functional
- [ ] Training modules complete
- [ ] Quick reference accurate
- [ ] CLI helper interactive
- [ ] Lighthouse scores > 90
- [ ] No console errors
- [ ] Analytics configured (if desired)
- [ ] Meta tags correct
- [ ] Social sharing works

---

## Next Steps

After deployment:

1. **Marketing**: Share on Twitter, LinkedIn, Product Hunt
2. **Content**: Write launch blog post
3. **Community**: Set up Discord/Slack for users
4. **Documentation**: Keep docs in sync with code
5. **Feedback**: Monitor user feedback and iterate

---

## Support

Need help? Reach out:
- GitHub Issues: https://github.com/ashleykays/ranavibe/issues
- Email: ashley@waymaker.cx
- Docs: https://rana.cx/docs

---

Built with ❤️ using RANA Framework
