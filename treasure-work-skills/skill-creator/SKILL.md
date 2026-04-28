---
name: skill-creator
description: Use when the user asks to create, write, build, or define a new skill, or when they want to save reusable instructions for future chat sessions. Covers SKILL.md authoring, description optimization, and writing patterns.
---

# Skill Creator

You are an expert at writing custom skills for Treasure Studio. Skills are SKILL.md files with YAML frontmatter that become reusable instructions available in all future chat sessions.

## Workflow

1. **Capture Intent** — Before writing, understand:
   - What should the skill do?
   - When should it trigger? (What keywords, contexts, or user requests?)
   - What are the expected inputs and outputs?
   - Are there edge cases or constraints?

2. **Write the Skill** — Use the `write_skill` tool to create or update the skill. The tool handles file creation and previews the result in the artifact panel.

3. **Review with User** — After writing, explain what you created and ask if adjustments are needed.

## SKILL.md Anatomy

Every skill is a single markdown file with YAML frontmatter:

```markdown
---
name: my-skill-name
description: When to use this skill and what it does. Be specific and "pushy" about triggers.
---

# Skill Title

Instructions for Claude written in imperative form.

## Steps
1. First, do X
2. Then, do Y

## Output Format
- Use this template: ...

## Examples

### Example 1: [scenario]
**Input:** User asks "..."
**Output:** [expected response pattern]
```

### Frontmatter Fields

- **name** (required): Lowercase identifier with hyphens/underscores (e.g., `code-review`, `sql_helper`). Max 64 characters.
- **description** (required): Controls when the skill triggers. This is the most important field.

### Writing an Effective Description

The description determines whether Claude activates the skill. Write it to be **specific and assertive**:

**Bad:** `Helps with code review`
**Good:** `Use when the user asks to review code, check for bugs, audit code quality, or requests a PR review. Covers best practices, security issues, performance, and readability.`

Tips:
- Start with "Use when..." to clearly define trigger contexts
- List specific keywords and phrases that should activate the skill
- Mention what the skill covers (scope)
- Be "pushy" — undertriggering is more common than overtriggering

## Writing Effective Instructions

### Use Imperative Form
Write instructions as direct commands, not descriptions.

**Bad:** `This skill helps users write SQL queries`
**Good:** `Write optimized SQL queries for Treasure Data's Trino engine.`

### Progressive Disclosure
Structure content from most-used to least-used:
1. **Overview** — What the skill does (2-3 sentences)
2. **Core Instructions** — The main workflow (steps)
3. **Output Format** — Templates for consistent output
4. **Examples** — Concrete input/output pairs
5. **Edge Cases** — Special situations (at the end)

### Include Examples with Input/Output
Examples are the most effective way to guide behavior:

```markdown
## Examples

### Example: Summarize a table
**Input:** "Describe the users table"
**Output:**
The `users` table contains 3 columns:
- `id` (bigint) — Primary key
- `name` (varchar) — User display name
- `created_at` (timestamp) — Account creation time
```

### Define Output Formats
When the skill produces structured output, provide templates:

```markdown
## Output Format
Always respond with:
1. A one-line summary
2. A bullet list of findings
3. A code block with the fix (if applicable)
```

### Keep It Focused
- One skill = one capability
- Under 200 lines is ideal; under 500 lines maximum
- Remove fluff — every line should influence Claude's behavior
- Explain *why* when rules aren't obvious (models follow reasoning better than arbitrary rules)

### Writing Style
- Use markdown headers to organize sections
- Use code blocks for templates and examples
- Use bullet lists for rules and constraints
- Bold key terms on first use
- Don't over-qualify with "MUST", "ALWAYS", "NEVER" — use them sparingly for truly critical rules
