---
name: rt-pz-sections
description: Configure RT personalization sections with criteria, operators, and targeting logic to control who sees which personalized content
---

# RT Personalization Section Criteria

Configure section targeting with conditions and operators to control personalized responses.

## Prerequisites

- Personalization service created (use `rt-pz-service` skill first)
- RT attributes configured and available

## Section Structure

```yaml
sections:
  - name: "premium_users"           # Section identifier
    criteria:                        # Targeting conditions
      operator: "AND"                # Logic operator
      conditions:
        - attribute: "customer_tier"
          operator: "equals"
          value: "premium"
    outputs:                         # What to return
      - attribute: "exclusive_offers"
```

## Operators

### Numeric Operators

```yaml
# Greater than
conditions:
  - attribute: "purchase_count_30d"
    operator: "greater_than"
    value: 10

# Greater than or equal
  - attribute: "total_spend"
    operator: "greater_than_or_equal"
    value: 1000

# Less than
  - attribute: "days_since_purchase"
    operator: "less_than"
    value: 7

# Less than or equal
  - attribute: "cart_value"
    operator: "less_than_or_equal"
    value: 50

# Equals
  - attribute: "purchase_count_7d"
    operator: "equals"
    value: 0

# Not equals
  - attribute: "customer_status"
    operator: "not_equals"
    value: "inactive"
```

### String Operators

```yaml
# Exact match
conditions:
  - attribute: "customer_tier"
    operator: "equals"
    value: "premium"

# Not equals
  - attribute: "customer_tier"
    operator: "not_equals"
    value: "free"

# Contains substring
  - attribute: "last_page_url"
    operator: "contains"
    value: "/products/"

# Starts with
  - attribute: "favorite_category"
    operator: "starts_with"
    value: "electronics"

# Ends with
  - attribute: "email"
    operator: "ends_with"
    value: "@company.com"
```

### List Operators

```yaml
# List contains value
conditions:
  - attribute: "viewed_categories"
    operator: "contains"
    value: "electronics"

# List size
  - attribute: "viewed_products_30d"
    operator: "list_size_greater_than"
    value: 5
```

### Existence Operators

```yaml
# Attribute exists (not null)
conditions:
  - attribute: "email"
    operator: "exists"

# Attribute is null/doesn't exist
  - attribute: "phone_number"
    operator: "not_exists"
```

### Time-based Operators

```yaml
# Within days
conditions:
  - attribute: "last_purchase_date"
    operator: "within_days"
    value: 30

# More than days ago
  - attribute: "last_login_date"
    operator: "more_than_days_ago"
    value: 7
```

## Logic Combinations

### AND - All conditions must match

```yaml
criteria:
  operator: "AND"
  conditions:
    - attribute: "purchase_count_30d"
      operator: "greater_than"
      value: 5
    - attribute: "customer_tier"
      operator: "equals"
      value: "gold"
    - attribute: "total_lifetime_value"
      operator: "greater_than"
      value: 1000
```

### OR - Any condition matches

```yaml
criteria:
  operator: "OR"
  conditions:
    - attribute: "customer_tier"
      operator: "equals"
      value: "platinum"
    - attribute: "purchase_count_30d"
      operator: "greater_than"
      value: 20
    - attribute: "total_lifetime_value"
      operator: "greater_than"
      value: 10000
```

### ALWAYS - No conditions (fallback)

```yaml
criteria:
  operator: "ALWAYS"
```

## Section Examples

### VIP Customers

```yaml
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
      - attribute: "purchase_count_90d"
        operator: "greater_than"
        value: 20
  outputs:
    - attribute: "vip_offers"
    - attribute: "priority_support"
    - attribute: "early_access_products"
```

### Active Shoppers

```yaml
- name: "active_shoppers"
  criteria:
    operator: "AND"
    conditions:
      - attribute: "viewed_products_30d"
        operator: "exists"
      - attribute: "purchase_count_30d"
        operator: "greater_than"
        value: 0
      - attribute: "last_visit_date"
        operator: "within_days"
        value: 7
  outputs:
    - attribute: "personalized_recommendations"
    - attribute: "viewed_products_30d"
```

### Cart Abandoners

```yaml
- name: "cart_abandoners"
  criteria:
    operator: "AND"
    conditions:
      - attribute: "cart_value"
        operator: "greater_than"
        value: 50
      - attribute: "purchase_count_7d"
        operator: "equals"
        value: 0
      - attribute: "cart_updated_date"
        operator: "within_days"
        value: 3
  outputs:
    - attribute: "cart_items"
    - attribute: "cart_value"
    - attribute: "recovery_discount"
```

### New Users

```yaml
- name: "new_users"
  criteria:
    operator: "AND"
    conditions:
      - attribute: "account_age_days"
        operator: "less_than"
        value: 7
      - attribute: "purchase_count_30d"
        operator: "equals"
        value: 0
  outputs:
    - attribute: "welcome_offer"
    - attribute: "onboarding_content"
    - attribute: "getting_started_guide"
```

