# Scheduling Reference

---

## Schedule Types

```yaml
# Hourly at :30
schedule:
  hourly>: 30:00

# Daily at 9am
schedule:
  daily>: "09:00:00"

# Weekly on Monday
schedule:
  weekly>: Mon,09:00:00

# Monthly on the 1st
schedule:
  monthly>: 1,09:00:00

# Cron (quote if starts with *)
schedule:
  cron>: "*/15 * * * *"

# Fixed interval
schedule:
  minutes_interval>: 30
```

| Type | Syntax | Description |
|---|---|---|
| `hourly>:` | `MM:SS` | Every hour at specified minutes:seconds |
| `daily>:` | `HH:MM:SS` | Every day at specified time |
| `weekly>:` | `DDD,HH:MM:SS` | Day of week at specified time |
| `monthly>:` | `D,HH:MM:SS` | Day of month at specified time |
| `minutes_interval>:` | `M` | Every M minutes |
| `cron>:` | `CRON_FORMAT` | Standard cron expression |

---

## Schedule Options

| Option | Type | Description |
|---|---|---|
| `start:` | `YYYY-MM-DD` | Schedule active from this date |
| `end:` | `YYYY-MM-DD` | Schedule active through this date (inclusive) |
| `skip_on_overtime:` | boolean | Skip next session if current session is still running |
| `skip_delayed_by:` | duration | Skip sessions older than this duration (e.g., `1h`) |

---

## SLA

Monitor whether a workflow completes within expected time.

```yaml
sla:
  time: "06:00:00"
  +alert:
    http>: ${secret:webhook_url}
    method: POST
    content:
      text: "Workflow exceeded SLA for ${session_date}"
```

| Option | Type | Description |
|---|---|---|
| `time:` | `HH:MM:SS` | Must complete by this absolute time |
| `duration:` | `HH:MM:SS` | Must complete within this duration from start |

---

## Timezone Interaction

The `timezone:` at the top of a .dig file determines how schedule times are interpreted.

```yaml
timezone: Asia/Tokyo

schedule:
  daily>: "09:00:00"  # 9am JST
```

Session time reflects the period start (e.g., daily at 00:00:00), not the actual execution time.

---

## Special Variables

- `${last_executed_session_time}` — Previous execution's session time. Differs from `${last_session_time}` when `skip_on_overtime` is enabled or on first execution.

---

## References

- https://docs.treasure.ai/products/customer-data-platform/data-workbench/workflows/scheduling-workflows
