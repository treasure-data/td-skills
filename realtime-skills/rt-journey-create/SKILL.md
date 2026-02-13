---
name: rt-journey-create
description: Create RT 2.0 Journeys (event-triggered) that activate when specific events occur, sending real-time data to external systems
---

# RT Journey Creation

Create event-triggered journeys that activate in real-time when specific events occur.

**Note**: This is for **RT Journeys** (event-triggered, API-only). For **Batch Journeys** (stage-based, YAML workflow), use the `journey` skill.

## Journey Types

| Type | Entry | Workflow | This Skill? |
|------|-------|----------|-------------|
| **RT Journeys** | Event occurs | API | ✅ Yes |
| **Batch Journeys** | Segment membership | YAML + `tdx journey` | ❌ No |

## Prerequisites

- RT configuration complete (RT status = "ok")
- Key events configured
- Webhook/activation endpoint ready (optional)

## Quick Start

```bash
# Check RT status
tdx ps view <parent_segment_id> --json | jq '.realtime_config.status'

# List key events
tdx api "/audiences/<parent_segment_id>/realtime_key_events" --type cdp

# Create RT journey
tdx api "/entities/realtime_journeys" --type cdp --method POST --data '{
  "name": "welcome_email",
  "parent_segment_id": 394649,
  "event_name": "registration",
  "activations": [...]
}'
```

## RT Journey Structure

```json
{
  "name": "abandoned_cart_recovery",
  "parent_segment_id": 394649,
  "event_name": "cart_abandon",
  "description": "Send webhook when cart is abandoned",
  "activations": [
    {
      "type": "webhook",
      "name": "cart_recovery_webhook",
      "endpoint": "https://marketing-platform.com/webhooks/cart",
      "method": "POST",
      "payload_template": {
        "user_id": "{{user_id}}",
        "cart_value": "{{cart_value}}",
        "cart_items": "{{cart_items}}"
      }
    }
  ],
  "filters": {
    "cart_value": {
      "operator": "greater_than",
      "value": 50
    }
  }
}
```

## Event Triggers

RT journeys trigger when key events occur:

```bash
# List available key events
tdx api "/audiences/<parent_segment_id>/realtime_key_events" --type cdp

# Create key event
tdx api "/audiences/<parent_segment_id>/realtime_key_events" --type cdp --method POST --data '{
  "name": "high_value_purchase",
  "event_name": "purchase",
  "description": "Purchase over $100",
  "filters": {
    "purchase_amount": {
      "operator": "greater_than",
      "value": 100
    }
  }
}'
```

## Event Filters

Filter which events trigger the journey:

```json
{
  "filters": {
    // Numeric filters
    "purchase_amount": {
      "operator": "greater_than",
      "value": 100
    },

    // String filters
    "product_category": {
      "operator": "equals",
      "value": "electronics"
    },

    // Multiple conditions (AND)
    "cart_value": {
      "operator": "greater_than",
      "value": 50
    },
    "purchase_count_7d": {
      "operator": "equals",
      "value": 0
    }
  }
}
```

## Journey Examples

### Welcome Journey

```json
{
  "name": "welcome_new_users",
  "parent_segment_id": 394649,
  "event_name": "registration",
  "description": "Welcome email for new users",
  "activations": [
    {
      "type": "webhook",
      "endpoint": "https://email-service.com/api/send",
      "payload_template": {
        "template": "welcome",
        "to": "{{email}}",
        "user_name": "{{first_name}}",
        "user_id": "{{user_id}}"
      }
    }
  ]
}
```

### Abandoned Cart

```json
{
  "name": "cart_recovery",
  "parent_segment_id": 394649,
  "event_name": "cart_abandon",
  "filters": {
    "cart_value": {
      "operator": "greater_than",
      "value": 50
    }
  },
  "activations": [
    {
      "type": "email",
      "template_id": "cart_recovery",
      "to": "{{email}}",
      "dynamic_data": {
        "cart_items": "{{cart_items}}",
        "cart_value": "{{cart_value}}",
        "recovery_link": "https://shop.com/cart/{{cart_id}}"
      }
    }
  ]
}
```

### High-Value Purchase

```json
{
  "name": "vip_thank_you",
  "parent_segment_id": 394649,
  "event_name": "purchase",
  "filters": {
    "purchase_amount": {
      "operator": "greater_than",
      "value": 500
    }
  },
  "activations": [
    {
      "type": "salesforce",
      "object": "Contact",
      "operation": "update",
      "field_mapping": {
        "Email": "{{email}}",
        "VIP_Status__c": "true",
        "Last_Purchase_Amount__c": "{{purchase_amount}}",
        "Last_Purchase_Date__c": "{{event_time}}"
      },
      "match_field": "Email"
    }
  ]
}
```

### Product Recommendation

