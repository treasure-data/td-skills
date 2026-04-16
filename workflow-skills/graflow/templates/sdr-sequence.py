"""SDR Outreach Sequence Workflow

Qualifies leads, enriches with company data, generates personalized outreach,
and schedules follow-up actions. Uses parallel enrichment for efficiency.

Graph: qualify_leads >> (enrich_company | enrich_contacts) >> personalize >> schedule_actions
"""

from graflow import task, workflow
from graflow.core.context import TaskExecutionContext
from studio_agent import StudioAgent


with workflow("sdr-sequence") as ctx:
    ctx.register_llm_agent("studio", lambda _: StudioAgent())

    @task(inject_llm_agent="studio")
    def qualify_leads(agent):
        """Pull new leads from HubSpot and qualify based on ICP criteria."""
        result = agent.run(
            "Find all new leads from HubSpot created in the last 7 days. "
            "For each lead, check: company size (>50 employees), industry "
            "(SaaS, e-commerce, or fintech), and whether they visited our "
            "pricing page. Return only leads matching at least 2 of 3 criteria."
        )
        return result["output"]

    @task(inject_llm_agent="studio")
    def enrich_company(agent, qualified: list):
        """Enrich with company-level data."""
        return agent.run(
            f"For these {len(qualified)} qualified leads, gather company info: "
            f"recent funding rounds, tech stack, competitor products they use, "
            f"and any recent news mentions."
        )["output"]

    @task(inject_llm_agent="studio")
    def enrich_contacts(agent, qualified: list):
        """Enrich with contact-level data."""
        return agent.run(
            f"For these {len(qualified)} qualified leads, find the best contact: "
            f"job title, LinkedIn activity, shared connections, "
            f"and any conference appearances."
        )["output"]

    @task(inject_llm_agent="studio")
    def personalize(agent, company_data: dict, contact_data: dict):
        """Generate personalized outreach drafts."""
        return agent.run(
            "Using the company and contact enrichment data, draft a personalized "
            "outreach email for each lead. Reference specific company details "
            "(recent funding, tech stack) and contact details (role, interests). "
            "Keep each email under 150 words. Return as a list of drafts."
        )["output"]

    @task(inject_llm_agent="studio")
    def schedule_actions(agent, drafts: list):
        """Create follow-up tasks and calendar blocks."""
        return agent.run(
            f"For each of the {len(drafts)} outreach drafts: "
            f"1. Create a follow-up task in HubSpot for 3 days from now. "
            f"2. Block 15 minutes on the account owner's Google Calendar "
            f"for a potential discovery call next week. "
            f"3. Post a summary to #sdr-pipeline on Slack."
        )["output"]

    qualify_leads >> (enrich_company | enrich_contacts) >> personalize >> schedule_actions
    ctx.execute("qualify_leads")
