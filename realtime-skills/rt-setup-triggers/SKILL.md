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
- Master API key with full permissions: `export TD_API_KEY=your_key`
- Webhook endpoint or integration configured (optional)

## Workflow Overview

Complete workflow with **checkpoints at each step**.

```
Step 1-7: RT Infrastructure Configuration ✓ (SHARED with rt-setup-personalization)
Step 8: Create RT Journey ✓
Step 9: Create Activation ✓
Step 10: Configure Journey Stage & Entry Criteria ✓
Step 11: Wait for RT Infrastructure Ready ✓
Step 12: Launch Journey ✓
Step 13: Verify & Test ✓
```

---

## Steps 1-7: RT Infrastructure Configuration

**SHARED STEPS** - See [steps/01-07-shared-rt-config.md](./steps/01-07-shared-rt-config.md) which references:
- [rt-setup-personalization/steps/01-02-validate-discovery.md](../rt-setup-personalization/steps/01-02-validate-discovery.md)
- [rt-setup-personalization/steps/03-06-data-exploration.md](../rt-setup-personalization/steps/03-06-data-exploration.md)
- [rt-setup-personalization/steps/07-rt-config.md](../rt-setup-personalization/steps/07-rt-config.md)

### Quick Summary

**Step 1:** Validate parent segment RT status
```bash
tdx ps rt list --json | jq '.[] | select(.id=="<ps_id>") | {id, name, rt_status: .status}'
```

**Step 2:** Use case discovery (Welcome Journey, Cart Abandonment, High-Value Purchase, etc.)

**Steps 3-6:** Data exploration (batch attributes, event tables, ID stitching, RT attributes)

**Step 7:** Configure RT infrastructure
```bash
# Configure event tables, key events, RT attributes, ID stitching
# Wait for RT status "ok"
while [ "$(tdx ps rt list --json | jq -r --arg ps '<ps_id>' '.[] | select(.id==$ps) | .status')" != "ok" ]; do
  sleep 10
done
```

**Checkpoints:**
- ✓ Parent segment validated
- ✓ Use case selected (journey trigger)
- ✓ Event tables configured
- ✓ RT attributes created
- ✓ ID stitching configured
- ✓ RT status is "ok"

---

## Step 8: Create RT Journey

See [steps/08-journey-creation.md](./steps/08-journey-creation.md) for detailed implementation.

### Quick Summary

**Ask user about journey trigger use case:**
- Welcome Journey (user signup → send email)
- Cart Abandonment (add to cart → reminder)
- High-Value Purchase (purchase > $500 → alert sales)

**Create journey:**
```bash
# Get folder
FOLDER_ID=$(curl -s "https://api-cdp.treasuredata.com/tree/audiences/<ps_id>/segment_folders?page%5Bsize%5D=100" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq -r '.data[0].id')

# Create journey in draft state
curl -X POST "https://api-cdp.treasuredata.com/entities/realtime_journeys" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  --data "{
    \"attributes\": {
      \"audienceId\": \"<ps_id>\",
      \"segmentFolderId\": \"$FOLDER_ID\",
      \"name\": \"<use_case>_journey\",
      \"reentryMode\": \"reentry_unless_goal_achieved\",
      \"realtimeJourneyStages\": [{\"name\": \"Stage 1\"}],
      \"state\": \"draft\"
    }
  }"
```

**Checkpoint:** Journey created in draft state.

---

## Step 9: Create Activation

See [steps/09-activation.md](./steps/09-activation.md) for detailed implementation.

### Quick Summary

**Ask user:** "What activation should this journey trigger?" (Webhook, Salesforce, SendGrid, Braze)

**Create authentication and activation:**
```bash
# Create webhook connection
curl -X POST "https://api.treasuredata.com/v4/streaming_task_auths" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  --data "{\"auth_type\": \"td_webhook_out\", \"auth\": {\"url_prefix\": \"$WEBHOOK_URL\"}}"

# Create activation step
STEP_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl -X POST "https://api-cdp.treasuredata.com/entities/realtime_journeys/$JOURNEY_ID/activations" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  --data "{
    \"attributes\": {
      \"stepUuid\": \"$STEP_UUID\",
      \"connectionId\": \"$CONNECTION_ID\",
      \"connectorType\": \"td_webhook_out\"
    }
  }"
```

**Checkpoint:** Activation created and linked to journey.

---

## Step 10: Configure Journey Stage

See [steps/10-journey-config.md](./steps/10-journey-config.md) for detailed implementation.

### Quick Summary

**Link activation to journey stage with entry criteria:**
```bash
# Get trigger event ID
KEY_EVENT_ID=$(tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | \
  jq -r '.data[] | select(.name=="<trigger_event>") | .id')

# Configure stage
curl -X PATCH "https://api-cdp.treasuredata.com/entities/realtime_journeys/$JOURNEY_ID" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  --data "{
    \"attributes\": {
      \"realtimeJourneyStages\": [{
        \"id\": \"$STAGE_ID\",
        \"steps\": {
          \"$STEP_UUID\": {
            \"type\": \"TriggeredActivation\",
            \"journeyActivationStepId\": \"$ACTIVATION_ID\"
          }
        },
        \"entryCriteria\": {
          \"keyEventCriteria\": {
            \"keyEventId\": \"$KEY_EVENT_ID\",
            \"keyEventFilters\": {\"type\": \"And\", \"conditions\": []}
          }
        }
      }]
    }
  }"
```

**Checkpoint:** Journey stage configured with entry criteria.

---

## Steps 11-13: Launch & Verify

See [steps/11-13-launch-verify.md](./steps/11-13-launch-verify.md) for detailed implementation.

### Quick Summary

**Step 11:** Wait for RT infrastructure ready
```bash
while [ "$(tdx ps rt list --json | jq -r --arg ps '<ps_id>' '.[] | select(.id==$ps) | .status')" != "ok" ]; do
  sleep 10
done
```

**Step 12:** Launch journey
```bash
curl -X PATCH "https://api-cdp.treasuredata.com/entities/realtime_journeys/$JOURNEY_ID" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  --data '{"attributes": {"state": "launched"}}'
```

**Step 13:** Verify and test
```bash
# Verify journey launched
curl "https://api-cdp.treasuredata.com/entities/realtime_journeys/$JOURNEY_ID" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data.attributes.state'
# Expected: "launched"
```

**Console URL:**
```
https://console-next.${REGION}.treasuredata.com/app/ps/<ps_id>/e/<journey_id>/rtj/da/je
```

**Checkpoints:**
- ✓ RT infrastructure ready
- ✓ Journey launched
- ✓ Activation verified
- ✓ Test event triggers activation

---

## Summary

This orchestrator ensures all checkpoints are met:
- Parent segment validated
- Use case discovered (journey trigger)
- RT infrastructure configured (events, attributes, stitching)
- Journey created with stages
- Activation configured (webhook/integration)
- Entry criteria set (trigger event)
- Journey launched and active

For RT Personalization instead, use the `rt-setup-personalization` skill which shares Steps 1-7.

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
