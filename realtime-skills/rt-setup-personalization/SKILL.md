---
name: rt-setup-personalization
description: Complete workflow to set up RT 2.0 personalization from scratch - validates parent segment RT status, discovers event tables and attributes, configures RT infrastructure (events, attributes, ID stitching), creates personalization service, and deploys the personalization entity with payload. Use when user wants to "create realtime setup and build personalization" or "set up RT personalization end-to-end".
---

# RT 2.0 Personalization Setup - Complete Workflow

Orchestrates the complete RT personalization setup: parent segment validation → use case discovery → data exploration → RT config → personalization service → personalization entity deployment.

## Prerequisites

- TD CLI installed: `tdx`
- Authenticated: `tdx auth setup`
- Parent segment created in Data Workbench
- Master API key with full permissions

## Workflow Overview

```
1. Validate Parent Segment (RT enabled?)
2. Use Case Discovery (Web? Cart? Profile?)
3. Data Exploration (Events, Attributes)
4. RT Configuration (Events, Attributes, ID Stitching)
5. Personalization Service Creation
6. Personalization Entity Deployment (with payload)
7. API Integration & Testing
```

## Step 1: Parent Segment Validation

### Check if user provided PS

**If user provided PS ID or name:**
```bash
# Check if PS has RT enabled
tdx ps rt list --json | jq '.[] | select(.id=="<ps_id>" or .name=="<ps_name>") | {
  id, name,
  rt_status: .status,
  event_tables: (.event_tables | length),
  key_events: (.key_events | length)
}'
```

**Expected outputs:**
- `rt_status: "ok"` → RT enabled, proceed to Step 2
- `rt_status: "updating"` → Wait for RT to be ready
- Empty result → PS not RT-enabled. Show error: "RT not enabled for this parent segment. Contact CSM."

**If user did NOT provide PS:**
```bash
# List all RT-enabled parent segments
tdx ps rt list --json
```

**Display to user:**
```bash
# Show RT-enabled parent segments with status
tdx ps rt list --json | jq '.[] | {
  id, name,
  rt_status: .status,
  event_tables: (.event_tables | length),
  key_events: (.key_events | length)
}'
```

**Ask user:** "Which parent segment should we use for RT personalization?"
- Present list of RT-enabled segments
- If none found: "No RT-enabled parent segments. Contact CSM to enable RT."

## Region Detection

```bash
# Detect user's region from tdx config
REGION=$(tdx config get endpoint 2>/dev/null | grep -o '[a-z][a-z][0-9][0-9]' | head -1)
REGION="${REGION:-us01}"
echo "Using region: $REGION"
```


## Step 2: Use Case Discovery

**Ask user:** "What's your RT personalization use case?"

**Common use cases:**
- **Web Personalization**: Show personalized content/recommendations on page load
  - Events: pageviews, product_views
  - Attributes: last_product_viewed, browsed_products_list, page_views_24h

- **Cart Recovery**: Personalized offers when user adds to cart
  - Events: add_to_cart, cart_view
  - Attributes: cart_items_list, cart_value, last_cart_update

- **User Profile API**: Return user profile data in real-time
  - Events: login, session_start
  - Attributes: loyalty_tier, total_purchase_value, lifetime_orders

- **Content Recommendations**: Personalized content based on consumption
  - Events: content_view, video_watch
  - Attributes: viewed_content_list, favorite_categories, watch_time_24h

**Store use case** for attribute/event suggestions in next steps.

## Step 3: Explore Parent Segment Attributes

```bash
# Get all PS attributes (batch layer)
tdx ps view <ps_id> --json | jq '.attributes[] | {
  name, type, description
}' > ps_attributes.json

# Review attributes relevant to use case
cat ps_attributes.json | jq -r '.name'
```

**For Web Personalization use case**, look for:
- Customer tier: `loyalty_tier`, `customer_segment`, `vip_status`
- Demographics: `city`, `country`, `age_group`
- Historical data: `total_purchase_value`, `lifetime_orders`

**Ask user:** "Which batch attributes should be available in personalization responses?"
- Multi-select from discovered attributes
- Suggest relevant attributes based on use case

## Step 4: Discover Streaming Event Tables

```bash
# List databases
tdx databases --json | jq -r '.[].name'

# Ask user for event database
# Then list tables
tdx tables "<event_db>.*" --json | jq -r '.[].name'

# Search for common event patterns
tdx tables "<event_db>.*" --json | jq -r '.[].name' | \
  grep -E '(pageview|page_view|cart|purchase|event|click|view)'
```

**For Web Personalization**, suggest tables like:
- `pageviews`, `page_view`, `web_events`
- `product_views`, `item_views`
- `clicks`, `interactions`

**Get table schema:**
```bash
tdx describe <event_db>.<table> --json | jq '.columns[] | {
  name, type
}'
```

