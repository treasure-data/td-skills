"""HITL Approval Workflow

Drafts content using Studio Agent, pauses for human approval,
then sends or revises based on feedback.

Graph: draft_content >> request_approval >> route_action

Each agent-backed task opens its own ephemeral Studio Agent session.
The ``request_approval`` task stores decision state on the channel so
that ``route_action`` (which also opens a fresh session) can branch
deterministically without relying on shared agent memory.
"""

from graflow import task, workflow
from graflow.core.context import TaskExecutionContext
from studio_agent import StudioAgent


@task
def draft_content() -> str:
    """Generate the initial draft in a fresh agent session."""
    with StudioAgent() as agent:
        result = agent.run(
            "Draft a weekly CS update email for our executive team. "
            "Include: key metrics (accounts at risk, recently churned, "
            "expansion opportunities), top 3 actions taken this week, "
            "and priorities for next week. Keep it concise and professional."
        )
    return result["output"]


@task(inject_context=True)
def request_approval(ctx: TaskExecutionContext, draft: str) -> bool:
    """Pause workflow and wait for human review."""
    response = ctx.request_feedback(
        feedback_type="approval",
        prompt=(
            f"Review this executive update draft:\n\n{draft}\n\n"
            "Approve to send, or reject with revision notes."
        ),
        timeout=3600.0,
    )

    channel = ctx.get_channel()
    if response.approved:
        channel.set("action", "send")
        channel.set("final_content", draft)
    else:
        channel.set("action", "revise")
        channel.set("revision_notes", response.reason)
        channel.set("original_draft", draft)

    return response.approved


@task(inject_context=True)
def route_action(ctx: TaskExecutionContext, approved: bool) -> str:
    """Send if approved, otherwise produce a revised draft.

    Uses channel-stored decision state (set by ``request_approval``)
    and a fresh agent session for whichever branch runs.
    """
    channel = ctx.get_channel()
    action = channel.get("action")

    if action == "send":
        content = channel.get("final_content")
        with StudioAgent() as agent:
            result = agent.run(
                f"Send this executive update via email to the CS leadership "
                f"distribution list and post to #cs-leadership on Slack:\n\n{content}"
            )
        return result["output"]

    notes = channel.get("revision_notes")
    original = channel.get("original_draft")
    with StudioAgent() as agent:
        revised = agent.run(
            f"Revise this draft based on feedback:\n\n"
            f"Original:\n{original}\n\n"
            f"Revision notes:\n{notes}\n\n"
            f"Apply the feedback and return the revised version."
        )["output"]
    channel.set("revised_draft", revised)
    return revised


with workflow("hitl-approval") as ctx:
    draft_content >> request_approval >> route_action
    ctx.execute("draft_content")
