---
name: validate-journey
description: Validates CDP journey YAML configurations against tdx schema requirements. Use when reviewing journey structure, checking step types and parameters, verifying segment references, or troubleshooting journey configuration errors before pushing to Treasure Data.
---

# Journey YAML Validation

Validate CDP journey YAML configurations against the tdx schema requirements.

## Validation Checklist

When reviewing journey YAML files, verify the following:

### 1. Required Top-Level Fields

```yaml
type: journey       # Required: must be exactly 'journey'
name: string        # Required: journey name
journeys:           # Required: array of journey versions
  - stages: []      # Required: at least one stage
```

### 2. Journey Version Structure

```yaml
journeys:
  - version: v1           # Optional: version identifier
    state: draft          # Optional: draft | launched
    latest: true          # Optional: marks active version (exactly one must be true)
    stages: []            # Required: array of stages
```

### 3. Stage Structure

Each stage must have:
- `name`: Stage name (required)
- `steps`: Array of steps (required for non-empty stages)

Optional stage fields:
- `description`: Stage description
- `entry_criteria`: Who enters this stage
- `exit_criteria`: When profiles exit
- `milestone`: Progress tracking point

### 4. Valid Step Types

| Step Type | Required `with` Parameters | Notes |
|-----------|---------------------------|-------|
| `wait` | `duration` + `unit` OR `condition` | Duration or conditional wait |
| `activation` | `activation` | Reference to activation name |
| `decision_point` | `branches` | Array of branch definitions |
| `ab_test` | `variants` | Array of variant definitions |
| `merge` | (none) | Only uses `next` field |
| `jump` | `target` | Journey/stage target |
| `end` | (none) | No `with` or `next` |

### 5. Wait Step Parameters

**Duration-based wait:**
```yaml
with:
  duration: 7      # Required: numeric value
  unit: day        # Required: day | week
```

**Conditional wait:**
```yaml
with:
  condition:
    segment: segment-name  # Required
    timeout:               # Optional
      duration: 14
      unit: day
```

**Valid wait units:** `day`, `week`

### 6. Decision Point Branches

```yaml
with:
  branches:
    - name: string      # Required
      segment: string   # Required: segment reference
      next: string      # Required: next step name
      excluded: false   # Optional: true for else/default branch
```

### 7. A/B Test Variants

```yaml
with:
  customized_split: true  # Optional: false = equal split
  unique_id: string       # Optional: auto-generated if omitted
  variants:
    - name: string        # Required
      percentage: number  # Required: must sum to 100
      next: string        # Required: next step name
```

### 8. Jump Target

```yaml
with:
  target:
    journey: string    # Required: target journey name
    stage: string      # Required: target stage name
    bundle_id: string  # Optional: for versioned journeys
```

### 9. Segment References

| Format | Usage |
|--------|-------|
| `segment-name` | Reference to embedded segment (defined in `segments:`) |
| `ref:Segment Name` | Reference to external segment in parent |
| `"12345"` | Internal ID (not recommended) |

### 10. Reentry Mode Values

Valid values for `reentry`:
```
no_reentry | reentry_unless_goal_achieved | reentry_always
```

### 11. Journey State Values

Valid values for `state`:
```
draft | launched
```

## Validation Examples

### Valid Journey

```yaml
type: journey
name: Onboarding Journey
description: Customer onboarding flow

segments:
  new-customers:
    description: Customers created in last 30 days
    rule:
      type: Value
      attribute: created_at
      operator:
        type: TimeWithinPast
        value: 30
        unit: day  # Correct: singular form

reentry: no_reentry  # Correct: valid reentry mode

journeys:
  - latest: true  # Correct: exactly one version marked latest
    stages:
      - name: Welcome
        entry_criteria:
          name: New Customers
          segment: new-customers  # Correct: matches embedded segment key
        steps:
          - type: wait
            name: Wait 1 Day
            with:
              duration: 1
              unit: day  # Correct: day or week only
          - type: activation
            name: Send Email
            with:
              activation: welcome-email
          - type: end
            name: Complete
```

### Common Validation Errors

**Error: Missing `type: journey`**
```yaml
# INVALID
name: My Journey
journeys: [...]

# VALID
type: journey  # Required discriminator
name: My Journey
journeys: [...]
```

