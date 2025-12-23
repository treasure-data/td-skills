---
name: validate-segment
description: Validates CDP segment YAML configurations against the TD CDP API specification. Use when reviewing segment rules for correctness, checking operator types and values, or troubleshooting segment configuration errors before pushing to Treasure Data.
---

# Segment YAML Validation

Validate with `tdx sg push --dry-run` before pushing.

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

## Common Errors

```yaml
# WRONG: plural unit
unit: days
# CORRECT
unit: day

# WRONG: array for Equal
type: Equal
value: ["US", "CA"]
# CORRECT: use In for arrays
type: In
value: ["US", "CA"]

# WRONG: missing unit
type: TimeWithinPast
value: 30
# CORRECT
type: TimeWithinPast
value: 30
unit: day
```

## Related Skills

- **segment** - Full segment management
