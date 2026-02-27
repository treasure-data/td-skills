---
name: rt-triggers
description: Create RT 2.0 Journeys (Real-Time Triggers) that activate in real-time when specific events occur, triggering activations to external systems via API
---

# RT 2.0 Triggers (RT Journeys)

Create event-triggered journeys that activate in real-time when specific events occur, sending data to external systems.

**Note**: This skill is for **RT Journeys** (event-triggered, API-only). For stage-based **Batch Journeys** (YAML workflow with `tdx journey`), use the `journey` skill.

## Journey Types

| Type | Entry | Workflow | Use Case |
|------|-------|----------|----------|
| **RT Journeys** (this skill) | Event occurs | API-only | Real-time activations when events happen |
| **Batch Journeys** (journey skill) | Segment membership | YAML + `tdx journey` | Multi-stage customer journey orchestration |

## Prerequisites

- RT configuration complete (run `rt-config` skill first)
- RT status is "ok" (not "updating")
- Key events configured
- Webhook/activation endpoint ready (optional)

## Quick Start

```bash
# Check RT status
tdx ps view <parent_segment_id> --json | jq '.realtime_config.status'

# List key events
tdx api "/audiences/<parent_segment_id>/realtime_key_events" --type cdp

# Create RT journey via API
tdx api "/entities/realtime_journeys" --type cdp --method POST --data '{
  "name": "welcome_email",
  "parent_segment_id": 394649,
  "event_name": "registration",
  "activations": [
    {
      "type": "webhook",
      "endpoint": "https://your-app.com/webhooks/welcome",
      "payload_template": {
        "user_id": "{{user_id}}",
        "event": "registration"
      }
    }
  ]
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
      "headers": {
        "Authorization": "Bearer {{api_key}}",
        "Content-Type": "application/json"
      },
      "payload_template": {
        "user_id": "{{user_id}}",
        "cart_value": "{{cart_value}}",
        "cart_items": "{{cart_items}}",
        "event_time": "{{event_time}}"
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

## Activations

### Webhook Activation

```json
{
  "type": "webhook",
  "name": "send_to_marketing_platform",
  "endpoint": "https://platform.com/api/events",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{secret:api_key}}",
    "Content-Type": "application/json"
  },
  "payload_template": {
    "user_id": "{{user_id}}",
    "event": "{{event_name}}",
    "timestamp": "{{event_time}}",
    "attributes": {
      "last_product_viewed": "{{last_product_viewed}}",
      "purchase_count_30d": "{{purchase_count_30d}}"
    }
  },
  "timeout_ms": 5000,
  "retry_count": 3
}
```

### Salesforce Activation

```json
{
  "type": "salesforce",
  "name": "update_lead_score",
  "object": "Lead",
  "operation": "update",
  "field_mapping": {
    "Email": "{{email}}",
    "Lead_Score__c": "{{customer_score}}",
    "Last_Activity__c": "{{event_time}}"
  },
  "match_field": "Email"
}
```

### Email Activation

```json
{
  "type": "email",
  "name": "welcome_email",
  "provider": "sendgrid",
  "template_id": "d-abc123",
  "to": "{{email}}",
  "dynamic_data": {
    "user_name": "{{first_name}}",
    "signup_date": "{{event_time}}"
  }
}
```

## Payload Templates

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

    // List filters
    "viewed_categories": {
      "operator": "contains",
      "value": "premium"
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

# Get journey status
tdx api "/entities/realtime_journeys/<journey_id>/status" --type cdp
```

## Common Patterns

### Welcome Journey

```json
{
  "name": "welcome_new_users",
  "parent_segment_id": 394649,
  "event_name": "registration",
  "activations": [
    {
      "type": "webhook",
      "endpoint": "https://email-service.com/api/send",
      "payload_template": {
        "template": "welcome",
        "to": "{{email}}",
        "user_name": "{{first_name}}"
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
        "cart_value": "{{cart_value}}"
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
        "Last_Purchase_Amount__c": "{{purchase_amount}}"
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
        "recommendation_context": {
          "last_products": "{{viewed_products_30d}}",
          "favorite_category": "{{favorite_category}}"
        }
      }
    }
  ]
}
```

## Testing

Test RT journeys before enabling:

```bash
# Test webhook endpoint
curl -X POST "https://your-webhook.com/test" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_123",
    "event": "test_event"
  }'

# Enable journey after testing
tdx api "/entities/realtime_journeys/<journey_id>/enable" --type cdp --method POST

# Disable journey
tdx api "/entities/realtime_journeys/<journey_id>/disable" --type cdp --method POST
```

## Monitoring

```bash
# View activation logs
tdx api "/entities/realtime_journeys/<journey_id>/activations" --type cdp

# Check recent triggers
tdx api "/entities/realtime_journeys/<journey_id>/triggers?limit=100" --type cdp

# View errors
tdx api "/entities/realtime_journeys/<journey_id>/errors" --type cdp
```

Query activation logs table:

```sql
select
  time,
  delivered,
  status,
  activation_name,
  journey_name,
  error,
  response
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
  and journey_name = 'welcome_new_users'
order by time desc
limit 100
```

## Performance

- **Latency**: Typical activation latency is 30s-3min
- **Rate Limits**: Max 100 activations/sec per journey
- **Retry Policy**: Failed activations retry 3x with exponential backoff
- **Timeout**: Default webhook timeout is 5000ms

## Common Errors

| Error | Solution |
|-------|----------|
| "RT not configured" | Run `rt-config` skill first |
| "Key event not found" | Create key event via RT config |
| "Webhook timeout" | Increase timeout_ms or optimize endpoint |
| "Invalid payload template" | Verify variable names match RT attributes |
| "Rate limit exceeded" | Reduce activation frequency or contact support |
| "Activation failed" | Check activation logs for error details |

## Debugging

```bash
# Check RT status
tdx ps view <parent_segment_id> --json | jq '.realtime_config.status'

# Verify key event exists
tdx api "/audiences/<parent_segment_id>/realtime_key_events" --type cdp | jq '.[]'

# Test webhook manually
curl -X POST "https://your-webhook.com/endpoint" \
  -H "Content-Type: application/json" \
  -d '{"test": "payload"}'

# View recent activation errors
select error, count(*) as error_count
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1h')
  and delivered = 'false'
group by error
order by error_count desc
```

## Next Steps

After creating RT journeys:
- **Monitor Activations**: Use activation logs to track success rates
- **Optimize Filters**: Refine event filters to reduce noise
- **A/B Testing**: Test different activation strategies
- **RT Personalization**: Combine with personalization services → Use `rt-personalization` skill

## API Reference

```bash
# Base URLs by region
US:    https://api-cdp.treasuredata.com
Tokyo: https://api-cdp.in.treasuredata.com
EU:    https://api-cdp.eu01.treasuredata.com

# Key endpoints
POST   /entities/realtime_journeys          # Create journey
GET    /entities/realtime_journeys          # List journeys
GET    /entities/realtime_journeys/:id      # Get journey
PATCH  /entities/realtime_journeys/:id      # Update journey
DELETE /entities/realtime_journeys/:id      # Delete journey
POST   /entities/realtime_journeys/:id/enable   # Enable journey
POST   /entities/realtime_journeys/:id/disable  # Disable journey
```

## Resources

- [RT Triggers Documentation](https://docs.treasuredata.com/display/public/PD/RT+Triggers)
- [CDP API Reference](https://docs.treasuredata.com/display/public/PD/CDP+API)
- [Batch Journey Skill](../../../tdx-skills/journey) - For YAML-based stage journeys
