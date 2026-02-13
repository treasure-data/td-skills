---
name: rt-triggers
description: Create RT 2.0 Journeys (Real-Time Triggers) that activate in real-time when specific events occur, triggering activations to external systems via API
---

# RT 2.0 Triggers Setup Skill

**Skill ID**: `tdx-skills:rt-triggers`
**Version**: 2.2.0
**Category**: CDP Real-Time Triggers
**Commands Used**: API calls, `tdx ps`, `curl`

## Description

Guides users through creating **RT 2.0 Journeys (Real-Time Triggers)**, which are event-based journeys that activate in real-time when specific events occur. RT Journeys trigger activations to external systems (webhooks, email, CRM) when customers perform specific actions.

**API-Based Creation**: This skill uses the `/entities/realtime_journeys` API endpoint to programmatically create and launch RT journeys.

**Important**: This skill is for **Real-Time Journeys** (event-triggered). For stage-based **Batch Journeys** (journey orchestration), use `tdx journey` commands (see Related Skills below).

## Journey Types in Treasure Data

There are two types of journeys in Treasure Data:

| Type | Entry | Use Case | Workflow | This Skill? |
|------|-------|----------|----------|-------------|
| **RT Journeys** | Event occurrence | Real-time event-triggered activations | API-only (`/entities/realtime_journeys`) | ✅ **Yes** |
| **Batch Journeys** | Segment membership | Stage-based customer journey orchestration | YAML workflow (`tdx journey`) | ❌ No (use `tdx-skills:journey`) |

## When to Use This Skill

Use this skill when you need to:
- Create **real-time event-triggered journeys** for customer engagement
- Send data to external systems **when events occur** (webhooks, Salesforce, etc.)
- Trigger activations **in real-time** (within 3 minutes of event)
- Build simple event → activation flows

**User Intent Patterns**:
- "Set up RT triggers"
- "Create real-time journey"
- "Trigger webhook when user signs up"
- "Send events to webhook in real-time"
- "Trigger Salesforce update on purchase event"

**Do NOT use this skill for**:
- Stage-based customer journeys with multiple stages
- Journey orchestration with wait steps, A/B tests, decision points
- Complex multi-stage workflows
  - ➜ Use `tdx-skills:journey` instead for batch journey orchestration

## Prerequisites

Before running this skill, ensure:
1. **RT Configuration Complete**: Run `tdx-skills:rt-config` first
2. **RT Status**: Parent segment RT status is "ok"
3. **Key Events Created**: At least one key event configured
4. **API Access**: TD API key with journey creation permissions
5. **Webhook/Integration**: (Optional) External endpoint or integration configured

## Skill Instructions

When this skill is invoked, follow these steps systematically:

---

### Phase 1: Prerequisites Validation

#### Step 1.1: Verify RT Configuration Exists

```bash
# Set API variables
export API_KEY="your_td_api_key"
export API_BASE="https://api-cdp.treasuredata.com"
export TD_API_BASE="https://api.treasuredata.com"
export PARENT_SEGMENT_ID="your_parent_segment_id"

# Check RT status
tdx ps view ${PARENT_SEGMENT_ID} --json | jq '.realtime_config.status'
```

**Validation**:
- ✅ Status is `"ok"` → Proceed
- ❌ Status is null, empty, or "updating" → Stop and run `tdx-skills:rt-config` first

**If status is "updating"**, wait for it to become "ok":
```bash
# Poll for status
while true; do
  STATUS=$(curl -s "${API_BASE}/audiences/${PARENT_SEGMENT_ID}/realtime_setting" \
    -H "Authorization: TD1 ${API_KEY}" | jq -r '.status')

  echo "RT Status: $STATUS"
  [ "$STATUS" = "ok" ] && break
  sleep 10
done
```

#### Step 1.2: Get RT Configuration Details

```bash
# Save full RT configuration
tdx ps view ${PARENT_SEGMENT_ID} --json > rt_config.json

# Extract key events
echo "Available Key Events:"
jq -r '.realtime_config.key_events[] | "\(.id): \(.name)"' rt_config.json
```

**Extract**:
- Key event IDs and names (for journey entry criteria)
- RT attribute IDs (for decision points and payload)
- Event tables and key columns

---

### Phase 2: Gather Journey Requirements

