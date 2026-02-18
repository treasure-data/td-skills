---
name: rt-setup-personalization
description: Complete workflow to set up RT 2.0 personalization from scratch - validates parent segment RT status, discovers event tables and attributes, configures RT infrastructure (events, attributes, ID stitching), creates personalization service, and deploys the personalization entity with payload. Use when user wants to "create realtime setup and build personalization" or "set up RT personalization end-to-end". Includes automatic validation using rt-personalization-validation skill to prevent common API errors.
---

# RT 2.0 Personalization Setup - Complete Workflow

Orchestrates the complete RT personalization setup: parent segment validation → use case discovery → data exploration → RT config → personalization service → personalization entity deployment.

## Prerequisites

- TD CLI installed: `tdx`
- Authenticated: `tdx auth setup`
- Parent segment created in Data Workbench
- Master API key with full permissions: `export TD_API_KEY=your_key`

## Workflow Overview

Complete 9-step workflow. **Each step must complete successfully before proceeding.**

```
Step 1: Validate Parent Segment ✓
Step 2: Use Case Discovery ✓
Step 3: Explore PS Attributes ✓
Step 4: Discover Event Tables ✓
Step 5: Define ID Stitching ✓
Step 6: Define RT Attributes ✓
Step 7: Configure RT Infrastructure ✓ (SHARED with rt-setup-triggers)
Step 8: Create Personalization Service ✓
Step 9: Create Personalization Entity ✓
Step 10: Verify & Test ✓
```

---

## Steps 1-2: Validate & Discover Use Case

See [steps/01-02-validate-discovery.md](./steps/01-02-validate-discovery.md) for detailed implementation.

### Quick Summary

**Step 1:** Validate parent segment exists and check RT status
```bash
# Check RT status
tdx ps rt list --json | jq '.[] | select(.id=="<ps_id>" or .name=="<ps_name>") | {
  id, name, rt_status: .status
}'
```

**Step 2:** Ask user about use case (Web Personalization, Cart Recovery, User Profile API, etc.)

**Checkpoints:**
- ✓ Parent segment ID confirmed
- ✓ RT status validated ("ok" or "not_configured")
- ✓ Use case selected

---

## Steps 3-6: Data Exploration

See [steps/03-06-data-exploration.md](./steps/03-06-data-exploration.md) for detailed implementation.

### Quick Summary

**Step 3:** Explore parent segment batch attributes
```bash
tdx ps view <ps_id> --json | jq '.attributes[] | {name, type}'
```

**Step 4:** Discover streaming event tables
```bash
tdx tables "<event_db>.*" --json | jq -r '.[].name'
```

**Step 5:** Define ID stitching keys (td_client_id, email, canonical_id)

**Step 6:** Define RT attributes based on use case (single, list, counter types)

**Checkpoints:**
- ✓ Batch attributes identified
- ✓ Event tables discovered and selected
- ✓ ID stitching keys defined
- ✓ RT attributes planned (types and aggregations)

---

## Step 7: Configure RT Infrastructure

**SHARED CONFIGURATION** - See [steps/07-rt-config.md](./steps/07-rt-config.md) for complete implementation.

This step is identical for both RT Personalization and RT Triggers.

### Quick Summary

**7a. Configure Event Tables & Key Events**
```bash
# Add event tables
tdx api "/audiences/<ps_id>/realtime_setting" --type cdp -X PATCH --data '{
  "eventTables": [{"database": "<db>", "table": "<table>"}]
}'

# Create key events
tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp -X POST --data '{
  "name": "<event_name>",
  "databaseName": "<db>",
  "tableName": "<table>",
  "filterRule": {"type": "And", "conditions": []}
}'
```

**7b. Configure ID Stitching**
```bash
tdx api "/audiences/<ps_id>/realtime_setting" --type cdp -X PATCH --data '{
  "keyColumns": [
    {"name": "td_client_id", "validRegexp": null, "invalidTexts": [], "internal": false}
  ],
  "extLookupKey": "<primary_key>"
}'
```

**7c. Create RT Attributes**
```bash
# Single attribute
tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp -X POST --data '{
  "name": "<attr_name>",
  "type": "single",
  "realtimeKeyEventId": "<key_event_id>",
  "valueColumn": "<column>",
  "dataType": "string",
  "duration": {"value": 1, "unit": "day"}
}'

# List attribute
tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp -X POST --data '{
  "name": "<list_attr>",
  "type": "list",
  "realtimeKeyEventId": "<key_event_id>",
  "idColumn": "<id_column>",
  "maxItems": 100,
  "aggregations": [{
    "name": "items",
    "identifier": "items",
    "column": "<column>",
    "aggregationType": "distinct_list"
  }],
  "duration": {"value": 60, "unit": "day"}
}'

# Counter attribute
tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp -X POST --data '{
  "name": "<counter_attr>",
  "type": "counter",
  "realtimeKeyEventId": "<key_event_id>",
  "counterType": "total",
  "increment": {"type": "const", "value": 1},
  "duration": {"value": 24, "unit": "hour"}
}'
```

