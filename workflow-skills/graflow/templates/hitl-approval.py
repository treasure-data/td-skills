"""HITL Approval Workflow

Drafts content using Studio Agent, pauses for human approval via
Studio's approval UI, then sends or revises based on feedback.

Graph: draft_content >> request_approval >> route_action

Each agent-backed task opens its own ephemeral Studio Agent session.
The ``request_approval`` task uses ``request_feedback()`` from the
``studio_agent`` package to display an approval card in Studio and
block until the user responds. Decision state is stored on the channel
so ``route_action`` can branch deterministically.
"""

from graflow import task, workflow
from graflow.core.context import TaskExecutionContext
from studio_agent import StudioAgent, request_feedback


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
    """Pause workflow and wait for human review via Studio approval UI."""
    decision = request_feedback(
        prompt="Review this executive update draft. Approve to send, or reject with revision notes.",
        options=["Send as-is", "Send with edits"],
        context={
            "draft": draft[:1000],
            "type": "Weekly CS Update",
        },
        timeout=3600,
    )

    channel = ctx.get_channel()
    if decision["status"] == "approved":
        channel.set("action", "send")
        channel.set("final_content", draft)
        if decision["comment"]:
            channel.set("send_note", decision["comment"])
    elif decision["status"] == "rejected":
        channel.set("action", "revise")
        channel.set("revision_notes", decision.get("comment") or "No specific notes provided")
        channel.set("original_draft", draft)
    else:
        channel.set("action", "abort")

    return decision["status"] == "approved"


@task(inject_context=True)
def route_action(ctx: TaskExecutionContext, approved: bool) -> str:
    """Send if approved, otherwise produce a revised draft.

    Uses channel-stored decision state (set by ``request_approval``)
    and a fresh agent session for whichever branch runs.
    """
    channel = ctx.get_channel()
    action = channel.get("action")

    if action == "abort":
        return "Workflow aborted — no human response or run cancelled."

    if action == "send":
        content = channel.get("final_content")
        with StudioAgent() as agent:
            result = agent.run(
                f"Send this executive update via email to the CS leadership "
                f"distribution list and post to #cs-leadership on Slack. "
                f"Use slack_post_message tool.\n\n{content}"
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
