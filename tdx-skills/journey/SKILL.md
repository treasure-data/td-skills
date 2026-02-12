---
name: journey
description: Creates CDP journey definitions in YAML using `tdx journey` commands. Builds journeys incrementally through 4 steps - segments, activations, journey structure with steps, and validation. Use when building customer journey orchestration workflows or managing journey YAML files.
---

# tdx Journey - CDP Journey Orchestration

## First: Ask the Client for Build Mode

Before starting, ask the client which mode to use:

- **Interactive mode** — Pause after each step for review and confirmation. Best for learning or complex journeys.
- **Auto mode** — Execute all steps continuously without pausing. Best when the client has provided clear requirements upfront.

## Build Process

Build journey YAML **incrementally** through 4 steps. **You MUST complete one step at a time.**

**Workflow for EACH step:**
1. Read the template file for that step
2. Ask the client for the required information (if not already provided)
3. Update the journey YAML file with only that step's changes
4. **Interactive mode**: Show the updated YAML and STOP. Do NOT ask "shall we proceed?" — just wait for the client to respond.
5. **Auto mode**: Proceed directly to the next step without pausing

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

## The 4 Steps

| Step | What to do | Template |
|------|-----------|----------|
| 1 | All segments (criteria, decision points, wait conditions) | `templates/step1-segments.yml` |
| 2 | Activations | `templates/step2-activations.yml` |
| 3 | Journey structure + stage steps (one stage at a time) | `templates/step3-journey.yml` |
| 4 | Validate and push | (see below) |

**Start with Step 1**: Read `templates/step1-segments.yml` and follow the instructions inside.

### Step 4: Validate and Push

After completing Step 3, validate and iterate:

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
