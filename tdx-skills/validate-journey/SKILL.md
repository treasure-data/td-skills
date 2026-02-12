---
name: validate-journey
description: Validates CDP journey YAML configurations against tdx schema requirements. Use when reviewing journey structure, checking step types and parameters, verifying segment references, or troubleshooting journey configuration errors before pushing to Treasure Data.
---

# Journey YAML Validation

```bash
tdx journey validate                      # Validate all journey YAML files locally
tdx journey validate path/to/journey.yml  # Validate specific file
tdx journey push --dry-run                # Preview changes before push
```

## Validation Checks

### Structure Validation

| Code | Level | Description |
|------|-------|-------------|
| `MISSING_NAME` | error | Journey missing `name` field |
| `MISSING_STAGES` | error | Journey has no `stages` defined |
| `MISSING_GOAL` | error | Journey has no `goal` defined |
| `TOO_MANY_STAGES` | error | More than 8 stages |
| `MISSING_ENTRY_CRITERIA` | error | Stage missing `entry_criteria` |
| `MISSING_MILESTONE` | error | Non-last stage missing `milestone` |
| `MISSING_EXIT_CRITERIA` | warning | Stage has no `exit_criteria` |

### Step Count Validation

| Code | Level | Description |
|------|-------|-------------|
| `INSUFFICIENT_STEPS` | error | Stage has 0-1 steps (needs at least 2) |
| `FEW_STEPS` | warning | Stage has 2-3 steps (may be too simple) |

### Step Validation

| Code | Level | Description |
|------|-------|-------------|
| `DUPLICATE_STEP_NAME` | error | Two steps share the same name |
| `INVALID_NEXT_REFERENCE` | error | `next` points to non-existent step |
| `MISSING_WAIT_PARAMS` | error | Wait step missing `duration`+`unit` or `condition` |
| `MISSING_SEGMENT_REFERENCE` | error | Wait condition or branch missing `segment` |
| `MISSING_ACTIVATION_REF` | error | Activation step missing `with.activation` |
| `MISSING_CONDITIONS` | error | Decision point or AB test missing branches/variants |
| `INVALID_AB_TEST_PERCENTAGES` | error | AB test variant percentages don't sum to 100 |
| `INVALID_JUMP_TARGET` | error | Jump step missing `target.journey` or `target.stage` |
| `END_STEP_HAS_NEXT_OR_WITH` | error | End step has `next` or `with` field |

### Flow Control Validation

| Code | Level | Description |
|------|-------|-------------|
| `MISSING_END_STEP` | error | Stage has no `end` step |
| `CONVERGENCE_WITHOUT_MERGE` | error | Multiple paths converge on a non-merge step |
| `SINGLE_INPUT_MERGE` | warning | Merge step has only one input path |
| `MERGE_TO_MERGE_CHAIN` | error | Merge step's `next` is another merge step |
| `BRANCH_DIRECTLY_TO_MERGE` | error | Decision/AB test branch goes directly to merge (no action) |

### API Constraints (not checked by `tdx journey validate`, but rejected by the API)

| Constraint | Description |
|-----------|-------------|
| Branch must have activation | Every decision_point/ab_test branch MUST have an activation step before merge |
| Wait after activation | A wait step must follow every activation step. If activation → merge, place wait after merge |

### Reference Validation

| Code | Level | Description |
|------|-------|-------------|
| `MISSING_ACTIVATION_DEFINITION` | error | Activation key not found in `activations:` section |
| `UNUSED_EMBEDDED_SEGMENT` | warning | Segment defined in `segments:` but never referenced |

## Required Structure

```yaml
type: journey              # Required
name: Journey Name

goal:                      # Required
  name: Goal Name
  segment: ref:Goal Segment

stages:
  - name: Stage Name
    entry_criteria:        # Required
      name: Entry Name
      segment: ref:Entry Segment
    exit_criteria:         # Recommended (warning if missing)
      - name: Exit Name
        segment: ref:Exit Segment
    milestone:             # Required for non-last stages
      name: Milestone Name
      segment: ref:Milestone Segment
    steps:                 # At least 2 steps required (4+ recommended)
      - type: activation
        name: Send Email
        next: end
        with:
          activation: email-key
      - type: end
        name: end
```

**Limits**: Max 8 stages, 120 events/journey, 70 events/stage, 30 versions

## Step Types Quick Reference

| Type | Required `with` | Notes |
|------|-----------------|-------|
| `wait` | `duration` + `unit` OR `condition` | condition has `segment`, optional `next`, `timeout` |
| `activation` | `activation` | key from activations section |
| `decision_point` | `branches[]` | each needs segment, next |
| `ab_test` | `variants[]` | percentages must sum to 100 |
| `merge` | (none) | required when multiple paths converge |
| `jump` | `target` with `journey`, `stage` | target is an object |
| `end` | (none) | no `next` or `with` allowed |

**Important**: `next:` is a direct field on step, not inside `with:`

## Flow Control Rules

```yaml
# Branching pattern: decision → actions → merge → end
- type: decision_point
  name: Check Status
  with:
    branches:
      - name: Active
        segment: active_users
        next: Send Offer          # Must NOT point directly to merge
      - name: Others
        excluded: true
        next: Send Reminder

- type: activation
  name: Send Offer
  next: Rejoin                    # Both paths converge on merge
  with: { activation: offer }

- type: activation
  name: Send Reminder
  next: Rejoin                    # Both paths converge on merge
  with: { activation: reminder }

- type: merge
  name: Rejoin                    # Required: multiple paths need merge
  next: end                       # Must NOT point to another merge

- type: end
  name: end                       # Required: every stage needs an end step
```

## Wait Condition Format

```yaml
- type: wait
  name: Wait for Purchase
  with:
    condition:
      segment: made-purchase    # Wait until segment match
      next: follow-up           # Optional: defaults to next sequential step
      timeout:                  # Max wait duration
        duration: 14
        unit: day
        next: timeout-path      # Required when using different paths
```

## Segment References

- Embedded: `segment: my-segment` (defined in `segments:` section)
- External: `segment: ref:Existing Segment` (use `ref:` prefix)

## Related Skills

- **journey** - Full journey creation and management
- **validate-segment** - Segment rule validation
