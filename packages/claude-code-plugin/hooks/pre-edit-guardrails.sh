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

# --- Tier 1: block a new .env* file creation ---
if [[ "$(basename "$path")" =~ ^\.env ]]; then
  echo "CoFounder guardrail: writing to $path is blocked. Secrets belong in a gitignored .env.local (use your vercel env pull / secret manager). If this is intentional, add the file manually outside Claude." >&2
  exit 2
fi

# --- Tier 1: secret patterns in content ---
if [[ -n "$content" ]]; then
  # Stripe live key
  if echo "$content" | grep -Eq 'sk_live_[A-Za-z0-9]{10,}'; then
    echo "CoFounder guardrail: Stripe live secret key detected in $path. Blocked. Move it to an env var." >&2
    exit 2
  fi
  # OpenAI key
  if echo "$content" | grep -Eq 'sk-[A-Za-z0-9]{20,}'; then
    echo "CoFounder guardrail: OpenAI-style secret key detected in $path. Blocked. Move it to an env var." >&2
    exit 2
  fi
  # Anthropic key
  if echo "$content" | grep -Eq 'sk-ant-[A-Za-z0-9\-_]{20,}'; then
    echo "CoFounder guardrail: Anthropic secret key detected in $path. Blocked. Move it to an env var." >&2
    exit 2
  fi
  # AWS access key
  if echo "$content" | grep -Eq 'AKIA[0-9A-Z]{16}'; then
    echo "CoFounder guardrail: AWS access key detected in $path. Blocked. Use IAM roles or env vars." >&2
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
