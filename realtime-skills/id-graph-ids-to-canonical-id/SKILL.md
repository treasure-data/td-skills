---
name: id-graph-ids-to-canonical-id
description: Query ID graph tables to identify how individual IDs map to canonical IDs. Ids with many canonical ids may lead to overstiching.
---

# ID Graph - IDs to Canonical ID

This skill is used to debug the id graph being uploaded. We want to know if overstitching is occuring, one way is if individual ids map to many canonical ids. It involves querying the standard ID graph table (typically `ids_updated`) to find cases where individual IDs appear across multiple canonical ID groups. Use when user asks if ids in id graph belong to many canonical ids.

## Requirements

In order to query the ID graph we must know the parent segment the customer is interested in. A customer may have a number of parent segments so we must ask them to provide the one they are interested in before making a query. A segment ID will be a numeric value like 411671.

The user must also have a correctly configured tdx-skill or the Treasure Data mcp server (@treasuredata/mcp-server) to enable the database lookup.

In addition the api key with appropriate access to the database table should be available and configured.

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
    FROM ids_updated
    CROSS JOIN UNNEST(id_set) AS t(individual_id)
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
ORDER BY canonical_count DESC, individual_id
LIMIT 100;
```