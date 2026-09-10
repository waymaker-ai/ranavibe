#!/usr/bin/env bash
# CoFounder PreToolUse hook for Bash
#
# Every other CoFounder hook only watches Edit/Write/MultiEdit. Until this
# hook existed, an agent could bypass every guardrail with a single shell
# command: `echo "sk_live_..." > config.js`, `git commit --no-verify`,
# `git push --force`, `rm -rf`, a curl|bash remote-code pipe, or raw
# destructive SQL. This hook closes that hole with a small, high-confidence
# Tier-1 denylist. It is intentionally narrow — false positives here block
# legitimate work, so only near-certain footguns are blocked; everything
# else is left to the base model's judgment.
#
# Escape hatch: add a `bash: allow: ["<substring>", ...]` list to
# .cofounder.yml (walked up from cwd) — any command containing one of those
# substrings skips the denylist (still logged as a warning, never silent).
#
# The hook exits 0 to allow, 2 to block.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/secret-scan.sh
source "${SCRIPT_DIR}/lib/secret-scan.sh"
# shellcheck source=lib/cofounder-config.sh
source "${SCRIPT_DIR}/lib/cofounder-config.sh"

input=$(cat)

command=$(printf '%s' "$input" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get("tool_input", {}).get("command", ""))
except Exception:
    print("")
' 2>/dev/null || true)

[[ -z "$command" ]] && exit 0

# --- Escape hatch: .cofounder.yml bash.allow substrings ---
if cofounder_config_allows bash "$command"; then
  echo "CoFounder guardrail: command matched a Tier-1 pattern but is allowlisted via .cofounder.yml bash.allow — proceeding." >&2
  exit 0
fi

block() {
  echo "CoFounder guardrail: $1" >&2
  echo "Blocked command: $command" >&2
  exit 2
}

# --- Git history / branch-protection destruction ---
if printf '%s' "$command" | grep -Eq '\bgit\b.*\bpush\b.*(--force([[:space:]=]|$)|(^|[[:space:]])-f([[:space:]]|$)|\+[A-Za-z0-9_./-]+:)'; then
  block "force-push detected. This rewrites remote history; a human must run this explicitly."
fi
if printf '%s' "$command" | grep -Eq '\bgit\b.*--no-verify'; then
  block "--no-verify bypasses commit/push hooks (including this one on the next run). Not allowed from an agent."
fi
if printf '%s' "$command" | grep -Eq '\bgit\b.*\breset\b.*--hard'; then
  block "git reset --hard discards uncommitted work irreversibly."
fi
if printf '%s' "$command" | grep -Eq '\bgit\b.*\bclean\b.*-[a-zA-Z]*f'; then
  block "git clean -f permanently deletes untracked files."
fi
if printf '%s' "$command" | grep -Eq '\bgit\b.*\bpush\b.*\b(origin|upstream)\b.*\b(main|master)\b'; then
  block "direct push to main/master. Open a PR instead — this repo (and most) expects review before merge."
fi

# --- Filesystem destruction ---
# Split into two independent checks (has -rf-style flag; has a dangerous
# target) rather than one combined regex — BSD grep (macOS default) is
# unreliable on complex nested-alternation patterns with mid-string anchors.
has_rf_flag=false
if printf '%s' "$command" | grep -Eq '\brm\b[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)([[:space:]]|$)'; then
  has_rf_flag=true
fi
if [[ "$has_rf_flag" == true ]]; then
  if printf '%s' "$command" | grep -Eq '(^|[[:space:]])(~|\$HOME|/usr|/etc|/var|/System|/Users/[^/[:space:]]+)([[:space:]/]|$)' \
     || printf '%s' "$command" | grep -Eq '(^|[[:space:]])/([[:space:]]|$)'; then
    block "rm -rf targeting a home directory or system path. If this is intentional, a human must run it."
  fi
fi
if printf '%s' "$command" | grep -Eq '\bchmod\b.*\b777\b'; then
  block "chmod 777 makes a path world-writable — a real security smell, not a quick fix."
fi

# --- Remote code execution pipes ---
if printf '%s' "$command" | grep -Eq '\b(curl|wget)\b.*\|[[:space:]]*(sudo[[:space:]]+)?(sh|bash|zsh)\b'; then
  block "piping a remote download directly into a shell. Download, inspect, then run."
fi

# --- Destructive SQL ---
if printf '%s' "$command" | grep -Eiq '\b(DROP[[:space:]]+(TABLE|DATABASE|SCHEMA)|TRUNCATE[[:space:]]+TABLE)\b'; then
  block "destructive SQL (DROP/TRUNCATE) detected in a shell command."
fi
if printf '%s' "$command" | grep -Eiq '\bDELETE[[:space:]]+FROM\b' && ! printf '%s' "$command" | grep -Eiq '\bWHERE\b'; then
  block "DELETE FROM without a WHERE clause — this deletes every row."
fi

# --- Secret writes via shell redirection ---
if printf '%s' "$command" | grep -Eq '>>?[[:space:]]*"?\.env([.\"]|[[:space:]]|$)'; then
  block "shell redirection into a .env* file. Use the Edit/Write tools so the secret-content guardrail can inspect it, or add the file manually outside Claude."
fi
if ! finding=$(cofounder_scan_secrets "$command"); then
  block "${finding} detected in the command text itself."
fi

exit 0
