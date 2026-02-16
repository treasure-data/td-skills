---
name: rt-pz-service
description: Creates RT 2.0 personalization services with automated discovery and configuration. Use for building real-time API services for product recommendations, cart recovery, content personalization, or user profiles. Automatically finds available attributes and builds service configs.
---

# RT Personalization Service - Automated Creation

## Workflow

CRITICAL: Always discover RT-enabled parent segments from user's account. NEVER use example IDs.

1. **Discover RT-enabled parent segments** (MANDATORY first step):
   ```bash
   tdx ps rt list --json  # Get actual RT-enabled segments from user's account
   ```
   Parse output for actual parent segment names and IDs.

2. **Ask strategic questions** (use AskUserQuestion with discovered segments):
   - Which parent segment? (show RT-enabled segments from step 1)
   - Use case: product recs, cart recovery, content, or profile API?
   - What data to return? (discover from step 3)

3. **Discover available attributes** for chosen parent segment:
   ```bash
   tdx ps fields <actual_ps_name> --json  # Use actual name from step 1
   tdx ps pz list <actual_ps_id> --json   # Use actual ID from step 1
   ```

4. **Build service YAML** using actual parent_segment_id and discovered attributes

5. **Confirm before push**: Show config, get approval

6. **Deploy & integrate**: Push service, provide API details with actual IDs

## Commands

ALWAYS discover actual values from user's account first:

```bash
# 1. MANDATORY: Discover RT-enabled parent segments
tdx ps rt list --json

# 2. Get available attributes for discovered segment
tdx ps fields <actual_parent_segment_name> --json

# 3. Check existing services
tdx ps pz list <actual_parent_segment_id> --json

# 4. Deploy with actual values
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
        - attribute: "customer_tier"  # Use actual attributes from tdx ps fields
          operator: "equals"
          value: "premium"
    outputs:
      - attribute: "recommended_products"  # Use discovered attributes
      - attribute: "exclusive_offers"

  - name: "default"     # Always include ALWAYS fallback
    criteria:
      operator: "ALWAYS"
    outputs:
      - attribute: "popular_products"
```

**Input params**: `user_id` required, optional context (page_url, product_id, category)
**Outputs**: RT attributes (counters, lists), batch attributes (from PS), static values (`value:` field)

## Use Case Templates

### Product Recommendations
**Sections**: Browsing history exists → personalized, VIP tier/high LTV → exclusive, default → popular
**Outputs**: `viewed_products_30d`, `last_product_viewed`, `favorite_category`, `recommended_products`, `exclusive_offers`

### Cart Recovery
**Sections**: Cart value >0 + no purchase 7d → recovery, default → popular
**Outputs**: `cart_items`, `cart_value`, `discount_offer`

### User Profile API
**Sections**: ALWAYS (return all data)
**Outputs**: Identity (email, tier), behavior (views, purchases), engagement (logins, time)

### Content Personalization
**Sections**: High engagement (>5 articles) → personalized, default → trending
**Outputs**: `viewed_content_ids`, `favorite_category`, `recommended_content`

## Criteria Operators

| Type | Operators | Example |
|------|-----------|---------|
| Numeric | `greater_than`, `greater_equal`, `less_than`, `less_equal`, `equals` | `purchase_count_30d > 5` |
| String | `equals`, `not_equals`, `contains` | `customer_tier = "premium"` |
| Existence | `exists` | `email exists` |

Logic: `AND` (all), `OR` (any), `ALWAYS` (fallback)

## API Integration

After deployment, provide API details:

```bash
# API endpoint
POST https://{region}.cdp.treasuredata.com/audiences/{parent_segment_id}/personalization

# Test
curl -X POST "https://{region}.cdp.treasuredata.com/audiences/{ps_id}/personalization" \
  -H "Authorization: TD1 {api_key}" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user"}'
```

Region: `us01`, `jp01`, `eu01`

## Naming Convention

Use lowercase with underscores: `product_recommendations`, `cart_recovery`, `user_profile_api`
Be specific: `vip_homepage` not `homepage`

## Troubleshooting

| Issue | Action |
|-------|--------|
| "RT not configured" | Verify RT: `tdx ps rt validate <ps_name>` |
| "Invalid attribute" | Check fields: `tdx ps fields <ps_name> --json` |
| "Service exists" | Use unique name or update existing service |
| "No matching section" | Add ALWAYS fallback section |
