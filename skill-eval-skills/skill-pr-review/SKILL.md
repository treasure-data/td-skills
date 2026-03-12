---
name: skill-pr-review
description: "Review Claude Code skills against authoring best practices. Checks SKILL.md line count, YAML frontmatter, description quality, content conciseness, and common anti-patterns. Use when reviewing a skill from a local path or PR."
---

# Skill PR Review

Review PRs that add or modify Claude Code skills (SKILL.md files) against the official authoring best practices.

## How Claude Code Loads Skills (The Mechanism)

This is what most skill authors get wrong. The flow is:

```
1. ALL skill names + descriptions loaded into system prompt at startup
2. User sends a message
3. Claude decides whether to invoke a skill based on description match
4. Only THEN is SKILL.md read into context
```

**Implication**: The `description` field is the ONLY trigger. Content inside SKILL.md has zero effect on whether the skill gets loaded.

## Review Checklist

When reviewing a skill PR, evaluate against every item below. Report each as pass/fail with specific evidence.

### File Structure

| Check | Rule |
|-------|------|
| Filename | Must be `SKILL.md` (not `SKILL.MD`, `skill.md`, etc.) |
| Frontmatter | Must have `---` delimited YAML with `name` and `description` |
| `name` | Lowercase-with-hyphens, max 64 chars, no "anthropic" or "claude" |
| `name` matches directory | `name` field must match the parent directory name (e.g., `name: pdf-processing` in `pdf-processing/SKILL.md`) |
| `name` format | No consecutive hyphens (`--`), must not start or end with `-` |
| `description` | 1-2 sentences, max 1024 chars, succinct trigger conditions |
| Paths in marketplace.json | Must start with `./` |
| No junk files | No `.DS_Store`, `.idea/`, `node_modules/`, etc. |
| Reference depth | Files referenced from SKILL.md must not reference further files (max one level deep) |

### Line Count

| Threshold | Verdict |
|-----------|---------|
| ≤200 lines | Excellent |
| 201-500 lines | Acceptable (check if trimmable) |
| >500 lines | Fail — must be cut down or split via progressive disclosure |

If >500 lines, suggest splitting into:
```
skill-name/
├── SKILL.md              # Core instructions (<500 lines)
└── reference/
    └── detailed_spec.md  # Supplementary (loaded only when needed)
```

### Description Quality

**Good**: Short, contains trigger conditions, third person.
```yaml
description: "Create custom digdag workflows triggered by TD Activation Actions. Use when building activation workflows for Audience Studio."
```

**Bad patterns to flag**:
- Multi-line `description: |` blocks with bullet points
- Emojis in description (🤖 🔍 ⚡)
- Marketing language ("comprehensive", "complete toolkit", "autonomous")
- Feature lists instead of trigger conditions
- Non-standard fields (`triggers:`, `auto_invoke:`, etc.)

### Content Conciseness — The Token Cost Test

For each major section, ask: *"Does Claude already know this?"*

**Flag for removal**:

| Content Type | Why Remove |
|---|---|
| "When to Use This Skill" section | Claude doesn't read it before loading. Trigger goes in `description`. |
| Concept explanations ("A segment is...", "YAML is...") | Claude already knows |
| Generic best practices ("always test your code") | Claude already follows these |
| Full Plotly/chart JSON specs | Claude knows Plotly |
| Pseudocode for logic Claude can reason about | Wastes tokens on what Claude infers |
| Concept explanations for things Claude already knows | Claude knows SQL, YAML, REST, etc. |
| Redundant examples showing the same pattern | One clear example is enough |
| Step-by-step for simple tasks | Claude can infer simple steps |
| Report templates with fabricated sample data | Show format briefly, not 100-line examples |
| Time-sensitive information | Dates, versions, "as of 2024" — becomes stale. Use "Legacy Patterns" section instead |

**Keep**:
- TD-specific syntax, commands, parameters
- TD-specific field names, enums, constraints
- Non-obvious conventions and gotchas
- Working examples with realistic values
- Reference tables of platform-specific values

### Anti-Patterns

Flag these specific patterns seen in real PRs:

