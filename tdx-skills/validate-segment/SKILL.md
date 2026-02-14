---
name: validate-segment
description: Validation reference for CDP segment YAML. Lists all 18 operator types, required fields, and error codes. Use alongside the **segment** skill when troubleshooting validation errors from `tdx sg validate` or `tdx sg push --dry-run`, checking operator syntax, or verifying behavior condition structure.
---

# Segment YAML Validation

```bash
tdx sg validate                           # Validate all YAML files locally
tdx sg validate path/to/segment.yml       # Validate specific file
tdx sg push --dry-run                     # Preview changes before push
```

## Required Structure

```yaml
name: string                       # Required (MISSING_NAME)
kind: batch                        # batch | realtime | funnel_stage
rule:
  type: And                        # And | Or (INVALID_RULE_TYPE)
  conditions:                      # Required array (MISSING_CONDITIONS)
    - type: Value
      attribute: field_name        # Required non-empty (EMPTY_ATTRIBUTE)
      operator:
        type: OperatorType
        value: ...
```

## Condition Types

| Type | Required Fields | Error Codes |
|------|----------------|-------------|
| `Value` | `attribute`, `operator` | `EMPTY_ATTRIBUTE`, `INVALID_OPERATOR_TYPE` |
| `Behavior` | `attribute`, `operator`, `source`, `aggregation` | `EMPTY_ATTRIBUTE` (allowed empty with aggregation) |
| `include` / `exclude` | `segment` | `MISSING_SEGMENT_REFERENCE` |
| `And` / `Or` | `conditions` | `MISSING_CONDITIONS`, `INVALID_RULE_TYPE` |

## Operators

**18 valid types** — any other value triggers `INVALID_OPERATOR_TYPE`:

| Category | Types | Required | Error |
|----------|-------|----------|-------|
| Comparison | `Equal`, `NotEqual`, `Greater`, `GreaterEqual`, `Less`, `LessEqual` | `value` | `MISSING_OPERATOR_VALUE` |
| Range | `Between` | `min` and/or `max` | `MISSING_BETWEEN_BOUNDS` |
| Set | `In`, `NotIn` | `value` (array) | `MISSING_OPERATOR_VALUE` |
| Text | `Contain`, `StartWith`, `EndWith` | `value` (string array) | `MISSING_OPERATOR_VALUE` |
| Pattern | `Regexp` | `value` (string) | `MISSING_OPERATOR_VALUE` |
| Null | `IsNull` | (none) | — |
| Time | `TimeWithinPast`, `TimeWithinNext` | `value` + `unit` | `MISSING_OPERATOR_VALUE`, `MISSING_TIME_UNIT` |
| Time | `TimeRange`, `TimeToday` | (special) | — |

### Time Units (Singular Form Only)

```
year | quarter | month | week | day | hour | minute | second
```

**Common mistake**: `days` → `day`, `months` → `month`

### Operator Negation

Any operator supports `not: true` for negation. This is separate from `NotEqual`/`NotIn` which are standalone types.

## Behavior Conditions

```yaml
- type: Behavior
  attribute: purchase_event        # Can be empty ("") for pure count
  source: behavior_purchase_history
  aggregation:
    type: Count                    # Count | Sum | Average | Min | Max
  operator:
    type: GreaterEqual
    value: 1
  timeWindow:                      # Optional
    duration: 30
    unit: day
  filter:                          # Optional (same rules as top-level rule)
    type: And
    conditions:
      - type: Value
        attribute: timestamp
        operator: { type: TimeWithinPast, value: 90, unit: day }
```

## Array Matching

Optional field on Value/Behavior conditions:

```yaml
arrayMatching: any                 # any | all | { atLeast: N } | { atMost: N } | { exactly: N }
```

Invalid keys trigger `INVALID_ARRAY_MATCHING`.

## Error Code Reference

| Code | Cause |
|------|-------|
| `MISSING_NAME` | Segment name is empty or missing |
| `INVALID_RULE_TYPE` | Rule type is not `And` or `Or` |
| `MISSING_CONDITIONS` | Rule or group has no `conditions` array |
| `EMPTY_ATTRIBUTE` | Attribute is empty (unless behavior count pattern) |
| `INVALID_OPERATOR_TYPE` | Operator type not in the 18 valid types |
| `MISSING_OPERATOR_VALUE` | Operator requires `value` but it is missing |
| `MISSING_BETWEEN_BOUNDS` | `Between` has neither `min` nor `max` |
| `MISSING_TIME_UNIT` | `TimeWithinPast`/`TimeWithinNext` missing `unit` |
| `INVALID_ARRAY_MATCHING` | `arrayMatching` has invalid format |
| `MISSING_SEGMENT_REFERENCE` | `include`/`exclude` missing `segment` field |

## Related Skills

- **segment** - Full segment rule syntax and examples
