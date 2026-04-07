#!/bin/bash
# Extract skill names and descriptions from all SKILL.md files
# Output format: name: description (one per line)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Find all SKILL.md files and extract frontmatter
find "$REPO_ROOT" -name "SKILL.md" -type f | while read -r file; do
  # Skip template-skill
  if [[ "$file" == *"template-skill"* ]]; then
    continue
  fi

  # Extract name and description from YAML frontmatter
  name=""
  description=""
  in_frontmatter=false

  while IFS= read -r line; do
    if [[ "$line" == "---" ]]; then
      if $in_frontmatter; then
        break
      fi
      in_frontmatter=true
      continue
    fi

    if $in_frontmatter; then
      if [[ "$line" =~ ^name:\ *(.*) ]]; then
        name="${BASH_REMATCH[1]}"
      elif [[ "$line" =~ ^description:\ *(.*) ]]; then
        description="${BASH_REMATCH[1]}"
      fi
    fi
  done < "$file"

  if [[ -n "$name" && -n "$description" ]]; then
    echo "$name: $description"
  fi
done | sort
