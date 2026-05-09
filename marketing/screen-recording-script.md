# 90-Second Screen Recording — Script + Storyboard

For Product Hunt gallery slot 2 and the homepage hero. Total runtime target: **0:00–1:30**, with a 5-second cushion either side. Aspect ratio 16:9, 1920×1080.

The recording shows the **whole loop**: install → spec → scoped diff → check. Viewers should walk away thinking "that's the bypass-resistant flow I want."

---

## Setup before recording

- [ ] Fresh Cursor or Claude Code window with no other extensions visible.
- [ ] Empty starter repo cloned (`git clone https://github.com/waymaker-ai/cofounder-example-billing.git`) — or use `examples/skills/01-feature-flow/`.
- [ ] Terminal font 16pt+. Editor font 16pt+. Match a dark or light theme — pick one and stay consistent.
- [ ] Hide the dock, hide notifications, do-not-disturb on.
- [ ] Browser tab with cofounder.cx ready in case of B-roll cutaway.
- [ ] Audio: no narration. Use captions (legible at small sizes).

---

## Shot list (timestamps are end-times)

### 0:00–0:05 — Title card

> **CoFounder** — guardrails + skills for AI coding agents
> Spec, scope, ship. Without the cleanup.

Static text, no animation. Zoom out to terminal at 0:05.

### 0:05–0:15 — Install (10s)

Caption: **One install, plug into Claude Code.**

```bash
$ npm install -g @waymakerai/aicofounder-cli
$ npx aicofounder init
```

Show the `init` output: detected Next.js, suggested VibeSpec, wrote `.aicofounder.yml`. Cut at "Run aicofounder feature:new to start a feature".

### 0:15–0:35 — `/spec` triggers the spec flow (20s)

Caption: **/spec — the agent asks before it codes.**

In Claude Code or Cursor, type:

```
/spec Add an annual upgrade option to the billing settings page so admins can switch from monthly to annual.
```

The skill runs. The recording shows:
1. Claude asking: *"Which user roles can do this?"* — type `admin`.
2. Claude asking: *"Source of truth for billing?"* — type `Stripe Customer Portal`.
3. Claude pulling up `BillingSettingsPage.tsx` saying "I found prior art — extend or create new?" Select **extend**.
4. Claude writing `specs/annual-upgrade.spec.yml` and showing the diff.

Hold on the spec for 2s. Highlight `affectedPaths` and `acceptanceCriteria` with a callout box.

### 0:35–0:50 — Scoped implementation (15s)

Caption: **The diff stays inside `affectedPaths`.**

Type:

```
Implement specs/annual-upgrade.spec.yml
```

Show:
1. Branch created: `feat/annual-upgrade`.
2. File tree narrows to the 4 paths from the spec.
3. Quick diff fly-by — components, lib, test.
4. Test run output: `3 passed`.

### 0:50–1:10 — `/check` runs the safety gates (20s)

Caption: **/check — secrets, scope, mock-data, design-system.**

Type:

```
/check
```

Show the report:

```
# CoFounder Check
Verdict: READY

Tier 1 findings (block PR): none
Tier 2 findings: none

What I verified:
✓ No secrets in diff
✓ typecheck PASS
✓ test PASS (3 new tests)
✓ Scope respected
✓ No raw hex colors
✓ No mock data added
```

Hold for 3s on the green check. Cut to next shot.

### 1:10–1:25 — Sandbox preview teaser (15s)

Caption: **Destructive ops? Sandbox first.**

Type something destructive:

```
Drop the orphan rows from the users table.
```

Show:
1. Skill recognizes `runsShell` sensitivity.
2. Sandbox preview output:
   ```
   Would delete 12,000 rows.
   Of these, 47 have last_login_at within 30 days.
   Recommendation: NEEDS REVIEW.
   ```
3. The agent stops. Doesn't run the real command.

### 1:25–1:30 — Outro (5s)

Static title:

> **Free. Open source. MIT.**
> cofounder.cx · github.com/waymaker-ai/cofounder

Fade to logo at 1:30.

---

## Editing notes

- **Speed up typing.** Real typing = boring. Use 2× to 3× speed-ramp on terminal input, normal speed on the agent's response.
- **Highlight, don't narrate.** Boxes, arrows, brief captions. No voice-over — viewers will mute on Product Hunt.
- **Cut tight.** Anything that doesn't earn its second is dead time. The flow is the message.
- **End on a result, not a CTA.** The "/check" green-PASS frame is the strongest hold. Captions over it land harder than a "subscribe now".

---

## What to NOT include

- Long install logs. Trim to the line that matters.
- Full agent reasoning. Show the question + answer; cut middle reasoning.
- "Powered by Anthropic / OpenAI" — irrelevant. The skill works on any provider.
- Branding chrome. Logo at start and end is enough.

---

## Asset deliverables

Save these out alongside the recording:

- `cofounder-90s.mp4` — 1920×1080 H.264, ≤8 MB if possible (Product Hunt prefers small).
- `cofounder-90s-no-captions.mp4` — same cut, captions baked off, for re-use with translated subtitles.
- `cofounder-hero-still.png` — frame at 1:11 (the green-PASS check report) for hero image fallback.
- `cofounder-90s.gif` — 600×340 abridged loop showing 0:35–1:00 (spec → diff → check) for the GitHub README.

---

## After recording, before publishing

- [ ] Rewatch with the sound muted. Is the story clear? If not, recut.
- [ ] Show it to one person who has never seen CoFounder. Ask "what would you do after this?". If they can't answer, the call-to-action isn't clear.
- [ ] Run a transcript through cofounder-readme to generate accurate alt-text and a closed-caption track. (Yes, recursively.)
