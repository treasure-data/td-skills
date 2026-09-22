---
name: identity
description: Query identity change logs (id_changes, validation_failures) to explore profile creation, merging, evictions, and validation errors
---

# Identity

This skill is used when the user asks about identity stitching, id stitching, or wants to explore real time profiles. It involves querying two tables: `id_changes` (identity graph changes) and `validation_failures` (rejected key/value pairs). Both are updated by the application as events are processed.

Treasure Data's real time service includes creation and management of real time profiles. Profiles are updated based on a stream of event records that contain one or more "id stitching key" properties. The identity of a profile consists of both an internal Rid (real time Id) and one or more stitching keys. The system creates new profiles when the keys are all unique. It updates a profile when a new key is found that was not previously associated with other keys in the record. It can also stitch multiple profiles together when we find that keys in the record exist in two or more existing profiles. We combine the profiles together and the rid with the earliest date is the kept whilst the other profiles are merged and deleted.

Each profile can hold at most 200 associations (IDs + merged profiles). When an incoming event would push a profile past that limit, the lowest-priority associations are evicted to make room and a `profile_ids_evicted` row is written to `id_changes` recording what was removed.

Key/value pairs on incoming events that fail validation (wrong type, empty, not in config, case mismatch, failed regex, in invalid_texts) are excluded from stitching and logged to `validation_failures`. The event is still processed — validation never blocks live traffic.

# Description

## Requirements

In order to query the identity logs we must know the parent segment the customer is interested in. A customer may have a number of parent segments so we must ask them to provide the one they are interested in before making a query. A segment ID will be a numeric value like 411671.

The user must also have a correctly configured tdx-skill or the Treasure Data mcp server (@treasuredata/mcp-server) to enable the database lookup.

In addition the api key with appropriate access to the database table should be available and configured.

## Database

The database name contains the parent segment ID and has this format cdp_audience_394649_rt. This is where you can plug in the parent segment the user gives in the request.

## Personalization-path logging

Identity logging on the event-processing path is enabled for every instance and requires no opt-in. Logging on the personalization request path is off by default because it adds latency to a latency-sensitive path.

To enable it for a specific instance, set the `ATTRIBUTE_REPLICATION_PERSONALIZATION_ENABLED` environment variable to `true` on the personalization Lambda. This is configured per-instance through the provisioner instance change schema (added in RT-1643). The setting can also be toggled via the `enable_sqs_logging_p13n` value in the `EXPERIMENTAL_FEATURES` environment variable, though the provisioner path is preferred.

When enabled, the personalization Lambda emits the same `id_changes` and `validation_failures` records as the event-processing path. When disabled, identity records are accumulated internally but silently discarded before being sent to SQS.

## id_changes table

The id_changes log table is always called id_changes and is in the Parent Segment real time database. Each row records one change to the identity graph.

### Schema

The id_changes table has the following schema. The format of the schema below is:

column name, type, description
time, int, unix timestamp of when the record was logged. Filter with TD_INTERVAL or TD_TIME_RANGE.
event_type, string, always "id" for rows in this table.
reactor_instance_id, string, the real-time instance that emitted the row. Useful for customer support to identify which instance processed the event.
profile_change_type, string, the kind of identity change. One of: "profile_added", "profile_updated_by_stitching", "profile_deleted_by_stitching", or "profile_ids_evicted". See below for details.
current_rid, string, the profile the change happened on, as a UUID v7 string. For example 0199f0ad-13b8-7c3d-9fab-b5fb14ebe7cc
current_id_attributes, array of strings, the IDs carried by the triggering event that were not already on the profile, as keyname:value strings. For example ["customer_id:3001", "email:user@example.com"]. Populated on profile_added, profile_updated_by_stitching, and profile_ids_evicted rows. NULL on profile_deleted_by_stitching rows.
key_values, string, the profile's full association set after the change, comma-separated. For example "customer_id:3001,email:user@example.com,td_client_id:abc123". Populated on profile_added and profile_updated_by_stitching rows. NULL on profile_deleted_by_stitching and profile_ids_evicted rows.
merged_rids, array of strings, the profiles absorbed into current_rid by a merge. Populated on profile_updated_by_stitching rows when a merge occurred. Empty array or NULL otherwise. For example ["019a9e30-8407-76ff-a67b-b1576b72cf12"]
evicted_ids, string, a JSON array of the IDs removed from the profile to stay within the 200-association limit. Populated only on profile_ids_evicted rows. NULL on every other row. For example ["td_client_id:old_cookie_1","td_client_id:old_cookie_2"]
td_rt_tracking_id, string, the tracking ID from the originating event when the event carried one. Otherwise null. Use this column to trace a single event across id_changes, validation_failures, and activations tables.

