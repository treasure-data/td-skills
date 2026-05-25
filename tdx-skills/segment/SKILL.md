---
name: segment
description: Manages CDP child segments using `tdx sg` commands with YAML rule configs. Covers Value/Behavior condition types, all operators (Equal, In, Between, TimeWithinPast, etc.), behavior aggregations with filters, and nested condition group restrictions. Use when creating audience segments with filtering rules, configuring behavior-based conditions, managing segment hierarchies, or exploring available fields with `tdx sg fields`. Generated YAML is designed to be Console-compatible — no validation errors when opened in the segment editor after push.
---

# tdx Segment - CDP Child Segment Management

## Segment Creation Workflow

**Process one segment at a time.** For each segment:

1. **Create** the YAML file
2. **Validate** with `tdx sg validate <file>`
3. **Count check** — run `tdx sg sql --path <file> | tdx query -` and verify count > 0
   - If count is 0, the rule is too restrictive — revise before proceeding
4. **Preview** with `preview_segment` tool — get user approval before proceeding
5. **Push** with `tdx sg push -y "<file>"` — always specify the file path explicitly

Never batch multiple segments in validate or push operations.

After push succeeds, display the Console link:
```
https://console.treasuredata.com/app/audiences/<parent_id>/segments/<segment_id>
```

## Core Commands

```bash
tdx sg use "Customer 360"             # Set parent segment context
tdx sg pull "Customer 360"            # Pull to YAML (creates segments/customer-360/*.yml)
tdx sg validate <file>                # Validate specific file locally
tdx sg push --dry-run "<file>"        # Server-side validation (quote paths with special chars)
tdx sg push -y "<file>"               # Push specific file (-y for non-interactive)

tdx sg list                           # List segments
tdx sg list -r                        # Recursive tree view
tdx sg fields                         # List available fields
tdx sg show "Segment Name"            # Preview segment data
tdx sg sql "Segment Name" | tdx query -  # Pipe segment SQL to query
tdx sg sql --path <file>              # Get SQL from local YAML (requires tdx.json)
```

**Note**: `--path` requires a project directory created by `tdx sg pull`. The file must be inside a folder with `tdx.json`.

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

Five condition types can be used inside `conditions:`:

| Type | Purpose |
|------|---------|
| `Value` | Filter by attribute column (also used for behavior with `source`) |
| `include` / `exclude` | Reference another segment |
| `And` / `Or` | Condition group (nesting not supported — see below) |

## Operators

| Category | Types | Required Fields | Example |
|----------|-------|----------------|---------|
| Comparison | `Equal`, `NotEqual`, `Greater`, `GreaterEqual`, `Less`, `LessEqual` | `value` (string/number) | `type: Equal, value: "active"` |
| Range | `Between` | `min` and/or `max` | `min: 18, max: 65` |
| Set | `In`, `NotIn` | `value` (array) | `value: ["US", "CA"]` |
| Text | `Contain`, `StartWith`, `EndWith` | `value` (string array) | `value: ["@gmail.com"]` |
| Pattern | `Regexp` | `value` (string — single regex pattern, **not** an array) | `value: "^(premium\|gold)"` |
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

Query behavior table data with aggregations. Use `type: Value` with `source` and `aggregation` fields.

```yaml
# Sum order_total for Electronics purchases in last 90 days
- type: Value
  attribute: ""                      # Empty string for behavior aggregations
  source: behavior_purchase_history  # behavior_<table_name> (prefix required)
  aggregation:
    type: Sum                        # Count | CountDistinct | Sum | Average | Min | Max
    column: order_total              # Required for all types except Count; required for CountDistinct too
  operator:
    type: Greater
    not: false
    value: 500
  timeWindow:                        # Optional: restrict to recent window
    duration: 90
    unit: day
  filter:                            # Required when using source
    type: And
    conditions:
      - type: Column                 # Use Column (not Value) inside filter
        column: category             # Use column (not attribute) field — required even for IsNull
        operator:
          type: Equal
          not: false
          value: "Electronics"
```

