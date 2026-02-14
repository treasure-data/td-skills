---
name: data-dictionary
description: Create complete data dictionary for TD Parent Segment - orchestrates schema extraction, description generation, review, and write-back as single workflow. Use when user asks to create data dictionary, document schema, or generate column descriptions for Treasure Data segments.
disable-model-invocation: true
allowed-tools: Bash(node src/index.js *), Read, Write, Glob
argument-hint: [segment-name]
---

# Data Dictionary: Complete Workflow Orchestrator

Generate and publish complete data dictionary for Treasure Data Parent Segments - from schema extraction through TD write-back.

## Usage

```
/data-dictionary [segment-name]
```

Example:
```
/data-dictionary customer_360
```

If segment name not provided, will list available Parent Segments.

## Workflow Overview

This skill orchestrates 6 sequential stages:

1. **Context Gathering** - Collect business context (industry, company, use cases)
2. **Schema Extraction** - Extract schema from TD Parent Segment with sample data
3. **Description Generation** - Generate AI-powered column descriptions
4. **Review Export** - Export to CSV for human review
5. **Validation** - Validate edited CSV and import back to JSON
6. **Write-back** - Publish descriptions to Treasure Data

Each stage creates artifacts used by subsequent stages. Workflow supports resume from partial runs.

## Stage 1: Context Gathering

**Purpose:** Collect business context to inform description generation.

**Process:** Ask 4 context questions ONE at a time (conversational, not all at once):

1. "What industry is this data from?" (e.g., e-commerce, SaaS, healthcare)
2. "Describe your company/business model briefly"
3. "What is this segment used for?" (default: customer segmentation)
4. "What are the primary use cases?" (e.g., marketing campaigns, analytics, personalization)

**Output:** Context stored in memory for Stage 3.

**Progress:**
```
✅ Stage 1 complete: Context gathered
➡️  Next: Stage 2 (Schema Extraction)
```

## Stage 2: Schema Extraction

**Purpose:** Extract schema from TD Parent Segment with sample data for PII detection.

**Command:**
```bash
node src/index.js extract $SEGMENT --sample
```

Where `$SEGMENT` is the segment name from `$ARGUMENTS[0]`.

**Output:**
```
✅ Stage 2 complete: Schema extracted
📁 Artifacts created:
   - ./schemas/{segment}.json
➡️  Next: Stage 3 (Description Generation)
```

**Error Handling:**
If extraction fails:
- Display error message
- Offer options: [R] Retry | [E] Exit
- If user chooses Retry, re-run extraction command
- If user chooses Exit, stop workflow

**Resume Detection:**
If `./schemas/{segment}.json` already exists:
- Ask: "Schema file found. Resume from Stage 3 or start fresh?"
- If resume: skip to Stage 3
- If fresh: delete schema file and re-run extraction

## Stage 3: Description Generation

**Purpose:** Generate AI-powered column descriptions using Claude.

**API Key Detection:**
Before running generation, check for API key:

```bash
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "API key not found. Using Claude Code mode..."
  USE_CLAUDE_CODE=true
else
  echo "API key detected. Using API mode..."
  USE_CLAUDE_CODE=false
fi
```

**Command (API Mode):**
```bash
node src/index.js generate $SEGMENT
```

**Command (Claude Code Mode):**
```bash
node src/index.js generate $SEGMENT --claude-code
```

In Claude Code mode, the CLI will print instructions for manual generation. Follow those instructions:
1. Read schema file shown in output
2. Use context gathered in Stage 1
3. Generate descriptions following format specified
4. Save to `./descriptions/{segment}-descriptions.json`

**Output:**
```
✅ Stage 3 complete: Descriptions generated
📁 Artifacts created:
   - ./descriptions/{segment}-descriptions.json
➡️  Next: Stage 4 (Review Export)
```

**Error Handling:**
If generation fails:
- Display error message
- Offer options: [R] Retry | [C] Claude Code mode | [E] Exit
- If user chooses Retry, re-run with same mode
- If user chooses Claude Code, re-run with `--claude-code` flag
- If user chooses Exit, stop workflow

