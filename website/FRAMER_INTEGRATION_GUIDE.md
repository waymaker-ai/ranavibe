# RANA Framer Integration Guide

## Overview

This guide explains how to integrate Framer-designed marketing pages with the RANA Next.js documentation site. The hybrid approach allows you to:

- **Design in Framer**: Create and iterate on marketing pages visually
- **Code in Next.js**: Build documentation, training, and interactive features
- **Deploy Together**: Unified experience under rana.cx domain

---

## Architecture

```
rana.cx/
├── /                    → Next.js (Homepage with code)
├── /features            → Framer (Visual marketing page)
├── /pricing             → Framer (Visual marketing page)
├── /about               → Framer (Visual marketing page)
├── /docs/*              → Next.js (Documentation)
├── /training/*          → Next.js (Training modules)
├── /examples/*          → Next.js (Code examples)
└── /blog/*              → Next.js or Framer CMS
```

---

## Design System Tokens

### Colors

Use these exact values in Framer for consistency:

```css
/* Light Mode */
--background: hsl(0, 0%, 100%)
--background-secondary: hsl(0, 0%, 98%)
--foreground: hsl(0, 0%, 0%)
--foreground-secondary: hsl(0, 0%, 45%)
--border: hsl(0, 0%, 90%)

/* Dark Mode */
--background: hsl(0, 0%, 0%)
--background-secondary: hsl(0, 0%, 5%)
--foreground: hsl(0, 0%, 100%)
--foreground-secondary: hsl(0, 0%, 65%)
--border: hsl(0, 0%, 15%)

/* Gradient Accents */
--gradient-from: hsl(270, 100%, 70%)  /* Purple */
--gradient-to: hsl(210, 100%, 65%)    /* Blue */
```

### Typography

**Fonts:**
- **Sans Serif**: Geist Sans (system-ui fallback)
- **Monospace**: Geist Mono (monospace fallback)

**Scale:**
- Display: 56px / 3.5rem (Desktop), 36px / 2.25rem (Mobile)
- Heading 1: 48px / 3rem
- Heading 2: 36px / 2.25rem
- Heading 3: 24px / 1.5rem
- Body Large: 18px / 1.125rem
- Body: 16px / 1rem
- Small: 14px / 0.875rem

**Line Heights:**
- Display/Headings: 1.2
- Body: 1.6
- Small: 1.5

### Spacing

Use 8px grid system:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

### Border Radius

- Small: 6px
- Medium: 8px
- Large: 12px
- XLarge: 16px
- 2XLarge: 24px

---

## Option 1: Framer Embed (Recommended)

### Setup

1. **Create pages in Framer**
   - Use Framer Sites for `/features`, `/pricing`, `/about`
   - Apply the design tokens above
   - Publish to Framer hosting

2. **Configure Next.js rewrites** (already done in `next.config.js`):
   ```js
   async rewrites() {
     return [
       {
         source: '/features',
         destination: 'https://your-framer-site.framer.app/features',
       },
       // ... more rewrites
     ];
   }
   ```

3. **Set environment variables**:
   ```bash
   FRAMER_FEATURES_URL=https://your-framer-site.framer.app/features
   FRAMER_PRICING_URL=https://your-framer-site.framer.app/pricing
   FRAMER_ABOUT_URL=https://your-framer-site.framer.app/about
   ```

### Pros & Cons

**Pros:**
- Full visual editing in Framer
- No code syncing needed
- Fast iterations
- Framer's built-in animations and interactions

**Cons:**
- Two separate deployments to manage
- Slight latency from proxy
- Limited access to Next.js features on Framer pages

---

## Option 2: Framer Export to React

### Setup

1. **Design in Framer**
   - Create components in Framer
   - Use Code Components for dynamic data

2. **Export from Framer**
   ```bash
   # In Framer, use "Copy as Code" or "Export Code"
   # Save exported components to website/components/framer/
   ```

3. **Import in Next.js**
   ```tsx
   // app/features/page.tsx
   import { FeaturesPage } from '@/components/framer/FeaturesPage';

   export default function Features() {
     return <FeaturesPage />;
   }
   ```

### Workflow

```
1. Design in Framer → 2. Export to React → 3. Import to Next.js → 4. Deploy
```

