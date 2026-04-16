"""CS Health Check Workflow

Scans all active accounts via Studio Agent (HubSpot), evaluates churn risk
with deterministic scoring, and sends personalized Slack alerts for at-risk accounts.

Graph: scan_accounts >> evaluate_risk >> notify_csm
"""

from graflow import task, workflow
from graflow.core.context import TaskExecutionContext
from studio_agent import StudioAgent


with workflow("cs-health-check") as ctx:
    ctx.register_llm_agent("studio", lambda _: StudioAgent())

    @task(inject_llm_agent="studio")
    def scan_accounts(agent):
        """Fetch all active accounts with recent activity data from HubSpot."""
        result = agent.run(
            "List all active accounts from HubSpot. For each account, include: "
            "company name, account owner, last activity date, open support tickets count, "
            "and contract renewal date. Return as a structured JSON list."
        )
        return result["output"]

    @task(inject_context=True)
    def evaluate_risk(ctx: TaskExecutionContext, accounts: list):
        """Deterministic churn risk scoring — no AI needed."""
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

        # Sort by risk score descending
        at_risk.sort(key=lambda a: a["risk_score"], reverse=True)
        return at_risk

    @task(inject_llm_agent="studio")
    def notify_csm(agent, at_risk: list):
        """Draft and send personalized Slack alerts for at-risk accounts."""
        # Agent remembers the account data from scan_accounts (shared session)
        return agent.run(
            f"There are {len(at_risk)} at-risk accounts. For each one, "
            f"draft a concise alert message with: account name, risk score, "
            f"key risk factors, and a suggested next action. "
            f"Post the summary to #cs-alerts on Slack."
        )["output"]

    scan_accounts >> evaluate_risk >> notify_csm
    ctx.execute("scan_accounts")
