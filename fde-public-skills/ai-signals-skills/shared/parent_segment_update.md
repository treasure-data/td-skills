---
name: shared-parent-segment-update
description: |
  Phase 5 Step 1 — Add NBA/RFM/MTA/NBP score attributes to the customer's Parent Segment and create example audience segments in Audience Studio. Handles the "how" (process, approval gates, push mechanics). The "what" (which attributes and segments to create) comes from the calling solution's references/parent_segment.md file.
---

# Shared: Parent Segment Update & Example Audiences

Run this as the **first step of Phase 5**, after the Phase 4 workflow re-run and validation are complete. Do not run before the final workflow output is validated — attributes and example segments must reflect production-ready data.

## Prerequisites

- Phase 4 complete: final workflow config pushed, workflow re-run, output tables validated
- `sink_database` and `final_nba_metrics_table` (or equivalent) confirmed from `project_state.md`
- Parent Segment name and ID known (from `project_state.md`). If not recorded yet, run `tdx ps list`, ask the user to pick with `AskUserQuestion`, and record the name + ID in `project_state.md`

---

## Step 1: Present the Plan — Wait for Approval Before Touching Anything

Before making any changes, tell the user what you are about to do:

> I'm about to make the following changes to the **[Parent Segment Name]** Parent Segment:
>
> 1. Add **[Solution Name] score attributes** from `[sink_database].[output_table]` to the Parent Segment
> 2. Create a new Audience Studio folder: **[Solution Name] Examples**
> 3. Create **[N] example segments** in that folder
>
> **Shall I proceed?**

Do not read `references/parent_segment.md` yet — wait for explicit user approval first. If the user wants to change the PS, folder name, or scope, incorporate their feedback before continuing.

---

## Step 2: Add Attributes to the Parent Segment

### 2a. Pull the current config

```bash
( cd agent_outputs/<project_slug> && tdx ps pull "<Parent Segment Name>" )
```

`tdx ps pull` takes the parent segment **name** (not the ID) and saves the config as a single YAML file at `agent_outputs/<project_slug>/parent_segments/<ps-slug>.yml`. It also sets the user's tdx parent-segment context — mention this. (`tdx sg pull` in Step 3 writes to `segments/`, so the two never collide.)

### 2b. Read the solution's attribute spec

Read the calling solution's `references/parent_segment.md`. It specifies:
- Which output table columns to add
- How to group them (attribute block name)
- Column types and labels

### 2c. Present column list to user for confirmation

Show the proposed attribute block grouped by category (e.g. "Core Scores", "Campaign Flags", "Engagement Scores"). Ask:

> Here are the attributes I'll add. Would you like to include all of them, or remove any?

Wait for confirmation before modifying the file.

### 2d. Append the attribute block to the YAML

**Critical rule: append inside `attributes:` — never inside `behaviors:`.**

Verify the section boundaries before editing:

```bash
grep -n "^attributes:\|^behaviors:" <ps-file>
```

The new block must be inserted **before** the `behaviors:` line. Never append to the end of the file without checking which section it falls under.

```yaml
attributes:
  # ... existing attribute blocks ...
  - name: <Solution Name> Scores        # ← insert here, before behaviors:
    source:
      database: <sink_database>
      table: <final_output_table>
    join:
      parent_key: <unique_user_id>
      child_key: <unique_user_id>
    columns:
      - column: <col_name>
        type: string | number
        label: <Human Readable Label>
      # ...

behaviors:
  # ... existing behavior blocks — do not touch ...
```

### 2e. Push

```bash
( cd agent_outputs/<project_slug> && tdx ps push "<Parent Segment Name>" -y )   # reads parent_segments/<ps-slug>.yml
```

Verify the diff shown by tdx confirms the new block appears under `attributes:` and that no behaviors were modified.

---

## Step 3: Create Example Audience Folder and Segments

### 3a. Confirm folder name

Default folder name: **`<Solution Name> Examples`**

Ask the user to confirm or rename before creating anything.

### 3b. Load `tdx-skills:segment` — MANDATORY before writing any YAML

