---
name: validate-segment
description: Validates CDP segment YAML configurations against the TD CDP API specification. Use when reviewing segment rules for correctness, checking operator types and values, or troubleshooting segment configuration errors before pushing to Treasure Data.
---

# Segment YAML Validation

Validate CDP segment YAML configurations against the [TD CDP API specification](https://api-docs.treasuredata.com/apis/td_cdp_api-public/segments).

## Validation Checklist

When reviewing segment YAML files, verify the following:

### 1. Required Fields

```yaml
name: string          # Required: segment name
kind: batch|realtime|funnel_stage  # Required: segment type
rule:                 # Required: filtering rules
  type: And|Or
  conditions: []
```

### 2. Rule Structure

Each condition must have:
- `type`: `Value` (for attribute-based filtering)
- `attribute`: field name from parent segment
- `operator`: operator configuration

### 3. Valid Operator Types

**Comparison Operators**:
| Type | Required Fields | Value Type |
|------|-----------------|------------|
| `Equal` | `value` | string, number, boolean |
| `NotEqual` | `value` | string, number, boolean |
| `Greater` | `value` | number |
| `GreaterEqual` | `value` | number |
| `Less` | `value` | number |
| `LessEqual` | `value` | number |

**List Operators**:
| Type | Required Fields | Value Type |
|------|-----------------|------------|
| `In` | `value` | array of strings/numbers |
| `NotIn` | `value` | array of strings/numbers |

**String Operators**:
| Type | Required Fields | Value Type |
|------|-----------------|------------|
| `Contain` | `value` | array of strings |
| `StartWith` | `value` | array of strings |
| `EndWith` | `value` | array of strings |
| `Regexp` | `value` | regex pattern string |

**Null Operators**:
| Type | Required Fields |
|------|-----------------|
| `IsNull` | (none) |

**Time Operators**:
| Type | Required Fields | Notes |
|------|-----------------|-------|
| `TimeWithinPast` | `value`, `unit` | value is numeric, unit from enum |
| `TimeWithinNext` | `value`, `unit` | value is numeric, unit from enum |
| `TimeRange` | `from`, `to` | complex time range |
| `TimeToday` | (none) | matches today |
| `TimeThis` | `from.unit` | current period |
| `TimeNext` | `from.unit` | next period |

### 4. Valid Time Units

Per the CDP API spec, `unit` must be one of:
```
year | quarter | month | week | day | hour | minute | second
```

**Common mistakes**:
- `days` (invalid) → `day` (valid)
- `months` (invalid) → `month` (valid)
- `hours` (invalid) → `hour` (valid)

### 5. Activation Schedule Units

For activation `repeatUnit`, valid values are:
```
none | minute | hour | day | week | month | once
```

## Validation Examples

### Valid Segment

```yaml
name: Recent High-Value Customers
kind: batch
visible: true

rule:
  type: And
  conditions:
    - type: Value
      attribute: country
      operator:
        type: In
        value: ["US", "CA"]  # Correct: 'value' with array for In operator
    - type: Value
      attribute: ltv
      operator:
        type: Greater
        value: 1000  # Correct: 'value' for comparison operator
    - type: Value
      attribute: last_purchase_date
      operator:
        type: TimeWithinPast
        value: 30
        unit: day  # Correct: singular 'day', not 'days'
```

### Common Validation Errors

**Error: Wrong unit format**
```yaml
# INVALID
operator:
  type: TimeWithinPast
  value: 30
  unit: days  # Wrong: plural form

# VALID
operator:
  type: TimeWithinPast
  value: 30
  unit: day  # Correct: singular form
```

**Error: Array value for comparison operator**
```yaml
# INVALID
operator:
  type: Equal
  value: ["US", "CA"]  # Wrong: Equal expects single value, use In for arrays

# VALID
operator:
  type: In
  value: ["US", "CA"]  # Correct: In operator for multiple values
```

**Error: Missing required fields**
```yaml
# INVALID - missing 'unit'
operator:
  type: TimeWithinPast
  value: 30

# VALID
operator:
  type: TimeWithinPast
  value: 30
  unit: day
```

## Validation Workflow

```bash
# 1. Pull existing segments
tdx sg pull "Parent Segment Name"

# 2. Edit or create segment YAML
vim segments/parent-segment/my-segment.yml

# 3. Validate with dry-run before pushing
tdx sg push --dry-run

# 4. Check for API errors in output
# Common errors indicate validation failures

# 5. Push if validation passes
tdx sg push
```

## Quick Reference Card

| Check | Rule |
|-------|------|
| Time units | Must be singular: `day`, `month`, `year` (not `days`, `months`, `years`) |
| All operators | Use unified `value` field (CLI auto-detects single vs array) |
| List operators (In, NotIn, Contain, StartWith, EndWith) | Provide array in `value` field |
| Comparison operators (Equal, Greater, etc.) | Provide single value in `value` field |
| TimeWithinPast/TimeWithinNext | Requires both `value` and `unit` |
| Segment kind | Must be `batch`, `realtime`, or `funnel_stage` |
| Rule type | Must be `And` or `Or` |

## Related Skills

- **tdx-skills/segment** - Full segment management with tdx CLI
- **tdx-skills/parent-segment** - Parent segment configuration
