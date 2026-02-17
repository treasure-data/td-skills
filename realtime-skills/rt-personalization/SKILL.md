---
name: rt-personalization
description: Create RT 2.0 Personalization services AND entities that return real-time personalized API responses. Creates both the service configuration (via tdx ps pz) and the actual Personalization entity (via API) with payload definition. Use after RT configuration is complete when user wants to "create RT personalization" or "build personalization API".
---

# RT 2.0 Personalization - Service and Entity Creation

Creates complete RT personalization: service configuration + Personalization entity with payload deployed to Console.

## Prerequisites

- RT configuration complete (`rt-config` skill or `rt-setup-personalization` orchestrator)
- RT status: "ok"
- Key events created
- RT attributes configured
- Parent segment folder exists

## Two-Step Creation Process

**Step 1: Create Personalization Service** (YAML workflow)
- Defines sections, criteria, attributes
- Pushed via `tdx ps push`
- Creates service configuration

**Step 2: Create Personalization Entity** (API workflow)
- Creates actual Personalization in Console
- Defines entry criteria (key event)
- Defines payload (response attributes)
- Visible in TD Console UI

**Both steps required for complete personalization setup.**

## Verify Prerequisites

```bash
# Check RT status
RT_STATUS=$(tdx ps view <ps_id> --json | jq -r '.realtime_config.status')
[ "$RT_STATUS" = "ok" ] || exit 1

# List key events
tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | jq '.data[] | {id, name}'

# List RT attributes
tdx api "/audiences/<ps_id>/realtime_attributes?page[size]=100" --type cdp | \
  jq '.data[] | {id, name, type}'
```

## Step 1: Create Personalization Service

### Gather Requirements

**Ask user:**
1. "What's your personalization use case?"
   - Product recommendations
   - Cart recovery
   - User profile API
   - Content personalization

2. "Which key event should trigger personalization?"
   - List available key events from RT config

3. "Which attributes should be returned?"
   - Multi-select from RT attributes + batch attributes

4. "Do you need audience-based sections?"
   - Yes: Different responses for VIP vs. regular users
   - No: Same response for all users

### Generate Service YAML

**For simple use case (single section):**
```yaml
parent_segment_id: '<ps_id>'
parent_segment_name: '<ps_name>'
personalization_service:
  name: 'product_recommendations'
  description: 'Product recommendation service'
  trigger_event: 'page_view'

  sections:
    - name: 'Default'
      criteria: ''  # Matches all users
      attributes:
        - last_product_viewed
        - browsed_products_list
        - page_views_24h
      batch_segments: []
```

**For multi-section use case:**
```yaml
parent_segment_id: '<ps_id>'
parent_segment_name: '<ps_name>'
personalization_service:
  name: 'vip_personalization'
  description: 'VIP-aware personalization service'
  trigger_event: 'page_view'

  sections:
    - name: 'VIP Customers'
      criteria: 'loyalty_tier = ''VIP'''
      attributes:
        - vip_exclusive_products_list
        - vip_discount_percentage
        - loyalty_points
      batch_segments:
        - vip_members

    - name: 'Regular Customers'
      criteria: ''  # Default fallback
      attributes:
        - browsed_products_list
        - standard_discount
      batch_segments: []
```

**Criteria syntax:**
- Comparison: `>`, `<`, `>=`, `<=`, `=`, `!=`
- Logical: `AND`, `OR`
- Pattern: `LIKE`, `IN ('val1', 'val2')`
- Null: `IS NULL`, `IS NOT NULL`

### Push Service

```bash
cat > pz_service.yaml << 'EOF'
<YAML_CONTENT>
EOF

tdx ps push pz_service.yaml -y

# Verify service created
SERVICE_ID=$(tdx ps pz list <ps_id> --json | jq -r '.[] | select(.name=="<service_name>") | .id')
echo "Service ID: $SERVICE_ID"
```

## Step 2: Create Personalization Entity (Critical!)

**This step creates the actual Personalization visible in Console UI.**

