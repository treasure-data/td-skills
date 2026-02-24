# Steps 11-13: Launch Journey & Verify

## Step 11: Wait for RT Infrastructure Ready

```bash
echo "Waiting for RT infrastructure..."
while [ "$(tdx ps rt list --json | jq -r --arg ps '<ps_id>' '.[] | select(.id==$ps) | .status')" != "ok" ]; do
  echo "RT status: updating..."
  sleep 10
done
echo "✓ RT infrastructure ready"
```

**Checkpoint:** RT infrastructure fully deployed and ready.

---

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

**Checkpoint:** Journey launched and active.

---

## Step 13: Verify & Test

### Verify Journey Status

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
REGION="${REGION:-us01}"
echo "Console URL:"
echo "https://console-next.${REGION}.treasuredata.com/app/ps/<ps_id>/e/$JOURNEY_ID/rtj/da/je"
```

---

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

---

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

# 4. Journey is launched
curl -s "https://api-cdp.treasuredata.com/entities/realtime_journeys/$JOURNEY_ID" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq -r '.data.attributes.state'
# Expected: "launched"
```

If any check fails, review the corresponding setup step.

---

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

---

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

---

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

**Final Checkpoint:** Journey fully operational, activations verified.
