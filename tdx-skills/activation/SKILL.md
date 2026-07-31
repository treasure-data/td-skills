---
name: activation
description: Configures CDP activations for exporting segment/journey audiences to external destinations. Covers connection discovery, activation YAML structure, schedule options (daily/weekly/monthly/cron), column selection with masking, multi-table behavior data export (join up to 4 behavior tables via `behaviors:`), and notifications. Use when setting up destination exports for segments, configuring journey activation steps, or setting up schedules and column mappings. Always run `tdx connection list` and `tdx connection schema` first.
---

# tdx Activation - CDP Activation Configuration

## Discovery Commands (MUST run first)

```bash
tdx connection list                    # List available connections (name + type)
tdx connection show "Connection Name"  # Show connection details
tdx connection schema "Connection Name"  # Discover connector_config fields
tdx connection settings <type>         # Show connection-level credential fields
tdx connection types                   # List all connector types
```

**CRITICAL**: Always run `tdx connection list` before writing activations. Do NOT guess connection names or connector_config fields.

## Segment Activations

Activations are a **list** under `activations:` in segment YAML (vs. journey activations which use a **key map**).

```yaml
activations:
  - name: SFMC Contact Sync
    connection: salesforce-marketing       # Exact name from `tdx connection list`
    columns:
      - email
      - first_name
      - last_name
    schedule:
      type: daily                          # none | hourly | daily | weekly | monthly | cron
      timezone: America/Los_Angeles
    connector_config:                      # Fields from `tdx connection schema`
      de_name: ContactSync
      data_operation: upsert
    notification:
      notify_on: [onSuccess, onFailure]
      email_recipients: [team@company.com]
```

## Journey Activations

Activations are a **key map** (not a list). Steps reference keys via `with.activation`.

```yaml
activations:
  welcome-email:                           # Key — referenced in step's with.activation
    name: Welcome Email Campaign
    connection: My SFMC Connection
    all_columns: true
    run_after_journey_refresh: true         # Common for journeys
    connector_config:
      de_name: WelcomeEmails
      data_operation: upsert

  sms-reminder:
    name: SMS Reminder
    connection: Twilio SMS Connection
    all_columns: true
    run_after_journey_refresh: true
    connector_config:
      message_template: welcome_reminder
```

Journey steps reference activations by key:

```yaml
steps:
  send-welcome:
    type: activation
    with:
      activation: welcome-email            # Key from activations map
```

## Column Selection

```yaml
all_columns: true                # Export all columns
# OR specific columns:
columns:
  - email
  - first_name
  - name: ssn                    # With visibility control
    visibility: masked           # clear | masked
```

## Schedule Options

Use **either** `schedule` or `run_after_journey_refresh` (mutually exclusive).

```yaml
schedule:
  type: daily                    # none | hourly | daily | weekly | monthly | cron
  timezone: America/Los_Angeles  # none = manual trigger only
  # Advanced (optional):
  repeat_unit: week              # minute | hour | day | week | month | once | none
  repeat_frequency: 2            # Every 2 weeks
  repeat_sub_frequency: [1, 3]   # Monday and Wednesday (0=Sun, 1=Mon, ...)
  start_at: "2025-04-01T09:00:00Z"
  end_on: "2025-12-31"

# Journey alternative (instead of schedule):
run_after_journey_refresh: true
```

## Notifications

```yaml
notification:
  notify_on: [onSuccess, onFailure]    # onSuccess | onFailure
  email_recipients: [team@company.com]
```

## Behavior Data Export

Join event/history from **behavior tables** alongside audience columns. Use the plural `behaviors:` list — each entry is its own mini-export (pick a table, how many rows per customer, which columns). Up to **4** behavior tables per activation.

```yaml
behaviors:                         # Up to 4 entries
  - behavior_table: purchase_history
    join_strategy: Top-N           # All | First | Last | Top-N
    join_row: 10                   # Row limit for Top-N (defaults to 1 for First/Last; unset for All)
    formatting: rows               # rows | cols
    order_by:
      - key: timestamp
        order: descending          # ascending | descending — applied before the join
    columns:                       # Plain strings, or `- name: col` with `visibility: masked`
      - product_name
      - order_total
  - behavior_table: page_views     # Combine multiple tables in one export
    join_strategy: Top-N
    join_row: 5
    columns:
      - url
      - timestamp
```

**Prefer `behaviors:` (plural).** The singular `behavior:` (a single object, no list) is deprecated backward-compat and will be removed — emit `behaviors:` for new configs. Setting both `behavior` and `behaviors` is an error.

## Common Issues

| Issue | Solution |
|-------|----------|
| Connection name wrong | `tdx connection list` to verify exact name |
| connector_config fields unknown | `tdx connection schema "Connection Name"` |
| Activation not running | Check schedule type and parent segment refresh status |

## Related Skills

- **connector-config** - `connector_config` fields per connector type (SFMC, S3, BigQuery, etc.)
- **segment** - Segment rule syntax
- **journey** - Journey structure and activation steps
