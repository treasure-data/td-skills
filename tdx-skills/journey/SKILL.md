---
name: journey
description: Load when the client wants to create, edit, or manage a CDP customer journey. Use for building journey YAML with segments, activations, and stage steps, modifying journey stages or flow logic (decision points, wait conditions, A/B tests), or pushing journey changes to Treasure Data.
---

# tdx Journey - CDP Journey Orchestration

## Build Process

Build journey YAML **incrementally** through 5 steps.

**FIRST: Create a TODO list** with one task per step before starting any work. This ensures you follow the step-by-step process and do not skip ahead. Mark each task as in_progress when you start it and completed when done.

**CRITICAL RULES:**
- **You MUST read the template file** for each step using the Read tool before doing anything else. The templates contain required discovery commands and instructions. Do NOT write YAML from memory.
- Complete steps in order, one at a time. NEVER skip or combine steps.

**Workflow for EACH step:**
1. **Read the template file** (MANDATORY — use Read tool on the template path)
2. **Run the discovery commands** listed in the template (MANDATORY — do NOT guess values)
3. Ask the client for the required information (if not already provided)
4. **Show the design/plan and get client confirmation** — this is the ONE confirmation point per step
5. Write the updated YAML to the journey file
6. **Immediately proceed to the next step** — do NOT ask "shall we proceed?" or "please review". The client already confirmed in step 4.

**File location**: `./segments/(parent-segment-name)/journey-name.yml`

## Prerequisites (MUST run before starting)

```bash
tdx sg pull "Parent Segment Name"   # Pull parent segment data (sets context)
```

Each step has its own required discovery commands. Do NOT skip them — they provide real attribute names, connection names, and config fields needed to write accurate YAML.

## Commands

```bash
tdx journey validate path/to/journey.yml   # Validate YAML locally (offline)
tdx journey push --dry-run                 # Preview changes against API
tdx journey push --yes                     # Push journey
tdx journey pause "Journey Name"           # Pause running journey
tdx journey resume "Journey Name"          # Resume paused journey
tdx journey view "Journey Name" --include-stats
```

## The 5 Steps

| Step | What to do | Template |
|------|-----------|----------|
| 1 | Criteria segments (goal, entry/exit, milestone) | `templates/step1-criteria.yml` |
| 2 | Decision point branches + wait condition segments | `templates/step2-decisions.yml` |
| 3 | Activations | `templates/step3-activations.yml` |
| 4 | Journey structure + stage steps (one stage at a time) | `templates/step4-journey.yml` |
| 5 | Validate and push | (see below) |

**Start with Step 1**: Read `templates/step1-criteria.yml` and follow the instructions inside.

### Step 5: Validate and Push

After completing Step 4, validate and iterate:

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

## Wait Step Options

```yaml
# Simple wait (duration)
- type: wait
  name: Wait 7 Days
  with:
    duration: 7
    unit: day                          # day | week

# Wait until specific date
- type: wait
  name: Wait Until Launch
  with:
    wait_until: "2025-04-01"

# Wait for specific days of week
- type: wait
  name: Wait for Weekday
  with:
    duration: 7
    unit: day
    days_of_week: ["monday", "wednesday", "friday"]
```

## Limits

- Max 8 stages per journey (validated locally)
- Max 120 events per journey (API constraint)
- Max 70 events per stage (API constraint)
- Max 30 versions per journey (API constraint)

## Related Skills

- **connector-config** - `connector_config` fields for activations
- **validate-journey** - Validation rules reference
- **segment** / **validate-segment** - Segment rule syntax
- **parent-segment** - Parent segment management
