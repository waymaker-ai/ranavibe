#!/usr/bin/env bash
# Manual functional test for enforce-scope-cli.js.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
CLI="$PWD/dist/enforce-scope-cli.js"

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
mkdir -p "$WORKDIR/specs/vibes" "$WORKDIR/src/allowed" "$WORKDIR/src/forbidden"
cat > "$WORKDIR/specs/vibes/scoped.yml" <<'YAML'
id: scoped-vibe
name: Scoped Vibe
vibe:
  scopeRules:
    allowedPaths:
      - "src/allowed/**"
    forbiddenPaths:
      - "src/forbidden/**"
YAML

pass=0
fail=0
check() {
  local desc="$1" file="$2" expect="$3"
  out=$(node "$CLI" "$file" "$WORKDIR" 2>&1)
  code=$?
  if [[ "$code" == "$expect" ]]; then
    echo "PASS ($code): $desc"; pass=$((pass+1))
  else
    echo "FAIL (got $code, want $expect): $desc"; echo "  output: $out"; fail=$((fail+1))
  fi
}

check "file inside allowedPaths passes" "$WORKDIR/src/allowed/thing.ts" 0
check "file outside allowedPaths blocked" "$WORKDIR/src/other/thing.ts" 1
check "file matching forbiddenPaths blocked" "$WORKDIR/src/forbidden/thing.ts" 1

NOSPEC_DIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR" "$NOSPEC_DIR"' EXIT
out=$(node "$CLI" "$NOSPEC_DIR/anything.ts" "$NOSPEC_DIR" 2>&1)
code=$?
if [[ "$code" == "0" ]]; then
  echo "PASS ($code): file passes when repo has no VibeSpecs at all"; pass=$((pass+1))
else
  echo "FAIL (got $code, want 0): file passes when repo has no VibeSpecs at all"; echo "  output: $out"; fail=$((fail+1))
fi

echo
echo "== $pass passed, $fail failed =="
[[ "$fail" -eq 0 ]]
