---
name: batch-journey
description: Creates CDP batch journey definitions in YAML using `tdx journey` commands. Covers journey stages, steps (wait, activation, decision_point, ab_test, merge, jump, end), entry/exit criteria, goals, embedded segments, and versioning. Use when building customer journey orchestration workflows or managing journey YAML files.
---

# tdx Batch Journey - CDP Journey Orchestration

Create and manage CDP batch journeys using `tdx journey` commands with YAML-based configuration.

## What is a Batch Journey?

Batch journeys orchestrate customer experiences through multi-stage workflows:
- Process profiles through workflow sessions (updates may take a day)
- Maximum 8 stages per journey
- Up to 120 events per journey (70 per stage)
- Support versioning (up to 30 versions)
- Enable A/B testing, decision points, and cross-journey jumps

## Core Commands

```bash
# Set parent segment context (required)
tdx sg use "Customer 360"

# List journeys
tdx journey list
tdx journey list "onboarding*"  # Pattern matching
tdx journey list -r  # Recursive tree view

# View journey details
tdx journey view "Onboarding Journey"
tdx journey view "Onboarding Journey" --include-stats

# Pull journeys to YAML
tdx journey pull  # All journeys in parent segment
tdx journey pull "Onboarding Journey"  # Specific journey
tdx journey pull --dry-run  # Preview without writing

# Push YAML to Treasure Data (via segment push)
tdx sg push
tdx sg push --dry-run  # Preview changes

# Journey lifecycle
tdx journey pause "Onboarding Journey"
tdx journey resume "Onboarding Journey"

# Statistics
tdx journey stats "Onboarding Journey"
tdx journey stats "Onboarding Journey" --stage "Welcome"

# List available connections (for activations)
tdx connection list
```

## Journey YAML Structure

### Basic Journey

```yaml
type: journey  # Required: identifies as journey file
name: Onboarding Journey
description: 30-day customer onboarding

# Journey-level goal (optional)
goal:
  name: Completed Onboarding
  segment: completed-users

# Reentry mode
reentry: no_reentry  # no_reentry | reentry_unless_goal_achieved | reentry_always

# Journey versions (unified format)
journeys:
  - stages:
      - name: Welcome
        entry_criteria:
          name: New Customers
          segment: new-customers
        steps:
          - type: wait
            name: Wait 1 Day
            with:
              duration: 1
              unit: day
          - type: activation
            name: Send Welcome Email
            with:
              activation: welcome-email
          - type: end
            name: Complete
```

### Complete Journey with All Features

```yaml
type: journey
name: Customer Retention Journey
description: Multi-stage retention campaign

# Embedded segments (journey-local)
segments:
  new-customers:
    description: Customers in last 30 days
    rule:
      type: Value
      attribute: created_at
      operator:
        type: TimeWithinPast
        value: 30
        unit: day

  engaged-users:
    description: Users who opened email
    rule:
      type: Value
      attribute: email_opened
      operator:
        type: Equal
        value: true

# Embedded activations (journey-local)
# Use `tdx connection list` to find available connection names
activations:
  welcome-email:
    name: Send Welcome Email
    connection: salesforce-marketing  # From tdx connection list
    connector_config:
      template: welcome_template

# Journey-level settings
goal:
  name: Made Purchase
  segment: ref:Purchasers  # External segment reference
  target:  # Optional: jump when goal met
    journey: Post-Purchase Journey
    stage: Thank You

reentry: reentry_unless_goal_achieved

# Journey versions
journeys:
  - version: v1
    state: launched
    latest: true
    stages:
      - name: Welcome Stage
        description: Initial customer engagement

        entry_criteria:
          name: New Customers
          segment: new-customers

        exit_criteria:
          - name: Churned
            segment: ref:Churned Users

        milestone:
          name: Email Opened
          segment: engaged-users

        steps:
          - type: wait
            name: Wait 1 Day
            with:
              duration: 1
              unit: day

          - type: activation
            name: Send Welcome
            next: check-engagement
            with:
              activation: welcome-email

          - type: decision_point
            name: check-engagement
            with:
              branches:
                - name: Engaged
                  segment: engaged-users
                  next: premium-path
                - name: Not Engaged
                  segment: ref:Non-Engaged
                  excluded: true  # Else branch
                  next: reminder-path

          - type: wait
            name: premium-path
            with:
              duration: 3
              unit: day

          - type: activation
            name: reminder-path
            with:
              activation: reminder-email

          - type: merge
            name: Rejoin Paths
            next: final-check

          - type: end
            name: final-check

      - name: Conversion Stage
        entry_criteria:
          name: Engaged Users
          segment: engaged-users
        steps:
          - type: ab_test
            name: Test Offers
            with:
              customized_split: true
              variants:
                - name: Discount Offer
                  percentage: 50
                  next: discount-path
                - name: Free Trial
                  percentage: 50
                  next: trial-path

          - type: activation
            name: discount-path
            with:
              activation: discount-email

          - type: activation
            name: trial-path
            with:
              activation: trial-email

          - type: jump
            name: Jump to Nurture
            with:
              target:
                journey: Nurture Journey
                stage: Follow Up

          - type: end
            name: Stage Complete
```

## Step Types Reference