**Ask user:** "Which event tables should RT track?"
- Multi-select from discovered tables
- For each table, ask: "What should this event be called?" (e.g., "page_view")

## Step 5: Define ID Stitching Keys

**Discover ID columns from event schemas:**
```bash
# Find ID-like columns
tdx describe <event_db>.<table> --json | jq -r '.columns[] |
  select(.name | test("id|email|user|client|canonical")) | .name'
```

**Common stitching keys:**
- `td_client_id` (cookie-based, always recommended)
- `email`
- `user_id`, `customer_id`
- `canonical_id` (master ID, recommended as primary key)

**Ask user:** "Which columns should be used for ID stitching?"
- Multi-select discovered ID columns
- Recommend: td_client_id, email, canonical_id
- Ask: "Which should be the primary key?" (suggest canonical_id or most complete)

## Step 6: Define RT Attributes

Based on use case, suggest RT attributes:

**For Web Personalization:**
```yaml
attributes:
  - name: last_product_viewed
    type: single
    source_event: page_view
    source_field: product_id
    aggregation: last

  - name: browsed_products_list
    type: list
    source_event: page_view
    source_field: product_id
    aggregation: distinct_list
    max_items: 100
    expiry_days: 60

  - name: page_views_24h
    type: counter
    source_event: page_view
    aggregation: count
    window_duration: 24h
```

**Ask user:** "Use recommended attributes or customize?"
- Show recommendations based on use case
- Allow customization: add/remove attributes

## Step 7: Create RT Configuration

### Validate API Key

```bash
# Validate API key is set
if [ -z "$TD_API_KEY" ]; then
  echo "❌ TD_API_KEY environment variable not set"
  echo "Set it with: export TD_API_KEY=your_master_api_key"
  exit 1
fi
```


**Call rt-config sub-skills** to configure RT:

### 7a. Configure Event Tables
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

### 7b. Configure ID Stitching
```bash
tdx api "/audiences/<ps_id>/realtime_setting" --type cdp -X PATCH --data '{
  "keyColumns": [
    {"name": "td_client_id", "validRegexp": null, "invalidTexts": [], "internal": false},
    {"name": "email", "validRegexp": null, "invalidTexts": [], "internal": false}
  ],
  "extLookupKey": "<primary_key>"
}'
```

### 7c. Create RT Attributes
```bash
# For each attribute, POST to create
# Single attribute example:
tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp -X POST --data '{
  "name": "<attr_name>",
  "identifier": "<attr_identifier>",
  "type": "single",
  "realtimeKeyEventId": "<key_event_id>",
  "valueColumn": "<column_name>",
  "dataType": "string",
  "duration": {"value": 1, "unit": "day"}
}'

# List attribute example:
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

# Counter attribute example:
tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp -X POST --data '{
  "name": "<counter_attr_name>",
  "type": "counter",
  "realtimeKeyEventId": "<key_event_id>",
  "counterType": "total",
  "increment": {"type": "const", "value": 1},
  "duration": {"value": 24, "unit": "hour"}
}'
```

**Wait for RT status "ok":**
```bash
while [ "$(tdx ps view <ps_id> --json | jq -r '.realtime_config.status')" != "ok" ]; do
  echo "Waiting for RT config..."
  sleep 10
done
```

## Step 8: Create Personalization Service

**Generate service YAML:**
```yaml
parent_segment_id: '<ps_id>'
parent_segment_name: '<ps_name>'
personalization_service:
  name: '<use_case>_personalization'
  description: '<use_case> personalization service'
  trigger_event: '<key_event_name>'

  sections:
    - name: 'VIP Customers'
      criteria: 'loyalty_tier = ''VIP'''
      attributes:
        - last_product_viewed
        - browsed_products_list
        - vip_discount_percentage
      batch_segments: []

    - name: 'Default'
      criteria: ''  # Matches all
      attributes:
        - last_product_viewed
        - page_views_24h
      batch_segments: []
```

**Push service:**
```bash
cat > pz_service.yaml << 'EOF'
<YAML_CONTENT>
EOF

tdx ps push pz_service.yaml -y
```

## Step 9: Create Personalization Entity (with Payload)

**Critical: This creates the actual Personalization in Console UI**

### 9a. Get Parent Segment Folder
```bash
FOLDER_ID=$(curl -s "https://api-cdp.treasuredata.com/audiences/<ps_id>/folders" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq -r '.[0].id')
```

### 9b. Get Key Event and Attribute IDs
```bash
# Get key event ID
KEY_EVENT_ID=$(tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | \
  jq -r '.data[] | select(.name=="<event_name>") | .id')

# Get RT attribute IDs
tdx api "/audiences/<ps_id>/realtime_attributes?page[size]=100" --type cdp | \
  jq '.data[] | {id, name, type}'
```

