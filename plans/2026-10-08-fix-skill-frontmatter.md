# Fix skill frontmatter warnings

## Goals
Make the two reported skills load successfully by correcting their YAML descriptions.

## Background
The web-search and llm-workflow descriptions contain a colon followed by a space in an unquoted YAML scalar. YAML interprets this as a nested mapping and rejects the frontmatter.

## Design
1. Convert the description in treasure-work-skills/web-search/SKILL.md and workflow-skills/llm-workflow/SKILL.md to a YAML block scalar (`description: >-`), retaining the existing text.
2. Parse both frontmatter blocks with a YAML parser and verify the resulting descriptions match the original intended strings. Run the skill validator and check the diff.
3. Open a non-draft PR and complete review and CI. This is a metadata correction with no UI prototype required.

Authored by Treasure Work.
