---
name: rt-personalization
description: Creates RT 2.0 personalization services for real-time API responses. Automatically discovers RT-enabled parent segments, builds service configurations with targeting sections, and deploys personalization APIs. Use for product recommendations, cart recovery, content personalization, or user profile APIs.
---

# RT Personalization - Automated Service Creation

## Workflow

CRITICAL: Always discover RT-enabled parent segments from user's account. NEVER use example IDs.

1. **Discover RT-enabled parent segments** (MANDATORY first step):
   ```bash
   tdx ps rt list --json
   ```
   Parse output for actual parent segment names and IDs from user's account.

2. **Ask strategic questions** (use AskUserQuestion with discovered segments):
   - Which parent segment? (show RT-enabled segments from step 1)
   - Use case: product recommendations, cart recovery, content personalization, user profile API?
   - What data to return? (discover from step 3)

3. **Discover available attributes** for chosen parent segment:
   ```bash
   tdx ps fields <actual_parent_segment_name> --json  # Use actual name from step 1
   tdx ps pz list <actual_parent_segment_id> --json   # Check existing services
   ```

4. **Build service YAML** using actual parent_segment_id and discovered attributes

5. **Confirm before push**: Show generated YAML, get approval

6. **Deploy and provide API integration**: Push service, show API details with actual IDs

## Commands

ALWAYS discover actual values from user's account first:

```bash
# 1. MANDATORY: Discover RT-enabled parent segments
tdx ps rt list --json

# 2. Get available attributes for chosen parent segment
tdx ps fields <actual_parent_segment_name> --json

# 3. Check existing services
tdx ps pz list <actual_parent_segment_id> --json

# 4. Deploy service
tdx ps push service.yaml
```

## YAML Structure

IMPORTANT: Use actual parent_segment_id from `tdx ps rt list`, not example values.

```yaml
parent_segment_id: "<actual_id_from_tdx_ps_rt_list>"  # MUST use discovered ID
service_name: "product_recommendations"
description: "Personalized product recommendations"

input_params:
  - name: "user_id"
    type: "string"      # string | number | boolean
    required: true
  - name: "page_url"    # Optional context
    type: "string"
    required: false

sections:
  - name: "premium_users"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "purchase_count_30d"  # Use actual attributes from tdx ps fields
          operator: "greater_than"
          value: 5
        - attribute: "customer_tier"
          operator: "equals"
          value: "premium"
    outputs:
      - attribute: "recommended_products"  # Use discovered attributes
      - attribute: "exclusive_offers"

  - name: "default"        # Always include ALWAYS fallback
    criteria:
      operator: "ALWAYS"
    outputs:
      - attribute: "popular_products"
```

**File location**: Service config can be in any directory, pushed with `tdx ps push service.yaml`

## Section Criteria

### Operators by Type

| Type | Operators | Example |
|------|-----------|---------|
| **Numeric** | `greater_than`, `greater_equal`, `less_than`, `less_equal`, `equals`, `not_equals` | `purchase_count_30d > 5` |
| **String** | `equals`, `not_equals`, `contains`, `starts_with`, `ends_with` | `customer_tier = "premium"` |
| **List** | `contains`, `list_size_greater_than` | `viewed_categories contains "electronics"` |
| **Existence** | `exists`, `not_exists` | `email exists` |
| **Time** | `within_days`, `more_than_days_ago` | `last_purchase within 30 days` |

### Logic Operators

```yaml
# AND - All conditions must match
criteria:
  operator: "AND"
  conditions: [...]

# OR - Any condition matches
criteria:
  operator: "OR"
  conditions: [...]

# ALWAYS - No conditions (fallback section)
criteria:
  operator: "ALWAYS"
```

**Section order**: Most specific → least specific → ALWAYS fallback

## Output Types

- **RT attributes**: Real-time counters, lists, last values (from RT config)
- **Batch attributes**: Customer properties from parent segment
- **Static values**: Fixed values using `value:` field

```yaml
outputs:
  - attribute: "viewed_products_30d"        # RT list attribute
  - attribute: "customer_tier"              # Batch attribute
  - attribute: "recommendation_type"        # Static value
    value: "collaborative_filtering"
```

## Use Case Templates

Reference templates in `./templates/` folder:

### Product Recommendations (`templates/product-recommendations.yml`)
**Sections**: Browsing history exists → personalized, VIP tier/high LTV → exclusive, default → popular
**Outputs**: `viewed_products_30d`, `last_product_viewed`, `favorite_category`, `recommended_products`

### Cart Recovery (`templates/cart-recovery.yml`)
**Sections**: Active cart + no purchase 7d → recovery offer, default → popular
**Outputs**: `cart_items`, `cart_value`, `discount_offer`

