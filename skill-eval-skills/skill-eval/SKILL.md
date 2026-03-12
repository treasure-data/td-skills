---
name: skill-eval
description: "Run a full evaluation of a Claude Code skill by orchestrating structure review, trigger evaluation, and output quality assessment. Use when you want a comprehensive skill review from a local path or PR."
---

# Skill Evaluation (Orchestrator)

Run all three review skill evaluations in sequence to produce a consolidated skill quality report.

## Input

Accept either:
- **Local path**: A directory containing a `SKILL.md` file (e.g., `/path/to/my-skill/`)
- **PR number + repo**: A pull request that adds or modifies a skill

**Validation**: Before starting, confirm the input contains a valid skill:
- Local path: verify `SKILL.md` exists in the directory
- PR: verify the diff includes a `SKILL.md` file

If the input is ambiguous or invalid, ask the user to clarify.

## Evaluation Passes

Run each pass in order. For each pass, **read the corresponding SKILL.md file** to get the full methodology, then follow its instructions:

### Pass 1: Structure Review

Read `skill-pr-review/SKILL.md` from this skill's sibling directory. Follow its review checklist to evaluate file structure, line count, description quality, content conciseness, and anti-patterns.

### Pass 2: Trigger Evaluation

Read `skill-trigger-eval/SKILL.md` from this skill's sibling directory. Follow its evaluation process to generate test prompts and score precision, recall, and overlap with sibling skills.

### Pass 3: Output Quality (LLM-as-Judge)

Read `skill-output-eval/SKILL.md` from this skill's sibling directory. Follow its evaluation process to create test scenarios, evaluate instruction quality, and run LLM-as-judge self-evaluation with structured PASS/FAIL results.

## Handling Failures

- If a pass fails (e.g., missing frontmatter in Pass 1), **continue to the remaining passes** — each pass evaluates independently.
- Record the failure in the consolidated table and include the details in the report.
- If the input is not a valid skill (no SKILL.md found), stop and report the error instead of running passes.

## Consolidated Output

After all three passes, produce a single consolidated report:

```markdown
## Skill Evaluation: [skill-name]

**Source**: [Local: /path/to/skill | PR #N in owner/repo]

### Pass Results

| Pass | Skill Used | Verdict | Key Finding |
|------|-----------|---------|-------------|
| 1. Structure | skill-pr-review | PASS/FAIL | [one-line summary] |
| 2. Triggers | skill-trigger-eval | PASS/FAIL | [one-line summary] |
| 3. Output Quality | skill-output-eval | PASS/FAIL (X/Y criteria, Z%) | [one-line summary] |

### Overall Verdict: [PASS / NEEDS WORK / FAIL]

### Top 3 Actions
1. [Most impactful improvement]
2. [Second improvement]
3. [Third improvement]

### Detailed Results
[Include the full output from each pass below, separated by horizontal rules]
```

## Verdict Criteria

- **PASS**: All three passes pass, output quality ≥80%
- **NEEDS WORK**: One pass fails or output quality 50-79%
- **FAIL**: Two+ passes fail or output quality <50%