Use `AskUserQuestion` to understand the journey use case:

**Question 1**: "What event should trigger this journey?"
- **Header**: "Trigger Event"
- **Options**: Dynamically generate from rt_config.json key events
  ```bash
  # Example options from key events:
  jq -r '.realtime_config.key_events[] |
    {label: .name, description: ("Triggered when " + .name + " event occurs")}' rt_config.json
  ```
- **Example Options**:
  - "page_view - Triggered when page view event occurs"
  - "add_to_cart - Triggered when add to cart event occurs"
  - "newsletter_signup - Triggered when newsletter signup event occurs"

**Question 2**: "What activation should this journey trigger?"
- **Header**: "Activation Type"
- **Options**:
  - **Webhook**: "Send HTTP request to custom endpoint (Recommended)"
  - **Salesforce**: "Update Salesforce Marketing Cloud"
  - **SendGrid**: "Send email via SendGrid"
  - **Braze**: "Send message via Braze"

**Question 3**: "Do you want to filter which events trigger the journey?"
- **Header**: "Event Filtering"
- **Options**:
  - **All events**: "Trigger on every occurrence of this event (Recommended)"
  - **With filters**: "Only trigger when event meets certain conditions"

If "With filters" selected, gather:
- Filter attribute/column name
- Operator (Equal, GreaterThan, LessThan, etc.)
- Filter value

**Question 4**: "How often can a user enter this journey?"
- **Header**: "Reentry Mode"
- **Options**:
  - **Reentry unless goal achieved**: "User can re-enter unless goal is met (Recommended)"
  - **Always allow reentry**: "User can enter multiple times"
  - **No reentry**: "User enters only once"

**Question 5** (if Webhook selected): "What is your webhook URL?"
- Collect webhook endpoint URL
- Optionally collect webhook authentication details

---

### Phase 3: Get Segment Folder

RT Journeys must belong to a folder within the parent segment.

```bash
# Get segment folders
echo "Step 1: Getting segment folders..."
FOLDER_RESPONSE=$(curl -s "${API_BASE}/tree/audiences/${PARENT_SEGMENT_ID}/segment_folders?page%5Bsize%5D=100" \
  -H "Authorization: TD1 ${API_KEY}")

# Extract first folder ID
FOLDER_ID=$(echo "$FOLDER_RESPONSE" | jq -r '.data[0].id')
FOLDER_NAME=$(echo "$FOLDER_RESPONSE" | jq -r '.data[0].name')

echo "✓ Using Folder: $FOLDER_NAME (ID: $FOLDER_ID)"
echo "$FOLDER_ID" > .rt_journey_folder_id
```

**Validation**:
- ✅ Folder ID extracted → Proceed
- ❌ No folders found → Create folder in Console first

---

### Phase 4: Create Authentication (for Webhook/Integrations)

If activation type requires authentication (webhook, Salesforce, etc.), create authentication credentials.

#### For Webhook Authentication

```bash
# Get user inputs
export WEBHOOK_URL="user_provided_webhook_url"
export ACCOUNT_ID="your_account_id"

# Create webhook authentication
echo "Step 2: Creating webhook authentication..."
AUTH_RESPONSE=$(curl -s "${TD_API_BASE}/v4/streaming_task_auths" \
  -X 'POST' \
  -H "Authorization: TD1 ${API_KEY}" \
  -H 'Content-Type: application/json' \
  --data-raw "{
    \"account_id\": \"${ACCOUNT_ID}\",
    \"user_id\": \"user_${ACCOUNT_ID}\",
    \"auth_type\": \"td_webhook_out\",
    \"auth_name\": \"rt_journey_webhook_$(date +%s)\",
    \"direction\": \"out\",
    \"auth\": {
      \"api_key\": \"${API_KEY}\",
      \"url_prefix\": \"${WEBHOOK_URL}\"
    }
  }")

# Extract connection ID
CONNECTION_ID=$(echo "$AUTH_RESPONSE" | jq -r '.id')

if [ "$CONNECTION_ID" = "null" ] || [ -z "$CONNECTION_ID" ]; then
    echo "❌ Error: Failed to create authentication"
    echo "$AUTH_RESPONSE" | jq '.'
    exit 1
fi

echo "✓ Authentication created with Connection ID: $CONNECTION_ID"
echo "$CONNECTION_ID" > .rt_journey_connection_id
```

