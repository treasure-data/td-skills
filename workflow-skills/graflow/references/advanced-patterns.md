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

### Basic Approval
```python
@task(inject_context=True)
def approval_task(ctx: TaskExecutionContext):
    response = ctx.request_feedback(
        feedback_type="approval",
        prompt="Approve deployment to production?",
        timeout=300.0,
    )

    if response.approved:
        ctx.next_task(deploy())
    else:
        ctx.cancel_workflow(error=f"Rejected: {response.reason}")
```

### Text Input
```python
@task(inject_context=True)
def text_input_task(ctx: TaskExecutionContext):
    response = ctx.request_feedback(
        feedback_type="text",
        prompt="Enter the target Slack channel:",
        timeout=60.0,
    )
    channel_name = response.text
```

### Selection
```python
@task(inject_context=True)
def selection_task(ctx: TaskExecutionContext):
    response = ctx.request_feedback(
        feedback_type="selection",
        prompt="Select action for at-risk account:",
        options=["schedule_call", "send_email", "escalate_to_manager", "skip"],
        timeout=120.0,
    )
    selected_action = response.selected
```

### Channel Integration
```python
@task(inject_context=True)
def feedback_to_channel(ctx: TaskExecutionContext):
    response = ctx.request_feedback(
        feedback_type="selection",
        prompt="Select processing mode:",
        options=["conservative", "balanced", "aggressive"],
        channel_key="processing_mode",  # Auto-write to channel
        write_to_channel=True,
        timeout=60.0,
    )
    # response.selected is also written to channel["processing_mode"]
```

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
