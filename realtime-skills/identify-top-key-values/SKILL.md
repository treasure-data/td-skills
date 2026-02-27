---
name: identify-top-key-values
description: Analyze RT event tables to identify the most common values for stitching keys, helping debug ID distribution and data quality issues
---

# Identify Top Key Values

This skill is used to inspect the actual data flowing into RT 2.0 event tables and analyze the distribution of stitching key values. It helps debug ID stitching issues by showing the most common values for each configured stitching key, including nulls and empty values that might cause problems. This is what's seen in plazma and may not be different than what the rt system ignores by configuration.

Use this skill when you want to understand:
- What ID values are actually present in your event data
- Distribution patterns of stitching keys
- Data quality issues (nulls, test values, invalid formats)

## Requirements

In order to analyze key values we need:
1. **Parent segment ID** - The RT-enabled parent segment to inspect
2. **Correctly configured tdx CLI** or Treasure Data MCP server (@treasuredata/mcp-server)
3. **API key with database access** to query the event tables
4. **Existing RT configuration** with event tables and stitching keys configured

## Process

This skill will:
1. **Inspect RT configuration** to get event tables and stitching keys
2. **Generate dynamic query** based on configured keys
3. **Analyze recent data** (default: last 3 hours) for distribution patterns
4. **Show top values** including nulls and potentially problematic values

## Getting RT Configuration

First, inspect the current RT configuration to understand what to analyze:

```bash
# Get RT configuration via CDP API
tdx api "/audiences/<parent_segment_id>/realtime_setting" --type cdp --method GET
```

## Core Query Template

Based on your RT configuration, generate a query like this example for parent segment 508396:

RT Configuration:
- **eventTables**: `engage_in_app_message.be_users`
- **keyColumns**: `td_client_id`

```sql
-- Most common values in last 3 hours (including nulls/empties)
SELECT
  key_name,
  value,
  event_count
FROM (
  SELECT 'td_client_id' as key_name, td_client_id as value, COUNT(*) as event_count
  FROM engage_in_app_message.be_users
  WHERE td_interval(time, '-3h/now')
  GROUP BY td_client_id
)
ORDER BY event_count DESC
LIMIT 100;
```

## Dynamic Query Generation

For each event table and stitching key combination, add a UNION ALL clause:

```sql
SELECT '<key_name>' as key_name, <key_name> as value, COUNT(*) as event_count
FROM <database>.<table>
WHERE td_interval(time, '-3h/now')
GROUP BY <key_name>
```

## Analysis Variations

### 1. Null/Empty Value Analysis
Focus on missing or invalid values:

```sql
SELECT
  key_name,
  CASE
    WHEN value IS NULL THEN '[NULL]'
    WHEN value = '' THEN '[EMPTY]'
    ELSE value
  END as display_value,
  event_count
FROM (
  -- Your UNION ALL queries here
)
WHERE value IS NULL OR value = '' OR value = 'null' OR value = 'undefined'
ORDER BY event_count DESC;
```

## Related Skills

- **rt-config-id-stitching**: Configure stitching keys and exclude patterns
- **rt-config-setup**: View current RT configuration
- **id-graph-canonical-id-size**: Analyze resulting canonical ID groups
- **id-graph-ids-to-canonical-id**: Check for over-stitching issues