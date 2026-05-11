---
name: agent-review
description: Use when the user wants to review, validate, or check an agent before activating it. Runs two parallel sub-agent checks — structural validation of `AGENTS.md` against the schema, and a quality assessment against the user's intent. Triggers on "review this agent", "check my agent", "validate agent", "is this agent ready", "review the agent before activating", etc.
---

# Agent Review

Review an agent's `AGENTS.md` by running two parallel sub-agent checks via `TaskCreate`:

1. **Structure check** — frontmatter schema, body coherence, schedule validity, permission completeness
2. **Quality check** — does the agent fulfil the user's intent?

## Workflow

1. Ask the user which agent to review (or infer from context).
2. Locate the agent:
   - Global: `~/.treasure-work/agents/{name}/AGENTS.md`
   - Workspace: `{workspace}/agents/{name}/AGENTS.md`
   - Use `agent_get` if the path / scope is unclear.
3. Fetch the agent's frontmatter + body via `agent_get { name }`.
4. (Optional, for agents that have already run) fetch the most recent run via `chat_read` to look for execution issues that surface only at run time.
5. Launch both checks in parallel using `TaskCreate`.
6. Collect with `TaskGet` and present a unified report.

## Step 1: Fetch the Agent

```
agent_get { name: "<agent-name>" }
```

Returns the parsed frontmatter (full `WorkspaceAgentFrontmatter` shape) and the markdown body.

## Step 2: Launch Parallel Checks

Use `TaskCreate` to spawn both sub-agents simultaneously.

### Sub-agent 1: Structure Check

```
TaskCreate with prompt:
"Review this agent's AGENTS.md for structural correctness against the WorkspaceAgentFrontmatter schema.

Frontmatter (parsed):
{paste frontmatter JSON}

Body (system prompt):
{paste body}

Check the following — PASS / FAIL with a specific fix instruction on failure:

1. `name` is lowercase alphanumeric with hyphens / underscores, ≤64 chars. Matches the directory name.
2. `status` is one of: draft / active / paused / resting. Warn if the agent has `schedule:` set but `status: draft` (it will never auto-fire — that's intentional during testing, but flag it before activation).
3. `color` (if set) is one of: blue / cyan / green / yellow / red / magenta.
4. If `schedule` is set: valid 5-field cron expression, ≥5-minute granularity. Warn if `status: active` but `schedule:` is empty (scheduled lifecycle without a schedule), or vice versa.
5. `model` (if set) is a current Claude model id (e.g. claude-sonnet-4-6, claude-opus-4-7, claude-haiku-4-5).
6. `timeout` is between 1 and 3600 seconds. `max_turns` is a positive integer.
7. `allowed_tools` entries match the tool-name pattern `^[a-zA-Z0-9_\\-.:*]+$`. Every tool referenced in the body (e.g. `Bash`, `Write`, `slack_post_message`, `td_query`) is present in `allowed_tools` — unless `allowed_tools` is omitted entirely (which means 'allow all'; flag that as an intentional but notable choice).
8. Short tool names only — no `mcp__work__` prefixes in `allowed_tools`.
9. `skills` (max 20) and `guides` (max 20) — entries look like real skill / guide ids.
10. `notify.on_success` / `notify.on_failure` use `slack:channel-name` or `slack:dm` format exactly (no 'DM', no 'direct message', no '#' prefix).
11. No Slack channels or notification targets hardcoded in the body — they belong in `notify.*`.
12. Body is non-empty and reads as a system prompt (second-person instructions to the agent, not a third-person task description).
13. If `output.note: true` or `goal` is set, the agent must be a workspace agent (these fields are ignored for global agents).
14. Workspace-only fields (`goal`, `skill`, `output`) absent from global agents.
15. No deprecated Schedule-era fields present: `cron`, `enabled`, `context.max_turns/timeout/autonomous`, `permissions`, `permissions.allow`. If found, instruct the user to migrate (`cron` → `schedule`, `enabled: true` → `status: active`, `context.*` → top-level, `permissions.allow` → `allowed_tools`).
16. No references to retired files in the body: `TASK.md`, `schedule.yaml`, `results/{run_id}/output.md`, `metadata.json`. Past-run inspection now happens via `chat_read`.

Report: PASS / FAIL per item, with a concrete fix (e.g. \"call `agent_update { name: 'X', allowed_tools: [..., 'Bash'] }`\") on every failure."
```

### Sub-agent 2: Quality Check

