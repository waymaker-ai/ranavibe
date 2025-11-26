# RANA v2.0 - Frequently Asked Questions

Complete FAQ for RANA v2.0 launch and beyond.

---

## 📋 Table of Contents

- [General Questions](#general-questions)
- [Technical Questions](#technical-questions)
- [Cost & Pricing](#cost--pricing)
- [Comparison Questions](#comparison-questions)
- [Training & Certification](#training--certification)
- [Support & Community](#support--community)
- [Contributing](#contributing)
- [Business & Licensing](#business--licensing)

---

## General Questions

### What is RANA?

RANA (Rapid AI Native Architecture) is a complete framework for building production-ready AI applications in minutes instead of hours or days.

It provides:
- **5 Core Frameworks:** Database, Security, LLM Optimization, SEO, Mobile
- **22+ CLI Commands:** Automate setup, quality checks, deployment
- **Production Template:** Next.js 14 + Supabase starter with everything configured
- **Quality Gates:** Enforced 95+ scores before deployment
- **Cost Optimization:** 70% LLM cost reduction automatic

**Result:** Go from idea to production-ready AI app in 5 minutes.

---

### Why was RANA created?

**The Problem:**
AI code generators (Claude Code, Cursor, v0.dev, etc.) can create prototypes quickly, but the code often:
- Lacks proper security
- Has poor performance
- Missing SEO optimization
- Not mobile-optimized
- Expensive LLM costs
- Takes 20-40 hours to make production-ready

**The Solution:**
RANA provides a framework that makes AI-generated code production-ready from the start. Quality gates enforce standards. CLI tools automate tedious tasks. The result is professional code in 5 minutes.

---

### Is RANA free?

**Yes!** RANA framework is completely free and open source (MIT License).

**What's free:**
- All framework code
- CLI tools
- Templates
- Documentation
- Community support

**What costs money (optional):**
- Training programs ($2,500-$5,000)
- Certification ($5,000)
- Development services ($25K-$50K)
- Consulting services ($2,500-$20K)

**You can use RANA commercially without paying anything.**

---

### Who is RANA for?

**Perfect for:**
- Solo developers building AI apps
- Startups launching AI products quickly
- Agencies building client projects
- Teams standardizing AI development
- Developers learning AI development

**Experience levels:**
- **Beginners:** Follow templates and guides
- **Intermediate:** Customize and extend
- **Advanced:** Contribute and build custom integrations

---

### What can I build with RANA?

**Examples:**
- AI chatbots and assistants
- Content generation platforms
- AI-powered SaaS products
- Data analysis tools
- Customer support automation
- Code generation tools
- Document processing systems
- AI API services
- Multi-agent systems
- AI-powered mobile apps

**Any application that uses LLMs can benefit from RANA.**

---

## Technical Questions

### What technologies does RANA use?

**Core Stack:**
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL), Prisma ORM
- **Auth:** Supabase Auth
- **LLMs:** OpenAI, Anthropic, xAI (Grok), Google, Ollama
- **Caching:** Upstash Redis
- **Deployment:** Vercel, Netlify, or any Node.js host

**All production-tested and well-documented.**

---

### Which LLM providers are supported?

**Currently supported (5 providers):**
1. **OpenAI** - GPT-4, GPT-3.5
2. **Anthropic** - Claude 3.5 Sonnet, Claude 3 Haiku
3. **xAI** - Grok Beta
4. **Google** - Gemini Pro, Gemini Ultra
5. **Ollama** - Local models (Llama 2, Mistral, etc.)

**All with automatic cost optimization and caching.**

---

### Can I use RANA with my existing project?

**Yes!** Two options:

**Option 1: Start with RANA template**
```bash
npx create-aads-app my-app --template nextjs-supabase
```

**Option 2: Add RANA to existing Next.js project**
```bash
npm install -g @aads/cli
cd my-existing-project
aads init
aads install --framework all
```

Both work great. Template is faster, but RANA integrates smoothly into existing projects.

---

### What databases are supported?

**Currently:**
- Supabase (PostgreSQL) - Recommended
- Direct PostgreSQL
- Prisma ORM with any database

**Coming soon:**
- MongoDB
- MySQL
- Firebase

**The database layer is abstracted, so switching is easy.**

---

### How does LLM cost optimization work?

**Three strategies (70% total savings):**

**1. Response Caching (40% savings)**
- Caches LLM responses in Redis
- Identical prompts return cached results
- Configurable TTL (time-to-live)
- Automatic cache invalidation

**2. Smart Model Selection (25% savings)**
- Routes simple tasks to cheaper models
- Routes complex tasks to expensive models
- Automatic based on estimated complexity
- Manual override available

**3. Prompt Optimization (15% savings)**
- Compress prompts intelligently
- Remove unnecessary tokens
- Template reuse
- Batch processing when possible

**Result: $1,500/month → $450/month = $12,600/year saved**

---

### How are quality scores calculated?

**Security Score (95/100 target):**
- Rate limiting configured
- Security headers present
- Input validation
- SQL injection prevention
- XSS prevention
- CSRF tokens
- RLS policies enabled

**SEO Score (90/100 target):**
- Meta tags present
- Open Graph tags
- Twitter Cards
- Sitemap.xml generated
- Robots.txt configured
- Structured data present
- Page speed optimized

**Mobile Score (95/100 target):**
- Responsive design
- Touch targets ≥ 44px
- Viewport configured
- PWA manifest
- Service worker
- Offline support
- Mobile-first CSS

**Scores are enforced before deployment.**

---

### Can I deploy to platforms other than Vercel?

**Yes!** RANA works with any Node.js hosting:

**Recommended:**
- Vercel (easiest, best Next.js support)
- Netlify (great for static + serverless)
- Railway (simple deployment)
- Render (good free tier)

**Also works with:**
- AWS (Lambda, ECS, EC2)
- Google Cloud (Cloud Run, App Engine)
- Azure (App Service)
- DigitalOcean (App Platform)
- Fly.io
- Your own VPS

**Deployment guide covers all major platforms.**

---

### Is RANA production-ready?

**Absolutely!** RANA is designed for production from day one.

**Production features:**
- Error handling and logging
- Rate limiting and security
- Database connection pooling
- Optimized caching
- SEO and performance
- Mobile optimization
- Quality gates
- CI/CD examples

**Many developers are already using RANA in production.**

---

### Can I use RANA with TypeScript?

**Yes!** RANA is built with TypeScript and includes:
- Full type definitions
- Strict mode enabled
- Type-safe database queries
- Type-safe API routes
- Type-safe LLM clients

**JavaScript is also supported** if you prefer, but TypeScript is recommended.

---

## Cost & Pricing

### How much does RANA save me?

**Time Savings:**
- Setup: 20-40 hours → 5 minutes (120x faster)
- Value: $4,000-$8,000 (at $200/hr developer rate)

**Cost Savings:**
- LLM: $1,500/month → $450/month
- Annual: $12,600/year saved

**Total Value: $16,600-$20,600/year per developer**

---

### Do I need to pay for LLM APIs?

**Yes**, you'll need API keys from LLM providers you choose to use:

**OpenAI:**
- GPT-4 Turbo: $10/1M input tokens, $30/1M output
- GPT-3.5 Turbo: $0.50/1M input, $1.50/1M output

**Anthropic:**
- Claude 3.5 Sonnet: $3/1M input, $15/1M output
- Claude 3 Haiku: $0.25/1M input, $1.25/1M output

**xAI:**
- Grok Beta: $5/1M input, $15/1M output

**Google:**
- Gemini Pro: $0.25/1M input, $0.50/1M output

**Ollama:**
- Free (runs locally, no API costs)

**RANA helps you save 70% on these costs through optimization.**

---

### What about Supabase costs?

**Supabase Pricing:**
- **Free tier:** 500MB database, 50MB file storage, 2GB bandwidth
- **Pro ($25/month):** 8GB database, 100GB storage, 250GB bandwidth
- **Team ($599/month):** Starts at 50GB database

**For most apps:**
- Start on free tier
- Upgrade to Pro ($25/mo) when needed
- Much cheaper than managing your own database

**RANA optimizes database queries to minimize costs.**

---

### Are there any hidden costs?

**No!** RANA itself is completely free.

**Your only costs are:**
- LLM API usage (OpenAI, Anthropic, etc.)
- Database hosting (Supabase free tier is generous)
- Deployment hosting (Vercel free tier works great)
- Optional: Redis for caching (Upstash free tier: 10K requests/day)

**Many developers run production apps on 100% free tier.**

---

## Comparison Questions

### RANA vs Create Next App?

**Create Next App:**
- Blank Next.js template
- You build everything from scratch
- 20-40 hours to production-ready
- No optimization, no quality gates

**RANA:**
- Complete template with database, auth, AI, security, SEO, mobile
- Production-ready in 5 minutes
- Automatic cost optimization
- Quality gates enforced

**Use RANA when building AI apps. Use CNA for non-AI projects.**

---

### RANA vs Rails?

**Rails:**
- Full-stack framework for traditional web apps
- Ruby-based
- Great for CRUD apps
- Not AI-native

**RANA:**
- Framework specifically for AI applications
- TypeScript/JavaScript
- LLM cost optimization built-in
- AI-native patterns

**RANA is "Rails for AI development".**

---

### RANA vs v0.dev / Bolt / Lovable?

**v0.dev / Bolt / Lovable:**
- AI code generators
- Generate UI components or full projects
- Output is prototype-quality
- Requires significant work to make production-ready
- No cost optimization
- No quality gates

**RANA:**
- Production framework
- Works with any code generator
- Takes generated code to production quality
- Automatic cost optimization
- Quality gates enforced
- CLI tools for maintenance

**Use them together!** Generate with v0/Bolt/Lovable, deploy with RANA.

---

### RANA vs Cursor / Claude Code?

**Cursor / Claude Code:**
- AI coding assistants
- Help you write code faster
- No framework or structure
- Still need to handle production concerns

**RANA:**
- Production framework
- Structure and patterns provided
- Quality gates and optimization built-in
- CLI tools for common tasks

**They're complementary!** Use Cursor/Claude Code to write code, use RANA as your framework.

---

### RANA vs building from scratch?

**From Scratch:**
- Time: 20-40 hours setup
- Cost: High (no optimization)
- Quality: Variable (depends on your expertise)
- Maintenance: High (you own everything)

**With RANA:**
- Time: 5 minutes setup
- Cost: 70% lower (automatic optimization)
- Quality: 95+ scores (enforced)
- Maintenance: Lower (CLI tools + updates)

**RANA saves you weeks of work and thousands of dollars.**

---

## Training & Certification

### Do I need training to use RANA?

**No!** RANA includes comprehensive documentation and guides.

**Self-serve resources:**
- Quick Start Guide (5 minutes)
- Framework guides (9 guides)
- CLI reference (22+ commands)
- Template documentation
- Video tutorials (coming soon)

**Training is optional** and recommended for:
- Teams standardizing on RANA
- Enterprises needing formal certification
- Developers wanting expert guidance
- Advanced use cases and customization

---

### What training programs are available?

**Individual Programs:**

**RANA Fundamentals (2 days, $2,500)**
- Core concepts
- Hands-on workshop
- Build sample app
- Certificate of completion

**RANA Certification (4 weeks, $5,000)**
- Comprehensive curriculum
- Weekly live sessions
- Capstone project
- Official RANA certification

**Team Programs:**

**Team Workshop (1 day, $5,000)**
- On-site or remote
- Customized to your stack
- Hands-on training
- Team of 5-10

**Enterprise Training (Custom)**
- Custom curriculum
- Your schedule
- On-site available
- Any team size

---

### Is certification worth it?

**Benefits:**
- Validate your RANA expertise
- Stand out in job market
- Access to certified developers network
- Priority support
- Listed in RANA directory
- Job referrals from Waymaker

**Who should get certified:**
- Consultants/freelancers
- Agency developers
- Job seekers
- Team leads

**ROI:** Certified developers report 20-30% higher rates.

---

## Support & Community

### Where can I get help?

**Free Support:**
- GitHub Issues (bug reports, feature requests)
- GitHub Discussions (questions, ideas)
- Documentation (comprehensive guides)
- Discord community (coming soon)

**Paid Support:**
- Priority email support (training customers)
- 1-on-1 consulting (hourly or project)
- Custom development (agency services)

**Response times:**
- Community: Best effort
- Training customers: 24 hours
- Enterprise: SLA-based

---

### Is there a Discord/Slack community?

**Coming soon!** We're launching a Discord server at launch.

**Will include:**
- General discussion
- Technical help
- Show & tell (share your projects)
- Job board
- Feature requests
- Announcements

**Join the waitlist:** (Add Discord invite link here)

---

### How do I report bugs?

**GitHub Issues:** [github.com/waymaker-ai/aads-framework/issues](https://github.com/waymaker-ai/aads-framework/issues)

**Include:**
- RANA version (`aads --version`)
- Node.js version (`node --version`)
- Operating system
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

**Security vulnerabilities:** Email security@waymaker.ai directly (do not post publicly)

---

### How can I request features?

**GitHub Discussions:** [github.com/waymaker-ai/aads-framework/discussions](https://github.com/waymaker-ai/aads-framework/discussions)

**Include:**
- Clear description of the feature
- Use case (why you need it)
- Expected behavior
- Examples or mockups if applicable

**Popular requests get prioritized!**

---

## Contributing

### Can I contribute to RANA?

**Yes!** RANA is open source and we welcome contributions.

**Ways to contribute:**
- Report bugs
- Fix bugs (PRs welcome)
- Add features
- Improve documentation
- Write guides or tutorials
- Share templates
- Help others in community

**Contributor guidelines:** See CONTRIBUTING.md in the repo

---

### What should I contribute?

**High-value contributions:**
- New framework integrations
- Additional LLM providers
- Database adapters
- Deployment guides
- Example applications
- Performance improvements
- Test coverage
- Documentation improvements

**We especially need:**
- MongoDB adapter
- MySQL adapter
- Firebase integration
- Additional examples
- Video tutorials

---

### Do contributors get anything?

**Recognition:**
- Listed in CONTRIBUTORS.md
- GitHub profile badge
- Mentioned in release notes

**For significant contributions:**
- Free RANA training
- Free certification
- Invited to contributor calls
- Early access to new features

**We're planning a contributor rewards program!**

---

## Business & Licensing

### What license is RANA under?

**MIT License** - Very permissive!

**You can:**
- Use commercially
- Modify the code
- Distribute it
- Sublicense it
- Use in proprietary software

**Requirements:**
- Include original license text
- Include copyright notice

**That's it!** No restrictions on commercial use.

---

### Can I use RANA for client work?

**Absolutely!** You can:
- Build client projects with RANA
- Charge clients for your work
- White-label RANA-based solutions
- Include in your agency's stack

**No royalties, no fees, no restrictions.**

---

### Can I sell RANA-based products?

**Yes!** You can:
- Build SaaS products with RANA
- Sell templates built on RANA
- Create and sell courses about RANA
- Offer consulting services

**Optional:** Add "Built with RANA" badge to show support

---

### Can I modify RANA?

**Yes!** Fork it, modify it, extend it however you want.

**Common modifications:**
- Add custom frameworks
- Integrate additional services
- Customize templates
- Add company-specific patterns

**If your modifications are useful, consider contributing back!**

---

### Does Waymaker offer services?

**Yes!** Waymaker (the company behind RANA) offers:

**Development Services:**
- MVP Development ($25K-$50K)
- Feature Sprints ($8K-$15K per 2 weeks)
- AI Integration ($12K-$25K)

**Consulting Services:**
- RANA Implementation ($8K-$20K)
- Architecture Review ($5K-$12K)
- RANA Audit ($2,500)

**Training Services:**
- See "Training & Certification" section above

**Learn more:** [waymaker.ai/services](https://waymaker.cx/services)

---

### How is RANA funded?

**Dual model:**

**Open Source (Free):**
- Framework
- CLI tools
- Templates
- Documentation

**Revenue (Paid):**
- Training programs
- Certification
- Development services
- Consulting services

**This lets us keep the framework free while building a sustainable business.**

---

## Troubleshooting

### My quality checks are failing

**Security failures:**
```bash
# Check what's failing
npx aads security:check --verbose

# Common fixes
- Add rate limiting middleware
- Enable security headers
- Configure RLS policies
- Add input validation
```

**SEO failures:**
```bash
# Check what's failing
npx aads seo:check --verbose

# Common fixes
- Add meta tags to pages
- Generate sitemap
- Add Open Graph tags
- Optimize images
```

**Mobile failures:**
```bash
# Check what's failing
npx aads mobile:check --verbose

# Common fixes
- Increase touch target sizes
- Add viewport meta tag
- Test on real devices
- Add PWA manifest
```

---

### LLM costs are still high

**Check optimization:**
```bash
npx aads llm:analyze
```

**Ensure caching is enabled:**
- Upstash Redis configured
- Cache TTL set appropriately
- Cache hits being recorded

**Review model selection:**
- Are you using expensive models for simple tasks?
- Can you use Haiku instead of Sonnet?
- Consider Grok for medium complexity

**Check prompt efficiency:**
- Remove unnecessary context
- Use prompt templates
- Batch requests when possible

---

### Deployment failing

**Vercel:**
- Check build logs
- Ensure environment variables set
- Verify Node.js version
- Check for missing dependencies

**Railway:**
- Verify Procfile present
- Check build command
- Environment variables configured
- Health check passing

**Database connection:**
- Connection string correct
- IP whitelist configured (if needed)
- SSL mode set correctly
- Pool size appropriate

---

### Supabase connection issues

**Check:**
- Project URL correct in .env
- Anon/service key correct
- RLS policies not blocking queries
- Database not paused (free tier)

**Test connection:**
```bash
npx aads db:check
```

---

### TypeScript errors

**Common fixes:**
- Update types: `npm install --save-dev @types/node @types/react`
- Clear `.next` folder: `rm -rf .next`
- Restart TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")
- Check tsconfig.json paths

---

### Environment variables not working

**Next.js rules:**
- Browser variables must start with `NEXT_PUBLIC_`
- Restart dev server after changing .env
- Use `.env.local` for local development
- Don't commit `.env.local` to git

**Vercel/deployment:**
- Set in platform dashboard
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

---

## Still Have Questions?

**Ask in:**
- GitHub Discussions: [github.com/waymaker-ai/aads-framework/discussions](https://github.com/waymaker-ai/aads-framework/discussions)
- Discord: (coming soon)
- Email: support@waymaker.ai

**We're here to help! **

---

*RANA v2.0 FAQ*
*Last updated: 2025-11-09*
*Ashley Kays | Waymaker*