#### For Other Integrations

For Salesforce, SendGrid, Braze, etc., use appropriate `auth_type`:
- Salesforce: `"salesforce_mc_out"`
- SendGrid: `"sendgrid_out"`
- Braze: `"braze_out"`

Refer to TD integration documentation for auth structure.

---

### Phase 5: Create RT Journey

Create the journey in draft state with basic configuration.

```bash
# Load variables
FOLDER_ID=$(cat .rt_journey_folder_id)

# User inputs from Phase 2
export JOURNEY_NAME="user_provided_journey_name"
export JOURNEY_DESCRIPTION="user_provided_description"
export REENTRY_MODE="reentry_unless_goal_achieved"  # or other option

echo "Step 3: Creating RT Journey..."
JOURNEY_RESPONSE=$(curl -s "${API_BASE}/entities/realtime_journeys" \
  -X 'POST' \
  -H "Authorization: TD1 ${API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data-raw "{
    \"attributes\": {
      \"audienceId\": \"${PARENT_SEGMENT_ID}\",
      \"segmentFolderId\": \"${FOLDER_ID}\",
      \"name\": \"${JOURNEY_NAME}\",
      \"description\": \"${JOURNEY_DESCRIPTION}\",
      \"reentryMode\": \"${REENTRY_MODE}\",
      \"goal\": null,
      \"realtimeJourneyStages\": [
        {
          \"name\": \"Stage 1\"
        }
      ],
      \"state\": \"draft\"
    }
  }")

# Extract IDs
JOURNEY_ID=$(echo "$JOURNEY_RESPONSE" | jq -r '.data.id')
STAGE_ID=$(echo "$JOURNEY_RESPONSE" | jq -r '.data.attributes.realtimeJourneyStages[0].id')

if [ "$JOURNEY_ID" = "null" ] || [ -z "$JOURNEY_ID" ]; then
    echo "❌ Error: Failed to create journey"
    echo "$JOURNEY_RESPONSE" | jq '.'
    exit 1
fi

echo "✓ Journey created with ID: $JOURNEY_ID"
echo "✓ Stage ID: $STAGE_ID"
echo "$JOURNEY_ID" > .rt_journey_id
echo "$STAGE_ID" > .rt_journey_stage_id
```

**Reentry Mode Options**:
- `reentry_unless_goal_achieved` - Default, user can re-enter until goal met
- `always_allow_reentry` - User can always re-enter
- `no_reentry` - User enters only once

---

### Phase 6: Create Activation

Create the activation step that will be triggered when the journey runs.

#### Generate Step UUID

```bash
# Generate UUID for activation step
STEP_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
echo "Generated Step UUID: $STEP_UUID"
echo "$STEP_UUID" > .rt_journey_step_uuid
```

#### Create Webhook Activation

```bash
# Load variables
JOURNEY_ID=$(cat .rt_journey_id)
CONNECTION_ID=$(cat .rt_journey_connection_id)
STEP_UUID=$(cat .rt_journey_step_uuid)

# User inputs
export ACTIVATION_NAME="user_provided_activation_name"
export WEBHOOK_URL="user_provided_webhook_url"

echo "Step 4: Creating webhook activation..."
ACTIVATION_RESPONSE=$(curl -s "${API_BASE}/entities/realtime_journeys/${JOURNEY_ID}/activations" \
  -X 'POST' \
  -H "Authorization: TD1 ${API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data-raw "{
    \"attributes\": {
      \"name\": \"${ACTIVATION_NAME}\",
      \"stepUuid\": \"${STEP_UUID}\",
      \"connectionId\": \"${CONNECTION_ID}\",
      \"connectorType\": \"td_webhook_out\",
      \"connector\": {
        \"exportJson\": \"{\\\"method\\\":\\\"post\\\",\\\"url\\\":\\\"${WEBHOOK_URL}\\\",\\\"headers\\\":null,\\\"body\\\":null}\",
        \"exportAdvancedJson\": \"{\\\"webhook_retry_count\\\":3,\\\"webhook_connection_timeout\\\":30,\\\"webhook_read_timeout\\\":30,\\\"webhook_write_timeout\\\":30}\"
      }
    }
  }")

ACTIVATION_ID=$(echo "$ACTIVATION_RESPONSE" | jq -r '.data.id')

if [ "$ACTIVATION_ID" = "null" ] || [ -z "$ACTIVATION_ID" ]; then
    echo "❌ Error: Failed to create activation"
    echo "$ACTIVATION_RESPONSE" | jq '.'
    exit 1
fi

echo "✓ Activation created with ID: $ACTIVATION_ID"
echo "$ACTIVATION_ID" > .rt_journey_activation_id
```

