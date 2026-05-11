---
name: agent
description: Use when the user wants to create, configure, schedule, or run an agent in Treasure Work. Covers AGENTS.md authoring, the `agent_*` MCP tools, on-demand vs scheduled agents, lifecycle (draft → active → paused), and chat-based result inspection. Triggers on "create an agent", "set up an agent", "schedule a task", "set up a recurring job", "automate daily report", "cron job", "run X every weekday", etc.
---

# Agent Creator

Create global agents in Treasure Work — either **on-demand** (invoked from the UI, chat, or `@mention`) or **scheduled** (cron-driven). Both share one `AGENTS.md` format and lifecycle. Setting a `schedule:` field is the single switch that turns an agent into a scheduled one.

## Agent Location

Each agent is its own directory with a single `AGENTS.md`:

- **Global** (the only scope this skill creates): `~/.treasure-work/agents/{name}/AGENTS.md`
- **Workspace** (read-only via MCP; edit through the AgentSettings UI): `{workspace}/agents/{name}/AGENTS.md`

The directory is the agent's working directory at run time, so the body can reference relative paths and the agent can create supporting files as needed. No subdirectories are required.

## Workflow

**CRITICAL: Never just create and stop. Always run the agent and iterate until it works.**

1. **Capture intent** — what the agent should do, how often (if scheduled), what tools / skills it needs, where results should go.
   - **Ask the user** for notification channels (`notify.on_success` / `notify.on_failure`) before writing. Never assume a Slack channel — always confirm.
2. **Create** — call `agent_create` with `name`, `body` (the system prompt), and the initial frontmatter (description, icon, skills, `schedule` if recurring, etc.). New agents default to `status: draft` so scheduled ones don't fire until activated.
3. **Test run** — call `agent_run_now` to trigger an immediate run. It returns a `chatId`.
4. **Inspect output** — call `chat_read` with that `chatId`. While `in_progress: true` the run is still streaming — poll until it goes false. Read the last assistant turn to confirm the agent did what was intended.
5. **Review** — load the `agent-review` skill for a structure + quality audit.
6. **Iterate** — call `agent_update` to patch any field (body, skills, `allowed_tools`, `schedule`, …). Re-run with `agent_run_now`.
7. **Activate** — once the test run is clean, `agent_update` with `status: active`. Scheduled agents start firing on their cron; on-demand agents become first-class in the UI list.

Steps 3–5 are **mandatory** — an agent is not done until it has been run and reviewed at least once.

## AGENTS.md Anatomy

YAML frontmatter + Markdown body. **The body is the system prompt the agent sees on every run** — write it in the second person as instructions, not as a task description.

```markdown
---
name: daily-sales-report
display_name: Daily Sales Report
description: Fetch sales data, analyze trends, and post to Slack
icon: 📊
color: blue
status: draft            # draft | active | paused | resting
schedule: "0 9 * * 1-5"  # 5-field cron, ≥5-minute granularity; omit for on-demand
catch_up: false          # true = catch up one missed run after app restart
model: claude-sonnet-4-6 # optional per-agent model override
max_turns: 20
timeout: 600             # seconds, max 3600
autonomous: false        # true = Supervisor Agent auto-continues across turns
skills:
  - sql-skills:trino
allowed_tools:
  - Bash
  - Write
  - slack_post_message
  - slack_upload_file
notify:
  on_success: slack:channel-name   # or slack:dm
  on_failure: slack:channel-name   # or slack:dm
---

You are the Daily Sales Report agent. Each weekday morning:

1. Query yesterday's sales (`td_query` against the orders table) and gather revenue, order count, top products.
2. Compare with the previous run by looking at the last successful chat (use `chat_read` if needed).
3. Post a Slack summary; if revenue < $10K, flag the dip in the message.
4. If anything fails, retry once then surface the error via `notify.on_failure`.
```

### Frontmatter field reference

| Field | Purpose |
|---|---|
| `name` (required) | Slug (lowercase, hyphens / underscores, ≤64 chars). Becomes the directory name. Renaming is not supported — use `agent_create` + `agent_delete` to migrate. |
| `display_name` | Human-readable label shown in the agent list. |
| `description` | One-line summary for search / UI. |
| `icon` | Single emoji shown in the agent list. |
| `color` | UI accent: `blue` / `cyan` / `green` / `yellow` / `red` / `magenta`. |
| `status` | Lifecycle: `draft` (default — not listed prominently, never auto-fires) / `active` (listed, fires schedule) / `paused` / `resting`. **Only `active` fires scheduled runs.** |
| `schedule` | 5-field cron, ≥5-minute granularity. **Setting this turns the agent into a scheduled agent.** Empty string clears it. |
| `catch_up` | When true, one missed run is caught up after the app restarts. |
| `model` | Per-agent model override (e.g. `claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5`). |
| `max_turns` | Per-run turn cap. |
| `timeout` | Per-run timeout in seconds (1–3600). |
| `autonomous` | When true, runs in Supervisor / autonomous mode (no per-tool prompts). |
| `skills` | Skill ids to load (max 20). |
| `guides` | Guide ids to load (max 20). |
| `allowed_tools` | Tool-permission allowlist. Omit / empty = allow all controllable tools. Read-only baseline tools are always allowed. |
| `notify.on_success` / `notify.on_failure` | Notification target — `slack:channel-name` or `slack:dm`. |
| `work_folder` | Working directory at run time (defaults to the agent dir). |
| `profile` | TDX Studio profile (`@tdx-studio:<site>:<account-id>:<user-id>`) to scope the agent to. Omit for system-wide visibility. |
| `site`, `database`, `parent_segment`, `llm_project`, `llm_agent` | TD context hints injected into the prompt. |

