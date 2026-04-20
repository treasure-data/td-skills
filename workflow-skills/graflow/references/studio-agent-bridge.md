# Studio Agent Bridge

Graflow workflows delegate AI reasoning to Treasure Studio's Claude Agent SDK via the `StudioAgent` class. This gives workflow tasks access to Studio's 100+ MCP tools (Slack, Google Calendar, CRM, etc.) without configuring credentials in Python.

## Prerequisites

- Treasure Studio running on the same machine (127.0.0.1:9877 by default — the port may change and is published to subprocesses via `STUDIO_API_PORT`)
- `studio-agent` package installed in the workflow's venv

## Canonical Pattern — Ephemeral Session Per Task

**Open a fresh `StudioAgent` inside each task and let the context manager close it when the task ends.** Pass state between tasks through explicit `channel.set()` / `channel.get()`, not through shared agent memory.

```python
from graflow import task, workflow
from graflow.core.context import TaskExecutionContext
from studio_agent import StudioAgent


@task(inject_context=True)
def fetch_data(ctx: TaskExecutionContext) -> str:
    with StudioAgent() as agent:
        result = agent.run(
            "List all active deals closing this month. Return as JSON."
        )
    data = result["output"]
    ctx.get_channel().set("deals", data)
    return data


@task(inject_context=True)
def summarize(ctx: TaskExecutionContext) -> str:
    deals = ctx.get_channel().get("deals")
    # Fresh session — no memory of fetch_data's session.
    # Re-supply the data explicitly and name the tool to use.
    with StudioAgent() as agent:
        result = agent.run(
            f"Summarize these deals in one paragraph:\n\n{deals}\n\n"
            f"Then post the summary to #sales on Slack. Use slack_post_message tool."
        )
    return result["output"]


with workflow("example") as ctx:
    fetch_data >> summarize
    ctx.execute("fetch_data")
```

### Why ephemeral?

- **No idle sessions during deterministic tasks.** If a workflow interleaves Python-only tasks (scoring, filtering, merging) with agent tasks, a shared session would stay open — holding Studio resources — the whole time. Ephemeral sessions exist only while an agent is actively running.
- **Parallel branches are independent.** Each parallel task gets its own session, so a slow or failed branch never blocks another from closing.
- **Matches digdag's task-independent model.** State moves between tasks through explicit outputs, not through implicit agent memory, so the graph stays readable and each task is unit-testable on its own.

## Agent Prompt Tips

The prompt you pass to `agent.run()` is the single most important factor in task reliability. These patterns come from production workflows:

### Name the MCP tool explicitly

The agent has access to many tools but doesn't always pick the right one. Naming the tool removes ambiguity:

```python
# Good — agent knows exactly which tool to call
agent.run("Post a summary to #ops. Use slack_post_message tool.")

# Bad — agent may try slack_search_messages, read_channel, or other tools first
agent.run("Post a summary to #ops on Slack.")
```

### Re-supply all data the task needs

Each task starts a fresh agent session with no memory of prior tasks. Include all necessary data in the prompt, even if it feels redundant:

```python
@task(inject_context=True)
def draft_report(ctx: TaskExecutionContext) -> str:
    stats = ctx.get_channel().get("stats")
    summaries = ctx.get_channel().get("summaries")
    with StudioAgent() as agent:
        result = agent.run(
            f"Write a weekly report.\n\n"
            f"## Stats\n{stats}\n\n"
            f"## Summaries\n{summaries}\n\n"
            f"Structure as: Highlights, Details by Category, Metrics."
        )
    return result["output"]
```

### Be specific about output format

Tell the agent exactly what format you need, especially when the next task will parse the output:

```python
agent.run("List overdue items. Return as a JSON array of objects with keys: id, title, days_overdue.")
```

## When to Use Each Task Type

| Approach | Use When |
|---|---|
| **Ephemeral `StudioAgent`** | Need MCP tools (Slack, Calendar, CRM), AI reasoning, natural language analysis, content generation |
| **Direct Python** (no agent) | Deterministic logic, data transformation, scoring, filtering, classification |
| **`subprocess.run()`** | Calling external CLIs (`gh`, `tdx`, `curl`) — faster and cheaper than routing a CLI call through an agent |
| **Mix all three** | Most real workflows — subprocess for data fetching, agent for analysis/notification, Python for logic |

### Example: Mixed Approach

```python
import subprocess, json

@task(inject_context=True)
def fetch_data(ctx: TaskExecutionContext) -> list:
    """Subprocess: call a CLI tool directly."""
    result = subprocess.run(
        ["some-cli", "list", "--json"],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"CLI failed: {result.stderr}")
    items = json.loads(result.stdout)
    ctx.get_channel().set("items", items)
    return items


@task(inject_context=True)
def analyze(ctx: TaskExecutionContext) -> str:
    """Agent: AI reasoning on the fetched data."""
    items = ctx.get_channel().get("items")
    with StudioAgent() as agent:
        result = agent.run(
            f"Analyze these items and identify key trends:\n\n"
            f"{json.dumps(items[:50], indent=2)}\n\n"
            f"Return as a structured markdown report."
        )
    analysis = result["output"]
    ctx.get_channel().set("analysis", analysis)
    return analysis


@task
def calculate_score(items: list) -> float:
    """Deterministic: pure logic, no I/O overhead."""
    weights = {"activity": 0.4, "tickets": 0.3, "engagement": 0.3}
    return sum(items.get(k, 0) * w for k, w in weights.items())


fetch_data >> (analyze | calculate_score) >> report
```

## StudioAgent API

### Constructor

```python
StudioAgent(base_url: str | None = None, auth_token: str | None = None)
```

