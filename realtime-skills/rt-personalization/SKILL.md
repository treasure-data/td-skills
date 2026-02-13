---
name: rt-personalization
description: Create RT 2.0 Personalization services that return real-time personalized responses via API using tdx ps pz commands or API
---

# RT 2.0 Personalization

Create personalization services that return real-time personalized data via API for web/mobile apps.

## Prerequisites

- RT configuration complete (run `rt-config` skill first)
- RT attributes capturing user behavior
- API integration point ready (web/mobile app)

## Quick Start

```bash
# List existing services
tdx ps pz list <parent_segment_id> --json

# Initialize service template
tdx ps pz init <parent_segment_id> -o personalization_service.yaml

# Push service configuration
tdx ps push personalization_service.yaml

# Test service
curl -X POST "https://<region>.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization" \
  -H "Authorization: TD1 <api_key>" \
  -d '{"user_id": "test_user_123"}'
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

# Sections with criteria and outputs
sections:
  # Section 1: High-value customers
  - name: "premium_users"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "purchase_count_30d"
          operator: "greater_than"
          value: 5
        - attribute: "customer_tier"
          operator: "equals"
          value: "premium"
    outputs:
      - attribute: "recommended_products"
      - attribute: "exclusive_offers"
      - attribute: "customer_tier"

  # Section 2: Cart abandoners
  - name: "cart_recovery"
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
      - attribute: "discount_offer"

  # Section 3: Default fallback
  - name: "default"
    criteria:
      operator: "ALWAYS"
    outputs:
      - attribute: "popular_products"
      - attribute: "last_product_viewed"
```

## Section Criteria

Define who sees each section:

### Operators

```yaml
# Numeric comparisons
conditions:
  - attribute: "purchase_count_30d"
    operator: "greater_than"      # >, >=, <, <=, equals
    value: 10

# String matching
  - attribute: "customer_tier"
    operator: "equals"             # equals, not_equals, contains
    value: "premium"

# List membership
  - attribute: "viewed_categories"
    operator: "contains"
    value: "electronics"

# Existence checks
  - attribute: "email"
    operator: "exists"

# Time-based
  - attribute: "last_purchase_date"
    operator: "within_days"
    value: 30
```

### Logic Combinations

```yaml
# AND - All conditions must match
criteria:
  operator: "AND"
  conditions:
    - attribute: "purchase_count_30d"
      operator: "greater_than"
      value: 5
    - attribute: "customer_tier"
      operator: "equals"
      value: "gold"

# OR - Any condition matches
criteria:
  operator: "OR"
  conditions:
    - attribute: "customer_tier"
      operator: "equals"
      value: "platinum"
    - attribute: "purchase_count_30d"
      operator: "greater_than"
      value: 20

# ALWAYS - No criteria (fallback)
criteria:
  operator: "ALWAYS"
```

## Output Attributes

Return RT and batch attributes:

```yaml
outputs:
  # RT attributes
  - attribute: "last_product_viewed"        # single
  - attribute: "viewed_products_30d"        # list
  - attribute: "purchase_count_7d"          # counter

  # Batch attributes
  - attribute: "customer_tier"              # from parent segment
  - attribute: "total_lifetime_value"       # from parent segment

  # Custom fields
  - attribute: "recommendation_score"
    value: "high"                            # static value
```

## API Integration

### Request Format

```bash
POST https://<region>.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization
Authorization: TD1 <api_key>
Content-Type: application/json

{
  "user_id": "customer_12345",
  "page_url": "/products/electronics",
  "context": {
    "device": "mobile"
  }
}
```

### Response Format

```json
{
  "user_id": "customer_12345",
  "section": "premium_users",
  "outputs": {
    "recommended_products": ["prod_123", "prod_456", "prod_789"],
    "exclusive_offers": ["offer_10", "offer_20"],
    "customer_tier": "premium",
    "purchase_count_30d": 12
  },
  "timestamp": "2024-02-13T10:30:00Z"
}
```

