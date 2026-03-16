---
name: schedule-task
description: Use when the user wants to create, set up, or configure a scheduled task in Treasure Studio. Covers TASK.md authoring, schedule.yaml configuration, script creation, and direct file-based task setup. Triggers on "create a scheduled task", "set up a recurring job", "automate daily report", "schedule a task", "cron job", etc.
---

# Schedule Task Creator

Create scheduled tasks in Treasure Studio that mix deterministic script execution with agent-driven analysis and delivery.

## Workflow

1. **Capture Intent** — What to automate, how often, what tools/data needed, where results go
2. **Create the Task** — Write files directly to `~/.tdx/schedule-tasks/{task-name}/`
3. **Validate** — Run `schedule_validate` to check schedule.yaml
4. **Reload** — Run `schedule_reload` to pick up new/changed tasks
5. **Test** — Use `schedule_run` to trigger immediate execution, check with `schedule_results`
6. **Enable** — Use `schedule_enable` to activate the cron schedule

## Task Directory Structure

```text
~/.tdx/schedule-tasks/{task-name}/
├── TASK.md              # Instructions (frontmatter + markdown body)
├── schedule.yaml        # Cron schedule, permissions, notifications
├── scripts/             # Deterministic scripts (bash, python, etc.)
├── reference/           # Immutable reference files (templates, specs, configs)
├── data/                # Persistent data across runs (snapshots, state, caches)
└── results/{run-id}/    # Auto-created per execution (pruned over time)
    ├── metadata.json    # System-managed run metadata
    └── output.md        # Execution summary (REQUIRED — agent writes this)
```

Create the directory and files directly using Write/Bash tools. The system will pick them up after `schedule_reload`.

## TASK.md Anatomy

YAML frontmatter with `name` and `description`, followed by markdown instructions:

```markdown
---
name: daily-sales-report
description: Fetch sales data, analyze trends, and post to Slack
---

## Steps

1. Run `bash scripts/fetch-sales-data.sh` to download data
2. Analyze the CSV: revenue, order count, top products
3. Compare with previous run (check results/ for yesterday's output.md)
4. Write results/{run_id}/output.md with findings
5. Post summary to Slack, attach chart via slack_upload_file

## Data Files

- `data/previous-metrics.csv` — Yesterday's metrics for trend comparison. Update after analysis.

## Notes

- Revenue thresholds: flag if daily total < $10K
- Use reference/report-template.html for formatting
- If fetch script fails, retry once then report the error
```

Additional sections (`## Notes`, `## Constraints`, `## Data Files`, `## Output Format`, etc.) are welcome. The `run_id` is provided to the agent automatically in the prompt.

### Using data/ for Cross-Run State

`data/` persists across runs (unlike `results/` which is pruned). When a task uses `data/`, **describe the files and their purpose in TASK.md** under a `## Data Files` section.

## schedule.yaml Format

```yaml
name: daily-sales-report
schedule: "0 9 * * 1-5"
enabled: false
skills:
  - sql-skills:trino
permissions:
  allow:
    - Bash
    - Write
    - slack_post_message
    - slack_upload_file
notify:
  on_success: slack:channel-name
  on_failure: slack:channel-name
context:
  max_turns: 20
  timeout: 600
```

Task name: lowercase, hyphens/underscores only, max 64 chars. Minimum cron interval: 5 minutes.

## MCP Tools

| Tool | Purpose |
|------|---------|
| `schedule_list` | List all tasks with status |
| `schedule_get` | Full task details including TASK.md and recent results |
| `schedule_validate` | Validate schedule.yaml against schema |
| `schedule_reload` | Reload tasks from disk (after creating/editing files) |
| `schedule_run` | Trigger immediate execution (for testing) |
| `schedule_results` | View past run summaries and output files (optional `limit`, default 10) |
| `schedule_enable` / `schedule_disable` | Toggle task on/off |
| `schedule_delete` | Remove task and all files |
