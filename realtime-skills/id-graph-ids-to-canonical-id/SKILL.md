---
name: id-graph-ids-to-canonical-id
description: Query ID graph tables to identify how individual IDs map to canonical IDs. IDs with many canonical IDs may lead to over-stitching.
---

# ID Graph - IDs to Canonical ID

Detect over-stitching by finding individual IDs that appear across multiple canonical ID groups.

## Requirements

- Parent segment ID with RT 2.0 enabled

## Database

The database name contains the parent segment ID and has this format cdp_audience_411671. This is where you can plug in the parent segment the user gives in the request.

## ids_updated table

The ID graph table is typically called `ids_updated` and is in the Parent Segment real time database. This table contains the canonical ID mappings created by RT 2.0's ID stitching process.

## Schema

The ids_updated table has the following key columns:
- canonical_id, string, the canonical identifier for a group of stitched IDs
- id_set, array(string), array of individual identifiers that belong to this canonical group

## Core Query

The main query to identify individual IDs mapping to multiple canonical IDs:

```sql
WITH flattened_ids AS (
    SELECT
        canonical_id,
        individual_id
    FROM cdp_audience_<parent_segment_id>.ids_updated
    CROSS JOIN UNNEST(id_set) AS t(individual_id)
    WHERE td_interval(time, '-7d')  -- Avoid full table scan
),
id_counts AS (
    SELECT
        individual_id,
        COUNT(DISTINCT canonical_id) as canonical_count,
        ARRAY_AGG(DISTINCT canonical_id) as canonical_ids
    FROM flattened_ids
    GROUP BY individual_id
)
SELECT
    individual_id,
    canonical_count,
    canonical_ids
FROM id_counts
WHERE canonical_count > 1  -- Only show over-stitching cases
ORDER BY canonical_count DESC, individual_id
LIMIT 100;
```