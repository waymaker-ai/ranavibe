#!/usr/bin/env bash
# CoFounder SessionStart hook
# Auto-loads .aicofounder.yml and available VibeSpecs into Claude Code context
# so every session inherits the repo's guardrails without the user having to ask.

set -euo pipefail

CWD="${CLAUDE_PROJECT_DIR:-$PWD}"

emit() {
  # Claude Code SessionStart hook protocol: emit context to stdout, prefixed
  # with a heading so it shows up cleanly in the session transcript.
  echo "$@"
}

found_any=false

if [[ -f "$CWD/.aicofounder.yml" ]]; then
  emit "# CoFounder config (.aicofounder.yml)"
  emit ""
  emit '```yaml'
  cat "$CWD/.aicofounder.yml"
  emit '```'
  emit ""
  found_any=true
fi

# Look for VibeSpecs in conventional locations
for dir in "$CWD/specs/vibes" "$CWD/config/vibes" "$CWD/.cofounder/vibes"; do
  if [[ -d "$dir" ]]; then
    for f in "$dir"/*.yml "$dir"/*.yaml; do
      [[ -e "$f" ]] || continue
      name=$(basename "$f")
      emit "# VibeSpec: $name"
      emit ""
      emit '```yaml'
      cat "$f"
      emit '```'
      emit ""
      found_any=true
    done
  fi
done

# Look for active feature specs (recently modified specs/*.spec.yml)
if [[ -d "$CWD/specs" ]]; then
  # Use find to locate spec files, suppress if none
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    name=$(basename "$f")
    emit "# Active feature spec: $name"
    emit ""
    emit '```yaml'
    cat "$f"
    emit '```'
    emit ""
    found_any=true
  done < <(find "$CWD/specs" -maxdepth 2 -name "*.spec.yml" -mtime -14 2>/dev/null | head -3)
fi

if [[ "$found_any" == "true" ]]; then
  emit "---"
  emit "CoFounder plugin active. Use /cofounder new|implement|check|review or invoke cofounder-* skills directly."
fi

exit 0
