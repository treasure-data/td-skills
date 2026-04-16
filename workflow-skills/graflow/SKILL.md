---
name: graflow
description: Build agentic workflow pipelines using Graflow (Python). Use when the user asks to create, edit, or debug a Graflow workflow, agentic pipeline, or automated multi-step business process. Covers @task decorator, workflow composition (>> sequential, | parallel), Studio Agent integration for AI reasoning with MCP tools, dynamic branching (next_task, next_iteration), HITL approval flows, and workflow.yaml trigger configuration. Also trigger on mentions of Graflow, agentic workflow, task graph, workflow.py, multi-step automation, CS health check, SDR sequence, or any request combining deterministic logic with AI decision points. For digdag/TD Workflow, see the digdag skill. For scheduled tasks with TASK.md, see the schedule-task skill.
---

# Graflow Agentic Workflow

Build Python workflow pipelines combining **deterministic flow control** (branching, loops, parallelism) with **AI reasoning** (Studio Agent + MCP tools).

> **Docs**: https://graflow.ai/

| Task | Guide |
|------|-------|
| Build a new workflow | Follow the [3-phase process](#workflow-plan--implement--review) below |
| Add Studio Agent to a task | See [Studio Agent Integration](#studio-agent-integration) |
| Add branching or loops | See [Dynamic Control Flow](#dynamic-control-flow) |
| Add human approval gates | See [HITL Patterns](references/advanced-patterns.md#human-in-the-loop-hitl) |
| Configure triggers | See [workflow.yaml Reference](references/workflow-yaml.md) |
| Browse templates | See [templates/](templates/) |

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
@task(inject_llm_agent="studio")
def analyze(agent, account_id: str):
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

```python
from studio_agent import StudioAgent

with workflow("example") as ctx:
    # Register once — session shared across all tasks in this run
    ctx.register_llm_agent("studio", lambda _: StudioAgent())

    @task(inject_llm_agent="studio")
    def research(agent):
        return agent.run("Find all deals closing this week in HubSpot")["output"]

    @task(inject_llm_agent="studio")
    def notify(agent, deals: list):
        # Agent remembers research results (shared session)
        return agent.run(
            f"Post a summary of {len(deals)} closing deals to #sales on Slack"
        )["output"]

    research >> notify
    ctx.execute("research")
```

**When to use Studio Agent vs direct code:**

| Approach | Use When |
|---|---|
| `inject_llm_agent="studio"` | Need MCP tools, AI reasoning, natural language analysis |
| Direct Python (no agent) | Deterministic logic, scoring, filtering, data transforms |

See [Studio Agent Bridge](references/studio-agent-bridge.md) for full API, session sharing, and MCP tool filtering.

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

Every workflow produces two files plus optional supporting files:

```
{workflow-id}/
├── workflow.py           # Graflow workflow definition
├── workflow.yaml         # Metadata, triggers, execution config
├── requirements.txt      # Python dependencies (pinned versions)
├── reference/            # Context files for AI nodes (optional)
└── data/                 # Input data, configs (optional)
```

**workflow.yaml** (minimal):

```yaml
name: my-workflow
description: What this workflow does
triggers:
  - type: cron
    schedule: "0 9 * * *"
execution:
  timeout: 300
results:
  max_retained: 30
```

See [workflow.yaml Reference](references/workflow-yaml.md) for all trigger types and options.

**requirements.txt**:

```
graflow>=0.1.8
studio-agent @ file:///path/to/studio/python/studio_agent
```

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
- scan: HubSpot MCP tools, shared session
- notify: Slack MCP tool, references scan context
```

3. **Present to user** — Show the task graph diagram and key decisions. Iterate until approved. **Do not proceed to Phase 2 without explicit approval.**

### Phase 2: Implement

Write `workflow.py` + `workflow.yaml` + `requirements.txt` based on the approved design.

**Checklist**:
- [ ] `@task` decorators with appropriate injections
- [ ] `>>` / `|` composition matching the design graph
- [ ] `ctx.register_llm_agent("studio", ...)` for AI tasks
- [ ] Deterministic tasks for scoring, filtering, routing
- [ ] `workflow.yaml` with correct triggers
- [ ] Pinned dependencies in `requirements.txt`

### Phase 3: Review

**Checklist**:
- [ ] All tasks from design are implemented
- [ ] Graph matches design diagram
- [ ] Studio Agent prompts are specific (not vague)
- [ ] Deterministic tasks handle edge cases (empty lists, missing data)
- [ ] `workflow.yaml` triggers are correct
- [ ] No open-ended dependency ranges

**Common issues**:
- Missing `inject_context=True` when using `context.next_task()` or channels
- Forgetting `ctx.register_llm_agent()` before using `inject_llm_agent`
- Vague prompts — be specific about what data to fetch/analyze

## Templates

| Template | Pattern | Use Case |
|---|---|---|
| [simple-pipeline.py](templates/simple-pipeline.py) | `fetch >> process >> notify` | Starting point for new workflows |
| [cs-health-check.py](templates/cs-health-check.py) | `scan >> evaluate >> alert` | CS account monitoring |
| [sdr-sequence.py](templates/sdr-sequence.py) | `qualify >> (enrich_co \| enrich_ct) >> personalize >> schedule` | SDR outreach automation |
| [parallel-enrichment.py](templates/parallel-enrichment.py) | `fetch >> (crm \| usage \| support) >> merge >> report` | Multi-source data enrichment |
| [hitl-approval.py](templates/hitl-approval.py) | `draft >> approve >> send/revise` | Human-gated content delivery |

## References

- [Workflow Patterns](references/workflow-patterns.md) — Task definitions, composition, channels, binding
- [Advanced Patterns](references/advanced-patterns.md) — Dynamic tasks, HITL, checkpoints
- [Studio Agent Bridge](references/studio-agent-bridge.md) — StudioAgent API, session sharing, MCP tools
- [workflow.yaml Reference](references/workflow-yaml.md) — Triggers, execution, results config

## Related Skills

- **digdag** — TD-hosted workflow orchestration (`.dig` files, `td>` operator)
- **llm-workflow** — LLM processing within digdag workflows
- **workflow-management** — Debugging and monitoring TD workflows with `tdx wf`
- **schedule-task** — Scheduled tasks using TASK.md and Claude Agent SDK
