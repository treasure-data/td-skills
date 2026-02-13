---
name: rt-pz-service
description: Create and manage RT 2.0 personalization services that return real-time personalized responses via API
---

# RT Personalization Service Creation

Create personalization services that return real-time data via API for web/mobile apps.

## Prerequisites

- RT configuration complete (use `rt-config-setup` skill first)
- RT attributes configured and capturing data
- Understanding of personalization use case

## Quick Start

```bash
# List existing services
tdx ps pz list <parent_segment_id> --json

# Initialize service template
tdx ps pz init <parent_segment_id> -o personalization_service.yaml

# Push service
tdx ps push personalization_service.yaml
```

## Service Structure

```yaml
parent_segment_id: "394649"
service_name: "product_recommendations"
description: "Return personalized product recommendations"

# Input parameters from API request
input_params:
  - name: "user_id"
    type: "string"
    required: true
  - name: "page_url"
    type: "string"
    required: false
  - name: "device_type"
    type: "string"
    required: false

# Sections with targeting criteria
sections:
  - name: "premium_users"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "customer_tier"
          operator: "equals"
          value: "premium"
    outputs:
      - attribute: "recommended_products"
      - attribute: "exclusive_offers"

  - name: "default"
    criteria:
      operator: "ALWAYS"
    outputs:
      - attribute: "popular_products"
```

## Input Parameters

Define what data the API accepts:

```yaml
input_params:
  # Required user identifier
  - name: "user_id"
    type: "string"
    required: true

  # Optional context parameters
  - name: "page_url"
    type: "string"
    required: false

  - name: "product_id"
    type: "string"
    required: false

  - name: "category"
    type: "string"
    required: false
```

**Parameter types**: `string`, `number`, `boolean`

## Output Attributes

Return RT and batch attributes:

```yaml
outputs:
  # RT attributes (configured in rt-config-attributes)
  - attribute: "last_product_viewed"        # single
  - attribute: "viewed_products_30d"        # list
  - attribute: "purchase_count_7d"          # counter

  # Batch attributes (from parent segment)
  - attribute: "customer_tier"
  - attribute: "total_lifetime_value"

  # Static values
  - attribute: "recommendation_type"
    value: "collaborative_filtering"
```

## Service Examples

### Product Recommendations

```yaml
service_name: "product_recommendations"
description: "Personalized product recommendations"

input_params:
  - name: "user_id"
    type: "string"
    required: true
  - name: "current_product_id"
    type: "string"
    required: false

sections:
  # Recent browsers
  - name: "recent_activity"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "viewed_products_30d"
          operator: "exists"
    outputs:
      - attribute: "viewed_products_30d"
      - attribute: "last_product_viewed"
      - attribute: "favorite_category"

  # High-value customers
  - name: "vip"
    criteria:
      operator: "OR"
      conditions:
        - attribute: "customer_tier"
          operator: "equals"
          value: "platinum"
        - attribute: "total_lifetime_value"
          operator: "greater_than"
          value: 5000
    outputs:
      - attribute: "customer_tier"
      - attribute: "exclusive_offers"
      - attribute: "vip_products"

  # Default fallback
  - name: "default"
    criteria:
      operator: "ALWAYS"
    outputs:
      - attribute: "popular_products"
      - attribute: "trending_categories"
```

### Cart Recovery

```yaml
service_name: "cart_recovery"
description: "Abandoned cart recovery data"

input_params:
  - name: "user_id"
    type: "string"
    required: true

sections:
  - name: "active_cart"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "cart_value"
          operator: "greater_than"
          value: 0
        - attribute: "purchase_count_7d"
          operator: "equals"
          value: 0
    outputs:
      - attribute: "cart_items"
      - attribute: "cart_value"
      - attribute: "discount_offer"

  - name: "no_cart"
    criteria:
      operator: "ALWAYS"
    outputs:
      - attribute: "popular_products"
```

### User Profile API

```yaml
service_name: "user_profile"
description: "Real-time user profile data"

input_params:
  - name: "user_id"
    type: "string"
    required: true

sections:
  - name: "profile"
    criteria:
      operator: "ALWAYS"
    outputs:
      # Identity
      - attribute: "email"
      - attribute: "customer_tier"

      # Behavior
      - attribute: "last_product_viewed"
      - attribute: "viewed_products_30d"
      - attribute: "purchase_count_30d"

      # Engagement
      - attribute: "login_count_7d"
      - attribute: "last_login_time"
```

### Content Personalization

```yaml
service_name: "content_recommendations"
description: "Personalized content recommendations"

input_params:
  - name: "user_id"
    type: "string"
    required: true
  - name: "page_type"
    type: "string"
    required: false

sections:
  - name: "engaged_readers"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "viewed_content_ids"
          operator: "exists"
        - attribute: "articles_read_7d"
          operator: "greater_than"
          value: 5
    outputs:
      - attribute: "viewed_content_ids"
      - attribute: "favorite_category"
      - attribute: "recommended_content"

  - name: "default"
    criteria:
      operator: "ALWAYS"
    outputs:
      - attribute: "trending_content"
      - attribute: "popular_categories"
```

## Manage Services

```bash
# List all services
tdx ps pz list <parent_segment_id> --json

# View service details
tdx ps pz get <parent_segment_id> <service_name> --json

# Update service
# Edit YAML file and push again
tdx ps push personalization_service.yaml

# Delete service (API)
tdx api "/audiences/<parent_segment_id>/personalization_services/<service_id>" \
  --type cdp --method DELETE
```

## Service Naming

Best practices:
- Use lowercase with underscores: `product_recommendations`
- Be descriptive: `cart_recovery` not `cart`
- Include use case: `vip_homepage` not `homepage`
- Avoid generic names: `user_data` ❌ → `user_profile_api` ✅

## Common Errors

| Error | Solution |
|-------|----------|
| "RT not configured" | Complete RT configuration first |
| "Service name exists" | Use unique service name or delete existing |
| "Invalid attribute" | Verify attribute exists in RT config |
| "No sections defined" | Add at least one section |
| "Missing required input" | Define at least one input parameter |

## Testing

Test service before deployment:

```bash
# Via tdx (if available)
tdx ps pz test <parent_segment_id> <service_name> \
  --user-id "test_user_123" \
  --params '{"page_url": "/products"}'

# Via API
curl -X POST \
  "https://<region>.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization/<service_name>/test" \
  -H "Authorization: TD1 <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "input_params": {
      "page_url": "/products",
      "device_type": "mobile"
    }
  }'
```

## Best Practices

### Service Design
- **Single purpose**: One service per use case
- **Clear naming**: Descriptive service and parameter names
- **Required params**: Only mark truly required params as required
- **Fallback section**: Always include ALWAYS section for unmatched users

### Performance
- **Minimal outputs**: Only return needed attributes
- **Specific sections**: Use precise criteria to reduce processing
- **Section order**: Most specific first, fallback last

### Maintenance
- **Version in name**: Consider versioning (e.g., `product_recs_v2`)
- **Document use case**: Add clear description
- **Test thoroughly**: Test with various user profiles

## Next Steps

After creating services:
- **Configure Sections**: Define targeting criteria → Use `rt-pz-sections` skill
- **API Integration**: Integrate with web/mobile → Use `rt-pz-api` skill
- **Monitor**: Track usage and performance → Use `rt-pz-api` skill

## Resources

- [RT Personalization Documentation](https://docs.treasuredata.com/display/public/PD/RT+Personalization)
- [Service Design Guide](https://docs.treasuredata.com/display/public/PD/Personalization+Services)
