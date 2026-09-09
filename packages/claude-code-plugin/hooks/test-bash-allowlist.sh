#!/usr/bin/env bash
# Manual functional test for the .cofounder.yml bash.allow escape hatch.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
HOOK="$PWD/pre-bash-guardrails.sh"

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
cat > "$WORKDIR/.cofounder.yml" <<'YAML'
version: 1.0.0
bash:
  allow:
    - "rm -rf ./scratch-allowed-dir"
YAML

pass=0
fail=0
check() {
  local desc="$1" json="$2" expect="$3"
  out=$(cd "$WORKDIR" && printf '%s' "$json" | "$HOOK" 2>&1)
  code=$?
  if [[ "$code" == "$expect" ]]; then
    echo "PASS ($code): $desc"; pass=$((pass+1))
  else
    echo "FAIL (got $code, want $expect): $desc"; echo "  output: $out"; fail=$((fail+1))
  fi
}

check "allowlisted command passes" \
  '{"tool_input":{"command":"rm -rf ./scratch-allowed-dir/node_modules"}}' 0
check "non-allowlisted dangerous command still blocked" \
  '{"tool_input":{"command":"rm -rf ~/Documents"}}' 2

echo
echo "== $pass passed, $fail failed =="
[[ "$fail" -eq 0 ]]