**Important**: `exportJson` must be an **escaped JSON string**, not a raw object.

**Connector Types**:
- `td_webhook_out` - Webhook
- `salesforce_mc_out` - Salesforce Marketing Cloud
- `sendgrid_out` - SendGrid
- `braze_out` - Braze

#### Advanced Activation Configuration

For more complex activations with custom headers, request body, or payload:

```bash
# With custom headers and body
export CUSTOM_HEADERS='{"Content-Type": "application/json", "X-Custom-Header": "value"}'
export CUSTOM_BODY='{"event": "{{event_name}}", "user_id": "{{user_id}}"}'

# Escape JSON for exportJson
EXPORT_JSON=$(jq -n --arg url "$WEBHOOK_URL" --argjson headers "$CUSTOM_HEADERS" --argjson body "$CUSTOM_BODY" \
  '{method: "post", url: $url, headers: $headers, body: $body}' | jq -c | jq -Rs)

# Create activation with custom config
ACTIVATION_RESPONSE=$(curl -s "${API_BASE}/entities/realtime_journeys/${JOURNEY_ID}/activations" \
  -X 'POST' \
  -H "Authorization: TD1 ${API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data-raw "{
    \"attributes\": {
      \"name\": \"${ACTIVATION_NAME}\",
      \"stepUuid\": \"${STEP_UUID}\",
      \"connectionId\": \"${CONNECTION_ID}\",
      \"connectorType\": \"td_webhook_out\",
      \"connector\": {
        \"exportJson\": ${EXPORT_JSON},
        \"exportAdvancedJson\": \"{\\\"webhook_retry_count\\\":5,\\\"webhook_connection_timeout\\\":60,\\\"webhook_read_timeout\\\":60,\\\"webhook_write_timeout\\\":60}\"
      }
    }
  }")
```

---

### Phase 7: Configure Journey Stage

Link the activation to the journey stage and define entry criteria (which event triggers the journey).

```bash
# Load variables
JOURNEY_ID=$(cat .rt_journey_id)
STAGE_ID=$(cat .rt_journey_stage_id)
ACTIVATION_ID=$(cat .rt_journey_activation_id)
STEP_UUID=$(cat .rt_journey_step_uuid)

# User inputs from Phase 2
export KEY_EVENT_ID="user_selected_key_event_id"
export EVENT_FILTERS="null"  # or JSON filter object if filtering enabled

echo "Step 5: Configuring journey stage..."
STAGE_CONFIG_RESPONSE=$(curl -s "${API_BASE}/entities/realtime_journeys/${JOURNEY_ID}" \
  -X 'PATCH' \
  -H "Authorization: TD1 ${API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data-raw "{
    \"attributes\": {
      \"realtimeJourneyStages\": [
        {
          \"id\": \"${STAGE_ID}\",
          \"name\": \"Stage 1\",
          \"steps\": {
            \"${STEP_UUID}\": {
              \"type\": \"TriggeredActivation\",
              \"journeyActivationStepId\": \"${ACTIVATION_ID}\",
              \"next\": null
            }
          },
          \"rootStep\": \"${STEP_UUID}\",
          \"entryCriteria\": {
            \"name\": \"Entry Criteria\",
            \"keyEventCriteria\": {
              \"keyEventId\": \"${KEY_EVENT_ID}\",
              \"keyEventFilters\": ${EVENT_FILTERS}
            }
          }
        }
      ]
    }
  }")

# Verify configuration
STATUS=$(echo "$STAGE_CONFIG_RESPONSE" | jq -r '.data.id')
if [ "$STATUS" = "null" ] || [ -z "$STATUS" ]; then
    echo "❌ Error: Failed to configure journey stage"
    echo "$STAGE_CONFIG_RESPONSE" | jq '.'
    exit 1
fi

echo "✓ Journey stage configured successfully"
```

