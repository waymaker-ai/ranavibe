#!/usr/bin/env bash
# Manual functional test for pre-edit-guardrails.sh. Not part of CI (no test
# runner wired yet) — run by hand: ./test-pre-edit-guardrails.sh
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
cd "$WORKDIR"
git init -q
printf '.env\n' > .gitignore
git add .gitignore
git -c user.email=t@t.com -c user.name=t commit -q -m init

pass=0
fail=0

check() {
  local desc="$1" json="$2" expect="$3"
  out=$(printf '%s' "$json" | "$OLDPWD/pre-edit-guardrails.sh" 2>&1)
  code=$?
  if [[ "$code" == "$expect" ]]; then
    echo "PASS ($code): $desc"
    pass=$((pass+1))
  else
    echo "FAIL (got $code, want $expect): $desc"
    echo "  output: $out"
    fail=$((fail+1))
  fi
}

check "env.local write allowed" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/.env.local\",\"content\":\"FOO=bar\"}}" 0
check "env.example write allowed" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/.env.example\",\"content\":\"FOO=\"}}" 0
check "gitignored .env write allowed" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/.env\",\"content\":\"FOO=bar\"}}" 0
check "unignored .env.production blocked" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/.env.production\",\"content\":\"FOO=bar\"}}" 2
check "stripe key blocked" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/app.ts\",\"content\":\"const k = 'sk_live_abcdefghij1234567890';\"}}" 2
check "github token blocked" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/app.ts\",\"content\":\"const k = 'ghp_abcdefghijklmnopqrstuvwxyz0123456789';\"}}" 2
check "normal file allowed" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/app.ts\",\"content\":\"export const x = 1;\"}}" 0

echo
echo "== $pass passed, $fail failed =="
[[ "$fail" -eq 0 ]]
