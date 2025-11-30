# RANA AI Collaboration Framework

> Guidelines and tools for effective AI-assisted development.

**Version:** 1.0.0
**Last Updated:** 2024-11-29
**Status:** Active

---

## Overview

This directory contains the AI collaboration framework for RANA. These documents guide AI assistants (like Claude, GPT, etc.) in working effectively on this codebase.

## Documents

| File | Purpose |
|------|---------|
| `RULES.md` | Core rules AI must follow |
| `STATUS.md` | Current project state and priorities |
| `CONVENTIONS.md` | Code and documentation standards |
| `DECISIONS.md` | Architecture decision records |
| `COLLABORATION.md` | Human-AI collaboration patterns |
| `README.md` | This file |

## Quick Start

### For Humans

1. **Start a session** with clear context:
   ```
   "Continue with Phase 2.1 reliability features.
   Last session completed environment-based model selection."
   ```

2. **Check status** anytime:
   ```bash
   rana docs:status
   ```

3. **Track progress** in ROADMAP.md:
   ```bash
   cat ROADMAP.md | grep "\[ \]"  # Open items
   ```

### For AI Assistants

1. **Read STATUS.md** at session start
2. **Follow RULES.md** during work
3. **Use CONVENTIONS.md** for standards
4. **Log decisions** in DECISIONS.md
5. **Update STATUS.md** at session end

## CLI Commands

```bash
# Document health check
rana docs:check

# List all documents
rana docs:list

# Project status summary
rana docs:status

# Validate frontmatter
rana docs:validate

# Archive deprecated docs
rana docs:archive
```

## Key Principles

1. **Transparency** - Always explain what you're doing
2. **Context Preservation** - Document decisions and progress
3. **Open Item Awareness** - Always reference pending tasks
4. **Version Control** - Track document changes
5. **Deprecation** - Mark old docs, don't delete

## Updating These Documents

1. Propose changes in discussion or PR
2. Get human approval
3. Update version number and date
4. Document rationale for changes

## File Format

All markdown files use this frontmatter:

```markdown
# Title

> Description

**Version:** X.Y.Z
**Last Updated:** YYYY-MM-DD
**Status:** Active | Deprecated | Draft | Review
```

---

## Contributing

These guidelines should evolve based on experience. If something isn't working:
1. Discuss in a session or PR
2. Update the relevant document
3. Test the new approach
4. Refine as needed
