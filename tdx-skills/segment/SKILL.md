---
name: segment
description: Manages CDP child segments using `tdx sg` commands with YAML rule configs. Covers Value/Behavior condition types, all operators (Equal, In, Between, TimeWithinPast, etc.), behavior aggregations with filters, and nested condition groups. Use when creating audience segments with filtering rules, configuring behavior-based conditions, managing segment hierarchies, or exploring available fields with `tdx sg fields`.
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
        unit: day
```

## Condition Types

Four condition types can be used inside `conditions:`:

| Type | Purpose |
|------|---------|
| `Value` | Filter by attribute column |
| `Behavior` | Aggregate behavior table data |
| `include` / `exclude` | Reference another segment |
| `And` / `Or` | Nested condition group |

## Operators

| Category | Types | Required Fields | Example |
|----------|-------|----------------|---------|
| Comparison | `Equal`, `NotEqual`, `Greater`, `GreaterEqual`, `Less`, `LessEqual` | `value` (string/number) | `type: Equal, value: "active"` |
| Range | `Between` | `min` and/or `max` | `min: 18, max: 65` |
| Set | `In`, `NotIn` | `value` (array) | `value: ["US", "CA"]` |
| Text | `Contain`, `StartWith`, `EndWith` | `value` (string array) | `value: ["@gmail.com"]` |
| Pattern | `Regexp` | `value` (string) | `value: "^[A-Z]{2}[0-9]{4}$"` |
| Null | `IsNull` | (none) | `type: IsNull` (use `not: true` for "is not null") |
| Time | `TimeWithinPast`, `TimeWithinNext` | `value` + `unit` | `value: 30, unit: day` (Past=recency, Next=future window) |
| Time | `TimeRange` | `duration` + `from` | See example below |
| Time | `TimeToday` | (none) | Matches today's date only |

**Negation**: Any operator supports `not: true` (e.g., `type: Contain, value: ["test"], not: true`)

**Units**: `year | quarter | month | week | day | hour | minute | second` (singular only)

### TimeRange Example

"7-day window starting from 1 month ago":

```yaml
operator:
  type: TimeRange
  duration:
    day: 7                       # Window length
  from:
    last: 1                      # Starting point offset
    unit: month
```

## Behavior Conditions

Query behavior table data with aggregations. Use `type: Behavior` (not `Value`). `attribute` can be empty (`""`) for pure Count aggregation.

```yaml
# Sum order_total for Electronics purchases in last 90 days
- type: Behavior
  attribute: order_total             # Use "" for pure count (no specific column)
  source: behavior_purchase_history  # behavior_<table_name> (prefix required)
  aggregation:
    type: Sum                        # Count | Sum | Average | Min | Max
    column: order_total              # Required for Sum/Average/Min/Max (not Count)
  operator:
    type: Greater
    value: 500
  timeWindow:                        # Optional: restrict to recent window
    duration: 90
    unit: day
  filter:                            # Optional: filter rows before aggregation
    type: And
    conditions:
      - type: Value
        attribute: category
        operator:
          type: Equal
          value: "Electronics"
```

`filter` supports the same operators as top-level Value conditions.

## Segment References (Include/Exclude)

```yaml
rule:
  type: And
  conditions:
    - type: include              # Include members of another segment
      segment: high-value-users
    - type: exclude              # Exclude members of another segment
      segment: churned-users
    - type: include
      segment: "Existing Segment Name" # Use the segment name as it appears in TD
```

## Nested Condition Groups

Combine And/Or logic with nesting:

```yaml
rule:
  type: And
  conditions:
    - type: Or
      conditions:
        - type: Value
          attribute: country
          operator: { type: Equal, value: "US" }
        - type: Value
          attribute: country
          operator: { type: Equal, value: "CA" }
    - type: Value
      attribute: ltv
      operator: { type: Greater, value: 1000 }
```

## Array Matching

Add `arrayMatching` to Value/Behavior conditions: `any | all | { atLeast: N } | { atMost: N } | { exactly: N }`

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
| Between missing bounds | At least one of `min` or `max` required |
| Behavior source unknown | Check parent segment behavior table names |

## Related Skills

- **activation** - Configure activations (connections, schedule, columns)
- **connector-config** - `connector_config` fields per connector type
- **validate-segment** - Validate segment YAML syntax
- **parent-segment** - Manage parent segments

## Resources

- https://tdx.treasuredata.com/commands/segment.html
