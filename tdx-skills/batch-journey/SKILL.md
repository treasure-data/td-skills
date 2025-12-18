---
name: batch-journey
description: Creates CDP batch journey definitions in YAML using `tdx journey` commands. Covers journey stages, steps (wait, activation, decision_point, ab_test, merge, jump, end), entry/exit criteria, goals, embedded segments, and versioning. Use when building customer journey orchestration workflows or managing journey YAML files.
---

# tdx Batch Journey - CDP Journey Orchestration

Create and manage CDP batch journeys using `tdx journey` commands with YAML-based configuration.

## What is a Batch Journey?

Batch journeys orchestrate customer experiences through multi-stage workflows:
- Maximum 8 stages per journey, 120 events per journey (70 per stage)
- Support versioning (up to 30 versions)
- Enable A/B testing, decision points, and cross-journey jumps

## Core Commands

```bash
# Set parent segment context (required)
tdx sg use "Customer 360"

# List and view journeys
tdx journey list
tdx journey view "Onboarding Journey" --include-stats

# Pull/push journeys
tdx journey pull "Onboarding Journey"
tdx journey push --dry-run
tdx journey push

# Journey lifecycle
tdx journey pause "Onboarding Journey"
tdx journey resume "Onboarding Journey"

# List available connections (for activations)
tdx connection list
```

## Journey YAML Templates

**Basic journey**: See [templates/basic-journey.yml](templates/basic-journey.yml)
**Complete journey with all features**: See [templates/complete-journey.yml](templates/complete-journey.yml)

### Required Structure

```yaml
type: journey           # Required: identifies as journey file
name: Journey Name      # Required
description: Optional

goal:                   # Optional: journey completion goal
  name: Goal Name
  segment: segment-name

reentry: no_reentry     # no_reentry | reentry_unless_goal_achieved | reentry_always

journeys:               # Required: array of journey versions
  - state: draft        # draft | launched
    latest: true        # Exactly one must be true
    stages: [...]
```

## Step Types Reference

| Type | Purpose | Key Parameters |
|------|---------|----------------|
| `wait` | Pause execution | `duration`, `unit` (day/week), or `condition` |
| `activation` | Send to external system | `activation` (connection name) |
| `decision_point` | Branch by segment | `branches[]` with segment, next |
| `ab_test` | Split traffic | `variants[]` with percentage, next |
| `merge` | Rejoin branches | `next` (optional) |
| `jump` | Go to another journey | `target.journey`, `target.stage` |
| `end` | Exit stage | No parameters |

### Step Examples

```yaml
# Wait step
- type: wait
  name: Wait 7 Days
  with:
    duration: 7
    unit: day

# Activation step
- type: activation
  name: Send Email
  with:
    activation: email-campaign  # From tdx connection list

# Decision point
- type: decision_point
  name: Check Tier
  with:
    branches:
      - name: Premium
        segment: premium-tier
        next: premium-path
      - name: Others
        excluded: true  # Else branch
        next: default-path

# A/B test
- type: ab_test
  name: Test Offers
  with:
    variants:
      - name: Variant A
        percentage: 50
        next: path-a
      - name: Variant B
        percentage: 50
        next: path-b

# End step
- type: end
  name: Complete
```

## Segment References

- **Embedded**: `segment: my-segment` (defined in `segments:` section)
- **External**: `segment: ref:Existing Segment` (use `ref:` prefix)

## Journey Simulation (Recommended)

**Best Practice**: Push as `draft` first, use simulation to validate before launching.

```bash
# 1. Push draft journey
tdx journey push

# 2. Open in TD Console → click "Simulation Mode"
# 3. Review paths and logs
# 4. Launch when validated
```

Simulation allows you to:
- Verify entry criteria and branching logic
- Test wait steps instantly (fast-forwarded)
- Review path visualization

**Limitations**: Draft journeys only, jump steps not supported in simulation.

See: https://docs.treasuredata.com/products/customer-data-platform/journey-orchestration/journey-simulation

## Typical Workflow

```bash
# 1. Set context and pull
tdx sg use "Customer 360"
tdx journey pull

# 2. Create/edit journey YAML (state: draft)
# 3. Preview and push
tdx journey push --dry-run
tdx journey push

# 4. Simulate in TD Console
# 5. Launch when validated
# 6. Monitor
tdx journey view "Journey Name" --include-stats
```

## Constraints

- Maximum 8 stages, 120 events per journey, 70 events per stage
- Maximum 30 versions per journey
- Stage names cannot be changed after launch
- Parent segments must run daily

## Common Issues

| Issue | Solution |
|-------|----------|
| Journey not processing | `tdx journey resume "Name"` or check parent segment |
| Segment not found | Use `ref:` prefix for external segments |
| Activation not triggering | Verify connection with `tdx connection list` |

## Related Skills

- **validate-batch-journey** - Validate journey YAML syntax
- **segment** - Manage child segments for journey criteria
- **parent-segment** - Manage parent segment (journey context)

## Resources

- Batch Journey: https://docs.treasuredata.com/products/customer-data-platform/journey-orchestration/batch
- Simulation: https://docs.treasuredata.com/products/customer-data-platform/journey-orchestration/journey-simulation