```json
{
  "name": "product_view_recommendation",
  "parent_segment_id": 394649,
  "event_name": "product_view",
  "activations": [
    {
      "type": "webhook",
      "endpoint": "https://recommendation-engine.com/api/trigger",
      "payload_template": {
        "user_id": "{{user_id}}",
        "viewed_product": "{{product_id}}",
        "viewed_category": "{{category}}",
        "recent_products": "{{viewed_products_30d}}",
        "favorite_category": "{{favorite_category}}"
      }
    }
  ]
}
```

### Trial Conversion

```json
{
  "name": "trial_to_paid",
  "parent_segment_id": 394649,
  "event_name": "subscription_start",
  "filters": {
    "plan_type": {
      "operator": "equals",
      "value": "paid"
    }
  },
  "activations": [
    {
      "type": "webhook",
      "endpoint": "https://crm.com/api/events",
      "payload_template": {
        "event": "trial_conversion",
        "user_id": "{{user_id}}",
        "email": "{{email}}",
        "plan": "{{plan_name}}",
        "mrr": "{{monthly_revenue}}"
      }
    }
  ]
}
```

## Manage RT Journeys

```bash
# List RT journeys
tdx api "/entities/realtime_journeys?parent_segment_id=<parent_segment_id>" --type cdp

# Get journey details
tdx api "/entities/realtime_journeys/<journey_id>" --type cdp

# Update journey
tdx api "/entities/realtime_journeys/<journey_id>" --type cdp --method PATCH --data '{
  "name": "updated_journey_name",
  "description": "Updated description"
}'

# Delete journey
tdx api "/entities/realtime_journeys/<journey_id>" --type cdp --method DELETE

# Enable journey
tdx api "/entities/realtime_journeys/<journey_id>/enable" --type cdp --method POST

# Disable journey
tdx api "/entities/realtime_journeys/<journey_id>/disable" --type cdp --method POST
```

## Payload Variables

Use variables from RT attributes and event data:

```json
{
  "payload_template": {
    // User identifiers
    "user_id": "{{user_id}}",
    "email": "{{email}}",
    "td_client_id": "{{td_client_id}}",

    // Event data
    "event_name": "{{event_name}}",
    "event_time": "{{event_time}}",
    "event_properties": "{{event_properties}}",

    // RT attributes
    "last_product_viewed": "{{last_product_viewed}}",
    "viewed_products_30d": "{{viewed_products_30d}}",
    "purchase_count_7d": "{{purchase_count_7d}}",

    // Batch attributes
    "customer_tier": "{{customer_tier}}",
    "total_lifetime_value": "{{total_lifetime_value}}"
  }
}
```

## Testing

```bash
# Test webhook endpoint
curl -X POST "https://your-webhook.com/test" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_123",
    "event": "test_event"
  }'

# Create journey in test mode
# Use test event name or add "test_" prefix
```

## Performance

- **Latency**: Typical activation is 30s-3min
- **Rate Limits**: Max 100 activations/sec per journey
- **Retry Policy**: 3 retries with exponential backoff
- **Timeout**: Default webhook timeout is 5000ms

## Common Errors

| Error | Solution |
|-------|----------|
| "RT not configured" | Complete RT configuration first |
| "Key event not found" | Create key event via RT config |
| "Invalid event_name" | Verify event name matches key event |
| "Parent segment not found" | Verify parent segment ID |
| "Activation configuration invalid" | Check activation structure |

## Best Practices

### Journey Design
- **Single purpose**: One trigger per journey
- **Clear naming**: Descriptive journey names
- **Test first**: Test with non-production webhooks
- **Start simple**: Add complexity incrementally

### Event Selection
- **Business events**: Use meaningful business events
- **Specific filters**: Add filters to reduce noise
- **Volume consideration**: Avoid high-volume events without filters

### Activation Config
- **Error handling**: Plan for activation failures
- **Retry logic**: Rely on built-in retries
- **Timeout**: Set appropriate timeout values

## Next Steps

After creating journeys:
- **Configure Activations**: Set up webhooks/integrations → Use `rt-journey-activations` skill
- **Monitor**: Track activation success → Use `rt-journey-monitor` skill
- **Optimize**: Refine filters and targeting

## API Reference

```bash
# Base URLs by region
US:    https://api-cdp.treasuredata.com
Tokyo: https://api-cdp.in.treasuredata.com
EU:    https://api-cdp.eu01.treasuredata.com

# Endpoints
POST   /entities/realtime_journeys          # Create journey
GET    /entities/realtime_journeys          # List journeys
GET    /entities/realtime_journeys/:id      # Get journey
PATCH  /entities/realtime_journeys/:id      # Update journey
DELETE /entities/realtime_journeys/:id      # Delete journey
POST   /entities/realtime_journeys/:id/enable   # Enable
POST   /entities/realtime_journeys/:id/disable  # Disable
```

## Resources

- [RT Triggers Documentation](https://docs.treasuredata.com/display/public/PD/RT+Triggers)
- [CDP API Reference](https://docs.treasuredata.com/display/public/PD/CDP+API)