#### Event Filters (Optional)

If filtering events, provide a filter object:

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

Example: Only trigger if purchase_amount > 100:
```bash
EVENT_FILTERS='{
  "type": "And",
  "conditions": [{
    "type": "Column",
    "column": "purchase_amount",
    "operator": {
      "not": false,
      "rightValue": 100,
      "type": "GreaterThan"
    }
  }]
}'
```

---

### Phase 8: Wait for RT Infrastructure Ready

Before launching, ensure RT infrastructure is ready to process events.

```bash
echo "Step 6: Waiting for RT infrastructure to be ready..."
TIMEOUT=300  # 5 minutes
ELAPSED=0
POLL_INTERVAL=10

while [ $ELAPSED -lt $TIMEOUT ]; do
  RT_STATUS=$(curl -s "${API_BASE}/audiences/${PARENT_SEGMENT_ID}/realtime_setting" \
    -H "Authorization: TD1 ${API_KEY}" | jq -r '.status')

  echo "[$ELAPSED seconds] RT Status: $RT_STATUS"

  if [ "$RT_STATUS" = "ok" ]; then
    echo "✓ RT infrastructure is ready!"
    break
  fi

  sleep $POLL_INTERVAL
  ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

if [ "$RT_STATUS" != "ok" ]; then
    echo "⚠ Warning: RT status still not 'ok' after ${TIMEOUT} seconds"
    echo "Current status: $RT_STATUS"
    echo "You may need to wait longer before launching"
    exit 1
fi
```

**Typical Wait Time**: 30-90 seconds

---

### Phase 9: Launch Journey

Change journey state from "draft" to "launched" to activate event processing.

```bash
# Load all variables
JOURNEY_ID=$(cat .rt_journey_id)
STAGE_ID=$(cat .rt_journey_stage_id)
ACTIVATION_ID=$(cat .rt_journey_activation_id)
STEP_UUID=$(cat .rt_journey_step_uuid)
KEY_EVENT_ID="user_selected_key_event_id"
EVENT_FILTERS="null"  # or filter object

echo "Step 7: Launching journey..."
LAUNCH_RESPONSE=$(curl -s "${API_BASE}/entities/realtime_journeys/${JOURNEY_ID}" \
  -X 'PATCH' \
  -H "Authorization: TD1 ${API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data-raw "{
    \"attributes\": {
      \"state\": \"launched\",
      \"realtimeJourneyStages\": [
        {
          \"id\": \"${STAGE_ID}\",
          \"name\": \"Stage 1\",
          \"steps\": {
            \"${STEP_UUID}\": {
              \"type\": \"TriggeredActivation\",
              \"journeyActivationStepId\": \"${ACTIVATION_ID}\",
              \"next\": null
            }
          },
          \"rootStep\": \"${STEP_UUID}\",
          \"entryCriteria\": {
            \"name\": \"Entry Criteria\",
            \"keyEventCriteria\": {
              \"keyEventId\": \"${KEY_EVENT_ID}\",
              \"keyEventFilters\": ${EVENT_FILTERS}
            }
          }
        }
      ]
    }
  }")

# Verify launch
JOURNEY_STATE=$(echo "$LAUNCH_RESPONSE" | jq -r '.data.attributes.state')
LAUNCHED_AT=$(echo "$LAUNCH_RESPONSE" | jq -r '.data.attributes.launchedAt')

if [ "$JOURNEY_STATE" = "launched" ]; then
    echo ""
    echo "✅ Journey Successfully Launched!"
    echo "Journey ID: $JOURNEY_ID"
    echo "State: $JOURNEY_STATE"
    echo "Launched At: $LAUNCHED_AT"
    echo ""
    echo "Console URL:"
    echo "https://console-next.us01.treasuredata.com/app/ps/${PARENT_SEGMENT_ID}/e/${JOURNEY_ID}/rtj/da/je"
else
    echo "❌ Error: Failed to launch journey"
    echo "Current state: $JOURNEY_STATE"
    echo "$LAUNCH_RESPONSE" | jq '.'
    exit 1
fi
```

**Important**: When launching, must include complete `realtimeJourneyStages` array. Cannot just set `state: "launched"` alone.

---

### Phase 10: Generate Summary Document

