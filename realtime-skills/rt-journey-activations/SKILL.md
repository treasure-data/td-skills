---
name: rt-journey-activations
description: Configure RT journey activations - webhooks, Salesforce, email, and other integrations for real-time event-triggered actions
---

# RT Journey Activation Configuration

Configure activations for RT journeys - webhooks, Salesforce, email, and other integrations.

## Prerequisites

- RT journey created (use `rt-journey-create` skill first)
- Destination system credentials/endpoints configured

## Activation Types

- **Webhook**: Send HTTP requests to any endpoint
- **Salesforce**: Update Salesforce objects
- **Email**: Send emails via email providers
- **Custom**: Integration-specific activations

## Webhook Activation

Send HTTP POST requests to external endpoints:

```json
{
  "type": "webhook",
  "name": "send_to_marketing_platform",
  "endpoint": "https://platform.com/api/events",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{secret:api_key}}",
    "Content-Type": "application/json",
    "X-Custom-Header": "value"
  },
  "payload_template": {
    "user_id": "{{user_id}}",
    "event": "{{event_name}}",
    "timestamp": "{{event_time}}",
    "attributes": {
      "last_product_viewed": "{{last_product_viewed}}",
      "purchase_count_30d": "{{purchase_count_30d}}",
      "customer_tier": "{{customer_tier}}"
    }
  },
  "timeout_ms": 5000,
  "retry_count": 3
}
```

### Webhook Configuration

- **endpoint**: Full URL (HTTPS required)
- **method**: HTTP method (POST, PUT, PATCH)
- **headers**: Optional headers (use `{{secret:key}}` for credentials)
- **payload_template**: JSON body with variable substitution
- **timeout_ms**: Request timeout (default: 5000)
- **retry_count**: Number of retries (default: 3)

### Webhook Examples

#### Marketing Platform

```json
{
  "type": "webhook",
  "endpoint": "https://marketing.com/api/v1/events",
  "headers": {
    "Authorization": "Bearer {{secret:marketing_api_key}}",
    "Content-Type": "application/json"
  },
  "payload_template": {
    "event_type": "user_action",
    "user_id": "{{user_id}}",
    "action": "{{event_name}}",
    "timestamp": "{{event_time}}",
    "properties": {
      "email": "{{email}}",
      "product_id": "{{product_id}}",
      "amount": "{{purchase_amount}}"
    }
  }
}
```

#### Slack Notification

```json
{
  "type": "webhook",
  "endpoint": "{{secret:slack_webhook_url}}",
  "payload_template": {
    "text": "High value purchase!",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Purchase Alert*\nCustomer: {{email}}\nAmount: ${{purchase_amount}}"
        }
      }
    ]
  }
}
```

#### Custom API

```json
{
  "type": "webhook",
  "endpoint": "https://api.example.com/realtime/events",
  "method": "POST",
  "headers": {
    "X-API-Key": "{{secret:custom_api_key}}",
    "X-Event-Type": "{{event_name}}"
  },
  "payload_template": {
    "customer": {
      "id": "{{user_id}}",
      "email": "{{email}}",
      "tier": "{{customer_tier}}"
    },
    "event": {
      "name": "{{event_name}}",
      "time": "{{event_time}}",
      "data": "{{event_properties}}"
    }
  },
  "timeout_ms": 10000
}
```

## Salesforce Activation

Update Salesforce objects directly:

```json
{
  "type": "salesforce",
  "name": "update_lead_score",
  "object": "Lead",
  "operation": "update",
  "field_mapping": {
    "Email": "{{email}}",
    "Lead_Score__c": "{{customer_score}}",
    "Last_Activity__c": "{{event_time}}",
    "Products_Viewed__c": "{{viewed_products_30d}}",
    "Purchase_Count__c": "{{purchase_count_30d}}"
  },
  "match_field": "Email"
}
```

### Salesforce Configuration

