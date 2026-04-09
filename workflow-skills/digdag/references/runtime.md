# Runtime

Variable behavior, secret expansion rules, concurrency, and system limits.

---

## Variable Behavior

- Built-in variables (`session_time`, etc.) cannot be overwritten
- All variable values are converted to **strings** — arrays and maps cannot be stored as-is
- `_export` variables are evaluated at reference time (lazy), not at definition time

---

## Secret Expansion

`${secret:key}` differs from regular `${variable}`: the workflow engine leaves it unexpanded. Each operator resolves it only in fields it explicitly allows. Some operators also read named secrets automatically (e.g., `td>` reads `td.apikey`).

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

`_parallel: {limit: N}` controls concurrency by adding task dependencies — it does not limit the number of actual parallel threads.

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

For other limitations: [prerequisites and limitations](https://docs.treasuredata.com/requirements-and-limitations/treasure-workflow-prerequisites-and-limitations)
