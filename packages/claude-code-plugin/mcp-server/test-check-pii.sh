#!/usr/bin/env bash
# Manual functional test for check-pii-cli.js (P1-7) + its wiring into
# pre-edit-guardrails.sh.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
CLI="$PWD/dist/check-pii-cli.js"
EDIT_HOOK="$PWD/../hooks/pre-edit-guardrails.sh"

pass=0
fail=0
check() {
  local desc="$1" expect="$2" content="$3" dir="$4"
  out=$(printf '%s' "$content" | node "$CLI" "$dir/somefile.ts" "$dir" 2>&1 >/dev/null)
  local code=$?
  if [[ "$code" == "$expect" ]]; then
    echo "PASS ($code): $desc"; pass=$((pass+1))
  else
    echo "FAIL (got $code, want $expect): $desc"; echo "  stderr: $out"; fail=$((fail+1))
  fi
}

# --- No config: warn mode (exit 0 even with PII) ---
NOCFG=$(mktemp -d)
check "no config, no PII: exit 0" 0 "export const x = 1;" "$NOCFG"
check "no config, has email: warn (exit 0)" 0 "// contact jane@example.com" "$NOCFG"
check "no config, has SSN: warn (exit 0)" 0 "const ssn = '123-45-6789';" "$NOCFG"
rm -rf "$NOCFG"

# --- compliance.frameworks includes hipaa: block mode ---
HIPAA=$(mktemp -d)
cat > "$HIPAA/.cofounder.yml" <<'YAML'
apiVersion: cofounder.cx/v1
compliance:
  frameworks: [hipaa, gdpr]
YAML
check "hipaa config, no PII: exit 0" 0 "export const x = 1;" "$HIPAA"
check "hipaa config, has email: BLOCK (exit 2)" 2 "const email = 'patient@hospital.org';" "$HIPAA"
check "hipaa config, has SSN: BLOCK (exit 2)" 2 "ssn: 123-45-6789" "$HIPAA"
rm -rf "$HIPAA"

# --- explicit pii.mode: warn overrides a compliance framework ---
OVERRIDE=$(mktemp -d)
cat > "$OVERRIDE/.cofounder.yml" <<'YAML'
compliance:
  frameworks: [hipaa]
pii:
  mode: warn
YAML
check "explicit pii.mode:warn overrides hipaa: exit 0" 0 "const email = 'x@y.com';" "$OVERRIDE"
rm -rf "$OVERRIDE"

# --- pii.mode: block with no compliance framework ---
FORCEBLOCK=$(mktemp -d)
cat > "$FORCEBLOCK/.cofounder.yml" <<'YAML'
pii:
  mode: block
YAML
check "explicit pii.mode:block, has email: BLOCK (exit 2)" 2 "email: a@b.com" "$FORCEBLOCK"
rm -rf "$FORCEBLOCK"

# --- e2e through the real hook: hipaa config blocks a PII write ---
E2E=$(mktemp -d)
cd "$E2E"
git init -q
cat > .cofounder.yml <<'YAML'
compliance:
  frameworks: [hipaa]
YAML
hook_json=$(printf '{"session_id":"pii-e2e","tool_input":{"file_path":"%s/notes.ts","content":"const patientEmail = %s;"}}' "$E2E" "'jane.doe@clinic.com'")
out=$(printf '%s' "$hook_json" | "$EDIT_HOOK" 2>&1)
code=$?
if [[ "$code" == "2" ]] && echo "$out" | grep -qi "PII"; then
  echo "PASS ($code): e2e — hipaa config, PII write blocked by real hook"; pass=$((pass+1))
else
  echo "FAIL (got $code): e2e hook"; echo "  $out"; fail=$((fail+1))
fi
cd - >/dev/null
rm -rf "$E2E"

echo
echo "== $pass passed, $fail failed =="
[[ "$fail" -eq 0 ]]