Create a summary document with journey details and testing instructions.

**File**: `RT_JOURNEY_{JOURNEY_NAME}_SUMMARY.md`

```markdown
# RT Journey: {JOURNEY_NAME}

**Journey ID**: {JOURNEY_ID}
**Parent Segment**: {PARENT_SEGMENT_ID}
**Created**: {TIMESTAMP}
**Status**: ✅ Launched

## Configuration

**Trigger Event**: {KEY_EVENT_NAME} (ID: {KEY_EVENT_ID})
**Reentry Mode**: {REENTRY_MODE}
**Activation**: {ACTIVATION_NAME}
**Activation Type**: {CONNECTOR_TYPE}

## Journey Flow

```
{KEY_EVENT_NAME} event → {ACTIVATION_NAME} → End
```

## Entry Criteria

- **Event**: {KEY_EVENT_NAME}
- **Filters**: {EVENT_FILTERS or "None (all events)"}

## Activation Details

**Type**: {CONNECTOR_TYPE}
**Endpoint**: {WEBHOOK_URL or INTEGRATION_DETAILS}
**Retries**: 3
**Timeouts**: 30 seconds

## Console URL

https://console-next.us01.treasuredata.com/app/ps/{PARENT_SEGMENT_ID}/e/{JOURNEY_ID}/rtj/da/je

## Testing

### Send Test Event

To test this journey, send an event to the configured event table:

```sql
-- Insert test event
INSERT INTO {EVENT_TABLE}
VALUES (
  '{TEST_USER_ID}',
  current_timestamp,
  {EVENT_SPECIFIC_COLUMNS}
);
```

### Expected Behavior

1. Event arrives in {EVENT_TABLE}
2. Matches {KEY_EVENT_NAME} key event (ID {KEY_EVENT_ID})
3. User enters journey
4. {ACTIVATION_NAME} activation fires
5. Data sent to {WEBHOOK_URL or INTEGRATION}

### Monitoring

**View Journey Status**:
```bash
curl "${API_BASE}/entities/realtime_journeys/${JOURNEY_ID}" \
  -H "Authorization: TD1 ${API_KEY}" | jq '{
  id: .data.id,
  state: .data.attributes.state,
  launchedAt: .data.attributes.launchedAt
}'
```

**Check Activation Logs** (via Console):
- Navigate to Console URL
- View activation execution logs
- Check delivery status and errors

## IDs Reference

- Journey ID: {JOURNEY_ID}
- Stage ID: {STAGE_ID}
- Activation ID: {ACTIVATION_ID}
- Connection ID: {CONNECTION_ID}
- Step UUID: {STEP_UUID}
- Key Event ID: {KEY_EVENT_ID}

---

**Created**: {TIMESTAMP}
**Status**: ✅ Active
**Maintained By**: {USER_NAME}
```

Write this summary to file:
```bash
cat > RT_JOURNEY_${JOURNEY_NAME// /_}_SUMMARY.md << 'EOF'
{SUMMARY_CONTENT}
EOF

echo "✓ Summary document created: RT_JOURNEY_${JOURNEY_NAME// /_}_SUMMARY.md"
```

---

### Phase 11: Test Journey (Optional)

Provide guidance on testing the journey.

```bash
echo ""
echo "=== Journey Testing ==="
echo ""
echo "To test your journey:"
echo "1. Send a test event to trigger the journey"
echo "2. Monitor the activation logs in Console"
echo "3. Verify the activation delivered data correctly"
echo ""
echo "Example test event SQL:"
echo "INSERT INTO {EVENT_TABLE} VALUES ('{TEST_USER_ID}', current_timestamp, ...);"
echo ""
echo "Monitor journey:"
echo "- Console URL: https://console-next.us01.treasuredata.com/app/ps/${PARENT_SEGMENT_ID}/e/${JOURNEY_ID}/rtj/da/je"
echo "- Check activation logs for delivery status"
echo ""
```

---

## Journey Patterns

### Pattern 1: Simple Webhook Trigger

**Use Case**: Send event data to external system immediately

```
Event → Webhook → End
```

**Configuration**:
- Entry: Any key event
- Filters: None or simple filter
- Activation: Webhook POST

### Pattern 2: Filtered Webhook

**Use Case**: Only trigger for high-value events

