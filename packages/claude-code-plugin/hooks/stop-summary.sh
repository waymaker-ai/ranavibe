#!/usr/bin/env bash
# CoFounder Stop hook
# Runs a lightweight summary check at the end of a turn if the repo has an
# active CoFounder config. Non-blocking — just surfaces a reminder.

set -euo pipefail

CWD="${CLAUDE_PROJECT_DIR:-$PWD}"

# Only emit if we're in a CoFounder-enabled repo
if [[ ! -f "$CWD/.aicofounder.yml" ]]; then
  exit 0
fi

# Count staged + unstaged changes
if command -v git >/dev/null 2>&1 && git -C "$CWD" rev-parse --git-dir >/dev/null 2>&1; then
  changed=$(git -C "$CWD" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [[ "${changed:-0}" -gt 0 ]]; then
    echo ""
    echo "CoFounder: $changed file(s) changed this session. Before opening a PR, run:"
    echo "  aicofounder check     # full guardrail suite"
    echo "  /cofounder review     # AI review against VibeSpecs"
  fi
fi

exit 0
