"""HITL Approval Workflow

Drafts content using Studio Agent, pauses for human approval,
then sends or revises based on feedback.

Graph: draft_content >> request_approval >> (send | revise)
"""

from graflow import task, workflow
from graflow.core.context import TaskExecutionContext
from studio_agent import StudioAgent


with workflow("hitl-approval") as ctx:
    ctx.register_llm_agent("studio", lambda _: StudioAgent())

    @task(inject_llm_agent="studio")
    def draft_content(agent):
        """Generate initial draft using Studio Agent."""
        result = agent.run(
            "Draft a weekly CS update email for our executive team. "
            "Include: key metrics (accounts at risk, recently churned, "
            "expansion opportunities), top 3 actions taken this week, "
            "and priorities for next week. Keep it concise and professional."
        )
        return result["output"]

    @task(inject_context=True)
    def request_approval(ctx: TaskExecutionContext, draft: str):
        """Pause workflow and wait for human review."""
        response = ctx.request_feedback(
            feedback_type="approval",
            prompt=f"Review this executive update draft:\n\n{draft}\n\n"
            "Approve to send, or reject with revision notes.",
            timeout=3600.0,  # Wait up to 1 hour
        )

        if response.approved:
            ctx.get_channel().set("action", "send")
            ctx.get_channel().set("final_content", draft)
        else:
            ctx.get_channel().set("action", "revise")
            ctx.get_channel().set("revision_notes", response.reason)
            ctx.get_channel().set("original_draft", draft)

        return response.approved

    @task(inject_context=True, inject_llm_agent="studio")
    def route_action(ctx: TaskExecutionContext, agent, approved: bool):
        """Send if approved, revise if rejected."""
        channel = ctx.get_channel()
        action = channel.get("action")

        if action == "send":
            content = channel.get("final_content")
            return agent.run(
                f"Send this executive update via email to the CS leadership "
                f"distribution list and post to #cs-leadership on Slack:\n\n{content}"
            )["output"]
        else:
            notes = channel.get("revision_notes")
            original = channel.get("original_draft")
            revised = agent.run(
                f"Revise this draft based on feedback:\n\n"
                f"Original:\n{original}\n\n"
                f"Revision notes:\n{notes}\n\n"
                f"Apply the feedback and return the revised version."
            )["output"]
            # Store revised draft for potential re-approval
            ctx.get_channel().set("revised_draft", revised)
            return revised

    draft_content >> request_approval >> route_action
    ctx.execute("draft_content")