### Profile change types

profile_added: The event matched no existing profile, so a new one was created. current_id_attributes holds the new profile's IDs. key_values holds the full association set.

profile_updated_by_stitching: The event matched an existing profile, which absorbed the incoming IDs. current_id_attributes holds only the new IDs from the triggering event (not the full set). key_values holds the full association set after the change. merged_rids lists any profiles folded in during a merge. When merged_rids is an empty array, the profile was updated without a merge.

profile_deleted_by_stitching: The profile was removed because a merge folded it into another profile. current_rid is the stale/merged-away RID. current_id_attributes and key_values are NULL because the keys have already been re-pointed to the leader RID.

profile_ids_evicted: Adding the incoming IDs would have exceeded the 200-association limit, so IDs were evicted. evicted_ids lists the removed IDs. current_id_attributes holds the triggering event's IDs (same value as the paired profile_updated_by_stitching row for the same event — use this shared value to pair them). key_values is NULL on this row.

A profile_ids_evicted row is written in addition to the profile_updated_by_stitching row for the same event. Exactly one of profile_added, profile_updated_by_stitching, or profile_deleted_by_stitching is written per triggering event.

### The 200-association limit

A profile stores at most 200 associations. When an incoming event would push a profile past that limit, the lowest-priority associations are evicted. Eviction can discard IDs the profile already held or IDs the incoming event brought — an incoming ID is not guaranteed to win a slot.

Repeated evictions on the same current_rid are the strongest evidence of over-stitching, where a stitching rule is merging unrelated people into one profile. A profile churning at the limit is not storing a coherent identity.

## validation_failures table

The validation_failures table logs key/value pairs on incoming events that failed validation and were excluded from stitching. One row per triggering event — if that event carried several invalid pairs, all of them appear in a single row.

A healthy configuration produces no validation failures. Rows accumulating in this table signal that something upstream (a tracking implementation, a bulk upload, a key name) needs fixing.

### Schema

column name, type, description
time, int, unix timestamp of when the record was logged. Filter with TD_INTERVAL or TD_TIME_RANGE.
event_type, string, always "validation" for rows in this table.
reactor_instance_id, string, the real-time instance that emitted the row.
invalid_keys, array of strings, one element per rejected pair. Each element is a JSON object with key, value, and reason. For example: {"value":"12345","key":"customer_id","reason":"Value is not a string."}. Unnest the array, then extract the fields with json_extract_scalar.
td_rt_tracking_id, string, the tracking ID from the originating event when the event carried one. Otherwise null.

### Validation failure reasons

The reason field on each entry in invalid_keys holds one of the following messages:

"Key is not present in the config file." — The event sent a key name the real-time configuration does not define. Add the key to the configuration, or stop sending it.
"Key name case does not match a configured key." — The key name matches a configured key except for capitalization (e.g. User_ID vs user_id). Correct the case in the tracking code.
"Value is not a string." — The value arrived as a number, boolean, or object. Send identity values as strings.
"Value is empty." — The value was empty, null, or absent. Usually a tracking script reading an attribute before it is populated.
"Value does not meet the valid_regexp for this key." — The value failed the valid_regexp defined on that key.
"Value is included in invalid_texts for this key." — The value matched an entry in invalid_texts for that key (e.g. "null", "undefined" sent as literal strings).

## Understanding stitching

### New profiles

When you see profile_change_type is profile_added that means a new profile is created and the new rid will be in current_rid. current_id_attributes holds the IDs from the triggering event. key_values holds the full association set (same as current_id_attributes for new profiles).

### Updated profiles

