#!/usr/bin/env bash
# Manual functional test: pre-edit-guardrails.sh's VibeSpec scope
# enforcement (requires mcp-server/dist to be built).
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
HOOK="$PWD/pre-edit-guardrails.sh"
MCP_DIST="$PWD/../mcp-server/dist/enforce-scope-cli.js"

if [[ ! -f "$MCP_DIST" ]]; then
  echo "SKIP: mcp-server/dist not built — run 'npm run build' in packages/claude-code-plugin/mcp-server first"
  exit 0
fi

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
cd "$WORKDIR"
git init -q
mkdir -p specs/vibes src/allowed src/forbidden src/other
cat > specs/vibes/scoped.yml <<'YAML'
id: scoped-vibe
name: Scoped Vibe
vibe:
  scopeRules:
    allowedPaths:
      - "src/allowed/**"
    forbiddenPaths:
      - "src/forbidden/**"
YAML
git add specs
git -c user.email=t@t.com -c user.name=t commit -q -m init

pass=0
fail=0
check() {
  local desc="$1" json="$2" expect="$3"
  out=$(printf '%s' "$json" | "$HOOK" 2>&1)
  code=$?
  if [[ "$code" == "$expect" ]]; then
    echo "PASS ($code): $desc"; pass=$((pass+1))
  else
    echo "FAIL (got $code, want $expect): $desc"; echo "  output: $out"; fail=$((fail+1))
  fi
}

check "edit inside allowedPaths passes" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/src/allowed/thing.ts\",\"content\":\"export const x = 1;\"}}" 0
check "edit outside allowedPaths blocked" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/src/other/thing.ts\",\"content\":\"export const x = 1;\"}}" 2
check "edit matching forbiddenPaths blocked" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/src/forbidden/thing.ts\",\"content\":\"export const x = 1;\"}}" 2

# Escape hatch
cat > .cofounder.yml <<'YAML'
version: 1.0.0
scope:
  allow:
    - "src/other/thing.ts"
YAML
check "allowlisted out-of-scope edit passes via .cofounder.yml" \
  "{\"tool_input\":{\"file_path\":\"$WORKDIR/src/other/thing.ts\",\"content\":\"export const x = 1;\"}}" 0

echo
echo "== $pass passed, $fail failed =="
[[ "$fail" -eq 0 ]]
