---
name: rt-personalization
description: Creates RT 2.0 personalization services for real-time API responses. Automatically discovers available RT attributes, builds service configurations, and deploys personalization APIs. Use when users need product recommendations, cart recovery, content personalization, or real-time user profiles.
---

# RT 2.0 Personalization - Automated Service Creation

## Workflow

CRITICAL: Always discover RT-enabled parent segments from user's account first. NEVER use example IDs from this skill.

1. **Auto-discover RT-enabled parent segments** (MANDATORY first step):
   ```bash
   tdx ps rt list --json
   ```
   Parse output to get actual parent segment names and IDs from user's account.

2. **Ask strategic questions** (use AskUserQuestion with discovered segments):
   - Which parent segment? (show list of RT-enabled segments discovered in step 1)
   - What's the use case? (product recommendations, cart recovery, content personalization, user profile API)
   - What data to return? (discover and show available attributes from step 3)

3. **Discover available attributes** for chosen parent segment:
   ```bash
   tdx ps fields <parent_segment_name> --json  # Use actual name from step 1
   tdx ps pz list <parent_segment_id> --json   # Check existing services
   ```

4. **Build service YAML** using actual parent_segment_id from step 1 and attributes from step 3

5. **Confirm before push**: Show generated YAML, get approval

6. **Deploy and provide API details**: Push service, show integration code

## Commands

ALWAYS run discovery commands first to get actual parent segment names/IDs from user's account:

```bash
# 1. MANDATORY: Discover RT-enabled parent segments in user's account
tdx ps rt list --json

# 2. Get available attributes for discovered parent segment
tdx ps fields <actual_parent_segment_name> --json

# 3. Check existing services
tdx ps pz list <actual_parent_segment_id> --json

# 4. Deploy service with actual values
tdx ps push service.yaml
```

## YAML Structure

IMPORTANT: Use actual parent_segment_id discovered from `tdx ps rt list`, not example values.

```yaml
parent_segment_id: "<actual_id_from_tdx_ps_rt_list>"  # MUST use discovered ID
service_name: "product_recommendations"
description: "Personalized product recommendations"

input_params:
  - name: "user_id"
    type: "string"
    required: true
  - name: "page_url"      # Optional context
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
      - attribute: "recommended_products"  # Use actual attributes discovered
      - attribute: "exclusive_offers"

  - name: "default"        # Always include ALWAYS fallback
    criteria:
      operator: "ALWAYS"
    outputs:
      - attribute: "popular_products"
```

## Criteria Operators

| Type | Operators | Example |
|------|-----------|---------|
| Numeric | `greater_than`, `greater_equal`, `less_than`, `less_equal`, `equals` | `purchase_count_30d > 5` |
| String | `equals`, `not_equals`, `contains` | `customer_tier = "premium"` |
| Existence | `exists` | `email exists` |
| Time | `within_days` | `last_purchase within 30 days` |

Logic: `AND` (all match), `OR` (any match), `ALWAYS` (fallback)

## Output Types

- **RT attributes**: Real-time counters, lists, last values (from RT config)
- **Batch attributes**: Customer properties from parent segment
- **Static values**: Fixed values using `value:` field

### Product Recommendations

**Service name**: `product_recommendations`
**Sections**: Browsing history exists → personalized, VIP customers → exclusive, default → popular
**Outputs**: `viewed_products_30d`, `last_product_viewed`, `favorite_category`, `recommended_products`

### Cart Recovery

**Service name**: `cart_recovery`
**Sections**: Active cart + no recent purchase → recovery offer, default → popular products
**Outputs**: `cart_items`, `cart_value`, `discount_offer`

### Content Personalization

**Service name**: `content_recommendations`
**Sections**: High engagement (>5 articles) → personalized, default → trending
**Outputs**: `viewed_content_ids`, `favorite_category`, `recommended_content`

### User Profile API

**Service name**: `user_profile`
**Sections**: ALWAYS (return all available user data)
**Outputs**: All RT attributes + key batch attributes (tier, LTV, email)

## API Integration

After service deployment, provide integration details:

```bash
# API endpoint format
POST https://{region}.cdp.treasuredata.com/audiences/{parent_segment_id}/personalization

# Test with curl
curl -X POST "https://{region}.cdp.treasuredata.com/audiences/{parent_segment_id}/personalization" \
  -H "Authorization: TD1 {api_key}" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_123"}'
```

Region: `us01`, `jp01`, `eu01` based on parent segment location

## Troubleshooting

| Issue | Action |
|-------|--------|
| "RT not configured" | Verify RT setup: `tdx ps rt validate <parent_segment>` |
| "Invalid attribute" | Check available fields: `tdx ps fields <parent_segment> --json` |
| "No matching section" | Ensure ALWAYS fallback section exists |
