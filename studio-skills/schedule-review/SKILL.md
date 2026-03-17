---
name: schedule-review
description: Use when the user wants to review, validate, or check a scheduled task before enabling it. Runs two parallel sub-agent checks — structural validation and quality assessment. Triggers on "review this task", "check my scheduled task", "validate task", "is this task ready", etc.
---

# Schedule Task Review

Review a scheduled task by running two parallel sub-agent checks using TaskCreate:

1. **Structure check** — Validates directory layout, file formats, and schema
2. **Quality check** — Assesses whether the task meets the user's intent

## Workflow

1. Ask the user which task to review (or infer from context)
2. Read the task's TASK.md and schedule.yaml
3. Launch both checks in parallel using TaskCreate
4. Wait for results using TaskGet
5. Present a unified report with pass/fail and actionable suggestions

## Step 1: Read Task Files

```
Read ~/.tdx/schedule-tasks/{task-name}/TASK.md
Read ~/.tdx/schedule-tasks/{task-name}/schedule.yaml
List files in scripts/, reference/, data/
```

## Step 2: Launch Parallel Checks

Use `TaskCreate` to spawn two sub-agents simultaneously.

### Sub-agent 1: Structure Check

```
TaskCreate with prompt:
"Review this scheduled task for structural correctness.

TASK.md content:
{paste TASK.md content}

schedule.yaml content:
{paste schedule.yaml content}

Files in task directory:
{list of files}

Check the following:
1. TASK.md has valid YAML frontmatter with `name` and `description`
2. schedule.yaml has valid fields: name, schedule (cron), enabled, catch_up (optional)
3. Task name in TASK.md matches schedule.yaml name
4. Cron expression is valid and not too frequent (minimum 5 minutes)
5. permissions.allow lists all tools referenced in TASK.md steps (Bash for scripts, Write for output, slack_* for notifications)
6. Scripts referenced in TASK.md steps exist in scripts/
7. Reference files mentioned in TASK.md exist in reference/
8. data/ files described in TASK.md exist if the task expects prior state
9. No Slack channels or notification targets hardcoded in TASK.md (should be in schedule.yaml notify section only)
10. output.md is mentioned as a required output in Steps

Report: PASS/FAIL for each item, with specific fix instructions for failures."
```

### Sub-agent 2: Quality Check

```
TaskCreate with prompt:
"Review this scheduled task for quality and fitness for purpose.

TASK.md content:
{paste TASK.md content}

schedule.yaml content:
{paste schedule.yaml content}

The user's original request was: {describe what the user asked for}

Check the following:
1. Steps are clear and unambiguous — could another agent execute them without guessing?
2. Steps are in a logical order (fetch → process → analyze → output → notify)
3. Error handling is addressed (what to do if a script fails, API is down, etc.)
4. output.md requirements are clear (what should be in the summary?)
5. The schedule frequency matches the task's purpose (e.g., not checking hourly for a daily report)
6. Skills listed are appropriate for the task
7. If data/ is used, the update cycle is clear (when to save, when to compare)
8. The task is self-contained — no implicit dependencies on external state

Report: Rate each item as GOOD/NEEDS IMPROVEMENT/MISSING, with specific suggestions."
```

## Step 3: Collect and Report

Wait for both tasks to complete using `TaskGet`, then present a unified report:

```markdown
## Task Review: {task-name}

### Structure: {PASS/FAIL}
- [x] Valid TASK.md frontmatter
- [x] Valid schedule.yaml schema
- [ ] Missing permission: Bash (needed for scripts/fetch.sh)
...

### Quality: {GOOD/NEEDS IMPROVEMENT}
- [x] Steps are clear
- [ ] No error handling for script failure
- [ ] output.md format not specified
...

### Recommended Fixes
1. Add `Bash` to permissions.allow
2. Add error handling step: "If fetch script fails, retry once..."
3. Specify output.md format in a `## Output Format` section
```
