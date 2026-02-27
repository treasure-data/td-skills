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
- TD_API_KEY environment variable set

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

## Migration from Previous Version

**If you previously created a personalization service (before this update):**

The old skill only created the service configuration (Step 1). The entity (Step 2) was missing, making personalization invisible in Console.

### Check if Entity Exists

```bash
# Detect region
REGION=$(tdx config get endpoint 2>/dev/null | grep -o '[a-z][a-z][0-9][0-9]' | head -1)
REGION="${REGION:-us01}"

# List existing personalizations
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://api-cdp.treasuredata.com/entities/parent_segments/<ps_id>/realtime_personalizations" \
  -H "Authorization: TD1 ${TD_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "$BODY" | jq '.data[] | {id, name}'
else
  echo "❌ Failed to list personalizations (HTTP $HTTP_CODE)"
  echo "$BODY" | jq '.errors[]? | .detail' 2>/dev/null || echo "$BODY"
fi
```

### If Entity is Missing

**Option 1: Run Step 2 Only (Recommended)**
- Skip Step 1 (service already exists)
- Follow Step 2 (sections 2a-2e) to create entity

**Option 2: Recreate Everything**
1. Delete old service: `tdx ps pz delete <ps_id> <service_name>`
2. Run complete skill (Step 1 + Step 2)

### Verify Migration

After creating entity, test API endpoint:
```bash
curl -X GET \
  "https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<pz_id>?td_client_id=test_user" \
  -H "Authorization: TD1 ${TD_API_KEY}"
```

Should return personalized attributes (not 404).

## Verify Prerequisites

```bash
# Detect region from tdx config
REGION=$(tdx config get endpoint 2>/dev/null | grep -o '[a-z][a-z][0-9][0-9]' | head -1)
REGION="${REGION:-us01}"
echo "Using region: $REGION"

# Check RT status
RT_STATUS=$(tdx ps rt list --json | jq -r --arg ps "<ps_id_or_name>" '.[] | select(.id==$ps or .name==$ps) | .status')
[ "$RT_STATUS" = "ok" ] || { echo "❌ RT status: $RT_STATUS (expected: ok)"; exit 1; }

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

### Validate API Key

```bash
# Validate API key is set
if [ -z "$TD_API_KEY" ]; then
  echo "❌ TD_API_KEY environment variable not set"
  echo "Set it with: export TD_API_KEY=your_master_api_key"
  exit 1
fi
```

### 2a. Get Parent Segment Folder ID

```bash
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://api-cdp.treasuredata.com/audiences/<ps_id>/folders" \
  -H "Authorization: TD1 ${TD_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Failed to get folders (HTTP $HTTP_CODE)"
  echo "$BODY" | jq '.errors[]? | .detail' 2>/dev/null || echo "$BODY"
  exit 1
fi

FOLDER_ID=$(echo "$BODY" | jq -r '.[0].id')

if [ "$FOLDER_ID" = "null" ] || [ -z "$FOLDER_ID" ]; then
  echo "❌ No folders found for parent segment"
  echo "Parent segment must have at least one folder"
  exit 1
fi

echo "Folder ID: $FOLDER_ID"
```

### 2b. Get Key Event ID

```bash
KEY_EVENT_NAME="<trigger_event_name>"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://api-cdp.treasuredata.com/audiences/<ps_id>/realtime_key_events" \
  -H "Authorization: TD1 ${TD_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Failed to get key events (HTTP $HTTP_CODE)"
  echo "$BODY" | jq '.errors[]? | .detail' 2>/dev/null || echo "$BODY"
  exit 1
fi

KEY_EVENT_ID=$(echo "$BODY" | jq -r ".data[] | select(.name==\"$KEY_EVENT_NAME\") | .id")

if [ "$KEY_EVENT_ID" = "null" ] || [ -z "$KEY_EVENT_ID" ]; then
  echo "❌ Key event '$KEY_EVENT_NAME' not found"
  echo "Available key events:"
  echo "$BODY" | jq '.data[] | {id, name}'
  exit 1
fi

echo "Key Event ID: $KEY_EVENT_ID"
```

### 2c. Get RT Attribute IDs

```bash
# List all RT attributes with IDs
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://api-cdp.treasuredata.com/audiences/<ps_id>/realtime_attributes?page[size]=100" \
  -H "Authorization: TD1 ${TD_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Failed to get RT attributes (HTTP $HTTP_CODE)"
  echo "$BODY" | jq '.errors[]? | .detail' 2>/dev/null || echo "$BODY"
  exit 1
