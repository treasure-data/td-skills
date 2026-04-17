"""Simple Pipeline Workflow

Minimal example: fetch data, process it, send notification.
Good starting point for new workflows.

Graph: fetch >> process >> notify

Pattern: each task opens its own ephemeral Studio Agent session
(``with StudioAgent() as agent:``). Data flows between tasks via
return values / channel parameters — the session does not carry
conversational state across tasks. This mirrors digdag's
task-independent model and avoids holding a session open while
deterministic (non-agent) tasks run.
"""

from graflow import task, workflow
from studio_agent import StudioAgent


@task
def fetch() -> dict:
    """Gather data using an ephemeral Studio Agent session."""
    with StudioAgent() as agent:
        result = agent.run(
            "Get today's key metrics: active users, new signups, "
            "and open support tickets from HubSpot. Return as JSON."
        )
    return result["output"]


@task
def process(metrics: dict) -> dict:
    """Deterministic data processing — no agent session at all."""
    summary = {
        "total_users": metrics.get("active_users", 0),
        "growth": metrics.get("new_signups", 0),
        "support_load": metrics.get("open_tickets", 0),
        "health": "good" if metrics.get("open_tickets", 0) < 10 else "needs_attention",
    }
    return summary


@task
def notify(summary: dict) -> str:
    """Send the notification using a fresh Studio Agent session."""
    with StudioAgent() as agent:
        result = agent.run(
            f"Post a daily metrics summary to #daily-standup on Slack. "
            f"Health status: {summary['health']}. "
            f"Include: {summary['total_users']} active users, "
            f"{summary['growth']} new signups, "
            f"{summary['support_load']} open tickets."
        )
    return result["output"]


with workflow("simple-pipeline") as ctx:
    fetch >> process >> notify
    ctx.execute("fetch")
