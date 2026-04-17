# Graflow Workflow Patterns

## Table of Contents
- [Basic Task Definition](#basic-task-definition)
- [Workflow Context](#workflow-context)
- [Composition Operators](#composition-operators)
- [Channel Communication](#channel-communication)
- [Task Instance Binding](#task-instance-binding)
- [Error Handling Policies](#error-handling-policies)

---

## Basic Task Definition

### Simple Task
```python
from graflow import task

@task
def hello():
    print("Hello, Graflow!")
    return "success"

result = hello.run()
```

### Task with Parameters
```python
@task
def process_data(value: int, multiplier: int = 2) -> int:
    return value * multiplier

result = process_data.run(value=10, multiplier=3)  # Returns 30
```

### Task with Context Injection
```python
from graflow.core.context import TaskExecutionContext

@task(inject_context=True)
def context_task(ctx: TaskExecutionContext):
    print(f"Session: {ctx.session_id}")
    print(f"Task ID: {ctx.task_id}")
    channel = ctx.get_channel()
    channel.set("status", "running")
```

---

## Workflow Context

### Basic Workflow
```python
from graflow import task, workflow

with workflow("my_workflow") as wf:
    @task
    def step_a():
        return "a"

    @task
    def step_b():
        return "b"

    step_a >> step_b
    wf.execute("step_a")
```

### Workflow with Return Value
```python
with workflow("pipeline") as wf:
    # ... define tasks and graph ...
    result = wf.execute("entry_task")
    print(f"Final result: {result}")
```

### Workflow with Context Return
```python
with workflow("pipeline") as wf:
    # ... define tasks ...
    result, exec_ctx = wf.execute("entry_task", ret_context=True)
    final_channel = exec_ctx.get_channel()
    print(final_channel.get("accumulated_data"))
```

### Workflow with Initial Channel
```python
with workflow("pipeline") as wf:
    @task
    def process(config: dict):
        # config is auto-resolved from channel
        return config["value"] * 2

    wf.execute("process", initial_channel={"config": {"value": 10}})
```

---

## Composition Operators

### Sequential (`>>`)
```python
# Tasks execute one after another
fetch >> validate >> transform >> store
```

### Parallel (`|`)
```python
# Tasks execute concurrently, then converge
(task_a | task_b | task_c).set_group_name("parallel_tasks") >> aggregate
```

### Diamond Pattern (Fan-out + Fan-in)
```python
source >> (transform_a | transform_b) >> sink
```

### Multi-stage Pipeline
```python
(load_a | load_b) >> validate >> (process_a | process_b) >> store
```

### Complex DAG
```python
a >> (b | c) >> d >> (e | f | g) >> h
```

---

## Channel Communication

### Basic Channel Operations
```python
@task(inject_context=True)
def producer(ctx: TaskExecutionContext):
    channel = ctx.get_channel()
    channel.set("data", [1, 2, 3])
    channel.set("config", {"batch_size": 100})

@task(inject_context=True)
def consumer(ctx: TaskExecutionContext):
    channel = ctx.get_channel()
    data = channel.get("data")        # [1, 2, 3]
    config = channel.get("config")    # {"batch_size": 100}
```

### Channel Append
```python
@task(inject_context=True)
def accumulator(ctx: TaskExecutionContext):
    channel = ctx.get_channel()
    channel.append("results", "item1")
    channel.append("results", "item2")
    # channel.get("results") == ["item1", "item2"]
```

### Auto Keyword Resolution
```python
# Parameters matching channel keys are auto-resolved
@task(inject_context=True)
def setup(ctx: TaskExecutionContext):
    ctx.get_channel().set("user_name", "Alice")
    ctx.get_channel().set("count", 5)

@task
def greet(user_name: str, count: int = 1):
    # user_name="Alice", count=5 — auto-resolved from channel
    for _ in range(count):
        print(f"Hello, {user_name}!")
```

### Parameter Priority
```
channel < bound < injection
```

1. **Channel** (lowest): Auto-resolved from `channel.set()`
2. **Bound**: Passed at task creation `task(param=value)`
3. **Injection** (highest): `inject_context`

> Graflow also supports `inject_llm_agent`, but Studio workflows do **not** use it. The canonical Studio pattern opens an ephemeral `StudioAgent` inside the task body instead of registering a workflow-level agent. See [Studio Agent Bridge](studio-agent-bridge.md).

---

## Task Instance Binding

### Multiple Instances from Single Task
```python
@task
def process(query: str) -> str:
    return f"Processing: {query}"

# Create separate instances with bound parameters
task1 = process(task_id="task1", query="Tokyo")
task2 = process(task_id="task2", query="Paris")

with workflow("multi_instance") as wf:
    task1 >> task2
    wf.execute("task1")
```

### Bound Parameters Override Channel
```python
with workflow("test") as wf:
    task = process(task_id="test", value=10)  # value=10 is bound
    wf.execute("test", initial_channel={"value": 100})
    # Uses value=10 (bound), not value=100 (channel)
```

---

## Error Handling Policies

### Strict Mode (Default)
```python
from graflow.core.task import ParallelGroup

# All tasks must succeed — if any fails, entire group fails
group = ParallelGroup([task_a, task_b, task_c], name="strict_group")
```

### Best Effort
```python
from graflow.coordination.executor import ExecutionPolicy

group = ParallelGroup(
    [task_a, task_b, task_c],
    name="best_effort",
    execution_policy=ExecutionPolicy.BEST_EFFORT,
)
# Continues even if some tasks fail
```

### At Least N
```python
group = ParallelGroup(
    [task_a, task_b, task_c],
    name="at_least_2",
    execution_policy=ExecutionPolicy.AT_LEAST_N,
    min_successes=2,
)
# Succeeds if at least 2 tasks complete
```

### Critical Tasks Only
```python
group = ParallelGroup(
    [task_a, task_b, task_c],
    name="critical",
    execution_policy=ExecutionPolicy.CRITICAL_ONLY,
    critical_tasks=["task_a"],  # Only task_a must succeed
)
```
