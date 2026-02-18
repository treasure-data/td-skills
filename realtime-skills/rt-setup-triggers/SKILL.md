---
name: rt-setup-triggers
description: Complete workflow to set up RT 2.0 triggers (RT journeys) from scratch - validates parent segment RT status, discovers event tables and attributes, configures RT infrastructure (events, attributes, ID stitching), creates RT journey with activations. Use when user wants to "create realtime triggers" or "set up RT journey end-to-end".
---

# RT 2.0 Triggers Setup - Complete Workflow

Orchestrates the complete RT triggers/journey setup: parent segment validation → use case discovery → data exploration → RT config → journey creation → activation deployment.

## Prerequisites

- TD CLI installed: `tdx`
- Authenticated: `tdx auth setup`
- Parent segment created in Data Workbench
- Master API key with full permissions
- Webhook endpoint or integration configured (optional)

## Workflow Overview

```
1. Validate Parent Segment (RT enabled?)
2. Use Case Discovery (Welcome? Cart? Purchase?)
3. Data Exploration (Events, Attributes)
4. RT Configuration (Events, Attributes, ID Stitching)
5. Journey Creation (with stages and entry criteria)
6. Activation Creation (webhook, Salesforce, etc.)
7. Journey Launch
8. Testing & Monitoring
```

## Steps 1-7: Same as rt-setup-personalization

Follow steps 1-7 from `rt-setup-personalization` skill:
- Parent segment validation
- Use case discovery
- Attribute exploration
- Event table discovery
- ID stitching definition
- RT configuration deployment

**RT config is identical for both personalization and triggers.**

## Step 8: Create RT Journey

### Validate API Key

```bash
# Validate API key is set
if [ -z "$TD_API_KEY" ]; then
  echo "❌ TD_API_KEY environment variable not set"
  echo "Set it with: export TD_API_KEY=your_master_api_key"
  exit 1
fi
```


### Journey Use Cases

**Ask user:** "What should trigger this journey?"

**Common trigger use cases:**
- **Welcome Journey**: New user registration → Send welcome email
  - Trigger event: user_signup, registration
  - Activation: SendGrid email, Salesforce contact creation

- **Cart Abandonment**: User adds to cart → Send reminder
  - Trigger event: add_to_cart
  - Activation: Email with cart items, webhook to marketing tool

- **High-Value Purchase**: Purchase > $500 → Alert sales team
  - Trigger event: purchase (with filter: amount > 500)
  - Activation: Webhook to CRM, Slack notification

- **Content Engagement**: User views premium content → Trigger upsell
  - Trigger event: content_view
  - Activation: Email campaign, personalized offer

### 8a. Get Segment Folder

```bash
FOLDER_RESPONSE=$(curl -s "https://api-cdp.treasuredata.com/tree/audiences/<ps_id>/segment_folders?page%5Bsize%5D=100" \
  -H "Authorization: TD1 ${TD_API_KEY}")

FOLDER_ID=$(echo "$FOLDER_RESPONSE" | jq -r '.data[0].id')
echo "Folder ID: $FOLDER_ID"
```

### 8b. Create Journey

```bash
JOURNEY_NAME="<use_case>_journey"
JOURNEY_DESC="<use_case> journey description"
REENTRY_MODE="reentry_unless_goal_achieved"

JOURNEY_RESPONSE=$(curl -s "https://api-cdp.treasuredata.com/entities/realtime_journeys" \
  -X POST \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data "{
    \"attributes\": {
      \"audienceId\": \"<ps_id>\",
      \"segmentFolderId\": \"$FOLDER_ID\",
      \"name\": \"$JOURNEY_NAME\",
      \"description\": \"$JOURNEY_DESC\",
      \"reentryMode\": \"$REENTRY_MODE\",
      \"goal\": null,
      \"realtimeJourneyStages\": [
        {
          \"name\": \"Stage 1\"
        }
      ],
      \"state\": \"draft\"
    }
  }")

JOURNEY_ID=$(echo "$JOURNEY_RESPONSE" | jq -r '.data.id')
STAGE_ID=$(echo "$JOURNEY_RESPONSE" | jq -r '.data.attributes.realtimeJourneyStages[0].id')

echo "Journey ID: $JOURNEY_ID"
echo "Stage ID: $STAGE_ID"
```

