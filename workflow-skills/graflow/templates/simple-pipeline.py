"""Simple Pipeline Workflow

Minimal example: fetch data, process it, send notification.
Good starting point for new workflows.

Graph: fetch >> process >> notify
"""

from graflow import task, workflow
from studio_agent import StudioAgent


with workflow("simple-pipeline") as ctx:
    ctx.register_llm_agent("studio", lambda _: StudioAgent())

    @task(inject_llm_agent="studio")
    def fetch(agent):
        """Gather data using Studio Agent's MCP tools."""
        return agent.run(
            "Get today's key metrics: active users, new signups, "
            "and open support tickets from HubSpot."
        )["output"]

    @task
    def process(metrics: dict) -> dict:
        """Deterministic data processing — no AI needed."""
        summary = {
            "total_users": metrics.get("active_users", 0),
            "growth": metrics.get("new_signups", 0),
            "support_load": metrics.get("open_tickets", 0),
            "health": "good" if metrics.get("open_tickets", 0) < 10 else "needs_attention",
        }
        return summary

    @task(inject_llm_agent="studio")
    def notify(agent, summary: dict):
        """Send formatted notification via Slack."""
        return agent.run(
            f"Post a daily metrics summary to #daily-standup on Slack. "
            f"Health status: {summary['health']}. "
            f"Include: {summary['total_users']} active users, "
            f"{summary['growth']} new signups, "
            f"{summary['support_load']} open tickets."
        )["output"]

    fetch >> process >> notify
    ctx.execute("fetch")
