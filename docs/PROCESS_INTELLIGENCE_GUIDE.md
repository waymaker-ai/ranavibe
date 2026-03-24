# CoFounder Process Intelligence Guide

> **Track development velocity, optimize costs, and modernize legacy code with AI-powered analytics**

---

## Overview

CoFounder Process Intelligence provides visibility into your development process, helping you:

- **Track Development Velocity** - Commits, code changes, DORA metrics
- **Measure AI Usage** - Estimate AI-assisted code generation
- **Optimize Costs** - Real-time LLM cost tracking and savings
- **Modernize Legacy Code** - AI-powered technical debt analysis

This competes with enterprise tools like HatchWorks GenIQ while being completely free and open-source.

---

## Quick Start

```bash
# Analyze development velocity
cofounder analyze:velocity

# Analyze legacy code
cofounder analyze:legacy

# View real-time cost dashboard
cofounder dashboard --live
```

---

## Velocity Analysis

### What It Measures

The velocity analysis command tracks your development progress using git history and provides insights based on DORA metrics.

```bash
cofounder analyze:velocity
```

**Output:**
```
📊 CoFounder Velocity Analysis

📈 Development Velocity
────────────────────────────────────────────────────────────
  Total Commits:      142
  This Week:          23 commits
  Last Week:          18 commits
  Avg/Day:            4.7 commits

  Files Changed:      89
  Lines Added:        +4,521
  Lines Deleted:      -1,234
  Net Change:         +3,287

  AI-Generated:       ~65%

💰 Cost Analysis
────────────────────────────────────────────────────────────
  Estimated LLM Calls:     452
  Cost Without CoFounder:       $22.60
  Cost With CoFounder:          $6.78
  Savings:                 $15.82 (70%)

🎯 DORA Metrics
────────────────────────────────────────────────────────────
  Deployment Frequency:   Daily (High)
  Lead Time for Changes:  <1 day (Elite)
  Change Failure Rate:    Low (<15%)
  Mean Time to Recovery:  <1 hour

💡 Insights
────────────────────────────────────────────────────────────
  📈 Velocity increased 28% this week
  🤖 High AI assistance detected (~65% of code)
  💰 Estimated 70% cost savings with CoFounder ($15.82)
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --period <days>` | Analysis period (e.g., 7d, 30d, 90d) | 30d |
| `-d, --detailed` | Show detailed breakdown with contributors | false |
| `-e, --export <format>` | Export report (json, csv) | - |

### Examples

```bash
# Last 7 days with detailed contributor breakdown
cofounder analyze:velocity --period 7d --detailed

# Export to JSON for CI/CD integration
cofounder analyze:velocity --export json

# Quick weekly summary
cofounder velocity -p 7d
```

---

## Legacy Code Analysis

### What It Detects

The legacy analysis command scans your codebase for outdated patterns and generates a modernization plan.

```bash
cofounder analyze:legacy
```

**Detected Patterns:**

| Category | Patterns Detected |
|----------|-------------------|
| **JavaScript** | var usage, callback hell, jQuery, document.write, eval |
| **TypeScript** | any types, missing strict mode |
| **React** | Class components, deprecated lifecycle methods |
| **CSS** | Inline styles, float layouts |
| **API** | XMLHttpRequest, synchronous requests |
| **Security** | innerHTML, hardcoded secrets, eval |

