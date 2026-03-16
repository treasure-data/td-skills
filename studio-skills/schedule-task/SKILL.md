---
name: schedule-task
description: Use when the user wants to create, set up, or configure a scheduled task in Treasure Studio. Covers TASK.md authoring, schedule.yaml configuration, script creation, and the schedule_create MCP tool. Triggers on "create a scheduled task", "set up a recurring job", "automate daily report", "schedule a task", etc.
---

# Schedule Task Creator

Create scheduled tasks in Treasure Studio that mix deterministic script execution with agent-driven analysis and delivery.

## Workflow

1. **Capture Intent** — Before creating, understand:
   - What should the task do? What data or systems are involved?
   - How often should it run? (cron schedule)
   - What's deterministic (→ scripts/) vs. what needs judgment (→ TASK.md instructions)?
   - Where should results go? (Slack channel, file output, etc.)

2. **Create the Task** — Use the `schedule_create` tool with TASK.md instructions, scripts, and reference files.

3. **Test** — Use `schedule_run` to trigger immediate execution. Check results with `schedule_results`.

4. **Enable** — Once confirmed working, use `schedule_enable` to activate the cron schedule.

## Task Directory Structure

```
~/.tdx/schedule-tasks/{task-name}/
├── TASK.md              # Instructions (frontmatter + markdown body)
├── schedule.yaml        # Cron schedule, permissions, notifications
├── scripts/             # Deterministic scripts (bash, python, etc.)
├── reference/           # Templates, specs, configs
└── results/{run-id}/    # Auto-created per execution
    ├── metadata.json    # System-managed run metadata
    └── output.md        # Execution summary (REQUIRED — agent writes this)
```

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

## Notes

- Revenue thresholds: flag if daily total < $10K
- Use reference/report-template.html for formatting
- If fetch script fails, retry once then report the error
```

### Writing Effective Instructions

- **Steps section** — Numbered list of what the agent should do, in order
- **Additional sections** are welcome — add `## Notes`, `## Constraints`, `## Context`, `## Output Format`, or any heading that helps clarify the task
- Reference scripts by relative path: `bash scripts/fetch.sh`
- Reference past results: `check results/ for previous output.md`
- The run_id is provided to the agent automatically in the prompt

### Script vs. Agent Decision

| Use scripts/ for | Use TASK.md instructions for |
|------------------|------------------------------|
| API calls, data fetching | Analysis, interpretation |
| File transformations | Summarization, reporting |
| Health checks, probes | Anomaly detection, alerting |
| Anything with fixed logic | Anything needing judgment |

## schedule_create Tool

```
schedule_create({
  name: "daily-sales-report",
  description: "Fetch sales data, analyze trends, and post to Slack",
  instructions: "## Steps\n1. Run `bash scripts/fetch-sales-data.sh`\n...",
  schedule: "0 9 * * 1-5",
  skills: ["sql-skills:trino"],
  permissions: ["Bash", "Write", "slack_post_message", "slack_upload_file"],
  scripts: [
    { name: "fetch-sales-data.sh", content: "#!/bin/bash\ntdx query ..." }
  ],
  reference_files: [
    { name: "report-template.html", content: "<html>..." }
  ]
})
```

The task starts **disabled** by default. The `schedule` field is a 5-field cron expression (minimum interval: 5 minutes).

### Configuration in schedule.yaml

Additional settings not covered by `schedule_create` args can be added by editing schedule.yaml directly via `schedule_update`:

- `skills` — Skills the agent should load (e.g., `sql-skills:trino`)
- `permissions.allow` — Tools the agent can use (e.g., `Bash`, `Write`, `slack_post_message`)
- `notify.on_success` / `notify.on_failure` — Slack channels (e.g., `slack:channel-name`)
- `context.max_turns` — Max agent turns (default: unlimited)
- `context.timeout` — Max execution time in seconds (default: 600, max: 3600)

## Other MCP Tools

| Tool | Purpose |
|------|---------|
| `schedule_list` | List all tasks with status |
| `schedule_get` | Full task details including TASK.md and recent results |
| `schedule_run` | Trigger immediate execution (for testing) |
| `schedule_results` | View past run summaries and output files |
| `schedule_update` | Modify TASK.md or schedule.yaml |
| `schedule_enable` / `schedule_disable` | Toggle task on/off |
| `schedule_delete` | Remove task and all files |

## Best Practices

- **Start disabled** — Test with `schedule_run` before enabling
- **Scripts for deterministic work** — Put API calls, data fetching, transformations in scripts/
- **Agent for judgment** — Analysis, summarization, anomaly detection, natural language output
- **Include all needed permissions** — Bash for scripts, Write for output, slack_* for delivery
- **output.md is mandatory** — The agent must always write an execution summary to results/{run_id}/output.md
