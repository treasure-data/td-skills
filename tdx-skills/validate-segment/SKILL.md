---
name: validate-segment
description: Validates CDP segment YAML configurations against the TD CDP API specification. Use when reviewing segment rules for correctness, checking operator types and values, or troubleshooting segment configuration errors before pushing to Treasure Data.
---

# Segment YAML Validation

```bash
tdx sg validate                           # Validate all YAML files locally
tdx sg validate path/to/segment.yml       # Validate specific file
tdx sg push --dry-run                     # Preview changes before push
```

## Required Structure

```yaml
name: string
kind: batch                    # batch | realtime | funnel_stage
rule:
  type: And                    # And | Or
  conditions:
    - type: Value
      attribute: field_name
      operator:
        type: OperatorType
        value: ...
```

## Operators Quick Reference

| Type | Value | Notes |
|------|-------|-------|
| `Equal`, `NotEqual` | single value | |
| `Greater`, `GreaterEqual`, `Less`, `LessEqual` | number | |
| `In`, `NotIn` | array | `["US", "CA"]` |
| `Contain`, `StartWith`, `EndWith` | array | `["@gmail.com"]` |
| `Regexp` | string | regex pattern |
| `IsNull` | (none) | |
| `TimeWithinPast`, `TimeWithinNext` | number + unit | `value: 30, unit: day` |
| `include`, `exclude` | segment name | reuse existing segment |

## Time Units (Singular Form Only)

```
year | quarter | month | week | day | hour | minute | second
```

**Common mistake**: `days` → `day`, `months` → `month`

## Behavior Aggregation Structure

Behavior conditions require a nested `filter` block with `type: Column` conditions. Without this structure, the server ignores `source` and queries the master table instead.

```yaml
# Behavior condition — correct structure
- type: Value
  attribute: ""                            # "" for Count; column name for Sum/Avg/Min/Max
  operator:
    type: GreaterEqual
    value: 1
  aggregation:
    type: Count                            # Count | Sum | Avg | Min | Max
  source: behavior_customer_activity       # Actual table name (behavior_<source>)
  filter:
    type: And
    conditions:
      - type: Column                       # Column, not Value
        column: total_price                # Behavior table column
        operator:
          type: Greater
          value: 10
```

**Required fields**: `aggregation.type`, `source`, and `filter` must all be present

**`source` naming**: Must be the actual table name in the `cdp_audience_<id>` database (`behavior_<source_table>`), not the display name shown by `tdx sg fields`

### Condition Types

| Type | Context |
|------|---------|
| `type: Value` | Top-level conditions on master table attributes |
| `type: Column` | Inside `filter.conditions` for behavior table columns |
| `type: include` / `type: exclude` | Reference another segment |

## Related Skills

- **segment** - Full segment management