**Resume Detection:**
If `./descriptions/{segment}-descriptions.json` already exists:
- Ask: "Descriptions file found. Resume from Stage 4 or regenerate?"
- If resume: skip to Stage 4
- If regenerate: delete descriptions file and re-run generation

## Stage 4: Review Export

**Purpose:** Export descriptions to CSV for human review and editing.

**Command:**
```bash
node src/index.js review $SEGMENT
```

This command will:
1. Export descriptions to `./reviews/{segment}-descriptions.csv`
2. Open CSV file in default spreadsheet application
3. Wait for user to review and edit

**CSV Format:**
6 columns: `table, column, type, source, description, is_pii`

- `table` = table type (`attribute`, `behavior`, `master`)
- `column` = column name
- `type` = data type (may be empty — this is optional and doesn't affect write-back)
- `source` = source database
- `description` = AI-generated description (editable)
- `is_pii` = PII flag (`TRUE`/`FALSE`)

Edit the `description` and `is_pii` columns as needed. Do NOT modify other columns (they are validated as immutable).

**Output:**
```
✅ Stage 4 complete: CSV exported and opened for review
📁 Artifacts created:
   - ./reviews/{segment}-descriptions.csv

Please review and edit the CSV file, then save and close it.
Type "done" when ready to continue.

➡️  Next: Stage 5 (Validation)
```

**Error Handling:**
If export fails:
- Display error message
- Offer options: [R] Retry | [E] Exit
- If user chooses Retry, re-run export command
- If user chooses Exit, stop workflow

If file opening fails (headless system, no default app):
- Log warning but continue
- Display CSV path for manual opening
- Proceed to "Type done when ready" prompt

**Resume Detection:**
If `./reviews/{segment}-descriptions.csv` already exists:
- Ask: "CSV file found. Resume from Stage 5 or re-export?"
- If resume: skip to Stage 5
- If re-export: delete CSV and re-run export

## Stage 5: Validation

**Purpose:** Validate edited CSV and import back to JSON format.

**Command:**
```bash
node src/index.js validate $SEGMENT
```

This command will:
1. Parse CSV file
2. Validate structure, required fields, types, immutable fields
3. Check for schema drift (columns in CSV not in original schema)
4. Display validation summary with segment/table/column counts
5. Prompt for confirmation before proceeding to write-back

**Output (Success):**
```
✅ Stage 5 complete: Validation passed
📁 Validation summary:
   - Segments: 1
   - Tables: 3
   - Columns: 45
   - Status: Ready for write-back

Proceed with write-back? (y/n)

➡️  Next: Stage 6 (Write-back)
```

**Output (Errors Found):**
```
❌ Stage 5 failed: Validation errors found
📁 Error log created:
   - ./reviews/{segment}-descriptions-errors.csv

Please fix errors in CSV and retry validation.

Options: [R] Retry validation | [E] Exit
```

**Error Handling:**
If validation fails:
- Display error count and error log path
- Errors saved to `{segment}-descriptions-errors.csv` with row/column/issue details
- Offer options: [R] Retry (after user fixes CSV) | [E] Exit
- If user chooses Retry, re-run validation command
- If user chooses Exit, stop workflow

**Confirmation Gate:**
After successful validation, require explicit confirmation:
- Display segment/table/column counts
- Ask: "Proceed with write-back? (y/n)"
- If no: stop workflow at Stage 5 (user can manually run writeback later)
- If yes: continue to Stage 6

## Stage 6: Write-back

**Purpose:** Publish descriptions to Treasure Data source tables using the `/v3/table/update-schema` API. Once written, the CDP propagates these descriptions to Parent Segment output tables when the Audience workflow runs. The Knowledge Base tool then returns them as `comment`, enabling Audience Agents to understand column semantics.

**API Endpoint:** `POST /v3/table/update-schema/{database}/{table}`

**Schema Format:** 4-element arrays: `[name, type, alias, description]`
- Element 1: column name
- Element 2: column type (e.g., `string`, `long`, `int`)
- Element 3: alias (set to `null` to preserve existing)
- Element 4: free-text description (no character limit)

**Important:** Do NOT use `/v3/table/update` — that endpoint's 3rd element (alias) only accepts SQL identifiers (lowercase, digits, underscore). The `/v3/table/update-schema` endpoint supports a 4th element for free-text descriptions.

**Auth:** Uses `TD_API_KEY` env var, or auto-detects `TDX_API_KEY__*` env vars. EU endpoint is auto-detected from key naming (e.g., `TDX_API_KEY__TDX_STUDIO_EU01_256` → `api.eu01.treasuredata.com`).

**Table Name Resolution:** The review CSV `table` column contains table types (`attribute`, `behavior`, `master`), not actual TD table names. The writeback command loads the descriptions JSON to resolve actual `(database, table_name)` pairs.

**Dry-run Preview (Required):**
Before actual write-back, run dry-run to preview changes:

```bash
node src/index.js writeback $SEGMENT --dry-run
```

**Output:**
```
Dry-run mode: No changes will be made to TD

Tables to update:
  db_customer_360.customer_master (15 columns)
  db_customer_360.customer_attributes (12 columns)
  db_customer_360.customer_behaviors (18 columns)

Total: 3 tables, 45 columns

Review complete. Proceed with actual write-back? (y/n)
```

**Confirmation Gate:**
Require explicit confirmation after dry-run preview:
- Ask: "Proceed with actual write-back? (y/n)"
- If no: stop workflow (user can manually run writeback later)
- If yes: continue to actual write-back

**Actual Write-back:**
```bash
node src/index.js writeback $SEGMENT
```

**Output (Success):**
```
✅ Stage 6 complete: Write-back successful
📁 Artifacts created:
   - ./snapshots/{segment}-{timestamp}.json (type: before)
   - ./snapshots/{segment}-{timestamp}.json (type: after)

Write-back results:
  ✅ db_customer_360.customer_master (15 columns updated)
  ✅ db_customer_360.customer_attributes (12 columns updated)
  ✅ db_customer_360.customer_behaviors (18 columns updated)

Total: 3/3 tables succeeded

Workflow complete! 🎉

Descriptions will propagate to Parent Segment output tables when the Audience workflow runs next.
Verify with: SHOW COLUMNS FROM {database}.{table} (check Comment column)
```

**Output (Partial Failure):**
```
⚠️  Stage 6 partial success: Some tables failed
📁 Artifacts created:
   - ./snapshots/{segment}-{timestamp}.json (type: before)
   - ./reviews/{segment}-writeback-errors.json

Write-back results:
  ✅ db_customer_360.customer_master (15 columns updated)
  ❌ db_customer_360.customer_attributes (API error: 500)
  ✅ db_customer_360.customer_behaviors (18 columns updated)

Total: 2/3 tables succeeded

Error log: ./reviews/{segment}-writeback-errors.json

Options: [R] Retry failed tables | [V] View errors | [X] Rollback | [E] Exit
```

**Error Handling:**
If write-back fails (partial or complete):
- Display success/failure counts
- Errors saved to `{segment}-writeback-errors.json`
- Offer options:
  - [R] Retry: Re-run writeback for failed tables only
  - [V] View: Display error details from error log
  - [X] Rollback: Restore TD to before snapshot state
  - [E] Exit: Stop workflow

**Rollback Option:**
If user chooses rollback after write-back failure:

```bash
node src/index.js rollback $SEGMENT
```

This will:
1. Load most recent "before" snapshot
2. Restore TD table schemas to pre-write-back state
3. Confirm rollback completion

**Resume Detection:**
If `./snapshots/{segment}*-before.json` exists:
- Ask: "Before snapshot found (write-back already executed). Options:"
  - [C] Continue (skip write-back, workflow already complete)
  - [R] Re-run write-back (creates new snapshots)
  - [X] Rollback (restore to before state)
- If continue: workflow complete
- If re-run: delete snapshots and run write-back
- If rollback: run rollback command, then exit

## Resume Detection (Overall)

When workflow starts, check for existing artifacts to determine position:

```bash
# Check Stage 2 completion
if [ -f "./schemas/$SEGMENT.json" ]; then
  STAGE_2_COMPLETE=true
fi

# Check Stage 3 completion
if [ -f "./descriptions/${SEGMENT}-descriptions.json" ]; then
  STAGE_3_COMPLETE=true
fi

# Check Stage 4 completion
if [ -f "./reviews/${SEGMENT}-descriptions.csv" ]; then
  STAGE_4_COMPLETE=true
fi

# Check Stage 6 completion
if ls ./snapshots/${SEGMENT}*-before.json 1> /dev/null 2>&1; then
  STAGE_6_COMPLETE=true
fi
```

**Resume Logic:**
1. If Stage 6 complete: Workflow already finished, ask to rollback or exit
2. If Stage 4 complete but not 6: Resume from Stage 5 (validation)
3. If Stage 3 complete but not 4: Resume from Stage 4 (review export)
4. If Stage 2 complete but not 3: Resume from Stage 3 (description generation)
5. If nothing complete: Start from Stage 1 (context gathering)

**Resume Prompt:**
```
Found existing artifacts:
  ✅ Stage 2: ./schemas/{segment}.json
  ✅ Stage 3: ./descriptions/{segment}-descriptions.json
  ✅ Stage 4: ./reviews/{segment}-descriptions.csv

Resume from Stage 5 (Validation) or start fresh?
Options: [R] Resume | [F] Fresh start
```

## Progress Tracking

After each stage completes, display:
- Stage number and name
- Completion status (✅ success, ❌ failure, ⚠️ partial)
- Artifacts created with file paths
- Next stage

Example:
```
✅ Stage 3 complete: Descriptions generated
📁 Artifacts created:
   - ./descriptions/customer_360-descriptions.json (45 columns)
➡️  Next: Stage 4 (Review Export)
```

## Error Recovery Summary

Each stage offers context-appropriate recovery options:

| Stage | Error Type | Options |
|-------|-----------|---------|
| 2. Extraction | Command failure | [R] Retry, [E] Exit |
| 3. Generation | API/generation failure | [R] Retry, [C] Claude Code mode, [E] Exit |
| 4. Review Export | Export failure | [R] Retry, [E] Exit |
| 5. Validation | CSV errors | [R] Retry (after fixing CSV), [E] Exit |
| 6. Write-back | Partial/complete failure | [R] Retry failed, [V] View errors, [X] Rollback, [E] Exit |

## Automated Mode

For CI/CD or non-interactive workflows, use skip flags:

**Stage 4 (Review Export):**
```bash
node src/index.js review $SEGMENT --skip-review
```
Exports CSV but doesn't open file or prompt for "done".

**Stage 5 (Validation):**
Confirmation prompt can be skipped by piping "y":
```bash
echo "y" | node src/index.js validate $SEGMENT
```

**Stage 6 (Write-back):**
```bash
node src/index.js writeback $SEGMENT --skip-review
```
Skips all confirmation prompts and proceeds directly.

## Workflow State Artifacts

The workflow uses file system as state store:

| Artifact | Location | Purpose |
|----------|----------|---------|
| Schema JSON | `./schemas/{segment}.json` | Extracted schema with samples |
| Descriptions JSON | `./descriptions/{segment}-descriptions.json` | Generated descriptions |
| CSV Export | `./reviews/{segment}-descriptions.csv` | Human-editable review format |
| CSV Errors | `./reviews/{segment}-descriptions-errors.csv` | Validation error details |
| Before Snapshot | `./snapshots/{segment}-{timestamp}.json` | Pre-write-back state |
| After Snapshot | `./snapshots/{segment}-{timestamp}.json` | Post-write-back state |
| Writeback Errors | `./reviews/{segment}-writeback-errors.json` | Write-back failure details |

All artifacts use segment name as identifier for resume detection.

## Example: Full Workflow Execution

```
User: /data-dictionary customer_360