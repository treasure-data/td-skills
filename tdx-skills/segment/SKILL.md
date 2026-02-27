---
name: segment
description: Manages CDP child segments using `tdx sg` commands with YAML rule configs. Covers filtering with operators (Equal, In, Greater, TimeWithinPast, Contain), folder organization, and activations for Salesforce/Google Ads exports. Use when creating audience segments, validating with `tdx sg push --dry-run`, or listing fields with `tdx sg fields`.
---

# tdx Segment - CDP Child Segment Management

## Core Commands

```bash
tdx sg use "Customer 360"             # Set parent segment context
tdx sg pull "Customer 360"            # Pull to YAML (creates segments/customer-360/*.yml)
tdx sg push --dry-run                 # Preview changes
tdx sg push                           # Push to TD
tdx sg push --delete                  # Delete segments not in local files

tdx sg list                           # List segments
tdx sg list -r                        # Recursive tree view
tdx sg fields                         # List available fields
tdx sg show "Segment Name"            # Preview segment data
tdx sg sql "Segment Name" | tdx query -  # Pipe segment SQL to query
```

## YAML Configuration

```yaml
name: High Value US Customers
kind: batch  # batch | realtime | funnel_stage

rule:
  type: And  # And | Or
  conditions:
    - type: Value
      attribute: country
      operator:
        type: In
        value: ["US", "CA"]
    - type: Value
      attribute: ltv
      operator:
        type: Greater
        value: 1000
    - type: Value
      attribute: last_purchase_date
      operator:
        type: TimeWithinPast
        value: 30
        unit: day  # year | quarter | month | week | day | hour | minute | second
```

## Activations

```yaml
activations:
  - name: SFMC Contact Sync
    connection: salesforce-marketing    # From tdx connection list
    columns:
      - email
      - first_name
    schedule:
      type: daily                       # none | daily | hourly
      timezone: America/Los_Angeles
    connector_config:                   # Use `tdx connection schema <type>` for fields
      de_name: ContactSync
      shared_data_extension: false
      data_operation: upsert
    notification:
      notify_on: [onSuccess, onFailure]
      email_recipients: [team@company.com]
```

See **connector-config** skill for `connector_config` details.

## Operators

| Type | Example |
|------|---------|
| `Equal`, `NotEqual` | `value: "active"` |
| `Greater`, `GreaterEqual`, `Less`, `LessEqual` | `value: 1000` |
| `In`, `NotIn` | `value: ["US", "CA"]` |
| `Contain`, `StartWith`, `EndWith` | `value: ["@gmail.com"]` |
| `Regexp` | `value: "^[A-Z]{2}[0-9]{4}$"` |
| `IsNull` | (no value) |
| `TimeWithinPast` | `value: 30, unit: day` |

## Behavior Conditions (Aggregations)

Query behavior data from parent segment with aggregations. Behavior conditions require a nested `filter` block with `type: Column` conditions — without this structure, the server ignores the `source` field and queries the master table instead.

**Important**: The `source` value must be the actual table name in the `cdp_audience_<id>` database, which follows the `behavior_<source_table>` naming convention. Use `tdx db tables <cdp_audience_db>` to find exact table names. Note that `tdx sg fields` shows behavior display names (e.g., `pet_Activity`), but `source` requires the actual table name (e.g., `behavior_customer_activity`).

```yaml
rule:
  type: And
  conditions:
    # Count behavior occurrences (e.g., customers with at least 1 event)
    - type: Value
      attribute: ""                          # Empty for behavior conditions
      operator:
        type: GreaterEqual
        value: 1
      aggregation:
        type: Count                          # Count | Sum | Avg | Min | Max
      source: behavior_customer_activity     # Actual table name (behavior_<source>)
      filter:
        type: And
        conditions:
          - type: Column
            column: event_type
            operator:
              type: Equal
              value: "add_to_cart"

    # Sum a behavior column (e.g., total spend > 500)
    - type: Value
      attribute: order_total                 # Column to aggregate (for Sum/Avg/Min/Max)
      operator:
        type: Greater
        value: 500
      aggregation:
        type: Sum
      source: behavior_purchase_history
      filter:
        type: And
        conditions:
          - type: Column
            column: purchase_date
            operator:
              type: TimeWithinPast
              value: 90
              unit: day

    # Multiple filter conditions on behavior
    - type: Value
      attribute: ""
      operator:
        type: GreaterEqual
        value: 1
      aggregation:
        type: Count
      source: behavior_purchase_history
      filter:
        type: And
        conditions:
          - type: Column
            column: order_total
            operator:
              type: Greater
              value: 100
          - type: Column
            column: purchase_date
            operator:
              type: TimeWithinPast
              value: 30
              unit: day
```

**Aggregation types**: `Count`, `Sum`, `Avg`, `Min`, `Max`

### Behavior Condition Structure

| Field | Description |
|-------|-------------|
| `attribute` | `""` for Count; column name for Sum/Avg/Min/Max |
| `aggregation.type` | Aggregation function (`Count`, `Sum`, etc.) |
| `source` | Actual table name: `behavior_<source_table>` |
| `filter.conditions` | Array of `type: Column` conditions on behavior fields |

### Condition Types

| Type | Usage |
|------|-------|
| `type: Value` | Filter on master table attributes (default) |
| `type: Column` | Filter on behavior table columns (inside `filter` block) |
| `type: include` / `type: exclude` | Reference another segment |

## Segment References (Include/Exclude)

Reuse conditions from existing segments:

```yaml
rule:
  type: And
  conditions:
    - type: include              # Include members of another segment
      segment: high-value-users
    - type: exclude              # Exclude members of another segment
      segment: churned-users
```

**Time units**: `year`, `quarter`, `month`, `week`, `day`, `hour`, `minute`, `second` (singular form only)

## Folder Structure

```
segments/customer-360/
├── active-users.yml
├── marketing/
│   └── email-subscribers.yml
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Context not set | `tdx sg use "Customer 360"` |
| Field not available | `tdx sg fields` or run parent workflow |
| Activation not working | `tdx connection list` to verify connection |

## Related Skills

- **connector-config** - Configure connector_config for activations
- **validate-segment** - Validate segment YAML syntax
- **parent-segment** - Manage parent segments

## Resources

- https://tdx.treasuredata.com/commands/segment.html
