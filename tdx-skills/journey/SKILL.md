---
name: journey
description: Creates CDP journey definitions in YAML using `tdx journey` commands. Covers journey stages, steps (wait, activation, decision_point, ab_test, merge, jump, end), entry/exit criteria, goals, embedded segments, and versioning. Use when building customer journey orchestration workflows or managing journey YAML files.
---

# tdx Journey - CDP Journey Orchestration

Create and manage CDP journeys using `tdx journey` commands with YAML-based configuration.

## What is a Journey?

Journeys orchestrate customer experiences through multi-stage workflows:
- Maximum 8 stages per journey, 120 events per journey (70 per stage)
- Support versioning (up to 30 versions)
- Enable A/B testing, decision points, and cross-journey jumps

## File Structure

Journey and segment files are stored in the parent segment folder:

```
./segments/(parent-segment-name)/
├── segment1.yml           # Child segment
├── segment2.yml           # Child segment
├── journey1.yml           # Journey file (type: journey)
└── journey2.yml           # Journey file
```

All files in a parent segment folder share the same parent segment context.

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
# Wait step (with next to branch)
- type: wait
  name: Wait 7 Days
  next: next-step        # Optional: branch to named step
  with:
    duration: 7
    unit: day            # day | week (singular form only)

# Activation step
- type: activation
  name: Send Email
  next: after-email      # Optional: branch to named step
  with:
    activation: email-campaign  # References key in activations: section

# Decision point
- type: decision_point
  name: Check Tier
  with:
    branches:
      - name: Premium
        segment: premium-tier
        next: premium-path
      - name: Others
        excluded: true   # Else/default branch
        next: default-path

# A/B test
- type: ab_test
  name: Test Offers
  with:
    customized_split: false   # false = equal split
    unique_id: cdp_customer_id  # Optional: tracking ID
    variants:
      - name: Variant A
        percentage: 50
        next: path-a
      - name: Variant B
        percentage: 50
        next: path-b

# End step (no next or with)
- type: end
  name: Complete
```

**Important**: The `next:` field is a direct field on steps, not inside `with:`.

## Activations Section

Define embedded activations in the `activations:` section. These are referenced by key name in activation steps.

```yaml
activations:
  welcome-email:                    # Key name referenced in steps
    name: Welcome Email Campaign    # Display name
    connection: salesforce-marketing  # From tdx connection list
    all_columns: true               # Export all attributes
    schedule:
      type: none                    # none | daily | hourly
      timezone: UTC
    notification:
      notify_on:
        - onSuccess
        - onFailure
      email_recipients:
        - team@example.com
    connector_config:               # Connection-specific config
      de_name: WelcomeEmails
      shared_data_extension: false
      data_operation: upsert
```

Use `tdx connection list` to find available connection names and `tdx connection schema <type>` to discover `connector_config` fields. See **connector-config** skill for detailed guidance.

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

- **connector-config** - Configure connector_config for activations
- **validate-journey** - Validate journey YAML syntax
- **segment** - Manage child segments for journey criteria
- **parent-segment** - Manage parent segment (journey context)

## Resources

- Journey Orchestration: https://docs.treasuredata.com/products/customer-data-platform/journey-orchestration
- Simulation: https://docs.treasuredata.com/products/customer-data-platform/journey-orchestration/journey-simulation
