# Example 01 — feature flow

The end-to-end CoFounder loop on a tiny app:
**`cofounder-feature-new` → `cofounder-feature-implement` → `cofounder-check`**

This example is a stripped-down Next.js app with one page (a billing settings page) and one fake DB module. We use the CoFounder skill flow to add an annual-upgrade feature to it.

## What you'll see

- **Step 1** — A spec file written to `specs/annual-upgrade.spec.yml` after a clarifying-question pass.
- **Step 2** — A branch `feat/annual-upgrade`, a scoped diff that touches only files declared in the spec, and tests added for each acceptance criterion.
- **Step 3** — `cofounder-check` reports Tier 1 / Tier 2 findings; on a clean run it reports `READY`.

## Prereqs

```bash
npm install
```

The example bundles the `@waymakerai/aicofounder-cli` and the `cofounder` Claude Code plugin — once published, replace the local file references in `package.json` with their npm versions.

## Run the loop

In Claude Code (with the cofounder plugin loaded):

```
/spec Add an annual-upgrade option to the billing settings page so admins can switch from monthly to annual.
```

Claude will invoke `cofounder-feature-new`, ask 3–5 clarifying questions, search for prior art (it'll find `BillingSettingsPage.tsx`), and write `specs/annual-upgrade.spec.yml`.

Then:

```
Implement specs/annual-upgrade.spec.yml
```

The `cofounder-feature-implement` skill creates a branch, proposes a changeset (limited to `affectedPaths` from the spec), implements the feature, and writes tests.

Finally:

```
/check
```

Or run the CLI:

```bash
npx aicofounder check
```

## What the spec looks like (after Step 1)

```yaml
apiVersion: cofounder.cx/v1
id: annual-upgrade
name: "Annual upgrade option"
description: >
  Lets admin users switch their team's billing from monthly to annual on the
  existing settings page. Annual plans bill at 10x the monthly rate (2 months
  free).

userStories:
  - "As an admin, I can toggle annual billing so my team gets a discount."

acceptanceCriteria:
  - "Submit button is disabled while the request is in flight."
  - "Successful upgrade shows a confirmation banner with the new amount."
  - "401 if unauthenticated."

affectedPaths:
  - "app/settings/billing/page.tsx"
  - "components/billing/PlanSelector.tsx"
  - "lib/billing/upgradeFlow.ts"
  - "tests/billing/annualUpgrade.test.ts"

dataSources:
  - "subscriptions table (existing)"
  - "Stripe Customer Portal API"

constraints:
  - "Use existing PlanSelector component — do not fork it."
  - "All new colors must come from tailwind tokens (forbidRawColors)."

nonGoals:
  - "Refunds for mid-cycle plan switches."
  - "Multi-currency support."
```

## What the check reports

```
# CoFounder Check
Verdict: READY

Tier 1 findings (block PR): none
Tier 2 findings (strongly recommended): none
Tier 3 findings (suggestions): suppressed

What I verified:
- No secrets in diff
- typecheck PASS
- test PASS (3 new tests, all passing)
- Scope respected (all changes within annual-upgrade.spec.yml#affectedPaths)
- No raw hex colors
- No mock data added to production code paths
```

## Why this example matters

You can build this feature with any AI coding tool. The point of this example is **what each tool would have done that this tool wouldn't**:

- A naked agent might add a *new* `BillingPage` component instead of extending the existing one. Pattern-scout caught it.
- A naked agent might commit a Stripe key to test the flow. The PreToolUse hook caught it.
- A naked agent might "implement" the feature with mock data that ships to prod. The check caught it.

The fix isn't smarter agents. It's a flow that's hard to bypass.