**Update Process:**
1. Make changes in Framer
2. Re-export components
3. Replace files in `website/components/framer/`
4. Commit and deploy

### Pros & Cons

**Pros:**
- Full control in codebase
- Version controlled
- Can mix Framer components with Next.js features
- Single deployment

**Cons:**
- Manual sync process
- Requires developer for updates
- Loss of Framer's live editing after export

---

## Option 3: Framer Code Components

### Setup

1. **Create design system in code**
   ```tsx
   // framer/RANAButton.tsx
   import { motion } from 'framer-motion';

   export function RANAButton(props) {
     return (
       <motion.button
         whileHover={{ scale: 1.02 }}
         className="btn-primary"
         {...props}
       />
     );
   }
   ```

2. **Import into Framer**
   - Use Framer's Code Component feature
   - Import from npm package or paste directly

3. **Make components editable**
   ```tsx
   import { addPropertyControls, ControlType } from 'framer';

   export function RANAButton(props) { /* ... */ }

   addPropertyControls(RANAButton, {
     text: { type: ControlType.String, defaultValue: 'Click me' },
     variant: { type: ControlType.Enum, options: ['primary', 'secondary'] },
   });
   ```

### Pros & Cons

**Pros:**
- Code stays in sync
- Some visual editing in Framer
- Best of both worlds

**Cons:**
- Limited compared to pure Framer
- Requires React knowledge
- More complex setup

---

## Recommended Workflow

### For Your Use Case

Based on your requirements (professional, minimalistic, easy to update), I recommend:

**Hybrid Approach: Option 1 (Framer Embed) + Next.js**

**Framer handles:**
- `/features` - Visual showcase with animations
- `/pricing` - Interactive pricing calculator
- `/about` - Company story with media

**Next.js handles:**
- `/` - Homepage (code for SEO and performance)
- `/docs/*` - Technical documentation
- `/training/*` - Interactive training modules
- `/examples/*` - Live code examples
- PWA features (offline, quick reference)

---

## Framer Design Checklist

When designing in Framer, ensure:

- [ ] Use exact color tokens from design system
- [ ] Install Geist font in Framer project
- [ ] Follow 8px spacing grid
- [ ] Test dark mode thoroughly
- [ ] Match navigation from Next.js site
- [ ] Ensure footer consistency
- [ ] Optimize images (use Framer's optimization)
- [ ] Test responsive breakpoints (mobile, tablet, desktop)
- [ ] Add proper meta tags for SEO
- [ ] Test load times (keep under 2s)

---

## Navigation Consistency

Ensure the navigation matches across Framer and Next.js:

### Header Links
- Docs → `/docs`
- Training → `/training`
- Examples → `/examples`
- Pricing → `/pricing`

### Mobile Menu
- Use same breakpoint (768px / md)
- Match transition animations
- Same theme toggle behavior

---

## Deployment

### Framer Deployment
1. Publish to Framer hosting
2. Get the published URL
3. Update environment variables in Vercel

### Next.js Deployment
1. Push to GitHub
2. Vercel auto-deploys
3. Set custom domain to `rana.cx`

### Domain Setup
```
rana.cx
├── Vercel (primary)
└── Rewrites to Framer for specific paths
```

---

## Troubleshooting

### Styles don't match between Framer and Next.js

**Solution**: Double-check color tokens and font settings. Ensure Framer uses HSL values exactly as specified.

### Framer pages load slowly

**Solution**: Optimize images in Framer, reduce animations on initial load, enable Framer's performance features.

### Navigation feels disconnected

**Solution**: Match header height, spacing, and transition timing. Consider using Next.js navigation component on Framer pages via iframe.

### Dark mode inconsistent

**Solution**: Ensure Framer uses CSS custom properties that match Next.js. Test theme switching on both platforms.

---

## Next Steps

1. **Set up Framer project** using the design tokens above
2. **Design 3 marketing pages** (features, pricing, about)
3. **Publish to Framer hosting**
4. **Update environment variables** in Vercel
5. **Test the integrated site** at rana.cx

---

## Resources

- [Framer Documentation](https://www.framer.com/docs/)
- [Next.js Rewrites](https://nextjs.org/docs/api-reference/next.config.js/rewrites)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Geist Font](https://vercel.com/font)

---

## Support

Questions? Open an issue or reach out to ashley@waymaker.cx
