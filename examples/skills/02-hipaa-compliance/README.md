# Example 02 — HIPAA compliance frame

A minimal patient-portal feature reframed against HIPAA *before* code is written, using **`cofounder-compliance-frame`**.

## The setup

You're adding a feature: "Show the user's recent lab results next to their billing summary."

Sounds reasonable. It's also an instant HIPAA finding waiting to happen. This example demonstrates how `cofounder-compliance-frame` catches that *at the spec stage*, not at audit.

## Prereqs

```bash
npm install
```

Make sure `.aicofounder.yml` declares the active compliance frameworks (see below).

## Run

In Claude Code:

```
/spec Show the user's recent lab results in a panel next to their billing summary on the patient portal.
```

`cofounder-feature-new` will write `specs/lab-results-panel.spec.yml`. So far this looks normal.

Then run:

```
Apply the HIPAA + GDPR compliance frame to specs/lab-results-panel.spec.yml.
```

`cofounder-compliance-frame` activates and produces the report below.

## What the frame surfaces

```markdown
# Compliance Frame: lab-results-panel

Frameworks applied: HIPAA, GDPR
Spec: specs/lab-results-panel.spec.yml

## Findings

### 1. PHI exposure risk — co-locating clinical data with billing
Co-rendering lab results next to billing creates a wider authorization scope
than necessary.

HIPAA "minimum necessary" (§164.502(b)) requires you only expose what's
needed for the disclosed purpose. Billing display does not need lab data.

Reframe: separate components, separate access policies. The billing card
must not be able to see the lab data prop.

### 2. Audit log — every PHI read must be logged
acceptanceCriteria[1] doesn't mention logging. Every render of the lab panel
must call auditLog() with actor, resource, action, reason.

### 3. Consent — GDPR Art. 6 lawful basis
For the EU patient subset, "treatment" is a valid lawful basis but only if
the requesting user has a treatment relationship. Do not show this panel
to non-treating users — flag with consent.canSeeLabs.

## Scope changes required (prerequisites)

- [ ] BAA with the lab data provider verified.
- [ ] Audit log entry on every panel render (HIPAA §164.312(b)).
- [ ] User-facing data export endpoint covers lab results (GDPR Art. 20).
- [ ] Lab panel component is in a separate React tree from billing.

## Recommended VibeSpec additions

\`\`\`yaml
vibe:
  compliance:
    frameworks: [hipaa, gdpr]
    requireAuditLog: true
    forbidPhiInLogs: true
    minimumNecessary:
      enforce: true
      separateComponentTrees: true
\`\`\`

## What this skill did NOT do

- Did not write code.
- Did not modify the spec — proposed changes for the user to apply.
- Did not run the policy engine — that happens at \`aicofounder check\` time.
```

## What changes in the spec after the frame

The original spec said:
```yaml
affectedPaths:
  - "components/PatientDashboard.tsx"  # bad: one component for billing + labs
```

The frame's recommended rewrite:
```yaml
affectedPaths:
  - "components/billing/BillingCard.tsx"      # billing only
  - "components/labs/LabResultsPanel.tsx"      # labs only, gated
  - "lib/audit/log.ts"                          # audit logger
  - "lib/auth/consent.ts"                       # canSeeLabs check
```

Now `cofounder-feature-implement` will write code that respects the partition.

## Why this example matters

**The compliance frame works at the spec stage, not at the linting stage.** Most "HIPAA tools" find violations *after* code is written. By then, restructuring is expensive. This skill catches it when the cost is rewriting two YAML lines.

This is the depth-not-breadth differentiator: every parity skill in the library can route through this frame because every skill knows its own sensitivity. Compliance is a property of the runtime, not a separate scanner.