**Reentry modes:**
- `reentry_unless_goal_achieved`: User can re-enter until goal met (recommended)
- `always_allow_reentry`: User can always re-enter
- `no_reentry`: User enters only once

## Step 9: Create Activation

**Ask user:** "What activation should this journey trigger?"
- Webhook (custom endpoint)
- Salesforce (CRM update)
- SendGrid (email)
- Braze (mobile messaging)

### 9a. Create Authentication

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

### 9b. Create Activation Step

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

### 9c. Configure Custom Payload (Optional)

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

## Step 10: Configure Journey Stage & Entry Criteria

```bash
# Get key event ID for trigger
KEY_EVENT_ID=$(tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | \
  jq -r '.data[] | select(.name=="<trigger_event_name>") | .id')

# Configure stage with entry criteria
STAGE_CONFIG_RESPONSE=$(curl -s "https://api-cdp.treasuredata.com/entities/realtime_journeys/$JOURNEY_ID" \
  -X PATCH \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data "{
    \"attributes\": {
      \"realtimeJourneyStages\": [
        {
          \"id\": \"$STAGE_ID\",
          \"name\": \"Stage 1\",
          \"steps\": {
            \"$STEP_UUID\": {
              \"type\": \"TriggeredActivation\",
              \"journeyActivationStepId\": \"$ACTIVATION_ID\",
              \"next\": null
            }
          },
          \"rootStep\": \"$STEP_UUID\",
          \"entryCriteria\": {
            \"name\": \"Entry Criteria\",
            \"keyEventCriteria\": {
              \"keyEventId\": \"$KEY_EVENT_ID\",
              \"keyEventFilters\": {
                \"type\": \"And\",
                \"conditions\": []
              }
            }
          }
        }
      ]
    }
  }")
```

### Add Event Filters (Optional)

**Filter by field value:**
```json
{
  "type": "And",
  "conditions": [
    {
      "type": "Column",
      "column": "purchase_amount",
      "operator": {
        "not": false,
        "rightValue": 100,
        "type": "GreaterThan"
      }
    }
  ]
}
```

**Multiple conditions:**
```json
{
  "type": "And",
  "conditions": [
    {
      "type": "Column",
      "column": "purchase_amount",
      "operator": {"not": false, "rightValue": 500, "type": "GreaterThan"}
    },
    {
      "type": "Column",
      "column": "country",
      "operator": {"not": false, "rightValue": "US", "type": "Equal"}
    }
  ]
}
```

## Step 11: Wait for RT Infrastructure Ready

```bash
echo "Waiting for RT infrastructure..."
while [ "$(curl -s "https://api-cdp.treasuredata.com/audiences/<ps_id>/realtime_setting" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq -r '.status')" != "ok" ]; do
  echo "RT status: updating..."
  sleep 10
done
echo "✓ RT infrastructure ready"
```

## Step 12: Launch Journey

