# Studio Agent Bridge

Graflow workflows delegate AI reasoning to Treasure Studio's Claude Agent SDK via the `StudioAgent` class. This gives workflow tasks access to Studio's 100+ MCP tools (HubSpot, Slack, Google Calendar, Gainsight, etc.) without configuring credentials in Python.

## Prerequisites

- Treasure Studio running on the same machine (127.0.0.1:9877 by default — the port may change and is published to subprocesses via `STUDIO_API_PORT`)
- `studio-agent` package installed in the workflow's venv

## Canonical Pattern — Ephemeral Session Per Task

**Open a fresh `StudioAgent` inside each task and let the context manager close it when the task ends.** Pass state between tasks through task return values / channel parameters, not through shared agent memory.

```python
from graflow import task, workflow
from studio_agent import StudioAgent


@task
def fetch_data() -> str:
    with StudioAgent() as agent:
        result = agent.run(
            "List all active HubSpot deals closing this month. Return as JSON."
        )
    return result["output"]


@task
def summarize(data: str) -> str:
    # Runs in a new session — no memory of fetch_data's session.
    # Pass the data explicitly through the prompt.
    with StudioAgent() as agent:
        result = agent.run(
            f"Summarize these deals in one paragraph:\n\n{data}"
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
result = agent.run("Check HubSpot for account A123 and assess churn risk")
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

## Studio Agent vs Direct Code

| Approach | Use When |
|---|---|
| **Ephemeral `StudioAgent`** | Need MCP tools (CRM, Slack, Calendar), AI reasoning, natural language analysis |
| **Direct Python** (no agent) | Deterministic logic, data transformation, scoring, filtering, math |
| **Mix both** | Most workflows — agent tasks for data gathering/analysis, Python tasks for decisions/routing |

### Example: Mixed Approach

```python
@task
def gather_data() -> dict:
    """AI: fetch and summarize data from multiple sources."""
    with StudioAgent() as agent:
        return agent.run(
            "Get account A123's HubSpot activity, recent support tickets, "
            "and last meeting notes from Google Calendar. Return as JSON."
        )["output"]


@task
def calculate_score(data: dict) -> float:
    """Deterministic: compute health score from structured data."""
    weights = {"activity": 0.4, "tickets": 0.3, "meetings": 0.3}
    return sum(data.get(k, 0) * w for k, w in weights.items())


@task(inject_context=True)
def route(context, score: float) -> None:
    """Deterministic: branch based on score."""
    if score < 0.3:
        context.next_task(urgent_intervention, goto=True)
    elif score < 0.6:
        context.next_task(schedule_checkin)


gather_data >> calculate_score >> route
```

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
