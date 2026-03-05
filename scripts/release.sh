#!/usr/bin/env bash
set -euo pipefail

# Release management for td-skills
#
#   ./scripts/release.sh            Tag a next prerelease on main
#   ./scripts/release.sh promote    Promote a next release to stable
#   ./scripts/release.sh status     Show channel info
#
# Channels:
#   next   = prerelease tags on main (vYYYY.M.patch), auto-creates GitHub prerelease
#   stable = promoted releases (prerelease flag removed via release branch)
#
# Requires: gh CLI, maintainer listed in .github/maintainers.yml

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAINTAINERS_FILE="$REPO_ROOT/.github/maintainers.yml"

die() { echo "error: $*" >&2; exit 1; }

check_maintainer() {
  local user
  user="$(gh api user --jq '.login' 2>/dev/null)" || die "Not authenticated. Run: gh auth login"
  grep -qE "^\s*-\s*${user}\s*$" "$MAINTAINERS_FILE" || die "'$user' is not a maintainer"
}

ensure_main() {
  [[ "$(git branch --show-current)" == "main" ]] || die "Must be on main branch"
  git fetch origin --tags
  git diff --quiet origin/main..HEAD || die "Local main diverges from origin. Push or reset first."
}

latest_stable() {
  gh release list --json tagName,isPrerelease --jq '[.[] | select(.isPrerelease == false)] | .[0].tagName // empty' 2>/dev/null
}

latest_next() {
  gh release list --json tagName,isPrerelease --jq '[.[] | select(.isPrerelease == true)] | .[0].tagName // empty' 2>/dev/null
}

next_version() {
  local ym; ym="$(date +%Y.%-m)"
  # Find the latest tag for this month
  local latest; latest="$(git tag -l "v${ym}.*" --sort=-v:refname | head -1)"
  if [[ -n "$latest" ]]; then
    local patch; patch="$(echo "$latest" | sed -E 's/^v[0-9]+\.[0-9]+\.([0-9]+)$/\1/')"
    echo "v${ym}.$((patch + 1))"
  else
    echo "v${ym}.0"
  fi
}

# --- ./scripts/release.sh — tag next prerelease ---
cmd_default() {
  check_maintainer
  ensure_main

  local version; version="$(next_version)"
  local prev; prev="$(git tag -l 'v*' --sort=-v:refname | head -1)"

  echo "Tagging: $version"
  [[ -n "$prev" ]] && echo "  Previous: $prev"
  echo ""

  git tag -a "$version" -m "$version"
  git push origin "$version"

  echo "Tag pushed. GitHub Action will create the prerelease."
  echo "  https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/releases/tag/$version"
}

# --- ./scripts/release.sh promote ---
cmd_promote() {
  check_maintainer
  ensure_main

  local next; next="$(latest_next)"
  [[ -n "$next" ]] || die "No prerelease found. Run ./scripts/release.sh first."

  echo "Promoting $next to stable"

  # Ensure release branch exists
  if ! git ls-remote --exit-code origin release &>/dev/null; then
    git checkout -b release
    git push -u origin release
  else
    git checkout -B release origin/release
  fi

  echo "$next" > "$REPO_ROOT/.stable-version"
  git add .stable-version
  git commit -m "$(cat <<EOF
promote: ${next} to stable

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
  git push origin release

  echo ""
  echo "Pushed to release branch. GitHub Action will promote $next to stable."

  git checkout main
}

# --- ./scripts/release.sh status ---
cmd_status() {
  git fetch origin --tags 2>/dev/null
  local stable; stable="$(latest_stable)"
  local next; next="$(latest_next)"

  echo "stable: ${stable:-"(none)"}"
  echo "next:   ${next:-"(none)"}"
  echo "main:   $(git rev-parse --short HEAD)"

  if [[ -n "$stable" ]]; then
    echo "  $(git rev-list --count "${stable}..HEAD") commit(s) since stable"
  fi
}

# --- Main ---
case "${1:-}" in
  promote) cmd_promote ;;
  status)  cmd_status ;;
  -h|--help)
    echo "Usage: $0 [promote|status]"
    echo "  (no args)  Tag a next prerelease on main"
    echo "  promote    Promote latest next release to stable"
    echo "  status     Show channel info"
    ;;
  "") cmd_default ;;
  *)  die "Unknown command: $1" ;;
esac
