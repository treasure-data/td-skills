---
name: engage-segment-builder
description: Build an Engage audience segment from a list of emails or IDs. Use when a user wants to upload a contact list, import emails into a campaign, create a quick list for Engage, or target a specific set of people in an email campaign without manually configuring parent segments. Takes inline emails, a file, or a query and produces a segment visible on the Engage campaign creation page.
---

# Quick List — Fast Audience Upload to Engage

```
User provides emails → TD table → Parent segment → Child segment → Engage campaign page
```

## Steps

### 1. Collect & Deduplicate Emails

Accept inline, from a file, or from a SQL query. Confirm count with user.

### 2. Create Database (if needed)

```bash
tdx db list quick_lists  # check first
tdx api -X POST /v3/database/create/quick_lists
```

### 3. Create Table

```bash
# Pattern: list_YYYYMMDD_HHMMSS
tdx api -X POST /v3/table/create/quick_lists/list_20260227_143052/log
```

### 4. Insert Records

Batch into groups of 100. `time` column is required (use current unix epoch). Fresh log tables don't have an `email` column, so use `SELECT ... VALUES` syntax:

```bash
tdx query -d quick_lists "INSERT INTO list_20260227_143052 SELECT CAST(1709078400 AS BIGINT) AS time, email FROM (VALUES ('alice@example.com'), ('bob@example.com')) AS t(email)"
```

For >500 rows, split across multiple INSERT statements. Verify:

```bash
tdx query -d quick_lists "SELECT count(*) FROM list_20260227_143052"
```

### 5. Create & Run Parent Segment

```yaml
# quick_lists/list_20260227_143052/parent_segment.yml
name: "Quick List 2026-02-27 14:30"
master:
  database: quick_lists
  table: list_20260227_143052
schedule:
  type: none
```

```bash
tdx ps push -y quick_lists/list_20260227_143052/parent_segment.yml
tdx ps run "Quick List 2026-02-27 14:30"
tdx ps view "Quick List 2026-02-27 14:30"  # wait for completion
```

### 6. Create & Push Child Segment

```yaml
# quick_lists/list_20260227_143052/segments/all.yml
name: "All Contacts"
kind: batch
rule:
  type: And
  conditions:
    - type: Value
      attribute: email
      operator:
        type: Contain
        value: ["@"]
```

```bash
tdx sg use "Quick List 2026-02-27 14:30"
tdx sg push -y quick_lists/list_20260227_143052/segments/
```

### 7. Confirm

Report to user: segment path `"Quick List YYYY-MM-DD HH:MM / All Contacts"`, contact count, ready for Engage campaign creation.

## Naming

| Resource | Pattern |
|----------|---------|
| Database | `quick_lists` |
| Table | `list_YYYYMMDD_HHMMSS` |
| Parent segment | `Quick List YYYY-MM-DD HH:MM` |
| Child segment | `All Contacts` |

Use a user-provided name for the parent segment if given.

## Cleanup

```bash
tdx table list "quick_lists.*"
tdx api -X POST /v3/table/delete/quick_lists/<table_name>
tdx ps list "Quick List*"
```

## Error Handling

| Error | Solution |
|-------|----------|
| Database already exists | Ignore, continue |
| Table already exists | New timestamp, retry |
| INSERT fails | Check single-quote escaping, reduce batch size |
| Parent segment run fails | `tdx ps view` for details, verify table has data |
| No `time` column | Ensure all INSERTs include `time` with unix epoch |
