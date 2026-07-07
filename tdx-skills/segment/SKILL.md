---
name: segment
description: Manages CDP child segments using `tdx sg` commands with YAML rule configs. Covers Value/Behavior condition types, all operators (Equal, In, Between, TimeWithinPast, etc.), behavior aggregations with filters, and nested condition group restrictions. Use when creating audience segments with filtering rules, configuring behavior-based conditions, managing segment hierarchies, or exploring available fields with `tdx sg fields`.
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

## Editing segments safely — read this first

All segment edits go through the typed `tdx sg` commands. **Never** edit a segment with raw `tdx api` HTTP calls.

- **Never `tdx api` PUT/PATCH a segment.** Raw writes skip validation and can erase a segment's rule. Use the typed command for the change you want: `tdx sg move` to change folder, `tdx sg push` to change rules/activations.
- **Never read-modify-write a segment.** Do not GET a segment and write the object back — rule fields can come back empty from list/`entities` reads, so writing it back **erases the rule**. Always use the dedicated command for the specific change.
- **To change only the folder, use `tdx sg move`** (below). It changes the folder and nothing else.

If a typed command seems not to exist for what you need, ask the user — do not fall back to raw `tdx api`.

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

tdx sg move <segment...> --folder <folder>  # Safely move segment(s) by ID or name to a folder (preserves rules)
```

**Note**: `--path` requires a project directory created by `tdx sg pull`. The file must be inside a folder with `tdx.json`.

## Moving segments between folders

To move one or more segments to a different folder, use `tdx sg move`. It changes **only** the folder — the segment's rule and activations are left untouched (it re-reads and verifies the rule survived).

```bash
tdx sg move 12345 --folder 67890              # by ID
tdx sg move 12345 12346 --folder 67890        # several at once
tdx sg move 12345 --folder 67890 --dry-run    # preview, makes no changes

# By name — needs a parent segment context:
tdx sg use "Customer 360"
tdx sg move "VIP Customers" --folder "Archive"                       # by name
tdx sg move "Marketing/VIP Customers" --folder "Marketing/Archive"   # nested path
```

- Segments and the target folder can be given by **numeric ID or by name/path** (names resolve within the current parent segment context).
- **Find a segment or folder by name with `tdx sg list '<text>' -r`** — it searches the whole tree for names that **contain** `<text>` (case-insensitive, **literal** by default — so `'VIP (US)'` matches that name as-is) and prints each match with its **full folder path + id**, ready to pass to `tdx sg move`. On several matches it lists them all — pass the intended path/id, don't assume the first. If it returns too many matches, narrow the text. (`tdx sg list -r` alone dumps the full tree. Add `--regex` to treat `<text>` as a regular expression for the rare case you need anchors/alternation.) Do not use the ids returned by `tdx sg create`.
- In `tdx sg move`, name matching is **case-insensitive**; an ambiguous name errors and lists the matches with their IDs so you can pass the ID instead.
- Names are **relative to the parent segment** — do not prefix the parent segment name.
- **A bare name in `sg move` only matches a segment at the parent's top level — it never searches inside folders.** If the segment is nested, or you are not sure where it lives, find it first with `tdx sg list '<name>' -r`, then move by the full folder path it prints (`Folder/Sub/Segment Name`). A bare name that isn't at the top level returns `segment not found` — read that as "it's inside a folder, go find the path", not "it doesn't exist".
- **Footgun:** the same name can exist both at the top level and inside a folder (names are unique only within a folder). A bare `sg move` name then silently resolves the **top-level** one. When a name may not be unique, use the full folder path so you move the intended segment.
- **The same name can appear in several different folders.** If `tdx sg list '<pattern>' -r` returns more than one match, do **not** pick one — show the user each with its full folder path and id, and ask which they mean. Only move once you have a single unambiguous path. Never move "the first one you found".

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

Query behavior table data with aggregations. Use `type: Value` with `source` and `aggregation` fields.

```yaml
# Sum order_total for Electronics purchases in last 90 days
- type: Value
  attribute: ""                      # Empty string for behavior aggregations
  source: behavior_purchase_history  # behavior_<table_name> (prefix required)
  aggregation:
    type: Sum                        # Count | Sum | Average | Min | Max
    column: order_total              # Required for Sum/Average/Min/Max (not Count)
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
        column: category             # Use column (not attribute) field
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

## Related Skills

- **activation** - Configure activations (connections, schedule, columns)
- **connector-config** - `connector_config` fields per connector type
- **validate-segment** - Validate segment YAML syntax and error codes
- **parent-segment** - Manage parent segments

## Resources

- https://tdx.treasuredata.com/commands/segment.html