```
Event (with filter) → Webhook → End
```

**Configuration**:
- Entry: Key event with filter (e.g., purchase_amount > 100)
- Activation: Webhook with event data

**Event Filter Example**:
```json
{
  "type": "And",
  "conditions": [{
    "type": "Column",
    "column": "purchase_amount",
    "operator": {
      "not": false,
      "rightValue": 100,
      "type": "GreaterThan"
    }
  }]
}
```

### Pattern 3: Multi-Activation (Advanced)

**Use Case**: Trigger multiple systems

```
Event → Activation 1 → Activation 2 → End
```

**Configuration**:
- Create two activations
- Chain them with "next" in steps
- Each activation can target different system

**Steps Configuration**:
```json
{
  "step_uuid_1": {
    "type": "TriggeredActivation",
    "journeyActivationStepId": "activation_id_1",
    "next": "step_uuid_2"
  },
  "step_uuid_2": {
    "type": "TriggeredActivation",
    "journeyActivationStepId": "activation_id_2",
    "next": null
  }
}
```

---

## Error Handling

### Common Errors and Solutions

#### Error: "Record not found" when creating journey

**Cause**: Invalid `segmentFolderId`

**Solution**:
```bash
# Verify folder exists
curl "${API_BASE}/tree/audiences/${PARENT_SEGMENT_ID}/segment_folders" \
  -H "Authorization: TD1 ${API_KEY}" | jq '.data[].id'
```

#### Error: Failed to create authentication

**Cause**: Invalid `auth_type` or missing required auth fields

**Solution**:
- Verify `auth_type` is correct for integration
- Check required fields in auth object
- Ensure URL prefix is valid HTTPS URL

#### Error: Cannot launch - RT status not "ok"

**Cause**: RT infrastructure still updating

**Solution**:
- Wait for status to become "ok"
- Poll `/audiences/{id}/realtime_setting` endpoint
- Typical wait time: 30-90 seconds

#### Error: Activation not firing

**Possible Causes**:
1. Event not matching key event filter
2. Event not arriving in event table
3. Journey not in "launched" state
4. Webhook URL unreachable

**Solution**:
```bash
# 1. Verify journey is launched
curl "${API_BASE}/entities/realtime_journeys/${JOURNEY_ID}" \
  -H "Authorization: TD1 ${API_KEY}" | jq '.data.attributes.state'

# 2. Check RT status
curl "${API_BASE}/audiences/${PARENT_SEGMENT_ID}/realtime_setting" \
  -H "Authorization: TD1 ${API_KEY}" | jq '.status'

# 3. Verify event in table
tdx query "SELECT * FROM {EVENT_TABLE} ORDER BY time DESC LIMIT 10"

# 4. Check activation logs in Console
# Navigate to journey URL and view activation logs
```

---

## API Endpoints Reference

### Journey APIs
- `GET /tree/audiences/{id}/segment_folders` - Get folders
- `POST /entities/realtime_journeys` - Create journey
- `PATCH /entities/realtime_journeys/{id}` - Update/launch journey
- `GET /entities/realtime_journeys/{id}` - Get journey details
- `POST /entities/realtime_journeys/{id}/activations` - Create activation

### Authentication APIs
- `POST /v4/streaming_task_auths` - Create authentication

### RT Configuration APIs
- `GET /audiences/{id}/realtime_setting` - Check RT status

### Base URLs
- **CDP API**: `https://api-cdp.treasuredata.com` (or `.eu01`, `.ap01`, etc.)
- **TD API**: `https://api.treasuredata.com` (or `.eu01`, `.ap01`, etc.)

---

## Console URL Pattern

### RT Journey URL
```
https://console-next.{region}.treasuredata.com/app/ps/{PS_ID}/e/{JOURNEY_ID}/rtj/da/je
```

**Components**:
- `{region}` - us01, eu01, ap01, ap02
- `{PS_ID}` - Parent Segment ID
- `{JOURNEY_ID}` - Journey ID
- `rtj` - Real-Time Journey indicator
- `da` - Design/Architecture view
- `je` - Journey Editor

---

## Related Skills

- **`tdx-skills:journey`** - Batch journey orchestration with YAML workflow
  - Use when: Stage-based customer journeys, multi-step workflows, A/B testing
  - Features: Wait steps, decision points, A/B tests, merge, jump
  - Workflow: `tdx journey pull/push/validate`