fi

echo "$BODY" | jq '.data[] | {
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
  "subAttributeIdentifier": "items",
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
# Generate unique payload node ID (matches frontend: crypto.randomUUID())
PAYLOAD_NODE_ID=$(uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]')

# Build payload JSON
cat > personalization_payload.json <<'EOF'
{
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
          "<payload_node_id>": {
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
        "id": "<folder_id>",
        "type": "folder-segment"
      }
    }
  }
}
EOF

# Replace placeholders with actual values
sed -i.bak \
  -e "s/<ps_id>/$PS_ID/g" \
  -e "s/<personalization_name>/$PZ_NAME/g" \
  -e "s/<description>/$PZ_DESC/g" \
  -e "s/<event_name>/$KEY_EVENT_NAME/g" \
  -e "s/<key_event_id>/$KEY_EVENT_ID/g" \
  -e "s/<folder_id>/$FOLDER_ID/g" \
  -e "s/<payload_node_id>/$PAYLOAD_NODE_ID/g" \
  -e "s/<single_attr_id>/$SINGLE_ATTR_ID/g" \
  -e "s/<list_attr_id>/$LIST_ATTR_ID/g" \
  -e "s/<counter_attr_id>/$COUNTER_ATTR_ID/g" \
  personalization_payload.json

# Create personalization entity
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  'https://api-cdp.treasuredata.com/entities/realtime_personalizations' \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data @personalization_payload.json)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  echo "❌ Failed to create Personalization entity (HTTP $HTTP_CODE)"
  echo ""
  echo "Possible causes:"
  echo "  - Invalid folder ID (check parent segment has folders)"
  echo "  - Invalid key event ID (verify key event exists)"
  echo "  - Missing RT attribute IDs (check attributes are configured)"
  echo "  - Invalid attribute payload (check subAttributeIdentifier for list attrs)"
  echo ""
  echo "API Response:"
  echo "$BODY" | jq '.errors[]? | .detail' 2>/dev/null || echo "$BODY"
  exit 1
fi

# Extract Personalization ID
PERSONALIZATION_ID=$(echo "$BODY" | jq -r '.data.id')

if [ "$PERSONALIZATION_ID" = "null" ] || [ -z "$PERSONALIZATION_ID" ]; then
  echo "❌ Failed to extract Personalization ID from response"
  echo "$BODY" | jq '.'
  exit 1
fi

echo "✅ Personalization entity created!"
echo "Personalization ID: $PERSONALIZATION_ID"

# Clean up
rm personalization_payload.json personalization_payload.json.bak 2>/dev/null
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
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://api-cdp.treasuredata.com/entities/parent_segments/<ps_id>/realtime_personalizations" \
  -H "Authorization: TD1 ${TD_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "$BODY" | jq '.data[] | {
    id,
    name,
    sections_count: (.attributes.sections | length)
  }'
else
  echo "❌ Failed to list personalizations (HTTP $HTTP_CODE)"
fi

# Get specific personalization
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://api-cdp.treasuredata.com/entities/realtime_personalizations/$PERSONALIZATION_ID" \
  -H "Authorization: TD1 ${TD_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "$BODY" | jq '.data.attributes | {
    name,
    sections: [.sections[] | .name]
  }'
fi
```

## Console URL

```
https://console-next.<region>.treasuredata.com/app/ps/<ps_id>/e/<personalization_id>/p/de
```

Replace `<region>` with your region (us01, eu01, ap01, ap02, etc.).

## Test API Endpoint

```bash
# Get API endpoint
API_ENDPOINT="https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<personalization_id>"

echo "API Endpoint: $API_ENDPOINT"

# Test call
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "${API_ENDPOINT}?td_client_id=test_user_123&event_name=<trigger_event>" \
  -H "Authorization: TD1 ${TD_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Personalization API working!"
  echo "$BODY" | jq '.'
else
  echo "❌ Personalization API failed (HTTP $HTTP_CODE)"
  echo "$BODY"
fi
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
const REGION = 'us01';  // Change to your region
const API_ENDPOINT = `https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<pz_id>`;

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

const REGION = process.env.TD_REGION || 'us01';
const options = {
  hostname: `${REGION}.p13n.in.treasuredata.com`,
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

# 4. Personalization entity exists
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
