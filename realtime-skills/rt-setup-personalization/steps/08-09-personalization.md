# Steps 8-9: Personalization Service & Entity Creation

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

**Checkpoint:** Personalization service created via tdx.

---

## Step 9: Create Personalization Entity (with Payload)

**Critical:** This creates the actual Personalization in Console UI that marketing can see and use.

**⚠️ VALIDATION REQUIRED:** See `rt-personalization-validation` skill for common errors and fixes.

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

**Critical Validation Rules:**
1. ✅ Use `null` not `[]` for unused arrays (stringBuilder, segmentPayload)
2. ✅ At least one of attributePayload/stringBuilder must have content
3. ✅ Generate unique payload node ID using UUID

```bash
# Generate unique payload node ID (matches frontend: crypto.randomUUID())
PAYLOAD_NODE_ID=$(uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]')

PERSONALIZATION_RESPONSE=$(curl -s -X POST \
  'https://api-cdp.treasuredata.com/entities/realtime_personalizations' \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data "{
    \"attributes\": {
      \"audienceId\": \"<ps_id>\",
      \"name\": \"<use_case>_personalization\",
      \"description\": \"RT personalization for <use_case>\",
      \"sections\": [
        {
          \"name\": \"Default_Section\",
          \"entryCriteria\": {
            \"name\": \"Page View Trigger\",
            \"description\": \"Triggered on page view events\",
            \"keyEventCriteria\": {
              \"keyEventId\": \"<key_event_id>\",
              \"keyEventFilters\": {\"type\": \"And\", \"conditions\": []}
            },
            \"profileCriteria\": null
          },
          \"payload\": {
            \"$PAYLOAD_NODE_ID\": {
              \"type\": \"ResponseNode\",
              \"name\": \"Personalization Response\",
              \"description\": \"Return personalized attributes\",
              \"definition\": {
                \"attributePayload\": [
                  {
                    \"realtimeAttributeId\": \"<single_attr_id>\",
                    \"outputName\": \"last_product\"
                  },
                  {
                    \"realtimeAttributeId\": \"<list_attr_id>\",
                    \"subAttributeIdentifier\": \"items\",
                    \"outputName\": \"browsed_products\"
                  }
                ],
                \"segmentPayload\": null,
                \"stringBuilder\": [
                  {
                    \"values\": [{\"value\": \"Welcome!\", \"type\": \"String\"}],
                    \"outputName\": \"welcome_message\"
                  }
                ]
              }
            }
          },
          \"includeSensitive\": false
        }
      ]
    },
    \"relationships\": {
      \"parentFolder\": {
        \"data\": {
          \"id\": \"<folder_id>\",
          \"type\": \"folder-segment\"
        }
      }
    }
  }")

# Validate response
if echo "$PERSONALIZATION_RESPONSE" | jq -e '.errors' > /dev/null 2>&1; then
  echo "❌ ERROR: Personalization creation failed"
  echo "$PERSONALIZATION_RESPONSE" | jq '.errors'

  # Check for common error
  if echo "$PERSONALIZATION_RESPONSE" | grep -q "can't be blank"; then
    echo ""
    echo "💡 Common fix: Check stringBuilder and attributePayload are not empty arrays []"
    echo "   Use null instead: \"stringBuilder\": null"
    echo "   See rt-personalization-validation skill for details"
  fi
  exit 1
fi

PERSONALIZATION_ID=$(echo "$PERSONALIZATION_RESPONSE" | jq -r '.data.id')
echo "✅ Personalization Entity created: ID $PERSONALIZATION_ID"
```

**Console URL:**
```
https://console-next.${REGION}.treasuredata.com/app/ps/<ps_id>/e/<personalization_id>/p/de
```

**Checkpoint:** Personalization entity deployed, visible in Console, API endpoint available.

---

## API Endpoint & Testing

```bash
# Get API endpoint
echo "API Endpoint:"
echo "https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<personalization_id>"

# Test API call
curl -X GET \
  "https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<personalization_id>?td_client_id=test_user" \
  -H "Authorization: TD1 ${TD_API_KEY}"
```

**Expected:** JSON response with personalized attributes (not 404 error).

**Final Checkpoint:** API endpoint tested successfully, personalization fully operational.