| Parameter | Default | Description |
|---|---|---|
| `base_url` | Resolved from `STUDIO_API_PORT` env var, falling back to `http://127.0.0.1:9877` | Studio Local API server URL |
| `auth_token` | Read from `STUDIO_AUTH_TOKEN` env var | Per-launch auth token, auto-injected by the Studio agentic-workflow runner |

Both defaults are what Studio sets when launching a workflow subprocess — **call `StudioAgent()` with no arguments** in template code.

### `run(input_text, **kwargs) -> dict`

Send a prompt to Studio's Claude Agent SDK.

```python
result = agent.run("Check account A123 and assess churn risk")
```

| Parameter | Type | Description |
|---|---|---|
| `input_text` | `str` | The prompt for the agent |
| `timeout` | `int` (kwarg, optional) | Per-call HTTP timeout in seconds (default: 300) |

> Tool filtering is **not** done per-call. The set of tools the agent may use is declared once in `manifest.yml` under `permissions.allow` and enforced by Studio server-side. See [manifest.yml Reference](manifest-yml.md#permissions) for the allowlist syntax.

**Returns** a dict:

```python
{
    "output": "Analysis: Account A123 shows...",  # Agent's final text response
    "steps": ["mcp__hubspot__get_company", ...],   # Tools the agent invoked
    "metadata": {
        "model": "studio-agent",
        "session_id": "sess_abc123",
        "usage": {"input_tokens": 1200, "output_tokens": 450},
    },
}
```

### `close()`

Close the Studio Agent session. Called automatically when exiting the `with` block or when the process ends (Studio also has a server-side idle reaper as a safety net).

```python
with StudioAgent() as agent:
    agent.run("...")
# Session closed here — no manual close() needed.
```

### `is_available() -> bool`

Check whether Studio's Local API Server is reachable.

```python
with StudioAgent() as agent:
    if not agent.is_available():
        raise RuntimeError("Studio is not running")
    result = agent.run("...")
```

## Human-in-the-Loop: `request_feedback()`

The `studio_agent` package provides a standalone `request_feedback()` function that pauses the workflow until a human responds via Studio's approval UI.

```python
from studio_agent import request_feedback

decision = request_feedback(
    prompt="Send the renewal pitch to Acme Corp?",
    options=["Send now", "Queue for tomorrow"],
    context={
        "summary": "3 sessions this week, ARR $120k",
        "draft": "Hi Pat — just checking in on Q2 goals...",
    },
    timeout=3600,
)

if decision["status"] == "approved":
    selected = decision["choice"]    # "Send now" or "Queue for tomorrow"
    comment = decision["comment"]    # Optional free-form text from user
```

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `prompt` | `str` | (required) | Question shown to the user (1–2000 chars) |
| `options` | `list[str] \| None` | `None` | Up to 4 labeled options. `None` = free-form only |
| `context` | `dict \| None` | `None` | Key/value pairs rendered beside the prompt |
| `timeout` | `int` | `3600` | Max seconds to wait. Server clamps to [60, 86400] |
| `base_url` | `str \| None` | env-resolved | Override Studio API base URL |
| `auth_token` | `str \| None` | env-resolved | Override per-run auth token |

### Return Value

Returns a dict with three keys:

| Key | Type | Description |
|---|---|---|
| `status` | `str` | `"approved"` \| `"rejected"` \| `"timeout"` \| `"cancelled"` |
| `choice` | `str \| None` | Selected option label, or `None` if no options provided |
| `comment` | `str \| None` | Free-form text the user entered, or `None` |

### How It Works

1. `request_feedback()` POSTs to Studio's `/feedback/create` endpoint
2. Studio displays an approval card in the Agentic Workflows panel + sends an OS notification
3. The function blocks on HTTP long-polling (`/feedback/{id}/wait`) until the user responds
4. When the user clicks Approve/Reject, the resolution is returned to the caller

### Notes

- `request_feedback()` is independent of `StudioAgent` — it doesn't require an active agent session. Call it anywhere in your workflow code.
- `auth_token` and `base_url` are auto-resolved from environment variables (`STUDIO_AUTH_TOKEN`, `STUDIO_API_PORT`) set by Studio when launching the workflow subprocess.
- If Studio is closed while a feedback request is pending, `status` becomes `"cancelled"`.
- Set `execution.timeout` in `manifest.yml` high enough to cover human response time (e.g. 3900s for a 1-hour HITL + 300s agent margin).

## Error Handling

```python
from studio_agent import StudioAgent, StudioAgentError


@task
def safe_query() -> str:
    try:
        with StudioAgent() as agent:
            return agent.run("Fetch account data")["output"]
    except StudioAgentError as exc:
        # Studio unreachable, HTTP error, or session creation failed.
        return f"ERROR: {exc}"
```

`StudioAgentError` wraps both connection failures (`requests.ConnectionError`) and HTTP errors from the server, with the Studio base URL and response text included.

## Exception: Shared Session Within a Single Task

The canonical pattern is one session per task. There is one narrow case where a **shared session lives inside a single task**: when the task performs a multi-turn reasoning chain where each turn must see the previous agent response in full context (chain-of-thought refinement that cannot be flattened into one prompt).

```python
@task
def deep_analysis(case: dict) -> dict:
    with StudioAgent() as agent:
        draft = agent.run(f"Analyze case {case['id']}...")["output"]
        critique = agent.run(f"Critique your own analysis: {draft}")["output"]
        final = agent.run("Incorporate the critique into a final recommendation.")["output"]
    return {"draft": draft, "critique": critique, "final": final}
```

The session lifetime is still bounded by the single task — it closes as soon as the task exits. **Do not register an agent at the workflow level and share it across tasks**: that keeps the session open through every deterministic task in between and couples tasks to implicit agent memory instead of explicit channel state.
