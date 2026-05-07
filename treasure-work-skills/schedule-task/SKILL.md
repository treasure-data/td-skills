---
name: schedule-task
description: Use when the user wants to create, set up, or configure a scheduled task in Treasure Work. Covers schedule creation, cron config, prompt authoring, and management via the schedule_* MCP tools. Triggers on "create a scheduled task", "set up a recurring job", "automate daily report", "schedule a task", "cron job", etc.
---

# Schedule Task Creator

Create scheduled tasks in Treasure Work — markdown files at `~/.treasure-work/schedules/{name}.md` (YAML frontmatter + prompt body) that run on a cron and execute their prompt as agent instructions when they fire.

## Storage layout

Schedules live as one markdown file per schedule:

```text
~/.treasure-work/schedules/
  {name}.md          # YAML frontmatter + markdown body (the prompt)

~/.treasure-work/logs/
  schedule-events.jsonl   # append-only run lifecycle journal (read-only for the agent)
```

**File format** — frontmatter holds config; the body IS the agent's instructions when the schedule fires:

```markdown
---
cron: "0 9 * * 1-5"
enabled: true
description: Triage open PRs and post a summary to Slack
---

## Steps

1. Run `gh pr list --json title,author,reviewDecision,url` and parse the JSON.
2. Filter to PRs where `reviewDecision != APPROVED` and the author is not a bot.
3. Build a markdown summary grouped by repository.
4. Post the summary to `#engineering-prs` via `slack_post_message`.
5. If `gh` returns an error, post a brief failure message to the same channel and stop.
```

The filename without `.md` is the schedule's identifier (`github-pr-triage.md` → name `github-pr-triage`). Names should be short, lowercase, and hyphen-separated (max 64 chars).

### Frontmatter fields

| Field | Required | Notes |
|-------|----------|-------|
| `cron` | yes | 5-field vixie cron (`min hour dom month dow`); minimum 5-minute interval |
| `enabled` | yes | `true` to run on the cron; `false` to keep the file but pause |
| `description` | no | One-line summary shown in the UI list |
| `workspace` | no | Origin tag (e.g. `default`) — set by migration; not required for new schedules |

**No** `permissions.allow`, `notify.on_*`, `goal`, `output.note`, `catch_up`, `autonomous`, `status`, or `profile` — those are gone in the new design. Auth and notification targets go in the prompt body itself; the agent decides which tools to call based on its instructions.

## Workflow

**CRITICAL: Don't just create the schedule and stop. Always test-run it and iterate until the agent's behaviour matches the user's intent.**

1. **Capture intent** — what to automate, how often, what tools/data needed, where results go.
   - **Ask the user** for output channel (Slack channel, written note, etc.) before creating the schedule. Never assume a Slack channel — always confirm.
2. **Create** — call `schedule_create` with `name`, `prompt` (the markdown body), `cron`, optional `description`. Returns the new file path.
3. **Test run** — call `schedule_run_now` to fire one immediately. Returns a `chatId`.
4. **Inspect** — open the run's chat (the user can navigate to it via the chatId, or you can summarize what happened). Did the agent do what was intended?
5. **Iterate** — if the run failed or the output is wrong, call `schedule_update` to revise the prompt / cron, then go back to step 3.
6. **Enable** — once a test run succeeds, ensure `enabled: true` (it defaults to true on create, but if you set it false during iteration, flip it back with `schedule_set_enabled`).

Steps 3–5 are mandatory. A schedule isn't done until it has been test-run successfully at least once.

## MCP tools (`schedules` server)

| Tool | Purpose |
|------|---------|
| `schedule_create` | Create a new schedule. Args: `name`, `prompt`, `cron`, optional `description`, optional `enabled` (default `true`). Validates cron + writes `{name}.md`. |
| `schedule_list` | List all schedules with cron, status, last run, next run. Use this first when looking for an existing schedule. |
| `schedule_get` | Full record for one schedule, including the prompt body. |
| `schedule_update` | Patch description / prompt / cron / enabled. Names are stable; to rename, use `schedule_delete` + `schedule_create`. |
| `schedule_set_enabled` | Toggle on/off (convenience over `schedule_update`). |
| `schedule_delete` | Remove the schedule (deletes the `.md` file; preserves the events log). Confirm with the user before deleting frequently-running schedules. |
| `schedule_run_now` | Trigger a one-off run. Does NOT advance the cron. Returns the run's `chatId`. |

The MCP tools are the recommended path because they validate cron, normalize fields, and emit lifecycle events that the runner uses for status display. Direct `Read` / `Edit` of `{name}.md` is also supported for ad-hoc edits the tools don't cover (e.g., bulk renames in an editor).

## Writing a good prompt body

The body of `{name}.md` is what the agent will see as its `### Agent Instructions` when the schedule fires. Treat it like a self-contained task prompt:

- **Concrete steps**, numbered, in execution order. Don't say "look at the data" — say "run X, parse Y, write Z."
- **Specific tool names** when the choice matters (`gh pr list`, `slack_post_message`, etc.). The agent has access to whatever MCP tools are registered; naming them in the prompt makes the choice explicit.
- **Failure mode** — what should happen if a script errors, an API is down, output is empty? At minimum: "If X fails, post a brief error to the same channel and stop."
- **Output format** — markdown summary? CSV? Slack message? Be explicit.
- **No hidden state** — the prompt should be self-contained. The agent doesn't remember anything between runs unless the prompt tells it to read from somewhere persistent.

## Working directory at run time

When a schedule fires, the agent's working directory is the user's home directory (`$HOME`). If the prompt references files, use absolute paths or have the agent `cd` first. There is no per-task `scripts/` / `reference/` / `data/` directory anymore — inline scripts in the prompt body via heredocs (`bash <<'EOF' … EOF`), or have the agent `Write` files where the user wants them.

## Example: bare-minimum schedule

```text
schedule_create with:
  name: pr-triage
  cron: "0 9 * * 1-5"
  description: Triage open PRs and post a summary to Slack
  prompt: |
    ## Steps
    1. Run `gh pr list --json title,author,reviewDecision,url --search "is:open"` and parse the JSON.
    2. Filter to PRs where `reviewDecision != APPROVED` and `author.login` is not a bot.
    3. Group by repository, build a one-line bullet per PR (title + URL).
    4. Post the summary to `#engineering-prs` via `slack_post_message`. Title: "Open PRs · `2026-05-07`".
    5. If `gh` errors out, post "PR triage failed: {error}" to the same channel and stop.
```

After creating, run `schedule_run_now` and watch the resulting chat to confirm the agent behaves correctly before leaving it on the cron.
