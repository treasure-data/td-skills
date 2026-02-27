---
name: id-graph-canonical-id-size
description: Query ID graph tables to identify how many individual IDs are stitched to each canonical ID. Canonical IDs with many IDs may lead to over-stitching.
---

# ID Graph - Canonical ID Size Analysis

Analyze canonical ID group sizes to identify over-stitching patterns where too many individual IDs are mapped to a single canonical ID.

## Requirements

- Parent segment ID with RT 2.0 enabled

## Database

The database name contains the parent segment ID and has this format cdp_audience_273509. This is where you can plug in the parent segment the user gives in the request.

## ids_updated table

The ID graph table is typically called `ids_updated` and is in the Parent Segment real time database. This table contains the canonical ID mappings created by RT 2.0's ID stitching process.

## Schema

The ids_updated table has the following key columns:
- canonical_id, string, the canonical identifier for a group of stitched IDs
- id_set, array(string), array of individual identifiers that belong to this canonical group

## Core Query

The main query to analyze ID counts per canonical ID:

```sql
WITH flattened AS (
    SELECT
        canonical_id,
        id_value
    FROM cdp_audience_<parent_segment_id>.ids_updated
    CROSS JOIN UNNEST(id_set) AS t(id_value)
    WHERE td_interval(time, '-7d')  -- Avoid full table scan
)
SELECT
    canonical_id,
    count(DISTINCT id_value) as unique_id_count
FROM flattened
GROUP BY canonical_id
ORDER BY unique_id_count DESC
LIMIT 100;
```

## Troubleshooting

- Ensure the parent segment has RT 2.0 enabled
- Large result sets may need LIMIT clauses for performance