- **object**: Salesforce object (Lead, Contact, Account, Custom__c)
- **operation**: `update`, `create`, or `upsert`
- **field_mapping**: Map TD attributes to Salesforce fields
- **match_field**: Field to match on for updates

### Salesforce Examples

#### Update Contact

```json
{
  "type": "salesforce",
  "object": "Contact",
  "operation": "update",
  "field_mapping": {
    "Email": "{{email}}",
    "VIP_Status__c": "true",
    "Last_Purchase_Date__c": "{{event_time}}",
    "Last_Purchase_Amount__c": "{{purchase_amount}}",
    "Lifetime_Value__c": "{{total_lifetime_value}}"
  },
  "match_field": "Email"
}
```

#### Create Lead

```json
{
  "type": "salesforce",
  "object": "Lead",
  "operation": "create",
  "field_mapping": {
    "Email": "{{email}}",
    "FirstName": "{{first_name}}",
    "LastName": "{{last_name}}",
    "Company": "{{company}}",
    "LeadSource": "Website",
    "Status": "New"
  }
}
```

#### Update Custom Object

```json
{
  "type": "salesforce",
  "object": "Customer_Activity__c",
  "operation": "upsert",
  "field_mapping": {
    "Customer_Email__c": "{{email}}",
    "Activity_Type__c": "{{event_name}}",
    "Activity_Date__c": "{{event_time}}",
    "Product_ID__c": "{{product_id}}",
    "Amount__c": "{{purchase_amount}}"
  },
  "match_field": "Customer_Email__c"
}
```

## Email Activation

Send transactional emails:

```json
{
  "type": "email",
  "name": "welcome_email",
  "provider": "sendgrid",
  "template_id": "d-abc123xyz",
  "to": "{{email}}",
  "from": "welcome@company.com",
  "from_name": "Company Name",
  "subject": "Welcome to Our Platform!",
  "dynamic_data": {
    "user_name": "{{first_name}}",
    "signup_date": "{{event_time}}",
    "account_type": "{{customer_tier}}"
  }
}
```

### Email Configuration

- **provider**: Email service (sendgrid, mailgun, ses)
- **template_id**: Email template ID from provider
- **to**: Recipient (use `{{email}}` variable)
- **from**: Sender email
- **subject**: Email subject line
- **dynamic_data**: Template variables

### Email Examples

#### SendGrid Template

```json
{
  "type": "email",
  "provider": "sendgrid",
  "template_id": "d-welcome-template",
  "to": "{{email}}",
  "from": "noreply@company.com",
  "dynamic_data": {
    "first_name": "{{first_name}}",
    "product_name": "{{purchased_product}}",
    "order_total": "{{purchase_amount}}",
    "shipping_date": "{{estimated_delivery}}"
  }
}
```

#### Abandoned Cart Email

```json
{
  "type": "email",
  "provider": "sendgrid",
  "template_id": "d-cart-recovery",
  "to": "{{email}}",
  "from": "shop@company.com",
  "subject": "Your cart is waiting!",
  "dynamic_data": {
    "customer_name": "{{first_name}}",
    "cart_items": "{{cart_items}}",
    "cart_value": "{{cart_value}}",
    "discount_code": "SAVE10",
    "cart_url": "https://shop.com/cart/{{cart_id}}"
  }
}
```

## Multiple Activations

RT journeys can have multiple activations:

```json
{
  "name": "high_value_purchase",
  "event_name": "purchase",
  "filters": {
    "purchase_amount": {
      "operator": "greater_than",
      "value": 500
    }
  },
  "activations": [
    // 1. Update Salesforce
    {
      "type": "salesforce",
      "object": "Contact",
      "operation": "update",
      "field_mapping": {
        "Email": "{{email}}",
        "VIP_Status__c": "true"
      },
      "match_field": "Email"
    },
    // 2. Send thank you email
    {
      "type": "email",
      "template_id": "vip-thank-you",
      "to": "{{email}}",
      "dynamic_data": {
        "purchase_amount": "{{purchase_amount}}"
      }
    },
    // 3. Notify Slack
    {
      "type": "webhook",
      "endpoint": "{{secret:slack_webhook_url}}",
      "payload_template": {
        "text": "VIP purchase: {{email}} - ${{purchase_amount}}"
      }
    }
  ]
}
```

