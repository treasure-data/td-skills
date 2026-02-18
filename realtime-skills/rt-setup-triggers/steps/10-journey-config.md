# Step 10: Configure Journey Stage & Entry Criteria

## Get Key Event ID for Trigger

```bash
# Get key event ID for trigger
KEY_EVENT_ID=$(tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | \
  jq -r '.data[] | select(.name=="<trigger_event_name>") | .id')

echo "Trigger Event ID: $KEY_EVENT_ID"
```

---

## Configure Stage with Entry Criteria

```bash
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

echo "✓ Journey stage configured with entry criteria"
```

---

## Add Event Filters (Optional)

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

**Checkpoint:** Journey stage linked to activation, entry criteria configured.