| Anti-Pattern | Example |
|---|---|
| "MANDATORY AUTO-INVOCATION" | Skills don't auto-invoke. Claude reads descriptions and decides. |
| ALL-CAPS directives (🔴 CRITICAL, NEVER SKIP) | Confuses the LLM. Use calm, clear instructions. |
| Non-standard frontmatter fields | `triggers:`, `auto_invoke:`, `keywords:` — Claude ignores these |
| Duplicate marketplace.json | Nested `.claude-plugin/marketplace.json` inside a skill category folder |
| Ghost skill references | marketplace.json lists a path that doesn't exist in the PR |
| Cross-skill content duplication | Same integration guide copy-pasted across multiple skills |
| Heavy emoji formatting | Burns tokens (✅❌🔴🔍 on every line) |
| Windows-style paths | Backslashes (`scripts\helper.py`) — use forward slashes (`scripts/helper.py`) always |
| Unqualified MCP tool references | `bigquery_schema` instead of `BigQuery:bigquery_schema` — must use `ServerName:tool_name` format |
| Time-sensitive content | "Before August 2025", "deprecated in Q3 2024" — use "Legacy Patterns" sections instead |

### Code & Scripts (if skill includes scripts/ directory)

| Check | Rule |
|---|---|
| Scripts solve, don't punt | Scripts handle errors explicitly — don't just `raise` or `exit(1)` and let Claude figure it out |
| No voodoo constants | All magic numbers/timeouts/retries have comments explaining why that value |
| Error messages are helpful | Errors include context: "Field 'X' not found. Available fields: A, B, C" |
| Dependencies documented | Required packages listed in SKILL.md with install commands |
| Execute vs read intent clear | Instructions say whether to "Run script X" (execute) or "See script X" (read as reference) |

### Eval & Testing Checks

| Check | Rule |
|---|---|
| Eval existence | Check for `evals/` directory or `evals.json` — best practice is to include at least 3 test cases |
| Test scenarios documented | Skill or PR includes example prompts showing intended usage |

### marketplace.json Checks

- Plugin `description` is concise (not a paragraph)
- Skill paths exist and start with `./`
- No duplicate entries
- No nested marketplace.json files conflicting with root

## Review Output Format

Structure your review as:

```markdown
## PR #[N] Evaluation: [Title]

### Overview
- [X] files changed, +[N] additions
- SKILL.md: [N] lines (limit: 500)

### Issues

#### [Critical/Issue] #1: [Title]
[Evidence from the PR with specific line references]

#### [Critical/Issue] #2: [Title]
[Evidence]

...

### What's Good
[Acknowledge genuinely valuable content]

### Summary Recommendations
[Numbered list of specific actions]
```

Severity levels:
- **Critical**: Must fix before merge (>500 lines, missing frontmatter, junk files)
- **Issue**: Should fix (verbose content, anti-patterns, poor description)
- **Suggestion**: Nice to have (tighter wording, better examples)

## Fetching Skill Content

This skill supports two input modes. Detect automatically from user input; ask if ambiguous.

### Mode A: PR Review

```bash
# Get PR metadata and file list
gh pr view [N] --repo [owner/repo] --json title,body,state,additions,deletions,files

# Get the full diff
gh pr diff [N] --repo [owner/repo]

# Get comments (check for prior feedback)
gh api repos/[owner/repo]/issues/[N]/comments
```

Count SKILL.md lines from the diff by counting `+` lines in the SKILL.md file section (exclude the `+++ b/` header line).

### Mode B: Local Path Review

When given a directory path instead of a PR number:
1. Read `SKILL.md` from the provided directory
2. Search ancestor directories for `marketplace.json` to get sibling skill context. If not found, skip marketplace checks and note it in the report.
3. Count lines directly with `wc -l`

Output header format: `Skill Review: [name] (PR #N | Local: path)`

## Reference Guides

When posting review comments, link to these sources so authors can self-serve:

- [Official Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — Canonical guide from Anthropic (conciseness, progressive disclosure, naming, descriptions, anti-patterns)
- [td-skills CLAUDE.md](https://github.com/treasure-data/td-skills/blob/main/CLAUDE.md#claude-code-skills-best-practices) — TD-specific conventions and the 500-line rule
- [TreasureCode Skills Guide](https://treasure-data.atlassian.net/wiki/spaces/PROD/pages/4792778855) — Internal Confluence guide covering how skills load, the conciseness checklist, and publishing workflow