## Variable Substitution

Use double curly braces for variables:

### Available Variables

```json
{
  // User Identifiers
  "user_id": "{{user_id}}",
  "email": "{{email}}",
  "td_client_id": "{{td_client_id}}",

  // Event Data
  "event_name": "{{event_name}}",
  "event_time": "{{event_time}}",
  "event_properties": "{{event_properties}}",

  // RT Attributes (from rt-config-attributes)
  "last_product_viewed": "{{last_product_viewed}}",
  "viewed_products_30d": "{{viewed_products_30d}}",
  "purchase_count_7d": "{{purchase_count_7d}}",
  "cart_value": "{{cart_value}}",

  // Batch Attributes (from parent segment)
  "customer_tier": "{{customer_tier}}",
  "total_lifetime_value": "{{total_lifetime_value}}",
  "account_status": "{{account_status}}",

  // Event-specific Fields
  "product_id": "{{product_id}}",
  "category": "{{category}}",
  "purchase_amount": "{{purchase_amount}}"
}
```

### Secrets

Store credentials securely:

```json
{
  "headers": {
    "Authorization": "Bearer {{secret:api_key}}",
    "X-API-Token": "{{secret:webhook_token}}"
  },
  "endpoint": "{{secret:webhook_url}}"
}
```

**Secret format**: `{{secret:secret_name}}`

## Testing Activations

```bash
# Test webhook endpoint manually
curl -X POST "https://your-webhook.com/endpoint" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_123",
    "event": "test_event",
    "data": "test_data"
  }'

# Check webhook response
# Expected: 200 OK

# Test email template
# Use provider's test interface (SendGrid, Mailgun)

# Test Salesforce connection
# Verify credentials and object permissions
```

## Common Errors

| Error | Solution |
|-------|----------|
| "Webhook timeout" | Increase timeout_ms or optimize endpoint |
| "Invalid endpoint URL" | Use HTTPS and verify URL format |
| "Authentication failed" | Check secret values and credentials |
| "Salesforce field not found" | Verify field API names in Salesforce |
| "Email template not found" | Check template ID in email provider |
| "Variable not found" | Verify variable name matches RT attribute |

## Best Practices

### Webhook Design
- **HTTPS only**: Always use secure endpoints
- **Fast response**: Respond quickly (< 5s)
- **Idempotent**: Handle duplicate requests
- **Error handling**: Return proper HTTP status codes

### Salesforce Integration
- **Field validation**: Verify field types match
- **Bulk operations**: Consider API limits
- **Match fields**: Use stable identifiers (email, ID)

### Email Activation
- **Template testing**: Test templates thoroughly
- **Unsubscribe**: Include unsubscribe links
- **Deliverability**: Monitor bounce/complaint rates

## Performance

- **Timeout**: Default 5000ms, max 30000ms
- **Retries**: 3 retries with exponential backoff
- **Parallel**: Multiple activations run in parallel
- **Rate limits**: 100 activations/sec per journey

## Next Steps

After configuring activations:
- **Test**: Test each activation type thoroughly
- **Monitor**: Track success rates → Use `rt-journey-monitor` skill
- **Optimize**: Refine payload templates and filters

## Resources

- [Activation Types Documentation](https://docs.treasuredata.com/display/public/PD/RT+Activations)
- [Webhook Best Practices](https://docs.treasuredata.com/display/public/PD/Webhook+Guide)
- [Salesforce Integration](https://docs.treasuredata.com/display/public/PD/Salesforce+Connector)
