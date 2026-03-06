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
# Before tagging, trigger tests are run to verify all skills trigger correctly.
#
# Requires: gh CLI, maintainer listed in .github/maintainers.yml

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAINTAINERS_FILE="$REPO_ROOT/.github/maintainers.yml"

die() { echo "error: $*" >&2; exit 1; }
log() { echo ":: $*"; }
run() { echo "\$ $*"; "$@"; }

confirm() {
  printf "%s [y/N] " "$1"
  read -r answer
  [[ "$answer" =~ ^[Yy]$ ]] || die "Aborted"
}

check_maintainer() {
  log "Checking maintainer access..."
  local user
  user="$(gh api user --jq '.login' 2>/dev/null)" || die "Not authenticated. Run: gh auth login"
  grep -qE "^\s*-\s*${user}\s*$" "$MAINTAINERS_FILE" || die "'$user' is not a maintainer"
  log "Authenticated as $user"
}

run_trigger_tests() {
  local test_script="$REPO_ROOT/tests/run-tests.sh"
  if [[ ! -x "$test_script" ]]; then
    log "Skipping trigger tests (script not found)"
    return 0
  fi

  log "Running skill trigger tests..."
  if ! "$test_script"; then
    echo ""
    die "Trigger tests failed. Fix skill descriptions before releasing."
  fi
  log "All trigger tests passed"
}

ensure_main() {
  [[ "$(git branch --show-current)" == "main" ]] || die "Must be on main branch"
  log "Fetching origin..."
  git fetch origin --tags
  git diff --quiet origin/main..HEAD || die "Local main diverges from origin. Push or reset first."
  log "Main is up to date"
}

latest_stable() {
  gh release list --json tagName,isPrerelease --jq '[.[] | select(.isPrerelease == false)] | .[0].tagName // empty' 2>/dev/null
}

latest_next() {
  gh release list --json tagName,isPrerelease --jq '[.[] | select(.isPrerelease == true)] | .[0].tagName // empty' 2>/dev/null
}

# --- ./scripts/release.sh — tag next prerelease ---
cmd_default() {
  check_maintainer
  ensure_main
  run_trigger_tests

  log "Computing next version..."
  local all_tags; all_tags="$(git tag -l 'v*' --sort=-v:refname)"
  local ym; ym="$(date +%Y.%-m)"

  # Compute next version from tags for this month
  local latest_month_tag; latest_month_tag="$(echo "$all_tags" | grep "^v${ym}\." | head -1 || true)"
  local version
  if [[ -n "$latest_month_tag" ]]; then
    local patch; patch="$(echo "$latest_month_tag" | sed -E 's/^v[0-9]+\.[0-9]+\.([0-9]+)$/\1/')"
    version="v${ym}.$((patch + 1))"
  else
    version="v${ym}.0"
  fi

  local prev; prev="$(echo "$all_tags" | head -1)"

  echo ""
  echo "  version:  $version"
  [[ -n "$prev" ]] && echo "  previous: $prev"
  echo ""
  confirm "Tag and push $version?"

  run git tag -a "$version" -m "$version"
  run git push origin "$version"

  echo ""
  echo "Done! GitHub Action will create the prerelease."
  echo "  https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/releases/tag/$version"
  echo ""
  echo "After validation, promote to stable:"
  echo "  ./scripts/release.sh promote"
}

# --- ./scripts/release.sh promote ---
cmd_promote() {
  check_maintainer

  # Clean worktree required — promote temporarily switches to the release branch
  [[ -z "$(git status --porcelain)" ]] || die "Uncommitted changes found. Commit or stash first."

  # Verify release branch exists
  git fetch origin release --quiet 2>/dev/null \
    || die "Release branch not found."

  log "Checking latest prerelease..."
  local next; next="$(latest_next)"
  [[ -n "$next" ]] || die "No prerelease found. Run ./scripts/release.sh first."

  local branch="promote/${next}"

  # Check for existing branch or open PR
  if git ls-remote --exit-code --heads origin "$branch" &>/dev/null; then
    local existing_pr
    existing_pr="$(gh pr list --head "$branch" --json url -q '.[0].url' 2>/dev/null)"
    if [[ -n "$existing_pr" ]]; then
      die "A promotion PR already exists for ${next}: $existing_pr"
    else
      die "Branch '$branch' already exists on remote. Delete it first: git push origin --delete $branch"
    fi
  fi

  # Read previous stable version from release branch
  local previous
  previous="$(git show origin/release:.stable-version 2>/dev/null | tr -d '[:space:]')"

  local repo_url
  repo_url="$(gh repo view --json url -q '.url')"

  echo ""
  echo "  promote: $next -> stable"
  [[ -n "$previous" && "$previous" != "none" ]] && echo "  current stable: $previous"
  echo ""
  confirm "Create release PR to promote $next?"

  local original_branch
  original_branch="$(git branch --show-current)"

  log "Creating branch $branch from origin/release..."
  run git switch -c "$branch" origin/release

  echo "$next" > .stable-version
  run git add .stable-version
  run git commit -m "promote: ${next} to stable"
  run git push -u origin "$branch"

  log "Creating PR..."
  local body
  body="## Promote ${next} to stable

Merging this PR promotes **${next}** from prerelease to stable.

### Changes since last stable${previous:+" ($previous)"}

[Compare changes](${repo_url}/compare/${previous:-$(git rev-list --max-parents=0 HEAD | head -1)}...${next})

### Verification checklist

- [ ] Tested key skills with the prerelease version
- [ ] Checked GitHub prerelease notes for ${next}
- [ ] No blocking issues reported

| | |
|---|---|
| **Version** | ${next} |
| **Previous stable** | ${previous:-"(none)"} |
| **Release** | [${next}](${repo_url}/releases/tag/${next}) |"

  local pr_url
  pr_url="$(gh pr create \
    --title "promote: ${next} to stable" \
    --body "$body" \
    --base release \
    --head "$branch")"

  echo ""
  echo "PR created: $pr_url"
  echo "An engineer must review and merge this PR to complete the promotion."

  # Switch back and clean up local branch
  run git switch "$original_branch"
  run git branch -D "$branch"
}

# --- ./scripts/release.sh status ---
cmd_status() {
  log "Fetching latest..."
  git fetch origin --tags 2>/dev/null

  # Single API call for all releases
  local releases; releases="$(gh release list --json tagName,isPrerelease 2>/dev/null)"
  local stable; stable="$(echo "$releases" | jq -r '[.[] | select(.isPrerelease == false)] | .[0].tagName // empty')"
  local next; next="$(echo "$releases" | jq -r '[.[] | select(.isPrerelease == true)] | .[0].tagName // empty')"

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
    echo "  promote    Create PR to promote next -> stable"
    echo "  status     Show channel info"
    ;;
  "") cmd_default ;;
  *)  die "Unknown command: $1" ;;
esac
