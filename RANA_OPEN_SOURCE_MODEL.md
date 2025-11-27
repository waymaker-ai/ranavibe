# RANA Open Source + Monetization Model

**Question:** If RANA is open source, why is there a paid tier?

**Answer:** RANA uses the **Open Core** business model (like Supabase, Vercel, GitLab).

---

## What's Free Forever (Open Source)

### 1. Core Framework
- **`.rana.yml` specification** - The YAML config format
- **Quality gate definitions** - All gate templates
- **REPM methodology** - Complete 7-phase framework
- **Documentation** - All guides, tutorials, examples
- **Community support** - Discord, GitHub issues

### 2. Self-Hosted Tools
- **Basic CLI tool** - `npx @rana/cli`
  - `rana init` - Initialize config
  - `rana validate` - Validate config
  - `rana check` - Run local checks
- **Local validation** - Run quality gates locally
- **Template library** - All project templates
- **GitHub repo** - Full source code (MIT License)

### 3. Integrations (Basic)
- **MCP Server (local)** - Run on your machine
- **VS Code extension (basic)** - Editor integration
- **GitHub Action** - CI/CD integration

**You can use RANA 100% free forever by:**
- Running CLI locally
- Self-hosting validation checks
- Using community support

---

## What's Paid (Hosted Services)

### Pro Tier ($29/month)
**Why pay?** Convenience, speed, collaboration, analytics.

**Features:**
1. **Hosted API** - No need to run checks locally
   - Cloud validation (instant results)
   - No setup required
   - Always up-to-date
   - Fast (< 200ms response)

2. **Advanced MCP Server**
   - Cloud-backed (sync across devices)
   - Team collaboration features
   - Real-time quality tracking
   - Historical analytics

3. **REPM Guided Validation**
   - Interactive questionnaires
   - Templates for each phase
   - Collaboration with team
   - Decision tracking

4. **Analytics Dashboard**
   - Project health score
   - Quality trends over time
   - Team performance
   - Compliance reporting

5. **Team Features**
   - Share configurations
   - Collaborate on validations
   - Comment on quality gates
   - Approval workflows

6. **Priority Support**
   - Direct Slack/Discord channel
   - Response within 24 hours
   - Custom quality gate help

### Enterprise Tier (Custom pricing)
**For companies that need:**
- SSO/SAML authentication
- On-premise deployment option
- Custom quality gates
- SLA guarantees (99.99% uptime)
- Dedicated support engineer
- Compliance certifications (SOC2, HIPAA)
- Audit logs and compliance reporting
- Multi-region deployment

---

## Comparison: Free vs Pro vs Enterprise

| Feature | Free (OSS) | Pro ($29/mo) | Enterprise |
|---------|-----------|--------------|------------|
| `.rana.yml` config | ✅ | ✅ | ✅ |
| CLI tool | ✅ | ✅ | ✅ |
| Local validation | ✅ | ✅ | ✅ |
| Documentation | ✅ | ✅ | ✅ |
| MCP Server (local) | ✅ | ✅ | ✅ |
| Hosted API | ❌ | ✅ | ✅ |
| Analytics dashboard | ❌ | ✅ | ✅ |
| REPM guided validation | ❌ | ✅ | ✅ |
| Team collaboration | ❌ | ✅ | ✅ |
| Real-time sync | ❌ | ✅ | ✅ |
| Priority support | ❌ | ✅ | ✅ |
| SSO/SAML | ❌ | ❌ | ✅ |
| On-premise option | ❌ | ❌ | ✅ |
| SLA guarantee | ❌ | ❌ | ✅ |
| Custom gates | ❌ | ❌ | ✅ |
| Compliance certs | ❌ | ❌ | ✅ |

---

## Real-World Analogies

### Similar Open Core Models

**Supabase:**
- Open source: PostgreSQL, Auth, Storage libraries
- Paid: Hosted database, automatic backups, scaling
- Why pay? Convenience, managed infrastructure

**Vercel:**
- Open source: Next.js framework
- Paid: Hosting, deployments, analytics
- Why pay? Zero-config deployments, global CDN

**GitLab:**
- Open source: Git hosting, CI/CD
- Paid: Advanced CI, security scanning, compliance
- Why pay? Enterprise features, support

**MongoDB:**
- Open source: Database engine
- Paid: Atlas hosting, backups, monitoring
- Why pay? Managed infrastructure, scale

**RANA:**
- Open source: Framework, CLI, docs
- Paid: Hosted API, analytics, collaboration
- Why pay? Convenience, team features, analytics

---

## Why This Model Works

### For Users
✅ **Try before buy** - Use free version, upgrade when needed
✅ **No lock-in** - Can always self-host
✅ **Community support** - Free tier stays free forever
✅ **Transparent pricing** - Know exactly what you pay for

### For Developers/Teams
✅ **Individuals** - Use free version indefinitely
✅ **Growing teams** - Upgrade for collaboration ($29/mo)
✅ **Enterprises** - Custom solutions for compliance

