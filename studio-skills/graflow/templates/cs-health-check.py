"""CS Health Check Workflow

Scans active accounts via Studio Agent (HubSpot), evaluates churn risk
with deterministic scoring, and sends personalized Slack alerts for
at-risk accounts.

Graph: scan_accounts >> evaluate_risk >> notify_csm

Each agent-backed task opens its own ephemeral Studio Agent session.
Cross-task context is passed explicitly through return values —
``notify_csm`` re-supplies the at-risk accounts to its fresh session
because a new session does not share memory with prior ones.
"""

from graflow import task, workflow
from graflow.core.context import TaskExecutionContext
from studio_agent import StudioAgent


@task
def scan_accounts() -> list:
    """Fetch all active accounts with recent activity data from HubSpot."""
    with StudioAgent() as agent:
        result = agent.run(
            "List all active accounts from HubSpot. For each account, include: "
            "company name, account owner, last activity date, open support tickets count, "
            "and contract renewal date. Return as a structured JSON list."
        )
    return result["output"]


@task(inject_context=True)
def evaluate_risk(ctx: TaskExecutionContext, accounts: list):
    """Deterministic churn risk scoring — no agent needed."""
    from datetime import datetime, timedelta

    at_risk = []
    threshold = datetime.now() - timedelta(days=14)

    for account in accounts:
        risk_score = 0.0
        if account.get("last_activity_date", "") < threshold.isoformat():
            risk_score += 0.4
        if account.get("open_tickets", 0) > 3:
            risk_score += 0.3
        if account.get("days_to_renewal", 365) < 30:
            risk_score += 0.3

        if risk_score >= 0.5:
            account["risk_score"] = risk_score
            at_risk.append(account)

    if not at_risk:
        ctx.terminate_workflow("No at-risk accounts found today")

    at_risk.sort(key=lambda a: a["risk_score"], reverse=True)
    return at_risk


@task
def notify_csm(at_risk: list) -> str:
    """Draft and send personalized Slack alerts for at-risk accounts.

    The prompt re-supplies the structured ``at_risk`` list because this
    task runs in a fresh Studio Agent session and does not share memory
    with ``scan_accounts``.
    """
    with StudioAgent() as agent:
        result = agent.run(
            f"Here are {len(at_risk)} at-risk accounts:\n\n{at_risk}\n\n"
            f"For each one, draft a concise alert with: account name, "
            f"risk score, key risk factors, and a suggested next action. "
            f"Post the summary to #cs-alerts on Slack."
        )
    return result["output"]


with workflow("cs-health-check") as ctx:
    scan_accounts >> evaluate_risk >> notify_csm
    ctx.execute("scan_accounts")
