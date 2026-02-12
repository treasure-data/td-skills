---
name: journey
description: Creates CDP journey definitions in YAML using `tdx journey` commands. Builds journeys incrementally through 6 steps - skeleton, criteria segments, decision points, activations, stage steps, and validation. Use when building customer journey orchestration workflows or managing journey YAML files.
---

# tdx Journey - CDP Journey Orchestration

## CRITICAL: Step-by-Step Build Process

Build journey YAML **incrementally** through 6 steps. **You MUST complete one step at a time.**

**Workflow for EACH step:**
1. Read the template file for that step
2. Ask the client for the required information
3. Update the journey YAML file with only that step's changes
4. Show the updated YAML to the client and confirm before moving on
5. **STOP. Do NOT read the next step's template until the client confirms.**

**File location**: `./segments/(parent-segment-name)/journey-name.yml`

## Prerequisites

```bash
tdx sg pull "Customer 360"    # Pull parent segment data (sets context)
tdx sg fields                 # List available attributes and behaviors for segment rules
```

## Commands

```bash
tdx journey validate path/to/journey.yml   # Validate YAML locally (offline)
tdx journey push --dry-run                 # Preview changes against API
tdx journey push --yes                     # Push journey
tdx journey pause "Journey Name"           # Pause running journey
tdx journey resume "Journey Name"          # Resume paused journey
tdx journey view "Journey Name" --include-stats
```

## The 6 Steps

| Step | What to do | Template |
|------|-----------|----------|
| 1 | Journey skeleton (name, stages) | `templates/step1-skeleton.yml` |
| 2 | Goal and stage criteria segments | `templates/step2-criteria.yml` |
| 3 | Decision point segments | `templates/step3-decision-points.yml` |
| 4 | Activations | `templates/step4-activations.yml` |
| 5 | Stage steps (one stage at a time) | `templates/step5-steps.yml` |
| 6 | Validate and push | (see below) |

**Start with Step 1**: Read `templates/step1-skeleton.yml` and follow the instructions inside.

### Step 6: Validate and Push

After completing Step 5, validate and iterate:

```bash
tdx journey validate path/to/journey.yml   # Local validation
tdx journey push --dry-run                 # API validation
```

Fix errors, then push as draft first:

```bash
tdx journey push path/to/journey.yml --yes
```

Use TD Console "Simulation Mode" to validate before launching.

## Segment References

- **Embedded**: `segment: my-segment` (defined in `segments:` section)
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
