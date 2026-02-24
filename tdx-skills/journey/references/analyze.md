# Journey Analysis

Analyze journey performance and create visual dashboards with action reports.

**FIRST: Create a TODO list** (1 task per phase) before starting.

## Phase 1: Schema Discovery

**Prerequisite**: Read `references/journey-table.md` first. Journey tables use a state snapshot model with domain-specific column naming that is NOT guessable — skipping this will produce incorrect SQL in Phase 2.

Run ALL discovery commands (do not skip any):

```bash
tdx journey view "<journey-name>" --include-stats
tdx journey columns "<journey-name>"
tdx journey stats "<journey-name>"          # cumulative KPIs — REQUIRED for dashboard
tdx journey activations "<journey-name>"
```

**Output of this phase:**
- Database & table name
- Stage names and their indices
- Step ID to name mapping
- Column categories present (milestone, exit_criteria, branch, variant)
- Cumulative KPIs from `tdx journey stats` (entered, exit_or_jump, goal_achieved)

## Phase 2: Data Collection

Query the journey table. Read `references/journey-table.md` for column naming patterns and state determination logic.

**Required queries (in order):**
1. Table verification — `COUNT(*)`, `COUNT(DISTINCT cdp_customer_id)`, `COUNT(DISTINCT time)` (confirm snapshot behavior)
2. Current stage distribution — CASE on `intime_stage_N IS NOT NULL AND outtime_stage_N IS NULL`
3. Time-in-stage — avg/median/p90 days for each stage (currently in)
4. Stage progression funnel — count of `intime_stage_N IS NOT NULL` for each stage
5. Goal conversion — if goals exist, rate and avg days-to-goal

**Conditional queries (based on schema):**
- Milestone achievement — if `milestone` columns exist
- Exit criteria breakdown — if `exit_criteria` columns exist
- Branch distribution — if `branch` columns exist
- A/B test variants — if `variant` columns exist
- Activation completion rates — if activation step columns exist

**Traffic data** (REQUIRED — max 90-day range, API returns empty if exceeded):
```bash
tdx journey traffic "<journey-name>" --from <90-days-ago> --to <today>
```

Always run this. Collect Sankey data for conversion flows and per-stage activation flows. Dashboard Sankey charts depend on this data.

## Phase 3: Dashboard

**Read `grid-dashboard` SKILL.md** before writing any dashboard YAML.

The dashboard MUST incorporate data from all three sources: `tdx journey stats` (cumulative KPIs), `tdx journey traffic` (Sankey flows), and SQL queries (snapshot analysis). Do not omit any source.

Build a grid dashboard with these pages:

### Page 1: Journey Overview
- KPIs: Entered (from stats), Currently In (from SQL), Exit/Jump (from stats), Exit/Jump Rate
- Current Records by Stage (table)
- Stage Distribution (gauge or scores)
- Entry Cohort Trend (chart: line — monthly entries)
- Key Insights (markdown)

### Page 2-N: Stage Analysis (one page per stage)
- Stage KPIs: Customers in stage, Median days, Milestone rate (if applicable)
- Activation Sankey for this stage (chart: sankey from traffic data)
- Time-in-Stage Distribution (chart: bar — histogram buckets)
- Stuck Customer Detection (table: customers > p90 dwell time)
- Stage Insights (markdown)

### Sankey Data Classification

**Conversion Sankey** — split `tdx journey traffic --type conversion` into 4 charts by target node type:

| Chart | Source node type | Target node type |
|-------|-----------------|-----------------|
| Between Stages | stage | stage |
| To Goal | stage | goal |
| To Jumps | stage | jump |
| To Exits | stage | exit |

Filter: `link.value > 0`. Exit dedup: if duplicate exit labels, rename to `"{exit} ({source stage})"`.

**Activation Sankey** (per stage) — from `tdx journey traffic --type activation`:
- Main flow: exclude exit/jump target nodes
- Aggregate exit/jump: sum values into single "Exit/Jump" node per source

### Dashboard File Location
```
./analysis/{journey-name}-dashboard.yaml
```

**Build incrementally** per grid-dashboard skill instructions (one page at a time).

## Phase 4: Action Report

**Read `action-report` SKILL.md** before writing any action report YAML.

Generate prioritized action items based on Phase 2 findings.

### Categories
- Journey Design / Journey Flow / Journey Configuration
- Engagement Strategy / Data Quality / Monitoring

### Priority Logic
- **High**: Affects >50% customers OR blocks completion OR structural issue
- **Medium**: Affects 10-50% OR suboptimal config
- **Low**: Affects <10% OR needs more data

### Action Report File Location
```
./analysis/{journey-name}-action-report.yaml
```

**Build incrementally** per action-report skill instructions (2-3 actions per edit).

## Phase 5: Journey Optimization (Optional)

After presenting the dashboard and action report, **ask the client** whether they want to create a new journey version with optimizations applied.

**Do NOT follow the Build Process (5-step template workflow) from the journey SKILL.** `version create` clones the entire existing journey — you already have a complete YAML. Only make targeted edits based on analysis findings.

If yes:

### 1. Create a new draft version
```bash
tdx journey version create "<journey-name>" -y
```
Creates a draft version cloned from the current latest. Auto-named `"{name} vN+1"`.

### 2. Pull the draft and make targeted edits
```bash
tdx journey pull "<journey-name>"
```
The pulled YAML is a complete copy of the current journey. Make only the specific changes suggested by the action report (Phase 4) — do NOT rebuild from scratch.

### 3. Push changes
```bash
tdx journey push "<journey-name>" --dry-run   # preview
tdx journey push "<journey-name>"              # apply
```

### 4. Verify
```bash
tdx journey versions "<journey-name>"          # confirm new version listed
tdx journey version view "<journey-name>" --version <N>  # inspect details
```

The new version remains in **draft** state. The client launches it from the TD console when ready.

## Related Skills

- **grid-dashboard** — Dashboard YAML format and cell types
- **action-report** — Action report YAML format
- **journey** — Journey YAML build workflow
- **sql-skills:trino** — TD Trino SQL patterns
