---
name: journey
description: Creates CDP journey definitions in YAML using `tdx journey` commands. Builds journeys incrementally through 6 steps - skeleton, criteria segments, decision points, activations, stage steps, and validation. Use when building customer journey orchestration workflows or managing journey YAML files.
---

# tdx Journey - CDP Journey Orchestration

## Overview

Build journey YAML **incrementally** through 6 steps. Do NOT attempt to create a complete journey at once.

**File location**: `./segments/(parent-segment-name)/journey-name.yml`

## Prerequisites

```bash
tdx sg pull "Customer 360"    # Pull parent segment data (sets context)
tdx sg fields                 # List available attributes and behaviors for segment rules
```

## Core Commands

```bash
tdx journey validate path/to/journey.yml   # Validate YAML locally (offline)
tdx journey push --dry-run                 # Preview changes against API
tdx journey push --yes                     # Push journey
tdx journey pause "Journey Name"           # Pause running journey
tdx journey resume "Journey Name"          # Resume paused journey
tdx journey view "Journey Name" --include-stats
```

## Incremental Build Process

### Step 1: Journey Skeleton

Create the minimal structure: name, description, reentry mode, and stage names.

Ask the client for:
- Journey name and description
- Number of stages and their names
- Reentry mode: `no_reentry` | `reentry_unless_goal_achieved` | `reentry_always`

See: `templates/step1-skeleton.yml`

**Note**: This will NOT pass `tdx journey validate` yet. Validation is done in Step 6.

### Step 2: Goal and Stage Criteria (Segments)

Build the `segments:` section and wire up goal, entry_criteria, exit_criteria, and milestone for each stage.

#### Segment Strategy

Ask the client which approach to use:

**Option A: Create new embedded segments** (recommended for most cases)
- Use `tdx sg fields` to discover available attributes and behaviors
- Define segments inline in the `segments:` section

**Option B: Reuse existing segments**
- Use `tdx sg list` to discover existing child segments
- Use `tdx sg sql "Segment Name"` to inspect segment definitions
- Reference with `ref:` prefix: `segment: ref:Existing Segment`
- Note: Even with this approach, some segments will likely need to be embedded

#### Segment Section Structure

Organize `segments:` with comments showing usage (goal/entry/exit/milestone) and stage. Then wire up criteria in each stage.

See: `templates/step2-criteria.yml`

#### Segment Rule Reference

Use `tdx sg fields` output to build rules. Common operators:

| Operator | Usage |
|----------|-------|
| `Equal` | Exact match: `value: "true"` |
| `In` | Multiple values: `value: ["a", "b"]` |
| `GreaterEqual` / `LessEqual` | Numeric comparison |
| `TimeWithinPast` | Recency: `value: 7, unit: day` |
| `TimeBeforePast` | Inactivity: `value: 30, unit: day` |
| `Contain` | String contains |

Behavior aggregation (requires `source: behavior_<table_name>`):

```yaml
- type: And
  conditions:
    - type: Value
      attribute: ""              # Empty for behavior count
      operator:
        type: GreaterEqual
        value: 1
      aggregation:
        type: Count              # Count | Sum | Avg | Min | Max
      source: behavior_purchases # behavior_<table_name>
  description: has made a purchase
```

### Step 3: Decision Point Segments

Add segments for all `decision_point` branches across every stage. Same approach as Step 2.

For each decision_point:
- Define a segment for each branch that filters by specific criteria
- Use `excluded: true` for the "everyone else" branch — **no segment needed**
- Organize in `segments:` with comments identifying the decision_point and branch name
- Segments from Step 2 can be reused in branches (e.g., `email_engaged` as both milestone and branch)

```yaml
# Excluded branch — catches all profiles not matching other branches
- name: Not Opened
  excluded: true    # No segment required
  next: reminder-path
```

At the bottom of the template, summarize each decision_point's branch structure for use in Step 5.

See: `templates/step3-decision-points.yml`

### Step 4: Activations

Define activation destinations for each stage's outbound actions.

#### Discovery Workflow

```bash
# 1. List available connections
tdx connection list
#   salesforce_marketing_cloud_v2  My SFMC Connection - Jane Smith
#   s3_v2                          S3 Export - Bob Lee

# 2. (Optional) List all connector types
tdx connection types

# 3. Get connector_config fields for a connection
tdx connection schema "My SFMC Connection"
```

