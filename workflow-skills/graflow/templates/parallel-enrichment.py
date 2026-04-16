"""Parallel Enrichment Workflow

Fetches a target list, enriches from multiple sources in parallel,
then merges results and generates a report.

Graph: fetch_targets >> (enrich_crm | enrich_usage | enrich_support) >> merge >> report
"""

from graflow import task, workflow
from graflow.core.context import TaskExecutionContext
from graflow.core.task import ParallelGroup
from graflow.coordination.executor import ExecutionPolicy
from studio_agent import StudioAgent


with workflow("parallel-enrichment") as ctx:
    ctx.register_llm_agent("studio", lambda _: StudioAgent())

    @task(inject_llm_agent="studio")
    def fetch_targets(agent):
        """Get the list of accounts to enrich."""
        return agent.run(
            "List all enterprise accounts from HubSpot with contract value "
            "over $50k. Include account ID, name, and owner."
        )["output"]

    @task(inject_llm_agent="studio")
    def enrich_crm(agent, targets: list):
        """Enrich with CRM data (HubSpot deals, activities)."""
        return agent.run(
            f"For these {len(targets)} accounts, get from HubSpot: "
            f"last deal stage, pipeline value, and recent activities."
        )["output"]

    @task(inject_llm_agent="studio")
    def enrich_usage(agent, targets: list):
        """Enrich with product usage data."""
        return agent.run(
            f"For these {len(targets)} accounts, check product usage: "
            f"last login date, feature adoption rate, and API call volume."
        )["output"]

    @task(inject_llm_agent="studio")
    def enrich_support(agent, targets: list):
        """Enrich with support ticket data."""
        return agent.run(
            f"For these {len(targets)} accounts, get support data: "
            f"open tickets, average resolution time, and CSAT score."
        )["output"]

    @task
    def merge(crm_data: dict, usage_data: dict, support_data: dict) -> dict:
        """Merge enrichment results into unified account profiles."""
        merged = {}
        for source in [crm_data, usage_data, support_data]:
            for account_id, data in (source or {}).items():
                merged.setdefault(account_id, {}).update(data)
        return merged

    @task(inject_llm_agent="studio")
    def report(agent, profiles: dict):
        """Generate executive summary and post to Slack."""
        return agent.run(
            f"Create an executive summary of {len(profiles)} enterprise accounts. "
            f"Highlight: top 5 expansion opportunities, top 5 churn risks, "
            f"and any accounts needing immediate attention. "
            f"Post to #account-intelligence on Slack."
        )["output"]

    # Fan-out: enrich from 3 sources in parallel (best-effort — continue if one fails)
    enrichment = ParallelGroup(
        [enrich_crm, enrich_usage, enrich_support],
        name="enrichment",
        execution_policy=ExecutionPolicy.BEST_EFFORT,
    )
    fetch_targets >> enrichment >> merge >> report
    ctx.execute("fetch_targets")