### Wait Step

```yaml
# Duration-based wait
- type: wait
  name: Wait 7 Days
  with:
    duration: 7
    unit: day  # day | week

# Conditional wait (wait until segment match or timeout)
- type: wait
  name: Wait For Purchase
  with:
    condition:
      segment: made-purchase
      timeout:
        duration: 14
        unit: day

# Wait until specific date
- type: wait
  name: Wait Until Monday
  with:
    days_of_week: [1]  # 0=Sunday, 1=Monday, etc.
```

### Activation Step

```yaml
- type: activation
  name: Send Email Campaign
  next: next-step-name  # Optional: for branching
  with:
    activation: email-campaign  # Reference to embedded or external activation
```

### Decision Point Step

```yaml
- type: decision_point
  name: Check Customer Tier
  with:
    branches:
      - name: Premium Customers
        segment: premium-tier
        next: premium-path
      - name: Standard Customers
        segment: standard-tier
        next: standard-path
      - name: Others
        segment: ref:All Others
        excluded: true  # Else/default branch
        next: default-path
```

### A/B Test Step

```yaml
- type: ab_test
  name: Test Email Subject Lines
  with:
    customized_split: true  # Manual percentages (false = equal split)
    unique_id: subject_test_001  # Optional: auto-generated if omitted
    variants:
      - name: Subject A
        percentage: 33
        next: variant-a-path
      - name: Subject B
        percentage: 33
        next: variant-b-path
      - name: Subject C
        percentage: 34
        next: variant-c-path
```

### Merge Step

```yaml
- type: merge
  name: Rejoin Branches
  next: continue-flow  # Optional: next step after merge
```

### Jump Step

```yaml
- type: jump
  name: Move to Conversion Journey
  with:
    target:
      journey: Conversion Journey
      stage: Entry Stage
      bundle_id: optional-bundle-id  # For versioned journeys
```

### End Step

```yaml
- type: end
  name: Journey Complete
  # No 'next' or 'with' fields
```

## Segment References

### Embedded Segments (Journey-Local)

```yaml
segments:
  vip-customers:
    description: VIP tier customers
    rule:
      type: Value
      attribute: tier
      operator:
        type: Equal
        value: VIP

journeys:
  - stages:
      - entry_criteria:
          segment: vip-customers  # Direct reference
```

### External Segments

```yaml
journeys:
  - stages:
      - entry_criteria:
          segment: ref:High Value Customers  # Use ref: prefix
```

## Journey States

| State | Description | Can Modify |
|-------|-------------|------------|
| `draft` | Being edited | Yes |
| `launched` | Live and active | Limited |
| `paused` | Paused execution | Yes |

## Reentry Modes

| Mode | Behavior |
|------|----------|
| `no_reentry` | Profiles enter once only |
| `reentry_unless_goal_achieved` | Can re-enter until goal met |
| `reentry_always` | Can re-enter repeatedly |

## Versioning

```yaml
journeys:
  - version: v1
    state: launched
    latest: false  # Previous version
    stages: [...]

  - version: v2
    state: launched
    latest: true  # Active version
    stages: [...]
    goal:  # Per-version override
      name: V2 Goal
      segment: v2-completers
```

## Typical Workflow

```bash
# 1. Set context
tdx sg use "Customer 360"

# 2. Pull existing journeys
tdx journey pull

# 3. Create/edit journey YAML
vim segments/customer-360/onboarding-journey.yml

# 4. Validate YAML (use validate-batch-journey skill)

# 5. Preview changes
tdx sg push --dry-run

# 6. Push to Treasure Data
tdx sg push

# 7. Verify and monitor
tdx journey view "Onboarding Journey" --include-stats
```

## File Organization

```
segments/customer-360/
├── active-users.yml          # Child segment
├── high-value.yml            # Child segment
├── onboarding-journey.yml    # Journey (type: journey)
└── retention-journey.yml     # Journey (type: journey)
```

## Constraints

- Maximum 8 stages per journey
- Maximum 120 events per journey
- Maximum 70 events per stage
- Maximum 30 versions per journey
- Parent segments must run daily for accurate activation accounting
- Stage names cannot be changed after launch

## Common Issues

### Journey Not Processing

```bash
# Check journey state
tdx journey view "Journey Name"

# Resume if paused
tdx journey resume "Journey Name"

# Verify parent segment runs daily
tdx ps view "Parent Segment"
```

### Segment Reference Not Found

```bash
# List available segments
tdx sg list -r

# Use ref: prefix for external segments
segment: ref:Existing Segment Name
```

### Activation Not Triggering

```bash
# List available connections and verify connection name
tdx connection list

# Check activation configuration
tdx journey view "Journey Name" --include-stats
```

## Related Skills

- **tdx-skills/validate-batch-journey** - Validate journey YAML syntax
- **tdx-skills/segment** - Manage child segments for journey criteria
- **tdx-skills/parent-segment** - Manage parent segment (journey context)
- **tdx-skills/tdx-basic** - Core tdx CLI operations

## Resources

- Batch Journey Concepts: https://docs.treasuredata.com/products/customer-data-platform/journey-orchestration/batch
- tdx Documentation: https://tdx.treasuredata.com/commands/journey.html
