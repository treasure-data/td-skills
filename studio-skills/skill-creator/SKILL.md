---
name: skill-creator
description: Use when the user asks to create, write, build, or define a new skill, or when they want to save reusable instructions for future chat sessions. Orchestrates the full pipeline: intake questions, skill writing, duplicate/security checks, quality evaluation, and local registration.
---

# Skill Creator

Master orchestrator for creating, validating, and registering new skills in Treasure Studio. Runs the full pipeline: intake → write → check → eval → register.

## Workflow

Execute these steps in order. Do not skip steps. If a step fails, stop and report the failure.

### Step 1: Gate Questions

Before investing effort in skill authoring, ask these two pass/fail questions first:

1. **Is this for all customers or a specific one?**
   - If customer-specific → soft redirect: "Customer-specific workflows are better handled as direct instructions or project-level CLAUDE.md files, not shared skills. Want me to help with the task directly instead?"
   - If all customers → pass

2. **Will you need this more than once?**
   - If one-off → soft redirect: "For one-time tasks, just ask Claude directly — no skill needed. Want me to help with the task now?"
   - If reusable → pass

If either gate fails, do not proceed. Offer to help with the underlying task instead.

### Step 2: Scoping Questions

If both gates pass, ask these four questions to define the skill:

1. **What problem does this solve?** — Forces clarity; prevents "solution in search of a problem" skills.
2. **Who has this problem?** — Grounds the skill in a real user persona, not an abstraction.
3. **What should Claude do differently with this skill?** — The key "is this actually a skill?" test. If Claude already handles it well without the skill, the skill isn't needed. This also serves as the functional spec.
4. **What should the skill NOT do?** — Defines boundaries and constraints.

Use the answers to derive trigger conditions (for the description field), expected inputs/outputs, and edge cases.

### Step 3: Write the Skill

Use the `write_skill` tool to create or update the skill. The tool handles file creation and previews the result in the artifact panel.

### Step 4: Skill Check (Automated)

Immediately after writing, run the **skill-check** process against the newly created skill. Read the `skill-check` skill's SKILL.md from the sibling directory (`~/.cache/tdx/.claude/skills/skill-check/SKILL.md`) and follow its instructions to run all 4 checks:

1. **Dedupe** — Is this too similar to existing skills?
2. **Categorize** — Which product area does this belong to?
3. **Validate** — Are there hardcoded credentials or private data?
4. **Impact** — Is this new or a breaking change?

**If FAIL on Dedupe or Validate**: Stop and report the issues. Ask the user whether to fix and retry, or abort.
**If WARN**: Report warnings but continue.
**If PASS**: Continue to Step 5.

### Step 5: Skill Eval — Pre-flight Check (Automated)

Run the **skill-eval** process against the newly created skill. Read the `skill-eval` skill's SKILL.md from the sibling directory (`~/.cache/tdx/.claude/skills/skill-eval/SKILL.md`) and follow its instructions to run all 3 evaluation passes:

1. **Structure Review** (skill-pr-review)
2. **Trigger Evaluation** (skill-trigger-eval)
3. **Output Quality** (skill-output-eval)

**If overall verdict is FAIL**: Stop and report. Ask the user whether to fix and retry, or abort.
**If NEEDS WORK**: Report findings but continue — these are improvements, not blockers.
**If PASS**: Continue to Step 6.

### Step 6: Local Registration

The skill is already registered locally via `write_skill` in Step 3. Confirm to the user that it is available for testing.

### Step 7: Completion Message

After all checks pass (or pass with warnings), respond with exactly:

> Your skill has been created and passed initial checks. Please test it locally. When you are ready to submit, run the `submit-skill` command.

Include a summary table:

```markdown
| Step | Result |
|------|--------|
| Gate Questions | PASS |
| Scoping | Complete |
| Write | Created at [path] |
| Skill Check | [PASS/WARN] — [summary] |
| Skill Eval | [PASS/NEEDS WORK] — [summary] |
| Registration | Local — ready for testing |
```

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