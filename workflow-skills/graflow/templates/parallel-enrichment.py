"""Parallel Enrichment Workflow

Fetches a target list, enriches from multiple sources in parallel
(best-effort — continue if one source fails), merges the results,
and generates a report.

Graph: fetch_targets >> (enrich_crm | enrich_usage | enrich_support) >> merge >> report

Each parallel branch runs in its own ephemeral Studio Agent session,
so a slow or failed branch never blocks another session from closing.
``merge`` is deterministic (no agent), and ``report`` opens a fresh
session to compose the Slack summary.
"""

from graflow import task, workflow
from graflow.core.task import ParallelGroup
from graflow.coordination.executor import ExecutionPolicy
from studio_agent import StudioAgent


@task
def fetch_targets() -> list:
    """Get the list of accounts to enrich."""
    with StudioAgent() as agent:
        result = agent.run(
            "List all enterprise accounts from HubSpot with contract value "
            "over $50k. Include account ID, name, and owner."
        )
    return result["output"]


@task
def enrich_crm(targets: list) -> dict:
    """Enrich with CRM data (HubSpot deals, activities)."""
    with StudioAgent() as agent:
        result = agent.run(
            f"For these {len(targets)} accounts:\n\n{targets}\n\n"
            f"Get from HubSpot: last deal stage, pipeline value, and "
            f"recent activities."
        )
    return result["output"]


@task
def enrich_usage(targets: list) -> dict:
    """Enrich with product usage data."""
    with StudioAgent() as agent:
        result = agent.run(
            f"For these {len(targets)} accounts:\n\n{targets}\n\n"
            f"Check product usage: last login date, feature adoption rate, "
            f"and API call volume."
        )
    return result["output"]


@task
def enrich_support(targets: list) -> dict:
    """Enrich with support ticket data."""
    with StudioAgent() as agent:
        result = agent.run(
            f"For these {len(targets)} accounts:\n\n{targets}\n\n"
            f"Get support data: open tickets, average resolution time, "
            f"and CSAT score."
        )
    return result["output"]


@task
def merge(crm_data: dict, usage_data: dict, support_data: dict) -> dict:
    """Merge enrichment results into unified account profiles."""
    merged: dict = {}
    for source in [crm_data, usage_data, support_data]:
        for account_id, data in (source or {}).items():
            merged.setdefault(account_id, {}).update(data)
    return merged


@task
def report(profiles: dict) -> str:
    """Generate executive summary and post to Slack."""
    with StudioAgent() as agent:
        result = agent.run(
            f"Enterprise account profiles:\n\n{profiles}\n\n"
            f"Create an executive summary of {len(profiles)} accounts. "
            f"Highlight: top 5 expansion opportunities, top 5 churn risks, "
            f"and any accounts needing immediate attention. "
            f"Post to #account-intelligence on Slack."
        )
    return result["output"]


with workflow("parallel-enrichment") as ctx:
    # Fan-out: enrich from 3 sources in parallel — continue even if one fails.
    enrichment = ParallelGroup(
        [enrich_crm, enrich_usage, enrich_support],
        name="enrichment",
        execution_policy=ExecutionPolicy.BEST_EFFORT,
    )
    fetch_targets >> enrichment >> merge >> report
    ctx.execute("fetch_targets")
