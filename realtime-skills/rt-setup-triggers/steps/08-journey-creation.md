# Step 8: Create RT Journey

## Validate API Key

```bash
# Validate API key is set
if [ -z "$TD_API_KEY" ]; then
  echo "❌ TD_API_KEY environment variable not set"
  echo "Set it with: export TD_API_KEY=your_master_api_key"
  exit 1
fi
```

---

## Journey Use Cases

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

---

## 8a. Get Segment Folder

```bash
FOLDER_RESPONSE=$(curl -s "https://api-cdp.treasuredata.com/tree/audiences/<ps_id>/segment_folders?page%5Bsize%5D=100" \
  -H "Authorization: TD1 ${TD_API_KEY}")

FOLDER_ID=$(echo "$FOLDER_RESPONSE" | jq -r '.data[0].id')
echo "Folder ID: $FOLDER_ID"
```

---

## 8b. Create Journey

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

**Checkpoint:** Journey created in draft state, ready for activation configuration.
