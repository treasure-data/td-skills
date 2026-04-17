"""SDR Outreach Sequence Workflow

Qualifies leads, enriches with company and contact data in parallel,
generates personalized outreach drafts, and schedules follow-up actions.

Graph: qualify_leads >> (enrich_company | enrich_contacts) >> personalize >> schedule_actions

Each agent-backed task opens its own ephemeral Studio Agent session.
The parallel enrichment branches run in separate sessions concurrently
and their outputs are recombined through the channel for
``personalize``.
"""

from graflow import task, workflow
from studio_agent import StudioAgent


@task
def qualify_leads() -> list:
    """Pull new leads from HubSpot and qualify based on ICP criteria."""
    with StudioAgent() as agent:
        result = agent.run(
            "Find all new leads from HubSpot created in the last 7 days. "
            "For each lead, check: company size (>50 employees), industry "
            "(SaaS, e-commerce, or fintech), and whether they visited our "
            "pricing page. Return only leads matching at least 2 of 3 criteria."
        )
    return result["output"]


@task
def enrich_company(qualified: list) -> dict:
    """Enrich with company-level data in a fresh agent session."""
    with StudioAgent() as agent:
        result = agent.run(
            f"For these {len(qualified)} qualified leads:\n\n{qualified}\n\n"
            f"Gather company info: recent funding rounds, tech stack, "
            f"competitor products they use, and any recent news mentions."
        )
    return result["output"]


@task
def enrich_contacts(qualified: list) -> dict:
    """Enrich with contact-level data in a fresh agent session."""
    with StudioAgent() as agent:
        result = agent.run(
            f"For these {len(qualified)} qualified leads:\n\n{qualified}\n\n"
            f"Find the best contact per lead: job title, LinkedIn activity, "
            f"shared connections, and any conference appearances."
        )
    return result["output"]


@task
def personalize(company_data: dict, contact_data: dict) -> list:
    """Generate personalized outreach drafts."""
    with StudioAgent() as agent:
        result = agent.run(
            f"Company enrichment:\n{company_data}\n\n"
            f"Contact enrichment:\n{contact_data}\n\n"
            f"Draft a personalized outreach email for each lead. Reference "
            f"specific company details (recent funding, tech stack) and "
            f"contact details (role, interests). Keep each email under "
            f"150 words. Return as a list of drafts."
        )
    return result["output"]


@task
def schedule_actions(drafts: list) -> str:
    """Create follow-up tasks and calendar blocks."""
    with StudioAgent() as agent:
        result = agent.run(
            f"Here are {len(drafts)} outreach drafts:\n\n{drafts}\n\n"
            f"For each: 1) Create a follow-up HubSpot task for 3 days out. "
            f"2) Block 15 minutes on the account owner's Google Calendar for "
            f"a potential discovery call next week. 3) Post a summary to "
            f"#sdr-pipeline on Slack."
        )
    return result["output"]


with workflow("sdr-sequence") as ctx:
    qualify_leads >> (enrich_company | enrich_contacts) >> personalize >> schedule_actions
    ctx.execute("qualify_leads")