**Before writing any segment YAML files, load the `tdx-skills:segment` skill.** The filter descriptions in the solution spec are business-logic shorthand. `tdx-skills:segment` defines the exact schema required by `tdx sg push`:
- Top-level key is `rule:` (not `rules:`)
- `attribute:` is a flat string (not a nested object)
- `operator:` is an object with `type:` and `value:` fields
- Array matching uses `Contain` (not `Contains`)
- IsNotNull is expressed as `type: IsNull` + `not: true`

Hand-crafted YAMLs that don't follow this schema will push silently — the server accepts them but drops the rules, resulting in empty segments. Always use `tdx-skills:segment` to translate business logic into valid YAML.

### 3c. Read the solution's example segment spec

Read the calling solution's `references/parent_segment.md` for the list of example segments to create. It specifies segment names, filter rules (as business-logic shorthand), and which attribute columns each segment uses. Translate all filter rules into valid YAML using the schema from `tdx-skills:segment` (loaded in 3b).

### 3d. Present segment list for approval

Show the full list of planned segments with a one-line description of each. Ask:

> Here are the example segments I'll create in the **[folder name]** folder. Shall I proceed, or would you like to add, remove, or rename any?

Wait for approval before creating any YAML files or folders.

### 3e. Create the folder server-side — ALWAYS before writing or pushing any segments

**`folder:` in the segment YAML does NOT control folder placement.** Folder assignment is determined entirely by the **directory structure** — the subdirectory the YAML file lives in.

**Step 1 — Create the folder in Audience Studio:**
```bash
tdx sg folder create "<Parent Segment Name>" "<folder name>"
```

Example:
```bash
tdx sg folder create "Retail Demo" "NBP Examples"
```

**Step 2 — Pull the parent segment** to get the correct directory structure. **Always run it inside `agent_outputs/<project_slug>/`, in a subshell** — `tdx sg pull` creates a `segments/<parent-slug>/` directory relative to the current working directory, and running it anywhere else will scatter a `segments/` folder outside the git-ignored `agent_outputs/` (see `local_outputs.md`).

```bash
( cd agent_outputs/<project_slug> && tdx sg pull "<Parent Segment Name>" -y )
```

This creates `agent_outputs/<project_slug>/segments/<parent-slug>/`. After pull, a subdirectory matching the folder name will exist (or create it manually if it doesn't appear):
```
agent_outputs/<project_slug>/segments/<parent-slug>/
└── <folder name>/   ← subdirectory name must exactly match folder name
    ├── segment-1.yml
    └── ...
```

**Step 3 — Write all segment YAML files into the folder subdirectory**, not the parent segment root.

### 3f. Dry-run before pushing — verify folder placement

Before any live push, run a dry-run on one file to confirm the push summary shows the folder prefix:

```bash
( cd "agent_outputs/<project_slug>/segments/<parent-slug>" && tdx sg push --dry-run "<folder name>/<segment-file>.yml" )
```

The push summary must read `<folder name>/<Segment Name>` — not just `<Segment Name>`. If the folder prefix is missing, the file is in the wrong directory. Do not proceed until the dry-run confirms correct placement.

### 3g. Push each segment one at a time

Push from the parent segment root using explicit relative paths (do not `cd` into the subfolder):

```bash
( cd "agent_outputs/<project_slug>/segments/<parent-slug>" && tdx sg push -y "<folder name>/<segment-file>.yml" )
```

Confirm the push summary shows `<folder name>/<Segment Name>` for each push.

### 3h. Common mistakes to avoid

- **Do not write YAML files at the parent segment root** — segments pushed from root land at root regardless of any `folder:` field in the YAML.
- **Do not rely on the `folder:` YAML field for placement** — it is metadata only; directory structure controls placement.
- **Do not push segments before creating the folder server-side** — the folder must exist before the first push.
- **Do not push segments before the PS attribute block is live** — Audience Studio will reject rules referencing columns not yet in the PS schema.
- **Do not use `behaviors` columns in segment rules** — example segments should only filter on the newly added `attributes` columns.
- **Do not use `rules:` in segment YAML** — the correct top-level key is `rule:`. Using `rules:` causes silent rule drops on push.

---

## Step 4: Update Project State

After all pushes succeed, update `project_state.md`:

- PS attribute block: added (`<N> columns from <sink_database>.<table>`)
- Example audience folder: `<Solution Name> Examples`
- Example segment URLs: list each console URL
- Current phase: Phase 5, Step 1 complete — proceed to documentation files