**Output:**
```
🔍 CoFounder Legacy Code Analysis

📊 Analysis Summary
────────────────────────────────────────────────────────────
  Health Score:        72/100
  Files Analyzed:      156

  Technical Debt:      48.5 hours (~$7,275)

  Critical Issues:     3
  High Issues:         12
  Medium Issues:       28
  Low Issues:          45

🔧 Technical Debt

  JavaScript:
    ✗ jQuery usage (15 occurrences)
      src/components/legacy/... | Effort: 4-8hrs
    ⚠ callback hell (8 occurrences)
      src/services/api.ts | Effort: 30min

  React:
    ⚠ Class components instead of functional (12 occurrences)
      src/components/... | Effort: 1-2hrs

📋 Modernization Plan

  Phase 1: Critical Security Fixes
  Address critical security vulnerabilities immediately
  Effort: 4 hours | Impact: Blocking issues resolved

  Phase 2: Framework Upgrades
  Update outdated dependencies to latest versions
  Effort: 4-8 hours | Impact: Access to modern features

  Phase 3: High Priority Refactoring
  Refactor high-impact legacy patterns
  Effort: 2.5 days | Impact: Significant code quality improvement
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Path to analyze | . |
| `-d, --detailed` | Show all issues (not truncated) | false |
| `-f, --fix` | Auto-fix simple issues | false |
| `-e, --export <format>` | Export report (json, md) | - |

### Examples

```bash
# Analyze specific directory
cofounder analyze:legacy --path ./src/legacy

# Export modernization plan as markdown
cofounder analyze:legacy --export md

# Detailed analysis with all issues
cofounder legacy --detailed
```

---

## Cost Dashboard

### Real-Time Monitoring

The dashboard command provides real-time visibility into your LLM costs.

```bash
cofounder dashboard
```

**Output:**
```
╔═══════════════════════════════════════════════════════════════╗
║                    CoFounder Cost Dashboard                         ║
╠═══════════════════════════════════════════════════════════════╣
║  Today            │  This Week        │  This Month           ║
║  $12.45           │  $67.80           │  $234.50              ║
║  ↓ 68% saved      │  ↓ 71% saved      │  ↓ 70% saved          ║
╠═══════════════════════════════════════════════════════════════╣
║  Provider Breakdown                                            ║
║  ├─ OpenAI GPT-4      $45.20 (19%)  ████                      ║
║  ├─ Anthropic Claude  $89.30 (38%)  ████████                  ║
║  ├─ Google Gemini     $23.40 (10%)  ██                        ║
║  └─ Groq              $76.60 (33%)  ███████                   ║
╠═══════════════════════════════════════════════════════════════╣
║  Savings This Month: $548.50 (70% reduction)                  ║
║  Without CoFounder: $783.00 → With CoFounder: $234.50                   ║
╚═══════════════════════════════════════════════════════════════╝
```

### Live Mode

```bash
cofounder dashboard --live
```

Updates every 5 seconds with real-time cost tracking.

---

## DORA Metrics Explained

CoFounder tracks the four key DORA metrics that indicate software delivery performance:

### 1. Deployment Frequency
How often you deploy to production.

| Level | Frequency |
|-------|-----------|
| Elite | Multiple per day |
| High | Daily |
| Medium | Weekly |
| Low | Monthly or less |

### 2. Lead Time for Changes
Time from commit to production deployment.

| Level | Time |
|-------|------|
| Elite | < 1 day |
| High | 1-7 days |
| Medium | 1-4 weeks |
| Low | > 1 month |

### 3. Change Failure Rate
Percentage of deployments causing failures.

| Level | Rate |
|-------|------|
| Elite | < 5% |
| High | 5-10% |
| Medium | 10-15% |
| Low | > 15% |

### 4. Mean Time to Recovery (MTTR)
Time to recover from a failure.

| Level | Time |
|-------|------|
| Elite | < 1 hour |
| High | < 1 day |
| Medium | 1-7 days |
| Low | > 1 week |

---

## CI/CD Integration

### GitHub Actions

Add velocity tracking to your CI/CD pipeline:

```yaml
name: CoFounder Analytics

on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly on Monday at 9am

jobs:
  velocity-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for git analysis

      - name: Install CoFounder CLI
        run: npm install -g @waymakerai/aicofounder-cli

      - name: Generate Velocity Report
        run: cofounder analyze:velocity --period 7d --export json

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: velocity-report
          path: cofounder-velocity-report-*.json
```

### GitLab CI

```yaml
velocity-report:
  image: node:20
  script:
    - npm install -g @waymakerai/aicofounder-cli
    - cofounder analyze:velocity --period 7d --export json
  artifacts:
    paths:
      - cofounder-velocity-report-*.json
  only:
    - schedules
