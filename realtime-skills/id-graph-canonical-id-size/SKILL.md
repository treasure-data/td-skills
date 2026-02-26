---
name: id-graph-canonical-id-size
description: Query ID graph tables to identify how many individual IDs are stitched to each canonical ID. Canonical Ids with many ids may lead to overstitching.
---

# ID Graph - Canonical ID Size Analysis

This skill is used to debug the id graph being uploaded. We want to know if overstitching is occuring, one way is if there are too many ids mapped to a canonical id. It involves querying the standard ID graph table (typically `ids_updated`) to find cases where canonical ids have an excessive number of ids attached to it. Use when user asks if what are the sizes of the canonical ids.

## Requirements

In order to query the ID graph we must know the parent segment the customer is interested in. A customer may have a number of parent segments so we must ask them to provide the one they are interested in before making a query. A segment ID will be a numeric value like 273509.

The user must also have a correctly configured tdx-skill or the Treasure Data mcp server (@treasuredata/mcp-server) to enable the database lookup.

In addition the api key with appropriate access to the database table should be available and configured.

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
    FROM ids_updated
    CROSS JOIN UNNEST(id_set) AS t(id_value)
)
SELECT
    canonical_id,
    count(DISTINCT id_value) as unique_id_count,
    array_agg(DISTINCT id_value) as all_ids
FROM flattened
GROUP BY canonical_id
ORDER BY unique_id_count DESC;
```

## Troubleshooting

- Ensure the parent segment has RT 2.0 enabled
- Large result sets may need LIMIT clauses for performance