### Lapsed Customers

```yaml
- name: "lapsed"
  criteria:
    operator: "AND"
    conditions:
      - attribute: "last_purchase_date"
        operator: "more_than_days_ago"
        value: 90
      - attribute: "total_lifetime_value"
        operator: "greater_than"
        value: 100
  outputs:
    - attribute: "winback_offer"
    - attribute: "personalized_message"
```

### Category Enthusiasts

```yaml
- name: "electronics_enthusiasts"
  criteria:
    operator: "AND"
    conditions:
      - attribute: "viewed_categories"
        operator: "contains"
        value: "electronics"
      - attribute: "favorite_category"
        operator: "equals"
        value: "electronics"
      - attribute: "purchase_count_30d"
        operator: "greater_than"
        value: 2
  outputs:
    - attribute: "electronics_deals"
    - attribute: "new_electronics"
```

### First-time Purchasers

```yaml
- name: "first_purchase"
  criteria:
    operator: "AND"
    conditions:
      - attribute: "purchase_count_30d"
        operator: "equals"
        value: 1
      - attribute: "total_lifetime_purchases"
        operator: "equals"
        value: 1
  outputs:
    - attribute: "thank_you_offer"
    - attribute: "loyalty_program_invite"
```

## Section Ordering

Sections are evaluated in order:

```yaml
sections:
  # 1. Most specific first
  - name: "vip_platinum"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "customer_tier"
          operator: "equals"
          value: "platinum"
        - attribute: "purchase_count_30d"
          operator: "greater_than"
          value: 5

  # 2. Less specific
  - name: "vip"
    criteria:
      operator: "AND"
      conditions:
        - attribute: "customer_tier"
          operator: "equals"
          value: "platinum"

  # 3. Fallback (catches all remaining users)
  - name: "default"
    criteria:
      operator: "ALWAYS"
```

**Best practice**: Most specific → least specific → ALWAYS fallback

## Multi-Attribute Conditions

Complex targeting with multiple attributes:

```yaml
- name: "high_intent_shoppers"
  criteria:
    operator: "AND"
    conditions:
      # Recently active
      - attribute: "last_visit_date"
        operator: "within_days"
        value: 3

      # High engagement
      - attribute: "viewed_products_30d"
        operator: "list_size_greater_than"
        value: 10

      # Cart activity
      - attribute: "cart_value"
        operator: "greater_than"
        value: 0

      # Not purchased yet
      - attribute: "purchase_count_7d"
        operator: "equals"
        value: 0

      # High value potential
      - attribute: "total_lifetime_value"
        operator: "greater_than"
        value: 500
  outputs:
    - attribute: "cart_items"
    - attribute: "similar_products"
    - attribute: "limited_time_offer"
```

## Testing Criteria

Test section targeting:

```bash
# Test with specific user
curl -X POST \
  "https://<region>.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization/<service_name>/test" \
  -H "Authorization: TD1 <api_key>" \
  -d '{
    "user_id": "test_user_123"
  }'

# Response shows which section matched
# {
#   "section": "vip",
#   "outputs": {...}
# }
```

## Common Errors

| Error | Solution |
|-------|----------|
| "Invalid operator" | Use supported operators listed above |
| "Unknown attribute" | Verify attribute exists in RT config |
| "Type mismatch" | Match operator to attribute type (numeric vs string) |
| "No matching section" | Add ALWAYS fallback section |
| "Invalid value type" | Use correct type (string, number, boolean) |

## Best Practices

### Criteria Design
- **Start broad**: Begin with simple criteria, refine later
- **Test thoroughly**: Test with various user profiles
- **Meaningful groups**: Create sections that align with business segments
- **Clear names**: Use descriptive section names

### Performance
- **Minimize conditions**: Fewer conditions = faster evaluation
- **Simple operators**: Prefer simple operators when possible
- **Attribute availability**: Use attributes available for most users

### Maintenance
- **Document intent**: Add comments explaining section purpose
- **Review regularly**: Update criteria as business needs change
- **Monitor matches**: Track which sections get matched most

## Nested Criteria (Advanced)

Some implementations support nested AND/OR:

```yaml
criteria:
  operator: "AND"
  conditions:
    - attribute: "customer_tier"
      operator: "equals"
      value: "gold"
    - operator: "OR"
      nested_conditions:
        - attribute: "purchase_count_30d"
          operator: "greater_than"
          value: 5
        - attribute: "total_lifetime_value"
          operator: "greater_than"
          value: 1000
```

## Next Steps

After configuring sections:
- **Test Service**: Test targeting with real users → Use `rt-pz-api` skill
- **API Integration**: Integrate with application → Use `rt-pz-api` skill
- **Monitor**: Track section match rates and performance

## Resources

- [Section Criteria Documentation](https://docs.treasuredata.com/display/public/PD/Personalization+Sections)
- [Operator Reference](https://docs.treasuredata.com/display/public/PD/Criteria+Operators)