```

---

## Web Dashboard (Coming Soon)

CoFounder v2.1 will include a web-based dashboard for visualizing:

- Historical velocity trends
- Cost tracking over time
- Team productivity metrics
- AI usage analytics
- Technical debt evolution

**Preview:**
```
┌────────────────────────────────────────────────────────────────┐
│ CoFounder Analytics Dashboard                          [cofounder.dev]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Velocity Trend (30 days)         Cost Savings                 │
│  ████████████████████            ┌─────────────────┐           │
│  ██████████████                  │ $2,450 saved    │           │
│  ████████████████████████        │ this month      │           │
│  ████████████████                │ ↓ 71% vs base   │           │
│                                  └─────────────────┘           │
│                                                                │
│  DORA Metrics                    AI Usage                      │
│  ┌──────────────────────┐        ┌─────────────────┐           │
│  │ Deploy: Elite ⭐⭐⭐⭐ │        │ 68% AI-assisted │           │
│  │ Lead:   High  ⭐⭐⭐   │        │ 32% manual      │           │
│  │ CFR:    Elite ⭐⭐⭐⭐ │        └─────────────────┘           │
│  │ MTTR:   Elite ⭐⭐⭐⭐ │                                      │
│  └──────────────────────┘                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Velocity Analysis

```typescript
import { analyzeVelocity } from '@waymakerai/aicofounder-core';

const report = await analyzeVelocity({
  period: '30d',
  detailed: true,
});

console.log(report.metrics.totalCommits);
console.log(report.costs.savingsPercentage);
console.log(report.insights);
```

### Legacy Analysis

```typescript
import { analyzeLegacy } from '@waymakerai/aicofounder-core';

const report = await analyzeLegacy({
  path: './src',
  detailed: true,
});

console.log(report.summary.healthScore);
console.log(report.techDebt);
console.log(report.modernizationPlan);
```

---

## Best Practices

### 1. Track Velocity Weekly
Run velocity analysis weekly to catch trends early.

```bash
# Add to your Monday routine
cofounder analyze:velocity --period 7d
```

### 2. Monitor Costs Daily
Use the live dashboard during development to prevent cost surprises.

```bash
cofounder dashboard --live
```

### 3. Address Critical Issues First
Legacy analysis prioritizes issues. Always fix critical/high before medium/low.

### 4. Export for Team Review
Export reports for team retrospectives and planning.

```bash
cofounder analyze:velocity --export json > reports/week-$(date +%V).json
cofounder analyze:legacy --export md > reports/tech-debt.md
```

### 5. Integrate with CI/CD
Automated weekly reports help track progress over time.

---

## Comparison with Alternatives

| Feature | CoFounder | HatchWorks GenIQ | Other Tools |
|---------|------|------------------|-------------|
| Open Source | ✅ Free | ❌ Proprietary | Varies |
| Velocity Tracking | ✅ | ✅ | Some |
| DORA Metrics | ✅ | ✅ | Some |
| Cost Tracking | ✅ (70% savings) | ❌ | ❌ |
| AI Usage Analytics | ✅ | ✅ | ❌ |
| Legacy Analysis | ✅ | ✅ | ❌ |
| Self-Hosted | ✅ | ❌ | Varies |
| CLI Tool | ✅ | ❌ | Some |
| Price | **$0** | Enterprise pricing | $100-1000/mo |

---

## Troubleshooting

### "Not a git repository"
Velocity analysis requires git. Run from a git repository.

### Inaccurate AI estimation
AI-generated code detection is heuristic-based. Actual percentages may vary.

### Missing cost data
Cost tracking requires LLM calls to go through CoFounder's unified client.

### Legacy analysis slow
For large codebases (10k+ files), use `--path` to analyze specific directories.

---

## Support

- **Documentation:** https://cofounder.dev/docs/process-intelligence
- **Discord:** https://discord.gg/cofounder
- **GitHub Issues:** https://github.com/waymaker/cofounder/issues

---

*CoFounder Process Intelligence*
*Free, open-source development analytics*
*https://cofounder.dev*
