# Studio Agent Bridge

Graflow workflows can delegate AI reasoning to Treasure Studio's Claude Agent SDK via the `StudioAgent` class. This gives workflow tasks access to Studio's 100+ MCP tools (HubSpot, Slack, Google Calendar, Gainsight, etc.) without configuring credentials in Python.

## Prerequisites

- Treasure Studio running on the same machine (localhost:9877)
- `studio-agent` package installed in the workflow's venv

## Basic Usage

```python
from graflow import task, workflow
from studio_agent import StudioAgent

with workflow("example") as ctx:
    ctx.register_llm_agent("studio", lambda _: StudioAgent())

    @task(inject_llm_agent="studio")
    def fetch_data(agent):
        result = agent.run("List all active deals from HubSpot closing this month")
        return result["output"]

    ctx.execute("fetch_data")
```

## StudioAgent API

### Constructor

```python
StudioAgent(base_url: str = "http://localhost:9877")
```

| Parameter | Default | Description |
|---|---|---|
| `base_url` | `http://localhost:9877` | Studio Local API server URL |

### run(input_text, **kwargs) -> AgentResult

Send a prompt to Studio's Claude Agent SDK.

```python
result = agent.run(
    "Check HubSpot for account A123 and assess churn risk",
    tools=["mcp__hubspot__*"],  # Optional: filter available MCP tools
)
```

| Parameter | Type | Description |
|---|---|---|
| `input_text` | `str` | The prompt for the agent |
| `tools` | `list[str]` (optional) | MCP tool filter (glob patterns) |

**Returns** `AgentResult`:
```python
{
    "output": "Analysis: Account A123 shows...",  # Agent's response
    "steps": ["hubspot_get_company", ...],         # MCP tools called
    "metadata": {
        "model": "studio-agent",
        "session_id": "sess_abc123",
        "usage": {"input_tokens": 1200, "output_tokens": 450},
    },
}
```

### close()

Explicitly close the Studio Agent session. Called automatically when the workflow ends.

```python
agent.close()
```

## Session Sharing

When registered via `ctx.register_llm_agent()`, the same `StudioAgent` instance is reused across all tasks in a workflow run. This means:

1. **Session is created lazily** on the first `agent.run()` call
2. **All tasks share the same Claude session** — the agent remembers context from previous tasks
3. **Session is closed** when the workflow completes

```python
with workflow("shared_session") as ctx:
    ctx.register_llm_agent("studio", lambda _: StudioAgent())

    @task(inject_llm_agent="studio")
    def research(agent):
        # First call: creates session, queries HubSpot
        return agent.run("Find churning accounts in HubSpot")["output"]

    @task(inject_llm_agent="studio")
    def draft_alerts(agent, research: str):
        # Same session: agent remembers the research results
        return agent.run(
            "Based on the churning accounts you found, "
            "draft a Slack alert for each one."
        )["output"]

    research >> draft_alerts
    ctx.execute("research")
```

## When to Use Studio Agent vs Direct Code

| Approach | Use When |
|---|---|
| **Studio Agent** (`inject_llm_agent`) | Need MCP tools (CRM, Slack, Calendar), AI reasoning, natural language analysis |
| **Direct Python** (no agent) | Deterministic logic, data transformation, scoring, filtering, math |
| **Mix both** | Most workflows — AI for data gathering/analysis, Python for decisions/routing |

### Example: Mixed Approach

```python
@task(inject_llm_agent="studio")
def gather_data(agent):
    """AI: fetch and summarize data from multiple sources."""
    return agent.run(
        "Get account A123's HubSpot activity, recent support tickets, "
        "and last meeting notes from Google Calendar."
    )["output"]

@task
def calculate_score(data: dict) -> float:
    """Deterministic: compute health score from structured data."""
    weights = {"activity": 0.4, "tickets": 0.3, "meetings": 0.3}
    return sum(data.get(k, 0) * w for k, w in weights.items())

@task(inject_context=True)
def route(context, score: float):
    """Deterministic: branch based on score."""
    if score < 0.3:
        context.next_task(urgent_intervention, goto=True)
    elif score < 0.6:
        context.next_task(schedule_checkin)

gather_data >> calculate_score >> route
```

## MCP Tool Filtering

By default, Studio Agent has access to all MCP tools configured in Studio. Use the `tools` parameter to restrict access for a specific call:

```python
# Only allow HubSpot tools
result = agent.run("Get deal info", tools=["mcp__hubspot__*"])

# Only allow Slack posting
result = agent.run("Send alert", tools=["mcp__slack__post_message"])

# Multiple tool families
result = agent.run("Update CRM and notify", tools=[
    "mcp__hubspot__*",
    "mcp__slack__post_message",
])
```

## Error Handling

```python
from requests.exceptions import ConnectionError

@task(inject_llm_agent="studio")
def safe_query(agent):
    try:
        return agent.run("Fetch account data")["output"]
    except ConnectionError:
        # Studio not running — return fallback
        return {"error": "Studio unavailable", "accounts": []}
```

## Health Check

Verify Studio is running before starting a workflow:

```python
from studio_agent import StudioAgent

agent = StudioAgent()
if agent.is_available():
    print("Studio is ready")
else:
    print("Studio is not running on localhost:9877")
```
