---
name: validate-journey
description: Validates CDP journey YAML configurations against tdx schema requirements. Use when reviewing journey structure, checking step types and parameters, verifying segment references, or troubleshooting journey configuration errors before pushing to Treasure Data.
---

# Journey YAML Validation

Validate with `tdx journey push --dry-run` before pushing.

## Required Structure

```yaml
type: journey              # Required
name: Journey Name

reentry: no_reentry        # no_reentry | reentry_unless_goal_achieved | reentry_always

journeys:
  - state: draft           # draft | launched
    latest: true           # Exactly one must be true
    stages:
      - name: Stage Name
        steps: [...]
```

**Limits**: Max 8 stages, 120 events/journey, 70 events/stage, 30 versions

## Step Types Quick Reference

| Type | Required `with` | Notes |
|------|-----------------|-------|
| `wait` | `duration` + `unit` OR `condition` | unit: day/week only |
| `activation` | `activation` | key from activations section |
| `decision_point` | `branches[]` | each needs segment, next |
| `ab_test` | `variants[]` | percentages must sum to 100 |
| `merge` | (none) | |
| `jump` | `target` with `journey`, `stage` | target is an object |
| `end` | (none) | no `next` or `with` |

**Important**: `next:` is a direct field on step, not inside `with:`

## Segment References

- Embedded: `segment: my-segment` (defined in `segments:` section)
- External: `segment: ref:Existing Segment` (use `ref:` prefix)

## Common Errors

```yaml
# WRONG: missing type: journey
name: My Journey
journeys: [...]
# CORRECT
type: journey
name: My Journey

# WRONG: plural wait unit
unit: days
# CORRECT
unit: day                    # day | week only

# WRONG: invalid step type
type: delay
# CORRECT
type: wait

# WRONG: end step with next
- type: end
  next: another-step
# CORRECT
- type: end
  name: Complete

# WRONG: percentages don't sum to 100
variants:
  - percentage: 40
  - percentage: 40
# CORRECT
variants:
  - percentage: 50
  - percentage: 50

# WRONG: multiple latest: true
journeys:
  - latest: true
  - latest: true
# CORRECT: exactly one
journeys:
  - latest: false
  - latest: true

```

## Related Skills

- **journey** - Full journey creation and management
