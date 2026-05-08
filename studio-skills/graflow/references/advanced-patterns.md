# Advanced Graflow Patterns

## Table of Contents
- [Dynamic Task Generation](#dynamic-task-generation)
- [Fan-Out and Fan-In Patterns](#fan-out-and-fan-in-patterns)
- [Human-in-the-Loop (HITL)](#human-in-the-loop-hitl)
- [Checkpoint and Resume](#checkpoint-and-resume)

---

## Dynamic Task Generation

### next_task() — Add Task at Runtime
```python
from graflow import task
from graflow.core.context import TaskExecutionContext

@task(inject_context=True)
def dispatcher(ctx: TaskExecutionContext):
    data = ctx.get_channel().get("data")

    if data["type"] == "priority":
        ctx.next_task(priority_handler(data=data))
    else:
        ctx.next_task(normal_handler(data=data))
```

### next_task() with goto — Skip Static Successors
```python
@task(inject_context=True)
def validate(ctx: TaskExecutionContext, record: dict):
    if not record.get("ok"):
        ctx.next_task(error_handler, goto=True)  # Skip process >> publish
        return
    # Fall through to normal pipeline: validate >> process >> publish
```

### next_iteration() — Loop with New Data
```python
@task(inject_context=True, max_cycles=10)
def optimize(ctx: TaskExecutionContext, params: dict = None):
    params = params or {"iter": 0, "accuracy": 0.5}
    params["iter"] += 1
    params["accuracy"] = min(params["accuracy"] + 0.15, 0.95)

    if params["accuracy"] >= 0.9:
        return params  # Converged — exit loop
    ctx.next_iteration({"params": params})  # Loop with updated data
```

### terminate_workflow() — Early Normal Exit
```python
@task(inject_context=True)
def check_complete(ctx: TaskExecutionContext):
    if all_done():
        ctx.terminate_workflow(result="completed early")
        return
    ctx.next_task(continue_processing())
```

### cancel_workflow() — Abort with Error
```python
@task(inject_context=True)
def validate(ctx: TaskExecutionContext):
    if critical_error():
        ctx.cancel_workflow(error="Critical validation failed")
```

---

## Fan-Out and Fan-In Patterns

### Dynamic Parallel Group
```python
from graflow.core.task import parallel

@task(inject_context=True)
def create_workers(ctx: TaskExecutionContext):
    items = ctx.get_channel().get("items")

    workers = [
        process_item(task_id=f"worker_{i}", item=item)
        for i, item in enumerate(items)
    ]
    ctx.next_task(parallel(*workers))
```

### Fan-Out-then-Fan-In (Single Convergence Point)
```python
@task(inject_context=True)
def root(ctx: TaskExecutionContext):
    parallel_group = parallel(
        branch_a(task_id="branch_a"),
        branch_b(task_id="branch_b"),
    )
    # integrator runs ONCE after both branches complete
    chained = parallel_group >> integrator(task_id="integrator")
    ctx.next_task(chained)
```

---

## Human-in-the-Loop (HITL)

Studio provides a built-in HITL mechanism via `request_feedback()` from the `studio_agent` package. When a workflow calls `request_feedback()`, Studio displays an approval card in the Agentic Workflows panel (plus an OS notification), and the call blocks until the user responds or the timeout expires.

Use `request_feedback()` instead of Graflow's native `ctx.request_feedback()` for workflows running under Studio. The Studio function uses HTTP long-polling to the Local API Server rather than filesystem polling, and surfaces a rich approval UI with options, context display, and free-form comments.

### Basic Approval
```python
from studio_agent import request_feedback

@task
def approval_gate(draft: str) -> dict:
    decision = request_feedback(
        prompt=f"Approve this draft?\n\n{draft}",
        timeout=3600,
    )
    if decision["status"] != "approved":
        raise RuntimeError(f"Rejected: {decision.get('comment') or 'no reason'}")
    return decision
```

### Selection with Options
```python
@task(inject_context=True)
def select_action(ctx: TaskExecutionContext):
    decision = request_feedback(
        prompt="Select action for at-risk account:",
        options=["Schedule call", "Send email", "Escalate to manager", "Skip"],
        timeout=300,
    )
    ctx.get_channel().set("action", decision["choice"])
```

### Rich Context Display
```python
@task(inject_context=True)
def review_outreach(ctx: TaskExecutionContext):
    email_body = ctx.get_channel().get("email_body")
    account = ctx.get_channel().get("account")
    decision = request_feedback(
        prompt="Send this outreach email?",
        options=["Send now", "Queue for tomorrow", "Discard"],
        context={
            "account": account["name"],
            "ARR": f"${account['arr']:,.0f}",
            "email_preview": email_body[:500],
        },
        timeout=3600,
    )
    ctx.get_channel().set("send_decision", decision)
```

### Handling All Response Statuses
```python
decision = request_feedback(prompt="Deploy to production?", timeout=1800)

if decision["status"] == "approved":
    # User clicked Approve
    print(f"Approved. Choice: {decision['choice']}, Comment: {decision['comment']}")
elif decision["status"] == "rejected":
    # User clicked Reject
    print(f"Rejected. Reason: {decision['comment']}")
elif decision["status"] == "timeout":
    # No response within timeout
    print("No response — aborting.")
elif decision["status"] == "cancelled":
    # Studio closed or workflow run cancelled
    print("Cancelled — exiting cleanly.")
```

### `request_feedback()` API

```python
from studio_agent import request_feedback

decision = request_feedback(
    prompt="Question for the user (1–2000 chars)",
    options=["Option A", "Option B"],   # Up to 4 labeled options (optional)
    context={"key": "value"},           # Key/value pairs shown beside the prompt (optional)
    timeout=3600,                       # Max seconds to wait (clamped to [60, 86400])
)
```

**Returns** a dict:

| Key | Type | Description |
|---|---|---|
| `status` | `str` | `"approved"` \| `"rejected"` \| `"timeout"` \| `"cancelled"` |
| `choice` | `str \| None` | Selected option label, or `None` |
| `comment` | `str \| None` | Free-form text the user entered, or `None` |

**Raises** `StudioAgentError` if Studio is unreachable.

### Timeout Strategy for HITL Workflows

When a workflow includes `request_feedback()`, the `execution.timeout` in `manifest.yml` must account for human response time. Budget the `request_feedback` timeout **plus** agent task time:

| Workflow Shape | Recommended `execution.timeout` |
|---|---|
| 1 agent task + 1 HITL (1h) | 3900 (3600 + 300 margin) |
| 2 agent tasks + 1 HITL (1h) | 4200 |
| Agent + HITL + agent (chain) | 4500+ |

Set `execution.timeout` >= the sum of all `request_feedback` timeouts plus agent execution time.

---

## Checkpoint and Resume

### Basic Checkpoint
```python
@task(inject_context=True)
def long_running(ctx: TaskExecutionContext):
    for i, batch in enumerate(batches):
        process(batch)
        if i % 10 == 0:
            ctx.checkpoint()
```

### Resume from Checkpoint
```python
from graflow.core.checkpoint import CheckpointManager

manager = CheckpointManager(checkpoint_dir="./checkpoints")
result = manager.resume_from_checkpoint("checkpoint_path.pkl")
```

### Fault Recovery Pattern
```python
with workflow("fault_tolerant") as wf:
    try:
        result = wf.execute("entry_task", checkpoint_dir="./checkpoints")
    except Exception as e:
        print(f"Failed: {e}, resuming from checkpoint...")
        manager = CheckpointManager(checkpoint_dir="./checkpoints")
        result = manager.resume_from_latest()
```