## Test Harness

Test service before deployment:

```bash
# Via tdx (if available)
tdx ps pz test <parent_segment_id> <service_name> \
  --user-id "test_user_123" \
  --params '{"page_url": "/products"}'

# Via API
curl -X POST \
  "https://<region>.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization/test" \
  -H "Authorization: TD1 <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "product_recommendations",
    "user_id": "test_user_123",
    "input_params": {
      "page_url": "/products"
    }
  }'
```

## Manage Services

```bash
# List all services
tdx ps pz list <parent_segment_id> --json

# View service details
tdx ps pz get <parent_segment_id> <service_name> --json

# Update service
tdx ps push personalization_service.yaml

# Delete service (API only)
tdx api "/audiences/<parent_segment_id>/personalization_services/<service_id>" \
  --type cdp --method DELETE
```

## Common Patterns

### Product Recommendations

```yaml
sections:
  - name: "personalized_recs"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "viewed_products_30d"
          operator: "exists"
    outputs:
      - attribute: "viewed_products_30d"
      - attribute: "last_product_viewed"
      - attribute: "favorite_category"
```

### Cart Recovery

```yaml
sections:
  - name: "abandoned_cart"
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
```

### User Segmentation

```yaml
sections:
  - name: "vip"
    criteria:
      operator: "OR"
      conditions:
        - attribute: "customer_tier"
          operator: "equals"
          value: "platinum"
        - attribute: "total_lifetime_value"
          operator: "greater_than"
          value: 10000
    outputs:
      - attribute: "customer_tier"
      - attribute: "total_lifetime_value"
      - attribute: "vip_offers"
```

### Content Personalization

```yaml
sections:
  - name: "content_match"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "viewed_content_ids"
          operator: "exists"
    outputs:
      - attribute: "viewed_content_ids"
      - attribute: "favorite_category"
      - attribute: "recommended_content"
```

## Performance Tips

- **Section Order**: Most specific criteria first, fallback last
- **Minimize Outputs**: Only return needed attributes
- **Cache Client-Side**: Cache responses when appropriate
- **Use CDN**: Reduce latency with CDN caching
- **Monitor Usage**: Track API call volume and latency

## API Regions

```bash
# US
https://us01.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization

# Tokyo
https://jp01.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization

# EU
https://eu01.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization
```

## Common Errors

| Error | Solution |
|-------|----------|
| "RT not configured" | Run `rt-config` skill first |
| "Service not found" | Verify service name with `tdx ps pz list` |
| "Invalid attribute" | Check attribute exists in RT config |
| "User not found" | Verify user_id matches stitching key |
| "No matching section" | Add ALWAYS fallback section |
| "Invalid criteria operator" | Use supported operators (equals, greater_than, etc.) |

## Monitoring

```bash
# View service metrics (API)
tdx api "/audiences/<parent_segment_id>/personalization_services/<service_id>/metrics" \
  --type cdp

# Check recent responses
tdx api "/audiences/<parent_segment_id>/personalization_services/<service_id>/logs" \
  --type cdp | jq '.logs[] | {user_id, section, timestamp}'
```

## Next Steps

After creating personalization services:
- **Integrate with Web/Mobile**: Add API calls to application
- **A/B Testing**: Test different personalization strategies
- **Monitor Performance**: Track conversion rates and engagement
- **RT Triggers**: Combine with event-triggered activations → Use `rt-triggers` skill

## Detailed Guides

- [Service Creation Workflow](./docs/service-creation.md) - Step-by-step service setup
- [API Integration Guide](./docs/api-integration.md) - Implementation examples
- [Troubleshooting](./docs/troubleshooting.md) - Detailed error solutions

## Resources

- [RT Personalization Documentation](https://docs.treasuredata.com/display/public/PD/RT+Personalization)
- [API Reference](https://docs.treasuredata.com/display/public/PD/CDP+API)
