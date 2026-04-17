---
name: graflow
description: Build agentic workflow pipelines using Graflow (Python). Use when the user asks to create, edit, or debug a Graflow workflow, agentic pipeline, or automated multi-step business process. Covers @task decorator, workflow composition (>> sequential, | parallel), Studio Agent integration with the ephemeral-per-task session pattern (MCP tools, state via channels), dynamic branching (next_task, next_iteration), HITL approval flows, and manifest.yml triggers and permissions.allow configuration. Also trigger on mentions of Graflow, agentic workflow, task graph, workflow.py, multi-step automation, CS health check, SDR sequence, or any request combining deterministic logic with AI decision points. For digdag/TD Workflow, see the digdag skill. For scheduled tasks with TASK.md, see the schedule-task skill.
---

# Graflow Agentic Workflow

Build Python workflow pipelines combining **deterministic flow control** (branching, loops, parallelism) with **AI reasoning** (Studio Agent + MCP tools).

> **Docs**: https://graflow.ai/

| Task | Guide |
|------|-------|
| Build a new workflow | Follow the [3-phase process](#workflow-plan--implement--review) below |
| Add Studio Agent to a task | See [Studio Agent Integration](#studio-agent-integration) |
| Add branching or loops | See [Dynamic Control Flow](#dynamic-control-flow) |
| Add human approval gates (⚠️ see Studio note below) | See [HITL Patterns](references/advanced-patterns.md#human-in-the-loop-hitl) |
| Configure triggers and tool permissions | See [manifest.yml Reference](references/manifest-yml.md) |
| Browse templates | See [templates/](templates/) |

> ⚠️ **HITL + Studio**: `ctx.request_feedback()` works as a Graflow primitive, but the Studio agentic-workflow runtime does **not** yet provide an approval UI. A Studio-launched workflow that calls `request_feedback()` will block on a filesystem poll until the timeout expires (by default, failing the run). For Studio-targeted workflows, either skip the HITL task or keep humans in the loop out-of-band (e.g. post the draft to a Slack review channel for manual follow-up). When Studio Phase 2 lands, the task will surface in the UI without code changes.

## When to Use Graflow

| Use Case | Tool |
|---|---|
| Multi-step process with branching, parallelism, HITL | **Graflow** |
| Open-ended AI reasoning (research, analysis) | **Scheduled Task** (TASK.md) |
| Data pipeline on TD platform | **TD Workflow** (digdag) |

## Core Concepts

### Task Definition

```python
from graflow import task, workflow
from studio_agent import StudioAgent

# Simple deterministic task
@task
def score(accounts: list) -> list:
    return [a for a in accounts if a["health"] < 0.5]

# Task with context injection (for branching, channels, loops)
@task(inject_context=True)
def route(context, score: float):
    if score < 0.3:
        context.next_task(urgent_action, goto=True)

# Task with Studio Agent (AI reasoning + MCP tools)
# Canonical pattern: ephemeral session opened inside the task.
@task
def analyze(account_id: str):
    with StudioAgent() as agent:
        return agent.run(
            f"Check HubSpot activity for account {account_id} "
            f"and assess churn risk with supporting evidence."
        )["output"]
```

### Workflow Composition

```python
a >> b                    # Sequential: b after a
a | b                     # Parallel: a and b concurrently
a >> (b | c) >> d         # Fan-out/fan-in
(a | b) >> c >> (d | e)   # Multi-stage pipeline
```

### Studio Agent Integration

Delegate AI reasoning to Studio's Claude Agent SDK with access to 100+ MCP tools (HubSpot, Slack, Google Calendar, Gainsight, etc.).

**Canonical pattern**: open a fresh `StudioAgent` inside each task and let the `with` block close it when the task ends. Pass state between tasks through return values / channel parameters — not through shared agent memory.

```python
from graflow import task, workflow
from studio_agent import StudioAgent


@task
def research() -> str:
    with StudioAgent() as agent:
        return agent.run(
            "Find all HubSpot deals closing this week. Return as JSON."
        )["output"]


@task
def notify(deals: str) -> str:
    # Fresh session — pass prior output explicitly through the prompt.
    with StudioAgent() as agent:
        return agent.run(
            f"Deals:\n{deals}\n\n"
            f"Post a one-paragraph summary to #sales on Slack."
        )["output"]


with workflow("example") as ctx:
    research >> notify
    ctx.execute("research")
```

**When to use Studio Agent vs direct code:**

| Approach | Use When |
|---|---|
| Ephemeral `StudioAgent` | Need MCP tools, AI reasoning, natural language analysis |
| Direct Python (no agent) | Deterministic logic, scoring, filtering, data transforms |

**Do not** register an agent at the workflow level (`ctx.register_llm_agent(...)`) and share it across tasks. That keeps a Claude session open through every intervening deterministic task and couples tasks to implicit agent memory instead of explicit channel state. See [Studio Agent Bridge](references/studio-agent-bridge.md) for the one narrow exception (multi-turn chain-of-thought inside a single task) and the full `StudioAgent` API.

### Channel Communication

Tasks share data via channels. Parameters matching channel keys auto-resolve:

```python
@task(inject_context=True)
def setup(ctx):
    ctx.get_channel().set("threshold", 0.5)

@task
def check(threshold: float):  # Auto-resolved from channel
    print(threshold)  # 0.5
```

**Priority**: channel < bound parameter < injection

### Dynamic Control Flow

```python
# Conditional branching — skip to a specific task
@task(inject_context=True)
def classify(context, data: dict):
    if data["priority"] == "high":
        context.next_task(urgent_handler, goto=True)
    elif data["priority"] == "low":
        context.terminate_workflow("Low priority — skipped")

# Iterative refinement — loop until convergence
@task(inject_context=True, max_cycles=10)
def refine(context, draft: str = ""):
    improved = improve(draft)
    if quality_score(improved) >= 0.9:
        return improved
    context.next_iteration({"draft": improved})
```

### Parallel Error Policies

```python
from graflow.core.task import ParallelGroup
from graflow.coordination.executor import ExecutionPolicy

# Best effort — continue even if some tasks fail
ParallelGroup([a, b, c], name="checks", execution_policy=ExecutionPolicy.BEST_EFFORT)

# At least N — succeed if 2 of 3 complete
ParallelGroup([a, b, c], name="quorum", execution_policy=ExecutionPolicy.AT_LEAST_N, min_successes=2)
```

## Output File Structure

Every workflow directory contains a manifest, the workflow code, and pinned dependencies, plus optional supporting files:

```
{workflow-id}/
├── manifest.yml          # Metadata, triggers, permissions, execution config
├── workflow.py           # Graflow workflow definition
├── requirements.txt      # Python dependencies (pinned versions)
├── guide.md              # Human-readable description / run notes (optional)
├── reference/            # Context files for AI nodes (optional)
└── data/                 # Input data, configs (optional)
```

**manifest.yml** (minimal):

```yaml
name: my-workflow
description: What this workflow does
permissions:
  allow:
    - "slack_post_message"   # Studio MCP short name
    - "Bash"                 # shell access (needed for `tdx`)
triggers:
  - type: cron
    schedule: "0 9 * * *"
execution:
  timeout: 300
results:
  max_retained: 30
```

See [manifest.yml Reference](references/manifest-yml.md) for all trigger types, the `permissions.allow` syntax, and every option.

**requirements.txt**:

```
graflow>=0.1.8
studio-agent @ file:///path/to/studio/python/studio_agent
```

Studio's scaffold fills in the correct `file://` path to the bundled `studio_agent` package automatically.

**IMPORTANT**: Always pin dependency versions. Avoid open-ended ranges for production workflows.

## Workflow: Plan → Implement → Review

### Phase 1: Plan

1. **Gather requirements** — Ask the user:
   - Purpose and trigger conditions?
   - Data sources / external services involved?
   - Which steps need AI reasoning vs deterministic logic?
   - Approval/review gates (HITL)?
   - Output destinations (Slack, email, CRM)?

2. **Create design document** (`workflow_design.md`):

```markdown
# Workflow Design: {name}

## Tasks
| Task ID | Type | Responsibility |
|---------|------|---------------|
| scan | Studio Agent | Fetch accounts from HubSpot |
| evaluate | Deterministic | Score churn risk |
| notify | Studio Agent | Send Slack alert |

## Task Graph
scan >> evaluate >> notify

## Studio Agent Usage
- scan: ephemeral session, HubSpot MCP tools
- notify: ephemeral session, Slack MCP tool; receives at-risk list via channel
```

3. **Present to user** — Show the task graph diagram and key decisions. Iterate until approved. **Do not proceed to Phase 2 without explicit approval.**

### Phase 2: Implement

Write `workflow.py` + `manifest.yml` + `requirements.txt` based on the approved design.

**Checklist**:
- [ ] `@task` decorators with appropriate injections (`inject_context=True` only where needed)
- [ ] `>>` / `|` composition matching the design graph
- [ ] Every agent-backed task opens its own `with StudioAgent() as agent:` block
- [ ] Cross-task state is passed through return values / channel parameters (not shared agent memory)
- [ ] Deterministic tasks for scoring, filtering, routing
- [ ] `manifest.yml` with correct triggers and a minimal `permissions.allow` list
- [ ] Pinned dependencies in `requirements.txt`

### Phase 3: Review

**Checklist**:
- [ ] All tasks from design are implemented
- [ ] Graph matches design diagram
- [ ] Studio Agent prompts are specific (not vague) and re-supply any data the previous task produced
- [ ] Deterministic tasks handle edge cases (empty lists, missing data)
- [ ] `manifest.yml` triggers are correct and `permissions.allow` is as narrow as possible
- [ ] No open-ended dependency ranges

**Common issues**:
- Missing `inject_context=True` when using `context.next_task()` or channels
- Assuming the agent "remembers" a previous task's output — each task has a fresh session, so the caller must re-supply the data in the prompt
- Registering a workflow-level `ctx.register_llm_agent(...)` instead of using the ephemeral-per-task pattern
- Vague prompts — be specific about what data to fetch/analyze
- Using an MCP tool that is not listed in `manifest.yml`'s `permissions.allow`

## Templates

| Template | Pattern | Use Case |
|---|---|---|
| [simple-pipeline.py](templates/simple-pipeline.py) | `fetch >> process >> notify` | Starting point for new workflows |
| [cs-health-check.py](templates/cs-health-check.py) | `scan >> evaluate >> alert` | CS account monitoring |
| [sdr-sequence.py](templates/sdr-sequence.py) | `qualify >> (enrich_co \| enrich_ct) >> personalize >> schedule` | SDR outreach automation |
| [parallel-enrichment.py](templates/parallel-enrichment.py) | `fetch >> (crm \| usage \| support) >> merge >> report` | Multi-source data enrichment |
| [hitl-approval.py](templates/hitl-approval.py) ⚠️ Studio UI pending | `draft >> approve >> send/revise` | Human-gated content delivery (not runnable in Studio until Phase 2) |

## References

- [Workflow Patterns](references/workflow-patterns.md) — Task definitions, composition, channels, binding
- [Advanced Patterns](references/advanced-patterns.md) — Dynamic tasks, HITL, checkpoints
- [Studio Agent Bridge](references/studio-agent-bridge.md) — StudioAgent API, ephemeral-per-task pattern, shared-session exception
- [manifest.yml Reference](references/manifest-yml.md) — Triggers, `permissions.allow`, execution, results config

## Related Skills

- **digdag** — TD-hosted workflow orchestration (`.dig` files, `td>` operator)
- **llm-workflow** — LLM processing within digdag workflows
- **workflow-management** — Debugging and monitoring TD workflows with `tdx wf`
- **schedule-task** — Scheduled tasks using TASK.md and Claude Agent SDK
