#!/usr/bin/env bash
# Shared .cofounder.yml escape-hatch reader.
#
# Config shape (naive but dependency-free — no YAML parser required):
#   bash:
#     allow:
#       - "some substring"
#   scope:
#     allow:
#       - "some substring"
#
# cofounder_config_allows <section> <candidate> returns 0 (true) if
# <candidate> contains at least one allow-listed substring under the given
# top-level <section>'s `allow:` list. Walks up from $PWD to find the
# nearest .cofounder.yml.

_cofounder_find_yml() {
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/.cofounder.yml" ]]; then
      printf '%s' "$dir/.cofounder.yml"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

cofounder_config_allows() {
  local section="$1" candidate="$2"
  local cofounder_yml
  cofounder_yml="$(_cofounder_find_yml)" || return 1

  local in_section=false
  local in_allow=false
  while IFS= read -r line; do
    if [[ "$line" =~ ^${section}: ]]; then in_section=true; in_allow=false; continue; fi
    if [[ "$in_section" == true && "$line" =~ ^[a-zA-Z] ]]; then in_section=false; in_allow=false; fi
    if [[ "$in_section" == true && "$line" =~ ^[[:space:]]+allow: ]]; then in_allow=true; continue; fi
    if [[ "$in_allow" == true ]]; then
      if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*[\"\']?([^\"\']+)[\"\']?[[:space:]]*$ ]]; then
        local substr="${BASH_REMATCH[1]}"
        if [[ -n "$substr" && "$candidate" == *"$substr"* ]]; then
          return 0
        fi
      else
        in_allow=false
      fi
    fi
  done < "$cofounder_yml"
  return 1
}
