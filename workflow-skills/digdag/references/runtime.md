# Runtime

Variable behavior, secret expansion rules, concurrency, and system limits.

---

## Variable Behavior

- Built-in variables (`session_time`, etc.) cannot be overwritten
- All variable values are converted to **strings** — arrays and maps cannot be stored as-is
- `_export` variables are evaluated at reference time (lazy), not at definition time
- Pass runtime values via `tdx wf start <project> <workflow> -p key=value` to override variables at attempt start

---

## Retry Semantics

Two types of retry:

- **`job_retry`** (operator-level): TD query operators (`td>`, `td_for_each>`, `td_wait>`, `td_wait_table>`) retry the query within the same job. The task itself is not re-executed.
- **`_retry`** (task-level): Re-executes the entire task on failure. When applied to a group, re-runs all child tasks from the beginning.

```yaml
+query:
  td>: queries/heavy.sql
  job_retry: 3           # retry the query within the same job

+group:
  _retry:                # re-execute the whole group on failure
    limit: 3
    interval: 10
    interval_type: exponential
  +step_a:
    td>: queries/a.sql
  +step_b:
    td>: queries/b.sql
```

**Known issue:** once a group with `_retry` has fired at least one retry, a later attempt-level resume with `--resume-from` (e.g., `tdx wf retry --resume-from +failed`) fails with HTTP 500 — you must rerun the attempt from the start.

---

## Secret Expansion

`${secret:key}` is only expanded in operator fields that explicitly support it. Some operators also auto-resolve named secrets (e.g., `td>` reads `td.apikey`).

Which fields each operator expands and which named secrets are auto-resolved — see [Secrets Reference in operators.md](operators.md#secrets-reference).

---

## Concurrency

```yaml
+limited:
  _parallel:
    limit: 2

  +task_a:
    td>: queries/a.sql
  +task_b:
    td>: queries/b.sql
  +task_c:
    td>: queries/c.sql
```

`_parallel: {limit: N}` runs at most N subtasks at a time.

---

## System Limits

**TTL:**

| Scope | Limit |
|---|---|
| Task | 24 hours |
| Attempt | 7 days |

**Resource:**

| Scope | Limit |
|---|---|
| Tasks per attempt | 1,000 |
| Concurrent tasks per account | 30 |
| Project archive size | 10 MB |

For other limitations: [prerequisites and limitations](https://docs.treasure.ai/requirements-and-limitations/treasure-workflow-prerequisites-and-limitations)