### For Business
✅ **Sustainable** - Revenue funds development
✅ **Aligned incentives** - More value = more revenue
✅ **Fair** - Pay for what you use
✅ **Community-first** - Core always stays free

---

## Revenue Sources

### 1. Hosted Services (Primary)
- Pro subscriptions: $29/month/user
- Enterprise contracts: $10K-100K/year
- Target: 500 Pro users = $14.5K MRR

### 2. Professional Services (Secondary)
- Custom quality gate development: $5K-20K
- Team training: $2K-5K per session
- Consulting: $200/hour

### 3. Marketplace (Future)
- Premium templates: $49-199
- Custom integrations: $99-499
- Third-party quality gates: Revenue share

---

## License Structure

### Open Source Components (MIT License)

```
rana/
├── packages/
│   ├── core/         # MIT - Config parser, validation engine
│   ├── cli/          # MIT - Command line tool
│   ├── templates/    # MIT - Project templates
│   └── docs/         # MIT - Documentation
```

**You can:**
- Use commercially
- Modify and distribute
- Create proprietary forks
- No attribution required (appreciated!)

### Proprietary Components (Closed Source)

```
rana-cloud/           # Proprietary - Hosted services
├── api/              # API server (not open sourced)
├── dashboard/        # Analytics dashboard
├── team-features/    # Collaboration features
└── enterprise/       # Enterprise-specific features
```

**Why closed source?**
- Prevents competitors from cloning our hosted service
- Protects business model
- Common practice (Supabase, Vercel do this)

---

## Customer Journey

### Phase 1: Discovery (Free)
1. Find RANA through blog/GitHub/ProductHunt
2. Read docs (free)
3. Install CLI: `npx @rana/cli init`
4. Use locally for 2-4 weeks
5. See value: "This saves me hours!"

### Phase 2: Consideration (Free → Pro)
**Triggers for upgrade:**
- "I want analytics to see trends"
- "My team needs to collaborate"
- "I want this on all my projects instantly"
- "I need hosted validation for CI/CD"

### Phase 3: Conversion (Pro $29/mo)
1. Sign up at rana.cx
2. Get API key instantly
3. Upgrade MCP server: `rana upgrade --pro`
4. Access analytics dashboard
5. Invite team members

### Phase 4: Expansion (Enterprise)
**Triggers for enterprise:**
- Company requires SSO
- Need compliance certifications
- Want on-premise deployment
- Need SLA guarantees

Contact sales → Custom contract → Implementation support

---

## Value Proposition

### Free Tier
**"Get production-quality AI code, locally, for free."**
- Perfect for: Individuals, side projects, learning
- Time saved: 5-10 hours/week
- Cost: $0

### Pro Tier
**"Your team's AI quality standard, in the cloud."**
- Perfect for: Teams, agencies, growing startups
- Time saved: 10-20 hours/week per person
- Cost: $29/month (vs $200/hour for developer time)
- ROI: 69x (20 hours × $100/hour = $2,000 value, pay $29)

### Enterprise Tier
**"Enterprise-grade AI quality, compliance, and control."**
- Perfect for: Large companies, regulated industries
- Time saved: 100+ hours/week across teams
- Cost: $20K-100K/year
- ROI: 10-50x (versus manual code reviews + bugs)

---

## FAQ

**Q: Can I use RANA commercially for free?**
A: Yes! MIT license allows commercial use.

**Q: Do I need to pay to use the MCP server?**
A: No, basic MCP server is free. Pro adds cloud sync + team features.

**Q: What if I don't want to pay?**
A: You can use RANA 100% free forever. Run locally, self-host everything.

**Q: Will free features be removed?**
A: No. We commit to keeping core features free. See: rana.cx/promise

**Q: Can I build a competing product?**
A: Yes for framework. No for exact clone of hosted service (just ethics, not legal).

**Q: What if RANA shuts down?**
A: Code is open source. You can fork it and run it yourself forever.

**Q: Is this a bait-and-switch?**
A: No. Check our public roadmap. Free tier grows alongside Pro tier.

---

## The Promise

**RANA's Open Source Commitment:**

1. **Core framework stays free forever**
   - `.rana.yml` spec will never be paywalled
   - CLI tool will always be free
   - Documentation will always be public

2. **No features will be removed from free tier**
   - What's free today stays free
   - New free features may be added
   - We publish any changes 90 days in advance

3. **Open source code is MIT forever**
   - Can't revoke the license
   - Can't change past versions
   - Community can fork anytime

4. **If we shut down:**
   - We'll release all proprietary code as open source
   - Or transfer to trusted maintainer
   - 90-day notice period

**Published:** rana.cx/open-source-promise

---

## TL;DR

**RANA = Open Core Model**

✅ **Framework is free** (like Next.js)
✅ **Hosted service is paid** (like Vercel)
✅ **You choose**: Self-host free or pay for convenience
✅ **Fair pricing**: $29/mo vs $1,000s in developer time saved
✅ **No lock-in**: Can always switch to free/self-hosted

**Questions?** Read full FAQ: docs.rana.cx/pricing

---

*Open source. Built in public. Community-first. Sustainable business.* 🚀
