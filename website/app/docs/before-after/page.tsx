'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, AlertTriangle, ShieldCheck, GitBranch, KeyRound, Database } from 'lucide-react';

interface Failure {
  icon: any;
  title: string;
  scenario: string;
  before: string;
  after: string;
  skillsUsed: string[];
}

const failures: Failure[] = [
  {
    icon: GitBranch,
    title: 'Agent invents an API that does not exist',
    scenario: 'User asks the agent to add a "team billing" page. The agent has not read the codebase. It writes new code calling a function called `getBillingForTeam(teamId)` — which it invented. Compiles, looks plausible, ships to PR review.',
    before: `// agent writes — no prior art search:
import { getBillingForTeam } from '@/lib/billing';
// ^ This function does not exist anywhere.
//   Reviewer reads the diff and sees:
//   "looks fine, similar to other places"
//   merges. CI fails on prod build.
//   2 hours to find the regression.`,
    after: `// cofounder-pattern-scout (auto-invoked):
// "Found 3 candidates:
//    - lib/billing/upgradeFlow.ts (87% match)
//    - lib/billing/getCustomerSubscription.ts (78%)
//    - lib/billing/createInvoice.ts (61%)
//   Recommendation: extend upgradeFlow.ts."

// agent then writes:
import { upgradeFlow } from '@/lib/billing/upgradeFlow';
// ^ Real seam, already tested, used elsewhere.
//   No invented API. CI green.`,
    skillsUsed: ['cofounder-pattern-scout', 'cofounder-feature-implement', 'cofounder-check'],
  },
  {
    icon: KeyRound,
    title: 'Agent commits a secret to staged changes',
    scenario: 'Agent is debugging a Stripe issue. To test, it pastes the live key directly into the source file. Then runs `git commit -am "fix billing"`. The secret is now in git history.',
    before: `// agent — debugging, time-pressed:
const STRIPE_KEY = 'sk_live_AbCdEf...';
// later in same session:
//   $ git commit -am "fix billing"
//   $ git push
// Stripe key is now public.
// Rotation costs ~30 min + customer-facing
// downtime to invalidate active sessions.`,
    after: `// cofounder-commit reads the staged diff:
// "Refusing to commit. The diff contains a
//  high-entropy string matching sk_live_*.
//
//  Either:
//  1. Move the value to .env (gitignored).
//  2. If you've already committed it, rotate
//     it now and use git filter-repo to scrub
//     history.
//
// I will not run \`git commit\` until this
// is resolved."`,
    skillsUsed: ['cofounder-commit', 'PreToolUse hook', 'cofounder-check'],
  },
  {
    icon: Database,
    title: 'Agent runs a destructive migration in prod',
    scenario: 'User says "drop the orphan rows from the users table". Agent is about to execute `DELETE FROM users WHERE team_id IS NULL` — against the prod connection string it has loaded.',
    before: `// agent runs without sandbox:
//   DELETE FROM users WHERE team_id IS NULL;
//
// 12,000 rows deleted.
// 47 of them were valid (signed up before
// the team_id column existed; their team_id
// is null but they should not be removed).
// 47 customers can no longer log in.
// Restore from backup: 4 hours.
// Customer support: priceless.`,
    after: `// cofounder-sandbox-preview runs first:
//
// "Preview against a snapshot of users:
//
//   Would delete: 12,000 rows.
//   Of these, 47 have last_login_at within
//   the last 30 days — likely active users.
//
//   Recommendation: NEEDS REVIEW.
//   Filter the query, or run a soft-delete
//   first. Do not run as-is."
//
// agent surfaces this; user clarifies the
// rule; agent runs the corrected query.
// Zero data loss.`,
    skillsUsed: ['cofounder-sandbox-preview', 'cofounder-feature-implement (sensitivity.runsShell)', 'cofounder-check'],
  },
];

export default function BeforeAfterPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-5xl mx-auto px-6">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-3">What breaks without CoFounder</h1>
          <p className="text-lg text-foreground-secondary">
            Three real failure modes we have seen agents commit, with a side-by-side of what skill chaining catches.
            Not hypotheticals — patterns that show up in incident reports.
          </p>
        </motion.div>

        <div className="space-y-12">
          {failures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-subtle">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{f.title}</h2>
                  <p className="text-foreground-secondary text-sm">{f.scenario}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-red-500">Before</h3>
                  </div>
                  <pre className="code-block font-mono text-xs overflow-x-auto whitespace-pre-wrap">{f.before}</pre>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-emerald-500">After</h3>
                  </div>
                  <pre className="code-block font-mono text-xs overflow-x-auto whitespace-pre-wrap">{f.after}</pre>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary mb-2">
                  Skills involved
                </h4>
                <div className="flex flex-wrap gap-2">
                  {f.skillsUsed.map((s) => (
                    <code key={s} className="px-2 py-1 rounded bg-background-secondary font-mono text-xs">
                      {s}
                    </code>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card mt-12"
        >
          <h2 className="text-xl font-bold mb-3">Why these are hard for naked agents</h2>
          <p className="text-foreground-secondary mb-4 text-sm">
            Each failure mode is the absence of a habit, not the absence of intelligence:
          </p>
          <ul className="space-y-2 text-sm text-foreground-secondary list-disc list-inside">
            <li>
              <strong className="text-foreground">Invented APIs</strong> — agents pattern-match what code <em>should</em> look like, not what
              it does. A grep step before writing closes the gap.
            </li>
            <li>
              <strong className="text-foreground">Committed secrets</strong> — agents optimize for &quot;task done&quot;, not &quot;task done safely&quot;. A
              pre-commit hook reading the staged diff catches it deterministically.
            </li>
            <li>
              <strong className="text-foreground">Destructive operations</strong> — agents preview through reasoning, not through execution. A
              sandbox is the only way to know what would actually happen.
            </li>
          </ul>
          <p className="text-foreground-secondary text-sm mt-4">
            Smarter models do not fix these. <span className="font-semibold text-foreground">A flow that is hard to bypass</span> does.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-12 flex justify-between items-center pt-8 border-t border-border"
        >
          <Link href="/docs/skills" className="text-foreground-secondary hover:text-foreground">
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Skill Library
          </Link>
          <Link href="/docs/integrations" className="btn-primary px-4 py-2 inline-flex items-center">
            MCP host setup
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