```
TaskCreate with prompt:
"Review this agent for quality and fitness for purpose.

Frontmatter:
{paste frontmatter JSON}

Body:
{paste body}

The user's original intent was: {describe what the user asked for}

Rate each item GOOD / NEEDS IMPROVEMENT / MISSING with a specific suggestion:

1. The body's instructions are clear and unambiguous — could another agent follow them without guessing?
2. Steps are in a logical order (gather → analyze → act → notify).
3. Error handling is addressed (what to do when a script fails / API is down / data is missing / threshold not met).
4. Notification expectations are explicit — when to post on success, when on failure, what level of detail.
5. If scheduled, the `schedule` cadence matches the work (e.g. don't fire hourly for a daily report; don't fire daily for a weekly summary).
6. `skills` listed are appropriate for the body's instructions (e.g. SQL work pulls in `sql-skills:trino`, segment work pulls in `tdx-skills:segment`).
7. `model` choice fits the task (Opus for hard reasoning, Sonnet for general-purpose, Haiku for simple deterministic work).
8. `allowed_tools` is the minimum needed — not over-broad. If `Bash` is listed, the body actually uses it.
9. The agent is self-contained — no implicit dependencies on external state the body doesn't describe.
10. `display_name` / `description` / `icon` are present enough for the UI list to be useful.
11. `status` matches readiness: `draft` while testing, `active` only after a successful test run.
12. For workspace agents: do `goal` / `skill` / `output.note` align with the body's intent?

Report: GOOD / NEEDS IMPROVEMENT / MISSING per item with concrete suggestions."
```

## Step 3: Collect and Report

Wait for both via `TaskGet`, then present a unified report:

```markdown
## Agent Review: {agent-name}

### Structure: {PASS / FAIL}
- [x] Valid name and status
- [x] Schedule cron parses cleanly
- [ ] `allowed_tools` missing `Bash` — referenced in body step 1
- [ ] Deprecated field `enabled: true` present — migrate to `status: active`
…

### Quality: {GOOD / NEEDS IMPROVEMENT / MISSING}
- [x] Instructions are clear and second-person
- [ ] No error handling for fetch failure — add a retry-once step
- [ ] `display_name` not set — list will only show the slug
…

### Recommended Fixes

**Global agents** — emit each fix as one `agent_update` call. The writer merges patches over existing frontmatter, so unrelated fields are preserved automatically:

1. `agent_update { name: "...", allowed_tools: [..., "Bash"] }`
2. `agent_update { name: "...", body: "<revised body with retry-once step>" }`
3. `agent_update { name: "...", display_name: "Daily Sales Report" }`
4. Deprecated-field migration — a single `agent_update` that sets the canonical field is enough to fix **runtime behavior** (the schema reads the new key; the legacy key is ignored by the runtime). The stale legacy key is preserved on disk by the writer though, so a fully clean AGENTS.md requires an additional cleanup pass (see below).
   - `enabled: true` → `agent_update { name: "...", status: "active" }`
   - `cron: "..."` → `agent_update { name: "...", schedule: "..." }`
   - `permissions.allow: [...]` → `agent_update { name: "...", allowed_tools: [...] }`
   - `context.{max_turns,timeout,autonomous}` → `agent_update { name: "...", max_turns: N, timeout: S, autonomous: B }`
   - Never patch `status` with an empty string — `status` is a required enum and the schema will reject the write. To pause an agent, use `status: paused`; to retire it, `status: resting`.
5. Fully remove stale legacy keys from disk (cosmetic cleanup — runtime is already correct after step 4):
   - Open the agent in **AgentSettings** and re-save. The UI rebuilds AGENTS.md from a typed serializer, which drops keys it doesn't recognise (e.g. `cron`, `permissions`, `context.*`).
   - Or, if the run-state history can be dropped: `agent_get { name }` → capture the body → `agent_delete { name }` → `agent_create { name, body, ...new_frontmatter }` to write a clean file.

**Workspace agents** — `agent_*` mutations target global agents only. Instead, instruct the user to:
- Open the agent in the **AgentSettings** UI (sidebar → Agents → click the agent) and apply each fix there, **or**
- If the fix is non-trivial, copy the agent into the global scope by reading its body via `agent_get` and creating a new global agent with `agent_create { name, body, ...frontmatter }`, then deleting the workspace copy from the UI.
```

If the structure check returns any FAIL, the agent should **not** be activated (`status: active`) until those are resolved.
