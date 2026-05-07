---
name: schedule-review
description: Use when the user wants to review, validate, or check a scheduled task before enabling it. Reviews the prompt body for clarity, error handling, and fitness for purpose. Triggers on "review this task", "check my scheduled task", "validate task", "is this task ready", etc.
---

# Schedule Task Review

Most structural validation (cron syntax, field shape, name constraints) is handled by the `schedule_*` MCP tools at create / update time. This skill focuses on the part the tools can't check: **does the prompt body actually accomplish the user's intent?**

## Workflow

1. Ask the user which schedule to review (or infer from context — e.g., the last one they created).
2. Fetch its current state: `schedule_get` with the schedule's name.
3. Read the prompt body in the returned record (the agent's instructions when the schedule fires).
4. Review against the checklist below.
5. Present a brief report with concrete change suggestions; if the user agrees, apply them via `schedule_update`.

## Quality checklist

For each item below, rate **GOOD / NEEDS IMPROVEMENT / MISSING** and give a one-line fix when not GOOD.

1. **Concrete, numbered steps.** Could a fresh agent execute them without guessing? "Look at the data" is bad; "run `gh pr list --json …` and filter where `reviewDecision != APPROVED`" is good.
2. **Logical order** — typically fetch → process → analyze → output → notify. Out-of-order steps are a smell.
3. **Specific tool / command names** where the choice matters (`gh pr list`, `slack_post_message`, `Read`, etc.) so the agent doesn't reach for a different tool.
4. **Failure handling** — what happens if a script errors, an API is down, the input is empty? At minimum: "If X fails, post a brief error to the same channel and stop."
5. **Output format** is explicit — markdown summary? CSV? Slack message with what shape? "Send a report" is missing; "post a markdown summary with one bullet per PR (title + URL)" is good.
6. **No hidden state** — the prompt should be self-contained. The agent doesn't remember anything between runs.
7. **Cron matches purpose** — `*/5 * * * *` for a daily report is wrong; `0 9 * * *` is right.
8. **Notification target named** if the task notifies. Slack channel name should be in the prompt, not assumed.

## Reporting

Keep it short. Example:

```markdown
## Review: pr-triage

- **Concrete steps**: GOOD
- **Logical order**: GOOD
- **Specific tools**: GOOD (names `gh`, `slack_post_message`)
- **Failure handling**: NEEDS IMPROVEMENT — no fallback if `gh` errors
- **Output format**: GOOD (markdown summary spec'd)
- **No hidden state**: GOOD
- **Cron matches purpose**: GOOD (`0 9 * * 1-5` for a daily weekday summary)
- **Notification target**: GOOD (`#engineering-prs`)

### Suggested fixes
1. Add an explicit failure step at the end: "If any step above errors, post `'PR triage failed: {error}'` to the same channel and stop."

Apply with `schedule_update`?
```

If the user agrees, call `schedule_update` with the new `prompt` body.
