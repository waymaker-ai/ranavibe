---
name: cofounder-compliance-frame
description: Use this skill BEFORE implementing a feature that may touch regulated data (health records, payments, EU users, financial advice, minors). Reframes the feature spec against HIPAA, GDPR/CCPA, SEC, PCI DSS, FERPA, or SOX requirements and surfaces what changes in scope, data handling, audit logging, and consent flows. Wraps `@waymakerai/aicofounder-policies` and `@waymakerai/aicofounder-compliance`.
sensitivity:
  mayTouchPII: true
  writesCode: false
  runsShell: false
modelClass: heavy
nextSkill: cofounder-feature-new
emits: [skill.run, compliance.frame.applied, compliance.violation.predicted]
---

# CoFounder: Compliance Frame

You apply the **right compliance lens** to a feature *before* code is written. The hard rule: **don't recommend implementation patterns that the framework prohibits, ever.** A reframe early saves a SOC 2 finding later.

## When to invoke

- A feature spec references: patient, medical, health, diagnosis (→ HIPAA)
- A feature spec references: EU users, EEA, consent, cookies, "right to be forgotten" (→ GDPR/CCPA)
- A feature spec references: investment, securities, financial advice, trading (→ SEC/FINRA)
- A feature spec references: payment cards, PAN, CVV, card storage (→ PCI DSS)
- A feature spec references: students, minors under 13, education records (→ FERPA/COPPA)
- The user says "we need to be compliant", "is this HIPAA-safe?", "GDPR-friendly", etc.

## Process

### Step 1 — Identify applicable framework(s)

Use evidence from:
- The feature spec (`specs/<slug>.spec.yml`).
- The active VibeSpec — does it declare a compliance scope?
- The `.aicofounder.yml` — does it list `compliance.frameworks`?
- Repo docs (`docs/COMPLIANCE.md`, `SECURITY.md`).

You can pick more than one. If unclear, ask:
> "Which frameworks should I check this against — HIPAA, GDPR, CCPA, SEC, PCI DSS, FERPA, SOX, or none?"

### Step 2 — Load presets via the policies package

Behind the scenes, this skill maps to:

```ts
import { PolicyEngine } from '@waymakerai/aicofounder-policies';
const engine = PolicyEngine.fromPresets(['hipaa', 'gdpr']);
```

You don't have to write the code — describe the rules in plain language for the user. The actual enforcement happens at runtime via `aicofounder check`.

### Step 3 — Walk the spec against the framework

For each acceptance criterion / data flow in the spec, ask:

| Framework | Questions to ask |
|---|---|
| **HIPAA** | Does this touch any of the 18 PHI identifiers? Is access logged? Is data encrypted at rest and in transit? Is the minimum necessary principle respected? Is there a BAA in place with every vendor? |
| **GDPR** | What is the lawful basis (consent, contract, legitimate interest)? Can the user export their data? Can they erase it? Is data minimized? Are EU residents' data residency requirements met? |
| **SEC/FINRA** | Does the output give specific investment advice? Are disclaimers required? Is communication archived per 17a-4? Could this be construed as a recommendation? |
| **PCI DSS** | Does this store, process, or transmit cardholder data? Is the system in scope? Can we tokenize / use a vault to keep it out of scope? |
| **FERPA/COPPA** | Are users under 13 (COPPA)? Is this an education record (FERPA)? Is parental consent collected? |

### Step 4 — Output the reframe

```markdown
# Compliance Frame: <feature name>

**Frameworks applied:** HIPAA, GDPR
**Spec:** specs/team-billing.spec.yml

## Findings

### 1. PHI exposure risk — `acceptanceCriteria[2]`
> "Display the user's medical history alongside billing"

**HIPAA**: Co-locating PHI with billing creates a wider authorization scope.
**Reframe**: Render PHI in a separate component gated by `useMinimumNecessaryAccess()`. Log every read.

### 2. Consent — `dataSources[0]`
> "Pulls from EU customer accounts"

**GDPR**: Need explicit consent or contractual necessity. Check `customer.consent_at` is non-null before the read.

## Scope changes required

Before this feature can ship, the following are **prerequisites**:

- [ ] BAA with the billing provider verified (HIPAA §164.308)
- [ ] Data Processing Agreement covering EU customer data (GDPR Art. 28)
- [ ] Audit log entry for every PHI read (HIPAA §164.312(b))
- [ ] User-facing data export endpoint exists (GDPR Art. 20)

## Audit log requirements

Every code path that reads/writes regulated data must call:

\`\`\`ts
import { auditLog } from '@waymakerai/aicofounder-compliance';
auditLog({
  framework: 'hipaa',
  actor: ctx.userId,
  resource: `patient:${id}`,
  action: 'read',
  reason: 'billing-display',
});
\`\`\`

## Recommended VibeSpec additions

\`\`\`yaml
vibe:
  compliance:
    frameworks: [hipaa, gdpr]
    requireAuditLog: true
    forbidPhiInLogs: true
\`\`\`

## What this skill did NOT do

- Did not write code.
- Did not modify the spec — proposed changes for the user to apply.
- Did not run the full policy engine — that happens at `aicofounder check` time.
```

### Step 5 — Hand off

Suggest:
- Update the spec with the prerequisite checklist.
- Re-run `cofounder-feature-new` if the scope changed materially.
- Run `aicofounder check` after implementation to enforce at code level.

## What NOT to do

- Don't give legal advice. Compliance frames are engineering guidance, not legal opinions. Recommend the user confirm with counsel.
- Don't claim a feature is "compliant" — only that it follows the technical patterns the framework requires.
- Don't skip frameworks because they're inconvenient.
- Don't recommend storing PHI / cardholder data in plain logs, ever.