- **`tdx-skills:rt-config`** - RT 2.0 configuration setup
  - Prerequisite for this skill
  - Sets up event tables, key events, RT attributes

- **`tdx-skills:rt-personalization`** - RT personalization services
  - Use when: Real-time personalization API responses
  - Features: Section-based personalization, batch segment integration

---

## Batch Journey Reference

For stage-based customer journey orchestration (NOT real-time event triggers), use `tdx journey` commands with YAML workflow:

### Batch Journey Commands

```bash
# Pull journey configurations to YAML
tdx journey pull

# Edit YAML files locally
# segments/my-audience/onboarding-journey.yml

# Validate journey YAML
tdx journey validate

# Push changes to TD
tdx journey push

# Monitor journey statistics
tdx journey stats "Onboarding Journey"
```

### Batch Journey YAML Format

```yaml
type: journey
name: Onboarding Journey
description: New customer onboarding flow
reentry: no_reentry

# Embedded segments (journey-local)
segments:
  entry-customers:
    description: New customers in the last 7 days
    rule:
      type: And
      conditions:
        - type: Value
          attribute: created_date
          operator:
            type: TimeWithinPast
            value: 7
            unit: day

# Journey stages
journeys:
  - stages:
      - name: Welcome
        entry_criteria:
          name: New Users
          segment: entry-customers

        steps:
          # Wait step
          - type: wait
            name: Wait 1 Day
            with:
              duration: 1
              unit: day

          # Activation step
          - type: activation
            name: Send Welcome Email
            with:
              activation: "Salesforce Marketing Cloud"

          # Decision point
          - type: decision_point
            name: Check Email Open
            with:
              branches:
                - name: Opened Email
                  segment: engaged-users
                  next: send_followup
                - name: Did Not Open
                  excluded: true
                  next: send_reminder

          # End step
          - type: end
            name: Stage Complete
```

### Batch Journey Step Types

| Type | Description | Use Case |
|------|-------------|----------|
| `wait` | Pause execution | Wait N days/weeks before next action |
| `activation` | Send to external system | Trigger email, webhook, CRM update |
| `decision_point` | Branch based on segment | Route users based on behavior |
| `ab_test` | Split traffic for testing | Test different approaches |
| `merge` | Rejoin branched paths | Combine split paths |
| `jump` | Go to another journey/stage | Transfer to another workflow |
| `end` | Exit the stage | Complete the flow |

### When to Use Batch Journeys vs RT Journeys

| Feature | RT Journeys (This Skill) | Batch Journeys (`tdx journey`) |
|---------|-------------------------|--------------------------------|
| Entry | Event occurrence | Segment membership |
| Timing | Real-time (< 3 min) | Scheduled batch processing |
| Workflow | API-only | YAML workflow |
| Complexity | Simple (event → activation) | Complex (multi-stage, wait, decisions) |
| Use Case | Trigger webhook on event | Multi-step customer journey |
| Step Types | Activation only | Wait, activation, decision, A/B test, etc. |

---

## Tool Usage Summary

This skill uses the following tools:

- **Bash**: Run API calls, generate UUIDs, poll status
- **AskUserQuestion**: Gather journey requirements and configuration
- **Write**: Generate summary documentation
- **Read**: Read RT configuration for key events

---

## Validation Checklist

Before completing this skill, verify:

- ✅ RT configuration exists and status is "ok"
- ✅ Segment folder ID retrieved
- ✅ Authentication created (if needed)
- ✅ Journey created with valid ID
- ✅ Activation created and linked to journey
- ✅ Journey stage configured with key event entry criteria
- ✅ RT infrastructure ready (status "ok")
- ✅ Journey successfully launched
- ✅ Console URL accessible
- ✅ Summary document generated

---

## Success Criteria

Skill is successful when:
1. ✅ Journey created with valid journey ID
2. ✅ Activation configured and linked to journey
3. ✅ Journey launched (state: "launched")
4. ✅ Console URL accessible
5. ✅ Summary document created
6. ✅ User can access journey in Console
7. ✅ Journey ready to process events

---

**Version**: 2.1.0
**Last Updated**: February 2026
**Maintained By**: RTAM Team