### 2a. Get Parent Segment Folder ID

```bash
FOLDER_ID=$(curl -s "https://api-cdp.treasuredata.com/audiences/<ps_id>/folders" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq -r '.[0].id')

echo "Folder ID: $FOLDER_ID"
```

### 2b. Get Key Event ID

```bash
# Get the key event ID for trigger
KEY_EVENT_ID=$(tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | \
  jq -r '.data[] | select(.name=="<trigger_event_name>") | .id')

echo "Key Event ID: $KEY_EVENT_ID"
```

### 2c. Get RT Attribute IDs

```bash
# List all RT attributes with IDs
tdx api "/audiences/<ps_id>/realtime_attributes?page[size]=100" --type cdp | \
  jq '.data[] | {
    id,
    name,
    type,
    aggregations: [.aggregations[]? | .identifier]
  }' > rt_attributes.json

cat rt_attributes.json
```

**For list attributes**, note the `aggregations[].identifier` value (needed for `subAttributeIdentifier`).

### 2d. Build Attribute Payload

**For single attributes:**
```json
{
  "realtimeAttributeId": "<attr_id>",
  "outputName": "last_product"
}
```

**For list attributes (requires subAttributeIdentifier!):**
```json
{
  "realtimeAttributeId": "<list_attr_id>",
  "subAttributeIdentifier": "items",  # From aggregations[].identifier
  "outputName": "browsed_products"
}
```

**For counter attributes:**
```json
{
  "realtimeAttributeId": "<counter_attr_id>",
  "outputName": "page_view_count"
}
```

### 2e. Create Personalization Entity via API

```bash
PERSONALIZATION_RESPONSE=$(curl -s -X POST \
  'https://api-cdp.treasuredata.com/entities/realtime_personalizations' \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data '{
    "attributes": {
      "audienceId": "<ps_id>",
      "name": "<personalization_name>",
      "description": "<description>",
      "sections": [
        {
          "name": "Default_Section",
          "entryCriteria": {
            "name": "Trigger on <event_name>",
            "description": "Triggered when <event_name> occurs",
            "keyEventCriteria": {
              "keyEventId": "<key_event_id>",
              "keyEventFilters": {
                "type": "And",
                "conditions": []
              }
            },
            "profileCriteria": null
          },
          "payload": {
            "response_node": {
              "type": "ResponseNode",
              "name": "Response",
              "description": "Personalization response payload",
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
                  },
                  {
                    "realtimeAttributeId": "<counter_attr_id>",
                    "outputName": "page_views"
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
          "id": "'"$FOLDER_ID"'",
          "type": "folder-segment"
        }
      }
    }
  }')

# Extract Personalization ID
PERSONALIZATION_ID=$(echo "$PERSONALIZATION_RESPONSE" | jq -r '.data.id')

if [ "$PERSONALIZATION_ID" = "null" ] || [ -z "$PERSONALIZATION_ID" ]; then
  echo "❌ Failed to create Personalization entity"
  echo "$PERSONALIZATION_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Personalization entity created!"
echo "Personalization ID: $PERSONALIZATION_ID"
```

### 2f. Add Static Strings (Optional)

Add static strings to response using `stringBuilder`:

```json
"stringBuilder": [
  {
    "values": [
      {
        "value": "Welcome to our personalized experience!",
        "type": "String"
      }
    ],
    "outputName": "welcome_message"
  }
]
```

### 2g. Add Profile Criteria (Optional)

Filter personalization based on profile attributes:

```json
"profileCriteria": {
  "type": "And",
  "conditions": [
    {
      "type": "RealtimeAttribute",
      "realtimeAttributeId": "<loyalty_tier_attr_id>",
      "operator": {
        "type": "Equal",
        "rightValue": "VIP",
        "not": false
      }
    }
  ]
}
```

## Verify Personalization Created

