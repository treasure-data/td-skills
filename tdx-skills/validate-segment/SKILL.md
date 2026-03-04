---
name: validate-segment
description: Validation reference for CDP segment YAML. Lists all 18 operator types, required fields, and error codes. Use alongside the **segment** skill when troubleshooting validation errors from `tdx sg validate` or `tdx sg push --dry-run`, checking operator syntax, or verifying behavior condition structure.
---

# Segment YAML Validation

**Validate one segment at a time.** Always specify the file path explicitly:

```bash
tdx sg validate path/to/segment.yml       # Local validation (fast, catches syntax errors)
tdx sg push --dry-run "path/to/segment.yml"  # Server validation (catches schema/reference errors)
```

## Required Structure

```yaml
name: string                       # Required (MISSING_NAME)
kind: batch                        # batch | realtime | funnel_stage
rule:
  type: And                        # And | Or (INVALID_RULE_TYPE)
  conditions:                      # Required array (MISSING_CONDITIONS)
    - type: Value
      attribute: field_name        # Required non-empty for Value (EMPTY_ATTRIBUTE)
      operator:
        type: OperatorType
        not: false                 # Optional negation
        value: ...
```

## Condition Types

| Type | Required Fields | Error Codes |
|------|----------------|-------------|
| `Value` | `attribute`, `operator` | `EMPTY_ATTRIBUTE`, `INVALID_OPERATOR_TYPE` |
| `Value` (with behavior) | `attribute: ""`, `operator`, `source`, `aggregation`, `filter` | Server-side validation |
| `include` / `exclude` | `segment` | `MISSING_SEGMENT_REFERENCE` |
| `And` / `Or` | `conditions` | `MISSING_CONDITIONS`, `NESTED_CONDITION_GROUP` |

**Note**: For behavior queries, use `type: Value` with `source`, `aggregation`, and `filter` fields. The `type: Behavior` may pass local validation but fail server-side.

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

Use `type: Value` with `source`, `aggregation`, and `filter`. Inside `filter`, use `type: Column` with `column` field (not `type: Value` with `attribute`). See **segment** skill for full examples.

## Nested Condition Groups

**Not supported.** Console UI silently ignores nested Or/And groups, causing local/server discrepancy. All nesting triggers `NESTED_CONDITION_GROUP` error. Use `In` operator instead. See **segment** skill for details and workarounds.

## Array Matching

Optional field on Value conditions:

```yaml
arrayMatching: any                 # any | all | { atLeast: N } | { atMost: N } | { exactly: N }
```

Invalid keys trigger `INVALID_ARRAY_MATCHING`.

## Error Code Reference

| Code | Cause | Solution |
|------|-------|----------|
| `MISSING_NAME` | Segment name is empty or missing | Add `name:` field |
| `INVALID_RULE_TYPE` | Rule type is not `And` or `Or` | Check `type:` spelling |
| `MISSING_CONDITIONS` | Rule or group has no `conditions` array | Add conditions array |
| `EMPTY_ATTRIBUTE` | Attribute is empty | Provide attribute name (or `""` for behavior) |
| `INVALID_OPERATOR_TYPE` | Operator type not in the 18 valid types | Check operator spelling |
| `MISSING_OPERATOR_VALUE` | Operator requires `value` but it is missing | Add `value:` field |
| `MISSING_BETWEEN_BOUNDS` | `Between` has neither `min` nor `max` | Add `min:` and/or `max:` |
| `MISSING_TIME_UNIT` | Time operator missing `unit` | Add `unit: day` (singular) |
| `INVALID_ARRAY_MATCHING` | `arrayMatching` has invalid format | Use `any`, `all`, or object form |
| `MISSING_SEGMENT_REFERENCE` | `include`/`exclude` missing `segment` field | Add `segment:` with exact name |
| `NESTED_CONDITION_GROUP` | Any nested Or/And condition group | Use `In` operator or flatten |
| `SEGMENT_SCHEMA_ERROR` | Server rejected the schema | Check field names (`column` vs `attribute` in filter) |

## Local vs Server Validation

| Check | `tdx sg validate` | `tdx sg push --dry-run` |
|-------|-------------------|-------------------------|
| YAML syntax | Yes | Yes |
| Operator types | Yes | Yes |
| Required fields | Yes | Yes |
| Nested groups limit | Yes | Yes |
| Segment references | No | Yes |
| Behavior schema | Partial | Yes |
| Field availability | No | Yes |

Always run both validations before pushing.

## Related Skills

- **segment** - Full segment rule syntax and workflow