When profile_change_type is profile_updated_by_stitching, an existing profile was updated. current_id_attributes holds only the new IDs from the triggering event that were not already on the profile. key_values holds the full association set after the update. If merged_rids is an empty array, the profile was updated without a merge.

### Merged profiles

When multiple profiles are merged, there will be a row for each deleted profile and one for the surviving profile.

For each deleted profile the profile_change_type is profile_deleted_by_stitching. current_id_attributes and key_values are NULL.
For the surviving (oldest) profile the profile_change_type is profile_updated_by_stitching and the merged_rids column will have the json array of the absorbed rids. current_id_attributes holds only the new IDs that triggered the merge, not the full set. key_values holds the full set after the merge.

### Evicted profiles (200-association limit)

When profile_change_type is profile_ids_evicted, the profile hit the 200-association cap. evicted_ids contains a JSON array of the IDs that were removed. A paired profile_updated_by_stitching row is written for the same event with the same current_id_attributes value.

To find profiles actively evicting:

```
SELECT
  current_rid,
  COUNT(*) AS eviction_count,
  MIN(TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm:ss', 'GMT')) AS first_eviction,
  MAX(TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm:ss', 'GMT')) AS last_eviction
FROM id_changes
WHERE profile_change_type = 'profile_ids_evicted'
  AND TD_INTERVAL(time, '-1d/now')
GROUP BY current_rid
ORDER BY eviction_count DESC
LIMIT 20
```

## Query tips

If the user does not specify a time range assume the last 24 hours. Use a where clause like `TD_INTERVAL(time, '-1d/now')`

Rather than show the time as a timestamp it is useful to convert it to a human friendly string using TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm:ss', 'GMT'). The user may specify a different time zone.

Sample trino/presto query to get 8 hours of logs:

```
SELECT TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm:ss', 'PST'), *
FROM id_changes
WHERE TD_INTERVAL(time, '-8h/now')
ORDER BY time DESC
```

When you need to access the key value pairs in current_id_attributes the following query helps extract it:

```
WITH data AS (
    SELECT '["customer_id:customer test 4","cookie_id:abcdei"]' AS raw_col
)
SELECT
    map(
        transform(parsed_arr, x -> split_part(x, ':', 1)),
        transform(parsed_arr, x -> split_part(x, ':', 2))
    ) AS kv_map
FROM (
    SELECT CAST(json_parse(raw_col) AS ARRAY(VARCHAR)) AS parsed_arr
    FROM data
)
```

To query validation failures and extract the reason for each rejected key:

```
SELECT
  TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm:ss', 'GMT') AS ts,
  reactor_instance_id,
  td_rt_tracking_id,
  json_extract_scalar(invalid_key, '$.key') AS key_name,
  json_extract_scalar(invalid_key, '$.value') AS key_value,
  json_extract_scalar(invalid_key, '$.reason') AS reason
FROM validation_failures
CROSS JOIN UNNEST(CAST(invalid_keys AS ARRAY(JSON))) AS t(invalid_key)
WHERE TD_INTERVAL(time, '-1d/now')
ORDER BY time DESC
```

### Cross-table tracing with td_rt_tracking_id

When an event carries a td_rt_tracking_id, the value appears on every log row that event produced. Use it to trace a single event across tables:

```
SELECT 'id_changes' AS source, profile_change_type AS detail, time
FROM id_changes
WHERE td_rt_tracking_id = '<tracking_id>'
UNION ALL
SELECT 'validation_failures' AS source, 'validation' AS detail, time
FROM validation_failures
WHERE td_rt_tracking_id = '<tracking_id>'
ORDER BY time
```

### Common queries

How many new profiles were created in a time period? Count rows where profile_change_type is profile_added.
How many profiles were merged? Count rows where profile_change_type is profile_updated_by_stitching and merged_rids is not empty.
How many profiles were deleted by merges? Count profile_deleted_by_stitching rows.
How many evictions occurred? Count profile_ids_evicted rows.
Which profiles are over-stitching? Group profile_ids_evicted rows by current_rid and count.
Are any keys being rejected? Query validation_failures — a non-empty table means something needs fixing.

Customers can query by identifier to ask for the history of a profile, in which case you should search the current_id_attributes to identify the rid and then the merge history.
