---
name: graflow
description: Build agentic workflow pipelines using Graflow (Python). Use when the user asks to create, edit, or debug a Graflow workflow, agentic pipeline, or automated multi-step business process. Covers @task decorator, workflow composition (>> sequential, | parallel), Studio Agent integration with the ephemeral-per-task session pattern (MCP tools, state via channels), subprocess for CLI tools, dynamic branching (next_task, next_iteration), HITL approval flows, and manifest.yml triggers and permissions.allow configuration. Also trigger on mentions of Graflow, agentic workflow, task graph, workflow.py, multi-step automation, CS health check, SDR sequence, or any request combining deterministic logic with AI decision points. For digdag/TD Workflow, see the digdag skill. For scheduled tasks with TASK.md, see the schedule-task skill.
---

# Graflow Agentic Workflow

Build Python workflow pipelines combining **deterministic flow control** (branching, loops, parallelism) with **AI reasoning** (Studio Agent + MCP tools).

> **Docs**: https://graflow.ai/

| Task | Guide |
|------|-------|
| Build a new workflow | Follow the [3-phase process](#workflow-plan--implement--review) below |
| Add Studio Agent to a task | See [Studio Agent Integration](#studio-agent-integration) |
| Use CLI tools without agent overhead | See [Subprocess Tasks](#subprocess-tasks) |
| Add branching or loops | See [Dynamic Control Flow](#dynamic-control-flow) |
| Add human approval gates | See [HITL Patterns](references/advanced-patterns.md#human-in-the-loop-hitl) |
| Configure triggers and tool permissions | See [manifest.yml Reference](references/manifest-yml.md) |
| Browse templates | See [templates/](templates/) |

## When to Use Graflow

| Use Case | Tool |
|---|---|
| Multi-step process with branching, parallelism, HITL | **Graflow** |
| Open-ended AI reasoning (research, analysis) | **Scheduled Task** (TASK.md) |
| Data pipeline on TD platform | **TD Workflow** (digdag) |

## Core Concepts

### Three Types of Tasks

Every task in a Graflow workflow falls into one of three categories. Choosing the right type for each step is the most important design decision — it affects performance, cost, and reliability.

| Type | When to Use | Example |
|---|---|---|
| **Deterministic** (pure Python) | Scoring, filtering, classification, data transforms | Categorize items by keyword, compute risk scores |
| **Studio Agent** (AI reasoning) | Need MCP tools, natural language analysis, content generation | Summarize data, draft reports, post to Slack |
| **Subprocess** (CLI tools) | Call external CLIs directly — faster and more reliable than routing through an agent | `gh`, `tdx`, `curl`, `jq` |

The subprocess type is important because spawning an agent session just to run a single CLI command adds significant latency and token cost. If the task is "fetch data from a CLI tool," `subprocess.run()` is the right choice.

```python
from graflow import task, workflow
from graflow.core.context import TaskExecutionContext
from studio_agent import StudioAgent
import subprocess, json

# 1. Deterministic — pure logic, no I/O overhead
@task
def score(accounts: list) -> list:
    return [a for a in accounts if a["health"] < 0.5]

# 2. Studio Agent — AI reasoning + MCP tools
@task
def analyze(account_id: str):
    with StudioAgent() as agent:
        return agent.run(
            f"Check activity for account {account_id} "
            f"and assess churn risk. Return as JSON."
        )["output"]

# 3. Subprocess — call a CLI tool directly
@task(inject_context=True)
def fetch_data(ctx: TaskExecutionContext) -> list:
    result = subprocess.run(
        ["gh", "api", "/repos/owner/repo/issues", "--paginate"],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"gh failed: {result.stderr}")
    data = json.loads(result.stdout)
    ctx.get_channel().set("data", data)
    return data
```

### Workflow Composition

```python
a >> b                    # Sequential: b after a
a | b                     # Parallel: a and b concurrently
a >> (b | c) >> d         # Fan-out/fan-in
(a | b) >> c >> (d | e)   # Multi-stage pipeline
```

### Studio Agent Integration

Delegate AI reasoning to Studio's Claude Agent SDK with access to 100+ MCP tools (Slack, Google Calendar, CRM, etc.).

**Canonical pattern**: open a fresh `StudioAgent` inside each task and let the `with` block close it when the task ends. Pass state between tasks through channel set/get — not through shared agent memory.

```python
from graflow import task, workflow
from graflow.core.context import TaskExecutionContext
from studio_agent import StudioAgent


@task(inject_context=True)
def research(ctx: TaskExecutionContext) -> str:
    with StudioAgent() as agent:
        result = agent.run(
            "Find all active deals closing this week. Return as JSON."
        )
    summaries = result["output"]
    ctx.get_channel().set("summaries", summaries)
    return summaries


@task(inject_context=True)
def notify(ctx: TaskExecutionContext) -> str:
    summaries = ctx.get_channel().get("summaries")
    with StudioAgent() as agent:
        # Name the tool explicitly so the agent doesn't guess
        result = agent.run(
            f"Deals:\n{summaries}\n\n"
            f"Post a one-paragraph summary to #sales on Slack. "
            f"Use slack_post_message tool."
        )
    return result["output"]


with workflow("example") as ctx:
    research >> notify
    ctx.execute("research")
```

**Agent prompt tips:**
- Name the MCP tool the agent should use (e.g. "Use slack_post_message tool.") — this prevents the agent from guessing or trying wrong tools.
- Be specific about data format and expected output.
- Re-supply all data the agent needs — each task gets a fresh session with no memory of prior tasks.

**Do not** register an agent at the workflow level (`ctx.register_llm_agent(...)`) and share it across tasks. That keeps a Claude session open through every intervening deterministic task and couples tasks to implicit agent memory instead of explicit channel state. See [Studio Agent Bridge](references/studio-agent-bridge.md) for the one narrow exception (multi-turn chain-of-thought inside a single task) and the full `StudioAgent` API.

### Subprocess Tasks

When a task just calls a CLI tool and parses its output, use `subprocess.run()` directly instead of routing through a Studio Agent. This avoids agent session overhead (typically 30-60s per call) and gives deterministic, reproducible results.

```python
import subprocess, json

@task(inject_context=True)
def fetch_from_cli(ctx: TaskExecutionContext) -> list:
    """Call an external CLI and parse its JSON output."""
    result = subprocess.run(
        ["some-cli", "list", "--json", "--limit", "100"],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"CLI failed: {result.stderr}")
    items = json.loads(result.stdout)
    ctx.get_channel().set("items", items)
    return items
```

When using subprocess, add the corresponding CLI to `permissions.allow` in `manifest.yml`:

```yaml
permissions:
  allow:
    - "Bash(some-cli:*)"   # Argument-level pattern for the CLI
```

### Channel Communication

Tasks share data through channels. There are two approaches:

**Explicit channel set/get** — Reliable and recommended for complex workflows. Works well when multiple downstream tasks need the same data, or when the channel key name differs from the parameter name.

```python
@task(inject_context=True)
def producer(ctx: TaskExecutionContext):
    data = compute_something()
    ctx.get_channel().set("results", data)
    return data

@task(inject_context=True)
def consumer(ctx: TaskExecutionContext):
    data = ctx.get_channel().get("results")
```

**Auto keyword resolution** — Graflow can auto-resolve task parameters from matching channel keys. Simpler for short pipelines where each value is consumed by exactly one downstream task.

```python
@task(inject_context=True)
def setup(ctx: TaskExecutionContext):
    ctx.get_channel().set("threshold", 0.5)

@task
def check(threshold: float):  # Auto-resolved from channel
    print(threshold)  # 0.5
```

For workflows with more than 3-4 tasks, or where the data flow isn't strictly linear, prefer explicit channel set/get. It's clearer about what data flows where, and avoids subtle bugs when parameter names don't exactly match channel keys.

**Priority**: channel < bound parameter < injection

### Handling Empty or Missing Data

When upstream tasks might return empty results, handle this gracefully instead of letting the workflow fail. Continue with a sensible default rather than terminating.

```python
@task(inject_context=True)
def process(ctx: TaskExecutionContext) -> str:
    items = ctx.get_channel().get("items")
    if not items:
        summary = "No items found for this period."
        ctx.get_channel().set("summary", summary)
        return summary
    # ... normal processing ...
```

Use `ctx.terminate_workflow()` only for conditions where continuing would be meaningless (not just empty data). For most cases, propagate a "nothing to report" message through the pipeline so the final task can still produce useful output.

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
profile: "@tdx-studio:<site>:<account-id>:<user-id>"  # AUTO-STAMPED by Studio at create time — DO NOT hand-author
description: What this workflow does
permissions:
  allow:
    - "mcp__work__slack_post_message"   # Full MCP tool name
    - "Bash(gh:*)"                            # CLI with argument pattern
triggers:
  - type: cron
    schedule: "0 9 * * *"
execution:
  timeout: 600             # Budget ~120s per agent task
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

Pin dependency versions. Avoid open-ended ranges for production workflows.

## Workflow: Plan → Implement → Review

### Phase 1: Plan

1. **Gather requirements** — Ask the user:
   - Purpose and trigger conditions?
   - Data sources / external services involved?
   - Which steps need AI reasoning vs deterministic logic vs subprocess?
   - Approval/review gates (HITL)?
   - Output destinations (Slack, email, CRM)?

2. **Create design document** (`workflow_design.md`):

```markdown
# Workflow Design: {name}

## Tasks
| Task ID | Type | Responsibility |
|---------|------|---------------|
| fetch | Subprocess | Pull data from external CLI |
| summarize | Studio Agent | Summarize and analyze data |
| categorize | Deterministic | Classify items by rules |
| draft | Studio Agent | Compose report |
| post | Studio Agent | Post to Slack |

## Task Graph
fetch >> summarize >> categorize >> draft >> post

## Studio Agent Usage
- summarize: ephemeral session; receives raw data via channel
- draft: ephemeral session; receives categorized data via channel
- post: ephemeral session; receives draft via channel; use slack_post_message tool
```

3. **Present to user** — Show the task graph diagram and key decisions. Iterate until approved. **Do not proceed to Phase 2 without explicit approval.**

### Phase 2: Implement

Write `workflow.py` + `manifest.yml` + `requirements.txt` based on the approved design.

**Checklist**:
- [ ] `@task` decorators with appropriate injections (`inject_context=True` when using channels or control flow)
- [ ] `>>` / `|` composition matching the design graph
- [ ] Every agent-backed task opens its own `with StudioAgent() as agent:` block
- [ ] Agent prompts name the specific MCP tool to use (e.g. "Use slack_post_message tool.")
- [ ] Cross-task state flows through explicit `channel.set()` / `channel.get()`
- [ ] CLI-calling tasks use `subprocess.run()` with `timeout` and error checking
- [ ] Deterministic tasks for scoring, filtering, routing
- [ ] Empty/missing data handled gracefully (no unnecessary `terminate_workflow`)
- [ ] `manifest.yml` with correct triggers, a minimal `permissions.allow` list, and adequate timeout
- [ ] Pinned dependencies in `requirements.txt`

### Phase 3: Review

**Checklist**:
- [ ] All tasks from design are implemented
- [ ] Graph matches design diagram
- [ ] Studio Agent prompts are specific (not vague) and re-supply all data the task needs
- [ ] Deterministic tasks handle edge cases (empty lists, missing data)
- [ ] `manifest.yml` triggers are correct and `permissions.allow` is as narrow as possible
- [ ] `execution.timeout` is large enough — budget ~120s per agent task plus time for subprocess/deterministic tasks
- [ ] No open-ended dependency ranges

**Common issues**:
- Missing `inject_context=True` when using `ctx.get_channel()` or `context.next_task()`
- Assuming the agent "remembers" a previous task's output — each task has a fresh session, so re-supply the data in the prompt
- Registering a workflow-level `ctx.register_llm_agent(...)` instead of the ephemeral-per-task pattern
- Vague agent prompts that don't name the tool to use — the agent wastes time guessing
- Using subprocess to call a CLI but forgetting to add the corresponding `Bash(cli:*)` to `permissions.allow`
- Default `timeout: 300` being too short for workflows with multiple agent tasks
- Using `terminate_workflow` for empty data when the pipeline should continue with a "nothing to report" message

## Templates

| Template | Pattern | Use Case |
|---|---|---|
| [simple-pipeline.py](templates/simple-pipeline.py) | `fetch >> process >> notify` | Starting point for new workflows |
| [cs-health-check.py](templates/cs-health-check.py) | `scan >> evaluate >> alert` | CS account monitoring |
| [sdr-sequence.py](templates/sdr-sequence.py) | `qualify >> (enrich_co \| enrich_ct) >> personalize >> schedule` | SDR outreach automation |
| [parallel-enrichment.py](templates/parallel-enrichment.py) | `fetch >> (crm \| usage \| support) >> merge >> report` | Multi-source data enrichment |
| [hitl-approval.py](templates/hitl-approval.py) | `draft >> approve >> send/revise` | Human-gated content delivery with Studio approval UI |

## References

- [Workflow Patterns](references/workflow-patterns.md) — Task definitions, composition, channels, binding
- [Advanced Patterns](references/advanced-patterns.md) — Dynamic tasks, HITL, checkpoints
- [Studio Agent Bridge](references/studio-agent-bridge.md) — StudioAgent API, prompt tips, ephemeral-per-task pattern
- [manifest.yml Reference](references/manifest-yml.md) — Triggers, `permissions.allow` syntax (including argument-level patterns), execution settings

## Related Skills

- **digdag** — TD-hosted workflow orchestration (`.dig` files, `td>` operator)
- **llm-workflow** — LLM processing within digdag workflows
- **workflow-management** — Debugging and monitoring TD workflows with `tdx wf`
- **schedule-task** — Scheduled tasks using TASK.md and Claude Agent SDK