**Do NOT write Slack channel names or notification targets in the body.** They belong in `notify.*` and are injected into the prompt at run time. Hard-coding them in the body causes drift when the frontmatter is updated.

### Scheduled vs. on-demand

| Trait | Scheduled (has `schedule:`) | On-demand (no `schedule:`) |
|---|---|---|
| Trigger | Cron tick (only while `status: active`) | UI Run button, `agent_run_now`, `@mention` |
| Catch-up | `catch_up: true` retries one missed run after restart | n/a |
| Best for | Daily reports, hourly checks, batch jobs | Reusable workflows, on-call helpers, manual triggers |

### Permissions

Use **short tool names** in `allowed_tools` — both SDK built-ins (`Bash`, `Write`, `Edit`, `WebFetch`, `WebSearch`, `NotebookEdit`) and Treasure Work MCP tools without the `mcp__work__` prefix (e.g. `slack_post_message`, `td_query`, `render_chart`).

Always allowed (no entry needed): `Read`, `Glob`, `Grep`, `ToolSearch`, `Skill`, `Task*`, `TodoWrite`, `mcp__td-docs__*`, plus the planning / MCP-resource tools.

### Notification targets

Use `slack:channel-name` for a Slack channel, or `slack:dm` for the user's DM. **Always use `slack:dm` exactly** — not "direct message", "DM", or other variants.

## MCP Tools

| Tool | Purpose |
|---|---|
| `agent_create` | Create a new global agent (`name`, `body`, optional frontmatter). Defaults to `status: draft`. Validates frontmatter against the schema — rejects the write on failure. |
| `agent_list` | Lightweight list of every agent (global + workspace), sorted with global first. |
| `agent_get` | Full frontmatter + body for one agent. A short name resolves either scope. |
| `agent_update` | Patch any frontmatter field and / or the body. Empty string clears scalars; empty array clears arrays. Omitted fields are unchanged. Renaming via `name` is not supported. |
| `agent_delete` | Delete a global agent and its directory. **Confirm with the user first** when the agent is scheduled or has been used recently. |
| `agent_run_now` | Trigger an immediate run of any agent (scheduled or on-demand, global or workspace). Returns `{ chatId }`. Does NOT advance the cron clock for scheduled agents. |
| `chat_read` | Read a run's transcript by `chatId`. Use to inspect `agent_run_now` output; works on in-flight chats too — poll while `in_progress: true`. |

### Important behaviors

- **Mutations are global-only.** `agent_create` / `agent_update` / `agent_delete` operate on `~/.treasure-work/agents/` only. Workspace agents are read-only via MCP — edit them through the AgentSettings UI.
- **No separate reload tool.** Every mutation broadcasts `AGENTS_CHANGED`, so the agent list and the open AgentSettings page refresh automatically.
- **No separate validate tool.** Validation happens on `agent_create` / `agent_update`; the error message lists each invalid field.
- **Unknown frontmatter keys are preserved.** If the file has keys outside the current schema (e.g. fields written by a future version), the writer leaves them alone.

## What's gone from the Schedule era

The Schedule-Task model has been retired. The fields and tools below **no longer exist** — do not write them, do not look them up:

- `TASK.md` — the body lives directly in `AGENTS.md`.
- `schedule.yaml` — the frontmatter lives directly in `AGENTS.md`.
- Required subdirs `scripts/` / `reference/` / `data/` / `results/` — none. Create files only as needed.
- `results/{run_id}/output.md` + `metadata.json` — every run produces a chat instead; read it with `chat_read`.
- `enabled: true / false` — replaced by `status: active | paused`.
- `permissions.allow` — flattened to `allowed_tools` at the top level.
- `context.max_turns` / `context.timeout` / `context.autonomous` — flattened to top-level fields.
- `cron:` — renamed to `schedule:`.
- Storage roots `~/.tdx/schedule-tasks/` and `{workspace}/schedules/` — replaced by `~/.treasure-work/agents/` and `{workspace}/agents/`.
- `schedule_*` MCP tools (`create_schedule`, `schedule_list`, `schedule_get`, `schedule_validate`, `schedule_reload`, `schedule_run`, `schedule_results`, `schedule_enable` / `schedule_disable`, `schedule_delete`, `schedule_kill`) — all replaced by the `agent_*` surface above.
