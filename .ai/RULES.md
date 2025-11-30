# RANA AI Collaboration Rules

> These rules guide AI assistants working on this project. They ensure consistency,
> transparency, and effective human-AI collaboration.

**Version:** 1.0.0
**Last Updated:** 2024-11-29
**Status:** Active

---

## 1. Status Awareness Rules

### 1.1 Always Reference Open Items
- **MUST** check and reference ROADMAP.md at the start of significant work sessions
- **MUST** mention open todo items when they relate to current work
- **MUST** proactively surface blockers, dependencies, or stale items
- **SHOULD** summarize project status when asked "what's next" or similar

### 1.2 Progress Tracking
- **MUST** update ROADMAP.md when completing features
- **MUST** use TodoWrite tool for multi-step tasks
- **MUST** mark items complete immediately upon finishing (not batched)
- **SHOULD** create GitHub issues for discovered bugs or improvements

### 1.3 Context Handoff
- **MUST** provide clear session summaries when context is running low
- **MUST** document decisions and rationale in commit messages
- **SHOULD** reference previous work when continuing a task

---

## 2. Documentation Rules

### 2.1 Markdown File Organization
All markdown files must include a frontmatter header:

```markdown
# Document Title

> Brief one-line description

**Version:** X.Y.Z
**Last Updated:** YYYY-MM-DD
**Status:** Active | Deprecated | Draft | Review
**Superseded By:** [New Doc](./NEW_DOC.md) (if deprecated)
```

### 2.2 File Lifecycle
- **Active** - Current, maintained documentation
- **Draft** - Work in progress, not yet approved
- **Review** - Pending review before activation
- **Deprecated** - No longer applies, kept for reference

### 2.3 Deprecation Process
When deprecating a document:
1. Change status to "Deprecated"
2. Add "Superseded By" link if replacement exists
3. Move to `.archive/` folder after 30 days
4. Add deprecation notice at top of file

### 2.4 Version Numbering
- **Major (X.0.0)** - Complete rewrites or breaking changes
- **Minor (0.X.0)** - New sections or significant updates
- **Patch (0.0.X)** - Typo fixes, clarifications

---

## 3. Code Quality Rules

### 3.1 Before Writing Code
- **MUST** read existing code before modifying
- **MUST** understand the existing patterns and conventions
- **MUST** check for similar implementations to maintain consistency
- **SHOULD** ask clarifying questions if requirements are ambiguous

### 3.2 While Writing Code
- **MUST** follow existing code style and patterns
- **MUST** write TypeScript with proper types (no `any` unless necessary)
- **MUST** handle errors appropriately
- **SHOULD NOT** over-engineer or add unrequested features
- **SHOULD NOT** add comments to code you didn't change

### 3.3 After Writing Code
- **MUST** build and verify no errors before committing
- **MUST** write meaningful commit messages
- **SHOULD** run tests if available
- **SHOULD** update documentation if behavior changed

---

## 4. Communication Rules

### 4.1 Transparency
- **MUST** explain what you're doing and why
- **MUST** admit uncertainty rather than guess
- **MUST** surface risks, tradeoffs, and alternatives
- **SHOULD** provide options when multiple approaches exist

### 4.2 Proactive Assistance
- **SHOULD** suggest related improvements (but ask before implementing)
- **SHOULD** warn about potential issues before they occur
- **SHOULD** offer to continue with related tasks
- **SHOULD NOT** implement unrequested changes without asking

### 4.3 Respectful Disagreement
- **MAY** disagree with user's approach if there's a better way
- **MUST** explain reasoning when disagreeing
- **MUST** defer to user's decision after explaining concerns

---

## 5. Project-Specific Rules

### 5.1 RANA Framework
- Follow the RANA Philosophy (see ROADMAP.md)
- Prioritize developer experience over feature count
- Always consider cost implications of AI features
- Maintain TypeScript type safety

### 5.2 Commit Message Format
```
<type>: <short description>

<detailed description>

<footer>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### 5.3 File Locations
- CLI commands: `tools/cli/src/commands/`
- Core SDK: `packages/core/src/`
- Website: `website/`
- Documentation: `docs/` or inline in code
- AI rules: `.ai/`

---

## 6. Collaboration Patterns

### 6.1 Effective Handoffs
When ending a session or when context is limited:
1. Summarize what was accomplished
2. List any incomplete items
3. Note any blockers or decisions needed
4. Reference relevant files and line numbers

### 6.2 Asking Good Questions
The AI should ask questions when:
- Requirements are ambiguous
- Multiple valid approaches exist
- A decision has significant tradeoffs
- User's approach might cause issues

### 6.3 Parallel Work
When multiple tasks are independent:
- Use parallel tool calls for efficiency
- Group related changes in single commits
- Avoid blocking on non-essential items

---

## 7. Safety Rules

### 7.1 Never Do
- Push to main without user approval
- Delete files without confirmation
- Modify `.env` or credential files
- Run destructive commands (DROP, rm -rf, etc.)
- Commit secrets or API keys

### 7.2 Always Confirm
- Significant refactors
- Database migrations
- Deployment to production
- Removing functionality

---

## Meta

### How to Update These Rules
1. Propose changes in a PR or discussion
2. Get human approval before modifying
3. Update version number and date
4. Document rationale for changes

### Rule Violations
If a rule is violated:
1. Acknowledge the violation
2. Explain what happened
3. Correct the issue if possible
4. Suggest rule clarification if ambiguous
