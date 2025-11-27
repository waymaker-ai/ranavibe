# RANA Prompt Library & Task Chain Planning

**Purpose:** Comprehensive prompt templates and task chains for AI-assisted development with RANA quality gates.

---

## Table of Contents

1. [Prompt Engineering Principles](#prompt-engineering-principles)
2. [Task Chain Framework](#task-chain-framework)
3. [Context Management](#context-management)
4. [Quality Gate Prompts](#quality-gate-prompts)
5. [REPM Validation Prompts](#repm-validation-prompts)
6. [Feature Implementation Chains](#feature-implementation-chains)
7. [Emergency Response Chains](#emergency-response-chains)

---

## Prompt Engineering Principles

### The RANA Prompt Formula

Every RANA prompt follows this structure:

```
[CONTEXT] + [CONSTRAINTS] + [TASK] + [VALIDATION] + [OUTPUT FORMAT]
```

**Example:**
```markdown
CONTEXT: I'm working on a React TypeScript SaaS app with Supabase backend.
CONSTRAINTS: Follow .rana.yml quality gates. Use existing design system components. No mock data.
TASK: Add user profile editing feature.
VALIDATION: Search for existing patterns first. Run all quality gate checks.
OUTPUT FORMAT: Show code with file paths, validation checklist, and deployment plan.
```

### Quality-First Prompting

**❌ Bad prompt:**
```
"Add a login page"
```

**✅ Good RANA prompt:**
```
"Follow the RANA framework in .rana.yml to add a login page.

Pre-implementation checklist:
1. Search codebase for existing auth components
2. Review authentication patterns in services/
3. Identify design system components to use
4. Check if AuthContext already exists

Implementation requirements:
- Use existing auth service patterns
- Import GlassCard, GradientButton from design system
- Add loading states and error handling
- Support dark mode
- Make mobile responsive

Post-implementation:
- Test manually with real auth
- Deploy to Vercel
- Verify in production
- Document any new patterns"
```

---

## Task Chain Framework

### Chain Definition Structure

```yaml
task_chain:
  name: "Feature Implementation Chain"
  description: "Complete workflow for implementing a new feature"
  phases:
    - pre_implementation
    - implementation
    - testing
    - deployment
    - verification

  pre_implementation:
    prompts:
      - search_existing
      - review_architecture
      - validate_strategy  # If major feature

    validations:
      - existing_patterns_found
      - design_system_reviewed
      - repm_completed  # If major feature

    outputs:
      - implementation_plan
      - reused_patterns_list
      - new_patterns_needed

  implementation:
    prompts:
      - implement_feature
      - add_error_handling
      - add_loading_states
      - ensure_dark_mode

    validations:
      - typescript_strict
      - no_mock_data
      - design_system_used
      - real_api_integration

    outputs:
      - code_changes
      - new_components
      - api_integrations

  testing:
    prompts:
      - manual_test
      - edge_case_test
      - cross_browser_test

    validations:
      - all_flows_tested
      - errors_handled
      - empty_states_work

    outputs:
      - test_results
      - bugs_found
      - fixes_applied

  deployment:
    prompts:
      - create_migration
      - commit_code
      - deploy_frontend
      - deploy_backend

    validations:
      - migration_tested
      - code_committed
      - deployed_successfully

    outputs:
      - migration_files
      - commit_sha
      - deployment_urls

  verification:
    prompts:
      - verify_production
      - test_real_users
      - monitor_errors

    validations:
      - production_works
      - no_breaking_changes
      - rollback_plan_exists

    outputs:
      - verification_report
      - production_url
      - monitoring_setup
```

---

## Context Management

### Essential Context (Always Include)

```markdown
## Project Context
- App type: [SaaS/API/Website/etc]
- Tech stack: [Frontend/Backend/Database]
- Scale: [pages, services, users]
- Status: [Development/Production/Both]

## RANA Configuration
- Location: .rana.yml
- Quality gates: [list enabled gates]
- Major features: [list triggers]

## Current State
- Working on: [feature name]
- Phase: [pre_implementation/implementation/testing/deployment]
- Files modified: [list files]
```

### Phase-Specific Context

**Pre-Implementation:**
```markdown
## Search Results
- Existing patterns: [list found patterns]
- Reusable components: [list components]
- Similar features: [list similar code]

## Architecture Review
- Services to use: [list services]
- Components to import: [list components]
- APIs to call: [list endpoints]
```

**Implementation:**
```markdown
## Current Implementation
- Files created: [list new files]
- Files modified: [list changed files]
- Dependencies added: [list new deps]

## Design System Usage
- Components imported: [list components]
- Style tokens used: [list tokens]
- Patterns followed: [list patterns]
```

**Testing:**
```markdown
## Test Scenarios
- Happy path: [describe]
- Error cases: [list errors]
- Edge cases: [list edge cases]
- Browser testing: [list browsers]

## Test Results
- Passed: [list passed tests]
- Failed: [list failures]
- Bugs found: [describe bugs]
```

**Deployment:**
```markdown
## Deployment Status
- Migration: [created/tested/deployed]
- Frontend: [deployed URL]
- Backend: [deployed URL]
- Database: [migration status]

## Verification
- Production tested: [yes/no]
- Breaking changes: [none/list]
- Rollback plan: [describe]
```

---

## Quality Gate Prompts

### Pre-Implementation Phase

#### 1. Search for Existing Implementations

```markdown
**Prompt:**
I need to implement [FEATURE]. Before I start, help me search the codebase for existing implementations.

Please:
1. Search for similar features or patterns
2. Identify reusable services and components
3. Find API endpoints I can use
4. Locate design system components I should import
5. Check for any existing state management patterns

Project structure:
- Services: frontend/src/services/
- Components: frontend/src/components/
- Pages: frontend/src/pages/
- API: backend/api/

Search for: [KEYWORDS]

Output the results as:
- Existing patterns: [list]
- Reusable components: [list]
- Services to use: [list]
- New code needed: [estimate]
```

#### 2. Review Relevant Documentation

```markdown
**Prompt:**
I'm implementing [FEATURE]. Help me review relevant documentation.

Please check:
1. docs/ directory for feature guides
2. .rana.yml for quality gates and patterns
3. docs/DESIGN_SYSTEM_PROMPT.md for UI guidelines
4. docs/REVERSE_ENGINEERING_PRODUCT_METHODOLOGY.md (if major feature)

Questions:
- Is this a major feature? (new revenue stream, product, pricing, market segment)
- If yes: Do we need REPM validation first?
- What quality gates apply?
- What design patterns should I follow?

Output:
- Major feature: [yes/no]
- REPM required: [yes/no]
- Quality gates: [list applicable gates]
- Documentation reviewed: [list docs]
- Patterns to follow: [list patterns]
```

#### 3. Validate Major Feature Strategy (REPM)

```markdown
**Prompt:**
I want to implement [FEATURE]. This is a MAJOR FEATURE because [REASON].

Before implementation, let's validate the strategy using REPM (Reverse Engineering Product Methodology).

Guide me through the 7 phases:

**Phase 1: Desired Outcome**
- What does success look like?
- What metrics matter?
- What problem is solved?

**Phase 2: Monetization**
- What's the pricing model?
- What are unit economics (CAC, LTV)?
- Path to profitability?

**Phase 3: Go-to-Market**
- Who is the target customer?
- How do we reach them?
- What channels work best?

**Phase 4: User Experience**
- What's the user journey?
- Where's the "aha moment"?
- How do we activate users?

**Phase 5: Product Design**
- What features are MVP?
- What features are V1.1/V2?
- What can we punt?

**Phase 6: Build Plan**
- What's the tech stack?
- How long to build?
- What dependencies exist?

**Phase 7: Idea Validation**
- GO or NO-GO decision?
- What's the evidence?
- What are the risks?

After completing all 7 phases, give me:
- GO/NO-GO recommendation
- Implementation plan (if GO)
- Timeline estimate
- Resource requirements
```

---

### Implementation Phase

#### 4. Implement Feature with Quality Gates

```markdown
**Prompt:**
Implement [FEATURE] following RANA quality gates from .rana.yml.

**Pre-implementation completed:**
- ✅ Searched existing patterns: [list patterns found]
- ✅ Reviewed documentation: [list docs]
- ✅ REPM validation: [GO/NO-GO] (if major feature)

**Implementation requirements:**

TypeScript:
- ✅ Strict mode compliance
- ✅ No 'any' types
- ✅ Explicit interfaces
- ✅ Type-safe API calls

Design System:
- ✅ Use GlassCard for containers
- ✅ Use GradientButton for CTAs
- ✅ Use design system colors/gradients
- ✅ Support dark mode

Error Handling:
- ✅ Try-catch all async operations
- ✅ User-friendly error messages
- ✅ Error state UI
- ✅ Fallback behavior

Loading States:
- ✅ Loading indicators for async operations
- ✅ Skeleton screens where appropriate
- ✅ Disabled state for actions

Real Data:
- ✅ No mock data
- ✅ Real API integration
- ✅ Real database queries
- ✅ Error handling for API failures

Responsive:
- ✅ Mobile responsive
- ✅ Tablet responsive
- ✅ Desktop responsive

Implementation plan:
1. [Step 1]
2. [Step 2]
3. [Step 3]

For each step, show:
- File path and line numbers
- Code to add/modify
- Why this approach
- Quality gates satisfied
```

#### 5. Add Error Handling

```markdown
**Prompt:**
Review [FEATURE] implementation and ensure comprehensive error handling.

Check for:
1. **API Errors**
   - Network failures
   - 400/401/403/404/500 responses
   - Timeout errors
   - Rate limiting

2. **Data Validation Errors**
   - Invalid input
   - Missing required fields
   - Type mismatches
   - Constraint violations

3. **State Errors**
   - Race conditions
   - Stale data
   - Concurrent modifications
   - Optimistic update failures

4. **User-Facing Errors**
   - Clear error messages (no tech jargon)
   - Actionable next steps
   - Error recovery options
   - Contact support links

For each error type found:
- File: [path]
- Line: [number]
- Issue: [description]
- Fix: [code to add]
- User message: [what user sees]
```

#### 6. Add Loading States

```markdown
**Prompt:**
Review [FEATURE] and ensure proper loading states everywhere.

Check for:
1. **Initial Load**
   - Page/component first render
   - Data fetching
   - Skeleton screens

2. **User Actions**
   - Button clicks
   - Form submissions
   - File uploads
   - Bulk operations

3. **Background Operations**
   - Auto-save
   - Polling
   - Sync operations

For each async operation:
- Location: [file:line]
- Operation: [description]
- Loading state: [yes/no]
- Indicator type: [spinner/skeleton/progress/disabled]
- Code to add: [if missing]

Loading state patterns:
- Use `isLoading` boolean state
- Disable buttons during loading
- Show spinner or skeleton
- Prevent double-submission
```

---

### Testing Phase

#### 7. Manual Testing Checklist

```markdown
**Prompt:**
Guide me through manual testing of [FEATURE].

**Test Scenarios:**

1. **Happy Path**
   - [ ] User can [primary action]
   - [ ] Data saves correctly
   - [ ] UI updates appropriately
   - [ ] Success message shows

2. **Error Scenarios**
   - [ ] Invalid input rejected with clear message
   - [ ] Network error handled gracefully
   - [ ] API error shows user-friendly message
   - [ ] Can recover from error state

3. **Edge Cases**
   - [ ] Empty state displays correctly
   - [ ] Very long text doesn't break UI
   - [ ] Special characters handled
   - [ ] Concurrent operations work

4. **Loading States**
   - [ ] Loading indicator shows during operations
   - [ ] Buttons disabled during loading
   - [ ] Can't double-submit
   - [ ] Loading doesn't freeze UI

5. **Dark Mode**
   - [ ] Switch to dark mode - everything visible
   - [ ] All colors have dark variants
   - [ ] No white backgrounds in dark mode
   - [ ] Gradients work in both modes

6. **Responsive**
   - [ ] Mobile (375px): Layout works
   - [ ] Tablet (768px): Layout works
   - [ ] Desktop (1440px): Layout works
   - [ ] No horizontal scroll

For each test:
- Status: [Pass/Fail]
- If Fail: [Description of issue]
- Screenshot: [if needed]
```

#### 8. Edge Case Testing

```markdown
**Prompt:**
Test edge cases for [FEATURE].

**Edge Cases to Test:**

1. **Data Edge Cases**
   - [ ] Empty data
   - [ ] Null/undefined values
   - [ ] Very large datasets (100+ items)
   - [ ] Very long strings (1000+ chars)
   - [ ] Special characters: <>'"&
   - [ ] Unicode characters: 你好, مرحبا, 🎉
   - [ ] HTML injection attempts
   - [ ] SQL injection attempts

2. **State Edge Cases**
   - [ ] Rapid clicking (double/triple submit)
   - [ ] Navigating away during operation
   - [ ] Browser back button
   - [ ] Browser refresh during operation
   - [ ] Multiple tabs open

3. **Network Edge Cases**
   - [ ] Slow network (throttle to 3G)
   - [ ] Offline mode
   - [ ] Network disconnects mid-operation
   - [ ] Timeout (30+ seconds)
   - [ ] Rate limiting response

4. **Permission Edge Cases**
   - [ ] Logged out user
   - [ ] Insufficient permissions
   - [ ] Token expired during operation
   - [ ] Account suspended

For each edge case:
- Test: [description]
- Result: [Pass/Fail]
- Issue: [if failed]
- Fix needed: [yes/no]
```

---

### Deployment Phase

#### 9. Create Database Migration

```markdown
**Prompt:**
[FEATURE] requires database changes. Create a migration following RANA deployment patterns.

**Schema Changes:**
- Tables: [new tables]
- Columns: [new columns]
- Indexes: [new indexes]
- Constraints: [new constraints]

**Migration Checklist:**

1. **Create Migration File**
   - [ ] File: backend/migrations/YYYYMMDD_HHMMSS_feature_name.sql
   - [ ] Includes UP migration (apply changes)
   - [ ] Includes DOWN migration (rollback)
   - [ ] Tested on local database

2. **Migration Safety**
   - [ ] No data loss
   - [ ] Backwards compatible (if possible)
   - [ ] Includes rollback plan
   - [ ] Estimated execution time: [time]

3. **Testing**
   - [ ] Run on local DB
   - [ ] Verify UP migration
   - [ ] Verify DOWN migration (rollback)
   - [ ] Check data integrity
   - [ ] Test with existing data

4. **Documentation**
   - [ ] Comment in migration file
   - [ ] Note breaking changes
   - [ ] Update schema docs

Generate:
- Migration file content
- Rollback plan
- Testing instructions
```

#### 10. Deploy to Production

```markdown
**Prompt:**
Deploy [FEATURE] to production following RANA deployment process.

**Pre-Deployment Checklist:**
- [ ] All quality gates passed
- [ ] Manual testing complete
- [ ] Edge cases tested
- [ ] Migration created (if needed)
- [ ] Migration tested locally
- [ ] Code committed to git
- [ ] Rollback plan documented

**Deployment Steps:**

1. **Database Migration** (if needed)
   ```bash
   # Connect to production DB
   PGPASSWORD=$PROD_PASSWORD psql -h $PROD_HOST -U postgres -d postgres

   # Run migration
   \i backend/migrations/YYYYMMDD_feature_name.sql

   # Verify
   SELECT * FROM [table] LIMIT 5;
   ```

2. **Backend Deployment**
   ```bash
   # Railway auto-deploys from main branch
   git push origin main

   # Monitor logs
   railway logs --tail
   ```

3. **Frontend Deployment**
   ```bash
   # Vercel auto-deploys from main branch
   # Or manual: cd frontend && vercel --prod

   # Wait for deployment
   # Verify: https://[your-domain].com
   ```

4. **Post-Deployment Verification**
   - [ ] Visit production URL
   - [ ] Test feature works
   - [ ] Check no breaking changes
   - [ ] Monitor error logs
   - [ ] Verify database migration applied

Execute each step and report:
- Step: [name]
- Status: [success/failed]
- Output: [relevant output]
- Issues: [if any]
```

---

### Verification Phase

#### 11. Production Verification

```markdown
**Prompt:**
Verify [FEATURE] works in production.

**Verification Checklist:**

1. **Functional Testing**
   - [ ] Feature loads on production URL
   - [ ] Happy path works
   - [ ] Data saves to production DB
   - [ ] UI displays correctly
   - [ ] No console errors

2. **Integration Testing**
   - [ ] API endpoints respond
   - [ ] Database queries work
   - [ ] Third-party integrations work
   - [ ] Authentication works
   - [ ] Authorization works

3. **Performance Testing**
   - [ ] Page load time < 3 seconds
   - [ ] API response time < 500ms
   - [ ] No memory leaks
   - [ ] No excessive re-renders

4. **Cross-Browser Testing**
   - [ ] Chrome: Works
   - [ ] Firefox: Works
   - [ ] Safari: Works
   - [ ] Mobile Safari: Works
   - [ ] Chrome Mobile: Works

5. **Error Monitoring**
   - [ ] Check Sentry for errors
   - [ ] Check Railway logs
   - [ ] Check Vercel logs
   - [ ] No new errors related to feature

**Rollback Plan:**
If something breaks:
1. Revert code: `git revert [commit-sha]`
2. Rollback migration: Run DOWN migration
3. Redeploy: `git push origin main`
4. Verify rollback worked
5. Fix issues locally
6. Redeploy when ready

Verification Status:
- Production URL: [url]
- Works: [yes/no]
- Issues: [list]
- Rollback needed: [yes/no]
```

---

## REPM Validation Prompts

### Complete REPM Validation Chain

```markdown
**Task Chain: Major Feature Validation**

This is a MAJOR FEATURE. Let's validate it through all 7 REPM phases before implementation.

---

### Phase 1: Define Desired Outcome

**Prompt:**
What does success look like for [FEATURE]?

Answer these:
1. What's the 1-year outcome?
2. What's the 3-year outcome?
3. What metrics matter most?
4. What problem is permanently solved?

Template:
```
## Desired Outcome (3 years)

### Business Metrics:
- Revenue: $[amount] ARR
- Users: [number] paying customers
- Market position: [position] in [category]

### Impact Metrics:
- Problem solved: [specific problem]
- Lives improved: [number] users × [improvement]
- Industry change: [what's different]

### Personal Metrics:
- Time commitment: [hours/week]
- Team size: [number] people
- Lifestyle: [work/life balance]

### Success Statement:
"We are successful when [specific, measurable outcome]"
```

Output:
- Desired outcome documented
- Success metrics defined
- Go to Phase 2

---

### Phase 2: Validate Monetization

**Prompt:**
How does [FEATURE] make money?

Answer these:
1. What's the pricing model?
2. What are the unit economics?
3. What's the path to profitability?
4. What's the revenue potential?

Template:
```
## Monetization Model

### Pricing:
- Tier 1: $[price]/month - [features]
- Tier 2: $[price]/month - [features]
- Tier 3: $[price]/month - [features]

### Unit Economics:
- CAC (Customer Acquisition Cost): $[amount]
- LTV (Lifetime Value): $[amount]
- LTV:CAC Ratio: [ratio] (target: >3:1)
- Payback Period: [months] (target: <12)
- Gross Margin: [%] (target: >70%)

### Revenue Projections:
- Year 1: [customers] × $[price] = $[ARR]
- Year 2: [customers] × $[price] = $[ARR]
- Year 3: [customers] × $[price] = $[ARR]

### Willingness to Pay:
- Pain point value: $[amount] problem costs
- Alternative cost: $[amount] they pay now
- Value delivered: $[amount] we create
- Pricing position: [% of value]
```

Validation Questions:
- Does LTV:CAC > 3:1? [yes/no]
- Can we reach profitability? [yes/no]
- Is pricing validated? [yes/no]

Output:
- Monetization model documented
- Unit economics validated
- Go to Phase 3 OR NO-GO

---

### Phase 3: Design Go-to-Market

**Prompt:**
How do we bring [FEATURE] to market?

Answer these:
1. Who is the target customer?
2. Where do they hang out?
3. How do we reach them?
4. What channels work best?

Template:
```
## Go-to-Market Strategy

### Target Customer:
- Role: [job title]
- Company: [size, industry]
- Pain: [specific problem]
- Budget: $[amount]
- Decision maker: [yes/no]

### Distribution Channels (Priority Order):
1. **[Channel 1]**
   - Cost: $[amount] or [time]
   - Reach: [number] people
   - Conversion: [%]
   - Timeline: [timeframe]

2. **[Channel 2]**
   - Cost: $[amount] or [time]
   - Reach: [number] people
   - Conversion: [%]
   - Timeline: [timeframe]

### Content Strategy:
- Pillar 1: [topic] - [content types]
- Pillar 2: [topic] - [content types]
- Pillar 3: [topic] - [content types]

### Launch Plan:
- Week 1: [activities]
- Week 2: [activities]
- Week 3-4: [activities]
```

Validation Questions:
- Can we reach target customers? [yes/no]
- Are channels proven/testable? [yes/no]
- Is CAC achievable? [yes/no]

Output:
- GTM strategy documented
- Channels prioritized
- Go to Phase 4 OR NO-GO

---

### Phase 4: Map User Experience

**Prompt:**
What's the user journey for [FEATURE]?

Answer these:
1. How do they discover it?
2. What's the activation flow?
3. Where's the "aha moment"?
4. How do we retain them?

Template:
```
## User Experience Journey

### Discovery:
1. [Touchpoint 1] → [Action] → [Outcome]
2. [Touchpoint 2] → [Action] → [Outcome]

### First Impression:
- Headline: [what they see]
- Value prop: [one sentence]
- CTA: [call to action]

### Activation (First Use):
1. **Step 1:** [action]
   - What they do: [description]
   - Time to value: [minutes]

2. **Step 2:** [action]
   - What they see: [description]
   - Win moment: [specific moment]

3. **Step 3:** [action]
   - What they get: [description]
   - Aha moment: [realization]

Time to Aha: [X] minutes

### Engagement:
- Daily: [what they do]
- Weekly: [what they do]
- Monthly: [what they do]

### Retention:
- Week 1: [key actions]
- Month 1: [key actions]
- Month 3: [key actions]
```

Validation Questions:
- Is time to "aha" < 15 minutes? [yes/no]
- Are engagement hooks clear? [yes/no]
- Is retention strategy defined? [yes/no]

Output:
- User journey mapped
- Activation flow defined
- Go to Phase 5 OR NO-GO

---

### Phase 5: Design Product

**Prompt:**
What do we actually build for [FEATURE]?

Answer these:
1. What's the MVP?
2. What features are P0/P1/P2?
3. What can we punt to V2?
4. What's the scope?

Template:
```
## Product Design

### Core Value Proposition:
"[Product] helps [user] [achieve outcome] by [unique approach]"

### Feature Priority:

**MVP (Must Have) - Week 1-4:**
| Feature | User Value | Build Cost | Priority |
|---------|-----------|-----------|----------|
| [Feature 1] | High | Low | P0 |
| [Feature 2] | High | Medium | P0 |

**V1.1 (Should Have) - Month 2:**
| Feature | User Value | Build Cost | Priority |
|---------|-----------|-----------|----------|
| [Feature 3] | High | High | P1 |
| [Feature 4] | Medium | Low | P1 |

**V2 (Could Have) - Month 3+:**
| Feature | User Value | Build Cost | Priority |
|---------|-----------|-----------|----------|
| [Feature 5] | Medium | Medium | P2 |

**Won't Have (Yet):**
| Feature | Why Not | Revisit When |
|---------|---------|--------------|
| [Feature 6] | [Reason] | [Condition] |

### User Flows:
**Flow 1: [Core Action]**
```
[Step 1] → [Step 2] → [Step 3] → [Success]
```
```

Validation Questions:
- Is MVP clearly defined? [yes/no]
- Can MVP ship in 4 weeks? [yes/no]
- Does MVP solve core problem? [yes/no]

Output:
- Product spec created
- Features prioritized
- Go to Phase 6 OR NO-GO

---

### Phase 6: Plan Build

**Prompt:**
How do we build [FEATURE]?

Answer these:
1. What's the tech stack?
2. How long to build?
3. What dependencies exist?
4. What resources needed?

Template:
```
## Build Plan

### Tech Stack:
**Frontend:**
- Framework: [choice] - Why: [reasoning]
- Styling: [choice] - Why: [reasoning]
- State: [choice] - Why: [reasoning]

**Backend:**
- Framework: [choice] - Why: [reasoning]
- Database: [choice] - Why: [reasoning]
- Hosting: [choice] - Why: [reasoning]

### Build Phases:

**Phase 1: Foundation (Week 1-2)**
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

**Phase 2: Core Features (Week 3-4)**
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

**Phase 3: Polish (Week 5-6)**
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

### Timeline:
- Build time: [X] weeks
- Resources: [people/budget]
- Launch date: [date]
```

Validation Questions:
- Can we build this with current resources? [yes/no]
- Is timeline realistic? [yes/no]
- Are dependencies manageable? [yes/no]

Output:
- Build plan documented
- Timeline estimated
- Go to Phase 7 for final decision

---

### Phase 7: Validate Idea (GO/NO-GO)

**Prompt:**
Final validation: Should we build [FEATURE]?

Review all phases:
- ✅ Phase 1: Desired outcome defined
- ✅ Phase 2: Monetization validated
- ✅ Phase 3: GTM strategy clear
- ✅ Phase 4: UX journey mapped
- ✅ Phase 5: Product scoped
- ✅ Phase 6: Build plan ready

**GO/NO-GO Decision:**

### Market Validation:
- [ ] Problem exists (evidence: [source])
- [ ] Market size sufficient ([number] customers)
- [ ] Willingness to pay validated ([evidence])
- [ ] Differentiation clear ([unique value])

### Business Validation:
- [ ] Path to profitability realistic
- [ ] Unit economics work (LTV:CAC > 3:1)
- [ ] Capital requirements manageable
- [ ] Exit strategy exists

### Execution Validation:
- [ ] We can build this (skills/time)
- [ ] We can market this (channels/audience)
- [ ] We can sell this (pricing/process)
- [ ] We can support this (support strategy)

### Personal Validation:
- [ ] We're passionate about this
- [ ] Fits our lifestyle goals
- [ ] Aligns with our skills
- [ ] Worth 2-5 years of effort

**Decision Matrix:**
| Criteria | Score (1-5) | Weight | Weighted Score |
|----------|-------------|---------|----------------|
| Market opportunity | [score] | 25% | [weighted] |
| Business viability | [score] | 30% | [weighted] |
| Execution feasibility | [score] | 25% | [weighted] |
| Personal alignment | [score] | 20% | [weighted] |
| **TOTAL** | | **100%** | **[total]** |

**Decision:**
- Total Score: [X]/5
- ✅ **GO** if score > 3.5
- ⚠️  **MAYBE** if score 2.5-3.5 (need more validation)
- ❌ **NO-GO** if score < 2.5

**Recommendation:** [GO/MAYBE/NO-GO]

**Reasoning:**
[Explain decision based on scores and validation]

**Next Steps:**
If GO: Proceed to implementation using RANA quality gates
If MAYBE: [What additional validation needed]
If NO-GO: [What alternative to explore]
```

---

## Feature Implementation Chains

### Chain 1: Simple Feature (No REPM Required)

```markdown
**Feature:** [Feature name]
**Type:** Minor enhancement
**Estimated time:** 2-4 hours

**Chain:**
1. Search existing → 2. Implement → 3. Test → 4. Deploy → 5. Verify

**Prompts:**

1. **Search** (5 min)
   "Search codebase for patterns similar to [feature]. List reusable components."

2. **Implement** (1-2 hours)
   "Implement [feature] using RANA gates. Use [components found]. Add error handling, loading states, dark mode support."

3. **Test** (30 min)
   "Test [feature]: happy path, error cases, dark mode, mobile. Report results."

4. **Deploy** (15 min)
   "Commit code, deploy to Vercel/Railway, check deployment succeeded."

5. **Verify** (15 min)
   "Verify [feature] works in production. Test real user flow. Check for errors."

**Success criteria:**
- ✅ Feature works in production
- ✅ No breaking changes
- ✅ All quality gates passed
```

### Chain 2: Major Feature (REPM Required)

```markdown
**Feature:** [Feature name]
**Type:** Major (new revenue stream/product/pricing/market)
**Estimated time:** 2-4 weeks

**Chain:**
1. REPM Validation → 2. Implementation Plan → 3. Implement → 4. Test → 5. Deploy → 6. Verify → 7. Monitor

**Prompts:**

1. **REPM Validation** (4-8 hours)
   "This is a major feature. Run complete REPM validation (7 phases). Document GO/NO-GO decision."
   [Use all REPM prompts from above]

2. **Implementation Plan** (1-2 hours)
   "Create detailed implementation plan for [feature]. Break into milestones. Identify dependencies."

3. **Implement** (1-3 weeks)
   "Implement [feature] following RANA gates and implementation plan. Report progress daily."

4. **Test** (2-3 days)
   "Comprehensive testing: functional, edge cases, performance, security, cross-browser."

5. **Deploy** (1 day)
   "Deploy with migration, rollback plan, monitoring. Staged rollout if high-risk."

6. **Verify** (1 day)
   "Verify in production. Test with real users. Monitor errors 24 hours."

7. **Monitor** (1 week)
   "Monitor metrics, errors, user feedback. Iterate based on data."

**Success criteria:**
- ✅ REPM validation completed (GO decision)
- ✅ Feature achieves desired outcome
- ✅ Monetization working as planned
- ✅ Users activated successfully
- ✅ All quality gates passed
```

### Chain 3: Bug Fix

```markdown
**Bug:** [Bug description]
**Severity:** [Critical/High/Medium/Low]
**Estimated time:** 30 min - 2 hours

**Chain:**
1. Reproduce → 2. Identify Root Cause → 3. Fix → 4. Test → 5. Deploy → 6. Verify

**Prompts:**

1. **Reproduce** (10 min)
   "Help me reproduce [bug]. What steps? What error occurs? Can I see it consistently?"

2. **Identify Root Cause** (15-30 min)
   "Analyze [bug]. What's the root cause? Review code at [location]. Explain why it happens."

3. **Fix** (30-60 min)
   "Fix [bug] following RANA patterns. Ensure fix doesn't break other functionality. Add tests to prevent regression."

4. **Test** (15 min)
   "Test bug fix: original issue resolved, no new bugs introduced, edge cases handled."

5. **Deploy** (10 min)
   "Deploy bug fix. Priority deployment if critical. Monitor for issues."

6. **Verify** (10 min)
   "Verify fix in production. Confirm bug no longer occurs. Check for side effects."

**Success criteria:**
- ✅ Bug fixed in production
- ✅ No regression
- ✅ Root cause addressed (not just symptoms)
```

---

## Emergency Response Chains

### Chain: Production Down

```markdown
**Emergency:** Production is down
**Priority:** P0 - Drop everything

**Response Chain:**
1. Assess → 2. Communicate → 3. Rollback → 4. Fix → 5. Redeploy → 6. Post-Mortem

**Prompts:**

1. **Assess** (2 min)
   "Check: Vercel status, Railway status, Supabase status, error logs. What's down? What's the error?"

2. **Communicate** (1 min)
   "Post status: 'We're aware of an issue. Investigating.' Update every 15 min."

3. **Rollback** (5 min)
   "Rollback to last working version. Git revert + redeploy. Verify production back up."

4. **Fix** (as needed)
   "Fix root cause locally. Test thoroughly. Document what happened."

5. **Redeploy** (10 min)
   "Deploy fix. Monitor closely. Verify all systems operational."

6. **Post-Mortem** (1 hour)
   "Write post-mortem: what happened, why, how we fixed it, how we prevent it."

**Success criteria:**
- ✅ Production restored within 15 min
- ✅ Users notified of resolution
- ✅ Root cause fixed
- ✅ Prevention plan in place
```

---

## Prompt Library Summary

### Quick Reference

| Phase | Key Prompt | Time | Output |
|-------|-----------|------|--------|
| **Pre-Implementation** |
| Search | "Search for existing patterns" | 5 min | Reusable code list |
| Review | "Review docs and quality gates" | 10 min | Gates to follow |
| REPM | "Run REPM validation" (if major) | 4-8 hrs | GO/NO-GO |
| **Implementation** |
| Implement | "Implement with RANA gates" | Varies | Working code |
| Error handling | "Add error handling" | 30 min | Try-catch added |
| Loading states | "Add loading states" | 20 min | Loaders added |
| **Testing** |
| Manual test | "Run manual test checklist" | 30 min | Test results |
| Edge cases | "Test edge cases" | 1 hour | Edge test results |
| **Deployment** |
| Migration | "Create migration" | 30 min | Migration file |
| Deploy | "Deploy to production" | 15 min | Deployed URLs |
| **Verification** |
| Verify | "Verify in production" | 15 min | Verification report |

---

## Best Practices

### 1. Always Include Context
❌ "Add login page"
✅ "Add login page using RANA gates in .rana.yml. Project uses React + Supabase. Search for existing AuthContext first."

### 2. Chain Prompts Together
❌ Single large prompt
✅ Step-by-step chain with validation between steps

### 3. Validate Before Proceeding
❌ Assume previous step worked
✅ Check output before next prompt

### 4. Document Decisions
❌ Just code
✅ Code + reasoning + validation results

### 5. Use Templates
❌ Freeform prompts every time
✅ Template-based prompts for consistency

---

*Comprehensive prompts = Better AI output = Higher quality code* ✅
