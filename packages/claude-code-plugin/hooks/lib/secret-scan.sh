#!/usr/bin/env bash
# CoFounder shared secret-detection library.
#
# Sourced by both pre-edit-guardrails.sh and pre-bash-guardrails.sh so the
# two hooks can never drift out of sync on what counts as a secret.
#
# Prefers gitleaks (700+ community-maintained rules) when it's on PATH —
# authoritative, low false-positive scanning we will never match by hand.
# Falls back to a small embedded critical-pattern set when gitleaks is
# absent, so protection degrades gracefully instead of disappearing.
#
# Usage:
#   source "$(dirname "$0")/lib/secret-scan.sh"
#   if finding=$(cofounder_scan_secrets "$content"); then
#     echo "no secret found"
#   else
#     echo "blocked: $finding"
#   fi
#
# cofounder_scan_secrets prints a human-readable label for the first match
# to stdout and returns 1 if a secret is found; returns 0 (silent) if clean.

# Embedded fallback patterns — kept in sync with
# packages/ci/src/rules/no-hardcoded-keys.ts. Extend both together.
_COFOUNDER_SECRET_PATTERNS=(
  'sk_live_[A-Za-z0-9]{10,}|Stripe live secret key'
  'sk-ant-[A-Za-z0-9_-]{20,}|Anthropic API key'
  'sk-proj-[A-Za-z0-9_-]{20,}|OpenAI project key'
  '(^|[^A-Za-z0-9_-])sk-(ant-|proj-)?[A-Za-z0-9]{20,}|OpenAI-style secret key'
  'AKIA[0-9A-Z]{16}|AWS access key'
  'gsk_[A-Za-z0-9]{20,}|Groq API key'
  'xai-[A-Za-z0-9]{20,}|xAI API key'
  'gh[pousr]_[A-Za-z0-9]{20,}|GitHub token'
  'AIza[0-9A-Za-z_-]{35}|Google API key'
  'xox[baprs]-[A-Za-z0-9-]{10,}|Slack token'
  'npm_[A-Za-z0-9]{36}|npm access token'
  '"type"[[:space:]]*:[[:space:]]*"service_account"|GCP service-account JSON'
  '\-\-\-\-\-BEGIN[A-Z ]*PRIVATE KEY\-\-\-\-\-|Private key (PEM)'
  '(postgres|postgresql|mysql|mongodb\+srv)://[^:[:space:]]+:[^@[:space:]]+@|DB connection string with inline password'
  '(SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY)[A-Za-z_]*[[:space:]]*[:=][[:space:]]*["'\''"]?eyJ[A-Za-z0-9_-]{10,}|Supabase service_role JWT'
)

# Returns 0 (true, "clean") and prints nothing if no secret found.
# Returns 1 (false, "blocked") and prints "<label>" to stdout on first match.
cofounder_scan_secrets() {
  local content="$1"
  [[ -z "$content" ]] && return 0

  if command -v gitleaks >/dev/null 2>&1; then
    local tmpfile
    tmpfile=$(mktemp)
    printf '%s' "$content" > "$tmpfile"
    local findings
    findings=$(gitleaks detect --no-git --no-banner --source "$tmpfile" --report-format json --exit-code 0 2>/dev/null || true)
    rm -f "$tmpfile"
    if [[ -n "$findings" && "$findings" != "[]" && "$findings" != "null" ]]; then
      local rule
      rule=$(printf '%s' "$findings" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    if data:
        print(data[0].get("RuleID", "secret"))
except Exception:
    print("secret")
' 2>/dev/null || echo "secret")
      echo "gitleaks: ${rule}"
      return 1
    fi
    return 0
  fi

  # Fallback: embedded pattern set.
  local entry pattern label
  for entry in "${_COFOUNDER_SECRET_PATTERNS[@]}"; do
    pattern="${entry%%|*}"
    label="${entry#*|}"
    if printf '%s' "$content" | grep -Eq "$pattern"; then
      echo "$label"
      return 1
    fi
  done
  return 0
}