**Error: Wrong wait unit**
```yaml
# INVALID
with:
  duration: 7
  unit: days  # Wrong: plural form

# VALID
with:
  duration: 7
  unit: day  # Correct: singular form (day | week)
```

**Error: Invalid step type**
```yaml
# INVALID
- type: delay  # Wrong: not a valid step type

# VALID
- type: wait  # Correct: wait | activation | decision_point | ab_test | merge | jump | end
```

**Error: End step with `next` or `with`**
```yaml
# INVALID
- type: end
  name: Complete
  next: another-step  # Wrong: end steps have no next

# VALID
- type: end
  name: Complete
```

**Error: A/B test percentages don't sum to 100**
```yaml
# INVALID
with:
  variants:
    - name: A
      percentage: 40
    - name: B
      percentage: 40  # Wrong: 40 + 40 = 80, not 100

# VALID
with:
  variants:
    - name: A
      percentage: 50
    - name: B
      percentage: 50  # Correct: 50 + 50 = 100
```

**Error: Missing segment definition**
```yaml
# INVALID - segment not defined
entry_criteria:
  segment: vip-users  # Error: no embedded segment 'vip-users'

# VALID - use ref: for external segments
entry_criteria:
  segment: ref:VIP Users  # Correct: references external segment

# OR define embedded segment
segments:
  vip-users:
    rule: {...}
```

**Error: Invalid reentry mode**
```yaml
# INVALID
reentry: allow_reentry  # Wrong: not a valid mode

# VALID
reentry: reentry_always  # Correct: one of the valid modes
```

**Error: Multiple `latest: true` versions**
```yaml
# INVALID
journeys:
  - version: v1
    latest: true
  - version: v2
    latest: true  # Wrong: only one can be latest

# VALID
journeys:
  - version: v1
    latest: false
  - version: v2
    latest: true  # Correct: exactly one latest
```

**Error: Decision point missing required fields**
```yaml
# INVALID
- type: decision_point
  name: Check Status
  with:
    branches:
      - name: Active  # Missing: segment and next

# VALID
- type: decision_point
  name: Check Status
  with:
    branches:
      - name: Active
        segment: active-users
        next: active-path
```

**Error: Exceeding stage limit**
```yaml
# INVALID - more than 8 stages
journeys:
  - stages:
      - name: Stage 1
      - name: Stage 2
      - name: Stage 3
      - name: Stage 4
      - name: Stage 5
      - name: Stage 6
      - name: Stage 7
      - name: Stage 8
      - name: Stage 9  # Error: max 8 stages
```

## Validation Workflow

```bash
# 1. Pull existing journey
tdx journey pull "Journey Name"

# 2. Edit journey YAML
vim segments/parent-segment/journey-name.yml

# 3. Validate with dry-run before pushing
tdx journey push --dry-run

# 4. Check for errors in output
# - JOURNEY_SYNTAX_ERROR: Invalid YAML structure
# - JOURNEY_NOT_FOUND: Invalid segment/journey reference
# - Validation errors with helpful messages

# 5. Fix errors and push
tdx journey push
```

## Quick Reference Card

| Check | Rule |
|-------|------|
| File type | Must have `type: journey` |
| Wait units | Only `day` or `week` (singular) |
| Step types | `wait`, `activation`, `decision_point`, `ab_test`, `merge`, `jump`, `end` |
| End steps | No `next` or `with` fields |
| A/B test | Variant percentages must sum to 100 |
| Reentry | `no_reentry`, `reentry_unless_goal_achieved`, `reentry_always` |
| State | `draft` or `launched` |
| Stages | Maximum 8 per journey |
| Versions | Maximum 30 per journey |
| Events | Maximum 120 per journey, 70 per stage |
| Latest version | Exactly one version must have `latest: true` |
| Segment refs | Embedded: `name`, External: `ref:Name` |

## Constraint Limits Summary

| Constraint | Limit |
|------------|-------|
| Stages per journey | 8 |
| Events per journey | 120 |
| Events per stage | 70 |
| Versions per journey | 30 |
| Activations with 120 events | < 50 |

## Related Skills

- **tdx-skills/journey** - Full journey creation and management
- **tdx-skills/validate-segment** - Validate segment rule syntax
- **tdx-skills/segment** - Manage child segments for journey criteria