```bash
# List all personalizations
curl -s "https://api-cdp.treasuredata.com/entities/parent_segments/<ps_id>/realtime_personalizations" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data[] | {
    id,
    name,
    sections_count: (.attributes.sections | length)
  }'

# Get specific personalization
curl -s "https://api-cdp.treasuredata.com/entities/realtime_personalizations/$PERSONALIZATION_ID" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data.attributes | {
    name,
    sections: [.sections[] | .name]
  }'
```

## Console URL

```
https://console-next.us01.treasuredata.com/app/ps/<ps_id>/e/<personalization_id>/p/de
```

Replace `us01` with your region (eu01, ap01, ap02, etc.).

## Test API Endpoint

```bash
# Get API endpoint
REGION="us01"  # or user's region
API_ENDPOINT="https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<personalization_id>"

echo "API Endpoint: $API_ENDPOINT"

# Test call
curl -X GET \
  "${API_ENDPOINT}?td_client_id=test_user_123&event_name=<trigger_event>" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.'
```

**Expected response:**
```json
{
  "last_product": "product_123",
  "browsed_products": ["product_123", "product_456", "product_789"],
  "page_views": 42
}
```

## Integration Code

**JavaScript (Browser):**
```javascript
const API_ENDPOINT = 'https://us01.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<pz_id>';

// Get TD client ID from cookie
const td_client_id = document.cookie.match(/_td=([^;]+)/)?.[1];

fetch(`${API_ENDPOINT}?td_client_id=${td_client_id}&event_name=page_view`)
  .then(r => r.json())
  .then(data => {
    console.log('Personalization:', data);
    // Use data.last_product, data.browsed_products, etc.
  });
```

**Node.js (Server):**
```javascript
const https = require('https');

const options = {
  hostname: 'us01.p13n.in.treasuredata.com',
  path: `/audiences/<ps_id>/personalizations/<pz_id>?td_client_id=${userId}`,
  headers: {
    'Authorization': `TD1 ${process.env.TD_API_KEY}`
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const personalization = JSON.parse(data);
    console.log(personalization);
  });
});
```

## Summary Output

```markdown
✅ RT Personalization Created Successfully!

Service:
  - Name: <service_name>
  - Trigger Event: <event_name>
  - Sections: <section_count>

Entity:
  - Personalization ID: <personalization_id>
  - Sections: <section_names>
  - Attributes: <attribute_count>

API Endpoint:
  https://<region>.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<personalization_id>

Console URL:
  https://console-next.<region>.treasuredata.com/app/ps/<ps_id>/e/<personalization_id>/p/de

Response Fields:
  - <output_name_1> (from <attr_name_1>)
  - <output_name_2> (from <attr_name_2>)
  - <output_name_3> (from <attr_name_3>)

Next Steps:
  1. Test API endpoint with real user IDs
  2. Integrate into web/mobile application
  3. Monitor API response times and errors
```

## Troubleshooting

**Error: "Record not found" when creating entity**
- Missing folder ID or invalid PS ID
- Verify: `curl "https://api-cdp.treasuredata.com/audiences/<ps_id>/folders"`

**Error: Missing subAttributeIdentifier for list attribute**
- List attributes require `subAttributeIdentifier`
- Get from: `tdx api "/audiences/<ps_id>/realtime_attributes/<attr_id>" --type cdp | jq '.data.aggregations[].identifier'`

**Empty API response**
- User not in parent segment (check ID stitching)
- User has no attribute values (check RT processing)
- Verify user exists: Query event tables for user ID

**Service vs. Entity confusion:**
- **Service** (YAML): Configuration, not visible in Console
- **Entity** (API): Actual Personalization, visible in Console
- **Both required** for complete setup

## Key Differences: Service vs. Entity

| Aspect | Service (Step 1) | Entity (Step 2) |
|--------|-----------------|-----------------|
| Creation | `tdx ps push` | API POST |
| Visibility | Not in Console | In Console UI |
| Purpose | Configuration | Deployment |
| Output Names | Uses attribute names | Custom output names |
| Static Strings | No | Yes |
| Required | Optional | **Required** |

**Always create both for production deployments.**
