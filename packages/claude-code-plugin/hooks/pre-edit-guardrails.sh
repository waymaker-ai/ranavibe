#!/usr/bin/env bash
# CoFounder PreToolUse hook for Edit/Write/MultiEdit
#
# Reads the tool input from stdin as JSON, runs lightweight guardrail checks
# on the proposed edit, and blocks with a helpful message if a Tier-1 rule
# fails. Warnings are surfaced to the user but do not block.
#
# Tier-1 rules (block):
#   - Adding a new .env* file or writing secrets into any file
#   - Hardcoded Stripe/OpenAI/Anthropic/AWS keys
#   - Mock data in a production code path (not test files)
#
# The hook exits 0 to allow, 2 to block.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/secret-scan.sh
source "${SCRIPT_DIR}/lib/secret-scan.sh"

# Read the entire stdin (Claude Code passes tool input as JSON)
input=$(cat)

# Extract the target path — support Edit, Write, MultiEdit
path=$(printf '%s' "$input" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    tin = d.get("tool_input", {})
    print(tin.get("file_path", ""))
except Exception:
    print("")
' 2>/dev/null || true)

# Extract the new/candidate content
content=$(printf '%s' "$input" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    tin = d.get("tool_input", {})
    # Write: content. Edit: new_string. MultiEdit: edits[*].new_string joined.
    if "content" in tin:
        print(tin["content"])
    elif "new_string" in tin:
        print(tin["new_string"])
    elif "edits" in tin:
        print("\n".join(e.get("new_string", "") for e in tin["edits"]))
except Exception:
    pass
' 2>/dev/null || true)

[[ -z "$path" ]] && exit 0

# --- Tier 1: block writing an uncommitted-secrets env file ---
# Safe, intended files (.env.local, .env.example, .env.sample, .env.template)
# are explicitly allowed — blocking them was blocking the exact path our own
# error message told users to use instead. Anything else matching .env* is
# blocked UNLESS it's already gitignored (a gitignored .env is the normal,
# safe way to keep local secrets out of version control).
base="$(basename "$path")"
if [[ "$base" =~ ^\.env ]]; then
  case "$base" in
    .env.local|.env.*.local|.env.example|.env.sample|.env.template)
      : # allowed — safe by convention
      ;;
    *)
      if git -C "$(dirname "$path")" check-ignore -q "$path" 2>/dev/null; then
        : # allowed — already gitignored, won't reach version control
      else
        echo "CoFounder guardrail: writing to $path is blocked because it is not gitignored. Use .env.local (gitignored) instead, or add $base to .gitignore first if this is intentional." >&2
        exit 2
      fi
      ;;
  esac
fi

# --- Tier 1: secret patterns in content (shared scanner: gitleaks if present, else embedded set) ---
if [[ -n "$content" ]]; then
  if ! finding=$(cofounder_scan_secrets "$content"); then
    echo "CoFounder guardrail: ${finding} detected in $path. Blocked. Move it to an env var or secret manager." >&2
    exit 2
  fi
fi

# --- Tier 2: warn on mock data in non-test paths ---
if [[ -n "$content" ]]; then
  is_test=false
  case "$path" in
    */__tests__/*|*/test/*|*/tests/*|*.test.*|*.spec.*|*/fixtures/*|*/mocks/*)
      is_test=true
      ;;
  esac
  if [[ "$is_test" == "false" ]]; then
    if echo "$content" | grep -Eq 'mockUsers|fakeUsers|mockData|fakeData|MOCK_USERS'; then
      # Warn only; do not block. The user may be genuinely refactoring.
      echo "CoFounder guardrail (WARN): mock-data identifier found in $path (production path). Verify this is not shipping to prod." >&2
    fi
  fi
fi

exit 0
