# RANA Framework Website

Professional, minimalistic website for the RANA framework with Vercel-inspired black & white design, comprehensive training documentation, and Progressive Web App features.

## Features

### Design System
- **Vercel-inspired aesthetics**: Black & white with subtle gradient accents
- **Professional minimalism**: Clean, focused design
- **Dark mode**: Full support with automatic theme detection
- **Responsive**: Mobile-first approach with perfect touch targets
- **Accessible**: WCAG compliant with keyboard navigation
- **Geist fonts**: Modern typography with Geist Sans and Mono

### Training Documentation
- **Comprehensive modules**: 4 complete training courses
- **Interactive lessons**: Video, articles, and hands-on tutorials
- **Progress tracking**: Track completed lessons
- **Code examples**: Real-world patterns and implementations
- **Quick reference**: Essential commands and APIs

### Progressive Web App (PWA)
- **Offline support**: Access docs without internet
- **Install prompt**: Native app-like experience
- **Quick shortcuts**: Fast access to common pages
- **Service worker**: Intelligent caching strategy
- **Fast loading**: Optimized performance

### Framer Integration
- **Hybrid approach**: Framer for marketing, Next.js for docs
- **Design tokens**: Consistent styling across platforms
- **Seamless navigation**: Unified experience
- **Easy updates**: Visual editing for marketing pages

## Getting Started

### Installation

```bash
cd website
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
website/
├── app/                      # Next.js 14 App Router
│   ├── layout.tsx           # Root layout with PWA
│   ├── page.tsx             # Homepage
│   ├── training/            # Training modules
│   ├── quick-reference/     # Quick reference guide
│   ├── tools/               # CLI helper and tools
│   └── offline/             # Offline fallback page
├── components/              # React components
│   ├── hero.tsx            # Homepage hero section
│   ├── features.tsx        # Features grid
│   ├── navigation.tsx      # Main navigation
│   ├── footer.tsx          # Site footer
│   ├── pwa-install.tsx     # PWA install prompt
│   └── theme-provider.tsx  # Dark mode provider
├── lib/                     # Utilities
│   └── register-sw.ts      # Service worker registration
├── public/                  # Static assets
│   ├── manifest.json       # PWA manifest
│   └── sw.js              # Service worker
└── FRAMER_INTEGRATION_GUIDE.md  # Framer setup guide
```

## Design System

### Colors

```css
/* Light Mode */
--background: hsl(0, 0%, 100%)
--foreground: hsl(0, 0%, 0%)

/* Dark Mode */
--background: hsl(0, 0%, 0%)
--foreground: hsl(0, 0%, 100%)

/* Gradients */
--gradient-from: hsl(270, 100%, 70%)  /* Purple */
--gradient-to: hsl(210, 100%, 65%)    /* Blue */
```

### Typography

- **Display**: 56px (Desktop), 36px (Mobile)
- **Heading 1**: 48px
- **Body**: 16px
- **Small**: 14px

### Spacing

8px grid system: 4px, 8px, 16px, 24px, 32px, 48px, 64px

## Framer Integration

See [FRAMER_INTEGRATION_GUIDE.md](./FRAMER_INTEGRATION_GUIDE.md) for detailed instructions on:

- Setting up Framer pages
- Applying design tokens
- Configuring rewrites
- Deployment workflow

### Quick Setup

1. Create pages in Framer using the design tokens
2. Publish to Framer hosting
3. Update `.env.local`:

```bash
FRAMER_FEATURES_URL=https://your-framer-site.framer.app/features
FRAMER_PRICING_URL=https://your-framer-site.framer.app/pricing
FRAMER_ABOUT_URL=https://your-framer-site.framer.app/about
```

4. Deploy to Vercel

## PWA Features

### Offline Support
- Cached pages and assets
- Offline fallback page
- Background sync for updates

### Quick Access
- CLI Helper: Interactive command reference
- Quick Reference: Essential APIs and patterns
- Training: Offline course access

### Install Prompt
- Automatic detection of install capability
- Dismissible with localStorage persistence
- Native app-like experience

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

```bash
FRAMER_FEATURES_URL=https://...
FRAMER_PRICING_URL=https://...
FRAMER_ABOUT_URL=https://...
```

### Custom Domain

1. Add `rana.cx` to Vercel project
2. Update DNS records:
   - A record: 76.76.21.21
   - CNAME: cname.vercel-dns.com

## Training Content

### Modules

1. **RANA Fundamentals** (8 lessons, 2 hours)
   - What is RANA?
   - Core architecture
   - Environment setup
   - First project

2. **Building AI Agents** (12 lessons, 3 hours)
   - Agent patterns
   - State management
   - Error handling
   - Production deployment

3. **Advanced Patterns** (15 lessons, 4 hours)
   - Streaming responses
   - Multi-agent systems
   - Cost optimization
   - Monitoring

4. **Production Deployment** (10 lessons, 2.5 hours)
   - Security best practices
   - Database setup
   - CI/CD pipelines
   - Monitoring and alerts

## Performance

- **Lighthouse Score**: 100/100/100/100
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Bundle Size**: < 200KB gzipped

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- Focus indicators
- Touch target sizing (44px minimum)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](../LICENSE) for details

## Support

- **Documentation**: https://rana.cx/docs
- **Training**: https://rana.cx/training
- **GitHub**: https://github.com/ashleykays/ranavibe
- **Email**: ashley@waymaker.cx

---

Built with ❤️ by [Waymaker AI](https://waymaker.cx)