#### Schedule Strategy

Ask the client which timing to use for activations:

- **`run_after_journey_refresh: true`** — run after parent segment workflow completes (most common)
- **Fixed schedule** — `schedule: { type: daily, timezone: America/Los_Angeles }` with specific time

#### Activation Structure

```yaml
activations:
  welcome-email:                          # key — referenced in steps
    name: Welcome Email Campaign          # display name
    connection: My SFMC Connection        # from tdx connection list
    all_columns: true
    run_after_journey_refresh: true        # or use schedule: { type: daily, ... }
    connector_config:                      # from tdx connection schema
      de_name: WelcomeEmails
      data_operation: upsert
```

Organize activations by stage with comments. See **connector-config** skill for connector-specific fields.

See: `templates/step4-activations.yml`

### Step 5: Stage Steps

Build steps **one stage at a time**. For each stage:

1. Sketch the flow as a comment before writing steps
2. Write steps following the flow
3. Verify all `next:` references point to valid step names within the stage

#### Flow Sketch Pattern

```yaml
# Flow: Wait → Email → Wait → Decision(Opened/Not Opened)
#       Opened → Follow Up → Merge → End
#       Not Opened → SMS → Merge → End
```

#### Step Rules

- **`next:`** is a direct field on step, NOT inside `with:`
- **`end`** step: no `next` or `with` allowed
- **`merge`** step: rejoin all branches before end
- **`activation`** step: `with.activation` references a key from `activations:` section
- **`decision_point`** branches: reference segments from Steps 2-3, use `excluded: true` for default
- **`ab_test`** variants: percentages must sum to 100
- **`wait`** step: `duration` + `unit` (day/week) or `condition` with optional `timeout`

#### Common Step Patterns

```yaml
# Linear: action → wait → action
- type: activation
  name: Send Email
  next: Wait 3 Days
  with:
    activation: welcome-email

- type: wait
  name: Wait 3 Days
  next: Next Step
  with:
    duration: 3
    unit: day

# Branch and merge: decision → paths → merge → end
- type: decision_point
  name: Check Status
  with:
    branches:
      - name: Active
        segment: active_users
        next: Send Offer
      - name: Others
        excluded: true
        next: Send Reminder

- type: activation
  name: Send Offer
  next: Rejoin
  with:
    activation: offer-email

- type: activation
  name: Send Reminder
  next: Rejoin
  with:
    activation: reminder-email

- type: merge
  name: Rejoin
  next: Stage Complete

- type: end
  name: Stage Complete
```

See: `templates/step5-steps.yml`

### Step 6: Validate and Iterate

```bash
tdx journey validate path/to/journey.yml   # Local validation
tdx journey push --dry-run                 # API validation
```

Fix errors reported by validation, then push:

```bash
tdx journey push path/to/journey.yml --yes
```

Push as `draft` first, then use TD Console "Simulation Mode" to validate before launching.

## Step Types Quick Reference

| Type | `with` Parameters | Notes |
|------|-------------------|-------|
| `wait` | `duration`, `unit` (day/week) or `condition` | |
| `activation` | `activation` (key from activations section) | |
| `decision_point` | `branches[]` with segment, next | |
| `ab_test` | `variants[]` with percentage, next | Percentages must sum to 100 |
| `merge` | (none) | |
| `jump` | `target` with `journey`, `stage` | |
| `end` | (none) | No `next` or `with` allowed |

**Important**: `next:` is a direct field on step, NOT inside `with:`

## Segment References

- **Embedded**: `segment: my-segment` (defined in `segments:` section, created as journey-local segment on push)
- **External**: `segment: ref:Existing Segment` (references existing child segment by name)

## Limits

- Max 8 stages per journey
- Max 120 events per journey
- Max 70 events per stage
- Max 30 versions per journey

## Related Skills

- **connector-config** - `connector_config` fields for activations
- **validate-journey** - Validation rules reference
- **segment** / **validate-segment** - Segment rule syntax
- **parent-segment** - Parent segment management

## Resources

- https://docs.treasuredata.com/products/customer-data-platform/journey-orchestration
