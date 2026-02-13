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

### Comparison

```yaml
operator:
  type: Equal              # Equal | NotEqual | Greater | GreaterEqual | Less | LessEqual
  value: "active"          # string or number
```

### Range

```yaml
operator:
  type: Between            # Between only
  min: 18                  # lower bound
  max: 65                  # upper bound
```

### Set

```yaml
operator:
  type: In                 # In | NotIn
  value: ["US", "CA"]     # array of strings or numbers
```

### Text Match

```yaml
operator:
  type: Contain            # Contain | StartWith | EndWith
  value: ["@gmail.com"]   # array of strings
```

### Pattern

```yaml
operator:
  type: Regexp
  value: "^[A-Z]{2}[0-9]{4}$"
```

### Null Check

```yaml
operator:
  type: IsNull             # no value needed
# Negate with not:
operator:
  type: IsNull
  not: true                # "is not null"
```

### Time

```yaml
operator:
  type: TimeWithinPast     # TimeWithinPast | TimeWithinNext
  value: 30
  unit: day                # year | quarter | month | week | day | hour | minute | second
```

### Time Range

```yaml
operator:
  type: TimeRange
  duration:
    day: 7
  from:
    last: 1
    unit: month
```

### Time Today

```yaml
operator:
  type: TimeToday          # Matches today's date only
```

### Operator Negation

Any operator can be negated with `not: true`:

```yaml
operator:
  type: Contain
  value: ["test"]
  not: true                # "does not contain"
```

## Behavior Conditions

Query behavior table data with aggregations. Use `type: Behavior` (not `Value`).

```yaml
# Count purchases in last 30 days
- type: Behavior
  attribute: purchase_event
  source: purchase_history          # Behavior table name from parent segment
  aggregation:
    type: Count
  operator:
    type: GreaterEqual
    value: 3
  timeWindow:
    duration: 30
    unit: day
```

### Aggregation Types

| Type | Required Fields | Description |
|------|----------------|-------------|
| `Count` | (none) | Count rows |
| `Sum` | `column: col_name` | Sum column values |
| `Average` | `column: col_name` | Average column values |
| `Min` | `column: col_name` | Minimum value |
| `Max` | `column: col_name` | Maximum value |

### timeWindow — Simple Time Filter

Restricts behavior data to a recent time window:

```yaml
- type: Behavior
  attribute: login_event
  source: login_history
  aggregation:
    type: Count
  operator:
    type: GreaterEqual
    value: 1
  timeWindow:                        # Only count within this window
    duration: 7
    unit: day                        # year | month | week | day | hour | minute | second
```

### filter — Advanced Behavior Filter

For filtering behavior rows by column values before aggregation:

```yaml
# Sum order_total where category is "Electronics", in last 90 days
- type: Behavior
  attribute: order_total
  source: purchase_history
  aggregation:
    type: Sum
    column: order_total
  operator:
    type: Greater
    value: 500
  filter:
    type: And
    conditions:
      - type: Value
        attribute: timestamp
        operator:
          type: TimeWithinPast
          value: 90
          unit: day
      - type: Value
        attribute: category
        operator:
          type: Equal
          value: "Electronics"
```

Filter conditions support the same operators as top-level Value conditions. Common patterns:

```yaml
# Time filter on behavior rows
- type: Value
  attribute: timestamp
  operator:
    type: TimeWithinPast
    value: 30
    unit: day

# Value filter on behavior column
- type: Value
  attribute: brand
  operator:
    type: In
    value: ["Nike", "Adidas"]
```

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
    - type: Or                   # Nested group
      description: "US or Canada customers"
      conditions:
        - type: Value
          attribute: country
          operator:
            type: Equal
            value: "US"
        - type: Value
          attribute: country
          operator:
            type: Equal
            value: "CA"
    - type: Value                # Combined with And
      attribute: ltv
      operator:
        type: Greater
        value: 1000
```

## Array Matching

For attributes that contain arrays:

```yaml
- type: Value
  attribute: tags
  operator:
    type: Equal
    value: "vip"
  arrayMatching: any             # any | all | { atLeast: N } | { atMost: N } | { exactly: N }
```

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
| Between missing bounds | Both `min` and `max` required |
| Behavior source unknown | Check parent segment behavior table names |

## Related Skills

- **activation** - Configure activations (connections, schedule, columns)
- **connector-config** - `connector_config` fields per connector type
- **validate-segment** - Validate segment YAML syntax
- **parent-segment** - Manage parent segments

## Resources

- https://tdx.treasuredata.com/commands/segment.html
