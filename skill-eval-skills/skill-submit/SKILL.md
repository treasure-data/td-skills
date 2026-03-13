---
name: skill-submit
description: Submit a skill to GitHub after final evaluation. Defaults to dry-run mode for safety. Handles git push, issue creation, and PR creation with automatic labeling. Use when the user says "submit skill", "submit-skill", or is ready to publish a skill they've been testing locally.
---

# Skill Submit

Final gate in the skill development pipeline. Performs a final evaluation, then handles GitHub submission via `gh` CLI. Defaults to dry-run mode for safety.

## Workflow

Execute these steps in order. Do not skip steps.

### Step 1: Identify the Skill

Accept either:
- A local path to a directory containing `SKILL.md`
- The name of a skill just created in this session (resolve to `~/.cache/tdx/.claude/skills/<name>/SKILL.md`)

Confirm the SKILL.md exists before proceeding.

### Step 2: Final Evaluation (Re-Evaluation Gate)

Run the **skill-eval** process against the skill. Read the `skill-eval` skill's SKILL.md from `~/.cache/tdx/.claude/skills/skill-eval/SKILL.md` and follow its instructions to run all 3 evaluation passes:

1. **Structure Review** (skill-pr-review)
2. **Trigger Evaluation** (skill-trigger-eval)
3. **Output Quality** (skill-output-eval)

This catches any errors introduced during the user's local testing and iteration.

**If overall verdict is FAIL**: Stop immediately. Report the errors with specific line references and recommendations. Do not proceed to submission.
**If NEEDS WORK or PASS**: Continue to Step 3.

### Step 3: Determine Mode

**Default is DRY-RUN.** Only proceed in production mode if the user explicitly says one of:
- "PROD"
- "SUBMIT FOR REAL"
- "submit for real"

If neither phrase is present in the user's message, treat as dry-run. Do not ask — just default to dry-run.

### Step 4: Prepare Submission Artifacts

Generate these artifacts from the skill's SKILL.md content:

**Commit Message:**
```
Add skill: <skill-name>

<one-line description from frontmatter>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**PR Title:**
```
Add skill: <skill-name>
```

**GitHub Issue Body (Business Case):**
```markdown
## New Skill Submission: <skill-name>

### Description
<description from frontmatter>

### Problem
<derived from skill content — what problem does this skill solve?>

### Category
<suggested category from skill-check if available, otherwise best guess>

### Checklist
- [x] Passes skill-eval (structure, triggers, output quality)
- [x] Passes skill-check (no duplicates, no credentials, categorized)
- [x] Tested locally
```

**PR Body:**
```markdown
## Summary
- Adds new skill: `<skill-name>`
- <one-line description>

Closes #<IssueNumber>

## Skill Details
- **Name:** <skill-name>
- **Category:** <category>
- **Line count:** <N> lines
- **Eval verdict:** <PASS/NEEDS WORK>

## Test plan
- [ ] Invoke skill with a matching prompt
- [ ] Verify output matches expected format
- [ ] Confirm no overlap with existing skills

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Step 5A: Dry-Run Output

If in dry-run mode, output the following and stop:

```markdown
## Submission Preview (DRY-RUN)

**Mode:** Dry-run — no changes pushed, no PRs created.

### Commit Message
<show full commit message>

### PR Title
<show PR title>

### GitHub Issue
<show full issue body>

### PR Description
<show full PR body, with #ISSUE_NUMBER as placeholder>

---

To submit for real, run this skill again and say **SUBMIT FOR REAL**.
```

Do not run any git or gh commands in dry-run mode.

### Step 5B: Production Submission

If in production mode, execute these steps in order:

**1. Git Operations:**
```bash
git add .
git commit -m "<commit message from Step 4>"
git push -u origin HEAD
```

**2. Ensure the "skill" label exists:**

Before creating the issue or PR, guarantee the label exists in the target repo. Run:
```bash
gh label create "skill" --repo <owner>/<repo> --description "New skill submission" --color "0E8A16" 2>/dev/null || true
```

This is idempotent — it creates the label if missing and silently succeeds if it already exists. This step is critical because downstream triaging workflows depend on the "skill" label.

**3. Issue Creation:**
```bash
gh issue create --repo <owner>/<repo> --title "New Skill: <skill-name>" --body "<issue body from Step 4>" --label "skill"
```

Capture the issue number from the output.

**4. PR Creation:**

Do NOT use `--label` with `gh pr create` — it can fail due to missing OAuth scopes (`read:project`). Instead, create the PR without the label, then apply the label via the API:
```bash
gh pr create --repo <owner>/<repo> --title "<PR title>" --body "<PR body with Closes #IssueNumber>"
```

Capture the PR number from the output.

**5. Label the PR:**

Apply the label using the issues API (PRs are issues in GitHub's API):
```bash
gh api repos/<owner>/<repo>/issues/<PR-number>/labels --method POST -f "labels[]=skill"
```

If this fails, report the error but do not block — the PR is still valid without the label.

### Step 6: Completion

After successful submission, respond with:

```markdown
## Skill Submitted

| Item | Details |
|------|---------|
| Skill | `<skill-name>` |
| Issue | #<number> — <url> |
| PR | #<number> — <url> |
| Label | `skill` |
| Branch | `<branch-name>` |

Your skill has been submitted for review. Track the PR at the link above.
```

If any git or gh command fails, report the exact error and suggest remediation steps. Do not retry automatically.