### 9c. Create Personalization Entity
```bash
PERSONALIZATION_RESPONSE=$(curl -s -X POST \
  'https://api-cdp.treasuredata.com/entities/realtime_personalizations' \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data '{
    "attributes": {
      "audienceId": "<ps_id>",
      "name": "<use_case>_personalization",
      "description": "RT personalization for <use_case>",
      "sections": [
        {
          "name": "Default_Section",
          "entryCriteria": {
            "name": "Page View Trigger",
            "description": "Triggered on page view events",
            "keyEventCriteria": {
              "keyEventId": "<key_event_id>",
              "keyEventFilters": {"type": "And", "conditions": []}
            },
            "profileCriteria": null
          },
          "payload": {
            "response_node": {
              "type": "ResponseNode",
              "name": "Personalization Response",
              "description": "Return personalized attributes",
              "definition": {
                "attributePayload": [
                  {
                    "realtimeAttributeId": "<single_attr_id>",
                    "outputName": "last_product"
                  },
                  {
                    "realtimeAttributeId": "<list_attr_id>",
                    "subAttributeIdentifier": "items",
                    "outputName": "browsed_products"
                  }
                ],
                "segmentPayload": null,
                "stringBuilder": []
              }
            }
          },
          "includeSensitive": false
        }
      ]
    },
    "relationships": {
      "parentFolder": {
        "data": {
          "id": "<folder_id>",
          "type": "folder-segment"
        }
      }
    }
  }')

PERSONALIZATION_ID=$(echo "$PERSONALIZATION_RESPONSE" | jq -r '.data.id')
```

**Console URL:**
```
https://console-next.${REGION}.treasuredata.com/app/ps/<ps_id>/e/<personalization_id>/p/de
```

## Step 10: Verify & Test

```bash
# Verify personalization created
curl -s "https://api-cdp.treasuredata.com/entities/parent_segments/<ps_id>/realtime_personalizations" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data[] | {id, name}'

# Get API endpoint
echo "API Endpoint:"
echo "https://<region>.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<personalization_id>"

# Test API call
curl -X GET \
  "https://<region>.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<personalization_id>?td_client_id=test_user" \
  -H "Authorization: TD1 ${TD_API_KEY}"
```

## Verification Checklist

After setup completes, verify:

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

# 4. Configuration deployed
curl -s "https://api-cdp.treasuredata.com/entities/parent_segments/<ps_id>/realtime_personalizations" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data | length'
# Expected: > 0

# 5. API endpoint responds
curl -X GET "https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<pz_id>?td_client_id=test_user" \
  -H "Authorization: TD1 ${TD_API_KEY}"
# Expected: JSON with attributes (not 404)
```

If any check fails, review the corresponding setup step.

## Summary Output

```markdown
✅ RT Personalization Setup Complete!

Parent Segment: <ps_name> (<ps_id>)
Use Case: <use_case>

RT Configuration:
  - Event Tables: <count> configured
  - Key Events: <event_names>
  - RT Attributes: <count> created
  - Batch Attributes: <count> imported
  - ID Stitching Keys: <count> configured

Personalization:
  - Service: <service_name> (created)
  - Entity: <personalization_id> (deployed)
  - Sections: <section_count>

API Endpoint:
  https://<region>.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<personalization_id>

Console URL:
  https://console-next.<region>.treasuredata.com/app/ps/<ps_id>/e/<personalization_id>/p/de

Next Steps:
  1. Test API endpoint with real user IDs
  2. Integrate into web/mobile app
  3. Monitor activation logs
```

## Error Handling

**RT not enabled:**
```
❌ RT 2.0 is not enabled for this parent segment.
→ Contact your CSM to enable RT 2.0.
```

**No RT-enabled parent segments:**
```
❌ No RT-enabled parent segments found in your account.
→ Contact your CSM to enable RT 2.0 for a parent segment.
```

**RT status "updating":**
```
⚠️  RT configuration is updating. Waiting for status "ok"...
→ This typically takes 30-90 seconds.
```

**Missing event tables:**
```
❌ No streaming event tables found in database "<db>".
→ Verify database name or check if events are being ingested.
```

## For RT Triggers Instead

If user wants **RT Triggers** (journeys) instead of personalization:
- Follow Steps 1-7 (same RT config needed)
- Skip Steps 8-9 (personalization service/entity)
- Create RT Journey via API:

```bash
# Create journey
curl -X POST "https://api-cdp.treasuredata.com/entities/realtime_journeys" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  --data '{
    "attributes": {
      "audienceId": "<ps_id>",
      "segmentFolderId": "<folder_id>",
      "name": "<journey_name>",
      "reentryMode": "reentry_unless_goal_achieved",
      "realtimeJourneyStages": [{"name": "Stage 1"}],
      "state": "draft"
    }
  }'

# Create activation and link to journey
# Launch journey
```

See `rt-triggers` skill for complete journey creation workflow.
