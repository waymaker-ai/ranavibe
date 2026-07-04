# Twitter / X Thread — CoFounder umbrella relaunch

Posting cadence: drop one tweet at launch time, reply with 1–2 follow-ups every 30 min for the first 2 hours, one more at the 6h mark. Don't auto-thread.

---

## Tweet 1 (launch tweet)

We just shipped CoFounder v2 — the open-source skill library + guardrails for AI coding agents.

16 skills. Spec → scope → sandbox-preview → ship.

Works in Claude Code, Cursor, Cline, Windsurf.

MIT.

[90s video]

🧵

→ cofounder.cx

---

## Tweet 2 (the why)

We kept watching AI agents do real damage:
- Committing Stripe keys
- Inventing functions that don't exist
- Running DELETE FROM users in prod

Smarter models didn't fix it.

A flow that's hard to bypass did.

That's CoFounder.

---

## Tweet 3 (the skill that catches secrets)

Example: `cofounder-commit`

Reads the staged diff. If it sees a high-entropy string matching sk_live_* / AKIA* / etc, it refuses to commit and tells you to rotate.

Not a vibe. A literal pre-commit gate.

[screenshot]

---

## Tweet 4 (the skill for compliance)

Building in healthcare or fintech?

`cofounder-compliance-frame` reframes your feature spec against HIPAA / GDPR / SEC / PCI *before* code is written.

Catches the "co-render PHI with billing" finding at the spec stage. Not at audit.

[screenshot]

---

## Tweet 5 (the skill for cost)

Skills declare modelClass: light | mid | heavy.

Light tasks (commit messages, classification) → Haiku.
Mid tasks (refactors) → Sonnet.
Heavy tasks (architecture) → Opus.

Our benchmark shows ~33% cost savings vs everything-on-Opus.

Script in repo. Reproduce.

---

## Tweet 6 (cross-host)

The big surprise:

Every skill is auto-published as an MCP tool.

Same skill runs in Claude Code, Cursor, Cline, Windsurf, Claude Desktop.

Setup guides: cofounder.cx/docs/integrations/cursor (also /cline, /windsurf)

---

## Tweet 7 (the reframe — what we're NOT)

What CoFounder is NOT:
- A "ship a startup in 30 min" button
- A replacement for engineers, tests, reviews
- A walled-garden orchestrator
- A cloud product

What it IS:
- The safety harness for AI-assisted dev
- Free, MIT, no telemetry
- Your stack, your keys, your infra

---

## Tweet 8 (CTA)

```
npm install @waymakerai/aicofounder-cli
npx aicofounder init
/spec Add team billing settings
```

That's the install. That's the loop.

GitHub: github.com/waymaker-ai/cofounder
Docs: cofounder.cx/docs/skills
Browse skills: cofounder.cx/skills/browse

PRs and issues welcome. ❤️

---

## Reply-ready answers

**"how is this different from cursor rules"**
Rules are static instructions. Skills are executable — own system prompt, own sensitivity, own chain. Use both.

**"is it open source"**
Yes. MIT. github.com/waymaker-ai/cofounder. No CLA. No telemetry. No cloud.

**"does it work with [model X]"**
Yes — skills are provider-agnostic. Default routing maps light/mid/heavy to Haiku/Sonnet/Opus but you can override.

**"can i write my own skills"**
Yes. CONTRIBUTING_SKILLS.md. SKILL.md is markdown + YAML frontmatter. Write one in 10 minutes.

**"received an error"**
Reply with the issue link or DM. Don't argue in public threads.

---

## Hashtags (use sparingly)

`#AIagents` `#OpenSource` `#DevTools`

Skip these unless they're trending: `#vibecoding` `#coding` (oversaturated)

---

## What NOT to tweet

- Pricing comparisons against named competitors. We don't punch down.
- "Killer of [framework]". We don't kill anything.
- Inflated metrics. The benchmark exists; cite it.
- "Ship a startup in 30 minutes" energy. We're the opposite of that.