**Wait for RT status "ok":**
```bash
while [ "$(tdx ps rt list --json | jq -r --arg ps '<ps_id>' '.[] | select(.id==$ps) | .status')" != "ok" ]; do
  echo "Waiting for RT infrastructure..."
  sleep 10
done
echo "✅ RT infrastructure ready"
```

**Checkpoints:**
- ✓ Event tables configured
- ✓ Key events created
- ✓ ID stitching configured
- ✓ RT attributes created
- ✓ RT status is "ok"

---

## ⚠️ Validation & Common Errors

**CRITICAL:** Personalization entity creation has strict validation rules. The most common error is:

```
Error: "sections[0].payload.node_id.definition.attribute_payload": ["Attribute payload can't be blank"]
```

**Root cause:** Using empty arrays `[]` instead of `null` for unused fields.

**Quick fix:**
```json
// ❌ FAILS
"stringBuilder": []

// ✅ WORKS
"stringBuilder": null
```

**For complete validation rules and error-free templates, use the `rt-personalization-validation` skill.**

---

## Steps 8-9: Create Personalization

See [steps/08-09-personalization.md](./steps/08-09-personalization.md) for detailed implementation.

### Quick Summary

**Step 8:** Create personalization service via tdx
```bash
cat > pz_service.yaml << 'EOF'
parent_segment_id: '<ps_id>'
personalization_service:
  name: '<use_case>_personalization'
  trigger_event: '<key_event_name>'
  sections:
    - name: 'Default'
      criteria: ''
      attributes: [last_product_viewed, page_views_24h]
EOF

tdx ps push pz_service.yaml -y
```

**Step 9:** Create personalization entity via API (with payload)
```bash
# Generate unique payload node ID
PAYLOAD_NODE_ID=$(uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]')

# Get folder ID
FOLDER_ID=$(curl -s "https://api-cdp.treasuredata.com/audiences/<ps_id>/folders" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq -r '.[0].id')

# Create entity
curl -X POST 'https://api-cdp.treasuredata.com/entities/realtime_personalizations' \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data "{
    \"attributes\": {
      \"audienceId\": \"<ps_id>\",
      \"name\": \"<use_case>_personalization\",
      \"sections\": [{
        \"name\": \"Default_Section\",
        \"entryCriteria\": {
          \"keyEventCriteria\": {
            \"keyEventId\": \"<key_event_id>\",
            \"keyEventFilters\": {\"type\": \"And\", \"conditions\": []}
          }
        },
        \"payload\": {
          \"$PAYLOAD_NODE_ID\": {
            \"type\": \"ResponseNode\",
            \"definition\": {
              \"attributePayload\": [
                {\"realtimeAttributeId\": \"<attr_id>\", \"outputName\": \"last_product\"}
              ]
            }
          }
        }
      }]
    },
    \"relationships\": {
      \"parentFolder\": {\"data\": {\"id\": \"<folder_id>\", \"type\": \"folder-segment\"}}
    }
  }"
```

**Checkpoints:**
- ✓ Service created
- ✓ Entity deployed
- ✓ Visible in Console
- ✓ API endpoint available

---

## Step 10: Verification

See [steps/10-verification.md](./steps/10-verification.md) for complete verification checklist.

### Quick Verification

```bash
# 1. RT status is "ok"
tdx ps rt list --json | jq -r --arg ps "<ps_id>" '.[] | select(.id==$ps) | .status'

# 2. Key events exist
tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | jq '.data | length'

# 3. RT attributes exist
tdx api "/audiences/<ps_id>/realtime_attributes?page[size]=100" --type cdp | jq '.data | length'

# 4. API endpoint responds
curl "https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<pz_id>?td_client_id=test" \
  -H "Authorization: TD1 ${TD_API_KEY}"
```

**Console URL:**
```
https://console-next.${REGION}.treasuredata.com/app/ps/<ps_id>/e/<pz_id>/p/de
```

---

## Summary

This orchestrator ensures all checkpoints are met:
- Parent segment validated
- Use case discovered
- Data explored (batch attributes, event tables, IDs)
- RT infrastructure configured (events, attributes, stitching)
- Personalization service created
- Personalization entity deployed
- API endpoint tested

For RT Triggers (Journeys) instead, use the `rt-setup-triggers` skill which shares Steps 1-7.