```bash
LAUNCH_RESPONSE=$(curl -s "https://api-cdp.treasuredata.com/entities/realtime_journeys/$JOURNEY_ID" \
  -X PATCH \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data "{
    \"attributes\": {
      \"state\": \"launched\",
      \"realtimeJourneyStages\": [
        {
          \"id\": \"$STAGE_ID\",
          \"name\": \"Stage 1\",
          \"steps\": {
            \"$STEP_UUID\": {
              \"type\": \"TriggeredActivation\",
              \"journeyActivationStepId\": \"$ACTIVATION_ID\",
              \"next\": null
            }
          },
          \"rootStep\": \"$STEP_UUID\",
          \"entryCriteria\": {
            \"name\": \"Entry Criteria\",
            \"keyEventCriteria\": {
              \"keyEventId\": \"$KEY_EVENT_ID\",
              \"keyEventFilters\": {\"type\": \"And\", \"conditions\": []}
            }
          }
        }
      ]
    }
  }")

JOURNEY_STATE=$(echo "$LAUNCH_RESPONSE" | jq -r '.data.attributes.state')

if [ "$JOURNEY_STATE" = "launched" ]; then
  echo "✅ Journey launched successfully!"
else
  echo "❌ Failed to launch journey"
  exit 1
fi
```

## Step 13: Verify & Test

```bash
# Verify journey status
curl -s "https://api-cdp.treasuredata.com/entities/realtime_journeys/$JOURNEY_ID" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data.attributes | {
    id: .id,
    name: .name,
    state: .state,
    launchedAt: .launchedAt
  }'

# Console URL
REGION="us01"  # or user's region
echo "Console URL:"
echo "https://console-next.${REGION}.treasuredata.com/app/ps/<ps_id>/e/$JOURNEY_ID/rtj/da/je"
```

### Test Journey

**Send test event:**
```sql
-- Insert test event to trigger journey
INSERT INTO <event_db>.<event_table>
VALUES (
  'test_user_123',           -- user_id or td_client_id
  current_timestamp,         -- time
  '<event_name>',            -- event name matching key event
  'test@example.com'         -- additional fields
);
```

**Monitor activation:**
- Navigate to Console URL
- View activation logs
- Check webhook endpoint received data

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
✅ RT Journey Setup Complete!

Parent Segment: <ps_name> (<ps_id>)
Use Case: <use_case>

RT Configuration:
  - Event Tables: <count> configured
  - Key Events: <event_names>
  - RT Attributes: <count> created
  - ID Stitching Keys: <count> configured

Journey:
  - Journey ID: <journey_id>
  - State: launched
  - Trigger Event: <event_name>
  - Reentry Mode: <mode>

Activation:
  - Activation ID: <activation_id>
  - Type: <connector_type>
  - Endpoint: <webhook_url or integration>
  - Retries: 3

Console URL:
  https://console-next.<region>.treasuredata.com/app/ps/<ps_id>/e/<journey_id>/rtj/da/je

Next Steps:
  1. Send test event to verify journey triggers
  2. Monitor activation logs in Console
  3. Verify webhook/integration receives data
```

## Advanced: Multi-Step Journeys

**Chain multiple activations:**
```json
{
  "steps": {
    "step_1_uuid": {
      "type": "TriggeredActivation",
      "journeyActivationStepId": "activation_1_id",
      "next": "step_2_uuid"
    },
    "step_2_uuid": {
      "type": "TriggeredActivation",
      "journeyActivationStepId": "activation_2_id",
      "next": null
    }
  },
  "rootStep": "step_1_uuid"
}
```

**Use case:** Send email → Update CRM → Notify Slack

## Error Handling

**Journey won't launch:**
- Check RT status is "ok"
- Verify all activation steps configured
- Ensure key event ID is valid

**Activation not firing:**
- Verify journey state is "launched"
- Check event matches key event filter
- Verify event arriving in event table: `SELECT * FROM <db>.<table> ORDER BY time DESC LIMIT 10`
- Check activation logs in Console

**Webhook timeout:**
- Increase timeout in `exportAdvancedJson`
- Verify webhook endpoint is reachable
- Check webhook returns 2xx status code

## Journey vs. Personalization Decision

**Use RT Journeys when:**
- Need to trigger external system (webhook, CRM, email)
- Event-driven activations
- One-way data push

**Use RT Personalization when:**
- Need to return data to app in real-time
- API-based data retrieval
- Two-way communication (request → response)

**Can use both together:**
- Journey: Cart abandonment → Send email
- Personalization: Return cart items in API
