# Step 9: Create Activation

**Ask user:** "What activation should this journey trigger?"
- Webhook (custom endpoint)
- Salesforce (CRM update)
- SendGrid (email)
- Braze (mobile messaging)

---

## 9a. Create Authentication

**For webhook:**
```bash
WEBHOOK_URL="<user_webhook_url>"
ACCOUNT_ID="<account_id>"

AUTH_RESPONSE=$(curl -s "https://api.treasuredata.com/v4/streaming_task_auths" \
  -X POST \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/json' \
  --data "{
    \"account_id\": \"$ACCOUNT_ID\",
    \"user_id\": \"user_${ACCOUNT_ID}\",
    \"auth_type\": \"td_webhook_out\",
    \"auth_name\": \"rt_journey_webhook_$(date +%s)\",
    \"direction\": \"out\",
    \"auth\": {
      \"api_key\": \"${TD_API_KEY}\",
      \"url_prefix\": \"$WEBHOOK_URL\"
    }
  }")

CONNECTION_ID=$(echo "$AUTH_RESPONSE" | jq -r '.id')
echo "Connection ID: $CONNECTION_ID"
```

**For other integrations:**
- Salesforce: `auth_type: "salesforce_mc_out"`
- SendGrid: `auth_type: "sendgrid_out"`
- Braze: `auth_type: "braze_out"`

---

## 9b. Create Activation Step

```bash
STEP_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
ACTIVATION_NAME="<use_case>_activation"

ACTIVATION_RESPONSE=$(curl -s "https://api-cdp.treasuredata.com/entities/realtime_journeys/$JOURNEY_ID/activations" \
  -X POST \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data "{
    \"attributes\": {
      \"name\": \"$ACTIVATION_NAME\",
      \"stepUuid\": \"$STEP_UUID\",
      \"connectionId\": \"$CONNECTION_ID\",
      \"connectorType\": \"td_webhook_out\",
      \"connector\": {
        \"exportJson\": \"{\\\"method\\\":\\\"post\\\",\\\"url\\\":\\\"$WEBHOOK_URL\\\",\\\"headers\\\":null,\\\"body\\\":null}\",
        \"exportAdvancedJson\": \"{\\\"webhook_retry_count\\\":3,\\\"webhook_connection_timeout\\\":30,\\\"webhook_read_timeout\\\":30,\\\"webhook_write_timeout\\\":30}\"
      }
    }
  }")

ACTIVATION_ID=$(echo "$ACTIVATION_RESPONSE" | jq -r '.data.id')
echo "Activation ID: $ACTIVATION_ID"
```

---

## 9c. Configure Custom Payload (Optional)

**Add custom headers and body:**
```bash
# Custom request body with user data
CUSTOM_BODY='{"event": "{{event_name}}", "user_id": "{{user_id}}", "email": "{{email}}"}'
CUSTOM_HEADERS='{"Content-Type": "application/json", "X-API-Key": "your-key"}'

# Escape JSON for exportJson
EXPORT_JSON=$(jq -n \
  --arg url "$WEBHOOK_URL" \
  --argjson headers "$CUSTOM_HEADERS" \
  --argjson body "$CUSTOM_BODY" \
  '{method: "post", url: $url, headers: $headers, body: $body}' | jq -c | jq -Rs)
```

**Supported template variables:**
- `{{user_id}}`, `{{email}}`, `{{td_client_id}}`
- `{{event_name}}`, `{{event_time}}`
- RT attribute values: `{{last_product_viewed}}`, `{{cart_value}}`

**Checkpoint:** Activation created and configured with connection credentials.
