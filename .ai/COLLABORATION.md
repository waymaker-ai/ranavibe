# AI-Human Collaboration Guide

> Patterns and practices for effective AI-assisted development.

**Version:** 1.0.0
**Last Updated:** 2024-11-29
**Status:** Active

---

## Philosophy

AI should be a **partner**, not a tool. The best outcomes come from:
- Clear communication in both directions
- Shared context and understanding
- Complementary strengths
- Continuous feedback loops

---

## 1. Session Management

### 1.1 Starting a Session

**Human should provide:**
- Clear goal or task description
- Relevant context (what was done before, what's blocked)
- Constraints or preferences
- Priority level

**AI should:**
- Confirm understanding of the task
- Check STATUS.md and ROADMAP.md for context
- Reference any relevant previous work
- Ask clarifying questions if needed

**Example opening:**
```
Human: "Continue work on the reliability features from ROADMAP Phase 2.1"

AI: "I'll continue with Phase 2.1 Reliability. Looking at ROADMAP.md:
- [ ] Automatic fallbacks between providers
- [ ] Circuit breaker pattern
- [ ] Retry with exponential backoff
- [ ] Rate limit handling
- [ ] Request queuing

The last session completed environment-based model selection.
Should I start with 'Automatic fallbacks' as the next priority?"
```

### 1.2 During a Session

**Maintain context by:**
- Using TodoWrite for multi-step tasks
- Committing frequently with clear messages
- Updating STATUS.md for significant milestones
- Referencing file paths and line numbers

**Signal progress:**
- Show what's being worked on
- Explain decisions and tradeoffs
- Surface blockers immediately
- Offer alternatives when stuck

### 1.3 Ending a Session

**Before context runs out:**
- Summarize what was accomplished
- List any incomplete items
- Document any decisions made
- Note files that were modified
- Suggest next steps

**Example handoff:**
```
## Session Summary

**Completed:**
- Implemented automatic provider fallbacks (packages/core/src/providers/fallback.ts)
- Added circuit breaker pattern (packages/core/src/providers/circuit-breaker.ts)
- Updated ROADMAP.md (2 items complete)

**In Progress:**
- Retry with exponential backoff (50% complete)
- Started in packages/core/src/providers/retry.ts

**Decisions Made:**
- Using jitter in backoff to prevent thundering herd
- Default max retries: 3

**Next Session:**
- Complete retry implementation
- Add rate limit handling
```

---

## 2. Communication Patterns

### 2.1 Asking the AI

**Be specific:**
```
❌ "Fix the bug"
✅ "Fix the TypeScript error in packages/core/src/client.ts:142 -
    the 'response' variable is typed as 'unknown'"
```

**Provide context:**
```
❌ "Add a new feature"
✅ "Add automatic provider fallback per ROADMAP.md Phase 2.1.
    When OpenAI fails, try Anthropic, then Google."
```

**State constraints:**
```
❌ "Make it better"
✅ "Optimize the cache lookup to be O(1) instead of O(n),
    but don't change the public API"
```

### 2.2 AI Communication

**Explain decisions:**
```
❌ Just making changes without explanation
✅ "I'm using exponential backoff with jitter because:
    1. Prevents thundering herd on recovery
    2. Standard practice for API retries
    3. Configurable delay multiplier"
```

**Surface uncertainty:**
```
❌ Guessing and hoping it's right
✅ "I'm not certain about the best approach here. Options:
    A) In-memory queue (simple but not persistent)
    B) Redis queue (persistent but adds dependency)
    Which fits better with your infrastructure?"
```

**Proactive information:**
```
❌ Only doing exactly what was asked
✅ "Completed the retry logic. I also noticed that the
    rate limit handling could reuse this same backoff
    mechanism. Want me to refactor them together?"
```

---

## 3. Effective Patterns

### 3.1 Incremental Development

Work in small, verifiable steps:

1. **Plan** - Break task into steps
2. **Implement** - One step at a time
3. **Verify** - Build/test after each step
4. **Commit** - Save progress frequently
5. **Review** - Check against requirements

### 3.2 Parallel Work

When tasks are independent:
- Use parallel tool calls
- Group related commits
- Don't block on non-essential items

### 3.3 Error Recovery

When something goes wrong:
1. Stop and assess
2. Explain what happened
3. Propose fix options
4. Get confirmation before major changes

### 3.4 Knowledge Building

Build shared understanding:
- Document decisions in DECISIONS.md
- Keep STATUS.md current
- Write clear commit messages
- Add comments for non-obvious code

---

## 4. Anti-Patterns to Avoid

### 4.1 Human Anti-Patterns

❌ **Vague requests** - "Make it work better"
❌ **Missing context** - Assuming AI knows project history
❌ **Ignoring AI feedback** - Overriding without considering input
❌ **No verification** - Not testing changes
❌ **Scope creep** - Adding requirements mid-task

### 4.2 AI Anti-Patterns

❌ **Over-engineering** - Adding unrequested features
❌ **Silent assumptions** - Not confirming understanding
❌ **Ignoring conventions** - Not following project patterns
❌ **Incomplete work** - Moving on without finishing
❌ **Lost context** - Forgetting previous decisions

---

## 5. Project-Specific Workflows

### 5.1 Adding a New Feature

```
1. Check ROADMAP.md for feature spec
2. Create TodoWrite with steps
3. Explore existing patterns in codebase
4. Implement following conventions
5. Update ROADMAP.md when complete
6. Commit with descriptive message
7. Update STATUS.md if significant
```

### 5.2 Fixing a Bug

```
1. Reproduce and understand the issue
2. Identify root cause
3. Propose fix with explanation
4. Implement fix
5. Verify fix works
6. Check for similar issues elsewhere
7. Commit with "fix:" prefix
```

### 5.3 Refactoring

```
1. Explain why refactor is needed
2. Get approval before starting
3. Make incremental changes
4. Verify each step builds
5. Keep functionality identical
6. Don't change unrelated code
```

### 5.4 Documentation

```
1. Follow frontmatter format
2. Keep docs near relevant code
3. Update when behavior changes
4. Mark deprecated docs properly
5. Run docs:validate to check
```

---

## 6. Tools for Collaboration

### 6.1 Status Commands

```bash
# Check project status
rana docs:status

# See all documents
rana docs:list

# Validate document health
rana docs:check

# Show open roadmap items
cat ROADMAP.md | grep "\[ \]"
```

### 6.2 AI Context Files

| File | Purpose |
|------|---------|
| `.ai/RULES.md` | AI behavior rules |
| `.ai/STATUS.md` | Current project state |
| `.ai/CONVENTIONS.md` | Code/doc standards |
| `.ai/DECISIONS.md` | Architecture decisions |
| `.ai/COLLABORATION.md` | This guide |
| `ROADMAP.md` | Feature planning |

### 6.3 Progress Tracking

```bash
# Use TodoWrite in conversation
# Always update ROADMAP.md on completion
# Keep STATUS.md current
```

---

## 7. Measuring Success

### 7.1 Good Collaboration Looks Like

✅ Clear, incremental progress
✅ Minimal rework or corrections
✅ Both parties learning
✅ Decisions documented
✅ Context preserved across sessions
✅ Code quality maintained

### 7.2 Warning Signs

⚠️ Frequent misunderstandings
⚠️ Repeated similar questions
⚠️ Lost context between sessions
⚠️ Unclear what's done vs pending
⚠️ Documentation getting stale
⚠️ Conventions being ignored

---

## 8. Continuous Improvement

### 8.1 Feedback Loop

After significant work:
1. What went well?
2. What was frustrating?
3. What could be clearer?
4. Update rules/conventions accordingly

### 8.2 Rule Evolution

Rules should evolve based on experience:
- If a rule is consistently violated, clarify it
- If a rule is unnecessary, remove it
- If a new pattern emerges, document it

---

## Quick Reference

### Session Start Checklist
- [ ] Clear task description provided
- [ ] Relevant files/context identified
- [ ] ROADMAP.md checked for open items
- [ ] STATUS.md reviewed for context

### Session End Checklist
- [ ] Work committed with clear messages
- [ ] ROADMAP.md updated if items completed
- [ ] STATUS.md updated with current state
- [ ] Handoff notes for next session
- [ ] Any blockers documented

### Before Committing
- [ ] Code builds without errors
- [ ] Changes match the request
- [ ] No unnecessary files modified
- [ ] Commit message follows convention