### User Profile API (`templates/user-profile-api.yml`)
**Sections**: ALWAYS (return all available user data)
**Outputs**: Identity (email, tier), behavior (views, purchases), engagement (logins)

### Content Personalization (`templates/content-personalization.yml`)
**Sections**: High engagement (>5 articles) → personalized, default → trending
**Outputs**: `viewed_content_ids`, `favorite_category`, `recommended_content`

## API Integration

After deployment, provide integration details with actual IDs:

### Endpoint Format

```bash
POST https://{region}.cdp.treasuredata.com/audiences/{parent_segment_id}/personalization/{service_name}
```

Regions: `us01`, `jp01`, `eu01`

### Request/Response

```bash
# Request
curl -X POST "https://us01.cdp.treasuredata.com/audiences/{actual_ps_id}/personalization/product_recommendations" \
  -H "Authorization: TD1 {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "customer_12345",
    "page_url": "/products"
  }'

# Response
{
  "user_id": "customer_12345",
  "section": "premium_users",
  "outputs": {
    "recommended_products": ["prod_123", "prod_456"],
    "exclusive_offers": ["offer_10"],
    "customer_tier": "premium"
  },
  "timestamp": "2024-02-13T10:30:00Z"
}
```

### JavaScript Integration

```javascript
// Fetch personalization
async function getPersonalization(userId, context = {}) {
  const response = await fetch(
    `https://{region}.cdp.treasuredata.com/audiences/{ps_id}/personalization/{service_name}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `TD1 ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId, ...context })
    }
  );
  return await response.json();
}

// Usage
const data = await getPersonalization(userId, {
  page_url: window.location.pathname
});
renderRecommendations(data.outputs.recommended_products);
```

## Service Naming

Use lowercase with underscores:
- `product_recommendations` ✓
- `cart_recovery` ✓
- `user_profile_api` ✓
- `vip_homepage` ✓ (specific)
- `homepage` ✗ (too generic)

## Common Operators Examples

```yaml
# Numeric comparisons
- attribute: "purchase_count_30d"
  operator: "greater_than"
  value: 5

# String matching
- attribute: "customer_tier"
  operator: "equals"
  value: "premium"

# List operations
- attribute: "viewed_categories"
  operator: "contains"
  value: "electronics"

- attribute: "viewed_products_30d"
  operator: "list_size_greater_than"
  value: 10

# Existence check
- attribute: "email"
  operator: "exists"

# Time-based
- attribute: "last_purchase_date"
  operator: "within_days"
  value: 30
```

## Multi-Condition Targeting

```yaml
sections:
  - name: "high_intent_shoppers"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "viewed_products_30d"
          operator: "list_size_greater_than"
          value: 10
        - attribute: "cart_value"
          operator: "greater_than"
          value: 0
        - attribute: "purchase_count_7d"
          operator: "equals"
          value: 0
    outputs:
      - attribute: "cart_items"
      - attribute: "similar_products"
      - attribute: "discount_offer"
```

## Troubleshooting

| Issue | Action |
|-------|--------|
| "RT not configured" | Verify RT setup: `tdx ps rt validate <ps_name>` |
| "Invalid attribute" | Check available fields: `tdx ps fields <ps_name> --json` |
| "Service name exists" | Use unique name or update existing service |
| "No matching section" | Add ALWAYS fallback section |
| "User not found" | Verify user_id matches identity stitching key |
| "Invalid operator" | Use supported operators from table above |

## Best Practices

### Service Design
- One service per use case
- Descriptive service names
- Only mark truly required params as required
- Always include ALWAYS fallback section

### Performance
- Return only needed attributes
- Most specific sections first
- Minimize number of conditions

### Section Order
Place sections from most specific to least specific:

```yaml
sections:
  - name: "vip_platinum_active"      # Most specific
    criteria:
      operator: "AND"
      conditions: [...]

  - name: "vip"                      # Less specific
    criteria:
      operator: "AND"
      conditions: [...]

  - name: "default"                  # Fallback
    criteria:
      operator: "ALWAYS"
```

## Testing

Test service before production deployment:

```bash
# Test via API
curl -X POST \
  "https://{region}.cdp.treasuredata.com/audiences/{ps_id}/personalization/{service_name}/test" \
  -H "Authorization: TD1 {api_key}" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_123", "page_url": "/products"}'
```

Response shows which section matched:
```json
{
  "section": "premium_users",
  "outputs": {...}
}
```

## Related Skills

- **rt-config-setup**: Configure RT 2.0 infrastructure first
- **rt-config-attributes**: Create RT attributes for personalization
- **rt-triggers**: Event-triggered RT journeys

## Resources

- [RT Personalization Documentation](https://docs.treasuredata.com/display/public/PD/RT+Personalization)
- [API Reference](https://docs.treasuredata.com/display/public/PD/CDP+API)
