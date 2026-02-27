# Step 7: RT Infrastructure Configuration

**SHARED CONFIGURATION** - This step is identical for both RT Personalization and RT Triggers (Journeys).

## Validate API Key

```bash
# Validate API key is set
if [ -z "$TD_API_KEY" ]; then
  echo "❌ TD_API_KEY environment variable not set"
  echo "Set it with: export TD_API_KEY=your_master_api_key"
  exit 1
fi
```

---

## 7a. Configure Event Tables

```bash
# Check if RT config exists
RT_CONFIG_EXISTS=$(tdx ps view <ps_id> --json | jq '.realtime_config != null')

if [ "$RT_CONFIG_EXISTS" = "false" ]; then
  # Initialize new RT config
  tdx ps pz init <ps_id> -o rt_config.yaml
else
  # Pull existing RT config
  tdx ps pull <ps_id> -o rt_config.yaml
fi
```

**Add event tables via API:**
```bash
tdx api "/audiences/<ps_id>/realtime_setting" --type cdp -X PATCH --data '{
  "eventTables": [
    {"database": "<db>", "table": "<table1>"},
    {"database": "<db>", "table": "<table2>"}
  ]
}'
```

**Create key events:**
```bash
# For each event table
tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp -X POST --data '{
  "name": "<event_name>",
  "databaseName": "<db>",
  "tableName": "<table>",
  "description": "<description>",
  "filterRule": {"type": "And", "conditions": []}
}'
```

**Checkpoint:** Event tables added, key events created.

---

## 7b. Configure ID Stitching

```bash
tdx api "/audiences/<ps_id>/realtime_setting" --type cdp -X PATCH --data '{
  "keyColumns": [
    {"name": "td_client_id", "validRegexp": null, "invalidTexts": [], "internal": false},
    {"name": "email", "validRegexp": null, "invalidTexts": [], "internal": false}
  ],
  "extLookupKey": "<primary_key>"
}'
```

**Checkpoint:** ID stitching keys configured, primary key set.

---

## 7c. Create RT Attributes

**Single attribute example:**
```bash
tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp -X POST --data '{
  "name": "<attr_name>",
  "identifier": "<attr_identifier>",
  "type": "single",
  "realtimeKeyEventId": "<key_event_id>",
  "valueColumn": "<column_name>",
  "dataType": "string",
  "duration": {"value": 1, "unit": "day"}
}'
```

**List attribute example:**
```bash
tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp -X POST --data '{
  "name": "<list_attr_name>",
  "type": "list",
  "realtimeKeyEventId": "<key_event_id>",
  "valueColumn": "<column_name>",
  "idColumn": "<column_name>",
  "maxItems": 100,
  "aggregations": [{
    "name": "items",
    "identifier": "items",
    "column": "<column_name>",
    "aggregationType": "distinct_list"
  }],
  "duration": {"value": 60, "unit": "day"}
}'
```

**Counter attribute example:**
```bash
tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp -X POST --data '{
  "name": "<counter_attr_name>",
  "type": "counter",
  "realtimeKeyEventId": "<key_event_id>",
  "counterType": "total",
  "increment": {"type": "const", "value": 1},
  "duration": {"value": 24, "unit": "hour"}
}'
```

**Checkpoint:** RT attributes created (single, list, counter).

---

## Wait for RT Infrastructure Ready

```bash
echo "Waiting for RT infrastructure to be ready..."
while [ "$(tdx ps rt list --json | jq -r --arg ps '<ps_id>' '.[] | select(.id==$ps) | .status')" != "ok" ]; do
  echo "RT status: updating..."
  sleep 10
done
echo "✅ RT infrastructure ready (status: ok)"
```

**Checkpoint:** RT status is "ok", infrastructure fully deployed and ready.

---

## Validation

After Step 7 completes, verify:

```bash
# 1. RT status is "ok"
tdx ps rt list --json | jq -r --arg ps "<ps_id_or_name>" '.[] | select(.id==$ps or .name==$ps) | .status'
# Expected: "ok"

# 2. Key events exist
tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | jq '.data | length'
# Expected: > 0

# 3. RT attributes exist
tdx api "/audiences/<ps_id>/realtime_attributes?page[size]=100" --type cdp | jq '.data | length'
# Expected: > 0
```

**Final Checkpoint:** RT configuration complete and validated.