**Important**: Inside `filter.conditions`, use `type: Column` with `column` field (not `type: Value` with `attribute`).

## Segment References (Include/Exclude)

Reference segments that already exist on the server by their exact name.

```yaml
rule:
  type: And
  conditions:
    - type: include
      segment: "Existing Segment Name"  # Must match name exactly as shown in TD Console
    - type: exclude
      segment: "Churned Users"
```

**Limitation**: Cannot reference unpushed local segments. The segment must already exist on the server.

## Nested Condition Groups

**Not supported.** Console UI silently ignores nested Or/And groups, causing local/server discrepancy. `tdx sg validate` rejects all nested condition groups with `NESTED_CONDITION_GROUP` error.

### Workaround: Use `In` operator instead of nested Or

When you need "value A OR value B" on the **same attribute**, use the `In` operator:

```yaml
# Instead of nested Or (rejected by validator):
- type: Or
  conditions:
    - type: Value
      attribute: activities
      operator: { type: Equal, value: "Intermediate" }
    - type: Value
      attribute: activities
      operator: { type: Equal, value: "Advanced" }

# Use In operator (works correctly):
- type: Value
  attribute: activities
  operator:
    type: In
    value: ["Intermediate", "Advanced"]
```

### Limitation

Or conditions across **different attributes** cannot be expressed without nested Or:
```yaml
# This CANNOT be expressed without nested Or:
# (country = "US") OR (age > 30)
```

For such cases, consider creating separate segments and using `include` references, or restructuring the business logic.

## Console Compatibility Constraints

`tdx sg validate` catches CLI-level errors, but some conditions pass the CLI validator and are
accepted by the API, yet cause validation errors when the segment is **opened in the Console
segment editor**. Always apply these constraints so the generated YAML is editable in the Console
after push.

### No nested condition groups

`And`/`Or` groups cannot contain another `And`/`Or` as a child — only `Value`, `include`, and
`exclude` are allowed inside a group. (Covered by `NESTED_CONDITION_GROUP` above, but this also
applies inside behavior `filter` blocks.)

### Behavior filter conditions must be flat

Inside a behavior `filter`, all conditions must be flat `Column` conditions — no sub-`And`/`Or`
groups.

```yaml
# WRONG — nested group inside filter (API accepts, Console rejects)
filter:
  type: And
  conditions:
    - type: And
      conditions: [...]

# RIGHT — flat list only
filter:
  type: And
  conditions:
    - type: Column
      column: category
      operator: { type: Equal, value: "Electronics" }
    - type: Column
      column: status
      operator: { type: Equal, value: "completed" }
```

### `CountDistinct` requires `column`

```yaml
# WRONG
aggregation:
  type: CountDistinct

# RIGHT
aggregation:
  type: CountDistinct
  column: product_id
```

### `Regexp` value must be a single string, not an array

```yaml
# WRONG — array causes Console validation error
operator:
  type: Regexp
  value: ["^premium", "^gold"]

# RIGHT — combine into one regex
operator:
  type: Regexp
  value: "^(premium|gold)"
```

### `column` field is required in behavior filter conditions even for null checks

```yaml
# WRONG
- type: Column
  operator: { type: IsNull }

# RIGHT
- type: Column
  column: opted_out_at
  operator: { type: IsNull }
```

## Array Matching

Add `arrayMatching` to Value conditions: `any | all | { atLeast: N } | { atMost: N } | { exactly: N }`

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
| NESTED_CONDITION_GROUP | Use `In` operator or flatten; all nesting is rejected |
| Segment reference not found | Segment must exist on server; use exact name from Console |
| Non-interactive mode error | Add `-y` flag: `tdx sg push -y "<file>"` |
| CLI validates / API accepts, but Console shows error | Check Console Compatibility Constraints section above |

## Related Skills

- **activation** - Configure activations (connections, schedule, columns)
- **connector-config** - `connector_config` fields per connector type
- **validate-segment** - Validate segment YAML syntax and error codes
- **parent-segment** - Manage parent segments

## Resources

- https://tdx.treasuredata.com/commands/segment.html
