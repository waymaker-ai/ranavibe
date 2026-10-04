#!/usr/bin/env bash
# End-to-end smoke test: real built CLI binary, real installed git hook,
# real `git commit` invocations.
set -uo pipefail
CLI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/dist/cli.js"
pass=0
fail=0

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
cd "$WORKDIR"
git init -q
git config user.email t@t.com
git config user.name t

# Simulate a real `npm install --save-dev @waymakerai/aicofounder-ci`: the
# installed hook script's first branch looks for
# ./node_modules/.bin/aicofounder-ci before falling back to `npx` (which
# would hit the network and an old published version — wrong for this
# test, which needs to exercise the CLI as just built).
mkdir -p node_modules/.bin
ln -s "$CLI" node_modules/.bin/aicofounder-ci

check() {
  local desc="$1" expect="$2"; shift 2
  "$@" >/tmp/e2e_out_$$.log 2>&1
  local code=$?
  if [[ "$code" == "$expect" ]]; then
    echo "PASS ($code): $desc"; pass=$((pass+1))
  else
    echo "FAIL (got $code, want $expect): $desc"; cat /tmp/e2e_out_$$.log; fail=$((fail+1))
  fi
  rm -f /tmp/e2e_out_$$.log
}

check "install-hook installs cleanly" 0 node "$CLI" install-hook
check "install-hook refuses reinstall without --force" 0 node "$CLI" install-hook
check "install-hook --force reinstalls" 0 node "$CLI" install-hook --force

echo "export const x = 1;" > clean.ts
git add clean.ts
check "commit of clean file succeeds" 0 git commit -q -m "clean commit"

echo "const key = 'sk-ant-abcdefghijklmnopqrstuvwxyz';" > bad.ts
git add bad.ts
check "commit of secret is blocked by hook" 1 git commit -q -m "should be blocked"

git add bad.ts
check "commit with --no-verify bypasses hook" 0 git commit -q --no-verify -m "bypassed"

echo
echo "== $pass passed, $fail failed =="
[[ "$fail" -eq 0 ]]
